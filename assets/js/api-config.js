(function (global) {
  const location = global.location || {};
  const inferredOrigin = location.origin || '';
  const hostname = location.hostname || '';
  const defaultBackendUrl = (hostname === 'localhost' || hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : inferredOrigin || '';
  const runtimeBackendUrl = global.__BACKEND_URL__ || global.API_URL || defaultBackendUrl;
  const backendBaseUrl = runtimeBackendUrl.replace(/\/api$/, '');
  const API_URL = runtimeBackendUrl.endsWith('/api')
    ? runtimeBackendUrl
    : `${runtimeBackendUrl.replace(/\/$/, '')}/api`;

  const normalizeMediaUrl = function (url) {
    if (!url) return '';

    if (typeof url === 'object') {
      if (typeof url.url === 'string') return normalizeMediaUrl(url.url);
      if (typeof url.path === 'string') return normalizeMediaUrl(url.path);
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

  global.API_URL = API_URL;
  global.BACKEND_BASE_URL = backendBaseUrl;
  global.normalizeMediaUrl = normalizeMediaUrl;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      API_URL,
      BACKEND_BASE_URL: backendBaseUrl,
      normalizeMediaUrl,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
