const { auth, db } = require('../config/firebase');

const email = process.argv[2] && process.argv[2].trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/set-nimelssa-admin.js <email@example.com>');
  process.exit(1);
}
if (!auth || !db) {
  console.error('Firebase Admin SDK is not configured. Check backend/.env first.');
  process.exit(1);
}

(async () => {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { ...user.customClaims, nimelssaAdmin: true });
    await db.collection('nimelssa_admins').doc(user.uid).set({ uid: user.uid, email });
    console.log(`NIMELSSA administrator access granted to ${email}.`);
    console.log('The user should sign out and sign in again to refresh their Firebase ID token.');
  } catch (error) {
    console.error('Unable to grant NIMELSSA administrator access:', error.message);
    process.exit(1);
  }
})();
