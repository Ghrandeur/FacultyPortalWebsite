const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
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

const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const folderRaw = (req.body && req.body.folder) ? String(req.body.folder) : '';
  const folder = folderRaw.replace(/[^a-zA-Z0-9-_]/g, '');
  const relativePath = folder ? `${folder}/${req.file.filename}` : req.file.filename;
  const host = req.get('x-forwarded-host') || req.get('host');
  const protocol = req.protocol;
  const publicUrl = `${protocol}://${host}/uploads/${relativePath}`;

  res.json({ url: publicUrl });
});

module.exports = router;
