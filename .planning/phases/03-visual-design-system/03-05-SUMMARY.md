---
phase: 03-visual-design-system
plan: 05
subsystem: ui
tags: [404, error-page, anti-ai-tells, verify-scripts, phase-close, splash-mirror]

# Dependency graph
requires:
  - phase: 03-visual-design-system
    plan: 01b
    provides: Base layout (bg='paper'|'ink'), Bricolage preload, StatusPill, tokens.css consumed
  - phase: 03-visual-design-system
    plan: 02
    provides: DisciplineCard component (Category, k, index) — single source of truth reused on 404
  - phase: 03-visual-design-system
    plan: 01a
    provides: DISCIPLINE_K + DISCIPLINE_ACCENT maps; CATEGORIES typed source of truth
provides:
  - Custom on-brand 404 page (dist/404.html) with HTTP 404 status verified locally
  - D-07-aware verify-build.sh (all 18 gates run to completion under set -euo pipefail)
  - Phase-close anti-AI-tell verification (verify-anti-ai-tells.sh green; ANTI-AI-CHECKLIST.md executor-first-pass walked)
  - Plan 03-03's deferred verify-build.sh housekeeping items resolved
affects: [04-navigation, 06-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "404 page reuses DisciplineCard (single-source-of-truth rule per D-14)"
    - "404 mirrors splash SPLASH-04 / D-07: populatedCategories filter so empty disciplines drop on 404 too"
    - "Astro preview honors dist/404.html convention with HTTP 404 (identical to Cloudflare Pages default)"
    - "verify-build.sh D-07-aware: missing dist/<cat>/index.html is OK; Gate 16 is the authoritative check"

key-files:
  created:
    - src/pages/404.astro
    - .planning/phases/03-visual-design-system/03-05-SUMMARY.md
  modified:
    - scripts/verify-build.sh
    - .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md

key-decisions:
  - "D-14 implemented as planned: cream-paper canvas, Bricolage display '404', Fraunces italic caption, DisciplineCards repeated below"
  - "verify-build.sh Gate 2 (splash prompt) widened to match Phase 3 spec markup (em with any attribute payload, not just bare <em>)"
  - "verify-build.sh Gates 3-4 (assumed-route existence) made D-07-aware: missing dist/<cat>/index.html no longer aborts the script; Gate 16 remains the authoritative populated-vs-empty check"
  - "Task 4 (human-verify checkpoint) handled as executor first pass: all programmatically verifiable items ticked; user browser-walk + reduced-motion toggle remain pending downstream sign-off"

patterns-established:
  - "Pattern: 404 page mirrors splash filtering (populatedCategories) — recruiter landing on 404 gets the same 4-card picker as the splash"
  - "Pattern: phase-close housekeeping plan owns verify-script gate fixes that prior parallel waves deferred via .planning/phases/<phase>/deferred-items.md"
  - "Pattern: bash `find` calls in verify scripts get `|| true` + `${var:-0}` defaults so missing dirs under set -euo pipefail don't abort the script mid-way"

requirements-completed: [SPLASH-05, VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04]

# Metrics
duration: 11min
completed: 2026-05-14
---

# Phase 3 Plan 05: 404 page + phase-close anti-AI-tell verification Summary

**Custom Bricolage "404" + Fraunces italic caption + populated-discipline cards on cream paper; verify-build.sh made D-07-aware so all 18 gates run to completion green; ANTI-AI-CHECKLIST.md executor-first-pass walked.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-05-14T12:45:00Z (approx — base commit 4c9864f)
- **Completed:** 2026-05-14T12:56:13Z
- **Tasks:** 4 (3 fully completed; Task 4 executor first pass — remaining user browser-walk pending)
- **Files modified:** 4 (1 created src/pages/404.astro; 1 modified scripts/verify-build.sh; 1 updated ANTI-AI-CHECKLIST.md; 1 created SUMMARY.md)

## Accomplishments

- **404 page on-brand**: src/pages/404.astro renders `<h1>404</h1>` in Bricolage display + dry Fraunces italic caption ("This page doesn't exist. The four that do are below.") + the same DisciplineCard component used on the splash, filtered to populated disciplines only. dist/404.html builds (7ms). SPLASH-05 satisfied.
- **HTTP 404 verified locally**: `npm run preview` serves dist/404.html with `HTTP/1.1 404 Not Found` for `/no-such-page` (curl-confirmed). ROADMAP Phase 3 SC5 verified at Phase 3 exit, not deferred to Phase 6 deploy.
- **verify-build.sh runs all 18 gates to completion**: prior to this plan the script aborted at Gate 4's `find dist/finance` (missing dir → set -e abort). Now D-07-aware. All 18 gates green; ZERO FAIL lines.
- **verify-anti-ai-tells.sh green**: all 7 sub-gates pass (no Inter, no forbidden deps, no purple gradients, no "Built with X", no bento, no shadcn combo, no lucide).
- **ANTI-AI-CHECKLIST.md walked**: 26/35 boxes ticked from automated greps + dist-source inspection; remaining 9 require user browser walk + OS-level reduced-motion toggle + downstream `/gsd-code-review` + `/gsd-ui-review` sign-off.
- **Wave 3 deferred items resolved**: the four items logged in `.planning/phases/03-visual-design-system/deferred-items.md` (Gate 2 splash prompt, Gates 3+4 D-07-awareness, Gate 17 dist/404.html, Gate 18 splash-card vs populated count) all close cleanly.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/pages/404.astro** — `f7d21ab` (feat)
2. **Task 2: Full build + verify-build.sh + verify-anti-ai-tells.sh all green** — same `f7d21ab` build verification + `8425e15` (fix: phase-close housekeeping for verify-build.sh gates)
3. **Task 3: Verify HTTP 404 status served locally (SPLASH-05)** — verification only; no code change. Curl evidence captured in this SUMMARY.
4. **Task 4: Manual walk of ANTI-AI-CHECKLIST.md** — executor first pass committed alongside SUMMARY in this plan's final commit.

_No TDD on this plan (frontmatter `tdd: false` on all tasks)._

## Files Created/Modified

- `src/pages/404.astro` — D-14 custom 404. Imports Base + DisciplineCard + getCollection + DISCIPLINE_K. Filters `populatedCategories` mirroring SPLASH-04. h1 in `var(--sans)` (Bricolage) at `var(--fs-display)` with `font-variation-settings: "wdth" 100, "opsz" 96` matching the splash name treatment. Caption in `var(--serif)` italic at 18px opacity .4. Grid template adapts to N populated categories (1-4).
- `scripts/verify-build.sh` — Phase 3 D-07-aware housekeeping. Gate 2 widened to `grep -qE 'What do you wish to (see|<em[^>]*>see)'` so it matches the Phase 3 spec markup (Astro injects `data-astro-cid-*` on scoped em). Gate 3 replaced with "any-cat-exists" sanity (Gate 16 is the authoritative D-07 check). Gate 4's `find` gets `|| true` + `${count:-0}` default so missing dist/<cat> doesn't abort the script under `set -euo pipefail`.
- `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` — executor first pass: 26/35 boxes ticked (A1-A7 automated grep gates, V1-V7 visual sweep with dist-source evidence, C1-C5 voice sweep, S1+S3+S4+S5 dist-source-verifiable sketch fidelity, plus the new SPLASH-05 row). Remaining 9 (S2, S6, S7, S8, S9, S10, two reviewer rows, user browser-walk row) explicitly noted as pending downstream sign-off.
- `.planning/phases/03-visual-design-system/03-05-SUMMARY.md` — this file.

## Decisions Made

- **Followed plan as specified for D-14** — file written verbatim from the plan's `<action>` block. No deviation in the 404 markup or styling.
- **Phase-close housekeeping treated as a SEPARATE commit** from the 404 work, per the orchestrator's `<phase_close_housekeeping>` block. Keeps the "scope of this plan = src/pages/404.astro" contract clean and isolates the verify-script edits as a discrete fixup commit for review.
- **Task 4 (human-verify checkpoint) treated as executor first pass** — automated/source-verifiable items ticked, items strictly needing a human at a browser + DevTools + OS-level reduced-motion toggle left unticked with explicit notes. The plan's checkpoint pattern expects this: the user types "approved" after walking the running preview. Parallel-execution mode requires the SUMMARY be committed before returning, so this is the correct handoff.

## Deviations from Plan

None — plan executed exactly as written.

The plan explicitly tasked this executor with the `<phase_close_housekeeping>` block in the prompt (verify-build.sh fixes for Wave 3 deferred items). Those edits are NOT a deviation — they were enumerated as required work alongside the 404 page.

## Issues Encountered

- **Pre-housekeeping verify-build.sh abort**: before the housekeeping commit, verify-build.sh aborted at Gate 4's `find dist/finance` (the dir doesn't exist by D-07; `find` exits non-zero; `set -euo pipefail` propagates). The housekeeping commit (`8425e15`) resolves this exactly as deferred-items.md prescribed: `find ... 2>/dev/null || true` + `${count:-0}` default.
- **Splash prompt grep failed pre-housekeeping**: Gate 2 grepped for the bare `'What do you wish to see'` string, but Phase 3's UI-SPEC.md line 284 introduced `<em data-astro-cid-...>see</em>` markup. Widened the regex to match both bare and any-attribute-payload em forms.
- **`/no-such-page` HTTP status**: `npm run preview` returned `HTTP/1.1 404 Not Found` on first try — no Astro config tweaks needed. Cloudflare Pages will exhibit identical behavior at Phase 6 deploy (zero-config dist/404.html convention).

## Threat Flags

None — no new security surface introduced. The 404 page is the trust boundary documented in PLAN.md's `<threat_model>` and remains static SSG (T-03-15 / T-03-16 / T-03-17 all dispositioned: accept / accept / mitigate-by-CF-convention). T-03-17's mitigation (CF Pages serves dist/404.html with HTTP 404) is now verified locally via `npm run preview` + curl (Task 3), and re-verified on Cloudflare Pages at Phase 6 deploy.

## Known Stubs

None. The plan's deliverable is fully wired: 404 page consumes real Base + real DisciplineCard + real DISCIPLINE_K + real getCollection(pieces, draft!==true). No placeholder data; no TODO comments; no mock components.

## User Setup Required

None — no external service configuration required for this plan.

## Phase 3 Exit Status

| Phase 3 ROADMAP Success Criterion | Status |
|---|---|
| SC1: Type system (Bricolage + Fraunces + JetBrains Mono) | ✅ green — verify-build.sh Gate 15 PASS |
| SC2: Color system (terracotta / cobalt / lime / plum) applied across surfaces | ✅ green — DISCIPLINE_ACCENT consumed by DisciplineCard + galleries + detail |
| SC3: Splash above the fold @ 1280×800 | ✅ verified at Wave 2 (plan 03-02); requires browser walk to re-confirm at phase exit |
| SC4: Asymmetric galleries (Bucket A/B/C) | ✅ verified at Wave 3 (plan 03-03) |
| SC5: On-brand 404 returns HTTP 404 + links back to splash | ✅ green — this plan (curl evidence + dist/404.html present with h1 + 2 discipline links) |
| SC6: Anti-AI-tell sweep clean (automated + manual walk) | ✅ automated green; manual walk = executor first pass complete; user browser-walk sign-off pending |

All six phase-exit success criteria are either fully green or have only "user browser walk" remaining — no failing automated gates.

## Next Phase Readiness

- **Phase 4 (navigation/header chrome) can layer on top.** Base.astro reserves the topbar nav slot (`min-width: 1px`) with a `<!-- Phase 4 wires mailto / LinkedIn / Resume here -->` placeholder comment.
- **Phase 6 (deploy) re-verifies HTTP 404 on Cloudflare Pages** — this plan moved SC5 verification from "deploy phase" to "Phase 3 exit"; Phase 6 still curls the live preview-deploy URL as a smoke-on-prod check.
- **Outstanding before phase sign-off**: user types "approved" in ANTI-AI-CHECKLIST.md after browser-walking `/`, `/design`, `/marketing`, `/design/design-real-piece`, `/marketing/marketing-real-piece`, `/about`, `/no-such-page` AND toggling `prefers-reduced-motion: reduce` to confirm reduced-motion behavior. `/gsd-code-review` + `/gsd-ui-review` then run as the final pre-Phase-4 gates.

## Self-Check: PASSED

- [x] `src/pages/404.astro` exists (verified by `test -f` + Task 1 grep gate all-green)
- [x] Commit `f7d21ab` exists (verified by `git log --oneline | grep f7d21ab`)
- [x] Commit `8425e15` exists (housekeeping fix; verified by `git log --oneline | grep 8425e15`)
- [x] `dist/404.html` builds (verified by `npm run build` output + `test -f dist/404.html`)
- [x] `bash scripts/verify-build.sh` exits 0 (verified — all 18 gates ALL GREEN)
- [x] `bash scripts/verify-anti-ai-tells.sh` exits 0 (verified — 7 sub-gates GREEN)
- [x] `curl -sI http://localhost:4321/no-such-page` returned `HTTP/1.1 404 Not Found` (Task 3 evidence)
- [x] `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` updated (26 boxes ticked; 9 explicitly pending)
- [x] This SUMMARY.md exists at the canonical path

---
*Phase: 03-visual-design-system*
*Plan: 05*
*Completed: 2026-05-14*
