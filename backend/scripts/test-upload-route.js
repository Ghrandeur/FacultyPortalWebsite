const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function waitForServer(port, timeoutMs = 15000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      fetch(`http://127.0.0.1:${port}/health`)
        .then(async (response) => {
          if (response.ok) return resolve();
          throw new Error(`Unexpected health status ${response.status}`);
        })
        .catch(() => {
          if (Date.now() - started > timeoutMs) {
            reject(new Error(`Server did not become ready on port ${port}`));
          } else {
            setTimeout(tryOnce, 250);
          }
        });
    };
    tryOnce();
  });
}

async function main() {
  const port = 5011;
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  server.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForServer(port);

    const form = new FormData();
    form.append('folder', 'leaders');
    form.append('image', new Blob(['test upload payload'], { type: 'text/plain' }), 'test.txt');

    const response = await fetch(`http://127.0.0.1:${port}/api/upload`, {
      method: 'POST',
      body: form
    });

    const data = await response.json();
    console.log('UPLOAD_TEST_RESPONSE', { status: response.status, data });

    if (!response.ok || !data || !data.url) {
      throw new Error('Upload endpoint did not return a usable URL');
    }

    const savedFile = path.join(__dirname, '..', 'uploads', 'leaders', path.basename(data.url));
    if (!fs.existsSync(savedFile)) {
      throw new Error(`Expected local fallback file at ${savedFile}`);
    }

    console.log('UPLOAD_TEST_OK');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error('UPLOAD_TEST_FAILED', error && error.message ? error.message : error);
  process.exit(1);
});
