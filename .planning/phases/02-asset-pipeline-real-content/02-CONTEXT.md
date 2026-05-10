# Phase 2: Asset Pipeline + Real Content - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Mode:** mvp

<domain>
## Phase Boundary

Phase 2 turns the Phase 1 walking skeleton into a load-bearing site. Two parallel workstreams: (1) productionize the PDF rasterization pipeline that Phase 1's POC validated — `scripts/pdf-preprocess.mjs` runs as part of `npm run build`, ingests every `.pdf` referenced in the content collection, emits page-1 covers and (where flagged) curated representative pages into `public/generated/pdf-thumbs/`. (2) Author the v1 content — full-length CRO blurbs, About bio, downloadable resume, and 5–7 real pieces with the asymmetric distribution from FOUND-05.

Seven requirements anchor the phase: PIECE-03 (PDF rasterization), PIECE-04 (multi-page deck rendering), PIECE-06 (optional "Open full PDF" link), FOUND-05 (asymmetric piece distribution), ABOUT-01 (first-person bio), CONTACT-01 (resume in /public/, no email gate, header-linked), CONTACT-02 (resume linked from About).

Per the user-selected scope: **partial coverage** is acceptable. We launch with whatever pieces are ready (5–7 minimum); FUTURE-06 backfills toward the full FOUND-05 target later. Empty discipline cards drop per SPLASH-04 rather than ship as visibly thin.

Visuals remain placeholder — Magazine-maximalist visual system lands in Phase 3, not here. Phase 2 ships against the same bare-HTML chrome as Phase 1; only content fidelity changes.

</domain>

<decisions>
## Implementation Decisions

### PDF Source Storage & Build Integration

- **D-01:** Source PDFs commit to git, colocated with the markdown at `src/content/pieces/[slug]/source.pdf` (extending Phase 1's D-04 colocation). Repo grows by ~200–500MB across the v1 piece set; well under git's groan threshold and within Cloudflare Pages build-time read limits. Trade-off accepted: simpler mental model and zero-divergence between local builds and CF Pages builds beats a small repo.
- **D-02:** `scripts/pdf-preprocess.mjs` runs as a pre-build hook on `npm run build` (both locally and on CF Pages — same code path everywhere). Hash-based incremental processing: each PDF's content hash is recorded alongside its outputs in `public/generated/pdf-thumbs/[slug]/.cache.json`; rasterization skips when input hash matches a recorded output. CF Pages cold builds re-rasterize everything (acceptable — happens at most once per content change); warm builds are no-ops. The script is automatic — Caleb never invokes it manually (per Phase 2 SC1's "so Caleb never runs the script himself"; reconciled by making it a `prebuild` hook, not a separate command).
- **D-03:** Generated outputs `public/generated/pdf-thumbs/**` ARE committed to git per SC1. The cache sidecar (`.cache.json`) is committed too — without it, every fresh clone would think every PDF is "new" and re-rasterize. Adding `public/generated/pdf-thumbs/` to `.gitignore` is forbidden; the script's idempotency depends on this directory being checked in.

### Output Format & Resolution

- **D-04:** Rasterizer outputs **WebP at 1600px long-edge, ~80KB target per page** (q=80, lossy compression appropriate for thumbnail/hero use). Astro's `<Image>` component (already in use from Phase 1) re-derives smaller responsive variants from this source via Sharp at build time. Total committed-to-git size for the v1 piece set: ~1.5MB across 5–7 pieces × 1–6 pages each. Negligible.
- **D-05:** Output filenames follow `public/generated/pdf-thumbs/[slug]/cover.webp` for the page-1 hero, and `public/generated/pdf-thumbs/[slug]/page-{N}.webp` for paginated pages (where `{N}` is the literal page number from the source PDF, not a sequence index — preserves traceability when Caleb references a specific slide).
- **D-06:** PNG and 2000px+ resolutions were considered and rejected. WebP at 1600px is the floor that hits FOUND-02 first-paint <2s on hotel wifi without sacrificing readability of slide-deck typography. If a specific deck has fine typography that degrades at this size, the override is per-piece — not a default.

### `pdfPaginate` Frontmatter Schema & Page Selection

- **D-07:** The Phase 1 schema scaffold (D-03 in 01-CONTEXT.md) declared `pdfPaginate: z.boolean().optional()`. Phase 2 migrates this to `pdfPaginate: z.array(z.number().int().positive()).optional()` — an array of 1-indexed page numbers Caleb hand-picks, e.g. `pdfPaginate: [1, 5, 12, 23, 47]`. `undefined`/absent means single-page (cover only). This is a breaking schema change, but the field hasn't been used yet (Phase 1 placeholder pieces don't set it), so no data migration needed.
- **D-08:** Caleb curates which pages represent each deck — first slide, key insight, money chart, conclusion. Auto-pick heuristics (first/middle/last, evenly-spaced) and "first N pages" approaches were rejected. Caleb knows his decks; mechanical selection produces transition slides and disclaimers.
- **D-09:** Pages render in the order specified in the array (Caleb chooses sequence). The script does NOT re-sort by page number — `pdfPaginate: [12, 1, 23]` would render page 12, then page 1, then page 23. Lets Caleb lead with the punchline if the deck warrants it.

### Content Scope & Piece Set

- **D-10:** Phase 2 targets **5–7 pieces total at launch** (FOUND-05 minimum: "Launches with 5–15 pieces"). Asymmetric distribution stays in spirit — strong Graphic Design + Marketing, thinner Finance + Personal — but the planner does NOT block on the full ~18-piece target (~7+6+3+2 from the original FOUND-05 ideal). FUTURE-06 backfills toward the higher target post-launch.
- **D-11:** Empty discipline → drop card per SPLASH-04. If Personal Projects has zero ready pieces at the end of Phase 2, the splash + gallery routes for `/personal` are dropped (not shipped as a visible "0 pieces" empty state). Phase 1's Personal placeholder (`phase-1-skeleton`) MUST be deleted as part of Phase 2 — it was a routing test, not shippable content.
- **D-12:** CRO blurbs upgrade from Phase 1's brief 1–2-line stand-ins to full-length production copy: Context **3–6 lines**, Role **1–3 lines**, Outcome **1–3 lines** (per PIECE-02 spec). Voice target is "practitioner-coded, not dabbler-coded" (per Phase 2 SC2) — concrete numbers, named tools, specific outputs. Filler phrases ("passionate", "multidisciplinary", "intersection of") are explicitly out per PROJECT.md PITFALLS.md guidance.
- **D-13:** Caleb authors blurbs piece-by-piece during Phase 2 with Claude assistance — assets are mostly in hand, blurbs are the work item. Process per piece: Caleb picks a piece + supplies the source asset (PDF or image), Claude drafts a CRO triple from the asset + minimal context, Caleb edits/locks. No bulk pre-drafting.

### About Page & Resume

- **D-14:** **About bio** drafted collaboratively during Phase 2: Claude generates 3–4 voice variants from PROJECT.md (cross-functional analyst+brand pitch) + Caleb's contextual input (specific roles, internships, named outputs); Caleb picks and edits. Final lands at 80–150 words per ABOUT-01. The bio MUST take a stance on the cross-functional pitch — generic "I'm a multidisciplinary student passionate about design and analytics" reads dabbler-coded and undermines the whole brand premise.
- **D-15:** **Resume PDF** supplied by Caleb (he points at his existing CV — typically a LinkedIn export or current PDF). Phase 2 verifies it against the constraints: file size ≤ 1MB (per Phase 2 SC4), EXIF metadata stripped (privacy), filename `caleb-lim-resume.pdf` (canonical, links don't change when he updates it). Single source of truth at `public/caleb-lim-resume.pdf`; both the header (CONTACT-01) and About page (CONTACT-02) link to the same file. If the supplied CV exceeds the size budget, the planner adds a compress/strip step (Ghostscript / `qpdf --linearize --object-streams=generate` / `exiftool`).

### Multi-Page Deck Rendering on Detail Page

- **D-16:** Per PIECE-04, paginated decks render their 3–6 selected pages as a vertical sequence below the hero on the piece detail page. No carousel, no lightbox, no click-to-expand — just `<Image>` components stacked in document order. Mobile-friendly, accessible by default, no JS dependency. Phase 3 may add motion/scroll-driven reveals; Phase 2 ships static.
- **D-17:** "Open full PDF" link (PIECE-06) surfaces only on pieces with the `fullPdf: string` frontmatter field set (Phase 1 D-03 already scaffolded this as `.optional()`). The string points at a path in `public/` — typically `public/source-pdfs/[slug].pdf` (a build-time copy of the colocated source PDF, since Astro doesn't serve content collection assets directly). The pre-build script handles the copy as a side effect of rasterization, gated by the `fullPdf` flag.

### Claude's Discretion

- **PDF library invocation:** continue the verbatim Mozilla pattern from Phase 1's POC (`pdfjs-dist/legacy/build/pdf.mjs` + `pdfDocument.canvasFactory`, no `workerSrc`). The POC validated this works; Phase 2 productionizes the same pattern at scale.
- **Sharp configuration for `<Image>`:** Astro defaults; no custom config unless first-paint budgets fail.
- **Pre-build script invocation:** npm `prebuild` lifecycle hook in `package.json` (runs before `build` automatically). Considered Astro integration (`astro.config.mjs` `astro:build:start` hook) but `prebuild` is simpler and equally idiomatic.
- **EXIF stripping for resume PDF:** exiftool if available; fall back to ghostscript pipeline; fall back to qpdf. Document the chosen path in the SUMMARY for Caleb's future reference.
- **Bio drafting source material:** PROJECT.md core value + REQUIREMENTS.md ABOUT-01 + Caleb's specific work history (he provides during Phase 2). Variants explicitly avoid Phase 2 SC2's banned phrases.
- **CF Pages Linux parity verification (owed by Phase 1):** add a Phase 2 task to verify the rasterizer runs cleanly on a CF Pages preview build. If it crashes on Linux, that's a Phase 2 blocker (not a Phase 3 surprise).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project framing & requirements
- `.planning/PROJECT.md` — overall pitch, constraints, key decisions table
- `.planning/REQUIREMENTS.md` §"Piece Detail" — PIECE-03 (PDF rasterization), PIECE-04 (3–6 representative slides), PIECE-06 (optional Open full PDF link)
- `.planning/REQUIREMENTS.md` §"About & Contact" — ABOUT-01 (80–150-word bio), CONTACT-01 (resume in header, no email gate), CONTACT-02 (resume linked from About)
- `.planning/REQUIREMENTS.md` §"Foundations" — FOUND-05 (asymmetric distribution; partial coverage acceptable per D-10)
- `.planning/REQUIREMENTS.md` §"Out of Scope" — actively-rejected AI-template tells (skill bars, testimonial sliders, centered hero with gradient); applies to bio voice and content authoring style
- `.planning/ROADMAP.md` §"Phase 2: Asset Pipeline + Real Content" — 5 success criteria; SC1 reconciliation in D-02

### Phase 1 carry-forward
- `.planning/phases/01-walking-skeleton/01-CONTEXT.md` §"Implementation Decisions" — D-04 colocated layout, D-03 schema scaffolding, D-12 4-category enum, D-05/D-06 POC scope (replaced by Phase 2 production pipeline)
- `.planning/phases/01-walking-skeleton/01-01-SUMMARY.md` — what's already in `package.json` (pdfjs-dist@5.7.284 + transitive @napi-rs/canvas@0.1.100), schema in `src/content.config.ts`, route patterns
- `.planning/phases/01-walking-skeleton/01-03-SUMMARY.md` — verbatim Mozilla pattern in `scripts/pdf-poc.mjs`; Phase 2's `pdf-preprocess.mjs` extends this same pattern, doesn't rewrite from scratch
- `.planning/phases/01-walking-skeleton/01-VERIFICATION.md` — what Phase 1 passed and what Phase 2 owes (CF Pages Linux parity; see Claude's Discretion above)

### Visual direction (still placeholder for Phase 2; locked for Phase 3)
- `.planning/sketches/MANIFEST.md` §"Locked Design Anchor" — Magazine-maximalist direction. Phase 2 visuals stay placeholder, but bio voice / blurb voice MUST NOT contradict the brand pitch (no "passionate / multidisciplinary / intersection of" — see PROJECT.md PITFALLS)

### Tech stack
- `CLAUDE.md` §"Technology Stack" → "Fallback Path: Code-built (Astro + Motion + GSAP + Lenis)" — version pins (already applied in Phase 1)
- `CLAUDE.md` §"Hosting" — Cloudflare Pages free tier, build environment context

### Project state
- `.planning/STATE.md` §"Accumulated Context" → "Decisions" — Astro stack lock, MVP mode, Phase 1 placeholder content awaiting Phase 2 swap
- `.planning/PROJECT.md` §"Constraints" — content volume 5–15 pieces; non-developer maintenance friction concern (drives D-02's automatic-pre-build approach)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/content.config.ts` — Zod schema with `pdfPaginate`/`fullPdf`/`outcomeTagline` already declared as `.optional()` per Phase 1 D-03. Phase 2 migrates `pdfPaginate` from `boolean` to `array(number)` per D-07. `fullPdf: z.string().optional()` is already correct shape.
- `src/content/categories.ts` — 4-category enum (`design`, `finance`, `personal`, `marketing`) imported by both schema and route generation. Stable; no Phase 2 changes.
- `scripts/pdf-poc.mjs` — verbatim Mozilla pattern for `pdfjs-dist` + canvas. Phase 2 extracts the core rasterization function from here into `pdf-preprocess.mjs`. The POC itself can stay or be deleted (D-05 said "throwaway").
- `src/pages/[category]/[slug].astro` — detail route already renders `<Image src={hero}>` from `astro:assets`. Phase 2 extends this template to render the optional `paginatedPages` sequence below the hero (PIECE-04) and the optional "Open full PDF" link (PIECE-06).
- `package.json` — `pdfjs-dist@5.7.284` already a devDep; `@napi-rs/canvas@0.1.100` arrives transitively. Phase 2 may need to bump these to direct deps if `prebuild` runs in production mode where devDeps are excluded — verify against CF Pages defaults.
- `scripts/verify-build.sh` — Phase 1's smoke verifier. Phase 2 extends it: assert generated thumbs exist, assert resume PDF size budget, assert About page bio length range.

### Established Patterns
- npm `pdf-poc` and `test:smoke` are pre-stubbed in `package.json` (Phase 1 D-???). Adding `pdf-preprocess` as a `prebuild` hook follows the same pattern.
- Hash-based incremental processing — not yet established in this codebase but standard Node + crypto recipe.

### Integration Points
- Cloudflare Pages build environment runs `npm install --production` then `npm run build`. The pre-build hook fires automatically as part of `npm run build`. CF Pages provides Node 22, glibc 2.35, full @napi-rs/canvas binary support (verified by Phase 1 POC + research §A2).
- Public assets in `public/` are served as-is. `public/generated/pdf-thumbs/` outputs become URL-addressable as `/generated/pdf-thumbs/[slug]/cover.webp` etc. — same path the Astro `<Image>` component will resolve at build time.

</code_context>

<specifics>
## Specific Ideas

- The asymmetric piece distribution (FOUND-05) is "in spirit, not in numbers" for Phase 2. Strong showings in Design + Marketing matter more than hitting an exact 7+6 count. A category with one strong piece beats one with three weak pieces — the recruiter's first impression is set by the gallery's strongest, not its weakest, item.
- Phase 1's Personal placeholder (`src/content/pieces/phase-1-skeleton/`) is a routing artifact — it MUST be deleted as part of Phase 2, even if Personal stays empty (in which case the Personal card drops via SPLASH-04).
- `pdfPaginate` page numbers are 1-indexed (matches how humans count pages) — the script translates to pdfjs's 0-indexed internal API. Documented in the schema's `.describe()` so Caleb's IDE shows the hint when editing frontmatter.
- The Mozilla `pdfjs-dist` legacy build + canvasFactory pattern from Phase 1's POC handled a 28MB / 64-page deck cleanly. The pattern scales to any deck Caleb is likely to ship — no per-deck tuning expected.
- "Practitioner-coded" voice for blurbs and bio: name specific tools, cite specific outputs, use specific verbs ("modeled" / "exported" / "shipped" / "validated") — not abstract verbs ("collaborated" / "explored" / "engaged"). This is style enforced at editor-pass, not at lint.

</specifics>

<deferred>
## Deferred Ideas

- **Per-piece secondary images / detail spreads** — FUTURE-04, deferred to v2. Phase 2 ships hero + paginated deck (where applicable) only.
- **Outcome tagline rendered on Finance gallery cards** — CONTENT-01, v2.
- **"Show me everything" curated 6-piece tour link** — CONTENT-02, v2.
- **OG image generation per piece** — FUTURE-03, v2.
- **Calendly embed** — FUTURE-01, only if cold inbound is wanted.
- **Privacy-first analytics** — FUTURE-02, v2.
- **Remaining pieces toward FOUND-05's full target (~18 pieces)** — FUTURE-06, post-launch backfill.
- **Personal Projects content materializing** — FUTURE-05; if it lands during v1, swap in; otherwise the Personal card stays dropped per SPLASH-04.
- **Magazine-maximalist visual system** — Phase 3.
- **Header chrome (mailto / LinkedIn / Resume header link)** — Phase 4 (CONTACT-03/04 land then; Phase 2 only ensures the resume FILE exists at the canonical path).
- **Prev/next within discipline + "Back to [Category]"** — PIECE-05, Phase 4.
- **Mobile/perf/a11y polish + reduced-motion handling** — Phase 5.
- **Production deploy + maintenance handoff** — Phase 6.

</deferred>
