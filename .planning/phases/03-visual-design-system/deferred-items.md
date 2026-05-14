# Phase 3 — Deferred Items (out-of-scope for plans being executed)

Logged per executor scope-boundary rule. These are real findings but belong to other plans / phases. Do NOT fix them inside the originating plan's commits. Phase 03-05 owns the phase-close housekeeping pass that closes all of these.

## From Plan 03-02 (splash slice)

### `scripts/verify-build.sh` Gate 11 stale — needs spec sync

**Found during:** Plan 03-02 Task 2 (`npm run build` → `bash scripts/verify-build.sh`).

**Symptom:** Gate 11 grep `'What do you wish to see'` (no em tag) fails against the new splash output, which is `What do you wish to <em>see</em>?` per UI-SPEC.md line 284 + plan 03-02 must_haves.truth #8.

**Why deferred:** `scripts/verify-build.sh` is Phase 1+2 harness, and the new splash markup is the contract demanded by the plan. Updating the gate is a one-line script tweak owned by Phase 3 verification housekeeping (Plan 03-05 or a phase-close edit), not by 03-02's `files_modified` scope (which is splash + DisciplineCard only).

**Suggested fix (for the owner plan):** change line 22 of `scripts/verify-build.sh` to `grep -qE 'What do you wish to (see|<em>see</em>)' "$DIST/index.html"` so the gate accepts both the bare-HTML legacy and the Phase 3 spec.

### `scripts/verify-build.sh` Gates 12c (finance/personal route 404) + Gate 14 (custom 404) — wait on Plan 03-05 / siblings

**Found during:** same run.

**Symptom:** Gates fail with "finance has 0 non-draft pieces but dist/finance/index.html exists — D-07 requires the route to 404" and "dist/404.html missing — D-14 custom 404 not built".

**Why deferred:** D-07 (empty-discipline → /[category] route 404) is closed by Plan 03-03 (gallery slice — getStaticPaths filter); D-14 (custom 404 page) is owned by Plan 03-05. The SPLASH-04 contract (drop the card on the splash) IS satisfied — populatedCategories filter renders only design + marketing today.

### `scripts/verify-build.sh` "splash has N discipline-card links but 4 category routes exist" — same scope as above

**Found during:** same run.

**Symptom:** Gate fails because the splash now correctly renders 2 cards (design + marketing) while [category].astro emits routes only for populated categories (per 03-03).

**Why deferred:** Same root cause as the route-404 gate; fixed by 03-05 phase-close housekeeping.

## From Plan 03-03 (gallery slice)

### `scripts/verify-build.sh` Gate 3 + Gate 4 contradict Gate 16 (D-07 contract)

**Issue:** `scripts/verify-build.sh` was authored under Phase 1/2 assumption that all four category routes (design/finance/personal/marketing) always emit `dist/<cat>/index.html`. Plan 03-03 implements D-07 (empty disciplines drop their route via `getStaticPaths` filter), which Gate 16 explicitly checks. But Gate 3 (line 30-37) unconditionally requires `dist/<cat>/index.html` for all four, and Gate 4 (line 47-54) uses `find dist/<cat>` without `2>/dev/null`, which triggers `pipefail` under `set -euo pipefail` for missing categories — the script aborts mid-way (never reaching Gates 5-18).

**Why deferred:** `scripts/verify-build.sh` is not in this plan's `files_modified` scope; Plan 03-03 ran in parallel with siblings 03-02 (splash) and 03-04 (detail+about). Editing the verify script from a non-owning worktree risks merge conflicts with the sibling agents.

**Recommended fix (Plan 03-05 phase-close housekeeping):**
- Gate 3: change unconditional requirement to "OK if dist/<cat>/index.html exists OR all category pieces are draft+filtered (i.e. Gate 16 expected absence)"
- Gate 4: prefix `find` calls with `2>/dev/null || true` so missing dirs don't trip pipefail
- Or simply: delete Gate 3 + Gate 4 (Gate 16 supersedes them with the correct D-07-aware logic)

**Observed at:** Plan 03-03 Task 3 (build runs successfully; design + marketing emit correctly; finance + personal correctly absent per D-07; verify-build.sh aborts on Gate 4's `find dist/finance` because dir does not exist).

**Manual verification of what would pass if script continued:**
- Gate 15 (Bricolage in dist): PASSES (wired through Base.astro / tokens.css in 03-01a/01b)
- Gate 16 (populated vs empty): PASSES for all four (design + marketing emit; finance + personal correctly absent)
- Gate 17 (404.html): FAILS until Plan 03-05 lands
- Gate 18 (splash card count == populated count): PASSES (splash shows 2 cards; 2 categories emit routes)
