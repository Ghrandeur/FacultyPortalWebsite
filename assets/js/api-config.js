// Configure your backend URL for local development or Vercel deployment.
// For Vercel, set the global window.__BACKEND_URL__ before this script runs,
// or replace the fallback below with your deployed backend URL.
const runtimeBackendUrl = window.__BACKEND_URL__ || window.API_URL || 'https://facultyportalwebsite-3.onrender.com';
window.API_URL = runtimeBackendUrl.endsWith('/api') ? runtimeBackendUrl : `${runtimeBackendUrl}/api`;

window.normalizeMediaUrl = function (url) {
  if (!url || typeof url !== 'string') return '';

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';

  const normalized = trimmedUrl
    .replace(/^http:\/\/localhost(?::\d+)?(\/.*)$/i, 'https://facultyportalwebsite-3.onrender.com$1')
    .replace(/^http:\/\/127\.0\.0\.1(?::\d+)?(\/.*)$/i, 'https://facultyportalwebsite-3.onrender.com$1');

  if (/^(https?:)?\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `/${normalized.replace(/^\.?\//, '')}`;
};
