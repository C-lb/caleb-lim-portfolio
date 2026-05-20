---
phase: 6
status: scaffolded
recorded_at: TBD
notes: Wave 0 scaffold; filled by Wave 1 (Gates 26a/b/c + LCP), Wave 2 (domain + HTTPS), Wave 3 (dry run + cross-browser + Lighthouse + reduced-motion).
---

# Phase 6 — Verification Record

> Scaffold authored by Plan 06-01 (Wave 0). Wave 1-4 plans fill this in place — they do NOT overwrite the file. Each section's blanks get filled with real results (Lighthouse JSON pull-quotes, real-iPhone screenshots, domain registration record, OG card visual approval, cross-browser matrix cells, verdict columns) during the phase-exit verification pass.

## Real-Device Test Rig (D-09)

Pre-filled per Phase 5 D-14 carryover. Same iPhone Caleb walked Phase 5 on; same iOS build; same tester.

| Field | Value |
|-------|-------|
| iPhone model | iPhone 15 |
| iOS version | iOS 26.4.2 |
| Network | hotel-wifi simulation (home wifi off, cellular only) |
| Browser | Safari (stock — no content blockers) |
| Test date | TBD (Wave 3 — Plan 06-08) |
| Tester | Caleb Lim |

## Vercel Production Bootstrap (SC1, D-13 carryover / D-07 amendment)

Production deploys from `main` on Vercel; custom domain flip is Wave 2 (Plan 06-07).

| Field | Value |
|-------|-------|
| Production URL (Vercel default) | https://caleb-lim-portfolio.vercel.app |
| Custom-domain URL | TBD (Wave 2 — Plan 06-07; pending domain registration per D-08) |
| Domain status | TBD (Wave 2 — Vercel dashboard must show "Valid Configuration") |
| First production-on-custom-domain commit | TBD (Wave 2 — recorded after DNS verifies + cert provisions) |
| HTTPS / cert verification | TBD (Wave 2 — Let's Encrypt via Vercel; `curl -vI` issuer/subject capture) |

## Domain Availability Check Log (D-08)

Run the availability check at the start of Wave 2 (Plan 06-07). Pre-seeded rows mirror the D-08 fallback chain — primary then three fallbacks.

| Date | Domain | Available? | Registered? | Notes |
|------|--------|------------|-------------|-------|
| TBD | caleblim.com | TBD | TBD | D-08 primary — Cloudflare Registrar (~$10/yr at-cost). If unavailable walk fallbacks below. |
| TBD | caleblim.co | TBD | TBD | D-08 fallback 1 |
| TBD | caleb.work | TBD | TBD | D-08 fallback 2 |
| TBD | caleblimkr.com | TBD | TBD | D-08 fallback 3 — middle-name variant |

**Alternative registrar path (D-08):** if Caleb prefers single-vendor DNS during the registrar checkpoint, Vercel Domains is the alternative (one-click, ~$15/yr — slightly more expensive but eliminates the Cloudflare→Vercel DNS-pointer step). Record the chosen registrar + final domain in the row that succeeded.

## Critical-Path Walk (SC1, SC2)

To be walked on iPhone 15 / iOS 26.4.2 against the custom domain (or Vercel default subdomain pre-Wave-2). Mirrors 05-UI-SPEC §"Critical-path accessibility walk" — same 11 steps Phase 5 walked, re-walked here against the production custom-domain build.

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Load splash | Above-fold composition readable; all four discipline cards tappable ≥44×44 | TBD |
| 2 | Tap Graphic Design card | /design loads; tile heroes render (not empty slabs); tile is tappable | TBD |
| 3 | Tap a tile | Detail page loads; hero renders; Context/Role/Outcome blurbs readable | TBD |
| 4 | Scroll detail page | No horizontal overflow; pdf-paginate slide sequence (if present) scrolls cleanly | TBD |
| 5 | Tap back-pill | Returns to /design | TBD |
| 6a | Tap mobile topbar envelope glyph | Mail app launches with `mailto:` populated | TBD |
| 6b | Tap mobile topbar LinkedIn glyph | LinkedIn opens in new tab (or LinkedIn app if installed) | TBD |
| 6c | Tap mobile topbar resume glyph | `caleb-lim-resume.pdf` downloads (no inline viewer) | TBD |
| 7 | Tap OPEN-TO-ROLES island | Slow-scroll fires to /about contact (or instant under reduced-motion) | TBD |
| 8 | Brand link → /marketing | Second gallery loads cleanly | TBD |
| 9 | Repeat 2–4 on /marketing | Identical experience to /design | TBD |
| 10 | Toggle iOS Reduce Motion ON, repeat 1–9 | Carousel pauses; slow-scroll → instant; card entrance shake disabled; hover-tilt + click-shake + pulse remain; **D-06 exempts now fire (StatusPill hover, back-pill color, pager color — were broken pre-Plan 06-05)** | TBD (full per-motion checklist in Reduced-Motion Walk section below) |
| 11 | StatusPill tap sanity (375px viewport) | Pill tap is comfortable, no mis-tap into surrounding chrome | TBD |

## Cross-Browser Matrix (D-09)

5 routes × 4 browsers = 20 cells. Each cell: load route, confirm no console errors, exercise primary interaction (gallery click, detail open, scroll, back), then mark PASS/FAIL with a 1-line note. ~5min × 20 cells ≈ 100min total.

Detail-page route uses `/design/design-real-piece` per Phase 5 baseline (the same slug Plan 05-08 audited for LCP).

| Route | iPhone Safari (iPhone 15 / iOS 26.4.2) | Android Chrome (device or BrowserStack — record source) | Desktop Safari (Mac) | Desktop Firefox (Mac) |
|-------|----------------------------------------|---------------------------------------------------------|----------------------|-----------------------|
| `/` (splash) | TBD | TBD | TBD | TBD |
| `/design` | TBD | TBD | TBD | TBD |
| `/design/design-real-piece` | TBD | TBD | TBD | TBD |
| `/about` | TBD | TBD | TBD | TBD |
| `/<bad-404>` (404 page) | TBD | TBD | TBD | TBD |

## Lighthouse Scores (SC2, SC5, D-05)

Source: `bash scripts/lighthouse-audit.sh <prod-custom-domain-url>` — run after Wave 2 domain flip lands. Re-audits the same 5 routes Phase 5 audited; the only score expected to move is `/design/design-real-piece` LCP, which Plan 06-04 (D-05 fix) drives from 3121ms baseline toward <2000ms target.

Thresholds per 05-UI-SPEC §"Lighthouse budget" (unchanged from Phase 5):
- All routes: Performance ≥85, Accessibility ≥95
- Splash only: LCP < 2000ms (hard gate)

Plan 06-04 (D-05) adds a stricter target on detail page: `/design/design-real-piece` LCP < 2000ms (was 3121ms in Phase 5 baseline).

| Route | Perf | A11y | LCP (ms) | Pass? | Summary file |
|-------|------|------|----------|-------|--------------|
| `/` (splash) | TBD | TBD | TBD | TBD | TBD (lighthouse/splash-summary.json — to be regenerated) |
| `/design` | TBD | TBD | TBD | TBD | TBD |
| `/marketing` | TBD | TBD | TBD | TBD | TBD |
| `/about` | TBD | TBD | TBD | TBD | TBD |
| `/design/design-real-piece` | TBD | TBD | TBD | TBD | TBD |

**Target after Wave 1 Slice C (D-05 detail-LCP fix):** `/design/design-real-piece` LCP < 2000ms (was 3121ms in Phase 5 baseline per `.planning/phases/05-mobile-performance-accessibility/lighthouse/design_design-real-piece-summary.json`).

## Reduced-Motion Walk (SC6, D-06, D-08)

Toggle macOS *System Settings → Accessibility → Display → Reduce motion = ON* on iPhone *Settings → Accessibility → Motion → Reduce Motion = ON*, hard refresh, walk site. Mirrors 05-UI-SPEC §"Verification walk". The first 9 rows mirror Phase 5's reduced-motion walk verbatim; the trailing 3 rows are NEW for Plan 06-05's D-06 straggler removal — these motions were incorrectly suppressed under reduced-motion before Plan 06-05, and the walk MUST confirm they now fire as exempt per D-08.

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
| 10 | Hover StatusPill (desktop) | Pill SCALES briefly under reduced-motion (#12 exempt — was broken pre-Plan 06-05; transition: none block removed) | TBD |
| 11 | Hover back-pill on detail page | Color transition FIRES under reduced-motion (#16 exempt — color-only; was broken pre-Plan 06-05) | TBD |
| 12 | Hover prev/next pager-link on detail page | Color transition FIRES under reduced-motion (#18 exempt — color-only; was broken pre-Plan 06-05) | TBD |

## OG / SEO Sign-Off (SC4, D-03, D-04, D-11)

Filled by Wave 1 Slice B (Plan 06-02 — sitemap + robots) and Wave 2 Slice A (Plan 06-03 — OG card + meta).

| Check | Status | Evidence |
|-------|--------|----------|
| `public/og.png` exists (Gate 26a) | TBD | `test -f public/og.png && file public/og.png` output |
| `public/og.png` is 1200×630 (Gate 26a) | TBD | `file public/og.png` dims line |
| OG card visual approval by Caleb (D-11) | TBD | Approval captured + source file (Figma URL / `.psd` / render script path) noted here for re-render |
| LinkedIn Post Inspector preview | TBD | https://www.linkedin.com/post-inspector/ rendered preview screenshot or pull-quote |
| Twitter Card Validator (or opengraph.xyz fallback) | TBD | Validator screenshot or rendered-preview URL |
| `sitemap-index.xml` at custom domain returns 200 (Gate 26b) | TBD | `curl -I https://<custom-domain>/sitemap-index.xml` HTTP status line |
| `robots.txt` at custom domain references `Sitemap:` line (Gate 26c) | TBD | `curl https://<custom-domain>/robots.txt` body |

## Caleb-Adds-a-Piece Dry Run (SC3, D-01, D-02)

Walked by Caleb during Wave 3 (Plan 06-08). The dry run IS the documentation source per D-01 — orchestrator captures screenshots while Caleb walks, then commits them under `docs/contributing/` and tightens the README prose. README placeholders live at repo root pre-walk; this section records the run outcome.

Date: TBD (Wave 3)

| # | Step | Screenshot | Result |
|---|------|------------|--------|
| 1 | Open github.dev (`.` keypress on github.com/C-lb/caleb-lim-portfolio) | `docs/contributing/01-open-github-dev.png` | TBD |
| 2 | Create new folder under `src/content/pieces/` (Caleb names the slug) | `docs/contributing/02-create-piece-folder.png` | TBD |
| 3 | Add `index.md` with frontmatter (title, category, role, outcome, context, hero) | `docs/contributing/03-add-frontmatter.png` | TBD |
| 4 | Drop hero image (JPG/PNG) into the new folder | `docs/contributing/04-add-hero-image.png` | TBD |
| 5 | Commit + push from github.dev source-control panel | `docs/contributing/05-commit-and-push.png` | TBD |
| 6 | Vercel auto-deploys; piece appears on production URL | `docs/contributing/06-piece-live-on-prod.png` | TBD |

## Phase Exit Sign-Off

- [ ] All `scripts/verify-build.sh` gates green (Gates 1–27) — confirmed TBD by Wave 4 final build
- [ ] All Lighthouse thresholds met (Perf ≥85, A11y ≥95 every route; splash LCP <2000ms; detail-page LCP <2000ms per D-05)
- [ ] Real-iPhone critical-path walk recorded — iPhone 15 / iOS 26.4.2 all 11 steps PASS against custom domain
- [ ] Reduced-motion walk recorded — all 12 motions behave per D-08 (incl. the 3 D-06 exempts now firing post-Plan-06-05)
- [ ] Cross-browser matrix complete — 20 cells, all PASS (5 routes × 4 browsers)
- [ ] OG card visually approved by Caleb + verified via LinkedIn Post Inspector + Twitter Card Validator
- [ ] `sitemap-index.xml` + `robots.txt` reachable at custom domain
- [ ] Caleb-adds-a-piece dry run captured (6 numbered screenshots committed under `docs/contributing/`)
- [ ] `README.md` at repo root populated with the walkthrough prose + working screenshot embeds (renders on github.com)
- [ ] Custom domain registered + DNS configured + HTTPS cert provisioned (per D-08 chosen domain)
- [ ] Vercel dashboard shows domain status "Valid Configuration"
- [ ] D-07 doc-rot amendments landed in CLAUDE.md + `.planning/PROJECT.md` (Cloudflare → Vercel inline annotations)

### SC sign-off table

| SC | Description | Sign-off | Evidence |
|----|-------------|----------|----------|
| SC1 | Domain registered + DNS + HTTPS resolves to Vercel deployment, no cert warnings | TBD | TBD |
| SC2 | Production end-to-end loads across iPhone Safari, Android Chrome, desktop Safari, desktop Firefox | TBD | TBD (Cross-Browser Matrix above) |
| SC3 | Caleb personally added a test piece via GitHub.dev; README walkthrough committed | TBD | TBD (Caleb-Adds-a-Piece Dry Run above + README.md at repo root) |
| SC4 | OG card + robots.txt + sitemap.xml present + verified via LinkedIn Post Inspector + Twitter Card Validator | TBD | TBD (OG / SEO Sign-Off above) |
| SC5 | Detail-page hero LCP < 2000ms (was 3121ms in Phase 5 baseline) — D-05 widths fix landed | TBD | TBD (Lighthouse Scores above; lighthouse/design_design-real-piece-summary.json) |
| SC6 | Three D-06 stragglers removed; reduced-motion walk PASSes D-08 exempts #12 / #16 / #18 | TBD | TBD (Reduced-Motion Walk rows 10-12 above; Gate 27 GREEN) |

**Phase 6 verdict: TBD** (Wave 0 scaffold complete; Wave 1-3 fills in).
