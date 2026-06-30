const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage } = require('../config/firebase');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const uploadDir = path.join(__dirname, '../uploads');
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

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const folderRaw = (req.body && req.body.folder) ? String(req.body.folder) : '';
    const folder = folderRaw.replace(/[^a-zA-Z0-9-_]/g, '');
    const originalName = req.file.originalname || 'upload';
    const ext = path.extname(originalName) || '.bin';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = `${Date.now()}-${baseName}${ext}`;
    const relativePath = folder ? `${folder}/${safeName}` : safeName;

    const s3Bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET;
    const awsRegion = process.env.AWS_REGION || process.env.S3_REGION || process.env.AWS_DEFAULT_REGION;
    const s3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT; // optional for Spaces or custom endpoints

    const firebaseStorageEnabled = !!(storage && storage.bucket);
    const s3Enabled = Boolean(s3Bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    console.log('UPLOAD REQUEST CONFIG:', {
      firebaseStorageEnabled,
      s3Enabled,
      s3Bucket,
      hasAwsAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
      hasAwsSecret: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
      hasS3Endpoint: Boolean(s3Endpoint),
      awsRegion
    });

    if (storage && storage.bucket) {
      try {
        const bucket = storage.bucket();
        const fileName = `uploads/${relativePath}`;
        const remoteFile = bucket.file(fileName);

        await remoteFile.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype || 'application/octet-stream',
            cacheControl: 'public, max-age=31536000'
          }
        });

        // makePublic can fail if bucket isn't configured for public access; ignore error but prefer to continue
        try { await remoteFile.makePublic(); } catch (e) { console.warn('remoteFile.makePublic() failed:', e && e.message); }

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // save local copy as fallback
        const localUploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(localUploadDir)) {
          fs.mkdirSync(localUploadDir, { recursive: true });
        }

        const localFolder = folder ? path.join(localUploadDir, folder) : localUploadDir;
        if (!fs.existsSync(localFolder)) {
          fs.mkdirSync(localFolder, { recursive: true });
        }

        fs.writeFileSync(path.join(localFolder, safeName), req.file.buffer);

        return res.json({ url: publicUrl, storage: 'firebase' });
      } catch (firebaseErr) {
        console.warn('Firebase upload failed, will attempt S3 fallback if configured:', firebaseErr && firebaseErr.message);
        // Save a local copy so the app can continue to use the uploaded file even when cloud storage is unavailable
        try {
          const localUploadDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(localUploadDir)) fs.mkdirSync(localUploadDir, { recursive: true });
          const localFolder = folder ? path.join(localUploadDir, folder) : localUploadDir;
          if (!fs.existsSync(localFolder)) fs.mkdirSync(localFolder, { recursive: true });
          fs.writeFileSync(path.join(localFolder, safeName), req.file.buffer);
          const localUrl = `/uploads/${relativePath}`;
          if (!s3Enabled) {
            return res.json({ url: localUrl, storage: 'local-fallback', warning: 'firebase_failed' });
          }
        } catch (localErr) {
          console.error('Failed to save local fallback copy:', localErr && localErr.message);
        }
      }
    }

    if (!s3Bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return res.status(500).json({ error: 'No valid upload backend configured', details: 'Firebase and S3 are unavailable' });
    }

    // configure S3 client
    const s3ClientConfig = { region: awsRegion || 'us-east-1' };
    if (s3Endpoint) s3ClientConfig.endpoint = s3Endpoint;
    const s3 = new S3Client(s3ClientConfig);

    const s3Key = `uploads/${relativePath}`;
    const putParams = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000'
    };

    // Try to set public read ACL when possible
    if (!s3Endpoint) putParams.ACL = 'public-read';

    await s3.send(new PutObjectCommand(putParams));

    // Construct public URL - to be compatible with AWS and DO Spaces
    let publicUrl;
    if (s3Endpoint) {
      publicUrl = `${s3Endpoint.replace(/\/$/, '')}/${s3Bucket}/${s3Key}`;
    } else if (awsRegion === 'us-east-1' || !awsRegion) {
      publicUrl = `https://${s3Bucket}.s3.amazonaws.com/${s3Key}`;
    } else {
      publicUrl = `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com/${s3Key}`;
    }

    // save local copy
    const localUploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true });
    }

    const localFolder = folder ? path.join(localUploadDir, folder) : localUploadDir;
    if (!fs.existsSync(localFolder)) {
      fs.mkdirSync(localFolder, { recursive: true });
    }

    fs.writeFileSync(path.join(localFolder, safeName), req.file.buffer);

    return res.json({ url: publicUrl, storage: 's3' });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

module.exports = router;
