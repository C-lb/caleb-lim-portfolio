// scripts/lib/pieceCore.mjs
// Shared primitives for writing a gallery piece to disk. Used by createPiece (new
// piece) and updatePiece (edit). Keeping image optimization and frontmatter
// serialization here guarantees both paths emit byte-identical output, and the
// em/en-dash stripping rule lives in exactly one place (buildFrontmatter).
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

export const PIECES_DIR = path.resolve('src/content/pieces');
export const CATEGORIES = ['design', 'finance', 'personal', 'saas'];
export const HERO_OPTS = { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true };

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

export const dedash = (s) => String(s).replace(/[—–]/g, '-');

export async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

export async function optimizeImage(srcPath, destPath) {
  await sharp(srcPath).rotate().resize(HERO_OPTS).webp({ quality: 82 }).toFile(destPath);
}

export async function nextOrder(category) {
  if (!(await exists(PIECES_DIR))) return 1;
  let max = 0;
  for (const slug of await fs.readdir(PIECES_DIR)) {
    const idx = path.join(PIECES_DIR, slug, 'index.md');
    if (!(await exists(idx))) continue;
    try {
      const { data } = matter(await fs.readFile(idx, 'utf8'));
      if (data.category === category && Number.isFinite(data.order)) max = Math.max(max, data.order);
    } catch { /* skip unreadable */ }
  }
  return max + 1;
}

export async function uniqueSlug(title) {
  const base = slugify(title) || 'piece';
  let slug = base, n = 2;
  while (await exists(path.join(PIECES_DIR, slug))) slug = `${base}-${n++}`;
  return slug;
}

const blockScalar = (key, val) => {
  const lines = dedash(val).trim().split('\n');
  return `${key}: |\n${lines.map((l) => '  ' + l).join('\n')}`;
};
export { blockScalar };

// Pure serializer. gallery = bare filenames (e.g. 'gallery-01.webp'); pdf =
// { paginate, fullPdf } | null. Field order matches the original createPiece output.
export function buildFrontmatter({
  title, category, order, draft = false,
  year, gallery = [], deliverables = [], pullQuote,
  pdf = null, context, role, outcome,
}) {
  const fm = ['---', `title: ${JSON.stringify(dedash(title))}`, `category: ${category}`,
    `order: ${order}`, `draft: ${draft === true}`];
  if (year) fm.push(`year: ${JSON.stringify(dedash(year))}`);
  fm.push('hero: "./hero.webp"');
  if (gallery.length) fm.push(`gallery: ${JSON.stringify(gallery.map((n) => `./${n}`))}`);
  if (Array.isArray(deliverables) && deliverables.length) {
    fm.push(`deliverables: ${JSON.stringify(deliverables.map(dedash))}`);
  }
  if (pullQuote) fm.push(`pullQuote: ${JSON.stringify(dedash(pullQuote))}`);
  if (pdf) {
    fm.push(`pdfPaginate: [${pdf.paginate.join(', ')}]`);
    fm.push(`fullPdf: ${JSON.stringify(pdf.fullPdf)}`);
  }
  fm.push(blockScalar('context', context), blockScalar('role', role), blockScalar('outcome', outcome), '---', '');
  return fm.join('\n');
}
