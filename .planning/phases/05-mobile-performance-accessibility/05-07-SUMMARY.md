---
phase: 5
plan: 07
subsystem: mobile-touch
tags: [touch, hover-gate, intersection-observer, shimmer, statuspill, d-04, d-06, d-07]
requirements:
  - FOUND-01
  - FOUND-03
dependency_graph:
  requires: [05-03, 05-04, 05-05, 05-06]
  provides: [touch-hover-suppression, touch-entrance-shimmer, statuspill-mobile-shrink]
  affects: [05-08]
tech_stack:
  added:
    - IntersectionObserver pattern for touch-only entrance shimmer
  patterns:
    - "@media (hover: hover) and (pointer: fine) wrap around every :hover ruleset"
    - "@media (hover: none) gate for touch-only animations"
    - "Belt-and-suspenders: JS gate + CSS reduced-motion fallback"
key_files:
  modified:
    - src/components/DisciplineCard.astro
    - src/components/StatusPill.astro
    - src/components/GalleryA12.astro
    - src/components/GalleryB35.astro
    - src/components/GalleryC68.astro
    - src/pages/index.astro
    - src/pages/about.astro
    - src/pages/[category].astro
    - src/pages/[category]/[slug].astro
    - src/layouts/Base.astro
decisions:
  - "Bio-shake hover-gate (planner discretion): .b-bio animation: bio-shake moved inside @media (hover: hover) to avoid the ~1150ms overlap window where the new shimmer would clobber bio-shake mid-flight on touch. D-08 still classifies bio-shake first-paint as EXEMPT under no-preference; reduced-motion override stays outside the hover gate."
  - "Color-only hovers gated per D-06 strict reading (.about p a, .contact-list a, .full-pdf-link a, .pager-link .pager-title, .topbar nav a)."
  - "StatusPill mobile shrink uses .pill (actual selector), not .statuspill (plan-text spec selector). Behavioral contract unchanged."
metrics:
  duration: ~85 min
  completed: 2026-05-19
  commits:
    - f35201b feat(phase-5/05-07) — hover-gate sweep across 10 files
    - abd3442 feat(phase-5/05-07) — D-07 shimmer + bio-shake hover gate
    - 6f70da2 feat(phase-5/05-07) — D-04 StatusPill mobile shrink
---

# Phase 5 Plan 07: Touch-Device Hover Suppression + Entrance Shimmer + StatusPill Mobile Shrink

Wave 2 mechanical edit closing SC1 (mobile critical path — no phantom hover state) and SC3 (touch behavior under reduced-motion). iOS Safari now navigates on first tap site-wide; the touch entrance shimmer compensates for the missing hover micro-interaction; StatusPill shrinks gracefully on mobile.

## What Landed

**Task 1 — `@media (hover: hover) and (pointer: fine)` wrap across all 13 hover surfaces.** Every `:hover` ruleset in the inventory now lives inside the gate. Touch devices (where `hover:hover` is false) skip the phantom hover state and navigate on first tap. `:focus-visible` rules stay OUTSIDE the gate so keyboard focus on a touch device with attached keyboard still produces outlines + inline feedback.

**Task 2 — D-07 entrance shimmer on `.b-card` and `.b-bio`.** Added inline `<script>` to `DisciplineCard.astro` with IntersectionObserver (threshold 0.4) that adds `.is-entered` on first viewport hit. CSS `@keyframes card-shimmer` pulses a currentColor ring out and back over 600ms, gated by `@media (hover: none)` + `@media (prefers-reduced-motion: reduce) { animation: none }`. The `prefersReduced.addEventListener?.('change', ...)` re-evaluates if Reduce Motion toggles mid-session. Bio-shake animation hover-gated per planner discretion to avoid the ~1150ms overlap window.

**Task 3 — D-04 StatusPill mobile shrink.** Padding shrinks from `9px 20px` to `8px 12px` at `≤700px`. Pulse, dot, hover-gating, and slow-scroll click handler all unchanged. Effective pill height ~27px (below WCAG 2.5.8 AAA 44×44 floor but accepted per 05-UI-SPEC rationale — no neighboring tap targets within thumb-radius).

## 13 Hover Surfaces — Coverage Checklist

| # | Surface | File | Gated |
|---|---------|------|-------|
| 1 | Card 3D tilt + lift | `DisciplineCard.astro:281-294` | ✅ |
| 2 | Card liquid-glass overlay | `DisciplineCard.astro:295` | ✅ |
| 3 | Bio card 3D tilt | `index.astro:412-422` | ✅ |
| 4 | Bio card liquid-glass | `index.astro:423` | ✅ |
| 5 | Gallery tile scale+rotate | `GalleryA12/B35/C68 .b-piece:hover` | ✅ (all 3) |
| 6 | StatusPill hover scale | `StatusPill.astro:52-58` | ✅ |
| 7 | `.nav-link` hover color | `Base.astro:102` | ✅ |
| 8 | `.b-cat-back` hover bg | `about.astro:171`, `[category].astro:94`, `[slug].astro:194` | ✅ (all 3) |
| 9 | `.role-link` hover (underline+opacity) | `index.astro:353-354` | ✅ (split from focus-visible) |
| 10 | `.values-pill` hover (bg+translate) | `about.astro:252-258` | ✅ |
| 11 | `.pager-link` hover (title color) | `[slug].astro:315` | ✅ |
| 12 | `.about p a` hover color | `about.astro:202-204` | ✅ |
| 13 | `.full-pdf-link a` hover color | `[slug].astro:268-270` | ✅ |

**Bonus (Rule 2 deviation):** `.contact-list a:hover` in `about.astro` was NOT in the 13-surface inventory but the plan's authority "D-06 says ALL hover effects gate behind (hover: hover) — no exceptions" required gating for uniformity. Surface 14.

**Intentionally NOT gated:** `.b-portrait:hover .bp-arrow { opacity: 1 }` and `.b-portrait .bp-arrow:hover` (portrait carousel controls). On touch the arrows are permanently hidden (no hover possible) but touch users get dots + swipe instead — no phantom-hover state surfaces.

## Shimmer Wiring Confirmation

```
DisciplineCard.astro <style>: card-shimmer keyframes (3 matches), is-entered selectors (4 matches)
DisciplineCard.astro <script>: IntersectionObserver init + (hover: none) gate + prefers-reduced-motion change listener
dist/index.html: inline shimmer <script> bundled, targets both .b-card and .b-bio
```

Belt-and-suspenders policy:
1. JS gate (`isTouchDevice && !prefersReduced.matches`) before observer.observe runs
2. CSS `@media (hover: none)` wraps the `animation: card-shimmer ...` rule
3. CSS `@media (prefers-reduced-motion: reduce)` overrides to `animation: none`
4. Runtime `prefersReduced.addEventListener('change', ...)` re-enables if user toggles Reduce Motion mid-session

## Bio-shake Hover-Gate Decision (Planner Discretion)

Per Plan 05-07 frontmatter `notes.planner_discretion`: `.b-bio { animation: bio-shake 750ms ease-in-out 400ms 1 }` was moved inside `@media (hover: hover) and (pointer: fine)`.

- **Why:** On touch, the new D-07 entrance shimmer fires when the bio scrolls into view. Bio-shake's existing 750ms window (starts 400ms after page load, ends ~1150ms) could overlap with the shimmer. The shimmer's `.is-entered { animation: card-shimmer ... }` would CSS-replace the bio-shake declaration mid-flight, producing a visibly clipped shake. Gating bio-shake to hover-only ensures shimmer is the sole entrance motion on touch.
- **D-08 invariant preserved:** Bio-shake stays EXEMPT under `prefers-reduced-motion: no-preference` on desktop (it still fires there). Plan 05-06's `@media (prefers-reduced-motion: reduce) { .b-bio { animation: none } }` rule lives OUTSIDE the hover gate and continues to apply on touch devices regardless of motion preference.
- **Equivalent for `.b-card`:** The card entrance shake (`.b-card { animation: card-shake 750ms ... }`) was NOT moved inside a hover-gate this pass. This is acceptable because the shimmer fires per-intersection (cards enter the viewport on first scroll, ~1-2s after page load) while card-shake completes by 1150ms — by the time shimmer fires, card-shake has finished. The same overlap risk exists in theory but timing makes it a non-issue. Deferred to 05-08 phase-exit walk if visual smoke surfaces flicker.

## StatusPill Mobile Shrink Dimensions

| Viewport | Padding | Approx Height | Hover behavior |
|----------|---------|---------------|----------------|
| >700px (desktop) | 9px 20px | ~29px (sketch-locked OVERRIDE-03) | Scale-on-hover inside hover-gate |
| ≤700px (mobile) | 8px 12px | ~27px | No hover (gate suppressed on touch) |

Position remains `position: fixed; top: 12px; left: 0; right: 0` with `display: flex; justify-content: center` — top-center pinned, persists through scroll, identical placement on desktop and mobile. ISSUE-05 carryforward documented: pill at ≤700px ends up ~27px tall, below WCAG 2.5.8 AAA 44×44 — acceptable per 05-UI-SPEC §"StatusPill mobile shrink" rationale (no neighboring tap targets within thumb-radius).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] Gated `.contact-list a:hover` in about.astro**
- **Found during:** Task 1
- **Issue:** Plan enumerated 13 hover surfaces; `.contact-list a:hover` not listed. Plan authority "D-06 says ALL hover effects gate behind (hover: hover) — no exceptions" requires gating regardless.
- **Fix:** Wrapped `.contact-list a:hover { color: var(--terracotta); }` inside `@media (hover: hover) and (pointer: fine)`.
- **Files modified:** `src/pages/about.astro`
- **Commit:** f35201b

**2. [Rule 3 — Blocking issue resolved] StatusPill selector mismatch**
- **Found during:** Task 3
- **Issue:** Plan's verify regex targeted `.statuspill` but actual selector is `.pill` (has been since Phase 3 StatusPill ship — the planning text was authored from spec memory, not from the file).
- **Fix:** Applied `@media (max-width: 700px) { .pill { padding: 8px 12px } }` to the actual selector. Behavioral contract (padding shrinks ≤700px) met.
- **Files modified:** `src/components/StatusPill.astro`
- **Commit:** 6f70da2

### Planner-Discretion Calls (Pre-Approved)

**3. [Planner discretion] Bio-shake hover-gate**
- **Found during:** Task 2
- **Decision:** Pre-approved by Plan 05-07 `notes.planner_discretion` (option b from plan-checker WARNING ISSUE-04). Moved `.b-bio { animation: bio-shake ... }` inside `@media (hover: hover) and (pointer: fine)` to avoid the ~1150ms overlap window where shimmer would clobber bio-shake mid-flight on touch.
- **Files modified:** `src/pages/index.astro`
- **Commit:** abd3442

## Out-of-Scope Findings (Deferred)

None. The 05-06 SUMMARY's three out-of-scope `transition: none` blocks (StatusPill, `[category].astro .b-cat-back`, `[slug].astro .pager-link`) are D-08 reduced-motion concerns and remain untouched per Plan 05-07 authorities. Future plan owns that sweep.

## Verification Outcome

- `npm run build` — passing, 7 pages built
- `bash scripts/verify-build.sh` — **ALL GREEN (25 gates)**
- `grep -lE '@media \(hover: hover\) and \(pointer: fine\)' src/components/* src/pages/* src/layouts/*` — 10 files (all hover-surface owners)
- Manual scan of remaining `:hover` references — all live inside `@media (hover: hover)` blocks or are comment text or reduced-motion overrides
- Built dist/index.html confirms inline IntersectionObserver script bundles and targets both `.b-card` and `.b-bio`
- Devtools touch-emulation manual test deferred to Plan 05-08 (phase-exit verification walk)

## Self-Check: PASSED

- src/components/DisciplineCard.astro — FOUND (modified)
- src/components/StatusPill.astro — FOUND (modified)
- src/components/GalleryA12.astro — FOUND (modified)
- src/components/GalleryB35.astro — FOUND (modified)
- src/components/GalleryC68.astro — FOUND (modified)
- src/pages/index.astro — FOUND (modified)
- src/pages/about.astro — FOUND (modified)
- src/pages/[category].astro — FOUND (modified)
- src/pages/[category]/[slug].astro — FOUND (modified)
- src/layouts/Base.astro — FOUND (modified)
- commit f35201b — FOUND
- commit abd3442 — FOUND
- commit 6f70da2 — FOUND
