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
import { createPiece } from './lib/createPiece.mjs';

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

  console.log(c.dim(`\nWill create a piece in category ${category}.`));
  const go = await ask(`Create it? ${c.dim('[Y/n]')}`, 'y');
  if (!/^y/i.test(go)) { console.log('Cancelled.'); closeIO(); return; }

  let result;
  try {
    result = await createPiece({
      title, category, role, outcome, context,
      heroPath: heroSrc,
      pdfPath: pdfSrc || null,
      pdfPages: pdfPages ? pdfPages.split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isInteger(x) && x > 0) : [],
    });
  } catch (err) {
    console.log(c.y(`\n${err.message}`));
    closeIO();
    process.exit(1);
  }
  const { slug } = result;

  // Move the consumed intake files aside so the next drop starts clean.
  const usedFiles = [heroSrc, pdfSrc].filter(Boolean).filter((f) => f.startsWith(INTAKE_DIR));
  if (usedFiles.length) {
    const archive = path.join(INTAKE_DIR, '.processed', slug);
    await fs.mkdir(archive, { recursive: true });
    for (const f of usedFiles) { try { await fs.rename(f, path.join(archive, path.basename(f))); } catch {} }
  }
  for (const w of result.warnings) console.log(c.y(`  note: ${w}`));

  console.log(c.g(`\n✓ Created src/content/pieces/${slug}/`));
  console.log(`\nIt appears in the ${c.b(category)} gallery at ${c.b('/' + category)}.`);
  console.log(c.dim('\nNext: `npm run dev` to preview, then commit + push to publish.\n'));
  closeIO();
}

main().catch((err) => { console.error(c.y('\nSomething went wrong:'), err.message); closeIO(); process.exit(1); });
