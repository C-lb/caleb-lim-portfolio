# Phase 3: Visual Design System - Research

**Researched:** 2026-05-14
**Domain:** Astro 5 design-system implementation — type loading, scoped CSS architecture, magazine-grade layouts, custom 404, anti-AI-tell verification
**Confidence:** HIGH

## Summary

Phase 3 lands the locked Magazine-maximalist visual system from `.planning/sketches/001-direction-comparison/index.html` `.variant-b` (CSS lines 262–627) across the entire site. The phase is scoped tightly: pure CSS with custom properties, three gallery template `.astro` components keyed off `pieces.length`, a new `Base.astro` layout, three self-hosted variable woff2 fonts, a custom 404, and an anti-AI-tell grep gate.

The verbatim CSS in the sketch is the spec — extract numbers, don't re-derive. The locked decisions (D-01 through D-18 in CONTEXT.md) leave very little Claude's discretion: type loading mechanism, gallery bucket templates, 404 voice, motion baseline, and CSS architecture are all called.

**Primary recommendation:** Use **Fontsource variable packages directly** (not the experimental Astro Fonts API) with `?url` import + manual `<link rel="preload">`. Build a single `Base.astro` layout that takes a `bg: 'paper' | 'ink'` prop. Store discipline → accent in a typed const (`src/styles/disciplines.ts`) and flow it as `style="--accent: <hex>"` on a wrapper element on category and detail pages. Three gallery template files (`GalleryA12`, `GalleryB35`, `GalleryC68`) imported by `[category].astro`. Custom 404 at `src/pages/404.astro` works zero-config on Cloudflare Pages.

## Project Constraints (from CLAUDE.md)

- **No Inter** anywhere in the stylesheet (anti-AI tell #1)
- **No shadcn defaults / components / primitives**
- **No purple gradients**
- **No lucide icons** (no `lucide-*` package in `package.json`)
- **No bento grid**
- **No "Built with X" footer**
- **No centered-hero-with-gradient + CTA**
- **Tailwind treatment:** "optional and use carefully" — D-17 chose plain CSS over Tailwind. Verified against Astro 5 patterns: scoped `<style>` blocks + global tokens.css + `define:vars` for dynamic injection are first-class and well-documented [CITED: Astro docs /en/guides/styling].
- **Astro stack:** 5.x (we are on 5.18.1; Astro 6.3.2 is current upstream — see Open Questions about whether to upgrade)
- **Hosting:** Cloudflare Pages (legacy Pages product, not Workers — `not_found_handling` config does NOT apply; auto-serves `dist/404.html` with HTTP 404)
- **Free Google variable fonts only** (Bricolage Grotesque, Fraunces, JetBrains Mono — Out of Scope rejects paid fonts)
- **GSD workflow enforcement:** Edit/Write must originate from a GSD command

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 Discipline → Accent Mapping (load-bearing).** `design = terracotta #e85d2a`, `finance = cobalt #1947ff`, `personal = electric lime #d4ff3a`, `marketing = plum #5a1a55`. Codify in single TypeScript const (`src/styles/disciplines.ts` or extend `src/content/categories.ts`); reference from every consuming surface, never hard-code.

**D-02 Category page background = ink-black for all four disciplines.** Accent appears on (a) category title's italic-Fraunces numeral, (b) back-pill chip, (c) 1–2 tile background fills. Splash + 404 + about + detail body remain on cream paper.

**D-03 Splash card decorative geometry per sketch k1–k4 mapping** (D-01 order):
- k1 Design (terracotta): outline circle top-right
- k2 Finance (cobalt): oversized italic Fraunces numeral top-right in lime
- k3 Personal (lime): horizontal dotted line through center
- k4 Marketing (plum): lime triangle top-right
Reuse inside gallery tiles for cohesion.

**D-04 Gallery uses fixed templates per piece-count bucket.** NOT per-piece `tileSize`, NOT a deterministic algorithm. The Phase 1 `order: number` field is the only per-piece input → picks slot in active template.

**D-05 Three template `.astro` files:**
- `GalleryA12.astro` (1–2 pieces): full-bleed hero (order 1) + one wide tile beneath (order 2)
- `GalleryB35.astro` (3–5 pieces): sketch's exact 5-tile composition — `p1` 3×2 hero, `p2` 3×1, three 2×1 tiles
- `GalleryC68.astro` (6–8 pieces): Bucket B + extra row of three 2×1 tiles, slightly varied rotations

**D-06 Bucket selection at build time per gallery via `pieces.length`.** 9+ → Bucket C with `console.warn` + visual truncation.

**D-07 Empty discipline drops splash card AND returns 404 on `/[category]` route.** No styled empty state.

**D-08 Real portrait blocks Phase 3.** Sketch's stylized placeholder is fallback only. Astro `<Image>` for build-time optimization. Rotated -1.2°.

**D-09 Splash bio = ~40–60 word teaser, NOT extracted from `/about` at build time.** Hand-tuned line breaks. Two strings, one source per surface.

**D-10 Roles list = 4 roles matching disciplines.** Sketch's odd/even alternation: odd in cobalt sans, even in italic terracotta Fraunces. Mapping is conceptual, not positional.

**D-11 Motion contract = sketch 001 equivalent only.** Pure CSS:
- card hover: `translateY(-2px) rotate(-0.3deg)`
- gallery tile hover: `scale(1.02) rotate(-0.3deg)`
- pill: `pulse 1.6s ease-in-out infinite`
**Zero JS deps added in Phase 3.** No `motion` package, no `gsap`.

**D-12 MOTION-01..04 stay deferred.** No View Transitions, no scroll reveals.

**D-13 `prefers-reduced-motion` wired in Phase 3** (2 lines of CSS). Phase 5 owns hardware verification.

**D-14 Custom 404 at `src/pages/404.astro`.** Cream-paper canvas. Display "404" or "NOT FOUND" in Bricolage huge. One dry caption ("This page doesn't exist. The four that do are below."). Reuses splash `DisciplineCard` component below.

**D-15 Self-host from Fontsource:**
- `@fontsource-variable/bricolage-grotesque` (5.2.10)
- `@fontsource-variable/fraunces` (5.2.9)
- `@fontsource-variable/jetbrains-mono` (5.2.8)
`<link rel="preload" as="font">` for the Bricolage display weight only. `font-display: swap` on all three. Latin-only subset.

**D-16 Variable axes shipped:**
- Bricolage: full `opsz` 12..96, `wdth` 75..100, `wght` 200..800
- Fraunces: italic-only variable
- JetBrains Mono: 400 + 600 weights only

**D-17 Plain CSS with custom properties — NOT Tailwind.** Tokens at `src/styles/tokens.css`, imported by `Base.astro`. Component styles colocate in scoped `<style>` blocks. No CSS-in-JS, no PostCSS plugins beyond Astro defaults.

**D-18 New `src/layouts/Base.astro`** — imports tokens.css, sets cream-paper bg by default, hosts topbar pill + minimal footer. Splash, about, gallery, detail, 404 all extend Base. Gallery overrides bg via `bg='ink'` prop.

### Claude's Discretion

- Anti-AI-tell verification → manual checklist `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` walked at phase exit
- Bricolage display preload list → preload only the file used by largest above-fold type-set (probably the `wdth_normal-wght_800` woff2)
- Astro `<Image>` for tile thumbnails → keep Phase 2 pattern (Image for `hero`, plain `<img>` for paginated PDF pages from `public/`)
- Detail page body inherits cream-paper from Base (not inverted ink) — readability of CRO blurbs wins over identity rhyme. Detail header carries discipline accent.
- Mobile collapse @ ≤900px ships responsive CSS but does NOT verify on real devices (Phase 5)
- Status pill copy: "OPEN TO ROLES" with pulsing lime dot. One-string change at execution time.
- Splash 4-card vs N-card flexibility: if Personal drops, splash becomes 3-card grid (`grid-template-columns` variant)

### Deferred Ideas (OUT OF SCOPE)

- Header chrome (mailto/LinkedIn/resume header link) — Phase 4
- Prev/next within discipline + "Back to [Category]" footer — PIECE-05, Phase 4
- About-page contact block — CONTACT-05, Phase 4
- Mobile/perf/a11y polish + iPhone Safari verification + reduced-motion gate verification — FOUND-01/02/03, Phase 5
- View Transitions API (splash → gallery morph) — MOTION-01, v2
- CSS scroll-driven reveals on detail — MOTION-02, v2
- Custom cursor on desktop — MOTION-03, v2
- Magnetic / hover-deflection on splash cards — MOTION-04, v2
- Outcome tagline on Finance gallery cards — CONTENT-01, v2
- "Show me everything" curated tour — CONTENT-02, v2
- OG/Twitter card metadata, robots.txt, sitemap.xml, favicon set — Phase 6
- Calendly embed, privacy-first analytics — FUTURE-01/02
- Per-piece secondary images / detail spreads beyond hero + paginated PDF — FUTURE-04, v2

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPLASH-01 | Splash above the fold @ 1280px: name + question + portrait + bio + 4 cards | §Architecture Patterns/Splash; §Code Examples/Splash hero band |
| SPLASH-02 | Each card shows category, carries accent, routes to gallery | §Architecture Patterns/Discipline accent flow; D-01 const + DisciplineCard component |
| SPLASH-03 | Four discipline gallery pages with asymmetric magazine layout | §Architecture Patterns/Gallery bucket templates; §Code Examples/GalleryB35 grid |
| SPLASH-04 | Galleries hold up 1–3 pieces; zero pieces drops the card | D-04/D-05/D-07; §Standard Stack none — pure CSS Grid |
| SPLASH-05 | On-brand 404 returns HTTP 404, links back to splash | §Architecture Patterns/Custom 404; CF Pages auto-serves dist/404.html |
| VISUAL-01 | Bricolage + Fraunces italic + JetBrains Mono; no Inter; preload + swap; self-hosted | §Standard Stack/Fontsource; §Code Examples/Font preload |
| VISUAL-02 | Cream + ink + 4 accents; each discipline accent through gallery + detail header | §Architecture Patterns/Discipline accent flow; tokens.css pattern |
| VISUAL-03 | Non-grid: rotated cards (-1° to +1°), decorative geometry | Sketch CSS lines 262–627 verbatim; §Code Examples/Card decorations |
| VISUAL-04 | Anti-AI-tell list verified at code-review and UI-review gates | §Anti-AI-Tell Verification (Phase 3 SC6) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type loading (woff2 preload + @font-face) | Frontend Server (build-time injection in `<head>`) | CDN (CF Pages serves immutable hashed assets) | Astro's static build emits the font URLs into HTML; CF Pages serves the woff2 with `Cache-Control: public, max-age=31556952, immutable` automatically for fingerprinted `_astro/` paths [CITED: developers.cloudflare.com/pages/configuration/headers]. |
| CSS tokens / design system | Frontend Server (build-time CSS bundle) | — | Pure CSS in `src/styles/tokens.css` imported by Base.astro; Astro emits a single bundled stylesheet. |
| Per-page background variant (`bg: 'paper' \| 'ink'`) | Frontend Server (Layout prop + scoped style or body class) | — | Build-time decision per page; no runtime branching. |
| Discipline accent flow (per-page CSS custom property) | Frontend Server (page wrapper sets `style="--accent: <hex>"`) | — | Build-time const lookup; emitted as inline style on the page wrapper element. |
| Gallery bucket selection | Frontend Server (build-time `pieces.length` switch in `[category].astro`) | — | Static SSG; no runtime decision. |
| Card hover / pill pulse motion | Browser (pure CSS `:hover` + `@keyframes`) | — | Zero JS; `prefers-reduced-motion` media query disables in same scoped style. |
| Custom 404 routing | CDN / Static (CF Pages auto-serves `dist/404.html` with HTTP 404 status for unknown routes) | Frontend Server (Astro build emits 404.html from `src/pages/404.astro`) | Astro emits the file; Cloudflare Pages legacy product auto-detects it and uses correct status code [CITED: developers.cloudflare.com/pages/configuration/serving-pages]. |
| Image optimization (`<Image>` for `hero`) | Frontend Server (Sharp at build time) | CDN (immutable hashed `_astro/` URLs) | Astro `<Image>` from `astro:assets` is unchanged from Phase 1+2. |
| Anti-AI-tell verification | Frontend Server (grep at build time / pre-commit) | — | Static check against `src/`, `package.json`, generated `dist/`. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | 5.18.1 (current installed) | Static site framework | Already established Phase 1+2. Native scoped `<style>`, content collections, `<Image>` from `astro:assets`. [VERIFIED: package.json + npm view] |
| `@fontsource-variable/bricolage-grotesque` | 5.2.10 | Display sans (oversized name + question bar + card titles) | Self-hosted variable woff2, MIT, generated from Google Fonts. Avoids runtime CDN dep. [VERIFIED: npm view] |
| `@fontsource-variable/fraunces` | 5.2.9 | Editorial italic accent | Italic-only axis used; perfect for the magazine-grade italic numerals + serif body in bio block. [VERIFIED: npm view] |
| `@fontsource-variable/jetbrains-mono` | 5.2.8 | Micro-labels, "→ PICK ONE", topbar pill | The mono in sketch's `--mono` token. [VERIFIED: npm view] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `modern-normalize` | 3.0.1 | CSS reset / normalize | Optional but recommended — single tiny import (~2KB), addresses cross-browser inconsistencies for buttons/forms/typography defaults. Alternative: hand-roll a minimal reset (margin, box-sizing, font inheritance). [VERIFIED: npm view] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fontsource variable packages + manual preload | Astro **experimental fonts API** (`experimental.fonts: true` + `<Font>` component from `astro:assets`) | The Astro Fonts API stabilized in Astro **6.0**. In 5.18.x it requires `experimental.fonts: true` flag. Pros: auto-subsetting per glyph usage (with `experimental.glyphs`), built-in preload prop, single source of config. Cons: still experimental on our version, would couple us to upgrade-path discipline, and the manual Fontsource pattern is ~10 lines of CSS — not enough to justify experimental flag risk on a phase whose verification gate forbids surprises. **Recommendation: stay with Fontsource direct import.** Reconsider if/when project upgrades to Astro 6. [CITED: docs/en/guides/fonts.mdx, docs/en/guides/upgrade-to/v6.mdx] |
| Plain CSS + custom properties | Tailwind 4 with custom theme | CONTEXT.md D-17 already locked plain CSS. CLAUDE.md "Tailwind treatment" warns that stock Tailwind defaults are themselves an AI tell. Plain CSS is the right call here — the design system is custom enough that Tailwind utilities provide negative value. |
| Manual `<link rel="preload">` for woff2 | `astro-font` integration | Third-party integration with overlapping responsibility for fonts that we already self-host. Not worth the dep. |
| `modern-normalize` | Hand-rolled reset block | Either is fine. Hand-roll is ~5 lines and avoids one more dep; modern-normalize handles edge cases (input reset, button background) you'd otherwise discover later. **Recommendation: hand-roll** for this project — one less dep, predictable, fits the bespoke aesthetic. |

**Installation:**
```bash
npm install @fontsource-variable/bricolage-grotesque @fontsource-variable/fraunces @fontsource-variable/jetbrains-mono
```

No motion library installs — D-11 explicitly forbids `motion` and `gsap` for Phase 3.

**Version verification:** All four packages verified against npm registry on 2026-05-14 via `npm view`. Astro 6.3.2 is the upstream current; we deliberately stay on 5.18.1 for this phase to avoid a major upgrade entangled with visual-system work (see Open Questions).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ src/content/pieces/[slug]/index.md  (frontmatter: order, hero,  │
│ category, draft, …)                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ astro:content getCollection()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/styles/disciplines.ts  (D-01 const: category → accent hex)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ build-time import
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ src/layouts/Base.astro                                           │
│   ├── <head>                                                     │
│   │   ├── tokens.css (global :root vars: --paper, --ink, ...)   │
│   │   ├── @fontsource-variable/* CSS imports                    │
│   │   └── <link rel="preload" as="font"> for Bricolage display  │
│   ├── topbar pill ("OPEN TO ROLES" + pulsing dot)                │
│   ├── <slot />  (page body)                                      │
│   └── minimal footer                                              │
│                                                                   │
│   Props: { title: string, bg?: 'paper' | 'ink' }                 │
└─────────────────────────────────────────────────────────────────┘
       │                │                  │            │
       ▼                ▼                  ▼            ▼
   index.astro    [category].astro    [slug].astro   404.astro
   (splash,         (gallery,          (detail,       (cream,
    paper)           ink)               paper)         reuses
                                                       DisciplineCard)
       │                │                  │
       ▼                ▼                  ▼
  Splash hero    GalleryA12 |        Detail header
  band:          GalleryB35 |        carries accent
  - Portrait     GalleryC68          via wrapper
  - Name+roles   (chosen by          style="--accent"
  - Bio sticker  pieces.length)
  - Question      │
  - 4 cards       │
   (DisciplineCard × 4)
```

### Recommended Project Structure

```
src/
├── content/
│   ├── categories.ts          # existing — 4-category enum
│   └── pieces/[slug]/         # existing — markdown + assets
├── styles/
│   ├── tokens.css             # NEW — :root CSS custom properties
│   └── disciplines.ts         # NEW — discipline → accent hex const
├── layouts/
│   └── Base.astro             # NEW — global chrome, font preload, slot
├── components/
│   ├── DisciplineCard.astro   # NEW — used on splash + 404
│   ├── StatusPill.astro       # NEW — topbar element with pulse
│   ├── GalleryA12.astro       # NEW — bucket A template (1–2 pieces)
│   ├── GalleryB35.astro       # NEW — bucket B template (3–5 pieces)
│   └── GalleryC68.astro       # NEW — bucket C template (6–8 pieces)
└── pages/
    ├── index.astro            # MODIFIED — splash hero band + 4 cards
    ├── about.astro            # MODIFIED — restyle on Base
    ├── 404.astro              # NEW — D-14
    ├── [category].astro       # MODIFIED — bucket switch + ink bg
    └── [category]/[slug].astro # MODIFIED — accent header, container styling
```

### Pattern 1: Layout component with `bg` prop

**What:** Single `Base.astro` layout takes `title` + `bg` prop. Default `bg='paper'` for splash/about/detail/404; gallery passes `bg='ink'`. Background applied via body class (NOT inline style — keeps the body element's class list inspectable for verification).

**When to use:** Every page extends Base. No exceptions.

**Example:**
```astro
---
// src/layouts/Base.astro
import '../styles/tokens.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/jetbrains-mono';
import bricolageDisplay from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url';
import StatusPill from '../components/StatusPill.astro';

interface Props {
  title: string;
  bg?: 'paper' | 'ink';
}
const { title, bg = 'paper' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preload" as="font" type="font/woff2" href={bricolageDisplay} crossorigin="anonymous" />
  </head>
  <body class={`bg-${bg}`}>
    <header class="topbar"><StatusPill /></header>
    <slot />
    <footer class="foot">
      <span>caleb lim — 2026</span>
    </footer>
  </body>
</html>

<style is:global>
  /* applied globally via is:global so the body class actually works */
  body.bg-paper { background: var(--paper); color: var(--ink); }
  body.bg-ink   { background: var(--ink);   color: var(--paper); }
</style>
```

[CITED: Astro docs /en/basics/layouts; Fontsource docs /getting-started/preload]

### Pattern 2: Discipline accent flow via CSS custom property

**What:** Page wrapper sets `style="--accent: <hex>"`; downstream selectors use `var(--accent)` for fills, borders, italic numerals. Allows the same template to render four discipline-tinted versions.

**When to use:** `[category].astro` (gallery), `[category]/[slug].astro` (detail header), `DisciplineCard.astro` (splash card).

**Example:**
```astro
---
// src/styles/disciplines.ts
import { CATEGORIES } from '../content/categories';

export const DISCIPLINE_ACCENT = {
  design:    '#e85d2a',  // terracotta
  finance:   '#1947ff',  // cobalt
  personal:  '#d4ff3a',  // electric lime
  marketing: '#5a1a55',  // plum
} as const satisfies Record<typeof CATEGORIES[number], string>;

export type Discipline = typeof CATEGORIES[number];
---

---
// src/pages/[category].astro (excerpt)
import { DISCIPLINE_ACCENT, type Discipline } from '../styles/disciplines';
const { category } = Astro.params as { category: Discipline };
const accent = DISCIPLINE_ACCENT[category];
---
<Base title={`${category} — Caleb Lim`} bg="ink">
  <main class="cat" style={`--accent: ${accent}`}>
    <header class="cat-head">
      <a href="/" class="cat-back">← splash</a>
      <h2>{category} <em>/{pieces.length}</em></h2>
    </header>
    {/* gallery template renders here */}
  </main>
</Base>

<style>
  .cat-head .cat-back { background: var(--paper); color: var(--ink); }
  .cat-head h2 em    { color: var(--accent); font-family: var(--serif); font-style: italic; }
</style>
```

**Inline-style + CSP note:** Cloudflare Pages does not inject CSP by default [VERIFIED: developers.cloudflare.com/pages/configuration/serving-pages — default headers list]. If a strict CSP is added later, the inline `style="--accent: ..."` attribute would need either a nonce or migration to a static class pattern (`<main class={`cat cat-${category}`}>` with `.cat-design { --accent: #e85d2a }` etc. in tokens.css). For Phase 3 the inline-style approach is fine.

### Pattern 3: Gallery bucket template selection

**What:** `[category].astro` reads `pieces.length`, dynamically renders one of three template components, passing the sorted-by-`order` pieces array.

**When to use:** Always, for `[category].astro`.

**Example:**
```astro
---
// src/pages/[category].astro
import { getCollection } from 'astro:content';
import { CATEGORIES, type Category } from '../content/categories';
import { DISCIPLINE_ACCENT } from '../styles/disciplines';
import Base from '../layouts/Base.astro';
import GalleryA12 from '../components/GalleryA12.astro';
import GalleryB35 from '../components/GalleryB35.astro';
import GalleryC68 from '../components/GalleryC68.astro';

export async function getStaticPaths() {
  const all = await getCollection('pieces', ({ data }) => data.draft !== true);
  const populated = CATEGORIES.filter((cat) =>
    all.some((p) => p.data.category === cat)
  );
  return populated.map((cat) => ({ params: { category: cat } }));
  // D-07: empty disciplines do NOT generate a route → CF Pages serves 404
}

const { category } = Astro.params as { category: Category };
const pieces = (await getCollection('pieces', ({ data }) =>
  data.category === category && data.draft !== true
)).sort((a, b) => a.data.order - b.data.order);

const accent = DISCIPLINE_ACCENT[category];
const n = pieces.length;
const Gallery = n <= 2 ? GalleryA12 : n <= 5 ? GalleryB35 : GalleryC68;
if (n > 8) console.warn(`[${category}] ${n} pieces — Bucket C truncates to 8`);
---
<Base title={`${category} — Caleb Lim`} bg="ink">
  <main class="cat" style={`--accent: ${accent}`}>
    <header class="cat-head">…</header>
    <Gallery pieces={pieces} category={category} />
  </main>
</Base>
```

[CITED: Astro docs /en/basics/astro-pages — getStaticPaths]

### Pattern 4: Custom 404 page that returns HTTP 404 on Cloudflare Pages

**What:** Create `src/pages/404.astro`. Astro emits `dist/404.html`. **Cloudflare Pages (the legacy Pages product, NOT Workers)** auto-detects the file and serves it with HTTP 404 status for any unknown route. Zero config.

**When to use:** Once, for the project.

**Example:**
```astro
---
// src/pages/404.astro
import Base from '../layouts/Base.astro';
import DisciplineCard from '../components/DisciplineCard.astro';
import { CATEGORIES } from '../content/categories';
import { DISCIPLINE_ACCENT } from '../styles/disciplines';
import { getCollection } from 'astro:content';

// Reuse the splash's empty-discipline-drop logic (D-07)
const all = await getCollection('pieces', ({ data }) => data.draft !== true);
const present = CATEGORIES.filter((c) => all.some((p) => p.data.category === c));
---
<Base title="404 — Caleb Lim" bg="paper">
  <section class="not-found">
    <h1>404</h1>
    <p class="caption">This page doesn't exist. The four that do are below.</p>
    <div class="cards">
      {present.map((cat, i) => (
        <DisciplineCard category={cat} accent={DISCIPLINE_ACCENT[cat]} k={i + 1} />
      ))}
    </div>
  </section>
</Base>
```

**Verification:** After build, run:
```bash
npx http-server dist -p 8080 &
curl -sI http://localhost:8080/does-not-exist | grep "HTTP/"
# Expect: HTTP/1.1 404 Not Found  (when http-server is configured to use 404.html)
```
On a real Cloudflare Pages preview deploy, hit any unknown URL and check `curl -sI <preview-url>/does-not-exist` returns `HTTP/2 404`. CF Pages handles this automatically when `404.html` is in the build output root [CITED: developers.cloudflare.com/pages/configuration/serving-pages — Not Found behavior].

**Wrangler `not_found_handling` note:** That config (`not_found_handling: '404-page'` in `wrangler.jsonc`) is for **Cloudflare Workers**, not legacy Cloudflare Pages. The project uses Pages → no wrangler.jsonc needed. If/when CF retires Pages and forces a Workers migration, that config would need to be added.

### Pattern 5: Self-hosted variable woff2 with preload

**What:** Import the Fontsource variable package CSS at the top of `Base.astro`; import the specific woff2 file URL with Vite's `?url` directive; emit `<link rel="preload">` in `<head>` only for the file used above the fold.

**When to use:** Once, in `Base.astro`. Don't preload more than 1–2 fonts (browser will deprioritize other critical resources).

**Example:**
```astro
---
import '@fontsource-variable/bricolage-grotesque';  // injects @font-face for variable file
import '@fontsource-variable/fraunces';
import '@fontsource-variable/jetbrains-mono';
import bricolageDisplay from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url';
---
<head>
  <link rel="preload" as="font" type="font/woff2" href={bricolageDisplay} crossorigin="anonymous" />
</head>
```

**Pitfall — exact filename:** Fontsource files live under `<package>/files/<font>-<subset>-<axis>-<style>.woff2`. The exact filename for a given package's variable axes varies per font. **Verify before locking** by listing the package's files directory:
```bash
ls node_modules/@fontsource-variable/bricolage-grotesque/files/ | head
```
For Bricolage the typical pattern is `bricolage-grotesque-latin-wght-normal.woff2` (the `wght` axis variant) and `bricolage-grotesque-latin-full-normal.woff2` (all axes). Pick the smaller `wght-normal` if only `wght` is exercised; pick `full-normal` if `opsz` and `wdth` are exercised (CONTEXT.md D-16 says they are — so use `full-normal`).

[CITED: Fontsource docs /getting-started/preload — Vite `?url` pattern]

### Pattern 6: Font-display: swap

**What:** Fontsource's variable packages set `font-display: swap` by default in their bundled `@font-face` CSS [CITED: Fontsource README + package CSS source]. **No override needed** for VISUAL-01 SC1.

**Verification:** After install, `cat node_modules/@fontsource-variable/bricolage-grotesque/index.css | grep font-display` must show `font-display: swap`.

### Pattern 7: `prefers-reduced-motion` in scoped styles (D-13)

**What:** Wrap motion-bearing CSS rules in `@media (prefers-reduced-motion: reduce)` and disable transforms / animations. Astro scoped styles handle media queries identically to plain CSS; no `:global()` gotchas.

**Example:**
```astro
<style>
  .b-card { transition: transform 0.3s ease; }
  .b-card:hover { transform: translateY(-2px) rotate(-0.3deg); }

  @media (prefers-reduced-motion: reduce) {
    .b-card,
    .b-card:hover,
    .b-piece,
    .b-piece:hover,
    .pill .dot { transition: none; transform: none; animation: none; }
  }
</style>
```

The 2-line baseline for this phase: `transition: none; transform: none; animation: none` on every interactive element under the media query. Phase 5 owns hardware verification.

### Pattern 8: Asymmetric gallery grid (Bucket B sketch)

**What:** Use CSS Grid with `repeat(6, 1fr)` columns and `grid-auto-rows: 240px`. Tiles span columns / rows via `grid-column: span N` / `grid-row: span N`.

**Example (verbatim from sketch lines 573–612):**
```astro
<div class="b-pieces">
  {pieces.map((piece, i) => (
    <a href={`/${category}/${piece.id}`} class={`b-piece p${i + 1}`}>
      <span class="tag">0{i + 1}</span>
      <span class="ttl">{piece.data.title}</span>
      <span class="role">{piece.data.role}</span>
      <span class="deco" />
    </a>
  ))}
</div>

<style>
  .b-pieces {
    margin-top: 32px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: 240px;
    gap: 12px;
  }
  .b-piece { position: relative; border-radius: 8px; overflow: hidden;
             padding: 16px 18px; display: flex; flex-direction: column;
             justify-content: space-between; transition: transform 0.25s ease; }
  .b-piece:hover { transform: scale(1.02) rotate(-0.3deg); z-index: 2; }

  .b-piece.p1 { grid-column: span 3; grid-row: span 2;
                background: var(--terracotta); color: var(--paper);
                transform: rotate(-0.6deg); }
  .b-piece.p2 { grid-column: span 3; background: var(--cobalt);
                color: var(--paper); }
  .b-piece.p3 { grid-column: span 2; background: var(--acid);
                color: var(--ink); transform: rotate(0.5deg); }
  .b-piece.p4 { grid-column: span 2; background: var(--plum); color: var(--paper); }
  .b-piece.p5 { grid-column: span 2; background: var(--teal); color: var(--paper);
                transform: rotate(-0.4deg); }
</style>
```

**Empty-slot handling:** Render only N tiles where N = `pieces.length`. The grid auto-fills the remaining cells with blank space — `:empty` cells aren't rendered because there's no element to render. This satisfies SPLASH-04's "thin gallery doesn't feel like a placeholder" — empty grid cells look intentional, empty styled tiles look broken.

**Fixed `grid-auto-rows: 240px` at narrow desktop widths:** At 1280px viewport (the spec floor) with `padding: 32px` and `gap: 12px`, each column is `(1280 - 64 - 5*12) / 6 ≈ 192px`. Hero tile (3×2) = 576×480px, plenty for the magazine effect. At 1024px the math degrades but stays readable. **Phase 3 default is safe at 1280–1920**; mobile collapse at ≤900px collapses to single column per sketch line 615+.

### Pattern 9: Discipline card decoration mapping (D-03)

**What:** Each `DisciplineCard.astro` renders a `<span class="deco" />` whose CSS varies by `k` (discipline order index 1–4) per sketch lines 495–516.

**Example:**
```astro
---
// src/components/DisciplineCard.astro
import type { Discipline } from '../styles/disciplines';

interface Props {
  category: Discipline;
  accent: string;
  k: 1 | 2 | 3 | 4;
}
const { category, accent, k } = Astro.props;
const labels: Record<Discipline, string> = {
  design: 'Graphic / Design',
  finance: 'Financial / Models',
  personal: 'Personal / Projects',
  marketing: 'Marketing',
};
---
<a href={`/${category}`} class={`b-card k${k}`} style={`--accent: ${accent}`}>
  <span class="b-card-no">0{k} / 04</span>
  <div><span class="b-card-name">{labels[category]}</span></div>
  <span class="deco" />
</a>

<style>
  /* sketch lines 456–516 verbatim */
  .b-card { position: relative; border-radius: 10px; padding: 14px 16px 16px;
            cursor: pointer; overflow: hidden; transition: transform 0.3s ease;
            display: grid; grid-template-rows: auto 1fr; gap: 4px; min-height: 0; }
  .b-card:hover { transform: translateY(-2px) rotate(-0.3deg); }

  .b-card.k1 { background: var(--terracotta); color: var(--paper); transform: rotate(-1deg); }
  .b-card.k1 .deco { right: -22px; top: -22px; width: 100px; height: 100px;
                     border: 9px solid var(--paper); border-radius: 50%; }
  .b-card.k2 { background: var(--cobalt); color: var(--paper); transform: rotate(1deg); }
  .b-card.k2 .deco { top: 18px; right: 16px; font-family: var(--serif);
                     font-style: italic; font-size: 64px; font-weight: 300;
                     color: var(--acid); line-height: 0.8; }
  .b-card.k3 { background: var(--acid); color: var(--ink); transform: rotate(-0.5deg); }
  .b-card.k3 .deco { left: 16px; right: 16px; top: 50%; height: 24px;
                     background-image: repeating-linear-gradient(90deg,
                       var(--ink) 0, var(--ink) 2px,
                       transparent 2px, transparent 10px);
                     opacity: 0.55; }
  .b-card.k4 { background: var(--plum); color: var(--paper); transform: rotate(0.7deg); }
  .b-card.k4 .deco { top: 36px; right: 18px; width: 56px; height: 56px;
                     background: var(--acid);
                     clip-path: polygon(50% 0%, 100% 100%, 0 100%); }
  .b-card .deco { position: absolute; pointer-events: none; }

  @media (prefers-reduced-motion: reduce) {
    .b-card, .b-card:hover { transition: none; transform: none; }
    .b-card.k1 { transform: none; }
    .b-card.k2 { transform: none; }
    .b-card.k3 { transform: none; }
    .b-card.k4 { transform: none; }
  }
</style>
```

**Note on the k2 deco "italic numeral":** Sketch uses a Fraunces italic numeral as text content for k2's decoration (e.g. "$"). That requires the deco to be a `<span>` containing text, not an `:before`/`::after` pseudo. Update the component pattern accordingly per category — k1 + k4 are pure shapes; k2 needs text content; k3 is a CSS background pattern.

### Anti-Patterns to Avoid

- **Inter, lucide, shadcn** anywhere in `package.json` or `src/` — VISUAL-04 hard fail. Verify with grep at phase exit.
- **Centered hero with gradient** — sketch's hero is left-aligned, asymmetric, color-blocked (no gradients). Reproduce verbatim, don't "improve."
- **Tailwind utility classes** — D-17 forbids. If a contributor reaches for `class="flex gap-4 items-center"`, that's a regression.
- **Inline portrait image as background-image with hard-coded data URL** — use `<Image>` from `astro:assets`. Build-time optimization is established Phase 1+2 pattern.
- **Reading the `/about` bio at build time for the splash teaser** — D-09 explicitly forbids; splash teaser is its own hand-tuned string in the splash component.
- **Auto-grid CMS layout** — CLAUDE.md "What NOT to Do on Framer" → "Auto-generated CMS layouts" reads as Framer-template; same energy applies to Astro. The bucket templates ARE manual placement at the gallery level.
- **`@font-face` override for `font-display`** — Fontsource ships `swap` by default; an override is duplicate and a "didn't read the docs" smell.
- **CSS-in-JS or styled-components** — Astro's scoped `<style>` is the idiomatic answer; D-17 forbids alternatives.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Self-hosting Google Fonts | Manual woff2 download + custom `@font-face` block | Fontsource variable packages | Fontsource handles unicode-range subsets, weight ranges, font-display defaults, and updates from Google upstream. Manual approach drifts. |
| Image optimization for portrait + tile heroes | `<picture>` with hand-rolled srcset + `<source>` per breakpoint | Astro `<Image>` from `astro:assets` | Sharp pipeline already established Phase 1+2; layouts auto-generate srcset. |
| Discipline → accent mapping in three different files | Hard-code hex values in the splash, gallery, detail | One TypeScript const re-exported from `src/styles/disciplines.ts` | Drift across surfaces is a brand-consistency bug. Single source of truth. |
| Grid template per gallery | Tailwind grid utilities | Plain CSS Grid in scoped `<style>` | The grid IS the spec — extracting it from sketch CSS is verbatim, not derived. |
| 404 routing for unknown URLs | Custom Astro middleware / wrangler config | `src/pages/404.astro` (Astro builds; CF Pages serves automatically with HTTP 404) | Documented zero-config path; middleware adds runtime cost the static deploy doesn't need. |
| CSS reset | Big resets (Eric Meyer, normalize.css 8.x) | 5-line hand-roll OR `modern-normalize` (3.0.1, ~2KB) | Heavy resets fight the bespoke design system. Keep the canvas blank. |

**Key insight:** The locked sketch IS the design spec. Phase 3's "do not hand-roll" mandate extends to: do not re-derive the rotations, the gap values, the decoration sizes, the grid spans, or the keyframe timings. Open the sketch, read the CSS, copy the numbers. Re-deriving is how the magazine-grade composition becomes "looks like a portfolio template."

## Anti-AI-Tell Verification (Phase 3 SC6)

The verification gate is the single most load-bearing exit criterion of the phase. Implement as a manual checklist file `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` plus automated grep checks.

### Automated checks (runnable as a shell script in `scripts/verify-anti-ai-tells.sh`)

```bash
#!/usr/bin/env bash
set -e
fail() { echo "FAIL: $1"; exit 1; }

# 1. No Inter font referenced anywhere
# Use a word-boundary regex to avoid matching "interactive", "interface", "internal"
# Limit to extensions where typography lives.
if grep -rEnI '\bInter\b' src/ astro.config.mjs --include='*.astro' --include='*.css' --include='*.ts' --include='*.js' --include='*.json'; then
  fail "Found 'Inter' reference — VISUAL-04 forbids"
fi

# 2. No lucide / shadcn / radix in dependencies
if grep -E '"(lucide-|@radix-ui/|@shadcn/|tailwindcss-animate)"' package.json; then
  fail "Found lucide / radix / shadcn / tailwindcss-animate dependency — VISUAL-04 forbids"
fi

# 3. No tailwind in deps (D-17 chose plain CSS)
if grep -E '"tailwindcss"' package.json; then
  fail "Found tailwindcss — D-17 chose plain CSS"
fi

# 4. No purple gradients
if grep -rEnI 'linear-gradient\([^)]*(purple|#[a-fA-F0-9]*[7-9a-fA-F]{2}[8-9a-fA-F]{2})' src/; then
  echo "WARN: possible purple gradient — manually verify it's intentional"
fi

# 5. No "Built with Astro" / "Built with X" footer copy
if grep -rEnI 'built with' src/; then
  fail "Found 'Built with X' copy — VISUAL-04 forbids"
fi

# 6. No bento-grid class names
if grep -rEnI 'bento' src/; then
  fail "Found 'bento' class/identifier — VISUAL-04 forbids"
fi

echo "PASS: anti-AI-tell automated checks"
```

### Manual checklist (walked at phase exit by `/gsd-ui-review` and `/gsd-code-review`)

```markdown
# .planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md

## Visual sweep (per VISUAL-04 + ROADMAP SC6)

- [ ] Splash hero is asymmetric, NOT centered with gradient
- [ ] No shadcn-style cards (rounded-2xl + shadow-md + slate-*) anywhere
- [ ] No Inter visible in DevTools "Computed" font-family on any page
- [ ] No purple gradients (radial or linear) anywhere
- [ ] No lucide icons used (icons should be SVGs hand-drawn or absent)
- [ ] No bento-grid composition (uniform rounded cards in a uniform grid)
- [ ] No "Built with Astro" / "Built with X" footer
- [ ] Hero photo is real (not the dashed-circle placeholder) — D-08 blocker
- [ ] Card rotations are present and within -1° to +1° per sketch
- [ ] Each discipline gallery shows accent on (a) numeral, (b) back-pill, (c) ≥1 tile fill
- [ ] All four discipline cards' decorative geometry matches sketch k1–k4
- [ ] Status pill pulses (or is disabled under prefers-reduced-motion)
- [ ] Bricolage + Fraunces italic + JetBrains Mono visible in DevTools "Computed" on at least one element each
- [ ] 404 returns HTTP 404 (`curl -sI` against preview)
- [ ] Empty-discipline drop works (delete a category's pieces, rebuild, confirm splash drops card AND `/[category]` 404s)

## Automated checks
- [ ] `bash scripts/verify-anti-ai-tells.sh` passes
- [ ] `npm run build` succeeds with no warnings about missing fonts
- [ ] `npm run preview` serves all pages without console errors
```

**Best-practice automation vs. manual sign-off:** For a single-developer project, the right balance is automated checks for unambiguous misses (Inter, lucide, "Built with X") and manual sweep for taste judgments (gradient feel, card rhythm, magazine grade). Both gates run at phase exit; the manual sweep is the final word.

## Common Pitfalls

### Pitfall 1: Fontsource file path drift across versions

**What goes wrong:** Hard-coding `@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url` works today; minor version updates can rename axis files (e.g. switching from `wght-normal` to `full-normal` when more axes are added).

**Why it happens:** Fontsource regenerates files when Google adds new axes upstream.

**How to avoid:** After install, verify the file exists:
```bash
ls node_modules/@fontsource-variable/bricolage-grotesque/files/ | grep latin | head
```
Pin the version in `package.json` (avoid `^` for the variable packages if drift bites).

**Warning signs:** 404 on the preload `<link>` href; CLS on first render because the preload silently failed.

### Pitfall 2: Astro `<Image>` with `public/` paths still requires width + height

**What goes wrong:** Phase 2's `[category]/[slug].astro` Pitfall 1 note said `<Image>` cannot resolve `public/` paths. **Astro 5 docs now say it CAN** — but you must supply `width` and `height` props because Astro can't infer dimensions from a string URL [CITED: docs/en/reference/modules/astro-assets.mdx — "Image Component with Public Folder src"]. The plain `<img>` pattern in `[category]/[slug].astro` (which reads dimensions from `.cache.json`) is still cleaner for the paginated PDF case.

**Why it happens:** API surface evolved between Phase 2 research date and now.

**How to avoid:** Phase 3 should NOT change the paginated `<img>` block (Phase 2 D-04 + Pitfall 1 contract). Gallery tile thumbnails for image-source pieces use `<Image src={piece.data.hero} alt={...} />` (dimensions inferred). Gallery tile thumbnails for PDF-source pieces could use either pattern; **recommend plain `<img>` reading from `.cache.json`** to mirror the detail page and avoid mixing patterns.

**Warning signs:** Build error "missing required width/height prop" or runtime 404 on `/generated/pdf-thumbs/...`.

### Pitfall 3: Body class doesn't override `body { background }` from tokens.css

**What goes wrong:** If `tokens.css` sets `body { background: var(--paper) }` globally, the `body.bg-ink` class needs `is:global` scoping to win the cascade.

**Why it happens:** Astro scopes `<style>` blocks by default; component-scoped `body.bg-ink { ... }` becomes `body.bg-ink.astro-XYZ` which doesn't match the body element.

**How to avoid:** Either (a) use `<style is:global>` for the body bg overrides in `Base.astro` (shown in Pattern 1), or (b) define the bg overrides in `tokens.css` itself (which IS global by default since it's imported as a plain CSS file).

**Warning signs:** Gallery page shows cream background instead of ink.

### Pitfall 4: Preloading too many fonts blocks first paint

**What goes wrong:** Preloading all three fonts means the browser fetches three woff2 files before continuing to render — the opposite of the intended optimization.

**Why it happens:** "If preloading one is good, three is better" intuition.

**How to avoid:** Preload **only** the Bricolage variable file used for the giant name above the fold. Fraunces and JetBrains Mono load via `font-display: swap` and substitute with system fallbacks during the first paint.

**Warning signs:** Lighthouse "preload key requests" warning; FCP regressed vs. preloading nothing.

### Pitfall 5: `define:vars` vs static `style="--accent: ..."` on the page wrapper

**What goes wrong:** Using `<style define:vars={{accent}}>` from frontmatter scopes the variable to the component's CSS, but Astro emits the variable as `--accent-XYZ` (hashed) — child components reading `var(--accent)` won't pick it up.

**Why it happens:** `define:vars` adds component scope hash to variable names.

**How to avoid:** Use plain `style="--accent: ${accent}"` attribute on the wrapper element, NOT `define:vars`. CSS custom properties cascade, so any descendant `var(--accent)` reads it. [CITED: Astro docs /en/guides/styling — define:vars caveat is implicit; the inline-style pattern is the canonical accent-flow approach].

**Warning signs:** Gallery accent renders as the fallback color (or no color) on tiles even though the wrapper has the right `--accent` value.

### Pitfall 6: Cloudflare Pages 404 verification needs a real preview deploy

**What goes wrong:** Local `astro preview` returns the 404 page with HTTP 200 (Astro's preview server doesn't simulate Pages' 404-status behavior).

**Why it happens:** `astro preview` is a dev convenience; CF Pages handles 404 status server-side.

**How to avoid:** Verify on a CF Pages preview URL:
```bash
curl -sI https://<preview-hash>.<project>.pages.dev/this-route-does-not-exist | head -1
# Expect: HTTP/2 404
```
Or use Wrangler's local Pages emulator: `npx wrangler pages dev dist`.

**Warning signs:** Treating local 200 response as proof — production will silently regress to 200 if the file isn't at `dist/404.html`.

### Pitfall 7: `font-variation-settings` doesn't cascade like normal CSS properties

**What goes wrong:** Setting `font-variation-settings: "wdth" 100, "opsz" 96` on the splash `h1`, then expecting child `<span>` elements to inherit the same axis values + add their own.

**Why it happens:** `font-variation-settings` is a single shorthand-style property; setting it on a child completely replaces the parent's value, not merges.

**How to avoid:** Either (a) re-state the full axis list on each element that needs different values, or (b) use the higher-level `font-stretch`, `font-optical-sizing` properties where supported (cleaner inheritance).

**Warning signs:** Card titles render at default `opsz` even though parent `<h1>` has `opsz: 96`.

### Pitfall 8: Detail page accent breaks if route param doesn't match a known discipline

**What goes wrong:** `DISCIPLINE_ACCENT[category]` returns `undefined` if `category` is anything outside the 4-enum. Then `style="--accent: undefined"` produces invalid CSS (which the browser silently ignores → no accent renders).

**Why it happens:** TypeScript types don't enforce runtime correctness on route params.

**How to avoid:** Defensive lookup:
```ts
const accent = DISCIPLINE_ACCENT[category] ?? '#000000';
```
Or trust `getStaticPaths` to never produce an invalid `category` (which is true given `CATEGORIES.filter(...)`). Document the invariant.

**Warning signs:** Gallery / detail pages render correctly in dev but lose accent in production after a route param typo.

## Code Examples

### tokens.css (full)

```css
/* src/styles/tokens.css — global, imported by Base.astro */
:root {
  /* color */
  --paper:      #f4ebd9;
  --ink:        #0a0a0a;
  --terracotta: #e85d2a;
  --cobalt:     #1947ff;
  --acid:       #d4ff3a;  /* electric lime */
  --plum:       #5a1a55;
  --teal:       #0d5e5a;  /* sketch uses this for one tile in Bucket B (p5) */

  /* typography */
  --sans:  "Bricolage Grotesque Variable", -apple-system, system-ui, sans-serif;
  --serif: "Fraunces Variable", Georgia, serif;
  --mono:  "JetBrains Mono Variable", ui-monospace, "SF Mono", monospace;
}

/* hand-rolled minimal reset (D-17 plain CSS, no modern-normalize) */
*, *::before, *::after { box-sizing: border-box; }
body, h1, h2, h3, h4, p, ul, ol, figure { margin: 0; padding: 0; }
ul, ol { list-style: none; }
a { color: inherit; text-decoration: none; }
img, picture, svg { display: block; max-width: 100%; }
button { font: inherit; background: none; border: 0; cursor: pointer; padding: 0; }

html, body { min-height: 100vh; font-family: var(--sans); }
body.bg-paper { background: var(--paper); color: var(--ink); }
body.bg-ink   { background: var(--ink);   color: var(--paper); }

/* respect reduced-motion globally as a baseline (per-component overrides allowed) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Note on font family names:** Fontsource variable packages register the font under `"<Family Name> Variable"` (e.g. `"Bricolage Grotesque Variable"`). Verify after install:
```bash
grep -h font-family node_modules/@fontsource-variable/bricolage-grotesque/index.css | head -2
```

### Splash hero band (verbatim from sketch lines 311–419)

See sketch `.b-hero`, `.b-portrait`, `.b-name`, `.b-bio`, `.b-question`, `.b-cards` blocks. **Extract verbatim into scoped styles in `src/pages/index.astro`** — do not re-derive numbers.

### Status pill with pulse keyframe (sketch lines 297–305)

```astro
---
// src/components/StatusPill.astro
---
<span class="pill"><span class="dot" /> open to roles</span>

<style>
  .pill {
    background: var(--ink); color: var(--paper);
    padding: 6px 14px; border-radius: 999px;
    font-family: var(--mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    display: inline-flex; align-items: center;
  }
  .dot {
    display: inline-block; width: 7px; height: 7px;
    border-radius: 50%; background: var(--acid);
    margin-right: 8px;
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
```

[CITED: sketch index.html lines 297–305]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, `motion/react` import | Renamed early 2025; `framer-motion` deprecated | Phase 3 doesn't use either, but if/when MOTION-01 lands in v2, use `motion` |
| `@studio-freight/lenis`, `@studio-freight/react-lenis` | `lenis` package, `lenis/react` import | Studio Freight → Darkroom Engineering rebrand 2024 | Phase 3 doesn't use either; same v2 note |
| Astro `experimental.fonts: true` config flag | Native `fonts` config (no flag) + `<Font>` from `astro:assets` | Astro 6.0 stabilized | We're on 5.18.x — still need flag if we wanted to use it. Phase 3 chooses Fontsource direct import instead (see Open Questions). |
| Astro `<Image>` only takes imported assets | Astro `<Image>` accepts `public/` paths with required `width`/`height` | Astro 5.x | Updates the Phase 2 Pitfall 1 note — gallery tiles for PDF-source pieces could use `<Image>` with explicit dims, but recommend staying with plain `<img>` for parity with detail page. |
| Tailwind 3 utility-first | Tailwind 4 CSS-first config | Tailwind 4 (2024) | N/A — D-17 chose plain CSS, no Tailwind in this project |
| Cloudflare Pages dashboard project | Cloudflare Workers (with `assets` config + `not_found_handling`) | CF Pages → Workers migration in progress (no forced cutover yet) | Phase 3 ships against legacy Pages product → 404.html auto-detection is fine. If CF retires Pages later, deploy phase (Phase 6) adds wrangler.jsonc. |

**Deprecated/outdated:**
- `@fontsource/bricolage-grotesque/variable.css` import pattern (pre-v5 Fontsource) — replaced by `@fontsource-variable/bricolage-grotesque` package per Fontsource v5 migration. `[VERIFIED: Fontsource migrate-v5 docs]`
- Phase 2 `[category]/[slug].astro` Pitfall 1 note ("`<Image>` cannot resolve `public/` paths") — Astro 5 docs explicitly support this with required `width`/`height`. The Pitfall 1 advice (use plain `<img>` for paginated PDF pages) is still correct because `.cache.json` provides dimensions; the underlying claim about `<Image>` capability is outdated.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | ✓ | (Phase 1+2 confirmed) | — |
| npm | Package install | ✓ | (Phase 1+2 confirmed) | — |
| `astro` | Existing | ✓ | 5.18.1 | — |
| `pdfjs-dist` + `sharp` | Phase 2 carry-forward | ✓ | 5.7.284 / 0.34.5 | — |
| `@fontsource-variable/bricolage-grotesque` | VISUAL-01 | ✗ | (5.2.10 needed) | None — must install |
| `@fontsource-variable/fraunces` | VISUAL-01 | ✗ | (5.2.9 needed) | None — must install |
| `@fontsource-variable/jetbrains-mono` | VISUAL-01 | ✗ | (5.2.8 needed) | None — must install |
| Real portrait image (jpg/webp) | D-08 splash hero | ✗ | (Caleb supplies during execution) | **Phase 3 blocker** — sketch's stylized placeholder is fallback only; D-08 explicitly says ship-blocker, not Phase 4 carry-over |
| Cloudflare Pages preview deploy | 404 status verification | ✓ | (Phase 1+2 confirmed available; Phase 6 owns prod) | Use `npx wrangler pages dev dist` locally as alternative |

**Missing dependencies with no fallback:**
- The three Fontsource packages (install in Wave 0 / first plan)
- The real portrait image (Caleb-supplied; planner adds an explicit blocker check at execution time per D-08)

**Missing dependencies with fallback:**
- CF Pages preview is preferred for 404 verification but `wrangler pages dev` covers the same ground locally if needed

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — project has no test framework installed (Phase 1+2 used `bash scripts/verify-build.sh` smoke checks) |
| Config file | `scripts/verify-build.sh` (Phase 1+2 pattern) |
| Quick run command | `npm run test:smoke` |
| Full suite command | `npm run build && npm run test:smoke && bash scripts/verify-anti-ai-tells.sh` |

The project deliberately ships without a JS test framework — content-site, no business logic to unit-test. Verification is via grep-based smoke checks + manual UI sweep. Phase 3 extends this pattern (does NOT introduce vitest/jest/playwright).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPLASH-01 | Splash above fold @ 1280px shows portrait + name + roles + bio + question + 4 cards | manual UI sweep (1280px viewport check) | `npm run preview` + manual | ❌ Wave 0 (no automated viewport tester; manual is the right bar for a single-recruiter portfolio) |
| SPLASH-02 | Each card shows category, accent, routes correctly | smoke (grep build output for 4 hrefs + accents) | `bash scripts/verify-build.sh` (extend) | ❌ Wave 0 |
| SPLASH-03 | Galleries render asymmetric grid | smoke (build succeeds + grep dist/<cat>/index.html for `b-pieces`) | extend smoke script | ❌ Wave 0 |
| SPLASH-04 | Empty discipline drops card AND 404s its route | smoke (mark a category's pieces draft, rebuild, verify dist/<cat>/index.html absent + splash card count) | extend smoke script | ❌ Wave 0 |
| SPLASH-05 | 404 page returns HTTP 404 on CF Pages | manual curl on preview URL | `curl -sI <preview>/x` | ❌ Wave 0 (manual at deploy) |
| VISUAL-01 | Bricolage + Fraunces + JetBrains; no Inter; preload + swap | grep + DevTools | `bash scripts/verify-anti-ai-tells.sh` | ❌ Wave 0 |
| VISUAL-02 | Color tokens + accent flow | grep dist for hex values | extend smoke script | ❌ Wave 0 |
| VISUAL-03 | Rotated cards + decorative geometry | manual UI sweep | manual | ❌ Wave 0 |
| VISUAL-04 | Anti-AI-tell list verified | grep + manual | `bash scripts/verify-anti-ai-tells.sh` + ANTI-AI-CHECKLIST.md walk | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` (catches Astro build errors, missing imports)
- **Per wave merge:** `npm run build && npm run test:smoke && bash scripts/verify-anti-ai-tells.sh`
- **Phase gate:** All of the above + manual UI sweep on `npm run preview` at 1280px desktop AND ≤900px mobile + manual ANTI-AI-CHECKLIST walk

### Wave 0 Gaps

- [ ] `scripts/verify-anti-ai-tells.sh` — new file, automates VISUAL-04 grep checks
- [ ] `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` — new file, manual sweep checklist
- [ ] Extend `scripts/verify-build.sh` with assertions: dist/index.html mentions Bricolage; dist/<each-populated-category>/index.html exists; dist/404.html exists; populated category count == splash card count
- [ ] No JS test framework install — explicit non-task

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudflare Pages auto-serves `dist/404.html` with HTTP 404 status for unknown routes (zero config) on the legacy Pages product | Pattern 4, §State of the Art | Custom 404 returns 200 instead of 404 → SPLASH-05 fails at verification gate. Mitigation: confirmed in [CITED: developers.cloudflare.com/pages/llms-full.txt — Serving Pages > Not Found behavior]; verify with curl on first preview deploy. |
| A2 | Fontsource variable packages set `font-display: swap` by default in their bundled CSS | Pattern 6 | If wrong, FOUC pattern returns. Easy to verify post-install (`grep font-display node_modules/@fontsource-variable/<pkg>/index.css`). Mitigation: if the grep doesn't find swap, override with a custom `@font-face` block in tokens.css. |
| A3 | The exact Bricolage variable woff2 filename is `bricolage-grotesque-latin-full-normal.woff2` for the all-axes variant | Pattern 5 | Wrong filename → preload 404 → no perf benefit + console noise. Mitigation: `ls node_modules/@fontsource-variable/bricolage-grotesque/files/` after install and pick the actual filename. |
| A4 | Astro's `<style is:global>` inside Base.astro can target `body.bg-paper` / `body.bg-ink` reliably | Pattern 1, Pitfall 3 | Body bg doesn't switch → all pages render on the same canvas. Mitigation: validated pattern in Astro docs; if it fails, move bg-* declarations to tokens.css (which is already global). |
| A5 | Inline `style="--accent: ${hex}"` on a wrapper element cascades correctly to all descendant `var(--accent)` reads in scoped child component styles | Pattern 2, Pitfall 5 | Accent flow breaks → discipline pages all look the same. Mitigation: standard CSS custom-property cascade; verified pattern across many Astro projects. |
| A6 | The splash teaser bio (40–60 words) physically fits above the fold @ 1280px alongside portrait + name + roles + question + 4 cards | D-09 / SPLASH-01 | Cards push below fold → SPLASH-01 fails. Mitigation: D-09 says shorten further if needed; designer iterates at execution time on the 1280px viewport. |
| A7 | Phase 3 tasks adding `@fontsource-variable/*` to deps + plain CSS files do NOT break Phase 2's prebuild pipeline (`scripts/pdf-preprocess.mjs` runs unaffected) | Standard Stack §Installation | Build regression in Phase 2 functionality. Mitigation: prebuild is independent of Astro's bundle pipeline; risk is low but verify with full `npm run build` after install. |

**If user pushes back on any of these:** A1, A2, A3 are easy to verify in the first execution wave (curl, grep, ls). A4-A7 are validated by build success.

## Open Questions

1. **Should we upgrade to Astro 6 to use the stable `<Font>` API?**
   - What we know: Astro 6.3.2 is upstream current; we're on 5.18.1. Astro 6 stabilized `experimental.fonts` → `fonts` config + `<Font>` component. Other Astro 6 changes include CSP stable, Cloudflare adapter v13 (new wrangler entry), content collections require explicit `loader` (we already have it).
   - What's unclear: Whether the Phase 2 prebuild pipeline (`pdfjs-dist@5.7.284`, `sharp@0.34.5`) survives an Astro 6 upgrade unmodified.
   - Recommendation: **Stay on 5.18.1 for Phase 3.** Coupling a major-version upgrade to a visual-design phase risks introducing build regressions during the most subjective verification gate of the project. Use Fontsource direct import (10 lines of code). Defer Astro 6 upgrade to a future maintenance window after launch.

2. **Should we install `modern-normalize` or hand-roll the reset?**
   - What we know: `modern-normalize@3.0.1`, ~2KB, addresses cross-browser button/input/typography defaults. Hand-roll is ~5 lines of CSS.
   - What's unclear: Whether the bespoke design system needs the full normalize suite (it has no forms, no buttons in the OS-default sense, no native UI elements outside the topbar pill).
   - Recommendation: **Hand-roll.** One less dep; fits the bespoke aesthetic; matches D-17's "plain CSS" spirit. The example reset block in tokens.css above is sufficient.

3. **Should the discipline → accent mapping live in `src/styles/disciplines.ts` (new file) or extend `src/content/categories.ts` (existing)?**
   - What we know: Either works. `categories.ts` is already imported by schema and routing; adding accent there couples color to the content domain. A separate `disciplines.ts` (or `theme.ts`) reads more like "design tokens."
   - What's unclear: Caleb's preference; D-01 leaves this as planner choice.
   - Recommendation: **New `src/styles/disciplines.ts`** — keeps `categories.ts` purely about the content enum and gives a sensible home for any future per-discipline visual config (icon, gradient, sort order). Re-export the discipline type from there.

4. **For the k2 discipline card decoration ("oversized italic Fraunces numeral top-right in lime"), what's the actual character/glyph?**
   - What we know: Sketch uses the `$` glyph styled as "$" — Finance card decoration. The k2 deco needs to be a `<span>` with text content (Pattern 9 note).
   - What's unclear: Whether the production build keeps `$` (literal) or uses something more abstract like `02` (the card number in italic Fraunces).
   - Recommendation: Planner ships the literal sketch glyph (`$`); easy to swap during execution if Caleb prefers the numeric variant.

5. **Should the splash card on 404 page reuse the exact same component (with same hover behavior + decoration) or a "lite" variant without hover?**
   - What we know: D-14 says "reuses the splash's `DisciplineCard` component — single source of truth." That implies same hover.
   - What's unclear: Whether 404 should suppress the rotation transform under hover for visual restraint.
   - Recommendation: Identical reuse — single source of truth wins; the cards function the same way (clickable navigation back to a populated discipline).

## Sources

### Primary (HIGH confidence)
- Context7 `/withastro/docs` — fonts, layouts, scoped styles, 404, Cloudflare Pages, Image with public folder, prefers-reduced-motion, define:vars, is:global, font provider reference, upgrade-to-v6
- Context7 `/fontsource/fontsource` — variable packages, preload pattern with Vite `?url`, migrate-v5
- Context7 `/websites/developers_cloudflare_pages` — Not Found behavior, default headers, _headers file, 404.html auto-detection, conditional cache headers
- `npm view @fontsource-variable/bricolage-grotesque|fraunces|jetbrains-mono version` (5.2.10, 5.2.9, 5.2.8 verified 2026-05-14)
- `npm view astro version` (6.3.2 upstream; we're on 5.18.1)
- `.planning/sketches/001-direction-comparison/index.html` lines 262–627 — the locked design spec; numbers extracted verbatim
- `.planning/phases/03-visual-design-system/03-CONTEXT.md` — D-01 through D-18 locked decisions

### Secondary (MEDIUM confidence)
- Astro upgrade-to-v6 docs imply `fonts` was experimental in 5.x — exact 5.x version that introduced `experimental.fonts` not pinned (likely 5.7+); stayed flagged through 5.18.x

### Tertiary (LOW confidence)
- Cloudflare Pages → Workers migration timeline — CF has signaled migration path but no forced cutover for legacy Pages projects yet

## Metadata

**Confidence breakdown:**
- Standard stack (Fontsource versions, Astro 5.18 capabilities): HIGH — verified via npm registry + Context7 docs
- Architecture patterns (Layout, accent flow, gallery buckets, 404): HIGH — direct from Astro docs + sketch CSS verbatim
- Pitfalls: HIGH — derived from Astro docs caveats + Fontsource version-drift behavior + standard CSS gotchas
- Cloudflare 404 status auto-serving: HIGH — explicit in CF Pages docs ("Pages will search for the closest 404.html file in the directory tree")
- Anti-AI-tell verification mechanism: HIGH — manual checklist + automated grep is well-trodden pattern; this project's discretion

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (30 days — Astro & Fontsource are reasonably stable; CF Pages → Workers migration could change the 404 story but no signal of imminent change)
