# Deferred Items — Phase 03 Visual Design System

## Out-of-scope discoveries from Plan 03-03 execution

### verify-build.sh Gate 3 + Gate 4 contradict Gate 16 (D-07 contract)

**Issue:** `scripts/verify-build.sh` was authored under Phase 1/2 assumption that all four category routes (design/finance/personal/marketing) always emit `dist/<cat>/index.html`. Plan 03-03 implements D-07 (empty disciplines drop their route via `getStaticPaths` filter), which Gate 16 explicitly checks. But Gate 3 (line 30-37) unconditionally requires `dist/<cat>/index.html` for all four, and Gate 4 (line 47-54) uses `find dist/<cat>` without `2>/dev/null`, which triggers `pipefail` under `set -euo pipefail` for missing categories — the script aborts mid-way (never reaching Gates 5-18).

**Why deferred:** `scripts/verify-build.sh` is not in this plan's `files_modified` scope; Plan 03-03 is running in parallel with siblings 03-02 (splash) and 03-04 (detail+about). Editing the verify script from a non-owning worktree risks merge conflicts with the sibling agents.

**Recommended fix (future plan):**
- Gate 3: change unconditional requirement to "OK if dist/<cat>/index.html exists OR all category pieces are draft+filtered (i.e. Gate 16 expected absence)"
- Gate 4: prefix `find` calls with `2>/dev/null || true` so missing dirs don't trip pipefail
- Or simply: delete Gate 3 + Gate 4 (Gate 16 supersedes them with the correct D-07-aware logic)

**Observed at:** Plan 03-03 Task 3 (build runs successfully; design + marketing emit correctly; finance + personal correctly absent per D-07; verify-build.sh aborts on Gate 4's `find dist/finance` because dir does not exist)

**Manual verification of what would pass if script continued:**
- Gate 15 (Bricolage in dist): would PASS (Plan 03-01a wired this through Base.astro / tokens.css)
- Gate 16 (populated vs empty): would PASS for all four (design + marketing emit; finance + personal correctly absent)
- Gate 17 (404.html): would FAIL (Plan 03-05 owns 404)
- Gate 18 (splash card count == populated count): depends on sibling 03-02; cannot evaluate from this worktree
