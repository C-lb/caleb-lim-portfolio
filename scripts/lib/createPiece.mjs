// scripts/lib/createPiece.mjs
// Single source of truth for writing a NEW gallery piece to disk. Used by the studio
// server and the new-piece CLI. Shares image + frontmatter helpers with updatePiece
// via pieceCore.mjs.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  PIECES_DIR, CATEGORIES, slugify, exists, optimizeImage, buildFrontmatter,
  nextOrder, uniqueSlug,
} from './pieceCore.mjs';
import { rasterizePiece, canonicalFullPdfHref } from './pdf-thumbs.mjs';

export { PIECES_DIR, slugify };

export async function createPiece(input) {
  const {
    title, category, role, outcome, context,
    year, deliverables, pullQuote, draft = false,
    heroPath, galleryPaths = [], pdfPath = null, pdfPages = [],
  } = input;

  for (const [k, v] of Object.entries({ title, role, outcome, context })) {
    if (!v || !String(v).trim()) throw new Error(`Missing required field: ${k}`);
  }
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Unknown category "${category}" (must be one of ${CATEGORIES.join(', ')})`);
  }
  if (!heroPath || !(await exists(heroPath))) throw new Error('Cover image not found');

  const warnings = [];
  const slug = await uniqueSlug(title);
  const order = await nextOrder(category);
  const finalDir = path.join(PIECES_DIR, slug);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `piece-${slug}-`));

  // Resolve gallery + pdf into the temp dir, then serialize frontmatter once.
  let pdf = null;
  try {
    await optimizeImage(heroPath, path.join(tmpDir, 'hero.webp'));

    const galleryNames = [];
    for (let i = 0; i < galleryPaths.length; i++) {
      const name = `gallery-${String(i + 1).padStart(2, '0')}.webp`;
      await optimizeImage(galleryPaths[i], path.join(tmpDir, name));
      galleryNames.push(name);
    }

    if (pdfPath && (await exists(pdfPath))) {
      await fs.copyFile(pdfPath, path.join(tmpDir, 'source.pdf'));
      const pages = (pdfPages ?? []).map(Number).filter((x) => Number.isInteger(x) && x > 0);
      if (!pages.length) warnings.push('No PDF pages selected; defaulted to page 1.');
      pdf = { paginate: pages.length ? pages : [1], fullPdf: canonicalFullPdfHref(slug) };
    }

    const md = buildFrontmatter({
      title, category, order, draft, year, gallery: galleryNames,
      deliverables, pullQuote, pdf, context, role, outcome,
    });
    await fs.writeFile(path.join(tmpDir, 'index.md'), md, 'utf8');

    await fs.mkdir(PIECES_DIR, { recursive: true });
    await fs.rename(tmpDir, finalDir);
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.rm(finalDir, { recursive: true, force: true });
    throw err;
  }

  // Drafts skip public/ writes — their page 404s and the build skips them too.
  if (pdf && draft) {
    warnings.push('Draft piece: PDF thumbnails will be generated when you remove draft and rebuild.');
  } else if (pdf) {
    try {
      await rasterizePiece({
        slug, sourcePdfPath: path.join(finalDir, 'source.pdf'),
        pdfPaginate: pdf.paginate, fullPdf: pdf.fullPdf,
      });
    } catch (err) {
      warnings.push(`PDF thumbnails could not be generated now (${err.message}); the build will retry.`);
    }
  }

  return { slug, dir: finalDir, warnings };
}
