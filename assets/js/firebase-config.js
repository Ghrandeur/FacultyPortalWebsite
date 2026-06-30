import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCDXYoAP2q1OqT3G_j2l7yNSLSPReMFidk',
  authDomain: 'fahssaeditorial.firebaseapp.com',
  databaseURL: 'https://fahssaeditorial-default-rtdb.firebaseio.com',
  projectId: 'fahssaeditorial',
  storageBucket: 'fahssaeditorial.firebasestorage.app',
  messagingSenderId: '321709441811',
  appId: '1:321709441811:web:b807d636c2a623712690e6'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseStorage = storage;

export { app, auth, storage };
