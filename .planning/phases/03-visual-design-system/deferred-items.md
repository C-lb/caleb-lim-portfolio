# Phase 3 — Deferred Items (out-of-scope for plan being executed)

Logged per executor scope-boundary rule. These are real findings but belong to other plans / phases. Do NOT fix them inside the current plan's commits.

## From Plan 03-02 (splash slice)

### `scripts/verify-build.sh` Gate 11 stale — needs spec sync

**Found during:** Plan 03-02 Task 2 (`npm run build` → `bash scripts/verify-build.sh`).

**Symptom:** Gate 11 grep `'What do you wish to see'` (no em tag) fails against the new splash output, which is `What do you wish to <em>see</em>?` per UI-SPEC.md line 284 + plan 03-02 must_haves.truth #8.

**Why deferred:** `scripts/verify-build.sh` is Phase 1+2 harness, and the new splash markup is the contract demanded by the plan. Updating the gate is a one-line script tweak owned by Phase 3 verification housekeeping (Plan 03-05 or a phase-close edit), not by 03-02's `files_modified` scope (which is splash + DisciplineCard only).

**Suggested fix (for the owner plan):** change line 22 of `scripts/verify-build.sh` to `grep -qE 'What do you wish to (see|<em>see</em>)' "$DIST/index.html"` so the gate accepts both the bare-HTML legacy and the Phase 3 spec.

### `scripts/verify-build.sh` Gates 12c (finance/personal route 404) + Gate 14 (custom 404) — wait on Plan 03-05 / siblings

**Found during:** same run.

**Symptom:** Gates fail with "finance has 0 non-draft pieces but dist/finance/index.html exists — D-07 requires the route to 404" and "dist/404.html missing — D-14 custom 404 not built".

**Why deferred:** D-07 (empty-discipline → /[category] route 404) and D-14 (custom 404 page) are owned by Plan 03-05 per phase plan. My SPLASH-04 contract (drop the card on the splash) IS satisfied — populatedCategories filter renders only design + marketing today. The unrelated route-404 + custom-404 gates will go green once 03-05 lands.

### `scripts/verify-build.sh` "splash has N discipline-card links but 4 category routes exist" — same scope as above

**Found during:** same run.

**Symptom:** Gate fails because the splash now correctly renders 2 cards (design + marketing) while [category].astro still emits 4 empty galleries.

**Why deferred:** This is the inverse face of Gates 12c/14 — same root cause, fixed by 03-05.
