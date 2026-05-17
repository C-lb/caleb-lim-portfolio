---
phase: 04-navigation-secondary-surfaces
plan: 01
subsystem: layout-chrome
tags: [navigation, header, a11y, external-link-safety, gates, tdd-flavored]
requires:
  - .planning/phases/03-visual-design-system  # Phase 3 design tokens (locked)
  - src/layouts/Base.astro                    # reserved <nav aria-label="primary"> slot
  - src/styles/tokens.css                     # --paper, --ink, --mono, --fs-mono, --sp-* etc.
  - scripts/verify-build.sh                   # Gates 1–18 idiom catalogue
provides:
  - header-chrome                             # four-affordance header (home/mailto/LinkedIn/resume) site-wide
  - external-link-safety-convention           # target="_blank" rel="noopener noreferrer" + Gate 20 enforcement
  - skip-to-content                           # focus-visible skip-link + <main id="main"> wrap (O-2)
  - phase-4-gate-scaffolding                  # banner + Gates 19a–f + 20 in verify-build.sh
affects:
  - every-built-page                          # all 7 dist/**/*.html now carry header chrome
  - plan-04-02                                # detail-pager <nav> must use distinct aria-label (Gate 19f)
  - plan-04-03                                # About contact block must satisfy Gate 19e (currently RED)
tech-stack:
  added: []
  patterns:
    - external-link-safety-trio               # target="_blank" rel="noopener noreferrer" (Pattern S1)
    - aria-current-omit-on-non-current        # Astro 5 drops undefined attributes (Pitfall P-4)
    - skip-to-content-off-screen              # transform: translateY(-200%) until :focus-visible
    - awk-substring-trim-for-scoped-grep      # robust against Astro single-line static output
key-files:
  created: []
  modified:
    - src/layouts/Base.astro                  # +33 lines (chrome wiring + skip-link + main wrap + 5 CSS rules)
    - scripts/verify-build.sh                 # +158 lines (Phase 4 banner + 7 gates)
decisions:
  - "External-link safety landed inline (no <ExternalLink> wrapper) — 1 outbound link in Plan 04-01, total 2 site-wide after 04-03; abstraction not earned"
  - "Skip-to-content link landed in Phase 4 (Open Question O-2 resolved YES) — defensible because Base.astro is already open for chrome edit"
  - "aria-current via {isHome ? 'page' : undefined} not boolean coercion (avoids spec-discouraged aria-current=\"false\")"
  - "Gate 19e scoping rewritten from sed-range to awk-substring-trim (Rule 1 fix) — sed range fails when Astro inlines <article> on same line as header <nav>"
  - "Gate 19e consolidated to one FAIL line ('missing email OR LinkedIn') per plan's authored action body"
metrics:
  duration_minutes: 11
  tasks_completed: 3
  files_modified: 2
  lines_added: ~191
  gates_added: 7
  commits: 3
completed_date: 2026-05-17
---

# Phase 4 Plan 1: Header Chrome + Skip-Link + Phase 4 Gate Scaffolding — Summary

One-liner: Replaced the reserved `<nav aria-label="primary">` placeholder in `Base.astro` with four header affordances (brand→home, mailto, LinkedIn, resume), landed a focus-visible skip-to-content link with `<main id="main">` wrap, and bolted Phase 4 gate scaffolding (banner + Gates 19a–f + 20) onto `verify-build.sh` so every page now ships with recruiter-expected chrome under enforceable build-time gates.

## What Shipped

### Header chrome (site-wide, 7 routes)

Every page that extends `Base.astro` now renders:

```
[caleb lim → /]   [StatusPill]   email | linkedin | resume
```

- **Brand wordmark** wraps `<a href="/">` with `aria-current="page"` ONLY on splash (omitted via Astro 5 undefined-attribute drop on every other route — Pitfall P-4).
- **mailto** to `caleblimster@gmail.com` (CONTACT-03 closed).
- **LinkedIn** to `https://linkedin.com/in/caleblkr` with `target="_blank" rel="noopener noreferrer"` (CONTACT-04 closed). FIRST outbound `target="_blank"` in the codebase — establishes the convention Plan 04-03 inherits.
- **Resume** to `/caleb-lim-resume.pdf` with `download` attribute (CONTACT-01 reinforcement — already shipped on About in Phase 2; now site-wide).

### Skip-to-content + `<main id="main">` wrap (Open Question O-2 resolved YES)

- `<a href="#main" class="skip">Skip to content</a>` is the first child of every `<body>`.
- Off-screen (`transform: translateY(-200%)`) until `:focus-visible`, then slides into view.
- `prefers-reduced-motion: reduce` disables the slide transition.
- Existing `<slot />` is now wrapped in `<main id="main">` so the skip-link has a valid landing target.

### Phase 4 gate scaffolding (`scripts/verify-build.sh`)

Appended before the existing `==========================` summary block:

| Gate | Scope | Asserts | Phase 4 end-state |
|------|-------|---------|-------------------|
| 19a | every built page | mailto:caleblimster@gmail.com present (CONTACT-03) | GREEN |
| 19b | every built page | href="https://linkedin.com/in/caleblkr" present (CONTACT-04) | GREEN |
| 19c | every built page | `<a href="/">` home link present | GREEN |
| 19d | every built page | `<a href="/caleb-lim-resume.pdf" download>` present (CONTACT-01) | GREEN |
| 19e | dist/about/index.html only | mailto + LinkedIn inside `<article>` scope (CONTACT-05) | **RED — handed to Plan 04-03** |
| 19f | site-wide *.html | no `aria-current="false"`; every `<nav>` has `aria-label`; no duplicate `aria-label` per page | GREEN |
| 20 | site-wide *.html | every `target="_blank"` anchor carries both `noopener` AND `noreferrer` inside `rel` | GREEN |

All gates use `fail=1` (not `exit 1`) so failures aggregate to the existing summary at line 532 — no new exit points added. Gates 1–18 untouched, still GREEN.

### External-link safety convention (Pattern S1, FIRST instance in codebase)

```astro
<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer" class="nav-link">linkedin</a>
```

Locked regex pair for Gate 20 (paste verbatim — orchestrator-verified against BSD + GNU grep):

```
rel="([^"]*[[:space:]])?noopener([[:space:]][^"]*)?"
rel="([^"]*[[:space:]])?noreferrer([[:space:]][^"]*)?"
```

Truth table: `rel="noopener noreferrer"` MATCH, `rel="noreferrer noopener"` MATCH, `rel="noopener"` MATCH, `rel="noopener,noreferrer"` no-match (Pitfall P-7 — comma-separated rejected, modern HTML spec defines `rel` as space-separated token list).

## Tap Target Deferment (Phase 5)

Phase 4 ships header links with `padding: 4px 0` (~19px effective height vs WCAG 2.5.8 24×24 minimum / iOS 44×44 ideal). This is intentional — Success Criterion 1 only requires visibility, not tap-target size. Phase 5 (mobile / a11y polish) owns the real-device tap-target audit and mobile collapse decision. RESEARCH.md line 206 documents the trap so Phase 5 doesn't have to rediscover it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Gate 19e scoping was broken under Astro's inlined-template output**

- **Found during:** Task 2 (after wiring chrome, Gate 19e turned GREEN incorrectly).
- **Issue:** The plan's authored Gate 19e body used `sed -n '/<article/,/<\/article>/p'`. Astro 5 emits static `.astro` templates as single long lines, so the header's `<nav>` (containing the same mailto + LinkedIn hrefs that Gate 19e looks for) renders on the SAME physical line as `<article>`. The `sed` range starts at the first line containing `<article` and includes that entire line — falsely capturing the header chrome inside the article scope.
- **Fix:** Replaced the `sed` range with an `awk`-based substring-trim helper (`extract_about_article`) that drops everything before `<article` on the opening line and everything after `</article>` on the closing line. Resilient to both single-line and multi-line Astro output.
- **Files modified:** `scripts/verify-build.sh` (in Task 2's commit, then refined in Task 3's commit).
- **Commits:** `8e5ff23`, `b898793`.

**2. [Rule 1 — Bug] Gate 19e was emitting two FAIL lines per failure, not the plan's authored ONE**

- **Found during:** Task 3 cross-route smoke (the acceptance criterion "exactly ONE Phase 4 FAIL: line that references About / CONTACT-05 / Gate 19e" failed with 2 lines).
- **Issue:** Initial Gate 19e implementation echoed a separate FAIL line for each missing href (email, LinkedIn). Plan body specified a single consolidated line: `FAIL: $ABOUT — CONTACT-05 missing email or LinkedIn inside <article>`.
- **Fix:** Consolidated to one OR-joined FAIL line per the plan's authored action body.
- **Files modified:** `scripts/verify-build.sh`.
- **Commit:** `b898793`.

### CLAUDE.md Compliance

No CLAUDE.md violations — Phase 3 design tokens consumed only (`var(--paper)`, `var(--ink)`, `var(--mono)`, `var(--fs-mono)`, `var(--sp-2)`, `var(--sp-4)`), no Tailwind, no shadcn, no Inter, no Lucide, no `framer-motion`, no `@studio-freight/lenis`. Zero new dependencies. Zero new design tokens.

### Authentication Gates

None — Phase 4 is a build-time markup edit. No external services, no auth flow.

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `grep -c 'Phase 4 gates' scripts/verify-build.sh` ≥1 | PASS (1) |
| `grep -cE '^# Gate 19[a-f]\|^# Gate 20' scripts/verify-build.sh` ≥7 | PASS (8 — 19a/19b/19c/19d/19e/19e-comment/19f/20) |
| `bash -n scripts/verify-build.sh` returns 0 | PASS |
| `npm run build` exits 0, no errors | PASS |
| `bash scripts/verify-build.sh` exits 1 (RED on 19e) | PASS |
| `grep -q 'href="mailto:caleblimster@gmail.com"' dist/index.html` | PASS |
| `grep -q 'href="https://linkedin.com/in/caleblkr"' dist/index.html` | PASS |
| LinkedIn anchor carries target + noopener + noreferrer | PASS (3/3 per-attribute probes) |
| `grep -qE '<a[^>]*href="/caleb-lim-resume\.pdf"[^>]*download' dist/index.html` | PASS |
| `grep -q 'aria-current="page"' dist/index.html` | PASS (count=1) |
| `grep -q 'aria-current="page"' dist/about/index.html` returns 1 (attribute absent) | PASS (count=0) |
| `find dist -name "*.html" -exec grep -l 'aria-current="false"' {} +` empty | PASS |
| `<a href="#main" class="skip"` on splash, about, 404, detail | PASS (1 each) |
| `<main id="main"` wrap on every route | PASS (1 each on splash, about, 404, detail; loose regex needed due to Astro `data-astro-cid-*` splice — substring-correct, literal-fragile) |
| `aria-label="primary"` count on splash | PASS (1) |
| Gates 19a/19b/19c/19d/19f + 20 GREEN | PASS |
| Gate 19e RED with About / CONTACT-05 message | PASS (1 FAIL line) |
| No new CSS custom property defined | PASS (`git diff src/styles/tokens.css` empty; no `--token:` defs in Base.astro diff) |
| Cross-route smoke: 5 route shapes carry mailto+LinkedIn+resume+main-wrap | PASS (splash, design, marketing, about, 404, plus design-real-piece detail) |
| Final line of verify-build.sh output: `FAILED` | PASS |
| `git log -1 --oneline` starts with `feat(04-01):` | PASS |

## Commits

| Hash | Subject |
|------|---------|
| `6babf75` | test(04-01): add Phase 4 gates 19a-f + 20 to verify-build.sh (RED) |
| `8e5ff23` | feat(04-01): wire header chrome + skip-link + main wrap (GREEN 19a-d/f, 20) |
| `b898793` | feat(04-01): consolidate Gate 19e to single FAIL line + cross-route smoke pass |

Three atomic commits; per-task TDD-flavored: RED (gates fail) → GREEN (chrome wired, gates flip) → REFINE (Gate 19e shape).

## Hand-off

- **Plan 04-02 (detail prev/next pager)** is unblocked. Must use `<nav aria-label="other pieces in this discipline">` so Gate 19f's no-duplicate-aria-label rule holds. Plan 04-02 lands Gates 21a/21b/21c + 22 (per VALIDATION.md mapping).
- **Plan 04-03 (About contact block)** is unblocked. Must add a contact block inside `<article>` on `/about` containing both mailto + LinkedIn — Gate 19e flips GREEN on that commit. Should reuse the established external-link safety trio for LinkedIn (Gate 20 will catch any drift).
- **Manual UAT pending:** Caleb sends a test email from a different account to `caleblimster@gmail.com` and confirms receipt within 5 minutes. Record date + sender in `04-VERIFICATION.md` under "Mailto Delivery" (per VALIDATION.md).

## Self-Check: PASSED

- Created files exist: `.planning/phases/04-navigation-secondary-surfaces/04-01-SUMMARY.md` (this file)
- Modified files exist: `src/layouts/Base.astro`, `scripts/verify-build.sh`
- Commits exist: `6babf75`, `8e5ff23`, `b898793` (verified via `git log --oneline -3`)
- Build exits 0; verify-build exits 1 with single Gate 19e FAIL line (intentional RED handed to Plan 04-03)
