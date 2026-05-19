---
phase: 5
plan: 04
subsystem: gallery-and-lcp
tags: [gallery, lcp, performance, ui-fix]
requires: [05-01]
provides:
  - "BLOCKER-2 closed (gallery hero promoted from opacity-0.55 watermark to 60% grid cell)"
  - "SC5 (populated galleries render hero images) — closed"
  - "Half of SC2 (priority/sizes pre-load hints on splash, design, marketing, detail LCP candidates)"
affects:
  - "src/components/Gallery* — internal tile composition (outer bucket grids preserved)"
  - "src/pages/index.astro — splash portrait carousel first slide gains priority"
  - "src/pages/[category]/[slug].astro — detail hero gains priority"
tech-stack:
  added: []
  patterns:
    - "Astro <Image priority/> emits fetchpriority=\"high\" + loading=\"eager\""
    - "CSS grid 60/40 with --accent-bg per-slot fed into .meta column"
key-files:
  created: []
  modified:
    - "src/components/GalleryA12.astro"
    - "src/components/GalleryB35.astro"
    - "src/components/GalleryC68.astro"
    - "src/pages/index.astro"
    - "src/pages/[category]/[slug].astro"
decisions:
  - "BLOCKER-2 was a CSS bug (opacity: 0.55), not a wiring bug — RESEARCH §1 finding #1 confirmed pre-execution. No `<Image>` wire-up was needed; only promotion."
  - "Per-slot accent (terracotta/cobalt/acid/plum/teal) moved from .b-piece background to --accent-bg consumed by .meta column. Rotate transforms stay on .b-piece."
  - "Removed per-component reduced-motion hover-disable blocks in all three Gallery* files. Plan 05-06 inherits this — surface in 05-06's prompt so it doesn't duplicate the deletion."
metrics:
  duration: ~12min
  completed: 2026-05-19
---

# Phase 5 Plan 05-04: Gallery Tile Recomposition + LCP Priority/Sizes Summary

Promoted the gallery hero `<Image>` from a 0.55-opacity watermark behind the
text fill to a full-opacity grid cell occupying the left 60% of each tile. Same
internal composition applied to all three Gallery components (A12, B35, C68);
outer bucket grid spans preserved. Added `priority` + `sizes` to the three
LCP-candidate images (splash carousel slide 0, gallery p1 tile via the
`slot === 1` condition, detail-page hero) so the browser pre-fetches them with
`fetchpriority="high"` instead of waiting for the layout pass.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite GalleryA12.astro tile composition + drop .deco | 145fabe | src/components/GalleryA12.astro |
| 2 | Mirror the rewrite into GalleryB35.astro + GalleryC68.astro | 4786892 | src/components/GalleryB35.astro, src/components/GalleryC68.astro |
| 3 | Add priority/sizes to splash carousel + detail hero | 131b41c | src/pages/index.astro, src/pages/[category]/[slug].astro |

## Decisions Made

- **BLOCKER-2 root cause**: misdiagnosed by Phase 4 UI-REVIEW as "hero not
  wired." Actually the hero `<Image>` had been wired all along (RESEARCH §1
  finding #1) — the bug was `.b-piece .cover { opacity: 0.55 }` plus a colored
  `.b-piece` background that tiled over it. Promotion to a 60% grid cell at
  opacity 1 fixes it without any new wiring.
- **Per-slot accent placement**: moved from `.b-piece` background to a
  `--accent-bg` custom property consumed by `.meta`. This lets the right-40%
  text column carry the discipline color rhythm while the hero owns the left 60%.
  The rotate transforms (`-0.6deg` on p1, etc.) stay on `.b-piece` so the
  tile-skew character of the magazine maximalist look survives.
- **Reduced-motion**: the three per-component
  `@media (prefers-reduced-motion: reduce) .b-piece:hover { transform: none }`
  blocks were removed here instead of in Plan 05-06. D-08 makes hover-feedback
  exempt from the global reduced-motion clamp; the per-component hammer
  conflicts. Plan 05-06 should NOT redo this deletion — note added to 05-04's
  decisions for Plan 05-06's executor to read.

## Deviations from Plan

None — plan executed exactly as written. The `.deco` deletion incidentally
killed 4 raw `font-size: Npx` literals (Gate 25 count dropped from 21 → 17),
which the plan flagged as an expected partial Gate 25 contribution. Plan 05-05
will sweep the remaining 17.

## Verification

`npm run build && bash scripts/verify-build.sh`:

- Gates 1–22: all GREEN (no regression).
- Gate 23: GREEN (Plan 05-03 — topbar collapse).
- **Gate 24**: GREEN — `design` gallery emits 1 `<img>` for 1 piece;
  `marketing` gallery emits 1 `<img>` for 1 piece. (Pre-promotion the gate was
  already green incidentally — the `<img>` element existed even when
  watermarked. The *visual* fix is independent of Gate 24's check.)
- Gate 25: RED (17 literals remaining) — by design, Plan 05-05 closes this.

Specific Task 3 checks:

```
dist/index.html                                  → 1× fetchpriority="high"  (splash)
dist/design/design-real-piece/index.html         → 1× fetchpriority="high"  (detail hero)
dist/marketing/<slug>/index.html (when populated) → 1× fetchpriority="high" (detail hero)
```

Gallery tile fetchpriority="high":

```
dist/design/index.html                            → 1× fetchpriority="high"  (p1 tile)
dist/marketing/index.html                         → 1× fetchpriority="high"  (p1 tile)
```

`grep -rF 'class="deco"' src/components/Gallery*` returns nothing — all three
gallery components are `.deco`-free. (DisciplineCard.astro still uses `.deco`;
that's a different component and out of scope.)

## LCP measurement

Deferred to Plan 05-08 (phase-exit Lighthouse audit). Vercel preview pipeline
is Plan 05-02 territory; cannot measure synthetic LCP from a local-only build
without a real network harness. Pre-load hints are in place.

## Threat Flags

None — this plan only modifies image render attributes (`priority`, `sizes`)
and CSS layout. No new network endpoints, auth paths, file access patterns, or
schema changes introduced.

## Self-Check: PASSED

Files exist:
- src/components/GalleryA12.astro — FOUND
- src/components/GalleryB35.astro — FOUND
- src/components/GalleryC68.astro — FOUND
- src/pages/index.astro — FOUND
- src/pages/[category]/[slug].astro — FOUND

Commits exist:
- 145fabe — FOUND
- 4786892 — FOUND
- 131b41c — FOUND

## Forward signals (for the next plans in this phase)

- **Plan 05-05** (token sweep): Gate 25 count is 17 going in (was 21 pre-04).
  The `.deco` deletion already removed 4 of the originally-listed 240px / 90px
  literals.
- **Plan 05-06** (global reduced-motion): the three per-component
  `@media (prefers-reduced-motion)` hover-disable blocks in Gallery* have
  already been removed by this plan. Do not duplicate the deletion.
- **Plan 05-07** (hover gating): the `.b-piece:hover` transform rule still
  exists in all three Gallery* files. 05-07 will wrap it in
  `@media (hover: hover) and (pointer: fine)`.
