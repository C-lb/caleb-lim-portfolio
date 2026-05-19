---
phase: 5
plan: 05
subsystem: design-token-hygiene
tags: [tokens, design-system, sweep, sc6, warning-1-closeout]
requires: [05-01, 05-03, 05-04]
provides:
  - "SC6 closed (zero raw font-size px literals outside tokens.css; Gate 25 GREEN)"
  - "WARNING-1 (Phase 4 UI-REVIEW token drift) closed"
  - "--sp-3: 12px registered (fixes about.astro:98 silent failure)"
  - "--terracotta re-classified load-bearing (24-row audit recorded in 05-VERIFICATION.md)"
  - "--lime rationale documented in tokens.css comment"
affects:
  - "src/styles/tokens.css — 3 token-level edits (--sp-3 add, --terracotta + --lime comments)"
  - "7 source files swept — 17 font-size px literals replaced with --fs-* tokens"
  - "05-VERIFICATION.md --terracotta Audit + Phase Exit Sign-Off"
tech-stack:
  added: []
  patterns:
    - "Design-token discipline locked by Gate 25 grep (any future raw font-size: Npx outside tokens.css breaks the build — Q7 'friction is the point')"
key-files:
  created: []
  modified:
    - "src/styles/tokens.css"
    - "src/layouts/Base.astro"
    - "src/pages/404.astro"
    - "src/pages/about.astro"
    - "src/pages/index.astro"
    - "src/pages/[category]/[slug].astro"
    - "src/components/DisciplineCard.astro"
    - ".planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md"
decisions:
  - "TOKEN-MAP consumed verbatim — no re-derivation. Every literal mapped to the planner-locked target (D-18 planner-owned)."
  - "--terracotta audit: 24/24 rows load-bearing, 0/24 replace. The D-17(b) re-classification was correct; the original 'decorative only' comment in tokens.css was the actual bug — every consumer is a hover state, link color, scrollbar thumb, wireframe border, brand accent, or per-slot accent rhythm."
  - "TOKEN-MAP's 'Note A' conditional 240px → CONDITIONAL --fs-deco-xl is moot — Plan 05-04 deleted the .deco overlays entirely in all three Gallery* components, so the three 240px and three 90px literals are gone. No token added."
  - "Relative-unit literals (0.92rem at about:141; 1.7em at index:444) left raw per 05-UI-SPEC §Typography 'Relative units are legitimate' and Gate 25's px-only regex."
metrics:
  duration: ~10min
  completed: 2026-05-19
---

# Phase 5 Plan 05-05: Design-Token Sweep Summary

Closed **WARNING-1** (Phase 4 UI-REVIEW token drift) and **SC6** by sweeping
all 17 remaining raw `font-size: Npx` literals across 7 source files (Plan
05-04 incidentally killed 6 .deco literals dropping the count from 21 → 17 at
this plan's start; before any Phase 5 work it was 27 = 21 inventoried in
05-RESEARCH §2.5 + 6 .deco entries). Registered `--sp-3: 12px` to close the
spacing scale gap (4/8/**12**/16/24/32/48/64) which also fixes a silent
`var(--sp-3)` consumer at `about.astro:98` that resolved to 0 prior to this
plan. Amended `--terracotta` and `--lime` comments per D-17(a)/(b). Filled the
`--terracotta` audit table in `05-VERIFICATION.md` with verdicts for all 24
occurrences (all load-bearing).

Gate 25 in `scripts/verify-build.sh` was RED-by-design at this plan's start
and is now GREEN. Per Q7 resolution: the gate locks the contract — any future
commit re-introducing a raw `font-size: Npx` outside `tokens.css` breaks the
build. Friction is the point.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Amend tokens.css (add --sp-3, fix --terracotta + --lime comments) | af8952e | src/styles/tokens.css |
| 2 | Sweep small files (Base, 404, [slug], DisciplineCard) | a22538b | src/layouts/Base.astro, src/pages/404.astro, src/pages/[category]/[slug].astro, src/components/DisciplineCard.astro |
| 3 | Sweep about + index, close Gate 25, fill --terracotta audit | a81d4a6 | src/pages/about.astro, src/pages/index.astro, .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md |

## Sweep Inventory

**Total literals swept this plan: 17.** Combined with Plan 05-04's incidental
.deco cleanup (6 deletions), the full Phase 5 token-discipline reduction
matches the 27-literal initial census from 05-RESEARCH §2.5.

Per-file breakdown (TOKEN-MAP row-by-row):

| File | Literal | Target token | Rationale |
|------|---------|--------------|-----------|
| `Base.astro:172` | `14px` | `var(--fs-tile-role)` (13px) | 1-use, 1px shrink acceptable |
| `404.astro:67` | `18px` | `var(--fs-ttl)` (22px) | nearest existing step |
| `[slug].astro:262` | `16px` | `var(--fs-body)` (15.5px) | matches `--fs-body` |
| `[slug].astro:308` | `16px` | `var(--fs-body)` (15.5px) | same |
| `DisciplineCard.astro:123` | `10px` | `var(--fs-card-no)` (9px) | 1-use, 1px shrink |
| `DisciplineCard.astro:140` | `10px` | `var(--fs-card-no)` (9px) | same |
| `about.astro:219` | `11px` | `var(--fs-mono)` (11px) | exact match |
| `about.astro:237` | `13px` | `var(--fs-tile-role)` (13px) | exact match |
| `about.astro:263` | `16px` | `var(--fs-body)` (15.5px) | UI-SPEC mapping rule |
| `index.astro:221` | `11px` | `var(--fs-mono)` | exact match |
| `index.astro:254` | `11px` | `var(--fs-mono)` | exact match |
| `index.astro:264` | `18px` | `var(--fs-ttl)` (22px) | nearest existing step |
| `index.astro:282` | `22px` | `var(--fs-ttl)` (22px) | exact match |
| `index.astro:502` | `11px` | `var(--fs-mono)` | exact match |
| `index.astro:517` | `11px` | `var(--fs-mono)` | exact match |
| `index.astro:538` | `13px` | `var(--fs-tile-role)` | exact match |
| `index.astro:557` | `32px` | `var(--fs-h3)` (26px) | 1-use, 6px shrink (TOKEN-MAP judgment: don't add a new --fs-section token for one site) |

## --terracotta Audit Verdict Distribution

**24 load-bearing / 0 replace** (recorded in `05-VERIFICATION.md` §--terracotta Audit).

The D-17(b) re-classification was correct: the original `--terracotta:
"decorative accent only"` comment in `tokens.css` was the actual bug. Every
consumer is functional — hover states (Base topbar, about.astro links and
values-pills, contact-list), link colors (about.astro bio, resume), scrollbar
thumb (about.astro photos-track), wireframe dashed borders (about.astro photo
placeholders + index.astro carousel wireframe), brand accent (`.lim` surname
on splash, alternating role-link rhythm), per-slot accent rhythm via Plan 05-04's
`--accent-bg` indirection (Gallery* slot 2 + caption tile), and the
`.b-question .marker` background paired with `--paper` text. No replacement
needed; no source edits triggered by the audit.

Line numbers in the audit were re-grounded against current `src/` state —
Plan 05-04 moved the Gallery* direct uses to the `--accent-bg` indirection,
so the seeded `background: var(--terracotta);` rows at GalleryA12:104,
GalleryB35:104, GalleryB35:163, GalleryC68:110, GalleryC68:136,
GalleryC68:156 don't exist anymore; the live indirection rows are
A12:121 / B35:119 / C68:122 / C68:140.

## --sp-3 Silent-Failure Fix

`about.astro:98` consumed `var(--sp-3)` (photos-track gap). Pre-plan: `--sp-3`
did not exist; CSS fell back to the default property value (0), so the gap
collapsed silently. Task 1 registered `--sp-3: 12px` between `--sp-2` and
`--sp-4` (closes the 8 → 16 scale gap), so the gap now resolves to 12px as
intended.

Per 05-RESEARCH §5.3, this was the original motivation for canonicalizing the
12px step — the silent-failure consumer pre-dated Plan 05-05. Now closed.

## New Tokens Registered

Only `--sp-3: 12px` (per TOKEN-MAP "Token additions to tokens.css" table).
TOKEN-MAP explicitly rejected `--fs-foot: 14px`, `--fs-section: 32px`,
`--fs-deco-xl: 240px`, and `--sp-7: 28px` — Plan 05-05 honored all four
rejections.

## Deviations from Plan

**None of substance.** Two minor reconciliations against TOKEN-MAP:

1. **TOKEN-MAP cited 1 font-size literal in `[category].astro`** (referenced
   loosely in the plan's "Sweep order" prose). Re-grep confirms there are
   actually zero font-size literals in `[category].astro` (only spacing —
   `padding: 8px 14px` at line 82, which is OVERRIDE-03 territory and out of
   Gate 25's px-only scope). No edit applied; counts match.

2. **TOKEN-MAP Note A conditional `--fs-deco-xl: 240px`** is moot — Plan 05-04
   deleted the `.deco` overlays entirely in all three Gallery* components, so
   the three 240px and three 90px literals never made it to this plan. No
   token added. (Plan 05-04 SUMMARY flagged this in its "Forward signals" to
   Plan 05-05.)

Spacing literals are out of scope for Gate 25 (px-only on font-size); the
TOKEN-MAP spacing rows were not swept this plan. They remain available for a
future opportunistic sweep if a Gate 26 (spacing discipline) is ever added.

## Verification

`npm run build && bash scripts/verify-build.sh`:

- Gates 1–22: all GREEN (no regression)
- Gate 23: GREEN (Plan 05-03 — topbar collapse)
- Gate 24: GREEN (Plan 05-04 — gallery `<img>` emission)
- **Gate 25: GREEN** (zero raw `font-size: Npx` literals outside `tokens.css`
  under `src/components/`, `src/pages/`, `src/layouts/`)

Specific re-runnable checks:

```
$ grep -rnE 'font-size:\s*[0-9]+(\.[0-9]+)?px' src/components/ src/pages/ src/layouts/
(no output — zero matches)

$ grep -E -- '--sp-3:\s+12px' src/styles/tokens.css
  --sp-3:  12px;  /* closes 8→16 scale gap; consumed by about.astro photo-track gap (silent-failure fix per 05-RESEARCH §5.3) + Gallery* tile gap */

$ grep -F 'decorative accent only' src/styles/tokens.css
(no output — comment dropped)

$ grep -F '[x] --terracotta audit complete' .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md
- [x] --terracotta audit complete (Verdict column filled for every row)
```

## Threat Flags

None — this plan only renames `font-size` literal values to CSS-variable
references and amends comments. No new endpoints, auth paths, file access
patterns, or schema changes.

## Self-Check: PASSED

Files exist:
- src/styles/tokens.css — FOUND
- src/layouts/Base.astro — FOUND
- src/pages/404.astro — FOUND
- src/pages/about.astro — FOUND
- src/pages/index.astro — FOUND
- src/pages/[category]/[slug].astro — FOUND
- src/components/DisciplineCard.astro — FOUND
- .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md — FOUND
- .planning/phases/05-mobile-performance-accessibility/05-05-SUMMARY.md — (this file) FOUND

Commits exist:
- af8952e — FOUND (Task 1)
- a22538b — FOUND (Task 2)
- a81d4a6 — FOUND (Task 3)

## Forward signals (for downstream plans in this phase)

- **Plan 05-06** (global reduced-motion surgical): no overlap. 05-05 only
  touched font-size values + token comments; the `@media (prefers-reduced-motion)`
  block at `tokens.css:63-70` was explicitly preserved per the plan's
  "Do NOT touch" guidance.
- **Plan 05-07** (touch/hover gating, StatusPill shrink): no overlap. None of
  the hover transforms or `(hover: hover)`-gated rules were edited.
- **Plan 05-08** (phase-exit verification): inherits a GREEN Gate 25 in
  `scripts/verify-build.sh`. The `--terracotta` audit row in
  05-VERIFICATION.md Phase Exit Sign-Off is the only checkbox 05-05 ticked;
  Plan 05-08 owns the remaining five (Lighthouse, iPhone walk, reduced-motion
  walk, lighthouse JSON commits, iPhone model recording).
