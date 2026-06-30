import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../scripts/studio/app.mjs';
import { PIECES_DIR } from '../scripts/lib/createPiece.mjs';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
async function pngBlob(color) {
  const buf = await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).png().toBuffer();
  return new Blob([buf], { type: 'image/png' });
}

test('POST /api/piece creates a piece and returns a preview URL', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  let slug;
  try {
    const fd = new FormData();
    fd.set('title', 'Api Piece One');
    fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('cover', await pngBlob({ r: 100, g: 100, b: 100 }), 'cover.png');
    fd.append('gallery', await pngBlob({ r: 200, g: 20, b: 20 }), 'a.png');
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: fd });
    assert.equal(res.status, 200);
    const json = await res.json();
    slug = json.slug;
    assert.equal(slug, 'api-piece-one');
    assert.equal(json.previewUrl, `http://localhost:4321/design/${slug}`);
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'gallery-01.webp')));
  } finally {
    if (slug) await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
    server.close();
  }
});

test('POST /api/piece 400s when a required field is missing', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  try {
    const fd = new FormData();
    fd.set('title', 'No Cover');
    fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: fd });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});

test('POST /api/pdf/preview returns page thumbnails; piece can use them', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  let slug;
  try {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 3; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
    const pdfBuf = Buffer.from(await doc.save());

    const fd = new FormData();
    fd.set('pdf', new Blob([pdfBuf], { type: 'application/pdf' }), 'deck.pdf');
    const pre = await fetch(`http://127.0.0.1:${port}/api/pdf/preview`, { method: 'POST', body: fd });
    assert.equal(pre.status, 200);
    const { stagingId, pageCount, thumbs } = await pre.json();
    assert.equal(pageCount, 3);
    assert.equal(thumbs.length, 3);
    const thumbRes = await fetch(`http://127.0.0.1:${port}${thumbs[0].url}`);
    assert.equal(thumbRes.status, 200);

    const pf = new FormData();
    pf.set('title', 'Preview Piece'); pf.set('category', 'finance');
    pf.set('role', 'r'); pf.set('outcome', 'o'); pf.set('context', 'c');
    pf.set('cover', await pngBlob({ r: 9, g: 9, b: 9 }), 'cover.png');
    pf.set('pdfStagingId', stagingId);
    pf.set('pdfPages', JSON.stringify([2, 3]));
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: pf });
    assert.equal(res.status, 200);
    ({ slug } = await res.json());
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'source.pdf')));
  } finally {
    if (slug) {
      await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
      const { OUTPUT_DIR, SOURCE_PDF_DIR } = await import('../scripts/lib/pdf-thumbs.mjs');
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    server.close();
  }
});
