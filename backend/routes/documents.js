const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all documents
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('documents').orderBy('uploadDate', 'desc').get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents by category
router.get('/category/:category', async (req, res) => {
  try {
    const snapshot = await db.collection('documents')
      .where('category', '==', req.params.category)
      .orderBy('uploadDate', 'desc')
      .get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('documents').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document
router.post('/', async (req, res) => {
  try {
    const { fileName, fileUrl, category, description } = req.body;
    const newDoc = await db.collection('documents').add({
      fileName,
      fileUrl,
      category,
      description,
      uploadDate: new Date()
    });
    res.status(201).json({ id: newDoc.id, message: 'Document uploaded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('documents').doc(req.params.id).delete();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
