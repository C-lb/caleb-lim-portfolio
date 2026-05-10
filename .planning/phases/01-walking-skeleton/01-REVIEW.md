---
phase: 01-walking-skeleton
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - .gitignore
  - .nvmrc
  - astro.config.mjs
  - package.json
  - scripts/pdf-poc.mjs
  - scripts/verify-build.sh
  - src/content.config.ts
  - src/content/categories.ts
  - src/content/pieces/design-real-piece/index.md
  - src/content/pieces/finance-real-piece/index.md
  - src/content/pieces/marketing-real-piece/index.md
  - src/content/pieces/phase-1-skeleton/index.md
  - src/pages/[category].astro
  - src/pages/[category]/[slug].astro
  - src/pages/index.astro
  - tsconfig.json
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-10
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 1 walking-skeleton implementation is correct on all hot paths: the four category routes build, the four piece detail routes build, `Image` is used (no iframe), the Zod schema enforces the four-category enum and required CRO fields, and the content collection wiring matches the routing. Placeholder content, bare HTML, and missing styling are explicitly in scope for this phase per `01-CONTEXT.md` D-01..D-12 and not flagged.

The defects below cluster in `scripts/verify-build.sh`. The script aims to be a defensive smoke harness but its three "missing-directory" guards use three different recovery strategies, and one of them interacts badly with `set -euo pipefail`. None of this affects a green build today, but the script will misreport (or hard-crash mid-run) the moment a build does fail — which defeats its purpose. One smaller cross-file consistency issue in the gallery vs. detail draft filter is noted as info.

No security findings. No correctness bugs in the rendered output. No broken contracts against PIECE-01 / PIECE-02.

## Warnings

### WR-01: `verify-build.sh` Gate 4 hard-crashes (instead of FAIL-reporting) when a category directory is missing

**File:** `scripts/verify-build.sh:40-48`
**Issue:** The script sets `set -euo pipefail` (line 6). Gate 4's count is computed via a pipeline:

```bash
count=$(find "$DIST/$cat" -mindepth 2 -name index.html 2>/dev/null | wc -l | tr -d ' ')
```

If `$DIST/$cat` does not exist, `find` exits non-zero. `2>/dev/null` only silences stderr — the exit status still propagates, and `pipefail` makes the whole pipeline non-zero, which `set -e` then treats as fatal. The script aborts mid-Gate-4 instead of completing all gates and printing the consolidated "FAILED" footer.

This is the exact failure mode where the verifier matters most: a build that didn't produce one of the category directories. Gate 3 already catches that condition and sets `fail=1`, but it does not `continue`, so Gate 4 still tries to count detail pages in a directory that doesn't exist — and dies.

Compare Gate 5 (line 52), which appends `|| true` to recover, and Gate 6 (line 71), which uses process substitution that does not propagate exit status. Gate 4 is the odd one out.

**Fix:** Either skip Gate 4 for categories whose Gate 3 check failed, or recover the pipeline:

```bash
# Option A: guard on existence
if [[ -d "$DIST/$cat" ]]; then
  count=$(find "$DIST/$cat" -mindepth 2 -name index.html 2>/dev/null | wc -l | tr -d ' ')
else
  count=0
fi

# Option B: recover the pipeline
count=$( { find "$DIST/$cat" -mindepth 2 -name index.html 2>/dev/null || true; } | wc -l | tr -d ' ')
```

### WR-02: Gate 6 prints `OK: PIECE-02` even when a per-file FAIL was just emitted

**File:** `scripts/verify-build.sh:62-72`
**Issue:** Gate 6 iterates piece detail HTML and emits `FAIL: PIECE-02 violation in $html — missing:$missing` per-offender, setting `fail=1`. After the loop, the script unconditionally prints `OK: PIECE-02 — Context/Role/Outcome present in every piece detail page (if no FAIL line above)`. The parenthetical disclaimer admits the issue but doesn't fix it — a reader scanning the tail of the output sees `OK: PIECE-02` and may miss the upstream FAIL line. Final exit status is correct (`fail=1` still fails the script), but the per-gate output lies.

**Fix:** Track gate status locally and gate the OK message:

```bash
gate6_fail=0
while IFS= read -r html; do
  missing=""
  grep -q 'Context' "$html" || missing="$missing Context"
  grep -q 'Role' "$html"    || missing="$missing Role"
  grep -q 'Outcome' "$html" || missing="$missing Outcome"
  if [[ -n "$missing" ]]; then
    echo "  FAIL: PIECE-02 violation in $html — missing:$missing"
    fail=1
    gate6_fail=1
  fi
done < <(find "$DIST" -mindepth 3 -name index.html -type f)
if [[ $gate6_fail -eq 0 ]]; then
  echo "  OK: PIECE-02 — Context/Role/Outcome present in every piece detail page"
fi
```

## Info

### IN-01: Gate 5 grep is substring-match, not tag-match — false-positive risk in later phases

**File:** `scripts/verify-build.sh:52`
**Issue:** `grep -l 'iframe' {}` flags any occurrence of the literal string `iframe`, including comments, attribute values, JS string literals, or the word appearing inside another identifier (`my-iframe-handler`). Phase 1 placeholder HTML doesn't trigger it, but later phases that ship analytics scripts or embed third-party widgets via `<script>` may legitimately reference the string. PIECE-01's actual contract is "no `<iframe>` element rendering an embedded PDF," not "no occurrence of the substring."

**Fix:** Tighten the pattern to match an opening tag specifically, e.g. `grep -l -E '<iframe(\s|>)' {}`. Even better, anchor on the PDF use case PIECE-01 actually prohibits, e.g. `grep -l -E '<iframe[^>]*\.pdf' {}` — but the simple tag-match is fine.

### IN-02: Stale comment in Gate 5 references logic that isn't there

**File:** `scripts/verify-build.sh:51`
**Issue:** Comment reads `# Use grep -v '^$' to filter empties; check that NO file matches 'iframe'.` The actual command on the next line uses `find ... -exec grep -l 'iframe' {}` and does not pipe through `grep -v`. The "filter empties" instruction was either left over from an earlier draft or describes intent that wasn't implemented. Misleading either way.

**Fix:** Delete the first sentence of the comment, or replace it with a one-line statement of what the command actually does: `# Find any piece detail HTML that contains the literal 'iframe'.`

### IN-03: Three different "missing-directory recovery" patterns within one script

**File:** `scripts/verify-build.sh:40, 52, 71`
**Issue:** Gate 4 uses a bare pipeline (crashes under `pipefail` — see WR-01). Gate 5 uses `2>/dev/null || true`. Gate 6 uses process substitution (`< <(find ...)`) which doesn't propagate exit status. Three patterns for the same defensive purpose makes the script harder to reason about and review.

**Fix:** Pick one pattern and apply it consistently. After WR-01 is resolved, prefer the explicit `if [[ -d $DIST/$cat ]]` guard or the `{ find ... || true; }` recovery throughout.

### IN-04: Type assertion in `[category].astro` masks `Astro.params` type

**File:** `src/pages/[category].astro:9`
**Issue:** `const { category } = Astro.params as { category: Category };` is safe in practice because `getStaticPaths()` only emits the four valid category strings, but the cast hides the fact that `Astro.params` is typed as `Record<string, string | undefined>`. A runtime narrowing would catch a future regression where someone adds a new dynamic param or changes the route shape.

**Fix:** Either narrow at runtime, or — since `getStaticPaths` already guarantees the value — pass the category through as a prop and avoid the cast:

```ts
export async function getStaticPaths() {
  return CATEGORIES.map((cat) => ({ params: { category: cat }, props: { category: cat } }));
}
interface Props { category: Category; }
const { category } = Astro.props;
```

This mirrors the `props: { piece }` pattern already used in `[category]/[slug].astro:9-10`, so it's consistent with the codebase rather than introducing a new convention.

### IN-05: `draft !== true` filter duplicated across gallery and detail routes

**File:** `src/pages/[category].astro:11-13`, `src/pages/[category]/[slug].astro:7`
**Issue:** Both routes independently filter `data.draft !== true` against the pieces collection. If Phase 2 adds further publication gates (date, region, audience), the predicate has to change in two places and they can drift. Today this is purely a code-smell, not a correctness bug — both filters are identical.

**Fix:** Hoist into a shared helper, e.g. `src/content/pieces.ts`:

```ts
import { getCollection } from 'astro:content';
export const isPublished = ({ data }: { data: { draft?: boolean } }) => data.draft !== true;
export const getPublishedPieces = () => getCollection('pieces', isPublished);
```

Then both routes call `getPublishedPieces()` and stay in sync by construction.

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
