---
phase: 03-visual-design-system
plan: 04
subsystem: detail-and-about-pages
tags:
  - detail-page
  - about-page
  - re-skin
  - mvp-vertical-slice
  - paginated-pdf-preservation
  - phase-3-typography
requirements:
  - VISUAL-01
  - VISUAL-02
dependency_graph:
  requires:
    - "03-01a (tokens + DISCIPLINE_ACCENT + Fontsource)"
    - "03-01b (Base layout)"
    - "Phase 2 D-04 paginated PDF block contract"
    - "Phase 2 D-12/D-14 bio voice contract"
  provides:
    - "Re-skinned detail page on Base with discipline-accent header"
    - "Re-skinned about page on Base with Phase 3 typography"
    - "Phase 3 typography + color now applied to detail + about surfaces"
  affects:
    - "src/pages/[category]/[slug].astro"
    - "src/pages/about.astro"
tech_stack:
  added: []
  patterns:
    - "DISCIPLINE_ACCENT[category] consumed via CSS custom property (--accent)"
    - "Base layout extended with bg='paper' on detail + about"
    - "Plain <img> preservation for paginated PDF block (Pitfall 1 contract)"
    - "CSS text-transform: uppercase on title-case markup (Gate 6 + visual UI-SPEC compatibility)"
key_files:
  created: []
  modified:
    - "src/pages/[category]/[slug].astro"
    - "src/pages/about.astro"
decisions:
  - "CRO labels rendered as title-case in markup; CSS text-transform handles visual uppercase. Prevents Phase 1+2 Gate 6 PIECE-02 regression."
  - "Detail header accent on top border + back-pill hover only (per CONTEXT.md Claude's Discretion)"
  - "About page back-pill uses terracotta default brand-link accent (not category-scoped)"
metrics:
  duration_minutes: 6
  tasks_completed: 3
  files_modified: 2
  completed_date: 2026-05-14
---

# Phase 3 Plan 04: Detail + About Page Re-skin Summary

**One-liner:** Detail and about pages re-skinned on Base.astro with Phase 3 magazine typography; Phase 2 D-04 paginated PDF block preserved verbatim.

## What shipped

Two pages re-skinned end-to-end, both consuming the Wave 1 Base layout + tokens:

1. **`src/pages/[category]/[slug].astro`** — detail page re-skinned with discipline-accent header (top border + back-pill hover state), Bricolage sans 800 uppercase h1, Context/Role/Outcome blurbs in Fraunces serif body with uppercase mono labels. Phase 2 D-04 paginated `<img>` block + `.cache.json` sidecar logic preserved byte-for-byte. Hero `<Image>` component preserved. "Open full PDF →" link restyled in Fraunces italic.

2. **`src/pages/about.astro`** — about page re-skinned on cream-paper canvas with 720px max-width container, terracotta-hover back-pill, Bricolage h1, Fraunces bio body @ 15.5px / 1.42 line-height. Phase 2 D-12/D-14 bio copy ("four lanes ... no template smell ...") preserved verbatim.

VISUAL-01 (type system) and VISUAL-02 (color tokens / discipline accent) are now applied across detail and about. Combined with the splash (03-02) and gallery (03-03) parallel slices, four of the five Phase 3 page templates are now styled — only the 404 page (Plan 05) remains.

## Files modified

| Path | Change | Why |
|------|--------|-----|
| `src/pages/[category]/[slug].astro` | Re-skinned chrome, preserved frontmatter logic + paginated block | VISUAL-01/02 detail-page surface; Phase 2 D-04 Pitfall 1 contract held |
| `src/pages/about.astro` | Re-skinned chrome, bio copy untouched | VISUAL-01/02 about surface; Phase 2 D-12/D-14 voice held |

## Commits

| Hash | Commit |
|------|--------|
| 182ce23 | feat(03-04): re-skin detail page on Base with accent header |
| 329ec65 | feat(03-04): re-skin about page on Base with Phase 3 typography |
| 45a6419 | fix(03-04): use title-case CRO labels to satisfy Phase 1+2 PIECE-02 gate |

## Verification

- `npm run build` → exit 0; 8 pages built (splash, 4 galleries, 2 piece details, about)
- `bash scripts/verify-anti-ai-tells.sh` → exit 0; all 7 gates green (no Inter, no purple gradient, no shadcn combo, no bento, no lucide, no "Built with X")
- `bash scripts/verify-build.sh` → Phase 1+2 Gates 1-14 all PASS:
  - Gate 5 PIECE-01: no iframe in piece detail HTML
  - Gate 6 PIECE-02: Context/Role/Outcome present in detail HTML (preserved via title-case-in-markup + CSS uppercase)
  - Gate 10 PIECE-04: paginated `<img>` for pages 1, 5, 10, 11, 12 all present at `/generated/pdf-thumbs/design-real-piece/*.webp`
  - Gate 11 PIECE-06: fullPdf link with `download` attr present
  - Gate 9 ABOUT-01: bio is 131 words, no banned filler
- `dist/design/design-real-piece/index.html` confirmed:
  - contains `Context`, `Role`, `Outcome` (rendered uppercase via CSS)
  - contains 5 `<img src="/generated/pdf-thumbs/design-real-piece/...">` tags (cover.webp, page-5.webp, page-10.webp, page-11.webp, page-12.webp)
  - contains hero `<img>` from `/_astro/hero.*.webp` (Astro `<Image>` output)
  - contains "Open full PDF →" with `download` attribute and `href="/source-pdfs/design-real-piece.pdf"`
  - contains back link `href="/design"`
- `dist/about/index.html` confirmed: "I'm Caleb Lim" + "four lanes" + "no template smell" + resume link

### Pre-existing FAILs (out of scope — owned by parallel siblings / Plan 05)

These FAILs are NOT caused by this plan. They are Phase 3 gates (16-17) for routes/pages owned by other plans, and they pre-existed in the worktree base before any 03-04 commit. Verified by `git stash` + re-running verify-build.sh against the pre-edit state — same FAILs surfaced.

| FAIL | Owner |
|------|-------|
| `finance has 0 non-draft pieces but dist/finance/index.html exists` (Gate 16) | 03-03 gallery slice (parallel sibling) |
| `personal has 0 non-draft pieces but dist/personal/index.html exists` (Gate 16) | 03-03 gallery slice (parallel sibling) |
| `dist/404.html missing` (Gate 17) | 03-05 (404 + ANTI-AI-CHECKLIST plan) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Title-case CRO labels for Phase 1+2 PIECE-02 gate compatibility**

- **Found during:** Task 3 verification
- **Issue:** Initial Task 1 markup rendered `<span class="label">CONTEXT</span>` / `ROLE` / `OUTCOME` (uppercase) per UI-SPEC.md "uppercase mono labels". This broke Phase 1+2 verify-build.sh Gate 6 PIECE-02 which does case-sensitive grep for substring `Context`, `Role`, `Outcome` in every detail HTML. Plan task 1 verify also wanted uppercase strings — two contracts in tension.
- **Resolution:** Render title-case (`Context`/`Role`/`Outcome`) in markup; CSS `text-transform: uppercase` on `.cro .label` produces the same visual UI-SPEC-compliant uppercase output. Phase 1+2 Gate 6 contract takes precedence — it is a load-bearing Phase 1+2 regression gate. Visual output is identical to the original UI-SPEC intent.
- **Fix:** Edited `src/pages/[category]/[slug].astro` lines 62/66/70 to title-case.
- **Commit:** 45a6419

No architectural changes. No authentication gates. No checkpoints hit (plan was fully autonomous).

## Known Stubs

None. Both pages render real content end-to-end from existing content collections + Phase 2 sidecar caches.

## Threat Flags

None. Threat register T-03-12/13/14 dispositions preserved:
- T-03-12 (paginated img src): mitigation preserved — `slug` from content-collection id + `p.file` from trusted prebuild sidecar; no user input crosses boundary.
- T-03-13 (fullPdf link): accept disposition unchanged — Phase 2 EXIF-strip + NDA gate at content authoring time.
- T-03-14 (discipline accent from URL param): mitigation preserved — `category` validated by Astro `getStaticPaths` against typed `Category` enum before the `DISCIPLINE_ACCENT` lookup.

No new endpoints, auth paths, file-access patterns, or schema changes introduced.

## Self-Check

Files exist:
- FOUND: src/pages/[category]/[slug].astro
- FOUND: src/pages/about.astro
- FOUND: .planning/phases/03-visual-design-system/03-04-SUMMARY.md

Commits exist on branch:
- FOUND: 182ce23 (feat detail page re-skin)
- FOUND: 329ec65 (feat about page re-skin)
- FOUND: 45a6419 (fix title-case CRO labels)

Build artifact:
- FOUND: dist/design/design-real-piece/index.html (Context, Role, Outcome, paginated img×5, hero, full PDF link)
- FOUND: dist/about/index.html ("I'm Caleb Lim", resume link)

## Self-Check: PASSED
