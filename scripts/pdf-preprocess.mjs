// scripts/pdf-preprocess.mjs
// Phase 2 D-02: build-time PDF rasterization pipeline.
// Runs as the npm `prebuild` lifecycle hook — fires automatically before `astro build`.
// Idempotent (hash-cached). Source pattern: scripts/pdf-poc.mjs (Phase 1) + Mozilla pdf2png example.
//
// Contract (per Phase 2 02-01-PLAN.md):
//   - Discovers every src/content/pieces/[slug]/source.pdf
//   - For each piece: hash the (pdfBytes + pdfPaginate + PIPELINE_VERSION) and skip on cache hit
//   - Otherwise: render page 1 → cover.webp; render each pdfPaginate page → page-{N}.webp (1-indexed, literal)
//   - Encode WebP at 1600px long-edge, q80 (D-04, D-06)
//   - Write .cache.json sidecar with {inputHash, generatedAt, pages: [{n,w,h,bytes,file}]}
//   - When fullPdf is set: copy source.pdf → public/source-pdfs/[slug].pdf (D-17)
//
// Anti-patterns intentionally avoided:
//   - NO Astro content-collection runtime APIs — only work inside Astro runtime; we read the FS directly with gray-matter
//   - NO direct canvas-library import — pdfjs-dist exposes the right factory transitively (Pitfall 2)
//   - NO worker-source assignment in Node — the legacy entry point handles it (Phase 1 RESEARCH Pitfall 3)
//   - NO regex-parse of frontmatter — gray-matter handles edge cases
//
// Exit codes (per PATTERNS.md "Process exit-code contract"):
//   0 = success (DONE printed) — npm prebuild allows astro build to follow
//   1 = generic failure / hard rasterization crash — npm aborts build
//   2 = missing input precondition (reserved; not used in this script — discoverPieces tolerates absence)

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';
import matter from 'gray-matter';

const PIECES_DIR = path.resolve('src/content/pieces');
const OUTPUT_DIR = path.resolve('public/generated/pdf-thumbs');
const SOURCE_PDF_DIR = path.resolve('public/source-pdfs');
const CMAP_URL = './node_modules/pdfjs-dist/cmaps/';
const STANDARD_FONT_DATA_URL = './node_modules/pdfjs-dist/standard_fonts/';
const RESIZE_LONG_EDGE = 1600;
const WEBP_QUALITY = 80;
const RENDER_SCALE = 2.0; // 2x for downsample headroom

// Per A7: bump when render constants or output format change so cache invalidates
// without needing manual `.cache.json` deletion. Editing RESIZE_LONG_EDGE / WEBP_QUALITY
// / RENDER_SCALE without bumping PIPELINE_VERSION is a footgun — keep them aligned.
const PIPELINE_VERSION = 'v2';

async function discoverPieces() {
  let slugs;
  try {
    slugs = await fs.readdir(PIECES_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // no pieces dir yet — degenerate empty case
    throw err;
  }
  const out = [];
  for (const slug of slugs) {
    const indexPath = path.join(PIECES_DIR, slug, 'index.md');
    const sourcePdfPath = path.join(PIECES_DIR, slug, 'source.pdf');
    let md;
    try {
      md = await fs.readFile(indexPath, 'utf8');
    } catch {
      // not a piece dir (no index.md) — skip
      continue;
    }
    const hasPdf = await fs
      .access(sourcePdfPath)
      .then(() => true, () => false);
    if (!hasPdf) continue; // piece has no PDF — skip (no rasterization needed)
    const { data: fm } = matter(md);
    // CR-01 fix: draft pieces must NOT rasterize or copy. getStaticPaths in
    // [category]/[slug].astro filters draft !== true; the prebuild must mirror
    // that filter so public/generated/pdf-thumbs/<slug>/ and
    // public/source-pdfs/<slug>.pdf are not produced for draft work.
    // Strict === true so YAML quirks (e.g. draft: "no") cannot accidentally
    // trigger the skip — only an explicit boolean true counts.
    if (fm.draft === true) {
      console.log(`SKIP ${slug} (draft)`);
      continue;
    }
    out.push({
      slug,
      sourcePdfPath,
      pdfPaginate: fm.pdfPaginate,
      fullPdf: fm.fullPdf,
    });
  }
  return out;
}

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

async function copySourcePdf(slug, sourcePdfPath) {
  await fs.mkdir(SOURCE_PDF_DIR, { recursive: true });
  await fs.copyFile(sourcePdfPath, path.join(SOURCE_PDF_DIR, `${slug}.pdf`));
}

async function rasterizePiece({ slug, sourcePdfPath, pdfPaginate, fullPdf }) {
  const thumbDir = path.join(OUTPUT_DIR, slug);
  const cachePath = path.join(thumbDir, '.cache.json');

  // Cache check: if input hash matches the recorded hash, this piece is already up-to-date.
  const inputHash = await hashInputs(sourcePdfPath, pdfPaginate);
  try {
    const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    if (cached.inputHash === inputHash) {
      console.log(`SKIP ${slug} (cache hit)`);
      // Still re-copy fullPdf — cheap idempotent op; covers the case where someone
      // deleted public/source-pdfs/ but kept the thumbs cache.
      if (fullPdf) await copySourcePdf(slug, sourcePdfPath);
      return cached;
    }
  } catch {
    /* no cache or unreadable — fall through and regenerate */
  }

  await fs.mkdir(thumbDir, { recursive: true });

  const data = new Uint8Array(await fs.readFile(sourcePdfPath));
  const pdfDocument = await getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  const numPages = pdfDocument.numPages;
  // Page 1 always renders (cover.webp). Dedupe page 1 from pdfPaginate so it doesn't
  // double-render — D-05 mandates page 1 maps to cover.webp, not page-1.webp.
  const pagesToRender = [1, ...((pdfPaginate ?? []).filter((n) => n !== 1))];

  // WR-01 fix: prune orphan page-N.webp files for pages no longer in pdfPaginate.
  // Without this, shrinking pdfPaginate from [1,5,12,23] to [1,5] leaves page-12.webp
  // and page-23.webp in the thumb directory. They get committed via D-03 and ship
  // to production as dead bytes (and can leak intent — "page 23 used to be relevant").
  // Runs only on the cache-miss / regenerate path; cache-hit means nothing changed
  // and orphans cannot exist.
  const expectedFiles = new Set([
    'cover.webp',
    '.cache.json',
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
      // Soft failure — Caleb may reorder a deck; surface a warning but keep going.
      console.warn(
        `WARN ${slug}: pdfPaginate references page ${pageNum} but PDF has ${numPages}`
      );
      continue;
    }
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const cf = pdfDocument.canvasFactory; // Pitfall 2 — use the built-in factory exposed by pdfjs
    const ctx = cf.create(viewport.width, viewport.height);
    await page.render({ canvasContext: ctx.context, viewport }).promise;
    const pngBuf = ctx.canvas.toBuffer('image/png');
    page.cleanup();

    // D-05 filename contract: page 1 → cover.webp; other pages → literal page number
    const outName = pageNum === 1 ? 'cover.webp' : `page-${pageNum}.webp`;
    const outPath = path.join(thumbDir, outName);

    const webp = await sharp(pngBuf)
      .resize({
        width: RESIZE_LONG_EDGE,
        height: RESIZE_LONG_EDGE,
        fit: 'inside', // long-edge resize, NOT crop — preserves slide aspect
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await fs.writeFile(outPath, webp);

    const meta = await sharp(webp).metadata();
    pageMeta.push({
      n: pageNum,
      w: meta.width,
      h: meta.height,
      bytes: webp.length,
      file: outName,
    });
    console.log(
      `OK ${slug}/${outName} ${meta.width}x${meta.height} (${(webp.length / 1024).toFixed(1)}KB)`
    );
  }

  await pdfDocument.cleanup();

  // fullPdf side effect (D-17) — gated by frontmatter flag.
  if (fullPdf) await copySourcePdf(slug, sourcePdfPath);

  const cacheData = {
    inputHash,
    generatedAt: new Date().toISOString(),
    pages: pageMeta,
  };
  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
  return cacheData;
}

async function main() {
  const pieces = await discoverPieces();
  console.log(`Found ${pieces.length} pieces with source.pdf`);
  for (const p of pieces) {
    try {
      await rasterizePiece(p);
    } catch (err) {
      console.error(`FAIL ${p.slug}: ${err.message}`);
      process.exit(1);
    }
  }
  console.log('DONE');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
