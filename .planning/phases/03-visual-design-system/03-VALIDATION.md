---
phase: 3
slug: visual-design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from RESEARCH.md §"Validation Architecture". Phase 3 deliberately ships without a JS test framework — content site, no business logic to unit-test. Verification is grep-based smoke checks + manual UI sweep.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (project pattern from Phase 1+2) — bash smoke checks via `scripts/verify-build.sh` + extended `scripts/verify-anti-ai-tells.sh` |
| **Config file** | `scripts/verify-build.sh` (Phase 1+2 pattern) |
| **Quick run command** | `npm run build` (catches Astro build errors, missing imports) |
| **Full suite command** | `npm run build && npm run test:smoke && bash scripts/verify-anti-ai-tells.sh` |
| **Estimated runtime** | ~30–60s (build dominated; PDF prebuild cached on warm builds) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run test:smoke && bash scripts/verify-anti-ai-tells.sh`
- **Before `/gsd-verify-work`:** Full suite must be green + manual UI sweep on `npm run preview` at 1280px desktop AND ≤900px mobile + manual `ANTI-AI-CHECKLIST.md` walk
- **Max feedback latency:** ~60 seconds for the full suite

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-* | TBD | TBD | SPLASH-01 | — | Splash above fold @ 1280px shows portrait + name + roles + bio + question + 4 cards | manual UI sweep | `npm run preview` + manual @1280px | ❌ W0 (no automated viewport tester; manual is the right bar) | ⬜ pending |
| TBD-* | TBD | TBD | SPLASH-02 | — | Each card shows category, accent color, routes correctly | smoke (grep dist) | `bash scripts/verify-build.sh` (extended) | ❌ W0 | ⬜ pending |
| TBD-* | TBD | TBD | SPLASH-03 | — | Galleries render asymmetric grid (B-template marker present in dist HTML) | smoke (grep dist/<cat>/index.html for `b-pieces` class) | extend `verify-build.sh` | ❌ W0 | ⬜ pending |
| TBD-* | TBD | TBD | SPLASH-04 | — | Empty discipline drops splash card AND 404s its route | smoke (mark category draft, rebuild, verify dist/<cat>/index.html absent + splash card count) | extend `verify-build.sh` | ❌ W0 | ⬜ pending |
| TBD-* | TBD | TBD | SPLASH-05 | — | 404 page returns HTTP 404 on CF Pages preview | manual curl | `curl -sI <preview-url>/no-such-page` → expect `HTTP/2 404` | ❌ W0 (manual at deploy) | ⬜ pending |
| TBD-* | TBD | TBD | VISUAL-01 | — | Bricolage + Fraunces + JetBrains; no Inter; preload + swap | grep + DevTools | `bash scripts/verify-anti-ai-tells.sh` (font block) | ❌ W0 | ⬜ pending |
| TBD-* | TBD | TBD | VISUAL-02 | — | Color tokens (paper, ink, terracotta, cobalt, lime, plum) present + accent flow | grep dist for hex values | extend `verify-anti-ai-tells.sh` | ❌ W0 | ⬜ pending |
| TBD-* | TBD | TBD | VISUAL-03 | — | Rotated cards + decorative geometry (outline circle / italic numeral / dotted line / triangle) | manual UI sweep | manual @1280px on preview | ❌ W0 | ⬜ pending |
| TBD-* | TBD | TBD | VISUAL-04 | — | Anti-AI-tell list verifiably absent (no Inter, no shadcn, no purple gradient, no lucide, no bento, no "Built with X") | grep + manual | `bash scripts/verify-anti-ai-tells.sh` + `ANTI-AI-CHECKLIST.md` walk | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs filled in by gsd-planner once plans are split.*

---

## Wave 0 Requirements

- [ ] `scripts/verify-anti-ai-tells.sh` — new file. Automates VISUAL-04 grep checks: `grep -ri "\\bInter\\b" src/ public/ astro.config.mjs` (must return 0 results); `grep -E "lucide|@radix|shadcn|tailwind" package.json` (must return 0); `grep -i "purple\\|gradient" dist/_astro/*.css` (must return 0); `grep -i "built with\\|made with" dist/**/*.html` (must return 0).
- [ ] `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` — new file. Manual sweep checklist enumerating each VISUAL-04 item + each ROADMAP SC6 item with pass/fail checkboxes for the executor to walk before declaring the phase done.
- [ ] Extend `scripts/verify-build.sh` with assertions:
  - `dist/index.html` mentions Bricolage in inline / linked CSS
  - `dist/<each-populated-category>/index.html` exists (and `<empty-category>/index.html` does NOT exist)
  - `dist/404.html` exists and contains the 4-card repeat
  - Populated category count == splash card count (parse splash dist HTML)
- [ ] No JS test framework install — explicit non-task. Phase 3 does NOT introduce vitest / jest / playwright. Pattern from Phase 1+2.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Splash above fold @ 1280px viewport | SPLASH-01 | No automated viewport screenshot tester in stack; manual is the right bar for a single-recruiter portfolio | `npm run preview`; resize browser to exactly 1280×800; load `/`; confirm portrait + name + roles + bio + question + 4 cards all visible without scroll |
| 404 returns HTTP 404 (not 200) on Cloudflare Pages | SPLASH-05 | Cannot verify locally — CF Pages serves `dist/404.html` with 404 status; `astro preview` may not replicate exactly | After preview deploy: `curl -sI <preview-url>/no-such-page` → assert `HTTP/2 404` line in response headers |
| Decorative geometry visually correct | VISUAL-03 | CSS rotation + decorative element placement is a visual judgment, not a unit test | Manual UI sweep on preview at 1280px; walk all 4 splash cards, all 4 gallery pages, all detail pages, 404. Compare against sketch 001 .variant-b for fidelity. |
| Anti-AI-tell visual sweep | VISUAL-04, ROADMAP SC6 | Some tells (e.g. "shadcn-style card", "centered hero with gradient") are pattern-judgments not greppable | Walk `ANTI-AI-CHECKLIST.md` end-to-end on `npm run preview`. Reviewed by `/gsd-code-review` (greps) + `/gsd-ui-review` (visual). Phase exit blocked until both pass. |
| Mobile collapse @ ≤900px doesn't break layout | SPLASH-03 (asymmetric gallery), VISUAL-* | Phase 3's bar is "doesn't BREAK mobile"; Phase 5 owns iPhone-Safari verification | Resize browser to 375px, 768px, 900px; load `/`, `/design`, `/marketing`, `/finance`, `/personal` (if shipped), one detail page, `/about`, `/404`. Confirm no horizontal scroll, no overlapping elements, no clipped text. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (filled in by planner)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (filled in by planner)
- [ ] Wave 0 covers all MISSING references (Wave 0 = `verify-anti-ai-tells.sh` + `ANTI-AI-CHECKLIST.md` + `verify-build.sh` extensions)
- [ ] No watch-mode flags (smoke scripts run once, exit)
- [ ] Feedback latency < 60s (build + smoke + grep)
- [ ] `nyquist_compliant: true` set in frontmatter (after planner fills task IDs and verifies sampling continuity)

**Approval:** pending
