---
phase: 03-visual-design-system
plan: 01a
subsystem: ui
tags: [design-system, tokens, fonts, css, fontsource, css-variables, reduced-motion]

# Dependency graph
requires:
  - phase: 01-walking-skeleton
    provides: "src/content/categories.ts (CATEGORIES + Category type) — Category enum imported by disciplines.ts"
provides:
  - "Three Fontsource variable font packages installed (Bricolage Grotesque 5.2.10, Fraunces 5.2.9, JetBrains Mono 5.2.8) — self-hosted, MIT-licensed, woff2"
  - "src/styles/tokens.css — :root design tokens (7 colors, 3 font-family, 11 font-size, 5 line-height, 7 spacing) + minimal reset + global reduced-motion block"
  - "src/styles/disciplines.ts — DISCIPLINE_ACCENT (Category→hex) and DISCIPLINE_K (Category→1|2|3|4) typed const single source of truth for D-01 + D-03"
affects: [03-01b, 03-02, 03-03, 03-04, 03-05, 04-header-chrome, 05-mobile-perf-a11y]

# Tech tracking
tech-stack:
  added:
    - "@fontsource-variable/bricolage-grotesque@5.2.10"
    - "@fontsource-variable/fraunces@5.2.9"
    - "@fontsource-variable/jetbrains-mono@5.2.8"
  patterns:
    - "CSS custom properties at :root (D-17 — plain CSS, no Tailwind)"
    - "Sibling-const single-source-of-truth pattern: disciplines.ts imports Category from categories.ts (mirrors existing CATEGORIES pattern)"
    - "Self-hosted Fontsource variable woff2 — Fontsource appends 'Variable' to family names ('Bricolage Grotesque Variable')"
    - "Global @media (prefers-reduced-motion: reduce) block in tokens.css — disables hover transforms + animations site-wide (D-13)"

key-files:
  created:
    - "src/styles/tokens.css"
    - "src/styles/disciplines.ts"
  modified:
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "D-01: Discipline→accent hex mapping locked in src/styles/disciplines.ts as DISCIPLINE_ACCENT typed const — never hard-code hexes elsewhere"
  - "D-11: Phase 3 motion contract is sketch-equivalent only — zero JS motion deps (motion/gsap/lenis) introduced; verified by grep returning 0 matches in package.json"
  - "D-13: Reduced-motion CSS shipped now in tokens.css (single global block) rather than retrofitting Phase 5 — 2 lines of CSS, lower cost than the carry-over"
  - "D-15/D-16: Self-host all three faces via Fontsource variable woff2; Bricolage full opsz+wdth+wght axes shipped"
  - "D-17: Plain CSS with :root custom properties — no Tailwind, no PostCSS plugins beyond Astro defaults"
  - "OVERRIDE-01 (Typography): 11 font-size tokens explicitly above gsd-ui-checker's default of 4 — magazine-grade hierarchy IS the brand artifact"

patterns-established:
  - "P1: CSS token layer at :root — every downstream component reads color/type/spacing via var(--*), no hard-coded values"
  - "P2: Discipline accent flow via typed Record<Category, string> — UI components read DISCIPLINE_ACCENT[category], not literal hexes"
  - "P3: Fontsource variable face naming — every font-family token includes 'Variable' suffix (Bricolage Grotesque Variable, Fraunces Variable, JetBrains Mono Variable)"
  - "P4: Reduced-motion is a tokens-layer concern — single global block, no per-component CSS"

requirements-completed: [VISUAL-01, VISUAL-02]

# Metrics
duration: 6min
completed: 2026-05-14
---

# Phase 3 Plan 01a: Token Foundation Summary

**Three Fontsource variable font packages installed (Bricolage, Fraunces, JetBrains Mono) plus the two foundation files every downstream Phase 3 plan imports — tokens.css with full color/type/spacing system + reduced-motion block, and disciplines.ts with the typed Category→accent + k-index maps.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-14T17:11:30Z (approx)
- **Completed:** 2026-05-14T17:17:00Z (approx)
- **Tasks:** 3 / 3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- 3 Fontsource variable font packages pinned to vetted patch versions (Bricolage Grotesque 5.2.10, Fraunces 5.2.9, JetBrains Mono 5.2.8) — installed cleanly, package-lock.json updated, no `--legacy-peer-deps` needed
- `src/styles/tokens.css` — single source of truth for color (7 tokens), font-family (3), font-size (11 per OVERRIDE-01), line-height (5), spacing (7 strict 4-multiple scale); hand-rolled minimal reset; global @media (prefers-reduced-motion: reduce) block disabling all transitions + hover transforms (D-13)
- `src/styles/disciplines.ts` — typed DISCIPLINE_ACCENT (Record<Category, string>) + DISCIPLINE_K (Record<Category, 1 | 2 | 3 | 4>) consts importing Category from existing `src/content/categories.ts`; never re-declares the enum
- Zero forbidden dependencies introduced — `grep -E "lucide|@radix|@shadcn|tailwind|motion|gsap|lenis" package.json` returns 0 matches (D-11/D-12/D-17 anti-AI-tell vetting passes)

## Task Commits

Each task committed atomically:

1. **Task 1: Install Fontsource variable font packages** — `ddc6e73` (chore)
2. **Task 2: Create src/styles/tokens.css** — `f318393` (feat)
3. **Task 3: Create src/styles/disciplines.ts** — `59abc67` (feat)

**Plan metadata commit:** pending (next — this SUMMARY.md)

## Files Created/Modified

- `src/styles/tokens.css` (CREATED) — :root design tokens (color, font, spacing, size, line-height) + minimal reset + global reduced-motion block
- `src/styles/disciplines.ts` (CREATED) — DISCIPLINE_ACCENT + DISCIPLINE_K typed consts, single source of truth for D-01/D-03
- `package.json` (MODIFIED) — added 3 @fontsource-variable/* dependencies at pinned versions
- `package-lock.json` (MODIFIED) — locked tree for the 3 font packages + transitive deps

## Decisions Made

None new — all decisions are direct implementations of the plan-locked decisions D-01, D-11, D-12, D-13, D-15, D-16, D-17 and OVERRIDE-01 from 03-UI-SPEC.md and 03-CONTEXT.md. Every value (color hex, font-size clamp, line-height, spacing px, family name) was extracted verbatim from the locked sketch CSS + UI-SPEC tables — no re-derivation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Verification bug] Comment word "interior" tripped the `Inter` font grep guard**

- **Found during:** Task 2 (tokens.css verification)
- **Issue:** The acceptance criterion is `grep -i "slate\|neutral\|purple\|radius-2xl\|inter" src/styles/tokens.css` returns 0 matches — but my initial comment `electric lime — Personal accent + interior fills` contained the substring `inter` inside `interior`, causing a false-positive match. The intent of the criterion is the font name `Inter`, not the substring.
- **Fix:** Changed comment to `Personal accent + inside fills` — same meaning, no substring collision.
- **Files modified:** `src/styles/tokens.css` (one comment word)
- **Verification:** `grep -i "slate\|neutral\|purple\|radius-2xl\|inter" src/styles/tokens.css; echo exit:$?` now returns `exit:1` (no matches).
- **Committed in:** `f318393` (Task 2 commit — fixed before staging)

---

**Total deviations:** 1 auto-fixed (1 verification-grep false positive)
**Impact on plan:** Zero scope change. The fix preserves all semantic content of the comment; the only delta is choosing a synonym that doesn't share a substring with a forbidden token. No new functionality, no new risk surface.

## Issues Encountered

None. Three pure-data tasks executed exactly as written. `npm install` exited 0 first try; both files match acceptance criteria after the single one-word comment correction noted above.

## User Setup Required

None — no external service configuration required. All work is offline (npm registry fetch + local file writes).

## Next Phase Readiness

**Ready for Plan 03-01b (and all downstream Phase 3 plans).**

The three lego bricks are in place:
- `node_modules/@fontsource-variable/{bricolage-grotesque,fraunces,jetbrains-mono}/files/*.woff2` — ready for import
- `src/styles/tokens.css` — ready to be imported by `Base.astro` (Plan 03-01b)
- `src/styles/disciplines.ts` — ready to be imported by every accent-flow surface (splash cards, category page wrapper, detail page header, 404 cards)

No blockers. No outstanding decisions. Downstream consumers should:

1. Import `tokens.css` at the top of `Base.astro` via `import '../styles/tokens.css'`
2. Import Fontsource CSS sidecar in `Base.astro` (`import '@fontsource-variable/bricolage-grotesque'`, etc.)
3. Import `DISCIPLINE_ACCENT` + `DISCIPLINE_K` from `../styles/disciplines` wherever a per-category accent is rendered
4. Reference colors/sizes/spacing exclusively via `var(--*)` — never hard-code hexes or px values that exist in the token scale

## Self-Check: PASSED

**Created files exist:**
- FOUND: `src/styles/tokens.css`
- FOUND: `src/styles/disciplines.ts`

**Commits exist:**
- FOUND: `ddc6e73` (Task 1)
- FOUND: `f318393` (Task 2)
- FOUND: `59abc67` (Task 3)

**must_haves.truths satisfied (all 5):**
- T1 (`:root` tokens with --paper #f4ebd9): PASS
- T2 (no consumer hard-codes hex outside tokens.css/disciplines.ts): PASS (grep -rE confirmed)
- T3 (Fontsource installed, no Inter in package.json): PASS
- T4 (reduced-motion global block in tokens.css): PASS
- T5 (D-01, D-11, D-12, D-13, D-15, D-16, D-17 implementations): PASS

**must_haves.key_links satisfied:**
- `src/styles/disciplines.ts` contains `import type { Category }` from `'../content/categories'` — grep -E pattern matches.

---
*Phase: 03-visual-design-system*
*Completed: 2026-05-14*
