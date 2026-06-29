# Dark case-study pages + rotating carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make every page except the splash and about dark (the case-study slug pages convert from light to dark, keeping each piece's accent), remove the `/01` count from category headings, and add a constantly-rotating, center-highlighted piece carousel to the splash (all pieces) and category pages (that room's pieces).

**Architecture:** Pure Astro + scoped CSS + one small vanilla `<script>` for the carousel. The dark slug pages mirror the existing `[category].astro` dark idiom. The carousel is one reusable component with a `theme` prop (dark for category pages, light for the splash).

**Tech Stack:** Astro 5 content collections, scoped `.astro` styles, `astro:assets` `<Image>`. No new dependencies.

## Global Constraints

Bind every task. The task reviewer's attention lens.

- **Project tokens only** (`src/styles/tokens.css`). No new tokens, no raw `font-size: Npx` literal (Gate 25). Accent is the inline per-discipline `--accent`. Relevant tokens: `--paper #f2ebdb`, `--ink #0a0a0a`, spacing `--sp-1..--sp-10`, type `--fs-display/-cat/-q/-card/-h3/-ttl/-body/-tile-role/-mono`, line-heights `--lh-*`.
- **Anti-vibecode non-negotiables:** exactly ONE accent per view (accent only on: the slug header rule, eyebrows, pull-quote mark, outcome label, and the carousel's active dot/ring; everything else neutral). Soft DIFFUSE shadows only (large blur, negative spread, tinted to bg; never a hard slab). Raised surfaces, not strokes. **Dark surfaces are LIGHTER than the canvas** (`rgba(242, 235, 219, 0.05-0.06)` panels with `inset 0 1px 0 rgba(255,255,255,0.06)` + soft dark drop). NO side accent stripes. 4px spacing scale only. Sentence-case eyebrows (never ALL-CAPS in new copy). No em dashes anywhere (code, comments, copy). Every interactive element has hover + active + `:focus-visible` (and the carousel auto-advance respects `prefers-reduced-motion`). Icons one family (Feather-style stroke, `width:1em;height:1em`).
- **Preserve machinery:** no change to `getStaticPaths` (params/sort) on any page, the slug hero `<Image>` priority/LCP, the `.cache.json` PDF block, the "Open full PDF" link, the prev/next pager, or `FeaturedPiece`/`Gallery`.
- **Verification gates are known-stale** (`test:smoke` ~13 red at base, `verify:anti-ai` purple-gradient false-positive). Signal is "no NEW failures vs base", not exit 0.

---

### Task 1: Remove the count from the category heading

**Files:**
- Modify: `src/pages/[category].astro` (heading + meta, lines ~78-81, and the now-unused `countStr`)

**Interfaces:** none consumed/produced.

- [ ] **Step 1: Drop the `/{countStr}` em and the count meta prefix**

In `src/pages/[category].astro`, change the heading (line 78) from:

```astro
      <h2>{label} <em>{isEmpty ? 'soon' : `/${countStr}`}</em></h2>
      <span class="b-cat-meta">
        {isEmpty ? <strong>COMING SOON</strong> : <>{countStr} PIECES · <strong>UPDATED MAY 2026</strong></>}
      </span>
```

to (populated rooms show just the label; empty rooms keep "soon" and "COMING SOON"; the count is gone, "Updated May 2026" stays):

```astro
      <h2>{label}{isEmpty && <em> soon</em>}</h2>
      <span class="b-cat-meta">
        {isEmpty ? <strong>COMING SOON</strong> : <strong>UPDATED MAY 2026</strong>}
      </span>
```

- [ ] **Step 2: Remove the now-unused `countStr`**

Delete the line `const countStr = String(n).padStart(2, '0');` (line ~46) if nothing else references it. (`n` and `isEmpty` stay.) Grep to confirm: `grep -n countStr "src/pages/[category].astro"` returns nothing after.

- [ ] **Step 3: Build + verify**

Run: `cd ~/projects/personal-website && npm run build 2>&1 | grep -E 'Complete|error' | head` — build clean.
Run: `grep -o -E '/0[0-9]|[0-9]+ PIECES' dist/design/index.html` — expect no output (no count rendered). `grep -o 'UPDATED MAY 2026' dist/design/index.html` — present.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/personal-website
git add "src/pages/[category].astro"
git commit -m "feat: drop piece count from category heading and meta"
```

---

### Task 2: Dark mode for the case-study slug pages (+ 404)

**Files:**
- Modify: `src/pages/[category]/[slug].astro` (Base bg + scoped `<style>` colour/shadow swaps)
- Modify: `src/pages/404.astro` (Base bg to ink + any light-only colours)

**Interfaces:** none.

The page keeps its structure and its per-discipline `--accent`. Only the canvas and element colours/shadows flip to the dark idiom used by `[category].astro`.

- [ ] **Step 1: Switch the slug page canvas to dark**

In `src/pages/[category]/[slug].astro`, change the Base tag from `bg="paper"` to `bg="ink"`:

```astro
<Base title={`${title} — Caleb Lim`} bg="ink" description={context}>
```

- [ ] **Step 2: Flip the scoped styles to the dark idiom**

Apply these exact swaps in the `<style>` block. Each is selector → property: from → to. Anything not listed (layout, spacing, radii, the accent on `--header rule`/`.pq-mark`/`.outcome-label`) stays unchanged.

| Selector | Change |
|---|---|
| `.b-cat-back` | Replace the whole rule with the dark back-pill from `[category].astro` (lines 130-149): `background: var(--paper); color: var(--ink);` and its shadow `inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(10,10,10,0.18), 0 10px 24px -16px rgba(0,0,0,0.6)`. Keep the existing hover (accent bg, paper text) and `:focus-visible { outline: 3px solid var(--paper) }`. |
| `.detail h1` | `color: var(--ink)` → `color: var(--paper)` |
| `.meta-disc, .meta-year, .meta-dot` | `color: var(--ink)` → `color: var(--paper)` (keep `opacity: 0.6`) |
| `.deliverable` | `background: color-mix(in oklab, var(--paper) 80%, #ffffff)` → `background: rgba(242, 235, 219, 0.06)`; `color: var(--ink)` → `color: var(--paper)`; shadow → `inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px -10px rgba(0,0,0,0.6)` |
| `.label` | `color: var(--ink)` → `color: var(--paper)` (keep `opacity: 0.6`) |
| `.narrative p` and `.narrative p.lead` | `color: var(--ink)` → `color: var(--paper)` |
| `.pull-quote p` | `color: var(--ink)` → `color: var(--paper)` (`.pq-mark` stays `var(--accent)`) |
| `.outcome-band` | `background: color-mix(in oklab, var(--paper) 88%, #ffffff)` → `background: rgba(242, 235, 219, 0.05)`; shadow → `inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 36px -22px rgba(0,0,0,0.7)` |
| `.outcome-band p` | `color: var(--ink)` → `color: var(--paper)` (`.outcome-label` stays accent) |
| `.full-pdf-link a` | `color: var(--ink)` → `color: var(--paper)` (hover accent stays) |
| `.detail-pager` | `border-top: 1px solid var(--ink)` → `border-top: 1px solid rgba(242, 235, 219, 0.14)` |
| `.pager-dir`, `.pager-title` | `color: var(--ink)` → `color: var(--paper)` (hover accent stays) |

- [ ] **Step 3: Dark the 404 page**

In `src/pages/404.astro`, set the Base background to `bg="ink"` and swap any explicit `color: var(--ink)` on text to `var(--paper)` and any light surface to the dark idiom, matching the above. (Read the file first; apply the minimal swaps so the 404 reads on ink.)

- [ ] **Step 4: Build + verify dark**

Run: `cd ~/projects/personal-website && npm run build 2>&1 | grep -E 'Complete|error' | head` — clean.
Run: `grep -o 'data-bg="ink"\|bg-ink\|"ink"' dist/design/design-real-piece/index.html | head` (confirm the ink canvas marker that Base emits — inspect Base.astro to know the exact marker, then grep for it).
Then Playwright screenshot `/design/design-real-piece` and `/saas/saas-real-piece` at desktop: confirm dark canvas, paper text, design=ochre and saas=sage accents intact, outcome band reads as a lighter raised panel (not darker than canvas), no element darker than the bg.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/personal-website
git add "src/pages/[category]/[slug].astro" src/pages/404.astro
git commit -m "feat: dark theme for case-study pages and 404, accents preserved"
```

---

### Task 3: PieceCarousel component

**Files:**
- Create: `src/components/PieceCarousel.astro`

**Interfaces:**
- Produces: `<PieceCarousel pieces={CollectionEntry<'pieces'>[]} accent={string} theme={'dark'|'light'} label?={string} />`. Renders nothing when `pieces` is empty. Static (no controls, no auto-advance) at exactly 1 piece; rotating coverflow at 2+.

- [ ] **Step 1: Write the component**

Create `src/components/PieceCarousel.astro` with exactly this content:

```astro
---
// Coverflow carousel: the centered piece is enlarged and named; neighbors are
// scaled down and dimmed. Auto-advances every 3s (paused on hover/focus, stopped
// under reduced motion). Each item is a link to the piece. Graceful 1..N: empty
// renders nothing, a single piece renders centered and static.
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

interface Props {
  pieces: CollectionEntry<'pieces'>[];
  accent: string;
  theme?: 'dark' | 'light';
  label?: string;
}
const { pieces, accent, theme = 'dark', label } = Astro.props;
const multi = pieces.length > 1;
---
{pieces.length > 0 && (
  <section
    class:list={['pc', `pc--${theme}`]}
    style={`--accent: ${accent}`}
    data-pc
    aria-roledescription="carousel"
    aria-label={label ?? 'Selected work'}
  >
    {label && <span class="pc-eyebrow">{label}</span>}
    <div class="pc-viewport">
      <ul class="pc-track" data-pc-track>
        {pieces.map((p, i) => (
          <li class="pc-slide">
            <a
              class="pc-item"
              href={`/${p.data.category}/${p.id}`}
              data-pc-item
              aria-current={i === 0 ? 'true' : 'false'}
              aria-label={`View ${p.data.title}`}
            >
              <figure class="pc-fig">
                <Image
                  src={p.data.hero}
                  alt={p.data.title}
                  class="pc-cover"
                  widths={[300, 600]}
                  sizes="(max-width: 700px) 62vw, 320px"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </figure>
              <span class="pc-name">{p.data.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
    {multi && (
      <div class="pc-controls">
        <button class="pc-arrow" type="button" data-pc-prev aria-label="Previous piece">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <ul class="pc-dots" data-pc-dots>
          {pieces.map((p, i) => (
            <li><button class="pc-dot" type="button" data-pc-dot={i} aria-current={i === 0 ? 'true' : 'false'} aria-label={`Show ${p.data.title}`}></button></li>
          ))}
        </ul>
        <button class="pc-arrow" type="button" data-pc-next aria-label="Next piece">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    )}
  </section>
)}

<style>
  .pc { display: flex; flex-direction: column; gap: var(--sp-5); margin: var(--sp-8) 0; }
  .pc-eyebrow {
    font-family: var(--mono); font-size: var(--fs-mono); font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; text-align: center;
    color: var(--paper); opacity: 0.6;
  }
  .pc--light .pc-eyebrow { color: var(--ink); }
  .pc-viewport { width: 100%; overflow: hidden; }
  .pc-track {
    display: flex; gap: var(--sp-5); padding: var(--sp-4) 0; list-style: none; margin: 0;
    transition: transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1); will-change: transform;
  }
  .pc-slide { flex: 0 0 auto; list-style: none; }
  .pc-item {
    display: flex; flex-direction: column; gap: var(--sp-3); align-items: center;
    width: clamp(190px, 42vw, 320px); text-decoration: none; color: var(--paper);
    opacity: 0.45; transform: scale(0.82);
    transition: transform 0.45s ease, opacity 0.45s ease;
  }
  .pc--light .pc-item { color: var(--ink); }
  .pc-item[aria-current="true"] { opacity: 1; transform: scale(1); }
  .pc-fig {
    margin: 0; width: 100%; aspect-ratio: 4 / 3; border-radius: 16px; overflow: hidden;
    background: rgba(0, 0, 0, 0.25);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 40px -24px rgba(0,0,0,0.7);
  }
  .pc--light .pc-fig {
    background: rgba(0, 0, 0, 0.06);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 18px 38px -24px rgba(10,10,10,0.4);
  }
  .pc-item[aria-current="true"] .pc-fig {
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 60px -26px rgba(0,0,0,0.85);
  }
  .pc--light .pc-item[aria-current="true"] .pc-fig {
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 30px 56px -26px rgba(10,10,10,0.5);
  }
  .pc-cover { width: 100%; height: 100%; object-fit: cover; }
  .pc-name {
    font-family: var(--sans); font-weight: 700; font-size: var(--fs-ttl);
    line-height: 1.1; letter-spacing: -0.01em; text-align: center;
    opacity: 0; transition: opacity 0.45s ease; max-width: 30ch;
  }
  .pc-item[aria-current="true"] .pc-name { opacity: 1; }
  .pc-controls { display: flex; align-items: center; justify-content: center; gap: var(--sp-4); }
  .pc-arrow {
    width: 40px; height: 40px; border-radius: 999px; border: none; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; padding: 0;
    font-size: var(--fs-ttl); color: var(--paper);
    background: rgba(242, 235, 219, 0.06);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 22px -14px rgba(0,0,0,0.7);
    transition: background 0.2s ease, transform 0.16s ease;
  }
  .pc--light .pc-arrow {
    color: var(--ink);
    background: color-mix(in oklab, var(--paper) 80%, #ffffff);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 22px -14px rgba(10,10,10,0.4);
  }
  .pc-arrow svg { width: 1em; height: 1em; }
  .pc-arrow:active { transform: scale(0.94); }
  @media (hover: hover) and (pointer: fine) {
    .pc-arrow:hover { background: rgba(242, 235, 219, 0.12); }
    .pc--light .pc-arrow:hover { background: color-mix(in oklab, var(--paper) 65%, #ffffff); }
  }
  .pc-arrow:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .pc-dots { display: flex; align-items: center; gap: var(--sp-2); list-style: none; margin: 0; }
  .pc-dot {
    width: 24px; height: 24px; padding: 0; border: none; background: transparent;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  }
  .pc-dot::before {
    content: ""; width: 8px; height: 8px; border-radius: 50%;
    background: rgba(242, 235, 219, 0.35); transition: background 0.2s ease, transform 0.2s ease;
  }
  .pc--light .pc-dot::before { background: rgba(10, 10, 10, 0.3); }
  .pc-dot[aria-current="true"]::before { background: var(--accent); transform: scale(1.25); }
  .pc-dot:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 50%; }
  @media (prefers-reduced-motion: reduce) {
    .pc-track, .pc-item, .pc-name, .pc-arrow, .pc-dot::before { transition: none; }
  }
  @media (max-width: 700px) {
    .pc-item { width: clamp(150px, 62vw, 240px); }
  }
</style>

<script>
  function initPc(root) {
    const viewport = root.querySelector('.pc-viewport');
    const track = root.querySelector('[data-pc-track]');
    const slides = Array.from(root.querySelectorAll('.pc-slide'));
    const items = Array.from(root.querySelectorAll('[data-pc-item]'));
    const dots = Array.from(root.querySelectorAll('[data-pc-dot]'));
    const prev = root.querySelector('[data-pc-prev]');
    const next = root.querySelector('[data-pc-next]');
    const count = slides.length;
    if (count === 0) return;
    let active = 0;
    let timer = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    function render() {
      const slide = slides[active];
      const offset = viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2);
      track.style.transform = `translateX(${offset}px)`;
      items.forEach((it, i) => it.setAttribute('aria-current', i === active ? 'true' : 'false'));
      dots.forEach((d, i) => d.setAttribute('aria-current', i === active ? 'true' : 'false'));
    }
    function go(i) { active = (i % count + count) % count; render(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!reduce.matches && count > 1) timer = setInterval(() => go(active + 1), 3000); }

    if (prev) prev.addEventListener('click', () => { go(active - 1); start(); });
    if (next) next.addEventListener('click', () => { go(active + 1); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));
    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    window.addEventListener('resize', render);
    if (reduce.addEventListener) reduce.addEventListener('change', start);

    requestAnimationFrame(() => { render(); start(); });
  }
  document.querySelectorAll('[data-pc]').forEach(initPc);
</script>
```

- [ ] **Step 2: Build + isolated visual check**

Temporarily render it on a populated page to verify (use the splash integration in Task 5, or a scratch route). At minimum: `npm run build` clean, no `astro check` error referencing the component. Then in Task 4/5 do the real visual check.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/personal-website
git add src/components/PieceCarousel.astro
git commit -m "feat: PieceCarousel coverflow component (auto-rotate, center highlight, a11y, reduced-motion)"
```

---

### Task 4: Carousel on category pages (current room, dark)

**Files:**
- Modify: `src/pages/[category].astro`

**Interfaces:** Consumes `PieceCarousel` from Task 3.

Render the carousel above the kept `FeaturedPiece` ONLY when the room has 2+ pieces (with 1 piece the carousel would just duplicate the featured card, so it is skipped).

- [ ] **Step 1: Import and render**

Add `import PieceCarousel from '../components/PieceCarousel.astro';` to the frontmatter imports.

In the `n >= 2` branch (currently lines 103-108), render the carousel above the featured + gallery:

```astro
    ) : (
      <>
        <PieceCarousel pieces={pieces} accent={accent} theme="dark" label="Browse this room" />
        <FeaturedPiece piece={pieces[0]} category={category} />
        <Gallery pieces={pieces.slice(1)} category={category} />
      </>
    )}
```

(The `n === 1` branch is unchanged — featured only, no carousel.)

- [ ] **Step 2: Build + verify**

`npm run build` clean. Since no category currently has 2+ non-draft pieces, this path is logically verified (no live render yet). Confirm the import resolves and the single-piece rooms still render featured-only: grep `dist/design/index.html` for `feat-ttl` present and `data-pc` absent.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/personal-website
git add "src/pages/[category].astro"
git commit -m "feat: rotating carousel above featured work on multi-piece category pages"
```

---

### Task 5: Carousel on the splash (all pieces, light)

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:** Consumes `PieceCarousel` from Task 3.

- [ ] **Step 1: Gather all non-draft pieces and render the band**

In `src/pages/index.astro` frontmatter, add:

```astro
import { getCollection } from 'astro:content';
import PieceCarousel from '../components/PieceCarousel.astro';
const allPieces = (await getCollection('pieces', ({ data }) => data.draft !== true))
  .sort((a, b) => a.data.order - b.data.order);
```

(If `getCollection` is already imported, do not duplicate it.)

Place the carousel as its own band BELOW the existing hero/cards composition and ABOVE the footer line, so it never competes with the name + discipline picker (the <30s primary read). Use the splash's interactive accent and the light theme:

```astro
    <PieceCarousel pieces={allPieces} accent="var(--terracotta)" theme="light" label="A look at the work" />
```

Place it inside the splash container so it inherits the page max-width. Read `index.astro` first to find the correct insertion point (after the `.b-splash` hero/cards block, before any closing footer content).

- [ ] **Step 2: Build + visual verify**

`npm run build` clean. Dev server + Playwright on `/` at desktop and mobile:
- Carousel shows all non-draft pieces (2 today), center one enlarged with its name visible, the others dimmed/smaller.
- Auto-advances after ~3s; pause on hover; prev/next + dots work; clicking a piece navigates.
- Light theme reads on the cream splash (ink text, raised cards lighter via white-inset shadow), one accent (terracotta) only on the active dot.
- Mobile: peeks on each side, no horizontal scroll, the picker still dominates the top.
- Reduced-motion (emulate): auto-advance stops, manual controls still work.

- [ ] **Step 3: Commit + push**

```bash
cd ~/projects/personal-website
git add src/pages/index.astro
git commit -m "feat: all-work rotating carousel band on the splash"
git push origin main
```

---

## Self-Review

**Spec coverage:** dark slug pages + 404 (spec §1) → Task 2; remove /01 (spec §2) → Task 1; carousel component (spec §3) → Task 3; placements splash + category (spec §4) → Tasks 5 + 4. ✓

**Anti-vibecode:** one accent per view (accent confined to dot/ring + existing accent moments); dark surfaces lighter than canvas (rgba paper panels); soft diffuse shadows (negative spread); no side stripes; sentence-case eyebrows ("Browse this room", "A look at the work"); no em dashes; full interactive states + focus-visible on arrows/dots; reduced-motion stops auto-advance; Feather-style single-family chevrons sized 1em. ✓

**Placeholder scan:** Task 2 Step 3/4 and Task 5 Step 1 say "read the file first" for insertion points/markers that depend on unseen file content (404 colours, Base ink marker, splash insertion point) — these are genuine read-then-apply steps, not vague requirements; the change to make is specified. ✓

**Type/name consistency:** `PieceCarousel` props (`pieces`, `accent`, `theme`, `label`) identical across Tasks 3/4/5. Carousel class names consistent between markup, styles, and the script's selectors (`data-pc`, `data-pc-track`, `data-pc-item`, `data-pc-prev/next`, `data-pc-dot`, `.pc-slide`, `.pc-viewport`). ✓

**Known content caveat:** with 1 piece per room today, Task 4's carousel never renders live (needs 2+); only the splash carousel (2 pieces) is visible now. Documented, intended.
