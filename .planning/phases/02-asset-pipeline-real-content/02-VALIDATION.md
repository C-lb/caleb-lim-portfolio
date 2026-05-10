---
phase: 02
slug: asset-pipeline-real-content
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-10
revised: 2026-05-10
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash assertions extending Phase 1's `scripts/verify-build.sh` (no test runner; PATTERNS.md confirms bash-gate-extension is the chosen instrument over net-new `.mjs` check scripts) |
| **Config file** | `scripts/verify-build.sh` (existing, extended in Plans 01–04) |
| **Quick run command** | `bash scripts/verify-build.sh` |
| **Full suite command** | `npm run build && bash scripts/verify-build.sh` (or `npm run test:smoke`) |
| **Estimated runtime** | ~30–90 seconds (varies with PDF count and incremental cache hit rate) |

---

## Sampling Rate

- **After every task commit:** `bash scripts/verify-build.sh` (assertions on outputs that exist at the point of the commit)
- **After every plan wave:** `npm run build && bash scripts/verify-build.sh`
- **Before `/gsd-verify-work`:** Full suite green; manual UAT for bio voice + recruiter perception
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

> Per-task rows are filled in during planning (each `<automated>` block in PLAN.md tasks maps to a row here). The planner's `<acceptance_criteria>` blocks generate the assertion commands.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| TBD-by-planner | — | — | — | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Phase 2 Success Criteria → Verification

> Mapped from ROADMAP.md Phase 2 SC1–SC5. Every SC has at least one automated assertion via a bash gate appended to `scripts/verify-build.sh`.

| SC | Verification | Gate(s) | Plan |
|----|--------------|---------|------|
| **SC1** — `pdf-preprocess.mjs` runs as prebuild, emits covers + paginated pages | Assert `package.json` has `"prebuild": "node scripts/pdf-preprocess.mjs"`; assert every `src/content/pieces/*/source.pdf` has a corresponding `public/generated/pdf-thumbs/[slug]/cover.webp` after `npm run build`; assert `.cache.json` sidecar present | **Gate 7** (cover + cache present per piece with source.pdf) | 02-01 |
| **SC2** — 5–7 pieces total with finalized CRO blurbs in correct distribution | Assert piece count ≥ 3 (D-10 "in spirit" floor; ROADMAP SC2 5–15 is launch-aspirational, FUTURE-06 backfills); assert ≥1 design + ≥1 marketing real piece; assert no `PLACEHOLDER` substring; assert no `phase-1-skeleton` directory; assert no banned filler phrases in any piece's CRO content | **Gate 12** (sub-gates 12a–12e: phase-1-skeleton deletion, piece count, distribution, no PLACEHOLDER, no banned phrases) | 02-04 |
| **SC3** — About page exists with 80–150 word bio | Assert `dist/about/index.html` builds; assert bio body word count ∈ [80, 150]; assert no banned filler phrases (`passionate`, `multidisciplinary`, `intersection of`); manual UAT covers voice judgment | **Gate 9** (bio word count + banned-phrase grep over rendered HTML) | 02-02 |
| **SC4** — `caleb-lim-resume.pdf` ≤ 1MB, EXIF-stripped, in `/public/` | Assert `public/caleb-lim-resume.pdf` exists; assert file size ≤ 1MB; assert About HTML contains `<a href="/caleb-lim-resume.pdf">` (CONTACT-02 link); EXIF strip verified manually via `exiftool` checklist when available | **Gate 8** (resume size + path + About link) | 02-02 |
| **SC5** — Multi-page decks render 3–6 pages vertically below hero; `Open full PDF` link surfaces when `fullPdf` set | Assert each piece with `pdfPaginate: [n,...]` produces `<img src="/generated/pdf-thumbs/[slug]/page-N.webp">` in rendered detail HTML for every N (page 1 → cover.webp); assert pieces with `fullPdf:` set produce `<a href="..." download>` in detail HTML AND `public/source-pdfs/[slug].pdf` exists | **Gate 10** (paginated `<img>` HTML presence) + **Gate 11** (fullPdf link + download attribute) | 02-03 |

---

## Validation Architecture (from RESEARCH.md)

The detailed assertions, test fixtures, and exit-code contracts live in `02-RESEARCH.md` §"Validation Architecture". The per-task acceptance criteria in PLAN.md MUST cite the assertion they map to.

PATTERNS.md §"check-content-shape.mjs" confirms the planner's choice: bash gates extending `verify-build.sh` (Phase 1's instrument) rather than net-new `.mjs` check scripts. Rationale: Phase 1 deliberately chose grep-over-dist as the sampling instrument; Phase 2 continues the same pattern for consistency, lower runtime cost, and zero new tooling surface.

---

## Wave 0 Requirements

Wave 0 = the bash gate extensions to `scripts/verify-build.sh`. Each plan's first task lands the relevant gate(s) before any Caleb-supplied content lands, so each piece authored gets immediate green/red feedback.

| Gate | Plan | Task | Asserts |
|------|------|------|---------|
| **Gate 7** | 02-01 | Task 3 (or as the plan structures) | Every piece with `source.pdf` has `public/generated/pdf-thumbs/[slug]/cover.webp` and `.cache.json` |
| **Gate 8** | 02-02 | (resume + about wave) | `public/caleb-lim-resume.pdf` exists, ≤ 1MB, About HTML links to it |
| **Gate 9** | 02-02 | (about bio task) | About bio word count ∈ [80, 150]; no banned filler phrases in rendered About HTML |
| **Gate 10** | 02-03 | Task that lands template + gate | Pieces with `pdfPaginate: [N1, N2, …]` produce matching `<img src="/generated/pdf-thumbs/[slug]/{cover\|page-N}.webp">` tags in rendered detail HTML |
| **Gate 11** | 02-03 | Same task as Gate 10 | Pieces with `fullPdf:` set produce `<a href="$fullPdf" download>` in rendered detail HTML |
| **Gate 12** | 02-04 | Task 3 | Sub-gates 12a (no `phase-1-skeleton`), 12b (piece count ≥ 3), 12c (≥1 design + ≥1 marketing), 12d (no `PLACEHOLDER` substring), 12e (no banned filler phrases in source markdown) |

`wave_0_complete:` flips to `true` once all six gate extensions are landed and `npm run build && bash scripts/verify-build.sh` exits 0 with `ALL GREEN` (executor sets this at end-of-phase per /gsd-verify-work convention).

`nyquist_compliant: true` — every per-task `<verify><automated>` block in Plans 01–04 cites a runnable bash command (build + smoke), satisfying the planner's "every verify must include an automated command" rule.

*Note on the prior `.mjs` check-script plan:* The earlier draft listed five net-new `.mjs` scripts (`check-prebuild-outputs.mjs`, `check-content-shape.mjs`, etc.). PATTERNS.md rejected this in favor of extending the existing bash verifier — fewer tools, same coverage, no new test framework to maintain. Plans 01–04 implement the bash-gate version; this validation contract reflects that decision.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bio voice — practitioner-coded, no "passionate / multidisciplinary / intersection of" filler | ABOUT-01 + Phase 2 SC3 | Voice judgment is taste-driven; word-list grep is a smoke check, not the contract | Read aloud; check against PROJECT.md PITFALLS list; ensure stance on cross-functional pitch is concrete |
| CRO blurb voice — practitioner-coded, named tools and outputs | PIECE-02 + Phase 2 SC2 | Same as bio | Per piece: confirm Context cites a concrete situation, Role names tools/verbs, Outcome states a measurable or named output |
| Asymmetric distribution feels right (Design + Marketing thicker than Finance + Personal) | FOUND-05 | Distribution is "in spirit" per D-10 — not enforced by exact counts | Splash page eyeball check: Design + Marketing cards visibly carry the showcase weight |
| Caleb explicitly accepts launching at piece_count ≥ 3 floor (vs. ROADMAP SC2's 5–15 target) | FOUND-05 / D-10 / ROADMAP SC2 | The 3-floor is D-10's "in spirit, not numbers" softening; FUTURE-06 backfills toward higher count post-launch. Whether to launch at 3 or wait for 5+ is Caleb's call. | Plan 04 Task 4 UAT checkpoint: Caleb confirms "OK to launch at piece_count = N" with N possibly < 5; FUTURE-06 ticket tracks the backfill toward SC2's 5–15 range |
| CF Pages Linux parity — rasterizer runs on actual CF Pages build | Phase 1 verification owed (per 01-VERIFICATION.md) | Cannot reproduce the exact CF env locally without simulating it; preview deploy is the canonical proof | Plan 04 Task 2 step 6 surfaces the choice (Docker simulation, CF Pages preview branch, or local-only with documented A1 risk). Recorded in 02-04-SUMMARY.md. |
| EXIF strip on resume PDF | CONTACT-01 / SC4 | `exiftool` may not be installed on executor host; fallback chain documented | Plan 02 task: strip via exiftool → ghostscript → qpdf fallback chain; verify no Author/Creator metadata leaks via `exiftool -j public/caleb-lim-resume.pdf` (or document manual checklist if tool unavailable) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify blocks (every Plan 01–04 task cites `npm run build && npm run test:smoke` or a bash gate command)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (six bash gate extensions across Plans 01–04 — Gates 7–12)
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter
- [ ] `wave_0_complete: true` — flips at execution time when all Gates 7–12 land in `scripts/verify-build.sh` and `npm run test:smoke` exits 0 against the real-content tree

**Approval:** revised after planner-checker feedback (2026-05-10) — bash-gate-extension reality replaces the prior `.mjs` script plan; nyquist_compliant flipped to true; manual UAT for piece_count floor decision documented.
