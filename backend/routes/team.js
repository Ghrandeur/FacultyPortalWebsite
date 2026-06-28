const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all team members
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('team').orderBy('name').get();
    const members = [];
    snapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create team member
router.post('/', async (req, res) => {
  try {
    const { name, department, position, photoUrl } = req.body;
    const newMember = await db.collection('team').add({
      name,
      department,
      position,
      photoUrl,
      createdAt: new Date()
    });
    res.status(201).json({ id: newMember.id, message: 'Team member added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single team member
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('team').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update team member
router.put('/:id', async (req, res) => {
  try {
    await db.collection('team').doc(req.params.id).update(req.body);
    res.json({ message: 'Team member updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete team member
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('team').doc(req.params.id).delete();
    res.json({ message: 'Team member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
