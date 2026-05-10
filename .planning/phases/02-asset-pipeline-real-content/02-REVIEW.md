---
phase: 02-asset-pipeline-real-content
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - scripts/pdf-preprocess.mjs
  - scripts/strip-resume-metadata.mjs
  - scripts/verify-build.sh
  - src/content.config.ts
  - src/pages/about.astro
  - src/pages/[category]/[slug].astro
findings:
  critical: 1
  warning: 7
  info: 5
  total: 13
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-10
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Implementation is solid in shape — hash-based cache, soft-fail on missing pages, build-time `.cache.json` for CLS prevention, and a thorough verification gate suite. The PDF rasterizer correctly avoids the documented Pitfalls (legacy entry, transitive canvas factory, no manual worker setup). Bio voice contract holds (111 words, no banned filler). The metadata stripper has a careful before/after audit and a fail-closed acceptance check.

The one BLOCKER is a content-leak: `getStaticPaths` correctly hides `draft: true` pieces from routing, but `pdf-preprocess.mjs` rasterizes and (with `fullPdf`) copies every piece including drafts into `public/`, so unpublished work ships to the live site at predictable URLs (`/generated/pdf-thumbs/<slug>/cover.webp`, `/source-pdfs/<slug>.pdf`). Anyone who guesses the slug — or anyone who finds these URLs in a stale CDN log — can fetch unreleased material.

The Warnings cluster around three themes: (1) the cache never prunes stale outputs, so deleting/shrinking `pdfPaginate` leaves orphan `page-N.webp` files in `public/` that ship as dead weight; (2) no contract enforced between `fullPdf` href value and the actual copied file path; (3) verify-build Gate 6 always prints OK regardless of whether the loop emitted FAILs (cosmetic — `fail` flag still trips the final exit, but the OK line is misleading and erodes trust in the gate output).

## Critical Issues

### CR-01: Draft pieces leak to production via prebuild

**File:** `scripts/pdf-preprocess.mjs:46-78` and `src/pages/[category]/[slug].astro:9`
**Issue:** `discoverPieces()` reads `fm.pdfPaginate` and `fm.fullPdf` straight from gray-matter without consulting `fm.draft`. Every piece with a `source.pdf` gets rasterized into `public/generated/pdf-thumbs/<slug>/` and (when `fullPdf` is set) the source PDF is copied to `public/source-pdfs/<slug>.pdf`. Astro publishes everything under `public/` verbatim. Meanwhile `[category]/[slug].astro:9` filters `draft !== true` from `getStaticPaths`, so the HTML detail page is hidden — but the assets are not. A draft piece with predictable slug is fetchable directly:

  - `https://site.tld/generated/pdf-thumbs/<slug>/cover.webp`
  - `https://site.tld/generated/pdf-thumbs/<slug>/page-N.webp`
  - `https://site.tld/source-pdfs/<slug>.pdf` (when `fullPdf` set)

This defeats the purpose of `draft: true`. For a portfolio used in a job hunt, leaking unfinished or NDA-restricted client work is a real harm.

**Fix:** Filter drafts in `discoverPieces()` before rasterization.

```js
// scripts/pdf-preprocess.mjs — inside discoverPieces() loop
const { data: fm } = matter(md);
if (fm.draft === true) {
  console.log(`SKIP ${slug} (draft)`);
  continue;
}
out.push({ slug, sourcePdfPath, pdfPaginate: fm.pdfPaginate, fullPdf: fm.fullPdf });
```

Also delete any pre-existing artifacts for a piece that flips back to `draft: true` — see WR-01 for the prune mechanism that should run alongside this.

## Warnings

### WR-01: Cache hit + shrunk `pdfPaginate` leaves orphan `page-N.webp` files in public

**File:** `scripts/pdf-preprocess.mjs:96-186`
**Issue:** When `pdfPaginate` changes from `[1, 5, 12, 23]` to `[1, 5]`, the input hash changes (`pdfPaginate` participates in the hash), so the script regenerates. But it only writes the new pages — it never removes `page-12.webp` or `page-23.webp` from the thumb directory. Those orphan files still ship to production because `public/generated/` is published wholesale. They're dead bytes (and potentially leak intent — "page 23 used to be relevant").

A worse variant: if `pdfPaginate` is removed entirely on a piece that previously had pages, the input hash changes and regenerate runs, but the only output is `cover.webp`. All previous `page-N.webp` siblings persist.

**Fix:** Before writing new pages on a regenerate path, prune the thumb directory of stale `page-*.webp` files:

```js
// scripts/pdf-preprocess.mjs — after the cache miss / mkdir, before the render loop
const existing = await fs.readdir(thumbDir).catch(() => []);
const expected = new Set([
  'cover.webp',
  '.cache.json',
  ...pagesToRender.filter((n) => n !== 1).map((n) => `page-${n}.webp`),
]);
for (const f of existing) {
  if (!expected.has(f)) await fs.unlink(path.join(thumbDir, f));
}
```

### WR-02: No contract between `fullPdf` href and the copied file path

**File:** `scripts/pdf-preprocess.mjs:91-94, 178` and `src/pages/[category]/[slug].astro:78-80`
**Issue:** `copySourcePdf` always writes to `public/source-pdfs/<slug>.pdf`. The detail page renders `<a href={fullPdf} download>` using whatever string is in frontmatter. If frontmatter says `fullPdf: "/files/old-name.pdf"` (or any other path), the link points one place and the file lives at another — silent 404 for the recruiter clicking "Open full PDF". The Zod schema doesn't pin `fullPdf` to a specific shape; the schema's own `.describe()` says "Typically `/source-pdfs/[slug].pdf`" but doesn't enforce it.

**Fix:** Either (a) compute the href in the route from the slug (`/source-pdfs/${slug}.pdf`) and treat the schema field as a boolean toggle; or (b) validate at schema time that the value matches `/source-pdfs/${slug}.pdf` (requires a refinement against the entry id). Option (a) is simpler:

```ts
// src/content.config.ts
fullPdf: z.boolean().optional()
  .describe('When true, prebuild copies source.pdf → public/source-pdfs/<slug>.pdf and the detail page renders the "Open full PDF" link.'),
```

```astro
{fullPdf && (
  <p><a href={`/source-pdfs/${slug}.pdf`} download>Open full PDF</a></p>
)}
```

Verify-build Gate 11 must be updated in lockstep.

### WR-03: Verify-build Gate 6 prints OK even when the loop above emitted FAILs

**File:** `scripts/verify-build.sh:69-80`
**Issue:** The PIECE-02 loop sets `fail=1` on each missing tag, but line 80 unconditionally prints `OK: PIECE-02 ... (if no FAIL line above)`. The "(if no FAIL line above)" parenthetical concedes the bug. CI / log-scanning tooling (or a sleep-deprived reviewer) reads OK and moves on. The `fail` flag still trips the final exit code, so the build correctly fails — but the gate output lies.

**Fix:** Track a per-gate flag.

```bash
gate6_fail=0
while IFS= read -r html; do
  missing=""
  grep -q 'Context' "$html" || missing="$missing Context"
  grep -q 'Role'    "$html" || missing="$missing Role"
  grep -q 'Outcome' "$html" || missing="$missing Outcome"
  if [[ -n "$missing" ]]; then
    echo "  FAIL: PIECE-02 violation in $html — missing:$missing"
    fail=1; gate6_fail=1
  fi
done < <(find "$DIST" -mindepth 3 -name index.html -type f)
if [[ "$gate6_fail" -eq 0 ]]; then
  echo "  OK: PIECE-02 — Context/Role/Outcome present in every piece detail page"
fi
```

### WR-04: `pdfPaginate: [0]` or non-integer in frontmatter crashes prebuild before Zod can give a clean error

**File:** `scripts/pdf-preprocess.mjs:128-138` and `src/content.config.ts:21-22`
**Issue:** Zod enforces `.int().positive()` on `pdfPaginate`, but Zod runs inside `astro build`, which runs *after* `prebuild`. The prebuild reads frontmatter via gray-matter and feeds page numbers straight to `pdfDocument.getPage(n)`. Calling `getPage(0)` rejects with "Invalid page request" and the script exits 1 — the user sees a pdfjs internal error message instead of "frontmatter validation failed: pdfPaginate[0] must be ≥1".

Zod is also too permissive: positive integers up to `Number.MAX_SAFE_INTEGER` are accepted, and `numPages > pageNum` only catches the out-of-range case after triggering a soft warning. There's no upper-bound sanity check on input.

**Fix:** Validate in `discoverPieces()` before rasterizing.

```js
const pp = fm.pdfPaginate;
if (pp !== undefined) {
  if (!Array.isArray(pp) || !pp.every((n) => Number.isInteger(n) && n >= 1)) {
    throw new Error(`${slug}: pdfPaginate must be an array of positive integers, got ${JSON.stringify(pp)}`);
  }
}
```

### WR-05: `Array.isArray` check missing on `pdfPaginate` before `.filter()`

**File:** `scripts/pdf-preprocess.mjs:128`
**Issue:** `(pdfPaginate ?? []).filter(...)` assumes `pdfPaginate` is either undefined/null or an array. If a content author writes `pdfPaginate: 5` (scalar) or `pdfPaginate: "1,5,12"` (string) in YAML, gray-matter happily parses it and `.filter is not a function` bubbles up as a generic crash. Same root cause as WR-04. Schema validation happens later.

**Fix:** Defensive coerce in `hashInputs` and `pagesToRender` construction. Or fold into the validation suggested in WR-04.

### WR-06: `process.cwd()` in `[category]/[slug].astro` couples the route to invocation directory

**File:** `src/pages/[category]/[slug].astro:24`
**Issue:** `path.join(process.cwd(), 'public', ...)` resolves against wherever `astro build` is invoked. Cloudflare Pages runs the build from the repo root, so today this works. But the moment someone runs `cd src && astro build` for debugging, or a future build wrapper changes cwd, the cache reads silently fail (caught by the bare `catch {}`), and pages render with no thumbnails — no warning.

**Fix:** Use a path relative to the file via `import.meta.url`, or pass an explicit project-root constant. Cleanest is to import the cache as JSON via Vite's glob import, which Astro ships:

```ts
// At the top of the frontmatter block
const caches = import.meta.glob<{ pages: Array<{n:number;w:number;h:number;file:string}> }>(
  '/public/generated/pdf-thumbs/*/.cache.json',
  { eager: true, import: 'default' }
);
const thumbCache = caches[`/public/generated/pdf-thumbs/${slug}/.cache.json`] ?? null;
```

This also surfaces missing-cache as a build-time signal instead of a runtime swallowed catch.

### WR-07: Bare `catch` swallows JSON parse errors and produces silent missing-thumbnail bug

**File:** `src/pages/[category]/[slug].astro:25-26`
**Issue:** `try { ... JSON.parse(await fs.readFile(...)) } catch { /* skip */ }`. Two distinct failure modes are conflated: (a) cache file doesn't exist (legitimate — piece has no PDF), and (b) cache file exists but is corrupt/unreadable/malformed JSON (a real bug — prebuild wrote garbage, or a partial-write race left it truncated). Mode (b) silently degrades the page to "no paginated images" with no log entry. Combined with verify-build Gate 10 only running on pieces with `pdfPaginate` in frontmatter, a corrupt cache for a piece that has both `pdfPaginate` and `source.pdf` will pass build but render broken.

**Fix:** Distinguish ENOENT from parse failure.

```ts
try {
  thumbCache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
} catch (err: any) {
  if (err?.code !== 'ENOENT') throw err; // surface corruption / permission errors
}
```

## Info

### IN-01: PIPELINE_VERSION bump is convention, not enforced

**File:** `scripts/pdf-preprocess.mjs:37-44`
**Issue:** The comment correctly notes that editing `RESIZE_LONG_EDGE` / `WEBP_QUALITY` / `RENDER_SCALE` without bumping `PIPELINE_VERSION` is a footgun. There's no enforcement — it's a please-remember. Consider folding the render constants themselves into the hash:

**Fix:**
```js
return createHash('sha256')
  .update(bytes)
  .update('|paginate=').update(JSON.stringify(pdfPaginate ?? []))
  .update('|render=').update(JSON.stringify({ RESIZE_LONG_EDGE, WEBP_QUALITY, RENDER_SCALE }))
  .update('|v=').update(PIPELINE_VERSION)
  .digest('hex');
```

Then `PIPELINE_VERSION` is only needed for changes the constants don't capture (e.g. switching encoder libraries).

### IN-02: PDF read twice per cache-miss piece

**File:** `scripts/pdf-preprocess.mjs:81, 117`
**Issue:** `hashInputs` reads `fs.readFile(pdfPath)` (line 81) and the rasterizer re-reads it on line 117 to build the `Uint8Array` for pdfjs. Cheap for a 5–15 piece portfolio, but trivially avoidable: hash the bytes once and reuse.

**Fix:**
```js
const bytes = await fs.readFile(sourcePdfPath);
const inputHash = createHash('sha256').update(bytes)./* ... */.digest('hex');
// later: const data = new Uint8Array(bytes);
```

### IN-03: `pdf-preprocess.mjs` exit-code contract documents code 2 but never emits it

**File:** `scripts/pdf-preprocess.mjs:20-23`
**Issue:** Header comment claims "2 = missing input precondition (reserved; not used in this script)". Reserving an unused exit code in documentation invites future contributors to silently introduce inconsistent meanings. Either delete the line or actually use it (e.g. exit 2 when `PIECES_DIR` doesn't exist instead of returning empty silently — though current behavior is reasonable for a fresh repo).

**Fix:** Drop the reserved-code line, or implement it for the `ENOENT` branch on `PIECES_DIR`.

### IN-04: Verify-build Gate 10/11 detail-html lookup uses `head -1` and assumes a piece appears under exactly one category

**File:** `scripts/verify-build.sh:165, 214`
**Issue:** `find ... -path "*/$slug/*" | head -1` finds the first matching detail page. The `[category]/[slug].astro` route generates one path per piece (per `getStaticPaths`), so this is correct today. But if someone later changes the schema to allow `category: string[]` (multi-category), or a slug collision occurs across two pieces in different categories, the gate silently checks only one of them.

**Fix:** Drop `| head -1` and loop:
```bash
while IFS= read -r detail_html; do
  # ... existing check body
done < <(find "$DIST" -mindepth 3 -name index.html -path "*/$slug/*" -type f)
```

### IN-05: About-page bio is committed as DRAFT but not flagged at runtime

**File:** `src/pages/about.astro:14-17`
**Issue:** Frontmatter comment says "DRAFT pending Caleb sign-off". There's no machine-readable signal — no env-gated banner, no top-of-page note. If Caleb forgets to replace it, the site ships with provisional copy and no visual reminder. Verify-build Gate 9 only checks word count and banned phrases, not draft status.

**Fix:** Either add an obvious `<!-- DRAFT: replace before launch -->` HTML comment that grep-trivially fails a verify-build gate, or render a visible "draft" badge gated on `import.meta.env.DEV`. The HTML-comment + gate is more reliable since the visual badge requires Caleb to notice it.

```bash
# Gate 9b in verify-build.sh
if grep -q 'DRAFT: replace before launch' "$ABOUT"; then
  echo "  FAIL: About page still contains DRAFT marker"
  fail=1
fi
```

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
