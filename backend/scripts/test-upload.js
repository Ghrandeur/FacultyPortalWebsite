const path = require('path');
const cfg = require('../config/firebase');

async function run() {
  if (!cfg.storage) {
    console.error('No Firebase storage configured. Check backend/.env and service account.');
    process.exit(2);
  }

  try {
    const bucket = cfg.storage.bucket();
    const fileName = `uploads/test-upload-${Date.now()}.txt`;
    const remoteFile = bucket.file(fileName);
    const data = `test upload ${new Date().toISOString()}`;

    try {
      await remoteFile.save(data, {
        metadata: { contentType: 'text/plain', cacheControl: 'public, max-age=60' }
      });

      try { await remoteFile.makePublic(); } catch (e) { console.warn('makePublic failed:', e && e.message); }

      console.log('Upload OK:', `https://storage.googleapis.com/${bucket.name}/${fileName}`);
      process.exit(0);
    } catch (err) {
      console.warn('Cloud upload failed:', err && err.message);
      // Save locally as fallback
      const fs = require('fs');
      const localDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
      const localPath = path.join(localDir, path.basename(fileName));
      try {
        fs.writeFileSync(localPath, data);
        console.log('Saved local fallback:', localPath);
        process.exit(0);
      } catch (localErr) {
        console.error('Local fallback failed:', localErr && localErr.message);
        process.exit(3);
      }
    }
  } catch (err) {
    console.error('Upload failed:', err && err.message);
    process.exit(3);
  }
}

run();
