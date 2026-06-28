const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get faculty info
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('faculty').limit(1).get();
    if (snapshot.empty) {
      return res.json({ content: '' });
    }
    res.json(snapshot.docs[0].data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update faculty info
router.put('/', async (req, res) => {
  try {
    const { content, history, mission, vision } = req.body;
    const snapshot = await db.collection('faculty').limit(1).get();
    
    if (snapshot.empty) {
      await db.collection('faculty').add({
        content,
        history,
        mission,
        vision,
        updatedAt: new Date()
      });
    } else {
      await db.collection('faculty').doc(snapshot.docs[0].id).update({
        content,
        history,
        mission,
        vision,
        updatedAt: new Date()
      });
    }
    res.json({ message: 'Faculty info updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
