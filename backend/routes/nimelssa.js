const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { requireNimelssaAdmin } = require('../middleware/nimelssaAuth');

const COLLECTIONS = [
  'leaders', 'parliamentarians', 'departments', 'gallery', 'archive', 'documents',
  'past-questions', 'marketplace', 'advisors', 'faq', 'topics', 'replies',
  'socials', 'department-socials', 'newsletter'
];
const OBJECTS = ['faculty', 'settings'];
const CONTENT_PREFIX = 'nimelssa_content_';
const SUBMISSIONS = 'nimelssa_submissions';
const SUBSCRIBERS = 'nimelssa_subscribers';
const ADMINS = 'nimelssa_admins';
const META = db ? db.collection('nimelssa_meta').doc('seed') : null;
const requestWindows = new Map();

function available(res) {
  if (!db || !auth) {
    res.status(503).json({ error: 'NIMELSSA shared backend is not configured.' });
    return false;
  }
  return true;
}

function contentCollection(kind) {
  return db.collection(CONTENT_PREFIX + kind);
}

function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validText(value, max = 15000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function rateLimit(name, limit, windowMs) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${name}`;
    const recent = (requestWindows.get(key) || []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    recent.push(now);
    requestWindows.set(key, recent);
    if (requestWindows.size > 5000) {
      for (const [entry, times] of requestWindows) {
        if (!times.some((time) => now - time < windowMs)) requestWindows.delete(entry);
      }
    }
    return next();
  };
}

function publicRecord(kind, record) {
  if (kind !== 'topics' && kind !== 'replies') return record;
  const { email, privateName, ...visible } = record;
  return visible;
}

async function readContent() {
  const result = {};
  await Promise.all(COLLECTIONS.map(async (kind) => {
    const snapshot = await contentCollection(kind).get();
    result[kind] = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  }));
  await Promise.all(OBJECTS.map(async (kind) => {
    const doc = await contentCollection(kind).doc('singleton').get();
    result[kind] = doc.exists ? doc.data() : {};
  }));
  return result;
}

async function createUploadRecord(kind, body) {
  if (!COLLECTIONS.includes(kind) || !body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid content type or record.');
  }
  const id = typeof body.id === 'string' && body.id && !body.id.includes('/') ? body.id : crypto.randomUUID();
  const record = Object.fromEntries(Object.entries(body).filter(([key, value]) =>
    !key.startsWith('_') && key !== 'upload' && value !== undefined
  ));
  record.id = id;
  await contentCollection(kind).doc(id).set(record);
}

async function addSubmission(kind, body) {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const record = { ...body, id, createdAt };
  await db.collection(SUBMISSIONS).doc(id).set({ kind, body: record, status: 'pending', createdAt });
  return id;
}

router.get('/content', async (req, res) => {
  if (!available(res)) return;
  try {
    const [content, seedState] = await Promise.all([readContent(), META.get()]);
    const initialized = seedState.exists && seedState.data().initialized === true;
    for (const kind of COLLECTIONS) {
      content[kind] = content[kind].map((record) => publicRecord(kind, record));
    }
    return res.json({ ...content, _initialized: initialized });
  } catch (error) {
    console.error('NIMELSSA content read failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to load NIMELSSA content.' });
  }
});

router.get('/session', async (req, res) => {
  if (!available(res)) return;
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return res.json({ authenticated: false });

  try {
    const user = await auth.verifyIdToken(token, true);
    return res.json({
      authenticated: user.nimelssaAdmin === true,
      email: user.nimelssaAdmin === true ? user.email || null : null,
      configured: true
    });
  } catch (error) {
    if (error.code === 'auth/id-token-revoked' || error.code === 'auth/id-token-expired' ||
        error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.json({ authenticated: false, configured: true });
    }
    console.error('NIMELSSA session verification failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to verify the sign-in session.' });
  }
});

router.get('/admin/content', requireNimelssaAdmin, async (req, res) => {
  if (!available(res)) return;
  try {
    const [content, submissionsSnapshot, subscribersSnapshot, adminsSnapshot, seedState] = await Promise.all([
      readContent(),
      db.collection(SUBMISSIONS).orderBy('createdAt', 'desc').get(),
      db.collection(SUBSCRIBERS).orderBy('createdAt', 'desc').get(),
      db.collection(ADMINS).orderBy('email').get(),
      META.get()
    ]);
    const submissions = submissionsSnapshot.docs.map((doc) => {
      const value = doc.data();
      return { id: doc.id, kind: value.kind, body: value.body, status: value.status, created: value.createdAt };
    });
    const subscribers = subscribersSnapshot.docs.map((doc) => doc.data());
    const team = adminsSnapshot.docs.map((doc) => ({ email: doc.data().email }));
    return res.json({
      content,
      submissions,
      subscribers,
      team,
      initialized: seedState.exists && seedState.data().initialized === true
    });
  } catch (error) {
    console.error('NIMELSSA admin content read failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to load the NIMELSSA administration workspace.' });
  }
});

router.post('/admin/initialize', requireNimelssaAdmin, async (req, res) => {
  if (!available(res)) return;
  const seed = req.body && req.body.seed;
  if (!seed || typeof seed !== 'object' || Array.isArray(seed)) {
    return res.status(400).json({ error: 'A valid NIMELSSA starter content object is required.' });
  }

  try {
    const initialized = await db.runTransaction(async (transaction) => {
      const marker = await transaction.get(META);
      if (marker.exists && marker.data().initialized === true) return false;

      const writes = [];
      for (const kind of COLLECTIONS) {
        const rows = Array.isArray(seed[kind]) ? seed[kind] : [];
        const collection = contentCollection(kind);
        const existing = await transaction.get(collection);
        const existingIds = new Set(existing.docs.map((doc) => doc.id));
        for (const row of rows) {
          if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
          const id = typeof row.id === 'string' && row.id && !row.id.includes('/') ? row.id : crypto.randomUUID();
          if (!existingIds.has(id)) writes.push({ ref: collection.doc(id), value: { ...row, id } });
        }
      }
      for (const kind of OBJECTS) {
        const ref = contentCollection(kind).doc('singleton');
        const existing = await transaction.get(ref);
        const value = seed[kind];
        if (!existing.exists && value && typeof value === 'object' && !Array.isArray(value)) {
          writes.push({ ref, value });
        }
      }

      if (writes.length > 450) {
        throw new Error('The starter content exceeds the safe Firestore initialization limit.');
      }
      for (const item of writes) transaction.set(item.ref, item.value);
      transaction.set(META, { initialized: true, initializedAt: Date.now(), initializedBy: req.nimelssaUser.uid });
      return true;
    });
    return res.json({ success: true, initialized });
  } catch (error) {
    console.error('NIMELSSA content initialization failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: error.message || 'Unable to initialize NIMELSSA content.' });
  }
});

router.post('/newsletter', rateLimit('newsletter', 10, 60 * 60 * 1000), async (req, res) => {
  if (!available(res)) return;
  const { registration, department, email, consent } = req.body || {};
  if (!validText(registration, 300) || !validText(department, 300) || !validEmail(email)) {
    return res.status(400).json({ error: 'Enter your registration number, department and a valid email address.' });
  }
  if (consent !== true) return res.status(400).json({ error: 'Consent is required to subscribe.' });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const record = {
      email: normalizedEmail,
      registration: registration.trim(),
      department: department.trim(),
      consent: true,
      createdAt: new Date().toISOString()
    };
    await db.collection(SUBSCRIBERS).doc(encodeURIComponent(normalizedEmail)).set(record);
    return res.status(201).json({ success: true, message: 'Your subscription has been saved.' });
  } catch (error) {
    console.error('NIMELSSA newsletter subscription failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to save your newsletter subscription.' });
  }
});

router.post('/marketplace', rateLimit('submission', 12, 60 * 60 * 1000), async (req, res) => {
  if (!available(res)) return;
  const body = req.body || {};
  const price = Number(body.price);
  if (!validText(body.name, 300) || !validText(body.category, 300) ||
      !validText(body.description) || !validText(body.contactPhone, 100) ||
      !Number.isFinite(price) || price < 0 || price > 1e12) {
    return res.status(400).json({ error: 'Enter a valid item name, category, price, description and contact number.' });
  }
  try {
    const id = await addSubmission('marketplace', {
      name: body.name.trim(),
      category: body.category.trim(),
      price,
      description: body.description.trim(),
      contactPhone: body.contactPhone.trim(),
      contactWhatsApp: typeof body.contactWhatsApp === 'string' ? body.contactWhatsApp.trim() : '',
      image: typeof body.image === 'string' ? body.image : ''
    });
    return res.status(201).json({ success: true, id, message: 'Submitted for review. It will appear after an administrator approves it.' });
  } catch (error) {
    console.error('NIMELSSA marketplace submission failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to submit this listing.' });
  }
});

router.post('/questions', rateLimit('submission', 12, 60 * 60 * 1000), async (req, res) => {
  if (!available(res)) return;
  const body = req.body || {};
  if (!validText(body.name, 300) || !validEmail(body.email) || !validText(body.category, 300) ||
      !validText(body.title, 300) || !validText(body.content)) {
    return res.status(400).json({ error: 'Enter your name, a valid email, a category, a title and your question.' });
  }
  try {
    const id = await addSubmission('topics', {
      name: body.anonymous === true ? 'Anonymous student' : body.name.trim(),
      privateName: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      anonymous: body.anonymous === true,
      category: body.category.trim(),
      title: body.title.trim(),
      content: body.content.trim()
    });
    return res.status(201).json({ success: true, id, message: 'Submitted for review. It will appear after an administrator approves it.' });
  } catch (error) {
    console.error('NIMELSSA question submission failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to submit your question.' });
  }
});

router.post('/replies', rateLimit('submission', 12, 60 * 60 * 1000), async (req, res) => {
  if (!available(res)) return;
  const body = req.body || {};
  if (!validText(body.name, 300) || !validEmail(body.email) || !validText(body.content) ||
      typeof body.topicId !== 'string' || !body.topicId || body.topicId.includes('/')) {
    return res.status(400).json({ error: 'Enter your name, a valid email and a reply for the selected topic.' });
  }
  try {
    const topic = await contentCollection('topics').doc(body.topicId).get();
    if (!topic.exists) return res.status(404).json({ error: 'The selected topic is no longer available.' });
    const id = await addSubmission('replies', {
      name: body.anonymous === true ? 'Anonymous student' : body.name.trim(),
      privateName: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      anonymous: body.anonymous === true,
      content: body.content.trim(),
      topicId: body.topicId
    });
    return res.status(201).json({ success: true, id, message: 'Submitted for review. It will appear after an administrator approves it.' });
  } catch (error) {
    console.error('NIMELSSA reply submission failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to submit your reply.' });
  }
});

router.post('/admin/save', requireNimelssaAdmin, async (req, res) => {
  if (!available(res)) return;
  const { kind, record } = req.body || {};
  try {
    if (OBJECTS.includes(kind)) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return res.status(400).json({ error: 'Invalid content record.' });
      }
      const cleanRecord = Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith('_') && key !== 'upload'));
      await contentCollection(kind).doc('singleton').set(cleanRecord);
    } else {
      await createUploadRecord(kind, record);
    }
    return res.json({ success: true });
  } catch (error) {
    if (error.message === 'Invalid content type or record.') return res.status(400).json({ error: error.message });
    console.error('NIMELSSA content save failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to save NIMELSSA content.' });
  }
});

router.post('/admin/delete', requireNimelssaAdmin, async (req, res) => {
  if (!available(res)) return;
  const { kind, id } = req.body || {};
  if (!COLLECTIONS.includes(kind) || typeof id !== 'string' || !id || id.includes('/')) {
    return res.status(400).json({ error: 'Invalid content type or record ID.' });
  }
  try {
    await contentCollection(kind).doc(id).delete();
    return res.json({ success: true });
  } catch (error) {
    console.error('NIMELSSA content deletion failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to delete this NIMELSSA record.' });
  }
});

router.post('/admin/moderate', requireNimelssaAdmin, async (req, res) => {
  if (!available(res)) return;
  const { id, action } = req.body || {};
  if (typeof id !== 'string' || !id || id.includes('/') || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid moderation request.' });
  }
  try {
    const ref = db.collection(SUBMISSIONS).doc(id);
    await db.runTransaction(async (transaction) => {
      const submission = await transaction.get(ref);
      if (!submission.exists || submission.data().status !== 'pending') {
        throw new Error('This submission is no longer awaiting review.');
      }
      const data = submission.data();
      if (action === 'approve') {
        if (!COLLECTIONS.includes(data.kind) || !data.body || typeof data.body !== 'object') {
          throw new Error('The submission has an invalid content type.');
        }
        const recordId = typeof data.body.id === 'string' && !data.body.id.includes('/') ? data.body.id : id;
        transaction.set(contentCollection(data.kind).doc(recordId), { ...data.body, id: recordId });
      }
      transaction.update(ref, { status: action === 'approve' ? 'approved' : 'rejected', reviewedAt: Date.now() });
    });
    return res.json({ success: true });
  } catch (error) {
    if (error.message === 'This submission is no longer awaiting review.' || error.message === 'The submission has an invalid content type.') {
      return res.status(409).json({ error: error.message });
    }
    console.error('NIMELSSA moderation failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to update this submission.' });
  }
});

router.post('/admin/team', requireNimelssaAdmin, async (req, res) => {
  if (!available(res)) return;
  const { email, password, action } = req.body || {};
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid administrator email.' });
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (action === 'delete') {
      if (normalizedEmail === String(req.nimelssaUser.email || '').toLowerCase()) {
        return res.status(400).json({ error: 'You cannot remove your own administrator access.' });
      }
      const team = await db.collection(ADMINS).get();
      if (team.size < 2) return res.status(400).json({ error: 'At least one NIMELSSA administrator must remain.' });
      const user = await auth.getUserByEmail(normalizedEmail);
      const claims = { ...user.customClaims, nimelssaAdmin: false };
      await auth.setCustomUserClaims(user.uid, claims);
      await auth.revokeRefreshTokens(user.uid);
      await db.collection(ADMINS).doc(user.uid).delete();
      return res.json({ success: true });
    }

    let user;
    try {
      user = await auth.getUserByEmail(normalizedEmail);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
      if (!validText(password, 1024) || password.length < 12) {
        return res.status(400).json({ error: 'Use a password of at least 12 characters for a new Firebase account.' });
      }
      user = await auth.createUser({ email: normalizedEmail, password });
    }
    await auth.setCustomUserClaims(user.uid, { ...user.customClaims, nimelssaAdmin: true });
    await db.collection(ADMINS).doc(user.uid).set({ uid: user.uid, email: normalizedEmail });
    return res.status(201).json({ success: true });
  } catch (error) {
    if (error.code === 'auth/invalid-password' || error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'The administrator account details are invalid.' });
    }
    console.error('NIMELSSA administrator management failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to update the NIMELSSA administrator team.' });
  }
});

module.exports = router;
