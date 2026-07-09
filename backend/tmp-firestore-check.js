const { collection, addDoc } = require('firebase/firestore');
const { db } = require('./config/firebase');

(async () => {
  try {
    const ref = await addDoc(collection(db, 'departments'), { name: 'Test', description: 'Test' });
    console.log('ok', ref.id);
  } catch (err) {
    console.error('ERR', err && err.message);
    console.error(err);
  }
})();
