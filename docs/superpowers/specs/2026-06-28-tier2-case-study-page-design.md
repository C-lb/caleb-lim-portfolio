# Tier 2 — Case-study detail page — Design Spec

**Date:** 2026-06-28
**Status:** Approved (brainstorm), pending plan
**Scope:** Reshape `src/pages/[category]/[slug].astro` from a flat "filled-in form" into an editorial case study, and add three optional, graceful-degrading content fields. Tier 2's other half (filling the `personal` / `finance` rooms) is **out of scope** here — it is blocked on Caleb's real content and is not addressed by this spec.

## Goal

A recruiter who clicks a featured piece lands on a page that reads like a confident case study, not a template. The page tells a situation -> action -> payoff arc, surfaces scope at a glance, and elevates the Outcome (the thing recruiters scan for) instead of burying it as a third equal text block. The page must ship **now** against the two existing real pieces (PVL identity in `/design`, PVL marketing in `/saas`) with zero invented content.

## Constraints

- **Anti-vibecode house rules** apply to every new/changed element: one accent per view, soft diffuse shadows (no hard slabs), no side accent stripes, raised surfaces over strokes, 4px spacing scale (`--sp-*`) only, full interactive state set where interactive, sentence-case copy, no em dashes.
- **Tokens only.** Every colour / size / space / radius comes from `src/styles/tokens.css`. Accent is always the inline `--accent` (set from `DISCIPLINE_ACCENT[category]`), never a hard-coded hex.
- **Type is unified:** `--sans` / `--serif` / `--mono` all resolve to "DM Sans Variable". Do not reintroduce a serif face. `--serif` is kept only as the token name for existing `font-style: italic` rules.
- **No content invented.** Backfill of the two real pieces uses only their own existing words. `year` is left empty (flagged for Caleb) rather than guessed.
- **Preserve the working machinery.** The back pill, the hero `<Image>` (priority/LCP), the `.cache.json`-driven paginated PDF block, the "Open full PDF" link, and the same-discipline prev/next pager all stay functionally unchanged. Their sort/contract logic in `getStaticPaths` is untouched.
- **Route contract unchanged.** No change to `getStaticPaths` params.

## 1. Schema change — `src/content.config.ts`

Add three optional fields to the `pieces` collection schema. All optional, so the two current pieces stay valid and any field renders only when present.

```ts
// Tier 2: optional case-study metadata. Each renders only when set, so existing
// pieces remain valid and an absent field simply disappears from the layout.
year: z.string().optional()
  .describe('Display year or range, e.g. "2025" or "2024-2025". String (not number) to allow ranges. Use a hyphen, never an em dash.'),
deliverables: z.array(z.string()).optional()
  .describe('Short scope tags shown in the meta strip, e.g. ["Logo system", "Photoshoot art direction", "Shirt prints"]. Keep each 1-4 words.'),
pullQuote: z.string().optional()
  .describe('One editorial line given large treatment between the narrative and the PDF slides. Lift from the work or the result; keep it to one sentence.'),
```

`outcomeTagline` (already present, deferred/unused) is left as-is; `pullQuote` is the field that ships.

## 2. Page structure — `src/pages/[category]/[slug].astro`

New top-to-bottom flow (Approach A, editorial single column, max-width 960px):

```
← back pill                              (unchanged)
TITLE                                    (unchanged)
meta strip:  Discipline · Year? · [deliverable tags?]
─────────────────────────────────────
full-width hero <Image>                  (unchanged — priority, LCP)
─────────────────────────────────────
Context   lead intro (slightly larger body, the situation)
Role      standard body (what Caleb did)
─────────────────────────────────────
"pull quote"                             (large, only if pullQuote set)
─────────────────────────────────────
Outcome   elevated payoff band (accent eyebrow, raised surface, heavier)
─────────────────────────────────────
PDF slides → Open full PDF → prev/next   (all unchanged)
```

Key behaviours:
- **Role stays prose.** It is a multi-sentence paragraph in the real content, so it is NOT collapsed into the meta strip. The meta strip carries only the short scannable fields.
- **Context + Role** group as the narrative body. Context gets a modest size bump as the lead (`--fs-body` base, lead variant slightly larger via line-height/weight, no new font-size token unless `--fs-ttl` 22px reads better for the lead sentence — pick during implementation, tokens only).
- **Outcome** is lifted out of the old equal C/R/O stack into its own band: accent eyebrow ("Outcome"), sits on a raised surface `color-mix(in oklab, var(--paper) 88%, #ffffff)` with a single padding level and a soft diffuse shadow, heavier/!larger label. This is the page's payoff.
- **Every optional block is conditional.** `{piece.data.year && ...}`, `{deliverables?.length && ...}`, `{pullQuote && ...}`. Absent fields leave no empty wrappers.

### Meta strip
- Mono token type (`--mono`, `--fs-mono` 11px), uppercase, dimmed (opacity ~0.6) for the discipline + year, separated by a middot (`·`).
- Discipline label: reuse a clean per-category map (mirror the existing `backLabel` text minus the arrow, e.g. "Graphic / Design", "Financial / Models", "Personal / Projects", "SaaS").
- Deliverables: small **raised** pills — `--paper` lifted toward white, soft shadow, no stroke, no side stripe, `--fs-mono`, pill radius `999px`, padding on the 2:1 ratio. They wrap on narrow screens.

### Pull-quote
- Large DM Sans (`--fs-q` clamp(22px,3vw,38px) or `--fs-card`), tight tracking, neutral `--ink`, `--lh-tight`-ish line-height.
- One small accent moment only: an accent-coloured eyebrow or a short opening mark. No coloured slab, no side stripe, no second accent.
- Generous vertical space above and below (`--sp-8` / `--sp-10`).

## 3. Anti-vibecode self-check (applies before "done")

One accent fill per view (accent appears on the existing header rule + eyebrows only); soft diffuse shadows only; no side accent stripe; raised surfaces not strokes; 4px-scale spacing; meta pills + outcome band have a single padding level (no nested cards); sentence-case copy; zero em dashes; mobile gets more vertical air and the meta strip wraps without horizontal scroll.

## 4. Backfill the two real pieces (honest content only)

Edit the two existing `index.md` files to add the new fields using their **own existing words**:

- `design-real-piece` (PVL identity): `deliverables` lifted from its role prose ("Logo system", "Photoshoot art direction", "Shirt prints"); `pullQuote` lifted from its outcome (e.g. "One durable mark the team could apply themselves, replacing three ad-hoc looks.").
- `saas-real-piece` (PVL marketing): `deliverables` + `pullQuote` derived the same way from its existing copy (read the file at implementation time; do not invent).
- `year`: **left empty** on both. Flag to Caleb that supplying a year (and confirming/adjusting the auto-derived deliverables + pull-quote) is a 2-minute follow-up. The field degrades gracefully when absent.

The `finance-real-piece` is `draft: true` (excluded from build) and is not touched.

## 5. Files

- Modify: `src/content.config.ts` — three optional fields.
- Modify: `src/pages/[category]/[slug].astro` — markup restructure + scoped styles.
- Modify: `src/content/pieces/design-real-piece/index.md` — backfill deliverables + pullQuote.
- Modify: `src/content/pieces/saas-real-piece/index.md` — backfill deliverables + pullQuote.

## 6. Verification

- `npm run build` succeeds; `npx astro check` reports no errors referencing the changed files.
- Grep `dist/` for the new blocks on a real piece path (e.g. `dist/design/<slug>/index.html`): meta strip, deliverable pills, pull-quote, Outcome band present; absent-field cases (no `year`) emit no empty wrapper.
- Playwright screenshots of one populated piece at desktop and mobile widths: editorial arc reads top to bottom, Outcome visibly elevated, no horizontal scroll on mobile.
- `npm run verify:anti-ai` exits 0 (no banned filler, no em dashes introduced).
- `npm run test:smoke` introduces **zero new failures versus base** (the smoke/build scripts are known-red against an obsolete earlier spec; the signal is "no NEW failures", per the Tier 1 plan note).

## Out of scope

- Filling the `personal` and `finance` rooms (blocked on real content).
- Per-piece OG images (Tier 1 ships one static OG; unchanged here).
- Motion / dark mode (Tier 3).
- Any change to `getStaticPaths`, the PDF rasterization pipeline, or the prev/next contract.
