// Configure your backend URL for local development or production deployment.
// In production, this app uses the deployed backend URL below.
const deployedBackendUrl = 'https://facultyportalwebsite-3.onrender.com';
const defaultBackendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : deployedBackendUrl;
const runtimeBackendUrl = window.__BACKEND_URL__ || window.API_URL || defaultBackendUrl;
window.API_URL = runtimeBackendUrl.endsWith('/api') ? runtimeBackendUrl : `${runtimeBackendUrl.replace(/\/$/, '')}/api`;

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
