// scripts/studio/server.mjs
// One command: start the studio API (:4322), spawn `astro dev` (:4321) for live
// preview, open the browser, and shut both down cleanly on Ctrl-C.
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

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  execFile(cmd, [url], () => {});
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
  app.listen(STUDIO_PORT, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${STUDIO_PORT}`;
    console.log(`\n  Portfolio Studio  ${url}\n  Live preview      http://localhost:${DEV_PORT}\n`);
    openBrowser(url);
  });
}

function shutdown() {
  if (devChild) devChild.kill('SIGINT');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
main();
