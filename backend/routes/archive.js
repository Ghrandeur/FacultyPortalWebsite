const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all archive events
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('archive').orderBy('date', 'desc').get();
    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('archive').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (requires authentication)
router.post('/', async (req, res) => {
  try {
    const { title, description, image, content } = req.body;
    const newEvent = await db.collection('archive').add({
      title,
      description,
      image,
      content,
      date: new Date(),
      createdAt: new Date()
    });
    res.status(201).json({ id: newEvent.id, message: 'Event created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    await db.collection('archive').doc(req.params.id).update(req.body);
    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('archive').doc(req.params.id).delete();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
