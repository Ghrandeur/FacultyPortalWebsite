const express = require('express');
const router = express.Router();
const { auth } = require('../config/firebase');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Firebase authentication is handled client-side
    // This route can be used for custom backend authentication
    res.json({ message: 'Login handled by Firebase' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
