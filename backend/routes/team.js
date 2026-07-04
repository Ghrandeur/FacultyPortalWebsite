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
    
    const memberData = {
      name,
      department,
      position,
      createdAt: new Date()
    };
    
    // Only store photoUrl if it has a valid value
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) {
      memberData.photoUrl = photoUrl.trim();
    }
    
    console.log('Creating team member:', memberData);
    const newMember = await db.collection('team').add(memberData);
    res.status(201).json({ id: newMember.id, message: 'Team member added' });
  } catch (error) {
    console.error('Error creating team member:', error);
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
    const updateData = {};
    
    // Only update fields that are explicitly provided and not empty
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.department !== undefined) updateData.department = req.body.department;
    if (req.body.position !== undefined) updateData.position = req.body.position;
    
    // Only update photoUrl if it's provided and has a value
    if (req.body.photoUrl !== undefined && req.body.photoUrl && typeof req.body.photoUrl === 'string' && req.body.photoUrl.trim()) {
      updateData.photoUrl = req.body.photoUrl.trim();
    }
    
    console.log('Updating team member:', { id: req.params.id, updateData });
    await db.collection('team').doc(req.params.id).update(updateData);
    res.json({ message: 'Team member updated' });
  } catch (error) {
    console.error('Error updating team member:', error);
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
