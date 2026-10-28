import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const port = 4173;
const url = `http://127.0.0.1:${port}/SIERRACANDYDEMO/`;
const chrome = process.env.CHROME_BIN || 'google-chrome';
const server = spawn('node', [
  'node_modules/vite/bin/vite.js',
  'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'
], { stdio: ['ignore', 'pipe', 'pipe'] });

let logs = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.on('data', x => { logs += String(x).slice(0, 2000); });
}

try {
  let ready = false;
  for (let i=0; i<40; i++) {
    if (server.exitCode !== null) throw new Error('Vite preview terminated: ' + logs);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) { ready = true; break; }
    } catch { /* Vite may still be starting */ }
    await sleep(250);
  }
  if (!ready) throw new Error('Vite preview did not serve the GitHub Pages base URL. ' + logs);

  const dom = execFileSync(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--hide-scrollbars',
    '--virtual-time-budget=8000',
    '--dump-dom', url
  ], { timeout: 35000, maxBuffer: 10*1024*1024 }).toString();

  const expected = [
    'TU IDEA.', 'TU MARCA.', 'Digitalizar mi catálogo', 'Crear mi marca con IA'
  ];
  const missing = expected.filter(x => !dom.includes(x));
  if (missing.length) {
    throw new Error('Browser did not render the interactive Candy Studio gateway. Missing: ' +
      missing.join(', ') + '. Root: ' + dom.slice(Math.max(0, dom.indexOf('<div id="root"')), Math.max(0, dom.indexOf('<div id="root"')) + 700));
  }
  console.log('PASS: Chrome rendered the Candy Studio AI gateway through Vite preview at ' + url);
} finally {
  server.kill('SIGTERM');
}
