# Dark case-study pages + rotating piece carousel — Design Spec

**Date:** 2026-06-30
**Status:** Approved (brainstorm), pending plan
**Scope:** Three cohesive changes to the browsing experience:
1. **Dark mode** the case-study (slug) pages so every page except the landing/splash and the about page is dark. (Category pages are already dark.)
2. **Remove the `/01` count** (and the count meta) from the category page heading.
3. A new **constantly-rotating piece carousel** with a highlighted, named center item, placed on the splash (all pieces) and on each category page (that room's pieces).

The case-study layout toggle (`2026-06-30-case-study-layout-toggle-design.md`) is **parked** ("looks great for now"); it is NOT built here. Both it and this work touch `[slug].astro`, so the toggle, if revived, layers on after this.

## Goal

A consistent dark gallery experience: the splash and about stay light/editorial, and everything behind them (category rooms and individual case studies) shares one dark theme. A recruiter can also skim the whole body of work as a rotating carousel that always foregrounds one piece by name, on both the splash and inside each room.

## Constraints

- **Anti-vibecode house rules** apply: one accent per view, soft diffuse shadows (no hard slabs), no side accent stripes, raised surfaces over strokes, 4px spacing scale (`--sp-*`) only, full interactive state set on controls, sentence-case copy, no em dashes. **Dark-mode rule: raised surfaces are LIGHTER than the canvas** (mirror the existing category-page idiom: `rgba(242, 235, 219, 0.05)` panels, lit top inset, soft dark drop shadow).
- **Tokens only.** Colours/sizes/spaces/radii from `src/styles/tokens.css`. No new tokens, no raw `font-size: Npx`. Accent stays the inline per-discipline `--accent` (from `DISCIPLINE_ACCENT[category]`).
- **Reduced motion.** The carousel auto-advance MUST stop under `prefers-reduced-motion: reduce`; manual prev/next stays usable.
- **Accessibility.** Carousel items are real links; auto-advance is decorative and pauses on hover/focus; keyboard users get prev/next controls and visible focus.
- **Preserve machinery.** No change to `getStaticPaths` (params/sort) on either page, the slug page's hero `<Image>` priority/LCP, the `.cache.json` PDF block, the "Open full PDF" link, the prev/next pager, or `FeaturedPiece`/`Gallery` (the carousel is added above them; featured work is kept).

## 1. Dark mode for the case-study (slug) pages

`src/pages/[category]/[slug].astro` currently renders light (`<Base bg="paper">`). Convert to the dark theme that the category pages already use, keeping each piece's discipline `--accent`.

- Switch the Base background to `bg="ink"`.
- Restyle every block in the scoped `<style>` for the dark canvas, mirroring `[category].astro`'s dark idiom:
  - **Text:** body/headings flip to `var(--paper)` (with the existing opacity steps for secondary text). Eyebrows/labels stay mono, dimmed paper.
  - **Back pill:** adopt the category page's dark back-pill style verbatim (paper surface on ink, lit edge, soft shadow; accent on hover).
  - **Header rule / dividers:** the title top-border keeps `var(--accent)`; hairlines become `rgba(242, 235, 219, 0.14)` like the category head.
  - **Deliverable pills + Outcome band:** raised surfaces become the dark idiom — `rgba(242, 235, 219, 0.05)` lifted panel, `inset 0 1px 0 rgba(255,255,255,0.06)`, soft dark drop shadow — instead of the light `color-mix(... #ffffff)` lifts. Outcome label keeps the accent.
  - **Pull-quote:** paper ink text; the mark stays the accent.
  - **PDF slides, full-pdf link, pager:** dark-appropriate colours (paper text, accent on hover), structure unchanged.
- **404 page** (`src/pages/404.astro`): also dark for consistency (it is neither landing nor about). Light touch only.
- The splash (`index.astro`) and about (`about.astro`) are **untouched** (stay light).

## 2. Remove the count from the category heading

In `src/pages/[category].astro`:
- Heading: drop the `/{countStr}` em. `<h2>{label} <em>{isEmpty ? 'soon' : ...}</em></h2>` becomes just `<h2>{label}</h2>` for populated rooms; the empty room keeps its "soon" treatment (or drops the em entirely — decide at implementation, keeping empty-room wording intact).
- Meta line: drop the `{countStr} PIECES ·` count prefix. Keep the `UPDATED MAY 2026` freshness note (and the empty room's `COMING SOON`). Remove the now-unused `countStr`/`--fs-deco-numeral` only if nothing else references them.

## 3. The rotating piece carousel (new component)

New component `src/components/PieceCarousel.astro` (+ its scoped script). A horizontal coverflow that auto-advances and always foregrounds one piece.

**Markup / data:**
- Props: `pieces: CollectionEntry<'pieces'>[]`, plus an optional `accent`/context for styling. Each item is an `<a href="/{category}/{id}">` wrapping the piece hero thumbnail (`<Image>`, lazy) and its title.
- Renders the full list once; the visual coverflow (center scaled up, neighbors smaller/dimmed) is done with CSS transforms driven by a small client script that tracks the active index.

**Behaviour:**
- **Center highlight + name:** the active (center) item is full-size, full-opacity, and shows its **title** prominently ("the name at hand"). Neighbors are scaled down (~0.8) and dimmed (~0.5 opacity); their titles are hidden or muted.
- **Constantly rotating:** auto-advances one step every ~3s, looping infinitely (modular index; edge items wrap). Smooth transition.
- **Pause** on hover and on keyboard focus within the carousel; resume on leave/blur.
- **Manual control:** prev/next buttons (raised dark pills, accent on active/hover, aria-labels) and the items themselves are links — clicking any item navigates to that piece.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables auto-advance entirely; the carousel renders centered on the first item and the user steps with prev/next.
- **Graceful 1..N:** with 0 pieces the component renders nothing. With exactly 1 piece it shows that piece centered and static, no auto-advance, no prev/next. Rotation/controls appear only at 2+.
- **Mobile:** narrower; neighbors become slim peeks on each side, center + name still dominate; no horizontal page scroll. Auto-advance still respects reduced-motion.

**Styling:** dark idiom (it lives only on dark pages). One accent per view (the active dot / control / center ring uses the page `--accent`; everything else neutral paper-on-ink). Soft diffuse shadow on the raised center card; no side accent stripe.

## 4. Placements

- **Splash (`index.astro`):** a carousel of **all non-draft pieces** site-wide. Placed as its own band in the existing splash composition (e.g., below the hero/cards band), not displacing the splash's <30s primary read (name + discipline picker). Splash stays light overall, but the carousel itself uses its dark-card treatment as a deliberate contained band (or a light-surface variant if it reads better on the cream canvas — pick at implementation, keeping anti-vibecode). NOTE: the splash is the highest-stakes screen; the carousel must enhance, not bury, the picker.
- **Category page (`[category].astro`):** a carousel of **that room's non-draft pieces**, placed above the kept `FeaturedPiece` + `Gallery`. With the current content (1 piece per room) it shows a single static item; it begins rotating once a room has 2+ pieces.

CONTENT REALITY (flagged to owner): design=1, saas=1, finance=draft, personal=0 non-draft pieces today, so per-room carousels are static (1 item) and the splash carousel has 2 items. The component is built to light up as pieces are added.

## 5. Anti-vibecode self-check (before "done")

Dark surfaces lighter than the ink canvas; one accent per view on each page; soft diffuse shadows only; no side accent stripes; raised surfaces not strokes; 4px-scale spacing; carousel controls have a single padding level and the full interactive state set; sentence-case copy; zero em dashes; reduced-motion stops auto-advance; mobile has no horizontal scroll and the splash picker stays the primary read.

## 6. Files

- Modify: `src/pages/[category]/[slug].astro` — `bg="ink"` + dark restyle of scoped CSS.
- Modify: `src/pages/[category].astro` — remove count from heading + meta; add `<PieceCarousel>` above featured work (current room's pieces).
- Modify: `src/pages/index.astro` — add `<PieceCarousel>` band (all non-draft pieces).
- Modify: `src/pages/404.astro` — dark.
- Create: `src/components/PieceCarousel.astro` — the carousel (markup, scoped styles, client script).

## 7. Verification

- `npm run build` succeeds; both real-piece pages + all category pages + splash emit. No NEW `astro check` error referencing changed files.
- Slug page dark: grep `dist/<cat>/<slug>/index.html` for `bg="ink"` outcome (dark body class/inline) and confirm paper-on-ink; visually confirm the design (ochre) and saas (sage) pieces are dark with their own accent.
- Category heading: grep confirms no `/01` / no `NN PIECES` count; `UPDATED MAY 2026` retained; empty-room stub intact.
- Carousel: on splash + a populated category page, Playwright confirms center item enlarged with visible title, auto-advance after ~3s, pause on hover, prev/next work, `prefers-reduced-motion` stops auto-advance, mobile shows peeks with no horizontal scroll, and a 1-item room renders static with no controls.
- `npm run verify:anti-ai` and `npm run test:smoke`: zero NEW failures versus base (both gates known-stale).

## Out of scope

- Filling the `personal`/`finance` rooms (blocked on real content).
- The case-study layout toggle (parked, separate spec).
- Dark mode for the splash and about (explicitly excluded by the owner).
- Motion/view-transitions elsewhere, theme toggle (this dark mode is a fixed per-page theme, not user-switchable).
