---
phase: 02-asset-pipeline-real-content
plan: 04
subsystem: real-content-integration
status: PAUSED — checkpoint:human-action surfaced after Task 1
tags: [content-authoring, real-pieces, found-05, generated-outputs-commit, integration, checkpoint-paused]

# Dependency graph
requires:
  - phase: 02-asset-pipeline-real-content
    plan: 01
    provides: |
      scripts/pdf-preprocess.mjs prebuild hook + sha256 cache + .cache.json sidecar contract;
      Migrated schema (pdfPaginate: number[].optional() / fullPdf: string.optional());
      scripts/verify-build.sh Gate 7 (cover.webp + .cache.json existence per piece with source.pdf).
  - phase: 02-asset-pipeline-real-content
    plan: 02
    provides: |
      public/caleb-lim-resume.pdf (193KB, EXIF-stripped via pdf-lib);
      src/pages/about.astro (122-word bio);
      scripts/verify-build.sh Gates 8 (resume size ≤1MB) + 9 (bio word count + banned-phrase grep).
  - phase: 02-asset-pipeline-real-content
    plan: 03
    provides: |
      src/pages/[category]/[slug].astro extended with paginated <img> sequence + fullPdf <a download> link;
      scripts/verify-build.sh Gates 10 (paginated <img> presence) + 11 (fullPdf link + download attr).

provides:
  - "src/content/pieces/phase-1-skeleton/ deleted per D-11 (Task 1)"
  - "scripts/verify-build.sh Gate 4 relaxed: personal=0 pieces is OK per D-11 (Rule 1 deviation; documented)"
  - "Pending — Task 2 (real piece authoring): paused at checkpoint:human-action, awaiting Caleb-supplied assets + CRO seed"
  - "Pending — Task 3 (Gate 12 in verify-build.sh)"
  - "Pending — Task 4 (commit generated outputs + final UAT)"

affects: [02-VERIFY (gsd-verify-work)]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/02-asset-pipeline-real-content/02-04-SUMMARY.md
  modified:
    - scripts/verify-build.sh
  deleted:
    - src/content/pieces/phase-1-skeleton/index.md
    - src/content/pieces/phase-1-skeleton/hero.png

key-decisions:
  - "Surfaced checkpoint:human-action at Task 2 per plan frontmatter (autonomous=false) and per orchestrator instruction: 'first task that requires real assets Caleb owns MUST surface a structured human-action checkpoint — do NOT fabricate piece content'"
  - "Task 1 (delete phase-1-skeleton) ran autonomously and is fully committed: 63974a9"
  - "Rule 1 deviation: Gate 4 in scripts/verify-build.sh relaxed to allow personal=0 pieces — D-11 explicitly allows this, but the pre-existing Gate 4 (from Phase 1) didn't know about D-11. Fix committed: 5d729d6"

requirements-completed: []  # Plan 04 closes PIECE-03 / PIECE-04 / PIECE-06 / FOUND-05 only after Task 2 + 3 + 4 land

# Metrics (partial — paused mid-plan)
duration: ~10min (Task 1 + Gate 4 fix only; Tasks 2–4 awaiting checkpoint resume)
completed: PAUSED 2026-05-10
---

# Phase 02 Plan 04: Real Content Integration — PAUSED at Task 2 Checkpoint

**Status: paused at `checkpoint:human-action` (Task 2). Task 1 (delete `phase-1-skeleton` per D-11) is complete and committed; a Rule 1 deviation also relaxed Gate 4 in `verify-build.sh` to allow `personal=0` pieces per D-11. Tasks 2 (real piece authoring), 3 (Gate 12), and 4 (commit generated outputs + UAT) are blocked on Caleb supplying real piece assets + minimal CRO seed per piece (D-13). The checkpoint message itself is reproduced below for continuity.**

## Tasks Completed

### Task 1 — delete phase-1-skeleton per D-11 (commit `63974a9`)

- `src/content/pieces/phase-1-skeleton/index.md` deleted.
- `src/content/pieces/phase-1-skeleton/hero.png` deleted.
- `npx astro sync` exits 0.
- `npm run build` exits 0; `dist/personal/index.html` builds with the empty-state branch (`(No pieces in this discipline yet.)`).
- `dist/personal/phase-1-skeleton/index.html` does NOT exist.
- The other three Phase 1 placeholders (`design-real-piece`, `finance-real-piece`, `marketing-real-piece`) still build (regression check pass).

### Rule 1 deviation — Gate 4 relaxation (commit `5d729d6`)

- Phase 1's Gate 4 in `scripts/verify-build.sh` enforced "each category has ≥1 piece detail page". Once Task 1 deleted `phase-1-skeleton`, Gate 4 fired FAIL on `personal` (now empty). D-11 explicitly allows `personal` to ship empty; SPLASH-04 (Phase 4) handles the splash-card drop.
- Fix: Gate 4 now reports OK on empty `personal` with the D-11 / SPLASH-04 reason; design / finance / marketing still require ≥1.
- Plan 04's Task 3 (Gate 12c) will enforce design + marketing ≥1 specifically per FOUND-05's strong-category reading of D-10. Gate 4 ≥1 on finance is also still in force from Phase 1 — adequate for the current state where Phase 1's `finance-real-piece` PLACEHOLDER is still present.

## Tasks Pending — blocked on Caleb-supplied content

### Task 2 — real piece authoring (PAUSED at checkpoint:human-action)

The plan calls for replacing the three Phase 1 PLACEHOLDER pieces (`design-real-piece` / `finance-real-piece` / `marketing-real-piece`) with real Caleb content per D-13's per-piece collaborative flow:

1. Caleb supplies the asset (hero image and/or source PDF) on disk.
2. Caleb confirms no NDA / employer-confidential content (T-02-01 manual gate).
3. Caleb provides minimal CRO seed (situation + role + outcome bullets in his words).
4. Claude drafts CRO blurbs (Context 3–6 lines / Role 1–3 lines / Outcome 1–3 lines per D-12 / PIECE-02) using practitioner-coded voice.
5. Caleb edits and locks per piece.
6. Claude commits the piece + reruns prebuild + smoke.
7. Per-piece visual UAT in `astro preview`.

The checkpoint message that surfaced (and that Caleb needs to action to resume) is reproduced in the next section.

### Task 3 — Gate 12 in verify-build.sh (PENDING — blocked on Task 2 landing real pieces)

Adds five sub-gates after Plan 03's Gate 11:

- 12a: `phase-1-skeleton` not in source tree (already true post-Task 1 — gate locks it).
- 12b: total piece count ≥ 3 (D-10 floor).
- 12c: design ≥ 1 AND marketing ≥ 1 (FOUND-05 strong categories).
- 12d: no `PLACEHOLDER` substring in any piece's `index.md`.
- 12e: no banned filler phrases in piece content.

### Task 4 — commit generated outputs + final UAT (PENDING — blocked on Tasks 2 + 3)

- Stage + commit `public/generated/pdf-thumbs/**` and `public/source-pdfs/**` (D-03 — outputs ARE committed; `.gitignore` is forbidden).
- Verify `.gitignore` does not exclude these paths.
- Final visual UAT: splash → each populated discipline → each populated detail page → about → resume download.
- Caleb explicitly accepts launch piece count if < 5 (per CONTEXT D-10's "in spirit, not numbers" softening of FOUND-05; FUTURE-06 backfills toward ROADMAP SC2's 5–15 range).

## Checkpoint Message (reproduced for continuity)

The structured `checkpoint:human-action` is in this run's final response; the exact pieces / paths / blurb-seeds Caleb needs to supply are listed there. Resume signal per plan: per-piece "Piece [slug] approved" with optional voice-tweak feedback for the next; final "All pieces approved" or "Add piece [new-slug] also".

## Open Items for /gsd-verify-work (when this plan ultimately closes)

- All Task 2 pieces require per-piece UAT sign-off (Caleb's voice judgment is the real control per RESEARCH.md "Manual-Only Verifications").
- Task 4's launch-piece-count acceptance must be recorded explicitly when this plan resumes.
- CF Pages Linux parity (Phase 1 deferred A1) — Task 2 may surface a Docker-simulated build at the planner's option; otherwise documented A1 risk acceptance.

## Self-Check: PASSED (for the work that landed)

Verified:

- `src/content/pieces/phase-1-skeleton/` directory NOT present — `test ! -d src/content/pieces/phase-1-skeleton/` succeeds.
- `dist/personal/index.html` exists (empty-state branch renders).
- `dist/personal/phase-1-skeleton/index.html` does NOT exist.
- `dist/design/design-real-piece/index.html`, `dist/finance/finance-real-piece/index.html`, `dist/marketing/marketing-real-piece/index.html` all still build.
- Commit `63974a9` (Task 1 — delete phase-1-skeleton) — FOUND.
- Commit `5d729d6` (Gate 4 relaxation — Rule 1 deviation) — FOUND.
- `npm run build && npm run test:smoke` — exits 0 with `ALL GREEN` against the current placeholder-tree state. Tasks 2/3/4 will exercise Gates 7/10/11/12 against real content when they resume.

---
*Phase: 02-asset-pipeline-real-content*
*Plan: 04*
*Status: PAUSED at checkpoint:human-action (Task 2)*
*Last updated: 2026-05-10*
