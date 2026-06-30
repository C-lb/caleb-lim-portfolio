// scripts/studio/server.mjs
// One command: start the studio API (:4322), spawn `astro dev` (:4321) for live
// preview, open BOTH in the browser (the personal website, and the studio in its
// own separate window), and shut both down cleanly on Ctrl-C.
import { spawn, execFile } from 'node:child_process';
import net from 'node:net';
import { createApp } from './app.mjs';

const STUDIO_PORT = 4322;
const DEV_PORT = 4321;
const repoRoot = process.cwd();

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1');
    s.on('connect', () => { s.end(); resolve(true); });
    s.on('error', () => resolve(false));
  });
}

// Wait until a port is accepting connections (so we don't open the website
// before Astro's dev server is ready and the browser shows a connection error).
async function waitForPort(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function openBrowser(url, { newWindow = false } = {}) {
  if (process.platform === 'darwin') {
    if (newWindow) {
      // Force a separate Chrome window. `-na` asks for a new instance; on the
      // same profile Chrome routes it to the running browser and opens a fresh
      // window. Fall back to the default browser if Chrome isn't installed.
      execFile('open', ['-na', 'Google Chrome', '--args', '--new-window', url], (err) => {
        if (err) execFile('open', [url], () => {});
      });
    } else {
      execFile('open', [url], () => {});
    }
    return;
  }
  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', url], () => {});
    return;
  }
  execFile('xdg-open', [url], () => {});
}

let devChild = null;
async function main() {
  if (!(await portOpen(DEV_PORT))) {
    devChild = spawn('npm', ['run', 'dev'], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    devChild.stdout.on('data', (d) => process.stdout.write(`[dev] ${d}`));
    devChild.stderr.on('data', (d) => process.stderr.write(`[dev] ${d}`));
  } else {
    console.log(`[dev] already running on :${DEV_PORT}`);
  }

  const app = createApp({ repoRoot });
  app.listen(STUDIO_PORT, '127.0.0.1', async () => {
    const siteUrl = `http://localhost:${DEV_PORT}`;
    const studioUrl = `http://127.0.0.1:${STUDIO_PORT}`;
    console.log(`\n  Personal website  ${siteUrl}\n  Portfolio Studio  ${studioUrl}  (separate window)\n`);
    // Open the website once its dev server actually accepts connections, then
    // the studio in its own window.
    await waitForPort(DEV_PORT, 15000);
    openBrowser(siteUrl);
    openBrowser(studioUrl, { newWindow: true });
  });
}

function shutdown() {
  if (devChild) devChild.kill('SIGINT');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
main();
