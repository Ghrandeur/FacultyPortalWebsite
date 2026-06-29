const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

function loadServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson);
  }

  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || './serviceAccountKey.json';
  const resolvedServiceAccountPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, serviceAccountPath);

  if (fs.existsSync(resolvedServiceAccountPath)) {
    return require(resolvedServiceAccountPath);
  }

  return null;
}

const serviceAccount = loadServiceAccount();
const projectId = process.env.FIREBASE_PROJECT_ID || (serviceAccount && serviceAccount.project_id);
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_BUCKET || (projectId ? `${projectId}.appspot.com` : null);
const databaseURL = process.env.FIREBASE_DATABASE_URL || (projectId ? `https://${projectId}.firebaseio.com` : null);

if (!serviceAccount) {
  console.log('Firebase service account not configured; Firebase features will be disabled.');
} else {
  console.log('Firebase service account loaded from:', path.resolve(__dirname, process.env.FIREBASE_ADMIN_SDK_PATH || './serviceAccountKey.json'));
}

let db = null;
let auth = null;
let storage = null;

if (serviceAccount && projectId && storageBucket && databaseURL) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL,
    storageBucket
  });

  // Debug info to help diagnose env misconfiguration in deploys
  try {
    console.log('FIREBASE INIT:', {
      FIREBASE_PROJECT_ID: projectId,
      FIREBASE_STORAGE_BUCKET: storageBucket,
      SERVICE_ACCOUNT_EMAIL: serviceAccount.client_email || '<missing>'
    });
  } catch (err) {
    console.warn('Failed to log firebase init details', err && err.message);
  }

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
} else {
  console.log('Firebase not initialized because service account or project config is missing.');
}

module.exports = { db, auth, admin, storage };
