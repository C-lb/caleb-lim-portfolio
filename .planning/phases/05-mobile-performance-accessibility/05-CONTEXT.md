# Phase 5: Mobile, Performance, Accessibility - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning
**Amended:** 2026-05-18 — D-13 host switched from Cloudflare Pages to Vercel (GitHub repo `C-lb/caleb-lim-portfolio` created and pushed; Vercel project to be imported via dashboard). Cascades through D-13, the Discretion item on URL pattern, canonical refs, and code_context URL pattern. The Lighthouse loop mechanics are identical — only the host name and preview-URL shape change.

<domain>
## Phase Boundary

Take the existing desktop build through a mobile-first hardening pass so the iPhone-Safari recruiter critical path works as well as the desktop one — without inventing new capabilities. Bound by ROADMAP.md SC1–6 (3 base SCs for mobile responsiveness, Lighthouse perf/a11y, prefers-reduced-motion; 3 carry-over SCs from Phase 4 UI-REVIEW for topbar mobile collapse, gallery tile thumbnails, and design-token hygiene).

Phase 5 is the last hardening pass before Phase 6 deploys to caleblim.com. No new features, no new pages, no new content. All carry-over SCs (5, 6) are quality-debt closure from Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Topbar mobile layout (BLOCKER-1 fix, FOUND-01)
- **D-01:** Topbar collapses to a compact **icon row** layout at ≤700px: brand "caleb lim" stays left; the three nav links (email / linkedin / resume) become small monospace glyphs on the right (✉ for mailto, "in" stylised for LinkedIn, ⤓ for resume download). No hamburger drawer, no stacked layout. Above 700px the existing desktop text-link layout stays unchanged.
- **D-02:** Each icon is a **44×44 px tap target** (WCAG 2.5.8 AAA). Icon glyph ~16px with ~14px padding each side. Header takes more vertical space at the breakpoint but is fully tap-safe on small thumbs.
- **D-03:** **Breakpoint = 700px**. `@media (max-width: 700px)` triggers the icon-row layout. Covers every phone in portrait + most narrow tablets; standard laptops still get the desktop layout.

### Dynamic island on mobile (FOUND-01)
- **D-04:** OPEN-TO-ROLES island stays in its current spot on mobile — `position: fixed`, top-center, persists through scroll. It just **shrinks slightly** (smaller padding, marginally smaller font) so the pill itself stays ≥44px tall while not crowding the brand text underneath. Not hidden, not relocated to bottom-center.
- **D-05:** Island click behavior (SHIPPED 2026-05-18 during this session): clicking the pill goes to `/about?to=contact` (query param, not `#contact` hash). The about page's inline script reads the param, jumps the viewport to the top, then RAF-animates a slow scroll (1800ms, easeInOutQuad) down to `#contact` so the user reads the bio on the way down. Hash navigation would force an instant browser snap; the param flag is what lets us animate. Under `prefers-reduced-motion`, the slow scroll is replaced with an instant jump.

### Touch + reduced-motion behavior (FOUND-03)
- **D-06:** **Touch devices get NO hover effects.** All 3D card-tilt + liquid-glass overlay rules wrap in `@media (hover: hover) and (pointer: fine)`. On touch (iPhone, iPad, Android), the cards stay at their rest tilt; first tap navigates immediately. Eliminates the "first tap shows hover state, second tap navigates" pattern that's standard iOS Safari friction.
- **D-07:** **Touch alternative to the hover micro-interaction:** add a one-time *scroll-into-view entrance animation* per card on mobile — a subtle shimmer / pulse pass that fires once when the card enters the viewport, so mobile users still get a hint of the same micro-interaction language without needing a hover state. Use `IntersectionObserver`, fire once per card per page load. Triggers only on `(hover: none)` to avoid double-firing on desktop.
- **D-08:** **FOUND-03 was amended during this discussion** (2026-05-18 — see REQUIREMENTS.md FOUND-03 amendment note). Under `prefers-reduced-motion`:
  - **Stay active** (classified as essential interaction feedback or status, exempt from the disable rule):
    - Card rest tilts (`transform: rotate(±1deg)`) — static transform, not motion
    - Lime-dot pulse on the OPEN-TO-ROLES island — status indicator
    - Hover-state tilt + glass overlay (`rotateX/Y` 380ms transition) — brief user-initiated feedback
    - Click-shake on role-link / card (`rotate()` 220ms keyframe) — brief user-initiated feedback
  - **Disable** (per original FOUND-03 scope, unchanged):
    - Portrait carousel auto-advance (already implemented)
    - Card entrance shake on first paint
    - Bio card entrance shake on first paint
    - Slow-scroll on `/about?to=contact` (already implemented — falls back to instant jump)
    - Any future scroll-driven reveals or magnetic effects

### Gallery tile thumbnail (BLOCKER-2 fix, supports SC4 critical path)
- **D-09:** **Tile composition: hero LEFT 60% / text RIGHT 40%.** Side-by-side layout, hero image fills the left 60% of the tile, title + blurb sit on the right 40%. Magazine-quote feel.
- **D-10:** **Tile aspect ratio: 4:5 portrait** (overall tile). The hero half is therefore ~12:25 (a vertical strip). Title + blurb get a comfortable narrow column on the right.
- **D-11:** **Hero asset source:** the piece's existing `hero` frontmatter image (already used by the detail page). No new asset wrangling — just wire the gallery card to render it. Image uses Astro's `<Image>` with `widths={[280, 560]}` and `object-fit: cover`, `object-position: center`.
- **D-12:** **Empty-state handling:** populated disciplines (`/design`, `/marketing`) get image-led tiles per D-09–D-11. Empty disciplines (`/finance`, `/personal`) keep their current "in the works — coming soon" treatment — this BLOCKER-2 fix is for populated tiles only.

### Lighthouse rig + real-device testing (SC1 + SC2)
- **D-13:** **Lighthouse runs against Vercel preview URLs.** (Amended 2026-05-18 — was Cloudflare Pages.) GitHub repo `C-lb/caleb-lim-portfolio` is already pushed; the remaining work is import the repo into Vercel via `vercel.com/new`, accept the auto-detected Astro build settings (`npm run build` → `dist/`), and confirm preview URLs deploy per branch push. Phase 5's first task is "import repo into Vercel + verify preview URL deploys on push." The Lighthouse audit (SC2 ≥85 perf / ≥95 a11y) runs against those URLs, not localhost. ~10 min of Phase 6 deploy work moves into Phase 5 (Vercel auto-detects everything; no `vercel.json` needed for a default Astro static build).
- **D-14:** **Real-device target: Caleb's current iPhone** (whichever model + iOS he owns). Pragmatic — the SC1 critical path only requires *some* real iPhone, not a specific model. Test session records the exact model + iOS version in `05-VERIFICATION.md` under "Real-Device Test Rig" so future audits can reproduce the conditions.
- **D-15:** **Lighthouse run profile:** default Lighthouse mobile preset (Moto G4, throttled 4G) — Caleb's iPhone is the qualitative real-device pass; Lighthouse is the quantitative throttled mobile pass. Both required for SC2.
- **D-16:** **CI gate or manual:** **manual-only** for Phase 5. Lighthouse runs are triggered manually (`npx lighthouse <preview-url> --form-factor=mobile`) and results recorded in `05-VERIFICATION.md`. CI Lighthouse gates can be added in a future phase if maintenance proves painful.

### Design-token hygiene (SC6, WARNING-1 carry-over)
- **D-17:** **Token audit scope:** (a) `--lime` registered in `tokens.css` with documented contrast ratio + use rationale, OR removed if redundant against `--acid`; (b) `--terracotta` re-classified as load-bearing in tokens.css (drop the "decorative only" comment); (c) raw `font-size` and spacing literals in `src/pages/index.astro`, `src/pages/about.astro`, `src/components/*.astro` swept and replaced with `--fs-*` / `--sp-*` tokens. Target: zero raw `px` font-sizes outside `tokens.css`.
- **D-18:** **Replacement strategy:** manual sweep, file-by-file. No codemod — the codebase is small (~7 source files for splash/about/components) and judgment calls about which token a literal should map to are worth keeping in human hands.

### Claude's Discretion

The following implementation details are left to the planner / executor:
- Specific SVG icon paths for the topbar mobile icon row (✉, in, ⤓ shapes — pick aesthetic equivalents from any free icon library or hand-author paths)
- Exact `transition` duration for the touch-device entrance animation (target: ~600ms, ease-out)
- Whether the entrance animation uses CSS animation triggered via `.is-entered` class (preferred) or Web Animations API
- Vercel preview URL pattern — confirmed shape: branch alias `caleb-lim-portfolio-git-<branch>-c-lb.vercel.app`, production `caleb-lim-portfolio.vercel.app`. Exact slug for branches with non-alphanumeric chars (e.g. `phase-5`) discovered on first deploy.
- Lighthouse CI vs manual: planner can revisit if SC2 turns out to need multi-run averaging

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project foundation
- `.planning/PROJECT.md` — Project value, constraints, key decisions (Vercel hosting target [amended 2026-05-18, was Cloudflare Pages], magazine-maximalist visual lock, anti-AI-tell rule)
- `.planning/REQUIREMENTS.md` — Full requirements list. FOUND-01/02/03 are the Phase 5 anchors. FOUND-03 was amended on 2026-05-18 to exempt user-initiated feedback motion (card hover-tilt + click-shake) — see the amendment note inline.
- `.planning/ROADMAP.md` §"Phase 5: Mobile, Performance, Accessibility" — Goal + 6 SCs (including 3 carry-overs from Phase 4 UI-REVIEW). Mode: mvp.

### Phase 4 carry-overs (must read before planning)
- `.planning/phases/04-navigation-secondary-surfaces/04-UI-REVIEW.md` — Source of BLOCKER-1 (mobile topbar overflow), BLOCKER-2 (empty gallery tiles), WARNING-1 (token drift). 13/24 overall. Itemised findings the planner needs to translate into tasks.
- `.planning/phases/04-navigation-secondary-surfaces/04-SUMMARY.md` (×3 — 04-01, 04-02, 04-03) — What shipped in Phase 4 (header chrome, detail pager, About contact block). The current state Phase 5 hardens.
- `.planning/phases/04-navigation-secondary-surfaces/04-SECURITY.md` — Phase 4 threat register, all closed. Reference for unchanged threat surfaces; Phase 5 adds no new STRIDE surfaces (mobile is presentation, not new boundaries).

### Implementation files Phase 5 will touch
- `src/layouts/Base.astro` — Topbar (BLOCKER-1, D-01–D-03)
- `src/components/StatusPill.astro` — Island mobile shrink (D-04). Island click→slow-scroll already shipped 2026-05-18.
- `src/components/DisciplineCard.astro` — Hover-tilt + glass touch-gate (D-06), entrance animation alternative (D-07), reduced-motion behavior (D-08)
- `src/pages/index.astro` — Bio card same treatment as DisciplineCard. Splash gallery (BLOCKER-2 source for grid layout reference; gallery itself lives in `[category].astro`).
- `src/pages/[category].astro` — Gallery tile rendering. BLOCKER-2 fix (D-09–D-12) lands here.
- `src/pages/about.astro` — Slow-scroll script already shipped; mobile layout audit.
- `src/styles/tokens.css` — Token registration / amendment (D-17, D-18)

### Build verification harness (do not regress)
- `scripts/verify-build.sh` — Phase 1–4 gates 1–22. Phase 5 should add a Gate-23 (or equivalent) verifying the mobile topbar collapse triggers at ≤700px and the icon row renders, plus a Gate-24 verifying populated-discipline gallery tiles emit `<img>` elements (not just text).

### External references
- WCAG 2.5.8 — Tap target minimum 24×24, AAA 44×44 (D-02 anchor)
- `prefers-reduced-motion` CSS media query — W3C draft
- Vercel docs — Astro framework guide (https://vercel.com/docs/frameworks/astro) + Generated URLs / preview deployments (https://vercel.com/docs/deployments/generated-urls) — D-13 setup
- Lighthouse CLI — `npx lighthouse <url> --form-factor=mobile --throttling-method=devtools` (D-15)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Astro `<Image>` component** (already used in `src/pages/index.astro` for portraits and `[category]/[slug].astro` for hero) — wire same pattern into `[category].astro` gallery tile for D-11.
- **`tokens.css`** with `--fs-*` (font-size) and `--sp-*` (spacing) scales — destination for D-17/D-18 literal-replacement sweep.
- **`@media (prefers-reduced-motion: reduce)` blocks** already present in DisciplineCard.astro, StatusPill.astro, index.astro for the carousel — pattern is established; D-08 extends it to honor the new exemption rules.
- **`IntersectionObserver`** is browser-native, no dependency add needed for D-07 entrance animation.

### Established Patterns
- **Mobile breakpoint convention:** existing CSS uses `@media (max-width: 900px)` (Phase 3 fold breakpoint) and `@media (max-width: 540px)` (Phase 3 tight-mobile breakpoint). D-03 introduces a new 700px breakpoint specifically for the topbar collapse — adjacent but distinct purpose.
- **`scripts/verify-build.sh` Gate convention:** each gate is a single bash check against built HTML in `dist/`, emits `OK:` or `FAIL:`, exits non-zero on any FAIL. Phase 5 verification gates follow this pattern.
- **Astro inline scripts** are tagged `<script>` (Astro inlines them into the page bundle, no module overhead). About.astro's slow-scroll script and the splash carousel script both use this — D-07 entrance animation should too.

### Integration Points
- **Base.astro is the topbar source of truth** — every page renders through it, so D-01–D-03 single-edit propagates site-wide.
- **`[category].astro` is the gallery card host** — BLOCKER-2 fix is one component edit, no per-discipline duplication.
- **Vercel preview URL pattern is `<project>-git-<branch>-<scope>.vercel.app`** (e.g. `caleb-lim-portfolio-git-phase-5-c-lb.vercel.app`); production is `<project>.vercel.app`. The Lighthouse test target URL is deterministic once the project is created. Verification scripts can hardcode the expected URL pattern.

</code_context>

<specifics>
## Specific Ideas

- Topbar mobile icon row: visual reference is Apple's standard mobile nav (compact icon bar, no chrome). Glyphs should be minimal monoline strokes, paper color on transparent — not filled or color-tinted icons.
- Touch-device entrance animation: brief shimmer pass across the card (~600ms, ease-out, one-shot). Less polished than the desktop tilt, but still signals "this is interactive."
- Gallery tile: editorial / magazine spread feel — hero on left like a magazine masthead photo, title + blurb on right like the headline + dek. Same visual rhythm as Phase 3's magazine-maximalist direction.
- Real-device test session: Caleb's iPhone, hotel-wifi simulation (turn off home wifi, use cellular). Walk the full critical path twice — once cold-cache, once warm-cache. Screenshot every route. Attach to 05-VERIFICATION.md.

</specifics>

<deferred>
## Deferred Ideas

- **Android Chrome real-device test** — scope says "iPhone Safari recruiter" per ROADMAP.md SC1; cross-browser pass on Android stays in Phase 6 deploy verification (ROADMAP Phase 6 SC2 lists "iPhone Safari, Android Chrome, desktop Safari, desktop Firefox").
- **CI Lighthouse gate** (GitHub Actions running Lighthouse on every PR) — manual-only for Phase 5 per D-16. Revisit in a future phase if maintenance proves painful.
- **Custom mobile interaction grammar** (swipe-based navigation, pull-to-refresh, etc.) — out of scope. Phase 5 hardens the existing UX for mobile; it does not invent mobile-only features.
- **Image format optimization beyond Astro defaults** (AVIF, responsive `srcset` beyond `widths={[280, 560]}`) — Astro's defaults cover Lighthouse perf. If SC2 fails, this gets pulled forward; otherwise stays deferred to post-launch polish.
- **Service worker / PWA support** — out of scope. Phase 5 is mobile-responsive hardening, not native-app shell.
- **Hamburger drawer for topbar** — explicitly rejected during this discussion in favor of icon row (D-01).

</deferred>

---

*Phase: 05-mobile-performance-accessibility*
*Context gathered: 2026-05-18*
