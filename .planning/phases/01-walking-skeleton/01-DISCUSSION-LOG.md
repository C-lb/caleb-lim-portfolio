# Phase 1: Walking Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 1-walking-skeleton
**Areas discussed:** Content schema shape & file layout, PDF rasterization POC scope, Sample content for the 4 walking-skeleton pieces, Category routing pattern

---

## Content Schema Shape & File Layout

### Question 1: Gallery sort order

| Option | Description | Selected |
|--------|-------------|----------|
| Manual `order: 1` integer field | Hand-positioned, magazine-style intentional layout. Slight overhead when reordering, but matches the asymmetric magazine-grade SPLASH-03 vibe. | ✓ |
| Reverse-chronological `date` | Newest first, automatic. Risk: buries strong-but-old work. | |
| Frontmatter list order (filesystem) | Simplest schema, but filesystem-fragile under renames. | |
| Featured-first then chronological | More flexibility, more authoring decisions. | |

**User's choice:** Manual `order` integer field
**Notes:** Aligns with the curated-magazine feel the visual direction (sketch 001) commits to. Reordering cost is acceptable at 5–15 pieces.

### Question 2: Draft handling

| Option | Description | Selected |
|--------|-------------|----------|
| `draft: true` frontmatter flag | Caleb commits in-progress on main; build excludes drafts. Friendly for GitHub.dev (Phase 6). | ✓ |
| No draft flag — use git branches | Cleaner schema but assumes branch comfort; PROJECT.md frames Caleb as 'not a developer'. | |
| No draft flag, no branches | Pieces live the moment they merge. Simplest mental model, no checkpointing. | |

**User's choice:** `draft: true` frontmatter flag
**Notes:** Critical because Phase 6 hands maintenance to Caleb via GitHub.dev (browser editor). Branch workflow would be friction.

---

## PDF Rasterization POC Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Throwaway standalone script | `scripts/pdf-poc.mjs`, validates libraries in CI, output not used by site. Phase 2 builds productionized pipeline cleanly. | ✓ |
| Integrated into one Phase 1 sample piece | One real PDF rasterized at build, fed into gallery. Proves full pipe day one but blurs phase scope. | |
| Skip the POC, defer entirely to Phase 2 | Saves 30 min, but PITFALLS.md flagged this as the highest-risk technical bit. | |

**User's choice:** Throwaway standalone script
**Notes:** Keeps Phase 1 thin while still de-risking Phase 2. POC must run in CF Pages preview build environment so platform-specific crashes surface before Phase 2 commits.

---

## Sample Content for the 4 Walking-Skeleton Pieces

### Question 1: Real vs placeholder content

| Option | Description | Selected |
|--------|-------------|----------|
| Real piece per category, brief CRO blurbs | One real per Design / Finance / Personal / Marketing, real images, brief CRO. Show-able preview. | ✓ |
| Pure placeholder — lorem ipsum + Unsplash | Fastest path. Phase 1 not show-able outside engineering. | |
| Mix — 1–2 real, rest placeholder | Reduces content-prep load. | |

**User's choice:** Real piece per category, brief CRO blurbs
**Notes:** Phase 1 deliverable should be show-able. Brief blurbs (1–2 lines per CRO field) for Phase 1; full-length lands in Phase 2.

### Question 2: Personal Projects slot

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder piece marked clearly as Phase 1 stand-in | One temporary piece with placeholder hero + clearly-labeled stand-in CRO. Removed before Phase 2/launch. | ✓ |
| Use a side-project / experiment you already have | Even half-finished. Makes Personal route honest from day one. | |
| Drop the Personal card from Phase 1 entirely | SPLASH-04's drop-if-empty rule kicks in early. Tests 3 of 4 routes. | |

**User's choice:** Placeholder piece marked clearly as Phase 1 stand-in
**Notes:** All four routes get exercised (the routing test is honest). Placeholder must read clearly as a stand-in so it isn't mistaken for shippable content.

---

## Category Routing Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic `[category].astro` with `getStaticPaths` | One file enumerates four categories at build. DRY. Modern Astro idiom. | ✓ |
| Four explicit pages | Hand-tunable per category. Costs duplication and 4× the file count. | |
| Hybrid: shared component, four wrapper pages | Middle ground — reuses layout but keeps per-category file. | |

**User's choice:** Dynamic `[category].astro` with `getStaticPaths`
**Notes:** Detail route follows the same pattern at `[category]/[slug].astro`. Per-category visual departures are achievable inside the dynamic template via category-conditional styling.

---

## Claude's Discretion

- Package manager (npm chosen by default — Astro convention)
- TypeScript strictness (Astro `strict` preset)
- Linter / formatter (defer)
- Asset colocation pattern (`src/content/pieces/[slug]/index.md` with `image()` schema helper — feature-folder pattern, native compatibility with Astro 5 image optimization)
- Schema forward-compat fields (scaffold `pdfPaginate`, `fullPdf`, `outcomeTagline` as optional now to avoid Phase 2 schema migration)
- Header / footer chrome (none for Phase 1; lands in Phase 4)
- Preview deploy mechanism (CF Pages preview branch recommended over local-only `astro preview` so the POC actually runs on the production build platform)

## Deferred Ideas

- Productionized PDF rasterization pipeline → Phase 2
- Multi-page slide deck rendering, "Open full PDF" link → Phase 2
- About page + bio + resume → Phase 2
- Magazine-maximalist visual system, on-brand 404 → Phase 3
- Header chrome, prev/next, About contact block → Phase 4
- Mobile / performance / a11y → Phase 5
- Custom domain + Cloudflare deploy + maintenance dry run → Phase 6
- Featured-first ordering, outcome taglines, "show me everything" tour → v2
- View Transitions, scroll-driven reveals, custom cursor, magnetic cards → v2
- Real Personal Projects piece (replaces Phase 1 placeholder) → when content materializes (FUTURE-05)
