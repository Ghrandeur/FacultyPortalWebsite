const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage } = require('../config/firebase');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { requireNimelssaAdmin } = require('../middleware/nimelssaAuth');

const uploadDir = path.join(__dirname, '../uploads');
const nimelssaUploadWindows = new Map();
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderRaw = (req.body && req.body.folder) ? String(req.body.folder) : '';
    const folder = folderRaw.replace(/[^a-zA-Z0-9-_]/g, '');
    const dest = folder ? path.join(uploadDir, folder) : uploadDir;
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

async function processSingleFile(file, folder, s3Enabled, firebaseStorageEnabled, s3Bucket, awsRegion, s3Endpoint) {
  const originalName = file.originalname || 'upload';
  const ext = path.extname(originalName) || '.bin';
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9.-]/g, '_');
  const safeName = `${Date.now()}-${baseName}${ext}`;
  const relativePath = folder ? `${folder}/${safeName}` : safeName;

  const localUploadDir = path.join(__dirname, '../uploads');
  const localFolder = folder ? path.join(localUploadDir, folder) : localUploadDir;
  const localFilePath = path.join(localFolder, safeName);

  if (!fs.existsSync(localFolder)) fs.mkdirSync(localFolder, { recursive: true });

  let processedBuffer = file.buffer;
  let processedMimeType = file.mimetype || 'application/octet-stream';
  let outputExtension = ext || '.bin';

  try {
    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    if (metadata.format) {
      const converted = await image
        .rotate()
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      processedBuffer = converted;
      processedMimeType = 'image/jpeg';
      outputExtension = '.jpg';
    }
  } catch (imageErr) {
    console.warn('Image conversion failed, using original buffer:', imageErr && imageErr.message);
  }

  const finalName = outputExtension !== ext ? `${path.basename(safeName, ext)}${outputExtension}` : safeName;
  const finalRelativePath = folder ? `${folder}/${finalName}` : finalName;
  const finalLocalFilePath = path.join(localFolder, finalName);
  fs.writeFileSync(finalLocalFilePath, processedBuffer);
  const localUrl = `/uploads/${finalRelativePath}`;

  if (s3Enabled) {
    try {
      const s3ClientConfig = { region: awsRegion || 'us-east-1' };
      if (s3Endpoint) s3ClientConfig.endpoint = s3Endpoint;
      const s3 = new S3Client(s3ClientConfig);

      const s3Key = `uploads/${finalRelativePath}`;
      const putParams = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: processedMimeType,
        CacheControl: 'public, max-age=31536000'
      };

      const s3ACL = process.env.S3_ACL || process.env.AWS_S3_ACL || process.env.AWS_ACL;
      if (s3ACL) putParams.ACL = s3ACL;

      await s3.send(new PutObjectCommand(putParams));

      let publicUrl;
      if (s3Endpoint) {
        publicUrl = `${s3Endpoint.replace(/\/$/, '')}/${s3Bucket}/${s3Key}`;
      } else if (awsRegion === 'us-east-1' || !awsRegion) {
        publicUrl = `https://${s3Bucket}.s3.amazonaws.com/${s3Key}`;
      } else {
        publicUrl = `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com/${s3Key}`;
      }

      return { url: publicUrl, storage: 's3' };
    } catch (s3Err) {
      console.warn('S3 upload failed for file, using local copy:', s3Err && s3Err.message);
      return { url: localUrl, storage: 'local-fallback', warning: 's3_failed' };
    }
  }

  if (firebaseStorageEnabled) {
    try {
      const bucket = storage.bucket();
      const fileName = `uploads/${finalRelativePath}`;
      const remoteFile = bucket.file(fileName);

      await remoteFile.save(processedBuffer, {
        metadata: {
          contentType: processedMimeType,
          cacheControl: 'public, max-age=31536000'
        }
      });

      try { await remoteFile.makePublic(); } catch (e) { console.warn('remoteFile.makePublic() failed:', e && e.message); }

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return { url: publicUrl, storage: 'firebase' };
    } catch (firebaseErr) {
      console.warn('Firebase upload failed for file, using local copy:', firebaseErr && firebaseErr.message);
      return { url: localUrl, storage: 'local-fallback', warning: 'firebase_failed' };
    }
  }

  return { url: localUrl, storage: 'local-fallback', warning: 'remote_storage_unavailable' };
}

router.post('/', upload.array('image'), async (req, res) => {
  try {
    const files = Array.isArray(req.files) && req.files.length ? req.files : (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const folderRaw = (req.body && req.body.folder) ? String(req.body.folder) : '';
    const folder = folderRaw.replace(/[^a-zA-Z0-9-_]/g, '');

    const s3Bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET;
    const awsRegion = process.env.AWS_REGION || process.env.S3_REGION || process.env.AWS_DEFAULT_REGION;
    const s3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT;

    const firebaseStorageEnabled = !!(storage && storage.bucket);
    const s3Enabled = Boolean(s3Bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    console.log('UPLOAD REQUEST CONFIG:', {
      firebaseStorageEnabled,
      s3Enabled,
      s3Bucket,
      hasAwsAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
      hasAwsSecret: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
      hasS3Endpoint: Boolean(s3Endpoint),
      awsRegion,
      fileCount: files.length
    });

    const results = [];
    for (const file of files) {
      const result = await processSingleFile(file, folder, s3Enabled, firebaseStorageEnabled, s3Bucket, awsRegion, s3Endpoint);
      results.push(result);
    }

    if (results.length === 1) {
      return res.json(results[0]);
    }

    return res.json({ urls: results.map(r => r.url), details: results });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

async function handleNimelssaUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  if (!acceptedTypes.has(req.file.mimetype)) {
    return res.status(400).json({ error: 'Use a JPG, PNG, WebP image or PDF document.' });
  }
  if (req.path === '/nimelssa-submission' && req.file.mimetype === 'application/pdf') {
    return res.status(400).json({ error: 'Marketplace listings require an image, not a PDF.' });
  }
  const signatures = {
    'image/jpeg': req.file.buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': req.file.buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': req.file.buffer.toString('ascii', 0, 4) === 'RIFF' && req.file.buffer.toString('ascii', 8, 12) === 'WEBP',
    'application/pdf': req.file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  };
  if (!signatures[req.file.mimetype]) {
    return res.status(400).json({ error: 'The uploaded file does not match its file type.' });
  }

  const s3Bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET;
  const awsRegion = process.env.AWS_REGION || process.env.S3_REGION || process.env.AWS_DEFAULT_REGION;
  const s3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT;
  const firebaseStorageEnabled = !!(storage && storage.bucket);
  const s3Enabled = Boolean(s3Bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  try {
    const result = await processSingleFile(req.file, 'nimelssa', s3Enabled, firebaseStorageEnabled, s3Bucket, awsRegion, s3Endpoint);
    if (result.storage !== 's3' && result.storage !== 'firebase') {
      if (result.url.startsWith('/uploads/nimelssa/')) {
        const localFile = path.join(__dirname, '../uploads/nimelssa', path.basename(result.url));
        try {
          if (fs.existsSync(localFile)) fs.unlinkSync(localFile);
        } catch (cleanupError) {
          console.warn('Unable to remove unshared NIMELSSA upload:', cleanupError && cleanupError.message ? cleanupError.message : cleanupError);
        }
      }
      return res.status(503).json({ error: 'Shared remote storage is unavailable. The file was not published.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('NIMELSSA shared-storage upload failed:', error && error.message ? error.message : error);
    return res.status(500).json({ error: 'Unable to upload the NIMELSSA file to shared storage.' });
  }
}

const nimelssaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }).single('image');
function parseNimelssaUpload(req, res, next) {
  nimelssaUpload(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      error: status === 413 ? 'Choose a file smaller than 8 MB.' : 'Unable to process this upload.'
    });
  });
}
function limitNimelssaSubmissionUploads(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const recent = (nimelssaUploadWindows.get(key) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 12) {
    return res.status(429).json({ error: 'Too many uploads. Please try again later.' });
  }
  recent.push(now);
  nimelssaUploadWindows.set(key, recent);
  if (nimelssaUploadWindows.size > 5000) {
    for (const [ip, times] of nimelssaUploadWindows) {
      if (!times.some((time) => now - time < 60 * 60 * 1000)) nimelssaUploadWindows.delete(ip);
    }
  }
  return next();
}
router.post('/nimelssa', requireNimelssaAdmin, parseNimelssaUpload, handleNimelssaUpload);
router.post('/nimelssa-submission', limitNimelssaSubmissionUploads, parseNimelssaUpload, handleNimelssaUpload);

module.exports = router;
