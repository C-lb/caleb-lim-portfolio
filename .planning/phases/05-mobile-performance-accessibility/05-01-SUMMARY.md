---
phase: 5
plan: 01
subsystem: validation-harness
tags: [wave-0, harness, lighthouse, verify-build, token-map, planner-artifact]
requires: []
provides:
  - scripts/lighthouse-audit.sh                                  # SC2 instrumentation, manual-only per D-16
  - scripts/verify-build.sh::Gate-23                             # SC1 lock (topbar collapse + icon-row aria)
  - scripts/verify-build.sh::Gate-24                             # SC5 lock (gallery emits <img>)
  - scripts/verify-build.sh::Gate-25                             # SC6 lock (zero raw font-size: Npx outside tokens.css)
  - .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md
  - .planning/phases/05-mobile-performance-accessibility/05-TOKEN-MAP.md
  - .gitignore::lighthouse-allow-list                            # raw reports ignored, *-summary.json committed
affects:
  - Plan 05-02 (Vercel): consumes lighthouse-audit.sh once preview URL is live
  - Plan 05-03 (topbar): Gate 23 turns GREEN when topbar collapse + icon-row aria-labels land
  - Plan 05-04 (gallery + LCP): Gate 24 already GREEN (existing hero <img>); 05-04 owns Q1 (240px deco fate)
  - Plan 05-05 (token sweep): consumes 05-TOKEN-MAP.md verbatim; Gate 25 turns GREEN after sweep
  - Plan 05-08 (phase exit): fills 05-VERIFICATION.md in-place (does NOT overwrite)
tech-stack:
  added: []                                       # explicitly NO Vitest/Jest/Playwright per 05-RESEARCH §6.1
  patterns:
    - bash + node-CLI script for Lighthouse summary parsing (no new package.json dep)
    - .gitignore allow-list via negation (`!*-summary.json`)
    - verify-build.sh gate idiom (header comment, OK:/FAIL: echoes, shared `fail` counter)
key-files:
  created:
    - scripts/lighthouse-audit.sh
    - .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md
    - .planning/phases/05-mobile-performance-accessibility/05-TOKEN-MAP.md
  modified:
    - scripts/verify-build.sh
    - .gitignore
decisions:
  - Lighthouse summary JSON shape locked: {route, perf, a11y, lcp_ms, recorded_at}. Small enough to commit; rich enough for Phase 6 trend tracking
  - 240px deco-numeral fate marked CONDITIONAL in TOKEN-MAP — gated on Plan 05-04 Q1 resolution (drop deco vs. keep). Not a Wave-0 escalation
  - `--sp-3: 12px` is the only NEW token mandated; 4 site-wide uses + fixes about.astro:98 silent-failure consumer
  - Sketch-locked OVERRIDE-03 spacing literals kept raw (whitelist inherited from Phase 3); Plan 05-05 must NOT migrate them
  - Gate 25 inline comment locks px-only scope; rem/em are legitimate per 05-UI-SPEC and stay outside this gate
metrics:
  duration: ~45 minutes
  completed_date: 2026-05-19
  tasks: 3
---

# Phase 5 Plan 01: Wave 0 — Validation Harness Summary

Wave 0 harness now in place — every downstream Wave-1 and Wave-2 task in Phase 5 has the verification scaffolding it needs to claim done. Lighthouse mobile audit script (manual-only per D-16, runs against Vercel preview URLs per amended D-13), three new gates appended to `verify-build.sh` (SC1 topbar collapse, SC5 gallery hero emission, SC6 zero raw font-size literals), one manual-verification template stub (`05-VERIFICATION.md`), one planner-locked token migration map (`05-TOKEN-MAP.md`). Nyquist compliance: no downstream `<automated>` check is now blocked by missing instrumentation.

## What shipped

### `scripts/lighthouse-audit.sh` (new, 167 LOC, `chmod +x`)

- Takes Vercel preview URL as `$1`; default `https://caleb-lim-portfolio-git-phase-5-c-lb.vercel.app` (per 05-RESEARCH §4.4 — preview URL TBD until Plan 05-02 ships Vercel import).
- Discovers the design slug at runtime by listing `src/content/pieces/design-*/` and picking the first non-draft `.md` filename (currently `design-real-piece`). Future-proof: if Caleb adds more design pieces, the script picks the first non-draft.
- Iterates over five routes — `/`, `/design`, `/marketing`, `/about`, `/design/<slug>` — running `npx --yes lighthouse` per route with `--form-factor=mobile`, `--throttling-method=simulate`, `--output=html,json`, `--chrome-flags=--headless=new`. No new package.json dependency.
- Parses each emitted JSON via inline `node -e` snippet (node already in repo for pdf-preprocess), extracts `categories.performance.score`, `categories.accessibility.score`, `audits["largest-contentful-paint"].numericValue`, and emits per-route `<slug>-summary.json` with shape `{route, perf, a11y, lcp_ms, recorded_at}` — small, committed, durable SC2 evidence.
- Exits non-zero if splash misses thresholds: `perf < 85`, `a11y < 95`, or `lcp_ms >= 2000ms`.
- `--help` / `-h` prints the usage block (lines 2–28 of the script).

### `scripts/verify-build.sh` (modified, +88 lines)

Three new gates appended after Gate 22, before the final exit. Existing Gates 1–22 untouched — `npm run build && bash scripts/verify-build.sh` still reports them all GREEN.

- **Gate 23 — topbar ≤700px collapse + icon-row aria (SC1, D-01/D-02/D-03).** Greps `dist/index.html`, `dist/design/index.html`, `dist/about/index.html` for `@media (max-width: 700px)` AND one of three aria-labels (Email Caleb / Caleb on LinkedIn / Download Caleb's resume). **Expected RED until Plan 05-03 lands.**
- **Gate 24 — populated gallery emits `<img>` (SC5, D-09–D-12).** Counts non-draft pieces per discipline via `src/content/pieces/<cat>-*/index.md` and asserts `dist/<cat>/index.html` emits ≥ that many `<img>` elements. **Currently GREEN** — galleries already emit a hero per tile (Astro renders the existing frontmatter hero even pre-D-09 recomposition). Gate locks the contract against future regression; Plan 05-04 will reposition the hero to LEFT 60%, not remove it.
- **Gate 25 — zero raw `font-size: Npx` outside tokens.css (SC6, D-17(c)).** `grep -rnE 'font-size:\s*[0-9]+(\.[0-9]+)?px' src/components/ src/pages/ src/layouts/`. Inline comment locks px-only scope (rem/em legitimate per 05-UI-SPEC §Typography "Relative units are legitimate") — must NOT be widened to rem/em without a UI-SPEC amendment first. **Expected RED — 23 literals found** (count matches expected; the asymmetry vs the 25-literal TOKEN-MAP inventory is the 2 KEEP entries `0.92rem` + `1.7em` correctly excluded from this gate).

### `.gitignore` (modified, +4 lines)

Allow-list pattern for the Lighthouse output directory:

```
/.planning/phases/05-mobile-performance-accessibility/lighthouse/*.html
/.planning/phases/05-mobile-performance-accessibility/lighthouse/*.json
!/.planning/phases/05-mobile-performance-accessibility/lighthouse/*-summary.json
```

Raw HTML + raw JSON reports stay local (gitignored — they're ~100KB per route per run, not durable evidence). Per-route `*-summary.json` files are un-ignored and committed as the canonical SC2 durable evidence (4 small JSON files alongside `05-VERIFICATION.md`).

Verified working: `git check-ignore` + `git status --short` confirm `splash.json` is ignored, `splash-summary.json` is tracked.

### `05-VERIFICATION.md` (new, template stub)

`status: pending` template Plan 05-08 (Wave 2) fills in-place. Seven sections:

1. Real-Device Test Rig (D-14) — iPhone model, iOS version, network, date — all TBD
2. Critical-Path Walk (SC1, SC4) — 10-row checklist mirroring 05-UI-SPEC §"Critical-path accessibility walk"
3. Lighthouse Scores (SC2, D-13/D-15) — empty 5-row table + per-route JSON pull-quote slots
4. Reduced-Motion Walk (SC3, D-08) — 9-row checklist matching 05-UI-SPEC §"Verification walk"
5. `--terracotta` Audit (SC6, D-17(b)) — 24 seed rows from `grep -rn '\-\-terracotta' src/`, Verdict column blank for Plan 05-05
6. Phase Exit Sign-Off — 7 checkboxes

No fabricated data — every data cell is `TBD`. The structure is the deliverable; the content lands in Plan 05-08.

### `05-TOKEN-MAP.md` (new, planner-locked decisions)

Plan 05-05 consumes this verbatim and does NOT re-decide. Per D-18: decisions are planner-owned at Wave 0.

- **Source inventory** — fenced-code-block embedding the raw grep output for both font-size literals (25 total) and spacing literals (27 total). Ground truth. If a literal isn't in this list, Plan 05-05 isn't responsible for sweeping it.
- **Font-size mapping** — 25 rows. Most exact-match migrations (11px → `--fs-mono`, 13px → `--fs-tile-role`, 22px → `--fs-ttl`, 16px → `--fs-body` with 0.5px shrink). One-off 18px/32px migrate to nearest existing scale per the 3+-uses rule. 240px deco-numeral marked **CONDITIONAL** — gated on Plan 05-04's Q1 resolution.
- **Spacing mapping** — 25 rows. Sketch-locked OVERRIDE-03 literals stay raw (whitelist inherited from Phase 3). 12px migrate to NEW `--sp-3`. Mixed-value padding triplets like `padding: 8px 14px` keep the off-scale value raw + token-ize the scale value.
- **Token additions** — minimum set: `--sp-3: 12px` (only NEW token mandated). Tokens explicitly NOT added documented with reasons (`--fs-foot`, `--fs-section`, `--fs-deco-xl`, `--sp-7` all under the 3+-uses threshold OR conditional on a separate plan's resolution).
- **Sweep order** — 9-step file-by-file order, smallest-blast-radius first, so each commit can be verified against `bash scripts/verify-build.sh` before moving on.

## Verification

Per Plan 05-01 §verification list:

| Check | Expected | Result |
|-------|----------|--------|
| `bash -n scripts/lighthouse-audit.sh` | exit 0 | PASS |
| `bash -n scripts/verify-build.sh` | exit 0 | PASS |
| `test -x scripts/lighthouse-audit.sh` | exit 0 | PASS |
| `npm run build` | 7 pages built, no errors | PASS (built in 706ms) |
| `bash scripts/verify-build.sh` Gates 1–22 | all OK | PASS |
| Gate 23 | FAIL (RED until 05-03) | FAIL as expected |
| Gate 24 | already GREEN | GREEN (galleries emit hero <img>) |
| Gate 25 | FAIL — 23 literals (RED until 05-05) | FAIL as expected |
| `.gitignore` allow-list | `git status` shows summary.json as untracked, raw.json hidden | PASS |
| Task 1 verify regex | all 7 grep checks PASS | PASS |
| Task 2 verify regex | all 5 grep checks PASS | PASS |
| Task 3 verify regex | row count ≥ 10 | PASS (48 rows total) |

## Deferred

- **Vercel preview URL.** Plan 05-02 owns the import. `lighthouse-audit.sh` falls back to a default URL placeholder (`caleb-lim-portfolio-git-phase-5-c-lb.vercel.app` per 05-RESEARCH §4.4) — actual URL TBD once Caleb runs `vercel.com/new` against the GitHub repo `C-lb/caleb-lim-portfolio`. Until the preview is live, an actual Lighthouse run can't happen — but the script syntax + plumbing are correct (verified by `bash -n` + `--help`).
- **Live Lighthouse run + summary.json commit.** Wave 0 cannot run Lighthouse end-to-end against a not-yet-deployed preview URL. Plan 05-08 (Wave 2) runs it once Plans 05-02 through 05-07 have landed, then commits the per-route `*-summary.json` files alongside the filled `05-VERIFICATION.md`.

## Deviations from Plan

**None.** Plan executed exactly as written. Two minor judgement points worth flagging:

1. **Gate 24 already GREEN at Wave 0.** Plan §<done> for Task 2 says "Gate 23 and Gate 24 will be RED until Plans 05-03 / 05-04 land." Gate 24 is in fact already GREEN — Astro renders the existing `hero` frontmatter image per tile even pre-D-09 recomposition (the gate's threshold is "≥ piece_count `<img>` elements", which the current build satisfies trivially). Not a deviation; the gate's intent (lock against future regression where a tile emits zero images) is correctly armed. Plan 05-04 will reposition the hero from `opacity: 0.55 watermark` to `LEFT 60% grid cell`, not remove it — Gate 24 should stay GREEN throughout.

2. **TOKEN-MAP table backtick formatting.** Plan §<verify> regex `\| [a-zA-Z0-9_./-]+:[0-9]+` requires the first column to start with `| <path>:<num>` (no backticks). Initial draft used backtick-quoted file:line cells for monospace rendering, which the regex didn't match. Removed backticks from the `File:line` column only — the raw grep inventory in the fenced code block remains untouched, and the other table columns keep their inline-code formatting. Cosmetic-only; no semantic change.

## Auth gates encountered

None.

## Threat Flags

None — Wave 0 is documentation + tooling only. No new network endpoints, no new auth paths, no schema changes, no trust-boundary movement.

## Self-Check: PASSED

- `scripts/lighthouse-audit.sh` exists (committed in b381e2b)
- `scripts/verify-build.sh` modified (committed in 4c9a944) — Gates 23/24/25 verified inline
- `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` exists (committed in cf80a18)
- `.planning/phases/05-mobile-performance-accessibility/05-TOKEN-MAP.md` exists (committed in cf80a18)
- `.gitignore` modified (committed in b381e2b)
- All three task-commit hashes present in `git log --oneline`
