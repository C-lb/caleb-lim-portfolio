# Tier 1 Recruiter Conversion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first 30 seconds land for a recruiter — category pages that look deliberate at any piece count, a home that signposts which room maps to which role, and link previews that render a real card.

**Architecture:** A new `FeaturedPiece.astro` gives the marquee (or sole) piece an image-beside-text treatment; `Gallery.astro` switches from a fixed 12-col span grid to a centered auto-fit grid so any tail count fills without empty gutters; `[category].astro` branches the body by piece count `n` (0 → redeemed stub, 1 → featured only, ≥2 → featured lead + gallery tail). The home gets a positioning line plus a per-discipline role lens. `Base.astro` gains Open Graph / Twitter meta driven by props, with a single static OG image.

**Tech Stack:** Astro 5 content collections, scoped `.astro` component styles, existing CSS token sheet (`src/styles/tokens.css`), Playwright (visual check + one-time OG image capture), `verify-build.sh` + `verify-anti-ai-tells.sh` smoke gates. No unit-test harness exists in this repo; verification is build + grep-over-`dist/` + visual.

## Global Constraints

- **Pragmatic anti-vibecode.** Keep editorial UPPERCASE display headers and one accent per discipline room. Apply anti-vibecode mechanics to every new/changed element: soft diffuse shadows (no hard slabs), no side accent stripes, one accent fill per view, 2:1 button padding, full interactive state set (`:hover` / `:active` / `:focus-visible`), 4px spacing scale only.
- **Type already unified:** `--sans` / `--serif` / `--mono` all resolve to "DM Sans Variable". Do not reintroduce a serif face.
- **Tokens only.** Pull every colour, space, radius, and size from `src/styles/tokens.css`. No new one-off hex or px values in new CSS. Accents: design `#8c6326`, finance(cobalt) `#8ba1a9`, personal(acid) `#dc972a`, saas(plum) `#536644` — but always via `DISCIPLINE_ACCENT[category]` / `--accent`, never hard-coded.
- **Copy rules.** No em dashes anywhere. Sentence case for body and eyebrows (the UPPERCASE category `h2` is the one deliberate exception). Banned filler phrases that trip `verify-build.sh`: `passionate`, `multidisciplinary`, `intersection of`. The literal substring `PLACEHOLDER` must not appear in non-draft piece content.
- **Route contract.** All four `/[category]` routes are emitted (populated or not). Do not change `getStaticPaths` in `[category].astro`.
- **Verification gates (must pass before deploy):** `npm run build` succeeds, `npm run test:smoke` exits 0, `npm run verify:anti-ai` exits 0.
- **Deploy:** push to `main` → Vercel auto-deploys. No staging gate; verify locally first.
- **Production origin (confirm):** OG absolute URLs need `site` in `astro.config.mjs`. Default to `https://caleb-lim-portfolio.vercel.app`; if a custom domain is live, use that instead. This is the one value to confirm with the owner.

---

### Task 1: FeaturedPiece component

A large, deliberate treatment for the marquee or sole piece: hero image beside title / role / context / outcome, the whole card linking to the piece page. Used by `[category].astro` for `n === 1` (alone) and `n >= 2` (as the lead).

**Files:**
- Create: `src/components/FeaturedPiece.astro`
- Test: build + visual (`/design` after Task 3 wires it; in isolation, render check via grep on a temporary harness is not needed — verify through Task 3).

**Interfaces:**
- Consumes: a `pieces` collection entry (`CollectionEntry<'pieces'>`) with required fields `title`, `role`, `context`, `outcome`, `hero` (image), and `id`; the `category` (`Category`) for the link and accent.
- Produces: `<FeaturedPiece piece={entry} category={cat} />` — a self-contained `<a class="feat">` linking to `/${category}/${entry.id}`. No exported JS.

- [ ] **Step 1: Write the component**

Create `src/components/FeaturedPiece.astro`:

```astro
---
// Marquee / sole-piece treatment. Hero image beside the piece's context so a
// recruiter reads the whole story without a click, while the empty-column
// problem of a single grid tile disappears. Whole card links to the piece.
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import type { Category } from '../content/categories';
import { DISCIPLINE_ACCENT } from '../styles/disciplines';

interface Props {
  piece: CollectionEntry<'pieces'>;
  category: Category;
}
const { piece, category } = Astro.props;
const accent = DISCIPLINE_ACCENT[category];
const { title, role, context, outcome, hero } = piece.data;
---
<a
  href={`/${category}/${piece.id}`}
  class="feat"
  style={`--accent: ${accent}`}
  aria-label={`View ${title}`}
>
  <div class="feat-thumb">
    <Image
      src={hero}
      alt={title}
      class="feat-cover"
      priority
      widths={[640, 960]}
      sizes="(max-width: 900px) 100vw, 560px"
    />
  </div>
  <div class="feat-body">
    <span class="feat-eyebrow">Featured work</span>
    <h3 class="feat-ttl">{title}</h3>
    <p class="feat-role">{role}</p>
    <dl class="feat-cr">
      <div><dt>Context</dt><dd>{context}</dd></div>
      <div><dt>Outcome</dt><dd>{outcome}</dd></div>
    </dl>
    <span class="feat-cue">View piece →</span>
  </div>
</a>

<style>
  /* Raised neutral card on the dark category canvas — soft shadow, no stroke,
     no side accent. Accent appears only on the eyebrow + cue (one identity mark). */
  .feat {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: var(--sp-6);
    align-items: stretch;
    margin-top: var(--sp-6);
    border-radius: 20px;
    overflow: hidden;
    text-decoration: none;
    color: var(--paper);
    background: rgba(242, 235, 219, 0.05);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 24px 56px -30px rgba(0, 0, 0, 0.75);
    transition: transform 0.22s ease, box-shadow 0.22s ease;
  }
  .feat-thumb {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.25);
  }
  .feat-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.35s ease;
  }
  .feat-body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    padding: var(--sp-6) var(--sp-6) var(--sp-6) 0;
  }
  .feat-eyebrow {
    font-family: var(--mono);
    font-size: var(--fs-mono);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .feat-ttl {
    font-family: var(--sans);
    font-weight: 800;
    font-size: var(--fs-h3);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .feat-role {
    font-style: italic;
    font-size: var(--fs-body);
    line-height: var(--lh-bio);
    opacity: 0.82;
    margin: 0;
  }
  .feat-cr {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    margin: var(--sp-2) 0 0;
  }
  .feat-cr dt {
    font-family: var(--mono);
    font-size: var(--fs-mono);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.6;
    margin-bottom: 2px;
  }
  .feat-cr dd {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-bio);
    opacity: 0.88;
    max-width: 46ch;
  }
  .feat-cue {
    margin-top: auto;
    padding-top: var(--sp-4);
    font-family: var(--mono);
    font-size: var(--fs-card-no);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.75;
  }
  @media (hover: hover) and (pointer: fine) {
    .feat:hover {
      transform: translateY(-3px);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 32px 64px -28px rgba(0, 0, 0, 0.85);
    }
    .feat:hover .feat-cover { transform: scale(1.03); }
  }
  .feat:focus-visible {
    outline: 3px solid var(--paper);
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    .feat, .feat-cover { transition: none; }
  }
  /* Stack on tablet/phone — image on top, body below, with more vertical air. */
  @media (max-width: 900px) {
    .feat { grid-template-columns: 1fr; gap: var(--sp-4); }
    .feat-body { padding: 0 var(--sp-5) var(--sp-5); gap: var(--sp-4); }
  }
</style>
```

- [ ] **Step 2: Typecheck the component compiles**

Run: `npx astro check 2>&1 | tail -20`
Expected: no errors referencing `FeaturedPiece.astro`. (Pre-existing unrelated warnings elsewhere are acceptable; a clean run is ideal.)

- [ ] **Step 3: Commit**

```bash
git add src/components/FeaturedPiece.astro
git commit -m "feat: FeaturedPiece component for marquee/sole piece

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Gallery centered auto-fit grid

Switch `Gallery.astro` from a fixed 12-col / span-4 grid (which leaves empty gutters when the tail has 1 or 2 cards) to a centered auto-fit grid that fills cleanly at any count.

**Files:**
- Modify: `src/components/Gallery.astro:44-53` (the `.gallery` rule and the `> li` span rule) and `:137-144` (the responsive overrides).

**Interfaces:**
- Consumes: unchanged props `{ pieces, category }`.
- Produces: same markup; only the grid CSS changes. Cards self-size between 260px and 360px and the track is centered.

- [ ] **Step 1: Replace the grid rule**

In `src/components/Gallery.astro`, replace lines 45-53:

```css
  .gallery {
    margin-top: var(--sp-6);
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--sp-5);
    list-style: none;
    padding: 0;
  }
  .gallery > li { grid-column: span 4; min-width: 0; }
```

with:

```css
  .gallery {
    margin-top: var(--sp-6);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 360px));
    justify-content: center;
    gap: var(--sp-5);
    list-style: none;
    padding: 0;
  }
  .gallery > li { min-width: 0; }
```

- [ ] **Step 2: Replace the responsive overrides**

Replace lines 137-144 (the `@media (max-width: 1024px)` and `@media (max-width: 600px)` blocks):

```css
  /* Tablet: 2 across. Phone: 1 across. */
  @media (max-width: 1024px) {
    .gallery > li { grid-column: span 6; }
  }
  @media (max-width: 600px) {
    .gallery { gap: var(--sp-4); }
    .gallery > li { grid-column: span 12; }
  }
```

with:

```css
  /* Phone: tighten gap, let cards stretch full-width. */
  @media (max-width: 600px) {
    .gallery {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--sp-4);
    }
  }
```

- [ ] **Step 3: Build and verify no empty-gutter layout for a small tail**

Run: `npm run build && npx serve dist -l 4399 >/dev/null 2>&1 &` then check `/design` renders the gallery centered. (Design is `n === 1` so after Task 3 it uses FeaturedPiece, not Gallery; for this task verify the Gallery CSS compiles and the existing multi-piece path is unaffected.)
Run: `npm run build`
Expected: build succeeds, no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Gallery.astro
git commit -m "refactor: Gallery centered auto-fit grid, no empty gutters

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Count-aware category page + redeemed stub

Branch the `[category].astro` body by piece count and rewrite the empty-room copy so it reads as deliberate, not unfinished.

**Files:**
- Modify: `src/pages/[category].astro` — imports (add `FeaturedPiece`), the body block (lines 79-96), and the coming-soon copy strings (lines 50-55, 80-82).

**Interfaces:**
- Consumes: `FeaturedPiece` from Task 1, `Gallery` (existing), `pieces` (already sorted by `order`), `n = pieces.length`.
- Produces: rendered category pages — `/design`, `/finance`, `/saas` (n=1) show a FeaturedPiece; `/personal` (n=0) shows the redeemed stub.

- [ ] **Step 1: Add the FeaturedPiece import**

In `src/pages/[category].astro`, after line 7 (`import DisciplineNav ...`), add:

```astro
import FeaturedPiece from '../components/FeaturedPiece.astro';
```

- [ ] **Step 2: Replace the body branch**

Replace lines 79-96 (the `{isEmpty ? (...) : (<Gallery .../>)}` block) with:

```astro
    {n === 0 ? (
      <div class="b-coming">
        <p class="b-coming-lead">{comingSoonLead[category]}</p>
        <p class="b-coming-blurb">{comingSoonBlurb[category]}</p>
        {readyCategories.length > 0 && (
          <div class="b-coming-ready">
            <span class="b-coming-ready-label">Work that's ready now</span>
            <div class="b-coming-links">
              {readyCategories.map((c) => (
                <a class="b-coming-link" href={`/${c}`}>{readyLabel[c]} →</a>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : n === 1 ? (
      <FeaturedPiece piece={pieces[0]} category={category} />
    ) : (
      <>
        <FeaturedPiece piece={pieces[0]} category={category} />
        <Gallery pieces={pieces.slice(1)} category={category} />
      </>
    )}
```

- [ ] **Step 3: Redeem the empty-room copy**

Replace the `comingSoonBlurb` block (lines 50-55) with a deliberate lead + blurb pair (sentence case, no em dashes):

```astro
// Empty-room copy. Reads as a deliberate, honest note plus a strong push to the
// rooms that have work — not "still being hung" (which reads unfinished).
const comingSoonLead: Record<Category, string> = {
  design:    'No graphic design pieces are posted here yet.',
  finance:   'No financial models are posted here yet.',
  personal:  'Personal projects are not posted here yet.',
  saas: 'No SaaS work is posted here yet.',
};
const comingSoonBlurb: Record<Category, string> = {
  design:    'The work that is up lives in the other rooms. Start there.',
  finance:   'The work that is up lives in the other rooms. Start there.',
  personal:  'Side projects and experiments that do not fit a brief. The posted work lives in the other rooms.',
  saas: 'The work that is up lives in the other rooms. Start there.',
};
```

Also delete the now-unused `.b-coming-blurb` reference to the old single string is not needed — the `b-coming-lead` element already exists in the template (line 81) and now reads from `comingSoonLead`. Confirm the template references `comingSoonLead[category]` and `comingSoonBlurb[category]` (Step 2 already does).

- [ ] **Step 4: Build and verify each category**

Run:

```bash
npm run build
grep -l 'class="feat"' dist/design/index.html dist/finance/index.html dist/saas/index.html
grep -c 'class="feat"' dist/personal/index.html
grep -o 'Work that.s ready now' dist/personal/index.html
```

Expected: the three populated categories each contain `class="feat"`; `dist/personal/index.html` has `0` occurrences of `class="feat"` and contains the redeemed-stub "Work that's ready now" block.

- [ ] **Step 5: Visual check**

Start dev (`npm run dev`), screenshot `/design` and `/personal` with Playwright at desktop width.
Expected: `/design` shows one wide featured card filling the column (image + context/outcome), no empty right gutter. `/personal` shows the redeemed stub with links to the populated rooms, no dead "coming soon / being hung" phrasing.

- [ ] **Step 6: Smoke gate**

Run: `npm run build && npm run test:smoke`
Expected: exit 0. (Watch the Context/Role/Outcome and route-contract gates — they should stay green.)

- [ ] **Step 7: Commit**

```bash
git add src/pages/[category].astro
git commit -m "feat: count-aware category layout + redeemed empty-room stub

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Home signposting

Make the four rooms map to four kinds of role, and replace the vibe-only About copy with a plain positioning line.

**Files:**
- Modify: `src/pages/index.astro:137` (the About-Me `<p>`).
- Modify: `src/components/DisciplineCard.astro:20-28` (add a role-lens line) and its `<div class="b-card-mid">` block (line 71-73) plus a small style rule.

**Interfaces:**
- Consumes: nothing new.
- Produces: a per-discipline `lens` string rendered under the card name; a sharper home positioning paragraph.

- [ ] **Step 1: Add the role lens to DisciplineCard data**

In `src/components/DisciplineCard.astro`, after the `cardLabel` map (line 25), add:

```astro
// One-line role lens so a recruiter maps each room to the kind of role it
// speaks to. Sentence case, no em dashes, no banned filler.
const cardLens: Record<Category, string> = {
  design:    'Brand systems and visual identity',
  finance:   'Models, analysis, and the numbers',
  personal:  'Range, side projects, and play',
  saas: 'Product thinking and building',
};
```

- [ ] **Step 2: Render the lens under the name**

Replace the `b-card-mid` block (lines 71-73):

```astro
  <div class="b-card-mid">
    <span class="b-card-name">{cardLabel[category]}</span>
  </div>
```

with:

```astro
  <div class="b-card-mid">
    <span class="b-card-name">{cardLabel[category]}</span>
    <span class="b-card-lens">{cardLens[category]}</span>
  </div>
```

- [ ] **Step 3: Style the lens line**

In the same file's `<style>` block, add (place near the `.b-card-name` rule):

```css
  .b-card-lens {
    display: block;
    margin-top: var(--sp-1);
    font-size: var(--fs-tile-role);
    line-height: 1.3;
    letter-spacing: -0.005em;
    color: var(--paper);
    opacity: 0.68;
  }
```

- [ ] **Step 4: Sharpen the home positioning copy**

In `src/pages/index.astro`, replace the About-Me paragraph (line 137) with:

```astro
        <p>Four lanes: brand and design, financial models, product, and side projects. Pick the room that matches the role you are hiring for. If something fits, come say hi.</p>
```

- [ ] **Step 5: Build and verify copy**

Run:

```bash
npm run build
grep -o 'Brand systems and visual identity' dist/index.html
grep -o 'Pick the room that matches' dist/index.html
grep -c '—' dist/index.html
```

Expected: the lens line and the positioning line are present in `dist/index.html`; the em-dash count is `0` (no em dashes introduced).

- [ ] **Step 6: Anti-AI-tells gate**

Run: `npm run verify:anti-ai`
Expected: exit 0 (no banned filler in the new copy).

- [ ] **Step 7: Visual check**

Screenshot `/` at desktop and mobile widths.
Expected: each discipline card shows the role lens under its name; the About card reads as a plain positioning line. No layout overflow on mobile.

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.astro src/components/DisciplineCard.astro
git commit -m "feat: signpost rooms to roles + plain home positioning copy

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Open Graph / share preview

Per-page OG + Twitter meta so a pasted link renders a titled card with an image, plus one static OG image.

**Files:**
- Modify: `astro.config.mjs` (add `site`).
- Modify: `src/layouts/Base.astro:17-21` (add `description` + `ogImage` props) and `:26-32` (inject meta into `<head>`).
- Modify: `src/pages/index.astro`, `src/pages/[category].astro`, `src/pages/[category]/[slug].astro`, `src/pages/about.astro` — pass a `description` to `<Base>`.
- Create: `public/og-default.png` (1200x630), generated once via Playwright.

**Interfaces:**
- Consumes: `Astro.site` (from config) to build the absolute image URL.
- Produces: `<Base title description ogImage>` — `description` (string, optional) and `ogImage` (string path, optional, defaults to `/og-default.png`).

- [ ] **Step 1: Set the site origin**

Replace `astro.config.mjs` (repo root) contents with:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Absolute URLs for OG/Twitter image tags. Update to the custom domain when
  // one is connected; default is the Vercel project domain.
  site: 'https://caleb-lim-portfolio.vercel.app',
});
```

- [ ] **Step 2: Extend Base props**

In `src/layouts/Base.astro`, replace the Props interface and destructure (lines 17-22):

```astro
interface Props {
  title: string;
  bg?: 'paper' | 'ink';
  description?: string;
  ogImage?: string;
}
const { title, bg = 'paper', description, ogImage = '/og-default.png' } = Astro.props;
const isHome = Astro.url.pathname === '/';
const desc = description ?? 'Caleb Lim — work across brand and design, financial models, product, and side projects.';
const ogUrl = Astro.site ? new URL(ogImage, Astro.site).href : ogImage;
const canonical = Astro.site ? new URL(Astro.url.pathname, Astro.site).href : Astro.url.pathname;
```

- [ ] **Step 3: Inject meta into the head**

In the same file, replace the `<head>` block (lines 26-32) with:

```astro
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={desc} />
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={desc} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogUrl} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={desc} />
    <meta name="twitter:image" content={ogUrl} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" as="font" type="font/woff2" href={dmSansDisplay} crossorigin="anonymous" />
  </head>
```

- [ ] **Step 4: Pass descriptions from pages**

- `src/pages/index.astro`: in the `<Base ...>` opening tag, add `description="Caleb Lim — pick the room that matches the role you are hiring for: brand and design, financial models, product, or side projects."`.
- `src/pages/[category].astro` (line 67): change to `<Base title={`${categoryTabTitle[category]} — Caleb Lim`} bg="ink" description={`${categoryTabTitle[category]} by Caleb Lim.`}>`.
- `src/pages/[category]/[slug].astro`: pass `description={piece.data.context}` (or the piece title + role) to its `<Base>` tag. Read the file first to match its existing `<Base>` call shape.
- `src/pages/about.astro`: pass a one-line `description` about who Caleb is. Read the file first to match its `<Base>` call shape.

- [ ] **Step 5: Generate the static OG image**

Create a throwaway HTML in the scratchpad that renders a 1200x630 card using DM Sans (via Google Fonts) on the paper background with the name and positioning line, then screenshot it with Playwright into `public/og-default.png`.

Scratchpad file `og-source.html`:

```html
<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0}
  .card{width:1200px;height:630px;background:#f2ebdb;color:#0a0a0a;
    font-family:"DM Sans",sans-serif;display:flex;flex-direction:column;
    justify-content:center;padding:96px;box-sizing:border-box}
  .eyebrow{font-size:24px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8c6326}
  .name{font-size:148px;font-weight:800;line-height:.9;letter-spacing:-.04em;margin:24px 0 0}
  .tag{font-size:32px;line-height:1.3;opacity:.8;margin:40px 0 0;max-width:60ch}
</style></head>
<body><div class="card">
  <span class="eyebrow">Portfolio</span>
  <h1 class="name">CALEB LIM</h1>
  <p class="tag">Brand and design, financial models, product, and side projects.</p>
</div></body></html>
```

Then with Playwright: navigate to the `file://` path, resize the viewport to 1200x630, screenshot the `.card` element, and save the result to `public/og-default.png`. Verify it is a 1200x630 PNG:

```bash
file public/og-default.png
npx sharp-cli --version >/dev/null 2>&1 || true   # optional
node -e "const s=require('sharp');s('public/og-default.png').metadata().then(m=>console.log(m.width,m.height))"
```

Expected: `1200 630`.

- [ ] **Step 6: Build and verify meta**

Run:

```bash
npm run build
grep -o 'og:image" content="[^"]*"' dist/index.html | head -1
grep -o 'og:title" content="[^"]*"' dist/design/index.html | head -1
test -f dist/og-default.png && echo "og image copied"
```

Expected: `og:image` resolves to an absolute `https://.../og-default.png` URL; the design page carries its own `og:title`; `dist/og-default.png` exists.

- [ ] **Step 7: Smoke + anti-AI gates**

Run: `npm run test:smoke && npm run verify:anti-ai`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add astro.config.mjs src/layouts/Base.astro src/pages public/og-default.png
git commit -m "feat: per-page OG/Twitter meta + static share image

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Full verification and deploy

**Files:** none changed — verification + ship.

- [ ] **Step 1: Clean build**

Run: `rm -rf dist && npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 2: All gates**

Run: `npm run test:smoke && npm run verify:anti-ai`
Expected: both exit 0.

- [ ] **Step 3: Anti-vibecode self-check**

Manually verify against the non-negotiables for every new/changed surface (FeaturedPiece, gallery grid, discipline lens, stub, OG): one accent fill per view, soft diffuse shadows only, no side accent stripe, 4px-scale spacing, full interactive states, no em dashes. Fix any miss before shipping.

- [ ] **Step 4: Visual regression sweep**

Screenshot `/`, `/design`, `/finance`, `/saas`, `/personal` at desktop and mobile.
Expected: no empty-column category pages, role lenses present on home, redeemed stub on `/personal`, nothing overflows on mobile.

- [ ] **Step 5: Push to main (deploys to Vercel)**

```bash
git push origin main
```

- [ ] **Step 6: Confirm deploy**

After Vercel finishes, paste the production URL into a link-preview validator (or a LinkedIn DM composer) and confirm the OG card renders with title + image.

---

## Self-Review

**Spec coverage:**
- A. Count-aware category layout → Tasks 1, 2, 3. ✓
- B. Above-the-fold signposting → Task 4. ✓
- C. Share/credibility plumbing → Task 5 (OG meta + image); resume/contact one-click is verified in Task 6 Step 4 (no rebuild needed — already in Base nav). ✓
- D. Anti-vibecode mechanics → folded into each task's CSS + Task 6 Step 3 self-check. ✓
- Empty room redeemed → Task 3 Step 3. ✓
- Non-goals (case-study pages, filling personal, motion/dark mode, per-piece OG) → untouched. ✓

**Type consistency:** `FeaturedPiece` props `{ piece, category }` are produced in Task 1 and consumed identically in Task 3. `Gallery` props unchanged. `Base` new props `description` / `ogImage` defined in Task 5 Step 2 and consumed in Step 4. `cardLens` defined and rendered in Task 4. Consistent.

**Placeholder scan:** No "TBD"/"TODO"/"handle edge cases" steps; every code step carries full code. The two pages whose `<Base>` shape I have not read (`[category]/[slug].astro`, `about.astro`) are explicitly flagged in Task 5 Step 4 to "read the file first" before editing — that is a real instruction, not a placeholder.

**Open item to confirm with owner:** production origin for `site` (Task 5 Step 1) — defaulted to the Vercel domain.
