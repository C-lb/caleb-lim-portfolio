---
phase: 04-navigation-secondary-surfaces
verified: 2026-05-18T00:00:00Z
status: human_needed
score: 4/4 success criteria verified (automatable half); 3 manual UAT items pending
overrides_applied: 0
mode: mvp
user_story: "As a hiring manager, I want to move between similar pieces and contact Caleb when I see one I like, so that I can act on interest the moment I have it, without hunting for an email address."
re_verification: null
human_verification:
  - test: "Mailto deliverability — verify mailto link actually delivers"
    expected: "An email sent to caleblimster@gmail.com from a different account arrives in Caleb's inbox within 5 minutes."
    why_human: "External SMTP delivery is unreachable from automation; the mailto attribute audit is GREEN but actual receipt of mail at the inbox can only be confirmed by sending a real email."
    recorded_steps:
      - "Open the splash (or any built page) in a browser. Click the email link in the header."
      - "Send a test message from a non-Gmail account (Outlook, friend's address) to caleblimster@gmail.com."
      - "Wait 5 minutes. Confirm receipt in Caleb's inbox. Record date + sending account in this file under 'Mailto Delivery Record'."
  - test: "Visual chrome placement walk — 5 route shapes"
    expected: "Header (caleb lim / StatusPill / email | linkedin | resume) reads identically on splash, gallery, detail, About, 404."
    why_human: "Grep confirms presence of every attribute and href; visual placement (alignment, spacing, kerning, contrast against page bg) needs the human eye."
    recorded_steps:
      - "Open /, /design, /design/design-real-piece, /about, /404 (visit a non-existent URL like /nope)."
      - "Compare header chrome across the five routes. Confirm wordmark on left, pill in centre, three nav links on right."
      - "Capture one screenshot per route (5 total) and attach to this file under 'Screenshots'."
  - test: "Skip-to-content keyboard walk"
    expected: "Press Tab once on a fresh page load. 'Skip to content' appears top-left. Press Enter — focus jumps past header to <main id='main'>."
    why_human: "Keyboard focus behaviour and the :focus-visible reveal cannot be observed by grep — needs a real keyboard interaction."
    recorded_steps:
      - "Load / in a fresh tab (no other focus state)."
      - "Press Tab. Confirm 'Skip to content' slides into view top-left."
      - "Press Enter. Confirm scroll/focus moves past <header class='topbar'> to <main id='main'>."
      - "Repeat on /about and one detail page."
---

# Phase 4: Navigation & Secondary Surfaces — Verification Report

**Phase Goal (User Story):** *As a hiring manager, I want to move between similar pieces and contact Caleb when I see one I like, so that I can act on interest the moment I have it, without hunting for an email address.*
**Mode:** mvp
**Verified:** 2026-05-18
**Status:** human_needed — automatable contract is **fully satisfied** (verify-build.sh exits 0, ALL GREEN). Three manual UAT items remain.

---

## User Flow Coverage

User story walk-through against built `dist/`:

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| 1. Land on splash | Header chrome present: name → /, email, linkedin, resume — all four affordances visible without hamburger | `dist/index.html` carries `<a href="/">`, `href="mailto:caleblimster@gmail.com"`, `href="https://linkedin.com/in/caleblkr"`, `href="/caleb-lim-resume.pdf"` (all four greps return ≥1) | VERIFIED |
| 2. Navigate to a discipline gallery | Same chrome inherited via `Base.astro` slot | `dist/design/index.html`, `dist/marketing/index.html` both carry the four-affordance chrome | VERIFIED |
| 3. Open a piece | Detail page renders with back-to-category pill + chrome | `dist/design/design-real-piece/index.html` carries `<a href="/design" class="b-cat-back">← graphic / design</a>` + full header | VERIFIED |
| 4. Want to see a similar piece | Same-discipline prev/next at footer (when neighbours exist); single-piece categories correctly omit the nav | Source `src/pages/[category]/[slug].astro:137-152` renders `<nav class="detail-pager" aria-label="other pieces in this discipline">` gated by `{(prev || next) && …}`; Gate 21a confirms absence on single-piece categories (current fixture); Gates 21c + 22 wired for multi-piece coverage | VERIFIED (wiring correct; multi-piece data coverage limited) |
| 5. Return to the gallery | Back-pill works | `<a href="/${category}" class="b-cat-back">` present on every detail page (Gate 21b OK) | VERIFIED |
| 6. Want to act on interest | Contact Caleb via email OR LinkedIn — without hunting for an address | Header chrome on every page provides one-click email/LinkedIn; About page hosts a larger contact block (`<section class="contact">` with two rows: mailto + LinkedIn) | VERIFIED |
| Outcome | "Act on interest the moment I have it, without hunting for an email address" | Every built page surfaces both contact affordances in the header AND the About contact block adds a deliberate landing spot. mailto attribute correctness verified; **actual deliverability requires human UAT.** | VERIFIED (automatable); human UAT pending |

---

## Success Criteria Verification

### SC1: Site header on every page — four affordances visible on desktop ≥768px

| Affordance | Selector | Built-page coverage | Status |
|---|---|---|---|
| Logo/name → splash | `<a href="/" class="brand">caleb lim</a>` | Splash, gallery, detail, About, 404 — 7/7 pages | VERIFIED |
| mailto contact | `<a href="mailto:caleblimster@gmail.com">` | 7/7 pages (Gate 19a OK) | VERIFIED |
| LinkedIn (new tab) | `<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">` | 7/7 pages (Gate 19b OK); attribute trio confirmed by Gate 20 | VERIFIED |
| Resume download | `<a href="/caleb-lim-resume.pdf" download>` | 7/7 pages (Gate 19d OK) | VERIFIED |

**Hamburger check:** No hamburger menu — three nav links render inline in `<nav aria-label="primary">` in `Base.astro:33-37`. Goal phrasing "without hamburger on desktop ≥768px" is satisfied because no responsive collapse below 768px exists yet (Phase 5 owns mobile audit per RESEARCH.md line 206; SC1 only requires visibility at desktop width, not WCAG tap-target compliance).

### SC2: Detail-page prev/next within same discipline + Back to Category

| Component | Source | Built Evidence | Status |
|---|---|---|---|
| Back-pill (`.b-cat-back`) | `src/pages/[category]/[slug].astro:89` | Both detail pages carry `<a href="/${cat}" class="b-cat-back">...</a>` (Gate 21b OK across 2 detail pages) | VERIFIED |
| Detail-pager `<nav>` markup | `src/pages/[category]/[slug].astro:137-152` | Conditionally rendered when `(prev \|\| next)`. Source wiring confirmed correct. Built fixture currently has 1 piece per category → guard correctly suppresses (Pitfall P-3) → Gate 21a's "single/empty — pager correctly absent" branch passes | VERIFIED (wiring); see "Limited Empirical Coverage" below |
| Same-discipline scope lock (no cross-discipline jumps) | `href={`/${prev.category}/${prev.slug}`}` template literal | Gate 21c walks every detail page's pager hrefs and asserts the prefix `/<cat>/`; no offending hrefs found (vacuous on current fixture but contract is enforced at build time) | VERIFIED (contract enforced) |
| Sort parity with gallery | `(a, b) => a.data.order - b.data.order` ASC in both `[category].astro:25` and `[slug].astro:32` | Byte-identical comparator literals; Gate 22 walks gallery → next-chain and asserts the slug sequences match (vacuous on single-piece, but the gate fires when a 2nd piece lands) | VERIFIED |
| getStaticPaths emits prev/next correctly at edges | `prev: toRef(idx > 0 ? sibs[idx - 1] : null)`, `next: toRef(idx < sibs.length - 1 ? sibs[idx + 1] : null)` | Source verified; first piece → prev null, last piece → next null, single-piece → both null (Pitfall P-3 closed) | VERIFIED |

### SC3: About page hosts contact block (email + LinkedIn; Calendly skipped per user lock)

| Element | Built Evidence | Status |
|---|---|---|
| `<section class="contact">` inside `<article class="about">` | `dist/about/index.html` count=1 (Gate 19e OK) | VERIFIED |
| `aria-labelledby="contact-h"` → `<h2 id="contact-h">Get in touch</h2>` | count=1 in dist/about/index.html | VERIFIED |
| mailto row | `<a href="mailto:caleblimster@gmail.com">caleblimster@gmail.com</a>` inside the contact section | VERIFIED |
| LinkedIn row | `<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">linkedin.com/in/caleblkr</a>` inside the contact section | VERIFIED |
| Calendly explicitly absent | `grep -ci calendly dist/about/index.html` returns 0 | VERIFIED (user lock honored) |
| Bio / resume-link / back-pill preserved byte-identical | Existing Phase 2/3 markup untouched per git diff inspection | VERIFIED |

### SC4: External-link audit + mailto deliverability

| Check | Result | Status |
|---|---|---|
| Every outbound `target="_blank"` has `rel="noopener noreferrer"` | Manual loop over every `<a>` tag in every built HTML file: zero `MISS noopener` / `MISS noreferrer` lines. Gate 20 GREEN. Tested across 7 pages × 1-2 outbound links each. | VERIFIED |
| target=_blank counts per page | 1 on splash/galleries/detail/404 (header LinkedIn); **2 on About** (header LinkedIn + contact-block LinkedIn) — expected and correct | VERIFIED |
| Pitfall P-7 (comma-separated rel rejected) | No `rel="noopener,noreferrer"` anywhere in source or dist | VERIFIED |
| mailto delivers to real inbox | **Manual UAT only — cannot be automated.** Mailto attribute is syntactically correct (`href="mailto:caleblimster@gmail.com"`); SMTP delivery requires human confirmation. | HUMAN NEEDED (1) |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/layouts/Base.astro` | Header chrome (4 affordances) + skip-link + `<main id="main">` wrap | VERIFIED (155 lines; Base.astro:29-41 wires the chrome; skip-link at line 29, main wrap at lines 39-41) | All four anchors emitted; aria-current omitted via `isHome ? 'page' : undefined` (Pitfall P-4) |
| `src/pages/[category]/[slug].astro` | Extended getStaticPaths with prev/next + detail-pager nav + scoped CSS | VERIFIED (320 lines; getStaticPaths at lines 18-50 builds byCategory + sorts + findIndex; pager markup at 137-152; CSS at 267-319) | Sort key byte-identical to gallery |
| `src/pages/about.astro` | Contact section appended below resume-link | VERIFIED (172 lines; contact section at 28-40; scoped CSS at 112-163) | Phase 2/3 content preserved verbatim |
| `scripts/verify-build.sh` Phase 4 gates | Banner + Gates 19a–f + 20 + 21a/b/c + 22 | VERIFIED | All 11 gates landed; full suite exits 0 |

## Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| Every page extending Base.astro | header chrome links | static `<a>` tags in `<header class="topbar">` | WIRED (7/7 built pages) |
| LinkedIn anchor (header + About contact block) | `rel="noopener noreferrer"` | literal attribute on same `<a>` tag | WIRED |
| getStaticPaths byCategory grouping | props.prev / props.next | build-time sort + findIndex | WIRED (source-verified; runtime-vacuous on current fixture) |
| `<nav class="detail-pager">` | aria-label="other pieces in this discipline" | literal attribute | WIRED |
| pager anchor href | `/${piece.data.category}/${neighbour.slug}` | template literal | WIRED (and locked by Gate 21c) |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| **CONTACT-03** | 04-01 | mailto contact link in header on every page | SATISFIED | Gate 19a — mailto on 7/7 pages |
| **CONTACT-04** | 04-01 | LinkedIn link in header or footer on every page | SATISFIED | Gate 19b — LinkedIn on 7/7 pages, in header |
| **CONTACT-05** | 04-03 | About page hosts slightly larger contact block (email + LinkedIn + optional Calendly) | SATISFIED | Gate 19e GREEN; Calendly explicitly skipped per user lock |
| **PIECE-05** | 04-02 | Detail page footer carries prev/next within same discipline + Back to Category | SATISFIED | Back-pill preserved (Gate 21b); pager wiring source-verified; same-discipline scope locked (Gate 21c); sort parity locked (Gate 22) |

No orphaned requirements — all four phase requirement IDs claimed in plan frontmatter map to verified implementation.

## Verify-Build Gate Status (Build-time contract)

```
Phase 4 gates
=============
  OK: CONTACT-03 mailto present on 7 pages
  OK: CONTACT-04 LinkedIn href present on 7 pages
  OK: home link present on 7 pages
  OK: CONTACT-01 reinforcement resume link present on 7 pages
  OK: CONTACT-05 email + LinkedIn present inside About <article> (Gate 19e)
  OK: landmark + aria-current discipline (Gate 19f)
  OK: external-link safety — every target="_blank" anchor carries noopener+noreferrer (Gate 20)
  OK: design (single/empty, 1 piece) — pager correctly absent on detail pages (Gate 21a)
  OK: marketing (single/empty, 1 piece) — pager correctly absent on detail pages (Gate 21a)
  OK: back-pill present on every detail page (2) — Pitfall P-2 lock (Gate 21b)
  OK: every detail-pager href stays within its discipline (Gate 21c)
  OK: design — single piece, parity walk vacuous (Gate 22)
  OK: marketing — single piece, parity walk vacuous (Gate 22)
==========================
ALL GREEN
exit=0
```

All 11 Phase 4 gates GREEN. Gates 1–18 from Phases 1–3 unchanged. Build clean: 7 pages, 616ms.

## Anti-Pattern Scan

| Pattern | Result |
|---|---|
| Inter font in dist | None |
| Tailwind utility-class tells (`bg-slate`, `text-gray-N`, `rounded-2xl`, `shadow-md`) | None |
| Purple gradient | The grep matched `var(--plum)` in the splash card CSS — that's a maroon/plum custom token, not a Tailwind purple gradient. Not a tell. |
| `framer-motion` (deprecated name) | None |
| `@studio-freight/lenis` (retired name) | None |
| `shadcn` references | None |
| `aria-current="false"` (Pitfall P-4) | None |
| `rel="noopener,noreferrer"` comma-separated (Pitfall P-7) | None |
| TODO/FIXME/PLACEHOLDER in Phase-4-modified files | None |

CLAUDE.md compliance: clean. No new dependencies, no new design tokens, only Phase 3 `var(--*)` consumption.

## Limited Empirical Coverage Note

The detail-pager `<nav>` element does **not currently render** in `dist/` because both populated categories (`design`, `marketing`) have exactly **1 non-draft piece each**. The `(prev || next) && (…)` guard correctly suppresses the nav per Pitfall P-3.

This is **not a failure** — it's the documented contract:
- Source wiring is correct (`getStaticPaths` emits `prev/next` props; JSX renders the `<nav>` when either is non-null; CSS is in place).
- Gate 21a's "single/empty — pager correctly absent" branch verifies this is the intended behaviour for the current fixture.
- Gates 21c (scope lock) + 22 (parity walk) are vacuously satisfied today; they will fire when a 2nd piece is added to either category.
- The multi-piece path is **build-time-correct**: `findIndex` + 1 returns `undefined` when no sibling exists → `toRef(null)` → conditional render suppressed. Adding a 2nd piece to `design` (or any category) triggers the full pager chrome without further code changes.

**Recommendation:** Once Phase 2's content backlog grows to ≥2 pieces in any single discipline, re-run `bash scripts/verify-build.sh` to exercise Gates 21c and 22's non-vacuous paths.

## Human Verification Required (3 items)

See frontmatter `human_verification:` for full recorded-steps. Summary:

### 1. Mailto deliverability
**Test:** Send a test email from a non-Gmail account to `caleblimster@gmail.com`.
**Expected:** Receipt in Caleb's inbox within 5 minutes.
**Why human:** External SMTP delivery cannot be automated.

### 2. Visual chrome placement walk (5 route shapes)
**Test:** Open `/`, `/design`, `/design/design-real-piece`, `/about`, `/404` (visit a non-existent URL). Confirm header reads identically.
**Expected:** Wordmark left, StatusPill centre, three nav links (email | linkedin | resume) right. No visual regression across routes.
**Why human:** Grep confirms attribute presence; visual placement/alignment/contrast needs the human eye.

### 3. Skip-to-content keyboard walk
**Test:** Load `/` in fresh tab. Press Tab. Confirm "Skip to content" slides into view top-left. Press Enter. Confirm focus moves to `<main id="main">`.
**Expected:** Skip-link reveals on focus, Enter navigates past header.
**Why human:** Keyboard focus state + :focus-visible transform cannot be observed by grep.

---

## Records (to be filled by Caleb during UAT)

### Mailto Delivery Record
*(blank — fill when UAT-1 completes: date + sending account + receipt confirmation)*

### Screenshots
*(blank — attach when UAT-2 completes: one PNG per route shape, 5 total)*

### Skip-link Walk Notes
*(blank — fill when UAT-3 completes: confirmation per route)*

---

## Verdict

**Goal-backward assessment:** The phase user-story outcome ("act on interest the moment I have it, without hunting for an email address") is **observably true in the built artifact**:

- Every page surfaces both email (mailto) and LinkedIn in the header — recruiter never has to hunt.
- The About page adds a deliberate landing spot for the recruiter who reads the bio first.
- The piece-detail back-pill returns to the gallery; the prev/next chrome is wired and will activate the moment a category has ≥2 pieces.
- All four ROADMAP Success Criteria pass at the automatable layer.
- All four phase requirement IDs (PIECE-05, CONTACT-03, CONTACT-04, CONTACT-05) are SATISFIED.

The three HUMAN_NEEDED items are well-bounded UAT walks — none of them can fail in a way that would invalidate the wiring already verified. The remaining work is human attestation of: (a) one network round-trip (SMTP delivery), (b) one visual walk, (c) one keyboard interaction.

**Status: human_needed** — automatable contract complete; UAT walks pending Caleb's confirmation.

---

*Verified: 2026-05-18*
*Verifier: gsd-verifier (Claude Opus 4.7)*
