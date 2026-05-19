# Phase 4 — UI Review

**Audited:** 2026-05-18
**Baseline:** Abstract 6-pillar standards + project brand reference (ui-brand.md is a CLI/orchestrator style guide, not a website brand spec — no contractual visual baseline exists for Phase 4). Audit therefore checks the implemented surfaces against the in-codebase design system declared in `src/styles/tokens.css` + the contracts asserted by `verify-build.sh`.
**Screenshots:** Captured — `.planning/ui-reviews/04-20260518-180810/` (5 desktop + 3 mobile + 1 detail) via headless chromium against `http://localhost:4321`.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Voice is sharp, distinct, owns the page. Two mismatches: footer says "available for part-time, full-time internship roles" while `<title>` says "Caleb Lim — Portfolio" (no role posture) and the splash bio CTA uses "★ ABOUT" which reads as decorative noise rather than a label. |
| 2. Visuals | 2/4 | Splash is loud and confident, but the **detail (piece) page hero renders as a flat color slab with no thumbnail** (Plan 04-02 territory because the pager rides on top of that page). The 404 only shows 2 populated cards while the splash shows all 4 — inconsistent thesis. |
| 3. Color | 3/4 | Earthy palette consistently applied; `--accent` flow on detail/gallery is correct. Accent overuse: `--terracotta` appears 16× in `about.astro` alone (hover, scrollbar, dashed borders, pill fills, captions, focus) — it is no longer the "decorative-only" accent the tokens.css comment claims. |
| 4. Typography | 2/4 | 18 distinct raw `font-size` values bypass the 11-role token scale; 4 different weights on the splash bio card alone (300/600/700/800). Header chrome mixes `text-transform: lowercase` on `.nav-link` with `text-transform: uppercase` on `.topbar` parent — works but reads as a fix-on-top-of-fix. |
| 5. Spacing | 2/4 | Strict 4-multiple `--sp-*` scale is broken by 14+ arbitrary literals: `gap: 18px` (Base.astro:78), `padding: 16px 28px 22px` (index.astro:140), `gap: 14px`, `gap: 10px`, `gap: 6px`, `padding: 4px 0`, etc. Header chrome `nav-link` uses `padding: 4px 0` (~19px tap-height) — fails WCAG 2.5.8 (24×24 minimum) site-wide. |
| 6. Experience Design | 1/4 | **BLOCKER**: header chrome catastrophically broken on mobile (375px viewport). Brand wordmark wraps to 2 lines, OPEN TO ROLES pill wraps to 3 lines, `resume` link is **clipped off the right edge**. No hamburger, no collapse, no responsive treatment for the header below 768px. SUMMARY.md openly defers this to Phase 5 — but it ships in production today and breaks the primary site nav. |

**Overall: 13/24**

---

## Top 3 Priority Fixes

1. **BLOCKER — Mobile header overflow (Base.astro:31–39, no mobile breakpoint)** — At 375px the brand wraps, StatusPill wraps to 3 stacked words, and the rightmost nav link (`resume`) gets cropped by the viewport. Recruiters opening the site on a phone see a broken top of page and cannot tap resume. **Fix:** add a `@media (max-width: 700px)` block to `.topbar` that either (a) wraps the nav onto a second row with `flex-wrap: wrap; justify-content: center;`, (b) collapses `caleb.lim.2024@smu.edu.sg` to an envelope icon-link below ~520px while keeping linkedin/resume as text, or (c) ships a true hamburger menu. Pick (a) for cheapest path; (c) for the "primary nav weight" the SUMMARY claims for the chrome. Whatever lands also has to bump `.nav-link` padding from `4px 0` to `≥12px 8px` so the tap target clears WCAG 2.5.8.

2. **BLOCKER — Gallery and detail surfaces look unfinished (`[category].astro`, `[category]/[slug].astro`)** — The `/design` and `/marketing` galleries render the single piece as a near-empty olive slab with title+blurb bottom-left and no thumbnail/preview image. The detail page hero loads but the gallery tile preceding it does not. Phase 4's pager rides on top of these surfaces, so a recruiter who lands on `/design` from the splash sees what reads as a broken or stub gallery. **Fix:** confirm whether the gallery tile is supposed to render a hero thumbnail (it likely is — `piece.data.hero` exists per `[slug].astro:58`); if so, wire the tile to render an `<Image src={hero}>` at tile-thumb size. If the empty-slab is intentional Phase 3 contract, document it explicitly in 04-UI-REVIEW so the recruiter-eye reads it as deliberate restraint rather than a missing image.

3. **WARNING — Token discipline drift across Phase 4 surfaces** — `tokens.css:11` declares `--design`, `--terracotta`, etc. with the comment "Do NOT add new tokens without updating UI-SPEC.md verification_override register." Yet (a) `--lime` was added during UAT without a UI-SPEC update (per UAT.md), (b) `--terracotta` is described as "decorative accent only" but is now load-bearing across about page (16 uses incl. scrollbar, dashed border, pill hover fill, link hover, focus ring), (c) 18 raw `font-size` literals bypass the 11-role scale (`font-size: 10px`, `13px`, `16px`, `18px`, `22px`, `32px` etc.), (d) 14+ raw spacing literals bypass `--sp-*`. **Fix:** either codify the new reality (add a Phase 4 token-extension entry to tokens.css + verify-build gate) or sweep the literals back into tokens. Right now the contract says one thing and the code does another.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Strengths**
- Bio paragraph in `about.astro:13-23` is voice-y and specific: "I'm Caleb, and I don't pick a lane. I sit between financial models, brand strategy, graphic design, and the side projects that don't fit anywhere…" — owns the cross-functional thesis without using the banned word "passionate".
- Footer copy `available for part-time, full-time internship roles · brand · analyst · design` (Base.astro:45) is recruiter-specific and current.
- Detail-pager labels (`previous` / `next →` with the piece title in italic serif below — `[slug].astro:141-150`) read as a deliberate magazine spread, not generic "Prev/Next" buttons.
- Skip-to-content link copy is the canonical "Skip to content" (Base.astro:30) — A+.

**Findings**
- **Splash bio card CTA collision** (`index.astro:106,115`) — the card carries TWO competing tags: `★ ABOUT` (top-left) AND `→ KEEP READING` (bottom-right). Either is enough as a CTA; together they fight for the eye and dilute both. Pick one.
- **`<title>` is generic** (`index.astro:71`: `Caleb Lim — Portfolio`) — doesn't carry the "open to roles" posture that the rest of the page screams. Recruiter Google-searches don't see the urgency. Consider `Caleb Lim — Designer / Analyst, open for internships`.
- **Detail-pager `aria-label="other pieces in this discipline"` is lowercase** (`[slug].astro:139`) while every other aria-label on the site is sentence-case or title-case ("Read the full bio on the About page", "Previous photo"). Screen readers don't care, but the inconsistency is a code smell.
- **`Get in touch` heading uses mono caps via CSS** but `Values` uses the same treatment (`about.astro:29, 66`). Both `<h2>` tags get rendered as quiet mono-caps eyebrows — visually they read as labels, not section headings. Either rename to `Contact` and `Values` (text-as-rendered) or actually style them as headings.

### Pillar 2: Visuals (2/4)

**Strengths**
- Splash hierarchy is genuinely strong on desktop: huge `CALEB LIM` wordmark + 2×2 discipline grid + acid bio card pulls the eye through in the right order.
- Discipline cards have distinct decorations (k1 circle, k2 bar-chart, k3 sparkle, k4 starburst) — the visual taxonomy holds.
- Reduced-motion handling is wired (Base.astro:125-127, tokens.css:63-70) — pause animations on the carousel and the entrance shake; rare to see this taken seriously.

**Findings**
- **BLOCKER — Gallery tile is an empty colored slab** (visible in `desktop-design.png`, `desktop-marketing.png`, `mobile-design.png`). The single piece "PVL — Overseas Community Project visual identity" tile has title + blurb at the bottom and nothing else above. No hero, no thumbnail, no decoration. Reads as broken or stub. The detail page hero (line 95 of `[slug].astro`) loads correctly, so the asset exists — the gallery tile just isn't using it.
- **404 inconsistency** (`desktop-nope.png`) — splash shows all 4 cards (UAT enforced this against the original SPLASH-04 drop rule); the 404 page still drops empties and shows only Graphic Design + Marketing. The thesis "4 disciplines" reads on splash but is broken the moment you hit a 404.
- **Portrait carousel renders as a black void in screenshots** (`desktop-splash.png`, `mobile-splash.png`). Headless chromium may simply not be loading the Astro image — but the bigger smell is that there's no visible fallback / skeleton / poster while the image is in-flight. Hover/Tab also surface the prev/next arrows (Plan-UAT documented) — the dots are present but the carousel reads as broken until images load.
- **Floating dev-tool widget visible in all screenshots** (the rounded black bar with Astro/lightning/search/gear icons, bottom-center) — that's the Astro dev toolbar. Worth noting only because if this audit were against the production build the widget would be absent; readers should not confuse it with UI chrome.
- **"PICK ONE" marker pill** on the splash question bar (`index.astro:478-489`) has terracotta background (#82785d olive-khaki) with paper text — at small mono caps the contrast is borderline (paper #f2ebdb on olive-khaki #82785d is ~3.3:1, below WCAG AA 4.5:1 for body text). Reads as muddy on the screenshot.

### Pillar 3: Color (3/4)

**Strengths**
- Tokens.css is well-organized and intentional; the per-discipline accent flow via `--accent: ${DISCIPLINE_ACCENT[category]}` on `<article style>` (`[slug].astro:88`) is a clean pattern.
- Earth-tone palette holds together across all 5 captured routes — no color clashes, no Tailwind-default purples leaking through.
- Discipline color mapping is consistent: design=umber, finance=silvered cobalt, personal=acid gold, marketing=plum sage. Each card pairs the bg with `--ink` or `--paper` for AA contrast.

**Findings**
- **`--terracotta` is no longer "decorative only"** despite the tokens.css:13 comment. `about.astro` uses it 16 times: scrollbar thumb (line 105/109), wireframe dashed border (117), wireframe bg mix (119), wireframe tag color (135), back-pill hover bg (172), bio link hover (203), pill hover bg+border (253), contact link hover (312). The doc claims one thing and the code does another.
- **`--lime` was added during UAT** (tokens.css:16, UAT.md confirms) without the verification_override register update that tokens.css:4 explicitly demands. Discipline gap.
- **2 nearly-identical taupes** — `--terracotta: #82785d` (olive-khaki) and `--teal: #b4a682` (sage-tinted taupe) — at small text sizes these will be indistinguishable. The two tokens compete for the same semantic slot. Either keep one or document the contrast intent.
- **Two hardcoded rgba blacks in splash carousel CSS** (`index.astro:214, 223, 235, 265`) — `rgba(0,0,0,0.6)`, `rgba(0,0,0,0.45)`, `rgba(15,13,12,0.92)`, `rgba(15,13,12,0.65)` — these should be derived from `--ink` via `color-mix(in oklab, var(--ink) Nx%, transparent)` to stay consistent with the rest of the system (the about page already uses this pattern at line 119).

### Pillar 4: Typography (2/4)

**Strengths**
- Three-family system (Bricolage / Fraunces / JetBrains Mono) is consistent and used purposefully — sans for display, serif for body, mono for labels/chrome.
- `letter-spacing` discipline: `0.1em` for header/mono caps, `0.16em` for CRO labels, `0.18em` for tiny mono — internally consistent within each role.
- Variable-axis settings used correctly on the splash wordmark (`font-variation-settings: "wdth" 100, "opsz" 96`).

**Findings**
- **18 raw `font-size` literals bypass the 11-role token scale** declared at tokens.css:23-34: `10px`, `11px`, `13px`, `14px`, `16px`, `18px`, `22px`, `32px`, `90px`, `240px` (the last two in unaudited Gallery* components). The scale was supposed to be canonical — instead it's used as suggestions.
- **5 different `font-weight` values on the splash bio card alone** (`index.astro:387, 404, 415, 446, 463`): 300, 400, 600, 700, 800. The other discipline cards stick to 600+800. Bio card is the outlier.
- **`.nav-link` lowercases inside an uppercased parent** (`Base.astro:67, 88`) — `.topbar` declares `text-transform: uppercase; font-weight: 600;` and `.nav-link` then overrides to lowercase. This works (specificity 0,2,0 beats 0,1,0) but reads as a sequence of patches rather than a designed system. Either pick uppercase header and lowercase email/linkedin/resume separately, or just declare lowercase on `.topbar` and stop fighting itself.
- **Bio card paragraph at 32ch max-width** (`index.astro:417`) — fine — but `<h3>why choose caleb?</h3>` has no max-width cap and could go wide on very large viewports.

### Pillar 5: Spacing (2/4)

**Strengths**
- Token scale itself is well-considered: 4/8/16/24/32/48/64 — strict 4-multiple, the gap from 8→16 is intentional per UAT docs.
- About page contact list uses tokens consistently (`var(--sp-2)`, `var(--sp-4)`, `var(--sp-5)`).
- Detail page CSS sticks to tokens (`[slug].astro:165-275` — `var(--sp-4/5/6/8)` throughout).

**Findings**
- **14+ raw spacing literals**: `Base.astro:78` `gap: 18px`, `Base.astro:92` `padding: 4px 0`, `index.astro:140` `padding: 16px 28px 22px`, `index.astro:143` `gap: 14px`, `index.astro:150` `gap: 16px` (which would be `var(--sp-4)`), `index.astro:294` `gap: 6px`, `index.astro:336` `padding: 0 8px`, `index.astro:362` `padding: 18px 22px 36px`, `index.astro:454` `gap: 0.4em`, `index.astro:473` `padding: 8px 0`, `index.astro:486` `padding: 4px 10px`, `index.astro:522` `gap: 10px`, `about.astro:233` `gap: 12px 12px`, `about.astro:241` `padding: 7px 16px`, `DisciplineCard.astro:58` `padding: 22px 22px 24px`, `DisciplineCard.astro:64` `gap: 4px`. Many of these could be tokens (`16px` → `--sp-4`, `8px` → `--sp-2`, `4px` → `--sp-1`).
- **WCAG 2.5.8 tap-target violation** — `.nav-link` (`Base.astro:92`) has `padding: 4px 0` and the link text is `--fs-mono` (11px). Effective tap height ~19px; WCAG 2.5.8 (Level AAA) wants 24×24 minimum, iOS HIG wants 44×44. SUMMARY.md 04-01:106 documents this trap and defers it to Phase 5, but it's already shipped to every page in production.
- **`@media (max-width: 900px)` is the only breakpoint for Base.astro chrome** — and it only adjusts the footer (`Base.astro:151-154`). The header gets nothing. The bare-text nav with 18px gap doesn't survive a 375px viewport (see Visuals/Experience findings).
- **`gap: 0.4em` on `.b-bio-arrow`** (`index.astro:454`) — em-based gap inside a mono-font caps line is functionally fine but inconsistent with the rest of the file's px-based gaps.

### Pillar 6: Experience Design (1/4)

**Strengths**
- Skip-to-content link present and correctly off-screen until focus (Base.astro:30, 104-127).
- `prefers-reduced-motion: reduce` honored in 3 places: tokens.css global block, Base.astro `.skip` transition, `[slug].astro:312` pager hover, `index.astro:599+619` carousel auto-advance.
- aria-current is set correctly only on splash (`isHome ? 'page' : undefined`) — closes Pitfall P-4.
- Detail pager has `rel="prev"` / `rel="next"` (`[slug].astro:141, 147`) — proper sequence semantics for assistive tech and search.
- External LinkedIn links carry the full `target="_blank" rel="noopener noreferrer"` trio (Base.astro:36, about.astro:74). Gate 20 enforces this site-wide.

**Findings**
- **BLOCKER — Header chrome is broken on mobile** (`mobile-splash.png`, `mobile-about.png`, `mobile-design.png`). At 375px viewport: `caleb lim` brand wraps to 2 lines, the OPEN TO ROLES pill word-wraps each word onto its own line (3-line stack), and the nav links (email + linkedin + resume) overflow the right edge — `resume` is clipped past the viewport. This is the primary nav on every page. SUMMARY 04-01 lines 105-107 explicitly defer the mobile audit to Phase 5 — but the site ships to recruiters today with a broken header on mobile. **No mobile breakpoint exists for `.topbar`.**
- **Tap-target failure site-wide** — `.nav-link` ~19px effective tap height (see Spacing). Three of the four primary site-nav affordances (email, linkedin, resume) are below WCAG 2.5.8.
- **404 page filters empties; splash does not** — the 404 (`desktop-nope.png`) shows only Graphic Design + Marketing. The splash shows all 4. Two pages, two contradictory takes on the same component contract. A recruiter who hits a 404 wonders "what happened to the other 2 disciplines."
- **Detail pager is vacuous on the current fixture** (1 piece per category) — the wiring is correct (verified by Gates 21a/21c/22), but the entire prev/next pager UI cannot be visually audited until a second piece lands in any category. Source code review only.
- **Bio card has competing click targets** — the entire `<a class="b-bio">` is clickable to /about (`index.astro:105-116`), AND it contains nested `<span class="b-bio-arrow">→ KEEP READING</span>` and `<span class="b-bio-tag">★ ABOUT</span>` that look interactive. Mouse-hover reveals the entire card is a single link, but the visual cueing of "two CTAs" inside one link is misleading.
- **Carousel keyboard support is partial** — `index.astro:632-635` wires ArrowLeft/ArrowRight on the root element, but the root is a `<div>` with no `tabindex`. Users tabbing through the page hit the prev/next/dot buttons individually but never the root, so the keyboard handler effectively never fires for keyboard users. Either drop the root keydown listener or add `tabindex="0"` + an aria-roledescription="carousel" treatment.
- **`StatusPill` pulse uses `--lime` on `--ink` bg** (StatusPill.astro:30) — green dot on near-black, contrast ~7:1, good. The OPEN TO ROLES wording is recruiter-direct. No issue with the pill itself — the issue is its mobile wrap behavior (see header blocker).

---

## Phase 4 Scope Boundary Notes

Findings flagged below are scoped to Phase 4 surfaces:

| Surface | Phase 4 Plan | Phase 4 Status |
|---------|--------------|----------------|
| Header chrome (Base.astro) | 04-01 | **Mobile blocker (Pillar 6) + tap-target blocker (Pillar 5)** |
| Detail pager (`[slug].astro`) | 04-02 | Wiring correct; visually vacuous on current fixture |
| About contact block (`about.astro`) | 04-03 | Renders cleanly desktop + mobile; `--terracotta` overuse flagged (Pillar 3) |
| Splash UAT tweaks (index.astro carousel, role-link shake, smile glyph, bio card) | post-plan UAT | Bio card competing CTAs + carousel keyboard handler partial (Pillar 6); token discipline drift (Pillar 3) |

The gallery empty-slab issue (Pillar 2 blocker) is **out of Phase 4's official scope** but ships on the page that Phase 4's pager rides on; surfacing here because the audit caught it.

---

## Next Steps

1. **Land a mobile header treatment before any further phases ship.** Cheapest fix: `@media (max-width: 700px) { .topbar { flex-wrap: wrap; gap: var(--sp-2); } .topbar nav { width: 100%; justify-content: flex-start; flex-wrap: wrap; row-gap: var(--sp-2); } }` + bump `.nav-link` padding to `8px 4px`. ~15 LOC.
2. **Investigate gallery tile rendering.** Confirm whether the empty-slab is intentional Phase 3 contract or a missing `<Image src={hero}>` wiring. If intentional, document explicitly so this audit reads it as deliberate restraint next time.
3. **Codify or sweep the token drift.** Either add a Phase 4 token-extension log to `tokens.css` (claiming `--lime`, declaring `--terracotta` as load-bearing not decorative, and listing the 18 font-size literals as known overrides) or sweep the literals back into tokens.
4. **Decide splash vs 404 card consistency.** Pick one rule (show all 4 or filter empties) and apply uniformly.
5. **Bio card: pick one CTA.** Either `★ ABOUT` as label OR `→ KEEP READING` as CTA, not both inside the same click target.
6. **Run this audit again once mobile header lands** — Pillar 6 should jump from 1 to at least 3.

---

## Files Audited

- `/Users/caleb/projects/personal-website/src/layouts/Base.astro` (155 lines)
- `/Users/caleb/projects/personal-website/src/pages/about.astro` (336 lines)
- `/Users/caleb/projects/personal-website/src/pages/[category]/[slug].astro` (322 lines)
- `/Users/caleb/projects/personal-website/src/pages/index.astro` (650 lines)
- `/Users/caleb/projects/personal-website/src/components/DisciplineCard.astro` (321 lines)
- `/Users/caleb/projects/personal-website/src/components/StatusPill.astro` (~45 lines)
- `/Users/caleb/projects/personal-website/src/styles/tokens.css` (70 lines)
- Screenshots captured: 9 total in `/Users/caleb/projects/personal-website/.planning/ui-reviews/04-20260518-180810/`
  - desktop: splash, about, design (gallery), marketing (gallery), nope (404), detail (design/design-real-piece)
  - mobile (375×812): splash, about, design (gallery)

**Registry safety audit:** skipped — no `components.json` (Astro project, no shadcn).
