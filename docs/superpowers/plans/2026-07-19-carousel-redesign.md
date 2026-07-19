# Carousel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `PieceCarousel.astro` into a true circular (infinite-loop) coverflow where each card is a designed cover — the project's real logo + a framed screenshot on a flat section-colour background — with the project name set in a per-project display font and the description as a small subcaption; and recategorise the PVL marketing piece into graphic design with a new magenta discipline accent.

**Architecture:** The carousel stays a translate-based coverflow but the JS is rewritten to loop infinitely by cloning the slide set on both sides and rebasing the active index after each step (clones are hidden from assistive tech). Each slide's visual (logo shape, vibe font, size, logo asset) comes from a slug-keyed style map in code (`src/styles/carouselStyle.ts`), so the content schema is untouched except the one recategorisation. Fonts are added the established way — Fontsource npm packages imported in `Base.astro`. This design was approved via a live artifact preview; port it faithfully.

**Tech Stack:** Astro 5 content collections, `astro:assets` `<Image>`, Fontsource variable/static font packages, plain CSS + vanilla JS in the `.astro` component.

## Global Constraints

- No em dashes in any user-facing copy (house rule). Use hyphen, colon, or middot.
- Fonts must be self-hosted via Fontsource packages imported in `src/layouts/Base.astro` — never a Google Fonts `<link>` (CSP/offline + house convention).
- Match existing code idiom in `PieceCarousel.astro` (rgba/shadow literals, `--sp-*` spacing tokens, theme prop `dark`/`light`).
- Every task ends buildable: `npm run build` must succeed with zero NEW errors vs base. (The repo's `test:smoke` / anti-ai-tells scripts are known-stale and RED at base — do NOT trust their exit code; verify via `npm run build` + targeted grep + visual check in `npm run dev`.)
- Respect `prefers-reduced-motion`: no auto-advance, no transition-based motion when set.
- Keyboard + AT: cloned slides must be `aria-hidden` and non-focusable; only the real pieces are in tab order and announced.

---

## Design Spec (approved via preview)

**Card anatomy (per carousel slide):**
- Cover: flat background = the piece's discipline accent colour, `aspect-ratio:16/10`, `border-radius:18px`, no border, soft drop shadow. No gradient/shader (all covers flat).
- Left: a square icon box (`aspect-ratio:1`, `height:53%` of cover), no glass chip. Three logo shapes:
  - `tile` — opaque app icon, `object-fit:cover`, `border-radius:26%` (squircle), drop shadow. Event Drafter additionally gets a dark fill (`#181818`) so its transparent corners crop clean, no white.
  - `mark` — transparent logo, `object-fit:contain`, sits directly on the accent with a drop shadow.
  - `circle` — PVL cream badge, `object-fit:cover`, `border-radius:50%`, fills the box.
  - All three fill the same square footprint.
- Right: a "glass screen" panel (`rgba(255,255,255,.14)` + `backdrop-filter:blur`) holding the piece's hero screenshot `object-fit:contain` (never clipped), rounded, drop shadow.
- Caption below (revealed only on the active/centered slide): project name in its vibe font (centered), then the description as a smaller, unbolded DM Sans subcaption (centered). Name + subcaption are derived by splitting the title on `" - "` (name = before, subcaption = after); if there is no `" - "`, the whole title is the name and there is no subcaption.

**Per-project vibe fonts, logo shape, size multiplier, logo asset:**

| slug | font-family | weight | shape | mult | logo (public/logos/) | logo bg |
|---|---|---|---|---|---|---|
| `remy` | Dancing Script Variable | 700 | tile | 1.05 | `remy.png` | - |
| `elbert` | Bungee | 400 | mark | 0.66 | `elbert.svg` | - |
| `jorkmate` | Unbounded Variable | 700 | mark | 0.64 | `jorkmate.svg` | - |
| `nexus` | Bricolage Grotesque Variable | 600 | mark | 0.98 | `nexus.svg` | - |
| `event-drafter` | Hanken Grotesk Variable | 600 | tile | 0.98 | `event-drafter.png` | `#181818` |
| `bento` | DynaPuff Variable | 600 | tile | 0.92 | `bento.png` | - |
| `design-real-piece` | Zilla Slab | 600 | circle | 1.0 | `pvl.png` | - |
| `saas-real-piece` | Zilla Slab | 600 | circle | 1.0 | `pvl.png` | - |

Fallback for any slug not in the map: DM Sans, `mark` shape, `mult` 1.0, no logo (renders the piece's `hero` in the shot panel and the title as the name only).

**Discipline accent change:** graphic design moves from ochre `#8c6326` to magenta `#c9187e`, site-wide (it is the graphic design room's identity colour and PVL is now the flagship). Update both `src/styles/disciplines.ts` and `src/styles/tokens.css`.

**Recategorisation:** `saas-real-piece` (PVL marketing) moves `category: saas` -> `category: design`. Consequence: the `design` room now has 2 non-draft pieces (design-real-piece + saas-real-piece) and its carousel activates; the `saas` room drops to 1 (`bento`) and falls into the `n===1` featured branch (no carousel). Both design pieces currently have `order: 1`; bump `saas-real-piece` to `order: 2` for a deterministic sort.

**Circular loop:** clicking prev on the first piece lands on the last with no long "rewind" sweep — the last piece sits immediately left of the first. Achieved by cloning the slide set on both sides and silently rebasing the active index into the middle copy after each transition.

---

## File Structure

- `package.json` — add 6 Fontsource deps (bricolage-grotesque already present).
- `src/layouts/Base.astro` — add the 6 font imports beside the existing DM Sans import.
- `src/styles/tokens.css` — change `--design` to magenta.
- `src/styles/disciplines.ts` — change `DISCIPLINE_ACCENT.design` (and `DISCIPLINE_K.design` if it is a design tint) to magenta.
- `src/content/pieces/saas-real-piece/index.md` — `category: design`, `order: 2`.
- `public/logos/` (create) — `remy.png`, `elbert.svg`, `jorkmate.svg`, `nexus.svg`, `event-drafter.png`, `bento.png`, `pvl.png`.
- `src/styles/carouselStyle.ts` (create) — the slug-keyed style map + `carouselStyle(slug)` accessor with fallback.
- `src/components/PieceCarousel.astro` — full rewrite of markup, CSS, and script.

Source assets to copy from the approved preview build:
`/private/tmp/claude-501/-Users-caleb/b5a96c40-f140-4998-b0c4-3e9a9e7736db/scratchpad/logos/` contains `remy-icon.png` (-> remy.png), `elbert.svg`, `jorkmate.svg`, `nexus.svg`, `eventdrafter-sm.png` (or the full `eventdrafter.png`), `bento-sm.png` (or full), `pvldesign-sm.png` (-> pvl.png). Prefer the full-resolution originals where available (`~/event-drafter/packages/desktop/icons/icon.png`, `~/event-editor/packages/desktop/icons/icon.png`, `~/Downloads/PVL Logo.png`, `~/remy/mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`).

---

### Task 1: Add and wire the display fonts

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `src/layouts/Base.astro:10-14` (font imports)

**Interfaces:**
- Produces: the CSS families `"Dancing Script Variable"`, `"Bungee"`, `"Unbounded Variable"`, `"Bricolage Grotesque Variable"`, `"Hanken Grotesk Variable"`, `"DynaPuff Variable"`, `"Zilla Slab"` available globally.

- [ ] **Step 1: Install the Fontsource packages** (bricolage-grotesque is already a dep)

```bash
cd /Users/caleb/projects/personal-website
npm install @fontsource-variable/dancing-script @fontsource/bungee @fontsource-variable/unbounded @fontsource-variable/hanken-grotesk @fontsource-variable/dynapuff @fontsource/zilla-slab
```

- [ ] **Step 2: Import them in `Base.astro`** just after the existing DM Sans imports (around line 12)

```astro
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/dm-sans/wght-italic.css';
// carousel vibe fonts
import '@fontsource-variable/dancing-script';
import '@fontsource/bungee';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/dynapuff';
import '@fontsource/zilla-slab/400.css';
import '@fontsource/zilla-slab/600.css';
```

- [ ] **Step 3: Verify build succeeds and the fonts are bundled**

Run: `npm run build`
Expected: build completes with no errors. Then `grep -rl "dancing-script\|unbounded\|zilla-slab" dist/_astro/*.css` returns at least one file (fonts are inlined/emitted).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/layouts/Base.astro
git commit -m "feat(fonts): add carousel vibe display fonts via Fontsource"
```

---

### Task 2: Recategorise PVL marketing + magenta graphic-design accent

**Files:**
- Modify: `src/content/pieces/saas-real-piece/index.md:3-...` (frontmatter `category`, `order`)
- Modify: `src/styles/disciplines.ts:7-12` (and `DISCIPLINE_K` if design entry is a tint)
- Modify: `src/styles/tokens.css:10-14` (`--design`)

**Interfaces:**
- Produces: `DISCIPLINE_ACCENT.design === '#c9187e'`; `saas-real-piece` in the `design` collection with `order: 2`.

- [ ] **Step 1: Recategorise the PVL marketing piece**

In `src/content/pieces/saas-real-piece/index.md` frontmatter, change `category: saas` to `category: design` and change its `order:` to `2` (design-real-piece keeps `order: 1`).

- [ ] **Step 2: Change the design accent to magenta in `disciplines.ts`**

```ts
export const DISCIPLINE_ACCENT: Record<Category, string> = {
  design:   '#c9187e',
  finance:  '#8ba1a9',
  personal: '#dc972a',
  saas:     '#536644',
} as const;
```
Read `DISCIPLINE_K` (lines 16-21) first. If its `design` entry is a decorative tint/shade of the old ochre, replace it with the matching magenta-family value (a darker magenta such as `#9c145f`), keeping the same role/format as the other entries; if it is unrelated to the accent hue, leave it unchanged.

- [ ] **Step 3: Change `--design` in `tokens.css`** (line ~10) from the ochre hex to `#c9187e`.

- [ ] **Step 4: Verify build + room membership**

Run: `npm run build`
Expected: success. Then confirm the design room now has 2 pieces and saas has 1:
`grep -rl "category: design" src/content/pieces/*/index.md | wc -l` -> 2 (design-real-piece, saas-real-piece);
`grep -rl "category: saas" src/content/pieces/*/index.md` -> only bento's dir remains (0 if none; bento is `saas`? verify — bento IS saas, so expect bento only).
Note: `saas-real-piece` keeps its directory name; only its `category` field changed.

- [ ] **Step 5: Visual check** — `npm run dev`, open `/design` (should now show 2 pieces + the carousel branch) and `/saas` (1 piece, featured, no carousel). Confirm the design accent renders magenta on `/design` and case-study pages.

- [ ] **Step 6: Commit**

```bash
git add src/content/pieces/saas-real-piece/index.md src/styles/disciplines.ts src/styles/tokens.css
git commit -m "feat(design-room): move PVL marketing to graphic design, magenta accent"
```

---

### Task 3: Logo assets + per-piece style map

**Files:**
- Create: `public/logos/{remy.png,elbert.svg,jorkmate.svg,nexus.svg,event-drafter.png,bento.png,pvl.png}`
- Create: `src/styles/carouselStyle.ts`

**Interfaces:**
- Produces: `carouselStyle(slug: string): { font: string; weight: number; shape: 'tile'|'mark'|'circle'; mult: number; logo: string | null; logoBg?: string }` with a fallback for unknown slugs.

- [ ] **Step 1: Copy the logo assets into `public/logos/`** (prefer full-res originals; the approved preview versions are in the scratchpad `logos/` dir)

```bash
cd /Users/caleb/projects/personal-website && mkdir -p public/logos
cp ~/remy/mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png public/logos/remy.png
cp /private/tmp/claude-501/-Users-caleb/b5a96c40-f140-4998-b0c4-3e9a9e7736db/scratchpad/logos/elbert.svg public/logos/elbert.svg
cp /private/tmp/claude-501/-Users-caleb/b5a96c40-f140-4998-b0c4-3e9a9e7736db/scratchpad/logos/jorkmate.svg public/logos/jorkmate.svg
cp /private/tmp/claude-501/-Users-caleb/b5a96c40-f140-4998-b0c4-3e9a9e7736db/scratchpad/logos/nexus.svg public/logos/nexus.svg
cp ~/event-drafter/packages/desktop/icons/icon.png public/logos/event-drafter.png
cp ~/event-editor/packages/desktop/icons/icon.png public/logos/bento.png
cp ~/Downloads/"PVL Logo.png" public/logos/pvl.png
```
Verify all 7 exist: `ls public/logos`.

- [ ] **Step 2: Create `src/styles/carouselStyle.ts`**

```ts
export type LogoShape = 'tile' | 'mark' | 'circle';
export interface CarouselStyle {
  font: string;      // CSS font-family value
  weight: number;
  shape: LogoShape;
  mult: number;      // name font-size multiplier
  logo: string | null;   // path under /public, or null to fall back to the hero
  logoBg?: string;   // optional solid fill behind a tile with transparent corners
}

const MAP: Record<string, CarouselStyle> = {
  'remy':              { font: '"Dancing Script Variable", cursive', weight: 700, shape: 'tile',   mult: 1.05, logo: '/logos/remy.png' },
  'elbert':            { font: '"Bungee", sans-serif',                weight: 400, shape: 'mark',   mult: 0.66, logo: '/logos/elbert.svg' },
  'jorkmate':          { font: '"Unbounded Variable", sans-serif',    weight: 700, shape: 'mark',   mult: 0.64, logo: '/logos/jorkmate.svg' },
  'nexus':             { font: '"Bricolage Grotesque Variable", sans-serif', weight: 600, shape: 'mark', mult: 0.98, logo: '/logos/nexus.svg' },
  'event-drafter':     { font: '"Hanken Grotesk Variable", sans-serif', weight: 600, shape: 'tile', mult: 0.98, logo: '/logos/event-drafter.png', logoBg: '#181818' },
  'bento':             { font: '"DynaPuff Variable", sans-serif',     weight: 600, shape: 'tile',   mult: 0.92, logo: '/logos/bento.png' },
  'design-real-piece': { font: '"Zilla Slab", serif',                weight: 600, shape: 'circle', mult: 1.0,  logo: '/logos/pvl.png' },
  'saas-real-piece':   { font: '"Zilla Slab", serif',                weight: 600, shape: 'circle', mult: 1.0,  logo: '/logos/pvl.png' },
};

const FALLBACK: CarouselStyle = { font: 'var(--sans)', weight: 700, shape: 'mark', mult: 1.0, logo: null };

export function carouselStyle(slug: string): CarouselStyle {
  return MAP[slug] ?? FALLBACK;
}
```

- [ ] **Step 3: Verify build** — Run: `npm run build`. Expected: success (the module is not yet imported anywhere; this just type-checks). Optionally `npx astro check` if configured.

- [ ] **Step 4: Commit**

```bash
git add public/logos src/styles/carouselStyle.ts
git commit -m "feat(carousel): add project logos and per-piece style map"
```

---

### Task 4: Rewrite PieceCarousel markup + CSS

**Files:**
- Modify (rewrite): `src/components/PieceCarousel.astro` (frontmatter + template + `<style>`; keep the `<script>` from the current file for now — replaced in Task 5)

**Interfaces:**
- Consumes: `carouselStyle(slug)` from Task 3; `DISCIPLINE_ACCENT` from `src/styles/disciplines.ts`.
- Produces: the new DOM structure the Task 5 script drives — a `[data-pc]` root containing `.pc-viewport > ul.pc-track > li.pc-slide > a.pc-item`, each item holding `.cover` (`.logo` + `.shot`) and a `figcaption` (`.pname` + `.psub`); plus `.pc-controls` (prev/dots/next) when `multi`.

- [ ] **Step 1: Replace the component frontmatter + template.** Keep the existing Props interface but derive per-piece style + accent, and split the title.

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { DISCIPLINE_ACCENT } from '../styles/disciplines.ts';
import { carouselStyle } from '../styles/carouselStyle.ts';

interface Props {
  pieces: CollectionEntry<'pieces'>[];
  accent: string;              // controls/dots accent for this context
  theme?: 'dark' | 'light';
  label?: string;
}
const { pieces, accent, theme = 'dark', label } = Astro.props;
const multi = pieces.length > 1;

function splitTitle(t: string): { name: string; sub: string | null } {
  const i = t.indexOf(' - ');
  return i === -1 ? { name: t, sub: null } : { name: t.slice(0, i), sub: t.slice(i + 3) };
}
---
{pieces.length > 0 && (
  <section class:list={['pc', `pc--${theme}`]} style={`--accent: ${accent}`} data-pc
    aria-roledescription="carousel" aria-label={label ?? 'Selected work'}>
    {label && <span class="pc-eyebrow">{label}</span>}
    <div class="pc-viewport">
      <ul class="pc-track" data-pc-track>
        {pieces.map((p, i) => {
          const st = carouselStyle(p.id);
          const cover = DISCIPLINE_ACCENT[p.data.category];
          const { name, sub } = splitTitle(p.data.title);
          return (
            <li class="pc-slide">
              <a class="pc-item" href={`/${p.data.category}/${p.id}`} data-pc-item
                 aria-current={i === 0 ? 'true' : 'false'} aria-label={`View ${name}`}>
                <div class="cover" style={`--cover:${cover}`}>
                  <div class="logo">
                    {st.logo
                      ? <img class:list={['logomark', st.shape]} src={st.logo} alt={`${name} logo`}
                          style={st.logoBg ? `background:${st.logoBg}` : undefined} />
                      : <Image class="logomark shot-fallback" src={p.data.hero} alt={`${name} preview`} widths={[200,400]} sizes="120px" />}
                  </div>
                  <div class="shot">
                    <Image src={p.data.hero} alt={`${name} preview`} widths={[300,600]}
                      sizes="(max-width:700px) 40vw, 200px" loading={i === 0 ? 'eager' : 'lazy'} />
                  </div>
                </div>
                <figcaption>
                  <span class="pname" style={`font-family:${st.font};font-weight:${st.weight};--mult:${st.mult}`}>{name}</span>
                  {sub && <span class="psub">{sub}</span>}
                </figcaption>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
    {multi && (
      <div class="pc-controls">
        <button class="pc-arrow" type="button" data-pc-prev aria-label="Previous piece">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <ul class="pc-dots" data-pc-dots>
          {pieces.map((p, i) => (
            <li><button class="pc-dot" type="button" data-pc-dot={i} aria-current={i === 0 ? 'true' : 'false'} aria-label={`Show ${splitTitle(p.data.title).name}`}></button></li>
          ))}
        </ul>
        <button class="pc-arrow" type="button" data-pc-next aria-label="Next piece">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    )}
  </section>
)}
```

- [ ] **Step 2: Replace the `<style>` block** with the approved cover design (keep the existing `.pc`, `.pc-viewport`, `.pc-track`, `.pc-item` scale/opacity, `.pc-controls`, `.pc-arrow`, `.pc-dots` rules from the current file — they are unchanged — and swap the old `.pc-fig/.pc-cover/.pc-name` rules for these):

```css
/* item sizing stays as in the current file: .pc-item width clamp + opacity/scale on aria-current */
.cover {
  position: relative; width: 100%; aspect-ratio: 16 / 10; border-radius: 18px;
  overflow: hidden; isolation: isolate; background: var(--cover);
  display: flex; align-items: center; gap: 14px; padding: 16px 16px 16px 18px;
  box-shadow: 0 20px 44px -26px rgba(0,0,0,.7);
}
.cover > * { position: relative; z-index: 1; }
.logo { flex: 0 0 auto; aspect-ratio: 1; height: 53%; width: auto; display: grid; place-items: center; }
.logomark { width: auto; height: auto; object-fit: contain; max-width: 100%; max-height: 100%;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,.30)); }
.logomark.tile { width: 100%; height: 100%; object-fit: cover; border-radius: 26%;
  filter: none; box-shadow: 0 6px 16px -5px rgba(0,0,0,.45); }
.logomark.circle { width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: 50%;
  filter: none; box-shadow: 0 6px 16px -5px rgba(0,0,0,.45); }
.shot { flex: 1 1 0; height: 100%; display: flex; align-items: center; justify-content: center;
  border-radius: 14px; padding: 8px;
  background: rgba(255,255,255,.14); backdrop-filter: blur(6px) saturate(1.1);
  -webkit-backdrop-filter: blur(6px) saturate(1.1);
  border: 1px solid rgba(255,255,255,.26);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 16px 34px -18px rgba(0,0,0,.5); }
.shot img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;
  display: block; border-radius: 7px; box-shadow: 0 6px 16px -6px rgba(0,0,0,.5); }
figcaption { display: flex; flex-direction: column; gap: 3px; align-items: center; text-align: center;
  margin-top: var(--sp-3); }
.pname { font-size: calc(clamp(24px, 3.6vw, 34px) * var(--mult)); line-height: 1.02;
  letter-spacing: -.01em; text-wrap: balance; opacity: 0; transition: opacity .45s ease; }
.psub { font-family: var(--sans); font-weight: 400; font-size: 13.5px; opacity: 0; transition: opacity .45s ease; }
.pc-item[aria-current="true"] .pname, .pc-item[aria-current="true"] .psub { opacity: 1; }
.pc--dark .pname { color: var(--paper); } .pc--light .pname { color: var(--ink); }
.pc--dark .psub { color: rgba(242,235,219,.72); } .pc--light .psub { color: var(--ink-dim, #5f584a); }
@media (prefers-reduced-motion: reduce) { .pname, .psub { transition: none; } }
```

- [ ] **Step 3: Build + visual check**

Run: `npm run build` (expect success). Then `npm run dev` and open the splash `/` and `/personal` (3 pieces). Confirm: each cover shows its logo (correct shape) + framed screenshot on the accent background; the centered piece shows name (in its vibe font) + subcaption; no clipping; Event Drafter tile has no white corners. The carousel still advances with the OLD script (Task 5 replaces it).

- [ ] **Step 4: Commit**

```bash
git add src/components/PieceCarousel.astro
git commit -m "feat(carousel): redesigned covers, logos, vibe-font captions"
```

---

### Task 5: Circular infinite-loop script

**Files:**
- Modify (rewrite `<script>`): `src/components/PieceCarousel.astro`

**Interfaces:**
- Consumes: the DOM from Task 4 (`[data-pc]`, `[data-pc-track]`, `.pc-slide`, `[data-pc-item]`, `[data-pc-dot]`, `[data-pc-prev/next]`).
- Produces: an infinite coverflow — prev on the first real piece shows the last with no long sweep; dots/arrows/auto-advance/hover-pause/reduced-motion preserved; clones hidden from AT.

- [ ] **Step 1: Replace the `<script>` block** with the clone-and-rebase loop. For 2+ pieces it prepends a full clone set and appends a full clone set, centers on the first real slide, and after each transition rebases the active index back into the middle copy without animating. For a single piece it renders static (no clones, no controls).

```html
<script>
  function initPc(root) {
    const viewport = root.querySelector('.pc-viewport');
    const track = root.querySelector('[data-pc-track]');
    const realSlides = Array.from(root.querySelectorAll('.pc-slide'));
    const dots = Array.from(root.querySelectorAll('[data-pc-dot]'));
    const prev = root.querySelector('[data-pc-prev]');
    const next = root.querySelector('[data-pc-next]');
    const count = realSlides.length;
    if (count === 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Single piece: static, centered, no clones/controls.
    if (count === 1) {
      const only = realSlides[0];
      const center = () => {
        const off = viewport.clientWidth / 2 - (only.offsetLeft + only.offsetWidth / 2);
        track.style.transform = `translateX(${off}px)`;
      };
      only.querySelector('[data-pc-item]')?.setAttribute('aria-current', 'true');
      requestAnimationFrame(center); window.addEventListener('resize', center);
      return;
    }

    // Multi: clone the set on both sides for a seamless loop.
    const mkClones = () => realSlides.map((s) => {
      const c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a,button,[tabindex]').forEach((el) => el.setAttribute('tabindex', '-1'));
      c.querySelectorAll('[data-pc-item]').forEach((el) => el.removeAttribute('data-pc-item'));
      return c;
    });
    const before = mkClones(), after = mkClones();
    before.forEach((c) => track.insertBefore(c, realSlides[0]));
    after.forEach((c) => track.appendChild(c));

    const all = Array.from(track.querySelectorAll('.pc-slide')); // length 3*count
    let active = count;            // first real slide (middle copy)
    let animate = true;

    const realIndex = () => ((active - count) % count + count) % count;
    function paint() {
      const slide = all[active];
      const off = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
      track.style.transition = animate ? '' : 'none';
      track.style.transform = `translateX(${off}px)`;
      all.forEach((s, i) => s.querySelector('.pc-item')?.setAttribute('aria-current', i === active ? 'true' : 'false'));
      const ri = realIndex();
      dots.forEach((d, i) => d.setAttribute('aria-current', i === ri ? 'true' : 'false'));
    }
    function rebase() {
      // After a transition, if we've drifted out of the middle copy, jump back silently.
      if (active < count || active >= count * 2) {
        animate = false;
        active = count + realIndex();
        paint();
        void track.offsetWidth;        // force reflow so the next move animates
        animate = true;
      }
    }
    track.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') rebase(); });

    let timer = null;
    function go(delta) { animate = true; active += delta; paint(); }
    function toReal(ri) { animate = true; active = count + ri; paint(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!reduce.matches) timer = setInterval(() => go(1), 3000); }

    prev && prev.addEventListener('click', () => { go(-1); start(); });
    next && next.addEventListener('click', () => { go(1); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { toReal(i); start(); }));
    root.querySelectorAll('[data-pc-item]').forEach((it, i) => it.addEventListener('focus', () => { toReal(i); }));
    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    window.addEventListener('resize', () => { animate = false; paint(); animate = true; });
    if (reduce.addEventListener) reduce.addEventListener('change', start);

    requestAnimationFrame(() => { paint(); start(); });
  }
  document.querySelectorAll('[data-pc]').forEach(initPc);
</script>
```

- [ ] **Step 2: Build + loop verification**

Run: `npm run build` (expect success). Then `npm run dev`, open `/personal` (3 pieces). Verify:
- Clicking prev on the first piece slides LEFT to the last piece (last sits immediately left of first) — no long rewind across all slides.
- Clicking next past the last continues forward into the first with no jump.
- Dots highlight the correct real piece; auto-advance runs and pauses on hover/focus.
- Tab key visits only the 3 real pieces (not the 6 clones); a screen reader announces 3 items.

- [ ] **Step 3: Reduced-motion + single-piece check** — In devtools emulate `prefers-reduced-motion: reduce`: no auto-advance, arrows still work by jumping. Open `/saas` (1 piece — bento): renders one centered card, no controls, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PieceCarousel.astro
git commit -m "feat(carousel): true circular infinite loop with hidden clones"
```

---

### Task 6: Cross-context verification + ship

**Files:** none (verification + push)

- [ ] **Step 1: Full build** — `npm run build`. Expect success, zero NEW errors vs base.

- [ ] **Step 2: Splash (light) check** — `npm run dev`, `/`: the "A glimpse of my work" carousel shows all 8 non-draft pieces, each cover in its own discipline colour (design cards magenta), captions dark ink on the cream page, loop wraps.

- [ ] **Step 3: Category (dark) checks** — `/personal` (3, dark), `/design` (2 PVL pieces, magenta, dark, carousel active), `/saas` (1, bento, featured, no carousel), `/finance` (0, coming-soon stub). No console errors; no horizontal page scroll at 390px and desktop widths.

- [ ] **Step 4: Grep guard for house rules** — `grep -R "—" src/components/PieceCarousel.astro src/styles/carouselStyle.ts` returns nothing (no em dashes).

- [ ] **Step 5: Push to main** (per owner preference — commit history already atomic)

```bash
git push origin main
```
Vercel auto-deploys (~30s). Confirm the deployed splash + /design render correctly.

---

## Self-Review Notes

- **Spec coverage:** circular loop (Task 5), per-project fonts (Tasks 1,3,4), logo covers + shapes + squircle ED (Tasks 3,4), framed screenshot (Task 4), name+subcaption split (Task 4), flat section-colour covers (Task 4), magenta design accent + PVL recategorisation (Task 2). All mapped.
- **Known deviation:** the design accent change is site-wide (nav, featured, case-study), not carousel-only — flagged in the spec for owner confirmation before merge.
- **Assets:** logos are served from `/public/logos` as plain `<img>` (not `image()`-optimised) to keep SVGs crisp and avoid schema churn; they are small.
- **No unit tests:** this is presentational Astro; verification is `npm run build` + scripted greps + visual/keyboard/AT checks in dev, consistent with the repo (no component test harness exists).
