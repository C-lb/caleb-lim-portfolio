---
phase: 03-visual-design-system
plan: 03
subsystem: ui
tags: [gallery, bucket-templates, asymmetric-grid, category-page, ink-canvas, accent-flow, mvp-vertical-slice]

# Dependency graph
requires:
  - phase: 03-visual-design-system
    plan: 01a
    provides: "src/styles/disciplines.ts (DISCIPLINE_ACCENT lookup) — consumed by [category].astro for --accent CSS custom property; src/styles/tokens.css — consumed by all three Gallery components for var(--terracotta|cobalt|acid|plum|teal|paper|ink|sans|serif|mono|fs-*|sp-*)"
  - phase: 03-visual-design-system
    plan: 01b
    provides: "src/layouts/Base.astro with bg='ink' variant — consumed by [category].astro"
  - phase: 01-walking-skeleton
    provides: "src/content/categories.ts (CATEGORIES + Category type), src/content.config.ts (order: number, draft: boolean, hero: image schema) — preserved verbatim"
provides:
  - "src/components/GalleryA12.astro — Bucket A template (1-2 pieces, p1+p2 full-bleed)"
  - "src/components/GalleryB35.astro — Bucket B template (3-5 pieces, sketch's exact 5-tile composition, the house template)"
  - "src/components/GalleryC68.astro — Bucket C template (6-8 pieces, B + extra row p6/p7/p8 with rotation variance + D-06 truncation)"
  - "src/pages/[category].astro — ink-canvas gallery page with --accent flow, getStaticPaths filter for D-07 empty-discipline drop, build-time bucket switch"
affects: [03-04, 03-05, 04-header-chrome]

# Tech tracking
tech-stack:
  added: []  # zero new dependencies — pure-CSS magazine-grade grid + sketch-locked decorations
  patterns:
    - "P5: Per-bucket Astro template component — each .astro encodes one piece-count regime; [category].astro selects at build time via three guarded conditionals"
    - "P6: --accent CSS custom property flow — style={`--accent: ${DISCIPLINE_ACCENT[category]}`} on the section wrapper; descendants reference var(--accent), no hex literals"
    - "P7: Static-paths filter for empty-state drop — getStaticPaths pre-computes populated category set via getCollection, returns only filtered params; empty disciplines fall through to dist/404.html (D-07)"
    - "P8: Guarded conditional rendering pattern — {n <= 2 && <ComponentA />} replaces ternary chains that confuse Astro's template compiler when the JSX branches start with `<`"

key-files:
  created:
    - "src/components/GalleryA12.astro"
    - "src/components/GalleryB35.astro"
    - "src/components/GalleryC68.astro"
    - ".planning/phases/03-visual-design-system/deferred-items.md"
  modified:
    - "src/pages/[category].astro"

key-decisions:
  - "D-02: Category page is ink-black background across all four disciplines; accent flows via --accent on the section wrapper into h2 em (italic Fraunces /{count}) and back-pill hover; tile fills remain sketch-locked palette (not category-tinted)"
  - "D-04: Asymmetric gallery composition driven by three fixed per-piece-count bucket templates, NOT per-piece tileSize frontmatter"
  - "D-05: One template .astro per bucket — GalleryA12 (1-2 pieces, p1+p2 full-bleed) / GalleryB35 (3-5, sketch's verbatim 5-tile) / GalleryC68 (6-8, B + p6/p7/p8 with rotation variance reusing palette + deco)"
  - "D-06: Bucket selection at build time via pieces.length (n <= 2 → A, n <= 5 → B, else → C); pieces.length > 8 → console.warn + .slice(0,8) visual truncation (paranoia path; FOUND-05 caps v1 at ~7)"
  - "D-07: Empty discipline (0 non-draft pieces) does NOT emit dist/<cat>/index.html — getStaticPaths filter pre-computes populated disciplines via getCollection; empty routes fall through to dist/404.html (served by Cloudflare Pages with HTTP 404)"
  - "D-11: Motion contract — tile hover scale(1.02) rotate(-0.3deg) pure CSS only; reduced-motion media query disables both transition + transform per template"

patterns-established:
  - "P5: Per-bucket Astro template component (one .astro per piece-count regime)"
  - "P6: --accent CSS custom property flow from typed DISCIPLINE_ACCENT lookup"
  - "P7: Static-paths filter pattern for empty-state route drop (D-07 mechanism)"
  - "P8: Guarded conditional rendering replaces nested ternary when JSX branches begin with `<`"

requirements-completed: [SPLASH-03, SPLASH-04, VISUAL-01, VISUAL-02, VISUAL-03]

# Metrics
duration: 7min
completed: 2026-05-14
---

# Phase 3 Plan 03: Gallery Vertical Slice Summary

**Three bucket gallery templates (A12 / B35 / C68) plus a rebuilt ink-canvas `[category].astro` with --accent flow + build-time bucket switch + D-07 empty-discipline drop — every populated discipline now renders the sketch's exact magazine-grade asymmetric composition; empty disciplines correctly fall through to (forthcoming) 404.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-14T17:33Z (approx)
- **Completed:** 2026-05-14T17:37Z (approx)
- **Tasks:** 3 / 3
- **Files modified:** 5 (4 created — 3 gallery components + 1 deferred-items doc, 1 modified — [category].astro)

## Accomplishments

- **Three gallery bucket templates** wired to sketch fidelity:
  - **GalleryB35.astro** (the house): sketch lines 573-612 verbatim. p1 3x2 hero (terracotta, -0.6deg, 240px sans outline numeral deco), p2 3x1 wide (cobalt, italic Fraunces 90px lime numeral), p3 acid (0.5deg, ink outline circle), p4 plum (rotated terracotta square), p5 teal (-0.4deg, diagonal acid stripes). Renders only N tiles where N = pieces.length.
  - **GalleryA12.astro** (1-2 pieces): subset of B with p1 + p2 widened to `grid-column: span 6` (full-bleed) — used for design + marketing today (each has 1 non-draft piece).
  - **GalleryC68.astro** (6-8 pieces): B's CSS verbatim plus p6/p7/p8 cycling palette + deco patterns by 1 with rotation variance (0.4deg / -0.3deg / 0.7deg vs B's row 1) — paranoia path with `console.warn` + `.slice(0,8)` truncation for `pieces.length > 8`.
- **`src/pages/[category].astro` rebuilt** end-to-end:
  - `getStaticPaths` pre-computes populated category set via `getCollection` filter, returns only `CATEGORIES.filter((c) => populated.has(c))` params → **finance + personal correctly absent from `dist/` (D-07 satisfied without runtime redirect)**
  - Wraps in `<Base bg="ink">` (D-02 ink canvas)
  - Sets `style={`--accent: ${DISCIPLINE_ACCENT[category]}`}` on the `.b-category` section; descendants consume `var(--accent)` (h2 em italic Fraunces numeral, back-pill hover bg)
  - Build-time bucket switch via three guarded conditionals: `{n <= 2 && <GalleryA12 />}`, `{n >= 3 && n <= 5 && <GalleryB35 />}`, `{n >= 6 && <GalleryC68 />}` — mutually exclusive (D-06)
  - Preserves Phase 1 D-01 filter+sort idiom verbatim: `(await getCollection('pieces', ({ data }) => data.category === category && data.draft !== true)).sort((a, b) => a.data.order - b.data.order)`
  - Category labels per UI-SPEC Copywriting Contract: `GRAPHIC / DESIGN`, `FINANCIAL / MODELS`, `PERSONAL / PROJECTS`, `MARKETING`
  - Title format `<LABEL> <em>/{countStr}</em>` with `<em>` styled as italic Fraunces in `var(--accent)`
- **Build green:** `npm run build` exits 0 (6 pages built — splash + about + 2 piece details + 2 category galleries, design + marketing only)
- **Anti-AI-tells green:** `scripts/verify-anti-ai-tells.sh` exits 0
- **D-07 confirmed:** `dist/design/index.html` and `dist/marketing/index.html` exist; `dist/finance/` and `dist/personal/` do NOT (verified `ls`)
- **Accent flow confirmed:** `grep -oE 'style="--accent: [^"]*"' dist/design/index.html` returns `#e85d2a` (terracotta — D-01 design accent); marketing returns `#5a1a55` (plum)
- **Zero hard-coded hexes** in any of the three gallery components or `[category].astro` (grep `#e85d2a|#1947ff|#d4ff3a|#5a1a55` returns 0 matches in each file) — DISCIPLINE_ACCENT lookup + `var(--*)` token references are the only color sources
- **Reduced-motion (D-13)** disables tile hover transform + transition in each gallery component and the back-pill transition in `[category].astro`

## Task Commits

Each task committed atomically:

1. **Task 1: Create three gallery bucket templates** — `ede7a6b` (feat)
2. **Task 2: Rebuild [category].astro** — `90ae7cb` (feat)
3. **Task 2 hotfix: Replace nested ternary with guarded conditionals** — `41aee42` (fix, Rule 1 deviation)
4. **Task 3: Log verify-build.sh script contradiction as deferred** — `95823b4` (docs)

**Plan metadata commit:** pending (next — this SUMMARY.md)

## Files Created/Modified

- `src/components/GalleryA12.astro` (CREATED) — Bucket A template (1-2 pieces); p1+p2 widened to span 6
- `src/components/GalleryB35.astro` (CREATED) — Bucket B template (3-5 pieces); the house template, sketch lines 573-612 verbatim
- `src/components/GalleryC68.astro` (CREATED) — Bucket C template (6-8 pieces); B + p6/p7/p8 with rotation variance; D-06 truncation
- `src/pages/[category].astro` (REWRITTEN) — Phase 1 skeleton replaced; D-02 ink canvas + D-04/05/06 bucket switch + D-07 empty-drop via getStaticPaths filter
- `.planning/phases/03-visual-design-system/deferred-items.md` (CREATED) — logs scripts/verify-build.sh Gate 3/4 vs Gate 16 contradiction for follow-up

## Decisions Made

No new decisions — every value (grid-template-columns, gap, padding, transform rotations, deco geometry, color tokens) was extracted verbatim from sketch 001 lines 533-612 + 573-612 and from the plan's pinned `read_first` sources. CSS-tokens-only colors, --accent flow pattern, getStaticPaths filter, and guarded conditionals are direct implementations of D-02 / D-04 / D-05 / D-06 / D-07 / D-11 + PATTERNS.md S1 / S3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Astro compiler tripped on nested ternary with JSX branches**

- **Found during:** Task 2 (first `npm run build` after writing `[category].astro`)
- **Issue:** Plan's exact template pattern `{n <= 2 ? <GalleryA12 .../> : n <= 5 ? <GalleryB35 .../> : <GalleryC68 .../>}` caused Astro to emit `[CompilerError] [astro:build] Unable to assign attributes when using <> Fragment shorthand syntax!` at line 50:11. Astro's template tokenizer collided the `<=` sequence with the JSX-like fragment shorthand parser when the ternary's truthy branch begins with `<GalleryB35`.
- **Fix:** Restructured the bucket switch into three mutually exclusive guarded conditionals (`{n <= 2 && <GalleryA12 .../>}`, `{n >= 3 && n <= 5 && <GalleryB35 .../>}`, `{n >= 6 && <GalleryC68 .../>}`). Same build-time mutual exclusion (D-06), no compiler ambiguity.
- **Files modified:** `src/pages/[category].astro` (lines 48-50)
- **Verification:** `npm run build` exits 0 first try after the fix; output shows `dist/design/index.html` (Bucket A, n=1) and `dist/marketing/index.html` (Bucket A, n=1) rendering `b-piece p1` correctly.
- **Committed in:** `41aee42` (fix)

### Deferred (Out-of-Scope)

**2. [Out-of-scope] verify-build.sh Gate 3 + Gate 4 contradict Gate 16 (D-07 contract)**

- **Found during:** Task 3 (running `bash scripts/verify-build.sh`)
- **Issue:** Pre-existing script bug — Gate 3 (line 30-37) unconditionally requires `dist/<cat>/index.html` for all four disciplines; Gate 4 (line 47-54) runs `find dist/<cat>` without `2>/dev/null`. With D-07 dropping the route emission for finance + personal, both Gates trip — Gate 3 with two `FAIL: dist/<cat>/index.html missing` lines, Gate 4 aborting the script via `set -euo pipefail` when `find` errors on the missing dir. Script exits 1 before reaching Gates 5-18.
- **Why NOT fixed:** `scripts/verify-build.sh` is not in Plan 03-03's `files_modified` declaration. Plan 03-03 is running in parallel with sibling plans 03-02 (splash) and 03-04 (detail + about); modifying scripts/ from a non-owning worktree risks merge conflicts.
- **Logged:** `.planning/phases/03-visual-design-system/deferred-items.md` with recommended fix (either harmonize Gates 3/4 with Gate 16 to be D-07-aware, or delete Gates 3/4 since Gate 16 supersedes them with the correct logic).
- **Manual verification compensating for the script abort:**
  - `npm run build` exits 0
  - `dist/design/index.html` exists; `dist/marketing/index.html` exists
  - `dist/finance/` and `dist/personal/` do NOT exist (D-07 satisfied)
  - `dist/design/index.html` contains `style="--accent: #e85d2a"` (D-01 design accent flowing correctly)
  - `dist/marketing/index.html` contains `style="--accent: #5a1a55"` (D-01 marketing accent)
  - `dist/design/index.html` contains `<h2 ...>GRAPHIC / DESIGN <em ...>/01</em>` (italic Fraunces numeral in --accent — D-02)
  - `dist/marketing/index.html` contains `<h2 ...>MARKETING <em ...>/01</em>`
  - Both galleries render `class="b-piece p1"` (Bucket A selected for n=1 — D-04/05/06)
  - Both galleries render `class="bg-ink"` on body (D-02 ink canvas via Base.astro bg='ink' variant)
  - `scripts/verify-anti-ai-tells.sh` exits 0

---

**Total deviations:** 1 auto-fixed (Rule 1 — Astro template parser) + 1 deferred (script-internal contradiction, out-of-scope)
**Impact on plan:** Zero scope change. The auto-fix preserves D-06's build-time bucket selection contract; the deferred item is a pre-existing script bug that becomes visible only after D-07 lands, surfaced for the next maintenance pass on `scripts/verify-build.sh`.

## Issues Encountered

None blocking. The Astro nested-ternary compile error was the only issue, resolved in a single Edit + commit.

## User Setup Required

None — pure SSG implementation. No env vars, no external services, no auth.

## Next Phase Readiness

**Ready for parallel sibling 03-04 (detail + about re-skin) and forthcoming Plan 03-05 (404 + ANTI-AI-CHECKLIST).**

- Sibling 03-02 (splash slice): unaffected — its files (`src/components/DisciplineCard.astro`, `src/pages/index.astro`) are disjoint from this plan's scope. Splash's Gate 18 (populated-card count == populated-route count) will be checkable once both plans merge.
- Sibling 03-04 (detail + about): unaffected — `src/pages/[category]/[slug].astro` is detail-page territory; `src/pages/about.astro` is its own surface. Both consume the same `DISCIPLINE_ACCENT` + `tokens.css` already shipped by Plan 03-01a.
- Plan 03-05 (404 + verification gate): when it ships, `dist/404.html` will pick up unknown routes including any visit to `/finance` or `/personal`. The empty-discipline drop established here is the upstream contract Plan 03-05's 404 page closes.
- **Carry-over for future maintenance plan:** verify-build.sh Gate 3 + Gate 4 need harmonization with Gate 16 (see `deferred-items.md`).

## Known Stubs

None. Every value in every file is sketch-extracted or token-resolved. No "TODO", "FIXME", "coming soon", "placeholder", `=[]`, `={}`, or empty-array data sources in any of the four files this plan touched.

## Self-Check: PASSED

**Created files exist:**
- FOUND: `src/components/GalleryA12.astro`
- FOUND: `src/components/GalleryB35.astro`
- FOUND: `src/components/GalleryC68.astro`
- FOUND: `src/pages/[category].astro` (modified)
- FOUND: `.planning/phases/03-visual-design-system/deferred-items.md`

**Commits exist:**
- FOUND: `ede7a6b` (Task 1 — three gallery bucket templates)
- FOUND: `90ae7cb` (Task 2 — rebuild [category].astro)
- FOUND: `41aee42` (Task 2 hotfix — Astro ternary fix)
- FOUND: `95823b4` (Task 3 — deferred-items log)

**must_haves.truths satisfied (all 9):**
- T1 (ink-black bg + accent flow via --accent on h2 em + back-pill): PASS — `dist/<cat>/index.html` contains `class="bg-ink"` + `style="--accent: <hex>"` + `<em ...>/{count}</em>`
- T2 (gallery template chosen at build time by pieces.length): PASS — guarded conditionals in `[category].astro`
- T3 (GalleryB35 sketch's exact 5-tile composition): PASS — verbatim CSS extraction from sketch lines 597-612
- T4 (each tile sketch-locked rotation + decorative geometry): PASS — p1 -0.6deg + 240px sans outline numeral, p2 cobalt + 90px italic Fraunces lime numeral, p3 outline circle, p4 rotated terracotta square, p5 diagonal acid stripes — all four deco patterns + three rotations verified by grep against sketch source
- T5 (hover scale(1.02) rotate(-0.3deg); reduced-motion disables): PASS — `grep -q "transform: scale(1.02) rotate(-0.3deg)"` matches in all three components + `@media (prefers-reduced-motion: reduce)` block disables transform + transition
- T6 (empty discipline 0 pieces does NOT emit dist/<cat>/index.html): PASS — `ls dist/finance dist/personal` → No such file or directory
- T7 (tile click navigates to /<category>/<slug>): PASS — `<a href={`/${category}/${piece.id}`}` in each Gallery component
- T8 (category title <LABEL> /<count> with slash + numeral italic Fraunces in --accent): PASS — `<h2>{label} <em>/{countStr}</em></h2>` + scoped CSS `.b-category h2 em { font-family: var(--serif); font-style: italic; color: var(--accent); }`
- T9 (decisions D-02 / D-04 / D-05 / D-06 / D-07 / D-11 implemented): PASS — see Decisions Made section

**must_haves.key_links satisfied:**
- `src/pages/[category].astro` imports `Base` from `'../layouts/Base.astro'` with `<Base ... bg="ink">` — grep matches `<Base.*bg="ink"`
- `src/pages/[category].astro` reads `DISCIPLINE_ACCENT[category]` — grep matches `DISCIPLINE_ACCENT\[category\]`
- `src/pages/[category].astro` selects between `GalleryA12 | GalleryB35 | GalleryC68` via guarded conditional (`n <= 2 && <GalleryA12` substring present)

---
*Phase: 03-visual-design-system*
*Completed: 2026-05-14*
