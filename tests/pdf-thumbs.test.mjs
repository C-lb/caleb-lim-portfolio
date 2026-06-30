import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { PDFDocument } from 'pdf-lib';
import { rasterizePiece, OUTPUT_DIR, SOURCE_PDF_DIR, canonicalFullPdfHref } from '../scripts/lib/pdf-thumbs.mjs';

async function makePdf(file, pages = 2) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage([612, 792]);
    p.drawText(`Page ${i + 1}`, { x: 72, y: 700, size: 48 });
  }
  await fs.writeFile(file, await doc.save());
}

test('rasterizePiece renders cover + selected pages + cache', async () => {
  const slug = 'tmp-pdf-thumbs-test';
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pdftest-'));
  const pdfPath = path.join(tmp, 'source.pdf');
  await makePdf(pdfPath, 2);
  try {
    const cache = await rasterizePiece({
      slug,
      sourcePdfPath: pdfPath,
      pdfPaginate: [2],
      fullPdf: canonicalFullPdfHref(slug),
    });
    const thumbDir = path.join(OUTPUT_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(thumbDir, 'cover.webp')));
    await assert.doesNotReject(fs.access(path.join(thumbDir, 'page-2.webp')));
    await assert.doesNotReject(fs.access(path.join(thumbDir, '.cache.json')));
    await assert.doesNotReject(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)));
    assert.ok(cache.pages.find((p) => p.file === 'cover.webp'));
  } finally {
    await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
    await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
