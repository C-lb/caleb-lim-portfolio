---
phase: 5
plan: 09
subsystem: a11y / splash
tags: [a11y, lighthouse, sc2, gap-closure, splash, aria, contrast, target-size, heading-order]
dependency-graph:
  requires: [01, 02, 03, 04, 05, 06, 07, 08]
  provides:
    - splash a11y ≥95 (Lighthouse mobile) — SC2 numerical gate closed
    - --role-link-odd / --role-link-even tokens for WCAG AA on --paper
    - bp-dot 24×24 hit-target pattern (visible 8×8 ::before pseudo)
  affects:
    - Plan 05-08 (phase-exit walks) — Lighthouse leg now passes; manual real-iPhone + reduced-motion walks still pending
tech-stack:
  added:
    - aria-current="true" pattern on carousel dots (replaces aria-selected on non-tab buttons)
  patterns:
    - role=group + aria-label for carousel dot strip
    - visible-text-inside-accessible-name (axe label-content-name-mismatch)
    - WCAG 2.5.5 target-size 24×24 via padding + min-height + inline-flex centering
key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/styles/tokens.css
    - .planning/phases/05-mobile-performance-accessibility/lighthouse/splash-summary.json
    - .planning/phases/05-mobile-performance-accessibility/lighthouse/design-summary.json
    - .planning/phases/05-mobile-performance-accessibility/lighthouse/marketing-summary.json
    - .planning/phases/05-mobile-performance-accessibility/lighthouse/about-summary.json
    - .planning/phases/05-mobile-performance-accessibility/lighthouse/design_design-real-piece-summary.json
    - .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md
decisions:
  - "Role-link colors get dedicated --role-link-odd / --role-link-even tokens rather than mutating --teal / --terracotta (D-17(b) protected — 24/24 load-bearing uses)."
  - "Marker bg switched from --terracotta (3.68:1 on --paper) to --ink (>15:1). The black-pill silhouette is in the magazine-maximalist vocabulary already (alongside ABOUT / KEEP READING tags), so this is a low-disturbance swap rather than a palette deviation."
  - "b-bio aria-label dropped (rather than padded with visible-text concatenation) — the visible 'ABOUT / why choose caleb? / KEEP READING' content stands on its own as the accessible name."
metrics:
  duration_minutes: ~50
  completed: 2026-05-19
  tasks: 4
  commits: 5
---

# Phase 5 Plan 09: Splash a11y gap closure (SC2) Summary

SC2 splash-a11y blocker closed — Lighthouse mobile a11y 79 → 100. Closed 6 audit categories on `/` (aria-allowed-attr, aria-required-children, target-size, color-contrast, heading-order, label-content-name-mismatch) across 4 tasks + 1 deviation pass, totaling 5 commits.

## What changed

**Task 1 — Carousel dot semantics + hit target.**
The `.bp-dots` strip was wired as a tablist with `aria-selected` on each `<button class="bp-dot">`, but no `role="tabpanel"` siblings exist — the dots are a photo selector, not a tab set. Stripped `role="tablist"` → `role="group"`, `aria-selected` → `aria-current="true"` (active only). Hit target: 8×8 button → 24×24 transparent shell with a `::before` pseudo carrying the visible 8×8 dot. Carousel JS swapped `setAttribute('aria-selected',...)` for `setAttribute('aria-current','true')` / `removeAttribute('aria-current')`. Visual contract unchanged at pixel level.

**Task 2 — Role-link contrast.**
`.b-name .roles a.role-link:nth-child(odd|even)` used `--teal` (#b4a682, 2.02:1 on `--paper`) and `--terracotta` (#82785d, ~3.4:1). Path (a) from plan: added `--role-link-odd` (#4a6e5d, 5.20:1) and `--role-link-even` (#6b4a3a, 6.79:1) — same hue families, darker, in-system. Path (b) was avoided per D-17(b) (--terracotta has 24/24 load-bearing uses across about.astro + topbar nav-link hover).

**Task 3 — Heading order.**
`<h3>why choose caleb?</h3>` → `<h2>` (splash had h1 → h3 skip). CSS selector `.b-bio h3` → `.b-bio h2`; styling unchanged.

**Task 4 — Re-audit splash + commit new evidence.**
Pushed Tasks 1–3, polled Vercel `x-vercel-id` for new deploy, ran `scripts/lighthouse-audit.sh https://caleb-lim-portfolio.vercel.app`. First post-Task-3 result: splash a11y 91 (3 audits still failing — see Deviations below). After the residual fix and a second deploy + re-audit, splash a11y landed at **100** with all 5 routes ≥95 a11y and no regressions.

## Final Lighthouse scores

| Route | Perf | A11y | LCP (ms) | Status |
|-------|------|------|----------|--------|
| `/` (splash) | 99 | **100** | 1671 | PASS |
| `/design` | 100 | 95 | 1671 | PASS |
| `/marketing` | 98 | 95 | 1689 | PASS |
| `/about` | 98 | 95 | 1369 | PASS |
| `/design/design-real-piece` | 94 | 100 | 3121 | PASS\* |

\*Detail-page LCP 3121ms exceeds the 2000ms gate that applies to splash only — out of SC2 scope; surfaced for Phase 6 polish per plan §Deferred.

Plan 05-08 baseline → Plan 05-09 final on splash: **a11y 79 → 100 (+21)**.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Residual a11y audits not enumerated in plan**

The plan's audit table listed 6 audit categories sourced from the Plan 05-08 baseline. After Tasks 1–3 deployed and re-audited, splash a11y climbed 79 → 91 (3 of 4 listed categories cleared cleanly), but three additional findings remained — discovered on the post-Task-3 re-audit, not in the plan's surface inventory:

- **color-contrast (1 residual node)** — `.b-question .marker` ("→ PICK ONE" tag) had `--paper` on `--terracotta` = 3.68:1 (fails AA 4.5:1 for 13px bold). The original 5 contrast-failures the plan enumerated were the role-links; this marker is a separate piece of markup.
- **target-size (2 residual nodes)** — `.role-link` anchors measured 70×15.5 and 83.9×15.5 (well below 24×24). Plan only enumerated `.bp-dot` as the target-size offender.
- **label-content-name-mismatch (5 nodes, weight 0)** — though weight-0 in score, axe still considers it a failure. 4 role-link anchors had `aria-label="Jump to ${destination} work"` without the visible "analyst" / "designer" / "marketer" text; `.b-bio` had `aria-label="Read the full bio on the About page"` without "ABOUT" / "why choose caleb?" / "KEEP READING".

**Fix:** All three resolved in one commit (`db2c851`):
- `.b-question .marker` bg `--terracotta` → `--ink`, fg stays `--paper`. Black-pill tag matches existing ABOUT / KEEP READING pattern.
- `.role-link` got `padding: 5px 8px; display: inline-flex; align-items: center; min-height: 24px;` and the `.roles` gap went 4px → 10px to clear the safe-target-spacing 24px floor.
- `.role-link` aria-label prefixed with visible role text (`${role} — jump to ${roleAria(category)} work`); `.b-bio` aria-label dropped (visible text now serves as accessible name).

Without these fixes the must-have (a11y ≥95) would not have been met. Treated as Rule 2 (critical functionality required for SC2 closure) rather than Rule 4 because the changes are visual/markup tweaks within the existing palette and component vocabulary, not architectural.

**Files modified:** `src/pages/index.astro`
**Commit:** `db2c851`

### Path-choice decisions

**Path (a) chosen for Task 2 (role-link contrast).** Plan offered (a) new tokens vs (b) mutating `--teal`/`--terracotta`. Path (a) selected by default per plan; cascade through about.astro + topbar nav-link hover (24/24 load-bearing per D-17(b)) was preserved without re-verification. Path (b) was not exercised.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| `5a2e2ac` | feat | Carousel dot semantics + hit target (drop tablist, +aria-current, 24x24) |
| `97818e8` | feat | Role-link contrast — add darker role-link tokens |
| `f26de60` | feat | Heading order — h3 → h2 on .b-bio |
| `db2c851` | fix  | Residual SC2 a11y — marker contrast, role-link target-size, name mismatch |
| `30c0595` | feat | Re-audit splash — SC2 a11y closure |

## Verification

- `bash scripts/verify-build.sh` — all 25 gates GREEN (re-run after each task; final pass after Task 4 commit).
- `bash scripts/lighthouse-audit.sh https://caleb-lim-portfolio.vercel.app` — ALL GREEN; splash a11y 100, all routes ≥95.
- Production URL fresh-HTML probe (`curl | grep aria-current`) confirmed Vercel edge served the new build before the re-audit ran.
- Visual diff at 375px (DevTools mobile preview): `.bp-dot` visible dot is unchanged 8×8; tap-target shell (24×24) shows on focus-visible outline.

## Known Stubs

None. All changes wire real fixes into existing data flows.

## Self-Check

- [x] All Task commits exist in `git log` (`5a2e2ac`, `97818e8`, `f26de60`, `db2c851`, `30c0595`)
- [x] `src/pages/index.astro` modified
- [x] `src/styles/tokens.css` modified (new `--role-link-odd` / `--role-link-even`)
- [x] All 5 `lighthouse/*-summary.json` files updated and committed
- [x] `05-VERIFICATION.md` Lighthouse Scores section filled (no TBD rows; before/after table added)
- [x] `grep -F -- '--role-link-' src/styles/tokens.css` exits 0
- [x] `! grep -nE 'b-bio h3' src/pages/index.astro` exits 0
- [x] `splash-summary.json` shows `a11y: 100` (≥95 met)

## Self-Check: PASSED
