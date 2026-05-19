---
phase: 5
status: pending
recorded_at: TBD
---

# Phase 5 — Verification Record

> Template stub authored by Plan 05-01 (Wave 0). Plan 05-08 (Wave 2) fills this in place — it does NOT overwrite the file. Each section's blanks get filled with real results (Lighthouse JSON pull-quotes, real-iPhone screenshots, verdict columns) during the phase-exit verification pass.

## Real-Device Test Rig (D-14)

| Field | Value |
|-------|-------|
| iPhone model | TBD |
| iOS version | TBD |
| Network | hotel-wifi simulation (home wifi off, cellular only) |
| Browser | Safari (stock — no content blockers) |
| Test date | TBD |
| Tester | Caleb Lim |

## Critical-Path Walk (SC1, SC4)

Mirrors 05-UI-SPEC §"Critical-path accessibility walk" — iPhone Safari, real device.

| # | Step | Expected | Result | Screenshot |
|---|------|----------|--------|------------|
| 1 | Load splash | Above-fold composition readable; all four discipline cards tappable ≥44×44 | TBD | TBD |
| 2 | Tap Graphic Design card | /design loads; tile heroes render (not empty slabs); tile is tappable | TBD | TBD |
| 3 | Tap a tile | Detail page loads; hero renders; Context/Role/Outcome blurbs readable | TBD | TBD |
| 4 | Scroll detail page | No horizontal overflow; pdf-paginate slide sequence (if present) scrolls cleanly | TBD | TBD |
| 5 | Tap back-pill | Returns to /design | TBD | TBD |
| 6 | Tap mobile topbar envelope glyph | Mail app launches with `mailto:` populated | TBD | TBD |
| 6 | Tap mobile topbar LinkedIn glyph | LinkedIn opens in new tab (or LinkedIn app if installed) | TBD | TBD |
| 6 | Tap mobile topbar resume glyph | `caleb-lim-resume.pdf` downloads (no inline viewer) | TBD | TBD |
| 7 | Tap OPEN-TO-ROLES island | Slow-scroll fires to /about contact (or instant under reduced-motion) | TBD | TBD |
| 8 | Brand link → /marketing | Second gallery loads cleanly | TBD | TBD |
| 9 | Repeat 2–4 on /marketing | Identical experience to /design | TBD | TBD |
| 10 | Toggle iOS Reduce Motion ON, repeat 1–9 | Carousel pauses; slow-scroll → instant; card entrance shake disabled; hover-tilt + click-shake + pulse remain | TBD | TBD |

## Lighthouse Scores (SC2, D-13/D-15)

Source: `bash scripts/lighthouse-audit.sh <vercel-preview-url>` — preview URL TBD (Plan 05-02 ships Vercel import). Default expected pattern per 05-RESEARCH §4.4: `https://caleb-lim-portfolio-git-phase-5-c-lb.vercel.app`.

Thresholds per 05-UI-SPEC §"Lighthouse budget":
- All routes: Performance ≥85, Accessibility ≥95
- Splash only: LCP < 2000ms (hard gate)

| Route | Perf | A11y | LCP (ms) | Pass? |
|-------|------|------|----------|-------|
| `/` (splash) | TBD | TBD | TBD | TBD |
| `/design` | TBD | TBD | TBD | TBD |
| `/marketing` | TBD | TBD | TBD | TBD |
| `/about` | TBD | TBD | TBD | TBD |
| `/design/<slug>` | TBD | TBD | TBD | TBD |

Per-route summary JSON pull-quotes (auto-emitted by `lighthouse-audit.sh` to `lighthouse/<slug>-summary.json`):

### `/` (splash)

```json
TBD
```

### `/design`

```json
TBD
```

### `/marketing`

```json
TBD
```

### `/about`

```json
TBD
```

### `/design/<slug>`

```json
TBD
```

## Reduced-Motion Walk (SC3, D-08)

Toggle macOS *System Settings → Accessibility → Display → Reduce motion = ON*, hard refresh, walk site. Mirrors 05-UI-SPEC §"Verification walk".

| # | Step | Expected behavior | Result |
|---|------|-------------------|--------|
| 1 | Load splash | Cards do NOT shake on entrance (motion source #3 disabled) | TBD |
| 2 | Hover a discipline card (desktop only) | Tilt + glass overlay FIRE (#5, #7 exempt per D-08 amendment) | TBD |
| 3 | Click a role-link in bio | Card SHAKES briefly (#6 exempt — user-initiated feedback) | TBD |
| 4 | Inspect StatusPill | Lime dot PULSES (#11 exempt — status indicator) | TBD |
| 5 | Click "OPEN TO ROLES" island | INSTANT JUMP to /about contact, no slow-scroll (#14 disabled) | TBD |
| 6 | Wait 3s on splash | Portrait carousel does NOT auto-advance (#1 disabled) | TBD |
| 7 | Click carousel arrow | Slide transitions normally (#2 exempt as user-initiated by analogy) | TBD |
| 8 | Tab through nav | Focus outlines fire crisply (no transition) — acceptable | TBD |
| 9 | Visit /design gallery on desktop | Tiles do NOT shimmer on entrance (#20 gated to touch only); hover fires scale+rotate (#19 exempt) | TBD |

## --terracotta Audit (SC6, D-17(b))

Filled by Plan 05-05 (2026-05-19). Line numbers re-grounded against current `src/` state — Plan 05-04 moved several Gallery* uses to `--accent-bg` indirection (so the old `background: var(--terracotta)` direct uses are gone; the indirection rows live at A12:121 / B35:119 / C68:122 / C68:140 now). Verdict distribution: **24 load-bearing / 0 replace** — the D-17(b) re-classification was correct; the original "decorative accent only" comment in `tokens.css` was the actual bug. No source edits required from this audit.

| File | Line | Use | Verdict |
|------|------|-----|---------|
| `src/styles/disciplines.ts` | 6 | Comment noting Design got a dedicated token (`--design`, was sharing `--terracotta`) | load-bearing (documentation of token system; do not strip) |
| `src/styles/tokens.css` | 10 | `--design` comment noting it was previously riding `--terracotta` | load-bearing (history pointer) |
| `src/styles/tokens.css` | 13 | Token registration (comment amended Task 1) | load-bearing |
| `src/styles/tokens.css` | 15 | `--teal` comment noting it absorbs the prior terracotta hex | load-bearing (history pointer) |
| `src/layouts/Base.astro` | 102 | `.topbar nav a:hover { color: var(--terracotta); }` | load-bearing (interactive hover feedback — primary D-17(b) anchor) |
| `src/components/GalleryA12.astro` | 121 | `--accent-bg: var(--terracotta);` (Plan 05-04 indirection — feeds .meta column for slot 2) | load-bearing (per-slot accent rhythm) |
| `src/components/GalleryB35.astro` | 119 | `--accent-bg: var(--terracotta);` (Plan 05-04 indirection — slot 2) | load-bearing (per-slot accent rhythm) |
| `src/components/GalleryC68.astro` | 122 | `--accent-bg: var(--terracotta);` (Plan 05-04 indirection — slot 2) | load-bearing (per-slot accent rhythm) |
| `src/components/GalleryC68.astro` | 140 | `--accent-bg: var(--terracotta); color: var(--paper);` (caption tile p5) | load-bearing (caption tile color pairing) |
| `src/pages/about.astro` | 105 | `scrollbar-color: var(--terracotta) transparent;` (photos-track) | load-bearing (scrollbar thumb visibility) |
| `src/pages/about.astro` | 109 | `background: var(--terracotta);` (WebKit scrollbar thumb) | load-bearing (cross-browser pair for line 105) |
| `src/pages/about.astro` | 117 | `border: 1.5px dashed var(--terracotta);` (photo wireframe) | load-bearing (placeholder slot visible structure) |
| `src/pages/about.astro` | 119 | `background: color-mix(in oklab, var(--paper) 92%, var(--terracotta) 8%);` | load-bearing (wireframe fill tint) |
| `src/pages/about.astro` | 135 | `color: var(--terracotta);` (link in bio) | load-bearing (link color) |
| `src/pages/about.astro` | 172 | `background: var(--terracotta);` (slow-scroll trigger hover fill) | load-bearing (hover state) |
| `src/pages/about.astro` | 203 | `color: var(--terracotta);` (link color in bio body) | load-bearing (link color) |
| `src/pages/about.astro` | 212 | Comment naming the palette ("acid turmeric, terracotta taupe, umber design") | load-bearing (palette documentation) |
| `src/pages/about.astro` | 253 | `background: var(--terracotta);` (values-pill hover fill) | load-bearing (hover state) |
| `src/pages/about.astro` | 254 | `border-color: var(--terracotta);` (values-pill hover border) | load-bearing (hover state pair) |
| `src/pages/about.astro` | 312 | `.contact-list a:hover { color: var(--terracotta); }` | load-bearing (hover state) |
| `src/pages/index.astro` | 248 | `border: 2px dashed var(--terracotta);` (carousel wireframe) | load-bearing (wireframe slot visible structure) |
| `src/pages/index.astro` | 258 | `color: var(--terracotta);` (carousel wireframe tag) | load-bearing (paired with line 248) |
| `src/pages/index.astro` | 338 | `.b-name h1 .lim { color: var(--terracotta); }` | load-bearing (brand-name accent on the "lim" surname) |
| `src/pages/index.astro` | 352 | `.b-name .roles a.role-link:nth-child(even) { color: var(--terracotta); ... }` | load-bearing (alternating-role visual rhythm) |
| `src/pages/index.astro` | 534 | `background: var(--terracotta);` (`.b-question .marker`) | load-bearing (marker bg paired with `--paper` text per line 535) |
| `src/pages/index.astro` | 555 | Comment on `--design` arrow noting "terracotta family, deeper than marker bg" | load-bearing (palette documentation) |

## Phase Exit Sign-Off

- [ ] All `scripts/verify-build.sh` gates green (Gates 1–25)
- [ ] All Lighthouse thresholds met (Perf ≥85, A11y ≥95 every route; splash LCP <2000ms)
- [ ] Real-iPhone critical-path walk recorded (Section: Critical-Path Walk)
- [ ] Reduced-motion walk recorded (Section: Reduced-Motion Walk)
- [x] --terracotta audit complete (Verdict column filled for every row)
- [ ] `lighthouse/<slug>-summary.json` files committed (one per route)
- [ ] iPhone model + iOS version recorded in Real-Device Test Rig
