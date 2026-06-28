// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcXEf9zoNaWdJ7A3D1qknYTnZsCN3wsqc",
  authDomain: "fahssa-editorial.firebaseapp.com",
  projectId: "fahssa-editorial",
  storageBucket: "fahssa-editorial.firebasestorage.app",
  messagingSenderId: "70368869895",
  appId: "1:70368869895:web:06f11851f774badf86f4a2"
};

// Initialize Firebase (if not already initialized)
if (firebase && firebase.apps && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase && firebase.auth ? firebase.auth() : null;
let storage = null;
if (firebase && typeof firebase.storage === 'function') {
  storage = firebase.storage();
} else if (firebase && firebase.storage) {
  storage = firebase.storage;
}

// Export for use in admin pages
window.firebaseAuth = auth;
window.firebaseStorage = storage;
window.firebaseApp = firebase;
