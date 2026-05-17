---
phase: 4
slug: navigation-secondary-surfaces
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-15
updated: 2026-05-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Populated by gsd-planner from `## Validation Architecture` in 04-RESEARCH.md.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash + grep + sed via `scripts/verify-build.sh` (no node test runner; Phase 3 established gates 1–18) |
| **Config file** | `scripts/verify-build.sh` |
| **Quick run command** | `bash scripts/verify-build.sh` |
| **Full suite command** | `npm run build && bash scripts/verify-build.sh` |
| **Estimated runtime (quick)** | ~3 s — pure shell + grep over pre-built `dist/` (existing Phases 1–3 take ~2 s; Phase 4 adds Gates 19a–f + 20 + 21a/b/c + 22 = ~1 s additional) |
| **Estimated runtime (full)** | ~25 s — `npm run build` ~22 s + script ~3 s (measured on Phase 3 baseline; PDF rasterization is cached so cold builds are slower the first time) |
| **Max feedback latency** | 30 s end-to-end per task commit |

---

## Sampling Rate

- **After every task commit:** Run `bash scripts/verify-build.sh` (~3 s). Catches regressions of the gate the task was meant to flip GREEN.
- **After every plan completion:** Run `npm run build && bash scripts/verify-build.sh` (~25 s). Confirms gate-level + build-level integrity.
- **Before `/gsd-verify-work`:** Full suite GREEN + manual mailto deliverability walk (UAT — see Manual-Only Verifications below).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-T1 | 04-01 | 1 (Wave 0 within plan) | CONTACT-03/04/05 stubs, infra | T-04-01..05 | Gates 19a–f + 20 defined in verify-build.sh; RED state until chrome lands | bash unit (syntax) + grep on script | `bash -n scripts/verify-build.sh; grep -c 'Phase 4 gates' scripts/verify-build.sh` | yes (extending existing) | ⬜ pending |
| 04-01-T2 | 04-01 | 1 | CONTACT-03, CONTACT-04 | T-04-01, T-04-02, T-04-05 | Header chrome rendered site-wide; skip-link + `<main>` wrap; aria-current omitted on non-splash | static HTML grep | `npm run build && bash scripts/verify-build.sh` — Gates 19a/19b/19c/19d/19f + 20 GREEN; 19e RED | yes | ⬜ pending |
| 04-01-T3 | 04-01 | 1 | CONTACT-03, CONTACT-04 | n/a | Commit landed; route walk confirms chrome on splash + galleries + detail + about + 404 | bash route walk + git log | `bash scripts/verify-build.sh; rc=$?; [[ $rc -eq 1 ]] && grep -cE '^  FAIL:' /tmp/p4p1.log == 1` | yes | ⬜ pending |
| 04-02-T1 | 04-02 | 2 | PIECE-05 | T-04-06, T-04-07 | getStaticPaths emits prev/next props; pager rendered with same-discipline-scoped hrefs; back-pill preserved | astro build + grep | `npm run build && grep -qE 'aria-label="other pieces in this discipline"' $(find dist -mindepth 3 -name index.html \| head -1)` | yes | ⬜ pending |
| 04-02-T2 | 04-02 | 2 | PIECE-05 | T-04-06, T-04-08 | Gates 21a/21b/21c + 22 GREEN; cross-discipline scope locked; gallery-order parity walk passes | bash + grep | `bash scripts/verify-build.sh 2>&1 \| grep -cE 'OK:.*(pager present\|back-pill\|pager href\|pager next-chain)'` returns 4+ | yes | ⬜ pending |
| 04-02-T3 | 04-02 | 2 | PIECE-05 | n/a | Single Phase 4 FAIL remaining is Gate 19e (Plan 04-03's territory) | bash | `bash scripts/verify-build.sh \| grep -cE '^  FAIL:'` returns 1 | yes | ⬜ pending |
| 04-03-T1 | 04-03 | 2 | CONTACT-05 | T-04-09, T-04-10, T-04-11 | About contact block renders inside `<article>`; mailto + LinkedIn rows; Calendly absent | static HTML grep | `npm run build && sed -n '/<article/,/<\/article>/p' dist/about/index.html \| grep -qE 'href="mailto:.*caleblimster.*"'` + `! grep -qi calendly dist/about/index.html` | yes | ⬜ pending |
| 04-03-T2 | 04-03 | 2 | CONTACT-05 | n/a | Gate 19e flips GREEN; full suite ALL GREEN; commit landed | bash | `bash scripts/verify-build.sh; rc=$?; [[ $rc -eq 0 ]] && grep -q 'ALL GREEN' /tmp/p4p3-done.log` | yes | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **scripts/verify-build.sh extension** — folded into Plan 04-01 Task 1 as the FIRST task in the phase (RED-state gate scaffolding before any chrome lands). Gates 19a/19b/19c/19d/19e/19f + 20 land in Plan 04-01 Task 1; Gates 21a/21b/21c + 22 land in Plan 04-02 Task 2 (after Plan 04-02 Task 1 wires the prev/next markup that those gates assert).

The reason 21+22 live in Plan 04-02 (NOT in 04-01's Wave 0) is that those gates assert specific class names (`detail-pager`, `pager-link`) authored in Plan 04-02 Task 1 — co-locating gate-and-implementation in the same plan keeps the assertion contract readable.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| mailto link delivers to real inbox | CONTACT-03 (SC4) | Cannot automate external SMTP delivery confirmation | After Phase 4 commits land, Caleb sends a test email from a different account (e.g. personal Outlook or a friend's address) to `caleblimster@gmail.com`. Verify receipt within 5 minutes. Record date + sending account in `.planning/phases/04-navigation-secondary-surfaces/04-VERIFICATION.md` under "Mailto Delivery". |
| Visual chrome placement consistency across all routes | CONTACT-04 (SC1) | Layout regression requires human eye; grep can confirm presence but not visual placement | Browser walk after Plan 04-01 lands: splash (`/`) → each gallery (`/design`, `/marketing`, plus any populated others) → at least one piece detail → `/about` → `/404` (visit a non-existent URL). Confirm header reads identically on each route. Capture one screenshot per route shape (5 total) and attach to 04-VERIFICATION.md. |
| Tap target ≥44px on desktop ≥768px | CONTACT-04 (SC1) | Phase 5 owns mobile audit; Phase 4 only confirms desktop affordances visible (NOT yet WCAG-compliant per RESEARCH.md line 206) | Inspect element on each header link in desktop Chrome at 1280px viewport; record measured height + padding in 04-VERIFICATION.md. PHASE 4 INTENT: visible chrome only. WCAG 2.5.8 (24×24 minimum) — leave a note for Phase 5 to verify on real devices. |
| Skip-to-content link works on keyboard | CONTACT-04 SC1 (related) | Keyboard interaction requires user input; can't be tested by grep alone | Load `/` in a fresh tab, press Tab once; confirm "Skip to content" appears top-left. Press Enter; confirm focus jumps past header to `<main id="main">`. Repeat on `/about` and one detail page. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify lines or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has automated verify)
- [x] Wave 0 covered by Plan 04-01 Task 1 (gate scaffolding) + Plan 04-02 Task 2 (prev/next-specific gates)
- [x] No watch-mode flags (single-shot bash invocations)
- [x] Feedback latency < 30 s per task commit
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner-approved 2026-05-16 — ready for `/gsd-execute-phase 4`
