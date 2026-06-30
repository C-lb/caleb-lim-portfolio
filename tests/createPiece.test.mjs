import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import matter from 'gray-matter';
import sharp from 'sharp';
import { createPiece, PIECES_DIR } from '../scripts/lib/createPiece.mjs';

async function makeImage(file, color = { r: 200, g: 120, b: 40 }) {
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: color } })
    .png().toFile(file);
}

async function cleanup(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
}

test('creates a piece dir with optimized hero and valid frontmatter', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  let slug;
  try {
    const res = await createPiece({
      title: 'Studio Test Alpha',
      category: 'design',
      role: 'Did the thing',
      outcome: 'It worked',
      context: 'Some background',
      year: '2025',
      heroPath: hero,
    });
    slug = res.slug;
    assert.equal(slug, 'studio-test-alpha');
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'hero.webp')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.equal(data.title, 'Studio Test Alpha');
    assert.equal(data.category, 'design');
    assert.equal(data.hero, './hero.webp');
    assert.equal(data.year, '2025');
    assert.equal(data.draft, false);
    assert.equal(typeof data.order, 'number');
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('normalizes em and en dashes to hyphens in written text', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  let slug;
  try {
    const res = await createPiece({
      title: 'Dash Test',
      category: 'saas',
      role: 'A',
      outcome: 'Cut costs — a lot',
      context: 'Ran 2024–2025',
      heroPath: hero,
    });
    slug = res.slug;
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.ok(!/[—–]/.test(raw), 'no em/en dashes remain');
    assert.match(raw, /Cut costs - a lot/);
    assert.match(raw, /Ran 2024-2025/);
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('suffixes slug on collision', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  const slugs = [];
  try {
    const a = await createPiece({ title: 'Collide', category: 'design', role: 'r', outcome: 'o', context: 'c', heroPath: hero });
    const b = await createPiece({ title: 'Collide', category: 'design', role: 'r', outcome: 'o', context: 'c', heroPath: hero });
    slugs.push(a.slug, b.slug);
    assert.equal(a.slug, 'collide');
    assert.equal(b.slug, 'collide-2');
  } finally {
    for (const s of slugs) await cleanup(s);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('rejects an unknown category', async () => {
  await assert.rejects(
    () => createPiece({ title: 'X', category: 'nope', role: 'r', outcome: 'o', context: 'c', heroPath: '/x' }),
    /category/i
  );
});

import { rasterizePiece as _r } from '../scripts/lib/pdf-thumbs.mjs'; // ensures lib present
import { PDFDocument } from 'pdf-lib';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';

test('writes ordered gallery images', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  const g1 = path.join(tmp, 'a.png');
  const g2 = path.join(tmp, 'b.png');
  await makeImage(hero); await makeImage(g1, { r: 10, g: 90, b: 200 }); await makeImage(g2, { r: 20, g: 200, b: 90 });
  let slug;
  try {
    const res = await createPiece({
      title: 'Gallery Piece', category: 'design', role: 'r', outcome: 'o', context: 'c',
      heroPath: hero, galleryPaths: [g1, g2],
    });
    slug = res.slug;
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'gallery-01.webp')));
    await assert.doesNotReject(fs.access(path.join(dir, 'gallery-02.webp')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.deepEqual(data.gallery, ['./gallery-01.webp', './gallery-02.webp']);
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('attaches a PDF: source.pdf, pdfPaginate, fullPdf, and rasterized thumbs', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  const pdfPath = path.join(tmp, 'deck.pdf');
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
  await fs.writeFile(pdfPath, await doc.save());
  let slug;
  try {
    const res = await createPiece({
      title: 'Deck Piece', category: 'finance', role: 'r', outcome: 'o', context: 'c',
      heroPath: hero, pdfPath, pdfPages: [2, 3],
    });
    slug = res.slug;
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'source.pdf')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.deepEqual(data.pdfPaginate, [2, 3]);
    assert.equal(data.fullPdf, `/source-pdfs/${slug}.pdf`);
    await assert.doesNotReject(fs.access(path.join(OUTPUT_DIR, slug, 'cover.webp')));
    await assert.doesNotReject(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)));
  } finally {
    if (slug) {
      await cleanup(slug);
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('draft piece with PDF: keeps source.pdf in piece dir + frontmatter, skips public/ artifacts', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-draft-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  const pdfPath = path.join(tmp, 'draft.pdf');
  const doc = await PDFDocument.create();
  for (let i = 0; i < 2; i++) doc.addPage([612, 792]).drawText(`Draft${i + 1}`, { x: 72, y: 700, size: 40 });
  await fs.writeFile(pdfPath, await doc.save());
  let slug;
  try {
    const res = await createPiece({
      title: 'Draft PDF Piece', category: 'design', role: 'r', outcome: 'o', context: 'c',
      draft: true, heroPath: hero, pdfPath, pdfPages: [1, 2],
    });
    slug = res.slug;
    const dir = path.join(PIECES_DIR, slug);
    // source.pdf must exist inside the piece dir (not publicly served)
    await assert.doesNotReject(fs.access(path.join(dir, 'source.pdf')));
    // frontmatter must have pdfPaginate and fullPdf
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.ok(Array.isArray(data.pdfPaginate) && data.pdfPaginate.length > 0, 'pdfPaginate set');
    assert.ok(typeof data.fullPdf === 'string' && data.fullPdf.length > 0, 'fullPdf set');
    // public/ artifacts must NOT exist
    await assert.rejects(fs.access(path.join(OUTPUT_DIR, slug)), 'pdf-thumbs dir should not exist for drafts');
    await assert.rejects(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)), 'source-pdfs copy should not exist for drafts');
  } finally {
    if (slug) {
      await cleanup(slug);
      // defensive cleanup in case the fix wasn't applied yet
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
