import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../scripts/studio/app.mjs';
import { PIECES_DIR } from '../scripts/lib/createPiece.mjs';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';
const run = promisify(execFile);

test('end-to-end: create via API, then astro build succeeds', { timeout: 240000 }, async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const port = server.address().port;
  const png = async (c) => new Blob([await sharp({ create: { width: 800, height: 600, channels: 3, background: c } }).png().toBuffer()], { type: 'image/png' });
  let slug;
  try {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 2; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
    const pre = new FormData();
    pre.set('pdf', new Blob([Buffer.from(await doc.save())], { type: 'application/pdf' }), 'd.pdf');
    const { stagingId } = await (await fetch(`http://127.0.0.1:${port}/api/pdf/preview`, { method: 'POST', body: pre })).json();

    const fd = new FormData();
    fd.set('title', 'Smoke E2E'); fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('cover', await png({ r: 30, g: 30, b: 30 }), 'c.png');
    fd.append('gallery', await png({ r: 200, g: 20, b: 20 }), 'g.png');
    fd.set('pdfStagingId', stagingId); fd.set('pdfPages', JSON.stringify([2]));
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: fd });
    ({ slug } = await res.json());
    assert.ok(slug);
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'gallery-01.webp')));
    await run('npx', ['astro', 'build'], { cwd: process.cwd() });
  } finally {
    if (slug) {
      await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    server.close();
  }
});
