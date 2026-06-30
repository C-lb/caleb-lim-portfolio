// scripts/lib/createPiece.mjs
// Single source of truth for writing a gallery piece to disk. Used by the studio
// server and the new-piece CLI. Optimizes images, writes index.md, returns the slug.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import matter from 'gray-matter';

export const PIECES_DIR = path.resolve('src/content/pieces');
const CATEGORIES = ['design', 'finance', 'personal', 'saas'];

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

const dedash = (s) => String(s).replace(/[—–]/g, '-');

const HERO_OPTS = { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true };

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function nextOrder(category) {
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

async function uniqueSlug(title) {
  const base = slugify(title) || 'piece';
  let slug = base, n = 2;
  while (await exists(path.join(PIECES_DIR, slug))) slug = `${base}-${n++}`;
  return slug;
}

const blockScalar = (key, val) => {
  const lines = dedash(val).trim().split('\n');
  return `${key}: |\n${lines.map((l) => '  ' + l).join('\n')}`;
};

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

  try {
    // Cover
    await sharp(heroPath).rotate().resize(HERO_OPTS).webp({ quality: 82 })
      .toFile(path.join(tmpDir, 'hero.webp'));

    // Gallery (Task 3 fills this in)
    const galleryNames = await writeGallery(tmpDir, galleryPaths);

    // Frontmatter (PDF fields filled by Task 3)
    const fm = ['---', `title: ${JSON.stringify(dedash(title))}`, `category: ${category}`,
      `order: ${order}`, `draft: ${draft === true}`];
    if (year) fm.push(`year: ${JSON.stringify(dedash(year))}`);
    fm.push('hero: "./hero.webp"');
    if (galleryNames.length) fm.push(`gallery: ${JSON.stringify(galleryNames.map((n) => `./${n}`))}`);
    if (Array.isArray(deliverables) && deliverables.length) {
      fm.push(`deliverables: ${JSON.stringify(deliverables.map(dedash))}`);
    }
    if (pullQuote) fm.push(`pullQuote: ${JSON.stringify(dedash(pullQuote))}`);
    await attachPdf({ fm, tmpDir, slug, pdfPath, pdfPages, warnings });
    fm.push(blockScalar('context', context), blockScalar('role', role), blockScalar('outcome', outcome), '---', '');
    await fs.writeFile(path.join(tmpDir, 'index.md'), fm.join('\n'), 'utf8');

    // Atomic move into place
    await fs.rename(tmpDir, finalDir);
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.rm(finalDir, { recursive: true, force: true });
    throw err;
  }

  // PDF raster outputs land in public/ (Task 3); done after the dir is in place.
  await rasterizeIfPdf({ slug, finalDir, pdfPath, pdfPages, warnings });

  return { slug, dir: finalDir, warnings };
}

// Stubs replaced in Task 3.
async function writeGallery(_tmpDir, _galleryPaths) { return []; }
async function attachPdf(_args) { /* no-op until Task 3 */ }
async function rasterizeIfPdf(_args) { /* no-op until Task 3 */ }
