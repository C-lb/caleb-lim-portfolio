# Roadmap: Caleb Lim Portfolio

**Mode:** mvp
**Granularity:** standard
**Created:** 2026-05-09

## Overview

Six phases that walk the portfolio from "ugly but routes end-to-end" to "live on caleblim.com with Caleb maintaining it himself." Phase 1 is the walking skeleton — splash → one gallery → one piece-detail page — proving the Astro content collection schema and routing pipeline against a real piece. Phase 2 hardens the PDF rasterization pipeline (the highest-risk technical bit per PITFALLS.md) and lands real Context/Role/Outcome content. Phase 3 applies the locked Magazine-maximalist visual direction from sketch 001 — typography, color, asymmetric gallery layouts, anti-AI-tell verification. Phase 4 fills in secondary nav surfaces (prev/next, header chrome, About contact block). Phase 5 is mobile + performance + accessibility on real devices. Phase 6 ships to Cloudflare Pages on caleblim.com and runs the Caleb-adds-a-piece dry run that closes the maintenance pitfall.

The site is continuously deployable from end of Phase 1 onward — each later phase thickens the slice, never breaks it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Walking Skeleton** - Astro project, content schema, one piece per category routes end-to-end (ugly is fine)
- [x] **Phase 2: Asset Pipeline + Real Content** - Build-time PDF rasterization productionized, all 5–15 pieces with real CRO blurbs, About + resume live
- [x] **Phase 3: Visual Design System** - Magazine-maximalist direction applied across splash, galleries, detail pages; AI-tell verification
- [ ] **Phase 4: Navigation & Secondary Surfaces** - Header chrome (mailto, LinkedIn), prev/next within discipline, About contact block
- [ ] **Phase 5: Mobile, Performance, Accessibility** - Real-device iPhone Safari pass, Lighthouse mobile ≥85 / a11y ≥95, prefers-reduced-motion verified
- [ ] **Phase 6: Deploy & Maintenance Handoff** - caleblim.com live on Cloudflare Pages, Caleb-adds-a-piece dry run passes

## Phase Details

### Phase 1: Walking Skeleton
**Goal**: A deployable Astro site exists where a recruiter can land on the splash, click any of the four discipline cards, see at least one piece in that gallery, and click into a piece-detail page — all routes work, no broken states. Visuals are intentionally placeholder.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PIECE-01, PIECE-02
**Success Criteria** (what must be TRUE):
  1. `npm run dev` boots an Astro site with routes for splash (`/`), four discipline galleries (`/design`, `/finance`, `/personal`, `/marketing`), and piece-detail pages (`/[category]/[slug]`)
  2. A content collection (`src/content/pieces/`) with a Zod-validated schema enforces required frontmatter (`title`, `category`, `role`, `outcome`, `context`, hero asset reference) and the build fails loudly on missing fields
  3. At least one real piece per category renders end-to-end: gallery shows it, click navigates to the detail page, detail page shows a hero `<img>` (no iframe) plus three text blocks for Context / Role / Outcome
  4. A 30-minute proof-of-concept confirms `pdfjs-dist` + `@napi-rs/canvas` rasterizes one of Caleb's real PDFs to PNG without crashing in CI (POC only — productionized in Phase 2)
  5. Site builds with `npm run build` and the static output deploys to a preview URL (Cloudflare Pages preview branch or local `astro preview`)
**Plans:** 3 plans
- [x] 01-01-PLAN.md — Scaffold Astro project (pinned deps, Node 22.16, schema, shared category enum) + author one real Graphic Design piece end-to-end + wire splash, gallery, and detail routes
- [x] 01-02-PLAN.md — Author the remaining three pieces (Finance real, Marketing real, Personal placeholder) + write `scripts/verify-build.sh` smoke verification + manual preview check
- [x] 01-03-PLAN.md — Standalone PDF rasterization POC (`scripts/pdf-poc.mjs`) against Caleb's real PDF + verify it runs in the Cloudflare Pages preview build environment (de-risks Phase 2)

### Phase 2: Asset Pipeline + Real Content
**Goal**: Every v1 piece has a build-time-rasterized cover image, real Context/Role/Outcome copy, and the About page + downloadable resume are live. The site has all its content load-bearing — the recruiter can read real artifacts on every page, not lorem ipsum.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: PIECE-03, PIECE-04, PIECE-06, FOUND-05, ABOUT-01, CONTACT-01, CONTACT-02
**Success Criteria** (what must be TRUE):
  1. `scripts/pdf-preprocess.mjs` runs as a pre-build step, ingests every `.pdf` referenced in the content collection, and emits page-1 covers (and 3–6 representative pages for multi-page decks marked `pdfPaginate: true`) into `public/generated/pdf-thumbs/` — outputs committed to git so Caleb never runs the script himself
  2. Caleb has authored 5–15 pieces total with the asymmetric distribution flagged in FOUND-05 (~7 Graphic Design, ~6 Marketing, ~3 Financial Models, ~2 Personal Projects), each with finalized Context (3–6 lines) / Role (1–3 lines) / Outcome (1–3 lines) blurbs that read practitioner-coded, not dabbler-coded
  3. About page exists with an 80–150-word first-person bio that takes a stance on the cross-functional analyst+brand pitch (no "passionate / multidisciplinary / intersection of" filler per PITFALLS.md)
  4. `caleb-lim-resume.pdf` (under 1MB, EXIF-stripped) lives in `/public/`, downloads directly without an email gate, and is linked from the About page
  5. Multi-page slide decks render their 3–6 representative slides as a vertical sequence below the hero on the detail page; pieces with sharable original PDFs surface an "Open full PDF" link
**Plans:** 7 plans (4 original + 3 gap-closure)
- [x] 02-01-PLAN.md — Productionize PDF rasterization pipeline (prebuild hook + pdf-preprocess.mjs + schema migration + Gate 7)
- [x] 02-02-PLAN.md — About page + EXIF-stripped resume + Gates 8-9 (bio voice + resume size)
- [x] 02-03-PLAN.md — Detail template paginated rendering + Open full PDF link + Gates 10-11
- [x] 02-04-PLAN.md — Real content authoring (delete phase-1-skeleton + replace placeholders + commit generated outputs + Gate 12) — SHIPPED-WITH-PLACEHOLDERS; Tasks 2-4 deferred to gap closure
- [x] 02-05-PLAN.md — [GAP CLOSURE] Real content authoring per D-13 collaborative flow (closes SC2 / SC5 / FOUND-05; exercises SC1 PDF pipeline against real input)
- [x] 02-06-PLAN.md — [GAP CLOSURE] Pipeline correctness fixes from 02-REVIEW.md (CR-01 draft-skip, WR-01 orphan prune, WR-02 fullPdf canonical-path contract)
- [x] 02-07-PLAN.md — [GAP CLOSURE] Gate 12 (a-e) + Gate 13 (CR-01 runtime exercise) + commit generated outputs per D-03 + final integrated UAT

### Phase 3: Visual Design System
**Goal**: The locked Magazine-maximalist direction from sketch 001 is fully applied. The site reads as confident hand-crafted brand work, not as a v0/shadcn template. Every AI-tell from VISUAL-04 is verifiably absent.
**Mode:** mvp
**Depends on**: Phase 2 (real content with real aspect ratios — designing against placeholders breaks when real assets land)
**Requirements**: SPLASH-01, SPLASH-02, SPLASH-03, SPLASH-04, SPLASH-05, VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04
**Success Criteria** (what must be TRUE):
  1. Type system loads Bricolage Grotesque (display, oversized + tight tracking), Fraunces italic (editorial accent), and JetBrains Mono (micro-labels) — self-hosted with `font-display: swap` and the display face preloaded; Inter is nowhere in the stylesheet
  2. Color system uses warm cream (`#f4ebd9`) + ink black + the four discipline accents (terracotta, cobalt, electric lime, plum); each discipline carries its accent through gallery and detail header; category pages invert to ink-black background per the locked direction
  3. Splash above the fold on a 1280px viewport shows portrait + name + roles + bio block + "What do you wish to see?" prompt + four rotated discipline cards (-1° to +1°) with layered decorative geometry (outline circles, italic numerals, dotted lines, triangles)
  4. Each discipline gallery uses an asymmetric magazine layout (varied tile sizes, intentional negative space, NOT a uniform grid); the layout holds up visually with as few as 2 pieces (no thin-gallery placeholder feel) and degrades to dropping the card from splash if a category has zero pieces at launch
  5. Custom on-brand 404 page exists, returns HTTP 404, and links back to splash
  6. **Anti-AI-tell verification passes** — manual checklist confirms: no centered hero with gradient, no shadcn cards, no Inter anywhere, no purple gradients, no lucide icons, no bento grid, no "Built with X" footer
**Plans:** 6 plans
Plans:
- [x] 03-01a-PLAN.md — Foundation tokens: Fontsource install + tokens.css + disciplines.ts (Wave 1a, 3 tasks)
- [x] 03-01b-PLAN.md — Foundation layout + verification harness: portrait checkpoint + StatusPill + Base.astro + verify-anti-ai-tells.sh + ANTI-AI-CHECKLIST.md + verify-build.sh Phase 3 gates + build smoke (Wave 1b, 7 tasks, depends_on 03-01a)
- [x] 03-02-PLAN.md — Splash slice: DisciplineCard component + full re-skin of index.astro with hero band, question bar, 4 rotated cards, SPLASH-04 drop-card logic
- [x] 03-03-PLAN.md — Gallery slice: GalleryA12 + GalleryB35 + GalleryC68 bucket templates + [category].astro with ink bg, accent flow, empty-discipline route drop
- [x] 03-04-PLAN.md — Detail + about re-skin: [category]/[slug].astro accent header (paginated PDF block preserved verbatim) + about.astro Phase 3 typography (bio copy preserved)
- [x] 03-05-PLAN.md — 404 page (D-14) + local HTTP 404 verification (SPLASH-05 SC5) + final anti-AI-tell walk + phase-exit verification (all verify-build.sh gates 1-18 green + ANTI-AI-CHECKLIST.md fully ticked)
**UI hint**: yes

### Phase 4: Navigation & Secondary Surfaces
**Goal**: As a hiring manager, I want to move between similar pieces and contact Caleb when I see one I like, so that I can act on interest the moment I have it, without hunting for an email address.
**Mode:** mvp
**SPIDR split**: by Interface — 3 plans expected (header chrome, detail prev/next + back-to-category, About contact block).
**Original goal (pre-mvp-phase)**: Every page has the persistent navigation chrome a recruiter expects — resume / mailto / LinkedIn always one tap away from the header, prev/next at the bottom of every detail page, full contact block on About.
**Depends on**: Phase 3 (header chrome is styled to the design system, not designed in isolation)
**Requirements**: PIECE-05, CONTACT-03, CONTACT-04, CONTACT-05
**Success Criteria** (what must be TRUE):
  1. Site header on every page contains a logo/name link back to splash, a `mailto:` contact link, a LinkedIn link (with `target="_blank" rel="noopener noreferrer"`), and a Resume download — all four affordances visible without a hamburger on desktop ≥768px
  2. Each piece-detail page footer renders prev/next navigation scoped to the same discipline (no cross-discipline jumps) plus a "Back to [Category]" link that returns to the gallery the recruiter came from
  3. About page hosts a contact block with email + LinkedIn + (optional) Calendly — a slightly larger surface than the header chrome, intended for the recruiter who already read the bio
  4. External links audit passes — every outbound link uses `target="_blank" rel="noopener noreferrer"`; the `mailto:` link delivers to Caleb's actual inbox (verified by sending a test from a different account)
**Plans**: 3 plans
Plans:
**Wave 1**
- [x] 04-01-PLAN.md — Header chrome (mailto, LinkedIn, Resume) + skip-to-content + <main> wrap in Base.astro + verify-build.sh Gates 19a-f + 20

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04-02-PLAN.md — Detail-page prev/next pager in [category]/[slug].astro (same-discipline scoped, hide at edges) + Gates 21a-c + 22
- [x] 04-03-PLAN.md — About contact block (email + LinkedIn; Calendly skipped per user lock) — closes Gate 19e
**UI hint**: yes

### Phase 5: Mobile, Performance, Accessibility
**Goal**: A recruiter on a real iPhone over hotel wifi can land on the splash, pick a discipline, browse the gallery, open a piece, and download the resume — fast, accessible, no layout breakage, no scroll-jacking, no motion that ignores `prefers-reduced-motion`.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: FOUND-01, FOUND-02, FOUND-03
**Success Criteria** (what must be TRUE):
  1. Real-device test on iPhone Safari (not desktop devtools simulation, per PITFALLS.md) confirms: splash four cards readable above the fold, tap targets ≥44px, every PDF piece scrolls correctly through its rendered slide sequence, no horizontal scroll anywhere, resume PDF opens in the system viewer. **Explicit fix:** `.topbar` collapses cleanly at ≤700px (brand wraps at most 1 line; OPEN-TO-ROLES island already top-center fixed; nav links remain visible — no `resume` link cropped off-screen at 375px). Carries Phase 4 UI-REVIEW BLOCKER-1.
  2. Lighthouse mobile audit on a throttled 4G profile scores ≥85 Performance (LCP <2s on splash) and ≥95 Accessibility on splash, gallery, and detail pages — measured on the actual deployed preview URL, not localhost
  3. `prefers-reduced-motion: reduce` honored everywhere — rotations on splash cards collapse to 0°, scroll-driven reveals become instant opacity changes, magnetic/hover-deflection effects disable; verified by toggling the OS setting and walking the full site
  4. Recruiter on iPhone Safari can complete the full critical path — land on splash, click Graphic Design, see the gallery, click into a piece, scroll the detail page, return to gallery, switch to a different discipline, download the resume — without hitting a broken state, layout shift, or scroll-jacked section
  5. **Gallery tiles render the piece hero/thumbnail** (not empty colored slabs) on `/design`, `/marketing`, and any other populated discipline — recruiter arriving from the splash sees image-led tiles, not text-only placeholders. Piece `hero` asset already exists; gallery card just needs wiring (mirror the detail page's image use). Carries Phase 4 UI-REVIEW BLOCKER-2.
  6. **Design-token hygiene pass**: (a) `--lime` and any other Phase-4 UAT-added tokens registered in `tokens.css` with documented contrast/use rationale (or removed if redundant against `--acid`); (b) `--terracotta` use audited — either re-scoped as load-bearing (drop the "decorative only" comment) or replaced where it carries semantic weight; (c) raw `font-size` and spacing literals in `src/pages/index.astro`, `src/pages/about.astro`, `src/components/*.astro` replaced with `--fs-*` and `--sp-*` tokens (target: zero raw `px` font-sizes outside `tokens.css`). Carries Phase 4 UI-REVIEW WARNING-1.
**Plans**: 8 plans
Plans:
**Wave 0**
- [ ] 05-01-PLAN.md — Validation harness (lighthouse-audit.sh + verify-build.sh Gates 23/24/25 + 05-VERIFICATION.md template + 05-TOKEN-MAP.md)

**Wave 1** *(DAG inside the wave — files_modified overlap is gated via depends_on rather than partitioned)*
- [ ] 05-02-PLAN.md — Vercel project import + phase-5 preview URL verification (D-13 amended) — depends_on: [01]
- [ ] 05-03-PLAN.md — Topbar mobile collapse ≤700px (D-01–D-03) + desktop tap-target floor + .visually-hidden utility — closes BLOCKER-1 — depends_on: [01]
- [ ] 05-04-PLAN.md — Gallery tile recomposition (D-09–D-12) + LCP priority/sizes on splash carousel + detail hero — closes BLOCKER-2 — depends_on: [01]
- [ ] 05-05-PLAN.md — Token sweep (D-17, D-18) + --sp-3 add + --terracotta/--lime comments + Gate 25 closes — closes WARNING-1 — depends_on: [01, 03, 04] (sweeps the final versions of Base.astro/tokens.css/index.astro/[slug].astro after 03 + 04 land)

**Wave 2** *(after Wave 1 — transitive deps named explicitly)*
- [ ] 05-06-PLAN.md — Reduced-motion surgical pass (D-08): remove global * clamp from tokens.css + per-source disables for entrance shakes — depends_on: [03, 04, 05]
- [ ] 05-07-PLAN.md — Touch-hover gating (D-06, 13 surfaces) + touch entrance shimmer (D-07) + StatusPill mobile shrink (D-04) — depends_on: [03, 04, 05, 06]
- [ ] 05-08-PLAN.md — Phase-exit verification: Lighthouse audit on Vercel preview + real-iPhone walk + reduced-motion walk + record in 05-VERIFICATION.md — depends_on: [02, 03, 04, 05, 06, 07]


**Carry-over from Phase 4 UI Review** (`.planning/phases/04-navigation-secondary-surfaces/04-UI-REVIEW.md`, 13/24 overall):
- BLOCKER-1 — mobile `.topbar` overflow at 375px → folded into SC1.
- BLOCKER-2 — empty gallery tiles on populated disciplines → new SC5.
- WARNING-1 — design-token drift (`--lime` undocumented, `--terracotta` scope mismatch, raw literals) → new SC6.

These are the only Phase-4 audit findings that must clear before Phase 6 ships; minor recs (14 total) are deferred to post-launch polish unless they surface during Phase 5 testing.

### Phase 6: Deploy & Maintenance Handoff
**Goal**: Site is live on caleblim.com (or confirmed fallback domain) on Cloudflare Pages, and Caleb has personally added a new piece end-to-end via GitHub.dev without developer help. The maintenance pitfall is closed by demonstration, not by documentation alone.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: FOUND-04
**Success Criteria** (what must be TRUE):
  1. `caleblim.com` is registered via Cloudflare Registrar (or, if unavailable, a confirmed fallback like `caleblim.co` / `caleb.work` after running the availability check) and resolves to the production Cloudflare Pages deployment over HTTPS with no certificate warnings
  2. Production site loads end-to-end on the custom domain — splash, all four galleries, every piece-detail page, About, resume download, 404 — verified across iPhone Safari, Android Chrome, desktop Safari, and desktop Firefox
  3. Caleb has personally added one new test piece via GitHub.dev (in-browser editor, no terminal) — created the markdown file, dropped in the asset, committed, and watched Cloudflare Pages auto-deploy the change live — and a 5-step screenshot walkthrough of that flow lives in the repo README
  4. OG/Twitter card metadata, `robots.txt`, `sitemap.xml`, and a complete favicon set (32, 192, Apple touch 180, .ico) are present and verified via LinkedIn Post Inspector and Twitter Card Validator
**Plans**: TBD

## Coverage

All 26 v1 requirements mapped to exactly one phase. No orphans, no duplicates.

| Category | Count | Phases |
|----------|-------|--------|
| SPLASH (5) | SPLASH-01, 02, 03, 04, 05 | All Phase 3 |
| PIECE (6) | PIECE-01, 02 → Phase 1; PIECE-03, 04, 06 → Phase 2; PIECE-05 → Phase 4 | 1, 2, 4 |
| ABOUT/CONTACT (6) | ABOUT-01, CONTACT-01, 02 → Phase 2; CONTACT-03, 04, 05 → Phase 4 | 2, 4 |
| VISUAL (4) | VISUAL-01, 02, 03, 04 | All Phase 3 |
| FOUND (5) | FOUND-05 → Phase 2; FOUND-01, 02, 03 → Phase 5; FOUND-04 → Phase 6 | 2, 5, 6 |

**Total mapped: 26 / 26 ✓**

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Walking Skeleton | 0/3 | Not started | - |
| 2. Asset Pipeline + Real Content | 0/TBD | Not started | - |
| 3. Visual Design System | 0/6 | Not started | - |
| 4. Navigation & Secondary Surfaces | 0/3 | Not started | - |
| 5. Mobile, Performance, Accessibility | 0/TBD | Not started | - |
| 6. Deploy & Maintenance Handoff | 0/TBD | Not started | - |
