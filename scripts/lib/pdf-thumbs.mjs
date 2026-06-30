// scripts/lib/pdf-thumbs.mjs
// Shared PDF rasterization. Used by scripts/pdf-preprocess.mjs (build) and
// scripts/lib/createPiece.mjs (studio/CLI). Output is byte-identical across both.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';

export const OUTPUT_DIR = path.resolve('public/generated/pdf-thumbs');
export const SOURCE_PDF_DIR = path.resolve('public/source-pdfs');
const CMAP_URL = './node_modules/pdfjs-dist/cmaps/';
const STANDARD_FONT_DATA_URL = './node_modules/pdfjs-dist/standard_fonts/';
const RESIZE_LONG_EDGE = 1600;
const WEBP_QUALITY = 80;
const RENDER_SCALE = 2.0;
const PIPELINE_VERSION = 'v2';

export const canonicalFullPdfHref = (slug) => `/source-pdfs/${slug}.pdf`;

async function hashInputs(pdfPath, pdfPaginate) {
  const bytes = await fs.readFile(pdfPath);
  return createHash('sha256')
    .update(bytes)
    .update('|paginate=')
    .update(JSON.stringify(pdfPaginate ?? []))
    .update('|v=')
    .update(PIPELINE_VERSION)
    .digest('hex');
}

export async function copySourcePdf(slug, sourcePdfPath, fullPdf) {
  if (fullPdf !== undefined) {
    const expected = canonicalFullPdfHref(slug);
    if (fullPdf !== expected) {
      throw new Error(
        `WR-02 contract violation: ${slug} frontmatter fullPdf is "${fullPdf}" but the script writes to "${expected}". ` +
        `Set frontmatter to fullPdf: "${expected}" or omit the field to suppress the Open full PDF link.`
      );
    }
  }
  await fs.mkdir(SOURCE_PDF_DIR, { recursive: true });
  await fs.copyFile(sourcePdfPath, path.join(SOURCE_PDF_DIR, `${slug}.pdf`));
}

export async function rasterizePiece({ slug, sourcePdfPath, pdfPaginate, fullPdf }) {
  const thumbDir = path.join(OUTPUT_DIR, slug);
  const cachePath = path.join(thumbDir, '.cache.json');

  const inputHash = await hashInputs(sourcePdfPath, pdfPaginate);
  try {
    const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    if (cached.inputHash === inputHash) {
      console.log(`SKIP ${slug} (cache hit)`);
      if (fullPdf) await copySourcePdf(slug, sourcePdfPath, fullPdf);
      return cached;
    }
  } catch { /* no cache or unreadable — regenerate */ }

  await fs.mkdir(thumbDir, { recursive: true });

  const data = new Uint8Array(await fs.readFile(sourcePdfPath));
  const pdfDocument = await getDocument({
    data, cMapUrl: CMAP_URL, cMapPacked: true, standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  const numPages = pdfDocument.numPages;
  const pagesToRender = [1, ...((pdfPaginate ?? []).filter((n) => n !== 1))];

  const expectedFiles = new Set([
    'cover.webp', '.cache.json',
    ...pagesToRender.filter((n) => n !== 1).map((n) => `page-${n}.webp`),
  ]);
  const existingFiles = await fs.readdir(thumbDir).catch((err) => {
    if (err.code === 'ENOENT') return [];
    throw err;
  });
  for (const f of existingFiles) {
    if (!expectedFiles.has(f)) {
      await fs.unlink(path.join(thumbDir, f));
      console.log(`PRUNE ${slug}/${f} (no longer in pdfPaginate)`);
    }
  }

  const pageMeta = [];
  for (const pageNum of pagesToRender) {
    if (pageNum > numPages) {
      console.warn(`WARN ${slug}: pdfPaginate references page ${pageNum} but PDF has ${numPages}`);
      continue;
    }
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const cf = pdfDocument.canvasFactory;
    const ctx = cf.create(viewport.width, viewport.height);
    await page.render({ canvasContext: ctx.context, viewport }).promise;
    const pngBuf = ctx.canvas.toBuffer('image/png');
    page.cleanup();

    const outName = pageNum === 1 ? 'cover.webp' : `page-${pageNum}.webp`;
    const webp = await sharp(pngBuf)
      .resize({ width: RESIZE_LONG_EDGE, height: RESIZE_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await fs.writeFile(path.join(thumbDir, outName), webp);

    const meta = await sharp(webp).metadata();
    pageMeta.push({ n: pageNum, w: meta.width, h: meta.height, bytes: webp.length, file: outName });
    console.log(`OK ${slug}/${outName} ${meta.width}x${meta.height} (${(webp.length / 1024).toFixed(1)}KB)`);
  }
  await pdfDocument.cleanup();

  if (fullPdf) await copySourcePdf(slug, sourcePdfPath, fullPdf);

  const cacheData = { inputHash, generatedAt: new Date().toISOString(), pages: pageMeta };
  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
  return cacheData;
}
