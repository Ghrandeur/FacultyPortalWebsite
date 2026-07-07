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
  fs.writeFileSync(localFilePath, file.buffer);
  const localUrl = `/uploads/${relativePath}`;

  if (s3Enabled) {
    try {
      const s3ClientConfig = { region: awsRegion || 'us-east-1' };
      if (s3Endpoint) s3ClientConfig.endpoint = s3Endpoint;
      const s3 = new S3Client(s3ClientConfig);

      const s3Key = `uploads/${relativePath}`;
      const putParams = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
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
      const fileName = `uploads/${relativePath}`;
      const remoteFile = bucket.file(fileName);

      await remoteFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype || 'application/octet-stream',
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

router.post('/', upload.any(), async (req, res) => {
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

module.exports = router;
