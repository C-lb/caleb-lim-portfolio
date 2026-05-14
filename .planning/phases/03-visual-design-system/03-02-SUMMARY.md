---
phase: 03-visual-design-system
plan: 02
subsystem: ui
tags: [splash, hero-band, discipline-card, portrait, magazine-maximalist, astro-image, drop-card, scoped-css]

# Dependency graph
requires:
  - phase: 03-01a
    provides: "tokens.css + Fontsource imports + DISCIPLINE_ACCENT/DISCIPLINE_K maps"
  - phase: 03-01b
    provides: "Base.astro layout (paper/ink bg prop), StatusPill, verify-anti-ai-tells.sh"
provides:
  - "DisciplineCard.astro — reusable component for splash + 404 (k1-k4 decorative variants)"
  - "Splash hero band with portrait + name + roles + bio sticker + question bar + 4-card row"
  - "Empty-discipline drop-card logic (SPLASH-04 / D-07): splash counts non-draft pieces per category and filters out empty ones; grid template adapts to N-card count"
  - "Adaptive grid-template-columns for N=1/2/3/4 cards"
  - "Mobile collapse @ ≤900px (sketch lines 615-626)"
affects: [03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: [] # no new deps — uses Astro <Image>, existing tokens, existing Base
  patterns:
    - "Build-time content count → drop-card filter (no runtime branching)"
    - "Inline style binding for length-keyed grid template (static-mapped, no user input)"
    - "Scoped <style> per .astro file with :global() escape for child <img>"
    - "Sketch-locked raw padding values via UI-SPEC OVERRIDE-03 (14/16px, 22/24/64px, 22/28px)"
    - "k-keyed component variants (k1-k4) — color binding owned by component CSS, never re-hexed at call sites"

key-files:
  created:
    - "src/components/DisciplineCard.astro"
    - ".planning/phases/03-visual-design-system/deferred-items.md"
  modified:
    - "src/pages/index.astro"

key-decisions:
  - "D-03 wired: k1=outline circle, k2=italic-Fraunces-lime-numeral, k3=horizontal-dotted-line, k4=lime-triangle"
  - "D-07 wired via populatedCategories filter (countByCategory[c] > 0); splash currently renders 2 cards (design + marketing) because finance + personal are all draft-only"
  - "D-09 bio teaser hand-tuned to 38 words, voice-contract compliant (no 'passionate', 'multidisciplinary', 'intersection of', no exclamation points)"
  - "D-10 roles list — analyst, brand strategist, designer, marketer — odd/even alternation: cobalt sans 500 vs italic terracotta serif 400"
  - "D-11 motion: pure CSS hover translateY(-2px) rotate(-0.3deg); no JS animation library on splash"
  - "DISCIPLINE_ACCENT imported but suppressed via void — keeps contract co-located even though card CSS owns the k→color binding (audit trail for future maintainers)"
  - "Sketch rotations preserved under reduced-motion (UI-SPEC line 522 explicit carve-out): only hover-lift collapses, not the static -1.2°/-1°/+1°/-0.5°/+0.7°/-2°/+4° layout rotations"

patterns-established:
  - "Discipline component reuse: DisciplineCard.astro is the single source of truth for splash + 404; consumed twice but written once"
  - "Drop-card by content count: any page rendering disciplines should filter populated via getCollection('pieces', no-draft) → countByCategory > 0 → filter — repeatable for 404, gallery filters, etc."
  - "Build-time `style={\`grid-template-columns: ${gridTemplate}\`}` for adaptive grid where the template is keyed by a static map of integer length → string — no user input, no XSS surface (covered by T-03-08)"

requirements-completed:
  - SPLASH-01
  - SPLASH-02
  - VISUAL-01
  - VISUAL-02
  - VISUAL-03

# Metrics
duration: 4m7s
completed: 2026-05-14
---

# Phase 03 Plan 02: Splash (DisciplineCard + Hero Band) Summary

**Magazine-maximalist splash with rotated portrait, CALEB/LIM display type, acid bio sticker, italic-terracotta question bar emphasis, and a row of k1-k4 discipline cards that drop themselves when their category has no non-draft pieces.**

## Performance

- **Duration:** 4m 7s
- **Started:** 2026-05-14T09:31:28Z
- **Completed:** 2026-05-14T09:35:35Z
- **Tasks:** 2 implementation tasks + 1 checkpoint task (auto-treated per executor prompt's `<checkpoint_guidance>` block — UI-SPEC IS the approval)
- **Files modified:** 2 source files (1 created, 1 rebuilt) + 1 deferred-items log

## Accomplishments

- DisciplineCard.astro shipped as the single source of truth for all four discipline cards. k-keyed (1=Design/terracotta+outline-circle, 2=Finance/cobalt+italic-lime-2, 3=Personal/acid+dotted-line, 4=Marketing/plum+lime-triangle). Reusable on the 404 page in Plan 03-05.
- src/pages/index.astro entirely rebuilt: Base-wrapped hero band (portrait | name+roles | bio sticker), question bar with `<em>see</em>` italic-terracotta emphasis, cards row keyed by populatedCategories.
- SPLASH-04 / D-07 drop-card contract verified: with finance + personal both draft-only, the splash renders 2 cards (design + marketing) and the inline `grid-template-columns: 1fr 1fr` applies. When real finance/personal pieces ship, the splash auto-expands without code change.
- Astro `<Image>` wired with `widths={[280, 560]}` for retina portrait — bundles to 31 KB at 280px and 12 KB at fallback, down from 2.0 MB source.
- `npm run build` exits 0. `bash scripts/verify-anti-ai-tells.sh` all 7 gates green.

## Task Commits

1. **Task 1: Create src/components/DisciplineCard.astro with k1–k4 decoration variants** — `c9e3d18` (feat)
2. **Task 2: Rebuild src/pages/index.astro as full Magazine-maximalist splash with empty-discipline drop logic** — `7319da1` (feat)
3. **Task 3: Visual verification of splash above the fold @ 1280×800** — auto-approved per executor prompt's `<checkpoint_guidance>`: UI-SPEC is the design contract; spec-compliance is verified by automated gates (build, anti-AI-tells, grep gates on copy + structure + accent-hex absence + Inter absence). A human visual eyeball can be done at any time via `npm run preview` but is not blocking for this slice.

**Plan metadata:** committed separately (final-metadata commit) once SUMMARY is written.

## Files Created/Modified

- `src/components/DisciplineCard.astro` — new. The four-variant link card. Props: `category: Category`, `k: 1|2|3|4`, `index: 1|2|3|4`. Renders `<a href={\`/${category}\`}>` so the full card is the click target. Card label strings exact per UI-SPEC line 287. CSS verbatim from sketch lines 456-516. Hover lift + focus-visible outline (3px ink, paper override on acid). All `.deco` spans `aria-hidden="true"`. Zero hard-coded accent hexes (audited via `grep -E "#e85d2a|#1947ff|#d4ff3a|#5a1a55"` → 0 matches).
- `src/pages/index.astro` — rewritten. Replaces the bare HTML from Phase 1 walking skeleton. Now extends Base with `bg="paper"`, computes `populatedCategories` at build time from `getCollection('pieces', ({ data }) => data.draft !== true)`, renders the full sketch composition under scoped `<style>`. No hard-coded accent hexes. No Inter references. Mobile collapse @ ≤900px present.
- `.planning/phases/03-visual-design-system/deferred-items.md` — new. Logs three stale `scripts/verify-build.sh` gates that fail against the new splash contract but are owned by sibling/downstream plans (the literal-substring `'What do you wish to see'` gate misses on the spec-mandated `<em>see</em>`; route-404 + custom-404 + 4-link gates are 03-05 territory).

## Decisions Made

- **Treat Task 3 as autonomous.** The executor prompt's `<checkpoint_guidance>` block is explicit: UI-SPEC is the user's approved design contract. No manual eyeball gate before SUMMARY.
- **Suppress unused `DISCIPLINE_ACCENT` import via `void`.** The accent map is imported even though the DisciplineCard component owns its own k→color CSS. Rationale: keeps the contract co-located at the splash call site so future maintainers can grep `DISCIPLINE_ACCENT` and find every discipline-color surface in one read. The `void` swallows TS unused-import linting.
- **Use Astro `<Image>` not `<img>`.** Build-time WebP optimization + responsive `widths={[280, 560]}` for retina. Source portrait.jpg is 2 MB; optimized variants are 31 KB / 12 KB. Aligns with the maintenance constraint (Caleb is not a developer — drag the next portrait in, build, done).
- **Inline `style={\`grid-template-columns: ${gridTemplate}\`}` is safe per T-03-08.** Value sourced from a static map keyed by integer length (`populatedCategories.length`), no user input, no XSS path. Astro escapes attribute interpolation anyway.

## Deviations from Plan

None — plan executed exactly as written. The 19-line plan-provided file for DisciplineCard.astro and the 261-line plan-provided file for index.astro were committed verbatim with the single minor refinement noted under "Decisions Made" (`void DISCIPLINE_ACCENT`) to satisfy TypeScript unused-import semantics without removing the contract-documenting import. This is a behavior-neutral lint compliance, not a deviation from the design contract.

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered

### Stale `scripts/verify-build.sh` gates (not blocking — deferred)

1. Line 22's literal-substring check `grep -q 'What do you wish to see' "$DIST/index.html"` fails because the spec-mandated markup is `What do you wish to <em>see</em>?` (UI-SPEC line 284, plan must_haves.truth #8). The gate predates the Phase 3 spec. Suggested fix logged in deferred-items.md (one-line script tweak owned by Plan 03-05 or phase-close housekeeping).
2. Gates flagging `dist/finance/index.html exists` and `dist/personal/index.html exists` and `splash has 2 discipline-card links but 4 category routes exist` all fail. These are downstream of Plan 03-05 (D-07: empty-discipline `/[category]` returns 404; D-14: custom 404 page). My SPLASH-04 splash-side contract IS satisfied — populatedCategories filter correctly emits 2 cards.
3. Gate 15 ("Bricolage Grotesque referenced in splash output") **PASSES** — confirmed in the verify-build.sh output. This was the plan's named verification requirement.

### Pre-existing build state observed

- `dist/finance/index.html` and `dist/personal/index.html` still emit as empty galleries. Wave 3 plans 03-03 + 03-05 own these.

## User Setup Required

None — no external service configuration required for this slice.

## Next Phase Readiness

- **Ready for 03-05 (final-system slice):** DisciplineCard.astro can be imported directly by `src/pages/404.astro` and rendered with the same `populatedCategories` filter logic that the splash uses. No additional refactor needed.
- **Ready for 03-03 (gallery slice):** The splash now lives at the contract spec; the gallery slice is free to use its own `/[category].astro` styling without coupling to splash internals.
- **Ready for 03-04 (detail + about slice):** Splash hero band's bio-sticker copy is hand-tuned per D-09 and intentionally NOT extracted from `/about` — the two surfaces are independent. Plan 03-04 owns about's longer 122-word bio.

### Open items for the orchestrator / sibling plans

- `scripts/verify-build.sh` needs three gate updates once the wave settles (per deferred-items.md). One-line tweaks; not in this plan's `files_modified` scope.
- Sibling plans 03-03 (gallery) and 03-04 (detail + about) are running in parallel; this plan touched only `src/components/DisciplineCard.astro` and `src/pages/index.astro` per the declared scope — no conflicts expected.

## Self-Check

Verified before completing:

- `src/components/DisciplineCard.astro` — FOUND
- `src/pages/index.astro` — FOUND (modified)
- `.planning/phases/03-visual-design-system/deferred-items.md` — FOUND
- Commit `c9e3d18` (Task 1) — FOUND in `git log --oneline -5`
- Commit `7319da1` (Task 2) — FOUND in `git log --oneline -5`
- `npm run build` exit code 0 — CONFIRMED
- `bash scripts/verify-anti-ai-tells.sh` exit code 0 — CONFIRMED
- `grep -E '#e85d2a|#1947ff|#d4ff3a|#5a1a55' src/components/DisciplineCard.astro src/pages/index.astro` returns 0 matches — CONFIRMED
- Bricolage Grotesque present in dist CSS bundle (`dist/_astro/index.*.css`) — CONFIRMED
- Splash dist HTML has `b-card k1` + `b-card k4` (drop-card filter applied; finance + personal correctly excluded) — CONFIRMED
- Portrait Astro `<Image>` bundled into `/_astro/portrait.*.webp` — CONFIRMED

## Self-Check: PASSED

---
*Phase: 03-visual-design-system*
*Plan: 02*
*Completed: 2026-05-14*
