---
phase: 02
slug: asset-pipeline-real-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash assertions + node script smoke checks (extending Phase 1's `scripts/verify-build.sh`) |
| **Config file** | `scripts/verify-build.sh` (existing); per-piece content validation inline in build |
| **Quick run command** | `bash scripts/verify-build.sh` |
| **Full suite command** | `npm run build && bash scripts/verify-build.sh` |
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

> Mapped from ROADMAP.md Phase 2 SC1–SC5. Every SC has at least one automated assertion.

| SC | Verification | Command |
|----|--------------|---------|
| **SC1** — `pdf-preprocess.mjs` runs as prebuild, emits covers + paginated pages | Assert `package.json` has `"prebuild": "node scripts/pdf-preprocess.mjs"`; assert every `src/content/pieces/*/source.pdf` has a corresponding `public/generated/pdf-thumbs/[slug]/cover.webp` after `npm run build`; assert `.cache.json` sidecar present | `node scripts/check-prebuild-outputs.mjs` (new in Wave 0) |
| **SC2** — 5–7 pieces total with finalized CRO blurbs in correct distribution | Assert 5 ≤ `find src/content/pieces -name 'index.md' \| wc -l` ≤ 15; assert each piece's frontmatter has `context` (3–6 lines), `role` (1–3 lines), `outcome` (1–3 lines); assert no piece named `phase-1-skeleton` (Phase 1 placeholder deleted) | `node scripts/check-content-shape.mjs` |
| **SC3** — About page exists with 80–150 word bio | Assert `src/pages/about.astro` (or equivalent route) renders; assert bio word count ∈ [80, 150]; manual: voice check (no banned phrases) | `node scripts/check-about-bio.mjs` + manual UAT |
| **SC4** — `caleb-lim-resume.pdf` ≤ 1MB, EXIF-stripped, in `/public/` | Assert `public/caleb-lim-resume.pdf` exists; assert file size < 1MB; assert no EXIF metadata via `exiftool` (or `qpdf --show-pages` cross-check) | `node scripts/check-resume.mjs` |
| **SC5** — Multi-page decks render 3–6 pages vertically below hero; `Open full PDF` link surfaces when `fullPdf` set | Assert each piece with `pdfPaginate: [n,...]` produces `public/generated/pdf-thumbs/[slug]/page-N.webp` for every N; assert detail page template renders `<img>` for each paginated page; assert `fullPdf` pieces produce `public/source-pdfs/[slug].pdf` | E2E render check via Astro build + `node scripts/check-detail-render.mjs` |

---

## Validation Architecture (from RESEARCH.md)

The detailed assertions, test fixtures, and exit-code contracts live in `02-RESEARCH.md` §"Validation Architecture". The per-task acceptance criteria in PLAN.md MUST cite the assertion they map to.

---

## Wave 0 Requirements

- [ ] `scripts/check-prebuild-outputs.mjs` — assertion script for SC1 (cover + paginated outputs)
- [ ] `scripts/check-content-shape.mjs` — assertion script for SC2 (piece count + CRO field shape)
- [ ] `scripts/check-about-bio.mjs` — assertion script for SC3 (bio word count)
- [ ] `scripts/check-resume.mjs` — assertion script for SC4 (resume size + EXIF)
- [ ] `scripts/check-detail-render.mjs` — assertion script for SC5 (paginated render + fullPdf link)
- [ ] Extend `scripts/verify-build.sh` to invoke the five new check scripts in sequence

*All five checks are net-new — Phase 1's `verify-build.sh` only covered skeleton smoke checks. Wave 0 of Phase 2 must scaffold these before content-side work begins so each piece authored gets immediate green/red feedback.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bio voice — practitioner-coded, no "passionate / multidisciplinary / intersection of" filler | ABOUT-01 + Phase 2 SC3 | Voice judgment is taste-driven; word-list grep is a smoke check, not the contract | Read aloud; check against PROJECT.md PITFALLS list; ensure stance on cross-functional pitch is concrete |
| CRO blurb voice — practitioner-coded, named tools and outputs | PIECE-02 + Phase 2 SC2 | Same as bio | Per piece: confirm Context cites a concrete situation, Role names tools/verbs, Outcome states a measurable or named output |
| Asymmetric distribution feels right (Design + Marketing thicker than Finance + Personal) | FOUND-05 | Distribution is "in spirit" per D-10 — not enforced by exact counts | Splash page eyeball check: Design + Marketing cards visibly carry the showcase weight |
| CF Pages Linux parity — rasterizer runs on actual CF Pages build | Phase 1 verification owed (per 01-VERIFICATION.md) | Cannot reproduce the exact CF env locally without simulating it; preview deploy is the canonical proof | Push to a preview branch; confirm CF Pages build log shows `pdf-preprocess.mjs` ran without crash and outputs match local build |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (5 new check scripts + extended `verify-build.sh`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner fills per-task verification map)

**Approval:** pending
