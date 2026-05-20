# Phase 6: Deploy & Maintenance Handoff — Pattern Map

**Mapped:** 2026-05-20
**Files in scope:** 14 (4 new, 8 modified, 2 doc-amendments)
**Analogs found:** 11 / 14 (3 new artefacts have no in-repo analog by design)

## File Classification

| File | Status | Role | Data Flow | Closest Analog | Match |
|------|--------|------|-----------|----------------|-------|
| `astro.config.mjs` | modify | config (build) | build-time | self (current 2-liner) | exact |
| `package.json` | modify | config (deps) | n/a | self | exact |
| `src/layouts/Base.astro` | modify | layout (head meta) | request-response (SSG render) | self lines 22-28 (existing `<head>`) | exact |
| `src/pages/[category]/[slug].astro` (Image) | modify | route (Astro page) | build-time srcset gen | `src/components/GalleryA12.astro:23-30` (canonical `widths` analog) | exact |
| `src/pages/[category]/[slug].astro` (CSS @media) | modify | route style | n/a | self lines 332-334 (block to delete) | exact |
| `src/components/StatusPill.astro` (CSS @media) | modify | component style | n/a | self lines 82-85 (block to delete) | exact |
| `src/pages/[category].astro` (CSS @media) | modify | route style | n/a | self lines 140-142 (block to delete) | exact |
| `scripts/verify-build.sh` | modify | script (bash gate) | build-time check | `scripts/verify-build.sh` Gate 25 lines 934-949 + Gate 17 lines 502-517 | exact |
| `public/robots.txt` | new | static asset | runtime fetch | `public/favicon.svg` (existing public/ asset; no text-file analog) | role-only |
| `public/og.png` | new | static binary | runtime fetch | none (no PNG in `public/`; precedent is `public/favicon.svg` SVG) | none |
| `README.md` (repo root) | new | doc | n/a | `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` (closest markdown long-form in repo) | partial |
| `docs/contributing/0*.png` | new | doc asset (binary) | n/a | none (`docs/` directory does not exist yet) | none |
| `CLAUDE.md` | modify (D-07 amendment) | doc | n/a | self lines 12, 75 | exact |
| `PROJECT.md` (`.planning/PROJECT.md`) | modify (D-07 amendment) | doc | n/a | CONTEXT.md amendment note style (2026-05-18 FOUND-03 pattern referenced in CONTEXT) | partial |

**Confirmed missing from repo (planner: treat as net-new dirs/files):**
- `docs/` directory does not exist (`ls docs` returned ENOENT).
- `README.md` at repo root does not exist.
- `public/og.png`, `public/robots.txt` do not exist.

---

## Pattern Assignments

### `astro.config.mjs` (config, build-time)

**Analog:** itself (current state — 2-line stub).

**Current file** (verbatim, all 5 lines):
```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  // No integrations in Phase 1 — visuals are placeholder. Tailwind / fonts / motion land in Phase 3.
});
```

**Pattern to mirror (RESEARCH §Pattern 1 — official Astro docs):**
```javascript
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Phase 6 Wave 1 — points at Vercel default subdomain until custom domain lives.
  // Wave 2 flips this to https://caleblim.com (or fallback) once DNS verifies.
  site: 'https://caleb-lim-portfolio.vercel.app',
  integrations: [sitemap()],
});
```

**Sequencing note:** `site` MUST be set before `<meta>` block (Pattern 2) is added — `Astro.site` returns `undefined` otherwise and `new URL(path, undefined)` throws at build time (RESEARCH §Anti-Patterns).

---

### `package.json` (config, deps)

**Analog:** existing `dependencies` block lines 18-24.

**Current `dependencies`** (lines 18-24):
```json
"dependencies": {
  "@fontsource-variable/bricolage-grotesque": "^5.2.10",
  "@fontsource-variable/fraunces": "^5.2.9",
  "@fontsource-variable/jetbrains-mono": "^5.2.8",
  "astro": "^5.18.1",
  "pdfjs-dist": "^5.7.284"
}
```

**Pattern to mirror:** add ONE line, caret range, alphabetical position (sits above `astro` lexically):
```json
"@astrojs/sitemap": "^3.7.2",
```

Verified canonical version per RESEARCH §Standard Stack (`npm view @astrojs/sitemap version` → 3.7.2, published 2026-03-26). Install via `npm install @astrojs/sitemap@3.7.2` OR `npx astro add sitemap` (the latter also edits `astro.config.mjs` — confirm Wave 1 sequencing in plan).

---

### `src/layouts/Base.astro` (layout, request-response / SSG)

**Analog:** itself, lines 22-28 (existing `<head>`).

**Current `<head>` (lines 22-28, verbatim):**
```astro
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" as="font" type="font/woff2" href={bricolageDisplay} crossorigin="anonymous" />
  </head>
```

**Frontmatter precedent (lines 13-18):**
```astro
interface Props {
  title: string;
  bg?: 'paper' | 'ink';
}
const { title, bg = 'paper' } = Astro.props;
const isHome = Astro.url.pathname === '/';
```

**Pattern to mirror** — additions go in frontmatter (canonical URL + ogImage + description consts) and in `<head>` between line 26 (favicon `<link>`) and line 27 (font preload). Keep the indentation style (2-space, opening tag on its own line):

Frontmatter additions (after line 18):
```astro
const canonicalURL = new URL(Astro.url.pathname, Astro.site).toString();
const ogImage = new URL('/og.png', Astro.site).toString();
const description = "Caleb Lim — cross-functional generalist. Brand, marketing, financial models, graphic design.";
```

`<head>` additions (insert between line 26 favicon `<link>` and line 27 font preload — the 11 tags from RESEARCH §Pattern 2):
```astro
    <link rel="canonical" href={canonicalURL} />
    <meta name="description" content={description} />

    <!-- OpenGraph -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
```

**Why this placement:** keeps the existing line ordering invariant (charset → viewport → title → icon → preload). New block sits AFTER the existing single-line `<link>` and BEFORE the font preload because `<link rel="preload">` should remain as close to the resource use as feasible (no functional bearing, just convention parity with what's there).

---

### `src/pages/[category]/[slug].astro` — detail hero `<Image>` (D-05)

**Analog:** `src/components/GalleryA12.astro` lines 23-30 (canonical Plan 05-04 `widths`/`sizes`/`priority` invocation). Identical patterns at `GalleryB35.astro:25-31`, `GalleryC68.astro:29-35`, and `src/pages/index.astro:78-84` — all use `widths={[280, 560]}`.

**Analog code** (`src/components/GalleryA12.astro:23-30`):
```astro
<Image
  src={piece.data.hero}
  alt={piece.data.title}
  class="cover"
  priority={slot === 1}
  widths={[280, 560]}
  sizes="(max-width: 900px) 50vw, 240px"
/>
```

**Current target file** (`src/pages/[category]/[slug].astro:97-103`, verbatim):
```astro
    <Image
      src={hero}
      alt={title}
      class="detail-hero"
      priority
      sizes="(max-width: 960px) 100vw, 960px"
    />
```

**Pattern to mirror** — insert ONE prop (`widths={[480, 768, 960, 1280]}`) between `priority` and `sizes`; do not touch the other four lines (`src`, `alt`, `class`, `sizes`). RESEARCH §Pattern 3 verified the existing build emits a single `<img>` with no `srcset` against a 1280×1600 source — the missing `widths` array is the actual D-05 root cause, not a `priority` or `sizes` defect.

```astro
    <Image
      src={hero}
      alt={title}
      class="detail-hero"
      priority
      widths={[480, 768, 960, 1280]}
      sizes="(max-width: 960px) 100vw, 960px"
    />
```

**Widths rationale (from RESEARCH §Pattern 3):** rendered max is 960px CSS; gallery uses `[280, 560]` for ~240px tiles. Detail hero needs the larger range because `.detail` caps at `max-width: 960px` and the image fills it. Cap at 1280 (the source's native width — Astro will skip emitting variants larger than source).

**Do NOT add `format="webp"` for the first pass.** Source is already webp; Astro 5 default is webp; adding the prop is redundant. Only add if Lighthouse post-fix still flags the hero (RESEARCH §Pattern 3 recommendation).

---

### `src/components/StatusPill.astro:82-85` — D-06 straggler #1

**Analog:** itself (the block to delete).

**Current code** (verbatim, lines 82-85):
```css
  @media (prefers-reduced-motion: reduce) {
    .pill { transition: none; }
    .pill:hover { transform: none; }
  }
```

**Pattern to apply:** delete the entire 4-line block. Surrounding lines (81 `}` closing `@keyframes pulse`, 86 `/* D-04 StatusPill mobile shrink...` comment) stay intact. No replacement — the removal IS the fix (per D-08 surgical-policy rationale; StatusPill hover-scale is exempt #12).

---

### `src/pages/[category].astro:140-142` — D-06 straggler #2

**Analog:** itself.

**Current code** (verbatim, lines 139-142):
```css
  /* Reduced-motion (D-13) */
  @media (prefers-reduced-motion: reduce) {
    .b-cat-back { transition: none; }
  }
```

**Pattern to apply:** delete lines 139-142 inclusive (the comment + 3 CSS lines). Line 138 `}` (closing `.b-cat-meta strong`) stays; line 144 `@media (max-width: 900px)` stays. Back-pill color is exempt #16 (color-only).

---

### `src/pages/[category]/[slug].astro:332-334` — D-06 straggler #3

**Analog:** itself.

**Current code** (verbatim, lines 332-334):
```css
  @media (prefers-reduced-motion: reduce) {
    .pager-link { transition: none; }
  }
```

**Pattern to apply:** delete lines 332-334 inclusive. Line 331 `}` (closing `.pager-link:focus-visible`) stays; line 336 `@media (max-width: 900px)` stays. Pager-link color is exempt #18.

---

### `scripts/verify-build.sh` — extend with Gate 26 (sub-checks a/b/c) + Gate 27

**Analog:** Gate 25 (lines 934-949) — the closest "scope-locked grep against repo files" gate. Also draw from Gate 17 (lines 502-517) for the "test file exists / contains expected strings" structure.

**Analog code — Gate 25 structure (lines 934-949, verbatim):**
```bash
# Gate 25: px font-size literals only. rem/em allowed when relative-to-line-height is intentional [...]
# Locks SC6 / D-17(c): zero raw `font-size: Npx` literals outside src/styles/tokens.css.
# Tokens.css itself is allowed to declare px font-sizes — it's the canonical scale.
# Expected RED until Plan 05-05 sweeps the ~25 literals — that is correct.
gate25_hits=$(grep -rnE 'font-size:\s*[0-9]+(\.[0-9]+)?px' src/components/ src/pages/ src/layouts/ 2>/dev/null || true)
if [[ -n "$gate25_hits" ]]; then
  hit_count=$(echo "$gate25_hits" | wc -l | tr -d ' ')
  echo "  FAIL: Gate 25 — $hit_count raw \`font-size: Npx\` literal(s) found outside src/styles/tokens.css (SC6, D-17(c) — expected RED until Plan 05-05 sweeps):"
  echo "$gate25_hits" | head -10 | sed 's/^/    /'
  if (( hit_count > 10 )); then
    echo "    ... ($((hit_count - 10)) more)"
  fi
  fail=1
else
  echo "  OK: Gate 25 — zero raw \`font-size: Npx\` literals outside tokens.css"
fi
```

**Analog code — Gate 17 (lines 502-517, verbatim):**
```bash
# Gate 17 (Phase 3): dist/404.html exists, contains <h1> with "404", contains a discipline card link back to one of the 4 categories.
if [[ ! -f "$DIST/404.html" ]]; then
  echo "  FAIL: $DIST/404.html missing — D-14 custom 404 not built"
  fail=1
else
  if ! grep -q '<h1' "$DIST/404.html" 2>/dev/null; then
    echo "  FAIL: $DIST/404.html missing <h1>"
    fail=1
  fi
  if ! grep -qE 'href="/(design|finance|personal|marketing)"' "$DIST/404.html" 2>/dev/null; then
    echo "  FAIL: $DIST/404.html missing discipline card link back to a category"
    fail=1
  fi
  if [[ -f "$DIST/404.html" ]] && grep -q '<h1' "$DIST/404.html" 2>/dev/null && grep -qE 'href="/(design|finance|personal|marketing)"' "$DIST/404.html" 2>/dev/null; then
    echo "  OK: 404.html present with h1 + discipline card link"
  fi
fi
```

**Structural conventions to mirror (extracted from across all 25 gates):**
1. **Comment header** — multi-line `#` block stating: gate ID + 1-line "what", SC/D-ref anchor, plus "Expected RED until Plan XX-YY lands" if pre-fix.
2. **Either `[[ -f ... ]]` for file existence OR `grep -rnE ... 2>/dev/null || true` for content checks**, captured into a `gateNN_hits` (or boolean) variable.
3. **`if [[ ... ]]; then` branch** — on FAIL: `echo "  FAIL: Gate NN — <human-readable reason> (<SC>, <D-ref>)"`; then `fail=1`. On OK: `echo "  OK: Gate NN — <human-readable pass message>"`.
4. **Indent FAIL output `head -10 | sed 's/^/    /'`** if printing match lines (Gate 25 example).
5. **Trailing `|| true`** on every `grep -r ... 2>/dev/null` so `set -e` + `pipefail` don't abort the whole script on no-match.

**Pattern to apply — Gate 26a (og.png present + 1200×630):**
```bash
# Gate 26a (Phase 6): public/og.png present, is PNG, is 1200×630 (SC4 / D-03 / FOUND-04).
# OG card must exist as static asset reused by every page via Base.astro meta block.
# Expected RED until Phase 6 Wave 1 lands the rendered card — that is correct.
if [[ ! -f "public/og.png" ]]; then
  echo "  FAIL: Gate 26a — public/og.png missing (SC4 / D-03 — expected RED pre-Wave 1)"
  fail=1
else
  dims=$(file public/og.png | grep -oE '[0-9]+ x [0-9]+' | head -1)
  if [[ "$dims" != "1200 x 630" ]]; then
    echo "  FAIL: Gate 26a — public/og.png is $dims, expected 1200 x 630"
    fail=1
  else
    echo "  OK: Gate 26a — public/og.png present at 1200 x 630"
  fi
fi
```

**Pattern to apply — Gate 26b (sitemap-index + sitemap-0 in dist/):**
```bash
# Gate 26b (Phase 6): dist/sitemap-index.xml + dist/sitemap-0.xml exist post-build (SC4 / D-04).
# Emitted by @astrojs/sitemap integration in astro.config.mjs.
# Expected RED until Wave 1 wires the integration — that is correct.
gate26b_fail=0
for sm in "$DIST/sitemap-index.xml" "$DIST/sitemap-0.xml"; do
  if [[ ! -f "$sm" ]]; then
    echo "  FAIL: Gate 26b — $sm missing (@astrojs/sitemap not emitting; SC4 / D-04 — expected RED pre-Wave 1)"
    gate26b_fail=1
  fi
done
if [[ $gate26b_fail -eq 0 ]]; then
  echo "  OK: Gate 26b — sitemap-index.xml + sitemap-0.xml present in $DIST"
fi
```

**Pattern to apply — Gate 26c (robots.txt with Sitemap: line):**
```bash
# Gate 26c (Phase 6): public/robots.txt present + references sitemap-index.xml (SC4 / D-04).
if [[ ! -f "public/robots.txt" ]]; then
  echo "  FAIL: Gate 26c — public/robots.txt missing (SC4 / D-04)"
  fail=1
elif ! grep -q '^Sitemap:.*sitemap-index\.xml' public/robots.txt; then
  echo "  FAIL: Gate 26c — public/robots.txt missing 'Sitemap: <url>/sitemap-index.xml' line"
  fail=1
else
  echo "  OK: Gate 26c — public/robots.txt references sitemap-index.xml"
fi
```

**Pattern to apply — Gate 27 (D-06 straggler absence; regression lock):**
```bash
# Gate 27 (Phase 6): zero "transition: none" inside @media (prefers-reduced-motion: reduce) blocks
# in the three D-06-cleaned files. Locks D-08 surgical-policy compliance for exempt motions
# (StatusPill #12, back-pill #16, pager #18). Expected RED until Phase 6 D-06 cleanup lands.
gate27_fail=0
for src_file in src/components/StatusPill.astro src/pages/\[category\].astro src/pages/\[category\]/\[slug\].astro; do
  # Multi-line slurp: find @media (prefers-reduced-motion: reduce) blocks containing 'transition: none'.
  if perl -0777 -ne 'exit 1 if m{\@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[^}]*transition:\s*none}s' "$src_file"; then
    echo "  OK: Gate 27 — $src_file has no transition:none inside prefers-reduced-motion block"
  else
    echo "  FAIL: Gate 27 — $src_file contains transition:none inside prefers-reduced-motion (D-08 violation #12/#16/#18 — expected RED until D-06 cleanup)"
    gate27_fail=1
  fi
done
if [[ $gate27_fail -ne 0 ]]; then
  fail=1
fi
```

**Placement in `verify-build.sh`:** add a new "Phase 6 gates" header section after the "Phase 5 gates" block (after line 949), mirroring the `echo`-banner style at lines 537-538 / 848-849:
```bash
echo
echo "Phase 6 gates"
echo "============="
```

---

### `public/robots.txt` (new — static asset)

**Analog:** none in repo (no existing `.txt` in `public/`).

**Pattern to apply** (verbatim per RESEARCH §Wave 1 example — 4 lines):
```
User-agent: *
Allow: /

Sitemap: https://caleb-lim-portfolio.vercel.app/sitemap-index.xml
```

**Wave 2 amendment:** swap the host segment to `https://caleblim.com` (or D-08 fallback) after DNS verifies. Same edit lands on `astro.config.mjs:site`.

---

### `public/og.png` (new — static binary)

**Analog:** none. Repo precedent for `public/` images is `public/favicon.svg` (SVG, not PNG). The 1200×630 PNG has no in-repo template.

**Pattern to apply:** D-11 leaves the tool to executor. RESEARCH §Open Questions #1 recommends a `scripts/render-og-card.mjs` using `sharp@0.34.5` (already in `devDependencies`) for reproducibility — re-renders cleanly on token change. If Caleb has a Figma file, surface a checkpoint per D-11.

**Brand constraints** (D-03 / D-11 — non-negotiable):
- 1200 × 630 PNG
- Background: `--paper` (cream)
- "CALEB LIM" brand mark in Bricolage Grotesque, color `--ink`
- One accent from existing palette (`--design` / `--teal` / `--terracotta` / `--lime`)
- Optional tagline in JetBrains Mono

Reference token values live in `src/styles/tokens.css` (not read here — planner pulls when scaffolding the render script).

---

### `README.md` (new — repo root walkthrough)

**Analog:** `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` is the closest long-form markdown in repo. But README.md is recruiter/Caleb-facing on github.com, not GSD-internal — its tone and structure should mirror standard OSS README conventions, not the GSD verification template.

**Pattern to mirror — structure (per D-01 + D-02 + RESEARCH §Recommended Project Structure):**
1. Project name + 1-sentence pitch
2. Live URL (`https://caleblim.com` once registered, else Vercel default subdomain)
3. "Adding a piece" section — the SC3 walkthrough — numbered prose steps embedding the 5-8 screenshots from `docs/contributing/`. Steps cover: open github.dev → create folder under `src/content/pieces/` → add `index.md` with frontmatter → drop hero image → commit + push → watch Vercel deploy → live on prod.
4. "Adding a paginated-PDF piece" — single inline paragraph or 1-line `see docs/contributing/PDF.md` pointer (D-02 — NOT screenshot-walked).
5. Tech-stack 1-liner (Astro + Vercel, link out to PROJECT.md for depth).

Screenshot embed syntax (relative paths so github.com renders them):
```markdown
![Step 1 — open github.dev](docs/contributing/01-open-github-dev.png)
```

**Filename convention** (RESEARCH §Recommended Project Structure):
- `docs/contributing/01-open-github-dev.png`
- `docs/contributing/02-create-piece-folder.png`
- ... through `06-piece-live-on-prod.png` (5-8 total per D-01)

---

### `docs/contributing/0*.png` (new — doc binary assets)

**Analog:** none (`docs/` does not exist).

**Pattern to apply:** captured during the actual Caleb-runs-it dry run (per D-01 — "the dry run IS the documentation source"). Orchestrator captures screenshots while Caleb walks; no synthetic / mocked screenshots. Commit binaries directly to git (not LFS — file sizes are small, PNG of github.dev UI is tens of KB).

**Pitfall (RESEARCH §Anti-Patterns):** do NOT put screenshots in `public/` — they'd ship as deployed static assets and bloat the dist payload. `docs/` is git-tracked but never served.

---

### `CLAUDE.md` (modify — D-07 doc-rot amendment)

**Analog:** itself, lines 10-16 (Constraints block — contains "Cloudflare Pages" reference at line 12) and lines 59-75 (Hosting block — contains "Cloudflare Pages" at lines 61-62 and 75).

**Current code at line 12 (verbatim):**
```
- **Tech stack**: **Astro** with content collections (markdown + Zod schema), build-time PDF rasterization via `pdfjs-dist` + `@napi-rs/canvas`, motion via `motion` (formerly framer-motion) v12 and selective GSAP. Deployed to **Cloudflare Pages** (free tier, unlimited bandwidth). Domain via **Cloudflare Registrar** (~$10/yr). Decided after research surfaced a Framer-vs-Astro fork; owner is comfortable enough with markdown + git that no-code platform's main value disappeared, and Astro avoids the platform-lock-in pitfall.
```

**Current code at lines 59-75 (relevant excerpt):**
```
### Hosting
| Choice | Cost | Why |
|--------|------|-----|
| **Cloudflare Pages** | Free | Unlimited bandwidth on the free tier (Vercel: 100 GB cap and the Hobby plan technically prohibits commercial use, which a portfolio for job applications arguably is). 500 builds/month is plenty. Global edge. Git-based deploys. |
| Netlify | Free (100 GB) | Fine alternative; better forms handling out of the box if Caleb wants a contact form without writing function code. |
| Vercel | Free for hobby | Avoid for this — Hobby's commercial-use restriction is a grey area for a portfolio used in a job hunt. Move only if Caleb later shifts to a Next.js stack. |
...
# Deploy via Cloudflare Pages: connect git repo, set build command to `npm run build`, output dir to `dist/`.
```

**Pattern to apply:** mirror the 2026-05-18 FOUND-03 amendment style referenced in CONTEXT (inline amendment note + date). Surgical edits ONLY — don't rewrite the rationale paragraphs:
1. Line 12: replace `Deployed to **Cloudflare Pages** (free tier, unlimited bandwidth)` → `Deployed to **Vercel Hobby** (free tier; D-13 Phase 5 amendment, 2026-05-18 — was Cloudflare Pages)`.
2. Line 75 (the inline comment `# Deploy via Cloudflare Pages: ...`): replace `Cloudflare Pages` → `Vercel` and keep the commands intact (Vercel's CLI/dashboard also accepts `npm run build` + `dist/` output dir).
3. The full Hosting table at lines 60-64 is the original research artefact — leave the rows intact but prepend a 1-line note above the table: `> Amendment 2026-05-20 (FOUND-04 D-07): Vercel selected over Cloudflare Pages per Phase 5 D-13. Table below preserved as original research; current choice is Vercel.`

**Why this style:** preserves audit trail (decision rationale stays visible) while making the current state unambiguous — exact pattern CONTEXT cites as "2026-05-18 FOUND-03 amendment block."

---

### `.planning/PROJECT.md` (modify — D-07 doc-rot amendment)

**Analog:** the `<!-- GSD:project-start -->` block in CLAUDE.md (lines 1-17) is a mirror of PROJECT.md's content per the embedded `source:PROJECT.md` directive. Apply the SAME amendment style as CLAUDE.md line 12 above. RESEARCH §Runtime State Inventory confirms PROJECT.md "Constraints" section still references Cloudflare Pages.

**Pattern to apply:** identical inline-amendment-note style. Add date `2026-05-20`, reference D-07, name the prior choice. No content deletion — only addition.

---

## Shared Patterns

### Reduced-motion `@media` block (still allowed where motion is genuine)
**Source:** `src/layouts/Base.astro:159-161`
**Apply to:** any new spatial-motion CSS added in Phase 6 (none currently planned, but if executor adds a `.skip`-like transition it must carry this).
```css
@media (prefers-reduced-motion: reduce) {
  .skip { transition: none; }
}
```
D-06 deletes only the THREE specific blocks where the underlying motion is D-08 exempt (color-only / hover-feedback). The `.skip` block stays because translateY is spatial.

### `<Image>` invocation contract (Plan 05-04 canonical)
**Source:** `src/components/GalleryA12.astro:23-30` (also B35, C68, index.astro:78-84).
**Apply to:** any new or modified `<Image>` in Phase 6 — only `[category]/[slug].astro` hero qualifies.
**Required props in order:** `src` → `alt` → `class` → `priority` → `widths={[...]}` → `sizes`. No `format` (Astro 5 default = webp matches sources). No `loading` (Astro derives from `priority`).

### Vercel-amendment doc style (D-07)
**Source:** CONTEXT.md `<implementation_decisions> D-07` referencing "2026-05-18 FOUND-03 amendment block."
**Apply to:** both CLAUDE.md and `.planning/PROJECT.md`.
**Rule:** preserve original prose, add inline `(Amendment YYYY-MM-DD <D-ref>: <new>)` annotation OR a 1-line `> Amendment ...` callout above the affected table. Never delete the prior text — audit trail matters.

### `verify-build.sh` gate header style
**Source:** every gate from 5 onward — most explicit at Gate 23 (lines 851-862) which carries a full multi-paragraph rationale.
**Apply to:** new Gates 26a / 26b / 26c / 27.
**Required structure:**
```
# Gate NN (Phase X): <one-sentence "what" with SC/D-ref anchor>.
# <2-4 lines of "why" / rationale / what other gate it complements>.
# Expected RED until Plan XX-YY lands — that is correct.
```

### Reduced-motion validation walk (carryover from Phase 5)
**Source:** `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` (template for 06-VERIFICATION.md per CONTEXT canonical_refs).
**Apply to:** D-06 SC6 sign-off — same iPhone 15 / iOS 26.4.2 rig + reduce-motion-ON walk Plan 05-08 used.

---

## No Analog Found

| File | Why no analog | Planner action |
|------|---------------|----------------|
| `public/og.png` | No precedent PNG in `public/`; favicon is SVG. | Use RESEARCH §Open Questions #1 recommendation (sharp script) OR D-11 alternative (Figma export). Surface as checkpoint per D-11. |
| `public/robots.txt` | No `.txt` in `public/` (only `.svg`, `.pdf`, `.webp`). | Hand-author per RESEARCH §Wave 1 example — 4 lines, no template needed. |
| `docs/contributing/*.png` | `docs/` directory does not exist. | Net-new directory; create during dry-run capture per D-01 / D-10. |

---

## Metadata

**Analog search scope:** `src/` (layouts, components, pages, content), `scripts/`, `public/`, `.planning/phases/05-*/`, repo root, `docs/` (confirmed absent).
**Files scanned:** ~30 (4 layouts/pages read in full or partial, 4 gallery components grep'd, 25-gate verify-build.sh read whole, 2 doc files inspected).
**Pattern extraction date:** 2026-05-20
**Verified line numbers per RESEARCH D-06 correction:** StatusPill 82-85 ✓, [category] 140-142 ✓, [slug] 332-334 ✓ (re-read 2026-05-20 — all three exact).
**Verified D-05 root cause:** detail-hero `<Image>` at `[slug].astro:97-103` has `priority` + `sizes` but no `widths` — confirmed by reading the source; matches RESEARCH §Pattern 3 dist/ inspection.
