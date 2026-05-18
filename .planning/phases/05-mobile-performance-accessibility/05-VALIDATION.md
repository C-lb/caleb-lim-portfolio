---
phase: 5
slug: mobile-performance-accessibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-18
---

# Phase 5 — Validation Strategy

> Source: `05-RESEARCH.md` §6 Validation Architecture. This project has **no Vitest/Jest/Playwright** — all validation is grep-based shell checks against built HTML in `dist/` plus manual iPhone Safari walks and Lighthouse CLI runs against the Vercel preview URL (D-13, amended 2026-05-18 from Cloudflare Pages). Phase 5 must NOT introduce a unit-test framework — that is explicit scope creep risk flagged by research.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bash smoke tests (`scripts/verify-build.sh`, 854 LOC, Gates 1–22) + manual Lighthouse CLI + manual iPhone Safari walk |
| **Config file** | `scripts/verify-build.sh` |
| **Quick run command** | `npm run build && bash scripts/verify-build.sh` |
| **Full suite command** | `npm run build && bash scripts/verify-build.sh && bash scripts/verify-anti-ai-tells.sh` |
| **Performance gate (NEW)** | `bash scripts/lighthouse-audit.sh <preview-url>` (file does not exist — Wave 0 creates it) |
| **Manual gate** | iPhone Safari real-device walk; recorded in `05-VERIFICATION.md` |
| **Estimated runtime** | ~30 sec (build + verify), ~60–90 sec per Lighthouse run, ~10 min real-device walk |

---

## Sampling Rate

- **After every task commit:** `npm run build && bash scripts/verify-build.sh` (~30 sec). Catches regressions in unchanged Phase 1–4 contracts (content, pdf-rasterization, header chrome, prev/next pager).
- **After every plan wave:** Quick run + visual diff in browser devtools at 700px and 375px breakpoints.
- **Before `/gsd:verify-work`:** Full suite must be green; `lighthouse-audit.sh <preview-url>` recorded; iPhone walk completed.
- **Max feedback latency:** 30 seconds for the build+verify loop.

---

## Per-Task Verification Map

| Req | SC | Behavior | Test Type | Automated Command | File / Gate | Status |
|-----|----|----------|-----------|-------------------|-------------|--------|
| FOUND-01 | SC1 | `.topbar` collapses at ≤700px to icon-row layout (D-01–D-03) | smoke | `grep -F '@media (max-width: 700px)' dist/index.html` + icon SVG presence check | Wave 0 → Gate 23 in `verify-build.sh` | ⬜ pending |
| FOUND-01 | SC1 | All tap targets ≥44×44 px (D-02) | manual + perf | iPhone Safari thumb test; Lighthouse a11y audit flags failures | Wave 0 → `lighthouse-audit.sh` | ⬜ pending |
| FOUND-01 | SC4 | Critical path unbroken on iPhone Safari (splash → /design → piece → resume) | manual-only | Real-device walk recorded in `05-VERIFICATION.md` | Manual | ⬜ pending |
| FOUND-01 | SC5 | Gallery tiles render `<img>` hero (D-09–D-12) | smoke + visual | `grep -c '<img' dist/design/index.html` ≥1; same for `dist/marketing/index.html` | Wave 0 → Gate 24 in `verify-build.sh` | ⬜ pending |
| FOUND-02 | SC2 | LCP <2s on splash on throttled mobile | perf | `npx lighthouse <preview-url> --form-factor=mobile` → JSON `largestContentfulPaint < 2000` | Wave 0 → `lighthouse-audit.sh` | ⬜ pending |
| FOUND-02 | SC2 | Lighthouse Perf ≥85, A11y ≥95 on splash, gallery, detail | perf | Same Lighthouse run, score thresholds (parse JSON) | Wave 0 → `lighthouse-audit.sh` | ⬜ pending |
| FOUND-03 | SC3 | `prefers-reduced-motion: reduce` honored per D-08 exemption policy | manual | Toggle macOS / iOS Accessibility setting; walk site verifying each motion source per RESEARCH §3.4 step 7 | Manual (recorded in `05-VERIFICATION.md`) | ⬜ pending |
| SC6 | SC6 | Zero raw `font-size: Npx` outside `tokens.css` (D-17) | smoke | `! grep -rnE 'font-size:\s*[0-9]+px' src/components/ src/pages/ src/layouts/` exits 0 | Wave 0 → Gate 25 in `verify-build.sh` | ⬜ pending |
| SC6 | SC6 | `--lime` (and any Phase-4 UAT tokens) registered in `tokens.css` with rationale (D-18) | smoke | `grep -F -- '--lime:' src/styles/tokens.css` and comment block check | Wave 0 → Gate 23/25 | ⬜ pending |
| SC6 | SC6 | `--terracotta` use audited — load-bearing or replaced | manual | Source grep + decision recorded in `05-VERIFICATION.md` | Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 builds the test infrastructure required by every subsequent task. None of the per-task checks above can ship green until these exist.

- [ ] `scripts/lighthouse-audit.sh` — wraps `npx lighthouse <url> --form-factor=mobile --output=html,json --output-path=./lighthouse-reports/{route}` for splash, gallery (`/design`), and a detail page (`/design/<one-slug>`). Parses JSON for Perf, A11y, and `largestContentfulPaint`. Exits non-zero on threshold miss. Outputs go to gitignored `./lighthouse-reports/`.
- [ ] `scripts/verify-build.sh` — **Gate 23**: assert `@media (max-width: 700px)` block present in built `dist/index.html` (or compiled style file) AND topbar icon-row markup emits `aria-label` per icon.
- [ ] `scripts/verify-build.sh` — **Gate 24**: assert `<img` count in `dist/design/index.html` ≥ piece-count for the discipline; same for `dist/marketing/index.html`.
- [ ] `scripts/verify-build.sh` — **Gate 25**: assert zero raw `font-size: Npx` (and `font-size: Nrem`) literals under `src/components/`, `src/pages/`, `src/layouts/` via `grep -rnE`. The sketch-locked spacing whitelist (OVERRIDE-03) stays out of scope; this gate is font-size only.
- [ ] `05-VERIFICATION.md` template stub — sections for Lighthouse scores per route, iPhone model + iOS version (D-14), reduced-motion walk checklist, screenshots, `--terracotta` audit decision.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-iPhone critical-path walk | FOUND-01 (SC1, SC4) | PITFALLS.md forbids relying on desktop devtools simulation; Lighthouse mobile preset is Moto G4, not iOS Safari | Open splash on real iPhone; tap each discipline card; on `/design` tap any piece; scroll detail; tap back; tap resume icon; verify PDF opens in system viewer; record iPhone model + iOS version in `05-VERIFICATION.md` |
| Reduced-motion walk | FOUND-03 (SC3) | Per-motion exemption policy under D-08 requires human judgement that exempt motions still fire and global motions truly stop | Toggle macOS System Settings → Accessibility → Display → Reduce Motion; reload site; verify: splash card rest tilts still apply (exempt), lime-dot pulse still pulses (exempt), hover-tilt + click-shake still respond to user input (exempt), scroll-driven reveals become instant (suppressed), magnetic-deflection disables (suppressed). Repeat on iPhone via Settings → Accessibility → Motion → Reduce Motion |
| `--terracotta` audit | SC6 / D-17 | Decision is "re-scope as load-bearing OR replace where it carries semantic weight" — requires reading each usage and deciding intent | Run `grep -rn --include='*.css' --include='*.astro' -- '--terracotta' src/`; for each hit, decide load-bearing vs replace; record decisions in `05-VERIFICATION.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`lighthouse-audit.sh`, Gates 23/24/25, `05-VERIFICATION.md` template)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter once Wave 0 ships

**Approval:** pending
