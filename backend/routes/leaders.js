const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all leaders
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('leaders').orderBy('position').get();
    const leaders = [];
    snapshot.forEach(doc => {
      leaders.push({ id: doc.id, ...doc.data() });
    });
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create leader
router.post('/', async (req, res) => {
  try {
    const { name, department, position, photoUrl } = req.body;
    
    const leaderData = {
      name,
      department,
      position,
      createdAt: new Date()
    };
    
    // Only store photoUrl if it has a valid value
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) {
      leaderData.photoUrl = photoUrl.trim();
    }
    
    console.log('Creating leader:', leaderData);
    const newLeader = await db.collection('leaders').add(leaderData);
    res.status(201).json({ id: newLeader.id, message: 'Leader added' });
  } catch (error) {
    console.error('Error creating leader:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single leader
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('leaders').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Leader not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update leader
router.put('/:id', async (req, res) => {
  try {
    const updateData = {};
    
    // Only update fields that are explicitly provided and not empty
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.department !== undefined) updateData.department = req.body.department;
    if (req.body.position !== undefined) updateData.position = req.body.position;
    
    // Only update photoUrl if it's provided and has a value
    if (req.body.photoUrl !== undefined && req.body.photoUrl && typeof req.body.photoUrl === 'string' && req.body.photoUrl.trim()) {
      updateData.photoUrl = req.body.photoUrl.trim();
    }
    
    console.log('Updating leader:', { id: req.params.id, updateData });
    await db.collection('leaders').doc(req.params.id).update(updateData);
    res.json({ message: 'Leader updated' });
  } catch (error) {
    console.error('Error updating leader:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete leader
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('leaders').doc(req.params.id).delete();
    res.json({ message: 'Leader deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
