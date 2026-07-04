const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

function normalizeGalleryDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    photoUrl: data.photoUrl || data.url || data.image || ''
  };
}

// Get all gallery photos
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('gallery').orderBy('date', 'desc').get();
    const photos = [];
    snapshot.forEach(doc => {
      photos.push(normalizeGalleryDoc(doc));
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
      photos.push(normalizeGalleryDoc(doc));
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
    res.json(normalizeGalleryDoc(doc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create photo
router.post('/', async (req, res) => {
  try {
    const { photoUrl, event, description, url, image } = req.body;
    const finalPhotoUrl = photoUrl || url || image || '';
    
    const photoData = {
      event,
      description,
      date: new Date()
    };
    
    // Only store photoUrl if it has a valid value
    if (finalPhotoUrl && typeof finalPhotoUrl === 'string' && finalPhotoUrl.trim()) {
      photoData.photoUrl = finalPhotoUrl.trim();
    }
    
    console.log('Creating gallery photo:', photoData);
    const newPhoto = await db.collection('gallery').add(photoData);
    res.status(201).json({ id: newPhoto.id, message: 'Photo added' });
  } catch (error) {
    console.error('Error creating gallery photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update photo
router.put('/:id', async (req, res) => {
  try {
    const { photoUrl, url, image, event, description } = req.body;
    const updateData = {};
    
    if (event !== undefined) updateData.event = event;
    if (description !== undefined) updateData.description = description;
    
    // Only update photoUrl if provided and has a value
    const finalPhotoUrl = photoUrl || url || image;
    if (finalPhotoUrl && typeof finalPhotoUrl === 'string' && finalPhotoUrl.trim()) {
      updateData.photoUrl = finalPhotoUrl.trim();
    }
    
    console.log('Updating gallery photo:', { id: req.params.id, updateData });
    await db.collection('gallery').doc(req.params.id).update(updateData);
    res.json({ message: 'Photo updated' });
  } catch (error) {
    console.error('Error updating gallery photo:', error);
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
