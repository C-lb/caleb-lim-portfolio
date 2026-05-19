# Requirements: Caleb Lim Portfolio

**Defined:** 2026-05-09
**Core Value:** A recruiter from any of the analyst / brand / marketing / design worlds can self-select into the work that's relevant to *their* role in under a minute and walk away convinced Caleb can do that job.

---

## v1 Requirements

### Splash & Navigation

- [ ] **SPLASH-01**: Splash landing renders name + "What do you wish to see?" prompt + portrait + bio block + four discipline cards, all visible above the fold on desktop (≥1280px viewport)
- [ ] **SPLASH-02**: Each discipline card shows category name, carries the discipline's accent color, and routes to a per-discipline gallery on click
- [ ] **SPLASH-03**: Four discipline gallery pages exist (Graphic Design / Financial Models / Personal Projects / Marketing); each renders all pieces in that discipline using an asymmetric magazine-grade layout (varied tile sizes, intentional negative space — explicitly NOT a uniform grid)
- [ ] **SPLASH-04**: Galleries hold up visually at 1–3 pieces (no "thin / placeholder" failure mode); if a category has zero pieces at launch, drop its card from the picker rather than ship an empty room
- [ ] **SPLASH-05**: On-brand 404 page links back to splash

### Piece Detail

- [ ] **PIECE-01**: Each piece has a dedicated detail page with a large rendered hero asset (image, never an iframe-embedded PDF)
- [ ] **PIECE-02**: Each detail page shows three short blurb blocks — **Context** (3–6 lines), **Role** (1–3 lines), **Outcome** (1–3 lines)
- [ ] **PIECE-03**: PDFs and slide decks are rasterized to images at build time (`pdfjs-dist` + `@napi-rs/canvas`) — page-1 cover as hero, full deck as a paginated sequence for multi-page assets
- [ ] **PIECE-04**: Multi-page slide decks render 3–6 representative slides as a vertical sequence below the hero
- [ ] **PIECE-05**: Detail page footer carries prev/next navigation within the same discipline plus a "Back to [Category]" link
- [ ] **PIECE-06**: Optional "Open full PDF" download link surfaces on pieces where the original PDF is sharable

### About & Contact

- [ ] **ABOUT-01**: About page hosts an 80–150-word first-person bio establishing the cross-functional analyst+brand pitch (the frame that makes the four-category split coherent)
- [ ] **CONTACT-01**: Resume PDF (`caleb-lim-resume.pdf`) is linked from the header on every page — direct download, **no email gate**
- [ ] **CONTACT-02**: Resume is also linked from the About page (two affordances, one source-of-truth file)
- [ ] **CONTACT-03**: `mailto:` contact link is in the header on every page
- [ ] **CONTACT-04**: LinkedIn link is in the header or footer on every page
- [ ] **CONTACT-05**: About page hosts a slightly larger contact block (email + LinkedIn + optional Calendly)

### Visual System

- [ ] **VISUAL-01**: Type system pairs **Bricolage Grotesque** (display, set huge + tight) with **Fraunces** italic (editorial accent) and **JetBrains Mono** (micro-labels). No Inter.
- [ ] **VISUAL-02**: Color system uses warm cream paper (`#f4ebd9`) + ink black + four saturated discipline-accent colors (terracotta `#e85d2a`, cobalt `#1947ff`, electric lime `#d4ff3a`, plum `#5a1a55`). Each discipline carries its accent through gallery and detail header.
- [ ] **VISUAL-03**: Layout language is non-grid: rotated cards (-1° to +1°), layered decorative geometry (outline circles, italic numerals, dotted lines, triangles), magazine-grade typographic hierarchy
- [ ] **VISUAL-04**: Aesthetic actively rejects AI-template tells — no centered hero with gradient, no shadcn cards, no Inter, no lucide icons, no bento grid, no purple gradients, no "Built with X" footer (verified at code-review and UI-review gates)

### Foundations

- [ ] **FOUND-01**: Fully mobile-responsive across all pages (≥50% of recruiter first views are on phone; mobile breakage on a design portfolio reads as a craft failure)
- [ ] **FOUND-02**: First paint <2s on standard mobile / hotel-wifi — assets lazy-loaded below the fold, critical CSS inlined, fonts subsetted
- [x] **FOUND-03**: Honors `prefers-reduced-motion` everywhere — non-essential motion (rotations, magnetic effects, scroll-driven reveals) disables under the media query. **Exception (amended 2026-05-18 during /gsd-discuss-phase 5):** brief user-initiated feedback motion — namely the card hover-tilt (`rotateX/Y` on `.b-card` / `.b-bio`) and the click-shake (`rotate()` on role-link clicks) — is classified as *essential interaction feedback* and remains active under `prefers-reduced-motion`. All other motion still disables (carousel autoplay, scroll-driven animations, magnetic effects, decorative rotations). The lime-dot pulse on the OPEN-TO-ROLES island also remains as a status indicator.
- [ ] **FOUND-04**: Deployed to **caleblim.com** (subject to availability check at deploy time) on **Cloudflare Pages**, domain registered via **Cloudflare Registrar**
- [ ] **FOUND-05**: Launches with 5–15 pieces total, asymmetrically distributed across categories (strong: Graphic Design + Marketing; thinner: Financial Models + Personal Projects); per-category gallery design accommodates the imbalance

---

## v2 Requirements (Deferred — add after v1 ships and validates)

### Motion Polish

- **MOTION-01**: View Transitions API on thumbnail → piece-detail navigation (the "morph into hero" effect)
- **MOTION-02**: CSS scroll-driven reveals (`animation-timeline: view()`) for piece-detail content (Context / Role / Outcome blurbs paced as you scroll)
- **MOTION-03**: Custom cursor on desktop (small dot follower, hover-scale on links; disabled on touch + reduced-motion)
- **MOTION-04**: Magnetic / hover-deflection effect on the four splash category cards

### Content Surfacing

- **CONTENT-01**: "Outcome" tagline rendered directly on Finance gallery cards (e.g. "Reduced WACC modeling cycle 3d → 4h")
- **CONTENT-02**: "Show me everything" curated 6-piece tour link in footer (catches the recruiter who doesn't know what bucket they're hiring for)

### Future

- **FUTURE-01**: Calendly embed (only if Caleb actually wants inbound cold calls)
- **FUTURE-02**: Privacy-first analytics (Plausible / Fathom — consent-exempt, no cookie banner needed)
- **FUTURE-03**: OG image generation per piece (LinkedIn-share fidelity)
- **FUTURE-04**: Per-piece secondary images / detail spreads as content volume grows beyond hero-only
- **FUTURE-05**: Personal Projects content authored and added once it materializes
- **FUTURE-06**: Backfill toward target volume (15+ pieces across the four categories)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Skill bars / percentage charts | Universal AI-template tell; meaningless to recruiters; reads junior |
| Testimonial slider / carousel | Engagement data is brutal (slide 1 only); reads as WordPress widget |
| Generic centered hero with gradient + CTA | Strongest "AI-generated" signal; would actively undermine the brand pitch |
| shadcn-card grid for gallery | Reads as "developer pretending to design"; brand recruiters have seen 200 of these |
| Stale blog | Out of Scope per PROJECT.md; a blog without publishing cadence damages credibility |
| Long-form case studies (problem / process / wireframes) | Wrong audience — brand+analyst recruiter wants artifact + outcome, not journey |
| "Hire Me" CTA in big type | Reads desperate / freelance-y; Caleb targets full-time roles |
| Email-gated resume download | 100% conversion-killer for the only conversion that matters |
| Pre-splash intro animation ("click to enter") | Two splashes back-to-back = bounce or "site is broken" |
| Cookie banner | No third-party trackers in v1, so nothing to consent to |
| Dark mode toggle | Doubles visual-design work for zero recruiter-facing value |
| Autoplay video / hero reel | Bandwidth, accessibility, mobile battery, and most browsers block autoplay anyway |
| AI chat widget ("ask my portfolio anything") | Gimmicky; hallucination liability; recruiters want to read, not interrogate |
| Newsletter signup | Wrong context for a job-seeking portfolio |
| "What I do" tri-column with icons | Filler; the four-category picker already answers this |
| CMS / admin UI | At 5–15 static pieces with infrequent updates, CMS is overhead with no payoff |
| Authentication / private content | Everything is public to recruiters |
| Internationalization | Single-language (English) sufficient |
| Per-recruiter share links (`/r/acme-corp`) | Considered and rejected during questioning in favor of pick-on-arrival |
| Paid web font with per-pageview licensing | Free Google variable fonts (Bricolage Grotesque, Fraunces, JetBrains Mono) cover the design |
| Real-time chat / video calls | Out of scope for a static portfolio |
| Contact form (with backend like Formspree) | Adds dependency for ~zero recruiter-facing benefit; mailto is the right primitive |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPLASH-01 | Phase 3 | Pending |
| SPLASH-02 | Phase 3 | Pending |
| SPLASH-03 | Phase 3 | Pending |
| SPLASH-04 | Phase 3 | Pending |
| SPLASH-05 | Phase 3 | Pending |
| PIECE-01 | Phase 1 | Pending |
| PIECE-02 | Phase 1 | Pending |
| PIECE-03 | Phase 2 | Pending |
| PIECE-04 | Phase 2 | Pending |
| PIECE-05 | Phase 4 | Pending |
| PIECE-06 | Phase 2 | Pending |
| ABOUT-01 | Phase 2 | Pending |
| CONTACT-01 | Phase 2 | Pending |
| CONTACT-02 | Phase 2 | Pending |
| CONTACT-03 | Phase 4 | Pending |
| CONTACT-04 | Phase 4 | Pending |
| CONTACT-05 | Phase 4 | Pending |
| VISUAL-01 | Phase 3 | Pending |
| VISUAL-02 | Phase 3 | Pending |
| VISUAL-03 | Phase 3 | Pending |
| VISUAL-04 | Phase 3 | Pending |
| FOUND-01 | Phase 5 | Pending |
| FOUND-02 | Phase 5 | Pending |
| FOUND-03 | Phase 5 | Complete (Plan 05-06, 2026-05-19) |
| FOUND-04 | Phase 6 | Pending |
| FOUND-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 26 total (5 SPLASH + 6 PIECE + 6 ABOUT/CONTACT + 4 VISUAL + 5 FOUND)
- Mapped to phases: 26 ✓
- Unmapped: 0

**Per-phase distribution:**
- Phase 1 (Walking Skeleton): 2 requirements — PIECE-01, PIECE-02
- Phase 2 (Asset Pipeline + Real Content): 7 requirements — PIECE-03, PIECE-04, PIECE-06, ABOUT-01, CONTACT-01, CONTACT-02, FOUND-05
- Phase 3 (Visual Design System): 9 requirements — SPLASH-01 through SPLASH-05, VISUAL-01 through VISUAL-04
- Phase 4 (Navigation & Secondary Surfaces): 4 requirements — PIECE-05, CONTACT-03, CONTACT-04, CONTACT-05
- Phase 5 (Mobile, Performance, Accessibility): 3 requirements — FOUND-01, FOUND-02, FOUND-03
- Phase 6 (Deploy & Maintenance Handoff): 1 requirement — FOUND-04

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-09 — traceability populated by gsd-roadmapper*
