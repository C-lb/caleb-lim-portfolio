# Local Portfolio Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Caleb a local, drag-and-drop web tool to add a portfolio piece (cover + gallery images + optional PDF) and publish it live with one click, started by a single command.

**Architecture:** A standalone local Express server (`scripts/studio`) serves a drag-and-drop UI and a small JSON/multipart API. It spawns the Astro dev server for live preview and opens the browser. All file-writing goes through one shared core (`scripts/lib/createPiece.mjs`); PDF rasterization is a shared lib (`scripts/lib/pdf-thumbs.mjs`) used by both the build and the studio. The studio is a separate process, never part of the static build, so its endpoints cannot ship to production.

**Tech Stack:** Node 24 (ESM), Astro 5 content collections, `sharp` (image opt), `pdfjs-dist` + `@napi-rs/canvas` factory (PDF raster), `gray-matter`, `express` + `multer` (devDependencies), `node:test` for tests.

## Global Constraints

- ESM only; the repo is `"type": "module"`. All new scripts are `.mjs`.
- Categories are exactly: `design`, `finance`, `personal`, `saas` (from `src/content/categories`).
- Cover and gallery images are optimized with: `sharp(src).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 })`.
- PDF thumbnails for published pieces are produced ONLY by the shared `rasterizePiece` (q80, long-edge 1600, render scale 2.0) so dev preview and production are byte-identical.
- `fullPdf` frontmatter MUST equal `/source-pdfs/<slug>.pdf`; `copySourcePdf` enforces this and throws otherwise.
- No em dashes or en dashes in any written content: normalize `—` and `–` to `-` (`/[—–]/g`).
- `express` and `multer` are devDependencies and MUST NOT be imported anywhere under `src/` (the static build must never pull them in).
- Studio server binds to `127.0.0.1` only. Dev server is `:4321`, studio is `:4322`.
- Temp/staging artifacts live under `os.tmpdir()`, never under a git-tracked path, so `git add -A` at publish never sweeps them.
- Do not break `npm run build` or `scripts/verify-build.sh`.
- Test runner: `node --test`. Tests live in `tests/` as `*.test.mjs`, use `node:test` + `node:assert/strict`, generate their own fixtures (no committed binaries), and clean up after themselves.

## File Structure

New:
- `scripts/lib/pdf-thumbs.mjs` — PDF raster lib: `rasterizePiece`, `copySourcePdf`, `canonicalFullPdfHref`, `rasterizeAllPages` (preview).
- `scripts/lib/createPiece.mjs` — single source of truth for writing a piece to disk.
- `scripts/studio/app.mjs` — `createApp({ repoRoot })` returns the Express app (no listen, no child process).
- `scripts/studio/git.mjs` — `uncommittedCount(cwd)`, `publish({ cwd, message })`.
- `scripts/studio/server.mjs` — listen on :4322, spawn `astro dev`, open browser, clean shutdown.
- `scripts/studio/ui/index.html`, `scripts/studio/ui/studio.css`, `scripts/studio/ui/studio.js` — the studio page.
- `tests/createPiece.test.mjs`, `tests/pdf-thumbs.test.mjs`, `tests/studio-app.test.mjs`, `tests/studio-git.test.mjs`.

Modified:
- `scripts/pdf-preprocess.mjs` — import the rasterizer from the lib instead of defining it inline.
- `scripts/new-piece.mjs` — collect inputs, then delegate writing to `createPiece`.
- `src/content/config.ts` — add the `gallery` field.
- `src/pages/[category]/[slug].astro` — render the gallery section.
- `package.json` — add `"studio"` and `"test"` scripts; add `express`, `multer` devDependencies.

---

### Task 1: Extract the PDF rasterizer into a shared lib

**Files:**
- Create: `scripts/lib/pdf-thumbs.mjs`
- Modify: `scripts/pdf-preprocess.mjs` (replace inline raster functions with imports)
- Test: `tests/pdf-thumbs.test.mjs`

**Interfaces:**
- Consumes: nothing (pure refactor of existing code).
- Produces:
  - `rasterizePiece({ slug, sourcePdfPath, pdfPaginate, fullPdf }) -> Promise<{ inputHash, generatedAt, pages: Array<{n,w,h,bytes,file}> }>`
  - `copySourcePdf(slug, sourcePdfPath, fullPdf) -> Promise<void>`
  - `canonicalFullPdfHref(slug) -> string` (`/source-pdfs/<slug>.pdf`)
  - `OUTPUT_DIR`, `SOURCE_PDF_DIR` (resolved absolute paths)

- [ ] **Step 1: Write the failing test**

Create `tests/pdf-thumbs.test.mjs`. It builds a 2-page PDF with `pdf-lib` (already a devDependency), rasterizes it via the lib, and asserts the cover + page outputs and the cache sidecar exist.

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/pdf-thumbs.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/lib/pdf-thumbs.mjs'`.

- [ ] **Step 3: Create the lib by moving code out of `pdf-preprocess.mjs`**

Create `scripts/lib/pdf-thumbs.mjs` with the constants and functions currently inline in `pdf-preprocess.mjs` (verbatim move — same constants, same logic), plus exports. Note `OUTPUT_DIR`/`SOURCE_PDF_DIR` resolve relative to `process.cwd()`, which is the repo root when run by the build, the CLI, or the studio.

```js
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
```

- [ ] **Step 4: Rewire `scripts/pdf-preprocess.mjs` to import from the lib**

Replace the top imports and delete the moved code. Keep `PIECES_DIR`, `discoverPieces`, and `main` in place. The new top of the file:

```js
// scripts/pdf-preprocess.mjs
// Build-time PDF rasterization. Discovers pieces with source.pdf and rasterizes
// via the shared lib (scripts/lib/pdf-thumbs.mjs) so the build and the studio
// produce identical output. Runs as the npm `prebuild` hook.
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { rasterizePiece } from './lib/pdf-thumbs.mjs';

const PIECES_DIR = path.resolve('src/content/pieces');
```

Delete from `pdf-preprocess.mjs`: the now-moved imports (`createHash`, `getDocument`, `sharp`), the constants (`OUTPUT_DIR`, `SOURCE_PDF_DIR`, `CMAP_URL`, `STANDARD_FONT_DATA_URL`, `RESIZE_LONG_EDGE`, `WEBP_QUALITY`, `RENDER_SCALE`, `PIPELINE_VERSION`), and the functions `canonicalFullPdfHref`, `hashInputs`, `copySourcePdf`, `rasterizePiece`. Keep `discoverPieces` and `main` exactly as they are (they already call `rasterizePiece(p)`).

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/pdf-thumbs.test.mjs`
Expected: PASS.

- [ ] **Step 6: Verify the build path is unchanged**

Run: `npm run pdf-preprocess`
Expected: prints `Found N pieces with source.pdf` then `DONE`, exit 0. Existing thumbs report `SKIP <slug> (cache hit)` (proving identical hashing/output).

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/pdf-thumbs.mjs scripts/pdf-preprocess.mjs tests/pdf-thumbs.test.mjs
git commit -m "refactor: extract PDF rasterizer into scripts/lib/pdf-thumbs.mjs"
```

---

### Task 2: `createPiece` core — text fields + cover image

**Files:**
- Create: `scripts/lib/createPiece.mjs`
- Test: `tests/createPiece.test.mjs`

**Interfaces:**
- Consumes: nothing yet (gallery + PDF added in Task 3).
- Produces:
  - `createPiece(input) -> Promise<{ slug, dir, warnings: string[] }>` where `input` is
    `{ title, category, role, outcome, context, year?, deliverables?, pullQuote?, draft?, heroPath, galleryPaths?, pdfPath?, pdfPages? }`.
  - `slugify(title) -> string`
  - `PIECES_DIR` (resolved absolute path to `src/content/pieces`)

- [ ] **Step 1: Write the failing tests**

Create `tests/createPiece.test.mjs`. Fixtures are generated with sharp (no committed binaries). Each test creates a piece in a unique category-less slug and removes it after.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import matter from 'gray-matter';
import sharp from 'sharp';
import { createPiece, PIECES_DIR } from '../scripts/lib/createPiece.mjs';

async function makeImage(file, color = { r: 200, g: 120, b: 40 }) {
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: color } })
    .png().toFile(file);
}

async function cleanup(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
}

test('creates a piece dir with optimized hero and valid frontmatter', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  let slug;
  try {
    const res = await createPiece({
      title: 'Studio Test Alpha',
      category: 'design',
      role: 'Did the thing',
      outcome: 'It worked',
      context: 'Some background',
      year: '2025',
      heroPath: hero,
    });
    slug = res.slug;
    assert.equal(slug, 'studio-test-alpha');
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'hero.webp')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.equal(data.title, 'Studio Test Alpha');
    assert.equal(data.category, 'design');
    assert.equal(data.hero, './hero.webp');
    assert.equal(data.year, '2025');
    assert.equal(data.draft, false);
    assert.equal(typeof data.order, 'number');
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('normalizes em and en dashes to hyphens in written text', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  let slug;
  try {
    const res = await createPiece({
      title: 'Dash Test',
      category: 'saas',
      role: 'A',
      outcome: 'Cut costs — a lot',
      context: 'Ran 2024–2025',
      heroPath: hero,
    });
    slug = res.slug;
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.ok(!/[—–]/.test(raw), 'no em/en dashes remain');
    assert.match(raw, /Cut costs - a lot/);
    assert.match(raw, /Ran 2024-2025/);
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('suffixes slug on collision', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  const slugs = [];
  try {
    const a = await createPiece({ title: 'Collide', category: 'design', role: 'r', outcome: 'o', context: 'c', heroPath: hero });
    const b = await createPiece({ title: 'Collide', category: 'design', role: 'r', outcome: 'o', context: 'c', heroPath: hero });
    slugs.push(a.slug, b.slug);
    assert.equal(a.slug, 'collide');
    assert.equal(b.slug, 'collide-2');
  } finally {
    for (const s of slugs) await cleanup(s);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('rejects an unknown category', async () => {
  await assert.rejects(
    () => createPiece({ title: 'X', category: 'nope', role: 'r', outcome: 'o', context: 'c', heroPath: '/x' }),
    /category/i
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/createPiece.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/lib/createPiece.mjs'`.

- [ ] **Step 3: Implement `createPiece` (text + cover only)**

Create `scripts/lib/createPiece.mjs`:

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/createPiece.test.mjs`
Expected: PASS (all four tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/createPiece.mjs tests/createPiece.test.mjs
git commit -m "feat: createPiece core (text + cover) with atomic write and dash normalization"
```

---

### Task 3: `createPiece` — gallery images + PDF

**Files:**
- Modify: `scripts/lib/createPiece.mjs` (replace the three stubs)
- Test: `tests/createPiece.test.mjs` (add two tests)

**Interfaces:**
- Consumes: `rasterizePiece`, `copySourcePdf`, `canonicalFullPdfHref` from `scripts/lib/pdf-thumbs.mjs` (Task 1).
- Produces: same `createPiece` signature; now honors `galleryPaths` and `pdfPath`/`pdfPages`.

- [ ] **Step 1: Write the failing tests (append to `tests/createPiece.test.mjs`)**

```js
import { rasterizePiece as _r } from '../scripts/lib/pdf-thumbs.mjs'; // ensures lib present
import { PDFDocument } from 'pdf-lib';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';

test('writes ordered gallery images', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  const g1 = path.join(tmp, 'a.png');
  const g2 = path.join(tmp, 'b.png');
  await makeImage(hero); await makeImage(g1, { r: 10, g: 90, b: 200 }); await makeImage(g2, { r: 20, g: 200, b: 90 });
  let slug;
  try {
    const res = await createPiece({
      title: 'Gallery Piece', category: 'design', role: 'r', outcome: 'o', context: 'c',
      heroPath: hero, galleryPaths: [g1, g2],
    });
    slug = res.slug;
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'gallery-01.webp')));
    await assert.doesNotReject(fs.access(path.join(dir, 'gallery-02.webp')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.deepEqual(data.gallery, ['./gallery-01.webp', './gallery-02.webp']);
  } finally {
    if (slug) await cleanup(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('attaches a PDF: source.pdf, pdfPaginate, fullPdf, and rasterized thumbs', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cp-'));
  const hero = path.join(tmp, 'cover.png');
  await makeImage(hero);
  const pdfPath = path.join(tmp, 'deck.pdf');
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
  await fs.writeFile(pdfPath, await doc.save());
  let slug;
  try {
    const res = await createPiece({
      title: 'Deck Piece', category: 'finance', role: 'r', outcome: 'o', context: 'c',
      heroPath: hero, pdfPath, pdfPages: [2, 3],
    });
    slug = res.slug;
    const dir = path.join(PIECES_DIR, slug);
    await assert.doesNotReject(fs.access(path.join(dir, 'source.pdf')));
    const { data } = matter(await fs.readFile(path.join(dir, 'index.md'), 'utf8'));
    assert.deepEqual(data.pdfPaginate, [2, 3]);
    assert.equal(data.fullPdf, `/source-pdfs/${slug}.pdf`);
    await assert.doesNotReject(fs.access(path.join(OUTPUT_DIR, slug, 'cover.webp')));
    await assert.doesNotReject(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)));
  } finally {
    if (slug) {
      await cleanup(slug);
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `node --test tests/createPiece.test.mjs`
Expected: the two new tests FAIL (gallery files absent; pdf fields absent) because the stubs are no-ops.

- [ ] **Step 3: Replace the three stubs in `scripts/lib/createPiece.mjs`**

Add the import at the top (below the existing imports):

```js
import { rasterizePiece, copySourcePdf, canonicalFullPdfHref } from './pdf-thumbs.mjs';
```

Replace the three stub functions at the bottom with real implementations:

```js
async function writeGallery(tmpDir, galleryPaths) {
  const names = [];
  for (let i = 0; i < galleryPaths.length; i++) {
    const name = `gallery-${String(i + 1).padStart(2, '0')}.webp`;
    await sharp(galleryPaths[i]).rotate().resize(HERO_OPTS).webp({ quality: 82 })
      .toFile(path.join(tmpDir, name));
    names.push(name);
  }
  return names;
}

async function attachPdf({ fm, tmpDir, slug, pdfPath, pdfPages, warnings }) {
  if (!pdfPath || !(await exists(pdfPath))) return;
  await fs.copyFile(pdfPath, path.join(tmpDir, 'source.pdf'));
  const pages = (pdfPages ?? []).map(Number).filter((x) => Number.isInteger(x) && x > 0);
  fm.push(`pdfPaginate: [${(pages.length ? pages : [1]).join(', ')}]`);
  fm.push(`fullPdf: ${JSON.stringify(canonicalFullPdfHref(slug))}`);
  if (!pages.length) warnings.push('No PDF pages selected; defaulted to page 1.');
}

async function rasterizeIfPdf({ slug, finalDir, pdfPath, pdfPages, warnings }) {
  if (!pdfPath) return;
  const sourcePdfPath = path.join(finalDir, 'source.pdf');
  const pages = (pdfPages ?? []).map(Number).filter((x) => Number.isInteger(x) && x > 0);
  try {
    await rasterizePiece({
      slug, sourcePdfPath,
      pdfPaginate: pages.length ? pages : [1],
      fullPdf: canonicalFullPdfHref(slug),
    });
  } catch (err) {
    warnings.push(`PDF thumbnails could not be generated now (${err.message}); the build will retry.`);
  }
}
```

Note: `attachPdf` is called before the frontmatter `context/role/outcome` blocks are pushed (it only appends `pdfPaginate`/`fullPdf`), and `rasterizeIfPdf` runs after the atomic move so it reads the final `source.pdf`. A raster failure is a warning, not a hard error — the prebuild regenerates thumbs at build time.

- [ ] **Step 4: Run all createPiece tests to verify they pass**

Run: `node --test tests/createPiece.test.mjs`
Expected: PASS (all six tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/createPiece.mjs tests/createPiece.test.mjs
git commit -m "feat: createPiece gallery images + PDF rasterization"
```

---

### Task 4: Refactor `new-piece.mjs` to delegate to `createPiece`

**Files:**
- Modify: `scripts/new-piece.mjs` (replace the inline write block with a `createPiece` call)

**Interfaces:**
- Consumes: `createPiece` from `scripts/lib/createPiece.mjs`.
- Produces: no new exports; the CLI behavior is unchanged from the user's perspective.

- [ ] **Step 1: Replace the import block and the write logic**

At the top of `scripts/new-piece.mjs`, add:

```js
import { createPiece } from './lib/createPiece.mjs';
```

Remove the now-duplicated helpers that `createPiece` owns: `slugify`, `nextOrder`, and `block`. Keep `exists`, `listIntake`, `resolveFile`, `ask`/`askRequired`, and the IO helpers (the CLI still discovers intake files and prompts).

Replace everything from the slug/order computation through the file-writing block (current lines ~148–188, from `// Unique slug.` down to the end of the intake-archive block) with:

```js
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
```

Keep the existing `main()` structure, the intake discovery, and the prompts above this block intact.

- [ ] **Step 2: Verify the CLI still creates a piece (scripted smoke)**

Generate a fixture image, run the CLI with piped answers, and assert the piece was created, then clean up.

Run:
```bash
node -e "require('sharp')({create:{width:1000,height:700,channels:3,background:{r:120,g:120,b:120}}}).png().toFile('intake/_smoke.png').then(()=>console.log('fixture ready'))"
printf 'CLI Smoke Piece\ndesign\nmy role\nmy outcome\nmy context\ny\nn\ny\n' | node scripts/new-piece.mjs
```
Expected: ends with `✓ Created src/content/pieces/cli-smoke-piece/`. Verify:
```bash
test -f src/content/pieces/cli-smoke-piece/hero.webp && test -f src/content/pieces/cli-smoke-piece/index.md && echo OK
```
Expected: `OK`.

- [ ] **Step 3: Clean up the smoke artifacts**

```bash
rm -rf src/content/pieces/cli-smoke-piece intake/.processed/cli-smoke-piece intake/_smoke.png
```
Expected: no error.

- [ ] **Step 4: Commit**

```bash
git add scripts/new-piece.mjs
git commit -m "refactor: new-piece CLI delegates writing to createPiece"
```

---

### Task 5: Gallery support on the piece page (schema + rendering)

**Files:**
- Modify: `src/content/config.ts` (add the `gallery` field)
- Modify: `src/pages/[category]/[slug].astro` (destructure + render gallery)
- Test: `tests/gallery-render.test.mjs`

**Interfaces:**
- Consumes: `createPiece` (to build a fixture piece for the render test).
- Produces: a `gallery` frontmatter field; a `.gallery` section on the detail page.

- [ ] **Step 1: Write the failing test**

Create `tests/gallery-render.test.mjs`. It builds a fixture piece with two gallery images, runs `astro build`, and asserts the built HTML references both gallery images. (Build-based because the gallery is rendered by Astro.)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { createPiece, PIECES_DIR } from '../scripts/lib/createPiece.mjs';
const run = promisify(execFile);

test('gallery images render on the piece page', { timeout: 180000 }, async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'gr-'));
  const mk = async (f, c) => sharp({ create: { width: 1000, height: 700, channels: 3, background: c } }).png().toFile(f);
  const hero = path.join(tmp, 'h.png'), a = path.join(tmp, 'a.png'), b = path.join(tmp, 'b.png');
  await mk(hero, { r: 50, g: 50, b: 50 }); await mk(a, { r: 200, g: 30, b: 30 }); await mk(b, { r: 30, g: 30, b: 200 });
  let slug;
  try {
    ({ slug } = await createPiece({
      title: 'Render Gallery Test', category: 'design', role: 'r', outcome: 'o', context: 'c',
      heroPath: hero, galleryPaths: [a, b],
    }));
    await run('npx', ['astro', 'build'], { cwd: process.cwd() });
    const html = await fs.readFile(path.join('dist', 'design', slug, 'index.html'), 'utf8');
    const matches = html.match(/gallery-0\d\.\w+/g) || [];
    assert.ok(matches.length >= 2, `expected >=2 gallery refs, got ${matches.length}`);
  } finally {
    if (slug) await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/gallery-render.test.mjs`
Expected: FAIL — the build succeeds but no `gallery-0N` refs are in the HTML (gallery not rendered yet), or the schema rejects the `gallery` field.

- [ ] **Step 3: Add the `gallery` field to the schema**

In `src/content/config.ts`, add immediately after the `hero: image(),` line:

```ts
    gallery: z.array(image()).optional()
      .describe('Ordered gallery images shown on the piece page, colocated as ./gallery-NN.webp in display order.'),
```

- [ ] **Step 4: Render the gallery on the detail page**

In `src/pages/[category]/[slug].astro`, add `gallery` to the destructure on line 58:

```astro
const { title, hero, context, role, outcome, category, pdfPaginate, fullPdf, year, deliverables, pullQuote, gallery } = piece.data;
```

Insert this block between the closing `</section>` of `.outcome-band` and the `{/* PIECE-04 ... */}` paginated-pages comment:

```astro
    {/* Gallery: uploaded images, full-width stack, after the story, before PDF slides. */}
    {gallery && gallery.length > 0 && (
      <section class="gallery">
        {gallery.map((img, i) => (
          <Image
            src={img}
            alt={`${title} - image ${i + 1}`}
            class="gallery-img"
            loading="lazy"
            sizes="(max-width: 960px) 100vw, 960px"
          />
        ))}
      </section>
    )}
```

Add to the `<style>` block (next to `.paginated-pages`):

```css
  .gallery {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    margin-bottom: var(--sp-8);
  }
  .gallery-img {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/gallery-render.test.mjs`
Expected: PASS.

- [ ] **Step 6: Verify existing pieces still build (no regression)**

Run: `npm run build`
Expected: build succeeds; existing pieces (no `gallery` field) render unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/content/config.ts "src/pages/[category]/[slug].astro" tests/gallery-render.test.mjs
git commit -m "feat: gallery images on the piece page (schema + rendering)"
```

---

### Task 6: Studio API app — `/api/piece` and `/api/status`

**Files:**
- Create: `scripts/studio/app.mjs`
- Modify: `package.json` (add `express`, `multer` devDeps; add `"test"` script)
- Test: `tests/studio-app.test.mjs`

**Interfaces:**
- Consumes: `createPiece` (Task 2/3).
- Produces:
  - `createApp({ repoRoot }) -> express.Application`
  - `POST /api/piece` (multipart: `cover` [1], `gallery` [N], text fields, optional `pdfStagingId` + `pdfPages` JSON) → `{ slug, category, previewUrl, warnings }`
  - `GET /api/status` → `{ uncommitted: number }`

- [ ] **Step 1: Add dependencies and the test script**

```bash
npm install --save-dev express multer
```
Then in `package.json` add to `"scripts"`: `"test": "node --test"`.
Expected: `express` and `multer` appear under `devDependencies`.

- [ ] **Step 2: Write the failing test**

Create `tests/studio-app.test.mjs`. It starts the app on an ephemeral port and posts a piece using the global `FormData`/`Blob`/`fetch`.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createApp } from '../scripts/studio/app.mjs';
import { PIECES_DIR } from '../scripts/lib/createPiece.mjs';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
async function pngBlob(color) {
  const buf = await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).png().toBuffer();
  return new Blob([buf], { type: 'image/png' });
}

test('POST /api/piece creates a piece and returns a preview URL', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  let slug;
  try {
    const fd = new FormData();
    fd.set('title', 'Api Piece One');
    fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('cover', await pngBlob({ r: 100, g: 100, b: 100 }), 'cover.png');
    fd.append('gallery', await pngBlob({ r: 200, g: 20, b: 20 }), 'a.png');
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: fd });
    assert.equal(res.status, 200);
    const json = await res.json();
    slug = json.slug;
    assert.equal(slug, 'api-piece-one');
    assert.equal(json.previewUrl, `http://localhost:4321/design/${slug}`);
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'gallery-01.webp')));
  } finally {
    if (slug) await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
    server.close();
  }
});

test('POST /api/piece 400s when a required field is missing', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  try {
    const fd = new FormData();
    fd.set('title', 'No Cover');
    fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: fd });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test tests/studio-app.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/studio/app.mjs'`.

- [ ] **Step 4: Implement `scripts/studio/app.mjs`**

```js
// scripts/studio/app.mjs
// Express app for the local studio. No listen() here — server.mjs owns the process.
import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createPiece } from '../lib/createPiece.mjs';
import { uncommittedCount } from './git.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, 'ui');
const DEV_PREVIEW_ORIGIN = 'http://localhost:4321';

export function createApp({ repoRoot = process.cwd() } = {}) {
  const app = express();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, os.tmpdir()),
      filename: (_req, file, cb) => cb(null, `studio-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  app.use(express.json());

  app.post('/api/piece', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'gallery' }]), async (req, res) => {
    const tempPaths = [];
    try {
      const b = req.body;
      const cover = req.files?.cover?.[0];
      if (!cover) return res.status(400).json({ error: 'Cover image is required.' });
      const galleryFiles = req.files?.gallery ?? [];
      for (const f of [cover, ...galleryFiles]) tempPaths.push(f.path);

      const pdfPath = b.pdfStagingId ? stagingPdfPath(b.pdfStagingId) : null;
      const pdfPages = parseJsonArray(b.pdfPages);
      const deliverables = parseJsonArray(b.deliverables).map(String).filter(Boolean);

      const { slug, category, warnings } = await createPiece({
        title: b.title, category: b.category, role: b.role, outcome: b.outcome, context: b.context,
        year: b.year || undefined, deliverables: deliverables.length ? deliverables : undefined,
        pullQuote: b.pullQuote || undefined, draft: b.draft === 'true',
        heroPath: cover.path, galleryPaths: galleryFiles.map((f) => f.path),
        pdfPath, pdfPages,
      }).then((r) => ({ ...r, category: b.category }));

      if (pdfPath) await cleanupStaging(b.pdfStagingId);
      res.json({ slug, category, previewUrl: `${DEV_PREVIEW_ORIGIN}/${category}/${slug}`, warnings });
    } catch (err) {
      const status = /required|category|not found/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message });
    } finally {
      for (const p of tempPaths) fs.rm(p, { force: true }).catch(() => {});
    }
  });

  app.get('/api/status', async (_req, res) => {
    try { res.json({ uncommitted: await uncommittedCount(repoRoot) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.use(express.static(UI_DIR));
  return app;
}

export function stagingDir(id) { return path.join(os.tmpdir(), `studio-pdf-${sanitizeId(id)}`); }
export function stagingPdfPath(id) { return path.join(stagingDir(id), 'source.pdf'); }
async function cleanupStaging(id) { await fs.rm(stagingDir(id), { recursive: true, force: true }); }
function sanitizeId(id) { return String(id).replace(/[^a-zA-Z0-9_-]/g, ''); }
function parseJsonArray(s) { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }
```

Note: this task references `./git.mjs` (`uncommittedCount`) and the staging helpers used by the PDF preview (Task 7). Create a minimal `scripts/studio/git.mjs` now so the import resolves; Task 8 fills in `publish`:

```js
// scripts/studio/git.mjs
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

export async function uncommittedCount(cwd = process.cwd()) {
  const { stdout } = await run('git', ['status', '--porcelain'], { cwd });
  return stdout.split('\n').filter((l) => l.trim()).length;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/studio-app.test.mjs`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/studio/app.mjs scripts/studio/git.mjs tests/studio-app.test.mjs package.json package-lock.json
git commit -m "feat: studio API app with /api/piece and /api/status"
```

---

### Task 7: Studio API — PDF preview and page selection

**Files:**
- Modify: `scripts/lib/pdf-thumbs.mjs` (add `rasterizeAllPages`)
- Modify: `scripts/studio/app.mjs` (add `/api/pdf/preview` + thumbnail serving)
- Test: `tests/studio-app.test.mjs` (add a test)

**Interfaces:**
- Consumes: `rasterizeAllPages(pdfPath, outDir, opts) -> Promise<Array<{ n, file, w, h }>>`.
- Produces:
  - `POST /api/pdf/preview` (multipart `pdf`) → `{ stagingId, pageCount, thumbs: Array<{ n, url }> }`
  - `GET /api/pdf/preview/:id/:file` serves a staged thumbnail.
  - `/api/piece` already consumes `pdfStagingId` + `pdfPages` (wired in Task 6).

- [ ] **Step 1: Write the failing test (append to `tests/studio-app.test.mjs`)**

```js
import { PDFDocument } from 'pdf-lib';

test('POST /api/pdf/preview returns page thumbnails; piece can use them', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  let slug;
  try {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 3; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
    const pdfBuf = Buffer.from(await doc.save());

    const fd = new FormData();
    fd.set('pdf', new Blob([pdfBuf], { type: 'application/pdf' }), 'deck.pdf');
    const pre = await fetch(`http://127.0.0.1:${port}/api/pdf/preview`, { method: 'POST', body: fd });
    assert.equal(pre.status, 200);
    const { stagingId, pageCount, thumbs } = await pre.json();
    assert.equal(pageCount, 3);
    assert.equal(thumbs.length, 3);
    const thumbRes = await fetch(`http://127.0.0.1:${port}${thumbs[0].url}`);
    assert.equal(thumbRes.status, 200);

    const pf = new FormData();
    pf.set('title', 'Preview Piece'); pf.set('category', 'finance');
    pf.set('role', 'r'); pf.set('outcome', 'o'); pf.set('context', 'c');
    pf.set('cover', await pngBlob({ r: 9, g: 9, b: 9 }), 'cover.png');
    pf.set('pdfStagingId', stagingId);
    pf.set('pdfPages', JSON.stringify([2, 3]));
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: pf });
    assert.equal(res.status, 200);
    ({ slug } = await res.json());
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'source.pdf')));
  } finally {
    if (slug) {
      await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
      const { OUTPUT_DIR, SOURCE_PDF_DIR } = await import('../scripts/lib/pdf-thumbs.mjs');
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    server.close();
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/studio-app.test.mjs`
Expected: the new test FAILs (404 on `/api/pdf/preview`).

- [ ] **Step 3: Add `rasterizeAllPages` to `scripts/lib/pdf-thumbs.mjs`**

Append:

```js
// Preview-only: render every page to webp thumbnails in an arbitrary out dir.
// Lower quality/size than rasterizePiece — these are throwaway picker thumbnails.
export async function rasterizeAllPages(pdfPath, outDir, { longEdge = 1400, quality = 68 } = {}) {
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const doc = await getDocument({
    data, cMapUrl: CMAP_URL, cMapPacked: true, standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;
  await fs.mkdir(outDir, { recursive: true });
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const cf = doc.canvasFactory;
    const ctx = cf.create(viewport.width, viewport.height);
    await page.render({ canvasContext: ctx.context, viewport }).promise;
    const png = ctx.canvas.toBuffer('image/png');
    page.cleanup();
    const webp = await sharp(png)
      .resize({ width: longEdge, height: longEdge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality }).toBuffer();
    const file = `page-${n}.webp`;
    await fs.writeFile(path.join(outDir, file), webp);
    const meta = await sharp(webp).metadata();
    pages.push({ n, file, w: meta.width, h: meta.height });
  }
  await doc.cleanup();
  return pages;
}
```

- [ ] **Step 4: Add the preview routes to `scripts/studio/app.mjs`**

Add the import:

```js
import { rasterizeAllPages } from '../lib/pdf-thumbs.mjs';
import crypto from 'node:crypto';
```

Add these routes inside `createApp`, before `app.use(express.static(UI_DIR))`:

```js
  app.post('/api/pdf/preview', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });
      const stagingId = crypto.randomUUID();
      const dir = stagingDir(stagingId);
      await fs.mkdir(dir, { recursive: true });
      await fs.rename(req.file.path, path.join(dir, 'source.pdf'));
      const pages = await rasterizeAllPages(path.join(dir, 'source.pdf'), path.join(dir, 'thumbs'));
      res.json({
        stagingId,
        pageCount: pages.length,
        thumbs: pages.map((p) => ({ n: p.n, w: p.w, h: p.h, url: `/api/pdf/preview/${stagingId}/${p.file}` })),
      });
    } catch (err) {
      res.status(500).json({ error: `Could not read that PDF: ${err.message}` });
    }
  });

  app.get('/api/pdf/preview/:id/:file', async (req, res) => {
    const file = path.basename(req.params.file);
    const fp = path.join(stagingDir(req.params.id), 'thumbs', file);
    try { res.type('image/webp').send(await fs.readFile(fp)); }
    catch { res.status(404).end(); }
  });
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test tests/studio-app.test.mjs`
Expected: PASS (all three tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/pdf-thumbs.mjs scripts/studio/app.mjs tests/studio-app.test.mjs
git commit -m "feat: studio PDF preview + visual page selection"
```

---

### Task 8: Studio API — publish (git commit + push)

**Files:**
- Modify: `scripts/studio/git.mjs` (add `publish`)
- Modify: `scripts/studio/app.mjs` (add `POST /api/publish`)
- Test: `tests/studio-git.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `publish({ cwd, message }) -> Promise<{ committed: boolean, branch: string, pushed: boolean, detail: string }>`
  - `POST /api/publish` body `{ title }` → publish result JSON, or `{ error }` with a friendly message.

- [ ] **Step 1: Write the failing test**

Create `tests/studio-git.test.mjs`. It builds a throwaway repo with a bare remote, so the push is real but local-only.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { publish } from '../scripts/studio/git.mjs';
const run = promisify(execFile);

async function setupRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gitpub-'));
  const repo = path.join(root, 'work');
  const remote = path.join(root, 'remote.git');
  await fs.mkdir(repo, { recursive: true });
  await run('git', ['init', '--bare', remote]);
  await run('git', ['init', '-b', 'main', repo]);
  await run('git', ['config', 'user.email', 't@t.test'], { cwd: repo });
  await run('git', ['config', 'user.name', 'Test'], { cwd: repo });
  await fs.writeFile(path.join(repo, 'seed.txt'), 'seed');
  await run('git', ['add', '-A'], { cwd: repo });
  await run('git', ['commit', '-m', 'seed'], { cwd: repo });
  await run('git', ['remote', 'add', 'origin', remote], { cwd: repo });
  await run('git', ['push', '-u', 'origin', 'main'], { cwd: repo });
  return { root, repo };
}

test('publish commits and pushes new work', async () => {
  const { root, repo } = await setupRepo();
  try {
    await fs.writeFile(path.join(repo, 'new.txt'), 'hello');
    const r = await publish({ cwd: repo, message: 'Add piece: Foo' });
    assert.equal(r.committed, true);
    assert.equal(r.pushed, true);
    assert.equal(r.branch, 'main');
    const { stdout } = await run('git', ['log', '--oneline'], { cwd: repo });
    assert.match(stdout, /Add piece: Foo/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('publish reports nothing to commit', async () => {
  const { root, repo } = await setupRepo();
  try {
    const r = await publish({ cwd: repo, message: 'noop' });
    assert.equal(r.committed, false);
    assert.match(r.detail, /nothing to (commit|publish)/i);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/studio-git.test.mjs`
Expected: FAIL — `publish` is not exported.

- [ ] **Step 3: Implement `publish` in `scripts/studio/git.mjs`**

Append:

```js
async function currentBranch(cwd) {
  const { stdout } = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  return stdout.trim();
}

export async function publish({ cwd = process.cwd(), message }) {
  const branch = await currentBranch(cwd);
  if ((await uncommittedCount(cwd)) === 0) {
    return { committed: false, branch, pushed: false, detail: 'Nothing to publish (no changes).' };
  }
  await run('git', ['add', '-A'], { cwd });
  await run('git', ['commit', '-m', message], { cwd });
  try {
    await run('git', ['push', 'origin', branch], { cwd });
    return { committed: true, branch, pushed: true, detail: `Pushed ${branch}. Live in ~1 min.` };
  } catch (err) {
    const stderr = String(err.stderr || err.message);
    let hint = stderr;
    if (/\[rejected\]|non-fast-forward|fetch first/i.test(stderr)) {
      hint = `${branch} has moved on the remote. Pull and resolve before publishing again (your commit is saved locally).`;
    } else if (/could not read|authentication|permission|Could not resolve host/i.test(stderr)) {
      hint = `Push failed (network or auth). Your commit is saved locally; retry Publish when connected.\n${stderr}`;
    }
    return { committed: true, branch, pushed: false, detail: hint };
  }
}
```

- [ ] **Step 4: Add `POST /api/publish` to `scripts/studio/app.mjs`**

Add the import:

```js
import { uncommittedCount, publish } from './git.mjs';
```
(Replace the existing `import { uncommittedCount } from './git.mjs';` line.)

Add the route before `app.use(express.static(UI_DIR))`:

```js
  app.post('/api/publish', async (req, res) => {
    try {
      const title = (req.body?.title || '').trim();
      const message = title ? `Add piece: ${title}` : 'Add portfolio piece';
      const result = await publish({ cwd: repoRoot, message });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/studio-git.test.mjs`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/studio/git.mjs scripts/studio/app.mjs tests/studio-git.test.mjs
git commit -m "feat: studio publish (commit + push current branch) with friendly errors"
```

---

### Task 9: Studio UI

**Files:**
- Create: `scripts/studio/ui/index.html`, `scripts/studio/ui/studio.css`, `scripts/studio/ui/studio.js`

**Interfaces:**
- Consumes: `POST /api/pdf/preview`, `POST /api/piece`, `POST /api/publish`, `GET /api/status`.
- Produces: the browser UI (no exports; verified in the browser).

- [ ] **Step 1: Create `scripts/studio/ui/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Portfolio Studio</title>
  <link rel="stylesheet" href="/studio.css" />
</head>
<body>
  <header class="bar">
    <span class="brand">Portfolio Studio</span>
    <span id="status" class="status"></span>
  </header>
  <main class="wrap">
    <form id="piece-form" class="card">
      <h2>New piece</h2>
      <label>Title <span class="req">*</span><input name="title" required /></label>
      <label>Category <span class="req">*</span>
        <select name="category" required>
          <option value="design">Graphic Design</option>
          <option value="finance">Financial Models</option>
          <option value="saas">SaaS</option>
          <option value="personal">Personal Projects</option>
        </select>
      </label>
      <label>Context <span class="req">*</span><textarea name="context" rows="3" required></textarea></label>
      <label>Role <span class="req">*</span><textarea name="role" rows="2" required></textarea></label>
      <label>Outcome <span class="req">*</span><textarea name="outcome" rows="2" required></textarea></label>
      <label>Year <input name="year" placeholder="2025" /></label>
      <label>Deliverables <input id="deliverables" placeholder="Logo system, Art direction (comma-separated)" /></label>
      <label>Pull quote <textarea name="pullQuote" rows="2"></textarea></label>
      <label class="check"><input type="checkbox" id="draft" /> Save as draft (hidden until ready)</label>

      <fieldset><legend>Cover <span class="req">*</span></legend>
        <div id="cover-drop" class="drop">Drag a cover image here, or click</div>
        <input id="cover-input" type="file" accept="image/*" hidden />
        <div id="cover-preview" class="preview"></div>
      </fieldset>

      <fieldset><legend>Gallery images</legend>
        <div id="gallery-drop" class="drop">Drag images here (drag tiles to reorder)</div>
        <input id="gallery-input" type="file" accept="image/*" multiple hidden />
        <div id="gallery-list" class="tiles"></div>
      </fieldset>

      <fieldset><legend>PDF deck</legend>
        <div id="pdf-drop" class="drop">Drag a PDF here, then click the pages to feature</div>
        <input id="pdf-input" type="file" accept="application/pdf" hidden />
        <div id="pdf-pages" class="tiles"></div>
      </fieldset>

      <button id="create" type="submit">Create piece</button>
      <p id="form-msg" class="msg"></p>
    </form>

    <section id="result" class="card hidden">
      <h2>Created</h2>
      <p><a id="preview-link" target="_blank" rel="noopener">Open preview</a></p>
      <p id="warnings" class="warn"></p>
      <button id="publish">Publish to live site</button>
      <p id="publish-msg" class="msg"></p>
    </section>
  </main>
  <script type="module" src="/studio.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `scripts/studio/ui/studio.css`**

```css
:root {
  --paper: #f2ebdb; --ink: #14110c; --muted: #6f685a; --line: #d8cfba;
  --accent: #b5662f; --card: #fbf7ee; --radius: 12px;
  font-family: "DM Sans", system-ui, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); }
.bar { display: flex; justify-content: space-between; align-items: center;
  padding: 14px 24px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--paper); }
.brand { font-weight: 700; letter-spacing: -0.01em; }
.status { color: var(--muted); font-size: 13px; }
.wrap { max-width: 720px; margin: 0 auto; padding: 24px; display: grid; gap: 20px; }
.card { background: var(--card); border-radius: var(--radius); padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 14px 30px -22px rgba(0,0,0,0.5); display: grid; gap: 14px; }
.card h2 { margin: 0 0 4px; font-size: 17px; }
label { display: grid; gap: 6px; font-size: 13px; color: var(--muted); }
label.check { grid-auto-flow: column; justify-content: start; align-items: center; gap: 8px; }
input, select, textarea { font: inherit; font-size: 15px; color: var(--ink);
  background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 9px 11px; }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
.req { color: var(--accent); }
fieldset { border: 1px solid var(--line); border-radius: 10px; padding: 12px; }
legend { font-size: 13px; color: var(--muted); padding: 0 6px; }
.drop { border: 1.5px dashed var(--line); border-radius: 8px; padding: 22px; text-align: center;
  color: var(--muted); cursor: pointer; font-size: 14px; }
.drop.over { border-color: var(--accent); color: var(--accent); background: rgba(181,102,47,0.05); }
.preview img, .tiles img { border-radius: 8px; display: block; }
.preview img { max-width: 220px; margin-top: 10px; }
.tiles { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
.tile { position: relative; width: 120px; cursor: grab; }
.tile img { width: 120px; height: 90px; object-fit: cover; border: 2px solid transparent; }
.tile.selected img { border-color: var(--accent); }
.tile .badge { position: absolute; top: 4px; left: 4px; background: var(--accent); color: #fff;
  font-size: 11px; padding: 1px 6px; border-radius: 999px; }
.tile .x { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff;
  border: 0; border-radius: 999px; width: 20px; height: 20px; cursor: pointer; }
button { font: inherit; font-weight: 600; font-size: 15px; color: #fff; background: var(--ink);
  border: 0; border-radius: 999px; padding: 11px 22px; cursor: pointer; justify-self: start; }
button:hover { background: var(--accent); }
button:disabled { opacity: 0.5; cursor: default; }
.msg { font-size: 14px; min-height: 18px; margin: 0; }
.msg.err { color: #b3261e; } .msg.ok { color: #2f7d32; }
.warn { color: #8a6d1a; font-size: 13px; }
.hidden { display: none; }
```

- [ ] **Step 3: Create `scripts/studio/ui/studio.js`**

```js
const $ = (s) => document.querySelector(s);
const state = { cover: null, gallery: [], pdf: { stagingId: null, thumbs: [], selected: [] } };

function wireDrop(dropId, inputId, onFiles, multiple) {
  const drop = $(dropId), input = $(inputId);
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => onFiles([...input.files]));
  ['dragover', 'dragenter'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (ev) => { ev.preventDefault(); onFiles([...ev.dataTransfer.files]); });
}

// Cover
wireDrop('#cover-drop', '#cover-input', (files) => {
  state.cover = files[0] || null;
  $('#cover-preview').innerHTML = state.cover ? `<img src="${URL.createObjectURL(state.cover)}" />` : '';
});

// Gallery (with drag-to-reorder)
wireDrop('#gallery-drop', '#gallery-input', (files) => {
  state.gallery.push(...files.filter((f) => f.type.startsWith('image/')));
  renderGallery();
}, true);

function renderGallery() {
  const list = $('#gallery-list');
  list.innerHTML = '';
  state.gallery.forEach((file, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile'; tile.draggable = true;
    tile.innerHTML = `<img src="${URL.createObjectURL(file)}" /><button type="button" class="x" data-i="${i}">×</button>`;
    tile.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
    tile.addEventListener('dragover', (e) => e.preventDefault());
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData('text/plain');
      const [m] = state.gallery.splice(from, 1);
      state.gallery.splice(i, 0, m);
      renderGallery();
    });
    tile.querySelector('.x').addEventListener('click', () => { state.gallery.splice(i, 1); renderGallery(); });
    list.appendChild(tile);
  });
}

// PDF preview + page selection
wireDrop('#pdf-drop', '#pdf-input', async (files) => {
  const pdf = files[0]; if (!pdf) return;
  $('#pdf-drop').textContent = 'Reading PDF…';
  const fd = new FormData(); fd.set('pdf', pdf);
  const res = await fetch('/api/pdf/preview', { method: 'POST', body: fd });
  if (!res.ok) { $('#pdf-drop').textContent = 'Could not read that PDF. Try another.'; return; }
  const data = await res.json();
  state.pdf = { stagingId: data.stagingId, thumbs: data.thumbs, selected: [] };
  $('#pdf-drop').textContent = `${data.pageCount} pages — click the ones to feature (in order)`;
  renderPdf();
});

function renderPdf() {
  const box = $('#pdf-pages'); box.innerHTML = '';
  state.pdf.thumbs.forEach((t) => {
    const tile = document.createElement('div');
    const rank = state.pdf.selected.indexOf(t.n);
    tile.className = 'tile' + (rank >= 0 ? ' selected' : '');
    tile.innerHTML = `<img src="${t.url}" />${rank >= 0 ? `<span class="badge">${rank + 1}</span>` : ''}`;
    tile.addEventListener('click', () => {
      const i = state.pdf.selected.indexOf(t.n);
      if (i >= 0) state.pdf.selected.splice(i, 1); else state.pdf.selected.push(t.n);
      renderPdf();
    });
    box.appendChild(tile);
  });
}

// Submit
$('#piece-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#form-msg'); msg.className = 'msg'; msg.textContent = '';
  if (!state.cover) { msg.classList.add('err'); msg.textContent = 'A cover image is required.'; return; }
  const f = e.target;
  const fd = new FormData();
  ['title', 'category', 'context', 'role', 'outcome', 'year', 'pullQuote'].forEach((k) => fd.set(k, f[k]?.value || ''));
  fd.set('draft', $('#draft').checked ? 'true' : 'false');
  fd.set('deliverables', JSON.stringify(($('#deliverables').value || '').split(',').map((s) => s.trim()).filter(Boolean)));
  fd.set('cover', state.cover, state.cover.name);
  state.gallery.forEach((g) => fd.append('gallery', g, g.name));
  if (state.pdf.stagingId && state.pdf.selected.length) {
    fd.set('pdfStagingId', state.pdf.stagingId);
    fd.set('pdfPages', JSON.stringify(state.pdf.selected));
  }
  $('#create').disabled = true; msg.textContent = 'Creating…';
  try {
    const res = await fetch('/api/piece', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    $('#preview-link').href = data.previewUrl;
    $('#warnings').textContent = (data.warnings || []).join(' ');
    $('#result').dataset.title = f.title.value;
    $('#result').classList.remove('hidden');
    msg.classList.add('ok'); msg.textContent = `Created ${data.slug}.`;
  } catch (err) {
    msg.classList.add('err'); msg.textContent = err.message;
  } finally { $('#create').disabled = false; refreshStatus(); }
});

// Publish
$('#publish').addEventListener('click', async () => {
  const m = $('#publish-msg'); m.className = 'msg'; m.textContent = 'Publishing…';
  $('#publish').disabled = true;
  try {
    const res = await fetch('/api/publish', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: $('#result').dataset.title || '' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    m.classList.add(data.pushed ? 'ok' : 'err'); m.textContent = data.detail;
  } catch (err) { m.classList.add('err'); m.textContent = err.message; }
  finally { $('#publish').disabled = false; refreshStatus(); }
});

async function refreshStatus() {
  try {
    const { uncommitted } = await (await fetch('/api/status')).json();
    $('#status').textContent = uncommitted ? `${uncommitted} change(s) ready to publish` : 'up to date';
  } catch { $('#status').textContent = ''; }
}
refreshStatus();
```

- [ ] **Step 4: Browser verification (manual)**

Start the API alone for this check:
```bash
node -e "import('./scripts/studio/app.mjs').then(m => m.createApp().listen(4322, '127.0.0.1', () => console.log('studio on 4322')))"
```
Then in the browser, load `http://127.0.0.1:4322`, fill the form, drop a cover + two gallery images and a PDF, click two PDF pages, and click **Create**. Confirm the success panel shows a preview link and the warnings line. Do NOT click Publish during this check. Then delete the throwaway piece it created:
```bash
git status --porcelain   # find the new src/content/pieces/<slug>/ and public artifacts
rm -rf src/content/pieces/<slug> public/generated/pdf-thumbs/<slug> public/source-pdfs/<slug>.pdf
```
Stop the node process (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add scripts/studio/ui
git commit -m "feat: studio drag-and-drop UI (cover, gallery reorder, PDF page picker, publish)"
```

---

### Task 10: One-command launcher + end-to-end smoke + docs

**Files:**
- Create: `scripts/studio/server.mjs`
- Modify: `package.json` (add `"studio"` script)
- Create: `tests/studio-smoke.test.mjs`
- Modify: `intake/README.md` (point to the studio)

**Interfaces:**
- Consumes: `createApp` (Task 6).
- Produces: the `npm run studio` entry point.

- [ ] **Step 1: Create `scripts/studio/server.mjs`**

```js
// scripts/studio/server.mjs
// One command: start the studio API (:4322), spawn `astro dev` (:4321) for live
// preview, open the browser, and shut both down cleanly on Ctrl-C.
import { spawn, execFile } from 'node:child_process';
import net from 'node:net';
import { createApp } from './app.mjs';

const STUDIO_PORT = 4322;
const DEV_PORT = 4321;
const repoRoot = process.cwd();

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1');
    s.on('connect', () => { s.end(); resolve(true); });
    s.on('error', () => resolve(false));
  });
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  execFile(cmd, [url], () => {});
}

let devChild = null;
async function main() {
  if (!(await portOpen(DEV_PORT))) {
    devChild = spawn('npm', ['run', 'dev'], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    devChild.stdout.on('data', (d) => process.stdout.write(`[dev] ${d}`));
    devChild.stderr.on('data', (d) => process.stderr.write(`[dev] ${d}`));
  } else {
    console.log(`[dev] already running on :${DEV_PORT}`);
  }

  const app = createApp({ repoRoot });
  app.listen(STUDIO_PORT, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${STUDIO_PORT}`;
    console.log(`\n  Portfolio Studio  ${url}\n  Live preview      http://localhost:${DEV_PORT}\n`);
    openBrowser(url);
  });
}

function shutdown() {
  if (devChild) devChild.kill('SIGINT');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
main();
```

- [ ] **Step 2: Add the `studio` script to `package.json`**

In `"scripts"` add: `"studio": "node scripts/studio/server.mjs"`.

- [ ] **Step 3: Write the end-to-end smoke test**

Create `tests/studio-smoke.test.mjs`. It boots the real app, posts a full piece (cover + gallery + PDF), asserts files exist, then confirms `astro build` still succeeds with the new piece present, and cleans up.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../scripts/studio/app.mjs';
import { PIECES_DIR } from '../scripts/lib/createPiece.mjs';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';
const run = promisify(execFile);

test('end-to-end: create via API, then astro build succeeds', { timeout: 240000 }, async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const port = server.address().port;
  const png = async (c) => new Blob([await sharp({ create: { width: 800, height: 600, channels: 3, background: c } }).png().toBuffer()], { type: 'image/png' });
  let slug;
  try {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 2; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
    const pre = new FormData();
    pre.set('pdf', new Blob([Buffer.from(await doc.save())], { type: 'application/pdf' }), 'd.pdf');
    const { stagingId } = await (await fetch(`http://127.0.0.1:${port}/api/pdf/preview`, { method: 'POST', body: pre })).json();

    const fd = new FormData();
    fd.set('title', 'Smoke E2E'); fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('cover', await png({ r: 30, g: 30, b: 30 }), 'c.png');
    fd.append('gallery', await png({ r: 200, g: 20, b: 20 }), 'g.png');
    fd.set('pdfStagingId', stagingId); fd.set('pdfPages', JSON.stringify([2]));
    const res = await fetch(`http://127.0.0.1:${port}/api/piece`, { method: 'POST', body: fd });
    ({ slug } = await res.json());
    assert.ok(slug);
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'gallery-01.webp')));
    await run('npx', ['astro', 'build'], { cwd: process.cwd() });
  } finally {
    if (slug) {
      await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
      await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
    }
    server.close();
  }
});
```

- [ ] **Step 4: Run the full test suite**

Run: `node --test`
Expected: all tests PASS (pdf-thumbs, createPiece, gallery-render, studio-app, studio-git, studio-smoke).

- [ ] **Step 5: Manual one-command check**

Run: `npm run studio`
Expected: logs `[dev]` lines, prints the Studio + Live preview URLs, and opens the browser to `http://127.0.0.1:4322`. Press Ctrl-C; confirm both the studio and the `[dev]` child exit (run `lsof -ti :4321 :4322` — expect no output).

- [ ] **Step 6: Update `intake/README.md`**

Replace its contents with a short pointer to the studio:

```markdown
# Adding work to the portfolio

The easiest way: run `npm run studio`. It opens a drag-and-drop page in your
browser where you add a piece (cover image, gallery images, optional PDF),
preview it, and publish it live with one button.

The terminal flow still works too: drop a cover image (and optional PDF) in this
folder, run `npm run new-piece`, and answer the prompts.
```

- [ ] **Step 7: Commit**

```bash
git add scripts/studio/server.mjs package.json tests/studio-smoke.test.mjs intake/README.md
git commit -m "feat: npm run studio one-command launcher + e2e smoke + docs"
```

---

## Self-Review

**Spec coverage:**
- One command starts studio + dev + browser → Task 10 (`server.mjs`, `studio` script).
- Shared `createPiece` core → Tasks 2, 3.
- Shared `pdf-thumbs` lib (extracted) → Task 1; preview renderer → Task 7.
- `/api/pdf/preview`, `/api/piece`, `/api/publish`, `/api/status` → Tasks 6, 7, 8.
- Drag-and-drop UI, gallery reorder, PDF page picker, draft toggle, all fields → Task 9.
- Gallery content-model change (schema + render, after outcome band) → Task 5.
- Atomic write + rollback, em/en-dash normalization, slug collision → Task 2; PDF temp/staging outside tracked paths → Tasks 3, 6, 7.
- Publish edge cases (nothing-to-commit, diverged, network/auth) → Task 8.
- Tests for createPiece, gallery render, API, git, e2e → Tasks 2, 3, 5, 6, 7, 8, 10.
- CLI kept working via the shared core → Task 4.
- devDeps never imported by `src/` → only `app.mjs`/`server.mjs` import express/multer; not referenced under `src/`.

**Placeholder scan:** No TBD/TODO. The Task 2 stubs (`writeGallery`, `attachPdf`, `rasterizeIfPdf`) are explicit, named, returning valid empty values, and are replaced with full code in Task 3 — not placeholders, a deliberate two-step so Task 2 ships a green test on its own.

**Type consistency:**
- `createPiece(input) -> { slug, dir, warnings }` consistent across Tasks 2, 3, 4, 6.
- `rasterizePiece({ slug, sourcePdfPath, pdfPaginate, fullPdf })` matches the original signature and Task 1's export; `createPiece` calls it with exactly those keys.
- `publish({ cwd, message }) -> { committed, branch, pushed, detail }` consistent between Task 8's lib and route and its test.
- Staging helpers `stagingDir(id)` / `stagingPdfPath(id)` defined in Task 6, used by Task 7.
- UI field names (`title, category, context, role, outcome, year, pullQuote, draft, deliverables, cover, gallery, pdfStagingId, pdfPages`) match the `/api/piece` handler in Tasks 6–7.

No gaps found.
