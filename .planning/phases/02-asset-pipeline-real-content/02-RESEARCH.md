# Phase 2: Asset Pipeline + Real Content - Research

**Researched:** 2026-05-10
**Domain:** Build-time PDF rasterization pipeline + content authoring (Astro 5 + pdfjs-dist + @napi-rs/canvas + Sharp)
**Confidence:** HIGH (most areas verified locally or via official sources; 3 specific items flagged MEDIUM/LOW below)

## Summary

Phase 2 productionizes Phase 1's POC into `scripts/pdf-preprocess.mjs`, run via npm `prebuild` lifecycle hook. The verbatim Mozilla pattern (legacy/build/pdf.mjs entry, `pdfDocument.canvasFactory`, no `workerSrc`) already in `scripts/pdf-poc.mjs` carries forward unchanged — Phase 2 wraps it in (a) content-collection scanning, (b) hash-based incremental cache, (c) multi-page support driven by the new `pdfPaginate: number[]` schema, (d) WebP encoding via Sharp at 1600px long-edge q80, and (e) optional `fullPdf` source-PDF copy to `public/source-pdfs/[slug].pdf`. Generated outputs live at `public/generated/pdf-thumbs/[slug]/` and ARE committed to git per D-03.

The single architectural decision the planner needs to make is **how detail-page templates reference the generated WebP files**. Astro's `<Image>` component does NOT optimize images in `public/` (only `src/` assets). Two valid paths: (1) plain `<img>` with explicit width/height pointing at `/generated/pdf-thumbs/...`, or (2) emit thumbs into `src/assets/generated/` instead and use `<Image>` with `import.meta.glob` to resolve paths. Recommendation below: path (1) — output is already final-quality WebP, Sharp re-deriving is wasted work, and the simpler URL pattern survives content-collection refactors better.

**Primary recommendation:** Build `scripts/pdf-preprocess.mjs` as a single Node ESM script invoked by npm `prebuild`. Use `crypto.createHash('sha256')` over PDF bytes + the relevant frontmatter slice (`pdfPaginate`, `fullPdf`) for cache keys. Encode WebP via Sharp (`@napi-rs/canvas` raw PNG → Sharp `.webp({quality:80}).resize({width:1600})` → write). Move `pdfjs-dist` from devDep to a regular dep so it survives any future `NODE_ENV=production` install variant. Use plain `<img src="/generated/pdf-thumbs/[slug]/cover.webp" width="..." height="...">` on detail pages (record dimensions in the cache sidecar so the template can read them at build time).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PDF rasterization (PIECE-03) | Build pipeline (Node script) | — | Runs before Astro at `prebuild`; never at runtime; output committed to git |
| Cache invalidation | Build pipeline (Node script) | git | sha256 of input bytes + `.cache.json` sidecar; idempotent across `npm run build` invocations |
| Thumbnail serving | CDN / static (`public/`) | — | Cloudflare Pages serves `public/` paths verbatim — no Astro processing in the request path |
| Detail-page template render | Astro SSG | — | Reads frontmatter + reads `.cache.json` (or per-piece `meta.json`) to emit `<img>` tags with width/height |
| Resume PDF download (CONTACT-01/02) | CDN / static (`public/caleb-lim-resume.pdf`) | — | Direct download, no server logic |
| Source PDF download for `fullPdf` (PIECE-06) | CDN / static (`public/source-pdfs/[slug].pdf`) | Build pipeline | Build script copies from `src/content/pieces/[slug]/source.pdf` when `fullPdf` set |
| Bio + About page (ABOUT-01) | Astro SSG | content collection (or hard-coded page) | Static markdown rendered to `/about/`; word-count gate at smoke-test layer |
| Smoke verification | bash + grep | — | Phase 1's `scripts/verify-build.sh` extended with thumb / resume / bio gates |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pdfjs-dist` | `^5.7.284` (pinned, matches latest) [VERIFIED: `npm view pdfjs-dist version` returned 5.7.284] | PDF parsing + page rasterization | Mozilla's reference implementation; the only library with full font/CMap fidelity; Phase 1 POC validated with Caleb's 28MB / 64-page deck |
| `@napi-rs/canvas` | `^0.1.100` (transitive optionalDep of pdfjs) [VERIFIED: latest published is 1.0.0 but pdfjs 5.7's `pdfDocument.canvasFactory` expects the 0.1.x API; CONTEXT D-?? in Phase 1 RESEARCH flagged 1.0 as breaking incompat] | Skia-backed Canvas in Node | Required by pdfjs-dist's NodeCanvasFactory; zero system deps; prebuilt binaries for `linux-x64-gnu` (glibc ≥2.18 [VERIFIED: napi-rs/canvas README]) and `darwin-arm64` (Caleb's Mac) |
| `sharp` | `^0.34.5` (transitive via Astro 5; already installed) [VERIFIED: `node_modules/sharp/package.json`] | Image encoding/resizing | Bundled by Astro for `<Image>`; rasterized PNG → WebP at 1600px q80 lands at ~5KB on test fixtures (verified locally — see Code Examples) |
| `astro` | `^5.18.1` (pinned in Phase 1) | SSG framework | Already in use; no Phase 2 changes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:crypto` (stdlib) | — | sha256 over PDF bytes for cache keys | Hash inputs to detect when re-rasterization is needed |
| `node:fs/promises` (stdlib) | — | Async file IO | All script IO; avoid sync calls except where the API forces it (cmap/standardFontData paths in pdfjs config) |
| `node:path` (stdlib) | — | Cross-platform path joining | macOS dev → Linux CF Pages; never use string concatenation for paths |
| `astro:content` `getCollection` | — | Programmatic access to the content collection at build-time | Already in use in `[category]/[slug].astro`; the prebuild script can NOT use this (runs before Astro) — must read filesystem directly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm `prebuild` hook | Astro integration `astro:build:start` | Integration runs inside Astro's build lifecycle, gets clean access to content collection; but it complicates the "Caleb never runs this manually" story (it doesn't run during `astro dev` either, same as prebuild). Per D-?? Claude's Discretion: prebuild chosen for simplicity. CONFIRMED CORRECT. |
| Sharp for WebP encoding | `@napi-rs/canvas`'s built-in `encode('webp', q)` | napi-rs/canvas DOES export WebP directly [VERIFIED: `cv.toBuffer('image/webp')`, `cv.encodeSync('webp', q)`, and async `cv.encode('webp', q)` all work — tested locally]. But: napi-rs/canvas does NOT resize. Pipeline still needs Sharp for the 1600px long-edge resize. Recommendation: skip the canvas WebP encode, render PNG → Sharp resize+encode in one pass. Simpler, fewer intermediate buffers. |
| Manual page-array iteration | `pdf-page-counter` npm package | Stdlib `pdfDocument.numPages` is enough [VERIFIED: official pdfjs API]; no extra dep needed. |
| Hash full PDF bytes | Hash mtime + size | Hash bytes — mtime drifts under git checkouts. ~28MB sha256 is ~150ms; negligible compared to rasterization. |

**Installation:**
No new top-level installs strictly required (pdfjs-dist + napi-rs/canvas + sharp already present transitively or directly). However, recommend:

```bash
# Move pdfjs-dist out of devDependencies into dependencies
# (devDependencies on CF Pages: ambiguous — historically installed by `npm ci`, but a future
# NODE_ENV=production flip would skip them. Make pdfjs-dist a direct runtime dep
# of the build script.)
npm install --save pdfjs-dist@5.7.284
npm uninstall --save-dev pdfjs-dist  # removes from devDeps
# Pin sharp explicitly so we don't depend on Astro's transitive resolution
npm install --save-dev sharp@^0.34.5
```

**Version verification:** Verified 2026-05-10 against `npm view`:
- `pdfjs-dist@5.7.284` — current latest; pinned correctly in Phase 1.
- `@napi-rs/canvas@1.0.0` — latest published, but DO NOT bump. pdfjs-dist 5.7's expected `pdfDocument.canvasFactory` API is the 0.1.x shape. Stay on transitive 0.1.100.
- `sharp@0.34.5` — already installed transitively. Direct devDep pin recommended for explicit control.
- `astro@6.3.1` — latest is 6.x but project is on 5.18.1 (Phase 1 lock). Stay on 5.x.

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  Caleb runs `npm run build`  (or `npm install` triggers nothing — only │
│  `build` triggers `prebuild`)                                          │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  npm `prebuild` lifecycle  →  node scripts/pdf-preprocess.mjs          │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  1. Scan src/content/pieces/*/index.md                          │  │
│  │     - Read frontmatter (gray-matter or simple regex)            │  │
│  │     - Collect: slug, pdfPaginate?: number[], fullPdf?: string   │  │
│  │     - Locate adjacent source.pdf (if exists)                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  2. For each piece-with-source.pdf:                             │  │
│  │     a. sha256(pdf bytes) + JSON.stringify(pdfPaginate||[])      │  │
│  │     b. Read public/generated/pdf-thumbs/[slug]/.cache.json      │  │
│  │     c. If hash matches → SKIP (idempotent)                      │  │
│  │     d. Else: rasterize + encode + write + update cache          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  3. Rasterization (verbatim Mozilla pattern):                   │  │
│  │     - getDocument({ data, cMapUrl, standardFontDataUrl })       │  │
│  │     - For page 1 (always) + each page in pdfPaginate[]:         │  │
│  │       • pdfDocument.canvasFactory.create(w, h)                  │  │
│  │       • page.render({ canvasContext, viewport }).promise        │  │
│  │       • canvas.toBuffer('image/png')                            │  │
│  │       • sharp(png).resize({width:1600}).webp({quality:80})      │  │
│  │       • write to public/generated/pdf-thumbs/[slug]/cover.webp  │  │
│  │         or page-{N}.webp                                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  4. fullPdf side-effect (per piece):                            │  │
│  │     - If frontmatter.fullPdf set → cp source.pdf to             │  │
│  │       public/source-pdfs/[slug].pdf                             │  │
│  │     - else: ensure no stale public/source-pdfs/[slug].pdf       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  5. Write cache.json: { hash, generatedAt, pages: [{n, w, h,    │  │
│  │     bytes}] }                                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  npm `build`  →  astro build                                           │
│                                                                        │
│  - Reads content collection (now with the SAME source.pdf files but    │
│    Astro doesn't care about them — schema validates frontmatter only)  │
│  - Renders [category]/[slug].astro                                     │
│  - For each piece:                                                     │
│    • <Image src={hero}>  (existing — Phase 1 PNG hero, NOT the         │
│      generated WebP — see "Hero asset transition" below)               │
│    • If pdfPaginate: render <img src="/generated/pdf-thumbs/[slug]/    │
│      page-{N}.webp"> per page in array order (D-09)                    │
│    • If fullPdf: render <a href={fullPdf}>Open full PDF</a>            │
│  - public/generated/pdf-thumbs/** copied verbatim into dist/           │
│  - public/source-pdfs/** copied verbatim into dist/                    │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                          dist/  →  Cloudflare Pages CDN
```

### Component Responsibilities

| File | Responsibility |
|------|----------------|
| `scripts/pdf-preprocess.mjs` (NEW) | Discover PDFs, hash-cache, rasterize, encode, write outputs + sidecar cache |
| `scripts/pdf-poc.mjs` (existing) | Phase 1 reference; can stay or be deleted (D-05 said throwaway). Recommendation: delete after `pdf-preprocess.mjs` lands and is verified. |
| `package.json` `scripts` (modify) | Add `"prebuild": "node scripts/pdf-preprocess.mjs"`. Keep `pdf-poc` until `pdf-preprocess` ships. |
| `src/content.config.ts` (modify) | Migrate `pdfPaginate: z.boolean().optional()` → `pdfPaginate: z.array(z.number().int().positive()).optional()` (D-07). Add `.describe()` annotations. |
| `src/content/pieces/[slug]/source.pdf` (NEW per piece) | Source asset — colocated with markdown per Phase 1 D-04. Committed to git per D-01. |
| `src/content/pieces/[slug]/index.md` (modify per piece) | Real CRO blurbs (D-12); set `pdfPaginate` + `fullPdf` where applicable; hero may stay Phase-1-PNG OR migrate to point at the generated WebP (see Hero Transition below). |
| `src/content/pieces/about.md` OR `src/pages/about.astro` (NEW) | About page bio (ABOUT-01). |
| `public/caleb-lim-resume.pdf` (NEW) | Resume PDF, ≤1MB, EXIF-stripped (CONTACT-01/02). |
| `public/generated/pdf-thumbs/[slug]/cover.webp` (NEW, generated) | Page-1 cover for each PDF piece. |
| `public/generated/pdf-thumbs/[slug]/page-{N}.webp` (NEW, generated, per pdfPaginate) | Selected slides for multi-page decks. |
| `public/generated/pdf-thumbs/[slug]/.cache.json` (NEW, generated) | Hash + dimensions sidecar; committed per D-03. |
| `public/source-pdfs/[slug].pdf` (NEW, generated copy) | Build-time copy of source PDF, only when `fullPdf` set. |
| `src/pages/[category]/[slug].astro` (modify) | Optionally render `<img>` sequence below hero when `pdfPaginate` set; render `<a href={fullPdf}>` when set. |
| `src/pages/about.astro` (NEW) | About page. Resume download link. |
| `scripts/verify-build.sh` (extend) | Add gates for: thumbs exist for every piece with `source.pdf`, resume size ≤1MB, About bio word count 80–150. |

### Recommended Project Structure
```
src/
├── content/
│   ├── categories.ts                                   # unchanged
│   ├── pieces/
│   │   ├── [piece-slug]/
│   │   │   ├── index.md                                # frontmatter + CRO blurbs
│   │   │   ├── hero.png  OR  hero.webp                 # Phase 1 hero (manual export)
│   │   │   └── source.pdf                              # NEW — committed source asset (D-01)
│   │   └── ...
│   └── pages/
│       └── about.md                                    # NEW — bio (or src/pages/about.astro)
├── content.config.ts                                   # MODIFY — pdfPaginate schema migration
├── pages/
│   ├── about.astro                                     # NEW
│   ├── [category].astro                                # unchanged
│   └── [category]/[slug].astro                         # MODIFY — paginated pages + fullPdf link
public/
├── caleb-lim-resume.pdf                                # NEW — resume
├── generated/
│   └── pdf-thumbs/
│       └── [piece-slug]/
│           ├── cover.webp                              # NEW — page 1
│           ├── page-{N}.webp                           # NEW — paginated (per D-05)
│           └── .cache.json                             # NEW — hash + dims sidecar (D-03)
└── source-pdfs/
    └── [piece-slug].pdf                                # NEW — copy gated by fullPdf flag
scripts/
├── pdf-poc.mjs                                         # existing — delete or keep as ref
├── pdf-preprocess.mjs                                  # NEW — production pipeline
└── verify-build.sh                                     # MODIFY — extend gates
```

### Pattern 1: npm prebuild lifecycle hook
**What:** npm runs `prebuild` automatically before `build` if defined.
**When to use:** Build-time codegen / asset prep that must complete before the main build, with no manual invocation.
**Example (`package.json`):**
```json
{
  "scripts": {
    "prebuild": "node scripts/pdf-preprocess.mjs",
    "build": "astro build",
    "preview": "astro preview",
    "test:smoke": "bash scripts/verify-build.sh"
  }
}
```

`npm run build` on CF Pages → npm sees `prebuild` exists → executes it → on success runs `build`. On failure, `build` does NOT run (npm exits non-zero). [VERIFIED: standard npm lifecycle behavior — see https://docs.npmjs.com/cli/v10/using-npm/scripts]

**Caveat:** `prebuild` does NOT fire on `astro dev` (Astro's dev command does not invoke `npm run build`). Caleb editing a piece + adding a PDF locally needs to run `npm run build` once to regenerate thumbs (or run the script directly). For Phase 6's "Caleb adds a piece via GitHub.dev" flow, CF Pages' build will fire the hook. ACCEPTED per D-02.

### Pattern 2: Hash-based incremental cache (sidecar JSON)
**What:** Read input bytes, sha256, compare to cached hash. Skip work on match.
**When to use:** Expensive build steps with deterministic outputs over deterministic inputs. Standard in webpack/Rollup/Vite ecosystems but not formalized in any single library — write it inline.
**Example:**
```javascript
// scripts/pdf-preprocess.mjs (excerpt)
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

async function hashInputs(pdfPath, pdfPaginate) {
  const bytes = await fs.readFile(pdfPath);
  return createHash('sha256')
    .update(bytes)
    .update('|paginate=')
    .update(JSON.stringify(pdfPaginate ?? []))
    .digest('hex');
}

async function readCache(thumbDir) {
  try {
    const json = await fs.readFile(path.join(thumbDir, '.cache.json'), 'utf8');
    return JSON.parse(json);
  } catch { return null; }
}

async function shouldSkip(pdfPath, pdfPaginate, thumbDir) {
  const inputHash = await hashInputs(pdfPath, pdfPaginate);
  const cache = await readCache(thumbDir);
  return cache?.inputHash === inputHash ? cache : null;  // returns cache on hit, null on miss
}
```
[CITED: pattern derived from `node:crypto.createHash` standard usage; the pattern itself (input hash + sidecar JSON) is folkloric across build tools.]

### Pattern 3: Verbatim Mozilla pdfjs canvasFactory rasterization
**What:** Use pdfjs's built-in NodeCanvasFactory. Do NOT set GlobalWorkerOptions.workerSrc in Node. Do NOT instantiate @napi-rs/canvas directly.
**When to use:** Always, for Node-side PDF rasterization with pdfjs-dist 5.x.
**Example (existing `scripts/pdf-poc.mjs` carries forward verbatim):**
```javascript
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const CMAP_URL = './node_modules/pdfjs-dist/cmaps/';
const STANDARD_FONT_DATA_URL = './node_modules/pdfjs-dist/standard_fonts/';

const pdfDocument = await getDocument({
  data,                          // Uint8Array of PDF bytes
  cMapUrl: CMAP_URL,
  cMapPacked: true,
  standardFontDataUrl: STANDARD_FONT_DATA_URL,
}).promise;

const numPages = pdfDocument.numPages;            // [VERIFIED: official pdfjs API]
const canvasFactory = pdfDocument.canvasFactory;  // built-in NodeCanvasFactory in pdfjs 5.x

for (const pageNum of [1, ...(pdfPaginate ?? [])]) {
  if (pageNum > numPages) continue;               // skip out-of-range
  const page = await pdfDocument.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2.0 });   // 2x for downsample-friendly source
  const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const png = canvas.toBuffer('image/png');
  page.cleanup();
  // → Sharp encode (next pattern)
}
```
[VERIFIED: scripts/pdf-poc.mjs already uses this pattern; the Phase 1 POC ran exit 0 against Caleb's 28MB / 64-page deck.]

### Pattern 4: Sharp resize + WebP encode
**What:** PNG buffer → 1600px long-edge resize → WebP q80.
**When to use:** Every page rasterization output.
**Example:**
```javascript
import sharp from 'sharp';

const webpBytes = await sharp(png)
  .resize({ width: 1600, withoutEnlargement: true, fit: 'inside' })  // long-edge
  .webp({ quality: 80, effort: 4 })                                  // effort 4 = balanced
  .toBuffer();
const meta = await sharp(webpBytes).metadata();   // { width, height } for cache.json
await fs.writeFile(outputPath, webpBytes);
```
[VERIFIED locally: 2560×1440 source PNG (~22KB) resized to 1600px-long-edge WebP q80 = ~5KB. Real photographs / slide screenshots will run higher — D-04's 80KB target is realistic for slide content.]

**Note on `fit: 'inside'`:** preserves aspect ratio, fits within the 1600 box, so width=1600 OR height=1600 depending on orientation. This is what "long-edge" means. [VERIFIED: Sharp docs.]

### Pattern 5: Astro detail template — paginated `<img>` sequence
**What:** Conditional render of `<img>` sequence below hero when `pdfPaginate` is set.
**Example modification to `src/pages/[category]/[slug].astro`:**
```astro
---
// existing imports
import fs from 'node:fs/promises';
import path from 'node:path';

interface Props { piece: CollectionEntry<'pieces'>; }
const { piece } = Astro.props;
const { title, hero, context, role, outcome, category, pdfPaginate, fullPdf } = piece.data;
const slug = piece.id;

// Read .cache.json sidecar at build time for dimensions (avoids CLS)
let thumbCache: { pages: Array<{ n: number; w: number; h: number }> } | null = null;
try {
  const cachePath = path.join(process.cwd(), 'public', 'generated', 'pdf-thumbs', slug, '.cache.json');
  thumbCache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
} catch { /* no thumbs for this piece — skip pagination */ }

const paginatedPages = pdfPaginate && thumbCache
  ? pdfPaginate.map(n => thumbCache!.pages.find(p => p.n === n)).filter(Boolean)
  : [];
---
<!doctype html>
<html lang="en">
<!-- existing head -->
<body>
  <article>
    <h1>{title}</h1>
    <Image src={hero} alt={title} />  {/* existing Phase 1 hero — see "Hero transition" */}
    <section><h2>Context</h2><p>{context}</p></section>
    <section><h2>Role</h2><p>{role}</p></section>
    <section><h2>Outcome</h2><p>{outcome}</p></section>

    {paginatedPages.length > 0 && (
      <section class="paginated-pages">
        {paginatedPages.map(p => (
          <img
            src={`/generated/pdf-thumbs/${slug}/page-${p.n}.webp`}
            width={p.w}
            height={p.h}
            alt={`${title} — page ${p.n}`}
            loading="lazy"
          />
        ))}
      </section>
    )}

    {fullPdf && (
      <p><a href={fullPdf} download>Open full PDF</a></p>
    )}
  </article>
</body>
</html>
```
[CITED: Astro docs say `<Image>` requires imported assets; `public/` images use plain `<img>` with explicit width/height — https://docs.astro.build/en/guides/images/]

### Anti-Patterns to Avoid
- **Setting `GlobalWorkerOptions.workerSrc` in Node-side pdfjs.** Phase 1 RESEARCH flagged this as Pitfall in pdfjs 5.x; the legacy entry already runs the worker in-process. Adding a workerSrc breaks the build.
- **Passing the PDF buffer through `JSON.stringify` for caching.** It's binary; serialize the hash, not the content.
- **Putting generated outputs in `src/assets/generated/`.** This forces Sharp to re-process Sharp-encoded WebPs — a quality round-trip with no benefit. Stay in `public/`.
- **Using `fit: 'cover'` in Sharp resize.** That crops; we want full-page legibility. Use `fit: 'inside'` for long-edge.
- **Calling `astro:content` `getCollection` from `pdf-preprocess.mjs`.** That API only works inside Astro's runtime. The script must read filesystem directly.
- **Hand-rolling frontmatter parsing with regex.** Fragile. Either: (a) use `gray-matter` (small dep; standard); (b) use Astro's `astro/loaders` glob loader's parser by spawning a sub-Astro context — but that's over-engineering. **Recommend `gray-matter`.** ~25KB, zero transitive runtime deps. [VERIFIED: gray-matter is the de-facto standard for frontmatter parsing in Node.]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF parsing / rasterization | Custom canvas-based renderer | `pdfjs-dist` (already in Phase 1) | PDF spec is enormous; font subsetting, CMaps, encryption, embedded JS — Mozilla's library handles all of it |
| WebP encoding | `@napi-rs/canvas`'s built-in webp | Sharp (already transitive via Astro) | Need resize anyway; combining resize + encode in one Sharp call is simpler than canvas-encode then sharp-resize |
| Frontmatter parser | Regex on `---` blocks | `gray-matter` | Edge cases (escaped delimiters, YAML quoting, multi-line strings) cause silent corruption |
| Cache invalidation | mtime / size heuristics | sha256 over content bytes | mtime drifts under git checkouts; size collisions exist |
| EXIF stripping | Custom binary parser | `exiftool` (CLI) → `qpdf --linearize` | PDF metadata lives in multiple places (Info dict, XMP stream, embedded objects); reproducing this is a rabbit hole |
| File copying | Manual stream piping | `fs.copyFile` (stdlib) | One-liner; nothing to gain from streaming for ≤30MB PDFs |

**Key insight:** Every problem in this phase has a battle-tested solution. The script is glue code, not novel logic.

## Runtime State Inventory

> Phase 2 is a content + pipeline phase, NOT a refactor. The schema migration (`pdfPaginate: boolean → number[]`) is the only state-touching change. All other changes are additive.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — there is no datastore. Site is fully static. | None |
| Live service config | None — Cloudflare Pages reads from git, no service config divergence | None |
| OS-registered state | None — no OS-level registrations | None |
| Secrets/env vars | None new in Phase 2. (Phase 6 may add CF Pages env vars for production deploy; not Phase 2's concern.) | None |
| Build artifacts | (a) Existing `node_modules/` may need refresh after pdfjs-dist devDep→dep move; (b) `public/generated/` outputs become source-of-truth-in-git after Phase 2. (c) Phase 1's PLACEHOLDER pieces will be replaced — `npm run build` cache for old hero PNGs will go stale, but since `dist/` is gitignored this self-heals. | (a) `npm install` after package.json change. (b) Initial commit of generated outputs. |

| Schema migration: `pdfPaginate: z.boolean().optional()` → `z.array(z.number().int().positive()).optional()` | No data migration needed — Phase 1 RESEARCH (D-07) confirmed no piece sets this field. **However**: if any Phase 2 piece is authored with `pdfPaginate: true` (boolean) BEFORE the schema migrates, build will fail loudly. Schema migration must happen FIRST in the Phase 2 task ordering. | Order tasks: schema migration → preprocess script → piece authoring (pieces never set boolean form). |

**Nothing else found.** Confirmed by grepping for runtime stateful patterns (no Redis, no SQLite, no externalized config, no OS-registered timers).

## Common Pitfalls

### Pitfall 1: Astro `<Image>` cannot read `public/` paths as managed assets
**What goes wrong:** Naively writing `<Image src="/generated/pdf-thumbs/foo/cover.webp" />` fails — `<Image>` requires either an imported ESM asset or a remote URL with explicit dimensions, but the path-string variant is rejected.
**Why it happens:** Astro's image pipeline (Sharp re-derivation, srcset generation, layout shift prevention) is metadata-driven; it needs the import to resolve to an `ImageMetadata` object at build time.
**How to avoid:** Use plain `<img>` with explicit `width` and `height` attributes for `public/`-served images. Read dimensions from the `.cache.json` sidecar emitted by the prebuild script.
**Warning signs:** TypeScript error "Type 'string' is not assignable to type 'ImageMetadata'", or build error "Image is missing dimensions".
[CITED: Astro Images guide — https://docs.astro.build/en/guides/images/]

### Pitfall 2: @napi-rs/canvas 1.0 breaks pdfjs-dist 5.7's canvasFactory
**What goes wrong:** Bumping `@napi-rs/canvas` to 1.0.0 (latest) breaks `pdfDocument.canvasFactory.create(w, h)` — the API contract changed.
**Why it happens:** napi-rs/canvas 1.0 was a major breakage; pdfjs-dist 5.7's NodeCanvasFactory expects the 0.1.x interface.
**How to avoid:** Pin transitively. Do NOT add `@napi-rs/canvas` as a direct dep. If it appears in `package.json` direct deps, remove it. Phase 1 already dodged this; verify it stays dodged in Phase 2.
**Warning signs:** Runtime error "canvasFactory.create is not a function" or "context.canvas is undefined".

### Pitfall 3: Forgetting to set CMap/StandardFont URLs
**What goes wrong:** PDFs with non-Latin glyphs or unusual fonts render as boxes or white space.
**Why it happens:** pdfjs needs the font/CMap data files to resolve embedded font references; the `legacy/build` entry doesn't pre-bundle them.
**How to avoid:** Set both URLs to point at `node_modules/pdfjs-dist/cmaps/` and `node_modules/pdfjs-dist/standard_fonts/`. Phase 1's POC already does this — copy verbatim into `pdf-preprocess.mjs`.
**Warning signs:** Output WebP looks blank or has glyph boxes; pdfjs warns to stderr about missing CMaps.

### Pitfall 4: 1-indexed vs 0-indexed page numbers
**What goes wrong:** Caleb writes `pdfPaginate: [1, 5, 12]` expecting page 1 to mean the first page; script silently rasterizes page 0 (which doesn't exist) or page 2 (off-by-one).
**Why it happens:** pdfjs's `pdfDocument.getPage(n)` is **1-indexed** [VERIFIED: pdfjs API], but Caleb might also use array indexing intuitively (0-indexed).
**How to avoid:** Document in `src/content.config.ts` schema's `.describe()` annotation: "1-indexed page numbers — pdfPaginate: [1, 5, 12] means slides 1, 5, and 12 as the human reads them." Validate `n >= 1 && n <= pdfDocument.numPages` in the script and warn loudly on out-of-range.
**Warning signs:** Caleb reports "page 5 doesn't look like page 5".

### Pitfall 5: `prebuild` doesn't fire on `astro dev`
**What goes wrong:** Caleb edits a piece's frontmatter or replaces a `source.pdf` during `astro dev`; thumbs don't regenerate; site shows stale.
**Why it happens:** `astro dev` does NOT trigger `npm run build`. Only `npm run build` (or explicit `npm run prebuild`) invokes the hook.
**How to avoid:** Add a documented `npm run pdf-preprocess` script alias for manual invocation during development. Document in the SUMMARY's "Caleb workflow notes" section. For Phase 6's GitHub.dev flow, CF Pages runs `npm run build` server-side — the hook fires there. Caleb on his local Mac running dev doesn't see updated thumbs until he runs build (or the rebuild script).
**Warning signs:** Caleb says "I added a slide but the page didn't update."

### Pitfall 6: CF Pages devDependencies behavior under hypothetical NODE_ENV=production
**What goes wrong:** [LOW confidence] If CF Pages ever sets `NODE_ENV=production` during `npm ci`, devDependencies get skipped and `pdfjs-dist` (currently devDep) becomes unavailable to the prebuild script.
**Why it happens:** npm CLI documentation states `npm ci --omit=dev` (or `NODE_ENV=production`) skips devDeps. CF Pages currently runs `npm clean-install --progress=false` without `--omit=dev` [CITED: CF Pages build configuration docs], so devDeps install. But this is platform behavior, not contractual.
**How to avoid:** Move `pdfjs-dist` from `devDependencies` to `dependencies` in `package.json`. The prebuild script needs it at build time; "build-time" doesn't fit cleanly in either bucket, but if it's needed for the production build, treat it as a regular dep. (Sharp already arrives transitively via Astro's regular dep, so it's safe.)
**Warning signs:** First CF Pages deploy fails with `Cannot find module 'pdfjs-dist/legacy/build/pdf.mjs'`.

### Pitfall 7: Source PDF colocation inflates `git clone` cost
**What goes wrong:** D-01 commits `src/content/pieces/[slug]/source.pdf` to git. With 5–7 pieces × 5–30MB each, repo size jumps 200–500MB. Phase 1 D-04 + Phase 2 D-01 accept this; flagging here as a runtime impact for Caleb's GitHub.dev maintenance flow (Phase 6).
**Why it happens:** Git stores binary content with delta compression that's ineffective for already-compressed PDF bytes; each piece-add is roughly its file size in repo bloat.
**How to avoid (if it bites later):** Git-LFS migration. Out of scope for Phase 2 per D-01. Documented here so Phase 6 doesn't get surprised.
**Warning signs:** `git clone` takes >2 minutes on hotel wifi.

### Pitfall 8: `image()` schema helper rejects paths outside src/
**What goes wrong:** If a future "use generated WebP as hero" optimization is attempted, naively setting `hero: image()` to point at `public/generated/...` fails — `image()` only resolves paths under `src/`.
**Why it happens:** Astro's content collection image() helper requires the asset to be in the build pipeline.
**How to avoid:** For Phase 2, keep hero as a Phase-1-style PNG/JPG colocated under `src/content/pieces/[slug]/hero.png`. The generated WebP from `pdf-preprocess.mjs` is consumed via plain `<img>`, not `<Image>`. If a piece's hero IS the rendered PDF cover, do NOT auto-substitute — leave a manually-exported low-fidelity hero in `src/`, and treat the generated WebP as a separate paginated-pages-section image. This sidesteps the entire `image()` ↔ `public/` mismatch.
**Warning signs:** Build error "[LocalImageUsedWrongly]" — same error Phase 1's fault-injection produced.

### Pitfall 9: Resume PDF metadata leak
**What goes wrong:** Resume PDF exported from Word / LinkedIn / Google Docs carries author name, machine name, edit history, sometimes redacted-but-recoverable text overlays.
**Why it happens:** PDF metadata is layered (Info dict, XMP, embedded objects). Most "Save as PDF" exports preserve all of it.
**How to avoid:** Run through `exiftool -all:all= input.pdf -o stage.pdf && qpdf --linearize stage.pdf caleb-lim-resume.pdf`. Verify with `exiftool caleb-lim-resume.pdf` — should show only basic structural metadata (PDF version, page count). [CITED: gist.github.com/hubgit/6078384 — established exiftool+qpdf pattern]
**Warning signs:** Recruiter / HR opening Properties sees "Caleb_Lim_Drafts/Resume_v17_FINAL_real_final.pdf" or original author email.

## Code Examples

### Example 1: Full `scripts/pdf-preprocess.mjs` skeleton (verified pattern excerpts)
```javascript
// scripts/pdf-preprocess.mjs
// Source pattern: scripts/pdf-poc.mjs (Phase 1) + Mozilla pdf2png example
// Phase 2 D-02: runs as `npm run prebuild` — automatic, idempotent, hash-cached.

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
const RENDER_SCALE = 2.0;  // 2x for downsample headroom

async function discoverPieces() {
  const slugs = await fs.readdir(PIECES_DIR);
  const out = [];
  for (const slug of slugs) {
    const indexPath = path.join(PIECES_DIR, slug, 'index.md');
    const sourcePdfPath = path.join(PIECES_DIR, slug, 'source.pdf');
    try {
      const md = await fs.readFile(indexPath, 'utf8');
      const { data: fm } = matter(md);
      const hasPdf = await fs.access(sourcePdfPath).then(() => true, () => false);
      if (!hasPdf) continue;  // piece has no PDF — skip
      out.push({ slug, sourcePdfPath, pdfPaginate: fm.pdfPaginate, fullPdf: fm.fullPdf });
    } catch { /* skip */ }
  }
  return out;
}

async function hashInputs(pdfPath, pdfPaginate) {
  const bytes = await fs.readFile(pdfPath);
  return createHash('sha256')
    .update(bytes)
    .update('|paginate=')
    .update(JSON.stringify(pdfPaginate ?? []))
    .digest('hex');
}

async function rasterizePiece({ slug, sourcePdfPath, pdfPaginate, fullPdf }) {
  const thumbDir = path.join(OUTPUT_DIR, slug);
  const cachePath = path.join(thumbDir, '.cache.json');

  // Cache check
  const inputHash = await hashInputs(sourcePdfPath, pdfPaginate);
  try {
    const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    if (cached.inputHash === inputHash) {
      console.log(`SKIP ${slug} (cache hit)`);
      // still need to (re-)copy fullPdf if flag set — cheap idempotent op
      if (fullPdf) await copySourcePdf(slug, sourcePdfPath);
      return cached;
    }
  } catch { /* no cache, fall through */ }

  await fs.mkdir(thumbDir, { recursive: true });

  const data = new Uint8Array(await fs.readFile(sourcePdfPath));
  const pdfDocument = await getDocument({
    data, cMapUrl: CMAP_URL, cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  const numPages = pdfDocument.numPages;
  const pagesToRender = [1, ...((pdfPaginate ?? []).filter(n => n !== 1))];
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
    const outPath = path.join(thumbDir, outName);
    const webp = await sharp(pngBuf)
      .resize({ width: RESIZE_LONG_EDGE, height: RESIZE_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await fs.writeFile(outPath, webp);
    const meta = await sharp(webp).metadata();
    pageMeta.push({ n: pageNum, w: meta.width, h: meta.height, bytes: webp.length, file: outName });
    console.log(`OK ${slug}/${outName} ${meta.width}x${meta.height} (${(webp.length/1024).toFixed(1)}KB)`);
  }

  await pdfDocument.cleanup();

  // fullPdf side effect
  if (fullPdf) await copySourcePdf(slug, sourcePdfPath);

  const cacheData = { inputHash, generatedAt: new Date().toISOString(), pages: pageMeta };
  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
  return cacheData;
}

async function copySourcePdf(slug, sourcePdfPath) {
  await fs.mkdir(SOURCE_PDF_DIR, { recursive: true });
  await fs.copyFile(sourcePdfPath, path.join(SOURCE_PDF_DIR, `${slug}.pdf`));
}

async function main() {
  const pieces = await discoverPieces();
  console.log(`Found ${pieces.length} pieces with source.pdf`);
  for (const p of pieces) {
    try { await rasterizePiece(p); }
    catch (err) { console.error(`FAIL ${p.slug}:`, err.message); process.exit(1); }
  }
  console.log('DONE');
}

main().catch(err => { console.error(err); process.exit(1); });
```

### Example 2: Schema migration in `src/content.config.ts`
```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './content/categories';

const pieces = defineCollection({
  loader: glob({ base: './src/content/pieces', pattern: '**/index.md' }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    category: z.enum(CATEGORIES),
    role: z.string().min(1),
    outcome: z.string().min(1),
    context: z.string().min(1),
    hero: image(),
    order: z.number().int().min(1),
    draft: z.boolean().default(false),
    // D-07: Phase 2 migration — boolean → number[]; 1-indexed page numbers (Pitfall 4)
    pdfPaginate: z.array(z.number().int().positive())
      .optional()
      .describe('1-indexed page numbers from source.pdf to render below the hero. e.g. [1, 5, 12, 23, 47] renders pages 1, 5, 12, 23, 47 in that order. Page 1 (cover) renders automatically; including it in this array is harmless but redundant.'),
    // D-17: PIECE-06 — points at /source-pdfs/[slug].pdf (build-time copy)
    fullPdf: z.string().optional()
      .describe('Path to the full PDF for the "Open full PDF" link. Typically /source-pdfs/[slug].pdf — the prebuild script copies source.pdf to this location when this field is set.'),
    outcomeTagline: z.string().optional()
      .describe('Deferred — CONTENT-01, v2 only. Phase 2 ignores.'),
  }),
});

export const collections = { pieces };
```

### Example 3: Resume EXIF-strip recipe (macOS)
```bash
# Install if missing (one-time, on Caleb's Mac)
brew install exiftool qpdf

# Strip metadata + linearize
INPUT=~/Downloads/CalebLim_Resume_v17.pdf
exiftool -all:all= "$INPUT" -o /tmp/resume-stage.pdf
qpdf --linearize --deterministic-id /tmp/resume-stage.pdf public/caleb-lim-resume.pdf

# Verify
exiftool public/caleb-lim-resume.pdf | grep -iE 'author|creator|producer|title'
# Expected: minimal output, no name/email/machine traces

# Verify size
ls -lh public/caleb-lim-resume.pdf
# Expected: ≤1MB per Phase 2 SC4

rm /tmp/resume-stage.pdf
```
[CITED: gist.github.com/hubgit/6078384; cyberrunner.medium.com/removing-metadata-from-pdf-files-using-exiftool-and-qpdf-20090b75d7f0]

**Fallback if exiftool/qpdf unavailable:** ghostscript pipeline:
```bash
gs -o public/caleb-lim-resume.pdf -sDEVICE=pdfwrite \
  -dPDFSETTINGS=/prepress \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dPrintToFile=true \
  ~/Downloads/CalebLim_Resume_v17.pdf
```
[CITED: ghostscript pdfwrite docs — also handles size compression if input >1MB]

**Note on availability:** Verified 2026-05-10 on the executor host: NEITHER `exiftool` NOR `qpdf` NOR `gs` (ghostscript) is currently installed. Caleb (or a Phase 2 task) must `brew install exiftool qpdf` before running the strip. **Phase 2 plan must include this install step OR a node-side fallback (e.g. `pdf-lib`'s metadata stripping).**

### Example 4: Verify-build.sh extension
```bash
# Append to scripts/verify-build.sh

# Gate 7: every piece with source.pdf has a thumb generated
echo
echo "Phase 2 gates"
echo "============="
shopt -s nullglob
for piece_dir in src/content/pieces/*/; do
  slug=$(basename "$piece_dir")
  if [[ -f "$piece_dir/source.pdf" ]]; then
    thumb_dir="public/generated/pdf-thumbs/$slug"
    if [[ ! -f "$thumb_dir/cover.webp" ]]; then
      echo "  FAIL: $slug has source.pdf but no $thumb_dir/cover.webp"
      fail=1
    elif [[ ! -f "$thumb_dir/.cache.json" ]]; then
      echo "  FAIL: $slug has cover.webp but no .cache.json sidecar"
      fail=1
    else
      echo "  OK: $slug has cover.webp + cache"
    fi
  fi
done

# Gate 8: resume size budget
RESUME=public/caleb-lim-resume.pdf
if [[ ! -f "$RESUME" ]]; then
  echo "  FAIL: $RESUME missing — CONTACT-01 unmet"
  fail=1
else
  size_kb=$(($(wc -c < "$RESUME") / 1024))
  if (( size_kb > 1024 )); then
    echo "  FAIL: resume is ${size_kb}KB, exceeds 1024KB (1MB) budget"
    fail=1
  else
    echo "  OK: resume ${size_kb}KB (≤1MB)"
  fi
fi

# Gate 9: About page bio word count 80–150
ABOUT=dist/about/index.html
if [[ ! -f "$ABOUT" ]]; then
  echo "  FAIL: About page not built — ABOUT-01 unmet"
  fail=1
else
  # Crude: extract <article> body text, word-count
  words=$(sed -n '/<article/,/<\/article/p' "$ABOUT" \
    | sed -e 's/<[^>]*>//g' \
    | tr -s '[:space:]' ' ' \
    | wc -w | tr -d ' ')
  if (( words < 80 || words > 150 )); then
    echo "  FAIL: About bio is $words words; expected 80–150 (ABOUT-01)"
    fail=1
  else
    echo "  OK: About bio is $words words"
  fi
fi
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| iframe-embedded PDFs | Build-time rasterization to images | Project framing (Phase 1 PIECE-01) | Mobile Safari renders consistently; no third-party reader UX leak |
| Per-PDF custom converter scripts | Single ESM script via npm prebuild | Phase 2 (D-02) | One pipeline, one cache, one verify gate |
| Auto-pick "first N pages" or "evenly spaced" thumbnails | Caleb hand-curates pages via `pdfPaginate: number[]` | Phase 2 (D-08, D-09) | Avoids transition slides / disclaimers; lets Caleb lead with the punchline |
| `framer-motion` package | `motion` package (`motion/react` import) | 2024 (CLAUDE.md) | Renamed; Phase 2 doesn't use motion but if it did, this is the rule |
| `@studio-freight/lenis` | `lenis` package | 2024 (CLAUDE.md) | Same rename note |
| ImageMagick `convert` for PDF→PNG | pdfjs-dist + napi-rs/canvas | Phase 1 D-05 | No system dependency; works in CF Pages container |

**Deprecated/outdated:**
- `framer-motion` package name — irrelevant to Phase 2 but flagged for awareness.
- Phase 1's `scripts/pdf-poc.mjs` — Phase 2 SHOULD delete this once `pdf-preprocess.mjs` is verified, per D-05's "throwaway" intent. Keeping it longer than necessary risks future drift between the POC and the productionized script.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CF Pages V3 (Ubuntu 22.04, Node 22, x86_64) ships glibc ≥2.18, so @napi-rs/canvas-linux-x64-gnu loads | Standard Stack, CF Pages note | If wrong, build fails on CF Pages with "GLIBC_x.xx not found". Mitigation: Phase 2 task to verify on a CF Pages preview deploy BEFORE depending on it for production. Phase 1 deferred this — Phase 2 owes it. [Per Phase 1 D-???, Linux parity is a Phase 2 concern.] |
| A2 | `npm clean-install` on CF Pages installs devDependencies (no NODE_ENV=production override) | Standard Stack, Pitfall 6 | If wrong, pdfjs-dist (devDep) is unavailable to the prebuild script. Mitigation: move pdfjs-dist to regular `dependencies` in package.json — eliminates the risk regardless of CF Pages behavior. |
| A3 | Sharp's WebP encoder at q80 + 1600px hits ~80KB per page on real slide content | Output Format | Local test on synthetic content was ~5KB; real photographic slides will be 5–10× higher. If the average exceeds 80KB significantly, FOUND-02's <2s first-paint target tightens. Mitigation: SC1's 80KB target is per-page guidance, not contractual; Phase 5 (perf) is the real budget owner. |
| A4 | Caleb has macOS Homebrew available for `brew install exiftool qpdf` | Code Examples (resume strip) | If not, fallback to ghostscript pipeline (also Homebrew) or use a node-side library. Verified 2026-05-10: none of these tools currently installed on the executor host. Phase 2 plan task should include the install. |
| A5 | The 5–7 v1 pieces' PDFs are all ≤30MB and ≤100 pages | Performance / cache budget | Phase 1 POC ran on a 28MB / 64-page deck cleanly. Larger decks will increase rasterization time but not break the pipeline. |
| A6 | Astro's `<Image>` cannot reference `public/`-served paths | Pitfall 1, Pattern 5 | [VERIFIED via Astro docs] — Astro requires imported assets or remote URLs for `<Image>`. The plain `<img>` recommendation stands. |
| A7 | sha256(pdfBytes + pdfPaginateJSON) is sufficient cache key | Pattern 2 | Excludes RENDER_SCALE / RESIZE_LONG_EDGE / WEBP_QUALITY constants. If those change between runs (script edit), cache stays "valid" but outputs are stale. Mitigation: include a pipeline-version constant in the hash: `.update('|v=2')` and bump on script changes. Or hash the script source itself. |
| A8 | Caleb authors bio + finalizes blurbs during Phase 2 execution (not pre-supplied) | Content Scope D-13/D-14 | Per CONTEXT.md decisions, this is the agreed plan. If Caleb is unavailable, Phase 2 stalls at the human-action checkpoints — same pattern as Phase 1's user-override checkpoints. Plan should structure tasks so non-content tasks (preprocess script, schema migration, About route, smoke gates) can complete independently of content tasks. |

## Open Questions

1. **CF Pages Linux verification venue**
   - What we know: Phase 1 deferred this (Option C — local macOS only). napi-rs/canvas requires glibc ≥2.18; CF Pages V3 is Ubuntu 22.04 (glibc 2.35) [VERIFIED via napi-rs/canvas docs + CF Pages V3 changelog]. The risk is theoretical-low.
   - What's unclear: Whether Caleb has a Cloudflare account connected to a git remote, or whether this should be Docker-simulated locally instead.
   - Recommendation: First Phase 2 task (or sub-task) — push a branch with the prebuild script + a small test PDF, observe CF Pages preview build logs. If the project's git remote is GitHub-backed but no CF Pages connection exists yet, fall back to `docker run --rm -v $PWD:/app -w /app node:22-bookworm bash -c "npm ci && npm run build"`. Bookworm is glibc 2.36 — close enough to CF Pages V3's 2.35.

2. **Where does the About bio live — markdown collection or `.astro` page?**
   - What we know: ABOUT-01 just specifies the content (80–150-word first-person bio). The structural decision is downstream.
   - What's unclear: Whether to add an `about` content collection (parallel to `pieces`) or hard-code in `src/pages/about.astro`.
   - Recommendation: Hard-code in `src/pages/about.astro`. Single page, no schema reuse value, simpler. The collection pattern's only benefit is bulk content management — there's exactly one bio.

3. **Phase 1's PLACEHOLDER pieces — replace or delete?**
   - What we know: All four Phase 1 pieces are PLACEHOLDER stand-ins. CONTEXT.md D-11 says delete `phase-1-skeleton` (Personal placeholder). The other three (design/finance/marketing) likely get replaced piece-for-piece.
   - What's unclear: Whether Caleb has 1 real Design + 1 real Finance + 1 real Marketing piece ready, or whether these get replaced wholesale.
   - Recommendation: Plan task structure as "delete `phase-1-skeleton`" + "replace each placeholder piece with real content as Caleb supplies it" — same human-action checkpoint pattern as Phase 1 Task 3.

4. **Should generated outputs be `git add`'d during the Phase 2 work, or is there a separate "first-time generate + commit" step?**
   - What we know: D-03 says outputs ARE committed.
   - What's unclear: When in the Phase 2 task ordering does the first commit of `public/generated/pdf-thumbs/**` happen?
   - Recommendation: Add a dedicated task at the end of Phase 2 — "run `npm run prebuild`, verify outputs, `git add public/generated/`, commit." Avoid coupling output-generation to schema-migration or piece-authoring tasks.

5. **Hero asset transition — keep Phase 1 PNG hero or migrate to generated WebP?**
   - What we know: Phase 1 D-10 said heroes are plain images. Phase 2 generates WebPs from page 1 of each PDF. A piece's `cover.webp` IS effectively a high-fidelity hero.
   - What's unclear: Whether to (a) keep a separate `hero.png` per piece (Phase 1 pattern, manually-supplied), or (b) point the schema's `hero` field at the generated WebP.
   - Recommendation: **Keep separate hero.** Astro's `image()` schema helper can't resolve `public/`-served paths (Pitfall 8). Mixing two image pipelines is messy. The hero is for galleries (Phase 3 territory), where the magazine-grade composition needs deliberate cropping; the auto-rasterized cover.webp may be too tall/wide. Treat them as different assets that happen to share a source.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | All build steps | ✓ | v24.15.0 (project pins v22.16.0 via `.nvmrc`) | — |
| npm | All build steps | ✓ | (bundled) | — |
| `pdfjs-dist` | pdf-preprocess script | ✓ | 5.7.284 (devDep currently — recommend dep) | — |
| `@napi-rs/canvas` | pdf-preprocess script (transitively) | ✓ | 0.1.100 (transitive, correct version) | — |
| `sharp` | pdf-preprocess script | ✓ | 0.34.5 (transitive via Astro) | — |
| `gray-matter` | pdf-preprocess frontmatter parsing | ✗ | — | `npm install --save-dev gray-matter` (recommend) |
| `astro` | Build | ✓ | 5.18.1 | — |
| `exiftool` | Resume EXIF strip | ✗ | — | `brew install exiftool` OR ghostscript pipeline OR `pdf-lib` node library |
| `qpdf` | Resume linearization | ✗ | — | `brew install qpdf` OR ghostscript with `-dPDFSETTINGS=/prepress` |
| `ghostscript` (`gs`) | Resume strip fallback | ✗ | — | `brew install ghostscript` |
| Caleb's resume PDF source | CONTACT-01/02 | (human-supplied) | — | Defer to Caleb-supplies-content checkpoint |
| Caleb's 5–7 piece PDFs | PIECE-03/04 content | (human-supplied) | — | Same as above |
| Cloudflare Pages preview build | Linux parity verification (A1) | unknown | — | Docker simulation: `docker run --rm node:22-bookworm` |

**Missing dependencies with no fallback:**
- None — every gap has a documented fallback.

**Missing dependencies with fallback:**
- `gray-matter` — install as devDep (recommended path).
- `exiftool` + `qpdf` — install via Homebrew (one-time setup), or fall back to ghostscript or `pdf-lib`.
- CF Pages preview venue — Docker fallback if no CF account connection yet.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bash + grep (`scripts/verify-build.sh` extends Phase 1's smoke verifier) — no test runner installed; Phase 1 chose grep-over-dist as the sampling instrument; Phase 2 continues |
| Config file | `scripts/verify-build.sh` (existing) |
| Quick run command | `npm run test:smoke` (after `npm run build`) |
| Full suite command | `npm run build && npm run test:smoke` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIECE-03 | Every piece with source.pdf has a generated cover.webp | smoke | `bash scripts/verify-build.sh` (gate 7) | ❌ Wave 0 — extend verify-build.sh |
| PIECE-03 | Cache sidecar `.cache.json` exists alongside cover.webp | smoke | `bash scripts/verify-build.sh` (gate 7) | ❌ Wave 0 |
| PIECE-04 | Multi-page deck with `pdfPaginate: [N1, N2, ...]` produces page-{N}.webp for each N | smoke | `bash scripts/verify-build.sh` (new gate) | ❌ Wave 0 |
| PIECE-04 | Detail page HTML for paginated piece contains `<img src="/generated/pdf-thumbs/[slug]/page-{N}.webp">` for each N in pdfPaginate | smoke | grep over `dist/[cat]/[slug]/index.html` | ❌ Wave 0 |
| PIECE-06 | Detail page HTML for piece with `fullPdf:` set contains `<a href="/source-pdfs/[slug].pdf"` (or specified fullPdf path) | smoke | grep over dist/ | ❌ Wave 0 |
| PIECE-06 | `public/source-pdfs/[slug].pdf` exists when frontmatter sets fullPdf | smoke | `[[ -f public/source-pdfs/[slug].pdf ]]` | ❌ Wave 0 |
| FOUND-05 | At least 5 pieces total in `src/content/pieces/` (excluding `phase-1-skeleton`); at least one each in design + marketing | smoke | new bash gate counting `find src/content/pieces/*/index.md` | ❌ Wave 0 |
| ABOUT-01 | About page route exists at `dist/about/index.html` | smoke | `[[ -f dist/about/index.html ]]` | ❌ Wave 0 |
| ABOUT-01 | About page bio body word count is 80–150 | smoke | sed + wc -w over dist/about/index.html | ❌ Wave 0 |
| ABOUT-01 | About bio does NOT contain banned filler ("passionate", "multidisciplinary", "intersection of") | smoke | `grep -iE 'passionate\|multidisciplinary\|intersection of' dist/about/index.html` — must NOT match | ❌ Wave 0 |
| CONTACT-01 | `public/caleb-lim-resume.pdf` exists | smoke | `[[ -f public/caleb-lim-resume.pdf ]]` | ❌ Wave 0 |
| CONTACT-01 | Resume size ≤1MB | smoke | `wc -c < public/caleb-lim-resume.pdf` ≤ 1048576 | ❌ Wave 0 |
| CONTACT-01 | Resume EXIF stripped (no Author/Creator metadata leaking author email) | manual+smoke | `exiftool -j public/caleb-lim-resume.pdf` then assert no `Author` field with PII; or accept manual verification with documented checklist | ❌ Wave 0 (manual checklist sufficient if exiftool unavailable on executor host) |
| CONTACT-02 | About page HTML contains `<a href="/caleb-lim-resume.pdf"` | smoke | grep over `dist/about/index.html` | ❌ Wave 0 |
| (cross) | `npm run build` exits 0 (existing Phase 1 gate carries through) | smoke | `npm run build; echo $?` | ✅ existing |
| (cross) | Schema rejects `pdfPaginate: true` (boolean form, post-migration) | fault-injection | manual: write a test piece with old shape, run `npx astro sync`, expect failure | ❌ Wave 0 — document in plan, run manually as Caleb supplies pieces |

### Sampling Rate
- **Per task commit:** `npm run build && npm run test:smoke` (single command — verifies the slice end-to-end)
- **Per wave merge:** Same; build is fast enough (<30s for 5–7 pieces; ~1–2min cold)
- **Phase gate:** `npm run build && npm run test:smoke` GREEN, plus manual UAT checklist (open About page in preview, verify bio reads as practitioner-coded; verify resume downloads and opens; click through one paginated piece)

### Wave 0 Gaps
- [ ] Extend `scripts/verify-build.sh` with gates 7 (thumbs+cache), 8 (resume size), 9 (bio word count + banned-phrase grep), 10 (paginated `<img>` presence), 11 (fullPdf link presence) — all bash; all work over `dist/` and over the source tree.
- [ ] Add `gray-matter` devDep (Wave 0 of the preprocess script).
- [ ] Move `pdfjs-dist` to direct `dependencies` (Wave 0 of the preprocess script — eliminates A2 risk).
- [ ] Document EXIF-strip recipe in the resume task; include `exiftool`/`qpdf` install step OR fall back to documented ghostscript or `pdf-lib` path.
- [ ] CF Pages parity verification — first-task or alongside-first-task action.

## Sources

### Primary (HIGH confidence)
- Phase 1 RESEARCH (referenced via `01-03-SUMMARY.md`) — verbatim Mozilla pdf2png pattern, exit codes, devDep/transitive napi-rs/canvas resolution.
- `scripts/pdf-poc.mjs` (existing, working) — Phase 1 POC ran exit 0 against Caleb's 28MB / 64-page deck on macOS Node 24.15.0.
- Astro Images guide: https://docs.astro.build/en/guides/images/ — `<Image>` requires imported assets or URLs; public/ images need explicit dimensions.
- Astro Content Collections guide: https://docs.astro.build/en/guides/content-collections/ — `image()` schema helper resolves only paths under `src/`.
- npm-ci docs: https://docs.npmjs.com/cli/v10/commands/npm-ci — `--omit=dev` / `NODE_ENV=production` semantics.
- Cloudflare Pages V3 build image changelog: https://developers.cloudflare.com/changelog/post/2025-05-30-pages-build-image-v3/ — Node 22 default, Ubuntu 22.04, x86_64.
- Cloudflare Pages build configuration: https://developers.cloudflare.com/pages/configuration/build-configuration/ — `npm clean-install` runs by default.
- @napi-rs/canvas npm: https://www.npmjs.com/package/@napi-rs/canvas — Skia backend, glibc ≥2.18 requirement, prebuilt binaries for linux-x64-gnu and darwin-arm64.
- Local `node -e` verification (this research session) — confirmed `cv.toBuffer('image/webp')`, `cv.encodeSync('webp', q)`, async `cv.encode('webp', q)` all work; Sharp resize→WebP at 1600px q80 produced ~5KB on synthetic test fixture.
- `npm view` (this research session) — pdfjs-dist@5.7.284, @napi-rs/canvas@1.0.0, sharp@0.34.5, astro@6.3.1 confirmed as latest published.

### Secondary (MEDIUM confidence)
- Cloudflare Pages glibc/Linux discussions — community.cloudflare.com threads + cheezychinito.com migration guide; consistent that V3 is Ubuntu 22.04 with modern glibc.
- ExifTool + qpdf gist — gist.github.com/hubgit/6078384 + cyberrunner.medium.com — established pattern, multiple corroborating sources.
- Sharp metadata + resize semantics — Sharp's official npm docs (didn't deep-fetch in this session; standard Sharp API knowledge).

### Tertiary (LOW confidence)
- Specific 80KB-per-page WebP target — D-04 spec, not measured against real Caleb-content; flagged in A3.
- The risk that CF Pages flips NODE_ENV to production and skips devDeps — A2; based on npm-CLI behavior + lack of explicit CF Pages contract. Mitigation (move pdfjs-dist to deps) is cheap regardless.

## Project Constraints (from CLAUDE.md)

- **Tech stack lock:** Astro 5 + content collections + pdfjs-dist + @napi-rs/canvas + Sharp. Cloudflare Pages free tier. Cloudflare Registrar.
- **No CMS, no DB.** Static site only. Phase 2's "preprocess script" is build-time only — no runtime endpoints.
- **No Tailwind defaults shipped untouched.** Phase 2 doesn't add UI; not directly applicable, but the `paginated-pages` section's CSS (when added in Phase 3) must use a custom design system, not stock Tailwind.
- **Forbidden: `framer-motion` package (use `motion`); `@studio-freight/lenis` (use `lenis`); shadcn defaults; Inter font.** Phase 2 doesn't touch any of these but the constraint stands.
- **Maintenance is non-developer (Caleb):** every script must be invokable via `npm run X`; no manual setup beyond `npm install`. EXIF-strip is the one exception — documented as a one-time install in the SUMMARY.
- **GSD workflow enforcement:** All file changes go through GSD command paths; this research feeds `gsd-planner` next.

## User Constraints (from CONTEXT.md)

### Locked Decisions
[Copy verbatim from CONTEXT.md ## Implementation Decisions; cited inline above by D-XX where referenced]
- D-01: Source PDFs commit to git, colocated at `src/content/pieces/[slug]/source.pdf`
- D-02: `scripts/pdf-preprocess.mjs` runs as `prebuild` hook; hash-based incremental cache; CF Pages cold-build re-rasterizes; warm-build no-ops
- D-03: Generated outputs in `public/generated/pdf-thumbs/**` ARE committed (including `.cache.json`)
- D-04: WebP at 1600px long-edge, ~80KB target per page (q80)
- D-05: Filenames `cover.webp` (page 1) + `page-{N}.webp` (paginated; N is literal page number)
- D-06: PNG and 2000px+ rejected; per-piece overrides allowed (out of scope for Phase 2 default)
- D-07: Schema migration `pdfPaginate: boolean → array(number)`; 1-indexed
- D-08: Caleb hand-picks pages; no auto-pick heuristic
- D-09: Pages render in order specified (no re-sorting)
- D-10: 5–7 pieces at launch; partial coverage; FUTURE-06 backfills
- D-11: Empty discipline → drop card per SPLASH-04; delete `phase-1-skeleton`
- D-12: Full-length CRO blurbs (Context 3–6 lines, Role 1–3 lines, Outcome 1–3 lines); practitioner-coded voice
- D-13: Caleb authors blurbs piece-by-piece during Phase 2 with Claude assistance
- D-14: Bio drafted collaboratively; 80–150 words; takes a stance (no "passionate / multidisciplinary / intersection of")
- D-15: Resume PDF supplied by Caleb; ≤1MB, EXIF-stripped, canonical filename `caleb-lim-resume.pdf` at `public/`
- D-16: Paginated decks render as static `<img>` sequence below hero (no carousel/lightbox)
- D-17: `fullPdf: string` frontmatter; build-time copy to `public/source-pdfs/[slug].pdf`

### Claude's Discretion
[Copy verbatim from CONTEXT.md]
- PDF library invocation: continue verbatim Mozilla pattern from POC
- Sharp configuration: Astro defaults
- Pre-build script invocation: npm `prebuild` lifecycle hook (NOT Astro integration)
- EXIF stripping: exiftool → ghostscript → qpdf fallback chain; document chosen path
- Bio drafting source: PROJECT.md + REQUIREMENTS.md ABOUT-01 + Caleb's history
- CF Pages Linux parity verification — Phase 2 owes this from Phase 1

### Deferred Ideas (OUT OF SCOPE)
[Copy verbatim from CONTEXT.md]
- Per-piece secondary images / detail spreads (FUTURE-04)
- Outcome tagline rendered on Finance gallery cards (CONTENT-01)
- "Show me everything" curated 6-piece tour link (CONTENT-02)
- OG image generation per piece (FUTURE-03)
- Calendly embed (FUTURE-01)
- Privacy-first analytics (FUTURE-02)
- Remaining pieces toward FOUND-05 full target (~18 pieces) (FUTURE-06)
- Personal Projects content materializing (FUTURE-05)
- Magazine-maximalist visual system — Phase 3
- Header chrome (mailto / LinkedIn / Resume header link) — Phase 4
- Prev/next within discipline + Back to Category — Phase 4 (PIECE-05)
- Mobile / perf / a11y polish — Phase 5
- Production deploy + maintenance handoff — Phase 6

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIECE-03 | PDFs and slide decks rasterized to images at build time (`pdfjs-dist` + `@napi-rs/canvas`) — page-1 cover as hero, full deck as paginated sequence for multi-page assets | Pattern 3 (verbatim Mozilla rasterization) + Pattern 4 (Sharp WebP encode) + Example 1 (full pdf-preprocess.mjs skeleton); validation via verify-build.sh gate 7 |
| PIECE-04 | Multi-page slide decks render 3–6 representative slides as a vertical sequence below the hero | Pattern 5 (Astro detail template paginated `<img>` sequence) + Pitfall 4 (1-indexed page numbers); validation via verify-build.sh new gate (paginated `<img>` HTML presence) |
| PIECE-06 | Optional "Open full PDF" download link surfaces on pieces where the original PDF is sharable | Component Responsibilities table (`public/source-pdfs/[slug].pdf` build-time copy) + Example 1 `copySourcePdf` function + Pattern 5 template `{fullPdf && <a download>}`; validation via verify-build.sh gate (file exists + HTML link present) |
| FOUND-05 | Launches with 5–15 pieces total, asymmetrically distributed | Open Question 3 (replace Phase 1 placeholders) + D-10 (5–7 minimum); validation via verify-build.sh new gate (count pieces by category) |
| ABOUT-01 | About page hosts an 80–150-word first-person bio establishing the cross-functional analyst+brand pitch | Open Question 2 (recommend `src/pages/about.astro` over content collection) + Pitfall reference to D-14 banned phrases; validation via verify-build.sh gates 9 + banned-phrase grep |
| CONTACT-01 | Resume PDF linked from the header on every page — direct download, no email gate | Phase 2 only ensures the resume FILE exists at canonical path; header chrome is Phase 4. Validation: file exists + size budget. Header link is Phase 4's contract. |
| CONTACT-02 | Resume linked from the About page | About page template renders `<a href="/caleb-lim-resume.pdf" download>`; validation via grep over `dist/about/index.html` |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via `npm view` 2026-05-10; pipeline pattern verified via local Node test of canvas+Sharp.
- Architecture: HIGH — npm prebuild lifecycle is documented; Astro `<Image>` vs `public/` distinction is documented; cache sidecar pattern is folkloric but trivially correct.
- Pitfalls: HIGH for #1, #2, #3, #4, #5 (all cross-referenced to Phase 1 RESEARCH or Astro docs); MEDIUM for #6 (CF Pages NODE_ENV behavior, mitigated by moving to deps); HIGH for #7, #8, #9 (well-documented).
- Validation: HIGH — gates are concrete bash; Phase 1's verify-build.sh extension pattern is established.

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (30 days; pdfjs-dist and Astro change cadence is ~monthly; @napi-rs/canvas is stable on the 0.1.x line until pdfjs-dist's NodeCanvasFactory contract changes)

---
*Phase: 02-asset-pipeline-real-content*
*Researched: 2026-05-10*
