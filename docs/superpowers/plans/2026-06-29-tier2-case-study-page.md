# Tier 2 — Case-study detail page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape `src/pages/[category]/[slug].astro` from a flat Context/Role/Outcome stack into an editorial situation→action→payoff case study, add three optional graceful-degrading schema fields, and backfill the two real pieces with their own existing words.

**Architecture:** Single-column editorial layout (max-width 960px, unchanged). Add a mono meta strip under the title, group Context (lead) + Role as the narrative body, lift Outcome into its own raised "payoff" band, and insert an optional large pull-quote between narrative and the existing PDF slides. All new fields are `z.optional()` so the two current pieces and any future piece stay valid and an absent field emits no wrapper.

**Tech Stack:** Astro 5 content collections (Zod schema), scoped `.astro` `<style>`, design tokens in `src/styles/tokens.css`. No new dependencies.

## Global Constraints

- **Anti-vibecode house rules:** one accent per view, soft diffuse shadows (no hard slabs), no side accent stripes, raised surfaces over strokes, single padding level per surface (no nested cards), sentence-case copy, no em dashes (`—` or `–`) anywhere.
- **Tokens only.** Every colour / size / space / radius comes from `src/styles/tokens.css`. Accent is always the inline `--accent` (set from `DISCIPLINE_ACCENT[category]`), never a hard-coded hex. No new tokens.
- **Type stays unified:** `--sans` / `--serif` / `--mono` all resolve to "DM Sans Variable". Do not reintroduce a real serif. `--serif` stays only as the token name on existing `font-style: italic` rules.
- **No content invented.** Backfill uses each piece's own existing words. `year` is left empty on both pieces (flagged to Caleb).
- **Preserve working machinery untouched:** `getStaticPaths` params and sort, the back pill, the hero `<Image>` (`priority`, LCP), the `.cache.json`-driven paginated PDF block, the "Open full PDF" link, and the same-discipline prev/next pager all stay functionally unchanged.
- **Verification scripts are known-red** against an obsolete earlier spec. The signal is "no NEW failures versus base", not exit 0 (per the Tier 1 plan note and project memory).

---

### Task 1: Schema — three optional case-study fields

**Files:**
- Modify: `src/content.config.ts:27-28` (insert after the `outcomeTagline` field, before the closing `})` of the schema object)

**Interfaces:**
- Produces: three optional fields on the `pieces` collection, consumed by Task 2 (markdown) and Task 3 (page):
  - `year?: string`
  - `deliverables?: string[]`
  - `pullQuote?: string`

- [ ] **Step 1: Add the three fields**

In `src/content.config.ts`, immediately after the `outcomeTagline` field (line 27-28) and inside the `z.object({ ... })`, add:

```ts
    // Tier 2: optional case-study metadata. Each renders only when set, so existing
    // pieces stay valid and an absent field disappears from the layout.
    year: z.string().optional()
      .describe('Display year or range, e.g. "2025" or "2024-2025". String (not number) so ranges work. Use a hyphen, never an em dash.'),
    deliverables: z.array(z.string()).optional()
      .describe('Short scope tags for the meta strip, e.g. ["Logo system", "Photoshoot art direction", "Shirt prints"]. Keep each 1-4 words.'),
    pullQuote: z.string().optional()
      .describe('One editorial line given large treatment between the narrative and the PDF slides. Lift from the work or the result; one sentence; no em dash.'),
```

- [ ] **Step 2: Verify the schema compiles**

Run: `cd ~/projects/personal-website && npx astro check 2>&1 | tail -20`
Expected: no NEW error referencing `content.config.ts`. (Pre-existing errors elsewhere are tolerated per Global Constraints; compare against base if unsure.)

- [ ] **Step 3: Commit**

```bash
cd ~/projects/personal-website
git add src/content.config.ts
git commit -m "feat: add optional year/deliverables/pullQuote fields to pieces schema"
```

---

### Task 2: Backfill the two real pieces (honest content only)

**Files:**
- Modify: `src/content/pieces/design-real-piece/index.md` (frontmatter)
- Modify: `src/content/pieces/saas-real-piece/index.md` (frontmatter)

**Interfaces:**
- Consumes: `deliverables` (string[]) and `pullQuote` (string) fields from Task 1.
- `year` is intentionally NOT added (left absent to exercise the graceful-degrade path and flag to Caleb).

All copy below is lifted from each file's existing `role` / `outcome` prose. Nothing invented. No em dashes.

- [ ] **Step 1: Backfill `design-real-piece`**

In `src/content/pieces/design-real-piece/index.md`, add these two keys to the frontmatter (place them after `fullPdf:` and before the `context: |` block, so the scannable scalars sit together):

```yaml
deliverables: ["Logo system", "Photoshoot art direction", "Shirt prints"]
pullQuote: "Replaced three prior ad-hoc looks with one durable mark the team could apply themselves."
```

(Source: `deliverables` lifted from the role prose "Designed the logo system... art-directed the leaders photoshoot... specced the shirt prints". `pullQuote` lifted verbatim from the outcome's closing sentence.)

- [ ] **Step 2: Backfill `saas-real-piece`**

In `src/content/pieces/saas-real-piece/index.md`, add after `hero:` and before `context: |`:

```yaml
deliverables: ["Marketing art direction", "Photoshoot direction", "Campaign collateral"]
pullQuote: "Visuals carried the cycle from fundraising through leader recruitment into the on-the-ground trip."
```

(Source: `deliverables` lifted from the role prose "Led the marketing-side art direction. Directed the leaders photoshoot... produced the campaign collateral". `pullQuote` lifted verbatim from the outcome's opening sentence — chosen over the second sentence because that one carries an em dash.)

- [ ] **Step 3: Verify both pieces still parse**

Run: `cd ~/projects/personal-website && npx astro check 2>&1 | tail -20`
Expected: no NEW error referencing either `index.md`.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/personal-website
git add src/content/pieces/design-real-piece/index.md src/content/pieces/saas-real-piece/index.md
git commit -m "content: backfill deliverables + pullQuote on the two real pieces"
```

---

### Task 3: Page restructure — markup + scoped styles

**Files:**
- Modify: `src/pages/[category]/[slug].astro` (frontmatter destructure, `<article>` markup, `<style>`)

**Interfaces:**
- Consumes: `year`, `deliverables`, `pullQuote` from Task 1; backfilled values from Task 2.
- Produces: nothing downstream (terminal task before verification).

This task changes one file end-to-end. Markup and styles are split into ordered steps so a reviewer can reject one band without the rest.

- [ ] **Step 1: Extend the frontmatter destructure**

In `src/pages/[category]/[slug].astro`, change the destructure on line 58 from:

```ts
const { title, hero, context, role, outcome, category, pdfPaginate, fullPdf } = piece.data;
```

to:

```ts
const { title, hero, context, role, outcome, category, pdfPaginate, fullPdf, year, deliverables, pullQuote } = piece.data;
```

Then add a per-discipline meta label map next to the existing `backLabel` map (after line 85, the close of `backLabel`):

```ts
// Tier 2 meta strip: discipline label mirrors backLabel minus the arrow.
const metaLabel: Record<Category, string> = {
  design:   'Graphic / Design',
  finance:  'Financial / Models',
  personal: 'Personal / Projects',
  saas:     'SaaS',
};
```

- [ ] **Step 2: Add the meta strip under the title**

In the `<header class="detail-head">` block, after the `<h1>{title}</h1>` line (line 91), add the meta strip. Discipline always shows; year and deliverables render only when present:

```astro
      <div class="meta-strip">
        <span class="meta-disc">{metaLabel[category as Category]}</span>
        {year && <span class="meta-dot">·</span><span class="meta-year">{year}</span>}
        {deliverables && deliverables.length > 0 && (
          <ul class="deliverables">
            {deliverables.map((d) => <li class="deliverable">{d}</li>)}
          </ul>
        )}
      </div>
```

Note: Astro fragments — if the `{year && <span/><span/>}` pair errors as adjacent JSX, wrap in a fragment: `{year && (<><span class="meta-dot">·</span><span class="meta-year">{year}</span></>)}`. Use the fragment form to be safe.

- [ ] **Step 3: Split the C/R/O section into narrative + payoff band**

Replace the entire `<section class="cro"> ... </section>` block (lines 105-119) with a narrative group (Context as lead, Role as body), an optional pull-quote, and an elevated Outcome band:

```astro
    {/* Tier 2: narrative body — Context as the lead (situation), Role as action. */}
    <section class="narrative">
      <div class="cro-block">
        <span class="label">Context</span>
        <p class="lead">{context}</p>
      </div>
      <div class="cro-block">
        <span class="label">Role</span>
        <p>{role}</p>
      </div>
    </section>

    {/* Tier 2: pull-quote — large editorial line, one accent eyebrow only. */}
    {pullQuote && (
      <blockquote class="pull-quote">
        <span class="pq-mark" aria-hidden="true">“</span>
        <p>{pullQuote}</p>
      </blockquote>
    )}

    {/* Tier 2: Outcome lifted out of the equal stack into the page's payoff band. */}
    <section class="outcome-band">
      <span class="label outcome-label">Outcome</span>
      <p>{outcome}</p>
    </section>
```

- [ ] **Step 4: Replace the `.cro` styles with the new band styles**

In the `<style>` block, replace the `.cro`, `.cro-block`, `.cro .label`, and `.cro p` rules (lines 228-254) with:

```css
  .narrative {
    display: flex;
    flex-direction: column;
    gap: var(--sp-6);
    margin-bottom: var(--sp-8);
  }
  .cro-block {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .label {
    font-family: var(--mono);
    font-size: var(--fs-mono);
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.6;
  }
  .narrative p {
    font-family: var(--serif);
    font-size: var(--fs-body);
    line-height: var(--lh-bio);
    color: var(--ink);
    margin: 0;
  }
  /* Context lead: same body token, a touch more presence as the situation opener. */
  .narrative p.lead {
    font-size: var(--fs-ttl);
    line-height: 1.5;
  }

  /* Pull-quote: one accent moment (the mark), neutral ink text, generous air. */
  .pull-quote {
    margin: var(--sp-10) 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }
  .pull-quote .pq-mark {
    font-family: var(--sans);
    font-size: var(--fs-card);
    font-weight: 800;
    line-height: 1;
    color: var(--accent);
  }
  .pull-quote p {
    font-family: var(--sans);
    font-size: var(--fs-q);
    line-height: var(--lh-tight);
    letter-spacing: -0.02em;
    color: var(--ink);
    margin: 0;
  }

  /* Outcome payoff band: raised surface (no stroke, no side stripe), single
     padding level, soft diffuse shadow, lit top edge. The page's payoff. */
  .outcome-band {
    background: color-mix(in oklab, var(--paper) 88%, #ffffff);
    border-radius: 12px;
    padding: var(--sp-6);
    margin-bottom: var(--sp-8);
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      inset 0 -1px 0 rgba(10, 10, 10, 0.08),
      0 18px 36px -22px rgba(10, 10, 10, 0.42);
  }
  .outcome-band .outcome-label {
    color: var(--accent);
    opacity: 1;
  }
  .outcome-band p {
    font-family: var(--serif);
    font-size: var(--fs-ttl);
    line-height: var(--lh-bio);
    color: var(--ink);
    margin: 0;
  }
```

- [ ] **Step 5: Add meta-strip styles**

Add these rules to the `<style>` block (logical place: right after the `.detail h1` rule, around line 221):

```css
  .meta-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-3);
  }
  .meta-disc, .meta-year, .meta-dot {
    font-family: var(--mono);
    font-size: var(--fs-mono);
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink);
    opacity: 0.6;
  }
  .deliverables {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  /* Raised pills: no stroke, lifted off paper, soft shadow, 2:1 padding. */
  .deliverable {
    background: color-mix(in oklab, var(--paper) 80%, #ffffff);
    color: var(--ink);
    padding: 4px 10px;
    border-radius: 999px;
    font-family: var(--mono);
    font-size: var(--fs-mono);
    font-weight: 600;
    letter-spacing: 0.08em;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 6px 14px -10px rgba(10, 10, 10, 0.40);
  }
```

- [ ] **Step 6: Add mobile air for the new bands**

In the `@media (max-width: 900px)` block (lines 342-346), append rules so the new bands breathe and never cause horizontal scroll:

```css
    .pull-quote { margin: var(--sp-8) 0; }
    .outcome-band { padding: var(--sp-5); }
    .meta-strip { gap: var(--sp-2); }
```

- [ ] **Step 7: Build and verify the page renders**

Run: `cd ~/projects/personal-website && npm run build 2>&1 | tail -25`
Expected: build completes; the two real piece pages emit to `dist/design/design-real-piece/index.html` and `dist/saas/saas-real-piece/index.html`. No NEW build error versus base.

- [ ] **Step 8: Commit**

```bash
cd ~/projects/personal-website
git add "src/pages/[category]/[slug].astro"
git commit -m "feat: editorial case-study layout — meta strip, pull-quote, elevated outcome band"
```

---

### Task 4: Verification — assert the editorial arc and graceful degrade

**Files:** none (inspection only)

**Interfaces:** Consumes the built `dist/` from Task 3 Step 7.

- [ ] **Step 1: Grep the built HTML for the new blocks (populated piece)**

Run: `cd ~/projects/personal-website && grep -o -E 'meta-strip|deliverable|pull-quote|outcome-band' dist/design/design-real-piece/index.html | sort | uniq -c`
Expected: all four class names present (meta-strip, deliverable, pull-quote, outcome-band).

- [ ] **Step 2: Confirm absent `year` emits no empty wrapper**

Run: `cd ~/projects/personal-website && grep -c 'meta-year' dist/design/design-real-piece/index.html`
Expected: `0` (no piece sets `year`, so the year span never renders — the graceful-degrade path).

- [ ] **Step 3: Confirm no em dash entered the built pages**

Run: `cd ~/projects/personal-website && grep -l '—\|–' dist/design/design-real-piece/index.html dist/saas/saas-real-piece/index.html`
Expected: no output (neither file contains an em or en dash). Note: the saas piece's `outcome` prose DOES contain an em dash in its second sentence; that sentence still renders inside the Outcome band, so this grep is EXPECTED to find it on the saas page. Treat a hit on the saas page from the pre-existing outcome text as known/out-of-scope (do not edit `outcome` — Global Constraint "no content invented"); a hit on the design page or in any NEW block (pull-quote, deliverables) is a real failure to fix.

- [ ] **Step 4: Anti-AI tells script (no NEW failures)**

Run: `cd ~/projects/personal-website && npm run verify:anti-ai 2>&1 | tail -15`
Expected: no NEW banned-pattern failure attributable to the changed files. Script is known-red against an obsolete spec; compare against base.

- [ ] **Step 5: Smoke/build script (no NEW failures versus base)**

Run: `cd ~/projects/personal-website && npm run test:smoke 2>&1 | tail -20`
Expected: zero NEW failures versus base (the script is known-red; the signal is "no new failures", per the Tier 1 plan note and project memory).

- [ ] **Step 6: Screenshot the populated piece at desktop + mobile**

Use Playwright (or claude-in-chrome) against the dev server (`npm run dev`, default port) at `/design/design-real-piece`:
  - Desktop ~1280px wide: confirm top-to-bottom arc reads title → meta strip → hero → Context (lead) → Role → pull-quote → Outcome band (visibly elevated) → PDF slides → pager.
  - Mobile ~390px wide: confirm the meta strip wraps with no horizontal scroll and the bands have vertical air.
Save screenshots under the scratchpad; attach to the completion summary.

- [ ] **Step 7: Final commit (docs/screenshots if any) + push to main**

Per project default (commit and push to main right after work):

```bash
cd ~/projects/personal-website
git push origin main
```

---

## Self-Review

**Spec coverage:**
- Schema change (spec §1) → Task 1. ✓
- Page structure / meta strip / pull-quote / outcome band (spec §2) → Task 3. ✓
- Anti-vibecode self-check (spec §3) → folded into Task 3 styles (raised surfaces, single padding level, one accent, soft shadows, no stripes) + Global Constraints + Task 4 Step 3/4. ✓
- Backfill two real pieces, `year` left empty (spec §4) → Task 2. ✓
- Files list (spec §5) → all four files covered (content.config.ts, [slug].astro, both index.md). ✓
- Verification (spec §6: build, astro check, dist grep, screenshots, anti-ai, smoke) → Task 4 + per-task checks. ✓
- Out of scope (personal/finance rooms, per-piece OG, motion/dark mode, getStaticPaths/PDF pipeline) → untouched. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". Every code step shows the exact code. ✓

**Type consistency:** `year: string`, `deliverables: string[]`, `pullQuote: string` used identically across Task 1 (schema), Task 2 (yaml), Task 3 (destructure + markup). Class names (`meta-strip`, `deliverable`, `pull-quote`, `outcome-band`, `narrative`, `lead`, `outcome-label`) are consistent between markup steps and style steps. ✓

**Known wrinkle flagged:** the saas `outcome` prose contains a pre-existing em dash; Task 4 Step 3 documents this as expected/out-of-scope rather than a failure (editing `outcome` would violate "no content invented").
