// Derive backend URL at runtime. Prefer explicit `window.__BACKEND_URL__`,
// otherwise use same origin so there is no hardcoded remote host.
const inferredOrigin = window.location && window.location.origin ? window.location.origin : '';
const defaultBackendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : inferredOrigin || '';
const runtimeBackendUrl = window.__BACKEND_URL__ || window.API_URL || defaultBackendUrl;
const backendBaseUrl = runtimeBackendUrl.replace(/\/api$/, '');
const API_URL = runtimeBackendUrl.endsWith('/api')
  ? runtimeBackendUrl
  : `${runtimeBackendUrl.replace(/\/$/, '')}/api`;

window.API_URL = API_URL;
window.BACKEND_BASE_URL = backendBaseUrl;

export { API_URL };

window.normalizeMediaUrl = function (url) {
  if (!url) return '';

  if (typeof url === 'object') {
    if (typeof url.url === 'string') return window.normalizeMediaUrl(url.url);
    if (typeof url.path === 'string') return window.normalizeMediaUrl(url.path);
    return '';
  }

  if (typeof url !== 'string') return '';

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';

  let normalized = trimmedUrl
    .replace(/^http:\/\/localhost(?::\d+)?(\/.*)$/i, `${backendBaseUrl}$1`)
    .replace(/^http:\/\/127\.0\.0\.1(?::\d+)?(\/.*)$/i, `${backendBaseUrl}$1`);

  if (/^(https?:)?\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('/uploads')) {
    return `${backendBaseUrl}${normalized}`;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `/${normalized.replace(/^\.?\//, '')}`;
};
