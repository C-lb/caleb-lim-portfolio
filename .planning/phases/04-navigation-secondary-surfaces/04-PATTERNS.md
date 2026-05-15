# Phase 4: Navigation & Secondary Surfaces — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 4 (3 modified Astro files + 1 modified bash script)
**Analogs found:** 4 / 4 (every new pattern has an exact in-repo analog from Phase 3)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/layouts/Base.astro` (MODIFY) | Astro layout — site-wide chrome (header + footer) | build-time SSR; no data layer | self — modify in place; the `.brand`/`<nav>` slot at lines 28–31 is the literal Phase 4 anchor | exact (in-file) |
| `src/pages/[category]/[slug].astro` (MODIFY) | Astro dynamic page — detail render | build-time `getStaticPaths` over `getCollection('pieces')` | self (for `getStaticPaths` shape) + `src/pages/[category].astro:23–25` (for the sort key) | exact (in-file + sibling) |
| `src/pages/about.astro` (MODIFY) | Astro static page | build-time, no data fetch | self — extend after line 24 `.resume-link` block | exact (in-file) |
| `scripts/verify-build.sh` (MODIFY) | Bash verification harness | grep over built `dist/**/*.html` | self — Gates 1–18 already establish every loop idiom Gates 19–22 will reuse | exact (in-file) |

**Note:** Phase 4 introduces zero new files. Every change is an in-place extension of a Phase 3 artefact. The "analog" for each is its own current state — Phase 3 finished two days ago, so the patterns are fresh and live.

## Pattern Assignments

### `src/layouts/Base.astro` (layout, build-time chrome) — Plan 04-01

**Current state to extend** (the file is its own analog — three insertions inside the existing header):

**Anchor point** (lines 28–31, current state):
```astro
<header class="topbar">
  <span class="brand">caleb lim</span>
  <StatusPill />
  <nav aria-label="primary"><!-- Phase 4 wires mailto / LinkedIn / Resume here --></nav>
</header>
```

The `<nav aria-label="primary">` already exists with a placeholder comment. Plan 04-01 replaces the comment body with three `<a>` tags AND wraps `<span class="brand">` in an `<a href="/">`. The grid slot is pre-reserved (`min-width: 1px` at line 70).

**Existing aria-label landmark naming** (line 31): `aria-label="primary"` — Phase 4 must NOT change this string. New `<nav>` in the detail-footer (Plan 04-02) must use a DIFFERENT label (`"other pieces in this discipline"`) so the two landmarks are distinct under AT — required by Gate 19f.

**Existing nav-link hover token** (line 72):
```css
.topbar nav a:hover { color: var(--terracotta); }
```
Already wired before any `<a>` exists. The three new anchors inherit this hover for free. Do not add a second `:hover` rule — reuse.

**Token vocabulary to inherit** (lines 55–60, the `.topbar` block):
```css
font-family: var(--mono);
font-size: var(--fs-mono);       /* 11px */
letter-spacing: 0.1em;
text-transform: uppercase;
font-weight: 600;
```
New `.nav-link` class must consume the same five properties. The RESEARCH.md proposed `text-transform: lowercase` to match `.brand` (line 65) — that is the per-link override; do NOT change the parent `.topbar` rule.

**Astro conditional-attribute pattern** for `aria-current` — no in-repo precedent yet (Phase 3 didn't need it). Use the canonical:
```astro
---
const home = Astro.url.pathname === '/';
---
<a href="/" class="brand" aria-current={home ? 'page' : undefined}>caleb lim</a>
```
Astro 5 drops attributes whose value is `undefined`. Pitfall P-4 covers this.

**External-link safety pattern** for the LinkedIn anchor:
```astro
<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer" class="nav-link">linkedin</a>
```
Zero in-repo precedent (Phase 3 has no outbound `target="_blank"` links yet). This anchor is the first in the codebase to use the trio — Plan 04-01 establishes the convention.

**Same-origin download pattern** — already shipped at `src/pages/about.astro:23`:
```astro
<a href="/caleb-lim-resume.pdf" download>Download resume (PDF) →</a>
```
Plan 04-01's header Resume link mirrors this: `href`, `download`, no `target`, no `rel` (same-origin). Pitfall P-5 covers why `download` would silently fail if the URL went cross-origin.

---

### `src/pages/[category]/[slug].astro` (Astro dynamic page, build-time prev/next) — Plan 04-02

**Closest analog for `getStaticPaths` extension:** self (this file's lines 11–17, current state).

**Current `getStaticPaths` shape** (lines 11–17):
```astro
export async function getStaticPaths() {
  const pieces = await getCollection('pieces', ({ data }) => data.draft !== true);
  return pieces.map((piece) => ({
    params: { category: piece.data.category, slug: piece.id },
    props: { piece },
  }));
}
```

Plan 04-02 extends this to group by category, sort, find index, attach `prev`/`next` to `props`. The contract `params: { category: piece.data.category, slug: piece.id }` MUST stay byte-identical — changing the slug derivation would invalidate every existing route (and break the 5 piece-detail HTMLs in `dist/`).

**Sort-key analog** — `src/pages/[category].astro:23–25`:
```astro
const pieces = (await getCollection('pieces', ({ data }) =>
  data.category === category && data.draft !== true
)).sort((a, b) => a.data.order - b.data.order);
```
The prev/next builder MUST use `a.data.order - b.data.order` ASCENDING — same key, same direction. Pitfall P-1 codifies this. If Plan 04-02 introduces a helper `sortByOrder`, both `[category].astro` and `[category]/[slug].astro` import it; otherwise leave both inline with a one-line comment in `[category]/[slug].astro:getStaticPaths` pointing at `[category].astro:25` as the canonical reference.

**Draft-filter analog** — `getCollection('pieces', ({ data }) => data.draft !== true)` is the canonical predicate, used three times in the repo (`[slug].astro:12`, `[category].astro:13` + `:23`). Plan 04-02's grouped-by-category build MUST use the same predicate or the prev/next chain will reference draft pieces that don't exist in `dist/`.

**`piece.id` as slug** (proven at line 14): `slug: piece.id` — the `glob` loader exposes `piece.id` as the route slug. Plan 04-02's `NeighbourRef` type uses `slug: piece.id` identically.

**`Category` type import** (line 9, already in scope):
```typescript
import type { Category } from '../../content/categories';
```
`NeighbourRef.category` reuses this type. Don't re-import or duplicate.

**Detail-footer markup pattern** — the `.b-cat-back` back-pill at line 52 + lines 114–136 is the visual relative the new `.pager-link` chrome should rhyme with (NOT duplicate):
```astro
<a href={`/${category}`} class="b-cat-back">{backLabel[category as Category]}</a>
```
```css
.b-cat-back {
  display: inline-block;
  background: var(--paper);
  color: var(--ink);
  padding: 8px 14px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: var(--fs-mono);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  align-self: flex-start;
  border: 1px solid var(--ink);
  transition: background 0.2s ease, color 0.2s ease;
}
.b-cat-back:hover { background: var(--accent); color: var(--paper); }
.b-cat-back:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
```
Pitfall P-2: **do NOT re-ship a "Back to [Category]" link in the detail footer.** This pill at line 52 already satisfies the back-link half of PIECE-05. Plan 04-02 adds prev/next ONLY.

**Accent flow pattern** — line 50: `<article class="detail" style={`--accent: ${accent}`}>`. The `.pager-link:hover` rule consumes `var(--accent)` exactly like `.b-cat-back:hover` (line 130). No new accent infrastructure. O-5 confirms accent on hover only, ink default.

**CRO label typography** (lines 164–172) — the typographic vocabulary the prev/next "previous"/"next" direction-words should mirror:
```css
.cro .label {
  font-family: var(--mono);
  font-size: var(--fs-mono);
  font-weight: 600;
  letter-spacing: 0.16em;       /* note: 0.16em here vs 0.1em on .topbar — CRO is tighter-tracked */
  text-transform: uppercase;
  color: var(--ink);
  opacity: 0.6;
}
```
The `.pager-dir` span (the `← previous` / `next →` glyph + word) should reuse the `letter-spacing: 0.16em; opacity: 0.6` recipe so the pager reads as part of the same mono-label family as Context/Role/Outcome.

**Body-anchor link pattern** (lines 194–209) for the piece title inside the pager — the `.full-pdf-link a` block is the existing serif-italic anchor pattern; the pager piece-title may reuse it (Fraunces, underlined, hover → accent):
```css
.full-pdf-link a {
  font-family: var(--serif);
  font-style: italic;
  font-size: 16px;
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.full-pdf-link a:hover { color: var(--accent); }
.full-pdf-link a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

**Mobile breakpoint** (line 211) — `@media (max-width: 900px) { .detail { padding: var(--sp-5); } }` is the only responsive rule in the file. Plan 04-02's pager may need a column-stack rule at the same breakpoint — append to the existing `@media` block, don't introduce a new one.

---

### `src/pages/about.astro` (Astro static page, contact-block markup) — Plan 04-03

**Closest analog:** self — append after line 24 `.resume-link` paragraph, inside the existing `<article class="about">`.

**Resume link already shipped** (lines 22–24):
```astro
<p class="resume-link">
  <a href="/caleb-lim-resume.pdf" download>Download resume (PDF) →</a>
</p>
```
Plan 04-03 leaves this verbatim. The new `<section class="contact">` slots in BELOW this paragraph.

**Body anchor pattern to inherit** (lines 78–90):
```css
.about p a {
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
.about p a:hover { color: var(--terracotta); }
.about p a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
```
The new `.contact-list a` rule mirrors this almost verbatim — same underline thickness, same offset, same hover color, same focus ring. The only difference is About contact rows use `font-family: var(--serif)` explicitly (the body inherits it; `.contact-list a` lives outside `.about p` so the rule must be restated).

**CRO label vocabulary as the contact-row label** — copy from `[category]/[slug].astro:164–172` (NOT from About — About has no mono label currently). The `<span class="label">email</span>` block uses the exact `font-family / font-size / letter-spacing / opacity` recipe shown above. Establishes typographic rhyme: contact rows on /about read as the same vocabulary as Context/Role/Outcome on detail pages.

**External-link safety** — second instance in the codebase, identical to Plan 04-01's LinkedIn header anchor:
```astro
<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">linkedin.com/in/caleblkr</a>
```
Gate 20 scans both occurrences site-wide; mismatched `rel` on either trips the gate.

**Spacing tokens** — `--sp-2` (8px), `--sp-4` (16px), `--sp-5` (24px) confirmed at `tokens.css:44–46`. The contact-block layout uses `gap: var(--sp-4)` for outer block, `gap: var(--sp-2)` for inter-row, `margin-top: var(--sp-5)` for the gap above the section. **No new spacing tokens.**

**Mobile breakpoint** (line 97): `@media (max-width: 900px) { .about { padding: var(--sp-8) var(--sp-5); } }`. RESEARCH.md proposes a stricter mobile rule for contact rows at `max-width: 600px` (collapse 100px label column to full-width stack). Acceptable — `.about` and `.contact-list` are independent CSS scopes. New `@media (max-width: 600px)` block is fine; do not merge into the 900px block.

---

### `scripts/verify-build.sh` (bash verification harness, grep over `dist/`) — Wave 0 of every plan

**Closest analog:** self — Gates 1–18 establish every idiom Gates 19–22 will reuse.

**Per-detail-page loop idiom** (line 84, used by Gate 6):
```bash
while IFS= read -r html; do
  # ... grep assertions ...
done < <(find "$DIST" -mindepth 3 -name index.html -type f)
```
Gates 21a/21b/21c iterate detail pages with this exact construct. Do not invent new loop shapes.

**Per-category loop idiom** (lines 62, 297, 470, 513):
```bash
for cat in design finance personal marketing; do
  # ... per-category logic ...
done
```
Gate 21c (cross-discipline href check) uses this directly. Gate 22 (gallery-order parity) walks each category's gallery first.

**Site-wide HTML scan** (line 74, used by Gate 5):
```bash
iframe_hits=$(find "$DIST" -mindepth 3 -name index.html -type f -exec grep -l 'iframe' {} \; 2>/dev/null || true)
```
Gate 20 (external-link safety) wraps `find "$DIST" -name '*.html' -type f` over every HTML page (NOT just detail pages — header chrome is on splash + galleries + about + 404 too). Gate 20 in particular extends scope from `-mindepth 3` to all `*.html`.

**Anchored category-regex pattern** (line 301, used by Gate 12c):
```bash
grep -qE "^category: ${required_cat}( |$)"
```
The "anchor with space-or-EOL" recipe avoids matching `category: designers`. Any new gate that filters by category in source markdown must reuse this exact regex form (BSD grep on macOS lacks `\b`).

**Failure-flag pattern** (line 9 + `fail=1` everywhere):
```bash
fail=0
# ... gates ...
if [[ <bad> ]]; then echo "  FAIL: ..."; fail=1; fi
# ... at end ...
if [[ $fail -eq 0 ]]; then echo "ALL GREEN"; exit 0; else echo "FAILED"; exit 1; fi
```
Gates 19a–22 must use `fail=1` (not `exit 1`) so a single bad gate doesn't short-circuit the rest of the run. Every existing gate honors this; new gates must too.

**Output-line format** (everywhere): `echo "  OK: <description>"` for pass; `echo "  FAIL: <file> — <reason>"` for fail. Two-space indent is the convention. New gates must match.

**Header pattern** (line 97):
```bash
echo
echo "Phase 2 gates"
echo "============="
```
Gates 19–22 should be grouped under a new `Phase 4 gates` header banner.

**Set -e safety with grep no-match** — lines 458–460 + the `|| true` idiom recurs everywhere a grep might legitimately return non-zero. New gates must end every grep that may not match with `|| true` or wrap in `if ... then ... fi`. Otherwise `set -euo pipefail` (line 6) kills the script mid-gate.

---

## Shared Patterns

### Pattern S1: External-link safety trio
**Source:** New convention, established by Plan 04-01 LinkedIn header anchor.
**Apply to:** Every `<a href="https://...">` whose host isn't the deployed origin. In Phase 4 scope: LinkedIn in header (Plan 04-01) + LinkedIn in About contact block (Plan 04-03). Total: 2 occurrences.

```astro
<a href="https://linkedin.com/in/caleblkr" target="_blank" rel="noopener noreferrer">…</a>
```

**Enforcement:** Gate 20 in `scripts/verify-build.sh` greps every `<a>` opening tag site-wide and asserts that any tag containing `target="_blank"` also contains BOTH `noopener` AND `noreferrer` tokens inside its `rel` attribute (order-insensitive, space-separated — Pitfall P-7 covers the comma typo).

### Pattern S2: Token consumption (NO new tokens)
**Source:** `src/styles/tokens.css` (Phase 3, locked).
**Apply to:** Every Phase 4 CSS addition.

Phase 3 LOCKED the palette. Phase 4 consumes — does not extend. Available tokens (confirmed via tokens.css:8–48):
- `--paper` (#f4ebd9), `--ink` (#0a0a0a), `--terracotta` (#cc7722)
- `--accent` (set inline per discipline via `style={`--accent: ${accent}`}`)
- `--sans` (Bricolage), `--serif` (Fraunces), `--mono` (JetBrains)
- `--fs-mono` (11px), `--fs-body` (15.5px), `--fs-cat`, `--fs-q`, etc.
- `--sp-1` (4px), `--sp-2` (8px), `--sp-4` (16px), `--sp-5` (24px), `--sp-6` (32px), `--sp-8` (48px), `--sp-10` (64px) — note: NO `--sp-3` or `--sp-7`; the scale is intentionally gapped
- `--lh-bio` (1.42), `--lh-cat` (0.85)

**Hard rule:** If a Phase 4 task needs a separator color, divider opacity, or transition timing not already in tokens.css, reuse the closest existing token at modified opacity — NEVER add a new `--token`.

### Pattern S3: aria-label landmark distinction
**Source:** WAI-ARIA + existing Base.astro line 31 (`<nav aria-label="primary">`).
**Apply to:** Every `<nav>` element on the page.

Phase 4 adds a second `<nav>` (the detail-pager). The two `<nav>` landmarks under AT MUST have distinct labels:
- Header: `<nav aria-label="primary">` (already shipped; do not change)
- Detail-footer: `<nav aria-label="other pieces in this discipline">` (RESEARCH.md Pattern 2)

**Enforcement:** Gate 19f greps every `dist/**/*.html` and asserts:
1. Every `<nav>` has an `aria-label` (no anonymous landmarks)
2. No page has two `<nav>` elements with the same `aria-label` value

### Pattern S4: getCollection draft-filter
**Source:** `src/pages/[category].astro:13` + `:23` + `[slug].astro:12`.
**Apply to:** Any new build-time read of the `pieces` collection (Plan 04-02's prev/next builder).

```typescript
await getCollection('pieces', ({ data }) => data.draft !== true);
```
Predicate is `data.draft !== true` (not `!data.draft` — that would also exclude pieces where `draft` is `undefined`, which Zod schema-allows but doesn't require). Stay literal.

### Pattern S5: Conditional render at edges (hide, don't wrap)
**Source:** RESEARCH.md Pattern 2 + Pitfall P-3 + Assumption A1.
**Apply to:** Plan 04-02 detail-pager.

```astro
{(prev || next) && (
  <nav class="detail-pager" aria-label="other pieces in this discipline">
    {prev ? <a class="pager-link prev" …>…</a> : <span />}
    {next ? <a class="pager-link next" …>…</a> : <span />}
  </nav>
)}
```

Outer conditional `(prev || next)` is mandatory: single-piece categories must NOT render an empty `<nav>` landmark. Empty `<span />` placeholders inside preserve flex/grid two-column alignment when one neighbour is absent.

### Pattern S6: `aria-current` omission, not `"false"`
**Source:** WAI-ARIA 1.2 + RESEARCH.md Pitfall P-4.
**Apply to:** Plan 04-01 brand/home link.

```astro
const home = Astro.url.pathname === '/';
// ...
<a href="/" aria-current={home ? 'page' : undefined}>caleb lim</a>
```

Astro 5 drops attributes whose value is `undefined`. Never emit `aria-current="false"` — it's spec-valid but spec-discouraged and trips Gate 19f (no `aria-current="false"` in any `dist/**/*.html`).

### Pattern S7: Verification gate format
**Source:** `scripts/verify-build.sh` Gates 1–18.
**Apply to:** Gates 19–22 added by Phase 4.

Every new gate inherits:
- `fail=1` (NOT `exit 1`) on failure so the rest of the suite runs
- Two-space indent on `OK:` / `FAIL:` echoes
- `|| true` on every grep that may legitimately not match (avoids set-e abort)
- `while IFS= read -r ...; do ... done < <(find ...)` for per-file loops
- Header banner `echo; echo "Phase 4 gates"; echo "============="` once before Gate 19a

## No Analog Found

None. Every Phase 4 pattern has at least one in-repo precedent from Phase 3.

The two near-misses worth flagging to the planner:

| Pattern | Status | Notes |
|---------|--------|-------|
| Outbound `<a target="_blank" rel="noopener noreferrer">` | First-of-kind in the codebase | Phase 3 shipped no external links. Plan 04-01 LinkedIn is the FIRST occurrence; Plan 04-03 is the SECOND. Convention established by Phase 4 itself; Gate 20 codifies it. |
| `aria-current` on a persistent link | First-of-kind | Phase 3 had no aria-current usage (no persistent nav links existed). Plan 04-01 brand/home link is the first; the `home ? 'page' : undefined` pattern is canonical WAI-ARIA, not a project-local invention. |

## Metadata

**Analog search scope:**
- `src/layouts/Base.astro` (full read — 100 lines)
- `src/pages/[category]/[slug].astro` (full read — 215 lines)
- `src/pages/about.astro` (full read — 101 lines)
- `src/pages/[category].astro` (full read — 136 lines; sort-key reference for Plan 04-02)
- `scripts/verify-build.sh` (full read — 534 lines; Gates 1–18 idiom catalogue)
- `src/content/categories.ts` (2 lines — type import)
- `src/styles/disciplines.ts` (21 lines — accent map)
- `src/styles/tokens.css` lines 8–55 (token catalogue)

**Files scanned:** 8
**Pattern extraction date:** 2026-05-15
**Phase 3 closure date:** 2026-05-13 (two days before this map; analogs are fresh)

## PATTERN MAPPING COMPLETE
