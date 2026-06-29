const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const { storage } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// Trusted proxy for correct protocol/host behind Render or other proxies
app.set('trust proxy', true);

const firebaseServiceAccountConfigured = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_ADMIN_SDK_PATH
);
console.log('UPLOAD CONFIG:', {
  s3Bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET,
  hasAwsAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
  hasAwsSecret: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
  hasS3Endpoint: Boolean(process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT),
  awsRegion: process.env.AWS_REGION || process.env.S3_REGION || process.env.AWS_DEFAULT_REGION,
  firebaseServiceAccount: firebaseServiceAccountConfigured,
  firebaseProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_BUCKET
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function normalizeLocalUrls(value, protocol, host) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeLocalUrls(item, protocol, host));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeLocalUrls(entry, protocol, host)])
    );
  }
  if (typeof value === 'string') {
    return value.replace(/^http:\/\/localhost:5000(\/.*)$/i, `${protocol}://${host}$1`);
  }
  return value;
}

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    const host = req.get('x-forwarded-host') || req.get('host') || 'facultyportalwebsite-3.onrender.com';
    const protocol = req.protocol || 'https';
    const normalizedBody = normalizeLocalUrls(body, protocol, host);
    return originalJson.call(this, normalizedBody);
  };
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Upload fallback: serve local files if available, then fall back to Firebase Storage if the local upload path is missing.
app.use('/uploads', async (req, res, next) => {
  const requestPath = (req.path || '').replace(/^[/\\]+/, '');
  const requestedFile = path.join(__dirname, 'uploads', requestPath);
  const fallbackFile = path.join(__dirname, 'uploads', path.basename(requestPath));

  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }

  if (fs.existsSync(fallbackFile) && fs.statSync(fallbackFile).isFile()) {
    return res.sendFile(fallbackFile);
  }

  if (storage && storage.bucket) {
    try {
      const bucket = storage.bucket();
      const fileName = `uploads/${requestPath}`;
      const remoteFile = bucket.file(fileName);
      const [exists] = await remoteFile.exists();

      if (exists) {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        return res.redirect(publicUrl);
      }
    } catch (error) {
      console.warn('Firebase storage fallback error:', error && error.message ? error.message : error);
    }
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
