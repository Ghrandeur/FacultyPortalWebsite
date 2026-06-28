// Configure your backend URL for local development or Vercel deployment.
// For Vercel, set the global window.__BACKEND_URL__ before this script runs,
// or replace the fallback below with your deployed backend URL.
const runtimeBackendUrl = window.__BACKEND_URL__ || window.API_URL || 'https://facultyportalwebsite-3.onrender.com';
window.API_URL = runtimeBackendUrl.endsWith('/api') ? runtimeBackendUrl : `${runtimeBackendUrl}/api`;
