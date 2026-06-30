import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { createPiece } from '../scripts/lib/createPiece.mjs';
import { PIECES_DIR } from '../scripts/lib/pieceCore.mjs';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';
import { readPiece, updatePiece } from '../scripts/lib/updatePiece.mjs';

async function makeImage(file, color = { r: 200, g: 120, b: 40 }) {
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: color } }).png().toFile(file);
}
async function makePdf(file, pages = 3) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
  await fs.writeFile(file, await doc.save());
}
async function nukePiece(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
}

test('readPiece returns fields, ordered gallery, and pdf manifest', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'rp-'));
  const hero = path.join(tmp, 'c.png'); const g1 = path.join(tmp, 'a.png'); const g2 = path.join(tmp, 'b.png');
  const pdf = path.join(tmp, 'd.pdf');
  await makeImage(hero); await makeImage(g1); await makeImage(g2); await makePdf(pdf);
  let slug;
  try {
    ({ slug } = await createPiece({
      title: 'Read Me', category: 'design', role: 'My role', outcome: 'My outcome',
      context: 'My context', year: '2025', deliverables: ['Logo', 'Brand'],
      heroPath: hero, galleryPaths: [g1, g2], pdfPath: pdf, pdfPages: [2, 3],
    }));
    const p = await readPiece(slug);
    assert.equal(p.title, 'Read Me');
    assert.equal(p.category, 'design');
    assert.equal(p.draft, false);
    assert.equal(typeof p.order, 'number');
    assert.equal(p.year, '2025');
    assert.deepEqual(p.deliverables, ['Logo', 'Brand']);
    assert.equal(p.context, 'My context');
    assert.equal(p.role, 'My role');
    assert.equal(p.outcome, 'My outcome');
    assert.equal(p.hero, 'hero.webp');
    assert.deepEqual(p.gallery, ['gallery-01.webp', 'gallery-02.webp']);
    assert.equal(p.pdf.present, true);
    assert.deepEqual(p.pdf.paginate, [2, 3]);
  } finally {
    if (slug) await nukePiece(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('readPiece throws for a missing slug', async () => {
  await assert.rejects(() => readPiece('does-not-exist-xyz'), /not found/i);
});

const baseFields = (over = {}) => ({
  title: 'Base Title', category: 'design', role: 'role one', outcome: 'outcome one',
  context: 'context one', year: '2025', deliverables: ['One'], pullQuote: '', draft: false, ...over,
});

async function seedPiece(over = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-seed-'));
  const hero = path.join(tmp, 'c.png');
  await makeImage(hero, { r: 50, g: 50, b: 50 });
  const res = await createPiece({
    title: over.title ?? 'Base Title', category: over.category ?? 'design',
    role: 'role one', outcome: 'outcome one', context: 'context one', year: '2025',
    deliverables: ['One'], heroPath: hero, draft: over.draft ?? false,
  });
  await fs.rm(tmp, { recursive: true, force: true });
  return res.slug;
}

test('updatePiece changes text but leaves hero.webp byte-identical', async () => {
  const slug = await seedPiece();
  try {
    const before = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    const res = await updatePiece({
      slug, fields: baseFields({ title: 'Base Title', role: 'role TWO', outcome: 'outcome TWO', context: 'context TWO' }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'keep' },
    });
    assert.equal(res.slug, slug);
    const after = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    assert.ok(before.equals(after), 'hero.webp unchanged');
    const p = await readPiece(slug);
    assert.equal(p.role, 'role TWO');
    assert.equal(p.outcome, 'outcome TWO');
    assert.equal(p.context, 'context TWO');
  } finally { await nukePiece(slug); }
});

test('updatePiece replaces the cover when a new one is given', async () => {
  const slug = await seedPiece();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-cov-'));
  try {
    const before = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    const newCover = path.join(tmp, 'new.png');
    await makeImage(newCover, { r: 250, g: 10, b: 10 });
    await updatePiece({ slug, fields: baseFields(), cover: newCover, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const after = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    assert.ok(!before.equals(after), 'hero.webp replaced');
  } finally { await nukePiece(slug); await fs.rm(tmp, { recursive: true, force: true }); }
});

test('updatePiece keeps the slug stable when the title changes', async () => {
  const slug = await seedPiece();
  try {
    await updatePiece({ slug, fields: baseFields({ title: 'A Totally New Title' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'index.md')), 'dir name unchanged');
    const p = await readPiece(slug);
    assert.equal(p.title, 'A Totally New Title');
  } finally { await nukePiece(slug); }
});

test('updatePiece strips em dashes on update', async () => {
  const slug = await seedPiece();
  try {
    await updatePiece({ slug, fields: baseFields({ outcome: 'Saved time — lots' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.ok(!/[—–]/.test(raw));
    assert.match(raw, /Saved time - lots/);
  } finally { await nukePiece(slug); }
});

test('updatePiece re-appends order when category changes', async () => {
  // Seed two finance pieces so nextOrder(finance) is 3, then move a design piece to finance.
  const f1 = await seedPiece({ title: 'Fin One', category: 'finance' });
  const f2 = await seedPiece({ title: 'Fin Two', category: 'finance' });
  const d1 = await seedPiece({ title: 'Des One', category: 'design' });
  try {
    await updatePiece({ slug: d1, fields: baseFields({ title: 'Des One', category: 'finance' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const moved = await readPiece(d1);
    const f2order = (await readPiece(f2)).order;
    assert.equal(moved.category, 'finance');
    assert.ok(moved.order > f2order, `re-appended (order ${moved.order} > ${f2order})`);
  } finally { await nukePiece(f1); await nukePiece(f2); await nukePiece(d1); }
});

test('updatePiece rejects an unknown category', async () => {
  const slug = await seedPiece();
  try {
    await assert.rejects(
      () => updatePiece({ slug, fields: baseFields({ category: 'nope' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } }),
      /category/i,
    );
  } finally { await nukePiece(slug); }
});
