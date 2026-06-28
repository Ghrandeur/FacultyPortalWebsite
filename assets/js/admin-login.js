// Admin Login JavaScript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMessage');
  
  if (!window.firebaseAuth || typeof window.firebaseAuth.signInWithEmailAndPassword !== 'function') {
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'Login failed: Firebase authentication is not ready yet. Please refresh the page and try again.';
    return;
  }

  try {
    const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
    
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
if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChanged === 'function') {
  window.firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      // User is logged in, redirect to dashboard
      window.location.href = 'dashboard.html';
    }
  });
}
