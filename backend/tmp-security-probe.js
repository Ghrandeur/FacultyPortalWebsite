const http = require('http');
const paths = ['/health', '/backend/.env', '/backend/config/serviceAccountKey.json', '/api/gallery', '/api/upload'];
let idx = 0;
function reqNext() {
  if (idx >= paths.length) return;
  const path = paths[idx++];
  const opts = { hostname: 'localhost', port: 5000, path, method: 'GET' };
  const req = http.request(opts, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('PATH', path, 'STATUS', res.statusCode, 'LENGTH', body.length);
      if (body.length > 0 && body.length < 2000) console.log(body);
      reqNext();
    });
  });
  req.on('error', (err) => {
    console.log('PATH', path, 'ERROR', err.message);
    reqNext();
  });
  req.end();
}
reqNext();
