---
phase: 04-navigation-secondary-surfaces
plan: 03
subsystem: about-contact-block
tags: [navigation, about, contact-block, external-link-safety, a11y, gates]
requires:
  - .planning/phases/04-navigation-secondary-surfaces/04-01-SUMMARY.md  # header chrome + Gate 19e RED stub + external-link-safety convention
  - src/pages/about.astro                                               # Phase 2/3 bio + resume-link + back-pill (preserved byte-identical)
  - src/styles/tokens.css                                               # Phase 3 tokens locked (consumed via var(...))
  - scripts/verify-build.sh                                             # Gate 19e definition (added by Plan 04-01)
provides:
  - about-contact-block                                                 # CONTACT-05 closed — email + LinkedIn rows below resume-link
  - second-external-link-safety-occurrence                              # SECOND <a target="_blank" rel="noopener noreferrer"> in codebase
affects:
  - dist/about/index.html                                               # Gate 19e flips RED → GREEN; target="_blank" count goes 1 → 2 (header + about-block)
  - phase-4-completion                                                  # final Phase 4 gate; verify-build.sh now exits 0 across all 19+20 gates
tech-stack:
  added: []
  patterns:
    - cro-vocabulary-reuse                                              # contact labels copy CRO label typography from [category]/[slug].astro:164–172
    - external-link-safety-trio                                         # target="_blank" rel="noopener noreferrer" (Pattern S1, second occurrence)
    - scoped-css-no-new-tokens                                          # Phase 3 token consumption only; zero `--<name>:` definitions added
    - independent-media-breakpoint                                      # new 600px @media added alongside existing 900px (different responsive scope per PATTERNS.md)
key-files:
  created:
    - .planning/phases/04-navigation-secondary-surfaces/04-03-SUMMARY.md
  modified:
    - src/pages/about.astro                                             # +71 lines: contact <section> + scoped CSS + 600px @media
decisions:
  - "Calendly skipped — user lock and researcher both confirmed; CONTACT-05 'optional Calendly' clause treated as opt-out"
  - "Contact block reuses CRO label vocabulary (mono uppercase, 0.16em tracking, opacity 0.6) verbatim from detail pages — consistent site grammar"
  - ".contact-list a restates font-family: var(--serif) because <section class=\"contact\"> is OUTSIDE .about p scope (Phase 2/3 anchor rule scoped to .about p a only)"
  - "Separate 600px @media block (NOT merged into existing 900px) per PATTERNS.md — the two breakpoints scope different selectors and stay independent"
  - "Visible mailto text matches href (caleblimster@gmail.com); visible LinkedIn text omits protocol (linkedin.com/in/caleblkr) per readability convention"
  - "Task 2 was verify-only — Plan 04-03 ships in ONE commit (c8d1cff) per plan's 'One commit, two tasks' header"
metrics:
  duration_minutes: 4
  tasks_completed: 2
  files_modified: 1
  lines_added: 71
  commits: 1
  gates_flipped_to_green: 1
completed_date: 2026-05-17
---

# Phase 4 Plan 3: About Contact Block — Summary

One-liner: Appended a `<section class="contact">` to `src/pages/about.astro` below the existing `.resume-link` paragraph carrying two rows (email + LinkedIn) styled with CRO label vocabulary reused from detail pages — closing CONTACT-05, flipping Gate 19e GREEN, and bringing `bash scripts/verify-build.sh` to exit 0 across the full Phase 4 gate suite.

## What Shipped

### Contact block markup (about.astro lines 25–39)

Inserted between the existing `.resume-link` paragraph and the closing `</article>`:

```astro
<section class="contact" aria-labelledby="contact-h">
  <h2 id="contact-h">Get in touch</h2>
  <ul class="contact-list">
    <li>
      <span class="label">email</span>
      <a href="mailto:caleblimster@gmail.com">caleblimster@gmail.com</a>
    </li>
    <li>
      <span class="label">linkedin</span>
      <a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">linkedin.com/in/caleblkr</a>
    </li>
  </ul>
</section>
```

- **Two rows only** — no Calendly, no "schedule a call" affordance (user lock + researcher confirm).
- **Mailto first, LinkedIn second** — same ordering as header chrome (Plan 04-01).
- **Visible-text convention:** mailto text === href body; LinkedIn text strips `https://` for readability.
- `aria-labelledby` ties the `<section>` to the `<h2 id="contact-h">` for screen-reader landmark discovery.

### Scoped CSS — CRO vocabulary reuse, zero new tokens

```css
.contact            /* flex column, gap var(--sp-4), margin-top var(--sp-5) */
.contact h2         /* mono uppercase 0.16em tracking opacity 0.6 — CRO label vocab */
.contact-list       /* flex column, gap var(--sp-2) */
.contact-list li    /* grid 100px 1fr, gap var(--sp-4), baseline align */
.contact-list .label /* mono uppercase 0.16em tracking opacity 0.6 — identical to .cro .label */
.contact-list a     /* serif body, ink, underline 1px 0.18em offset — mirrors .about p a */
.contact-list a:hover, :focus-visible  /* terracotta hover, ink outline focus */

@media (max-width: 600px) {
  .contact-list li { grid-template-columns: 1fr; gap: var(--sp-1); }  /* labels stack above values */
}
```

The `.contact-list .label` and `.contact h2` rules copy `[category]/[slug].astro:164–172` verbatim — the contact block reads as the same vocabulary as the Context/Role/Outcome labels on detail pages. This is intentional grammar reuse, not a coincidence.

The `.contact-list a` rule restates `font-family: var(--serif)` because the new `<section class="contact">` is outside the `.about p` selector scope (Phase 2/3 body-anchor underline rule is scoped to `.about p a` only).

### External-link safety — SECOND codebase occurrence

The LinkedIn anchor carries the `target="_blank" rel="noopener noreferrer"` trio established by Plan 04-01's header anchor. This is now the SECOND occurrence in the codebase:

| Occurrence | File | Selector | Plan |
|------------|------|----------|------|
| 1st | `src/layouts/Base.astro` | header `.nav-link` | 04-01 |
| 2nd | `src/pages/about.astro` | `.contact-list a` (LinkedIn row) | 04-03 (this plan) |

Gate 20 (added by Plan 04-01) policed both at build time — `dist/about/index.html` now carries `target="_blank"` count of 2 (vs 1 for every other route); every page in the site passes the noopener+noreferrer assertion.

The wrapper-component question (whether to extract an `<ExternalLink>` Astro component) stays deferred: two total outbound occurrences across the codebase does not earn the abstraction. Defer to Phase 5 if more outbound links are added.

### Calendly intentionally skipped (decision recorded)

CONTACT-05 requirement text reads "email + LinkedIn + optional Calendly". User lock + researcher both flagged Calendly as skip:
- **User signal:** treating Calendly as inappropriate for the recruiter funnel (calendar booking presumes outreach already in motion; the contact block is for initiating outreach).
- **Researcher signal:** 04-RESEARCH.md flagged Calendly as not yet validated UX-wise for a portfolio context.
- **Implementation:** zero Calendly markup, zero CSS scaffolding, zero conditional rendering. Adding it later requires a new plan + a third occurrence of the external-link-safety trio.

Verified at build time: `grep -i 'calendly' dist/about/index.html` returns no matches.

### Phase 3 token discipline maintained

`git diff src/pages/about.astro | grep -E '^\+\s*--[a-z][a-z0-9-]+\s*:' | wc -l` returns 0 — no new CSS custom properties introduced. The contact block consumes only existing tokens: `--paper`, `--ink`, `--terracotta`, `--serif`, `--mono`, `--fs-body`, `--fs-mono`, `--sp-1`, `--sp-2`, `--sp-4`, `--sp-5`.

Note: the spacing scale is intentionally gapped (no `--sp-3`, no `--sp-7`). The 600px breakpoint's `gap: var(--sp-1)` (4px) for stacked-label mobile fallback is the smallest token that fits the visual rhythm.

## Phase 4 Gate Suite Status — ALL GREEN

`bash scripts/verify-build.sh` now returns exit 0 across the full suite (Phases 1+2+3+4):

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
==========================
ALL GREEN
```

Gate 19e flipped RED → GREEN; this was Plan 04-01's last unresolved stub and the final Phase 4 gate.

The Phase 4 gate suite is now fully closed at the build-time-automatable layer. Manual UAT (mailto deliverability walk + visual chrome walk) is the remaining contract per `04-VALIDATION.md` Manual-Only Verifications — those cannot be automated and depend on a human sending a test email + visually inspecting cross-route consistency.

## Preserved Verbatim (Phase 2/3 Content Contracts)

- **Back-pill** (`<a href="/" class="b-cat-back">← splash</a>`) — Phase 3 wiring unchanged.
- **`<h1>Caleb Lim</h1>`** — Phase 3 typography unchanged.
- **Bio paragraph** (`I'm Caleb Lim. I work across four lanes...`) — Phase 2 D-12/D-14 contract preserved byte-identical.
- **Resume-link paragraph** (`<a href="/caleb-lim-resume.pdf" download>Download resume (PDF) →</a>`) — Phase 2 ABOUT-01 + CONTACT-01 contract preserved byte-identical.
- **Existing 900px `@media` block** — NOT modified; the new 600px block is independent.
- **All existing CSS rules** (`.about`, `.b-cat-back`, `.about h1`, `.about p`, `.about p a`, `.resume-link a`) — byte-identical.

## Deviations from Plan

None — plan executed exactly as written.

Task 2's plan body called for an explicit second commit step, but the plan header reads "One commit, two tasks" and Task 2's `<action>` is verify-only (no file edits beyond Task 1). Task 1's commit `c8d1cff` carries the full plan's work; Task 2 ran the full verify-build.sh suite + external-link audit as documentation/verification. Treating this as the intended structure (single feat commit, second task is a verification pass) per the plan header.

## Threat Surface Resolution

Per `04-03-PLAN.md` `<threat_model>`:

| Threat ID | Component | Disposition | Resolution |
|-----------|-----------|-------------|------------|
| T-04-09 | About LinkedIn anchor — reverse tabnabbing | mitigate | `rel="noopener"` emitted; Gate 20 GREEN |
| T-04-10 | About LinkedIn anchor — Referer leak | mitigate | `rel="noreferrer"` emitted; Gate 20 GREEN |
| T-04-11 | Doubled mailto scraper exposure | accept | Documented as accepted (same risk profile as Plan 04-01 T-04-03; scrapers index per-page, not per-occurrence) |

No new threat surface introduced beyond what the plan's threat register anticipated.

## Self-Check: PASSED

- File `src/pages/about.astro` modified — FOUND (`git log -1 --name-only` shows it).
- Commit `c8d1cff` exists — FOUND (`git log --oneline | grep c8d1cff`).
- File `.planning/phases/04-navigation-secondary-surfaces/04-03-SUMMARY.md` created — FOUND (this file).
- `bash scripts/verify-build.sh; echo $?` returned 0 — VERIFIED.
- Final line `ALL GREEN` present — VERIFIED.
- Zero `FAIL:` lines — VERIFIED.
- `grep -c 'target="_blank"' dist/about/index.html` returned 2 — VERIFIED.
- `grep -c 'calendly' dist/about/index.html` returned 0 — VERIFIED.
- No new CSS custom property defined — VERIFIED (count=0).
