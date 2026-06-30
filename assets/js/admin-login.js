import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';

// Admin Login JavaScript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMessage');
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Save auth token to localStorage
    const token = await result.user.getIdToken();
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminEmail', email);
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    errorMsg.style.display = 'block';
    errorMsg.textContent = `Login failed: ${error.message}`;
    console.error('Login error:', error);
  }
});

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});
