# Phase 5: Mobile, Performance, Accessibility — Research

**Researched:** 2026-05-18
**Domain:** Mobile-first hardening — responsive layout, performance optimization (LCP/Lighthouse), accessibility (`prefers-reduced-motion`, tap targets, hover suppression), design-token discipline
**Confidence:** HIGH (all decisions locked in CONTEXT.md; primary uncertainties are real-device measurement, not approach)

---

## 1. Executive Summary

Phase 5 is a **hardening pass over an already-shipped magazine-maximalist Astro site** — no new features, no new content. Six Success Criteria split between three FOUND-* requirements and three Phase-4 UI-REVIEW carry-overs (BLOCKER-1 topbar collapse, BLOCKER-2 gallery thumbnails, WARNING-1 token hygiene). 18 implementation decisions are already locked in `05-CONTEXT.md`; this research's job is to map them onto the existing codebase and surface the few details the planner still needs to commit to.

**Three load-bearing findings the planner must internalize before spawning tasks:**

1. **The gallery-tile "empty slab" is misdiagnosed.** Phase 4 UI-REVIEW called BLOCKER-2 "no hero, no thumbnail." That is wrong. Every Gallery component (`GalleryA12.astro`, `GalleryB35.astro`, `GalleryC68.astro`) already renders `<Image src={piece.data.hero} ... class="cover" />` — the hero IS there, but its CSS rule is `opacity: 0.55` and it sits behind a colored tile fill that overpowers it. BLOCKER-2 is therefore a **CSS/composition fix** (D-09's "hero LEFT 60% / text RIGHT 40%" magazine layout), not a wiring fix. The planner should not author a task that says "wire the hero" — it's already wired; the task is "promote the hero from background-watermark to foreground-asset and recompose the tile."

2. **The Vercel project import is the cheapest unblocked task and gates everything else** (D-13, amended 2026-05-18 — was Cloudflare Pages). GitHub repo `C-lb/caleb-lim-portfolio` is **already pushed** as of 2026-05-18; what remains is `vercel.com/new` → import GitHub repo → accept the auto-detected Astro build settings (no `vercel.json` required for a default Astro static site; Vercel detects the framework, runs `npm run build`, serves `dist/`). The SC2 measurement loop ("score ≥85 perf / ≥95 a11y on preview URL") cannot be tested until the Vercel preview URL exists. This is a sequencing fact the planner must encode as a first-wave dependency.

3. **The `prefers-reduced-motion` policy has been *amended* and is more nuanced than the original FOUND-03.** D-08 carves out **four exempt motions** (rest tilts, lime-dot pulse, hover-tilt+glass, click-shake) and disables five (carousel autoplay, entrance shakes ×2, slow-scroll, future reveals). The current global `*` selector in `tokens.css:63-70` clamps *all* animation-duration to 0.01ms — which **already breaks the exemption policy** by killing the hover-tilt 380ms transition and the click-shake 220ms keyframe. The sweep is not "add reduced-motion handling" — it's "loosen the global hammer and use surgical per-motion guards instead." This is an invasive edit, not a minor patch.

**Primary recommendation:** Structure Phase 5 as **two waves**:

- **Wave 1 (parallel)**: Vercel project import (D-13, amended) + topbar mobile collapse (D-01–D-03) + gallery tile recomposition (D-09–D-12) + token-sweep (D-17–D-18). All four are independent and can ship in any order.
- **Wave 2 (sequential)**: Reduced-motion surgical pass (D-08), touch-hover suppression sweep (D-06–D-07), real-device + Lighthouse verification on the now-deployed preview URL.

Real-device iPhone Safari test (SC1, SC4) and the Lighthouse audit (SC2) are the **phase-exit gates** and run last. Token sweep is independent — can run first or last.

---

## 2. Domain & State Mapping

What exists today in every system Phase 5 touches. Read this before committing to any approach.

### 2.1 Topbar (`src/layouts/Base.astro:59-102`)

**Current structure** (Base.astro:31-39):
```
<header class="topbar">
  <a href="/" class="brand">caleb lim</a>
  <StatusPill />        ← Position: fixed top-center (own coordinate space)
  <nav aria-label="primary">
    <a class="nav-link">caleb.lim.2024@smu.edu.sg</a>
    <a class="nav-link">linkedin</a>
    <a class="nav-link">resume</a>
  </nav>
</header>
```

**Current layout**: `display: flex; justify-content: space-between; align-items: center; padding: var(--sp-5) var(--sp-6); font-family: var(--mono); font-size: var(--fs-mono); letter-spacing: 0.1em; text-transform: uppercase`.

**Breakpoints**: Only one — `@media (max-width: 900px)` at line 151, and it ONLY restyles `.foot` (the footer). The header has **zero responsive treatment** below 900px. At 375px the email link `caleb.lim.2024@smu.edu.sg` is ~30 mono-caps characters and overflows past the right edge.

**Key facts the planner must respect:**
- The StatusPill is rendered *inside* the `<header>` tree but uses `position: fixed; top: 12px; left: 0; right: 0; width: 100vw; display: flex; justify-content: center` (StatusPill.astro:18-28). It does NOT participate in the topbar's flex layout — it's its own coordinate space. Treat it as an independent surface; the topbar collapse strategy does not need to reserve space for it.
- The `.nav-link` padding is `4px 0` (Base.astro:92) which renders as ~19px effective tap height — fails WCAG 2.5.8 (24×24 minimum, 44×44 AAA) regardless of breakpoint. D-02 mandates 44×44 in the mobile icon row; the planner should also bump desktop nav padding to ≥24×24 to clear the AA floor site-wide.
- All three nav-link text strings (`caleb.lim.2024@smu.edu.sg`, `linkedin`, `resume`) are currently rendered as text. D-01 replaces them with SVG glyphs (✉, "in", ⤓) below 700px. The icons need accessible labels (`aria-label` per icon) since the visual label disappears.

### 2.2 Gallery Tiles (`src/components/GalleryA12.astro`, `GalleryB35.astro`, `GalleryC68.astro`)

**Three components, near-identical structure**. Each renders:
```astro
<a class="b-piece p{slot}">
  <span class="tag">0X / 0Y</span>
  <Image src={piece.data.hero} alt={piece.data.title} class="cover" />
  <div class="meta">
    <span class="ttl">{title}</span>
    <span class="role">{role}</span>
  </div>
  <span class="deco" aria-hidden="true"></span>
</a>
```

**Current `.cover` CSS** (verbatim across all three):
```css
.b-piece .cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0.55;  /* ← the "empty slab" cause */
}
```

The hero IS rendered. The `opacity: 0.55` plus the colored tile background (`background: var(--terracotta)` etc.) means the hero reads as a faint watermark behind the title. The Phase 3 "magazine bleed" design intent was to let the tile fill **bleed through** the hero — at the time only one design piece existed and the hero was a low-detail brand-mark, so it sort of worked. With richer hero images (photographs, finished design boards) the effect now reads as "broken image" per BLOCKER-2.

**D-09–D-12 spec**: change the composition to **hero LEFT 60% / text RIGHT 40%**, 4:5 portrait tile aspect. This is a **structural rewrite of each `.b-piece` rule**, not a single property change. It must apply to ALL three bucket components (A/B/C) to stay consistent across 1–8-piece galleries. D-12 carves out empty disciplines (`/personal`, `/finance`) which keep "in the works — coming soon" treatment — but those are out-of-route per `[category].astro:13-17` (the `getStaticPaths` filters out empty disciplines, so `/finance` returns 404 today; only `/design` and `/marketing` are populated and render anything).

**Per-piece-slot tile decorations** (the `.deco` element and `.p1 .deco { font-size: 240px; color: rgba(255,255,255,0.12); ... }` style block in each gallery component) are decorative overlays that sit at `z-index: 0` with the hero. The new "hero LEFT 60%" composition will need to decide whether the `.deco` stays in the hero half (as a watermark over the photo) or moves to the text half. **This is a decision the planner needs to surface** — D-09 doesn't address it.

**Schema reference** (`src/content.config.ts:11-29`): `hero` is `image()` (Astro asset), `title` / `role` / `outcome` / `context` are strings. Tile uses `title` + `role`; the new "blurb" on the right 40% could reuse `role` (a one-line tagline) or pull from `context` (3-6 lines) — D-09 says "title + blurb" without specifying. Recommendation: keep `role` as the tile-tagline (already short, already on the tile), bumped to slightly larger font + given breathing room in the right half. Don't pull from `context` — that's the detail page's territory and reads as redundant on the gallery.

### 2.3 Reduced-Motion Sources (sweep across all files)

**The global hammer in `tokens.css:63-70`**:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .b-card:hover, .b-piece:hover { transform: none !important; }
}
```

This is too aggressive for D-08. It clamps EVERY animation and EVERY transition — including the four exempt ones D-08 wants to keep. The planner has two architectural choices:

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A. Loosen globally, harden surgically** | Remove the `*` clamp. Add per-motion `@media (prefers-reduced-motion: reduce)` blocks at each disable site (carousel autoplay JS, entrance shake CSS, slow-scroll JS). | Surgical, matches D-08 intent exactly. | More edit sites (~5-6). |
| **B. Keep global clamp + opt-out per exempt motion** | Keep the `*` clamp. Add `:not(.exempt)` or specific selectors that override `animation-duration` back to the original value via `!important` at higher specificity. | Fewer total edits. | Specificity wars; CSS `!important` battles are fragile and hard to debug. |

**Recommendation: Option A.** Phase 4 UI-REVIEW Pillar 6 noted reduced-motion is wired "in 3 places" — the global block + Base.astro `.skip` transition + slug pager hover + carousel autoplay. The codebase already trusts surgical guards in most places; the global `*` block is the exception. Removing the `*` clamp and adding the carousel + entrance-shake disables explicitly (they're partially there already at index.astro:198-200, DisciplineCard.astro:296-298) closes the gap without specificity hacks.

**Inventory of motion sources to audit** (each needs a reduced-motion guard or explicit exemption):

| Source | File:line | Type | D-08 verdict |
|--------|-----------|------|--------------|
| Portrait carousel auto-advance | index.astro:738-745 | JS setInterval | **DISABLE** (already handled — `if (prefersReduced.matches) return`) |
| Portrait carousel slide transition | index.astro:189 (transform 650ms cubic-bezier) | CSS transition | **DISABLE** when user-initiated AND reduced (already partially — line 198-200) |
| Card entrance shake | DisciplineCard.astro:319 (`card-shake 750ms ... 400ms 1`) | CSS animation | **DISABLE** |
| Bio card entrance shake | index.astro:375 (`bio-shake 750ms ease-in-out 400ms 1`) | CSS animation | **DISABLE** |
| Card hover-tilt | DisciplineCard.astro:281-287 (`transform: perspective(...) rotateX/Y; transition 0.38s`) | CSS transition | **EXEMPT — STAY ACTIVE** |
| Card click-shake | DisciplineCard.astro:336-338 (`card-shake-click 220ms`) | CSS animation | **EXEMPT — STAY ACTIVE** |
| Liquid-glass overlay fade | DisciplineCard.astro:81 (`transition: opacity 380ms ease`) | CSS transition | **EXEMPT — STAY ACTIVE** (hover-paired feedback) |
| Bio card hover-tilt | index.astro:373-374 (`transition: transform 0.38s ...`) | CSS transition | **EXEMPT — STAY ACTIVE** |
| Bio card liquid-glass | index.astro:386-387 (`transition: opacity 380ms ease`) | CSS transition | **EXEMPT — STAY ACTIVE** |
| Card rest tilts | DisciplineCard.astro:156, 181, 209, 237 (`transform: rotate(±1deg)`) | Static transform | **EXEMPT — STATIC** (no motion property; survives any reduced-motion rule) |
| Lime-dot pulse | StatusPill.astro:71 (`animation: pulse 1.6s ease-in-out infinite`) | CSS animation | **EXEMPT — STAY ACTIVE** (status indicator) |
| StatusPill hover scale | StatusPill.astro:49-51, 77-79 | CSS transition | **EXEMPT** (per D-08 hover-feedback rule by analogy) |
| Role-link click shake (replay) | index.astro:625-630 + DisciplineCard.astro `is-shaking` | CSS animation | **EXEMPT — user-initiated feedback** |
| `/about?to=contact` slow scroll | about.astro:355-368 | RAF | **DISABLE** (already handled — line 351 `if (reduced) ... instant jump`) |
| `.skip` link transition | Base.astro:117 | CSS transition | **DISABLE** (already handled — line 125-127) |
| `.b-cat-back` background-color transition | [category].astro:91, [slug].astro:184, about.astro:168 | CSS transition | **EXEMPT** (hover-color is feedback, not motion) |
| `.values-pill` hover translateY | about.astro:248-258 | CSS transition | **EXEMPT** (hover-feedback) |
| Detail pager link color transition | [slug].astro:282 | CSS transition | **EXEMPT** (color-only) |
| `.b-piece` tile hover scale+rotate | GalleryA/B/C — `transform: scale(1.02) rotate(-0.3deg)` | CSS transition | **EXEMPT** under D-08 hover-feedback rule (NB: current global block already kills these per `tokens.css:69` — needs flipping if A is chosen) |

**Note on `.b-card:hover, .b-piece:hover { transform: none !important; }` (tokens.css:69)**: This is the global block's "kill hover transforms" override. Under D-08 the hover-tilt is EXEMPT. This line must be removed when Option A lands. Same for the gallery tile hover (which currently disables under reduced-motion in each gallery component — those `@media (prefers-reduced-motion: reduce) { .b-piece:hover { transform: none } }` blocks at lines 139-142 in A12, 183-186 in B35, 171-175 in C68 also conflict with D-08 and should be removed/loosened).

### 2.4 Hover Surfaces (touch-suppression targets per D-06)

Current state: **zero `@media (hover: hover) and (pointer: fine)` gates anywhere in the codebase** (verified via grep). All hover effects fire on touch, producing the "first tap = hover, second tap = navigate" iOS Safari friction.

**Hover effects that need touch-gating** (D-06):

| Effect | Location | Currently fires on touch |
|--------|----------|--------------------------|
| Card 3D tilt + lift | DisciplineCard.astro:281-294 | Yes |
| Card liquid-glass overlay | DisciplineCard.astro:74-96, 295 | Yes |
| Bio card 3D tilt + lift | index.astro:406-417 | Yes |
| Bio card liquid-glass | index.astro:380-402 | Yes |
| Gallery tile scale+rotate | GalleryA/B/C `.b-piece:hover { transform: scale(1.02) rotate(-0.3deg) }` | Yes |
| StatusPill hover scale | StatusPill.astro:52-58 | Yes |
| `.nav-link` hover color | Base.astro:81 | Yes |
| `.b-cat-back` hover background swap | [category].astro:94-97, [slug].astro:186-189, about.astro:171-174 | Yes |
| Role-link hover underline+opacity | index.astro:347-349 | Yes |
| `.values-pill` hover background+translate | about.astro:252-258 | Yes |
| Pager-link hover color | [slug].astro:307 | Yes |
| `.about p a` hover color | about.astro:202-204 | Yes |
| `.full-pdf-link` hover color | [slug].astro:260-262 | Yes |

**Approach** (D-06): Wrap each hover ruleset in `@media (hover: hover) and (pointer: fine) { ... }`. On touch devices (iPhone Safari reports `hover: none, pointer: coarse`), these never apply — first tap is the click. Color-feedback hovers (`.nav-link:hover`, `.b-cat-back:hover`, etc.) are user-initiated and brief; technically they're fine under D-08's hover-exempt rule, but on touch they create the iOS "phantom hover state" friction. D-06 says ALL hover effects gate behind `(hover: hover)` — no exceptions.

**Replacement for touch (D-07)**: scroll-into-view shimmer/pulse per card, fires once via IntersectionObserver. Triggers only on `@media (hover: none)`. The `IntersectionObserver` API is native (no dep). Pattern: add `.is-entered` class on first intersection; CSS animation `entrance-shimmer 600ms ease-out` runs once on that class. Disabled under `prefers-reduced-motion` (per D-08, this is decorative motion, not user-initiated feedback).

### 2.5 Design Tokens (`src/styles/tokens.css`)

**Current state** (tokens.css:1-51):

- **Color tokens**: `--paper`, `--ink`, `--design`, `--acid`, `--cobalt`, `--terracotta`, `--plum`, `--teal`, **`--lime`** (added 2026-05-18 during Phase 4 UAT, line 16). All registered. The Phase 4 UI-REVIEW WARNING-1 claim "`--lime` undocumented" is **stale** — it IS in tokens.css with a comment. D-17(a) per CONTEXT.md says "register `--lime` ... OR remove if redundant against `--acid`" — the answer is "already registered, audit if usage justifies it." `--lime` is used only in StatusPill (`--lime` dot + focus outline) and the conceptual contrast against `--acid` (deep gold) is intentional: lime is the "go signal" pop, acid is the warm-content discipline accent. **Keep `--lime`. Update the comment in CONTEXT.md to reflect the current state.**

- **`--terracotta` scope**: Comment at line 13 says "decorative accent only." Phase 4 UI-REVIEW counted 16 load-bearing uses in `about.astro` (scrollbar thumb, dashed border, hover fills, focus ring, link hover). D-17(b) says "drop the 'decorative only' comment." Recommendation: drop the comment, OR replace with a more accurate one like `"interactive accent — hover/focus/link feedback across about.astro + topbar nav-link hover."`

- **Font-size tokens** (lines 23-34): 11 roles (`--fs-display`, `--fs-cat`, `--fs-q`, `--fs-card`, `--fs-h3`, `--fs-ttl`, `--fs-body`, `--fs-tile-role`, `--fs-mono`, `--fs-card-no`, `--fs-deco-numeral`). Phase 4 UI-REVIEW counted 18 raw `font-size: Npx` literals bypassing this scale. My re-count (grep across `src/`):

  | File | Raw literals | Notes |
  |------|--------------|-------|
  | `src/layouts/Base.astro` | 1 (`14px` in `.foot .center`) | One — easy sweep |
  | `src/pages/index.astro` | 9 (`11px` ×4, `18px`, `22px`, `13px`, `32px`, `1.7em`) | Highest concentration — bio card + question bar |
  | `src/pages/about.astro` | 4 (`0.92rem`, `11px`, `13px`, `16px`) | Values pills + photo wireframe |
  | `src/pages/[category]/[slug].astro` | 2 (`16px` ×2) | Resume link + pager-title |
  | `src/pages/404.astro` | 1 (`18px`) | |
  | `src/components/DisciplineCard.astro` | 4 (`10px` ×2, `clamp(28px..44px)`, `clamp(22px..30px)`) | k-class card-name + card-no + cue |
  | `src/components/GalleryA12.astro` | 2 (`240px`, `90px`) | Decoration numerals |
  | `src/components/GalleryB35.astro` | 2 (`240px`, `90px`) | Same as A12 |
  | `src/components/GalleryC68.astro` | 2 (`240px`, `90px`) | Same |
  | **Total** | **~27 literals across 9 files** | UI-REVIEW counted 18; my grep finds more |

  **D-17(c) target**: "zero raw `px` font-sizes outside `tokens.css`." That's all 27. D-18 mandates manual sweep, file-by-file. Practical decision tree per literal:

  | Literal | Maps to | Action |
  |---------|---------|--------|
  | `10px`, `11px`, `13px` | Closest to `--fs-mono` (11px), `--fs-tile-role` (13px), or `--fs-card-no` (9px) | Pick the closest existing token; if the literal is intentionally between scales, add a new token (e.g., `--fs-micro: 10px`) and document it |
  | `14px` (Base.astro footer) | `--fs-body` is 15.5px — closest is `--fs-mono` 11px (too small) or `--fs-tile-role` 13px (close). | Either add `--fs-foot: 14px` or migrate to `--fs-tile-role` and bump to 13px |
  | `16px`, `18px`, `22px`, `32px` | `--fs-ttl` 22px, `--fs-h3` 26px exist; 16/18/32 don't | Add tokens or pick nearest |
  | `90px`, `240px` (gallery decoration) | `--fs-deco-numeral` is `clamp(64px, 8vw, 96px)` — covers 90px well; 240px is way past it | The 240px is decoration overlay; add `--fs-deco-xl: 240px` |
  | `1.7em`, `0.92rem` | Relative units — already legitimate per CSS conventions | Tokenize or keep? — judgment call; `1.7em` on `.b-bio-tag-star` is intentionally relative to parent. Probably keep relative. |
  | `clamp(...)` literals in DisciplineCard | Already responsive, already exist | Add to tokens scale as new responsive roles (e.g., `--fs-card-major`) |

  **Recommendation**: D-18 says no codemod. The planner should split this into a single sweep task with a deterministic mapping table (literal → token, decided upfront), then execute file-by-file. **The mapping table needs decisions**, not just discovery — the planner may want to surface the ambiguous cases (e.g., `14px` in the footer) as user-confirm points.

- **Spacing tokens** (lines 44-50): `--sp-1` (4px), `--sp-2` (8px), `--sp-4` (16px), `--sp-5` (24px), `--sp-6` (32px), `--sp-8` (48px), `--sp-10` (64px). Note: no `--sp-3` (12px). My grep found ~14 raw `gap`/`padding` literals (see Phase 4 UI-REVIEW Pillar 5 + my Section 2.5 table above). Same approach: deterministic literal→token map. Examples:
  - `gap: 18px` (Base.astro:78) → `--sp-4` (16px) or `--sp-5` (24px); 18px is between scales — decide based on visual judgment
  - `padding: 4px 0` (Base.astro:92) → `--sp-1` and 0
  - `gap: 12px` (gallery components ×3) → would map to `--sp-3` but that token doesn't exist. **Recommendation: add `--sp-3: 12px` to tokens.css.** It's a natural step in the 4-multiple scale (4/8/**12**/16/24/32/48/64); about.astro:98 already uses `var(--sp-3)` which currently resolves to "undefined" and falls back. **Verify this in the build** — `--sp-3` may be silently broken right now.
  - `padding: 16px 28px 22px` (index.astro:140) → `var(--sp-4) ?? ??`; 28px and 22px are off-scale. Either add `--sp-7: 28px` or accept the asymmetry as intentional design.
  - `gap: 14px` (index.astro:143) → between 12 and 16; pick `--sp-3` or `--sp-4`.
  - `gap: 10px` (index.astro:571, 404.astro:75) → between 8 and 12; pick `--sp-2` (8px) or new token.

**Critical: verify `--sp-3` is actually missing.** about.astro:98 (`gap: var(--sp-3)`) consumes it but tokens.css doesn't define it. The fallback in CSS is "invalid" → the rule is ignored → gap collapses to 0 or browser default. Phase 4 UI-REVIEW didn't flag this, which means visually it's been working — probably because flex default gap is 0 and the layout doesn't rely on it. **The planner should add a sub-task: define `--sp-3: 12px` in tokens.css** (it closes the gap in the scale AND fixes the about.astro silent failure).

### 2.6 Image Pipeline & LCP Candidate

**Splash LCP candidate** (the largest element painted in the viewport on first paint at 1280×720): almost certainly the **portrait carousel image** (`src/pages/index.astro:74-96`). It's in a 280px-wide column on desktop (line 149), aspect-ratio 4:5, so painted dimensions are ~280×350px. On mobile (≤900px breakpoint, line 581) the carousel becomes the top row of a single-column stack — full viewport width, aspect-ratio 4:3 = roughly 375×280px on a 375px-wide viewport.

**Current rendering**: `<Image src={src} alt={...} widths={[280, 560]} sizes="280px" />` (index.astro:78). Astro generates an optimized srcset with the requested widths. Default service emits WebP. **No `priority` prop**, so it's `loading="lazy" decoding="async" fetchpriority="low"` by default.

**The fix per Astro 5.10+ docs** (Astro 5.18 is installed): add `priority` to the first portrait Image. Caveat: there are 5 portraits cycling; only the active one is the LCP candidate. Pattern: `priority={i === 0}` so only the initial portrait gets the eager-load. The other four can stay lazy.

**`sizes="280px"` is wrong on mobile** — at the 900px breakpoint the carousel goes full-width. The current declaration tells the browser "I will always be 280px wide" so it picks the 280w variant even on mobile where 375w or 560w would be sharper. Recommend updating to `sizes="(max-width: 900px) 100vw, 280px"`.

**Source-file weights are concerning:**
- `portrait.jpg` — 5.0MB
- `portrait2.JPG` — 1.2MB
- `portrait3.jpg` — **16MB**
- `portrait4.jpg` — 848KB
- `portrait5.jpeg` — 379KB

Astro processes and downsizes these at build time; the dist output uses the 280/560 widths. But: source files this large slow `astro build` significantly, and the `srcset` 560w output from a 16MB source can still be much heavier than a tighter-source equivalent at the same dimensions. **If Lighthouse fails LCP**, the move is to manually downsize the source files (Sharp CLI: `sharp resize 1120 < portrait3.jpg > portrait3-sm.jpg`) to a sane 1120px input. CONTEXT.md says "Image format optimization beyond Astro defaults is deferred" — leave this as a fallback play if SC2 fails on the first pass.

**Other LCP candidates per page**:

| Route | Likely LCP element | Notes |
|-------|--------------------|-------|
| `/` (splash) | Portrait carousel slide 1 (~280×350px) | Address with `priority` prop |
| `/design`, `/marketing` | Gallery tile p1 hero (`<Image>` at `inset: 0` covers the tile, ~720px × span 2 rows = ~480px tall) | After D-09 recompose, the LEFT 60% hero becomes more dominant; `priority` on p1 tile only |
| `/[category]/[slug]` | Hero image (large, full-width, ≤960px max) — `<Image src={hero} class="detail-hero" />` at [slug].astro:95 | Add `priority` here |
| `/about` | None (no images — just photo wireframes which are CSS-only divs) | No image LCP — text LCP, fine |

### 2.7 Fonts (already optimized per Phase 3)

Base.astro:5-7 imports three Fontsource Variable packages (Bricolage, Fraunces, JetBrains Mono). Bricolage is preloaded via `<link rel="preload" as="font">` at line 27. Fontsource v5 emits `font-display: swap` by default in its CSS, so FOIT (flash of invisible text) is avoided. This is in good shape — no additional font work needed for FOUND-02.

---

## 3. Technical Approach (per focus area)

Concrete patterns the planner can write into tasks. Each section maps to one Success Criterion or D-decision.

### 3.1 Vercel + Lighthouse Bootstrap (D-13, SC2 — amended 2026-05-18, was Cloudflare Pages)

**Vercel setup for Astro** (verified via Vercel's Astro framework guide [CITED: vercel.com/docs/frameworks/astro]):

1. Push repo to GitHub — **DONE 2026-05-18**. Repo: `https://github.com/C-lb/caleb-lim-portfolio` (public).
2. Open `vercel.com/new` → Continue with GitHub → authorize Vercel app on `C-lb/caleb-lim-portfolio`.
3. Build configuration (auto-detected by Vercel):
   - **Framework preset**: Astro (detected from `astro.config.mjs` and `package.json`)
   - **Build command**: `npm run build` (auto)
   - **Output directory**: `dist` (auto)
   - **Install command**: `npm install` (auto)
   - **Node version**: 22.x by default for new projects; if a build error references Node version, set `NODE_VERSION=22` in Project Settings → Environment Variables. `.nvmrc` is respected.
4. Click Deploy. First production build runs against `main` and takes ~30–60s. Subsequent pushes to any branch auto-deploy as preview (per [CITED: vercel.com/docs/git#preview-deployments]). PRs deploy automatically too.
5. **Preview URL structure** (HIGH confidence, verified against Vercel generated-URLs docs [CITED: vercel.com/docs/deployments/generated-urls]):
   - Per-deployment immutable URL: `<project>-<random-hash>-<scope>.vercel.app`
   - Per-branch alias (updates on every push to that branch): `<project>-git-<branch>-<scope>.vercel.app`. Non-alphanumeric branch chars → hyphen (so `phase/5` → `phase-5`).
   - Production alias: `<project>.vercel.app` (or custom domain when wired in Phase 6).
   - For this project: scope = `c-lb`, project = `caleb-lim-portfolio`. The `phase-5` branch alias is therefore `caleb-lim-portfolio-git-phase-5-c-lb.vercel.app`. Production is `caleb-lim-portfolio.vercel.app`.

The Phase 5 working branch (likely `phase-5` or similar) gets its own alias. Lighthouse runs against that alias, not the production URL.

**Lighthouse CLI command** (D-15, default mobile preset, Slow 4G [CITED: github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md]):

```bash
npx lighthouse https://caleb-lim-portfolio-git-phase-5-c-lb.vercel.app \
  --form-factor=mobile \
  --throttling-method=simulate \
  --output=html,json \
  --output-path=./lighthouse-splash.html \
  --view
```

Notes on the flags:
- `--form-factor=mobile` is the default; explicit for documentation clarity.
- `--throttling-method=simulate` is also the default. Simulated throttling uses Slow 4G profile (~1.6Mbps down, 750Kbps up, 150ms RTT, 4× CPU slowdown) — represents bottom-25% 4G / top-25% 3G connections. This is what SC2 asks for.
- `--throttling-method=devtools` is the alternative — applies real throttling during the run instead of computing what *would* have happened. More accurate but slower and higher variance. Use `simulate` unless results are suspicious; spot-check with `devtools` if SC2 fails.
- Repeat the run for `/design`, `/marketing`, `/about`, and one `/[category]/[slug]` route. SC2 explicitly mentions splash + gallery + detail.

**Recommendation: write a `scripts/lighthouse-audit.sh`** that batch-runs all 4-5 routes and dumps reports to `.planning/phases/05-mobile-performance-accessibility/lighthouse/`. Don't add to verify-build.sh — it's a manual-trigger script per D-16.

**Reading the results:**
- **Perf score ≥85** with **LCP <2s** on splash. Lighthouse's LCP threshold for "good" is 2.5s; SC2 sets a tighter 2s.
- **A11y score ≥95** on splash, gallery, detail. The site is already in good shape here (skip-to-content, aria-labels, focus-visible outlines, semantic landmarks) — biggest risk is the tap-target audit (Lighthouse flags any interactive ≤24×24px under WCAG 2.5.8). Bumping `.nav-link` padding from `4px 0` to `≥12px 8px` should close it.

### 3.2 Mobile Topbar Collapse (D-01, D-02, D-03, SC1)

**Target**: At `≤700px`, the email + linkedin + resume text-links collapse to a compact icon row (✉ / "in" / ⤓). Each icon is a 44×44 tap target. Brand "caleb lim" stays as text on the left.

**Markup approach** (Base.astro change):

```astro
<nav aria-label="primary">
  <a href="mailto:caleb.lim.2024@smu.edu.sg" class="nav-link">
    <span class="nav-text">caleb.lim.2024@smu.edu.sg</span>
    <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <!-- envelope path -->
    </svg>
    <span class="visually-hidden">email Caleb</span>
  </a>
  <!-- ditto for linkedin (in-letterform) and resume (download glyph) -->
</nav>
```

**CSS approach**:
```css
/* Default (>700px): show text, hide icon */
.nav-link .nav-icon { display: none; }
.nav-link .nav-text { display: inline; }

/* ≤700px: hide text, show icon, 44×44 box */
@media (max-width: 700px) {
  .nav-link .nav-text { display: none; }
  .nav-link .nav-icon { display: block; width: 16px; height: 16px; }
  .nav-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;  /* override 4px 0 */
  }
  .topbar nav { gap: var(--sp-2); }
}
```

The `.visually-hidden` utility class doesn't exist in the codebase yet — adopt the standard pattern (`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;`). Add to tokens.css or a new `src/styles/utilities.css` so it's site-wide.

**SVG glyph sources**: CONTEXT.md "Claude's Discretion" #1 leaves this open. Recommendation: hand-author monoline strokes (16-18 viewBox, 1.5-2px stroke-width, `currentColor` fill `none`). No library dep. Three glyphs are easy enough to inline:
- **Envelope** (mailto): standard rectangle + diagonal flap, ~6 path commands
- **"in" mark** (LinkedIn): two letterforms — a small "i" with a dot, and an "n" — drawn as monoline strokes. Avoid the official LinkedIn blue square logo (brand-guideline-violating without permission, also stylistically incoherent with the magazine-maximalist look).
- **Down-arrow into bracket** (resume download): vertical arrow + tray, ~5 path commands

**WCAG 2.5.8 compliance**: 44×44 clears AAA. 16-18px glyph centered in a 44px box meets the iOS HIG (44pt tap target).

**Edge case**: The `.skip` link sits at `position: absolute; top: 0; left: 0; transform: translateY(-200%)` and unfolds on focus. At ≤700px it'll still cover the topbar when focused — fine, that's the design intent.

### 3.3 Gallery Tile Recomposition (D-09–D-12, SC5)

**Target**: 4:5 portrait tile, hero LEFT 60% / text RIGHT 40%, magazine spread feel. Apply to GalleryA12, GalleryB35, GalleryC68. Empty disciplines (`/personal`, `/finance`) keep existing treatment — those are out-of-route today per the `getStaticPaths` filter, so no edit needed there.

**Structural rewrite of `.b-piece`** (concept — concrete edit applies to all three gallery components):

```css
.b-piece {
  position: relative;
  display: grid;
  grid-template-columns: 60% 40%;
  aspect-ratio: 4 / 5;       /* D-10 — overall tile aspect */
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
}
.b-piece .cover {
  /* Move out of position: absolute. Now a grid child in column 1. */
  grid-column: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 1;                /* PROMOTE — was 0.55 */
}
.b-piece .meta {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: var(--sp-4);
  gap: var(--sp-2);
}
.b-piece .tag {
  /* Sits at top-left over the hero, or moves into the text column. Design call. */
}
```

**Per-slot color/decoration: keep or drop?** Today's per-slot rules give p1 a `--terracotta` background bleed and a 240px decoration numeral. With the hero promoted to opacity 1 filling 60% of the tile, the per-slot palette becomes the right-side text column's background. **The planner should decide**: does the right 40% inherit the per-slot accent (each tile retains its terracotta/cobalt/acid/plum personality) or unify to a single neutral (e.g., `--paper` on `--ink` route)? Recommendation: **retain the per-slot accent on the text column** to preserve Phase 3's magazine-maximalist palette. The hero on the left + accent text panel on the right reads as editorial.

**Astro `<Image>` widths**: current `<Image src={piece.data.hero} alt={...} class="cover" />` doesn't specify widths or sizes. Phase 5 update per D-11: `widths={[280, 560]}` to match the carousel pattern, `sizes="(max-width: 900px) 50vw, 240px"` (240px ≈ 60% of a 400px tile at desktop densities).

**Priority hint**: only the *first* visible tile (`.p1`) is the LCP candidate on `/design` / `/marketing`. Conditionally apply `priority`:

```astro
<Image src={piece.data.hero} alt={piece.data.title} class="cover"
       widths={[280, 560]} sizes="(max-width: 900px) 50vw, 240px"
       {...(slot === 1 ? { priority: true } : {})} />
```

**Mobile collapse**: the current `@media (max-width: 900px)` block in each gallery component (lines 144-155 in A12, 188-200 in B35, 177-180 in C68) forces single-column / 2-column 1fr grids and aspect-ratio 4/5. This conflicts with the new tile aspect ratio (now also 4/5 at all viewports per D-10). Most of the mobile-collapse CSS becomes redundant after the rewrite. Keep only the `grid-column: span 1 !important` reset that flattens A12/B35/C68's per-slot `grid-column: span N` overrides.

### 3.4 Reduced-Motion Surgical Pass (D-08, FOUND-03, SC3)

**Step 1: Remove the global hammer.** Delete lines 63-70 of `tokens.css`:
```css
/* DELETE this whole block */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { ... }
  .b-card:hover, .b-piece:hover { transform: none !important; }
}
```

**Step 2: Add surgical disables at each non-exempt motion source.**

| Disable target | Where to put the guard |
|----------------|------------------------|
| Card entrance shake | Add `@media (prefers-reduced-motion: reduce) { .b-card { animation: none; } }` to DisciplineCard.astro after line 320 |
| Bio card entrance shake | Add `@media (prefers-reduced-motion: reduce) { .b-bio { animation: none; } }` to index.astro after line 376 |
| Carousel slide transition | Already at index.astro:198-200; verify it's still firing after the global block is removed |
| Carousel autoplay | Already at index.astro:738-745; works regardless of CSS changes |
| `.skip` link transition | Already at Base.astro:125-127; works |
| Slow-scroll to contact | Already at about.astro:350-353; works |

**Step 3: Keep exempt motions running.** After the global block is removed, the four exempt motions (hover-tilt, click-shake, lime-dot pulse, rest tilts) work by default. No additional code; they're just no longer being clobbered.

**Step 4: Remove the per-gallery `transform: none` overrides.** In GalleryA12/B35/C68 each has a reduced-motion block that kills `.b-piece:hover transform`. Under D-08 hover-feedback is exempt. Remove those blocks (lines 139-142 in A12, 183-186 in B35, 171-175 in C68).

**Verification approach**: macOS `System Settings > Accessibility > Display > Reduce motion`. Toggle on, refresh the site, walk:
1. Splash loads → cards should NOT shake on entrance (disabled).
2. Hover a card → tilt + glass SHOULD fire (exempt).
3. Click a role-link → card SHOULD shake (exempt — click-shake is user-initiated).
4. StatusPill dot SHOULD pulse (exempt — status).
5. Click "OPEN TO ROLES" → SHOULD instant-jump to /about#contact (not slow-scroll).
6. Carousel SHOULD NOT auto-advance (disabled).
7. Click carousel arrow → SHOULD slide (or jump? — D-08 doesn't explicitly say; user-initiated, treat as exempt by analogy → slide is fine).

### 3.5 Touch-Device Hover Suppression (D-06, D-07)

**Step 1: Wrap every hover rule in `@media (hover: hover) and (pointer: fine)`.**

Pattern:
```css
/* Before */
.b-card:hover { transform: perspective(1200px) ...; }
.b-card:hover::before { opacity: 1; }

/* After */
@media (hover: hover) and (pointer: fine) {
  .b-card:hover { transform: perspective(1200px) ...; }
  .b-card:hover::before { opacity: 1; }
}
```

Apply to the 13 hover surfaces listed in §2.4. Mostly mechanical. The `:focus-visible` rules stay outside the gate (keyboard focus is independent of pointer type).

**iOS Safari caveat** [CITED: smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/]: Safari on iOS reports `hover: none, pointer: coarse` even when an Apple Pencil or Magic Keyboard is attached. The `(hover: hover) and (pointer: fine)` test correctly returns false on iPhone — desired behavior. On iPad with Magic Keyboard the test ALSO returns false, which is correct: even with a keyboard the primary input is still touch.

**Step 2: Touch entrance animation (D-07).**

JS pattern (Astro inline `<script>` in DisciplineCard.astro or index.astro):

```typescript
// Only fire on touch devices (hover: none) to avoid double-firing on desktop.
const isTouchDevice = window.matchMedia('(hover: none)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isTouchDevice && !prefersReduced) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-entered');
        observer.unobserve(entry.target);  // one-shot per card
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.b-card, .b-bio').forEach((el) => observer.observe(el));
}
```

CSS:
```css
@media (hover: none) {
  .b-card.is-entered,
  .b-bio.is-entered {
    animation: card-shimmer 600ms ease-out 1;
  }
}
@keyframes card-shimmer {
  0%   { box-shadow: 0 0 0 0 currentColor; }
  50%  { box-shadow: 0 0 0 6px color-mix(in oklab, currentColor 8%, transparent); }
  100% { box-shadow: 0 0 0 0 currentColor; }
}
```

D-08 disables decorative motion under reduced-motion — the JS already gates on `prefersReduced`. CSS-only fallback: also wrap the `@keyframes` in `@media (prefers-reduced-motion: no-preference)` or add `@media (prefers-reduced-motion: reduce) { .b-card.is-entered { animation: none; } }`.

### 3.6 Design-Token Sweep (D-17, D-18, SC6)

**Step 1: Audit tokens.css** (these are non-negotiable single-file edits):
- Drop the stale "decorative accent only" comment on `--terracotta` (line 13).
- Add `--sp-3: 12px` (currently consumed in about.astro:98 but undefined).
- Add `--sp-7: 28px` if the planner wants to tokenize `padding: 16px 28px 22px` literals.
- Decide whether to add new font-size tokens (`--fs-foot: 14px`, `--fs-deco-xl: 240px`) or migrate the literals to existing scale entries.
- Document any added tokens via inline comment matching the existing format (description + rationale + date).

**Step 2: Build the literal→token mapping table** (planner-owned decision). Recommended approach: write a `05-TOKEN-MAP.md` (small doc inside the phase dir) that lists every literal with its target. Then sweep file-by-file. Don't try to batch — D-18 says judgment calls per literal.

**Step 3: Sweep** in order of complexity:
1. `Base.astro` (1 literal) — trivial
2. `404.astro` (2 literals) — trivial
3. `[category].astro` (1 literal) — trivial
4. `[category]/[slug].astro` (2 literals) — trivial
5. `DisciplineCard.astro` (4 literals) — careful, `clamp(...)` may stay if no responsive token exists
6. `about.astro` (4+ literals + 14 spacing) — biggest concentration after index
7. `index.astro` (9 font literals + many spacing literals) — biggest file, save for last
8. Gallery components (×3, 2 literals each — same 90px and 240px decorations) — copy-paste sweep

**Step 4: Add a verify-build.sh Gate** (per CONTEXT.md canonical_refs "Gate-23/24" suggestion). Two new gates:

- **Gate 23**: Topbar mobile collapse — grep the built `dist/index.html` for `@media (max-width: 700px)` rule presence (Astro inlines scoped CSS into each page).
- **Gate 24**: Gallery tile emits `<img>` — `grep -c '<img' dist/design/index.html` should be ≥1 (currently ≥1 already since `<Image>` outputs `<img>`; this gate locks the contract that the planner shouldn't accidentally remove the hero from the tile during recomposition).
- **(Optional) Gate 25**: Zero raw `font-size:\s*[0-9]+px` outside `tokens.css` — `grep -rn 'font-size:\s*[0-9]\+px' src/components/ src/pages/ src/layouts/` returns no matches. Locks D-17(c) target.

### 3.7 LCP < 2s on Splash (FOUND-02, SC2)

**Sequence of interventions in increasing-cost order:**

1. **Add `priority` to the first portrait Image** (index.astro:78, with `i === 0` gate).
2. **Update `sizes` attribute** on portrait Image to honor mobile breakpoint: `sizes="(max-width: 900px) 100vw, 280px"`.
3. **Update `sizes` on detail-page hero** ([slug].astro:95): `sizes="(max-width: 960px) 100vw, 960px"` + `priority` since it's above-fold.
4. **Add `priority` to gallery p1 tile** (Section 3.3 already covers this).
5. **(If still failing)** Downsize source portrait files. Particularly `portrait3.jpg` (16MB) and `portrait.jpg` (5MB) → resize to 1120px max dimension via sharp CLI as a one-shot. The build pipeline doesn't care; smaller sources → smaller output srcset → faster paint.
6. **(If still failing)** Force AVIF output. Astro 5.x emits WebP by default. AVIF is smaller still. Configure in `astro.config.mjs`:
   ```js
   import { defineConfig } from 'astro/config';
   export default defineConfig({
     image: { service: { entrypoint: 'astro/assets/services/sharp' } },
     // Per-Image: <Image src=... format="avif" />
   });
   ```

Interventions 1-4 are zero-risk and should clear SC2 unless something exotic is wrong. 5-6 are escalations CONTEXT.md marks deferred — only pull forward if Lighthouse fails after 1-4.

### 3.8 Validation Architecture

See §6 below — full Validation Architecture section per the spec.

---

## 4. Vercel + Lighthouse Setup (deep dive — amended 2026-05-18, was Cloudflare Pages)

This phase's first dependency. Detailed sequence:

### 4.1 GitHub Setup — DONE

GitHub repo created and pushed 2026-05-18:
- Repo URL: `https://github.com/C-lb/caleb-lim-portfolio` (public)
- Owner: `C-lb` (Caleb's GitHub account)
- Default branch: `main`
- Authoring: `gh repo create caleb-lim-portfolio --public --source=. --remote=origin --push`

The "GitHub repo exists with main branch pushed" precondition is satisfied. The planner should still treat any push of new commits (the unstaged WIP from Phase 4 + Phase 5 inflight) as a Wave 1 task — those commits gate the first Vercel deploy that includes Phase 5 work.

### 4.2 Vercel Project

Manual via dashboard (per [CITED: vercel.com/docs/frameworks/astro]):

1. `vercel.com/new` → **Continue with GitHub** → authorize the Vercel app on the `C-lb/caleb-lim-portfolio` repo (one-time grant; can be scoped to just this repo).
2. Vercel scans the repo and auto-detects Astro from `astro.config.mjs` + `package.json`.
3. Project name: `caleb-lim-portfolio` (matches repo by default; this becomes `<project>` in URLs — changing it later breaks links and is annoying, so accept the default unless there's a reason).
4. Production branch: `main`.
5. Framework preset: **Astro** (auto-filled).
6. Build command: `npm run build` (auto-filled from `package.json`).
7. Output directory: `dist` (auto-filled).
8. Environment variables: none required at first deploy. If a build error mentions Node version, add `NODE_VERSION=22` under Project Settings → Environment Variables → Production + Preview + Development.
9. Click **Deploy**. First build kicks off; takes ~30–60s for an Astro static site of this size.
10. Subsequent pushes deploy automatically: pushes to `main` redeploy production, pushes to any other branch deploy a preview, PRs deploy a preview tied to the PR commit.

### 4.3 Preview URL Verification

After first deploy:
- Production URL: `caleb-lim-portfolio.vercel.app`
- Push a commit to feature branch `phase-5`:
  ```bash
  git checkout -b phase-5
  git commit --allow-empty -m "test: trigger phase-5 preview deploy"
  git push -u origin phase-5
  ```
- Vercel auto-deploys → preview at `caleb-lim-portfolio-git-phase-5-c-lb.vercel.app` (the branch alias) and at a unique per-deployment URL like `caleb-lim-portfolio-<hash>-c-lb.vercel.app`.
- The branch alias updates with each push to `phase-5`; the per-deployment URL is immutable. Lighthouse runs against the branch alias (D-13).
- The Vercel dashboard's "Deployments" tab shows both URLs for every deploy; the "View Deployment" link copies the per-deployment URL.

### 4.4 Lighthouse Audit Script

`scripts/lighthouse-audit.sh` (new file, recommended pattern):

```bash
#!/usr/bin/env bash
# Run Lighthouse mobile audits against the Phase 5 preview URL.
# Output: ./lighthouse-reports/{route}.html and .json
set -euo pipefail

PREVIEW_URL="${1:-https://caleb-lim-portfolio-git-phase-5-c-lb.vercel.app}"
OUT_DIR=".planning/phases/05-mobile-performance-accessibility/lighthouse"
mkdir -p "$OUT_DIR"

ROUTES=("/" "/design" "/marketing" "/about" "/design/design-real-piece")
for route in "${ROUTES[@]}"; do
  slug=$(echo "$route" | tr '/' '_' | sed 's/^_//; s/^$/splash/')
  echo "=== Auditing $route ==="
  npx lighthouse "$PREVIEW_URL$route" \
    --form-factor=mobile \
    --throttling-method=simulate \
    --output=html,json \
    --output-path="$OUT_DIR/$slug" \
    --chrome-flags="--headless=new"
done

echo "Reports in $OUT_DIR/"
```

Caleb runs this once per phase-exit verification. Output gets stored in the phase directory, committed alongside `05-VERIFICATION.md`.

### 4.5 Reading Results

For each route, extract from the JSON:
- `categories.performance.score` × 100 → must be ≥85 on splash, gallery, detail
- `categories.accessibility.score` × 100 → must be ≥95 on splash, gallery, detail
- `audits["largest-contentful-paint"].numericValue` ms → splash must be <2000

Pull-quote into `05-VERIFICATION.md` table per route. If any fail, escalate to §3.7 step 5-6 (downsize sources / force AVIF).

### 4.6 Throttling Profile Detail

Default Lighthouse mobile preset [CITED: github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md]:
- Network: Slow 4G (1.6Mbps down / 750Kbps up / 150ms RTT)
- CPU: 4× slowdown (emulates Moto G4-class device)
- Viewport: 412×823 (Moto G4)
- User agent: Chrome mobile

This is what SC2 implicitly asks for ("Lighthouse mobile audit on a throttled 4G profile"). D-15 confirms: default preset.

---

## 5. Risks & Pitfalls

### 5.1 Real-Device Behavior Diverges from Lighthouse

Lighthouse is a simulator. iPhone Safari has its own quirks (100vh on iOS uses max viewport height including hidden chrome — content can clip below the URL bar; `position: fixed` inside scrollable container behaves differently; `backdrop-filter` performance varies wildly across iOS versions). SC1 explicitly mandates a real-device pass alongside the Lighthouse pass. Recommendation: do the iPhone walk *before* Lighthouse — if real device fails, no point Lighthousing.

### 5.2 Backdrop-filter Performance on Mobile

The liquid-glass overlay (`backdrop-filter: blur(8px) saturate(1.5)`) in DisciplineCard.astro and the bio card is expensive on mid-range mobile GPUs. It's only triggered on hover — under D-06 it now only fires on hover-capable devices (desktop, iPad-with-keyboard). Touch devices never trigger it. Side-effect: mobile Lighthouse perf score should be unaffected by backdrop-filter (it's hover-state CSS). But desktop Lighthouse, if Caleb runs it for completeness, might flag it.

### 5.3 The `--sp-3` Silent Failure

§2.5 noted `about.astro:98` consumes `var(--sp-3)` which is undefined. CSS resolves invalid var-refs to the property's initial value or fallback — for `gap` that's 0. The page hasn't visibly broken because flex without gap = adjacent siblings touch, which is masked by the photo wireframes' padding. **The planner should treat this as a sub-task of the token sweep**, not a separate bug. Add `--sp-3: 12px` and verify the about-photos-track visually picks up the gap (it may slightly redistribute the layout).

### 5.4 Vercel Deploy Propagation

Vercel's edge propagation is near-instant for new deploys — the branch alias points at the new deployment as soon as the build completes. Static asset URLs are content-hashed by Astro, so cache invalidation for assets is automatic (each build emits new filenames). **Smaller pitfall than Cloudflare Pages had**, but the practice still matters: wait for Vercel's "Ready" status in the dashboard (or `vercel inspect <deployment-url>` if the CLI is later added) before running Lighthouse, otherwise the alias may briefly resolve to the previous deployment. The deployment timeline on the Vercel dashboard shows exact transitions: Building → Deploying → Ready.

### 5.5 iOS Safari Tap-Target Reality vs Spec

WCAG 2.5.8 says 24×24 minimum. iOS HIG says 44×44. D-02 picks 44×44 (the stricter floor). But Safari's actual behavior treats anchors with `padding` differently than buttons — only the *content box* may be tappable in some edge cases. Mitigation: explicit `width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center` on the link itself, with the SVG glyph centered inside via flex — guarantees the entire 44×44 area is the click target.

### 5.6 Reduced-Motion Toggle During Session

`prefers-reduced-motion` can change at runtime (rare — user toggles OS setting mid-session). The existing carousel handler (index.astro:776) already listens for `prefersReduced.addEventListener?.('change', ...)`. New touch-entrance JS (§3.5) should follow the same pattern: re-evaluate on `change` and either suppress or unsuppress the IntersectionObserver. Low-priority edge case but worth flagging.

### 5.7 The "Hero Promotion" Could Break Per-Tile Decoration Composition

§2.2 noted gallery tiles have per-slot decorations (`p1` 240px italic numeral, `p3` 100px outline circle, `p5` repeating diagonal stripes, etc.) positioned absolutely over the tile background. Promoting the hero from `opacity: 0.55 watermark` to `opacity: 1 left-60%-grid-cell` changes the geometry: the decorations were composed against a flat color tile, now they'd overlay the photo or move to the text column. **The planner should explicitly decide** what happens to each decoration. Recommended: drop the deco entirely from the new composition (the hero IS the visual interest now; the deco was filling visual void) — but that's a design call.

### 5.8 Backward Compat: Existing `verify-build.sh` Gates

The existing Phase 1-4 gates (22 total) cover the current structure. Any rewrite that changes HTML output structure risks breaking them. Particularly Gate 17 ("404.html contains a discipline card link") — if 404.astro's gallery card rendering changes (it currently renders DisciplineCard with the same `isEmpty` logic), gates that grep for specific class names or hrefs may break. **Mitigation**: run `bash scripts/verify-build.sh` after every Phase 5 sub-task; treat any regression as a blocker before adding new gates.

### 5.9 Astro 5.18 vs 5.10 priority Prop

The `priority` prop on `<Image>` landed in Astro 5.10 per [CITED: astro.build/blog/astro-5100/]. Project is on Astro 5.18.1 — verified via `node_modules/astro/package.json`. **No upgrade needed**; the prop is available today.

---

## 6. Validation Architecture

> Workflow `nyquist_validation: true` in `.planning/config.json`. This section drives the downstream VALIDATION.md.

### 6.1 Test Framework

| Property | Value |
|----------|-------|
| Framework | Bash smoke tests (`scripts/verify-build.sh`) + manual Lighthouse CLI + manual iPhone Safari walk |
| Config file | `scripts/verify-build.sh` (854 LOC, Gates 1-22) |
| Quick run command | `bash scripts/verify-build.sh` (after `npm run build`) |
| Full suite command | `npm run build && bash scripts/verify-build.sh && bash scripts/verify-anti-ai-tells.sh` |
| Manual gate | iPhone Safari real-device walk; recorded in `05-VERIFICATION.md` |
| Performance gate | `bash scripts/lighthouse-audit.sh <preview-url>` (NEW — to be written in Wave 1) |

This project has **no Vitest/Jest/Playwright**. All validation is grep-based shell checks against built HTML in `dist/` plus manual real-device and Lighthouse runs. This is by design (the SC docs and Phase 1-4 plans never propose unit tests) and Phase 5 should NOT introduce one — that's a scope creep risk.

### 6.2 Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FOUND-01 (SC1) | `.topbar` collapses at ≤700px to icon row | smoke | `grep -F '@media (max-width: 700px)' dist/index.html` + visual on real iPhone | Wave 0 (new Gate 23) |
| FOUND-01 (SC1) | All tap targets ≥44×44 | manual | iPhone Safari thumb test; Lighthouse a11y audit also flags this | Wave 0 (lighthouse-audit.sh) |
| FOUND-01 (SC4) | Critical path unbroken on iPhone Safari | manual-only | Real-device walk (splash → /design → piece → resume) | Manual (recorded in 05-VERIFICATION.md) |
| FOUND-01 (SC5) | Gallery tiles render hero | smoke | `grep -c '<img' dist/design/index.html` ≥1 AND visual check | Wave 0 (new Gate 24) |
| FOUND-02 (SC2) | LCP <2s on splash | perf | `npx lighthouse <url> --form-factor=mobile` → JSON `largestContentfulPaint < 2000` | Wave 0 (lighthouse-audit.sh) |
| FOUND-02 (SC2) | Perf ≥85, A11y ≥95 | perf | Same Lighthouse run, score thresholds | Wave 0 (lighthouse-audit.sh) |
| FOUND-03 (SC3) | `prefers-reduced-motion: reduce` honored per D-08 exemptions | manual | Toggle macOS Accessibility setting; walk site verifying each motion source per §3.4 step 7 | Manual (recorded in 05-VERIFICATION.md) |
| SC6 / D-17 | Zero raw `font-size: Npx` outside tokens.css | smoke | `! grep -rnE 'font-size:\s*[0-9]+px' src/components/ src/pages/ src/layouts/` exits 0 | Wave 0 (new Gate 25) |
| SC6 / D-17 | `--lime` registered in tokens.css | smoke | `grep -F -- '--lime:' src/styles/tokens.css` | Wave 0 (Gate 23/25) |

### 6.3 Sampling Rate

- **Per task commit**: `npm run build && bash scripts/verify-build.sh` (~30 sec). Catches regressions.
- **Per wave merge**: Same + visual diff in browser dev tools at 700px + 375px breakpoints.
- **Phase gate**: Full suite + `bash scripts/lighthouse-audit.sh <preview-url>` + real-iPhone walk. Results recorded in `05-VERIFICATION.md`.

### 6.4 Wave 0 Gaps

- [ ] `scripts/lighthouse-audit.sh` — does not exist; create in Wave 1.
- [ ] `scripts/verify-build.sh` Gate 23 — covers ≤700px topbar collapse (grep dist/index.html for breakpoint + icon SVG presence).
- [ ] `scripts/verify-build.sh` Gate 24 — covers gallery tile hero emission (grep `<img` count in `dist/design/index.html` ≥1).
- [ ] `scripts/verify-build.sh` Gate 25 — covers zero raw font-size literals outside tokens.css.
- [ ] `05-VERIFICATION.md` template — captures Lighthouse scores per route, iPhone model + iOS version (D-14), reduced-motion toggle walk, screenshots.

*(Existing infrastructure: 22 Phase 1-4 gates in `scripts/verify-build.sh` cover the unchanged contracts — content, pdf-rasterization, header chrome, prev/next pager. Phase 5 doesn't regress those; gates 23-25 add to the suite.)*

---

## 7. Open Questions for Planner

These are points CONTEXT.md doesn't lock down. The planner needs to make decisions or surface them to the user during plan-check.

### Q1: Gallery tile `.deco` fate under D-09 recomposition

§5.7 — when the hero promotes to a 60% grid column, the per-slot decoration (240px italic numeral on p1, outline circle on p3, etc.) sits over what? The photo? Moved to the text column? Dropped entirely? Three options, each with different visual outcomes. **Recommendation: drop them** (the hero is now the visual interest), but the planner should call this out as a design decision.

### Q2: Tile "blurb" field — `role` or new field?

§2.2 — D-09 says "hero LEFT 60% / text RIGHT 40%" with "title + blurb." `piece.data.role` is already on the tile (one-line tagline) and could serve. But D-09 might intend a longer "blurb" pulled from `outcome` or a new schema field. **Recommendation: use `role` as-is**; resist adding a new schema field (scope creep). If a richer tile-tagline is wanted, defer to v2 (CONTENT-01 already covers this).

### Q3: Per-slot accent on text column

§3.3 — after hero promotion, does the right 40% text column keep its per-slot accent background (`--terracotta` for p1, `--cobalt` for p2, etc.) or unify to a single neutral? **Recommendation: keep per-slot accent**, preserves Phase 3 palette.

### Q4: New tokens vs migration for off-scale literals

§2.5 — `14px`, `18px`, `22px` etc. — which get new tokens (`--fs-foot`, `--fs-small`) and which get migrated to the closest existing scale value? **Recommendation**: add new tokens only when the literal appears 3+ times site-wide; migrate one-offs to the nearest existing scale value (accept visual rounding).

### Q5: Topbar icon library vs hand-rolled

§3.2 — Claude's Discretion permits any free icon library. **Recommendation: hand-roll** three SVG paths inline. Avoids dep cost, keeps full visual control, three glyphs is trivial. Alternative: Phosphor Icons (free, MIT, monoline style available) — but it's overkill for 3 icons.

### Q6: Real-iPhone test rig — Caleb's specific device

D-14 says "Caleb's current iPhone" — model+iOS recorded in `05-VERIFICATION.md`. The planner doesn't need to know this in advance; it's a fact captured at test time. Flagging it as Open in case the planner wants to surface "the user will need to verify on their iPhone" as an explicit task action.

### Q7: Should Gate 25 (zero raw font-size literals) ship in Phase 5?

D-17(c) target is "zero raw `px` font-sizes outside `tokens.css`." A Gate-25 enforcement check is a natural way to lock the contract. But it raises the friction for any future style edit (a developer can't quick-fix a font-size without going through tokens). **Recommendation: add Gate 25 anyway** — it's the only way to prevent regression and the friction is the *point*. The planner should call this out so the user can override if they want a softer gate.

---

## 8. Architectural Responsibility Map

| Capability | Primary Tier | Rationale |
|------------|-------------|-----------|
| Topbar layout (≤700px collapse) | Browser/CSS | Pure presentation; no server logic |
| Gallery tile recomposition | Browser/CSS + Astro build (Image srcset) | Layout is CSS; image variants are Astro build-time |
| Reduced-motion handling | Browser/CSS + Browser/JS | CSS @media + inline JS feature-detection |
| Hover-touch gating | Browser/CSS | Pure `@media (hover)` queries |
| Touch entrance animation | Browser/JS (IntersectionObserver) + CSS | Native API + CSS keyframes |
| Token sweep | Source-only edit | Compile-time CSS — no runtime |
| Image LCP optimization | Astro build + Browser | `priority` prop emits eager-load + fetchpriority hints |
| Lighthouse audit | External tool (CLI) | Manual-trigger script; no runtime in app |
| Vercel preview | External service (Vercel) + Git | One-time setup; auto-deploy on push |
| Real-device verification | Manual (human) | Cannot automate |

No new runtime components, no new server tier, no new database. Phase 5 is **entirely presentation-layer** plus one external service bootstrap.

---

## 9. Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Fully mobile-responsive across all pages | §2.1 topbar inventory + §3.2 collapse strategy + §3.3 gallery tile recomposition (SC1, SC5) |
| FOUND-02 | First paint <2s on standard mobile / hotel-wifi | §2.6 image pipeline + §3.7 LCP intervention sequence + §4 Lighthouse rig (SC2) |
| FOUND-03 | Honors `prefers-reduced-motion` with D-08 amendment exemptions | §2.3 motion source inventory + §3.4 surgical reduced-motion pass (SC3) |

All three requirements have explicit research support in this document. The planner can map each requirement to specific task actions in the corresponding §3 subsection.

---

## 10. Sources

### Primary (HIGH confidence)
- [Vercel — Astro framework guide](https://vercel.com/docs/frameworks/astro) — auto-detection, build settings, Node version
- [Vercel — Generated URLs / deployment URLs](https://vercel.com/docs/deployments/generated-urls) — per-deployment, per-branch alias, production alias patterns
- [Vercel — Git previews](https://vercel.com/docs/git#preview-deployments) — automatic per-branch and per-PR preview deploys
- [Astro Image API Reference](https://docs.astro.build/en/reference/modules/astro-assets/) — `priority` prop, widths, sizes
- [Astro 5.10 blog](https://astro.build/blog/astro-5100/) — `priority` prop landed in 5.10 (project uses 5.18.1, confirmed via `node_modules/astro/package.json`)
- [Lighthouse — Throttling docs](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md) — Slow 4G profile, simulate vs devtools method
- [Lighthouse — Emulation docs](https://github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md) — mobile preset (Moto G4, 412×823, 4× CPU)
- Repo source files — every claim about current state grounded in `cat`/`grep` of actual files

### Secondary (MEDIUM confidence)
- [Smashing Magazine — Hover and Pointer Media Queries Guide](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) — `(hover: hover) and (pointer: fine)` for touch suppression; iOS Safari edge cases
- [Vercel Astro Lighthouse pattern](https://vercel.com/docs/observability/web-analytics) — built-in Web Analytics is an optional alternative/complement to manual Lighthouse runs (not used in Phase 5 per D-16 manual-only)
- [Addy Osmani — fetchpriority hint](https://addyosmani.com/blog/fetch-priority/) — LCP optimization via priority hint

### Tertiary (LOW confidence)
- [BetterLink — Astro image optimization 2025](https://eastondev.com/blog/en/posts/dev/20251203-astro-image-optimization-guide/) — third-party how-to, used only to corroborate official docs; not load-bearing
- [DEV.to — 100vh problem with iOS Safari](https://dev.to/maciejtrzcinski/100vh-problem-with-ios-safari-3ge9) — `100dvh` modern unit; cited as background context, not as a Phase 5 dependency

---

## 11. Metadata

**Confidence breakdown:**
- Standard stack / dependencies: **HIGH** — Astro 5.18.1 verified, Lighthouse CLI standard, all libs locked
- Architecture / approach: **HIGH** — decisions D-01–D-18 are all locked in CONTEXT.md, this is mapping not designing
- Pitfalls (real-device divergence, CF cache, backdrop-filter perf): **MEDIUM** — known patterns but only verifiable at test time
- Validation strategy: **HIGH** — pattern is well-established by the existing 22 gates + Lighthouse manual flow

**Research date:** 2026-05-18
**Valid until:** 2026-06-17 (30 days — Astro 5.x is stable; Vercel's Astro auto-detection is stable; only risk is npm package version drift on `lighthouse` itself)

**Amended:** 2026-05-18 — Section 3.1, Section 4 (deep dive), Section 5.4 (cache invalidation), Section 8 table, Section 10 sources all switched from Cloudflare Pages to Vercel after user pivoted host. GitHub repo `C-lb/caleb-lim-portfolio` was pushed during the same amendment.

## RESEARCH COMPLETE
