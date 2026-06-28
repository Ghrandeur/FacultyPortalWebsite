const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all past questions/resources
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('pastQuestions').orderBy('uploadDate', 'desc').get();
    const resources = [];
    snapshot.forEach(doc => {
      resources.push({ id: doc.id, ...doc.data() });
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get by subject
router.get('/subject/:subject', async (req, res) => {
  try {
    const snapshot = await db.collection('pastQuestions')
      .where('subject', '==', req.params.subject)
      .orderBy('uploadDate', 'desc')
      .get();
    const resources = [];
    snapshot.forEach(doc => {
      resources.push({ id: doc.id, ...doc.data() });
    });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single resource
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('pastQuestions').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload resource
router.post('/', async (req, res) => {
  try {
    const { fileName, fileUrl, subject, semester, description } = req.body;
    const newResource = await db.collection('pastQuestions').add({
      fileName,
      fileUrl,
      subject,
      semester,
      description,
      uploadDate: new Date()
    });
    res.status(201).json({ id: newResource.id, message: 'Resource uploaded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resource
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('pastQuestions').doc(req.params.id).delete();
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
