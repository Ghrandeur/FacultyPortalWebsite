const http = require('http');
const data = JSON.stringify({regNo:'ENG/2026/001', department:'Computer Science', email:'student@example.com'});
const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/newsletter/subscribe',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});
req.on('error', (err) => {
  console.error('ERROR', err.message);
});
req.write(data);
req.end();
