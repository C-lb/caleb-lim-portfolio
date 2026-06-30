import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../scripts/studio/app.mjs';
import { createPiece } from '../scripts/lib/createPiece.mjs';
import { PIECES_DIR } from '../scripts/lib/pieceCore.mjs';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
async function makeImage(file, color = { r: 30, g: 30, b: 30 }) {
  await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).png().toFile(file);
}
async function nukePiece(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
}
async function seed(title, category = 'design', gallery = 0) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-seed-'));
  const hero = path.join(tmp, 'c.png'); await makeImage(hero);
  const gPaths = [];
  for (let i = 0; i < gallery; i++) { const g = path.join(tmp, `g${i}.png`); await makeImage(g, { r: i * 30, g: 60, b: 90 }); gPaths.push(g); }
  const { slug } = await createPiece({ title, category, role: 'r', outcome: 'o', context: 'c', heroPath: hero, galleryPaths: gPaths });
  await fs.rm(tmp, { recursive: true, force: true });
  return slug;
}

test('GET /api/pieces lists existing pieces', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('List Me One');
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces`);
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.ok(Array.isArray(list));
    const mine = list.find((p) => p.slug === slug);
    assert.ok(mine, 'seeded piece present');
    assert.equal(mine.title, 'List Me One');
    assert.equal(mine.category, 'design');
    assert.equal(mine.draft, false);
  } finally { await nukePiece(slug); server.close(); }
});

test('GET /api/pieces/:slug returns the manifest with asset URLs', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Get Me Two', 'design', 2);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`);
    assert.equal(res.status, 200);
    const p = await res.json();
    assert.equal(p.title, 'Get Me Two');
    assert.equal(p.heroUrl, `/api/pieces/${slug}/asset/hero.webp`);
    assert.deepEqual(p.galleryUrls, [
      `/api/pieces/${slug}/asset/gallery-01.webp`,
      `/api/pieces/${slug}/asset/gallery-02.webp`,
    ]);
  } finally { await nukePiece(slug); server.close(); }
});

test('GET /api/pieces/:slug 404s for a missing piece', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/nope-nope`);
    assert.equal(res.status, 404);
  } finally { server.close(); }
});

test('GET /api/pieces/:slug/asset serves hero and rejects junk filenames', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Asset Me Three');
  try {
    const ok = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/asset/hero.webp`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('content-type'), 'image/webp');
    const bad = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/asset/index.md`);
    assert.equal(bad.status, 404);
  } finally { await nukePiece(slug); server.close(); }
});

async function seedPdf(title, pages = [1, 2, 3]) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-pdf-'));
  const hero = path.join(tmp, 'c.png'); await makeImage(hero);
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
  const pdf = path.join(tmp, 'd.pdf'); await fs.writeFile(pdf, await doc.save());
  const { slug } = await createPiece({ title, category: 'finance', role: 'r', outcome: 'o', context: 'c', heroPath: hero, pdfPath: pdf, pdfPages: pages });
  await fs.rm(tmp, { recursive: true, force: true });
  return slug;
}

test('GET /api/pieces/:slug/pdf-thumbs returns thumbs and current selection', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seedPdf('Thumbs Me', [2, 3]);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/pdf-thumbs`);
    assert.equal(res.status, 200);
    const { pageCount, thumbs, selected } = await res.json();
    assert.equal(pageCount, 3);
    assert.equal(thumbs.length, 3);
    assert.deepEqual(selected, [2, 3]);
    const t = await fetch(`http://127.0.0.1:${port}${thumbs[0].url}`);
    assert.equal(t.status, 200);
  } finally { await nukePiece(slug); server.close(); }
});

test('GET /api/pieces/:slug/pdf-thumbs 404s when the piece has no PDF', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('No Pdf Here');
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/pdf-thumbs`);
    assert.equal(res.status, 404);
  } finally { await nukePiece(slug); server.close(); }
});

async function pngBlob(color) {
  const buf = await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).png().toBuffer();
  return new Blob([buf], { type: 'image/png' });
}

test('PUT /api/pieces/:slug updates text and reorders gallery', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Put Me One', 'design', 2);
  try {
    const fd = new FormData();
    fd.set('title', 'Put Me One');
    fd.set('category', 'design');
    fd.set('role', 'updated role'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('year', '2024');
    fd.set('deliverables', JSON.stringify(['Edited']));
    fd.set('pullQuote', '');
    fd.set('draft', 'false');
    fd.set('galleryPlan', JSON.stringify([{ kind: 'keep', name: 'gallery-02.webp' }, { kind: 'keep', name: 'gallery-01.webp' }, { kind: 'new', idx: 0 }]));
    fd.append('gallery', await pngBlob({ r: 1, g: 2, b: 3 }), 'new.png');
    fd.set('pdfPlan', JSON.stringify({ action: 'keep' }));
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`, { method: 'PUT', body: fd });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.slug, slug);
    assert.equal(json.previewUrl, `http://localhost:4321/design/${slug}`);
    const get = await (await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`)).json();
    assert.equal(get.role, 'updated role');
    assert.equal(get.year, '2024');
    assert.deepEqual(get.gallery, ['gallery-01.webp', 'gallery-02.webp', 'gallery-03.webp']);
  } finally { await nukePiece(slug); server.close(); }
});

test('PUT /api/pieces/:slug replaces the cover', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Put Me Two');
  try {
    const before = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    const fd = new FormData();
    fd.set('title', 'Put Me Two'); fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('draft', 'false'); fd.set('galleryPlan', JSON.stringify([])); fd.set('pdfPlan', JSON.stringify({ action: 'keep' }));
    fd.set('cover', await pngBlob({ r: 240, g: 12, b: 12 }), 'cover.png');
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`, { method: 'PUT', body: fd });
    assert.equal(res.status, 200);
    const after = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    assert.ok(!before.equals(after), 'cover replaced');
  } finally { await nukePiece(slug); server.close(); }
});

test('PUT /api/pieces/:slug 400s on an empty required field', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Put Me Three');
  try {
    const fd = new FormData();
    fd.set('title', 'Put Me Three'); fd.set('category', 'design');
    fd.set('role', ''); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('draft', 'false'); fd.set('galleryPlan', JSON.stringify([])); fd.set('pdfPlan', JSON.stringify({ action: 'keep' }));
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`, { method: 'PUT', body: fd });
    assert.equal(res.status, 400);
  } finally { await nukePiece(slug); server.close(); }
});

test('studio UI serves the edit-mode hooks', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  try {
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    assert.match(html, /id="mode-edit"/);
    assert.match(html, /id="edit-list"/);
    const js = await (await fetch(`http://127.0.0.1:${port}/studio.js`)).text();
    assert.match(js, /galleryPlanAndFiles/);
    assert.match(js, /\/api\/pieces\//);
  } finally { server.close(); }
});
