const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');
function resolveServiceAccountPath() {
  const configuredPath = process.env.FIREBASE_ADMIN_SDK_PATH;
  const candidates = [];

  if (configuredPath) {
    candidates.push(configuredPath);
    candidates.push(path.resolve(__dirname, configuredPath));
    candidates.push(path.resolve(process.cwd(), configuredPath));
  }

  candidates.push(path.resolve(__dirname, '../config/serviceAccountKey.json'));
  candidates.push(path.resolve(__dirname, './serviceAccountKey.json'));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0] || path.resolve(__dirname, '../config/serviceAccountKey.json');
}

const resolvedPath = resolveServiceAccountPath();

if (!fs.existsSync(resolvedPath)) {
  console.error('Service account key not found at:', resolvedPath);
  process.exit(1);
}

const serviceAccount = require(resolvedPath);
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/set-admin-claim.js <email@example.com>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim set for ${email} (${user.uid})`);
    console.log('It may take a few minutes for Firebase Auth to refresh on the client side.');
  } catch (error) {
    console.error('Failed to set admin claim:', error.message);
    process.exit(1);
  }
})();
