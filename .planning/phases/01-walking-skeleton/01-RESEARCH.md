# Phase 1: Walking Skeleton — Research

**Researched:** 2026-05-09
**Domain:** Astro 5 content collections + colocated `image()` schema, nested dynamic routing, build-time PDF rasterization (`pdfjs-dist` + `@napi-rs/canvas`), Cloudflare Pages preview deploys
**Confidence:** HIGH

## Summary

Astro 5's content layer (the new `glob()` loader + `src/content.config.ts`) is the only correct path here — the legacy collections API is deprecated and silently downgrades the build. The colocated piece-folder pattern that D-04 specifies is officially supported by Astro's `image()` schema helper using paths relative to the markdown file. Zod (still v3 in Astro 5; v4 is Astro 6 territory) enforces missing-field errors loudly at build time when fields aren't `.optional()`. Nested dynamic routes (`[category]/[slug].astro`) are stable in Astro 5 and require both `category` and `slug` keys in `getStaticPaths()` params.

The PDF rasterization POC has a known historical landmine — pdfjs-dist 4.9.124 through ~4.9.154 had a regression that broke `@napi-rs/canvas` resolution under bundling. **Fixed in 4.9.155 and remains fixed in current 5.7.284.** As of 2026-05, the canonical Mozilla `examples/node/pdf2png/pdf2png.mjs` works directly. Pin `pdfjs-dist@^5.7.284` and let npm pull `@napi-rs/canvas@^0.1.100` automatically as an optional dependency. Cloudflare Pages v3 build image (Ubuntu 22.04, Node 22.16.0, glibc 2.35) satisfies every constraint — pdfjs-dist 5.7 requires Node ≥22.13.0, @napi-rs/canvas needs glibc ≥2.18, and prebuilt linux-x64-gnu binaries ship via optional deps so no node-gyp / native compile is needed.

Cloudflare Pages preview branches are wired automatically once the Git integration is connected — every non-production-branch push gets a unique `<hash>.<project>.pages.dev` preview URL. This is the right venue for running the PDF POC against the production build platform per D-05.

**Primary recommendation:** Pin `astro@^5.18`, `pdfjs-dist@^5.7.284`, Node ≥22.13 (use Cloudflare's default 22.16). Use the new content layer (no legacy flag). Keep the POC a separate `npm run pdf-poc` script triggered manually from CI logs / a preview build, not a pre-build hook.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Routing (splash, gallery, detail) | Astro static build | — | All routes prerender; no SSR needed |
| Content schema validation | Build (Zod via content layer) | — | Build fails if frontmatter missing required fields |
| Image optimization (hero) | Build (Astro `<Image />` / `image()` helper) | — | Sharp-backed; handled by Astro itself, not the POC |
| PDF rasterization POC | Standalone Node script (`scripts/pdf-poc.mjs`) | Cloudflare Pages build env (proving ground) | Throwaway per D-05; not on the main build path |
| Static asset serving | Cloudflare Pages CDN | — | Out-of-the-box once deploy wired |
| Preview URL | Cloudflare Pages git integration | — | Per-branch URL = D-05's "test in real prod env" venue |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | `^5.18.1` | Static site framework | CLAUDE.md pin; latest 5.x stable. Astro 6.3.1 is current but Zod 4 inside it has a known IDE type-resolution bug for the `({ image }) =>` schema form (#16001). Stay on 5. [VERIFIED: `npm view astro@5 versions`] |
| `pdfjs-dist` | `^5.7.284` | PDF parsing + rendering | Mozilla's official PDF.js Node distribution. 5.7.284 was published 2026-04-27. Bundles `@napi-rs/canvas` integration via createRequire — no longer the broken hardcoded path that 4.9.124 shipped. [VERIFIED: `npm view pdfjs-dist version`] |
| `@napi-rs/canvas` | `^0.1.100` | Skia-backed Node canvas | Optional dep of `pdfjs-dist@^5.7.284`. Auto-installed. **Do NOT install `@napi-rs/canvas@1.0.0`** — major version published 2026-05-04, pdfjs 5.7 declares `^0.1.100` and 1.0 is incompatible. [VERIFIED: `npm view pdfjs-dist@5.7.284 optionalDependencies`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod (re-exported via `astro/zod`) | 3.25.76 (bundled with Astro 5) | Schema validation | Always for content collections — import as `import { z } from 'astro/zod'` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pdfjs-dist` + `@napi-rs/canvas` | `unpdf` (serverless build of pdf.js) | unpdf mocks canvas — useless for this POC, which exists specifically to render to PNG. Reject. [CITED: unjs.io/packages/unpdf] |
| Astro 5 content layer | `legacy.collections: true` flag | Slower (no caching), deprecated, loses the new `image()` ergonomics. Reject — greenfield project, no migration burden. [CITED: docs.astro.build/en/guides/upgrade-to/v5/] |
| Manual `node-canvas` (Cairo-backed) | `@napi-rs/canvas` (Skia) | node-canvas needs system Cairo + Pango libs (apt install). @napi-rs/canvas is "0 system dependencies." Reject node-canvas. [CITED: github.com/Brooooooklyn/canvas README] |

**Installation (Phase 1 minimum):**
```bash
# Scaffold
npm create astro@latest -- --template minimal --typescript strict --skip-houston

# Schema + content collections — already in Astro core
# (no extra packages needed — content layer ships with astro@5)

# PDF POC dependencies (only needed for scripts/pdf-poc.mjs)
npm install --save-dev pdfjs-dist@^5.7.284
# @napi-rs/canvas is pulled automatically as an optionalDependency of pdfjs-dist
```

**Version verification:**
```bash
npm view astro version          # 5.18.1 (pinned floor)
npm view pdfjs-dist version     # 5.7.284 (published 2026-04-27)
npm view @napi-rs/canvas@0.1.100 version
```
[VERIFIED: registry queries 2026-05-09]

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       BUILD TIME (Cloudflare Pages)                 │
│                                                                     │
│   src/content/pieces/[slug]/                                        │
│   ├── index.md  ── (Zod-validated frontmatter) ──┐                  │
│   └── hero.jpg  ── (image() helper resolves)  ──┐│                  │
│                                                  ▼▼                 │
│                            ┌──── Astro content layer ────┐          │
│                            │  (glob loader, src/         │          │
│                            │   content.config.ts)        │          │
│                            └──────────┬──────────────────┘          │
│                                       │                             │
│   src/pages/index.astro          ◄────┤  getCollection('pieces')    │
│   src/pages/[category].astro     ◄────┤                             │
│   src/pages/[category]/          ◄────┤  getStaticPaths()           │
│      [slug].astro                                                   │
│                                                                     │
│   ┌────────────────── PARALLEL, NOT INTEGRATED ─────────────────┐   │
│   │  scripts/pdf-poc.mjs (D-05 throwaway)                       │   │
│   │  samples/poc-input.pdf  ── pdfjs-dist ──► canvas ──► PNG    │   │
│   │  Output: /tmp/pdf-poc-out.png  (NOT consumed by site)       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
                       Static `dist/` → Cloudflare Pages CDN
                          ├── Production: main branch
                          └── Preview:    every other branch
                              (auto: <hash>.<project>.pages.dev)
```

### Recommended Project Structure

```
new-project/
├── astro.config.mjs              # Astro config (minimal — no integrations)
├── package.json
├── tsconfig.json                 # extends "astro/tsconfigs/strict"
├── .nvmrc                        # "22.16.0" — match Cloudflare Pages v3
├── public/                       # Static passthrough (favicon, robots.txt later)
├── samples/
│   └── poc-input.pdf             # Caleb-supplied; gitignored or committed at his discretion
├── scripts/
│   └── pdf-poc.mjs               # D-05 throwaway — manual `npm run pdf-poc`
└── src/
    ├── content.config.ts         # Astro 5 location (NOT src/content/config.ts)
    ├── content/
    │   └── pieces/
    │       ├── design-real-piece/
    │       │   ├── index.md
    │       │   └── hero.jpg
    │       ├── finance-real-piece/
    │       │   ├── index.md
    │       │   └── hero.jpg
    │       ├── marketing-real-piece/
    │       │   ├── index.md
    │       │   └── hero.jpg
    │       └── phase-1-skeleton/   # Personal placeholder per D-08
    │           ├── index.md
    │           └── hero.png        # solid color or "PLACEHOLDER" image
    └── pages/
        ├── index.astro             # Splash (placeholder visuals)
        ├── [category].astro        # Discipline gallery — getStaticPaths over enum
        └── [category]/
            └── [slug].astro        # Detail page — getStaticPaths over filtered pieces
```

### Pattern 1: Shared Category Enum (D-12)

Define the enum **once**, in a plain `.ts` file, and import it from both the schema and `getStaticPaths`. Do not duplicate.

```ts
// src/content/categories.ts
export const CATEGORIES = ['design', 'finance', 'personal', 'marketing'] as const;
export type Category = typeof CATEGORIES[number];
```

```ts
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './content/categories';

const pieces = defineCollection({
  loader: glob({
    base: './src/content/pieces',
    pattern: '**/index.md',  // colocated piece folders, one index.md each
  }),
  schema: ({ image }) => z.object({
    // PIECE-01, PIECE-02 required fields — build fails loudly if missing
    title: z.string(),
    category: z.enum(CATEGORIES),
    role: z.string(),
    outcome: z.string(),
    context: z.string(),
    hero: image(),                                  // D-04: image() helper
    order: z.number().int(),                        // D-01
    draft: z.boolean().default(false),              // D-02
    // D-03: forward-compat scaffolding for Phase 2 (all .optional())
    pdfPaginate: z.boolean().optional(),
    fullPdf: z.string().optional(),
    outcomeTagline: z.string().optional(),
  }),
});

export const collections = { pieces };
```

[CITED: https://github.com/withastro/astro/blob/main/examples/blog/src/content.config.ts]

**Why function form `({ image }) => z.object(...)`:** Required when using `image()`. The bare object form (`schema: z.object(...)`) cannot access `image`. Astro 5 / Zod 3 has no IDE issue with this form — that's an Astro 6 + Zod 4 regression (#16001). [VERIFIED: `npm view astro@5.18.1 dependencies.zod` → `^3.25.76`]

### Pattern 2: Colocated Hero with `image()` (D-04)

```md
<!-- src/content/pieces/design-real-piece/index.md -->
---
title: "Pitch Deck Cover Concept"
category: design
order: 1
draft: false
hero: "./hero.jpg"           # path relative to THIS markdown file
role: "Lead designer; concept + execution."
outcome: "Adopted by client across pitch + collateral."
context: "Brand-system rebrief for FY26 pitch cycle. Worked with PM and copy."
---
```

The path `./hero.jpg` resolves to `src/content/pieces/design-real-piece/hero.jpg`. Astro imports it through Vite, runs Sharp, and turns the field into an `ImageMetadata` object (`{ src, width, height, format }`).

[CITED: https://docs.astro.build/en/guides/images/#images-in-content-collections]

### Pattern 3: Dynamic `[category].astro` (D-11)

```astro
---
// src/pages/[category].astro
import { getCollection } from 'astro:content';
import { CATEGORIES, type Category } from '../content/categories';

export async function getStaticPaths() {
  return CATEGORIES.map((cat) => ({ params: { category: cat } }));
}

const { category } = Astro.params as { category: Category };

// Filter to this category, exclude drafts (D-02), sort by manual order (D-01)
const pieces = (await getCollection('pieces', ({ data }) =>
  data.category === category && data.draft !== true
)).sort((a, b) => a.data.order - b.data.order);
---
<html>
  <head><title>{category}</title></head>
  <body>
    <a href="/">← splash</a>
    <h1>{category}</h1>
    <ul>
      {pieces.map(p => (
        <li>
          <a href={`/${category}/${p.id}`}>{p.data.title}</a>
        </li>
      ))}
    </ul>
  </body>
</html>
```

### Pattern 4: Dynamic `[category]/[slug].astro` (D-11, PIECE-01, PIECE-02)

```astro
---
// src/pages/[category]/[slug].astro
import { getCollection } from 'astro:content';
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const pieces = await getCollection('pieces', ({ data }) => data.draft !== true);
  return pieces.map((piece) => ({
    params: { category: piece.data.category, slug: piece.id },
    props: { piece },
  }));
}

interface Props { piece: CollectionEntry<'pieces'>; }
const { piece } = Astro.props;
const { title, hero, context, role, outcome, category } = piece.data;
---
<html>
  <head><title>{title}</title></head>
  <body>
    <a href={`/${category}`}>← back to {category}</a>
    <h1>{title}</h1>
    {/* PIECE-01: large hero, image, never iframe */}
    <Image src={hero} alt={title} />
    {/* PIECE-02: three blurb blocks */}
    <section><h2>Context</h2><p>{context}</p></section>
    <section><h2>Role</h2><p>{role}</p></section>
    <section><h2>Outcome</h2><p>{outcome}</p></section>
  </body>
</html>
```

**Critical detail:** `params` MUST contain BOTH `category` AND `slug` keys — the filename declares both. If you only return `{ slug: ... }`, Astro throws "params object missing required key: category" at build time.

[CITED: https://docs.astro.build/en/guides/routing/ — section "getStaticPaths"]

### Pattern 5: Splash Routing to Categories

```astro
---
// src/pages/index.astro
import { CATEGORIES } from '../content/categories';
---
<html>
  <body>
    <h1>Caleb Lim</h1>
    <p>What do you wish to see?</p>
    <ul>
      {CATEGORIES.map(c => <li><a href={`/${c}`}>{c}</a></li>)}
    </ul>
  </body>
</html>
```

### Pattern 6: PDF POC Standalone (D-05, D-06)

```js
// scripts/pdf-poc.mjs
// Source: https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs
// Verbatim Mozilla canonical example, adapted to write to repo root.
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const CMAP_URL = './node_modules/pdfjs-dist/cmaps/';
const STANDARD_FONT_DATA_URL = './node_modules/pdfjs-dist/standard_fonts/';

const inputPath = process.argv[2] || 'samples/poc-input.pdf';
const outputPath = process.argv[3] || 'pdf-poc-out.png';

if (!fs.existsSync(inputPath)) {
  console.error(`POC input not found: ${inputPath}`);
  console.error(`Caleb supplies samples/poc-input.pdf — see D-05.`);
  process.exit(2);
}

const data = new Uint8Array(fs.readFileSync(inputPath));

try {
  const pdfDocument = await getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;

  const page = await pdfDocument.getPage(1);
  const canvasFactory = pdfDocument.canvasFactory;     // built-in NodeCanvasFactory
  const viewport = page.getViewport({ scale: 1.0 });
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

  await page.render({
    canvasContext: canvasAndContext.context,
    viewport,
  }).promise;

  const image = canvasAndContext.canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, image);

  page.cleanup();

  // D-06 success bar: file exists and is non-zero
  const stat = fs.statSync(outputPath);
  if (stat.size === 0) {
    console.error(`FAIL: output PNG is 0 bytes`);
    process.exit(3);
  }
  console.log(`OK: wrote ${outputPath} (${stat.size} bytes, ${viewport.width}x${viewport.height})`);
  process.exit(0);
} catch (err) {
  console.error('POC FAIL:', err);
  process.exit(1);
}
```

Add to `package.json`:
```json
"scripts": {
  "pdf-poc": "node scripts/pdf-poc.mjs"
}
```

### Anti-Patterns to Avoid

- **Defining the category enum in two places.** Schema and routing must reference the same `CATEGORIES` constant. Drift = silent build success with broken routes.
- **Bare `schema: z.object(...)` when using `image()`.** The image helper is only injected via the function form `schema: ({ image }) => z.object(...)`.
- **Setting `pdfjs-dist` GlobalWorkerOptions.workerSrc in Node.** The 5.x Node build runs the worker in-process via the legacy entry. Setting workerSrc breaks Node usage. (Browser concern only.) [VERIFIED: pdf.js 5.7.284 source inspection]
- **Using `legacy.collections: true` for a greenfield project.** Slower builds, deprecated APIs, loses the `image()` ergonomics. Always use the new content layer.
- **Putting the PDF POC on the build path.** D-05 explicitly says throwaway. Phase 2's `scripts/pdf-preprocess.mjs` builds clean from this. Keep the POC isolated.
- **Pinning `@napi-rs/canvas@1.0.0`.** It's incompatible with `pdfjs-dist@5.7.284` which declares `^0.1.100`. Let npm resolve it via optionalDependencies.
- **Hand-rolling `params: { slug: post.id }` without `category`.** Nested routes need every dynamic segment in params.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown → HTML pipeline | Custom remark setup | Astro's built-in markdown via content layer | Astro ships unified/remark/rehype, syntax highlighting via Shiki, frontmatter parsing — all out of the box. |
| Image optimization for hero | Manual `<img>` + Sharp scripts | Astro's `<Image />` + `image()` schema helper | Width/height auto-extracted, lazy loading, responsive `srcset`, AVIF/WebP fallbacks — free. |
| Frontmatter validation | Custom JSON validator | Zod schema in content collection | Zod gives you both runtime check + TypeScript types from one source. |
| PDF rendering | Roll your own with poppler / `pdf-poppler` | `pdfjs-dist` + `@napi-rs/canvas` | This stack is the path of least resistance. Mozilla maintains an `examples/node/pdf2png/pdf2png.mjs` that is the canonical reference. |
| Static deploy | rsync to a VPS | Cloudflare Pages git integration | Free, automatic preview branches, no server. |

**Key insight:** Astro 5's content layer + `image()` helper is the entire D-04 colocated-folder solution out of the box. There is no missing piece to fill in.

## Runtime State Inventory

Not applicable — this is a greenfield Phase 1. No rename, refactor, or migration. No prior runtime state exists.

## Common Pitfalls

### Pitfall 1: pdfjs-dist + @napi-rs/canvas regression in 4.9.124–4.9.154
**What goes wrong:** `Error: Cannot find module '@napi-rs/canvas'` at runtime, even though the package is installed.
**Why it happens:** Mozilla's webpack bundle baked an absolute build-server path into `legacy/build/pdf.mjs`'s `createRequire(...)` call.
**How to avoid:** Pin `pdfjs-dist@^5.7.284` (or any version ≥ 4.9.155). Verified fixed in 5.7.284 — uses `createRequire(import.meta.url)` correctly.
**Warning signs:** "Cannot polyfill DOMMatrix / ImageData / Path2D" warnings followed by MODULE_NOT_FOUND on `@napi-rs/canvas`.
[CITED: https://github.com/mozilla/pdf.js/issues/19145]

### Pitfall 2: Astro 5 config file at the wrong location
**What goes wrong:** Schema isn't picked up, no type errors generated, `getCollection()` returns empty.
**Why it happens:** Astro 5 moved the config from `src/content/config.ts` to `src/content.config.ts`. The old path still partially works under legacy backwards-compat but loses features.
**How to avoid:** Place the config at exactly `src/content.config.ts` for the new content layer.
**Warning signs:** Schema changes don't cause TypeScript errors; `astro sync` doesn't regenerate types.
[CITED: https://docs.astro.build/en/guides/upgrade-to/v5/#updating-existing-collections]

### Pitfall 3: Build "succeeds" with missing required fields
**What goes wrong:** A piece is missing `outcome:` and the build does NOT fail — it silently emits a broken page.
**Why it happens:** The field was declared `.optional()`. Or worse — the schema function isn't being applied because the loader pattern doesn't match the file.
**How to avoid:** Required fields = no `.optional()`. Verify `pattern: '**/index.md'` actually matches your colocated layout. Run `npx astro sync` and look for type errors before assuming the schema is wired.
**Warning signs:** TypeScript types for collection entries don't include the field you added; `astro check` emits no error but pages render undefined.
**Success criterion 2 of Phase 1 ROADMAP**: "build fails loudly on missing fields" — this is what enforces it.

### Pitfall 4: getStaticPaths missing a route segment
**What goes wrong:** Build error: "Astro requires getStaticPaths() for dynamic routes" or "params object missing required key: X."
**Why it happens:** For `src/pages/[category]/[slug].astro`, you must return BOTH keys in every `params` object.
**How to avoid:** `params: { category: piece.data.category, slug: piece.id }`. Don't shorthand.
**Warning signs:** Detail pages 404; only one set of routes builds.

### Pitfall 5: @napi-rs/canvas 1.0 incompat
**What goes wrong:** `pdfjs-dist` API contract assumes the 0.1.x return shape. 1.0 was published 2026-05-04 and is a breaking major.
**Why it happens:** If something else in the project pulls 1.0 (or you `npm install @napi-rs/canvas` explicitly), npm hoists 1.0 and pdfjs sees the wrong canvas factory shape.
**How to avoid:** Don't install `@napi-rs/canvas` directly. Let `pdfjs-dist@^5.7.284` pull `^0.1.100` as an optional dep. Don't add `@napi-rs/canvas` to package.json.
**Warning signs:** "TypeError: canvasFactory.create is not a function" or rendering succeeds but produces a 0-byte file.

### Pitfall 6: Node version mismatch between local and Cloudflare
**What goes wrong:** POC works locally on Node 20, fails on Cloudflare Pages with cryptic engine warnings.
**Why it happens:** `pdfjs-dist@5.7.284` requires Node `>=22.13.0 || >=24`. Cloudflare Pages v3 default is 22.16.0 — fine. But if local dev is 20 or 18, behavior diverges.
**How to avoid:** Add `.nvmrc` with `22.16.0` at repo root. Cloudflare Pages auto-respects it (no env var needed).
**Warning signs:** `npm install` warning "EBADENGINE Unsupported engine pdfjs-dist@5.7.284 wanted: { node: '>=22.13.0 || >=24' }"
[CITED: https://developers.cloudflare.com/pages/configuration/build-image/]

### Pitfall 7: Confusing Cloudflare Workers vs Cloudflare Pages BUILD env
**What goes wrong:** Search results warn "@napi-rs/canvas doesn't work on Cloudflare." That's about **Workers runtime** (V8 isolate, no native modules). Phase 1 runs the POC at **Pages BUILD time** — full Ubuntu 22.04, full Node, native binaries fine.
**Why it happens:** The Workers runtime restriction is famous; people apply it to Pages indiscriminately.
**How to avoid:** The POC runs in `npm run build` / `npm run pdf-poc` on the Pages build container. Output is static files. Workers runtime is never invoked. No issue.
**Warning signs:** None at build time. If you ever try to invoke `@napi-rs/canvas` from a Workers function, that's a different problem.

## Code Examples

### Astro config (minimal Phase 1)

```js
// astro.config.mjs
// No integrations needed for Phase 1 — visuals are placeholder.
// Phase 3 adds whatever (Tailwind 4 / fonts) — DO NOT add here yet.
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Cloudflare Pages serves /dist/ as static. No adapter needed.
  // site: 'https://caleblim.com',  // add in Phase 6
});
```

### Pinning Node version for Cloudflare Pages

```
22.16.0
```
Saved as `.nvmrc` at repo root. Cloudflare Pages v3 reads this automatically.
[CITED: https://developers.cloudflare.com/pages/configuration/build-image/#supported-languages-and-tools]

### tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict"
}
```
Astro's strict template includes everything content collections need (`strictNullChecks`, `allowJs`, etc.).
[CITED: https://docs.astro.build/en/guides/content-collections/#typescript-configuration-for-collections]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `defineCollection({ type: 'content', ... })` | `defineCollection({ loader: glob({...}), ... })` | Astro 5.0 (Dec 2024) | Up to 5× faster MD builds, file-level caching, the `image()` helper integrates cleanly. [CITED: astro.build/blog/content-layer-deep-dive] |
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | New config location. Old path silently triggers legacy compat mode. [CITED: docs.astro.build/en/guides/upgrade-to/v5/] |
| `entry.slug` | `entry.id` | Astro 5.0 | `id` is the unified identifier; `slug` removed for content layer collections. [CITED: docs.astro.build/en/guides/upgrade-to/v5/] |
| `entry.render()` method | `import { render } from 'astro:content'; await render(entry)` | Astro 5.0 | Function call instead of method (Phase 1 detail pages don't render markdown bodies, but Phase 2 may). |
| `pdfjs-dist` + `node-canvas` (Cairo) | `pdfjs-dist` + `@napi-rs/canvas` (Skia) | pdfjs-dist 4.10.x onward | Zero system deps, prebuilt binaries, smaller install. node-canvas effectively retired. [CITED: github.com/mozilla/pdf.js commit 86f943ca "Replace the canvas package with @napi-rs/canvas"] |
| `pdfjs-dist/legacy/build/pdf.mjs` (mandatory) | `pdfjs-dist` (main entry, both work in Node) | 5.x | Both entries work identically in Node ≥22. Mozilla's example still uses the `legacy/` path; either is safe. |
| `framer-motion` | `motion` (`motion/react`) | Late 2024 — out of scope for Phase 1, noted for context only |

**Deprecated/outdated:**
- `Astro.glob()` — deprecated in Astro 5 in favor of `getCollection()` and `import.meta.glob()`. Don't use. [CITED: docs.astro.build/en/guides/upgrade-to/v5/]
- `pdfjs-dist@4.9.124–4.9.154` — buggy `@napi-rs/canvas` resolution. Pin to ≥4.9.155 or stay on 5.x.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIECE-01 | Each piece has a dedicated detail page with a large rendered hero asset (image, never iframe-embedded PDF) | Pattern 4 (`[category]/[slug].astro`) renders `<Image src={hero} alt={title} />` from content layer. D-10 confirms heroes are plain images for Phase 1 — no PDF rendering on the site. |
| PIECE-02 | Each detail page shows three short blurb blocks: Context (3–6 lines), Role (1–3 lines), Outcome (1–3 lines) | Pattern 4 renders three `<section>` blocks from `piece.data.context / role / outcome`. Schema in Pattern 1 declares these as required `z.string()` fields — build fails if missing (Phase 1 success criterion 2). D-09 says brief 1–2 lines per field is acceptable for Phase 1. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudflare Pages git integration auto-creates a preview URL for any non-main branch with no extra config beyond the initial connect-to-git step | Cloudflare Pages preview wiring | If wrong, Phase 1 needs an extra task to manually configure preview branches. Mitigation: research is HIGH confidence here per official docs. [CITED: developers.cloudflare.com/pages/configuration/git-integration/] |
| A2 | `@napi-rs/canvas-linux-x64-gnu@0.1.100` ships a working prebuilt binary that runs in Cloudflare Pages' gVisor sandbox without further config | PDF POC platform | If wrong, POC fails on Cloudflare even though it works locally. Per @napi-rs/canvas README "0 system dependencies" + glibc ≥2.18 (Ubuntu 22 has 2.35) this should work. POC's own purpose is to verify this. |

**Validation note:** A2 is exactly what the POC validates. That's the point of D-05 — surface platform-specific issues now.

## Open Questions

1. **Should `samples/poc-input.pdf` be committed to git?**
   - What we know: D-05 says Caleb supplies it; POC doesn't ship to production.
   - What's unclear: If `samples/` is gitignored, the POC can only run locally. If committed, it runs on Cloudflare Pages preview builds (the venue D-05 wants).
   - Recommendation: Commit a small (≤500KB) sample PDF so the POC runs on Cloudflare. If Caleb's real PDFs are NDA'd or large, gitignore them and run POC locally only — but then Phase 1 success criterion 4 ("rasterizes... in CI") needs softening.

2. **Should the POC be a `prebuild` hook or a separate `npm run pdf-poc`?**
   - What we know: D-05 says throwaway, not integrated. D-06 says success bar is "doesn't crash."
   - What's unclear: Whether running it on every Cloudflare build (as `prebuild`) makes sense — increases build time for no production payoff.
   - Recommendation: Keep it as a separate `npm run pdf-poc` script, but trigger it ONCE on a preview branch (e.g., a single-purpose `phase-1/pdf-poc` branch) to verify Cloudflare Pages compatibility. After it passes, the planner can leave it dormant until Phase 2.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build, PDF POC | ✓ (Cloudflare Pages v3) | 22.16.0 default; satisfies pdfjs-dist `>=22.13.0 || >=24` | Pin via `.nvmrc` |
| npm | Package install | ✓ | 10.9.2 (CF Pages v3) | n/a |
| glibc | @napi-rs/canvas runtime | ✓ (Ubuntu 22.04 = glibc 2.35) | requires ≥2.18 | n/a |
| Cloudflare Pages account | Preview deploys | TBD — Caleb hasn't created yet | — | Local `astro preview` is acceptable for Phase 1 sign-off (CONTEXT.md "Claude's Discretion") |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- Cloudflare Pages account: Phase 1 can ship with `astro preview` only. Wiring CF Pages early is a planner-judgment call (recommended; it's the venue for the PDF POC under D-05).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None preinstalled; greenfield project. Smallest viable: **`vitest`** (Vite-native, zero config for Astro). |
| Config file | None — see Wave 0. |
| Quick run command | `npm run test` (after Wave 0 wires it) |
| Full suite command | `npm run test` + `npm run build` (build IS the integration test for content collections) |

### Phase Requirements → Test Map

For Phase 1, **the build itself is the test.** Astro's content layer + Zod schema means a missing required field, a malformed enum value, or a broken image path causes `npm run build` to fail. Phase 1 doesn't need vitest unit tests for the schema — the schema IS validated on every build. What needs explicit verification:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIECE-01 | Each piece detail page renders a hero `<img>` (no iframe) | smoke (HTML grep) | `npm run build && grep -L 'iframe' dist/design/*/index.html` | ❌ Wave 0 (script) |
| PIECE-01 | All four category routes resolve and link to at least one detail page | smoke | `npm run build && for c in design finance personal marketing; do test -d dist/$c; done` | ❌ Wave 0 (script) |
| PIECE-02 | Each detail page contains "Context", "Role", "Outcome" headings | smoke (HTML grep) | shell script over `dist/**/*.html` | ❌ Wave 0 (script) |
| Schema | Build fails on missing required field | manual | inject a piece missing `outcome:`, expect non-zero exit from `npm run build` | manual one-time check |
| POC | `npm run pdf-poc` exits 0 and emits non-zero PNG | smoke | `npm run pdf-poc && test -s pdf-poc-out.png` | ❌ Wave 0 (script) |

### Sampling Rate
- **Per task commit:** `npm run build` (content schema validates on every build)
- **Per wave merge:** `npm run build` + smoke shell scripts above
- **Phase gate:** All five tests above pass + manual visual check that all four category routes render

### Wave 0 Gaps
- [ ] `scripts/verify-build.sh` — runs the smoke greps above on `dist/`
- [ ] `package.json` — wire `"test:smoke": "scripts/verify-build.sh"` and `"pdf-poc": "node scripts/pdf-poc.mjs"`
- [ ] `.nvmrc` containing `22.16.0`

(No vitest needed for Phase 1. Phase 2 may want it once `scripts/pdf-preprocess.mjs` becomes load-bearing.)

## Security Domain

> Phase 1 is a static, public, content-only site with no user input, no auth, no API surface. ASVS coverage is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — no auth |
| V3 Session Management | no | n/a — no sessions |
| V4 Access Control | no | n/a — public site |
| V5 Input Validation | yes (build-time only) | Zod schema on content collection frontmatter |
| V6 Cryptography | no | n/a — no secrets handled |

### Known Threat Patterns for static-Astro stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in markdown asset references (`hero: "../../../etc/passwd"`) | Tampering | Astro `image()` helper validates the asset is a real importable image; non-existent or out-of-tree paths fail the build |
| XSS via markdown body rendering | Tampering | Phase 1 doesn't render markdown bodies (only frontmatter strings, which pass through Astro's standard escaping). Phase 2 may add `<Content />` rendering — separate concern. |
| Build-time supply-chain (npm postinstall) | Tampering | Pin pdfjs-dist exact version; `@napi-rs/canvas` is the only postinstall in the dep tree (downloads prebuilt binary from npm registry) |

## Sources

### Primary (HIGH confidence)
- [Astro Docs — Content Collections](https://docs.astro.build/en/guides/content-collections/) — schema, glob loader, getCollection, querying
- [Astro Docs — Images](https://docs.astro.build/en/guides/images/) — `image()` helper, content collection images section
- [Astro Docs — Upgrade to v5](https://docs.astro.build/en/guides/upgrade-to/v5/) — content layer migration, `src/content.config.ts` location, slug → id
- [Astro Docs — Routing](https://docs.astro.build/en/guides/routing/) — getStaticPaths, dynamic routes, nested segments
- [Astro Blog example — content.config.ts](https://github.com/withastro/astro/blob/main/examples/blog/src/content.config.ts) — canonical schema with `image()`
- [Mozilla pdf.js — examples/node/pdf2png/pdf2png.mjs](https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs) — canonical Node rasterization
- [Cloudflare Pages — Build image](https://developers.cloudflare.com/pages/configuration/build-image/) — Node version, build env, override mechanism
- [Cloudflare Pages — Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) — preview URL behavior
- [@napi-rs/canvas README](https://github.com/Brooooooklyn/canvas) — "0 system dependencies", glibc 2.18+
- [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist) — versions, engine constraints
- npm registry queries (`npm view`) for pdfjs-dist@5.7.284, @napi-rs/canvas@0.1.100, astro@5.18.1 — performed 2026-05-09
- pdfjs-dist 5.7.284 source inspection (downloaded via `npm pack`) — confirmed `createRequire(import.meta.url)` fix

### Secondary (MEDIUM confidence)
- [GitHub mozilla/pdf.js #19145](https://github.com/mozilla/pdf.js/issues/19145) — historical regression in 4.9.124, fix landed in 4.9.155
- [GitHub withastro/astro #16001](https://github.com/withastro/astro/issues/16001) — Zod 4 IDE issue (Astro 6 only; doesn't affect Astro 5)

### Tertiary (LOW confidence)
- None — all critical claims verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry on research date
- Architecture: HIGH — patterns pulled directly from Astro's own examples repo and official docs
- Pitfalls: HIGH — historical regression confirmed in pdfjs source inspection; current versions verified clean
- Cloudflare Pages: HIGH — official Cloudflare docs scraped directly

**Research date:** 2026-05-09
**Valid until:** ~2026-08-09 (90 days; pdfjs-dist and Astro both move fast — re-verify versions before Phase 2)

## RESEARCH COMPLETE
