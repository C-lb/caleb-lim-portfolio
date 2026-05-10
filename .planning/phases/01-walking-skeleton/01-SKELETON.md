# Walking Skeleton — Caleb Lim Portfolio

**Phase:** 1
**Generated:** 2026-05-10

## Capability Proven End-to-End

A recruiter can land on the splash (`/`), click any of the four discipline cards, see at least one piece in that gallery, and click into a piece-detail page that renders a hero `<img>` plus three blurb blocks (Context / Role / Outcome) — all from a Zod-validated content collection, built statically by Astro, deployable to Cloudflare Pages.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | **Astro `^5.18.1`** (NOT 6.x) | CLAUDE.md stack lock; Astro 6 + Zod 4 has IDE regression on `({ image }) =>` schema form (#16001). 5.18.1 is the latest stable 5.x. |
| Node version | **22.16.0** via `.nvmrc` | Matches Cloudflare Pages v3 build image; satisfies `pdfjs-dist@5.7.284` engine requirement (`>=22.13.0 || >=24`). |
| Content layer | **New content layer** (`src/content.config.ts` + `glob()` loader) | Astro 5's content layer is 5x faster than legacy, has cleaner `image()` ergonomics, and is the non-deprecated path. Greenfield = no migration burden. |
| Schema validation | **Zod (re-exported as `astro/zod`)** with `({ image }) => z.object(...)` function form | Required for `image()` helper access. Bare object form cannot resolve `image()`. |
| Category enum | **Single `src/content/categories.ts`** module exporting `CATEGORIES` const + `Category` type | D-12 — defined once, imported by both schema and `getStaticPaths`. Drift = silent route breakage. |
| Content layout | **`src/content/pieces/[slug]/index.md`** colocated with `hero.{jpg,png,webp}` | D-04 feature-folder pattern; same dir holds Phase 2's source PDF; native compatibility with Astro's `image()`. |
| Routing | **Dynamic `[category].astro` and `[category]/[slug].astro`** with `getStaticPaths()` over the shared enum | D-11 — single template per level, category-conditional styling later (Phase 3) over four hand-rolled files. |
| PDF rasterization | **`pdfjs-dist@^5.7.284`** as devDependency; `@napi-rs/canvas` lands as transitive optionalDep at `^0.1.100` | Mozilla canonical example works verbatim post-4.9.155 fix. Do NOT install `@napi-rs/canvas` directly — 1.0.0 is an incompatible major. |
| POC isolation | **Standalone `scripts/pdf-poc.mjs`**, run via `npm run pdf-poc` | D-05 throwaway; not on the build path; output not consumed by site. Phase 2 builds clean from this. |
| Deployment target | **Cloudflare Pages preview branch** (production deploy is Phase 6) | Per Phase 1 success criterion 5; preview URL is the venue for running the POC against the real prod build env (D-05). |
| Smoke verification | **`scripts/verify-build.sh`** over `dist/` (no test framework) | Build IS the integration test for content collections. Smoke greps over rendered HTML cover PIECE-01 (no iframe) + PIECE-02 (Context/Role/Outcome present). Vitest deferred to Phase 2. |
| TypeScript | **`astro/tsconfigs/strict`** preset | CONTEXT.md "Claude's Discretion" — Astro's strict preset; nothing custom. |

## Stack Touched in Phase 1

- [x] **Project scaffold** — Astro 5.18.1, Node 22.16.0 pinned via `.nvmrc`, strict tsconfig, minimal `astro.config.mjs` with no integrations
- [x] **Routing** — splash (`/`) + 4 category galleries (`/[category]`) + N piece-detail pages (`/[category]/[slug]`)
- [x] **Content collection (the data layer)** — Zod-validated frontmatter, `image()` colocated heroes, `glob()` loader; each build re-validates every piece's frontmatter against the schema
- [x] **UI rendering** — bare semantic HTML on every page (no design system); each detail page renders `<Image src={hero}>` + Context/Role/Outcome `<section>` blocks
- [x] **Deployment** — `astro preview` locally proves the static `dist/` build works; Cloudflare Pages preview branch (recommended) deploys it to a real preview URL
- [x] **Build-time validation surface** — pdfjs-dist + @napi-rs/canvas POC validated against Caleb's real PDF in the Cloudflare Pages Linux build env, de-risking Phase 2

## Out of Scope (Deferred to Later Slices)

These are NOT in the skeleton — calling them out so future phases don't re-litigate Phase 1's minimalism.

- **Productionized PDF rasterization pipeline** (`scripts/pdf-preprocess.mjs`, multi-page support, output committed to `public/generated/pdf-thumbs/`) → Phase 2
- **Multi-page slide deck rendering on detail pages** (PIECE-04) → Phase 2
- **"Open full PDF" download link** (PIECE-06) → Phase 2
- **Real Context/Role/Outcome copy at full length** (3–6 lines Context, 1–3 lines Role, 1–3 lines Outcome) — Phase 1 ships brief 1–2-line stand-ins per D-09 → Phase 2
- **About page + bio + resume** (ABOUT-01, CONTACT-01, CONTACT-02) → Phase 2
- **Magazine-maximalist visual system** (Bricolage Grotesque + Fraunces + JetBrains Mono, warm cream + ink + accents, rotated cards, decorative geometry) → Phase 3
- **On-brand 404 page** (SPLASH-05) — Astro's default 404 is fine for Phase 1 → Phase 3
- **Header chrome** (mailto / LinkedIn / Resume), **prev/next within discipline**, **About contact block** → Phase 4
- **Mobile responsiveness, performance, prefers-reduced-motion** (FOUND-01..03) → Phase 5
- **Custom domain `caleblim.com`, production Cloudflare Pages deploy, GitHub.dev maintenance dry run** (FOUND-04) → Phase 6
- **Real Personal Projects piece** — placeholder ships in Phase 1 (D-08); replacement is FUTURE-05
- **MDX, Tailwind, motion library, View Transitions** — none of these in Phase 1 (avoiding AI-template tells even at placeholder fidelity)
- **Test framework (vitest)** → Phase 2 once `scripts/pdf-preprocess.mjs` becomes load-bearing

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2:** Productionized PDF rasterization (`scripts/pdf-preprocess.mjs`) + 5–15 real pieces with full-length CRO copy + About page + resume PDF
- **Phase 3:** Magazine-maximalist visual system applied to splash, galleries, detail pages + on-brand 404 + AI-tell verification
- **Phase 4:** Persistent header chrome (logo, mailto, LinkedIn, resume) + prev/next within discipline + About contact block
- **Phase 5:** Mobile + Lighthouse mobile ≥85 / a11y ≥95 + `prefers-reduced-motion` honored
- **Phase 6:** `caleblim.com` registered + production Cloudflare Pages deploy + Caleb-adds-a-piece dry run via GitHub.dev
