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
import { readPiece } from '../scripts/lib/updatePiece.mjs';

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
