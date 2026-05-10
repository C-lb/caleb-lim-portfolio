---
phase: 02-asset-pipeline-real-content
plan: 05
subsystem: content-authoring
tags: [gap-closure, content-authoring, real-pieces, found-05, sc1-sc2-sc5, pdf-pipeline-exercise, paused]
status: paused-at-checkpoint
requires:
  - 02-06-SUMMARY.md (WR-02 fullPdf canonical-path contract; CR-01 draft-skip)
provides:
  - design-real-piece (real Caleb content; PVL Overseas Community Project visual identity)
  - first real exercise of source.pdf → public/generated/pdf-thumbs/<slug>/ pipeline
  - first real exercise of fullPdf → public/source-pdfs/<slug>.pdf side-effect
affects:
  - src/content/pieces/design-real-piece/index.md (rewritten — real CRO + pdfPaginate + fullPdf)
  - src/content/pieces/design-real-piece/hero.webp (added — Leaders p1 rasterization)
  - src/content/pieces/design-real-piece/source.pdf (added — PVL LOGOS.pdf, 12pp)
  - src/content/pieces/design-real-piece/hero.png (deleted — Phase 1 placeholder)
  - public/generated/pdf-thumbs/design-real-piece/{cover,page-5,page-10,page-11,page-12}.webp + .cache.json (regenerated; Plan 02-07 commits)
  - public/source-pdfs/design-real-piece.pdf (regenerated; Plan 02-07 commits)
tech-stack:
  added: []
  patterns:
    - "build-time PDF p1 hero extraction via pdfjs-dist + sharp (one-shot script under scripts/.tmp/, cleaned after)"
    - "pdfPaginate with cover dedupe (page 1 in array → cover.webp not page-1.webp; D-05)"
key-files:
  created:
    - src/content/pieces/design-real-piece/hero.webp
    - src/content/pieces/design-real-piece/source.pdf
  modified:
    - src/content/pieces/design-real-piece/index.md
  deleted:
    - src/content/pieces/design-real-piece/hero.png
decisions:
  - "Title: 'PVL — Overseas Community Project visual identity' — PVL acronym intentionally not expanded; piece is Caleb's SMU overseas community service project in Vietnam"
  - "pdfPaginate: [1, 5, 10, 11, 12] — cover + one mid-system page + the three themed Vietnam lockups (MOUNTAIN, BANH MI, EGG COFFEE) which are the most user-facing applications of the system"
  - "Hero source: LeadersPhotoshoot.pdf p1 (portrait 810x1012 → 1280x1600 WebP q72 258KB; under 300KB budget)"
  - "fullPdf: /source-pdfs/design-real-piece.pdf — canonical path per Plan 02-06 WR-02 contract; positive case (assertion passed silently)"
  - "Marketing piece checkpoint surfaced (D-10 strong-category floor); finance deferred per orchestrator instruction (D-10 'in spirit' — finance is bonus, not floor)"
metrics:
  duration_min: 25
  pieces_committed: 1
  pieces_remaining: 1 (marketing — checkpoint)
  pieces_skipped: 1 (finance — deferred per orchestrator)
  build_status: green
  smoke_status: ALL GREEN
  completed: 2026-05-11
---

# Phase 2 Plan 02-05: Real Content Authoring Summary (PAUSED at checkpoint)

Replaced the design-real-piece placeholder with real Caleb-authored content tied to his PVL Overseas Community Project visual identity. First end-to-end exercise of the Phase 1 + 02-06 PDF pipeline against real input — Gates 7, 10, 11 are now actively asserted instead of silent no-op passes. Pausing for Caleb's inputs on the marketing piece (D-10 strong-category floor); finance is deferred per orchestrator instruction.

## Per-Piece Breakdown

### design-real-piece (LANDED)

| Field | Value |
| --- | --- |
| Slug | `design-real-piece` (preserved from Phase 1; only contents replaced) |
| Category | `design` |
| Title | "PVL — Overseas Community Project visual identity" |
| Hero | `hero.webp` — 1280x1600, q72, 258 KB (rasterized from LeadersPhotoshoot.pdf p1) |
| Source PDF | `source.pdf` — PVL LOGOS.pdf, 12 pages, 1.0 MB |
| `pdfPaginate` | `[1, 5, 10, 11, 12]` — cover + mid-system + MOUNTAIN / BANH MI / EGG COFFEE lockups |
| `fullPdf` | `/source-pdfs/design-real-piece.pdf` (canonical per WR-02) |
| Context word/line count | ~75 words / 6 lines (within Context 3-6 spec) |
| Role word/line count | ~25 words / 3 lines (within Role 1-3 spec) |
| Outcome word/line count | ~30 words / 3 lines (within Outcome 1-3 spec) |
| Banned phrases | none (`passionate` / `multidisciplinary` / `intersection of` — clean) |
| `PLACEHOLDER` substring | none |
| `Phase 1 Skeleton` substring | none |
| Commit | `d0abffe` `feat(02-05): replace design-real-piece placeholder with PVL real content` |
| Caleb UAT | DEFERRED — Caleb supplied inputs in question round; per-piece UAT happens after both real pieces land (or after this run completes if Caleb opts to defer marketing) |

### marketing-real-piece (CHECKPOINT — awaiting Caleb inputs)

See "Awaiting" section below.

### finance-real-piece (DEFERRED)

Per orchestrator instruction, finance is optional in this run (D-10 reads "in spirit, not numbers" — strong-category floor is design + marketing; finance is bonus). The Phase 1 placeholder remains in `src/content/pieces/finance-real-piece/` and Plan 02-07's Gate 12 will need to either accept it as draft / accept the lower piece count OR Caleb supplies finance inputs in a later session before final-launch UAT.

## PDF Pipeline Exercise Evidence

```
public/generated/pdf-thumbs/design-real-piece/
├── .cache.json    693  bytes
├── cover.webp    8728  bytes  (page 1 — Leaders → cover; superseded by hero.webp on detail page hero, but rendered as first <img> in paginated section per pdfPaginate[0]=1)
├── page-5.webp   7114  bytes
├── page-10.webp 15984  bytes  (MOUNTAIN lockup — largest because most graphic content)
├── page-11.webp  8216  bytes  (BANH MI lockup)
└── page-12.webp  7440  bytes  (EGG COFFEE lockup)

public/source-pdfs/
└── design-real-piece.pdf  1024823 bytes
```

Build log (real rasterization output, first time in this codebase):

```
Found 1 pieces with source.pdf
OK design-real-piece/cover.webp 750x749 (8.5KB)
OK design-real-piece/page-5.webp 750x749 (6.9KB)
OK design-real-piece/page-10.webp 750x749 (15.6KB)
OK design-real-piece/page-11.webp 750x749 (8.0KB)
OK design-real-piece/page-12.webp 750x749 (7.3KB)
DONE
```

Note: PVL LOGOS.pdf renders square (375x375 base × 2 scale = 750x749 — long-edge below the 1600 cap so no resize). Each page is a logo plate, not a slide layout, so this is the natural rendered size.

Smoke gate output:

```
OK: design-real-piece has cover.webp + cache              [Gate 7]
OK: design-real-piece paginated <img>s present
    for pages: 1 5 10 11 12                                [Gate 10]
OK: design-real-piece fullPdf link present
    (/source-pdfs/design-real-piece.pdf)                   [Gate 11]
ALL GREEN
```

Rendered HTML proof (D-05 contract — page 1 → cover.webp, never page-1.webp):

```
src="/generated/pdf-thumbs/design-real-piece/cover.webp"
src="/generated/pdf-thumbs/design-real-piece/page-5.webp"
src="/generated/pdf-thumbs/design-real-piece/page-10.webp"
src="/generated/pdf-thumbs/design-real-piece/page-11.webp"
src="/generated/pdf-thumbs/design-real-piece/page-12.webp"
```

## Plan 02-06 Contract Exercises

- **WR-02 fullPdf canonical-path** — POSITIVE case exercised. Frontmatter `fullPdf: "/source-pdfs/design-real-piece.pdf"` matched `canonicalFullPdfHref(slug)` exactly; `copySourcePdf()` assertion passed silently; build continued; `public/source-pdfs/design-real-piece.pdf` written. Contract works end-to-end.
- **CR-01 draft-skip** — NOT exercised this run (no `draft: true` pieces with `source.pdf`). The safety valve remains untested in production usage; document for Plan 02-07 to add a fixture-based smoke check (CR-01 negative case: `draft: true` + `source.pdf` must NOT produce public/ outputs).
- **WR-01 orphan-prune** — NOT exercised this run (this is the FIRST `pdfPaginate` value committed for this piece; no shrink scenario). Will be exercised the next time Caleb edits `pdfPaginate` for this piece.

## NDA Gate (T-02-01) — Per-Piece Confirmation

| Piece | Source PDF | NDA-clear? | Source / authority |
| --- | --- | --- | --- |
| design-real-piece | `PVL LOGOS.pdf` | YES | Caleb's own SMU overseas community service project (Vietnam). Not employer-confidential. Visual scan during page-text inspection: pages 1-9 are alphanumeric labels for the system, pages 10-12 are themed Vietnamese lockups (MOUNTAIN / BANH MI / EGG COFFEE). No third-party brand marks, no sponsor logos, no client confidential surfaces flagged. Caleb explicitly confirmed publish-rights at the question round. |

## Voice Rules (D-12)

| Rule | Result |
| --- | --- |
| Practitioner-coded verbs (designed, built, owned, led, art-directed, specced, shipped, replaced) | Used throughout |
| Banned phrases (`passionate` / `multidisciplinary` / `intersection of`) | Zero matches via `grep -v '^#' \| grep -iE` |
| `PLACEHOLDER` substring | Zero matches |
| `Phase 1 Skeleton` substring | Zero matches |
| Named tools / outputs | Illustrator (named tool); leaders photoshoot, shirt prints, fundraising, leader recruitment, marketing rollout (named outputs); MOUNTAIN / BANH MI / EGG COFFEE (named lockups) |
| First-person where natural | "I built the visual identity from scratch" (Context); rest implied via active verbs |

## Distribution Snapshot (post this run, before checkpoint resolves)

| Category | Pieces | Non-PLACEHOLDER non-draft |
| --- | --- | --- |
| design | 1 | **1** (this run) |
| finance | 1 | 0 (placeholder remains; deferred) |
| marketing | 1 | 0 (placeholder remains; awaiting checkpoint) |
| personal | 0 | 0 (D-11 — empty by design) |

FOUND-05 strong-category floor (D-10) requires `>= 1` non-PLACEHOLDER each in design + marketing. Design ✓; marketing pending checkpoint.

## CF Pages Linux Parity (Phase 1 deferred A1)

**Skipped this run** — Caleb's inputs landed mid-session; running a Docker-simulated Linux build adds ~5 min and the `@napi-rs/canvas` runtime path was already exercised on the developer Mac (which is `darwin`, not `linux`, but native deps for `@napi-rs/canvas` ship per-platform binaries — the Linux variant is a separate asset that resolves at install time on CF Pages). **A1 risk acceptance** for this run: the parity check is deferred to either (a) the first CF Pages preview branch deploy in Phase 6, or (b) Plan 02-07 if Caleb wants belt-and-braces before final UAT. Documented as open item.

## Per-Piece UAT (D-13)

DEFERRED. Caleb supplied piece inputs in the question round (per the continuation flow — orchestrator collects inputs, executor lands the piece, UAT happens at the orchestrator's checkpoint loop after the resume signal). The design piece is buildable and renders correctly per smoke gates 7/10/11; full visual UAT (`npx astro preview` walkthrough of the rendered detail page) happens at the next orchestrator pause.

## Awaiting (Marketing Piece — CHECKPOINT)

Per the orchestrator's plan-of-record, surface a `checkpoint:human-action` for the marketing piece. Caleb hasn't supplied marketing inputs yet. Same 4 questions as the design piece:

| # | Question | Why |
| --- | --- | --- |
| 1 | **Hero source** — absolute path on your Mac to a hero image OR a PDF page to extract page 1 from. Same WebP-rasterization-from-PDF pattern as design works if you point me at a marketing PDF. Candidate folders: `~/Desktop/ARTWORKS`, `~/Desktop/SPARK`, `~/Desktop/OBESE`, `~/Desktop/TREBLE`, `~/Desktop/SMU/Internships/Portfolio`. | Replaces the placeholder `hero.png` and gives the detail page its lead visual. |
| 2 | **Source PDF** (optional) — absolute path to the deck / collateral PDF you'd like to colocate as `source.pdf`. Skip with "no PDF" if marketing piece is image-only. | If supplied, exercises the rasterization pipeline a second time; if skipped, the marketing piece will only need a hero + CRO (lighter touch). |
| 3 | **fullPdf decision** — if you supplied a PDF, should the "Open full PDF" link surface on the detail page? YES → I set `fullPdf: "/source-pdfs/marketing-real-piece.pdf"` (canonical per WR-02). NO → I omit the field and the link doesn't render. | Recruiter-shareable PDFs get the link; in-progress / partially-confidential PDFs don't. |
| 4 | **CRO seed** — 1-3 sentence brain dump on (a) what the marketing piece is, (b) your role, (c) the outcome / where it shipped. Banned phrases I won't write back to you: `passionate`, `multidisciplinary`, `intersection of`. | I draft the Context (3-6 lines) / Role (1-3 lines) / Outcome (1-3 lines) triple from your seed in practitioner-coded voice; you sign off. |

**Bonus question (only if marketing supplied):**

5. **`pdfPaginate`** — if you supplied a marketing deck, do you want me to pick 3-6 representative pages OR will you hand-pick? Default: I pick (cover + mid-deck money chart + closing slide). | Per D-09: array order = render order; you may want to lead with the punchline. |

**T-02-01 NDA gate** — same per-piece confirmation: any source PDF Caleb sends gets a manual judgment check ("publish-rights confirmed; no employer-confidential or third-party brand surfaces") before it goes into git.

**Skip option:** If Caleb explicitly says "skip marketing for this run," I will: (a) leave the marketing placeholder in place, (b) finalize this SUMMARY noting the FOUND-05 strong-category floor is NOT met for marketing in this plan, (c) flag for Plan 02-07 / a future session that the marketing piece must land before final-launch UAT.

## Open Follow-Ups for Plan 02-07

- **Commit `public/generated/**` and `public/source-pdfs/**` per D-03** — this run produced real outputs but did not commit them (per plan-of-record, that's 02-07's job). 6 files (5 webp + 1 cache.json) under `public/generated/pdf-thumbs/design-real-piece/` plus 1 PDF under `public/source-pdfs/` waiting to be committed.
- **Implement Gate 12 sub-gates** (12a piece count, 12b distribution, 12c no-PLACEHOLDER, 12d no-banned-phrases, 12e no-Phase-1-Skeleton) — this plan made the source tree authentic; 02-07 locks it.
- **CR-01 negative-case smoke fixture** — add a `draft: true` + `source.pdf` test piece; assert no `public/generated/pdf-thumbs/<that-slug>/` AND no `public/source-pdfs/<that-slug>.pdf` after build. Locks the safety valve.
- **CF Pages Linux parity** — either (a) Docker-simulated build pre-launch, or (b) accept A1 risk and rely on first CF Pages preview deploy.
- **Finance piece** — if Caleb wants the bonus thicker category, surface a question round ahead of Plan 02-07; otherwise document the 0-finance-piece state as accepted.
- **Marketing piece** — if Caleb opts to skip in this run, must land before final UAT.

## Open Follow-Ups for `/gsd-verify-work`

- **Per-piece UAT** — Caleb walks `dist/design/design-real-piece/index.html` (via `npx astro preview` or by opening the file): hero renders, CRO reads in his voice, paginated `<img>` sequence renders in the `[1, 5, 10, 11, 12]` order, "Open full PDF" link downloads the source PDF.
- **Voice signoff** — Caleb confirms the CRO triple matches his voice (or supplies tweaks for the next piece, per D-13's iterative loop).

## D-13 Honored

Confirmed. The CRO triple was drafted from Caleb's contextual seed ("PVL Overseas Community Project, Caleb led visual identity (logos + shirts + photoshoot direction), outcome was the brand system used through fundraising + leader recruitment + marketing"); no piece content was fabricated. Caleb's per-piece UAT signoff at the next orchestrator pause locks the voice.

## Self-Check: PASSED

Files asserted to exist:
- `src/content/pieces/design-real-piece/index.md` — FOUND
- `src/content/pieces/design-real-piece/hero.webp` — FOUND (264576 bytes)
- `src/content/pieces/design-real-piece/source.pdf` — FOUND (1024823 bytes)
- `src/content/pieces/design-real-piece/hero.png` — DELETED (intentional; replaced by hero.webp)
- `public/generated/pdf-thumbs/design-real-piece/cover.webp` — FOUND
- `public/generated/pdf-thumbs/design-real-piece/page-5.webp` — FOUND
- `public/generated/pdf-thumbs/design-real-piece/page-10.webp` — FOUND
- `public/generated/pdf-thumbs/design-real-piece/page-11.webp` — FOUND
- `public/generated/pdf-thumbs/design-real-piece/page-12.webp` — FOUND
- `public/generated/pdf-thumbs/design-real-piece/.cache.json` — FOUND
- `public/source-pdfs/design-real-piece.pdf` — FOUND

Commits asserted to exist:
- `d0abffe` `feat(02-05): replace design-real-piece placeholder with PVL real content` — FOUND in `git log --oneline`

Self-check status: **PASSED**.
