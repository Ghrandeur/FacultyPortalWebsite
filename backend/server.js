const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Upload fallback: if a leader URL points to /uploads/leaders/... but the file is stored in the root uploads directory,
// serve the root file when the requested subfolder file does not exist.
app.use('/uploads', (req, res, next) => {
  const requestedFile = path.join(__dirname, 'uploads', req.path);
  const fallbackFile = path.join(__dirname, 'uploads', path.basename(req.path));

  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }

  if (fs.existsSync(fallbackFile) && fs.statSync(fallbackFile).isFile()) {
    return res.sendFile(fallbackFile);
  }

  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/archive', require('./routes/archive'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/leaders', require('./routes/leaders'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/team', require('./routes/team'));
app.use('/api/past-questions', require('./routes/pastQuestions'));
app.use('/api/auth', require('./routes/auth'));

// Serve main index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});
