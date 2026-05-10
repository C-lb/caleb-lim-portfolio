---
phase: 02-asset-pipeline-real-content
plan: 06
subsystem: build-pipeline
tags: [gap-closure, pipeline-correctness, draft-skip, orphan-prune, fullpdf-contract, code-review]
gap_closure: true
requirements: [PIECE-03, PIECE-06]
dependency-graph:
  requires: [02-01]
  provides: [draft-skip-guard, orphan-prune, fullpdf-canonical-contract]
  affects: [02-05]
tech-stack:
  added: []
  patterns: [build-time-assertion, defensive-prune, frontmatter-mirroring]
key-files:
  created: []
  modified:
    - scripts/pdf-preprocess.mjs
decisions:
  - "Enforce fullPdf canonical path at script level, not schema (WR-02): schema stays z.string().optional() for back-compat, but script throws on drift"
  - "Prune any non-expected file in thumb directory, not just page-*.webp (WR-01): the directory is owned by the script, expected set is the source of truth"
  - "Strict === true / !== undefined comparisons throughout (CR-01, WR-02): YAML truthy quirks cannot accidentally trigger skip or bypass assertion"
  - "Schema and template untouched: scope confined to scripts/pdf-preprocess.mjs"
metrics:
  duration: ~12 minutes
  completed: 2026-05-10
  tasks_total: 3
  tasks_completed: 3
  files_modified: 1
  commits: 3
---

# Phase 02 Plan 06: Pipeline correctness gap closure (CR-01 + WR-01 + WR-02) Summary

Three latent BLOCKERs from `02-REVIEW.md` closed at the script level before any real content lands in Plan 02-05. All fixes scoped to `scripts/pdf-preprocess.mjs`; no schema or template edits.

## What was built

**CR-01 (BLOCKER) — draft skip in `discoverPieces()`:** Added a `fm.draft === true` guard between the gray-matter parse and `out.push`. Emits `SKIP <slug> (draft)` log line and `continue`s. Mirrors the `getStaticPaths` filter in `[category]/[slug].astro` so draft pieces no longer leak `cover.webp` / `page-N.webp` / `source-pdfs/<slug>.pdf` to `public/` at predictable URLs. Strict `=== true` so YAML quirks like `draft: "no"` (string) cannot accidentally trip the skip.

**WR-01 — orphan prune on cache-miss regenerate:** Added a 16-line block in `rasterizePiece()` after `pagesToRender` is computed, before the render loop. Builds an `expectedFiles` Set (`{cover.webp, .cache.json, page-N.webp for each N in pagesToRender where N != 1}`), reads existing thumb-directory contents via `fs.readdir(thumbDir)` (ENOENT → `[]`), unlinks anything not in the expected set, emits `PRUNE <slug>/<file>` log line. Cache-hit path unchanged (orphans cannot exist without regeneration). Closes the case where shrinking `pdfPaginate` from `[1,5,12,23]` to `[1,5]` would leave `page-12.webp` and `page-23.webp` committed via D-03 and shipped to production.

**WR-02 — fullPdf canonical-path contract:** Added a top-of-file helper `canonicalFullPdfHref = (slug) => \`/source-pdfs/${slug}.pdf\`` and an assertion inside `copySourcePdf`. Function signature changed from `(slug, sourcePdfPath)` to `(slug, sourcePdfPath, fullPdf)`. When `fullPdf !== undefined`, asserts equality with `canonicalFullPdfHref(slug)`; throws `WR-02 contract violation: <slug> frontmatter fullPdf is "<wrong>" but the script writes to "<expected>". Set frontmatter to fullPdf: "<expected>" or omit the field to suppress the Open full PDF link.` Both call sites (cache-hit + cache-miss) updated to pass `fullPdf`. Schema stays `z.string().optional()` for back-compat; script is single source of truth for the path.

## Line-range modifications

All inside `scripts/pdf-preprocess.mjs`:

| Finding | Function / region | Lines added | Lines removed |
|---------|-------------------|-------------|---------------|
| CR-01 | `discoverPieces()` (between gray-matter parse and `out.push`) | 10 | 0 |
| WR-01 | `rasterizePiece()` (between `pagesToRender` and render loop) | 22 | 0 |
| WR-02 | top-of-file helper + `copySourcePdf` signature/assertion + 2 call sites | 27 | 3 |

Total: 1 file, +59 / -3.

## Commits

| Task | Commit | Type | Subject |
|------|--------|------|---------|
| 1 | `74aa831` | fix | skip rasterization for draft pieces in pdf-preprocess (CR-01) |
| 2 | `a65d122` | fix | prune orphan page-N.webp on cache-miss regenerate (WR-01) |
| 3 | `c385dbe` | fix | enforce fullPdf canonical-path contract at prebuild (WR-02) |

## Verification

| Gate | Result |
|------|--------|
| `node --check scripts/pdf-preprocess.mjs` | exit 0 (file parses) |
| `npm run build` | exit 0; build log contains `Found 0 pieces with source.pdf` and `DONE` (no behavioral regression on placeholder tree) |
| `git diff --name-only dd86465..HEAD` | only `scripts/pdf-preprocess.mjs` (clean scope; schema + template untouched) |
| `grep -c 'fm\.draft === true'` | 1 |
| `grep -c 'SKIP \${slug} (draft)'` | 1 |
| `grep -c 'CR-01'` | 1 |
| `grep -c 'WR-01'` | 1 |
| `grep -c 'expectedFiles'` | 2 (Set construction + `.has` check) |
| `grep -c 'PRUNE \${slug}'` | 1 |
| `grep -c 'fs\.unlink'` | 1 |
| `grep -c 'WR-02'` | 3 (helper comment + assertion comment + error message) |
| `grep -c 'canonicalFullPdfHref'` | 3 (declaration + helper-arrow + use in assertion) |
| `grep -c 'WR-02 contract violation'` | 1 |
| `grep -c 'copySourcePdf(slug, sourcePdfPath, fullPdf)'` | 3 (definition + 2 call sites) |
| `grep -cE 'copySourcePdf\(slug, sourcePdfPath\)$'` | 0 (no leftover 2-arg calls) |
| `find public/generated -name '*.webp'` | 0 (no piece has source.pdf, prune never fires; no regression artefacts) |

## Deviations from Plan

None — plan executed exactly as written. No Rule 1/2/3 auto-fixes triggered; no Rule 4 architectural decisions surfaced. The acceptance-criteria gates flagged that `grep -c 'copySourcePdf(slug, sourcePdfPath, fullPdf)'` returns 3 (not 2) because grep without an end anchor matches the function definition line as well as the two call sites — this is expected and correct, and the negation gate (`grep -cE '...$'` returning 0) confirms no leftover 2-arg call sites.

## Caleb workflow notes (for Plan 02-05 and Phase 6 GitHub.dev work)

| Goal | Frontmatter to set | What the pipeline does |
|------|--------------------|-------------------------|
| Suppress publication of an in-flight piece | `draft: true` | Prebuild skips rasterization AND source-pdf copy; no assets ship to `public/`. Visible as `SKIP <slug> (draft)` in build logs. |
| Enable the "Open full PDF" download link on a detail page | `fullPdf: "/source-pdfs/<slug>.pdf"` (must match exactly) | Source PDF copied to `public/source-pdfs/<slug>.pdf`. If the value drifts (typo, wrong path), build fails loudly with an actionable error naming the slug, the wrong value, and the expected value. |
| Suppress the "Open full PDF" link without removing the source | omit `fullPdf` entirely | No copy, no assertion, no link rendered. |
| Shrink `pdfPaginate` (e.g. `[1, 5, 12, 23]` → `[1, 5]`) | edit the array | Orphan `page-12.webp` and `page-23.webp` pruned automatically on the next build. Visible as `PRUNE <slug>/<file>` in build logs. |

## Open follow-ups for /gsd-verify-work

- **Plan 02-07 Task 1 (draft-skip smoke gate):** confirm the smoke test exercises CR-01 against a synthetic draft piece — i.e. creates a temporary `src/content/pieces/__smoke-draft__/{index.md with draft: true, source.pdf}`, runs the pipeline, asserts `SKIP __smoke-draft__ (draft)` in stdout AND that `public/generated/pdf-thumbs/__smoke-draft__/` was not created AND that `public/source-pdfs/__smoke-draft__.pdf` was not created. The fixture should be cleaned up regardless of pass/fail.
- **Plan 02-05 (real content):** when authoring the first piece with `source.pdf` and `fullPdf` set, choose the canonical value `/source-pdfs/<slug>.pdf` from the start. Build will fail loudly otherwise (actionable error tells you exactly what to set).
- **Plan 02-08 (template hardening, if it exists):** consider deriving the `<a href>` value from `slug` directly rather than reading the frontmatter `fullPdf` string — this would reduce the schema field to a pure boolean toggle and eliminate the assertion entirely. Out of scope for this plan; recorded for future tightening.

## Threat surface scan

No new external integrations or trust boundaries introduced. All changes are defensive guards inside the existing prebuild script. Threat register entries `T-02-31` (draft leak), `T-02-32` (orphan leak), `T-02-33` (silent 404) marked `mitigate` per plan; mitigations are deterministic and observable.

## Self-Check: PASSED

- `scripts/pdf-preprocess.mjs` modified — verified by `git diff --name-only` returning exactly that path.
- Commit `74aa831` (CR-01) — found via `git log --oneline`.
- Commit `a65d122` (WR-01) — found via `git log --oneline`.
- Commit `c385dbe` (WR-02) — found via `git log --oneline`.
- All three gates greppable in source — verified via the gate-grep table above.
- `npm run build` exits 0 with `Found 0 pieces with source.pdf` and `DONE` — verified via build log.
