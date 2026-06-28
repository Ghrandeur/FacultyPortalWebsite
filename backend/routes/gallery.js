const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all gallery photos
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('gallery').orderBy('date', 'desc').get();
    const photos = [];
    snapshot.forEach(doc => {
      photos.push({ id: doc.id, ...doc.data() });
    });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get photos by event
router.get('/event/:event', async (req, res) => {
  try {
    const snapshot = await db.collection('gallery')
      .where('event', '==', req.params.event)
      .orderBy('date', 'desc')
      .get();
    const photos = [];
    snapshot.forEach(doc => {
      photos.push({ id: doc.id, ...doc.data() });
    });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single photo
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('gallery').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create photo
router.post('/', async (req, res) => {
  try {
    const { photoUrl, event, description } = req.body;
    const newPhoto = await db.collection('gallery').add({
      photoUrl,
      event,
      description,
      date: new Date()
    });
    res.status(201).json({ id: newPhoto.id, message: 'Photo added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update photo
router.put('/:id', async (req, res) => {
  try {
    await db.collection('gallery').doc(req.params.id).update(req.body);
    res.json({ message: 'Photo updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete photo
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('gallery').doc(req.params.id).delete();
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
