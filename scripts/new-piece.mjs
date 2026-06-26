// scripts/new-piece.mjs
// Friendly intake for gallery pieces. Drop a cover image (and optionally a PDF)
// into the project's intake/ folder, run `npm run new-piece`, answer a few
// questions, and this scaffolds a proper piece under src/content/pieces/<slug>/
// (optimised hero.webp + index.md, plus source.pdf when you include a deck).
//
// It does NOT publish — review with `npm run dev`, then commit + push to deploy.

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import sharp from 'sharp';
import matter from 'gray-matter';

// Keep in sync with src/content/categories.ts
const CATEGORIES = ['design', 'finance', 'personal', 'saas'];

const ROOT = path.resolve('.');
const INTAKE_DIR = path.join(ROOT, 'intake');
const PIECES_DIR = path.join(ROOT, 'src/content/pieces');
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.gif'];

const c = { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m` };

// Dual-mode input: a real terminal uses readline prompts; piped/non-interactive
// input (tests, scripted runs) is buffered upfront and consumed line by line —
// avoids the readline-with-piped-stdin race where buffered lines fire before the
// first question() awaits.
const isTTY = Boolean(stdin.isTTY);
let rl = null;
let queued = [];
async function initIO() {
  if (isTTY) { rl = readline.createInterface({ input: stdin, output: stdout }); return; }
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  queued = Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
}
function closeIO() { if (rl) rl.close(); }

async function ask(q, def) {
  const hint = def ? c.dim(` (${def})`) : '';
  if (isTTY) {
    const a = (await rl.question(`${q}${hint}\n> `)).trim();
    return a || def || '';
  }
  const a = (queued.shift() ?? '').trim();
  stdout.write(`${q}${hint}\n> ${a}\n`);
  return a || def || '';
}
async function askRequired(q) {
  let a = '';
  while (!a) { a = await ask(q); if (!a) console.log(c.y('  required — please enter a value.')); }
  return a;
}

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function listIntake() {
  if (!(await exists(INTAKE_DIR))) return { images: [], pdfs: [] };
  const entries = await fs.readdir(INTAKE_DIR);
  const images = [], pdfs = [];
  for (const name of entries) {
    if (name.startsWith('.') || name.toLowerCase() === 'readme.md') continue;
    const ext = path.extname(name).toLowerCase();
    if (IMAGE_EXT.includes(ext)) images.push(path.join(INTAKE_DIR, name));
    else if (ext === '.pdf') pdfs.push(path.join(INTAKE_DIR, name));
  }
  return { images, pdfs };
}

// Largest existing `order` for a category, so new pieces append to the end.
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

// Block scalar so multi-line prose matches the house frontmatter style.
const block = (key, val) => {
  const lines = String(val).trim().split('\n');
  return `${key}: |\n${lines.map((l) => '  ' + l).join('\n')}`;
};

async function resolveFile(label, candidates) {
  if (candidates.length === 1) {
    const use = await ask(`${label}: use ${c.b(path.basename(candidates[0]))} from intake/? ${c.dim('[Y/n]')}`, 'y');
    if (/^y/i.test(use)) return candidates[0];
  } else if (candidates.length > 1) {
    console.log(`${label}: found ${candidates.length} in intake/ —`);
    candidates.forEach((f, i) => console.log(`  ${i + 1}) ${path.basename(f)}`));
    const pick = await ask('Pick a number, or paste a different path');
    if (/^\d+$/.test(pick) && candidates[+pick - 1]) return candidates[+pick - 1];
    if (pick) return path.resolve(pick.replace(/^['"]|['"]$/g, ''));
  }
  // Manual path (drag the file into the terminal to paste its path).
  const manual = await ask(`${label}: paste the file path ${c.dim('(drag the file into this window)')}`);
  return manual ? path.resolve(manual.replace(/^['"]|['"]$/g, '')) : '';
}

async function main() {
  await initIO();
  console.log(c.b('\nNew gallery piece\n') + c.dim('Tip: drop your cover image (and optional PDF) into the intake/ folder first.\n'));

  const found = await listIntake();
  if (found.images.length || found.pdfs.length) {
    console.log(c.dim(`In intake/: ${found.images.length} image(s), ${found.pdfs.length} pdf(s)\n`));
  }

  const title = await askRequired('Title of the piece');

  let category = '';
  while (!CATEGORIES.includes(category)) {
    category = (await askRequired(`Category ${c.dim('(' + CATEGORIES.join(' / ') + ')')}`)).toLowerCase();
    if (!CATEGORIES.includes(category)) console.log(c.y(`  must be one of: ${CATEGORIES.join(', ')}`));
  }

  const role = await askRequired('Your role (what you did)');
  const outcome = await askRequired('Outcome (what it achieved)');
  const context = await askRequired('Context (the brief / background)');

  const heroSrc = await resolveFile('Cover image', found.images);
  if (!heroSrc || !(await exists(heroSrc))) { console.log(c.y('\nNo valid cover image — aborting.')); closeIO(); process.exit(1); }

  let pdfSrc = '';
  const wantPdf = found.pdfs.length
    ? await ask(`Include a PDF/deck? ${c.dim('[Y/n]')}`, 'y')
    : await ask(`Include a PDF/deck? ${c.dim('[y/N]')}`, 'n');
  let pdfPages = '';
  if (/^y/i.test(wantPdf)) {
    pdfSrc = await resolveFile('PDF', found.pdfs);
    if (pdfSrc && (await exists(pdfSrc))) {
      pdfPages = await ask(`Which pages to show below the hero? ${c.dim('comma-separated, e.g. 1,5,10')}`, '1');
    } else { pdfSrc = ''; }
  }

  // Unique slug.
  let slug = slugify(title) || 'piece';
  let n = 2;
  while (await exists(path.join(PIECES_DIR, slug))) slug = `${slugify(title)}-${n++}`;

  const order = await nextOrder(category);
  const pieceDir = path.join(PIECES_DIR, slug);

  console.log(c.dim(`\nWill create src/content/pieces/${slug}/  (category: ${category}, order: ${order})`));
  const go = await ask(`Create it? ${c.dim('[Y/n]')}`, 'y');
  if (!/^y/i.test(go)) { console.log('Cancelled.'); closeIO(); return; }

  await fs.mkdir(pieceDir, { recursive: true });

  // Optimise the hero to webp (downscale only; never upscale).
  await sharp(heroSrc).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(pieceDir, 'hero.webp'));

  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `category: ${category}`,
    `order: ${order}`,
    'draft: false',
    'hero: "./hero.webp"',
  ];
  if (pdfSrc) {
    await fs.copyFile(pdfSrc, path.join(pieceDir, 'source.pdf'));
    const pages = pdfPages.split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isInteger(x) && x > 0);
    fm.push(`pdfPaginate: [${(pages.length ? pages : [1]).join(', ')}]`);
    fm.push(`fullPdf: "/source-pdfs/${slug}.pdf"`);
  }
  fm.push(block('context', context), block('role', role), block('outcome', outcome), '---', '');
  await fs.writeFile(path.join(pieceDir, 'index.md'), fm.join('\n'), 'utf8');

  // Move the consumed intake files aside so the next drop starts clean.
  const usedFiles = [heroSrc, pdfSrc].filter(Boolean).filter((f) => f.startsWith(INTAKE_DIR));
  if (usedFiles.length) {
    const archive = path.join(INTAKE_DIR, '.processed', slug);
    await fs.mkdir(archive, { recursive: true });
    for (const f of usedFiles) { try { await fs.rename(f, path.join(archive, path.basename(f))); } catch {} }
  }

  console.log(c.g(`\n✓ Created src/content/pieces/${slug}/`));
  console.log(`  • hero.webp  ${c.dim('(optimised cover)')}`);
  if (pdfSrc) console.log(`  • source.pdf ${c.dim('(deck — pages ' + (pdfPages || '1') + ' render on the detail page)')}`);
  console.log(`  • index.md   ${c.dim('(edit any text here later)')}`);
  console.log(`\nIt appears in the ${c.b(category)} gallery at ${c.b('/' + category)}.`);
  console.log(c.dim('\nNext: `npm run dev` to preview, then commit + push to publish.\n'));
  closeIO();
}

main().catch((err) => { console.error(c.y('\nSomething went wrong:'), err.message); closeIO(); process.exit(1); });
