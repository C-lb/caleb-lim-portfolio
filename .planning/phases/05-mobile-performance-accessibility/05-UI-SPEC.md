---
phase: 5
slug: mobile-performance-accessibility
status: approved
reviewed_at: 2026-05-18
shadcn_initialized: false
preset: none
created: 2026-05-18
parent_spec: .planning/phases/03-visual-design-system/03-UI-SPEC.md
extends: phase-3
contract_type: hardening
---

# Phase 5 — UI Design Contract (Hardening)

> Mobile, performance, and accessibility hardening for the Phase 3 magazine-maximalist system. This contract **extends — never contradicts** `03-UI-SPEC.md`. It locks five new contracts: (1) the ≤700px topbar collapse, (2) gallery tile structural recomposition (BLOCKER-2), (3) `prefers-reduced-motion` per-source policy under D-08, (4) hover-touch gating per D-06, and (5) design-token taxonomy cleanup. No new pages, no new content, no new visual language — the visual contract from Phase 3 remains canonical for type/color/spacing/copy and is referenced by link below.

---

## Scope Boundary (what this spec does and does not own)

| Contract | Owner | This Phase |
|----------|-------|------------|
| Typography roles + sizes (11 `--fs-*`) | `03-UI-SPEC.md` §Typography | **READ-ONLY.** No new font-size roles. Phase 5 only enforces token usage (sweeps raw literals to existing tokens). |
| Color palette (10 tokens) | `03-UI-SPEC.md` §Color | **READ-ONLY** except: drop "decorative only" comment on `--terracotta`; document `--lime` rationale. No new colors. |
| Spacing scale (8 `--sp-*`) | `03-UI-SPEC.md` §Spacing | **EXTEND.** Add `--sp-3: 12px` (closes scale gap; about.astro:98 already consumes it). |
| Copywriting | `03-UI-SPEC.md` §Copywriting Contract | **READ-ONLY.** No new copy. Only adds two `aria-label` strings for new mobile icons. |
| Motion contract (rest tilts, hover-tilt, click-shake, glass overlay, pulse) | `03-UI-SPEC.md` §Visual States | **EXTEND.** Phase 5 codifies the D-08 exemption policy as a per-source table. |
| Responsive breakpoints | (no canonical owner) | **NEW.** Phase 5 declares the breakpoint matrix (540 / 700 / 900). |
| Gallery tile composition | `03-UI-SPEC.md` §Visual States | **REWRITE.** D-09 promotes hero from `opacity 0.55 watermark` to grid-cell foreground. |
| Touch device behavior | (no prior contract) | **NEW.** D-06 hover gate + D-07 entrance shimmer. |
| Performance budget (LCP, Lighthouse) | (no prior contract) | **NEW.** D-13/D-15/D-16 + FOUND-02. |
| Verification gates (Gate 23, 24, 25) | `scripts/verify-build.sh` | **EXTEND.** Adds three new gates. |

**Hardening, not redesign.** If a question is not in the matrix above, the answer is "see 03-UI-SPEC.md."

---

## Design System (unchanged from Phase 3)

| Property | Value | Source |
|----------|-------|--------|
| Tool | none (plain CSS + custom properties) | 03-UI-SPEC.md §Design System |
| Preset | not applicable — Tailwind/shadcn explicitly rejected | CLAUDE.md "What NOT to Use" |
| Component library | none (hand-rolled `.astro` files) | 03-UI-SPEC.md |
| Icon library | none — Phase 5 adds 3 inline hand-authored SVG glyphs (envelope, "in" mark, download arrow) | D-01 + Claude's Discretion #1 (CONTEXT.md) |
| Font | Bricolage Grotesque + Fraunces + JetBrains Mono — unchanged | 03-UI-SPEC.md |

**Registry safety:** N/A. No `components.json`. No third-party registries declared. No new dependencies added in Phase 5.

---

## Verification Override Register (inherited)

Phase 3's three overrides (OVERRIDE-01 typography count, OVERRIDE-02 weight count, OVERRIDE-03 sketch-locked spacing whitelist) **remain in force**. Phase 5 introduces no new overrides — the token-sweep target is to *close* against the existing scale, not to expand it.

| ID | Status | Note |
|----|--------|------|
| OVERRIDE-01 | INHERITED | Phase 5 adds zero font-size roles. The 11 in tokens.css remain canonical. Gate 25 enforces zero new literals. |
| OVERRIDE-02 | INHERITED | Phase 5 adds zero font-weight roles. |
| OVERRIDE-03 | INHERITED + AUDIT | Phase 5 sweeps non-sketch-locked spacing literals back into the token scale. The 7 sketch-locked exceptions stay; new violations DO NOT. |

---

## Responsive Breakpoint Matrix (NEW — Phase 5 canonical)

Phase 3 ships two breakpoints; Phase 5 adds the third for the topbar collapse and locks the inventory.

| Breakpoint | Trigger | Owner | Surfaces affected |
|------------|---------|-------|-------------------|
| **≤900px** (Phase 3) | `@media (max-width: 900px)` | `index.astro`, gallery components, footer | Splash bio + carousel single-column stack; gallery grid flattens; `Base.astro` footer single-line collapse |
| **≤700px** (Phase 5, NEW) | `@media (max-width: 700px)` | `Base.astro` topbar + nav | Topbar nav links collapse to 44×44 icon glyphs (D-01–D-03); StatusPill shrinks padding (D-04); brand text wraps at most 1 line |
| **≤540px** (Phase 3) | `@media (max-width: 540px)` | `index.astro` splash, gallery | Tight-mobile rules; pre-existing |

**Contract:**
- Below 700px is treated as "phone portrait." Above 900px is "desktop / laptop." The 700–900 band is "narrow tablet / large phone landscape" — desktop layout stays; only the topbar starts collapsing earlier than the gallery.
- No new breakpoints permitted by Phase 5. Any future breakpoint requires a UI-SPEC amendment.
- The OPEN-TO-ROLES island (StatusPill) is **`position: fixed; top: 12px; left: 0; right: 0`** — outside the topbar flex layout. It does NOT participate in topbar collapse calculations; the topbar does not need to reserve horizontal space for it.

### Topbar Collapse Behavior (D-01, D-02, D-03 — locks SC1)

| State | Markup | CSS |
|-------|--------|-----|
| **Default (>700px)** | `<a class="nav-link">` renders `<span class="nav-text">caleb.lim.2024@smu.edu.sg</span>` (or `linkedin` / `resume`); `<svg class="nav-icon">` is `display: none` | `.topbar` is `flex; justify-content: space-between; padding: var(--sp-5) var(--sp-6)` — unchanged from Phase 3 |
| **≤700px** | `<span class="nav-text">` is `display: none`; `<svg class="nav-icon">` is `display: block`, 16px square, `stroke: currentColor` | `.nav-link` becomes `inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0`. `.topbar nav` gets `gap: var(--sp-2)`. |
| **Touch (any width)** | (no markup change — touch-gate is on hover effects only, not on collapse) | The collapse rule is width-based, not touch-based. A wide-touch device (iPad landscape) gets the desktop topbar. A narrow non-touch device (browser at 600px on laptop) gets the icon row. |

**Accessible naming for icon glyphs (D-01 + WCAG 4.1.2):**
- Envelope glyph (mailto): `aria-label="Email Caleb"` (icon is `aria-hidden="true"`)
- "in" glyph (LinkedIn): `aria-label="Caleb on LinkedIn"` + `target="_blank" rel="noopener noreferrer"` retained
- Download glyph (resume): `aria-label="Download Caleb's resume"`

The visible `.nav-text` already provides accessible names above 700px; the `aria-label` is the screen-reader fallback when the text is hidden.

**Tap target geometry (D-02):**
- Each `.nav-link` is **exactly 44×44px** at ≤700px (WCAG 2.5.8 AAA, iOS HIG)
- The SVG glyph inside is 16–18px centered via flex — the *entire* 44×44 area is the click surface, not just the glyph
- **Site-wide tap-target floor (Phase 5 hardening):** `.nav-link` desktop padding bumps from `4px 0` (current, ~19px effective) to **`min(12px, 8px)` block / `8px` inline** — clears WCAG 2.5.8 AA (24×24) at all widths. This is a Phase 4 carry-over (BLOCKER from UI-REVIEW Pillar 5) not just a mobile fix.

### StatusPill mobile shrink (D-04)

| Property | Default (>700px) | ≤700px |
|----------|------------------|--------|
| `padding` | `6px 14px` (sketch-locked, OVERRIDE-03) | `4px 12px` (proportional shrink) |
| `font-size` | `var(--fs-mono)` = 11px | `var(--fs-mono)` (unchanged) |
| Effective tap height | 23px | ≥44px **required** — if shrink drops below 44px, restore padding to `8px 12px` and accept slightly larger pill |
| Dot size | 8px circle | 8px circle (unchanged) |
| Pulse animation | `pulse 1.6s ease-in-out infinite` | UNCHANGED — D-08 exempt (status indicator) |

The pill remains `position: fixed; top: 12px; centered` on mobile. It does NOT relocate to bottom-center, hamburger, or hide. Its slow-scroll click behavior to `/about?to=contact` (D-05, already shipped) is unchanged.

---

## Visual Contract — Gallery Tile (D-09–D-12, REWRITE — locks SC5)

**Phase 4 UI-REVIEW BLOCKER-2 misdiagnosed.** The hero is already wired (`<Image src={piece.data.hero} class="cover" />` in all three Gallery components). The bug is composition: `opacity: 0.55` watermark behind a colored slab. Phase 5 promotes the hero to a structural grid cell.

### Tile composition (applies to populated disciplines only)

```
┌───────────────────────────┐
│                  ┌────────┤
│                  │        │
│                  │ tag    │
│                  │        │
│  HERO (60%)      │ ttl    │
│  object-fit:cover│        │
│                  │ role   │
│                  │ deco?  │
│                  │        │
│                  ├────────┤
└───────────────────────────┘
       60%             40%
       aspect-ratio: 4 / 5 overall
```

| Property | Value | Rationale |
|----------|-------|-----------|
| Tile container | `display: grid; grid-template-columns: 60% 40%; aspect-ratio: 4 / 5; border-radius: 8px; overflow: hidden; position: relative` | D-09 + D-10 |
| Hero column (left) | `grid-column: 1; width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: 1` | D-09. **`opacity: 0.55` is removed** — single largest visual change in Phase 5. |
| Text column (right) | `grid-column: 2; display: flex; flex-direction: column; justify-content: end; padding: var(--sp-4); gap: var(--sp-2); background: var(--accent-bg)` | Per-slot accent (terracotta/cobalt/acid/plum) **retained on text column** per Q3 resolution below |
| Tile title (`.ttl`) | `var(--fs-ttl)` = 22px, weight 700, color matches `--accent-fg` (`--paper` for terracotta/cobalt/plum; `--ink` for acid) | Unchanged from Phase 3; just relocated to text column |
| Tile role (`.role`) | `var(--fs-tile-role)` = 13px, Fraunces italic 400, color same as ttl | Unchanged; D-09's "blurb" = `piece.data.role` (resolves Q2 — no schema change) |
| Tile tag (`0X / 0Y`) | `var(--fs-card-no)` = 9px JetBrains Mono, sits top-left of text column | Unchanged position semantics; moved from over-hero to within text column |
| Per-slot decoration (`.deco`) | **DROPPED in new composition** (resolves Q1) | The hero is now the visual interest. The 240px italic numeral and outline-circle decos no longer have a flat colored slab to overlay — they would compete with the photo. Drop is a net positive. |

### Hero asset contract

| Property | Value | Source |
|----------|-------|--------|
| Source | `piece.data.hero` (Astro asset, schema-validated) | D-11 |
| Component | `<Image>` from `astro:assets` | D-11 |
| `widths` | `[280, 560]` | Matches portrait carousel pattern |
| `sizes` | `"(max-width: 900px) 50vw, 240px"` | 240px ≈ 60% of a 400px desktop tile |
| `object-fit` / `object-position` | `cover` / `center` | D-11 |
| Alt text | `piece.data.title` | a11y; existing schema field |
| `priority` | `true` **only on `p1` tile** (LCP candidate for `/design` and `/marketing`) | FOUND-02 LCP optimization |
| Loading | Default lazy on `p2`+ tiles (Astro emits `loading="lazy"`) | FOUND-02 |

### Tile responsive behavior

| Viewport | Composition |
|----------|-------------|
| Desktop (>900px) | Hero LEFT 60% / text RIGHT 40% per above |
| 540–900px | Hero LEFT 60% / text RIGHT 40% **(same composition — the 4:5 portrait aspect compresses naturally to a single column gallery; tile itself stays bi-column)** |
| ≤540px | Tile flattens to **hero TOP 60% / text BOTTOM 40%** (`grid-template-rows: 60% 40%; grid-template-columns: 1fr`) — vertical stack better fits narrow viewport |

**Existing per-bucket grid spans stay:** GalleryA12 (p1+p2 full-bleed), GalleryB35 (sketch's 5-tile composition), GalleryC68 (6–8 piece flow) — only the per-tile internal composition rewrites. The asymmetric magazine grid from Phase 3 (varied tile sizes, intentional negative space) is preserved.

### Empty discipline behavior (D-12 — unchanged)

`/personal` and `/finance` currently return 404 via `getStaticPaths` filter in `[category].astro`. **Phase 5 does not change this.** When a piece exists for these disciplines (future), they pick up the new tile composition automatically. The "in the works — coming soon" treatment is not a Phase 5 deliverable.

---

## Interaction Contract — Motion Policy (D-08, REWRITE — locks SC3)

### Architecture choice

**Option A: Surgical disables.** Remove the global `*` clamp from `tokens.css:63-70` and add per-source `prefers-reduced-motion` guards at each non-exempt motion site. Rationale: the current `*` selector silently kills the four motions D-08 declares **exempt** (hover-tilt, click-shake, glass overlay, lime-dot pulse). Option B (keep clamp + selector overrides) creates `!important` specificity wars that are fragile to maintain.

### Motion source inventory + verdict

| # | Source | File:line | Type | Verdict under `prefers-reduced-motion: reduce` |
|---|--------|-----------|------|------------------------------------------------|
| 1 | Portrait carousel auto-advance | `index.astro:738-745` | JS `setInterval` | **DISABLE** (already guarded at line 738: `if (prefersReduced.matches) return`) |
| 2 | Portrait carousel slide transition (CSS) | `index.astro:189` | `transition: transform 650ms cubic-bezier(...)` | **DISABLE** when reduced (already partial at 198–200) |
| 3 | Discipline card entrance shake | `DisciplineCard.astro:319` | `@keyframes card-shake 750ms ease-in-out 400ms 1` | **DISABLE** |
| 4 | Bio card entrance shake | `index.astro:375` | `@keyframes bio-shake 750ms ease-in-out 400ms 1` | **DISABLE** |
| 5 | Card hover-tilt (3D perspective) | `DisciplineCard.astro:281-287` | `transform: perspective(1200px) rotateX/Y; transition 0.38s` | **EXEMPT — STAY ACTIVE** (user-initiated feedback per D-08) |
| 6 | Card click-shake (replay) | `DisciplineCard.astro:336-338` | `@keyframes card-shake-click 220ms` | **EXEMPT — STAY ACTIVE** (user-initiated feedback per D-08) |
| 7 | Card liquid-glass overlay fade | `DisciplineCard.astro:81` | `transition: opacity 380ms ease` | **EXEMPT — STAY ACTIVE** (hover-paired feedback per D-08) |
| 8 | Bio card hover-tilt | `index.astro:373-374` | `transition: transform 0.38s` | **EXEMPT — STAY ACTIVE** |
| 9 | Bio card liquid-glass | `index.astro:386-387` | `transition: opacity 380ms ease` | **EXEMPT — STAY ACTIVE** |
| 10 | Card rest tilts (`rotate(±1deg)`) | `DisciplineCard.astro:156, 181, 209, 237` | Static `transform` (not motion) | **EXEMPT — STATIC** (no animation/transition property — survives any reduced-motion rule automatically) |
| 11 | Lime-dot pulse | `StatusPill.astro:71` | `@keyframes pulse 1.6s ease-in-out infinite` | **EXEMPT — STAY ACTIVE** (status indicator per D-08) |
| 12 | StatusPill hover scale | `StatusPill.astro:49-51` | `transition: transform 0.2s` | **EXEMPT** (hover feedback by analogy to D-08) |
| 13 | Role-link click shake (`is-shaking` replay) | `index.astro:625-630` | CSS animation | **EXEMPT — user-initiated feedback** |
| 14 | `/about?to=contact` slow scroll (1800ms easeInOutQuad) | `about.astro:355-368` | RAF loop | **DISABLE** → instant jump (already guarded at line 351) |
| 15 | Skip-link transition | `Base.astro:117` | `transition` | **DISABLE** (already guarded at 125-127) |
| 16 | `.b-cat-back` hover bg transition | `[category].astro:91`, `[slug].astro:184`, `about.astro:168` | `transition: background-color` | **EXEMPT** (color-only, no spatial motion) |
| 17 | `.values-pill` hover translateY | `about.astro:248-258` | `transition: transform` | **EXEMPT** (hover feedback) |
| 18 | Detail pager link color transition | `[slug].astro:282` | `transition: color` | **EXEMPT** (color-only) |
| 19 | Gallery tile hover scale+rotate | `GalleryA12/B35/C68 .b-piece:hover { transform: scale(1.02) rotate(-0.3deg) }` | `transition: transform` | **EXEMPT** (hover feedback). **Remove the existing `@media (prefers-reduced-motion) .b-piece:hover { transform: none }` blocks in each gallery component** — they conflict with D-08. |
| 20 | Touch entrance shimmer (NEW, D-07) | `DisciplineCard.astro` / `index.astro` `.b-card.is-entered` | `@keyframes card-shimmer 600ms ease-out 1` | **DISABLE** (decorative one-shot, not user-initiated). JS-side gate: `if (isTouchDevice && !prefersReduced)`. CSS-side gate: `@media (prefers-reduced-motion: reduce) { .b-card.is-entered { animation: none } }`. |

### Implementation contract

1. **Remove** the global `*` clamp at `tokens.css:63-70` (lines 63 through `}` of the closing block).
2. **Remove** the line `.b-card:hover, .b-piece:hover { transform: none !important; }` (tokens.css:69 — this hammer kills exempt hover-tilt).
3. **Add** per-source guards at each `DISABLE` row above that isn't already guarded (#3, #4 are the two new edits — #2 partially exists, verify it still fires once the `*` clamp is gone).
4. **Remove** the per-gallery `@media (prefers-reduced-motion) .b-piece:hover { transform: none }` blocks at:
   - `GalleryA12.astro:139-142`
   - `GalleryB35.astro:183-186`
   - `GalleryC68.astro:171-175`
5. **Touch entrance shimmer** (D-07): IntersectionObserver fires once per `.b-card` / `.b-bio` element on viewport entry (threshold 0.4). Adds `.is-entered` class. CSS keyframe `card-shimmer 600ms ease-out 1` runs once. Gated to `(hover: none)` AND `!prefersReduced`.

### Verification walk (recorded in 05-VERIFICATION.md)

Toggle macOS *System Settings → Accessibility → Display → Reduce motion = ON*, refresh site, walk:

| Step | Expected behavior |
|------|-------------------|
| Load splash | Cards do NOT shake on entrance (#3 disabled) |
| Hover discipline card | Tilt + glass overlay FIRE (#5, #7 exempt) |
| Click role-link | Card SHAKES briefly (#6 exempt) |
| Load StatusPill | Lime dot PULSES (#11 exempt) |
| Click "OPEN TO ROLES" | INSTANT JUMP to /about#contact, no slow-scroll (#14 disabled) |
| Wait 3s on splash | Portrait carousel does NOT auto-advance (#1 disabled) |
| Click carousel arrow | Slide transitions normally (#2 exempt as user-initiated by analogy) — acceptable |
| Tab through nav | Focus outlines fire crisply (no transition) — acceptable |
| Visit `/design` gallery | Tiles do NOT shimmer on entrance on desktop (#20 gated to touch); hovering a tile fires scale+rotate (#19 exempt) |

---

## Interaction Contract — Touch-Hover Gating (D-06, D-07 — NEW)

### Hover gate pattern

```css
/* Wrap EVERY :hover ruleset in this guard */
@media (hover: hover) and (pointer: fine) {
  .selector:hover { /* desktop pointer-only effects */ }
}
```

iOS Safari reports `hover: none, pointer: coarse` — the guard correctly returns false, no first-tap-shows-hover friction. iPad with Magic Keyboard also returns false (primary input is still touch) — correct.

### Hover surfaces inventory (all 13 must gate)

| # | Effect | Location | Effect type |
|---|--------|----------|-------------|
| 1 | Card 3D tilt + lift | `DisciplineCard.astro:281-294` | `transform` |
| 2 | Card liquid-glass overlay | `DisciplineCard.astro:74-96, 295` | `opacity` + `backdrop-filter` |
| 3 | Bio card 3D tilt | `index.astro:406-417` | `transform` |
| 4 | Bio card liquid-glass | `index.astro:380-402` | `opacity` |
| 5 | Gallery tile scale+rotate | `GalleryA12/B35/C68 .b-piece:hover` | `transform` |
| 6 | StatusPill hover scale | `StatusPill.astro:52-58` | `transform` |
| 7 | `.nav-link` hover color | `Base.astro:81` | `color` |
| 8 | `.b-cat-back` hover bg | `[category].astro:94-97`, `[slug].astro:186-189`, `about.astro:171-174` | `background-color` |
| 9 | Role-link hover underline+opacity | `index.astro:347-349` | `opacity` + `text-decoration` |
| 10 | `.values-pill` hover bg+translate | `about.astro:252-258` | `background` + `transform` |
| 11 | Pager-link hover color | `[slug].astro:307` | `color` |
| 12 | `.about p a` hover color | `about.astro:202-204` | `color` |
| 13 | `.full-pdf-link` hover color | `[slug].astro:260-262` | `color` |

**Rule:** All 13 wrap in `@media (hover: hover) and (pointer: fine) { ... }`. `:focus-visible` rules **stay outside** the gate (keyboard focus is independent of pointer type — keyboard users on a touch device still get focus rings).

### Touch entrance shimmer (D-07)

| Property | Value |
|----------|-------|
| Trigger | `IntersectionObserver` with `threshold: 0.4`, one-shot per element (`observer.unobserve` after first hit) |
| Targets | `.b-card` (4 splash discipline cards) + `.b-bio` (bio sticker) |
| Gate | `window.matchMedia('(hover: none)').matches === true && !prefersReduced.matches` |
| CSS class | `.is-entered` added by JS on first intersection |
| Animation | `@keyframes card-shimmer 600ms ease-out 1` — `box-shadow: 0 0 0 0 currentColor → 0 0 0 6px color-mix(in oklab, currentColor 8%, transparent) → 0 0 0 0 currentColor` |
| Disabled state | `@media (prefers-reduced-motion: reduce) { .b-card.is-entered { animation: none; } }` |
| Reduced-motion runtime change | JS re-evaluates on `prefersReduced.addEventListener('change')` (matches existing carousel pattern at `index.astro:776`) |

Not applied to gallery tiles (`.b-piece`) — gallery tiles already have a per-hover scale effect that fires on first tap on touch (the click navigates immediately due to D-06 hover-gate; no shimmer needed on tiles).

---

## Performance Contract (FOUND-02, D-13/D-15/D-16 — NEW)

### Lighthouse budget (locks SC2)

| Route | Performance | Accessibility | LCP target | Best practices | SEO |
|-------|-------------|---------------|------------|----------------|-----|
| `/` (splash) | **≥85** | **≥95** | **<2000ms** | (no fixed target) | (no fixed target) |
| `/design` (gallery) | **≥85** | **≥95** | (Lighthouse default <2500ms acceptable) | — | — |
| `/marketing` (gallery) | **≥85** | **≥95** | — | — | — |
| `/[category]/[slug]` (detail, real piece) | **≥85** | **≥95** | — | — | — |
| `/about` | **≥85** | **≥95** | — | — | — |

**Audit conditions:**
- Run against **Vercel preview URL** (`<project>-git-<branch>-<scope>.vercel.app` — e.g. `caleb-lim-portfolio-git-phase-5-c-lb.vercel.app`), not localhost (D-13, amended 2026-05-18)
- Mobile form factor, simulated Slow 4G throttling (Lighthouse default mobile preset — Moto G4, 412×823, 4× CPU slowdown, 1.6Mbps down / 750Kbps up / 150ms RTT) (D-15)
- Manual runs via `scripts/lighthouse-audit.sh <preview-url>` — no CI gate (D-16)
- Results recorded in `05-VERIFICATION.md` per route with raw JSON pulled into the phase directory

### LCP element contract per route

| Route | LCP element | `priority` prop | `sizes` attribute |
|-------|-------------|-----------------|-------------------|
| `/` (splash) | Portrait carousel first slide (~280×350 desktop / ~375×280 mobile) | `priority={i === 0}` (first slide only) | `"(max-width: 900px) 100vw, 280px"` |
| `/design`, `/marketing` (gallery) | Gallery `p1` tile hero | `priority={slot === 1}` (p1 tile only) | `"(max-width: 900px) 50vw, 240px"` |
| `/[category]/[slug]` (detail) | Hero image at top of detail body | `priority` (always — hero is above-fold) | `"(max-width: 960px) 100vw, 960px"` |
| `/about` | Text LCP (no images — photo wireframes are CSS divs) | N/A | N/A |
| `/nope` (404) | Discipline card composition (no images) | N/A | N/A |

### Image format + source weight contract

- **Format:** Astro default (`webp` emitted from `image()` schema field via Sharp service) — no explicit `format="avif"` unless LCP fails. AVIF is the escalation path, not the baseline (CONTEXT.md "Image format optimization beyond Astro defaults is deferred").
- **Source weights to monitor:** `portrait3.jpg` (16MB) and `portrait.jpg` (5MB) are oversized for build pipeline ingestion. If splash LCP fails after `priority` + `sizes` interventions, the escalation is to downsize sources to ≤1120px max dimension via Sharp CLI (`npx sharp resize 1120 < portrait3.jpg > portrait3.jpg`) — one-shot edit, no pipeline change.
- **`fetchpriority` hint:** Astro's `priority` prop emits `loading="eager" decoding="sync" fetchpriority="high"` — verified in `dist/` after build.

### Font loading (unchanged — Phase 3 verified)

| Property | Value | Source |
|----------|-------|--------|
| Strategy | Self-hosted via Fontsource Variable | Phase 3 |
| Preload | Single Bricolage display woff2 (`latin-full-normal.woff2`) via `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous">` | `Base.astro:27` |
| `font-display` | `swap` (Fontsource default, do not override) | Phase 3 |
| Subset | `latin` only (English-only site) | Phase 3 |

### Performance gates (verify-build.sh extensions)

| Gate | Check | Source |
|------|-------|--------|
| Gate 23 | `dist/index.html` contains `@media (max-width: 700px)` block | Locks topbar collapse |
| Gate 24 | `dist/design/index.html` `<img` element count ≥ 1 (gallery tile emits hero) | Locks BLOCKER-2 fix |
| Gate 25 | Zero matches for `font-size:\s*[0-9]+px` outside `src/styles/tokens.css` | Locks D-17(c) target |

Lighthouse runs are **manual + recorded**, not CI-gated (D-16).

---

## Accessibility Contract

### Tap target (WCAG 2.5.8)

| Surface | Minimum | Achieved | Source |
|---------|---------|----------|--------|
| Mobile topbar icon (.nav-link @ ≤700px) | **44×44** (AAA + iOS HIG) | 44×44 explicit `width`/`height` | D-02 |
| Desktop topbar text link (.nav-link >700px) | **24×24** (AA floor) | 24×24 via padding bump to ≥`12px 8px` | Phase 4 carry-over (UI-REVIEW Pillar 5) |
| StatusPill (any width) | 44×44 (clickable) | 44×44 — at ≤700px padding tuned to keep height ≥44px (D-04) | D-04 |
| Gallery tile (`.b-piece`) | 44×44 (entire tile is the click target) | Tile is much larger than 44px at all viewports — passes implicitly | — |
| Discipline card on splash | 44×44 | Cards are large display elements — passes | — |
| Detail pager prev/next links | 24×24 | Verify after Phase 5 sweep (Phase 4 shipped pager at unclear padding) | Phase 5 audit |
| Resume link inside detail body | 24×24 | `[slug].astro` resume `font-size: 16px` literal — verify after token sweep | Phase 5 audit |

### Reduced motion

Per D-08 inventory above. Lime-dot pulse + card rest tilts + hover-tilt + click-shake are exempt; all decorative animations and slow-scroll disable. The global `*` clamp is **removed** — surgical per-source guards replace it.

### Focus visibility

Phase 3 contract retained: `outline: 3px solid var(--ink)` on paper-bg surfaces, `outline: 3px solid var(--paper)` on ink-bg surfaces, `outline-offset: 4px`. The `:focus-visible` rules stay OUTSIDE the `@media (hover: hover)` gates (keyboard focus must work on touch devices with attached keyboards).

### ARIA contract additions (Phase 5)

| Element | Attribute | Value |
|---------|-----------|-------|
| Mobile envelope glyph link | `aria-label` | `"Email Caleb"` |
| Mobile LinkedIn glyph link | `aria-label` | `"Caleb on LinkedIn"` |
| Mobile download glyph link | `aria-label` | `"Download Caleb's resume"` |
| All three SVG icons | `aria-hidden` | `"true"` (label is on the parent `<a>`) |
| `.visually-hidden` utility class | new global | `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0` — added to `tokens.css` or new `src/styles/utilities.css` |

### Critical-path accessibility walk (manual, recorded in 05-VERIFICATION.md)

iPhone Safari real device (D-14 — Caleb's iPhone, model + iOS recorded at test time):

1. Splash above-fold composition readable, all four cards tappable ≥44×44
2. Tap Graphic Design → gallery loads, tile heroes render (not empty slabs), tile tappable
3. Tap tile → detail page loads, hero renders, CRO blurbs readable
4. Scroll detail page → no horizontal overflow, slide sequence (if present) scrolls cleanly
5. Tap back-pill → returns to /design
6. Tap topbar icon glyphs → mailto launches Mail app, LinkedIn opens in new tab, resume downloads
7. Tap OPEN TO ROLES island → slow-scroll to /about#contact fires (or instant under reduced-motion)
8. Return to splash via brand link, switch to /marketing → second gallery loads cleanly
9. Repeat steps 2–4 for /marketing → identical experience
10. Toggle iOS Reduce Motion ON, repeat steps 1–9 → carousel auto-pauses, slow-scroll → instant, card shake disabled; hover-tilt + click-shake + pulse remain

---

## Token Taxonomy (D-17, D-18 — locks SC6)

### Token registration audit

| Token | tokens.css status | Decision | Rationale |
|-------|-------------------|----------|-----------|
| `--lime` (`#b8c945`) | REGISTERED at line 16 with rationale comment | **KEEP** — comment is sufficient; UI-REVIEW WARNING-1 is stale | `--lime` is the "go signal" pop for status indicator (StatusPill dot, StatusPill focus outline). Conceptually distinct from `--acid` (deep gold, content-discipline accent for Personal). |
| `--terracotta` (`#82785d`) | REGISTERED with "decorative accent only" comment | **AMEND COMMENT** — drop "decorative only", restate as "interactive accent — used for hover/focus/link feedback across about.astro + topbar nav-link hover" | UI-REVIEW counted 16 load-bearing uses. The comment is inaccurate; documentation drift. |
| `--sp-3` (`12px`) | **NOT REGISTERED — silent failure** | **ADD** — `--sp-3: 12px;` between `--sp-2` and `--sp-4` | `about.astro:98` consumes `var(--sp-3)` which resolves to invalid → flex `gap` collapses to 0. Closes scale gap (4/8/**12**/16/24/32/48/64) and fixes a silent bug. |

### Font-size literal sweep (D-17(c) — target: zero raw px font-sizes outside tokens.css)

Inventory of ~27 raw literals across 9 files (full table in `05-RESEARCH.md §2.5`). Sweep is **manual, file-by-file** per D-18 (no codemod). Mapping decisions are planner-owned and surfaced in a `05-TOKEN-MAP.md` artifact written during planning. General mapping rules:

| Raw literal | Map to | Action if no token exists |
|-------------|--------|----------------------------|
| `9px` | `--fs-card-no` (9px) | Exact match — direct migrate |
| `10px` | `--fs-card-no` (9px) | Round down OR judgment — likely accept 9px |
| `11px` | `--fs-mono` (11px) | Exact match — direct migrate |
| `13px` | `--fs-tile-role` (13px) | Exact match — direct migrate |
| `14px` (Base.astro footer) | No exact match | Judgment — either migrate to `--fs-tile-role` (13px, accept 1px shrink) or add `--fs-foot: 14px` if used 3+ times site-wide |
| `15.5px` | `--fs-body` (15.5px) | Exact match |
| `16px` | No exact match — closest `--fs-body` (15.5px) | Migrate to `--fs-body`; accept 0.5px adjustment |
| `18px`, `22px` | `--fs-ttl` (22px) for 22; `--fs-h3` (26px) closest for 18 | Migrate or add new token only if used 3+ times |
| `26px` | `--fs-h3` (26px) | Exact match |
| `32px` | No exact match — closest `--fs-cat` (clamp scale) | Judgment — likely add `--fs-section: 32px` or accept the literal as sketch-locked OVERRIDE-03 candidate |
| `90px`, `240px` (gallery decoration numerals) | `--fs-deco-numeral` covers 90px (clamp 64–96); 240px is far past it | Add `--fs-deco-xl: 240px` if the recomposition keeps the deco; **drop entirely** if D-09 drops decos per Q1 resolution |
| `clamp(28px..44px)`, `clamp(22px..30px)` (DisciplineCard responsive) | No matching responsive tokens | Add `--fs-card-major: clamp(...)` if reused; otherwise migrate to closest existing |
| `0.92rem`, `1.7em` (relative units) | Keep as-is | Relative units are legitimate CSS; intentional in their context (e.g. `1.7em` star glyph sized to parent line-height). Document inline. |

**Rule of thumb (resolves Q4):** Add a new font-size token only if the literal appears **3 or more times site-wide**. One-offs migrate to the nearest existing scale value, accepting visual rounding.

### Spacing literal sweep (D-17(c), also targets ~14 spacing literals)

| Raw literal | Map to | Notes |
|-------------|--------|-------|
| `4px` | `--sp-1` | Exact |
| `6px` | (no token) | Sketch-locked under OVERRIDE-03 (StatusPill padding) — leave |
| `8px` | `--sp-2` | Exact |
| `10px` | sketch-locked (`.b-cards gap`) under OVERRIDE-03 | Leave |
| `12px` | `--sp-3` (NEW) | Add `--sp-3`, then migrate `gap: 12px` consumers |
| `14px` | Sketch-locked candidate or migrate to `--sp-3`/`--sp-4` | Judgment per use |
| `16px` | `--sp-4` | Exact |
| `18px` | Off-scale — migrate to `--sp-4` (16px) or `--sp-5` (24px) | Judgment per use |
| `22px`, `28px` | Sketch-locked under OVERRIDE-03 | Leave |
| `24px` | `--sp-5` | Exact |
| `32px` | `--sp-6` | Exact |
| `48px` | `--sp-8` | Exact |
| `64px` | `--sp-10` | Exact |

**Per-file sweep order** (smallest to largest, plan-owned task split):

1. `Base.astro` (1 font literal + minor spacing)
2. `404.astro` (2 literals)
3. `[category].astro` (1 literal)
4. `[category]/[slug].astro` (2 literals)
5. `DisciplineCard.astro` (4 literals, some `clamp()`)
6. `about.astro` (4 font literals + 14 spacing literals — biggest concentration after index)
7. `index.astro` (9 font literals + many spacing literals — biggest file; save for last)
8. Gallery components ×3 (2 literals each — same 90px and 240px deco; drop if Q1 resolution stands)

### Gate 25 contract

```bash
# verify-build.sh Gate 25
if grep -rnE 'font-size:\s*[0-9]+px' src/components/ src/pages/ src/layouts/ 2>/dev/null; then
  echo "FAIL: raw font-size px literal found outside tokens.css"; exit 1
fi
echo "OK: zero raw font-size literals"
```

Locks the contract: after Phase 5, no future commit can introduce a raw `font-size: Npx` outside `tokens.css`. Resolves Q7 — friction is the point.

---

## Copywriting Contract (delta only — Phase 3 remains canonical)

Phase 5 introduces **no new visible copy**. The four additions are non-visible accessibility strings:

| Element | Copy | Visibility |
|---------|------|------------|
| Mobile envelope glyph `aria-label` | `Email Caleb` | Screen reader only |
| Mobile LinkedIn glyph `aria-label` | `Caleb on LinkedIn` | Screen reader only |
| Mobile resume glyph `aria-label` | `Download Caleb's resume` | Screen reader only |
| `.visually-hidden` text for icon-only nav | (visible label hidden via clip-path utility; preserves source copy `caleb.lim.2024@smu.edu.sg` etc. for SEO and AT) | Screen reader only |

### Copywriting NOT changed by Phase 5

| Element | Source | Status |
|---------|--------|--------|
| Primary CTA | Four discipline cards on splash | Unchanged (03-UI-SPEC.md §Copywriting) |
| Empty state | `/personal` and `/finance` 404 (no piece content) | Unchanged — 404 page IS the empty state |
| Error state | 404 page caption | Unchanged |
| Destructive actions | **None** in this phase. No delete, no mutation, no auth. | Unchanged — contract: do not introduce destructive copy or red semantic color in Phase 5 |
| Voice contract | No "passionate / multidisciplinary / intersection of" filler; no exclamation points; dry, declarative, fragments OK | Unchanged |

### Phase 4 UI-REVIEW copywriting findings NOT addressed in Phase 5

| Finding | Status | Why |
|---------|--------|-----|
| `<title>` generic — `Caleb Lim — Portfolio` | **Deferred to post-launch polish** | Out of Phase 5 scope (CONTEXT.md does not lock SEO copy changes). Phase 6 deploy may revisit. |
| Splash bio card competing CTAs (`★ ABOUT` + `→ KEEP READING`) | **Deferred** | Copy decision, not a Phase 5 hardening item. |
| Detail-pager `aria-label` case inconsistency | **Deferred** | Cosmetic; recorded for future polish. |
| `Get in touch` vs `Values` rendered as labels not headings | **Deferred** | Not a Phase 5 lock. |

---

## Component Contracts (delta from Phase 3)

### `Base.astro` (MODIFIED)

| Change | Driver |
|--------|--------|
| Add `@media (max-width: 700px)` block to `.topbar` | D-01–D-03 |
| Add `.nav-icon` / `.nav-text` swap classes | D-01 |
| Bump `.nav-link` padding from `4px 0` to `≥12px 8px` site-wide | Phase 4 carry-over (tap target) |
| Add three inline SVG glyphs (envelope, "in", download arrow) | D-01 |
| Add `.visually-hidden` utility class (or import from new `utilities.css`) | a11y |

### `StatusPill.astro` (MODIFIED)

| Change | Driver |
|--------|--------|
| Add `@media (max-width: 700px)` padding shrink | D-04 |
| No change to pulse animation | D-08 exempt |
| No change to slow-scroll click behavior | D-05 (shipped) |

### `DisciplineCard.astro` (MODIFIED)

| Change | Driver |
|--------|--------|
| Wrap `:hover` rules in `@media (hover: hover) and (pointer: fine)` | D-06 |
| Add reduced-motion guard for entrance shake (`animation: none` under reduce) | D-08 |
| Add `.is-entered` shimmer animation (touch-only, reduced-motion-disabled) | D-07 |
| Inline `<script>` for IntersectionObserver | D-07 |

### `GalleryA12.astro`, `GalleryB35.astro`, `GalleryC68.astro` (REWRITE — tile composition)

| Change | Driver |
|--------|--------|
| Rewrite `.b-piece` from `position: relative` + absolute hero to `display: grid; grid-template-columns: 60% 40%; aspect-ratio: 4/5` | D-09, D-10 |
| Promote `.cover` from `position: absolute; opacity: 0.55` to grid child `opacity: 1` | D-09 |
| Move `.meta` (title + role) into grid column 2 with per-slot accent bg | D-09 |
| Drop `.deco` per-slot decorations (Q1 resolution) | Aesthetic — hero is the visual interest now |
| Add `<Image priority>` conditional on `slot === 1` | FOUND-02 LCP |
| Update `<Image sizes>` to `"(max-width: 900px) 50vw, 240px"` | FOUND-02 |
| Wrap `:hover` in `@media (hover: hover) and (pointer: fine)` | D-06 |
| Remove existing `@media (prefers-reduced-motion) .b-piece:hover { transform: none }` block | D-08 (exempt) |
| Add `≤540px` media query: collapse to `grid-template-rows: 60% 40%; grid-template-columns: 1fr` (vertical stack) | Mobile composition |

### `index.astro` (MODIFIED)

| Change | Driver |
|--------|--------|
| Wrap bio-card `:hover` in `@media (hover: hover) and (pointer: fine)` | D-06 |
| Add reduced-motion guard for bio-shake | D-08 |
| Verify carousel slide transition guard (#2) still fires after global `*` clamp removed | D-08 |
| Add `priority={i === 0}` to portrait carousel first image | FOUND-02 LCP |
| Update portrait `sizes` to `"(max-width: 900px) 100vw, 280px"` | FOUND-02 |
| Apply IntersectionObserver to `.b-bio` for shimmer entrance | D-07 |
| Sweep raw font-size + spacing literals to tokens (largest concentration in this file) | D-17, D-18 |

### `about.astro` (MODIFIED)

| Change | Driver |
|--------|--------|
| Wrap `:hover` rules in `@media (hover: hover) and (pointer: fine)` (5 hover surfaces) | D-06 |
| Migrate raw spacing literals to `--sp-*` tokens (14 literals — biggest concentration) | D-17 |
| Migrate raw font-size literals to `--fs-*` tokens | D-17 |
| `var(--sp-3)` at line 98 now resolves correctly (token registered in tokens.css) | D-17 |
| Slow-scroll script + reduced-motion fallback — unchanged | D-05/D-08 (shipped) |

### `[category]/[slug].astro` (MODIFIED)

| Change | Driver |
|--------|--------|
| Add `priority` to hero `<Image>` | FOUND-02 LCP |
| Update hero `sizes` to `"(max-width: 960px) 100vw, 960px"` | FOUND-02 |
| Wrap pager-link `:hover` and `.full-pdf-link:hover` in hover gate | D-06 |
| Migrate raw `16px` font-size literals to `--fs-body` token | D-17 |

### `tokens.css` (MODIFIED)

| Change | Driver |
|--------|--------|
| Remove `*, *::before, *::after` reduced-motion clamp (lines 63-70) | D-08 |
| Remove `.b-card:hover, .b-piece:hover { transform: none !important; }` (line 69 within the removed block) | D-08 |
| Add `--sp-3: 12px;` between `--sp-2` and `--sp-4` | D-17 + bug fix |
| Update `--terracotta` comment: drop "decorative only", restate as load-bearing interactive accent | D-17 |
| Add `--lime` rationale comment (already exists; verify clarity) | D-17 |
| (Optionally) Add `--fs-foot: 14px` and `--fs-deco-xl: 240px` if sweep audit determines 3+ site-wide uses | D-17(c) target |

### `scripts/verify-build.sh` (EXTENDED)

| Change | Driver |
|--------|--------|
| Add Gate 23: `dist/index.html` contains `@media (max-width: 700px)` | SC1 lock |
| Add Gate 24: `dist/design/index.html` `<img` count ≥ 1 | SC5 lock |
| Add Gate 25: zero raw `font-size:\s*[0-9]+px` outside `tokens.css` | SC6 lock |

### `scripts/lighthouse-audit.sh` (NEW)

| Change | Driver |
|--------|--------|
| New file — batch Lighthouse run against preview URL for 5 routes | D-13/D-15 |
| Outputs to `.planning/phases/05-mobile-performance-accessibility/lighthouse/{route}.{html,json}` | SC2 evidence |
| Manual trigger only (not in CI) | D-16 |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| (none) | (none) | not applicable — Astro project, no shadcn, no third-party registries |

No icon library dependency added in Phase 5 — the three mobile glyphs are hand-authored inline SVGs (Claude's Discretion #1 in CONTEXT.md). This is consistent with Phase 3's no-icon-library contract (VISUAL-04 forbids lucide; the magazine-maximalist visual rejects library-default icons).

---

## Open Questions Resolved Inline

The following from `05-RESEARCH.md §7` are resolved by this UI-SPEC (no further user input required):

| Q | Question | Resolution |
|---|----------|------------|
| Q1 | Gallery tile `.deco` fate under D-09 | **DROP.** Per-slot decorations conflict with promoted hero; hero is the visual interest. |
| Q2 | Tile "blurb" field | **Use `piece.data.role` as-is.** No schema change. |
| Q3 | Per-slot accent on text column after recomposition | **KEEP.** Each tile retains its discipline accent on the right 40% text column. |
| Q4 | New tokens vs migration for off-scale literals | **3+ uses → new token; one-off → nearest existing scale.** Mapping detailed in `05-TOKEN-MAP.md` artifact during planning. |
| Q5 | Topbar icon library vs hand-rolled | **Hand-roll.** Three inline SVGs, no dep cost. |
| Q6 | Real-iPhone test rig | Captured at test time in `05-VERIFICATION.md` (D-14). Not a Phase 5 plan input. |
| Q7 | Gate 25 in scope? | **YES.** Friction is the lock against regression. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (no new visible copy; ARIA strings declared)
- [ ] Dimension 2 Visuals: PASS (tile composition + topbar collapse codified)
- [ ] Dimension 3 Color: PASS (no new colors; --terracotta comment amended; --lime rationale documented; --sp-3 added)
- [ ] Dimension 4 Typography: PASS (OVERRIDE-01/02 inherited; Gate 25 locks zero-new-literals contract)
- [ ] Dimension 5 Spacing: PASS (OVERRIDE-03 inherited; --sp-3 added; sweep mapping declared)
- [ ] Dimension 6 Registry Safety: PASS (no registries; no dependencies)

**Approval:** pending (gsd-ui-checker to validate)

---

## Sources

- `.planning/REQUIREMENTS.md` — FOUND-01, FOUND-02, FOUND-03 (FOUND-03 amended 2026-05-18)
- `.planning/ROADMAP.md` — Phase 5 SC1–SC6
- `.planning/phases/05-mobile-performance-accessibility/05-CONTEXT.md` — D-01 through D-18
- `.planning/phases/05-mobile-performance-accessibility/05-RESEARCH.md` — motion source inventory, tile composition analysis, token literal counts, Lighthouse rig
- `.planning/phases/04-navigation-secondary-surfaces/04-UI-REVIEW.md` — BLOCKER-1, BLOCKER-2, WARNING-1 (carry-overs)
- `.planning/phases/03-visual-design-system/03-UI-SPEC.md` — parent contract (typography, color, spacing, copy)
- `src/styles/tokens.css` — current token registry
- WCAG 2.5.8 (tap target), Astro Image priority API (5.10+), Lighthouse mobile preset docs
