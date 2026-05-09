# Architecture Research

**Domain:** Designer-grade portfolio site (gallery of static deliverables, splash-routed UX)
**Researched:** 2026-05-09
**Confidence:** HIGH (routing model, content schema, build order); MEDIUM (PDF thumbnail pipeline — multiple viable tools, picked the lightest)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Splash    │  │  Category  │  │   Piece    │  │   About /  │  │
│  │  Picker /  │  │   Gallery  │  │   Detail   │  │   Contact  │  │
│  │  (entry)   │  │  /design   │  │ /design/.. │  │            │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │
│        │               │                │                │        │
│        └───────────────┴────────┬───────┴────────────────┘        │
│                                 │                                  │
│                  ┌──────────────▼─────────────┐                   │
│                  │   Site Layout (header,     │                   │
│                  │   nav, motion primitives)  │                   │
│                  └──────────────┬─────────────┘                   │
└─────────────────────────────────┼─────────────────────────────────┘
                                  │ (static HTML + hydrated islands)
┌─────────────────────────────────┼─────────────────────────────────┐
│                       Build Pipeline (Astro)                       │
│  ┌──────────────────────────────▼─────────────────────────────┐   │
│  │  getCollection('pieces')  →  getStaticPaths()  →  routes   │   │
│  └──────────────────────────────┬─────────────────────────────┘   │
│                                 │                                  │
│  ┌────────────────┐  ┌──────────▼──────────┐  ┌──────────────┐    │
│  │ Image pipeline │  │  PDF preprocessor   │  │  Sharp /     │    │
│  │ (astro:assets, │  │  (build-time:       │  │  responsive  │    │
│  │  AVIF/WebP)    │  │  pdf → png pages)   │  │  variants    │    │
│  └────────────────┘  └─────────┬───────────┘  └──────────────┘    │
└──────────────────────────────────┼────────────────────────────────┘
                                   │
┌──────────────────────────────────┼────────────────────────────────┐
│                    Content Layer (filesystem, git)                 │
│  ┌────────────────┐  ┌───────────▼──────────┐  ┌──────────────┐   │
│  │ src/content/   │  │  public/assets/      │  │ Generated    │   │
│  │  pieces/*.md   │  │  pdfs/, images/      │  │ thumbnails   │   │
│  │  (frontmatter) │  │  (raw uploads)       │  │ /generated/  │   │
│  └────────────────┘  └──────────────────────┘  └──────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `SplashPicker` | Render Caleb's name, the "What do you wish to see?" prompt, and four category cards. Show piece count per category. | Astro page (`src/pages/index.astro`) with a small client island for hover/intro motion. |
| `CategoryGallery` | List every piece in one category. Hero thumbnail + title + (optional) one-line tag. Asymmetric/magazine layout. | Astro page (`src/pages/[category]/index.astro`) consuming `getCollection('pieces', filter)`. |
| `PieceDetail` | Big hero asset (image, PDF first-page render, or multi-page slide carousel), Context / Role / Outcome blurb, optional download link. | Astro page (`src/pages/[category]/[slug].astro`). PDF rendering is a hydrated island (`PdfViewer.client`). |
| `AboutPage` | Bio, cross-functional pitch, resume download. | Static Astro page. |
| `ContactBlock` | mailto link + socials. Reused in footer. | Astro component (`.astro`), no JS. |
| `SiteShell` | Header (logo + minimal nav), footer, page transitions. | Layout component wrapping all pages; uses Astro View Transitions for cross-page motion. |
| `PieceCard` | Thumbnail tile used in CategoryGallery. Two visual variants (large/small) for asymmetric grids. | Pure Astro component, props-driven. |
| `PdfViewer` (island) | Render first page of a PDF on a canvas (or paginated for slide decks). | React or Svelte island using `pdfjs-dist`, hydrated `client:visible`. |
| Build-time `pdf-preprocess` | Walk `src/content/pieces/`, find `heroPdf` references, render page 1 (and optionally all pages for slide decks) to PNG/WebP via `pdfjs-dist` headless or Poppler `pdftoppm`. | Custom Astro integration or a `prebuild` npm script. |

## Recommended Project Structure

```
caleb-portfolio/
├── src/
│   ├── content/
│   │   ├── config.ts              # Zod schemas for collections
│   │   └── pieces/
│   │       ├── design/
│   │       │   ├── q3-poster-series.md
│   │       │   └── brand-system-v2.md
│   │       ├── finance/
│   │       │   └── lbo-model-2024.md
│   │       ├── personal/
│   │       └── marketing/
│   ├── pages/
│   │   ├── index.astro            # SplashPicker
│   │   ├── about.astro
│   │   ├── [category]/
│   │   │   ├── index.astro        # CategoryGallery
│   │   │   └── [slug].astro       # PieceDetail
│   │   └── 404.astro
│   ├── components/
│   │   ├── SplashCard.astro
│   │   ├── PieceCard.astro
│   │   ├── PdfViewer.tsx          # client island
│   │   ├── SlideCarousel.tsx      # client island
│   │   ├── ContextBlock.astro     # Context / Role / Outcome
│   │   └── ContactBlock.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro       # html shell, fonts, motion CSS
│   │   └── PieceLayout.astro      # detail-page-specific framing
│   ├── lib/
│   │   ├── categories.ts          # constant: 4 categories + display labels
│   │   └── pieces.ts              # query helpers (countByCategory, etc.)
│   └── styles/
│       └── global.css             # type scale, color tokens
├── public/
│   ├── assets/                    # raw uploads, served as-is
│   │   ├── pdfs/
│   │   ├── images/                # full-res posters
│   │   └── decks/
│   ├── generated/                 # build-time outputs (gitignored or committed; see below)
│   │   ├── pdf-thumbs/            # first-page PNGs
│   │   └── deck-pages/            # all-pages PNGs for slide decks
│   └── resume.pdf
├── scripts/
│   └── pdf-preprocess.mjs         # generates public/generated/* from public/assets/pdfs/
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

### Structure Rationale

- **`src/content/pieces/<category>/<slug>.md`:** Subdirectory = category, file stem = slug. Astro's collection API filters by relative path or by frontmatter; using directories means the category can be inferred from the path *and* validated against frontmatter, eliminating drift.
- **`public/assets/`:** Raw, untouched uploads. Caleb (or whoever updates content) drops files here. Served verbatim — no Astro pipeline needed for the source PDF/image because the URL needs to be stable for download links.
- **`public/generated/`:** Build-time derivatives (PDF thumbnails, slide-deck per-page PNGs). Generated by a prebuild script. Recommend committing these to git so Vercel/Netlify don't need a Node toolchain capable of running pdfjs-dist on every deploy — and so non-developer Caleb doesn't hit a broken build if the preprocessor flakes on his machine.
- **`src/lib/categories.ts`:** Single source of truth for the four categories (slug + display label + accent color). Both SplashPicker and CategoryGallery import from here. Adding a fifth category = one file change.
- **`scripts/pdf-preprocess.mjs`:** Kept as a plain Node script rather than an Astro integration. Reason: it's run rarely (only when content changes), and Caleb shouldn't have to debug an integration plugin. `npm run content:build` is the mental model.

## Architectural Patterns

### Pattern 1: Content Collections as Typed Data Layer

**What:** Astro's `defineCollection` with a Zod schema validates every Markdown file's frontmatter at build time. The collection is then queryable from any page like a typed array.

(Zod is a TypeScript-first schema validation library — you declare the shape of your data, Zod parses inputs and produces types automatically. In Astro, it's how the framework gives you autocomplete on `entry.data.title` and fails the build if a file has a typo'd field.)

**When to use:** Always, for a portfolio of this size. Cheaper than a CMS, type-safe, and the schema doubles as documentation for what fields a "piece" has.

**Trade-offs:**
- Pro: Build fails loudly on missing/wrong fields. No silent rendering bugs.
- Pro: Adding a piece = drop a `.md` file in the right folder. Caleb-friendly.
- Con: No live preview of frontmatter changes without running the dev server. (Acceptable — content updates are infrequent.)

**Example schema (`src/content/config.ts`):**

```ts
import { defineCollection, z } from 'astro:content';

const CATEGORIES = ['design', 'finance', 'personal', 'marketing'] as const;

const pieces = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(CATEGORIES),
    order: z.number().default(0),               // display order within category
    role: z.string(),                            // "Lead designer", "Analyst", etc.
    outcome: z.string(),                         // one-line result
    context: z.string(),                         // 1-3 sentences

    // Hero asset: exactly one of image OR pdf. Slide decks set pdfPaginate: true.
    heroImage: z.string().optional(),            // path under /public/assets/images/
    heroPdf: z.string().optional(),              // path under /public/assets/pdfs/
    pdfPaginate: z.boolean().default(false),     // render every page (slide deck mode)

    download: z.string().optional(),             // public download URL
    downloadLabel: z.string().default('Download'),

    // Visual hints for asymmetric gallery layout
    tileSize: z.enum(['sm', 'md', 'lg']).default('md'),
    accentColor: z.string().optional(),          // hex; overrides category default
  }).refine(d => d.heroImage || d.heroPdf, {
    message: 'piece must have heroImage or heroPdf',
  }),
});

export const collections = { pieces };
```

**Example piece (`src/content/pieces/design/q3-poster-series.md`):**

```md
---
title: "Q3 Poster Series"
category: design
order: 1
role: "Lead designer, concept → print"
outcome: "8-poster run printed at 24×36, distributed to 200+ campus venues"
context: |
  Six-week brief for the campus events board. Brief was deliberately loose;
  pitched a typographic system that scales from poster to social.
heroImage: images/q3-poster-hero.jpg
download: assets/pdfs/q3-poster-series.pdf
downloadLabel: "Full deck (PDF)"
tileSize: lg
accentColor: "#FF4A1C"
---

(Optional body content — Markdown for any extra notes.)
```

### Pattern 2: Category-First URL Hierarchy with Path-Mirrored Folders

**What:** URLs are `/[category]/[slug]` (e.g. `/design/q3-poster-series`). The content folder structure mirrors this exactly.

**Decision:** **Use nested `/<category>/<slug>` over flat `/work/<slug>` with a query filter.** Rationale:

1. **Splash-first UX matches URL semantics.** A recruiter who arrived via splash and clicked "Design" expects URLs to reflect that they're in the Design section. `/design/q3-poster-series` reads correctly when shared. `/work/q3-poster-series?cat=design` does not, and `/work/q3-poster-series` (with category in metadata only) loses the breadcrumb signal.
2. **Sharing.** A recruiter forwarding "the design pieces" can paste `/design`. Flat routing gives them nothing comparable.
3. **SEO.** Semantic, keyword-bearing URLs outperform flat slugs. Next.js's own SEO guide explicitly recommends this. (Caveat: this site doesn't really need SEO — recruiters arrive via direct link — but there's no cost to doing it right.)
4. **Cost is zero.** Astro routes from `[category]/[slug].astro` are exactly as easy as `[slug].astro` once `getStaticPaths` returns the right shape.

**The one risk:** If a piece moves between categories, its URL changes. Mitigation: the four categories are stable by domain (Caleb's life history, not arbitrary tags). If this ever becomes an issue, add a 301 redirect map — easy on Vercel/Netlify.

**`getStaticPaths` example (`src/pages/[category]/[slug].astro`):**

```ts
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const pieces = await getCollection('pieces');
  return pieces.map(piece => ({
    params: { category: piece.data.category, slug: piece.slug.split('/').pop() },
    props: { piece },
  }));
}
```

### Pattern 3: Build-Time PDF Rasterization

**What:** Convert PDFs to PNG/WebP at build time so the gallery and detail pages render thumbnails (and slide-deck pages) as plain `<img>` tags. Original PDF stays in `public/assets/pdfs/` for the download link.

**When to use:** Always for the gallery thumbnail. For the detail page hero, choose per-piece:

- **Single-page PDF (a poster):** Use page-1 PNG as the hero. PDF available via download link.
- **Multi-page PDF (slide deck):** Set `pdfPaginate: true`. Build script generates one PNG per page → detail page renders a horizontal-scroll or paginated carousel of PNGs.
- **Image-native piece (poster as JPG):** Skip PDF pipeline entirely; use `astro:assets` for responsive variants.

**Why build-time, not runtime PDF.js:**

- 10–15 PDFs total, rendered identically every time. Runtime rendering wastes ~150KB of pdfjs-dist on every visitor.
- A static `<img>` is faster to first paint, lazy-loads naturally, and works without JS.
- Recruiter-skim time matters; canvas-rendering a PDF on page load adds ~500ms+ vs an `<img>` cache hit.

**Trade-offs:**
- Pro: Smallest possible bundle. No client-side PDF library needed for the common case.
- Pro: Thumbnails are real images, which means `astro:assets` can produce AVIF/WebP variants and srcsets automatically.
- Con: Build adds a step. Mitigation: commit `public/generated/` to git so deploys don't need to run the preprocessor.
- Con: Caleb has to run `npm run content:build` after dropping a new PDF in. Mitigation: wire it into `npm run dev`'s prestart hook.

**Implementation choice:** Use **`pdfjs-dist` in legacy/Node mode** with **`@napi-rs/canvas`** (or `node-canvas`) for rasterization. Alternative: shell out to **Poppler's `pdftoppm`** (C binary, very fast, but adds a system dependency that breaks portability). Pick `pdfjs-dist` + `@napi-rs/canvas` — pure-npm install, works on macOS without Homebrew shenanigans.

```js
// scripts/pdf-preprocess.mjs (sketch)
import { readdir, mkdir } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

async function rasterize(pdfPath, outDir, { allPages = false, scale = 2 }) {
  const doc = await getDocument(pdfPath).promise;
  const lastPage = allPages ? doc.numPages : 1;
  for (let i = 1; i <= lastPage; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    // write canvas.toBuffer('image/png') to outDir/page-${i}.png
  }
}
```

The preprocessor reads `src/content/pieces/**/*.md`, parses frontmatter for `heroPdf` + `pdfPaginate`, and generates outputs into `public/generated/pdf-thumbs/<slug>/`.

## Data Flow

### Build-Time Flow

```
src/content/pieces/**/*.md  (frontmatter + body)
        │
        ▼
  Astro Collections API  (Zod-validated)
        │
        ├── used by /index.astro       → countByCategory()
        ├── used by /[category]/index   → filter pieces by category
        └── used by /[category]/[slug]  → render full piece

public/assets/pdfs/*.pdf
        │
        ▼  (via npm run content:build, before astro build)
  pdf-preprocess.mjs  →  public/generated/pdf-thumbs/<slug>/page-N.png
        │
        ▼
  astro:assets pipeline  →  AVIF/WebP responsive variants, srcsets
        │
        ▼
        dist/  (deployable static output)
```

### Runtime Flow (Browser)

```
[Visitor lands on /]
        ↓
SplashPicker renders 4 category cards. Each card shows count from
lib/pieces.ts → countByCategory(). No client JS for data.
        ↓
[Click "Design"]
        ↓
Navigate to /design (Astro View Transitions for the visual handoff)
        ↓
CategoryGallery: server-rendered grid of PieceCards. Each card uses
the pre-rasterized thumb from /generated/pdf-thumbs/<slug>/page-1.webp
        ↓
[Click a piece]
        ↓
/design/q3-poster-series renders. PieceDetail shows hero
+ ContextBlock (Context/Role/Outcome) + download button.
For pdfPaginate pieces, SlideCarousel hydrates client:visible to
allow keyboard navigation through the deck pages.
```

### Key Data Flows

1. **Splash count flow:** `getCollection('pieces')` → group by `category` → count. Computed in the Astro frontmatter of `index.astro`. Zero runtime cost.
2. **Gallery filter flow:** `getCollection('pieces', e => e.data.category === Astro.params.category)` → sort by `order` → render. Computed at build time per category page.
3. **Hero asset resolution:** Detail page reads `piece.data.heroImage || piece.data.heroPdf`. If PDF, resolve to `/generated/pdf-thumbs/<slug>/page-1.webp`. If `pdfPaginate`, list all `page-*.webp` files for the carousel.
4. **Download link flow:** `piece.data.download` is a public path; rendered as a plain `<a href download>`. No build pipeline involvement.

## Build Order / Dependency Graph

This is the architectural input the roadmap most needs. Phases are ordered by dependency, not by visible feature priority.

```
Phase 1: Foundations (no UI yet)
   ├── Astro project scaffold + TypeScript + tsconfig paths
   ├── Type system: src/content/config.ts (Zod schema for pieces)
   ├── Constants: src/lib/categories.ts (4 categories, display labels, accents)
   ├── Layout: BaseLayout.astro (fonts, type scale, color tokens, global CSS)
   └── 1–2 placeholder content files per category (lorem-ipsum frontmatter)

Phase 2: Routing skeleton (everything renders, nothing pretty)
   ├── /index.astro                 — SplashPicker (logic only, ugly OK)
   ├── /[category]/index.astro      — CategoryGallery (logic only)
   ├── /[category]/[slug].astro     — PieceDetail (logic only)
   ├── /about.astro                 — placeholder
   └── 404.astro
   ⇒ At end of phase 2: nav clicks work end-to-end with placeholder data.
     This is the moment to validate routing assumptions before investing
     in visual design.

Phase 3: Asset pipeline
   ├── scripts/pdf-preprocess.mjs    — pdfjs-dist + @napi-rs/canvas
   ├── npm run content:build wired into prebuild
   ├── First real PDF dropped in → thumb generated → rendered in gallery
   └── astro:assets responsive variants verified
   ⇒ Independent of visual design. Can be built in parallel with Phase 4
     by another agent if needed.

Phase 4: Visual design pass (the load-bearing work)
   ├── SplashPicker — final composition, motion, type
   ├── CategoryGallery — asymmetric layout, hover treatments
   ├── PieceDetail — magazine-grade framing
   ├── PieceCard — variants per tileSize
   └── View Transitions for inter-page motion
   ⇒ Depends on Phase 2 (routes) and Phase 3 (real thumbnails).
     This is where the frontend-design skill earns its keep.

Phase 5: Content + polish
   ├── Real pieces written, all 5–15 dropped in
   ├── About page copy
   ├── Resume PDF added to /public/resume.pdf
   ├── Contact + socials wired
   ├── Mobile responsive pass
   └── Deploy (Vercel/Netlify, custom domain)

Phase 6 (optional): Slide-deck carousel
   ├── SlideCarousel.tsx island
   └── pdfPaginate: true wired into a real piece
   ⇒ Defer until Caleb has a real slide-deck piece to test against.
     Splash-poster pieces don't need this.
```

### Build-Order Rationale

- **Schema before pages.** `src/content/config.ts` defines the shape of a piece. Every page reads from it. Building pages first means rewriting them once the schema lands.
- **Routing before visuals.** A working ugly site is worth 10× a beautiful broken one. If `/[category]/[slug]` doesn't generate cleanly, no amount of typography fixes it.
- **Pipeline before design.** Designing the gallery against placeholder gray rectangles produces a layout that breaks the moment real PDF aspect ratios show up. Get one real thumbnail rendering before designing the grid.
- **Real content last.** Caleb writing copy is the longest-pole task and shouldn't block engineering.

### Components Buildable in Parallel

After Phase 2, these can be built independently:

- `ContactBlock.astro` — pure JSX, no data
- `AboutPage` — static content, no data dependency
- `pdf-preprocess.mjs` — separate Node script, no UI
- Layout/typography tokens — separate from any page

These should NOT be built in parallel:

- `CategoryGallery` and `PieceCard` — Gallery is mostly a Card grid; co-design.
- `PieceDetail` and `ContextBlock` — Block is the meat of Detail.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 5–15 pieces (launch) | Current architecture is correct. Static build, all in git. |
| 50 pieces | Still fine. Build time becomes noticeable (~5–10s for PDF preprocessing). Consider caching `public/generated/` keyed by source file mtime. |
| 200+ pieces | Migrate to a CMS (Sanity, Notion as DB) or Astro's external content layer. PDF preprocessing moves to a CI job. Splash needs a "search" affordance. |

### Scaling Priorities

1. **First bottleneck: PDF preprocessing build time.** Mitigation: incremental rebuild — only rasterize PDFs newer than their generated thumbs. Trivial 10-line check.
2. **Second bottleneck: gallery layout at high piece counts.** Asymmetric layouts (the design goal) don't scale past ~20 items per page without becoming visual noise. At that point, add pagination or category sub-tags.

## Anti-Patterns

### Anti-Pattern 1: Headless CMS at this scale

**What people do:** Reach for Sanity / Contentful / Notion-as-CMS because "it might be useful later."
**Why it's wrong:** Adds a deploy-time API dependency, a content schema living in a different system from the code, an env-var management problem, and a monthly bill — all to manage 5–15 Markdown files. Caleb is not a developer; debugging a webhook desync at 11pm before a recruiter call is the worst possible failure mode.
**Do this instead:** Markdown + Zod schema in git. Edit in any text editor. Diffs are reviewable. PR previews are automatic on Vercel/Netlify.

### Anti-Pattern 2: Runtime PDF.js for the thumbnail

**What people do:** Embed `<canvas>` + pdfjs-dist on every gallery card to render the first page of each PDF live.
**Why it's wrong:** 150KB+ JavaScript shipped on a recruiter's first paint. Canvas renders are slower than `<img>` cache hits. Breaks if JS is disabled or slow. Defeats the entire reason to use Astro.
**Do this instead:** Rasterize at build time. Ship `<img>` tags. Reserve runtime PDF.js for cases where the user explicitly wants to flip through pages (and even then, prefer pre-rasterized PNG carousel).

### Anti-Pattern 3: Flat `/work/<slug>` routing with category as a tag

**What people do:** Single dynamic route, category lives only in frontmatter, gallery filters by query string.
**Why it's wrong:** Splash-routed UX implies a recruiter is committed to a category; the URL should reflect that. Sharing `/finance` is meaningful; sharing `/work?category=finance` is not. SEO loses semantic structure. Breadcrumbs become contrived.
**Do this instead:** `/[category]/[slug]`. Mirror the content folder structure to the URL.

### Anti-Pattern 4: Designing the gallery before any real piece exists

**What people do:** Wireframe the gallery against gray rectangles, then ship to find that real assets have wildly varying aspect ratios that break the grid.
**Why it's wrong:** Real PDFs are usually portrait letter (8.5×11), but slide decks are landscape 16:9, posters are sometimes square, and product shots are wildly variable. A grid that assumes uniform aspect ratio looks broken on contact.
**Do this instead:** Get the PDF preprocessor working first. Drop one real PDF per category in. Design the gallery against that. Use `tileSize` (sm/md/lg) as an explicit knob rather than hoping aspect ratios cooperate.

### Anti-Pattern 5: One layout file for splash, gallery, and detail

**What people do:** Single `BaseLayout.astro` for everything, splash gets `<slot />`'d into the same shell as detail.
**Why it's wrong:** Splash needs to feel like a full-bleed cover. Detail needs a sustained reading frame with a back-link. Forcing them through the same chrome compromises both.
**Do this instead:** `BaseLayout` for the bare html shell (fonts, viewport). `PieceLayout` for detail-specific framing. Splash wraps `BaseLayout` directly with no extra chrome.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Vercel / Netlify | `git push` triggers build. Static output, no runtime. | Free tier sufficient. Vercel has slightly better Astro defaults; Netlify has better form-handling primitives if a contact form replaces mailto. |
| Custom domain registrar | DNS → host's nameservers. | One-time setup; no ongoing integration. |
| (Optional) Plausible / Fathom analytics | Single `<script>` in BaseLayout. | Privacy-respecting, no cookie banner needed. Skip Google Analytics — fights the design pitch. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/content` ↔ pages | Astro Collections API (typed, build-time) | Pages never read filesystem directly; always via `getCollection`. |
| `public/assets` ↔ `public/generated` | One-way, via `scripts/pdf-preprocess.mjs` | Generated files are derived; treat as cache. Source of truth is `public/assets/`. |
| Frontmatter ↔ rendered components | Props (validated by Zod at build time) | If frontmatter is wrong, build fails. No runtime guards needed in components. |
| `lib/categories.ts` ↔ everywhere | Direct import, single source of truth | The only place a fifth category gets added. |

## Sources

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — schema + getStaticPaths patterns (HIGH)
- [Filtered & Paginated Dynamic Routes with Astro](https://rainrain.io/blog/dynamic-routes/) — category-filter pattern (MEDIUM)
- [SEO: URL Structure | Next.js](https://nextjs.org/learn/seo/url-structure) — semantic URL rationale (HIGH)
- [Astro vs Next.js: Why I Prefer Astro For Static Sites](https://www.nray.dev/blog/astro-vs-nextjs-why-i-prefer-astro-for-static-sites/) — static-site framework choice (MEDIUM)
- [pdf-thumbnail (npm)](https://www.npmjs.com/package/pdf-thumbnail) — drop-in alternative to custom pdfjs script (MEDIUM)
- [PDF.js examples (Mozilla)](https://mozilla.github.io/pdf.js/examples/) — canonical Node-side rendering pattern (HIGH)
- [Generate PDF thumbnails (Nutrient)](https://www.nutrient.io/guides/web/pdf-generation/thumbnail-preview/) — thumbnail-generation overview (MEDIUM)

---
*Architecture research for: designer-grade portfolio with category-routed splash UX*
*Researched: 2026-05-09*
