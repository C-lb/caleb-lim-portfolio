---
phase: 03-visual-design-system
verified: 2026-05-14T13:30:00Z
status: PARTIAL
score: 8/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Walk splash at 1280x800 — four discipline cards above the fold without scroll"
    expected: "portrait + name + roles + bio sticker + question bar + 2+ rotated cards all visible without scrolling at 1280x800"
    why_human: "Above-the-fold layout depends on browser rendering and actual viewport; CSS layout structure is correct but fold-line cannot be confirmed from built HTML alone"
  - test: "Walk /design and /marketing at 1280x800 — ink-black canvas, accent-colored italic numeral, back-pill accent on hover"
    expected: "Body is #0a0a0a; category title's <em> renders in the discipline accent color; '← splash' pill background changes to accent on hover"
    why_human: "Requires browser DevTools to confirm computed color values and CSS hover behavior"
  - test: "Walk /design/design-real-piece — detail header has accent-colored top border"
    expected: "4px top border on .detail-head in terracotta (#e85d2a); page background is paper cream"
    why_human: "border-top render requires browser; the CSS is wired correctly but human eyes confirm the brand effect"
  - test: "Walk /about — bio renders in Fraunces 15.5px at 1.42 line-height"
    expected: "DevTools computed style on <p> shows font-family Fraunces Variable, font-size 15.5px, line-height 1.42"
    why_human: "Computed style verification requires browser DevTools"
  - test: "Walk /no-such-page — 404 page paper canvas, Bricolage display '404', Fraunces italic caption, discipline cards below"
    expected: "Page looks on-brand; '404' is oversized Bricolage; caption is light Fraunces italic; DisciplineCards match splash appearance"
    why_human: "Visual fidelity requires browser; dist/404.html source structure is verified but rendered appearance is human-only"
  - test: "Toggle OS prefers-reduced-motion ON and walk full site"
    expected: "Card hover transforms (translateY + rotate) disabled; gallery tile hover disabled; StatusPill dot stops pulsing"
    why_human: "prefers-reduced-motion behavior requires OS-level toggle (System Settings -> Accessibility -> Display -> Reduce Motion); cannot simulate in static analysis"
---

# Phase 3: Visual Design System Verification Report

**Phase Goal:** The locked Magazine-maximalist direction from sketch 001 is fully applied. The site reads as confident hand-crafted brand work, not as a v0/shadcn template. Every AI-tell from VISUAL-04 is verifiably absent.
**Verified:** 2026-05-14T13:30:00Z
**Status:** PARTIAL — automated gates all green; 6 human verification items remain (fold-line at 1280x800, computed colors, reduced-motion OS toggle, rendered fidelity)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Type system loads Bricolage Grotesque + Fraunces italic + JetBrains Mono; font-display:swap; Bricolage preloaded; Inter nowhere | ✓ VERIFIED | `dist/_astro/_category_.DoRD0JGC.css` contains all three families + `font-display:swap`. `dist/index.html` has `<link rel="preload">` for Bricolage woff2. `grep -nE '\bInter\b' src/` → no font matches. verify-anti-ai-tells.sh Gate A1 green. |
| 2 | Color system uses warm cream (#f4ebd9) + ink black + four discipline accents; each discipline carries its accent through gallery and detail | ✓ VERIFIED | `tokens.css` contains all five tokens verbatim. `disciplines.ts` exports `DISCIPLINE_ACCENT` with exact hex values. Gallery page built HTML: `style="--accent: #e85d2a"` on `/design`; `style="--accent: #5a1a55"` on `/marketing`. Detail page `bg-paper` confirmed. |
| 3 | Splash above fold at 1280px shows portrait + name + roles + bio block + question bar + N rotated discipline cards | ? UNCERTAIN | CSS structure verified from source: `.b-hero` with `grid-template-columns:280px 1.5fr 1.2fr`, `.b-question` border-bound bar, `.b-cards` grid with 2 populated cards. Portrait `src/assets/portrait.jpg` exists and is served via Astro `<Image>`. Fold-line at exactly 1280x800 requires human browser verification (HUMAN-NEEDED). |
| 4 | Asymmetric gallery uses varied tile sizes + intentional negative space; holds at 2 pieces; empty disciplines drop their card | ✓ VERIFIED | `GalleryA12.astro` (1-2 pieces): `grid-column: span 6` + `span 6`. `GalleryB35.astro` (3-5): `span 3 row 2` hero + `span 3` + three `span 2` tiles. `GalleryC68.astro` adds p6/p7/p8 row. `[category].astro` `getStaticPaths` filters empty disciplines. Gate 16 in verify-build.sh: finance + personal correctly absent, design + marketing present. Gate 18: splash card count (2) matches populated count (2). |
| 5 | Custom on-brand 404 page returns HTTP 404 and links back to splash | ✓ VERIFIED | `dist/404.html` exists. `<h1>404</h1>` confirmed. Discipline card links to `/design` and `/marketing` present. HTTP 404 status verified in Plan 03-05 Task 3 via `curl -sI http://localhost:4321/no-such-page` returning `HTTP/1.1 404 Not Found`. Astro preview + Cloudflare Pages both serve `dist/404.html` with 404 status by convention (zero-config). |
| 6 | Anti-AI-tell verification passes — no centered hero with gradient, no shadcn cards, no Inter, no purple gradients, no lucide icons, no bento grid, no "Built with X" footer | ✓ VERIFIED | `bash scripts/verify-anti-ai-tells.sh` exits 0 (7/7 gates green). Automated checks: A1 (no Inter), A2 (no lucide/@radix/@shadcn/tailwind), A3 (no purple gradients), A4 (no "Built with"), A5 (no bento), A6 (no rounded-2xl shadow-md combo), A7 (no lucide). Manual visual sweep S2/S6-S10 require human browser walk. |
| 7 | Detail page extends Base with bg='paper'; Phase 2 paginated PDF block preserved verbatim | ✓ VERIFIED | `[category]/[slug].astro`: `<Base title=... bg="paper">`. Built HTML for `/design/design-real-piece/` has `class="bg-paper"` on body. `paginated-pages` section present with 2 occurrences in built HTML. `pdf-thumbs` referenced. Gate 6 (PIECE-02: Context/Role/Outcome) green. Gate 10 (PIECE-04 paginated imgs) green. |
| 8 | About page extends Base with bg='paper'; bio paragraph preserved from Phase 2 | ✓ VERIFIED | `about.astro`: `<Base title="About — Caleb Lim" bg="paper">`. Built HTML: `class="bg-paper"`. Bio paragraph preserved verbatim (131 words per Gate 9). Resume download link present. Banned filler phrases absent (Gate 9). |
| 9 | ANTI-AI-CHECKLIST.md exists with VISUAL-04 + ROADMAP SC6 items enumerated | ✓ VERIFIED | File exists at `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md`. Contains A1-A7 (automated), V1-V7 (visual), C1-C5 (voice), S1-S10 (sketch fidelity), SPLASH-05 HTTP check, sign-off block. 26/35 items ticked by executor from automated greps + dist source. 9 items require human browser walk. |

**Score:** 8/9 truths verified (Truth 3 UNCERTAIN — fold-line at 1280x800 requires browser)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/styles/tokens.css` | Color, font, spacing tokens + reduced-motion block | ✓ VERIFIED | All 11 font-size tokens, 5 line-height tokens, 7 spacing tokens, all 5 color tokens (paper/ink/terracotta/cobalt/acid/plum/teal). Reduced-motion `@media` block wired. |
| `src/styles/disciplines.ts` | DISCIPLINE_ACCENT + DISCIPLINE_K typed consts | ✓ VERIFIED | Both consts exported; import from `categories.ts` via `import type { Category }`. All four hexes correct. |
| `src/layouts/Base.astro` | Global chrome, bg prop, font preload, topbar, footer | ✓ VERIFIED | Imports tokens.css + all 3 Fontsource packages. Preloads Bricolage woff2. `bg?: 'paper' | 'ink'` prop. StatusPill in topbar. Phase 4 nav slot reserved. |
| `src/components/StatusPill.astro` | "OPEN TO ROLES" pill with pulsing acid dot | ✓ VERIFIED | Pulse animation at 1.6s ease-in-out infinite. Reduced-motion handled by tokens.css global block. |
| `src/components/DisciplineCard.astro` | Splash + 404 card with k1-k4 decoration | ✓ VERIFIED | k1 outline circle, k2 italic Fraunces lime numeral, k3 dotted line, k4 clip-path triangle. Rotations: k1 -1deg, k2 +1deg, k3 -0.5deg, k4 +0.7deg. Hover: `translateY(-2px) rotate(-0.3deg)`. |
| `src/components/GalleryA12.astro` | Bucket A (1-2 pieces): full-bleed hero + wide tile | ✓ VERIFIED | p1 span 6 + row 2, p2 span 6. Both serve real `piece.data.hero` via `<Image>`. Reduced-motion block present. |
| `src/components/GalleryB35.astro` | Bucket B (3-5 pieces): sketch's exact 5-tile composition | ✓ VERIFIED | p1 span 3 row 2 (terracotta), p2 span 3 (cobalt), p3/p4/p5 span 2 (acid/plum/teal). Rotations per sketch. Decorative geometry per D-03. |
| `src/components/GalleryC68.astro` | Bucket C (6-8 pieces): Bucket B + extra row p6-p8 | ✓ VERIFIED | Extends B's layout; p6/p7/p8 with cycled palette + rotation variance. D-06 truncation at 8 with console.warn. |
| `src/pages/index.astro` | Splash: hero band + question bar + N rotated cards | ✓ VERIFIED | Extends Base. Portrait via `<Image>`. Hero band 3-col grid. Question bar with border-top/bottom. Cards grid with dynamic `gridTemplate` based on `populatedCategories.length`. SPLASH-04 filter wired. |
| `src/pages/[category].astro` | Gallery: ink-black bg, accent flow, D-07 route drop | ✓ VERIFIED | `getStaticPaths` filters empty disciplines. `bg="ink"`. `style={--accent: ${accent}}`. Bucket A/B/C conditional rendering. Back-pill hover uses accent. |
| `src/pages/[category]/[slug].astro` | Detail: paper bg, accent header border, paginated block preserved | ✓ VERIFIED | `bg="paper"`. `style={--accent: ${accent}}`. `border-top: 4px solid var(--accent)` on `.detail-head`. Paginated `<img>` section from Phase 2 preserved. `fullPdf` download link. |
| `src/pages/about.astro` | About: paper bg, Phase 2 bio unchanged, resume link | ✓ VERIFIED | `bg="paper"`. Bio word count 131 (Gate 9 green). Resume download link present. No banned phrases. |
| `src/pages/404.astro` | On-brand 404: cream paper, "404" Bricolage, discipline cards | ✓ VERIFIED | `bg="paper"`. `<h1>404</h1>` at `var(--fs-display)`. Fraunces italic caption. DisciplineCards from `populatedCategories`. HTTP 404 status verified locally. |
| `scripts/verify-build.sh` | All 18 gates run to completion, ZERO FAIL lines | ✓ VERIFIED | Script exits 0 at verification time. Gate count 1-18 confirmed in script source. All gates green on fresh `npm run build` output. |
| `scripts/verify-anti-ai-tells.sh` | 7 anti-AI-tell gates exit 0 | ✓ VERIFIED | Script exits 0 at verification time. All 7 sub-gates (A1-A7) green. |
| `ANTI-AI-CHECKLIST.md` | Checklist with VISUAL-04 + SC6 items enumerated | ✓ VERIFIED | Exists. 26/35 items source-verifiable and ticked. 9 items correctly flagged as pending human browser walk. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Base.astro` | `tokens.css` | `import '../styles/tokens.css'` | ✓ WIRED | Direct import confirmed in source |
| `Base.astro` | Three Fontsource packages | npm import + preload link | ✓ WIRED | All three imported; Bricolage preload tag in `<head>` |
| `index.astro` | `DisciplineCard.astro` | import + map over `populatedCategories` | ✓ WIRED | Only non-empty disciplines rendered |
| `index.astro` | `disciplines.ts` | `import { DISCIPLINE_K }` | ✓ WIRED | Used to pass `k` prop to DisciplineCard |
| `[category].astro` | `GalleryA12/B35/C68.astro` | conditional render on `pieces.length` | ✓ WIRED | `n <= 2`, `n >= 3 && n <= 5`, `n >= 6` guards |
| `[category].astro` | `DISCIPLINE_ACCENT` | inline `style` prop | ✓ WIRED | `style={--accent: ${accent}}` flows to tile hover + back-pill |
| `[category]/[slug].astro` | `DISCIPLINE_ACCENT` | inline `style` prop | ✓ WIRED | Accent flows to `detail-head` border-top + back-pill hover |
| `404.astro` | `DisciplineCard.astro` | import + map over `populatedCategories` | ✓ WIRED | Mirror of splash SPLASH-04 logic |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `index.astro` | `populatedCategories` | `getCollection('pieces')` filtered by `draft !== true` | Yes — 2 non-draft pieces confirmed | ✓ FLOWING |
| `[category].astro` | `pieces` | `getCollection('pieces')` filtered by category + draft | Yes — 1 piece per gallery | ✓ FLOWING |
| `[category]/[slug].astro` | `piece.data` | `getStaticPaths` + CollectionEntry props | Yes — real frontmatter (title, hero, context, role, outcome, pdfPaginate) | ✓ FLOWING |
| `[category]/[slug].astro` | `paginatedPages` | `.cache.json` sidecar + `thumbCache.pages` | Yes — 5 pages for design-real-piece (Gate 10 green) | ✓ FLOWING |
| `about.astro` | bio paragraph | Hardcoded in template (single-source) | Yes — 131 words of real copy | ✓ FLOWING |
| `404.astro` | `populatedCategories` | `getCollection('pieces')` | Yes — mirrors splash logic | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build exits 0 | `npm run build` | 7 pages built, 5 images optimized | ✓ PASS |
| All 18 verify-build.sh gates green | `bash scripts/verify-build.sh` | ALL GREEN, exit 0 | ✓ PASS |
| All 7 anti-AI-tell gates green | `bash scripts/verify-anti-ai-tells.sh` | All GREEN, exit 0 | ✓ PASS |
| Finance/personal routes absent (D-07) | Gate 16 | `finance is empty (0 pieces) and route correctly absent`, same for personal | ✓ PASS |
| Splash card count matches populated routes | Gate 18 | `splash card count (2) matches populated category count (2)` | ✓ PASS |
| Bricolage wired through to built output | Gate 15 | Bricolage Grotesque referenced in splash output | ✓ PASS |
| font-display:swap in built CSS | `grep font-display dist/_astro/*.css` | All three families use swap | ✓ PASS |
| No Inter in built output | `grep -nE '\bInter\b' src/` + A1 gate | Zero font-related matches | ✓ PASS |
| Portrait.jpg exists | `ls src/assets/` | `portrait.jpg` present | ✓ PASS |
| 404.html exists with h1 + category links | Gate 17 | Present; `<h1>404</h1>` confirmed; design + marketing card links present | ✓ PASS |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| SPLASH-01 | Splash renders name + prompt + portrait + bio + four discipline cards above fold on desktop | ? UNCERTAIN | HTML structure confirmed; fold-line at 1280x800 requires human browser check |
| SPLASH-02 | Each discipline card shows category name, accent color, routes on click | ✓ SATISFIED | DisciplineCard k1-k4 per DISCIPLINE_ACCENT/K; `href="/${category}"`; solid accent backgrounds confirmed in built CSS |
| SPLASH-03 | Four gallery pages exist with asymmetric magazine layout (not uniform grid) | ✓ SATISFIED | design + marketing galleries exist; Bucket A/B/C templates with varied `grid-column: span N` + per-tile rotations; uniform grid absent |
| SPLASH-04 | Galleries hold at 1-3 pieces; zero-piece categories drop their splash card | ✓ SATISFIED | GalleryA12 covers 1-2; `populatedCategories` filter drops finance + personal; Gates 16 + 18 both green |
| SPLASH-05 | On-brand 404 page links back to splash, returns HTTP 404 | ✓ SATISFIED | dist/404.html with DisciplineCards; HTTP 404 curl-verified locally per Plan 03-05 Task 3 |
| VISUAL-01 | Type: Bricolage Grotesque + Fraunces italic + JetBrains Mono; no Inter | ✓ SATISFIED | All three in built CSS with font-display:swap; Bricolage preloaded; Inter absent from src/ and dist/ |
| VISUAL-02 | Color: cream paper + ink black + terracotta/cobalt/lime/plum; accent flows per discipline | ✓ SATISFIED | tokens.css + disciplines.ts contain all hexes; gallery + detail pages receive accent via inline CSS var |
| VISUAL-03 | Layout: rotated cards (-1° to +1°), layered decorative geometry, magazine-grade hierarchy | ✓ SATISFIED | Card rotations k1-k4 per sketch; k1 outline circle, k2 italic numeral, k3 dotted line, k4 clip-path triangle; Bucket B/C gallery asymmetric with per-tile rotations |
| VISUAL-04 | Aesthetic rejects AI-template tells (no centered hero+gradient, no shadcn cards, no Inter, no lucide, no bento, no purple gradients, no "Built with X" footer) | ✓ SATISFIED | verify-anti-ai-tells.sh all 7 gates green; ANTI-AI-CHECKLIST.md A1-A7 confirmed; footer reads "caleb lim — 2026" |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `Base.astro` | 31 | `<!-- Phase 4 wires mailto / LinkedIn / Resume here -->` | ℹ️ Info | Intentional placeholder comment — Phase 4 scope. Nav slot reserved but empty. Not a visual stub (no user-facing "coming soon" text). |
| `[category]/[slug].astro` | 164 | `text-transform: uppercase` on `.cro .label` with title-case "Context"/"Role"/"Outcome" in markup | ℹ️ Info | Known executor deviation per issue brief — Phase 2 Gate 6 PIECE-02 requires case-sensitive grep for "Context"/"Role"/"Outcome"; CSS handles visual uppercase. Not a stub; functions correctly. |

No BLOCKER or WARNING anti-patterns found.

---

### Human Verification Required

#### 1. Splash four cards above the fold at 1280x800

**Test:** Open `npm run preview` in Chrome at 1280x800 viewport (DevTools device simulation). Verify portrait + name + roles + bio sticker + question bar + discipline cards (design + marketing) are all visible without any scroll.
**Expected:** All splash elements above the fold; no card is cut off at the bottom.
**Why human:** Above-the-fold layout depends on browser rendering, system font metrics, and actual viewport height. CSS structure (`min-height: calc(100vh - 120px)`, `grid-template-rows: auto 1fr auto auto`) is correctly structured but the fold-line can only be confirmed visually.

#### 2. Category pages — ink-black canvas + discipline accent in category numeral

**Test:** Navigate to `/design` and `/marketing` in the browser. DevTools → computed styles on `body` → confirm background is `#0a0a0a`. Confirm `<em>/01</em>` in the category title renders in terracotta (#e85d2a) for design and plum (#5a1a55) for marketing.
**Expected:** Full ink-black page canvas; category numeral in the discipline's accent color.
**Why human:** CSS `var()` resolution and computed color values require browser DevTools.

#### 3. Detail page — accent top border on detail header

**Test:** Navigate to `/design/design-real-piece`. Verify the detail header (containing the piece title and back-pill) has a 4px solid terracotta (#e85d2a) top border.
**Expected:** Visible colored stripe at the top of the detail header area.
**Why human:** Border rendering requires visual inspection.

#### 4. About page — Fraunces computed styles

**Test:** Navigate to `/about`. DevTools → select the bio `<p>` → computed styles → confirm `font-family: Fraunces Variable`, `font-size: 15.5px`, `line-height: 1.42`.
**Expected:** Exact computed values match spec.
**Why human:** Computed font-family (especially variable font name) and line-height require browser DevTools.

#### 5. 404 page rendered fidelity

**Test:** Navigate to `/no-such-page`. Confirm paper cream background, oversized "404" in Bricolage, dry Fraunces italic caption, and two DisciplineCards below that link to `/design` and `/marketing`.
**Expected:** On-brand page that reads consistent with splash; no generic browser 404.
**Why human:** Visual fidelity and HTTP status confirmation on the running preview server.

#### 6. prefers-reduced-motion toggle

**Test:** System Settings → Accessibility → Display → enable "Reduce motion". Walk splash, both galleries, a detail page. Confirm: discipline card hovers no longer lift/rotate; gallery tile hovers no longer scale/rotate; status pill dot stops pulsing.
**Expected:** All CSS transitions/animations suppressed; no visible motion on hover or idle.
**Why human:** Requires OS-level setting toggle; cannot be simulated in static analysis.

---

### Gaps Summary

No BLOCKER gaps found. Both verify scripts exit 0 at actual verification time (not just at executor time). All artifacts exist, are substantive, and are wired.

The single UNCERTAIN truth (SC3 / SPLASH-01 — fold-line at 1280x800) cannot be confirmed from static analysis alone. The CSS layout is correctly structured for the intent. This is a known human-verification item, not a code defect.

6 human verification items remain before the phase can fully close. These are visual/behavioral checks that require a running browser and, for item 6, an OS-level setting toggle. The ANTI-AI-CHECKLIST.md correctly identifies all 6 as pending (items S2, S6, S7, S8, S9, S10, plus the user sign-off row).

---

## Implementation Deviations (confirmed non-failures)

Per the phase brief, these are known and acceptable:

1. **Title-case CRO labels with CSS uppercase:** `[category]/[slug].astro` uses `Context`/`Role`/`Outcome` in markup (not `CONTEXT`/`ROLE`/`OUTCOME`) with `text-transform: uppercase` in CSS. This satisfies Phase 2 Gate 6's case-sensitive grep while rendering uppercase visually. Functions correctly.

2. **Nested ternary replaced with guarded conditionals in `[category].astro`:** Bucket template selection uses `{n <= 2 && <GalleryA12>}` / `{n >= 3 && n <= 5 && <GalleryB35>}` / `{n >= 6 && <GalleryC68>}` instead of nested ternaries. Semantically identical; Astro compiler limitation accommodation.

3. **ANTI-AI-CHECKLIST.md 26/35 executor-ticked:** 9 items require human browser walk + OS reduced-motion toggle + downstream reviewer sign-off. This is the documented checkpoint state — not a defect.

---

_Verified: 2026-05-14T13:30:00Z_
_Verifier: Claude (gsd-verifier)_
