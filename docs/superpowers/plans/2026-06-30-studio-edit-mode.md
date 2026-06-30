# Studio Edit Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full create-parity editing of existing portfolio pieces (text, cover, gallery, PDF) to the Local Portfolio Studio, with no delete.

**Architecture:** Extract a shared `pieceCore.mjs` (image optimization + frontmatter serialization) so create and update emit byte-identical output. Add `updatePiece.mjs` (`readPiece` + `updatePiece`) that builds the complete new piece directory in a repo-local temp dir, swaps it into place atomically, then reconciles `public/` PDF artifacts. Add read/update endpoints to the studio Express app and an "Edit existing" mode to the vanilla-JS UI.

**Tech Stack:** Node ESM (`.mjs`), `node:test`, `express`, `multer`, `gray-matter`, `sharp`, `pdfjs-dist` (via existing `pdf-thumbs.mjs`), `pdf-lib` (tests only).

## Global Constraints

- **Slug/URL is immutable.** Editing the title changes only frontmatter `title`, never the directory name (`src/content/pieces/<slug>/`) or the public URL (`/<category>/<slug>`).
- **Categories** are exactly `design`, `finance`, `personal`, `saas`.
- **Em/en dashes are stripped on write** (`dedash`) in every text field. This invariant must live in exactly one place (`buildFrontmatter`).
- **Create output must stay byte-identical** through the refactor — the existing `tests/createPiece.test.mjs`, `tests/gallery-render.test.mjs`, `tests/studio-app.test.mjs` must stay green.
- **Public PDF artifacts** live at `public/generated/pdf-thumbs/<slug>/` (`OUTPUT_DIR/<slug>`) and `public/source-pdfs/<slug>.pdf` (`SOURCE_PDF_DIR/<slug>.pdf`). Drafts must have **none** of these.
- **Kept media is copied byte-identical**; only new uploads run through `optimizeImage`.
- **Temp build dir is repo-local** (`.studio-tmp/`), never `os.tmpdir()`, so renames are same-filesystem and outside Astro's content glob.
- **Test runner:** `npm test` = `node --test --test-concurrency=1`. Tests must clean up every dir they create under `PIECES_DIR`, `OUTPUT_DIR`, `SOURCE_PDF_DIR`.
- **No em dashes** in any UI copy or code comments.

---

## File Structure

**Create:**
- `scripts/lib/pieceCore.mjs` — shared primitives: `exists`, `dedash`, `blockScalar`, `slugify`, `CATEGORIES`, `PIECES_DIR`, `HERO_OPTS`, `nextOrder`, `uniqueSlug`, `optimizeImage`, `buildFrontmatter`.
- `scripts/lib/updatePiece.mjs` — `readPiece`, `updatePiece`, `STAGING_ROOT`.
- `tests/pieceCore.test.mjs` — `buildFrontmatter` unit tests.
- `tests/updatePiece.test.mjs` — `readPiece` + `updatePiece` core tests.
- `tests/studio-edit-app.test.mjs` — edit endpoint tests.

**Modify:**
- `scripts/lib/createPiece.mjs` — consume `pieceCore.mjs`; re-export `PIECES_DIR`, `slugify`, `createPiece` (back-compat).
- `scripts/studio/app.mjs` — add read/update endpoints; add publish verb.
- `scripts/studio/ui/index.html` — mode switch + edit-list container.
- `scripts/studio/ui/studio.js` — edit-mode logic, gallery `kind` tracking, load/save.
- `scripts/studio/ui/studio.css` — minimal styles for the switch + list.
- `.gitignore` — add `.studio-tmp/`.

---

## Task 1: Shared core (`pieceCore.mjs`) + refactor `createPiece`

**Files:**
- Create: `scripts/lib/pieceCore.mjs`
- Create: `tests/pieceCore.test.mjs`
- Modify: `scripts/lib/createPiece.mjs`

**Interfaces:**
- Produces:
  - `optimizeImage(srcPath: string, destPath: string): Promise<void>` — `sharp(src).rotate().resize(HERO_OPTS).webp({quality:82}).toFile(dest)`.
  - `buildFrontmatter(fields): string` — full `---\n…\n---\n` block. `fields`: `{ title, category, order, draft, year?, gallery?: string[] (bare names), deliverables?: string[], pullQuote?, pdf?: { paginate: number[], fullPdf: string } | null, context, role, outcome }`.
  - Re-exports of `exists`, `dedash`, `blockScalar`, `slugify`, `CATEGORIES`, `PIECES_DIR`, `HERO_OPTS`, `nextOrder`, `uniqueSlug`.
- `createPiece.mjs` keeps exporting `createPiece`, `PIECES_DIR`, `slugify` unchanged (consumed by `new-piece.mjs`, `studio/app.mjs`, and four test files).

- [ ] **Step 1: Write the failing test** for `buildFrontmatter`

Create `tests/pieceCore.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFrontmatter } from '../scripts/lib/pieceCore.mjs';

test('buildFrontmatter emits fields in order with block scalars', () => {
  const md = buildFrontmatter({
    title: 'Hello World', category: 'design', order: 3, draft: false,
    year: '2025', gallery: ['gallery-01.webp', 'gallery-02.webp'],
    deliverables: ['Logo', 'Art direction'], pullQuote: 'A quote',
    pdf: { paginate: [1, 4], fullPdf: '/source-pdfs/hello-world.pdf' },
    context: 'Ctx line', role: 'Role line', outcome: 'Outcome line',
  });
  assert.match(md, /^---\n/);
  assert.match(md, /title: "Hello World"\n/);
  assert.match(md, /category: design\n/);
  assert.match(md, /order: 3\n/);
  assert.match(md, /draft: false\n/);
  assert.match(md, /year: "2025"\n/);
  assert.match(md, /hero: "\.\/hero\.webp"\n/);
  assert.match(md, /gallery: \["\.\/gallery-01\.webp","\.\/gallery-02\.webp"\]\n/);
  assert.match(md, /deliverables: \["Logo","Art direction"\]\n/);
  assert.match(md, /pullQuote: "A quote"\n/);
  assert.match(md, /pdfPaginate: \[1, 4\]\n/);
  assert.match(md, /fullPdf: "\/source-pdfs\/hello-world\.pdf"\n/);
  assert.match(md, /context: \|\n  Ctx line\n/);
  assert.match(md, /role: \|\n  Role line\n/);
  assert.match(md, /outcome: \|\n  Outcome line\n/);
  assert.match(md, /\n---\n$/);
});

test('buildFrontmatter strips em and en dashes from text fields', () => {
  const md = buildFrontmatter({
    title: 'A — B', category: 'saas', order: 1, draft: true,
    context: 'Ran 2024–2025', role: 'r', outcome: 'Cut costs — a lot',
  });
  assert.ok(!/[—–]/.test(md), 'no em/en dashes remain');
  assert.match(md, /title: "A - B"/);
  assert.match(md, /Ran 2024-2025/);
  assert.match(md, /Cut costs - a lot/);
});

test('buildFrontmatter omits optional fields when absent', () => {
  const md = buildFrontmatter({
    title: 'Bare', category: 'personal', order: 2, draft: false,
    context: 'c', role: 'r', outcome: 'o',
  });
  assert.doesNotMatch(md, /year:/);
  assert.doesNotMatch(md, /gallery:/);
  assert.doesNotMatch(md, /deliverables:/);
  assert.doesNotMatch(md, /pullQuote:/);
  assert.doesNotMatch(md, /pdfPaginate:/);
  assert.doesNotMatch(md, /fullPdf:/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/pieceCore.test.mjs`
Expected: FAIL — cannot find module `../scripts/lib/pieceCore.mjs`.

- [ ] **Step 3: Create `pieceCore.mjs`**

Move the shared primitives out of `createPiece.mjs` and add `optimizeImage` + `buildFrontmatter`. Create `scripts/lib/pieceCore.mjs`:

```js
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
```

- [ ] **Step 4: Refactor `createPiece.mjs` to consume `pieceCore`**

Replace the moved helpers with imports and use `optimizeImage` + `buildFrontmatter`. The PDF source-copy/rasterize logic stays in `createPiece`; only the frontmatter *lines* move to `buildFrontmatter`. New `scripts/lib/createPiece.mjs`:

```js
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
```

- [ ] **Step 5: Run the full test suite to verify create stays green and the new tests pass**

Run: `npm test`
Expected: PASS — all existing tests (createPiece, gallery-render, pdf-thumbs, studio-app, studio-git, studio-smoke) plus the three new `pieceCore` tests. Zero failures.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/pieceCore.mjs scripts/lib/createPiece.mjs tests/pieceCore.test.mjs
git commit -m "refactor: extract pieceCore (optimizeImage, buildFrontmatter) from createPiece"
```

---

## Task 2: `readPiece(slug)`

**Files:**
- Create: `scripts/lib/updatePiece.mjs`
- Create: `tests/updatePiece.test.mjs`

**Interfaces:**
- Consumes: `PIECES_DIR`, `exists` from `pieceCore.mjs`.
- Produces: `readPiece(slug): Promise<{ slug, title, category, draft, order, year, deliverables, pullQuote, context, role, outcome, hero, gallery: string[], pdf: { present: boolean, paginate: number[] } }>`. `gallery` is bare filenames in frontmatter order. Throws `Error('Piece not found: <slug>')` if the dir or `index.md` is missing.

- [ ] **Step 1: Write the failing test**

Create `tests/updatePiece.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { createPiece } from '../scripts/lib/createPiece.mjs';
import { PIECES_DIR } from '../scripts/lib/pieceCore.mjs';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';
import { readPiece } from '../scripts/lib/updatePiece.mjs';

async function makeImage(file, color = { r: 200, g: 120, b: 40 }) {
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: color } }).png().toFile(file);
}
async function makePdf(file, pages = 3) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
  await fs.writeFile(file, await doc.save());
}
async function nukePiece(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
}

test('readPiece returns fields, ordered gallery, and pdf manifest', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'rp-'));
  const hero = path.join(tmp, 'c.png'); const g1 = path.join(tmp, 'a.png'); const g2 = path.join(tmp, 'b.png');
  const pdf = path.join(tmp, 'd.pdf');
  await makeImage(hero); await makeImage(g1); await makeImage(g2); await makePdf(pdf);
  let slug;
  try {
    ({ slug } = await createPiece({
      title: 'Read Me', category: 'design', role: 'My role', outcome: 'My outcome',
      context: 'My context', year: '2025', deliverables: ['Logo', 'Brand'],
      heroPath: hero, galleryPaths: [g1, g2], pdfPath: pdf, pdfPages: [2, 3],
    }));
    const p = await readPiece(slug);
    assert.equal(p.title, 'Read Me');
    assert.equal(p.category, 'design');
    assert.equal(p.draft, false);
    assert.equal(typeof p.order, 'number');
    assert.equal(p.year, '2025');
    assert.deepEqual(p.deliverables, ['Logo', 'Brand']);
    assert.equal(p.context, 'My context');
    assert.equal(p.role, 'My role');
    assert.equal(p.outcome, 'My outcome');
    assert.equal(p.hero, 'hero.webp');
    assert.deepEqual(p.gallery, ['gallery-01.webp', 'gallery-02.webp']);
    assert.equal(p.pdf.present, true);
    assert.deepEqual(p.pdf.paginate, [2, 3]);
  } finally {
    if (slug) await nukePiece(slug);
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('readPiece throws for a missing slug', async () => {
  await assert.rejects(() => readPiece('does-not-exist-xyz'), /not found/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/updatePiece.test.mjs`
Expected: FAIL — cannot find module `../scripts/lib/updatePiece.mjs`.

- [ ] **Step 3: Implement `readPiece`**

Create `scripts/lib/updatePiece.mjs`:

```js
// scripts/lib/updatePiece.mjs
// Editing an existing piece. readPiece loads its current state for the form;
// updatePiece (Tasks 3-5) rewrites it via an atomic repo-local temp-swap and
// reconciles public/ PDF artifacts. Slug/URL never changes.
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { PIECES_DIR, exists } from './pieceCore.mjs';

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/updatePiece.test.mjs`
Expected: PASS — both `readPiece` tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/updatePiece.mjs tests/updatePiece.test.mjs
git commit -m "feat: readPiece loads an existing piece's state for editing"
```

---

## Task 3: `updatePiece` core — text + cover + atomic swap + category re-append

**Files:**
- Modify: `scripts/lib/updatePiece.mjs`
- Modify: `tests/updatePiece.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `PIECES_DIR`, `CATEGORIES`, `exists`, `optimizeImage`, `buildFrontmatter`, `nextOrder` from `pieceCore.mjs`; `canonicalFullPdfHref`, `rasterizePiece`, `OUTPUT_DIR`, `SOURCE_PDF_DIR` from `pdf-thumbs.mjs`; `readPiece` from this file.
- Produces: `updatePiece({ slug, fields, cover, galleryPlan, pdfPlan }): Promise<{ slug, category, warnings: string[] }>`.
  - `fields`: `{ title, category, role, outcome, context, year, deliverables: string[], pullQuote, draft: boolean }`.
  - `cover`: filesystem path to a new cover image, or `null`/`undefined` to keep the existing `hero.webp`.
  - `galleryPlan`: `Array<{ kind: 'keep', name: string } | { kind: 'new', path: string }>` — desired final ordered gallery (this task carries the existing gallery forward unchanged; Task 4 implements add/remove/reorder, but the loop is written here).
  - `pdfPlan`: `{ action: 'keep' | 'remove' | 'replace' | 'repick', pdfPath?, pages? }` — this task implements only `'keep'` (carry existing PDF + pages forward); Task 5 implements the rest. The full branch table is written here with `keep` exercised.

This task writes the **entire** `updatePiece` function (gallery loop + pdf branches included) so later tasks only add test coverage and verify the already-present branches. Tasks 4 and 5 exist to prove those branches with tests and a fresh review gate.

- [ ] **Step 1: Write the failing tests** (append to `tests/updatePiece.test.mjs`)

```js
import { updatePiece } from '../scripts/lib/updatePiece.mjs';

const baseFields = (over = {}) => ({
  title: 'Base Title', category: 'design', role: 'role one', outcome: 'outcome one',
  context: 'context one', year: '2025', deliverables: ['One'], pullQuote: '', draft: false, ...over,
});

async function seedPiece(over = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-seed-'));
  const hero = path.join(tmp, 'c.png');
  await makeImage(hero, { r: 50, g: 50, b: 50 });
  const res = await createPiece({
    title: over.title ?? 'Base Title', category: over.category ?? 'design',
    role: 'role one', outcome: 'outcome one', context: 'context one', year: '2025',
    deliverables: ['One'], heroPath: hero, draft: over.draft ?? false,
  });
  await fs.rm(tmp, { recursive: true, force: true });
  return res.slug;
}

test('updatePiece changes text but leaves hero.webp byte-identical', async () => {
  const slug = await seedPiece();
  try {
    const before = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    const res = await updatePiece({
      slug, fields: baseFields({ title: 'Base Title', role: 'role TWO', outcome: 'outcome TWO', context: 'context TWO' }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'keep' },
    });
    assert.equal(res.slug, slug);
    const after = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    assert.ok(before.equals(after), 'hero.webp unchanged');
    const p = await readPiece(slug);
    assert.equal(p.role, 'role TWO');
    assert.equal(p.outcome, 'outcome TWO');
    assert.equal(p.context, 'context TWO');
  } finally { await nukePiece(slug); }
});

test('updatePiece replaces the cover when a new one is given', async () => {
  const slug = await seedPiece();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-cov-'));
  try {
    const before = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    const newCover = path.join(tmp, 'new.png');
    await makeImage(newCover, { r: 250, g: 10, b: 10 });
    await updatePiece({ slug, fields: baseFields(), cover: newCover, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const after = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    assert.ok(!before.equals(after), 'hero.webp replaced');
  } finally { await nukePiece(slug); await fs.rm(tmp, { recursive: true, force: true }); }
});

test('updatePiece keeps the slug stable when the title changes', async () => {
  const slug = await seedPiece();
  try {
    await updatePiece({ slug, fields: baseFields({ title: 'A Totally New Title' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'index.md')), 'dir name unchanged');
    const p = await readPiece(slug);
    assert.equal(p.title, 'A Totally New Title');
  } finally { await nukePiece(slug); }
});

test('updatePiece strips em dashes on update', async () => {
  const slug = await seedPiece();
  try {
    await updatePiece({ slug, fields: baseFields({ outcome: 'Saved time — lots' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.ok(!/[—–]/.test(raw));
    assert.match(raw, /Saved time - lots/);
  } finally { await nukePiece(slug); }
});

test('updatePiece re-appends order when category changes', async () => {
  // Seed two finance pieces so nextOrder(finance) is 3, then move a design piece to finance.
  const f1 = await seedPiece({ title: 'Fin One', category: 'finance' });
  const f2 = await seedPiece({ title: 'Fin Two', category: 'finance' });
  const d1 = await seedPiece({ title: 'Des One', category: 'design' });
  try {
    await updatePiece({ slug: d1, fields: baseFields({ title: 'Des One', category: 'finance' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const moved = await readPiece(d1);
    const f2order = (await readPiece(f2)).order;
    assert.equal(moved.category, 'finance');
    assert.ok(moved.order > f2order, `re-appended (order ${moved.order} > ${f2order})`);
  } finally { await nukePiece(f1); await nukePiece(f2); await nukePiece(d1); }
});

test('updatePiece rejects an unknown category', async () => {
  const slug = await seedPiece();
  try {
    await assert.rejects(
      () => updatePiece({ slug, fields: baseFields({ category: 'nope' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } }),
      /category/i,
    );
  } finally { await nukePiece(slug); }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/updatePiece.test.mjs`
Expected: FAIL — `updatePiece` is not exported.

- [ ] **Step 3: Implement `updatePiece`** (append to `scripts/lib/updatePiece.mjs`)

Add imports at the top of the file (merge with the existing import block):

```js
import crypto from 'node:crypto';
import {
  PIECES_DIR, CATEGORIES, exists, optimizeImage, buildFrontmatter, nextOrder,
} from './pieceCore.mjs';
import {
  canonicalFullPdfHref, rasterizePiece, OUTPUT_DIR, SOURCE_PDF_DIR,
} from './pdf-thumbs.mjs';
```

Append:

```js
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
      if (item.kind === 'keep') await fs.copyFile(path.join(dir, item.name), dest);
      else await optimizeImage(item.path, dest);
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

  // Atomic swap: backup the live dir, move the new one in, drop the backup.
  const backup = `${dir}.bak-${crypto.randomUUID()}`;
  await fs.rename(dir, backup);
  try {
    await fs.rename(tmpDir, dir);
  } catch (err) {
    await fs.rename(backup, dir).catch(() => {});
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw err;
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
```

- [ ] **Step 4: Add `.studio-tmp/` to `.gitignore`**

Append a line to `.gitignore`:

```
.studio-tmp/
```

- [ ] **Step 5: Run to verify pass**

Run: `node --test tests/updatePiece.test.mjs`
Expected: PASS — all Task 3 tests plus the Task 2 `readPiece` tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/updatePiece.mjs tests/updatePiece.test.mjs .gitignore
git commit -m "feat: updatePiece core (text, cover, atomic swap, category re-append)"
```

---

## Task 4: `updatePiece` gallery — add / remove / reorder

**Files:**
- Modify: `tests/updatePiece.test.mjs`

The gallery loop already exists in `updatePiece` (Task 3, Step 3). This task proves add / remove / reorder / renumber / orphan-cleanup with tests. If a test fails, fix the loop in `updatePiece.mjs`.

**Interfaces:**
- Consumes: `updatePiece` with `galleryPlan: Array<{kind:'keep',name} | {kind:'new',path}>`.

- [ ] **Step 1: Write the failing tests** (append to `tests/updatePiece.test.mjs`)

```js
async function seedPieceWithGallery(n = 2) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-gal-'));
  const hero = path.join(tmp, 'c.png'); await makeImage(hero);
  const gPaths = [];
  for (let i = 0; i < n; i++) { const g = path.join(tmp, `g${i}.png`); await makeImage(g, { r: i * 40, g: 80, b: 120 }); gPaths.push(g); }
  const { slug } = await createPiece({
    title: `Gallery Seed ${n}`, category: 'design', role: 'r', outcome: 'o', context: 'c',
    heroPath: hero, galleryPaths: gPaths,
  });
  await fs.rm(tmp, { recursive: true, force: true });
  return slug;
}

test('updatePiece appends a new gallery image', async () => {
  const slug = await seedPieceWithGallery(2);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-add-'));
  try {
    const nu = path.join(tmp, 'n.png'); await makeImage(nu, { r: 5, g: 5, b: 5 });
    await updatePiece({
      slug, fields: baseFields({ title: 'Gallery Seed 2' }), cover: null,
      galleryPlan: [{ kind: 'keep', name: 'gallery-01.webp' }, { kind: 'keep', name: 'gallery-02.webp' }, { kind: 'new', path: nu }],
      pdfPlan: { action: 'keep' },
    });
    const p = await readPiece(slug);
    assert.deepEqual(p.gallery, ['gallery-01.webp', 'gallery-02.webp', 'gallery-03.webp']);
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'gallery-03.webp')));
  } finally { await nukePiece(slug); await fs.rm(tmp, { recursive: true, force: true }); }
});

test('updatePiece removes a gallery image and renumbers without gaps', async () => {
  const slug = await seedPieceWithGallery(3);
  try {
    // Drop the middle image; keep 1 and 3.
    await updatePiece({
      slug, fields: baseFields({ title: 'Gallery Seed 3' }), cover: null,
      galleryPlan: [{ kind: 'keep', name: 'gallery-01.webp' }, { kind: 'keep', name: 'gallery-03.webp' }],
      pdfPlan: { action: 'keep' },
    });
    const p = await readPiece(slug);
    assert.deepEqual(p.gallery, ['gallery-01.webp', 'gallery-02.webp']);
    await assert.rejects(fs.access(path.join(PIECES_DIR, slug, 'gallery-03.webp')), 'orphan removed');
  } finally { await nukePiece(slug); }
});

test('updatePiece reorders gallery images by plan order', async () => {
  const slug = await seedPieceWithGallery(2);
  try {
    const orig1 = await fs.readFile(path.join(PIECES_DIR, slug, 'gallery-01.webp'));
    await updatePiece({
      slug, fields: baseFields({ title: 'Gallery Seed 2' }), cover: null,
      galleryPlan: [{ kind: 'keep', name: 'gallery-02.webp' }, { kind: 'keep', name: 'gallery-01.webp' }],
      pdfPlan: { action: 'keep' },
    });
    // The image that was gallery-01 is now gallery-02 (byte-identical copy).
    const now2 = await fs.readFile(path.join(PIECES_DIR, slug, 'gallery-02.webp'));
    assert.ok(orig1.equals(now2), 'former gallery-01 is now gallery-02');
  } finally { await nukePiece(slug); }
});

test('updatePiece clears the gallery on an empty plan', async () => {
  const slug = await seedPieceWithGallery(2);
  try {
    await updatePiece({ slug, fields: baseFields({ title: 'Gallery Seed 2' }), cover: null, galleryPlan: [], pdfPlan: { action: 'keep' } });
    const p = await readPiece(slug);
    assert.deepEqual(p.gallery, []);
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.doesNotMatch(raw, /gallery:/);
  } finally { await nukePiece(slug); }
});
```

- [ ] **Step 2: Run to verify pass** (the loop already exists; these should pass)

Run: `node --test tests/updatePiece.test.mjs`
Expected: PASS. If any fail, fix the gallery loop in `updatePiece.mjs` (the `for` over `galleryPlan`) until green.

- [ ] **Step 3: Commit**

```bash
git add tests/updatePiece.test.mjs scripts/lib/updatePiece.mjs
git commit -m "test: updatePiece gallery add/remove/reorder/clear coverage"
```

---

## Task 5: `updatePiece` PDF — repick / replace / remove + draft flip

**Files:**
- Modify: `tests/updatePiece.test.mjs`

The PDF branches and `reconcilePublicPdf` already exist (Task 3). This task proves them.

**Interfaces:**
- Consumes: `updatePiece` with `pdfPlan` ∈ `{action:'repick',pages}`, `{action:'replace',pdfPath,pages}`, `{action:'remove'}`, and `fields.draft` toggling.

- [ ] **Step 1: Write the failing tests** (append to `tests/updatePiece.test.mjs`)

```js
async function seedPieceWithPdf({ draft = false, pages = [1, 2, 3] } = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-pdf-'));
  const hero = path.join(tmp, 'c.png'); await makeImage(hero);
  const pdf = path.join(tmp, 'd.pdf'); await makePdf(pdf, 3);
  const { slug } = await createPiece({
    title: `Pdf Seed ${draft ? 'D' : 'P'}`, category: 'finance', role: 'r', outcome: 'o', context: 'c',
    heroPath: hero, pdfPath: pdf, pdfPages: pages, draft,
  });
  await fs.rm(tmp, { recursive: true, force: true });
  return slug;
}

test('updatePiece repick prunes page thumbs to the new selection', async () => {
  const slug = await seedPieceWithPdf({ pages: [1, 2, 3] });
  try {
    await updatePiece({
      slug, fields: baseFields({ title: 'Pdf Seed P', category: 'finance' }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'repick', pages: [1] },
    });
    const p = await readPiece(slug);
    assert.deepEqual(p.pdf.paginate, [1]);
    // page-2 / page-3 thumbs pruned (page 1 is cover.webp).
    await assert.rejects(fs.access(path.join(OUTPUT_DIR, slug, 'page-2.webp')), 'page-2 pruned');
    await assert.rejects(fs.access(path.join(OUTPUT_DIR, slug, 'page-3.webp')), 'page-3 pruned');
  } finally { await nukePiece(slug); }
});

test('updatePiece replace swaps the source PDF', async () => {
  const slug = await seedPieceWithPdf();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'up-rep-'));
  try {
    const newPdf = path.join(tmp, 'new.pdf'); await makePdf(newPdf, 5);
    await updatePiece({
      slug, fields: baseFields({ title: 'Pdf Seed P', category: 'finance' }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'replace', pdfPath: newPdf, pages: [4, 5] },
    });
    const p = await readPiece(slug);
    assert.deepEqual(p.pdf.paginate, [4, 5]);
    await assert.doesNotReject(fs.access(path.join(OUTPUT_DIR, slug, 'page-4.webp')));
  } finally { await nukePiece(slug); await fs.rm(tmp, { recursive: true, force: true }); }
});

test('updatePiece remove deletes the deck and all public artifacts', async () => {
  const slug = await seedPieceWithPdf();
  try {
    await updatePiece({
      slug, fields: baseFields({ title: 'Pdf Seed P', category: 'finance' }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'remove' },
    });
    const p = await readPiece(slug);
    assert.equal(p.pdf.present, false);
    await assert.rejects(fs.access(path.join(PIECES_DIR, slug, 'source.pdf')), 'source.pdf gone');
    await assert.rejects(fs.access(path.join(OUTPUT_DIR, slug)), 'public thumbs gone');
    await assert.rejects(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)), 'public source gone');
    const raw = await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8');
    assert.doesNotMatch(raw, /pdfPaginate:/);
    assert.doesNotMatch(raw, /fullPdf:/);
  } finally { await nukePiece(slug); }
});

test('updatePiece publish->draft strips public artifacts; draft->publish regenerates', async () => {
  const slug = await seedPieceWithPdf(); // published with PDF -> public artifacts exist
  try {
    await assert.doesNotReject(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)), 'precondition: public exists');
    // Flip to draft.
    await updatePiece({
      slug, fields: baseFields({ title: 'Pdf Seed P', category: 'finance', draft: true }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'keep' },
    });
    await assert.rejects(fs.access(path.join(OUTPUT_DIR, slug)), 'draft: public thumbs stripped');
    await assert.rejects(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)), 'draft: public source stripped');
    await assert.doesNotReject(fs.access(path.join(PIECES_DIR, slug, 'source.pdf')), 'draft: in-dir source kept');
    // Flip back to published.
    await updatePiece({
      slug, fields: baseFields({ title: 'Pdf Seed P', category: 'finance', draft: false }),
      cover: null, galleryPlan: [], pdfPlan: { action: 'keep' },
    });
    await assert.doesNotReject(fs.access(path.join(SOURCE_PDF_DIR, `${slug}.pdf`)), 'republish: public regenerated');
  } finally { await nukePiece(slug); }
});
```

- [ ] **Step 2: Run to verify pass**

Run: `node --test tests/updatePiece.test.mjs`
Expected: PASS — all PDF/draft tests. If any fail, fix the PDF branch or `reconcilePublicPdf` in `updatePiece.mjs` until green.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: PASS — entire suite green, zero failures.

- [ ] **Step 4: Commit**

```bash
git add tests/updatePiece.test.mjs scripts/lib/updatePiece.mjs
git commit -m "test: updatePiece pdf repick/replace/remove + draft-flip reconciliation"
```

---

## Task 6: Read endpoints — list, get, asset

**Files:**
- Modify: `scripts/studio/app.mjs`
- Create: `tests/studio-edit-app.test.mjs`

**Interfaces:**
- Consumes: `readPiece` from `updatePiece.mjs`; `PIECES_DIR`, `exists` from `pieceCore.mjs`; `matter` from `gray-matter`.
- Produces three routes:
  - `GET /api/pieces` → `[{ slug, title, category, draft }]` sorted by category then order.
  - `GET /api/pieces/:slug` → `readPiece` output plus `heroUrl` and `galleryUrls: string[]`. 404 `{error}` if missing.
  - `GET /api/pieces/:slug/asset/:file` → serves `image/webp` from the piece dir; `:file` must be `hero.webp` or `^gallery-\d+\.webp$`; 404 otherwise.

- [ ] **Step 1: Write the failing tests**

Create `tests/studio-edit-app.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { createApp } from '../scripts/studio/app.mjs';
import { createPiece } from '../scripts/lib/createPiece.mjs';
import { PIECES_DIR } from '../scripts/lib/pieceCore.mjs';
import { OUTPUT_DIR, SOURCE_PDF_DIR } from '../scripts/lib/pdf-thumbs.mjs';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
async function makeImage(file, color = { r: 30, g: 30, b: 30 }) {
  await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).png().toFile(file);
}
async function nukePiece(slug) {
  await fs.rm(path.join(PIECES_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(OUTPUT_DIR, slug), { recursive: true, force: true });
  await fs.rm(path.join(SOURCE_PDF_DIR, `${slug}.pdf`), { force: true });
}
async function seed(title, category = 'design', gallery = 0) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-seed-'));
  const hero = path.join(tmp, 'c.png'); await makeImage(hero);
  const gPaths = [];
  for (let i = 0; i < gallery; i++) { const g = path.join(tmp, `g${i}.png`); await makeImage(g, { r: i * 30, g: 60, b: 90 }); gPaths.push(g); }
  const { slug } = await createPiece({ title, category, role: 'r', outcome: 'o', context: 'c', heroPath: hero, galleryPaths: gPaths });
  await fs.rm(tmp, { recursive: true, force: true });
  return slug;
}

test('GET /api/pieces lists existing pieces', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('List Me One');
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces`);
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.ok(Array.isArray(list));
    const mine = list.find((p) => p.slug === slug);
    assert.ok(mine, 'seeded piece present');
    assert.equal(mine.title, 'List Me One');
    assert.equal(mine.category, 'design');
    assert.equal(mine.draft, false);
  } finally { await nukePiece(slug); server.close(); }
});

test('GET /api/pieces/:slug returns the manifest with asset URLs', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Get Me Two', 'design', 2);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`);
    assert.equal(res.status, 200);
    const p = await res.json();
    assert.equal(p.title, 'Get Me Two');
    assert.equal(p.heroUrl, `/api/pieces/${slug}/asset/hero.webp`);
    assert.deepEqual(p.galleryUrls, [
      `/api/pieces/${slug}/asset/gallery-01.webp`,
      `/api/pieces/${slug}/asset/gallery-02.webp`,
    ]);
  } finally { await nukePiece(slug); server.close(); }
});

test('GET /api/pieces/:slug 404s for a missing piece', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/nope-nope`);
    assert.equal(res.status, 404);
  } finally { server.close(); }
});

test('GET /api/pieces/:slug/asset serves hero and rejects junk filenames', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Asset Me Three');
  try {
    const ok = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/asset/hero.webp`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('content-type'), 'image/webp');
    const bad = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/asset/index.md`);
    assert.equal(bad.status, 404);
  } finally { await nukePiece(slug); server.close(); }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/studio-edit-app.test.mjs`
Expected: FAIL — routes return 404 (Express static handler) / not implemented.

- [ ] **Step 3: Implement the read routes** in `scripts/studio/app.mjs`

Add imports near the top (merge with existing imports):

```js
import matter from 'gray-matter';
import { PIECES_DIR, exists } from '../lib/pieceCore.mjs';
import { readPiece } from '../lib/updatePiece.mjs';
```

Add these routes **before** `app.use(express.static(UI_DIR));`:

```js
  app.get('/api/pieces', async (_req, res) => {
    try {
      const out = [];
      for (const slug of await fs.readdir(PIECES_DIR).catch(() => [])) {
        const idx = path.join(PIECES_DIR, slug, 'index.md');
        if (!(await exists(idx))) continue;
        const { data } = matter(await fs.readFile(idx, 'utf8'));
        out.push({ slug, title: data.title ?? slug, category: data.category ?? '', draft: data.draft === true, order: Number.isFinite(data.order) ? data.order : 0 });
      }
      out.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
      res.json(out.map(({ order, ...p }) => p));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/pieces/:slug', async (req, res) => {
    try {
      const slug = path.basename(req.params.slug);
      const p = await readPiece(slug);
      res.json({
        ...p,
        heroUrl: `/api/pieces/${slug}/asset/hero.webp`,
        galleryUrls: p.gallery.map((n) => `/api/pieces/${slug}/asset/${n}`),
      });
    } catch (err) { res.status(/not found/i.test(err.message) ? 404 : 500).json({ error: err.message }); }
  });

  app.get('/api/pieces/:slug/asset/:file', async (req, res) => {
    const slug = path.basename(req.params.slug);
    const file = path.basename(req.params.file);
    if (file !== 'hero.webp' && !/^gallery-\d+\.webp$/.test(file)) return res.status(404).end();
    try { res.type('image/webp').send(await fs.readFile(path.join(PIECES_DIR, slug, file))); }
    catch { res.status(404).end(); }
  });
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/studio-edit-app.test.mjs`
Expected: PASS — all four read-endpoint tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/studio/app.mjs tests/studio-edit-app.test.mjs
git commit -m "feat: studio read endpoints (list, get, asset) for edit mode"
```

---

## Task 7: PDF-thumbs endpoint for an existing piece

**Files:**
- Modify: `scripts/studio/app.mjs`
- Modify: `tests/studio-edit-app.test.mjs`

**Interfaces:**
- Consumes: `rasterizeAllPages` (already imported), `stagingDir` (already exported in `app.mjs`), `PIECES_DIR`, `exists`; `matter`.
- Produces: `GET /api/pieces/:slug/pdf-thumbs` → `{ pageCount, thumbs: [{n,w,h,url}], selected: number[] }` reusing the existing `/api/pdf/preview/:id/:file` serve route (rasterizes the piece's `source.pdf` into a fresh staging dir). 404 `{error}` if the piece has no `source.pdf`.

- [ ] **Step 1: Write the failing test** (append to `tests/studio-edit-app.test.mjs`)

```js
import { PDFDocument } from 'pdf-lib';

async function seedPdf(title, pages = [1, 2, 3]) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-pdf-'));
  const hero = path.join(tmp, 'c.png'); await makeImage(hero);
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) doc.addPage([612, 792]).drawText(`P${i + 1}`, { x: 72, y: 700, size: 40 });
  const pdf = path.join(tmp, 'd.pdf'); await fs.writeFile(pdf, await doc.save());
  const { slug } = await createPiece({ title, category: 'finance', role: 'r', outcome: 'o', context: 'c', heroPath: hero, pdfPath: pdf, pdfPages: pages });
  await fs.rm(tmp, { recursive: true, force: true });
  return slug;
}

test('GET /api/pieces/:slug/pdf-thumbs returns thumbs and current selection', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seedPdf('Thumbs Me', [2, 3]);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/pdf-thumbs`);
    assert.equal(res.status, 200);
    const { pageCount, thumbs, selected } = await res.json();
    assert.equal(pageCount, 3);
    assert.equal(thumbs.length, 3);
    assert.deepEqual(selected, [2, 3]);
    const t = await fetch(`http://127.0.0.1:${port}${thumbs[0].url}`);
    assert.equal(t.status, 200);
  } finally { await nukePiece(slug); server.close(); }
});

test('GET /api/pieces/:slug/pdf-thumbs 404s when the piece has no PDF', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('No Pdf Here');
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}/pdf-thumbs`);
    assert.equal(res.status, 404);
  } finally { await nukePiece(slug); server.close(); }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/studio-edit-app.test.mjs`
Expected: FAIL — the new `pdf-thumbs` route is missing (404 with no body shape / wrong status).

- [ ] **Step 3: Implement the route** in `scripts/studio/app.mjs`

Add `crypto` is already imported. Add this route before the static handler:

```js
  app.get('/api/pieces/:slug/pdf-thumbs', async (req, res) => {
    const slug = path.basename(req.params.slug);
    const sourcePdf = path.join(PIECES_DIR, slug, 'source.pdf');
    if (!(await exists(sourcePdf))) return res.status(404).json({ error: 'This piece has no PDF.' });
    try {
      const { data } = matter(await fs.readFile(path.join(PIECES_DIR, slug, 'index.md'), 'utf8'));
      const stagingId = crypto.randomUUID();
      const dir = stagingDir(stagingId);
      await fs.mkdir(dir, { recursive: true });
      const pages = await rasterizeAllPages(sourcePdf, path.join(dir, 'thumbs'));
      res.json({
        stagingId,
        pageCount: pages.length,
        selected: Array.isArray(data.pdfPaginate) ? data.pdfPaginate : [],
        thumbs: pages.map((p) => ({ n: p.n, w: p.w, h: p.h, url: `/api/pdf/preview/${stagingId}/${p.file}` })),
      });
    } catch (err) { res.status(500).json({ error: `Could not read that PDF: ${err.message}` }); }
  });
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/studio-edit-app.test.mjs`
Expected: PASS — both `pdf-thumbs` tests plus the Task 6 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/studio/app.mjs tests/studio-edit-app.test.mjs
git commit -m "feat: studio pdf-thumbs endpoint pre-fills page picker for an existing piece"
```

---

## Task 8: `PUT /api/pieces/:slug` update endpoint + publish verb

**Files:**
- Modify: `scripts/studio/app.mjs`
- Modify: `tests/studio-edit-app.test.mjs`

**Interfaces:**
- Consumes: `updatePiece` from `updatePiece.mjs`; existing `stagingPdfPath`, `cleanupStaging`-style cleanup, `parseJsonArray`, multer `upload`.
- Produces:
  - `PUT /api/pieces/:slug` (multer `cover`+`gallery` fields) → `{ slug, category, previewUrl, warnings }`. Body: text fields, `galleryPlan` (JSON of `{kind:'keep',name} | {kind:'new',idx}`), `pdfPlan` (JSON of `{action, stagingId?, pages?}`). Maps `new.idx` → uploaded `gallery[idx].path`; maps `pdfPlan.stagingId` → `stagingPdfPath(stagingId)`.
  - `POST /api/publish` extended: body `{ title, mode }`; message = `Update piece: <title>` when `mode === 'update'`, else `Add piece: <title>`.

- [ ] **Step 1: Write the failing tests** (append to `tests/studio-edit-app.test.mjs`)

```js
async function pngBlob(color) {
  const buf = await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).png().toBuffer();
  return new Blob([buf], { type: 'image/png' });
}

test('PUT /api/pieces/:slug updates text and reorders gallery', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Put Me One', 'design', 2);
  try {
    const fd = new FormData();
    fd.set('title', 'Put Me One');
    fd.set('category', 'design');
    fd.set('role', 'updated role'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('year', '2024');
    fd.set('deliverables', JSON.stringify(['Edited']));
    fd.set('pullQuote', '');
    fd.set('draft', 'false');
    fd.set('galleryPlan', JSON.stringify([{ kind: 'keep', name: 'gallery-02.webp' }, { kind: 'keep', name: 'gallery-01.webp' }, { kind: 'new', idx: 0 }]));
    fd.append('gallery', await pngBlob({ r: 1, g: 2, b: 3 }), 'new.png');
    fd.set('pdfPlan', JSON.stringify({ action: 'keep' }));
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`, { method: 'PUT', body: fd });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.slug, slug);
    assert.equal(json.previewUrl, `http://localhost:4321/design/${slug}`);
    const get = await (await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`)).json();
    assert.equal(get.role, 'updated role');
    assert.equal(get.year, '2024');
    assert.deepEqual(get.gallery, ['gallery-01.webp', 'gallery-02.webp', 'gallery-03.webp']);
  } finally { await nukePiece(slug); server.close(); }
});

test('PUT /api/pieces/:slug replaces the cover', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Put Me Two');
  try {
    const before = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    const fd = new FormData();
    fd.set('title', 'Put Me Two'); fd.set('category', 'design');
    fd.set('role', 'r'); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('draft', 'false'); fd.set('galleryPlan', JSON.stringify([])); fd.set('pdfPlan', JSON.stringify({ action: 'keep' }));
    fd.set('cover', await pngBlob({ r: 240, g: 12, b: 12 }), 'cover.png');
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`, { method: 'PUT', body: fd });
    assert.equal(res.status, 200);
    const after = await fs.readFile(path.join(PIECES_DIR, slug, 'hero.webp'));
    assert.ok(!before.equals(after), 'cover replaced');
  } finally { await nukePiece(slug); server.close(); }
});

test('PUT /api/pieces/:slug 400s on an empty required field', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  const slug = await seed('Put Me Three');
  try {
    const fd = new FormData();
    fd.set('title', 'Put Me Three'); fd.set('category', 'design');
    fd.set('role', ''); fd.set('outcome', 'o'); fd.set('context', 'c');
    fd.set('draft', 'false'); fd.set('galleryPlan', JSON.stringify([])); fd.set('pdfPlan', JSON.stringify({ action: 'keep' }));
    const res = await fetch(`http://127.0.0.1:${port}/api/pieces/${slug}`, { method: 'PUT', body: fd });
    assert.equal(res.status, 400);
  } finally { await nukePiece(slug); server.close(); }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/studio-edit-app.test.mjs`
Expected: FAIL — `PUT` route missing (404 from static handler).

- [ ] **Step 3: Implement the update route + publish verb** in `scripts/studio/app.mjs`

Add `updatePiece` to imports:

```js
import { updatePiece } from '../lib/updatePiece.mjs';
```

Add the `PUT` route before the static handler:

```js
  app.put('/api/pieces/:slug', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'gallery' }]), async (req, res) => {
    const tempPaths = [];
    try {
      const slug = path.basename(req.params.slug);
      const b = req.body;
      const galleryFiles = req.files?.gallery ?? [];
      const cover = req.files?.cover?.[0] ?? null;
      for (const files of Object.values(req.files ?? {})) for (const f of files) tempPaths.push(f.path);

      const rawPlan = parseJsonArray(b.galleryPlan);
      const galleryPlan = rawPlan.map((it) =>
        it && it.kind === 'new'
          ? { kind: 'new', path: galleryFiles[it.idx]?.path }
          : { kind: 'keep', name: String(it?.name ?? '') });
      for (const it of galleryPlan) {
        if (it.kind === 'new' && !it.path) throw new Error('A new gallery image was referenced but not uploaded.');
      }

      let pdfPlan = { action: 'keep' };
      try { const parsed = JSON.parse(b.pdfPlan); if (parsed && parsed.action) pdfPlan = parsed; } catch { /* keep */ }
      if (pdfPlan.action === 'replace') pdfPlan = { action: 'replace', pdfPath: stagingPdfPath(pdfPlan.stagingId), pages: pdfPlan.pages };

      const fields = {
        title: b.title, category: b.category, role: b.role, outcome: b.outcome, context: b.context,
        year: b.year || undefined, deliverables: parseJsonArray(b.deliverables).map(String).filter(Boolean),
        pullQuote: b.pullQuote || undefined, draft: b.draft === 'true',
      };

      const { category, warnings } = await updatePiece({ slug, fields, cover: cover?.path ?? null, galleryPlan, pdfPlan });
      if (pdfPlan.action === 'replace' && pdfPlan.pdfPath) {
        await fs.rm(path.dirname(pdfPlan.pdfPath), { recursive: true, force: true }).catch(() => {});
      }
      res.json({ slug, category, previewUrl: `${DEV_PREVIEW_ORIGIN}/${category}/${slug}`, warnings });
    } catch (err) {
      const status = /required|category|not found|uploaded/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message });
    } finally {
      for (const p of tempPaths) fs.rm(p, { force: true }).catch(() => {});
    }
  });
```

Update the existing `/api/publish` handler body to honor a `mode`:

```js
  app.post('/api/publish', async (req, res) => {
    try {
      const title = (req.body?.title || '').trim();
      const verb = req.body?.mode === 'update' ? 'Update' : 'Add';
      const message = title ? `${verb} piece: ${title}` : `${verb} portfolio piece`;
      const result = await publish({ cwd: repoRoot, message });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
```

- [ ] **Step 4: Run to verify pass + full suite**

Run: `node --test tests/studio-edit-app.test.mjs`
Expected: PASS — all PUT tests.
Run: `npm test`
Expected: PASS — entire suite green.

- [ ] **Step 5: Commit**

```bash
git add scripts/studio/app.mjs tests/studio-edit-app.test.mjs
git commit -m "feat: PUT /api/pieces/:slug update endpoint + update publish verb"
```

---

## Task 9: UI — edit mode (switch, list, load, save)

**Files:**
- Modify: `scripts/studio/ui/index.html`
- Modify: `scripts/studio/ui/studio.js`
- Modify: `scripts/studio/ui/studio.css`

**Interfaces:**
- Consumes: `GET /api/pieces`, `GET /api/pieces/:slug`, `GET /api/pieces/:slug/asset/:file`, `GET /api/pieces/:slug/pdf-thumbs`, `PUT /api/pieces/:slug`, `POST /api/publish` (`mode:'update'`).
- This is browser code; verification is a scripted DOM smoke (jsdom-free: assert the served HTML contains the hooks) plus a manual checklist.

- [ ] **Step 1: Add the mode switch + edit list to `index.html`**

Insert directly after `<main class="wrap">` and before `<form id="piece-form" …>`:

```html
    <nav class="modes">
      <button type="button" id="mode-new" class="mode active">New piece</button>
      <button type="button" id="mode-edit" class="mode">Edit existing</button>
    </nav>
    <section id="edit-list" class="card hidden">
      <h2>Edit existing</h2>
      <div id="pieces"></div>
    </section>
```

Change the form heading so it can switch label. Replace `<h2>New piece</h2>` with:

```html
      <h2 id="form-title">New piece</h2>
```

The submit button (`<button id="create" type="submit">Create piece</button>`) needs no markup change — its text is swapped by JS (`resetForm` sets "Create piece", `loadPiece` sets "Save changes").

- [ ] **Step 2: Add styles to `studio.css`**

Append:

```css
.modes { display: flex; gap: 8px; margin-bottom: 16px; }
.mode { padding: 8px 14px; border: 1px solid #d8d8d8; background: #f4f4f4; border-radius: 8px; cursor: pointer; font: inherit; color: #333; }
.mode.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
#pieces { display: flex; flex-direction: column; gap: 6px; }
.piece-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border: 1px solid #e4e4e4; border-radius: 8px; cursor: pointer; background: #fff; }
.piece-row:hover { border-color: #bdbdbd; }
.piece-row .cat { color: #888; font-size: 13px; text-transform: capitalize; }
.piece-row .badge { font-size: 12px; color: #9a6a00; background: #fff4e0; padding: 2px 8px; border-radius: 999px; margin-left: 8px; }
.tile .kept { position: absolute; left: 4px; top: 4px; font-size: 11px; background: rgba(0,0,0,0.6); color: #fff; padding: 1px 6px; border-radius: 999px; }
.hidden { display: none; }
```

- [ ] **Step 3: Rewrite `studio.js` to support both modes**

Replace the whole file with the mode-aware version. The gallery state gains a `kind` per tile (`'keep'` carries a `name`; `'new'` carries a `File`), and an `editing` slug toggles create vs update on submit:

```js
const $ = (s) => document.querySelector(s);
const state = { editing: null, cover: null, gallery: [], pdf: { stagingId: null, thumbs: [], selected: [] } };

function wireDrop(dropId, inputId, onFiles) {
  const drop = $(dropId), input = $(inputId);
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => onFiles([...input.files]));
  ['dragover', 'dragenter'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (ev) => { ev.preventDefault(); onFiles([...ev.dataTransfer.files]); });
}

// Cover: a new File replaces; in edit mode an existing cover shows as a URL preview.
wireDrop('#cover-drop', '#cover-input', (files) => {
  state.cover = files[0] || null;
  if (state.cover) $('#cover-preview').innerHTML = `<img src="${URL.createObjectURL(state.cover)}" />`;
});

// Gallery tiles carry kind: 'keep' (name + url) or 'new' (file).
wireDrop('#gallery-drop', '#gallery-input', (files) => {
  for (const f of files.filter((f) => f.type.startsWith('image/'))) state.gallery.push({ kind: 'new', file: f });
  renderGallery();
});

function tileSrc(item) { return item.kind === 'new' ? URL.createObjectURL(item.file) : item.url; }

function renderGallery() {
  const list = $('#gallery-list'); list.innerHTML = '';
  state.gallery.forEach((item, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile'; tile.draggable = true;
    tile.innerHTML = `<img src="${tileSrc(item)}" />${item.kind === 'keep' ? '<span class="kept">saved</span>' : ''}<button type="button" class="x">×</button>`;
    tile.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
    tile.addEventListener('dragover', (e) => e.preventDefault());
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData('text/plain');
      const [m] = state.gallery.splice(from, 1); state.gallery.splice(i, 0, m); renderGallery();
    });
    tile.querySelector('.x').addEventListener('click', () => { state.gallery.splice(i, 1); renderGallery(); });
    list.appendChild(tile);
  });
}

// PDF picker (shared by new + edit). pdfChanged tracks whether the user touched it.
let pdfRemoved = false;
wireDrop('#pdf-drop', '#pdf-input', async (files) => {
  const pdf = files[0]; if (!pdf) return;
  pdfRemoved = false;
  $('#pdf-drop').textContent = 'Reading PDF…';
  const fd = new FormData(); fd.set('pdf', pdf);
  const res = await fetch('/api/pdf/preview', { method: 'POST', body: fd });
  if (!res.ok) { $('#pdf-drop').textContent = 'Could not read that PDF. Try another.'; return; }
  const data = await res.json();
  state.pdf = { stagingId: data.stagingId, thumbs: data.thumbs, selected: [], replaced: true };
  $('#pdf-drop').textContent = `${data.pageCount} pages. Click the ones to feature, in order.`;
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

// ---- Mode switching ----
function setMode(mode) {
  const editing = mode === 'edit-loaded';
  $('#mode-new').classList.toggle('active', mode === 'new');
  $('#mode-edit').classList.toggle('active', mode !== 'new');
  $('#edit-list').classList.toggle('hidden', mode !== 'edit');
  $('#piece-form').classList.toggle('hidden', mode === 'edit');
  if (mode === 'new') resetForm();
}

function resetForm() {
  state.editing = null; state.cover = null; state.gallery = []; state.pdf = { stagingId: null, thumbs: [], selected: [] }; pdfRemoved = false;
  $('#piece-form').reset(); $('#cover-preview').innerHTML = ''; $('#gallery-list').innerHTML = ''; $('#pdf-pages').innerHTML = '';
  $('#pdf-drop').textContent = 'Drag a PDF here, then click the pages to feature';
  $('#form-title').textContent = 'New piece'; $('#create').textContent = 'Create piece';
  $('#result').classList.add('hidden'); $('#form-msg').textContent = '';
}

$('#mode-new').addEventListener('click', () => setMode('new'));
$('#mode-edit').addEventListener('click', async () => { setMode('edit'); await loadList(); });

async function loadList() {
  const box = $('#pieces'); box.innerHTML = 'Loading…';
  const list = await (await fetch('/api/pieces')).json();
  box.innerHTML = '';
  for (const p of list) {
    const row = document.createElement('div');
    row.className = 'piece-row';
    row.innerHTML = `<span>${p.title} <span class="cat">${p.category}</span>${p.draft ? '<span class="badge">draft</span>' : ''}</span><span>edit →</span>`;
    row.addEventListener('click', () => loadPiece(p.slug));
    box.appendChild(row);
  }
  if (!list.length) box.textContent = 'No pieces yet.';
}

async function loadPiece(slug) {
  const p = await (await fetch(`/api/pieces/${slug}`)).json();
  resetForm();
  state.editing = slug;
  const f = $('#piece-form');
  f.title.value = p.title; f.category.value = p.category; f.context.value = p.context;
  f.role.value = p.role; f.outcome.value = p.outcome; f.year.value = p.year || '';
  $('#deliverables').value = (p.deliverables || []).join(', ');
  f.pullQuote.value = p.pullQuote || '';
  $('#draft').checked = !!p.draft;
  $('#cover-preview').innerHTML = `<img src="${p.heroUrl}" />`;
  state.gallery = p.gallery.map((name, i) => ({ kind: 'keep', name, url: p.galleryUrls[i] }));
  renderGallery();
  if (p.pdf && p.pdf.present) {
    const t = await (await fetch(`/api/pieces/${slug}/pdf-thumbs`)).json();
    state.pdf = { stagingId: null, thumbs: t.thumbs, selected: t.selected, replaced: false };
    $('#pdf-drop').textContent = `${t.pageCount} pages. Click to change which feature. Drag a new PDF to replace, or clear below.`;
    renderPdf();
    ensurePdfClearButton();
  }
  $('#form-title').textContent = `Editing: ${p.title}`;
  $('#create').textContent = 'Save changes';
  setMode('edit-loaded');
}

function ensurePdfClearButton() {
  if ($('#pdf-clear')) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'pdf-clear'; btn.textContent = 'Remove PDF';
  btn.addEventListener('click', () => {
    pdfRemoved = true; state.pdf = { stagingId: null, thumbs: [], selected: [], replaced: false };
    $('#pdf-pages').innerHTML = ''; $('#pdf-drop').textContent = 'PDF will be removed on save. Drag a new one to keep a deck.';
    btn.remove();
  });
  $('#pdf-pages').after(btn);
}

// ---- Build the gallery plan + pdf plan for submit ----
// Single pass so a 'new' tile's plan idx matches the Nth appended gallery file
// (the PUT endpoint maps idx -> uploaded file by this same order).
function galleryPlanAndFiles(fd) {
  let newIdx = 0;
  return state.gallery.map((item) => {
    if (item.kind === 'keep') return { kind: 'keep', name: item.name };
    fd.append('gallery', item.file, item.file.name);
    return { kind: 'new', idx: newIdx++ };
  });
}
function pdfPlan() {
  if (state.editing) {
    if (pdfRemoved) return { action: 'remove' };
    if (state.pdf.replaced && state.pdf.stagingId) return { action: 'replace', stagingId: state.pdf.stagingId, pages: state.pdf.selected };
    if (state.pdf.thumbs.length) return { action: 'repick', pages: state.pdf.selected };
    return { action: 'keep' };
  }
  return null; // create path uses pdfStagingId/pdfPages directly
}

$('#piece-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#form-msg'); msg.className = 'msg'; msg.textContent = '';
  const f = e.target; const fd = new FormData();
  ['title', 'category', 'context', 'role', 'outcome', 'year', 'pullQuote'].forEach((k) => fd.set(k, f[k]?.value || ''));
  fd.set('draft', $('#draft').checked ? 'true' : 'false');
  fd.set('deliverables', JSON.stringify(($('#deliverables').value || '').split(',').map((s) => s.trim()).filter(Boolean)));

  if (state.editing) {
    const plan = galleryPlanAndFiles(fd);
    fd.set('galleryPlan', JSON.stringify(plan));
    fd.set('pdfPlan', JSON.stringify(pdfPlan()));
    if (state.cover) fd.set('cover', state.cover, state.cover.name);
    $('#create').disabled = true; msg.textContent = 'Saving…';
    try {
      const res = await fetch(`/api/pieces/${state.editing}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showResult(data, f.title.value, 'update');
      msg.classList.add('ok'); msg.textContent = `Saved ${data.slug}.`;
    } catch (err) { msg.classList.add('err'); msg.textContent = err.message; }
    finally { $('#create').disabled = false; refreshStatus(); }
    return;
  }

  // ---- create path (unchanged behavior) ----
  if (!state.cover) { msg.classList.add('err'); msg.textContent = 'A cover image is required.'; return; }
  fd.set('cover', state.cover, state.cover.name);
  state.gallery.forEach((item) => { if (item.kind === 'new') fd.append('gallery', item.file, item.file.name); });
  if (state.pdf.stagingId && state.pdf.selected.length) {
    fd.set('pdfStagingId', state.pdf.stagingId);
    fd.set('pdfPages', JSON.stringify(state.pdf.selected));
  }
  $('#create').disabled = true; msg.textContent = 'Creating…';
  try {
    const res = await fetch('/api/piece', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    showResult(data, f.title.value, 'create');
    msg.classList.add('ok'); msg.textContent = `Created ${data.slug}.`;
  } catch (err) { msg.classList.add('err'); msg.textContent = err.message; }
  finally { $('#create').disabled = false; refreshStatus(); }
});

function showResult(data, title, mode) {
  $('#preview-link').href = data.previewUrl;
  $('#warnings').textContent = (data.warnings || []).join(' ');
  $('#result').dataset.title = title; $('#result').dataset.mode = mode;
  $('#result').classList.remove('hidden');
}

$('#publish').addEventListener('click', async () => {
  const m = $('#publish-msg'); m.className = 'msg'; m.textContent = 'Publishing…';
  $('#publish').disabled = true;
  try {
    const res = await fetch('/api/publish', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: $('#result').dataset.title || '', mode: $('#result').dataset.mode || 'create' }),
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

- [ ] **Step 4: Add a DOM-hook smoke test** (append to `tests/studio-edit-app.test.mjs`)

```js
test('studio UI serves the edit-mode hooks', async () => {
  const app = createApp({ repoRoot: process.cwd() });
  const { server, port } = await listen(app);
  try {
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    assert.match(html, /id="mode-edit"/);
    assert.match(html, /id="edit-list"/);
    const js = await (await fetch(`http://127.0.0.1:${port}/studio.js`)).text();
    assert.match(js, /galleryPlanAndFiles/);
    assert.match(js, /\/api\/pieces\//);
  } finally { server.close(); }
});
```

- [ ] **Step 5: Run to verify pass + full suite**

Run: `npm test`
Expected: PASS — entire suite, including the UI smoke test.

- [ ] **Step 6: Manual verification**

Run: `npm run studio`. In the browser:
1. Click **Edit existing** → the seeded pieces list appears.
2. Click `finance-real-piece` → form fills with its current copy, cover preview shows, draft checkbox reflects state.
3. Change the Outcome text, reorder/remove a gallery tile (if any), then **Save changes** → result card shows a working preview link; open it and confirm the change rendered.
4. Toggle the draft checkbox off and save → confirm the piece now renders in its room (or back on → empty-room stub).
5. **New piece** tab still creates a piece exactly as before (regression check).

Expected: each step behaves as described; preview reflects edits after hot reload.

- [ ] **Step 7: Commit**

```bash
git add scripts/studio/ui/index.html scripts/studio/ui/studio.js scripts/studio/ui/studio.css tests/studio-edit-app.test.mjs
git commit -m "feat: studio edit mode UI (switch, piece list, load + save)"
```

---

## Final verification

- [ ] Run `npm test` — entire suite green.
- [ ] Run `npm run build` — site builds clean (no content-collection or schema errors from edited pieces).
- [ ] Manual: edit the `finance-real-piece` placeholder copy via the studio, save, confirm preview, but do NOT publish unless the copy is real (the placeholder stays draft until Caleb supplies content).

## Self-review notes (resolved during planning)

- **Spec inconsistency fixed:** kept media is copied byte-identical (not re-optimized); only new uploads run through `optimizeImage`. The spec's gallery-plan step and risks note were updated to match before this plan was written.
- **EXDEV avoided:** temp build dir is repo-local (`.studio-tmp/`), so the swap rename is same-filesystem. This does NOT retroactively fix `createPiece`'s `os.tmpdir()` rename (a pre-existing, separately-tracked minor); this plan just does not reintroduce it.
- **Create stays byte-identical:** Task 1 routes create through the same `buildFrontmatter`/`optimizeImage` the original used inline; the existing create tests are the regression gate.
