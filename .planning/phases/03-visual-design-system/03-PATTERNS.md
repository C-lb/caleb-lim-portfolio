# Phase 3: Visual Design System - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 12 (5 NEW components, 1 NEW layout, 1 NEW tokens.css, 1 NEW const, 1 NEW 404 page, 3 MODIFIED pages)
**Analogs found:** 12 / 12 — every NEW file has a closest existing analog in `src/` (Phase 1+2 work) or in the locked sketch CSS (`.planning/sketches/001-direction-comparison/index.html` lines 262–627). The sketch CSS is the **verbatim spec** for the visual layer — not a pattern reference, the spec itself.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/styles/tokens.css` | config (design tokens) | build-time CSS bundle | sketch `.variant-b` `:root` (lines 262–278) | exact (verbatim extraction) |
| `src/styles/disciplines.ts` | config (typed const) | build-time import | `src/content/categories.ts` (4-cat enum) | exact (sibling const pattern) |
| `src/layouts/Base.astro` | layout (global chrome) | request-response (SSG) | sketch `.b-splash` shell (lines 283–308, 518–530) + RESEARCH.md Pattern 1 | role-match (no existing layout in repo) |
| `src/components/StatusPill.astro` | component (decorative) | static composition | sketch `.b-topbar .pill` (lines 297–305) | exact (verbatim extraction) |
| `src/components/DisciplineCard.astro` | component (link card) | static composition | sketch `.b-card` + `.k1`/`.k2`/`.k3`/`.k4` (lines 456–516) | exact (verbatim extraction) |
| `src/components/GalleryA12.astro` | component (template) | static composition | sketch `.b-pieces` reduced to p1+p2 (lines 573–606) | role-match (subset of B) |
| `src/components/GalleryB35.astro` | component (template) | static composition | sketch `.b-pieces` 5-tile (lines 573–612) | exact (verbatim extraction) |
| `src/components/GalleryC68.astro` | component (template) | static composition | sketch `.b-pieces` 5-tile + 3 extra (lines 573–612 + extension) | role-match (B + row) |
| `src/pages/index.astro` (MODIFIED) | page (splash) | static composition | sketch `.b-splash` (lines 283–530) + current `src/pages/index.astro` | exact (full replace) |
| `src/pages/[category].astro` (MODIFIED) | page (gallery) | static composition (build-time) | current `src/pages/[category].astro` (getCollection + filter pattern) + sketch `.b-category` (lines 533–612) | exact (extend) |
| `src/pages/[category]/[slug].astro` (MODIFIED) | page (detail) | static composition (build-time) | current `src/pages/[category]/[slug].astro` (preserves Phase 2 D-04 paginated block) | exact (re-skin, preserve hot path) |
| `src/pages/about.astro` (MODIFIED) | page (static) | static composition | current `src/pages/about.astro` | exact (re-skin) |
| `src/pages/404.astro` (NEW) | page (404) | static composition (SSG) + CDN | sketch typography conventions + reuses `DisciplineCard` | role-match |

---

## Pattern Assignments

### `src/styles/tokens.css` (config, build-time bundle)

**Analog:** `.planning/sketches/001-direction-comparison/index.html` lines 262–278 (the `.variant-b` `:root` declarations)

**What to copy:** Extract every color and family hex/string verbatim. Wrap in `:root { ... }` instead of a `.variant-b` class wrapper. Add the font-size scale block from UI-SPEC.md ("Tokens (in tokens.css)" section).

**Sketch source — color + family tokens** (sketch lines 263–273, copy values verbatim):
```css
:root {
  --paper:      #f4ebd9;  /* warm cream */
  --ink:        #0a0a0a;
  --acid:       #d4ff3a;  /* electric lime */
  --cobalt:     #1947ff;
  --terracotta: #e85d2a;
  --plum:       #5a1a55;
  --teal:       #0d5e5a;
  --sans:  "Bricolage Grotesque Variable", -apple-system, system-ui, sans-serif;
  --serif: "Fraunces Variable", Georgia, serif;
  --mono:  "JetBrains Mono Variable", ui-monospace, monospace;
}
```

**Note:** Variable face names are `Bricolage Grotesque Variable` / `Fraunces Variable` / `JetBrains Mono Variable` — Fontsource appends `Variable` to the family name. The sketch uses non-variable face names; tokens.css MUST use the variable names.

**Font-size token block:** Copy verbatim from UI-SPEC.md lines 160–183 (the `:root { --fs-display: clamp(...); ... }` block — all 11 sizes + line-height tokens).

**Spacing scale block** — copy from UI-SPEC.md "Token scale" table (lines 67–78):
```css
:root {
  --sp-1:  4px;
  --sp-2:  8px;
  --sp-4:  16px;
  --sp-5:  24px;
  --sp-6:  32px;
  --sp-8:  48px;
  --sp-10: 64px;
}
```

**Reduced-motion block** — copy verbatim from UI-SPEC.md lines 511–520:
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

**Anti-pattern guard:** No `--slate-*`, `--neutral-*`, no purple. No `--radius-2xl` (anti-AI). The token list above is exhaustive — additions need a verification_override entry.

---

### `src/styles/disciplines.ts` (config, build-time const)

**Analog:** `src/content/categories.ts` (lines 1–2)

**Existing pattern** (sibling const + exported type):
```typescript
// src/content/categories.ts
export const CATEGORIES = ['design', 'finance', 'personal', 'marketing'] as const;
export type Category = typeof CATEGORIES[number];
```

**Copy this pattern.** New file is structurally identical — a typed const + the `Record<Category, string>` mapping.

**Required shape:**
```typescript
import type { Category } from '../content/categories';

export const DISCIPLINE_ACCENT: Record<Category, string> = {
  design:    '#e85d2a',  // terracotta — k1
  finance:   '#1947ff',  // cobalt    — k2
  personal:  '#d4ff3a',  // electric lime — k3
  marketing: '#5a1a55',  // plum      — k4
} as const;

// k-index mapping for DisciplineCard component (decorative geometry per D-03)
export const DISCIPLINE_K: Record<Category, 1 | 2 | 3 | 4> = {
  design:    1,
  finance:   2,
  personal:  3,
  marketing: 4,
} as const;
```

**Why this analog:** `categories.ts` is the existing single-source-of-truth pattern for cross-cutting category data. CONTEXT.md D-01 explicitly says either extend `categories.ts` OR introduce sibling file. UI-SPEC.md "Architecture additions" picks the sibling. Importing `Category` from `categories.ts` (not redeclaring) preserves single-source-of-truth.

**Anti-pattern guard:** NEVER hard-code these hexes elsewhere — always import.

---

### `src/layouts/Base.astro` (layout, NEW — no existing Astro layout in repo)

**Analogs:**
1. Existing page chrome from `src/pages/index.astro` lines 4–11 (the `<!doctype>` + `<head>` + meta + title + body shell — duplicated across all current pages)
2. RESEARCH.md "Pattern 1: Layout component with `bg` prop" (lines 254–297) — full reference scaffold
3. Sketch `.b-topbar` (lines 292–308) + `.b-foot` (lines 518–530) for the chrome contents

**Existing chrome shape to consolidate** (from `src/pages/index.astro` lines 4–11, repeated in 3 other pages):
```astro
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>...</title>
  </head>
  <body>
    ...
  </body>
</html>
```

**Required props pattern** (Astro 5 idiom — copy from RESEARCH.md Pattern 1):
```astro
---
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
```

**Sketch chrome to embed in body** — copy verbatim:

*Topbar* (sketch lines 292–305):
```html
<header class="b-topbar">
  <span class="brand">caleb lim</span>
  <StatusPill />
  <nav><!-- Phase 4 fills with mailto/LinkedIn/Resume --></nav>
</header>
```

*Footer* (sketch lines 518–530):
```html
<footer class="b-foot">
  <span class="left">caleb lim — 2026</span>
  <span class="center">available for full-time roles, brand+analyst+design</span>
  <span class="right">singapore · global</span>
</footer>
```

**Body-bg switching contract** (RESEARCH.md Pattern 1 lines 283–296):
```astro
<body class={`bg-${bg}`}>
  <slot />
</body>

<style is:global>
  body.bg-paper { background: var(--paper); color: var(--ink); }
  body.bg-ink   { background: var(--ink);   color: var(--paper); }
</style>
```

**Anti-pattern guard:** `<style is:global>` is required for body class selectors to win (scoped Astro styles add hashes that won't match `bg-paper`). Do NOT inline body bg via `style="..."` — keeps the class inspectable for verification scripts.

---

### `src/components/StatusPill.astro` (component, static)

**Analog:** sketch `.b-topbar .pill` (lines 297–305) — verbatim extraction

**Verbatim CSS to extract** (sketch lines 297–305):
```css
.pill {
  background: var(--ink); color: var(--paper);
  padding: 6px 14px; border-radius: 999px;
  font-family: var(--mono);
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
}
.pill .dot {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; background: var(--acid);
  margin-right: 8px; vertical-align: 1px;
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
```

**Required markup:**
```astro
<span class="pill">
  <span class="dot" aria-hidden="true"></span>OPEN TO ROLES
</span>
```

**a11y note (UI-SPEC.md "Visual States" + Accessibility Contract):** Dot is `aria-hidden="true"`. Pill text is the SR-readable content. Reduced-motion disables the pulse animation (covered by global block in tokens.css).

**Copy source:** `OPEN TO ROLES` per CONTEXT.md "Status pill copy" — one-string change at execute-time.

---

### `src/components/DisciplineCard.astro` (component, link card)

**Analog:** sketch `.b-card` + `.k1`/`.k2`/`.k3`/`.k4` variants (lines 456–516) — verbatim extraction

**Props shape** (from UI-SPEC.md "Component Inventory" line 570):
```typescript
interface Props {
  category: Category;       // from '../content/categories'
  accent: string;           // hex from DISCIPLINE_ACCENT
  k: 1 | 2 | 3 | 4;         // from DISCIPLINE_K — selects deco variant
  index: 1 | 2 | 3 | 4;     // 1-of-4 for `0N / 04` label
}
```

**Required markup pattern:**
```astro
<a href={`/${category}`} class={`b-card k${k}`}>
  <span class="b-card-no">0{index} / 04</span>
  <div>
    <span class="b-card-name">{cardLabel}</span>
  </div>
  <span class="deco" aria-hidden="true"></span>
</a>
```

**Card-name label source** (UI-SPEC.md Copywriting Contract lines 287):
- k1: `Graphic / Design`
- k2: `Financial / Models`
- k3: `Personal / Projects`
- k4: `Marketing`

**Verbatim CSS for base + variants** (sketch lines 456–516):
```css
.b-card {
  position: relative;
  border-radius: 10px;
  padding: 14px 16px 16px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s ease;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 4px;
  min-height: 0;
}
.b-card:hover { transform: translateY(-2px) rotate(-0.3deg); }

.b-card.k1 { background: var(--terracotta); color: var(--paper); transform: rotate(-1deg); }
.b-card.k1 .deco { position: absolute; right: -22px; top: -22px; width: 100px; height: 100px;
  border: 9px solid var(--paper); border-radius: 50%; }
.b-card.k2 { background: var(--cobalt); color: var(--paper); transform: rotate(1deg); }
.b-card.k2 .deco {
  position: absolute; top: 18px; right: 16px;
  font-family: var(--serif); font-style: italic; font-size: 64px; font-weight: 300;
  color: var(--acid); line-height: 0.8;
}
.b-card.k3 { background: var(--acid); color: var(--ink); transform: rotate(-0.5deg); }
.b-card.k3 .deco {
  position: absolute; left: 16px; right: 16px; top: 50%; height: 24px;
  background-image: repeating-linear-gradient(90deg, var(--ink) 0, var(--ink) 2px, transparent 2px, transparent 10px);
  opacity: 0.55;
}
.b-card.k4 { background: var(--plum); color: var(--paper); transform: rotate(0.7deg); }
.b-card.k4 .deco {
  position: absolute; top: 36px; right: 18px; width: 56px; height: 56px;
  background: var(--acid);
  clip-path: polygon(50% 0%, 100% 100%, 0 100%);
}
```

**Note on `.deco` content per k variant:**
- k1: empty span (CSS-only outline circle via `border`)
- k2: text content `2` (or similar italic numeral) — Fraunces italic in acid
- k3: empty span (CSS-only dotted line via `background-image`)
- k4: empty span (CSS-only triangle via `clip-path`)

**Focus state (UI-SPEC.md mandated, sketch does NOT specify):**
```css
.b-card:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 4px;
}
.b-card.k3:focus-visible { outline-color: var(--paper); }  /* acid bg → ink outline disappears */
```

---

### `src/components/GalleryA12.astro` (component, template, 1–2 pieces)

**Analog:** sketch `.b-pieces` grid (lines 573–612) — subset using p1 + p2 only

**Props shape:**
```typescript
interface Props {
  pieces: CollectionEntry<'pieces'>[];  // 1 or 2 entries, sorted by order
  category: Category;
}
```

**Grid pattern — subset of sketch:**
```css
.b-pieces {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 240px;
  gap: 12px;
}
.b-piece.p1 { grid-column: span 6; grid-row: span 2; background: var(--terracotta); color: var(--paper); transform: rotate(-0.6deg); }
.b-piece.p2 { grid-column: span 6; background: var(--cobalt); color: var(--paper); }
```

**Note:** Bucket A widens `p1` and `p2` from `span 3` (Bucket B) to `span 6` so each tile is full-bleed — D-05's "full-bleed hero + one wide tile beneath".

**Image pattern** — copy from Phase 2 `src/pages/[category]/[slug].astro` line 48:
```astro
<Image src={piece.data.hero} alt={piece.data.title} />
```

`<Image>` from `astro:assets` is the established Phase 1+2 idiom for content-collection images.

---

### `src/components/GalleryB35.astro` (component, template, 3–5 pieces)

**Analog:** sketch `.b-pieces` + p1–p5 (lines 573–612) — **EXACT verbatim extraction, this is the house template**

**Verbatim CSS** (sketch lines 573–612):
```css
.b-pieces {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 240px;
  gap: 12px;
}
.b-piece {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease;
  padding: 16px 18px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.b-piece:hover { transform: scale(1.02) rotate(-0.3deg); z-index: 2; }

.b-piece.p1 { grid-column: span 3; grid-row: span 2; background: var(--terracotta); color: var(--paper); transform: rotate(-0.6deg); }
.b-piece.p1 .deco { position: absolute; right: -30px; top: 30%; font-family: var(--sans); font-weight: 800; font-size: 240px; line-height: 1; color: rgba(255,255,255,0.12); letter-spacing: -0.05em; }
.b-piece.p2 { grid-column: span 3; background: var(--cobalt); color: var(--paper); }
.b-piece.p2 .deco { position: absolute; right: 20px; bottom: 20px; font-family: var(--serif); font-style: italic; font-weight: 300; font-size: 90px; line-height: 0.85; color: var(--acid); }
.b-piece.p3 { grid-column: span 2; background: var(--acid); color: var(--ink); transform: rotate(0.5deg); }
.b-piece.p3 .deco { position: absolute; right: -8px; bottom: -10px; width: 100px; height: 100px; border: 10px solid var(--ink); border-radius: 50%; }
.b-piece.p4 { grid-column: span 2; background: var(--plum); color: var(--paper); }
.b-piece.p4 .deco { position: absolute; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--terracotta); transform: rotate(45deg); }
.b-piece.p5 { grid-column: span 2; background: var(--teal); color: var(--paper); transform: rotate(-0.4deg); }
.b-piece.p5 .deco { position: absolute; left: 22px; bottom: 22px; right: 22px; top: 60%; background-image: repeating-linear-gradient(45deg, var(--acid) 0, var(--acid) 4px, transparent 4px, transparent 18px); opacity: 0.6; }
```

**Tile content pattern:**
```astro
<a href={`/${category}/${piece.id}`} class={`b-piece p${slotIndex}`}>
  <span class="tag">0{slotIndex} / 0{total}</span>
  <Image src={piece.data.hero} alt={piece.data.title} />
  <span class="ttl">{piece.data.title}</span>
  <span class="role">{piece.data.role}</span>
  <span class="deco" aria-hidden="true"></span>
</a>
```

**Bucket B rendering contract (D-05):** Render only N tiles where N = `pieces.length` (3, 4, or 5). Empty slots collapse — do NOT render placeholder `.b-piece` divs for missing slots.

---

### `src/components/GalleryC68.astro` (component, template, 6–8 pieces)

**Analog:** `GalleryB35.astro` (sketch lines 573–612) + extension row for p6/p7/p8

**Pattern:** Copy GalleryB35's full CSS. Add three more `.p6/.p7/.p8` rules below — each `grid-column: span 2`. Vary rotations from p3/p4/p5 to avoid literal repeat (D-05: "Tile rotations vary slightly from B's pattern").

**Suggested rotation/color cycle for p6–p8** (re-use palette, vary rotation):
```css
.b-piece.p6 { grid-column: span 2; background: var(--cobalt);    color: var(--paper); transform: rotate(0.4deg); }
.b-piece.p7 { grid-column: span 2; background: var(--terracotta); color: var(--paper); transform: rotate(-0.3deg); }
.b-piece.p8 { grid-column: span 2; background: var(--plum);      color: var(--paper); transform: rotate(0.7deg); }
```

**Deco variants for p6–p8:** Re-use deco patterns from p3/p4/p5 cycled by 1 (so p6 reuses p4's triangle, p7 reuses p5's diagonal lines, p8 reuses p3's circle outline) — preserves the brand vocabulary without literal grid repeat.

**Overflow (D-06):** If `pieces.length > 8`, emit `console.warn` at build time, render only the first 8.

---

### `src/pages/index.astro` (MODIFIED — splash, full re-skin)

**Analog:**
1. Current file (`src/pages/index.astro` lines 1–20) — replaces this entirely
2. Sketch `.b-splash` markup composition (sketch index.html section `.variant-b` body) + CSS lines 283–530
3. RESEARCH.md "Splash hero band" pattern

**Current shape to replace** (lines 1–20):
```astro
---
import { CATEGORIES } from '../content/categories';
---
<!doctype html>
<html lang="en">
  <head>...</head>
  <body>
    <h1>Caleb Lim</h1>
    <p>What do you wish to see?</p>
    <nav><ul>{CATEGORIES.map((c) => <li><a href={`/${c}`}>{c}</a></li>)}</ul></nav>
  </body>
</html>
```

**New shape — extend Base, map cards via discipline const:**
```astro
---
import Base from '../layouts/Base.astro';
import DisciplineCard from '../components/DisciplineCard.astro';
import { CATEGORIES } from '../content/categories';
import { DISCIPLINE_ACCENT, DISCIPLINE_K } from '../styles/disciplines';
import { Image } from 'astro:assets';
import portrait from '../assets/portrait.jpg';  // D-08 blocker
---
<Base title="Caleb Lim — Portfolio" bg="paper">
  <section class="b-splash">
    <div class="b-hero">
      <div class="b-portrait"><Image src={portrait} alt="Portrait of Caleb Lim" /></div>
      <div class="b-name">
        <h1>CALEB<br /><span class="lim">LIM</span><span class="stop">.</span></h1>
        <span class="stamp">EST. 2026 · SG</span>
        <div class="roles">
          <span>analyst</span><span>brand strategist</span><span>designer</span><span>marketer</span>
        </div>
      </div>
      <div class="b-bio">
        <span class="b-bio-tag">→ THE PITCH</span>
        <h3>CROSS-FUNCTIONAL — BY DESIGN.</h3>
        <p>{/* 40–60 word teaser per D-09 */}</p>
        <span class="b-bio-strike" aria-hidden="true">04</span>
        <span class="b-bio-arrow">→ KEEP READING</span>
      </div>
    </div>
    <div class="b-question">
      <span class="marker">→ PICK ONE</span>
      <span class="q">What do you wish to <em>see</em>?</span>
      <span class="arrow" aria-hidden="true">↓</span>
    </div>
    <div class="b-cards">
      {CATEGORIES.map((cat, i) => (
        <DisciplineCard
          category={cat}
          accent={DISCIPLINE_ACCENT[cat]}
          k={DISCIPLINE_K[cat]}
          index={i + 1}
        />
      ))}
    </div>
  </section>
</Base>
```

**Scoped style block** — copy sketch lines 283–516 verbatim into a `<style>` block (Astro scopes automatically per file). Sketch lines 615–626 mobile-collapse rules go inside the same scoped block.

**4-card vs N-card flexibility (CONTEXT.md discretion):** Add conditional `grid-template-columns` per UI-SPEC.md table (lines 446–451) — render-time count of populated disciplines drives the grid template.

---

### `src/pages/[category].astro` (MODIFIED — gallery)

**Analog (existing structure, preserve):** `src/pages/[category].astro` lines 1–13 (the `getStaticPaths` + `getCollection` + sort-by-order pattern).

**Preserve this verbatim** (current lines 5–13):
```astro
export async function getStaticPaths() {
  return CATEGORIES.map((cat) => ({ params: { category: cat } }));
}

const { category } = Astro.params as { category: Category };

const pieces = (await getCollection('pieces', ({ data }) =>
  data.category === category && data.draft !== true
)).sort((a, b) => a.data.order - b.data.order);
```

**Add (D-04/D-05/D-06 bucket switch + D-07 empty → 404):**
```astro
---
import Base from '../layouts/Base.astro';
import GalleryA12 from '../components/GalleryA12.astro';
import GalleryB35 from '../components/GalleryB35.astro';
import GalleryC68 from '../components/GalleryC68.astro';
import { DISCIPLINE_ACCENT } from '../styles/disciplines';
// ... existing imports + getStaticPaths + filter

// D-07: empty discipline returns 404 (route emitted, then 404'd)
if (pieces.length === 0) {
  return Astro.redirect('/404', 404);
}

const accent = DISCIPLINE_ACCENT[category];
const n = pieces.length;
if (n > 8) console.warn(`[gallery] ${category} has ${n} pieces — Bucket C truncates to 8`);
---
<Base title={`${category} — Caleb Lim`} bg="ink">
  <section class="b-category" style={`--accent: ${accent}`}>
    <header class="b-cat-head">
      <a href="/" class="b-cat-back">← splash</a>
      <h2>{categoryLabel} <em>/{String(n).padStart(2, '0')}</em></h2>
      <span class="b-cat-meta">0{n} PIECES · <strong>UPDATED MAY 2026</strong></span>
    </header>
    {n <= 2 ? <GalleryA12 pieces={pieces} category={category} />
     : n <= 5 ? <GalleryB35 pieces={pieces} category={category} />
     : <GalleryC68 pieces={pieces} category={category} />}
  </section>
</Base>
```

**Header CSS** — copy sketch lines 533–571 verbatim into scoped style block.

**Accent flow pattern (D-01 + RESEARCH.md Pattern 2):** `style={`--accent: ${accent}`}` on the wrapper element. Descendants reference `var(--accent)` (specifically `h2 em` for the italic numeral). This is the load-bearing per-page-accent flow.

---

### `src/pages/[category]/[slug].astro` (MODIFIED — detail, careful re-skin)

**Analog:** Current file (lines 1–83) — **DO NOT TOUCH the paginated `<img>` block (lines 62–76)**.

**Phase 2 Pitfall 1 contract (lines 62–63 comment):** The paginated PDF sequence uses plain `<img>` tags, NOT `<Image>`, because `<Image>` cannot resolve `public/` paths. This is load-bearing — preserve verbatim.

**Re-skin shape:**
```astro
---
import Base from '../../layouts/Base.astro';
import { DISCIPLINE_ACCENT } from '../../styles/disciplines';
// ... preserve all existing imports + getStaticPaths + paginatedPages logic verbatim ...
const accent = DISCIPLINE_ACCENT[category];
---
<Base title={`${title} — Caleb Lim`} bg="paper">
  <article class="detail" style={`--accent: ${accent}`}>
    <header class="detail-head">
      <a href={`/${category}`} class="b-cat-back">← {category}</a>
      <h1>{title}</h1>
    </header>
    <Image src={hero} alt={title} class="detail-hero" />
    <section class="cro">
      <div><span class="label">CONTEXT</span><p>{context}</p></div>
      <div><span class="label">ROLE</span><p>{role}</p></div>
      <div><span class="label">OUTCOME</span><p>{outcome}</p></div>
    </section>
    {/* PRESERVE VERBATIM — Phase 2 D-04 / Pitfall 1 */}
    {paginatedPages.length > 0 && (
      <section class="paginated-pages">
        {paginatedPages.map((p) => (
          <img
            src={`/generated/pdf-thumbs/${slug}/${p.file}`}
            width={p.w}
            height={p.h}
            alt={`${title} — page ${p.n}`}
            loading="lazy"
          />
        ))}
      </section>
    )}
    {fullPdf && <p><a href={fullPdf} download>Open full PDF →</a></p>}
  </article>
</Base>
```

**Container styling** — copy from UI-SPEC.md "Detail page layout" (lines 488–495):
```css
.detail {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--sp-6);
}
.detail-head { border-top: 4px solid var(--accent); padding-top: var(--sp-4); }
.cro .label { font-family: var(--mono); font-size: var(--fs-mono); letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.6; }
.cro p { font-family: var(--serif); font-size: var(--fs-body); line-height: var(--lh-bio); }
```

---

### `src/pages/about.astro` (MODIFIED — paper canvas re-skin)

**Analog:** Current file (lines 1–43) — bio copy stays as Phase 2 shipped it.

**Re-skin pattern (smallest change of any page):**
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="About — Caleb Lim" bg="paper">
  <article class="about">
    <a href="/" class="b-cat-back">← splash</a>
    <h1>Caleb Lim</h1>
    <p>{/* existing bio paragraph from current file lines 29–39 — unchanged */}</p>
    <p><a href="/caleb-lim-resume.pdf" download>Download resume (PDF)</a></p>
  </article>
</Base>
```

**Container styling:**
```css
.about { max-width: 720px; margin: 0 auto; padding: var(--sp-10) var(--sp-6); }
.about h1 { font-family: var(--sans); font-weight: 800; font-size: var(--fs-cat); line-height: var(--lh-cat); letter-spacing: -0.04em; text-transform: uppercase; }
.about p { font-family: var(--serif); font-size: var(--fs-body); line-height: var(--lh-bio); }
.about a { color: var(--ink); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.18em; }
.about a:hover { color: var(--terracotta); }
```

---

### `src/pages/404.astro` (NEW)

**Analog:**
1. UI-SPEC.md "404 page copy" (lines 308–313) — copy + composition
2. `DisciplineCard.astro` component (reused for the 4 cards below)
3. Sketch's display typography for the giant "404"

**Pattern:**
```astro
---
import Base from '../layouts/Base.astro';
import DisciplineCard from '../components/DisciplineCard.astro';
import { CATEGORIES } from '../content/categories';
import { DISCIPLINE_ACCENT, DISCIPLINE_K } from '../styles/disciplines';
---
<Base title="404 — Caleb Lim" bg="paper">
  <section class="four-oh-four">
    <h1>404</h1>
    <p class="caption">This page doesn't exist. The four that do are below.</p>
    <div class="b-cards">
      {CATEGORIES.map((cat, i) => (
        <DisciplineCard
          category={cat}
          accent={DISCIPLINE_ACCENT[cat]}
          k={DISCIPLINE_K[cat]}
          index={i + 1}
        />
      ))}
    </div>
  </section>
</Base>
```

**404 typography:**
```css
.four-oh-four { max-width: 1200px; margin: 0 auto; padding: var(--sp-10) var(--sp-6); }
.four-oh-four h1 { font-family: var(--sans); font-weight: 800; font-size: var(--fs-display); line-height: var(--lh-display); letter-spacing: -0.045em; }
.four-oh-four .caption { font-family: var(--serif); font-style: italic; font-size: 18px; color: var(--ink); opacity: 0.4; margin-bottom: var(--sp-8); }
.four-oh-four .b-cards { /* same grid as splash — copy from splash scoped block */ }
```

**Cloudflare Pages 404 status (RESEARCH.md Architectural Responsibility Map):** Astro emits `dist/404.html` from this file at build time. Cloudflare Pages auto-serves it with HTTP 404 — no `_redirects` config needed. (RESEARCH.md line 139 verifies this is Pages-default behaviour, not a Workers/SPA fallback contract.)

---

## Shared Patterns

### Pattern S1: Discipline Accent Flow

**Source:** RESEARCH.md "Pattern 2" + sketch `--accent` references (line 562)
**Apply to:** `[category].astro`, `[category]/[slug].astro`

**Mechanism:** Page wrapper sets `style={`--accent: ${DISCIPLINE_ACCENT[category]}`}`. All descendant CSS references `var(--accent)`. NEVER inline accent hex anywhere in JSX — always flow through the CSS var.

```astro
<section style={`--accent: ${accent}`}>
  <h2>{label} <em>/N</em></h2>  {/* `em` uses color: var(--accent) */}
</section>
```

**Anti-pattern:** Never hard-code `color: #e85d2a` in a template — must be `color: var(--accent)`. Verifiable by grep `#e85d2a` in `src/` returning zero hits outside `disciplines.ts` + `tokens.css`.

---

### Pattern S2: Astro Image Component for Content-Collection Images

**Source:** Existing `src/pages/[category]/[slug].astro` line 48
**Apply to:** `GalleryA12.astro`, `GalleryB35.astro`, `GalleryC68.astro`, splash portrait

**Established pattern:**
```astro
import { Image } from 'astro:assets';
// ...
<Image src={piece.data.hero} alt={piece.data.title} />
```

**Anti-pattern (Phase 2 Pitfall 1):** Plain `<img>` is required for `public/` paths (the paginated PDF block, line 67). NEVER use `<Image>` with `/generated/...` paths.

---

### Pattern S3: Content Collection Filter + Sort

**Source:** Existing `src/pages/[category].astro` lines 11–13
**Apply to:** Reuse pattern verbatim in modified `[category].astro`

```typescript
const pieces = (await getCollection('pieces', ({ data }) =>
  data.category === category && data.draft !== true
)).sort((a, b) => a.data.order - b.data.order);
```

**Don't re-derive** — this filter+sort idiom is the load-bearing per-piece ordering primitive from Phase 1 D-01.

---

### Pattern S4: Layout Extension

**Source:** RESEARCH.md Pattern 1 + standard Astro layout idiom
**Apply to:** All 5 pages (index, about, [category], [category]/[slug], 404)

**Pattern:**
```astro
---
import Base from '<relative-path>/layouts/Base.astro';
---
<Base title="..." bg="paper|ink">
  {/* page body */}
</Base>
```

**Anti-pattern:** No page is permitted to emit its own `<!doctype>`/`<html>`/`<head>` shell after Phase 3 — verifiable by `grep -l '<!doctype' src/pages/` returning empty.

---

### Pattern S5: Reduced-Motion Guard

**Source:** UI-SPEC.md "Motion Contract" (lines 511–520) + CONTEXT.md D-13
**Apply to:** `tokens.css` (global), `DisciplineCard.astro`, `Gallery*.astro` (component-scoped reinforcement)

Single global block in tokens.css (covers all transitions + animations). Component-scoped styles inherit. No per-component reduced-motion CSS needed beyond the global block.

---

### Pattern S6: Scoped Styles + `<style is:global>` Discipline

**Source:** Astro 5 defaults + RESEARCH.md Pattern 1

- Component styles → `<style>` (scoped automatically, hashed selectors)
- Global tokens / body classes → `<style is:global>` in `Base.astro` OR the global `tokens.css` import
- Imported CSS files via `import '../styles/tokens.css'` → automatically global (no scope hash)

**Anti-pattern:** Never use `<style is:global>` for component-specific rules — defeats the colocation contract of D-17.

---

### Pattern S7: a11y Decoration Marking

**Source:** UI-SPEC.md "Screen-reader text" (Accessibility Contract row line 537)
**Apply to:** Every `.deco` span across `DisciplineCard.astro` (k1–k4) and gallery tiles (p1–p8); every pulse dot in `StatusPill.astro`; every `.b-bio-strike` shadow numeral; the `↓` arrow glyph in question bar.

**Pattern:**
```astro
<span class="deco" aria-hidden="true"></span>
<span class="dot" aria-hidden="true"></span>
<span class="b-bio-strike" aria-hidden="true">04</span>
```

**Verifiable:** `grep -E 'class="(deco|dot|b-bio-strike|b-bio-arrow|arrow)"' src/` — every hit must have `aria-hidden="true"`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/verify-anti-ai-tells.sh` | utility script | build-time check | Per UI-SPEC.md "Registry Safety" + CONTEXT.md "Anti-AI-tell verification mechanism" — referenced but optional (manual checklist `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` is the primary gate). If executor chooses to write the shell script, no analog exists in repo. Pattern: grep `src/`, `package.json`, `astro.config.mjs` for `Inter`, `lucide`, `shadcn`, purple gradient regexes, etc. Exit 1 on any match. |
| `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md` | manual checklist | doc | Planner-authored doc. Use UI-SPEC.md "Anti-AI-tell verification gate" (lines 552–561) as the literal item list. |

---

## Metadata

**Analog search scope:** `src/` (all `.astro`/`.ts`/`.css`), `package.json`, `astro.config.mjs`, `.planning/sketches/001-direction-comparison/index.html` (sketch CSS lines 262–627)
**Files scanned:** 6 source files + 1 sketch HTML
**Sketch is the spec:** For every visual file (`tokens.css`, `Base.astro`, `StatusPill.astro`, `DisciplineCard.astro`, `Gallery*.astro`, splash composition), the sketch CSS at lines 262–627 is the **verbatim source** — not a "follow this style" reference. Numbers, hexes, transforms, keyframes are all extracted as-shown.
**Pattern extraction date:** 2026-05-14
