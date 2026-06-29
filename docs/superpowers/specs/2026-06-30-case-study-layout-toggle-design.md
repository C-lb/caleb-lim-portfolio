# Case-study layout toggle — Design Spec

**Date:** 2026-06-30
**Status:** Approved (brainstorm), pending plan
**Scope:** Add a permanent, visitor-facing layout toggle to the case-study detail page `src/pages/[category]/[slug].astro`. The toggle flips the top region of the page between the existing **stacked** layout and a new **split** layout (hero left, text right), and remembers the visitor's choice. Also: small piece title in the split layout, and discipline labels with the " / " slash removed (the slash removal is already applied).

## Goal

A recruiter can read a case study in whichever shape they prefer. The new **split** layout uses the full page width with the hero image pinned left and the narrative in a right column, reading like a magazine case study. The existing **stacked** layout stays available. The choice persists across pages and reloads with no flash of the wrong layout.

## Constraints

- **Anti-vibecode house rules** apply to every new/changed element: one accent per view, soft diffuse shadows (no hard slabs), no side accent stripes, raised surfaces over strokes, 4px spacing scale (`--sp-*`) only, full interactive state set on the toggle control, sentence-case copy, no em dashes.
- **Tokens only.** Every colour / size / space / radius comes from `src/styles/tokens.css`. No new tokens, no raw `font-size: Npx` literals (Gate 25). The raised surfaces reuse the existing `.b-cat-back` `color-mix(... #ffffff)` + soft-shadow idiom already in this file.
- **Preserve the working machinery.** `getStaticPaths` (params + sort), the hero `<Image>` (priority/LCP), the `.cache.json`-driven paginated PDF block, the "Open full PDF" link, and the same-discipline prev/next pager all stay functionally unchanged. The hero stays a single `<Image>` instance shared by both layouts (no duplicate hero in the DOM).
- **One DOM, two layouts.** Both layouts render from the same markup, switched by a class. No JS-driven DOM rebuild.
- **Route contract unchanged.** No change to `getStaticPaths` params.

## 1. Markup restructure

The top region (everything above the PDF slides) becomes one grid wrapper so both layouts come from the same DOM. The back-pill row stays above the wrapper; the PDF slides / full-pdf link / pager stay below it, full-width, untouched.

```
<article class="detail" data-layout=?>          (data-layout reflects current choice)
  <div class="detail-toprow">
    <a back-pill>                                (unchanged)
    <div class="layout-toggle">  two-option segmented control (split | stacked)
  </div>
  <div class="case-grid">
    <figure class="case-media">  hero <Image>  </figure>
    <header class="case-head">   h1 title + meta strip (discipline · year? · pills) </header>
    <div    class="case-narrative"> Context (lead) + Role + pull-quote </div>
    <section class="outcome-band">  Outcome </section>
  </div>
  <pdf slides>        (unchanged, full width)
  <Open full PDF>     (unchanged)
  <prev/next pager>   (unchanged)
</article>
```

## 2. The two layouts (CSS only, keyed off the article class)

**Stacked (`[data-layout="stacked"]`) — the current look, 960px:**
- `.case-grid` is a flex column. Child order via `order`: head (title + meta) → media (hero) → narrative → outcome. This reproduces today's order exactly (title, meta, hero, Context, Role, pull-quote, Outcome).
- Title keeps the current large `--fs-cat`.

**Split (`[data-layout="split"]`) — new, wider (max-width ~1200px):**
- `.case-grid` is a 2-column grid using named areas so the hero spans all text rows:
  ```
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-areas:
    "media head"
    "media narrative"
    "media outcome";
  column-gap: var(--sp-8);
  ```
- `.case-media` → `grid-area: media`; `position: sticky; top: var(--sp-6)` so the hero stays in view while the taller right column scrolls. (Grid stretches the media cell to the column height, so sticky has room to travel.)
- Title is **small**: `--fs-ttl` (22px), uppercase, same weight/letter-spacing treatment, so it reads as a modest column heading rather than the giant stacked title.
- `.case-head`, `.case-narrative`, `.outcome-band` sit in the right column, stacked, in document order.

**Mobile (≤ ~760px):** the split layout collapses to the stacked flex layout (single column, hero between head and narrative), and the toggle control is hidden. Phones always get the clean stacked read regardless of stored choice.

## 3. The toggle control

- A small **segmented two-option control** (raised pill, reusing the `.b-cat-back` raised idiom) on the `.detail-toprow`, right-aligned opposite the back pill.
- Two `<button>`s, each a small inline SVG icon: "side by side" (split) and "stacked" (stacked). Each has an `aria-label` ("Side by side layout" / "Stacked layout") and `aria-pressed` reflecting the active state. The group is keyboard-operable with visible `:focus-visible`.
- Active option: subtly raised/inked; inactive: flat. One accent at most (active state may use the inline `--accent`, kept to a single moment).
- Hidden under the mobile breakpoint (`@media (max-width: 760px)`).

## 4. Default, persistence, no-flash

- **Default layout: split.** SSR renders `data-layout="split"` so default visitors never flash.
- On click, set `data-layout` on the article, update the two buttons' `aria-pressed`, and write `localStorage["cl-case-layout"]` = `"split"` | `"stacked"`.
- **No-flash restore:** a tiny `<script is:inline>` placed early reads `localStorage["cl-case-layout"]` and, if it is `"stacked"`, sets the article's `data-layout` before paint. (Only non-default choosers could see a sliver; default visitors never do.) The script must be defensive (wrapped in try/catch; localStorage may be blocked).
- Choice is global (one key), so it carries across every case-study page.

## 5. Discipline label slash removal (already applied)

`backLabel` and `metaLabel` in this file: `Graphic / Design → Graphic Design`, `Financial / Models → Financial Models`, `Personal / Projects → Personal Projects`. `SaaS` unchanged. (Done in the working tree; the plan only needs to keep them.)

## 6. Anti-vibecode self-check (before "done")

One accent fill per view (accent only on the existing header rule, eyebrows, pull-quote mark, outcome label, and the toggle's active state); soft diffuse shadows only; no side accent stripe; raised surfaces not strokes; 4px-scale spacing; the toggle and outcome band each have a single padding level; sentence-case copy; zero em dashes; mobile collapses to a single column with the toggle hidden and no horizontal scroll.

## 7. Files

- Modify: `src/pages/[category]/[slug].astro` — markup restructure (toprow + grid wrapper), both-layout CSS, the toggle control markup, the persistence script. Labels already de-slashed.

(No schema change; no content change; no new dependency.)

## 8. Verification

- `npm run build` succeeds; both real-piece pages emit. No NEW `astro check` error referencing the file.
- Grep `dist/` for a real piece: `data-layout="split"` present (SSR default), `layout-toggle` control present, both `case-media` and `case-head` present once (single hero instance).
- Playwright at desktop: default load shows split (hero left, small title, sticky hero on scroll). Click the stacked option → reflows to the current stacked order (title, hero, Context, Role, pull-quote, Outcome) with the large title. Reload → stays stacked (persisted), no flash. Click split → back. At mobile width: single column, toggle hidden, no horizontal scroll, in both stored states.
- `npm run verify:anti-ai` and `npm run test:smoke`: zero NEW failures versus base (both gates are known-stale; the signal is "no new failures").

## Out of scope

- Filling the `personal` / `finance` rooms (blocked on real content).
- Any change to `getStaticPaths`, the PDF rasterization pipeline, or the prev/next contract.
- Applying the same toggle to non-case-study pages.
- Motion / dark mode (Tier 3).
