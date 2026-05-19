---
phase: 5
plan: 06
subsystem: accessibility
tags: [reduced-motion, a11y, motion-policy, foun-03, d-08, sc3]
requires: [03, 04, 05]
provides:
  - "SC3 closed (prefers-reduced-motion honored per D-08 surgical policy, not via a global hammer)"
  - "Global `*, *::before, *::after` reduced-motion clamp REMOVED from tokens.css"
  - "Per-source `.b-card { animation: none }` disable for the 750ms card entrance shake"
  - "Per-source `.b-bio { animation: none }` disable for the 750ms bio entrance shake"
  - "Liquid-glass overlay fade (380ms opacity) now correctly fires under reduced-motion on both `.b-card::before` and `.b-bio::before` (D-08 #7, #9 exempt classifications honored)"
affects:
  - "src/styles/tokens.css — global clamp removed, surgical-policy comment added"
  - "src/components/DisciplineCard.astro — `.b-card { animation: none }` disable + `.b-card::before` mini-hammer removed (Rule 1)"
  - "src/pages/index.astro — `.b-bio { animation: none }` disable + `.b-bio::before` mini-hammer removed (Rule 1); existing carousel slide-transition guard left untouched"
tech-stack:
  added: []
  patterns:
    - "Per-source surgical reduced-motion disables — each non-exempt motion gets its own `@media (prefers-reduced-motion: reduce) { selector { animation: none | transition: none; } }` block colocated with the motion it suppresses. No global `*` clamp. The absence of any override on an exempt motion is what lets it through (no positive 'exempt' rule needed)."
key-files:
  created:
    - ".planning/phases/05-mobile-performance-accessibility/05-06-SUMMARY.md"
  modified:
    - "src/styles/tokens.css"
    - "src/components/DisciplineCard.astro"
    - "src/pages/index.astro"
key-decisions:
  - "Plan 05-04's prior removal of per-Gallery `.b-piece:hover { transform: none }` blocks stayed gone — re-confirmed by grep. No duplicate deletion attempted."
  - "Rule 1 (Auto-fix bug) applied to two per-source mini-hammers the plan didn't explicitly call out: `.b-card::before { transition: none; }` (DisciplineCard.astro:296-298) and `.b-bio::before { transition: none; }` (index.astro:424-426). Both contradicted the plan's truth #4 (liquid-glass overlay fade must still fire under reduced-motion); removing them was the only way to satisfy the truths contract once the global hammer was gone."
  - "Carousel slide-transition guard at index.astro:205 (`.b-portrait .bp-slide { transition: none; }`) verified PRESENT and shaped correctly. The plan said line 198-200; actual line is 204-206 (off by ~6 lines due to upstream content drift). Left untouched per the plan's 'if present and shaped like above, leave it alone' directive. It was redundant under the prior global hammer and now does its real job — confirms 05-RESEARCH §2.3 motion source #2 analysis."
patterns-established:
  - "Surgical reduced-motion policy: no `*` clamp. Each non-exempt motion suppressor lives next to the rule it suppresses with a comment naming the D-08 source number."
requirements-completed: [FOUND-03]
duration: ~25min
completed: 2026-05-19
---

# Phase 5 Plan 05-06: Reduced-Motion Surgical Pass Summary

**Removed the global `*, *::before, *::after` reduced-motion clamp from `tokens.css`
and replaced it with two per-source `animation: none` disables on the discipline-card
and bio-card entrance shakes, so the four D-08 EXEMPT motions (hover-tilt, click-shake,
liquid-glass overlay fade, lime-dot pulse) now correctly fire under
`prefers-reduced-motion: reduce`.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3
- **Files modified:** 3 (tokens.css, DisciplineCard.astro, index.astro)
- **Commits:** 3 task commits + this summary

## Accomplishments

- SC3 closed architecturally — D-08's amended FOUND-03 exemption policy is now
  *implementable* by absence of override, not by an opt-in list embedded in a
  global hammer.
- Removed the global `*, *::before, *::after` reduced-motion clamp (tokens.css:63-71)
  along with the `.b-card:hover, .b-piece:hover { transform: none !important; }`
  line it carried. Net code volume of this commit: 7 inserted (comment), 9 deleted (the
  clamp block).
- Added `@media (prefers-reduced-motion: reduce) { .b-card { animation: none; } }`
  to DisciplineCard.astro immediately after the `.b-card { animation: card-shake … }`
  rule.
- Added `@media (prefers-reduced-motion: reduce) { .b-bio { animation: none; } }`
  to index.astro immediately after the `@keyframes bio-shake` definition.
- Removed two per-source `::before { transition: none }` mini-hammers (Rule 1
  auto-fix — both contradicted the plan's truth #4).

## Task Commits

1. **Task 1: Remove global *-selector reduced-motion clamp from tokens.css** —
   `ca27d7e` (feat) — RED: grep confirmed clamp present at line 65. GREEN: clamp
   block deleted, surgical-policy comment added in its place. Build passes,
   `--sp-3: 12px` and `.visually-hidden` from prior plans preserved.

2. **Task 2: Surgical reduced-motion disable for .b-card entrance shake** —
   `5c723c5` (feat) — RED: grep confirmed new `.b-card { animation: none }` rule
   absent. GREEN: rule appended after the `.b-card { animation: card-shake … }`
   declaration at line 320. Rule 1 deviation: removed the conflicting
   `.b-card::before { transition: none; }` block (was lines 296-298) — it
   suppressed the liquid-glass overlay fade that D-08 #7 marks exempt.

3. **Task 3: Surgical reduced-motion disable for .b-bio entrance shake + verify
   carousel guard** — `4ca12f7` (feat) — RED: grep confirmed `.b-bio
   { animation: none }` rule absent. GREEN: rule placed after `@keyframes
   bio-shake`. Carousel slide-transition guard at line 205 verified present and
   left untouched. Rule 1 deviation: removed the conflicting `.b-bio::before {
   transition: none; }` block (was lines 424-426) — identical reasoning to Task
   2 for D-08 #9.

**Plan metadata commit:** (this SUMMARY commit, hash recorded post-write).

## Files Created/Modified

- `src/styles/tokens.css` — global clamp removed, replaced with a 6-line
  surgical-policy comment.
- `src/components/DisciplineCard.astro` — added `.b-card { animation: none }`
  reduced-motion block; removed `.b-card::before { transition: none }` mini-hammer.
- `src/pages/index.astro` — added `.b-bio { animation: none }` reduced-motion
  block; removed `.b-bio::before { transition: none }` mini-hammer; existing
  carousel guard at line 205 left untouched.
- `.planning/phases/05-mobile-performance-accessibility/05-06-SUMMARY.md` (this file).

## Motion-by-motion verification

Under `prefers-reduced-motion: reduce` (after this plan):

### Exempt — verified still fire

| # | Motion | Source location | Why exempt | Status |
|---|--------|-----------------|------------|--------|
| 5 | Card hover-tilt (3D rotateX/Y, 380ms transition) | DisciplineCard.astro:281-293 | D-08 — user-initiated feedback | ✓ fires (no override left) |
| 6 | Card click-shake (220ms keyframe) | DisciplineCard.astro:336-338 | D-08 — user-initiated feedback | ✓ fires (no override on `.b-card.is-shaking`) |
| 7 | Liquid-glass overlay fade (380ms opacity) on `.b-card::before` | DisciplineCard.astro:81 + :before pseudo | D-08 — user-initiated feedback | ✓ fires (mini-hammer at :296 removed) |
| 9 | Liquid-glass overlay fade on `.b-bio::before` | index.astro:393 | D-08 — user-initiated feedback | ✓ fires (mini-hammer at :424 removed) |
| 10 | Card rest tilts (rotate ±1deg static) | DisciplineCard.astro:156/181/209/237 | D-08 — static transform, not motion | ✓ always applies (no @media touching it) |
| 11 | Lime-dot pulse on StatusPill (1.6s infinite) | StatusPill.astro:71 | D-08 — status indicator | ✓ fires (no override on `.pill .dot`) |
| 13 | Role-link click-shake | index.astro:625-630 | D-08 — user-initiated feedback | ✓ fires (no override) |

### Suppressed — verified disabled

| # | Motion | Suppressor | Status |
|---|--------|------------|--------|
| 1 | Carousel auto-advance | JS guard at index.astro:631 + :668 (`matchMedia` reads) | ✓ JS-gated correctly (untouched) |
| 2 | Carousel slide CSS transition | CSS guard at index.astro:204-206 (`.b-portrait .bp-slide { transition: none }`) | ✓ present (verified), no longer redundant under global hammer |
| 3 | Card entrance shake (750ms keyframe) | NEW CSS guard at DisciplineCard.astro:326-330 (`.b-card { animation: none }`) | ✓ added (Task 2) |
| 4 | Bio entrance shake (750ms keyframe) | NEW CSS guard at index.astro:448-452 (`.b-bio { animation: none }`) | ✓ added (Task 3) |
| 14 | Slow-scroll on `/about?to=contact` | JS guard at about.astro:350 (D-05 ship) | ✓ JS-gated correctly (untouched) |
| 15 | `.skip` link transition | CSS guard at Base.astro:153-155 | ✓ present (untouched) |

### Gallery* per-component blocks

| File | Plan 05-04 already deleted | Re-confirmed gone in 05-06 |
|------|----------------------------|----------------------------|
| GalleryA12.astro | yes | ✓ `grep -nE 'prefers-reduced-motion' src/components/Gallery*.astro` returns zero matches |
| GalleryB35.astro | yes | ✓ same |
| GalleryC68.astro | yes | ✓ same |

## Decisions Made

- **Combine Rule 1 fix with each task's commit.** The two mini-hammer removals
  (DisciplineCard `.b-card::before` and index.astro `.b-bio::before`) belong
  causally with each file's surgical disable, so they went into Task 2's and
  Task 3's commits rather than a fourth deviation commit. Each commit body
  names the Rule 1 deviation explicitly.
- **Leave the existing carousel slide-transition guard at its current location.**
  The plan said line 198-200; the actual line is 204-206 (off by ~6 lines from
  upstream content drift, not a regression). The guard's shape was correct per
  the plan's "if present and shaped like above, leave it alone" directive.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `.b-card::before { transition: none; }` mini-hammer**

- **Found during:** Task 2 (DisciplineCard entrance-shake disable).
- **Issue:** A per-source `@media (prefers-reduced-motion: reduce)` block at
  DisciplineCard.astro:296-298 was suppressing the liquid-glass overlay fade
  (`opacity 380ms`) on `.b-card::before`. The plan's truth #4 explicitly states
  the liquid-glass overlay fade must still fire under reduced-motion (D-08 #7
  exempt). Once the global hammer was gone in Task 1, this rule became visible
  and would prevent the truths contract from being satisfied.
- **Fix:** Deleted the block; replaced with a comment naming the Rule 1
  rationale + the D-08 source number.
- **Files modified:** `src/components/DisciplineCard.astro`.
- **Verification:** `grep -F 'transition: none' src/components/DisciplineCard.astro`
  returns only the comment line referencing the removed rule (no actual
  declaration). Build passes, 25 gates GREEN.
- **Committed in:** `5c723c5` (Task 2 commit).

**2. [Rule 1 - Bug] Removed `.b-bio::before { transition: none; }` mini-hammer**

- **Found during:** Task 3 (bio entrance-shake disable).
- **Issue:** Identical shape to #1 but for the bio card — block at index.astro:424-426
  was suppressing the bio liquid-glass overlay fade (D-08 #9 exempt). Same
  contradiction with the plan's truth #4.
- **Fix:** Deleted the block; replaced with a comment naming the Rule 1
  rationale + the D-08 source number + a pointer to where the new `.b-bio
  { animation: none }` rule lives.
- **Files modified:** `src/pages/index.astro`.
- **Verification:** `grep -F '.b-bio::before { transition: none' src/pages/index.astro`
  returns zero matches. Build passes, 25 gates GREEN.
- **Committed in:** `4ca12f7` (Task 3 commit).

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bug).
**Impact on plan:** Both fixes were strictly necessary to satisfy the plan's
own stated truth #4. The plan's `<action>` for Tasks 2 and 3 told the executor
not to TOUCH the `::before` rules (assuming they were unobstructed), but didn't
notice the existing per-source `transition: none` blocks already on them. The
fixes are surgical and additive — no scope creep, no architecture change.

## Issues Encountered

- The plan's grep assertions in `<verify><automated>` for Task 1 used
  `^\s*\*,\s*\*::before` as the "clamp removed" check, which also matches the
  *legitimate* `*, *::before, *::after { box-sizing: border-box; }` reset rule
  at line 55 of `tokens.css`. The assertion as literally written cannot pass
  (the reset would have to be deleted too, which is wrong). Worked around by
  substituting a stronger check that targets the clamp's distinctive payload:
  `! grep -F 'animation-duration: 0.01ms' src/styles/tokens.css` AND
  `! grep -F 'transform: none !important' src/styles/tokens.css`. Both pass.
  Logged so future plans tighten the grep pattern.

## Out-of-Scope Findings (deferred — not addressed by this plan)

Three additional per-source `transition: none` reduced-motion blocks exist in
files NOT in this plan's `files_modified` array. Each affects an EXEMPT
classification in D-08's interfaces block but is not enumerated in the plan's
four truths, so they are out of scope by the SCOPE BOUNDARY rule:

- `src/components/StatusPill.astro:77-80` — suppresses `.pill { transition: none; }`
  and `.pill:hover { transform: none; }`. D-08 #12 marks the hover-scale on
  StatusPill as exempt. Not in this plan's truths; deferred.
- `src/pages/[category]/[slug].astro:320-322` — suppresses `.pager-link
  { transition: none; }`. D-08 #18 marks the pager-link color transition as
  exempt (color-only, no spatial motion). Not in truths; deferred.
- `src/pages/[category].astro:136-138` — suppresses `.b-cat-back { transition: none; }`.
  D-08 #16 marks the back-pill color transition as exempt. Not in truths;
  deferred.

If a future plan wants to fully align with every exempt-classification entry
in D-08's interfaces list (#11-19), it should remove these three blocks the
same way Tasks 2 and 3 removed the `::before` mini-hammers. Doing it here would
expand `files_modified` beyond the plan's authorized scope.

## Verification

`npm run build` succeeds after each task commit.

`bash scripts/verify-build.sh` — all 25 gates GREEN after Task 3:

```
Phase 5 gates
=============
  OK: Gate 23 — topbar ≤700px collapse + icon-row aria-labels present on splash, design, about
  OK: Gate 24 — design gallery emits 1 <img>(s) for 1 piece(s)
  OK: Gate 24 — marketing gallery emits 1 <img>(s) for 1 piece(s)
  OK: Gate 25 — zero raw `font-size: Npx` literals outside tokens.css
==========================
ALL GREEN
```

(No `FAIL:` lines in the log; the single `FAIL` substring is a literal in the
verify-build.sh script comment "if no FAIL line above".)

Surgical-policy assertions:

```
$ grep -F 'animation-duration: 0.01ms' src/styles/tokens.css   # global hammer
(no output)
$ grep -F 'transform: none !important' src/styles/tokens.css   # global hammer
(no output)
$ perl -0777 -ne '... .b-card .* animation: none ...'          # surgical disable
PRESENT
$ perl -0777 -ne '... .b-bio .* animation: none ...'           # surgical disable
PRESENT
$ grep -nE '\.b-portrait \.bp-slide \{ transition: none' src/pages/index.astro
205:    .b-portrait .bp-slide { transition: none; }
$ grep -nE 'prefers-reduced-motion' src/components/Gallery*.astro
(no output — Plan 05-04 deletion stayed gone)
```

Manual macOS Reduce Motion smoke-test deferred to Plan 05-08 (phase-exit
verification, per the plan's `<verification>` section).

## Threat Flags

None — this plan only modifies CSS reduced-motion behavior. No new network
endpoints, auth paths, file access patterns, or schema changes introduced.

## Next Plan Readiness

- **Plan 05-07** (touch-hover gating + entrance shimmer) inherits a clean
  reduced-motion baseline. When Plan 05-07 wraps `.b-card:hover` in
  `@media (hover: hover) and (pointer: fine)` it should also wrap the new
  D-07 entrance-shimmer CSS with its own `@media (prefers-reduced-motion:
  reduce) { … { animation: none; } }` block — same pattern used here.
- **Plan 05-08** (phase-exit verification) inherits the motion-by-motion
  table above; it should re-run the manual macOS Reduce Motion smoke test
  against a Vercel preview URL and record the visual outcome alongside the
  Lighthouse audit.

## Self-Check: PASSED

Files exist:
- `/Users/caleb/projects/personal-website/src/styles/tokens.css` — FOUND (clamp removed)
- `/Users/caleb/projects/personal-website/src/components/DisciplineCard.astro` — FOUND (`.b-card { animation: none }` block added at line 326)
- `/Users/caleb/projects/personal-website/src/pages/index.astro` — FOUND (`.b-bio { animation: none }` block added after `@keyframes bio-shake`)
- `/Users/caleb/projects/personal-website/.planning/phases/05-mobile-performance-accessibility/05-06-SUMMARY.md` — FOUND (this file)

Commits exist:
- `ca27d7e` — FOUND (Task 1)
- `5c723c5` — FOUND (Task 2 + Rule 1 fix #1)
- `4ca12f7` — FOUND (Task 3 + Rule 1 fix #2)

---
*Phase: 05-mobile-performance-accessibility*
*Completed: 2026-05-19*
