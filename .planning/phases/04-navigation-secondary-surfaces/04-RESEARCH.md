# Phase 4: Navigation & Secondary Surfaces — Research

**Researched:** 2026-05-15
**Domain:** Astro 5 navigation chrome / static prev-next within filtered content collection / a11y of persistent header
**Confidence:** HIGH (codebase patterns verified by file read; library facts verified vs Astro 5 docs and existing Phase 3 ship)

<user_constraints>
## User Constraints (locked facts from spawning context)

### Locked Decisions
- **mailto address:** `caleblimster@gmail.com`
- **LinkedIn URL:** `https://linkedin.com/in/caleblkr`
- **Calendly:** SKIPPED — do not include scheduler links in the About contact block, even though `CONTACT-05` text in `REQUIREMENTS.md` reads "email + LinkedIn + optional Calendly"
- **Resume PDF path:** `/caleb-lim-resume.pdf` (already in `public/`; About page download already wired in Phase 3 — `src/pages/about.astro:23`)
- **Phase 3 design tokens are LOCKED.** Header chrome MUST consume existing `var(--accent)`, `var(--paper)`, `var(--ink)`, `var(--mono)`, `var(--serif)`, `var(--fs-mono)`, `var(--sp-*)`. No new tokens added in Phase 4.
- **SPIDR split: by Interface — 3 plans.** Plan 1 = header chrome in `Base.astro`. Plan 2 = detail-page prev/next + back link. Plan 3 = About contact block.

### Claude's Discretion
- `?subject=` prefill on the mailto link (recommendation below).
- Whether prev/next wraps at category edges or hides (recommendation below).
- Whether to introduce an `<ExternalLink>` component or inline raw `<a target="_blank">` (recommendation below).
- Whether to land a skip-to-content link in Phase 4 or defer to Phase 5 (recommendation below).
- aria-current strategy on the home/logo link.
- Whether the "Resume" header link reads as plain text or carries a small download glyph.

### Deferred Ideas (OUT OF SCOPE)
- Calendly embed → `FUTURE-01`, v2.
- Mobile hamburger pattern — Success Criterion 1 says "visible without a hamburger on desktop ≥768px". Phase 5 owns mobile collapse and the hamburger decision if needed.
- View Transitions on prev/next navigation (MOTION-01, v2).
- Footer expansion (curated tour, social, etc.) — Phase 3 already shipped the three-cell footer; Phase 4 leaves it alone.
- Lighthouse score targets, real-device walk → Phase 5 (FOUND-01/02/03).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIECE-05 | Detail page footer carries prev/next navigation within the same discipline plus a "Back to [Category]" link | §"Prev/Next Pattern (Hand-Rolled)" + §"Back link mechanics". Back link is already shipped in Phase 3 (see Pitfall P-2); prev/next is net-new. |
| CONTACT-03 | mailto link is in the header on every page | §"Header Chrome Wiring" — slots into existing `<nav aria-label="primary">` placeholder in `Base.astro:31` |
| CONTACT-04 | LinkedIn link is in the header or footer on every page | §"Header Chrome Wiring" — header is the right surface (matches CONTACT-03 placement; footer is already typographically committed) |
| CONTACT-05 | About page hosts a slightly larger contact block (email + LinkedIn; Calendly SKIPPED per user) | §"About contact block layout" |
</phase_requirements>

## Summary

Phase 4 wires the **persistent navigation chrome a recruiter expects** onto a Phase 3 site that currently ships with placeholder slots already cut. The header in `src/layouts/Base.astro` has a literal HTML comment (`<!-- Phase 4 wires mailto / LinkedIn / Resume here -->`) inside `<nav aria-label="primary">`; Phase 3 deliberately left the grid slot reserved (`min-width: 1px`) so Phase 4 can drop three `<a>` tags in without touching the layout grid. The detail page (`src/pages/[category]/[slug].astro`) already renders a "← graphic / design" back-pill via Phase 3's `.b-cat-back` class — the **back link half of PIECE-05 already ships** — and only prev/next is net-new code. The About page has a working resume download but no contact rows yet.

The technical risk is low. There is **one mildly tricky bit**: prev/next must be **scoped to the same discipline** with no cross-discipline jumps, must use the same sort key the gallery uses (`order: number` ascending — confirmed in `src/pages/[category].astro:25`), and Astro 5's built-in `paginate()` helper does NOT fit this shape (it's for `/page/[n]` listing pages, not for "given current piece, who's neighbour-in-collection-filter"). The idiomatic Astro pattern is a hand-rolled `findIndex` inside `getStaticPaths`, returning `prev` and `next` as `props` so each detail route gets its neighbours baked in at build time — zero client JS.

**Primary recommendation:** Ship the header chrome plan first (smallest risk, unblocks the visible-on-every-page contract), then prev/next (the only plan with non-trivial logic), then the About contact block (pure markup against existing styles).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Header chrome (mailto/LinkedIn/Resume) | Astro layout (build-time HTML) | — | Static `<a>` tags. No JS, no API. Lives in `Base.astro` so every route inherits. |
| Prev/next within discipline | Astro build-time (`getStaticPaths`) | — | Neighbours computed at build time from the same collection the gallery already sorts. Passed as static `props` to each detail route. Zero runtime cost. |
| Back-to-category link | Astro template (per-route render) | — | Already shipped in Phase 3 — current `category` field on the piece composes the href as `/${category}`. No state, no referrer. |
| About contact block | Astro template (markup) | — | Pure HTML inside `src/pages/about.astro`. No data layer. |
| External-link safety (`rel="noopener noreferrer"`) | Astro template (per-link) | Build-time verification (grep in `verify-build.sh`) | Inline attributes are the standard. The verification is what catches drift. |
| mailto deliverability | Out-of-band (human walk) | — | No code can prove the recipient received the test mail. Not automatable. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.18.1 (installed; see `package.json:21`) | Static site framework; `getStaticPaths`, content collections, scoped CSS | Already the stack. No additions. |
| `astro:content` `getCollection` | bundled with Astro 5 | Read pieces collection at build time | Already in use at `src/pages/[category].astro:23` + `[category]/[slug].astro:12`. Phase 4 reuses the exact filter+sort idiom. |

### Supporting
None. Phase 4 adds zero dependencies. **No new npm install.**

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `findIndex` for prev/next | Astro's built-in `paginate()` helper | `paginate()` builds `/page/[n]` listing routes from one source array. It does NOT compute neighbour-in-array for a different route shape like `/[category]/[slug]`. Wrong tool. [VERIFIED: Astro 5 routing docs, "Pagination" section — `paginate()` returns `{params, props: {page: {data, url: {prev, next}}}}` where `data` is the page slice, not the neighbours of a specific item.] |
| Reading `Astro.url.pathname` referrer on the back link | Hardcode `/${category}` | Referrer-based requires JS, fragile across direct-link entry (LinkedIn share, recruiter pasted URL). Hardcoded is simpler, works without JS, already shipped. |
| `<ExternalLink>` component wrapper | Raw `<a target="_blank" rel="noopener noreferrer">` | At 2 external links (LinkedIn header + LinkedIn About block), a component is over-abstraction. **Inline raw `<a>` with the safe-attribute trio.** Verification is by grep in `verify-build.sh`, not by component boundary. |
| New `Header.astro` component extracted from `Base.astro` | Edit `Base.astro` in place | Phase 3 already inlined the topbar markup in `Base.astro`. Three more links don't justify extraction. Keep the layout monolithic until it actually hurts. |

**Installation:**
```bash
# Phase 4 installs nothing.
```

**Version verification:** Astro 5.18.1 confirmed in `package.json:21`. [VERIFIED: file read 2026-05-15]

## Architecture Patterns

### System Architecture Diagram

```
                                    Static build (Astro)
                                    ────────────────────
       src/content/pieces/*.md   →   getCollection('pieces')   →   sort by order
                                            │
                                            ├──► [category].astro   ──►  /[category]/index.html
                                            │
                                            └──► [category]/[slug].astro
                                                      │
                                                      │  getStaticPaths {
                                                      │     for each piece P:
                                                      │       neighbours = same-category siblings sorted by order
                                                      │       idx = neighbours.findIndex(P)
                                                      │       prev = neighbours[idx-1] ?? null
                                                      │       next = neighbours[idx+1] ?? null
                                                      │       emit { params, props: {piece, prev, next} }
                                                      │  }
                                                      ▼
                                                /[category]/[slug]/index.html
                                                  • header (Base.astro)         ← CONTACT-03/04
                                                      ├ logo/name → /
                                                      ├ mailto:caleblimster@…
                                                      ├ linkedin.com/in/caleblkr (new tab)
                                                      └ /caleb-lim-resume.pdf (download)
                                                  • detail header
                                                      └ ← back-pill (PIECE-05 partial — already shipped)
                                                  • hero + CRO + paginated PDF (unchanged)
                                                  • detail footer (new)         ← PIECE-05
                                                      ├ ← prev   (hidden if null)
                                                      └ next →   (hidden if null)

       src/pages/about.astro  ──►  /about/index.html
                                       └ contact block (new)                    ← CONTACT-05
                                            ├ caleblimster@…    (mailto)
                                            └ linkedin.com/in/caleblkr (new tab)
```

### Component Responsibilities

| File | Owns | Phase 4 Changes |
|------|------|-----------------|
| `src/layouts/Base.astro` | Topbar + footer chrome on every page | Replace `<!-- Phase 4 wires … -->` comment with three `<a>` tags inside the existing `<nav aria-label="primary">`. Add `home` link wrap on the `.brand` span. |
| `src/pages/[category]/[slug].astro` | Detail page render + `getStaticPaths` | Extend `getStaticPaths` to compute prev/next per piece. Add detail-footer markup + `Props` interface entries `prev?: NeighbourRef \| null`, `next?: NeighbourRef \| null`. Back-pill stays as is. |
| `src/pages/about.astro` | About bio + resume download | Add a contact block (email + LinkedIn) below the resume paragraph. Reuse existing typography (`.about p a` underline pattern). |
| `scripts/verify-build.sh` | Phase 1–3 build smoke gates | Append Phase 4 gates (Gates 19–22 — link presence + `rel` regex + external-link safety + prev/next presence on detail pages). |

### Pattern 1: Header Chrome Wiring

**What:** Three inline `<a>` tags inside the existing `<nav aria-label="primary">` slot. Plus wrap the existing `<span class="brand">caleb lim</span>` in an anchor to splash so the logo doubles as a home link.

**When to use:** Every page that extends `Base.astro` (i.e., all of them).

**Example:**
```astro
---
// src/layouts/Base.astro (edits only — full file already present)
const home = Astro.url.pathname === '/';
---
<header class="topbar">
  {/* Logo / wordmark as home link. aria-current on splash, omitted elsewhere. */}
  <a
    href="/"
    class="brand"
    aria-current={home ? 'page' : undefined}
  >caleb lim</a>

  <StatusPill />

  <nav aria-label="primary">
    <a href="mailto:caleblimster@gmail.com" class="nav-link">email</a>
    <a
      href="https://linkedin.com/in/caleblkr"
      target="_blank"
      rel="noopener noreferrer"
      class="nav-link"
    >linkedin</a>
    <a href="/caleb-lim-resume.pdf" download class="nav-link">resume</a>
  </nav>
</header>
```

Notes:
- `aria-current="page"` ONLY on the brand link, ONLY when current path is `/`. Don't emit `aria-current="false"` — omit the attribute on non-splash pages. [CITED: WAI-ARIA 1.2 spec, `aria-current` values — `false` is the implicit default and should not be set explicitly.]
- The mailto link does not need `target="_blank"` — it hands off to the user's mail client, which is its own UX surface. Adding `target="_blank"` opens a blank tab for the mail-client launch and leaves a dead tab behind. **Plain `href="mailto:…"` only.**
- `rel="noopener noreferrer"` on the LinkedIn link is the canonical recipe. `noopener` blocks the new tab from calling back into the opener via `window.opener` (tabnabbing vector). `noreferrer` strips the `Referer` header on the outbound nav (privacy hygiene; arguably belt-and-braces but it's the documented pair). [CITED: developer.mozilla.org `<a>` rel values]
- The Resume link is **same-origin**, so it gets no `target` / `rel` attributes. `download` is the only attribute needed; the browser's default save-as kicks in on click. This already works correctly on the About page (verified via `src/pages/about.astro:23`).

**Styling:** Reuse the `.topbar nav` flex container Phase 3 shipped. Add a single new selector for the link itself, but keep it minimal — mono, uppercase, ink black, hover → `var(--accent)` is already wired by `.topbar nav a:hover` at `Base.astro:72`.

```css
/* Append to Base.astro <style>. */
.topbar nav .nav-link {
  font-family: var(--mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.1em;
  text-transform: lowercase;     /* matches the .brand wordmark tone */
  font-weight: 600;
  color: inherit;                /* inherit from body — paper on ink pages, ink on paper */
  text-decoration: none;
  padding: 4px 0;                /* small vertical hit-area buffer (still not 44px — Phase 5 owns that) */
}
.topbar nav .nav-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
/* a[aria-current="page"] dims the brand to signal "you are here" without changing the click target */
.topbar .brand[aria-current="page"] {
  opacity: 0.6;
  pointer-events: none;          /* the link still works for screen readers via the href; mouse no-op avoids gratuitous nav */
}
```

Tap-target note: Phase 4 ships padding `4px 0` — that gives the link an `~19px` effective height (mono is `--fs-mono: 11px` + 8px vertical). **This is < 44px and Phase 5 will need to fix it.** Document that here so Phase 5 doesn't have to rediscover. It's NOT a Phase 4 SC failure — SC1 only requires visibility, not WCAG tap-target size.

### Pattern 2: Prev/Next Pattern (Hand-Rolled, build-time)

**What:** Extend `getStaticPaths()` in `src/pages/[category]/[slug].astro` so each emitted route carries its left/right neighbours within the **same category** as static props.

**When to use:** Detail routes that need cross-route navigation scoped to a filter.

**Example:**
```astro
---
// src/pages/[category]/[slug].astro — getStaticPaths extension
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { CATEGORIES, type Category } from '../../content/categories';

type Piece = CollectionEntry<'pieces'>;
interface NeighbourRef {
  slug: string;
  category: Category;
  title: string;
}

export async function getStaticPaths() {
  const all = await getCollection('pieces', ({ data }) => data.draft !== true);

  // Group by category and sort each group by `order` ascending — same key the gallery uses
  // (src/pages/[category].astro:25). MUST stay in sync or prev/next will diverge from gallery order.
  const byCategory: Record<string, Piece[]> = {};
  for (const cat of CATEGORIES) {
    byCategory[cat] = all
      .filter((p) => p.data.category === cat)
      .sort((a, b) => a.data.order - b.data.order);
  }

  return all.flatMap((piece) => {
    const siblings = byCategory[piece.data.category];
    const idx = siblings.findIndex((p) => p.id === piece.id);
    const prevPiece = idx > 0 ? siblings[idx - 1] : null;
    const nextPiece = idx < siblings.length - 1 ? siblings[idx + 1] : null;

    const toRef = (p: Piece | null): NeighbourRef | null =>
      p ? { slug: p.id, category: p.data.category as Category, title: p.data.title } : null;

    return [{
      params: { category: piece.data.category, slug: piece.id },
      props: { piece, prev: toRef(prevPiece), next: toRef(nextPiece) },
    }];
  });
}

interface Props {
  piece: Piece;
  prev: NeighbourRef | null;
  next: NeighbourRef | null;
}
const { piece, prev, next } = Astro.props;
---

{/* … existing hero + CRO + paginated PDF + fullPdf link … */}

{/* PIECE-05 detail footer — prev/next within same discipline, hidden at edges */}
{(prev || next) && (
  <nav class="detail-pager" aria-label="other pieces in this discipline">
    {prev ? (
      <a class="pager-link prev" href={`/${prev.category}/${prev.slug}`} rel="prev">
        <span class="pager-dir">← previous</span>
        <span class="pager-title">{prev.title}</span>
      </a>
    ) : <span />}
    {next ? (
      <a class="pager-link next" href={`/${next.category}/${next.slug}`} rel="next">
        <span class="pager-dir">next →</span>
        <span class="pager-title">{next.title}</span>
      </a>
    ) : <span />}
  </nav>
)}
```

Key facts about this pattern:
- **`piece.id` is the slug** under the Astro 5 `glob` loader. Already proven at `[category]/[slug].astro:14` (`slug: piece.id`). [VERIFIED: codebase read 2026-05-15.]
- **Sort key is `order` ascending**, same as the gallery. Caleb's content workflow assigns `order: 1, 2, 3, …` per piece — verified in `design-real-piece/index.md:4`, `marketing-real-piece/index.md:4`, `finance-real-piece/index.md:4`. **If the gallery's sort ever changes, prev/next must move with it.** Codify by importing a shared `sortPieces` helper (see Pitfall P-1).
- **Edge handling: hide at edges.** Single-piece category → both `prev` and `next` are `null`, the whole `<nav>` doesn't render. First piece → `prev` slot is empty. **No wrapping.** Recruiter expectation on a curated portfolio is "I'm at the boundary" not "I just teleported back to piece 1"; the back-pill already provides the bail-out route. [ASSUMED — this is a UX call, not a technical claim. Open question O-1.]
- The `<span />` empty placeholders in the JSX preserve the two-column flex layout when one side is absent so the remaining link aligns left/right correctly. Alternative: drop the placeholder and use `justify-content: space-between` with `:only-child` rules. Either works; the empty span is more explicit.
- `rel="prev"` / `rel="next"` on the anchors is the standard sequenced-content hint. Older SEO guidance suggested `<link rel="prev">` in `<head>`; Google deprecated that in 2019. The `rel` on the body anchor is still semantically correct (HTML5 link relations) and harmless. [CITED: developer.mozilla.org `<a>` rel values, "prev" / "next".]

### Pattern 3: External link safety (raw `<a>`, no component)

**What:** Every outbound `<a>` (non-mailto, non-tel, non-same-origin) MUST carry `target="_blank" rel="noopener noreferrer"`. Phase 4 has exactly two such links: LinkedIn in header, LinkedIn in About contact block.

**When to use:** Any anchor whose `href` starts with `http://` or `https://` AND doesn't match the deployed origin.

**Example:**
```astro
<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">linkedin</a>
```

Notes:
- Astro doesn't auto-add `rel="noopener"`; raw output. No `set:html` issues — these are static string attributes in `.astro` templates, not user-supplied HTML.
- **Verification belongs in `verify-build.sh`**, not in a wrapper component. New Gate 20 (proposed below) greps every `dist/**/*.html` for `target="_blank"` and asserts each occurrence is on a line that also contains `rel="noopener noreferrer"` (order-insensitive within the same `<a>`). This catches the case where someone adds an outbound link later and forgets the rel attributes.

### Pattern 4: About contact block layout

**What:** Add two rows below the existing `.resume-link` paragraph in `src/pages/about.astro`. Match the inline-underlined link pattern Phase 3 shipped at `.about p a`.

**When to use:** Only on `/about` (CONTACT-05).

**Example:**
```astro
{/* about.astro — append after the .resume-link paragraph */}
<section class="contact" aria-labelledby="contact-h">
  <h2 id="contact-h">Get in touch</h2>
  <ul class="contact-list">
    <li>
      <span class="label">email</span>
      <a href="mailto:caleblimster@gmail.com">caleblimster@gmail.com</a>
    </li>
    <li>
      <span class="label">linkedin</span>
      <a
        href="https://linkedin.com/in/caleblkr"
        target="_blank"
        rel="noopener noreferrer"
      >linkedin.com/in/caleblkr</a>
    </li>
  </ul>
</section>
```

```css
/* About scoped style additions */
.contact { display: flex; flex-direction: column; gap: var(--sp-4); margin-top: var(--sp-5); }
.contact h2 {
  font-family: var(--mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--ink);
  opacity: 0.6;
  margin: 0;
}
.contact-list { display: flex; flex-direction: column; gap: var(--sp-2); }
.contact-list li { display: grid; grid-template-columns: 100px 1fr; gap: var(--sp-4); align-items: baseline; }
.contact-list .label {
  font-family: var(--mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--ink);
  opacity: 0.6;
}
.contact-list a {
  font-family: var(--serif);
  font-size: var(--fs-body);
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
.contact-list a:hover { color: var(--terracotta); }
.contact-list a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

@media (max-width: 600px) {
  .contact-list li { grid-template-columns: 1fr; gap: var(--sp-1); }
}
```

The mono uppercase `email` / `linkedin` labels mirror the CRO label pattern from `[category]/[slug].astro:164–172` — same typographic vocabulary, no new variant introduced.

### Anti-Patterns to Avoid

- **`?subject=` prefill on the mailto link.** Adds friction (subject in mail composer is presumptuous about why they're writing), and a hand-crafted "Inquiry from caleblim.com" reads canned. Plain mailto is correct. **Recommendation: no subject prefill.**
- **`window.opener.location` rebind on outbound clicks.** This is what `noopener` blocks. Don't reinvent it.
- **JS-driven referrer-based back-link.** Recruiter may arrive directly via LinkedIn share / pasted URL — no referrer. Hardcoded `/${category}` is correct and ships in Phase 3.
- **Cross-discipline prev/next.** Caleb's pieces are a curated set; "next" jumping from Finance to Design breaks the recruiter's self-selected lane. Strict per-category scope. (Codified in SC2.)
- **Building a `<ExternalLink>` component for two links.** Premature abstraction. Inline `<a>` + a grep gate covers it.
- **Adding new design tokens.** Phase 3 locked the palette. If the prev/next pager needs a separator color, reuse `var(--ink)` or `var(--accent)` at `opacity: 0.4`.
- **Modifying the back-pill.** `.b-cat-back` ships in Phase 3 at `[category]/[slug].astro:114` and `about.astro:36`. Phase 4 must NOT restyle it.
- **Touching the StatusPill or footer.** Out of scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Read collection at build time | Custom file walker | `getCollection('pieces')` | Already in use; respects the Zod schema; returns typed entries. |
| Per-category sort | Re-sorting in three places | Single shared `sortByOrder` helper imported by `[category].astro` and `[category]/[slug].astro` | Codifies Pitfall P-1. |
| External-link safety | `<ExternalLink>` component | Inline `<a target="_blank" rel="noopener noreferrer">` + `verify-build.sh` grep | At 2 links the wrapper is over-abstraction. |
| Smooth scroll on prev/next click | Custom scroll-into-view | Default browser nav | The page is a fresh route; no need to scroll-restore. |

**Key insight:** Phase 4 is **markup + one build-time loop**. Anything more elaborate is over-engineering. The entire phase fits in ~80 lines of new code across three files.

## Runtime State Inventory

> **Skipped — Phase 4 is a code-only addition. No data migrations, no stored state, no external services touched.**

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by file inspection. Pieces collection is markdown-on-disk, sorted at build time. No databases. | — |
| Live service config | None — Cloudflare Pages serves static files; no API tokens or webhook configs change. | — |
| OS-registered state | None — no scheduled jobs, no system services. | — |
| Secrets/env vars | None — mailto + LinkedIn URL are public strings, embedded in HTML. Not secrets. | — |
| Build artifacts | None — Phase 4 doesn't change `scripts/pdf-preprocess.mjs` or any generated output. No stale egg-info equivalents. | — |

## Environment Availability

> **Skipped — Phase 4 has no external dependencies beyond what Phase 1–3 already require (Node 20+, npm, Astro 5).** All present and verified in the running environment per `package.json:21` + the prior 5/7 Phase 2 plans shipping.

## Common Pitfalls

### Pitfall P-1: Gallery sort and prev/next sort drift out of sync
**What goes wrong:** Gallery sorts by `data.order` ascending (`[category].astro:25`). If prev/next sorts by anything else — `id`, filename, `data.date` someone adds later — the order in the pager doesn't match the order the recruiter saw in the gallery. They click "next" and land on a piece that wasn't visually next.
**Why it happens:** The two sorts live in different files; nobody enforces parity.
**How to avoid:** Extract a single `sortPieces` (or inline `(a, b) => a.data.order - b.data.order`) helper that both files import. OR: leave both inline but add a one-line comment in `[category]/[slug].astro`'s `getStaticPaths` that points at `[category].astro:25` and says "MUST match." The latter is cheaper; the former is more enforceable.
**Warning signs:** Recruiter feedback "the next button skipped a piece" or "the order is weird." Caught by Gate 22 (proposed below): for each category gallery's first piece, follow `next` recursively and assert the resulting DOM order matches the gallery's tile order.

### Pitfall P-2: Re-shipping the back-pill from scratch
**What goes wrong:** The detail-page back-pill (`← graphic / design` etc.) is **already shipped** in Phase 3 at `src/pages/[category]/[slug].astro:42–48` (the `backLabel` const) + `:52` (the `<a>`) + `:114–136` (the `.b-cat-back` CSS). PIECE-05 wording ("plus a 'Back to [Category]' link") might tempt a planner to add a SECOND back link in the detail footer.
**Why it happens:** Requirement text and existing code drift.
**How to avoid:** PIECE-05 has TWO halves: (a) prev/next — net-new in Phase 4; (b) back-to-category — **already in production, do not duplicate.** Phase 4 plan must explicitly call this out so a task doesn't get auto-generated for it. The verification just confirms the existing back-pill is still present after prev/next is added.
**Warning signs:** A plan task titled "Add Back to [Category] link to detail footer" — that link already exists in the detail header.

### Pitfall P-3: `pieces.length === 1` category breaks prev/next layout
**What goes wrong:** Personal Projects can have 1 piece at launch (or 0, in which case the gallery route doesn't exist — Phase 3 D-07). For a 1-piece category, both `prev` and `next` are `null`. The detail-pager `<nav>` skips rendering entirely. **Fine** if you wrap the whole `<nav>` in `{(prev || next) && …}`. **Broken** if you render the `<nav>` unconditionally with two empty `<span>`s and the CSS draws a divider line that goes nowhere.
**Why it happens:** Skipping the empty-state case in initial implementation.
**How to avoid:** The outer conditional `{(prev || next) && (<nav …>…</nav>)}` is mandatory. Verified in Pattern 2 above.
**Warning signs:** Empty nav landmark, screen reader announces "navigation — other pieces in this discipline" with no content.

### Pitfall P-4: `aria-current="false"` instead of omitting the attribute
**What goes wrong:** Some templates emit `aria-current={isHome}` which renders `aria-current="false"` on non-home pages. The WAI-ARIA spec treats `false` as valid but explicitly recommends omitting the attribute when it doesn't apply.
**Why it happens:** Naive boolean-to-attribute mapping.
**How to avoid:** `aria-current={home ? 'page' : undefined}` — Astro drops attributes whose value is `undefined`. Pattern 1 above does this correctly.
**Warning signs:** Outputs contain `aria-current="false"`. Screen readers may announce "not current" gratuitously.

### Pitfall P-5: `download` attribute on cross-origin URL silently ignored
**What goes wrong:** Browsers ignore the `download` attribute when the link points to a cross-origin URL (CORS-aware mitigation). Link still works; just doesn't force-download — it navigates or previews.
**Why it happens:** This bites if someone changes the resume path to a CDN later.
**How to avoid:** Keep `/caleb-lim-resume.pdf` same-origin (already in `public/`). [CITED: developer.mozilla.org `<a download>` — "this attribute only works for same-origin URLs."]
**Warning signs:** Recruiter clicks "Resume" and gets a PDF preview tab instead of a download. Not a Phase 4 regression but a future trap to flag.

### Pitfall P-6: Forgetting `noreferrer` on outbound `target="_blank"` (tabnabbing)
**What goes wrong:** Without `rel="noopener"`, the newly-opened tab can call `window.opener.location = "phishing.com"` and redirect the original tab while the user is on LinkedIn. **`noopener` is the security half**; `noreferrer` is the privacy half. Together they're the canonical pair.
**Why it happens:** People add `target="_blank"` without thinking about the security implications, or copy patterns from old tutorials that only show `noopener`.
**How to avoid:** Always emit both. Codified by Gate 20 (grep).
**Warning signs:** A code review surfaces a `target="_blank"` without `rel="noopener noreferrer"`. Recent Chrome/Safari mitigate tabnabbing by default by treating cross-origin `target="_blank"` as implicit `noopener` — but defense in depth wins, and the rel attributes also fix the `Referer` privacy leak which the implicit behavior does NOT cover. [CITED: developer.mozilla.org `<a target>` and `rel` — Chrome 88+/Firefox 79+/Safari 12.1+ set implicit noopener, but explicit attributes remain best practice.]

### Pitfall P-7: `noopener noreferrer` ordering / typo
**What goes wrong:** `rel` is a space-separated token list. `rel="noopener,noreferrer"` (with comma) is **wrong** — browsers do not parse commas. `rel="noopener noreferrer"` is correct.
**Why it happens:** Copy-paste from CSS class strings.
**How to avoid:** Gate 20's regex looks for `rel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"` OR the reverse order. Both tokens must be present, order-insensitive. Comma-separated will fail the gate.
**Warning signs:** Gate 20 fails on a link that "looks right" to a human reviewer.

### Pitfall P-8: Mailto link visited-state changes color
**What goes wrong:** Browsers track `mailto:` links in `:visited` state. Default `:visited` styling is purple in some browsers, which fights the Phase 3 palette.
**Why it happens:** Browser default UA stylesheet.
**How to avoid:** Phase 3's existing `a { color: inherit; }` reset at `tokens.css:56` already suppresses this for all anchors. Verified — no Phase 4 action needed, just don't override it.
**Warning signs:** Header `email` link reads visited-purple on subsequent loads.

## Code Examples

### Computing prev/next within filtered collection (verified pattern)

```astro
---
// Idiomatic Astro 5 — getStaticPaths attaches static props per route
// Source: Astro 5 routing docs + existing project pattern at [category].astro:23–25
export async function getStaticPaths() {
  const all = await getCollection('pieces', ({ data }) => data.draft !== true);
  const byCat: Record<string, typeof all> = {};
  for (const cat of CATEGORIES) {
    byCat[cat] = all
      .filter((p) => p.data.category === cat)
      .sort((a, b) => a.data.order - b.data.order);
  }
  return all.map((piece) => {
    const sibs = byCat[piece.data.category];
    const i = sibs.findIndex((s) => s.id === piece.id);
    return {
      params: { category: piece.data.category, slug: piece.id },
      props: {
        piece,
        prev: i > 0 ? sibs[i - 1] : null,
        next: i < sibs.length - 1 ? sibs[i + 1] : null,
      },
    };
  });
}
---
```
[VERIFIED: pattern matches Astro 5 routing docs (`getStaticPaths` returns `{params, props}`); `glob` loader exposes `piece.id` as slug, confirmed by `[category]/[slug].astro:14`.]

### External-link safety inline (preferred over wrapper component)

```astro
<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">linkedin</a>
```
[CITED: developer.mozilla.org `<a>` rel values — `noopener` + `noreferrer` is the canonical pair.]

### aria-current on persistent home link

```astro
---
const home = Astro.url.pathname === '/';
---
<a href="/" aria-current={home ? 'page' : undefined}>caleb lim</a>
```
[CITED: WAI-ARIA 1.2 `aria-current` — valid values are `page | step | location | date | time | true | false`; spec recommends omitting on non-current.]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<link rel="prev"/"next">` in `<head>` for SEO | `rel="prev"/"next"` on body `<a>` only (HTML5 link relations); no head pairing | Google deprecated head-form 2019 | Don't add to `<head>`. Use on the pager anchors as semantic metadata only. |
| Manual `window.opener=null` polyfill | `rel="noopener noreferrer"` declarative | ~2018 universal | Phase 4 uses declarative. |
| `target="_blank"` without rel | Browsers (Chrome 88+/FF 79+/Safari 12.1+) treat cross-origin blank-target as implicit noopener | 2020–2021 | **Don't rely on the implicit.** Explicit attributes also fix the referrer leak and survive same-origin edge cases. |
| `paginate()` for in-collection prev/next | Hand-rolled `findIndex` in `getStaticPaths` | N/A — `paginate()` was always the wrong tool for this; common confusion | The Astro docs example for `paginate()` is for `/blog/page/1` style listings. Detail-page prev/next is a different shape. |

**Deprecated/outdated:**
- Document-head `<link rel="prev/next">`: Google deprecated as a ranking signal in 2019. Some tutorials still recommend it; ignore.

## Project Constraints (from CLAUDE.md)

The actionable directives from `./CLAUDE.md` Phase 4 must honor:

- **Stack is Astro 5 + content collections + Cloudflare Pages.** Phase 4 adds zero dependencies — no new npm packages.
- **No Tailwind.** Stay on plain CSS + custom properties from `tokens.css`. (Phase 3 D-17.)
- **No `framer-motion`** package; if motion is added, use `motion` (`motion/react`). Phase 4 adds no motion.
- **No Inter.** Type system is Bricolage Grotesque + Fraunces + JetBrains Mono. Phase 4 must consume `var(--sans)`, `var(--serif)`, `var(--mono)`.
- **No shadcn defaults, no bento grid, no lucide icons.** Phase 4 adds no UI primitives at all.
- **GSD workflow enforcement.** Phase 4 must run through `/gsd-execute-phase 4` — no direct edits outside the workflow.
- **Anti-AI-tell checklist is the exit gate inheritance.** Phase 3 shipped `ANTI-AI-CHECKLIST.md` and `scripts/verify-anti-ai-tells.sh`. Phase 4's additions must NOT regress these (no new "Inter" reference, no centered hero with gradient, no purple gradient, no `lucide-*` install).

## Validation Architecture

> Phase config has `workflow.nyquist_validation: true` — this section is mandatory. [VERIFIED: `.planning/config.json`.]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Bash + Astro static-build inspection (`scripts/verify-build.sh`) + grep + xmllint-style HTML asserts. **No unit-test framework installed** — Phase 3 verified everything against `dist/`. Phase 4 inherits this. |
| Config file | `scripts/verify-build.sh` (Gates 1–18 currently green for Phase 1–3). |
| Quick run command | `bash scripts/verify-build.sh` — runs against pre-existing `dist/`. |
| Full suite command | `npm run build && bash scripts/verify-build.sh && bash scripts/verify-anti-ai-tells.sh` |
| New gates introduced by Phase 4 | Gates 19–22 (proposed below) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CONTACT-03 | mailto link present on every page (`<a href="mailto:caleblimster@gmail.com">` in `<header>`) | static HTML grep | `bash scripts/verify-build.sh` (new Gate 19a) | Wave 0 — extend `verify-build.sh` |
| CONTACT-04 | LinkedIn link present on every page with `target="_blank" rel="noopener noreferrer"` | static HTML grep + regex | `bash scripts/verify-build.sh` (new Gate 19b + Gate 20) | Wave 0 — extend `verify-build.sh` |
| CONTACT-03/04 (corollary) | logo/name link to `/` present on every page | static HTML grep | `bash scripts/verify-build.sh` (new Gate 19c) | Wave 0 |
| CONTACT-01 reinforcement | Resume link present in header on every page (`<a href="/caleb-lim-resume.pdf" download>`) | static HTML grep | `bash scripts/verify-build.sh` (new Gate 19d) | Wave 0 |
| PIECE-05 (prev/next half) | Every detail page renders prev/next `<nav>` OR (if at edge) renders only one side OR (if single-piece category) renders neither | static HTML inspection per detail page + cross-check against piece count | `bash scripts/verify-build.sh` (new Gate 21) | Wave 0 |
| PIECE-05 (back link half) | Every detail page has back-pill `<a href="/${category}">` | static HTML grep | already green via Phase 3; new Gate 21b asserts presence to lock against regression | Wave 0 |
| PIECE-05 (no cross-discipline) | prev/next `href` always starts with the current piece's category prefix | href substring check per detail page | `bash scripts/verify-build.sh` (new Gate 21c) | Wave 0 |
| PIECE-05 (gallery-order parity) | For each populated category, prev/next chain from gallery's first piece matches gallery tile order | static walk: load `dist/<cat>/index.html`, extract piece-link order, follow `next` from `dist/<cat>/<first-slug>/index.html` and assert sequence | `bash scripts/verify-build.sh` (new Gate 22) | Wave 0 |
| CONTACT-05 | About page contains email + LinkedIn anchor with correct hrefs in `<main>`/`<article>` scope | static HTML grep on `dist/about/index.html` | `bash scripts/verify-build.sh` (new Gate 19e) | Wave 0 |
| SC4 (external-link safety audit) | Every `target="_blank"` co-occurs with `rel="noopener noreferrer"` (order-insensitive) site-wide | regex over `dist/**/*.html` | `bash scripts/verify-build.sh` (new Gate 20) | Wave 0 |
| SC4 (mailto deliverability) | Test email from a different account arrives in Caleb's inbox | manual human walk | **NOT AUTOMATABLE** — Caleb walks this once during phase verification | n/a |
| a11y posture (per Phase 5 hand-off) | `<nav aria-label>` landmarks distinct; `aria-current` valid; no `aria-current="false"` | grep + regex | `bash scripts/verify-build.sh` (new Gate 19f) | Wave 0 |

### Sampling Rate

- **Per task commit:** `bash scripts/verify-build.sh` (runs in seconds — pure shell + grep against pre-built `dist/`)
- **Per wave merge:** `npm run build && bash scripts/verify-build.sh && bash scripts/verify-anti-ai-tells.sh` (full rebuild + both gate scripts)
- **Phase gate:** Full suite green AND the manual mailto-delivery walk completed AND screenshot evidence of header chrome on splash + one gallery + one detail + about (4 routes minimum) attached to phase summary.

### Wave 0 Gaps

- [ ] `scripts/verify-build.sh` — append Gates 19a/19b/19c/19d/19e/19f, Gate 20, Gate 21a/21b/21c, Gate 22 (one file edit, ~120 new lines of bash). Reuses the existing `for cat in design finance personal marketing` and `find $DIST -mindepth 3 -name index.html` idioms already in the script.
- [ ] **Manual checklist entry** for "mailto delivery confirmed by Caleb from a different account on YYYY-MM-DD" — append to `.planning/phases/04-navigation-secondary-surfaces/04-VERIFICATION.md` when verifier runs.
- [ ] **No new framework needed.** Existing infrastructure covers Phase 4 in full.

Gate sketch (for the planner — not the final implementation):

```bash
# Gate 19a: CONTACT-03 — mailto in every page <header>
for html in $(find "$DIST" -name index.html -type f); do
  if ! grep -q 'href="mailto:caleblimster@gmail.com"' "$html"; then
    echo "  FAIL: $html missing mailto in header (CONTACT-03)"; fail=1
  fi
done

# Gate 20: external-link safety — every target="_blank" carries noopener+noreferrer
while IFS= read -r html; do
  # Extract every <a ...> opening tag, one per line
  while IFS= read -r tag; do
    if echo "$tag" | grep -q 'target="_blank"'; then
      # Must contain both tokens within the same <a> tag, order-insensitive
      if ! echo "$tag" | grep -qE 'rel="[^"]*\bnoopener\b[^"]*"' \
         || ! echo "$tag" | grep -qE 'rel="[^"]*\bnoreferrer\b[^"]*"'; then
        echo "  FAIL: $html — target=\"_blank\" anchor missing noopener+noreferrer: $tag"
        fail=1
      fi
    fi
  done < <(grep -oE '<a [^>]*>' "$html")
done < <(find "$DIST" -name '*.html' -type f)

# Gate 21c: prev/next hrefs scope-locked to current category
for cat_dir in design finance personal marketing; do
  for detail in $(find "$DIST/$cat_dir" -mindepth 2 -name index.html); do
    # Extract pager hrefs and assert each starts with /$cat_dir/
    pager_hrefs=$(grep -oE 'class="pager-link[^"]*"[^>]*href="[^"]+"' "$detail" \
                  | grep -oE 'href="[^"]+"' | sed 's/href="//;s/"$//')
    for href in $pager_hrefs; do
      if [[ "$href" != /$cat_dir/* ]]; then
        echo "  FAIL: $detail — cross-discipline pager href: $href"; fail=1
      fi
    done
  done
done
```

## Security Domain

> `security_enforcement` is not set in config — treat as enabled per default. Phase 4's surface area is minimal (no input handling, no auth, no crypto, no data persistence), so the applicable ASVS categories collapse to one.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — site is fully public, no login |
| V3 Session Management | no | n/a — no sessions |
| V4 Access Control | no | n/a — no protected resources |
| V5 Input Validation | no | n/a — no user input on this site at all |
| V6 Cryptography | no | n/a — HTTPS at the edge is Cloudflare's responsibility (Phase 6) |
| V14 Configuration (link relations / tabnabbing) | **yes** | `rel="noopener noreferrer"` on every `target="_blank"`; verified by Gate 20 |

### Known Threat Patterns for static portfolio site

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reverse tabnabbing via `target="_blank"` outbound link to LinkedIn | Tampering (of the originating tab's URL post-navigation) | `rel="noopener"` — blocks `window.opener` access from the new tab. Modern browsers also imply this for cross-origin blank-target, but explicit attribute is canonical. |
| Referrer leak on outbound nav (LinkedIn sees `https://caleblim.com/marketing/pvl-overseas` in `Referer` header) | Information disclosure | `rel="noreferrer"` — strips `Referer` header on the outbound. Privacy-hygiene, low-stakes for a public portfolio but free to add. |
| Email harvesting from the `mailto:` link by spam scrapers | Information disclosure | **Accepted risk.** Obfuscating the mailto with JS would break no-JS recruiters and screen readers, which is a much bigger UX hit than a marginal increase in spam. Mailto is published openly. |
| Resume PDF metadata leak | Information disclosure | **Already mitigated** by `scripts/strip-resume-metadata.mjs` (Phase 2). Phase 4 doesn't touch the resume; the EXIF-stripped PDF stays as is. |

## Open Questions (RESOLVED)

1. **O-1: Prev/next at category edges — hide, or wrap-around?**
   - What we know: Success Criterion 2 says "prev/next navigation scoped to the same discipline (no cross-discipline jumps)" — doesn't specify edge behavior.
   - What's unclear: Should "next" on the last piece wrap to the first piece in the category, or render nothing?
   - Recommendation: **Hide at edges.** Recruiter mental model on a curated 5–15-piece portfolio is "I'm browsing a list," not "I'm in a carousel." Wrapping in a curated list reads weird. The back-pill already provides the always-available bail-out. **Defer to user confirmation in `/gsd-discuss-phase` if the planner wants to lock it.**
   - **RESOLVED: HIDE at first/last (no wrap) — applied in 04-02 Task 1.**

2. **O-2: Skip-to-content link — land in Phase 4 or defer to Phase 5?**
   - What we know: Phase 5 owns a11y polish formally. But a skip-to-content link is **two lines of HTML + a few lines of CSS** and only makes sense to land while the header chrome is open for edit.
   - Recommendation: **Land it in Phase 4 as a Claude's-discretion add-on.** Pattern: `<a href="#main" class="skip">Skip to content</a>` as the first child of `<body>` in `Base.astro`; positioned off-screen except on `:focus`. Wrap each page's main content (splash hero, gallery `.b-category`, detail `.detail`, about `.about`) in `<main id="main">` — most don't have this today and it's a one-line fix per page.
   - **RESOLVED: LAND in Phase 4 plan 04-01 — applied in 04-01 Task 2.**

3. **O-3: Subject prefill on header mailto?**
   - What we know: User did not specify. Two reasonable choices.
   - Recommendation: **No subject.** Discussed in Anti-Patterns. **Lockable in `/gsd-discuss-phase` if Caleb has a preference.**
   - **RESOLVED: NONE (clean link) — applied in 04-01 Task 2 + 04-03 Task 1.**

4. **O-4: aria-current on category-page nav when viewing the gallery?**
   - What we know: When a recruiter is on `/marketing`, should the header signal "you are inside marketing"? The current nav has email/linkedin/resume only — no category links to mark current.
   - Recommendation: **Only mark the brand `<a>` with aria-current="page" on splash.** No header-level discipline indicators are in scope for Phase 4.
   - **RESOLVED: brand-only — applied in 04-01 Task 2.**

5. **O-5: Should the detail-pager `<nav>` carry the discipline accent?**
   - What we know: Phase 3 already flows `var(--accent)` to the detail header's top border (`[slug].astro:107`) and the back-pill hover. The pager could rhyme.
   - Recommendation: **Accent only on hover** to keep the pager from competing visually with the back-pill. Default state ink-on-paper, hover state accent. Matches `.b-cat-back:hover` pattern.
   - **RESOLVED: accent-on-hover-only — applied in 04-02 Task 1.**

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hide-at-edges (not wrap) is the right prev/next UX for a curated 5–15-piece portfolio | Pattern 2, Pitfall P-3, O-1 | Low — easy to flip in plan if user disagrees during `/gsd-discuss-phase`. |
| A2 | No `?subject=` prefill on mailto is the right call | Anti-Patterns, O-3 | Low — one-line change, no plan rework. |
| A3 | Inline `<a>` is preferable to an `<ExternalLink>` component at 2-link volume | "Alternatives Considered" | Very low — abstraction can be added later if external-link count grows. |
| A4 | Skip-to-content link is small enough to land in Phase 4 even though Phase 5 nominally owns a11y polish | O-2 | Low — if discuss-phase confirms, becomes part of header-chrome plan. If rejected, defer with zero code written. |
| A5 | Recruiter's preferred path on a single-piece-category detail page is "back to gallery" (which exists) rather than "next-wrapping-to-self" | Pitfall P-3 | Low — same flip as A1. |
| A6 | Gallery sort key `data.order` ASC is the canonical sort for prev/next | Pattern 2, Pitfall P-1 | Effectively zero — verified by file read at `[category].astro:25`. Listed as assumption only because future content-schema changes could shift it. |
| A7 | `piece.id` from the `glob` loader is stable across builds (matches the `[slug]` route param) | Code Examples | Effectively zero — proven by Phase 1/2 shipping correctly. |

## Sources

### Primary (HIGH confidence)
- `src/layouts/Base.astro` — header placeholder + topbar grid, status pill, footer (Phase 3 D-18)
- `src/pages/[category]/[slug].astro` — current detail-page structure incl. back-pill already shipped
- `src/pages/[category].astro` — gallery sort idiom (`a.data.order - b.data.order`)
- `src/pages/about.astro` — existing resume download + bio
- `src/content.config.ts` — collection schema; `order: z.number().int().min(1)` confirms sort key
- `src/content/categories.ts` — `CATEGORIES = ['design','finance','personal','marketing']`
- `src/styles/disciplines.ts` — accent mapping (read-only in Phase 4)
- `src/styles/tokens.css` — locked palette + spacing + typography tokens
- `scripts/verify-build.sh` — Phase 1–3 gates (Gates 1–18); Phase 4 extends with Gates 19–22
- `package.json` — Astro 5.18.1, no new deps needed
- `.planning/REQUIREMENTS.md` — `PIECE-05`, `CONTACT-03`, `CONTACT-04`, `CONTACT-05` source text
- `.planning/ROADMAP.md` Phase 4 section — 4 success criteria
- `.planning/phases/03-visual-design-system/03-CONTEXT.md` — Phase 3 D-18 (Base.astro intro), Deferred Ideas confirming Phase 4 scope

### Secondary (MEDIUM confidence — official docs)
- [Astro 5 Routing Reference](https://docs.astro.build/en/reference/routing-reference/) — `getStaticPaths` shape, `params`/`props` contract
- [MDN: `<a>` element — `rel` attribute values](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) — `noopener` / `noreferrer` semantics
- [MDN: `<a download>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download) — same-origin restriction
- [WAI-ARIA 1.2: `aria-current`](https://www.w3.org/TR/wai-aria-1.2/#aria-current) — token values; recommendation to omit instead of `false`

### Tertiary (LOW confidence — community / advisory)
- Community guidance on prev/next UX at-edges (hide vs wrap) — recommendation in this doc is based on portfolio-domain reasoning, not a single citation. Flagged as A1 / O-1.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; pattern reuses existing Phase 3 idioms
- Architecture: HIGH — prev/next pattern verified against `glob` loader id + existing `getCollection` use in two adjacent files
- Pitfalls: HIGH — P-1, P-2, P-4, P-5, P-6, P-7, P-8 are documented behaviors; P-3 is a Phase-4-specific corner case that the conditional in Pattern 2 closes

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (Astro 5.x is stable; MDN/WAI-ARIA refs are evergreen; only risk is content-schema drift, which is project-local)

## Implementation Order Recommendation

Three SPIDR plans, ordered by **risk × user-visibility-payoff**:

1. **Plan 04-01: Header chrome (`Base.astro`).** Smallest diff (~30 lines), highest user-facing payoff (chrome appears on EVERY page including pages that already shipped Phase 3), zero new logic. Ships the visible-on-every-page contract for CONTACT-03/04 + reinforces CONTACT-01 in the header. Unblocks the gate where a recruiter on any page sees the contact affordance. **Wave 0** sub-task: add Gates 19a–f + Gate 20 to `verify-build.sh` BEFORE wiring the links so the failing gates drive the chrome wiring (TDD-flavoured but at HTML-grep granularity).

2. **Plan 04-02: Detail prev/next pager (`[category]/[slug].astro`).** Touches `getStaticPaths`, adds the only piece of build-time logic in the phase. Pattern is laid out in §"Pattern 2"; risk is in the edge cases (Pitfall P-3) and gallery-order parity (Pitfall P-1, Gate 22). Wave 0 sub-task: add Gates 21a/21b/21c + Gate 22 to `verify-build.sh`. Back-pill is **not touched** (Pitfall P-2 — Phase 3 already shipped it).

3. **Plan 04-03: About contact block (`about.astro`).** Pure markup + scoped CSS, no logic, no cross-cutting concerns. Smallest plan. Could ship in parallel with Plan 1, but ordering it last lets the header chrome work guide the typography choices for the larger About block (same mono labels, same Fraunces body anchors).

Skip-to-content (O-2) folds into Plan 04-01 if discuss-phase confirms; otherwise deferred to Phase 5.

The phase is small enough that **all three plans could merge in a single afternoon** if Caleb is hands-on. The gating cost dominates the implementation cost.

## RESEARCH COMPLETE
