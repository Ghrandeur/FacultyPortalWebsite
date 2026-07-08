const http = require('http');
const data = JSON.stringify({
  event: 'pentest-check',
  description: 'multi photo test',
  photoUrls: [
    '/uploads/gallery/1783438267742-1782521258606-1001224724.jpg',
    '/uploads/gallery/1783438272005-1782524148544-1778453205735.png'
  ]
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/gallery',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'dummy-token'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});

req.on('error', (err) => {
  console.error('ERROR', err);
});
req.write(data);
req.end();
