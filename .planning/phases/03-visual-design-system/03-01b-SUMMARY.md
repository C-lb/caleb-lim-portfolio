---
phase: 03-visual-design-system
plan: 01b
subsystem: ui
tags: [design-system, layout, anti-ai-verification, base-layout, fontsource, status-pill]

# Dependency graph
requires:
  - phase: 03-visual-design-system
    plan: 01a
    provides: "src/styles/tokens.css + src/styles/disciplines.ts + three @fontsource-variable packages"
provides:
  - "src/layouts/Base.astro — single Astro layout extended by every Phase 3+ page; takes title + bg='paper'|'ink' props; imports tokens.css + 3 Fontsource bundles; preloads Bricolage display woff2 (D-15); renders topbar (brand + StatusPill + nav slot) + slot + footer; body class flips bg-paper / bg-ink (D-18)"
  - "src/components/StatusPill.astro — topbar pill 'OPEN TO ROLES' with pulsing acid dot; CSS verbatim from sketch 297-305; dot aria-hidden; reduced-motion contract inherited from tokens.css"
  - "src/assets/portrait.jpg — Caleb's real portrait (D-08 blocker cleared; 4000×6000 JPEG, ~2MB Lightroom export)"
  - "scripts/verify-anti-ai-tells.sh — 7-gate automated grep harness (whole-word Inter, forbidden deps, purple gradients, Built-with copy, bento ids, shadcn combos, lucide); exit 0 = clean"
  - ".planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md — manual walk-through checklist (32 items across automated/visual/voice/sketch-fidelity sweeps) for phase-exit /gsd-code-review + /gsd-ui-review"
  - "scripts/verify-build.sh Phase 3 gates 15-18 (Bricolage in dist, populated-vs-empty category routes per D-07, 404.html shape per D-14, splash card count matches built routes per SPLASH-04)"
  - "package.json 'verify:anti-ai' npm script"
affects: [03-02, 03-03, 03-04, 03-05, 04-header-chrome, 05-mobile-perf-a11y]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Base layout as single point-of-extension (D-18) — downstream pages do <Base title=\"...\" bg=\"...\">; no per-page chrome duplication"
    - "Fontsource preload via `?url` import to canonical Latin variable-wght woff2 — preloads only the display face actually used above the fold, not all three families"
    - "<style is:global> required for body.bg-paper / body.bg-ink selectors — Astro's scoped hash would otherwise miss the body class"
    - "Component-level CSS keyframes (pulse) inherit the global tokens.css reduced-motion block — no per-component reduced-motion duplication"
    - "Anti-AI-tell verification as a two-layer gate: automated grep script (verify-anti-ai-tells.sh) for things greppable + manual checklist (ANTI-AI-CHECKLIST.md) for things only an eyeball can catch (composition, hierarchy, voice)"
    - "verify-build.sh Phase 3 staged gates — they FAIL until Plans 02-05 wire splash/galleries/404, signalling progress without blocking incremental commits"

key-files:
  created:
    - "src/layouts/Base.astro"
    - "src/components/StatusPill.astro"
    - "src/assets/portrait.jpg"
    - "scripts/verify-anti-ai-tells.sh"
    - ".planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md"
  modified:
    - "package.json"
    - "scripts/verify-build.sh"

key-decisions:
  - "D-08: Real portrait blocker resolved — Caleb's 4000×6000 JPEG (Lightroom export from SONY ILCE-7M3 shoot) placed at src/assets/portrait.jpg; web-size optimization deferred to Phase 5"
  - "D-15: Bricolage display woff2 preloaded via canonical Fontsource v5 latin-wght-normal path; font-display: swap on all three families confirmed in Fontsource bundled @font-face rules"
  - "D-18: Base.astro is the single layout — every downstream page in Phase 3+ extends it; body class switches bg-paper/bg-ink via prop; topbar nav slot is empty in Phase 3 (Phase 4 wires mailto/LinkedIn/Resume)"
  - "Anti-AI-tell verification layered as automated script + manual checklist — script catches greppable tells, checklist catches compositional / voice tells; both required before phase exit"

patterns-established:
  - "P5: Base.astro is the layout choke point — no page declares its own <html> or <body>; every page imports Base and slots into it"
  - "P6: Discipline accent flow is now Base-aware — Base.astro is bg-agnostic, but downstream category page wrappers will set bg='ink' + read DISCIPLINE_ACCENT[category] for the title flourish (Plan 03-03)"
  - "P7: Verification gates are staged — Gates 15-18 FAIL by design until their dependent plan ships; the FAIL signal IS the readiness signal for the next plan"

requirements-completed: [VISUAL-01, VISUAL-02, VISUAL-04]

# Metrics
duration: ~10min
completed: 2026-05-14
---

# Phase 3 Plan 01b: Base Layout + Anti-AI Verification Summary

**Base.astro + StatusPill assembled from 01a's token foundation + Fontsource packages, portrait blocker (D-08) resolved with Caleb's real Lightroom export, and the two-layer anti-AI-tell verification harness (automated grep script + manual checklist + 4 new verify-build gates) shipped — every downstream Phase 3 plan now extends a single Base layout and runs under a green automated gate that catches the predictable AI-generated tells before they sneak in.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-14T17:19:00Z (approx)
- **Completed:** 2026-05-14T17:28:00Z (approx)
- **Tasks:** 7 / 7 (Task 1 portrait pre-resolved per executor prompt)
- **Files modified:** 7 (5 created, 2 modified)
- **Commits:** 7

## Accomplishments

- **D-08 blocker cleared:** Real portrait (4000×6000 JPEG, 2.0MB, SONY ILCE-7M3 Lightroom export) committed to `src/assets/portrait.jpg`. Web-size optimization (resize + AVIF/WebP variants) deferred to Phase 5 per ROADMAP.md.
- **Base.astro shipped:** Single Astro layout takes `title` + `bg?: 'paper' | 'ink'` props, imports tokens.css + three Fontsource bundles, preloads only the Bricolage Latin variable-wght woff2 above the fold, renders topbar (lowercase mono `caleb lim` brand + StatusPill + empty primary-nav slot for Phase 4) + slot + 3-column footer. Body class `bg-paper` / `bg-ink` switches background via `<style is:global>` to defeat Astro's scoped hash.
- **StatusPill.astro shipped:** "OPEN TO ROLES" uppercase mono on ink bg + pulsing acid dot (animation 1.6s ease-in-out infinite, opacity 1 → 0.4 → 1). Dot is `aria-hidden`; pill text is SR-readable. Padding `6px 14px` sketch-locked raw value per UI-SPEC OVERRIDE-03 (not a token).
- **Anti-AI-tell verification harness shipped:** `scripts/verify-anti-ai-tells.sh` (7 gates A1-A7) exits 0 against current source; `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` (32 unchecked items across automated/visual/voice/sketch-fidelity sections) for manual phase-exit walk; `npm run verify:anti-ai` script wired.
- **verify-build.sh extended:** Four new Phase 3 gates added (15-18 — Bricolage in dist, populated-vs-empty category routes per D-07, 404.html shape per D-14, splash-card-count-equals-built-route-count per SPLASH-04) without touching the existing 13 gates. Two pipefail-related execution bugs in the gate code auto-fixed (Rule 1) so all four gates run cleanly under `set -euo pipefail`.
- **Build smoke green:** `npm run build` exits 0, 8 pages built in ~700ms. `bash scripts/verify-anti-ai-tells.sh` exits 0. `bash scripts/verify-build.sh` runs all gates 1-18 with expected staged FAILs on 15/16/17 (FAIL signal is intentional and IS the readiness signal for Plans 03-02/03/05).

## Task Commits

| Task | Name                                                            | Type | Commit    |
| ---- | --------------------------------------------------------------- | ---- | --------- |
| 1    | Provide real portrait image (D-08 BLOCKER, pre-resolved)        | feat | `17ba2f5` |
| 2    | Create src/components/StatusPill.astro                          | feat | `4e3ab43` |
| 3    | Create src/layouts/Base.astro                                   | feat | `34826f2` |
| 4    | Create scripts/verify-anti-ai-tells.sh + npm script             | feat | `a67390e` |
| 5    | Create ANTI-AI-CHECKLIST.md                                     | docs | `c5f02d9` |
| 6    | Extend verify-build.sh with Phase 3 gates 15-18                 | feat | `58180a0` |
| —    | Fix verify-build.sh gate 15-16 pipefail propagation (Rule 1)    | fix  | `8eb7499` |
| 7    | Build + smoke verification (no source change)                   | —    | (no commit; verification only) |

**Plan metadata commit:** pending (next — this SUMMARY.md)

## Files Created/Modified

- `src/assets/portrait.jpg` (CREATED) — Caleb's real portrait, 4000×6000 JPEG, ~2MB
- `src/layouts/Base.astro` (CREATED) — D-18 single layout, tokens + fonts + topbar/foot chrome, bg prop
- `src/components/StatusPill.astro` (CREATED) — D-11 status pill with pulsing acid dot
- `scripts/verify-anti-ai-tells.sh` (CREATED) — VISUAL-04 automated grep gate (exec)
- `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` (CREATED) — manual walk-through
- `package.json` (MODIFIED) — added `verify:anti-ai` npm script
- `scripts/verify-build.sh` (MODIFIED) — appended Gates 15-18 + pipefail fixes

## Decisions Made

None new — all decisions directly implement plan-locked D-08 (real portrait blocker), D-11 (status pill copy + reduced-motion inheritance), D-13 (reduced-motion contract inherited from tokens.css), D-15 (Fontsource preload + font-display swap wiring), D-18 (Base.astro single-layout pattern with bg prop), VISUAL-04 (anti-AI-tell verification harness).

The Bricolage preload path (`bricolage-grotesque-latin-wght-normal.woff2`) was verified directly against `node_modules/@fontsource-variable/bricolage-grotesque/files/` before writing — matches the plan's verbatim canonical name.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] verify-build.sh Gate 15 missing `|| true` on first probe**

- **Found during:** Task 7 (build smoke run)
- **Issue:** The plan-provided Gate 15 code had `grep -q -i 'bricolage' "$DIST/index.html" 2>/dev/null && bricolage_hit=1` on its first probe without a trailing `|| true`. Under `set -euo pipefail`, when grep returns 1 (no match — the expected state until Plan 03-02 wires the splash), the short-circuit chain returns 1, and `set -e` immediately aborts the whole script. This meant Gates 16, 17, and 18 never executed.
- **Fix:** Added `|| true` to the first probe (line 440). The second probe already had it; both probes now uniformly survive a no-match state.
- **Files modified:** `scripts/verify-build.sh` (one line + 2 comment lines explaining the constraint)
- **Verification:** `bash scripts/verify-build.sh` now runs all 18 gates and produces expected staged-FAIL output for 15/16/17 (Bricolage absent, empty-category routes still built, 404 missing) — script exits 1 but completes the full sweep.
- **Committed in:** `8eb7499`

**2. [Rule 1 — Bug] verify-build.sh Gate 16 macOS BSD xargs grep -L exit-1 propagation**

- **Found during:** Task 7 (build smoke run, after fix #1)
- **Issue:** Plan-provided Gate 16 line `count=$(find ... | xargs grep -L "^draft: true" | wc -l | tr -d ' ')`. macOS BSD `xargs grep -L ...` returns exit 1 even when the inner grep returns 0 — verified directly via `echo file | xargs grep -L "^draft: true"; echo $?` → outputs the file path but exits 1. The command-substitution under pipefail then propagates that exit-1 and `set -e` aborts the loop after the first iteration.
- **Fix:** Added `|| true` to the command-substitution. Comment explains the BSD-vs-GNU xargs quirk so future maintainers know why.
- **Files modified:** `scripts/verify-build.sh` (one line + 2 comment lines)
- **Verification:** Gate 16 now runs for all four categories. design + marketing report `OK populated`; finance + personal report `FAIL: 0 non-draft pieces but route exists` (expected staged-FAIL — Plan 03-02 will conditionally skip empty routes per SPLASH-04 + D-07).
- **Committed in:** `8eb7499` (same fix commit as #1)

**3. [Rule 0 — Verification false-positive, not auto-fixed] Plan Task 3 acceptance criterion "grep -i 'inter' returns 0 matches" conflicts with the same task's mandate to declare `interface Props`**

- **Found during:** Task 3 (Base.astro verification)
- **Issue:** Plan acceptance: `grep -i "inter" src/layouts/Base.astro` returns 0 matches. But the same task requires `interface Props { title: string; bg?: 'paper' | 'ink'; }`. The substring `inter` appears in `interface`. This is structurally identical to the deviation Plan 03-01a logged.
- **Disposition:** Treated as a literal-grep false-positive that the plan's whole-word-aware `\bInter\b` check (Gate A1 in `verify-anti-ai-tells.sh`) catches correctly. No code change. `bash scripts/verify-anti-ai-tells.sh` confirms zero Inter font references in source.
- **Files modified:** None.
- **Rationale:** Adding `|| true` to the verification grep would invert its purpose. Removing `interface Props` is impossible — it's a structural TypeScript requirement of the very same task. The verification's semantic intent is "no Inter *font* reference" — which holds. Wave 1a established this precedent.

**4. [Rule 0 — Verification false-positive, not auto-fixed] Plan Task 5 acceptance criterion `grep -q "A1.*Inter font reference"` requires `Inter font` adjacency, but plan-prescribed file content uses `` `Inter` `` (backticked) followed by ` font`**

- **Found during:** Task 5 (ANTI-AI-CHECKLIST.md verification)
- **Issue:** Plan-prescribed file body: `` - [ ] **A1** No `Inter` font reference... ``. Plan acceptance grep `A1.*Inter font reference` requires `Inter` immediately followed by ` font`. Backticks break adjacency.
- **Disposition:** Wrote the file content verbatim as the plan specified (backticks around `Inter` for readability), accepting the grep mismatch as a verification-script literal that the plan author didn't reconcile with the prescribed content. Looser grep `A1.*Inter.*font reference` matches. Content semantics correct.
- **Files modified:** None.

**Total deviations:** 2 auto-fixed (Rule 1 bugs in pipefail propagation), 2 plan-internal verification false-positives documented but not changed (semantics intact).
**Impact on plan:** Zero scope change. The two fixes are control-flow safeties on top of plan-verbatim gate code; they don't alter any gate's intent or contract. The two false-positives are plan-author tooling drift between the prose-prescribed file content and the literal-string grep checks.

## Issues Encountered

The two pipefail bugs in Gate 15/16 (above) were the only friction. Build, anti-AI gate, Base.astro/StatusPill/portrait all worked first try.

The worktree's `npm ls` reports UNMET deps because no `node_modules/` exists at the worktree root — Node resolves up to the main repo's `node_modules` via standard module resolution, and `npm run build` works correctly via this resolution path. Not a regression; same setup Wave 1a used.

## User Setup Required

None. Portrait blocker pre-resolved by Caleb before this plan started. No external service config needed.

## Threat Surface Notes

Plan's `<threat_model>` declared three threats with dispositions: T-03-02 (portrait EXIF accept, deferred to Phase 6 polish), T-03-03 (404 enumeration accept, SSG + Cloudflare DDoS), T-03-05 (external font FOIT mitigated by font-display: swap + preload + system-sans fallback in `--sans` stack — all confirmed in Base.astro head + Fontsource bundled CSS).

Portrait EXIF is intact in the committed JPEG (verified via `file` output showing TIFF/Exif metadata including camera serial, Lightroom version, capture timestamp). Per T-03-02 disposition this is accepted for v1 — Phase 6 polish can strip EXIF with `exiftool -all=` or convert to AVIF/WebP via sharp pipeline.

## Next Plan Readiness

**Ready for Plans 03-02 (splash), 03-03 (galleries), 03-04 (detail + about), 03-05 (404).**

Foundation contracts:
- Every page imports `Base.astro` and uses `<Base title="..." bg="paper|ink">`
- Topbar is automatic (brand + StatusPill + nav slot) — pages don't redeclare chrome
- Footer is automatic — pages don't redeclare it
- Body bg flips via prop — pages just pass `bg="ink"` on category pages (D-04)
- Fonts are preloaded above the fold — pages just reference `var(--sans)`, `var(--serif)`, `var(--mono)` (or class shortcuts when downstream plans add them)
- Discipline accent flows via `DISCIPLINE_ACCENT[category]` — pages never hard-code hex
- Anti-AI gate runs cleanly — Plans 02-05 just need to keep it green

Plans 02-05 should run from the same Base.astro choke point. Gate 15 (Bricolage in dist) will go green once Plan 03-02 ships the new splash that uses Base. Gates 16/17 go green when Plan 03-02 conditionally drops empty-category cards + Plan 03-05 ships 404.

## Self-Check: PASSED

**Created files exist:**
- FOUND: `src/assets/portrait.jpg`
- FOUND: `src/components/StatusPill.astro`
- FOUND: `src/layouts/Base.astro`
- FOUND: `scripts/verify-anti-ai-tells.sh` (executable)
- FOUND: `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md`

**Modified files contain new content:**
- FOUND: `verify:anti-ai` script in package.json
- FOUND: `Gate 15 (Phase 3)` through `Gate 18 (Phase 3)` in scripts/verify-build.sh

**Commits exist:**
- FOUND: `17ba2f5` (Task 1 — portrait)
- FOUND: `4e3ab43` (Task 2 — StatusPill)
- FOUND: `34826f2` (Task 3 — Base.astro)
- FOUND: `a67390e` (Task 4 — verify-anti-ai-tells.sh + npm script)
- FOUND: `c5f02d9` (Task 5 — ANTI-AI-CHECKLIST.md)
- FOUND: `58180a0` (Task 6 — verify-build.sh gates 15-18)
- FOUND: `8eb7499` (Rule 1 fix — gate 15-16 pipefail)

**must_haves.truths satisfied (all 8):**
- T1 (real portrait at src/assets/portrait.jpg, JPEG, >10KB): PASS (2.0MB)
- T2 (Bricolage woff2 preloaded; font-display: swap on all three): PASS (preload link verified; swap confirmed in Fontsource @font-face rules)
- T3 (Base.astro single layout, title + bg props, body bg-paper / bg-ink flip): PASS
- T4 (StatusPill renders OPEN TO ROLES with acid pulse, sketch lines 297-305): PASS
- T5 (verify-anti-ai-tells.sh exits 0 against current source): PASS
- T6 (ANTI-AI-CHECKLIST.md enumerates VISUAL-04 + ROADMAP SC6): PASS (32 items)
- T7 (verify-build.sh has Phase 3 gates 15-18): PASS
- T8 (decisions D-08 + D-15 + D-18 implemented): PASS

**must_haves.key_links satisfied:**
- Base.astro `import '../styles/tokens.css'`: PASS
- Base.astro `@fontsource-variable/bricolage-grotesque`: PASS
- Base.astro `StatusPill` import: PASS

---
*Phase: 03-visual-design-system*
*Completed: 2026-05-14*
