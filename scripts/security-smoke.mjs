import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const port = 31097;
const origin = 'http://127.0.0.1:' + port;
const backend = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    GEMINI_API_KEY: 'CI-ONLY-INVALID-KEY',
    CANDY_UPLOAD_BUCKET: '',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
backend.stdout.on('data', chunk => { logs += String(chunk).slice(0, 1800); });
backend.stderr.on('data', chunk => { logs += String(chunk).slice(0, 1800); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (backend.exitCode !== null) throw new Error('Backend exited unexpectedly: ' + logs);
    try {
      const response = await fetch(origin + '/', { signal: AbortSignal.timeout(500) });
      if (response.ok) { ready = true; break; }
    } catch {}
    await sleep(250);
  }
  if (!ready) throw new Error('Backend did not become ready: ' + logs);

  const routes = [
    '/api/gemini/advisor',
    '/api/gemini/analyze-needs',
    '/api/gemini/extract-catalog-page',
    '/api/gemini/segment-product',
    '/api/gemini/graphic-design-marketing',
    '/api/uploads',
  ];
  for (const route of routes) {
    const response = await fetch(origin + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (response.status !== 401) {
      throw new Error(route + ': expected 401 without auth, got ' + response.status);
    }
  }
  const badHeader = await fetch(origin + '/api/gemini/advisor', {
    method: 'POST',
    headers: { Authorization: 'Bearer ', 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (badHeader.status !== 401) throw new Error('Empty Bearer token should be rejected');

  console.log('PASS: 6 paid/upload endpoints reject anonymous requests; empty Bearer rejected; app serves HTML.');
} finally {
  backend.kill('SIGTERM');
}
