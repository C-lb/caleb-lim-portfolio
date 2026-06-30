// scripts/lib/updatePiece.mjs
// Editing an existing piece. readPiece loads its current state for the form;
// updatePiece (Tasks 3-5) rewrites it via an atomic repo-local temp-swap and
// reconciles public/ PDF artifacts. Slug/URL never changes.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import {
  PIECES_DIR, CATEGORIES, exists, optimizeImage, buildFrontmatter, nextOrder,
} from './pieceCore.mjs';
import {
  canonicalFullPdfHref, rasterizePiece, OUTPUT_DIR, SOURCE_PDF_DIR,
} from './pdf-thumbs.mjs';

// Repo-local staging so the swap rename is same-filesystem (no EXDEV) and never
// sits under Astro's src/content glob.
export const STAGING_ROOT = path.resolve('.studio-tmp');

export async function updatePiece({ slug, fields, cover = null, galleryPlan = [], pdfPlan = { action: 'keep' } }) {
  const dir = path.join(PIECES_DIR, slug);
  const current = await readPiece(slug); // throws if missing

  for (const [k, v] of Object.entries({ title: fields.title, role: fields.role, outcome: fields.outcome, context: fields.context })) {
    if (!v || !String(v).trim()) throw new Error(`Missing required field: ${k}`);
  }
  if (!CATEGORIES.includes(fields.category)) {
    throw new Error(`Unknown category "${fields.category}" (must be one of ${CATEGORIES.join(', ')})`);
  }
  if (!cover && !(await exists(path.join(dir, 'hero.webp')))) throw new Error('Cover image not found');

  const warnings = [];
  const order = fields.category === current.category ? current.order : await nextOrder(fields.category);

  await fs.mkdir(STAGING_ROOT, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(STAGING_ROOT, `${slug}-`));
  let pdf = null;
  try {
    // Cover: replace (optimize) or keep (byte-identical copy).
    if (cover) await optimizeImage(cover, path.join(tmpDir, 'hero.webp'));
    else await fs.copyFile(path.join(dir, 'hero.webp'), path.join(tmpDir, 'hero.webp'));

    // Gallery: rebuild from the plan into fresh sequential names.
    const galleryNames = [];
    for (let i = 0; i < galleryPlan.length; i++) {
      const item = galleryPlan[i];
      const name = `gallery-${String(i + 1).padStart(2, '0')}.webp`;
      const dest = path.join(tmpDir, name);
      if (item.kind === 'keep') {
        if (!/^gallery-\d+\.webp$/.test(item.name)) throw new Error(`Invalid gallery image name: ${item.name}`);
        await fs.copyFile(path.join(dir, item.name), dest);
      } else {
        await optimizeImage(item.path, dest);
      }
      galleryNames.push(name);
    }

    // PDF: resolve the final source + page selection per action.
    const action = pdfPlan?.action ?? 'keep';
    if (action !== 'remove') {
      let srcPdf = null; let pages = null;
      if (action === 'replace') { srcPdf = pdfPlan.pdfPath; pages = pdfPlan.pages; }
      else if (action === 'repick') { srcPdf = path.join(dir, 'source.pdf'); pages = pdfPlan.pages; }
      else if (current.pdf.present) { srcPdf = path.join(dir, 'source.pdf'); pages = current.pdf.paginate; }
      if (srcPdf && (await exists(srcPdf))) {
        await fs.copyFile(srcPdf, path.join(tmpDir, 'source.pdf'));
        const resolved = (pages ?? []).map(Number).filter((x) => Number.isInteger(x) && x > 0);
        if (!resolved.length) warnings.push('No PDF pages selected; defaulted to page 1.');
        pdf = { paginate: resolved.length ? resolved : [1], fullPdf: canonicalFullPdfHref(slug) };
      }
    }

    const md = buildFrontmatter({
      title: fields.title, category: fields.category, order, draft: fields.draft === true,
      year: fields.year || undefined, gallery: galleryNames,
      deliverables: (fields.deliverables ?? []).filter(Boolean),
      pullQuote: fields.pullQuote || undefined, pdf,
      context: fields.context, role: fields.role, outcome: fields.outcome,
    });
    await fs.writeFile(path.join(tmpDir, 'index.md'), md, 'utf8');
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw err;
  }

  // Atomic swap: back the live dir up under the repo-local staging root (NOT a
  // sibling inside src/content/pieces, which the Astro content glob would load
  // and which is not gitignored), move the new dir in, then drop the backup.
  const backup = path.join(STAGING_ROOT, `${slug}.bak-${crypto.randomUUID()}`);
  try {
    await fs.rename(dir, backup);
    await fs.rename(tmpDir, dir);
  } catch (err) {
    // If the live dir was moved to backup but the swap-in failed, restore it;
    // if even that fails, name where the data is so it isn't lost silently.
    let note = '';
    if ((await exists(backup)) && !(await exists(dir))) {
      try { await fs.rename(backup, dir); }
      catch { note = ` The original piece is preserved at ${backup} and must be restored manually.`; }
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw new Error(`${err.message}${note}`);
  }
  await fs.rm(backup, { recursive: true, force: true });

  // Reconcile public/ PDF artifacts, keyed by the stable slug.
  await reconcilePublicPdf({ slug, dir, pdf, draft: fields.draft === true, warnings });

  return { slug, category: fields.category, warnings };
}

async function reconcilePublicPdf({ slug, dir, pdf, draft, warnings }) {
  if (pdf && !draft) {
    try {
      await rasterizePiece({
        slug, sourcePdfPath: path.join(dir, 'source.pdf'),
        pdfPaginate: pdf.paginate, fullPdf: pdf.fullPdf,
      });
    } catch (err) {
      warnings.push(`PDF thumbnails could not be generated now (${err.message}); the build will retry.`);
    }
    return;
  }
  // Draft-with-pdf or no-pdf: there must be no public artifacts.
  await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
  if (pdf && draft) warnings.push('Draft piece: PDF thumbnails will be generated when you remove draft and rebuild.');
}

export async function readPiece(slug) {
  const dir = path.join(PIECES_DIR, slug);
  const idx = path.join(dir, 'index.md');
  if (!(await exists(idx))) throw new Error(`Piece not found: ${slug}`);
  const { data, content } = matter(await fs.readFile(idx, 'utf8'));
  const gallery = (data.gallery ?? []).map((p) => String(p).replace(/^\.\//, ''));
  const hasPdf = Array.isArray(data.pdfPaginate) && (await exists(path.join(dir, 'source.pdf')));
  return {
    slug,
    title: data.title ?? '',
    category: data.category ?? '',
    draft: data.draft === true,
    order: Number.isFinite(data.order) ? data.order : 0,
    year: data.year ?? '',
    deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
    pullQuote: data.pullQuote ?? '',
    context: typeof data.context === 'string' ? data.context.trim() : (content || '').trim(),
    role: typeof data.role === 'string' ? data.role.trim() : '',
    outcome: typeof data.outcome === 'string' ? data.outcome.trim() : '',
    hero: 'hero.webp',
    gallery,
    pdf: { present: hasPdf, paginate: hasPdf ? data.pdfPaginate : [] },
  };
}
