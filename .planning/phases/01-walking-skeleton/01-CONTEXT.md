# Phase 1: Walking Skeleton - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a deployable Astro site that proves the routing + content collection pipeline end-to-end. A recruiter can land on the splash, click any of the four discipline cards, see at least one piece in that gallery, and click into a piece-detail page — every route works, every detail page renders a hero `<img>` (no iframe-PDFs) plus three text blocks for Context / Role / Outcome. Visuals are intentionally placeholder — the locked Magazine-maximalist visual direction lands in Phase 3, not here.

Two requirements anchor the phase:
- **PIECE-01** — each piece has a dedicated detail page with a large rendered hero asset (image, never iframe-embedded PDF)
- **PIECE-02** — each detail page shows three short blurb blocks: Context (3–6 lines), Role (1–3 lines), Outcome (1–3 lines)

Plus a 30-min proof-of-concept that `pdfjs-dist` + `@napi-rs/canvas` rasterizes a real PDF without crashing in CI — de-risking the Phase 2 asset pipeline before we depend on it.

The slice is continuously deployable from the end of this phase onward: every later phase thickens it without breaking it.

</domain>

<decisions>
## Implementation Decisions

### Content Schema & File Layout

- **D-01:** Pieces are sorted within a discipline gallery by a manual `order: number` field in frontmatter. Each piece is hand-positioned — supports the asymmetric magazine-grade layout SPLASH-03 calls for and lets Caleb anchor a gallery with his strongest piece regardless of when it was made. Reverse-chrono and filesystem-order rejected: chrono buries strong-but-old work; filesystem order is fragile under renames.
- **D-02:** Schema includes a `draft: boolean` frontmatter flag. Drafted pieces are excluded from galleries and detail-route generation at build time. Picked over branch-based staging because Phase 6 hands maintenance to Caleb via GitHub.dev (in-browser editor, no terminal) — a frontmatter flag is friendlier than a branch workflow.
- **D-03:** The Zod schema MUST scaffold optional fields for Phase 2 forward-compatibility now, even though Phase 1 doesn't use them: `pdfPaginate: boolean` (Phase 2 multi-page deck flag, PIECE-04), `fullPdf: string` (optional download link, PIECE-06), `outcomeTagline: string` (CONTENT-01 deferred). All optional with `.optional()`. Reason: avoid a Phase 2 schema migration over fields whose shape is already known.
- **D-04:** Per-piece content is colocated as `src/content/pieces/[slug]/index.md` with `hero` (image) and any source asset (e.g. `source.pdf`) living in the same directory. Hero is referenced via Astro's `image()` schema helper for build-time optimization. Slug is derived from the directory name (Astro default). Rationale: feature-folder pattern, native compatibility with `image()`, and the same directory will hold the source PDF that Phase 2's pre-build script consumes.

### PDF Rasterization POC Scope

- **D-05:** The POC is a throwaway standalone script at `scripts/pdf-poc.mjs`. It ingests one of Caleb's real PDFs (he supplies the file as `samples/poc-input.pdf` or similar), runs `pdfjs-dist` + `@napi-rs/canvas`, emits a PNG, and exits 0 on success / non-zero on crash. Output is NOT consumed by the site — Phase 2 builds the productionized `scripts/pdf-preprocess.mjs` cleanly without inheriting POC scaffolding. The script must be exercisable in the Cloudflare Pages preview build environment (or whatever CI surface is available in Phase 1) so a crash on Cloudflare's Linux container surfaces before Phase 2 commits to the pipeline.
- **D-06:** The POC's success bar is "doesn't crash, emits a non-zero-byte PNG file." Visual correctness, multi-page handling, font fidelity, and color accuracy are explicitly NOT in scope for Phase 1 — those are Phase 2 concerns.

### Sample Content for the 4 Walking-Skeleton Pieces

- **D-07:** The sample piece set is one real piece per category for **Graphic Design / Financial Models / Marketing**, plus a clearly-labeled placeholder for **Personal Projects** (since v1 Personal content is undefined per PROJECT.md / STATE.md). All four categories must have at least one piece so all four routes are exercised end-to-end — dropping the Personal card (SPLASH-04 fallback) is a Phase 3 / launch-time decision, not a Phase 1 routing test.
- **D-08:** The Personal Projects placeholder lives at `src/content/pieces/phase-1-skeleton/index.md` with a clearly placeholder hero (e.g. solid color block or "PLACEHOLDER" text image) and CRO blurbs that explicitly read as stand-ins (e.g. Outcome: "Walking-skeleton placeholder — replace with real piece in Phase 2 or drop the Personal card per SPLASH-04"). The piece carries `draft: false` (it MUST render to validate the route) but its placeholder nature must be obvious to anyone previewing the site so it isn't mistaken for shippable content.
- **D-09:** CRO blurbs on the three real pieces are kept brief — 1–2 lines per Context / Role / Outcome field is sufficient for Phase 1. Full-length production blurbs (Context 3–6 lines, Role 1–3 lines, Outcome 1–3 lines per PIECE-02) land in Phase 2 alongside the rest of the v1 content load. Caleb supplies the three real pieces' assets and brief blurbs as part of Phase 1 execution.
- **D-10:** Hero assets for the three real pieces are plain images (`.jpg` / `.png` / `.webp`) for Phase 1 — even pieces whose source artifact is a PDF use a manually-exported image cover for the walking skeleton. The PDF-to-PNG pipeline doesn't ship until Phase 2; Phase 1's POC validates the libraries but doesn't feed the gallery.

### Category Routing Pattern

- **D-11:** Discipline gallery routes use a single dynamic `src/pages/[category].astro` with `getStaticPaths()` enumerating the four category slugs (`design`, `finance`, `personal`, `marketing`). The detail route follows the same pattern at `src/pages/[category]/[slug].astro`, also with `getStaticPaths()`. Per-category visual departures (which SPLASH-03 hints at via "asymmetric magazine layouts") are achievable inside the dynamic template via category-conditional styling — not a reason to fan out into four explicit files.
- **D-12:** Category slugs are an enumerated TypeScript union type, NOT free-form strings. The Zod content schema's `category` field uses `z.enum(['design', 'finance', 'personal', 'marketing'])`. `getStaticPaths()` reads from the same enum. Adding a fifth category later (out of scope for v1) is a one-line schema change.

### Claude's Discretion

- Package manager: npm (Astro default; aligns with PROJECT.md "Caleb is comfortable with markdown + git" not "comfortable with bun/pnpm").
- TypeScript strictness: Astro's `tsconfig.json` `strict` preset.
- Astro integrations beyond core: only what's strictly needed for Phase 1 (no MDX, no Tailwind, no React adapter — visuals are placeholder, those land later if needed).
- Linter / formatter: defer; Phase 1 establishes nothing here, leave clean.
- 404 page: SPLASH-05 maps to Phase 3 — Phase 1 ships Astro's default 404.
- Header / footer chrome: maps to Phase 4 — Phase 1 has no persistent chrome (just bare layouts that show the route works).
- Navigation between pages: bare `<a>` tags are fine; styled nav is Phase 3 / 4.
- Preview deploy: `astro preview` locally is the minimum success bar; wiring Cloudflare Pages preview branches early (so the PDF POC actually runs in CF's Linux build env) is a planner-judgment call — recommended but not required for Phase 1 sign-off.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project framing & requirements
- `.planning/PROJECT.md` — overall pitch, constraints, key decisions table; codifies that visuals must NOT read as AI-generated and the Astro-over-Framer fork
- `.planning/REQUIREMENTS.md` §v1 → "Piece Detail" — PIECE-01 (no iframe-PDFs, large hero), PIECE-02 (CRO blurb structure with line counts)
- `.planning/REQUIREMENTS.md` §Out of Scope — universally-rejected AI-template tells (skill bars, testimonial sliders, centered hero with gradient, shadcn-card grid, etc.); applies even at Phase 1 placeholder fidelity
- `.planning/ROADMAP.md` §"Phase 1: Walking Skeleton" — 5 success criteria, the source of truth for what "done" means; especially criterion 4 (PDF POC) and criterion 5 (deployable preview)
- `.planning/ROADMAP.md` §"Phase 2: Asset Pipeline + Real Content" — what Phase 1 is the on-ramp to; helps the planner avoid pulling Phase 2 work earlier

### Visual direction (locked but deferred)
- `.planning/sketches/MANIFEST.md` §"Locked Design Anchor" — Magazine-maximalist direction, type pairing, color system, layout language. Phase 1 visuals are placeholder, but anything Caleb sees during Phase 1 should at minimum NOT contradict the locked direction (no Inter, no shadcn cards, no centered-hero-with-gradient — even in placeholder form)
- `.planning/sketches/001-direction-comparison/README.md` — full reference for the locked direction (re-read at Phase 3, but referenced here for context)

### Tech stack confirmation
- `CLAUDE.md` §"Technology Stack" → "Fallback Path: Code-built (Astro + Motion + GSAP + Lenis)" — version pins (Astro 5.x, Node 18.20.8+/20.3+/22+), Tailwind treatment ("optional and use carefully — write a custom theme"), and the explicit "What NOT to Use" table
- `CLAUDE.md` §"Hosting" — Cloudflare Pages free tier, why not Vercel for this commercial-adjacent use

### Project state
- `.planning/STATE.md` §"Accumulated Context" → "Decisions" — Astro stack lock, Magazine-maximalist visual lock, MVP mode
- `.planning/STATE.md` §"Blockers/Concerns" — Personal Projects content undefined for v1 (drives D-07 and D-08); PDF rasterization POC risk (drives D-05 and D-06)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a greenfield Astro project. No existing `src/`, no `package.json`, no `astro.config.mjs`. Phase 1 establishes every convention from scratch.

### Established Patterns
- Markdown content with Zod-validated frontmatter (Astro 5 content collections idiom — codified in stack decision; not yet applied)
- Build-time asset processing (foreshadowed by Phase 2's PDF rasterization pipeline; Phase 1 only validates the libraries, doesn't build the pipe)

### Integration Points
- Cloudflare Pages preview build is the first non-local environment Phase 1 may touch — primarily as the venue for running the PDF POC against a Linux container so Phase 2 doesn't discover platform-specific crashes the hard way

</code_context>

<specifics>
## Specific Ideas

- The four category slugs are fixed and load-bearing across the whole site: `design`, `finance`, `personal`, `marketing`. Encode them once as a TypeScript union / Zod enum and reference it from both the content schema and the routing's `getStaticPaths`.
- The PDF POC's CI venue is whichever build surface Phase 1 actually has — most likely a Cloudflare Pages preview branch, since that's the production build environment and Phase 1 success criterion 5 already wants a preview URL. A separate GitHub Actions workflow is acceptable but redundant if CF Pages already runs the build.
- "Real piece per category" for Phase 1 means real assets + real (brief) Context / Role / Outcome blurbs for Graphic Design, Financial Models, and Marketing. The Personal Projects slot gets a clearly-labeled placeholder that will be removed or replaced before launch.

</specifics>

<deferred>
## Deferred Ideas

- **Productionized PDF rasterization pipeline** — Phase 2 (`scripts/pdf-preprocess.mjs`, multi-page support, output to `public/generated/pdf-thumbs/`, committed to git per Phase 2 success criterion 1).
- **Multi-page slide deck rendering on detail pages** — PIECE-04, Phase 2.
- **"Open full PDF" download link** — PIECE-06, Phase 2.
- **About page + bio + resume** — ABOUT-01 / CONTACT-01 / CONTACT-02, Phase 2.
- **Magazine-maximalist visual system** (Bricolage Grotesque + Fraunces + JetBrains Mono, warm cream + ink + four accent colors, rotated cards, layered decorative geometry) — Phase 3.
- **On-brand 404 page** — SPLASH-05, Phase 3.
- **Header chrome (mailto / LinkedIn / Resume), prev/next within discipline, About contact block** — Phase 4.
- **Mobile responsiveness, performance, prefers-reduced-motion** — Phase 5 (Phase 1 doesn't have to be broken on mobile, but it doesn't have to pass Lighthouse either).
- **Custom domain (caleblim.com), production Cloudflare Pages deploy, GitHub.dev maintenance dry run** — Phase 6.
- **Featured-first ordering, outcome taglines on cards, "show me everything" tour** — v2 (CONTENT-01, CONTENT-02).
- **View Transitions, scroll-driven reveals, custom cursor, magnetic splash cards** — v2 (MOTION-01..04).
- **Real Personal Projects piece** — FUTURE-05; replaces the Phase 1 placeholder when content materializes.

</deferred>

---

*Phase: 01-walking-skeleton*
*Context gathered: 2026-05-09*
