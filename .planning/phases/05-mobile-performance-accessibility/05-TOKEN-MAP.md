---
phase: 5
plan: 05
type: planner-artifact
status: locked
authored_by: Plan 05-01 (Wave 0)
consumed_by: Plan 05-05 (token sweep, Wave 1)
---

# Phase 5 — Token Migration Map

> **Intent.** Every raw `font-size: Npx` and raw spacing literal in `src/components/`, `src/pages/`, `src/layouts/` mapped to its target token per D-17/D-18 and the rule-of-thumb **"3+ uses → new token; else nearest existing scale."** Decisions are planner-owned per D-18; Plan 05-05 consumes this verbatim and does NOT re-decide.

## Source inventory

Ground-truth grep — re-runnable from repo root. If a literal is NOT in this list, Plan 05-05 is NOT responsible for sweeping it. Captured at Wave 0 commit.

### Font-size literals (25 total)

```
src/components/GalleryC68.astro:117:    font-family: var(--sans); font-weight: 800; font-size: 240px; line-height: 1;
src/components/GalleryC68.astro:123:    font-family: var(--serif); font-style: italic; font-weight: 300; font-size: 90px;
src/components/GalleryB35.astro:114:    font-size: 240px;
src/components/GalleryB35.astro:132:    font-size: 90px;
src/components/DisciplineCard.astro:123:    font-size: 10px;
src/components/DisciplineCard.astro:140:    font-size: 10px;
src/components/GalleryA12.astro:114:    font-size: 240px;
src/components/GalleryA12.astro:132:    font-size: 90px;
src/pages/404.astro:67:    font-size: 18px;
src/pages/about.astro:141:    font-size: 0.92rem;
src/pages/about.astro:219:    font-size: 11px;
src/pages/about.astro:237:    font-size: 13px;
src/pages/about.astro:263:    font-size: 16px;
src/pages/[category]/[slug].astro:254:    font-size: 16px;
src/pages/[category]/[slug].astro:300:    font-size: 16px;
src/layouts/Base.astro:144:    font-size: 14px;
src/pages/index.astro:215:    font-size: 11px;
src/pages/index.astro:248:    font-size: 11px;
src/pages/index.astro:258:    font-size: 18px;
src/pages/index.astro:276:    font-size: 22px;
src/pages/index.astro:444:    font-size: 1.7em; /* upsize the star vs. the surrounding mono tag text */
src/pages/index.astro:496:    font-size: 11px;
src/pages/index.astro:511:    font-size: 11px;
src/pages/index.astro:532:    font-size: 13px;
src/pages/index.astro:551:    font-size: 32px;
```

Frequency count by raw value:

| Literal | Count | Sites |
|---------|-------|-------|
| `240px` | 3 | GalleryA12, B35, C68 (deco numeral) |
| `90px` | 3 | GalleryA12, B35, C68 (deco numeral) |
| `10px` | 2 | DisciplineCard ×2 |
| `18px` | 2 | 404, index |
| `11px` | 4 | about, index ×3 |
| `13px` | 2 | about, index |
| `16px` | 3 | about, [slug] ×2 |
| `14px` | 1 | Base footer |
| `22px` | 1 | index |
| `32px` | 1 | index |
| `0.92rem` | 1 | about (KEEP — relative) |
| `1.7em` | 1 | index (KEEP — relative) |

### Spacing literals (27 total)

```
src/components/StatusPill.astro:34:    padding: 9px 20px;
src/components/GalleryB35.astro:39:    gap: 12px; /* sketch line 578 — UI-SPEC OVERRIDE-03 */
src/components/GalleryB35.astro:47:    padding: 16px 18px; /* sketch line 586 — UI-SPEC OVERRIDE-03 */
src/components/DisciplineCard.astro:58:    padding: 22px 22px 24px; /* phase-exit walk: beefed for primary-nav weight */
src/components/DisciplineCard.astro:65:    gap: 4px;
src/components/DisciplineCard.astro:346:    .b-card { padding: 18px 18px 20px; min-height: 152px; }
src/components/GalleryC68.astro:45:    gap: 12px;
src/components/GalleryC68.astro:53:    padding: 16px 18px;
src/components/GalleryA12.astro:39:    gap: 12px;
src/components/GalleryA12.astro:47:    padding: 16px 18px;
src/pages/404.astro:75:    gap: 10px; /* sketch line 452 — UI-SPEC OVERRIDE-03 */
src/pages/about.astro:159:    padding: 8px 14px;
src/pages/about.astro:233:    gap: 12px 12px;
src/pages/about.astro:241:    padding: 7px 16px;
src/pages/[category].astro:82:    padding: 8px 14px;
src/pages/[category]/[slug].astro:175:    padding: 8px 14px;
src/pages/index.astro:140:    padding: 16px 28px 22px; /* sketch line 285 — UI-SPEC OVERRIDE-03 (top tightened for fold) */
src/pages/index.astro:143:    gap: 14px;
src/pages/index.astro:150:    gap: 16px;
src/pages/index.astro:299:    gap: 6px;
src/pages/index.astro:320:    padding: 8px 0;
src/pages/index.astro:367:    padding: 18px 22px 36px; /* sketch line 387 — UI-SPEC OVERRIDE-03 (tightened for fold) */
src/pages/index.astro:522:    padding: 8px 0; /* sketch line 424 — UI-SPEC OVERRIDE-03 (tightened for fold) */
src/pages/index.astro:535:    padding: 4px 10px;
src/pages/index.astro:571:    gap: 10px; /* sketch line 452 — UI-SPEC OVERRIDE-03 */
src/layouts/Base.astro:78:    gap: 18px;
src/layouts/Base.astro:92:    padding: 4px 0;
```

## Font-size mapping

Rules:
- 3+ uses site-wide → register new token (or migrate to existing if exact match).
- 1–2 uses → migrate to nearest existing scale value, accepting visual rounding.
- Relative units (`rem`, `em`) → KEEP, intentional per 05-UI-SPEC §Typography "Relative units are legitimate."

Current `tokens.css` font-size scale:
`--fs-display`, `--fs-cat` (clamp), `--fs-q`, `--fs-card`, `--fs-h3` (26px), `--fs-ttl` (22px), `--fs-body` (15.5px), `--fs-tile-role` (13px), `--fs-mono` (11px), `--fs-card-no` (9px), `--fs-deco-numeral` (clamp 64–96px).

| File:line | Raw literal | Target token | Reason |
|-----------|-------------|--------------|--------|
| src/components/GalleryC68.astro:117 | `240px` | **CONDITIONAL** — see note A below | Deco numeral (3 uses); fate gated on Plan 05-04 Q1 resolution |
| src/components/GalleryC68.astro:123 | `90px` | `--fs-deco-numeral` (clamp 64–96px) | Within existing clamp range; migrate directly |
| src/components/GalleryB35.astro:114 | `240px` | **CONDITIONAL** — see note A | Same as C68:117 |
| src/components/GalleryB35.astro:132 | `90px` | `--fs-deco-numeral` | Same as C68:123 |
| src/components/GalleryA12.astro:114 | `240px` | **CONDITIONAL** — see note A | Same |
| src/components/GalleryA12.astro:132 | `90px` | `--fs-deco-numeral` | Same |
| src/components/DisciplineCard.astro:123 | `10px` | `--fs-card-no` (9px) | 1px shrink; UI-SPEC mapping rule says "round down OR judgment" |
| src/components/DisciplineCard.astro:140 | `10px` | `--fs-card-no` (9px) | Same |
| src/pages/404.astro:67 | `18px` | `--fs-ttl` (22px) | 18px has 2 uses (<3); 18→22 is 4px upsize, 18→26 (`--fs-h3`) is 8px; pick nearer step (`--fs-ttl`) |
| src/pages/about.astro:141 | `0.92rem` | **KEEP** | Relative unit, intentional per 05-UI-SPEC |
| src/pages/about.astro:219 | `11px` | `--fs-mono` (11px) | Exact match; 11px has 4 uses |
| src/pages/about.astro:237 | `13px` | `--fs-tile-role` (13px) | Exact match |
| src/pages/about.astro:263 | `16px` | `--fs-body` (15.5px) | 3 uses; 0.5px shrink acceptable per UI-SPEC rule |
| src/pages/[category]/[slug].astro:254 | `16px` | `--fs-body` (15.5px) | Same |
| src/pages/[category]/[slug].astro:300 | `16px` | `--fs-body` (15.5px) | Same |
| src/layouts/Base.astro:144 | `14px` | `--fs-tile-role` (13px) | 1 use; UI-SPEC says "migrate to `--fs-tile-role` (13px, accept 1px shrink)" |
| src/pages/index.astro:215 | `11px` | `--fs-mono` (11px) | Exact match |
| src/pages/index.astro:248 | `11px` | `--fs-mono` (11px) | Exact match |
| src/pages/index.astro:258 | `18px` | `--fs-ttl` (22px) | Same reasoning as 404:67 |
| src/pages/index.astro:276 | `22px` | `--fs-ttl` (22px) | Exact match |
| src/pages/index.astro:444 | `1.7em` | **KEEP** | Relative unit, intentional; sized to parent line-height for star glyph |
| src/pages/index.astro:496 | `11px` | `--fs-mono` (11px) | Exact match |
| src/pages/index.astro:511 | `11px` | `--fs-mono` (11px) | Exact match |
| src/pages/index.astro:532 | `13px` | `--fs-tile-role` (13px) | Exact match |
| src/pages/index.astro:551 | `32px` | `--fs-h3` (26px) | 1 use (<3); migrate to nearest existing (6px shrink). If visual breaks, Plan 05-05 may escalate to "add `--fs-section: 32px`" but ONLY if a second use appears |

**Note A (240px deco numeral).** The three `font-size: 240px` literals in GalleryA12/B35/C68 sit on the per-slot decoration overlay (p1/p3/p5 italic numerals). 05-RESEARCH §5.7 + Q1 flag that when the hero promotes to LEFT 60% under D-09 (Plan 05-04), the deco geometry breaks. Two outcomes possible:

- **Plan 05-04 drops the deco** (Q1 recommendation) → these three literals get DELETED entirely; no token needed.
- **Plan 05-04 keeps the deco** → register `--fs-deco-xl: 240px` in tokens.css and migrate.

Plan 05-05 reads Plan 05-04's SUMMARY to determine which path. Decision deferred to that point — NOT a Wave-0 escalation.

## Spacing mapping

Rules:
- Sketch-locked literals under UI-SPEC OVERRIDE-03 stay raw (whitelist preserved from Phase 3).
- All others migrate to existing `--sp-*` token or to a new token if 3+ uses.

Current `tokens.css` spacing scale: `--sp-1` (4px), `--sp-2` (8px), `--sp-4` (16px), `--sp-5` (24px), `--sp-6` (32px), `--sp-8` (48px), `--sp-10` (64px). **Gap: no `--sp-3` (12px) — this gap is what `about.astro:98` silently fails on.**

| File:line | Raw literal | Target token | Reason |
|-----------|-------------|--------------|--------|
| src/components/StatusPill.astro:34 | `9px 20px` | **KEEP (sketch-locked)** | StatusPill padding is OVERRIDE-03 candidate (irregular values intentional for sketch fidelity) |
| src/components/GalleryB35.astro:39 | `gap: 12px` | `--sp-3: 12px (NEW)` | Sketch comment notes OVERRIDE-03, but 12px appears 4× site-wide → NEW token is warranted; sketch comment becomes redundant after migration |
| src/components/GalleryB35.astro:47 | `padding: 16px 18px` | `--sp-4 var(--sp-4-or-keep)` | 16px → `--sp-4`; 18px is sketch-locked OVERRIDE-03; pragmatic: keep raw mixed (`padding: var(--sp-4) 18px`) until Plan 05-05 visually verifies |
| src/components/DisciplineCard.astro:58 | `padding: 22px 22px 24px` | **KEEP (sketch-locked)** | OVERRIDE-03; phase-exit-walk-tuned values |
| src/components/DisciplineCard.astro:65 | `gap: 4px` | `--sp-1` (4px) | Exact match |
| src/components/DisciplineCard.astro:346 | `padding: 18px 18px 20px` | **KEEP (sketch-locked)** | OVERRIDE-03; mobile breakpoint variant of :58 |
| src/components/GalleryC68.astro:45 | `gap: 12px` | `--sp-3: 12px (NEW)` | Same as B35:39 |
| src/components/GalleryC68.astro:53 | `padding: 16px 18px` | `--sp-4` + raw 18px | Same as B35:47 |
| src/components/GalleryA12.astro:39 | `gap: 12px` | `--sp-3: 12px (NEW)` | Same |
| src/components/GalleryA12.astro:47 | `padding: 16px 18px` | `--sp-4` + raw 18px | Same |
| src/pages/404.astro:75 | `gap: 10px` | **KEEP (sketch-locked)** | OVERRIDE-03 sketch line 452 — explicitly listed in UI-SPEC whitelist |
| src/pages/about.astro:159 | `padding: 8px 14px` | `--sp-2` + raw 14px | 8px → `--sp-2`; 14px stays raw (between 12 and 16; only 3 uses cluster) |
| src/pages/about.astro:233 | `gap: 12px 12px` | `--sp-3 var(--sp-3)` | Both 12px → NEW `--sp-3`. Also: this is the silent-failure consumer — `about.astro:98` already references `var(--sp-3)` (currently undefined); registering `--sp-3` fixes that bug AND migrates this line |
| src/pages/about.astro:241 | `padding: 7px 16px` | **KEEP 7px** + `--sp-4` | 7px is off-scale 1-off; 16px → `--sp-4` |
| src/pages/[category].astro:82 | `padding: 8px 14px` | `--sp-2` + raw 14px | Same shape as about:159 (back-pill padding pattern) |
| src/pages/[category]/[slug].astro:175 | `padding: 8px 14px` | `--sp-2` + raw 14px | Same |
| src/pages/index.astro:140 | `padding: 16px 28px 22px` | **KEEP (sketch-locked)** | OVERRIDE-03 sketch line 285 |
| src/pages/index.astro:143 | `gap: 14px` | raw 14px or `--sp-3` | 14px between 12 and 16; only 1 use → Plan 05-05 judgment, lean migrate-to-`--sp-3` (12px) for scale snap |
| src/pages/index.astro:150 | `gap: 16px` | `--sp-4` | Exact match |
| src/pages/index.astro:299 | `gap: 6px` | **KEEP (off-scale 1-off)** | 6px not on scale, 1 use; document inline as judgment |
| src/pages/index.astro:320 | `padding: 8px 0` | `--sp-2` + 0 | 8px → `--sp-2` |
| src/pages/index.astro:367 | `padding: 18px 22px 36px` | **KEEP (sketch-locked)** | OVERRIDE-03 sketch line 387 |
| src/pages/index.astro:522 | `padding: 8px 0` | **KEEP (sketch-locked)** | OVERRIDE-03 sketch line 424 |
| src/pages/index.astro:535 | `padding: 4px 10px` | `--sp-1` + raw 10px | 4px → `--sp-1`; 10px stays raw (sketch-locked candidate) |
| src/pages/index.astro:571 | `gap: 10px` | **KEEP (sketch-locked)** | OVERRIDE-03 sketch line 452 |
| src/layouts/Base.astro:78 | `gap: 18px` | raw 18px OR `--sp-4` | 18px between 16 and 24; 1 use → judgment. Lean keep raw + comment "topbar gap, intentional 18px" |
| src/layouts/Base.astro:92 | `padding: 4px 0` | `--sp-1` + 0 | Per Phase 4 carry-over (UI-REVIEW Pillar 5), this padding bumps to `≥12px 8px` site-wide for tap targets. Plan 05-03 owns the bump (D-02); Plan 05-05 then migrates the FINAL value (likely `--sp-3 --sp-2` once `--sp-3` registers) |

## Token additions to tokens.css

Minimum set Plan 05-05 MUST register before sweeping consumers. Order matters: register tokens first, run `bash scripts/verify-build.sh` to confirm Gates 1–24 still green, then sweep consumers.

| Token | Value | Justification | Consumers (post-sweep) |
|-------|-------|---------------|------------------------|
| `--sp-3` | `12px` | 4 site-wide uses (`GalleryA12:39`, `GalleryB35:39`, `GalleryC68:45`, `about.astro:233` × 2 axis-values) + closes silent-failure consumer at `about.astro:98`. Closes spacing scale gap (4 / 8 / **12** / 16 / 24 / 32 / 48 / 64). | 5+ consumers after sweep |

### Tokens explicitly NOT added (planner judgment)

| Considered | Decision | Reason |
|------------|----------|--------|
| `--fs-foot: 14px` | **NOT ADDED** | 1 use (Base footer); UI-SPEC rule says new token requires 3+ uses |
| `--fs-section: 32px` | **NOT ADDED** | 1 use (index:551); migrate to `--fs-h3` (26px) instead. Plan 05-05 may revisit if visual breaks |
| `--fs-deco-xl: 240px` | **CONDITIONAL** | Gated on Plan 05-04 Q1 resolution (drop deco vs. keep deco). Add only if Plan 05-04 keeps the 240px overlay |
| `--sp-7: 28px` | **NOT ADDED** | All 28px uses are inside sketch-locked OVERRIDE-03 padding triplets (index:140, index:367); they stay raw |

## Sweep order (Plan 05-05 consumption pattern)

Per 05-UI-SPEC §"Per-file sweep order" — smallest-blast-radius first, so each commit can be verified against `bash scripts/verify-build.sh` before moving on:

1. `tokens.css` — register `--sp-3: 12px`; amend `--terracotta` comment per D-17(b)
2. `Base.astro` (1 font literal + 2 spacing)
3. `404.astro` (1 font + 1 spacing)
4. `[category].astro` (1 spacing)
5. `[category]/[slug].astro` (2 font + 1 spacing)
6. `DisciplineCard.astro` (2 font + 3 spacing, some sketch-locked)
7. `about.astro` (4 font + 3 spacing — fixes silent-failure consumer)
8. `index.astro` (8 font + 11 spacing — biggest file; save for last)
9. Gallery components ×3 (2 font + 2 spacing each — `--sp-3` migrate + conditional 240px decision)

After each step: `npm run build && bash scripts/verify-build.sh`. Gate 25 should turn GREEN after step 9 IF all literals swept. Gate 23/24 are owned by Plans 05-03/05-04 — Plan 05-05 should not touch them.
