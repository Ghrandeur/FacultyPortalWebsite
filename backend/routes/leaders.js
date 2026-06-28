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
    const newLeader = await db.collection('leaders').add({
      name,
      department,
      position,
      photoUrl,
      createdAt: new Date()
    });
    res.status(201).json({ id: newLeader.id, message: 'Leader added' });
  } catch (error) {
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
    await db.collection('leaders').doc(req.params.id).update(req.body);
    res.json({ message: 'Leader updated' });
  } catch (error) {
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
