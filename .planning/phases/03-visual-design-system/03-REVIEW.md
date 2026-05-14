---
phase: 03-visual-design-system
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/styles/tokens.css
  - src/styles/disciplines.ts
  - src/layouts/Base.astro
  - src/components/StatusPill.astro
  - src/components/DisciplineCard.astro
  - src/components/GalleryA12.astro
  - src/components/GalleryB35.astro
  - src/components/GalleryC68.astro
  - src/pages/index.astro
  - src/pages/[category].astro
  - src/pages/[category]/[slug].astro
  - src/pages/about.astro
  - src/pages/404.astro
  - scripts/verify-build.sh
  - scripts/verify-anti-ai-tells.sh
findings:
  critical: 0
  warning: 6
  info: 4
  total: 10
status: PARTIAL
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-14
**Depth:** standard
**Files Reviewed:** 15
**Status:** PARTIAL — no blockers; 6 warnings require attention before phase exit

## Summary

Phase 03 ships a complete visual design system: token layer, discipline constants, three gallery buckets, detail page, splash drop-card logic, custom 404, and two verification scripts. The architecture is sound — DISCIPLINE_ACCENT/DISCIPLINE_K are the single source of truth, the paginated PDF block correctly uses plain `<img>` (Pitfall-1 satisfied), reduced-motion is covered globally in tokens.css with per-component overrides in all three gallery components, and the anti-AI-tell script correctly uses `\bInter\b` as required.

No finding prevents the build from completing. The warnings cluster around three areas: (1) a tag-counter overflow bug in galleries when N < slot max, (2) a real href injection vector on the `fullPdf` field, and (3) several accumulated code-quality issues.

---

## Warnings

### WR-01: Tag counter overflows to two digits when total ≥ 10

**File:** `src/components/GalleryA12.astro:21`, `src/components/GalleryB35.astro:21`, `src/components/GalleryC68.astro:26`

**Issue:** The tag string is built as `0{slot} / 0{total}` with a hard-coded leading `0` prefix on both numbers. This is fine for single-digit values, but if `total` ever reaches 10 the rendered text becomes `01 / 010` — the literal zero prepended to the two-digit string. GalleryC68 truncates at 8 so `total` is capped at 8, but GalleryA12 has no truncation and passes `pieces.length` directly from the caller. The parent `[category].astro` applies GalleryA12 when `n <= 2`, so the overflow cannot fire in the current routing logic — but the component has no internal guard, making it a latent bug the next developer will step on.

**Fix:**
```astro
// Replace the fixed-prefix template in all three galleries
const fmt = (n: number) => String(n).padStart(2, '0');
// then in JSX:
<span class="tag">{fmt(slot)} / {fmt(total)}</span>
```

---

### WR-02: `fullPdf` href is not path-constrained — open redirect / path injection

**File:** `src/pages/[category]/[slug].astro:93-96`

**Issue:** `fullPdf` is written directly into an `<a href={fullPdf}>` with no validation. The field comes from the content collection's YAML frontmatter, which is Zod-validated at build time — but the schema for `fullPdf` is not visible in the reviewed files, so it is unknown whether Zod constrains the value to a local path (`/source-pdfs/...`) or accepts arbitrary strings. If the schema accepts any string (e.g. `z.string().optional()`), a content author could write `fullPdf: "javascript:alert(1)"` or `fullPdf: "https://evil.example"` in a piece's frontmatter and ship it. This is a build-time injection, not a runtime one, but it still produces a malicious link in the published HTML.

**Fix:** Add a path-shape constraint in the Zod schema for the `pieces` collection:
```ts
// In src/content/config.ts (or wherever the collection schema lives)
fullPdf: z.string().regex(/^\/[\w\-./]+\.pdf$/).optional(),
```
If the schema already constrains this, annotate it with a comment in `[slug].astro` so the next reviewer can stop worrying here.

---

### WR-03: Gallery tile color is hardcoded per-slot, not driven by `--accent`

**File:** `src/components/GalleryB35.astro:101-181`, `src/components/GalleryC68.astro:107-169`, `src/components/GalleryA12.astro:101-136`

**Issue:** The check item for this review was "CSS `--accent` flows through `--accent` style attr; consumed by gallery tiles + back-pill." The back-pill on `[category].astro` correctly consumes `--accent`. However, the gallery tiles themselves have hardcoded discipline colors per slot (p1=`var(--terracotta)`, p2=`var(--cobalt)`, p3=`var(--acid)`, etc.) regardless of which discipline category is being viewed. A Finance gallery and a Design gallery render identically colored tiles. This contradicts the design system's intent that each discipline has a distinct accent palette, and will confuse content-aware review of the visual output. It is not a build blocker but it is a spec deviation — the `--accent` CSS variable is set on `.b-category` in `[category].astro:42` but is never consumed by the gallery tile components.

**Fix:** Either (a) pass `accent` as a prop into each Gallery component and use it to tint at least the p1 hero tile, overriding the hardcoded palette; or (b) explicitly document in the UI-SPEC that the gallery tiles use a fixed multi-color composition deliberately independent of the page accent, so future reviewers know this is intentional.

---

### WR-04: `[category].astro` warns to `console.warn` at runtime but GalleryC68 also warns at the component level — double-warn

**File:** `src/pages/[category].astro:29`, `src/components/GalleryC68.astro:15-17`

**Issue:** When a category has more than 8 pieces, both `[category].astro` (line 29) and `GalleryC68.astro` (lines 15-17) emit a `console.warn` with nearly identical messages. This produces two warning lines per over-budget category in every build. The redundancy is low-harm, but it signals that the truncation guard logic is split across two layers without a clear ownership boundary. If the bucket-routing condition ever changes (e.g. a Bucket D is added), one warn will be orphaned without the author noticing.

**Fix:** Remove the redundant warn from `[category].astro:29`. GalleryC68 already owns the truncation and the warning; the page layer only needs to route.

---

### WR-05: `DisciplineCard` `index` prop has a type of `1 | 2 | 3 | 4` but the cast at call sites is unsafe

**File:** `src/pages/index.astro:65`, `src/pages/404.astro:37`

**Issue:** Both call sites cast `(i + 1) as 1 | 2 | 3 | 4`. When `populatedCategories` has fewer than 4 entries — which is the whole point of the D-07 drop-card logic — indices 1 through N are correct. But if `populatedCategories.length` is 0 (all categories empty), the `map` produces no iterations so no invalid cast fires. The cast is therefore safe in the current routing constraints. However the type assertion `as 1 | 2 | 3 | 4` papers over a real type mismatch — `i + 1` is `number`, not a literal union — and it will silently pass TypeScript even if the component's prop contract is later changed. A safer approach is a runtime narrowing or a typed helper.

**Fix:**
```ts
function toCardIndex(n: number): 1 | 2 | 3 | 4 {
  if (n < 1 || n > 4) throw new Error(`Card index ${n} out of range`);
  return n as 1 | 2 | 3 | 4;
}
// usage:
index={toCardIndex(i + 1)}
```

---

### WR-06: `verify-anti-ai-tells.sh` Gate A3 purple-gradient regex is too broad and will false-positive on the plum tile

**File:** `scripts/verify-anti-ai-tells.sh:35`

**Issue:** The purple-gradient grep chain pipes gradient hits through a second grep that also matches on a hex character class: `#[6-9a-f][0-9a-f]{2}f[0-9a-f]{2}f[0-9a-f]`. The intent is to catch purple-ish hex values. However, the plum color `#5a1a55` does not match this pattern (first char is `5`, not `6-9a-f`), so the existing palette is safe. The real risk is that the regex is complex enough that the hex pattern is likely wrong — a purple like `#7c3aed` would match if ever introduced in a comment or variable name without being a gradient. More concretely, the `find | xargs grep` pipeline does not correctly handle the case where `find` returns nothing: on some shells the trailing `2>/dev/null` swallows the "no matches" exit from `find` but `xargs` then passes nothing to `grep`, which returns exit 1 under some implementations, causing the `&&` to short-circuit before writing to `/tmp/grad-hits`, leaving the gate silently green even if a previous run had left stale data in that temp file. The temp file is cleaned up at the end of each gate, but a prior crash could leave one behind.

**Fix:** Use a named pipe or inline pattern, and guard the `find` output before piping to xargs:
```bash
# Simpler and more reliable:
if grep -rnE 'linear-gradient|radial-gradient' src/ dist/_astro/ 2>/dev/null \
    | grep -iE 'purple|violet|fuchsia'; then
  echo "  FAIL: purple gradient detected"
  fail=1
fi
```
This eliminates the temp-file dependency and the unreliable `find | xargs | grep` chain.

---

## Info

### IN-01: `Base.astro` footer center text is hardcoded and not a design token or prop

**File:** `src/layouts/Base.astro:36`

**Issue:** `"available for full-time roles, brand+analyst+design"` is a hardcoded marketing string in the layout component. When Caleb accepts a role, this string needs to be edited in the layout rather than in a config or content file. Minor, but it will be a surprise when the time comes.

**Fix:** Expose a `footerStatus?: string` prop with the current string as default, or move it to a site-config constant.

---

### IN-02: `GalleryA12.astro` tile colors are hardcoded as terracotta (p1) and cobalt (p2), not parameterized

**File:** `src/components/GalleryA12.astro:104,122`

**Issue:** See WR-03 for the broader issue. As an info-level callout: specifically for GalleryA12, a 1-piece gallery renders only p1 (terracotta background) regardless of which discipline it belongs to. A single Personal Project piece would render on a terracotta tile — the wrong accent — with no visual affordance for the lime/acid palette.

**Fix:** Addressed by WR-03 remediation. Noting separately so it is tracked even if WR-03 is deferred.

---

### IN-03: `[slug].astro` catches all errors from `.cache.json` read silently with an empty `catch`

**File:** `src/pages/[category]/[slug].astro:29`

**Issue:** The `catch` block is completely empty — it swallows any error including permission errors, malformed JSON, or an entirely missing `public/generated/` directory. Build-time silent failure means a piece will render without its paginated images with no log output. The comment `/* no thumbs for this piece — skip pagination */` makes the intent clear, but conflates "file not found" (expected) with "JSON parse error" (unexpected / bad data).

**Fix:**
```ts
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.warn(`[slug] Failed to read .cache.json for ${slug}:`, e);
  }
  /* ENOENT = no thumbs for this piece — skip pagination silently */
}
```

---

### IN-04: `DisciplineCard` k2 numeral is hardcoded as `'2'` regardless of the card's actual index

**File:** `src/components/DisciplineCard.astro:23,30`

**Issue:** When D-07 drops empty disciplines, the Finance card (k2) may render at position index=1 or index=2 depending on which other disciplines are populated. The `.deco` numeral is always `'2'` (the discipline key), which is the sketch's intent. However, if Finance is the only populated discipline it renders at index=1 with a deco numeral of "2" — potentially confusing ("2" with no other visible cards). This is a minor UX inconsistency. It may be intentional (the numeral represents the k-variant, not the position), but it is not documented.

**Fix:** Either add a comment in the component making the intent explicit (`{/* k2 numeral is always '2' — discipline key, not card position */}`), or if it should track position, use `{k === 2 ? String(index) : ''}`.

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
