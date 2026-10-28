const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all archive events
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('archive').get();
    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    events.sort((a, b) => {
      const aDate = a.date && (a.date.toMillis ? a.date.toMillis() : new Date(a.date).getTime());
      const bDate = b.date && (b.date.toMillis ? b.date.toMillis() : new Date(b.date).getTime());
      return (bDate || 0) - (aDate || 0);
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
    const { title, description, image, content, date } = req.body;
    let eventDate = null;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      eventDate = new Date(year, month - 1, day);
    } else if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) eventDate = parsed;
    }
    
    const eventData = {
      title,
      description,
      content,
      createdAt: new Date()
    };
    if (eventDate) eventData.date = eventDate;
    
    // Only store image if it has a valid value
    if (image && typeof image === 'string' && image.trim()) {
      eventData.image = image.trim();
    }
    
    console.log('Creating archive event:', eventData);
    const newEvent = await db.collection('archive').add(eventData);
    res.status(201).json({ id: newEvent.id, message: 'Event created' });
  } catch (error) {
    console.error('Error creating archive event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const updateData = {};
    
    // Only update fields that are explicitly provided and not empty
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    
    // Only update image if it's provided and has a value
    if (req.body.image !== undefined && req.body.image && typeof req.body.image === 'string' && req.body.image.trim()) {
      updateData.image = req.body.image.trim();
    }
    
    if (req.body.date !== undefined) {
      if (!req.body.date) {
        updateData.date = null;
      } else if (typeof req.body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
        const [year, month, day] = req.body.date.split('-').map(Number);
        updateData.date = new Date(year, month - 1, day);
      } else {
        const parsed = new Date(req.body.date);
        updateData.date = isNaN(parsed.getTime()) ? null : parsed;
      }
    }
    
    console.log('Updating archive event:', { id: req.params.id, updateData });
    await db.collection('archive').doc(req.params.id).update(updateData);
    res.json({ message: 'Event updated' });
  } catch (error) {
    console.error('Error updating archive event:', error);
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
