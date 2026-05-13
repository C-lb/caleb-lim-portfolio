# Phase 3: Visual Design System - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning
**Mode:** mvp

<domain>
## Phase Boundary

Phase 3 lands the locked Magazine-maximalist visual system from sketch 001 across the entire site. The Phase 1+2 walking skeleton ships with bare HTML chrome — Phase 3 replaces it with the full design system: Bricolage Grotesque + Fraunces italic + JetBrains Mono type triple, warm cream + ink black + four discipline accents, asymmetric magazine-grade gallery layouts with rotated cards and decorative geometry, and an inverted ink-black canvas for category pages.

Nine requirements anchor the phase: SPLASH-01..05 (splash composition, four-card picker, asymmetric galleries, thin-gallery / empty-state handling, on-brand 404) and VISUAL-01..04 (type system, color system, layout language, anti-AI-tell verification).

Phase 3 owns: type loading + custom CSS design system, splash hero band (portrait + name + roles + bio + question bar + four cards above the fold @ 1280px), gallery templates (3 piece-count buckets), category-page inverted treatment, detail-page styling carrying the discipline accent, custom 404, and the anti-AI-tell verification gate.

Phase 3 does NOT own: header chrome (mailto / LinkedIn / resume header link, Phase 4), prev/next within discipline (PIECE-05, Phase 4), mobile/perf/a11y polish + reduced-motion verification (Phase 5), production deploy (Phase 6). Phase 3 styles must not BREAK mobile, but mobile polish is Phase 5's bar.

</domain>

<decisions>
## Implementation Decisions

### Discipline → Accent Color Mapping (load-bearing across gallery + detail)

- **D-01:** Discipline-to-accent mapping is locked per sketch 001's splash sequence — `design = terracotta #e85d2a`, `finance = cobalt #1947ff`, `personal = electric lime #d4ff3a`, `marketing = plum #5a1a55`. This mapping becomes a brand association across the splash card, gallery hero numerals, gallery back-pill, and the detail-page hero treatment. Once shipped, swapping it requires re-checking the splash composition (sketch tuned the four-card color rhythm to exactly this order) and rewriting any social/share imagery. Codify the mapping in a single TypeScript const (`src/styles/disciplines.ts` or extend `src/content/categories.ts`) so the value is referenced from every consuming surface, never hard-coded.
- **D-02:** Category page background is **ink-black across all four disciplines** per sketch 001's category screen. The accent color appears on: (a) the category title's italic-Fraunces numeral (e.g. "GRAPHIC / DESIGN" with the "/" or piece count italic-set in the discipline accent), (b) the back-pill chip ("← splash"), and (c) 1–2 tile background fills per gallery. Accent dosage gives the four pages identity without flooding backgrounds in lime or plum at full bleed (which fight thumbnail covers). Splash + 404 + about + detail body remain on the warm-cream paper bg.
- **D-03:** Splash card decorative geometry maps per sketch 001's k1–k4 positions onto the locked discipline mapping: Design (k1, terracotta) = outline circle top-right; Finance (k2, cobalt) = oversized italic Fraunces numeral top-right in lime; Personal (k3, lime) = horizontal dotted line through center; Marketing (k4, plum) = lime triangle top-right. These decorations are part of the brand vocabulary, not per-card surprises — reuse them inside gallery tiles for visual cohesion (e.g. the "hero" tile in each gallery picks up its discipline's geometry).

### Asymmetric Gallery Layout System

- **D-04:** Galleries use **fixed templates per piece-count bucket**, NOT per-piece `tileSize` frontmatter and NOT a deterministic algorithm. The Phase 1 `order: number` field already in `src/content.config.ts` is the only per-piece input — its value picks the slot in the active template. Caleb keeps the same low-friction "set order, ship piece" workflow he has today; the template owns tile sizing, rotation, and decorative placement.
- **D-05:** Three buckets, three template `.astro` files (one per bucket — keeps the markup readable and the slot-to-order mapping explicit):
  - **Bucket A — 1–2 pieces** (`GalleryA12.astro`): full-bleed hero tile (order 1) + one wide tile beneath (order 2). Used for Personal and Finance at current counts. Holds up at 2 pieces — no thin-placeholder feel — and degrades gracefully if a category drops to 1 piece (just the hero).
  - **Bucket B — 3–5 pieces** (`GalleryB35.astro`): sketch 001's exact 5-tile composition — `p1` 3×2 hero (order 1), `p2` 3×1 (order 2), three 2×1 tiles (orders 3–5). Tile rotations and per-tile colors per the sketch (terracotta hero, cobalt wide, lime/plum/teal small tiles). Pieces 4 and 5 absent → empty grid cells absorbed by the template (don't render placeholder tiles).
  - **Bucket C — 6–8 pieces** (`GalleryC68.astro`): Bucket B + an extra row of three 2×1 tiles (orders 6–8). Used for Design and Marketing at target volume. Tile rotations vary slightly from B's pattern so the second row doesn't read as a literal repeat.
- **D-06:** Bucket selection is decided at build time per gallery: `pieces.length` chooses the template. A 9-piece category (above the 6–8 ceiling) is treated as Bucket C with an explicit `console.warn` at build time and the extras truncated visually (under-display rather than break the layout). FOUND-05 caps v1 at ~7 per category, so the 9+ branch is paranoia, not a contract.
- **D-07:** Empty discipline (zero non-draft pieces) drops its splash card per SPLASH-04, codified Phase 2 D-11. The category route also returns 404 (not a styled empty state) — keeps the "if a card exists, the room behind it has work in it" contract honest. The 404 page links back to splash so the recruiter never lands in a dead end.

### Splash Hero Content (above-the-fold composition @ 1280px)

- **D-08:** Caleb supplies a real portrait image (jpg/webp) during execution. The hero band's left column (280px wide per sketch grid) renders it via Astro's `<Image>` component for build-time optimization. The sketch's stylized placeholder pattern (dark canvas + duotone overlay + dashed circle + "PHOTO" caption) is the **fallback only** if the photo isn't ready by execution time — flagged as a Phase 3 blocker, not a Phase 4 carry-over. Portrait is rotated -1.2° per sketch.
- **D-09:** Splash bio block is a **shorter teaser distilled from /about** — ~40–60 words, NOT the full 122-word /about bio (would crowd hero band, push the four cards below the fold on a 1280px viewport). The teaser leads with the cross-functional pitch and ends with a hook that points at the "What do you wish to see?" question bar. Voice contract from Phase 2 D-14 carries forward (no "passionate / multidisciplinary / intersection of"). Single source of truth: /about owns the long bio; splash teaser is a separate string in the splash component (not extracted from /about at build time — splash needs hand-tuned line breaks for the sticker-style block).
- **D-10:** Roles list under the name renders **four roles matching the four disciplines**: `analyst · brand strategist · designer · marketer` (or close — Caleb may tune wording during execution as long as the 1:1 mirror to discipline cards is preserved). Renders in sketch's odd/even alternation: odd indices in cobalt sans, even indices in italic terracotta Fraunces. Mirrors discipline order: analyst → finance card, brand strategist → marketing card, designer → design card, marketer → marketing card. (Roles list ordering and discipline mapping are visually decoupled — the mirror is conceptual, not positional, since the sketch's hero-band roles list reads horizontally while the cards below have their own visual rhythm.)

### Motion Baseline (Phase 3 ships sketch-equivalent only)

- **D-11:** Motion contract for Phase 3 is **sketch 001 equivalent only** — no JS-driven motion, no GSAP, no View Transitions, no scroll-driven reveals. Specifically: (a) splash card hover is `translateY(-2px) rotate(-0.3deg)` per sketch CSS, (b) gallery tile hover is `scale(1.02) rotate(-0.3deg)`, (c) "open to roles" status pill in topbar pulses (1.6s ease-in-out infinite, sketch keyframes verbatim). All pure CSS. Zero JS dependency added in Phase 3 (no `motion` package install, no `gsap`).
- **D-12:** MOTION-01..04 (View Transitions, scroll reveals, custom cursor, magnetic cards) all stay deferred to v2. Pulling MOTION-01 (View Transitions on splash→gallery) forward was considered and rejected — not because it's hard (Astro 5 has it free), but because the magnetic-feeling "morph card into hero" effect requires careful tuning per gallery template and would expand Phase 3's surface. Ship the static system first; v2 layers motion on a known-good base.
- **D-13:** Reduced-motion handling is owed to Phase 5 (FOUND-03), but the Phase 3 motion list is small enough that wiring `@media (prefers-reduced-motion: reduce)` to disable hover translates and the pulsing pill is **2 lines of CSS** — include them now rather than create a Phase 5 retrofit. The verification gate (toggle OS setting, walk the site) still belongs to Phase 5; Phase 3 just doesn't ship motion that ignores the media query.

### 404 Page

- **D-14:** Custom 404 lives at `src/pages/404.astro` and **returns HTTP 404** (Astro emits `404.html` at build time; Cloudflare Pages serves it on unknown routes with the right status). Voice + visual: cream-paper canvas (matches splash, NOT inverted black like categories), display-set "404" or "NOT FOUND" in Bricolage huge, one dry caption ("This page doesn't exist. The four that do are below."), four discipline cards repeated underneath (reuses the splash's `DisciplineCard` component — single source of truth). No animation beyond the same card hover from D-11.

### Type Loading Strategy

- **D-15:** Self-host the three faces from Fontsource (`@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/fraunces`, `@fontsource-variable/jetbrains-mono`) — npm-installable variable woff2 files, MIT-licensed, generated from Google Fonts. Avoids the runtime CDN dependency and the FOUC pattern that comes with Google Fonts CSS. `<link rel="preload" as="font">` for the Bricolage display weight (used above the fold in the splash name + question bar). `font-display: swap` on all three (per VISUAL-01 SC1 — explicitly required). Subset to Latin-only (English-only site per Out-of-Scope).
- **D-16:** Bricolage's variable axes (`opsz` 12..96, `wdth` 75..100, `wght` 200..800) all stay in the shipped file — the splash uses the full axis range (`font-variation-settings: "wdth" 100, "opsz" 96` for the huge name; smaller card titles use lower opsz). Fraunces ships as italic-only variable (we only use it for editorial accent — italic is the only style we render). JetBrains Mono ships at 400 + 600 weights only (micro-labels and the "→ PICK ONE" markers).

### CSS Architecture

- **D-17:** Plain CSS with custom properties (CSS variables) — NOT Tailwind. Per CLAUDE.md "What NOT to Use": stock Tailwind defaults are themselves an AI tell, and the design system is custom enough that Tailwind's utility classes provide negative value (every utility would be overridden). Tokens (`--paper`, `--ink`, `--terracotta`, `--cobalt`, `--lime`, `--plum`, `--sans`, `--serif`, `--mono`) live in `src/styles/tokens.css`, imported by `src/layouts/Base.astro`. Component styles colocate with their `.astro` file in scoped `<style>` blocks. No CSS-in-JS, no PostCSS plugins beyond Astro defaults.
- **D-18:** A new `src/layouts/Base.astro` is introduced in Phase 3 — imports tokens.css, sets up the cream-paper background by default, hosts the topbar pill (status pill) and minimal footer. Splash, about, gallery, detail, 404 all extend Base. Replaces the per-page bare HTML chrome currently duplicated across `src/pages/*.astro`. Gallery / detail / 404 override Base's body bg via a `bg` prop (`'paper' | 'ink'`).

### Claude's Discretion

- **Anti-AI-tell verification mechanism (Phase 3 SC6):** Implement as a manual checklist file `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` that the planner writes during plan creation and the executor walks before declaring the phase done. Items per VISUAL-04 + ROADMAP SC6: no centered hero with gradient, no shadcn cards, no Inter anywhere in the stylesheet (grep `Inter` → must be empty), no purple gradients, no lucide icons (no `lucide-*` package installed; verify `package.json`), no bento grid, no "Built with X" footer. Reviewable by `/gsd-ui-review` and `/gsd-code-review` at phase exit.
- **Bricolage display preload list:** preload only the woff2 file actually used by the largest type-set above the fold (probably `bricolage-grotesque-latin-wdth_normal-wght_800.woff2`). Add `<link rel="preload">` only for that one — preloading the full variable file is overkill for first paint.
- **Astro `<Image>` use for tile thumbnails:** continue from Phase 2 — gallery tiles use `<Image src={hero}>` for the cover; paginated `<img>` tags inside detail page (Phase 2 D-04 + the Pitfall 1 note in `src/pages/[category]/[slug].astro`) stay unchanged.
- **Detail page styling:** body inherits the cream-paper canvas from Base (NOT inverted ink — readability of CRO blurbs and paginated pages takes precedence over identity rhyme with the gallery). Detail header (the title block at the top of the page) carries the discipline accent — accent-color top border or accent fill behind the back-pill, plus discipline color in the title-side italic numeral. Paginated `<img>` sequence stays as-is from Phase 2; Phase 3 just adds spacing tokens and a max-width container.
- **Mobile collapse @ ≤900px:** match sketch's pattern — galleries collapse to single column; hero band collapses portrait above name; cards reflow to 1 or 2 columns. Phase 3 ships the responsive CSS but does NOT verify on real devices — Phase 5 owns iPhone Safari verification.
- **Status pill copy:** "OPEN TO ROLES" with pulsing lime dot per sketch. If Caleb prefers different copy ("AVAILABLE FOR HIRE", "TAKING INTERVIEWS"), it's a one-string change at execution time.
- **Splash 4-card vs N-card flexibility:** the splash hard-codes 4 cards mapped to the 4 disciplines. If Personal drops per SPLASH-04 / D-07, the splash becomes a 3-card layout — needs a layout variant in the splash CSS (3-col grid instead of the sketch's `1.2fr 0.85fr 1fr 1fr`). Add this as a planner task.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project framing & requirements
- `.planning/PROJECT.md` — Cross-functional pitch, anti-AI-tell mandate (Active req), 4-discipline split, "design must NOT read as AI-generated"
- `.planning/REQUIREMENTS.md` §"Splash & Navigation" — SPLASH-01 through SPLASH-05 (above-fold composition, accent-per-discipline, asymmetric galleries, thin/empty handling, on-brand 404)
- `.planning/REQUIREMENTS.md` §"Visual System" — VISUAL-01 (type triple, no Inter), VISUAL-02 (color tokens), VISUAL-03 (rotated cards + decorative geometry), VISUAL-04 (anti-AI-tell list)
- `.planning/REQUIREMENTS.md` §"Out of Scope" — exhaustive list of rejected AI-template tells; the implementation contract for VISUAL-04
- `.planning/REQUIREMENTS.md` §"v2 Requirements" → "Motion Polish" — MOTION-01..04 stay deferred per D-11/D-12
- `.planning/ROADMAP.md` §"Phase 3: Visual Design System" — 6 success criteria; SC6 (anti-AI-tell verification) is the exit gate

### Locked design anchor (Phase 3's source of truth)
- `.planning/sketches/MANIFEST.md` §"Locked Design Anchor (from sketch 001)" — Magazine maximalist direction, type pairing, color system, layout language, splash structure, anti-AI tells
- `.planning/sketches/001-direction-comparison/README.md` — full reference for the locked direction (winner: Variant B)
- `.planning/sketches/001-direction-comparison/index.html` — the actual visual spec; specifically the `.variant-b` CSS (lines 262–627). Color tokens, type tokens, splash composition, gallery template (5-tile), card decorative geometry, hover states, pulse keyframes, mobile collapse pattern at ≤900px — ALL come from this file. Plan-phase + execute-phase agents MUST open this in a browser AND read the CSS — extract numbers verbatim, do not re-derive.

### Phase 1 + 2 carry-forward
- `.planning/phases/01-walking-skeleton/01-CONTEXT.md` §"Implementation Decisions" — D-04 colocated content, D-11/D-12 dynamic `[category].astro` route + enum, D-01 manual `order` field (the load-bearing input to D-04/D-05 above)
- `.planning/phases/02-asset-pipeline-real-content/02-CONTEXT.md` §"Implementation Decisions" — D-11 empty-discipline drop rule (codifies SPLASH-04, carries into D-07), D-14 bio voice contract (carries into D-09 splash teaser tone)
- `.planning/phases/02-asset-pipeline-real-content/02-VERIFICATION.md` — what's currently in the DOM (bare HTML chrome, no styles); Phase 3 replaces this entirely

### Tech stack & constraints
- `CLAUDE.md` §"Technology Stack" → "Fallback Path: Code-built (Astro + Motion + GSAP + Lenis)" — Astro 5.x, Motion 12 deferred to MOTION-01..04, Tailwind treatment ("optional and use carefully — write a custom theme"). D-17 chooses plain CSS over Tailwind per the "What NOT to Use" guidance.
- `CLAUDE.md` §"What NOT to Use" — explicit anti-pattern list: shadcn defaults, Bootstrap themes, Inter (default), generic SSG starters. Mirrors and extends VISUAL-04.

### Existing code surfaces Phase 3 modifies
- `src/pages/index.astro` — bare HTML splash; replace with full hero band + question bar + 4 cards (extends new Base.astro)
- `src/pages/[category].astro` — bare HTML gallery; replace with bucket-template selection (A/B/C) + ink-black canvas
- `src/pages/[category]/[slug].astro` — bare HTML detail; add tokens, accent-carrying header, container styling. Paginated `<img>` block stays untouched (Phase 2 D-04 + Pitfall 1 contract)
- `src/pages/about.astro` — bare HTML; restyle on cream-paper canvas, type via tokens. Bio copy stays as Phase 2 shipped it.
- `src/content.config.ts` — schema NOT modified by Phase 3. `order` field is the only per-piece input the gallery templates need.
- `src/content/categories.ts` — extend with discipline→accent mapping (D-01) OR introduce separate `src/styles/disciplines.ts` const (planner choice).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/content/categories.ts` (4-category enum)** — load-bearing across schema, routing, AND now D-01's color mapping. Either extend it with the accent-color const or import alongside it from a sibling file. Don't re-enumerate the categories anywhere else.
- **`src/content.config.ts` `order: number`** — already in schema (Phase 1 D-01). The single per-piece input the bucket templates need (D-04 / D-05). No schema migration required for Phase 3.
- **`<Image>` from `astro:assets`** — used in Phase 1 for hero rendering, in Phase 2 for cover thumbs. Phase 3 reuses for gallery tile thumbnails (each tile's hero).
- **Phase 2's `cover.webp` outputs** — `public/generated/pdf-thumbs/[slug]/cover.webp` is the gallery tile cover for PDF-sourced pieces; image-only pieces use their `hero.webp` directly. Both already exist for the 2 shipped pieces (PVL design + PVL marketing) and will exist for any piece added later.
- **Astro 5's scoped `<style>` blocks** — Astro defaults; no extra config needed for D-17's component-colocated styles.

### Established Patterns
- Manual `order` field per piece for layout positioning (Phase 1 D-01). D-04 extends this from "sort order in gallery" to "slot index in template."
- Single dynamic route file per page-type (Phase 1 D-11). D-05's three template `.astro` components are *imported by* the dynamic `[category].astro`, not separate routes.
- Frontmatter-driven exclusion via `draft: boolean` (Phase 1 D-02). Empty-discipline detection (D-07) reuses this — `draft: true` pieces don't count toward `pieces.length`.

### Integration Points
- **Status pill (D-11) on every page** — lives in `Base.astro` topbar. Renders identical chrome on splash + gallery + detail + about + 404. Phase 4 adds mailto / LinkedIn / resume links to the same topbar; Phase 3 leaves room for them in the layout grid.
- **Discipline accent flows from `src/styles/disciplines.ts` const** — gallery's `[category].astro` reads the const, passes the accent value as a CSS custom property on the page wrapper (`style="--accent: var(--terracotta)"`). Detail page does the same.
- **Cloudflare Pages 404 serving** — Astro emits `dist/404.html`; Cloudflare Pages serves it for unknown routes with HTTP 404 status automatically (verified by Pages docs; no `_redirects` config needed).

</code_context>

<specifics>
## Specific Ideas

- The splash composition is **above-the-fold-or-bust** at 1280px viewport. The four cards have to be visible without scrolling — D-09's choice of a shorter splash teaser (vs the full 122-word /about bio) is driven by this constraint. If during execution the layout still pushes cards below the fold, the bio teaser shortens further before the cards drop.
- **Gallery template B (the 5-tile sketch composition) is the "house" template** — Design and Marketing currently land in C, Finance in A; Personal drops via D-07. B is what every gallery aspires toward — the sketch tuned the rotations, decorations, and color rhythm exactly here.
- **Each discipline's geometry follows from the sketch's k1–k4 mapping (D-03)** — these aren't decorative noise, they're brand vocabulary. Reusing them inside gallery tiles (one tile in each gallery picks up the discipline's geometry) is the cohesion glue between splash card and gallery.
- **Anti-AI-tell verification (Phase 3 SC6) is a hard gate** — it's the single most load-bearing exit criterion of this phase per the PROJECT.md anti-AI-template mandate. The ANTI-AI-CHECKLIST.md (Claude's Discretion above) is reviewed by both `/gsd-code-review` (grep `Inter`, check `package.json` for lucide) and `/gsd-ui-review` (visual sweep). Phase 3 doesn't sign off until both pass.
- **Real portrait (D-08) is a Phase 3 blocker, not a Phase 4 carry-over** — the splash hero band is the single most valuable real estate on the site. Shipping it with placeholder portrait pattern undermines the personality pitch. If the photo isn't ready by execute-time, Phase 3 pauses (not "ship placeholder, swap later").
- **Shorter splash teaser is its own copy** — NOT extracted from /about at build time. Splash needs hand-tuned line breaks for the sticker-style block; build-time extraction makes that fragile. Two strings, one source of truth per surface.

</specifics>

<deferred>
## Deferred Ideas

- **Header chrome (mailto / LinkedIn / Resume header link)** — CONTACT-03/04 + CONTACT-01 header treatment, Phase 4. Phase 3's `Base.astro` topbar leaves layout room for these but doesn't render them.
- **Prev/next within discipline + "Back to [Category]" detail-page footer** — PIECE-05, Phase 4.
- **About-page contact block (slightly larger surface than header)** — CONTACT-05, Phase 4.
- **Mobile/perf/a11y polish + iPhone Safari verification + Lighthouse ≥85/95 + reduced-motion gate verification** — FOUND-01/02/03, Phase 5. Phase 3 ships responsive CSS and `@media (prefers-reduced-motion)` (D-13) but does NOT verify the latter on hardware.
- **View Transitions API on splash → gallery (morph cards into hero)** — MOTION-01, v2. Considered and rejected for Phase 3 per D-12.
- **CSS scroll-driven reveals on detail page** — MOTION-02, v2.
- **Custom cursor on desktop** — MOTION-03, v2.
- **Magnetic / hover-deflection on splash cards** — MOTION-04, v2.
- **Outcome tagline rendered on Finance gallery cards** — CONTENT-01, v2.
- **"Show me everything" curated 6-piece tour link in footer** — CONTENT-02, v2.
- **OG/Twitter card metadata, robots.txt, sitemap.xml, favicon set** — Phase 6 SC4 (deploy phase).
- **Calendly embed, privacy-first analytics** — FUTURE-01/02, post-v1 only if signal warrants.
- **Per-piece secondary images / detail spreads beyond hero + paginated PDF** — FUTURE-04, v2.

### Reviewed Todos (not folded)

None — `gsd-sdk query todo.match-phase 3` returned 0 matches.

</deferred>

---

*Phase: 03-visual-design-system*
*Context gathered: 2026-05-13*
