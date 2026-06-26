---
phase: 6
plan: 01
subsystem: verification / scaffolding
tags: [phase-6, wave-0, verification-scaffolding, gates, nyquist]
dependency-graph:
  requires: []
  provides:
    - 06-VERIFICATION.md template (SC1-SC6 sign-off, cross-browser matrix, domain log, walks, lighthouse anchors)
    - scripts/verify-build.sh Gates 26a/26b/26c/27 (RED pre-Wave-1, design-by-intent)
    - README.md scaffold with 6 screenshot placeholders for SC3 walkthrough
  affects:
    - Plan 06-02 (sitemap+robots) — will turn Gates 26b, 26c GREEN
    - Plan 06-03 (OG card+meta) — will turn Gate 26a GREEN
    - Plan 06-05 (D-06 stragglers) — will turn Gate 27 GREEN across 3 files
    - Plan 06-08 (phase-exit) — populates the cross-browser matrix, reduced-motion walk, screenshot slots
tech-stack:
  added: []
  patterns:
    - verify-build.sh gate header convention (Gate NN (Phase X) + RED-expected callout)
    - 05-VERIFICATION.md template structure mirrored for Phase 6
key-files:
  created:
    - .planning/phases/06-deploy-maintenance-handoff/06-VERIFICATION.md
    - README.md
  modified:
    - scripts/verify-build.sh
decisions:
  - "Gates 26a/26b/26c/27 are intentionally RED pre-Wave-1 — they document the work each downstream plan must satisfy. This is the verification-first pattern from Phase 5 (Gates 23/24/25 also shipped RED in Plan 05-01)."
  - "Phase 6 banner placed after the Phase 5 banner in verify-build.sh — chronological gate order is the project convention; do not interleave."
  - "README.md committed empty-of-prose, only screenshot placeholders + minimal scaffolding — Wave 3 (Plan 06-08) owns the actual contributing prose and screenshot files."
metrics:
  duration_minutes: ~25
  completed: 2026-05-20
  tasks: 3
  commits: 3
---

# Phase 6 Plan 01: Verification scaffolding Summary

Wave 0 scaffolding complete. Three artefacts created/modified to establish the RED-then-GREEN verification harness Phase 6 will work against. All Phase 1-5 gates (1-25) remain GREEN; new Gates 26a, 26b (×2), 26c, 27 (×3) emit FAIL as designed — these mark the work Wave 1+ plans will close.

## What changed

**Task 1 — Scaffold 06-VERIFICATION.md (commit 5f26746).**
Mirrored the structure of `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md`:
- SC sign-off table (SC1 HTTPS+custom-domain, SC2 cross-browser, SC3 Caleb dry-run, SC4 OG+sitemap, SC5 detail LCP <2000ms, SC6 D-06 stragglers cleared) with empty sign-off + evidence columns
- Real-Device Test Rig section (iPhone 15 / iOS 26.4.2 carried from Phase 5)
- Critical-Path Walk template
- Reduced-Motion Walk template (3 files × StatusPill + category + slug)
- Lighthouse anchors (5-route mobile audit, baseline 3121ms LCP from Plan 05-08)
- 5×4 Cross-Browser Matrix (routes: /, /design, /design/<slug>, /about, /<bad-404> × browsers: iPhone Safari, Android Chrome, desktop Safari, desktop Firefox) — empty PASS/FAIL cells
- Domain Availability Check Log with primary (caleblim.com) + 3 D-08 fallback rows (caleblim.co, caleb.work, caleblimkr.com) — empty status/timestamp/registrar columns

**Task 2 — Append Phase 6 gates to verify-build.sh (commit 6f07e00).**
New banner `Phase 6 gates / =============` after the Phase 5 block. Four gate blocks added:
- **Gate 26a** — `public/og.png` present + 1200×630 PNG dimensions (file-magic + identify-style check). Anchors SC4 / D-03. Expected RED until Plan 06-03 lands the OG image.
- **Gate 26b** — `dist/sitemap-index.xml` + `dist/sitemap-0.xml` present post-`npm run build`. Anchors SC4 / D-04 (@astrojs/sitemap integration). Expected RED until Plan 06-02 wires the integration. Emits two separate FAIL lines so missing-index vs missing-page-list are distinguishable.
- **Gate 26c** — `public/robots.txt` present + contains `Sitemap:` directive. Anchors SC4 / D-04. Expected RED until Plan 06-02.
- **Gate 27** — `transition: none` absent inside `prefers-reduced-motion` blocks across the three D-06 files: `src/components/StatusPill.astro`, `src/pages/[category].astro`, `src/pages/[category]/[slug].astro`. Uses `perl -0777` multi-line capture to span the media query block. Anchors SC6 / D-06. Expected RED until Plan 06-05 lands the cleanup. Emits three separate FAIL lines (one per file) so partial cleanup is observable.

**Task 3 — README.md scaffold (commit 8bb25ea).**
Minimal repo-root README with six numbered HTML-comment placeholders:
- `<!-- 01-open-github-dev.png -->`
- `<!-- 02-create-piece-folder.png -->`
- `<!-- 03-add-frontmatter.png -->`
- `<!-- 04-add-hero-image.png -->`
- `<!-- 05-commit-and-push.png -->`
- `<!-- 06-piece-live-on-prod.png -->`

Wave 3 Plan 06-08 will fill the contributing prose alongside the screenshot files at `docs/contributing/`.

## Verification

Ran `bash scripts/verify-build.sh` (after `npm run build`):
- **Gates 1-25:** all OK (no regression introduced by the Phase 6 banner block)
- **Gate 26a:** FAIL — `public/og.png missing` (expected; SC4 / D-03 — satisfied by Plan 06-03)
- **Gate 26b:** FAIL × 2 — `dist/sitemap-index.xml missing`, `dist/sitemap-0.xml missing` (expected; SC4 / D-04 — satisfied by Plan 06-02)
- **Gate 26c:** FAIL — `public/robots.txt missing` (expected; SC4 / D-04 — satisfied by Plan 06-02)
- **Gate 27:** FAIL × 3 — `StatusPill.astro`, `[category].astro`, `[slug].astro` all contain `transition:none` inside `prefers-reduced-motion` blocks (expected; SC6 / D-06 — satisfied by Plan 06-05)

Total: 25 GREEN + 7 RED = correct pre-Wave-1 state.

## Deviations

None.

## Commits

```
5f26746 docs(06/01): scaffold 06-VERIFICATION.md from 05 template
6f07e00 feat(06/01): add Phase 6 gates 26a/b/c + 27 to verify-build.sh
8bb25ea docs(06/01): scaffold README.md at repo root with 6 screenshot placeholders
```

## Handoff to Wave 1

Wave 1 plans (06-02, 06-04, 06-06) run in parallel and depend only on this scaffold:
- **06-02** (sitemap+robots) — turns Gates 26b (×2) and 26c GREEN, leaves Gate 26a and Gate 27 (×3) RED
- **06-04** (detail-page LCP `widths` fix) — no gate impact; verified by Wave 4 Lighthouse re-audit
- **06-06** (doc-rot amendments in CLAUDE.md / PROJECT.md) — doc-only, no gate impact

Wave 0 → Wave 1 transition is safe; no shared file contention.
