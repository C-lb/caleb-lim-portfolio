# Phase 2: Asset Pipeline + Real Content — Discussion Log

**Discussion date:** 2026-05-10
**For:** Human reference (audits, retrospectives) — NOT consumed by downstream agents.

---

## Areas Discussed

User selected all four candidate areas (multiSelect):
1. PDF source storage strategy
2. PDF rasterizer output spec
3. `pdfPaginate` selection + default
4. Content authoring readiness + scope

Plus a follow-up batch on piece count + bio/resume source state.

---

## Area 1: PDF source storage strategy

**Question:** Where should source PDFs live, and where does the rasterizer run?
**Options presented:**
- A) Commit PDFs + outputs; CF Pages runs rasterizer (recommended) — repo grows ~200–500MB; cleanest mental model
- B) Local-only rasterization, commit only PNG outputs — repo stays small; user becomes manual trigger
- C) Hybrid: small PDFs committed, large gitignored — most flexible, also most complexity

**User selected:** A — Commit PDFs + outputs; CF Pages runs rasterizer.
**Captured as:** D-01, D-02, D-03 in CONTEXT.md.
**Notes:** Reconciles Phase 2 SC1's apparent contradiction ("runs as pre-build" + "outputs committed so Caleb never runs it") via a `prebuild` hook that's hash-incremental — committed outputs make warm CF Pages builds no-ops, but the hook still runs cleanly on cold/local builds.

---

## Area 2: PDF rasterizer output spec

**Question:** Output format and resolution for rasterized hero covers?
**Options presented:**
- A) WebP @ 1600× long-edge, ~80KB target (recommended)
- B) PNG @ 1600× — sharper text, ~250–500KB each
- C) WebP @ 2000× — sharper hero, ~150KB each

**User selected:** A — WebP @ 1600px, ~80KB target.
**Captured as:** D-04, D-05, D-06 in CONTEXT.md.
**Notes:** Astro's `<Image>` re-derives smaller variants from the WebP source via Sharp. Total committed-to-git size for v1 piece set: ~1.5MB. Per-piece override available if a specific deck has fine typography that degrades.

---

## Area 3: `pdfPaginate` selection + default

**Question:** How should `pdfPaginate` work — default behavior + page selection?
**Options presented:**
- A) Opt-in via frontmatter; user picks the pages (recommended) — `pdfPaginate: [1, 5, 12]`
- B) Opt-in via frontmatter; auto-pick (first/middle/last/evenly-spaced)
- C) Opt-in via frontmatter; first N pages

**User selected:** A — Opt-in, user-curated array of page numbers.
**Captured as:** D-07, D-08, D-09 in CONTEXT.md.
**Notes:** Triggers a minor Phase 1 → Phase 2 schema migration (boolean → array of integers). No data migration needed since the field hasn't been used yet. Pages render in array order, not sorted — lets user lead with the punchline.

---

## Area 4: Content authoring readiness + scope

**Question:** Actual content-readiness state for Phase 2?
**Options presented:**
- A) Most assets in hand, blurbs need drafting
- B) Partial coverage; ship with what's ready, FUTURE-06 backfills
- C) Almost nothing drafted yet — Phase 2 is heavy lift
- D) Ready to ship; everything drafted offline

**User selected:** B — Partial coverage; ship with what's ready, FUTURE-06 backfills.
**Captured as:** D-10, D-11 in CONTEXT.md.

---

## Follow-up batch

### Q1: Piece count

**Options:** 5–7 / 8–12 / inventory-first
**User selected:** 5–7 pieces total — minimum viable launch.
**Captured as:** D-10. Empty disciplines drop their card per SPLASH-04 (D-11). Phase 1's Personal placeholder gets deleted in Phase 2 regardless.

### Q2: About bio + resume source state

**Options:** Draft together / draft offline / resume exists + bio draft help
**User selected:** Draft together during Phase 2 (recommended).
**Captured as:** D-14, D-15. Claude generates 3–4 bio variants from PROJECT.md + user context; user picks/edits/locks. Resume PDF supplied by user, validated against ≤1MB / EXIF-stripped constraints.

---

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. Most notable:
- Backfilling toward the full FOUND-05 ~18-piece target → FUTURE-06, post-launch.
- Per-piece secondary images / detail spreads → FUTURE-04, v2.
- Gallery "outcome tagline" cards → CONTENT-01, v2.
- Magazine-maximalist visual system → Phase 3.

---

## Claude's Discretion (decisions made without asking)

- Pre-build invocation mechanism: npm `prebuild` lifecycle hook (vs Astro integration's `astro:build:start`). Simpler, equally idiomatic.
- Output filename convention: `cover.webp` for page 1, `page-{N}.webp` for paginated pages where {N} is the literal source page number. Preserves traceability when user references a specific slide.
- `pdfPaginate` page numbers are 1-indexed in user-facing frontmatter (matches human counting); script converts to pdfjs's 0-indexed internal API.
- Smoke verifier (`scripts/verify-build.sh`) will be extended in Phase 2: assert generated thumbs exist, assert resume PDF size ≤1MB, assert About bio word count is in the 80–150 range.
- Phase 1's `pdf-poc.mjs` may stay or be deleted per the user's wish at execution time — Phase 1 D-05 already flagged it as "throwaway"; this discussion didn't relitigate.
