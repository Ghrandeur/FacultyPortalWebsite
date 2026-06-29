const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { storage } = require('../config/firebase');

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

    const bucket = storage.bucket();
    const fileName = `uploads/${relativePath}`;
    const remoteFile = bucket.file(fileName);

    await remoteFile.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype || 'application/octet-stream',
        cacheControl: 'public, max-age=31536000'
      }
    });

    await remoteFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

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
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

module.exports = router;
