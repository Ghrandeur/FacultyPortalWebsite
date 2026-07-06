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

function getPhotoUrls(body = {}) {
  const photoUrls = [];
  const singlePhoto = body.photoUrl || body.url || body.image;

  if (typeof singlePhoto === 'string' && singlePhoto.trim()) {
    photoUrls.push(singlePhoto.trim());
  }

  const additionalPhotoSources = Array.isArray(body.photoUrls)
    ? body.photoUrls
    : (Array.isArray(body.photos) ? body.photos : []);

  additionalPhotoSources.forEach((item) => {
    if (typeof item === 'string' && item.trim()) {
      photoUrls.push(item.trim());
    } else if (item && typeof item === 'object' && typeof item.url === 'string' && item.url.trim()) {
      photoUrls.push(item.url.trim());
    }
  });

  return photoUrls;
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
    const { event, description } = req.body;
    const photoUrls = getPhotoUrls(req.body);

    const createdIds = [];
    const basePhotoData = {
      event,
      description,
      date: new Date()
    };

    if (photoUrls.length > 0) {
      for (const photoUrl of photoUrls) {
        const photoData = { ...basePhotoData };
        photoData.photoUrl = photoUrl;
        const newPhoto = await db.collection('gallery').add(photoData);
        createdIds.push(newPhoto.id);
      }
    } else {
      const newPhoto = await db.collection('gallery').add(basePhotoData);
      createdIds.push(newPhoto.id);
    }

    console.log('Creating gallery photo(s):', { count: createdIds.length, event });
    res.status(201).json({ ids: createdIds, message: createdIds.length > 1 ? 'Photos added' : 'Photo added' });
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
