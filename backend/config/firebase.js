const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

function loadServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson);
  }

  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || '../serviceAccountKey.json';
  const resolvedServiceAccountPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, serviceAccountPath);

  if (fs.existsSync(resolvedServiceAccountPath)) {
    return require(resolvedServiceAccountPath);
  }

  throw new Error(`Firebase service account file not found at ${resolvedServiceAccountPath}`);
}

const serviceAccount = loadServiceAccount();
const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
  storageBucket
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { db, auth, admin, storage };
