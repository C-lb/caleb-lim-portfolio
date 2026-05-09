# Project Research Summary

**Project:** Caleb Lim Portfolio
**Domain:** Designer-grade personal portfolio — cross-functional brand/analyst positioning, static deliverables, non-developer owner
**Researched:** 2026-05-09
**Confidence:** HIGH (overall recommendation), MEDIUM (specific version pins and cross-functional positioning nuances)

---

## OPEN QUESTION — Must Resolve Before Stack Is Locked

**How technically comfortable is Caleb, actually?**

"Non-developer" covers a wide range. The code path (Astro + git + terminal) requires Caleb to use GitHub.dev (the browser-based editor at `github.dev`) to drop in new `.md` files and commit — no terminal, no npm, no local setup. That's plausibly learnable for some non-developers; it's a non-starter for others. PITFALLS.md flags this explicitly: the maintenance workflow needs to be validated by having Caleb actually add a test piece end-to-end before the stack is locked in, not after the site ships.

**This is the highest-priority open question.** The entire stack recommendation branches on it.

---

## Executive Summary

This is a recruiter-facing portfolio for a cross-functional candidate with work across four disciplines — Graphic Design, Finance/analyst, Personal Projects, Marketing. The UX premise is a category-picker splash that lets recruiters self-select by role, routing them into a curated gallery of relevant work. The brand pitch is inseparable from the site itself: the aesthetic has to read as confidently hand-crafted (Readymag/Framer editorial register), not as an LLM-generated template. The site doubles as a brand artifact for someone pitching brand-management roles, so a generic site actively undermines the pitch.

The core stack decision is unresolved — and the two researchers reached opposing conclusions. STACK.md recommends Framer (no-code, visual editor, same platform as one of the two reference sites) on the grounds that Caleb being a non-developer makes git-based content updates too high-friction to sustain. ARCHITECTURE.md assumes Astro (code path, content collections, Zod-validated frontmatter, build-time PDF rasterization) on the grounds that it provides type-safe content management, better long-term portability, and native View Transitions for the thumbnail-to-detail morphing effect. PITFALLS.md flags both sides: Framer's no-HTML-export lock-in is serious, and code-path maintenance friction for a non-developer is equally serious. The recommendation in this summary is to default to Framer with a clear escape hatch, but that default should be confirmed against Caleb's actual technical comfort before planning proceeds.

Regardless of path, three risks cut across both options: (1) the site looking AI-generated if template defaults are used — this is the single most-damaging failure for a brand-management pitch and requires explicit anti-template constraints from day one; (2) PDFs and slide decks breaking on iOS Safari if embedded as iframes — the correct pattern is build-time rasterization to image gallery regardless of platform; (3) the cross-functional pitch reading as "jack of all trades" rather than deliberate range if per-piece Context/Role/Outcome blurbs aren't written with specificity. Content authoring is as high-risk as any technical work on this project.

---

## Critical Tension: Framer vs. Astro

This needs to be surfaced as a first-class decision, not buried.

| Dimension | Framer (STACK.md recommendation) | Astro (ARCHITECTURE.md assumption) |
|-----------|----------------------------------|-------------------------------------|
| Content updates for Caleb | Visual editor, ~2 min per piece, no code | GitHub.dev (browser editor) + commit, no terminal — but still git |
| Design ceiling | High — Framer is literally one of the two reference sites | Marginally higher — full pixel/animation control |
| PDF handling | Cover image + download link; no native build pipeline | Build-time rasterization via `pdfjs-dist` + `@napi-rs/canvas`; generates `<img>` tags |
| View Transitions | Supported via Motion (baked in); visual editor configuration | Native Astro View Transitions API — tighter thumbnail-morph control |
| Platform lock-in | **Serious.** No HTML export. Site depends on Framer's backend. Migration = rebuild from scratch. | None. Portable HTML/CSS/JS. |
| Maintenance if Framer changes pricing/features | High risk — held hostage | Zero risk |
| Y1 cost | ~$130 ($120 Framer + $10 domain) | ~$10 (domain only; Cloudflare Pages is free) |
| Y2+ cost | ~$130/yr | ~$10/yr |
| AI-template risk | Medium-high if starting from a template; low if blank canvas | Medium-high if using Tailwind/shadcn defaults; low if custom design system |
| Right answer if Caleb is truly non-technical | Yes | No — git friction will stale the site |
| Right answer if Caleb can do GitHub.dev workflow | Depends on lock-in tolerance | Yes |

**Recommended default: Framer.**

Rationale: The site has 5–15 pieces and updates infrequently. The reference aesthetic (Framer-grade expressive portfolios) is literally the platform's home turf. Starting from a blank canvas (not a template) in Framer produces results indistinguishable from code to recruiter eyes. The $120/yr delta is real but not decisive for a job-search asset. Most importantly: a beautiful site Caleb can't update will go stale, which is worse than a slightly-less-technically-pure site he can maintain.

**The escape hatch (Astro path) is valid if:** Caleb validates that he can reliably do the GitHub.dev content-update workflow, and/or he partners with a developer who owns the technical layer.

**Lock-in mitigation regardless of path:** Keep all source assets (PDFs, images) in a separate cloud folder (Google Drive, Dropbox) independent of Framer. If migration becomes necessary, content is portable even if the site layout isn't.

---

## Key Findings

### Recommended Stack

**If Framer path (recommended default):**
- **Framer Basic, billed annually** (~$10/mo) — visual editor, Motion baked in, blank canvas start (never a template), manual CMS layouts for the gallery
- **Cloudflare Registrar** (~$10.46/yr) — at-cost `.com`, full DNS portability, connects to Framer via two DNS records
- **PDF pattern:** export each PDF/deck as high-res cover images (PNG/WebP) for gallery and detail; link original PDF as download. No iframe embeds.

**If Astro path (fallback, requires developer or validated Caleb workflow):**
- **Astro 5.x** — static site framework, content collections with Zod schema, near-zero JS default, View Transitions built in
- **Motion 12.x** (`motion` package, not deprecated `framer-motion`) — component-level animations
- **GSAP 3.13+** (now 100% free including ScrollTrigger, SplitText, etc.) — orchestrated scroll sequences, magnetic card effects
- **Lenis** (`lenis` package, not retired `@studio-freight/lenis`) — smooth scroll on detail pages only, not globally
- **Cloudflare Pages** (free tier, unlimited bandwidth, no commercial-use restriction) — not Vercel Hobby

**Both paths: avoid** GoDaddy (Feb 2026 ToS change), Vercel Hobby for commercial-adjacent use, `framer-motion` (deprecated), `@studio-freight/lenis` (retired), any Tailwind defaults shipped untouched.

### Expected Features

**Must have (table stakes — v1 launch):**
- Splash with "What do you wish to see?" + four category cards showing piece count
- Four discipline gallery pages, each with at least one real piece (no empty rooms at launch)
- Per-piece detail page: large rendered asset (not iframe PDF) + Context/Role/Outcome blurb (3–6 lines each)
- Resume PDF linked from header on every page — direct download, filename `caleb-lim-resume.pdf`, no gating
- `mailto:` link + LinkedIn link in header/footer
- About page: 80–150 words, first-person, cross-functional stance (not a skills list)
- Mobile-responsive across all pages
- Distinctive type system — editorial display face + text face, oversized headline scale; explicitly not Inter-only
- Per-discipline accent color
- Asymmetric gallery composition (varied tile sizes, not a uniform grid)
- Custom 404 page, on-brand

**Should have (adds memorability — v1.x after validation):**
- View Transitions API — thumbnail-to-detail morph; ~85% browser coverage, degrades gracefully
- Scroll-driven reveals on detail pages (CSS `animation-timeline: view()`, native, no JS)
- Magnetic hover effect on splash category cards
- "Outcome" tagline on Finance gallery cards
- Custom cursor (desktop only, disabled on touch and `prefers-reduced-motion`)
- "Show me everything" curated tour link in footer

**Defer (v2+):**
- Calendly embed (only if Caleb wants inbound calls)
- Privacy-first analytics (Plausible/Fathom) once there's signal to measure
- OG image per piece for LinkedIn share fidelity
- Per-piece secondary image spreads (content-volume dependent)

**Explicitly never build:**
Skill bars, testimonial slider, centered-hero-with-gradient, shadcn-card grid, blog, long-form case studies, "Hire Me" CTA, email-gated resume, pre-splash intro animation, cookie banner without trackers, dark mode toggle, autoplay video hero, AI chat widget, newsletter signup.

### Architecture Approach

**Framer path architecture** is simpler: one "Pieces" CMS collection with `category`, `title`, `role`, `outcome`, `context`, `cover`, `pdf` fields. Each category page filters this collection. Manual layout (not Framer's auto-grid). Splash + four category pages + piece detail pages + About + 404. Cover images and PDF thumbnails are pre-exported manually before uploading to Framer.

**Astro path architecture** (documented fully in ARCHITECTURE.md) is a two-tier system:
1. **Content layer:** `src/content/pieces/<category>/<slug>.md` with Zod-validated frontmatter. Schema enforces required fields (`title`, `category`, `role`, `outcome`, `context`, one of `heroImage`/`heroPdf`) at build time.
2. **Build pipeline:** `scripts/pdf-preprocess.mjs` runs before `astro build`, rasterizes PDFs to `public/generated/pdf-thumbs/` via `pdfjs-dist` + `@napi-rs/canvas`. Output committed to git so Caleb doesn't run the preprocessor himself.

**Major components (Astro path):**
1. `SplashPicker` (`/index.astro`) — entry point; category cards + piece counts; one small motion island
2. `CategoryGallery` (`/[category]/index.astro`) — asymmetric grid of `PieceCard` components, filtered from collection
3. `PieceDetail` (`/[category]/[slug].astro`) — hero asset (rendered image) + ContextBlock; `SlideCarousel` island for `pdfPaginate: true` pieces
4. `SiteShell` (layout) — header, footer, Astro View Transitions for cross-page motion
5. `lib/categories.ts` — single source of truth for 4 categories, labels, accent colors
6. `scripts/pdf-preprocess.mjs` — build-time PDF rasterization; runs via `npm run content:build`

**Build order (Astro path):** Schema before pages → routing before visuals → PDF pipeline before gallery design → real content last. Violating this order produces pages that break when real asset aspect ratios (portrait letter PDFs, landscape 16:9 decks, square posters) meet a grid designed against gray rectangles.

### Critical Pitfalls

1. **AI-template look** — the single most damaging failure for this pitch. Concrete tells to forbid: centered hero, Inter-only type, purple/blue radial gradient, shadcn-card grid, uniform fade-in-on-scroll, lucide icons, "Built with X" footer badge. Prevention: write a "tells to avoid" brief before any design work; start blank, not from a template — on either platform.

2. **iOS Safari PDF embedding** — `<iframe src="*.pdf">` on iOS Safari rasterizes to a single static image of page 1 and isn't scrollable. Long-standing Apple bug (iOS 8+, still present). Prevention: build-time rasterization to image gallery + "Download PDF" button. Test on a real iPhone before any piece is considered done.

3. **Cross-functional pitch diluting into "jack of all trades"** — 3–4 pieces per discipline is thin by recruiter standards; per-piece blurbs determine whether artifacts read as practitioner-level or hobby-level. Prevention: content audit before build (cut weak pieces), write Role/Outcome lines with specificity, bio takes a stance rather than listing skills.

4. **Motion overuse / scroll-jacking** — dev sees the Readymag highlight reel and ships scroll-jacking, intro animation gates, and 200KB+ of motion libraries on the splash. Prevention: motion brief naming 3–5 specific moments; ban scroll-jacking, intro gates, global smooth scroll; JS budget ≤50KB gzipped on splash; `prefers-reduced-motion` honored everywhere; Lighthouse accessibility ≥95.

5. **Platform lock-in (Framer path) / maintenance friction (code path)** — both pitfalls are real and apply to opposite paths. Framer has no HTML export; migration = rebuild. Astro with git has enough friction that a non-developer's site will stale. Prevention: decide explicitly before building, validate maintenance workflow before launch (Caleb-adds-a-piece dry run), keep source assets in a platform-independent cloud folder.

---

## Implications for Roadmap

### Phase 0: Stack Decision + Content Audit
**Rationale:** The Framer vs. Astro decision gates every subsequent phase. Content audit runs in parallel — no point building a gallery before knowing what goes in it.
**Delivers:** Confirmed platform path, domain registered, asset inventory, ruthless cut to strongest 2–3 pieces per category, notes on PDF shareability
**Decision gate:** Caleb validates his comfort with whichever maintenance workflow the chosen path requires
**Avoids:** Platform lock-in by default, empty discipline pages at launch, weak pieces undermining the cross-functional pitch

### Phase 1: Visual Direction + Design System
**Rationale:** PITFALLS.md is emphatic: anti-template constraints must be set before any code or canvas work begins. Typography and color decisions made late get baked in early and are expensive to undo.
**Delivers:** Typography pairing (display + text face), color system (primary + neutral + 4 discipline accents), motion brief (names 3–5 motion moments, explicitly bans scroll-jacking and intro gates), reference shots as constraint set, "AI-tells to avoid" checklist
**Avoids:** AI-template look, Inter-only typography, centered-hero pattern
**Research flag:** Standard design work, no research phase needed.

### Phase 2: Core Structure + Routing (Ugly But Working)
**Rationale:** Schema before pages, routing before visuals. A working ugly site is worth 10× a beautiful broken one. Validates routing assumptions before investing in visual design.
**Delivers:** All pages exist and navigate correctly — splash, 4 category galleries, piece detail, About, 404. End-to-end routing with placeholder content.
**Framer path:** Piece collection schema, category pages, detail pages — logic only, placeholder cover images
**Astro path:** `src/content/config.ts` (Zod schema), `src/lib/categories.ts`, all pages with `getStaticPaths`, 1–2 placeholder pieces per category
**Avoids:** Designing against placeholder content that breaks on real aspect ratios

### Phase 3: Asset Pipeline + Real Content
**Rationale:** PDF rasterization gates the gallery design. Content authoring (Context/Role/Outcome blurbs) is the longest-pole task and the lever that determines whether artifacts read as practitioner-level.
**Delivers:** Every piece has a rasterized cover image. All 5–15 pieces have finalized Context/Role/Outcome copy. About page copy final. Resume PDF under 1MB, EXIF-stripped.
**Framer path:** PDFs manually exported to PNG/WebP, uploaded to Framer; blurbs written in CMS
**Astro path:** `scripts/pdf-preprocess.mjs` working; all PDFs run through pipeline; `.md` files for each piece committed
**Avoids:** iOS Safari PDF embedding bug, dabbler-coded blurbs, vague Role fields
**Research flag (Astro path only):** Validate `pdfjs-dist` + `@napi-rs/canvas` rasterizes Caleb's specific PDFs correctly (mixed landscape/portrait, varying PDF versions) — 30-minute proof-of-concept before committing to the pipeline.

### Phase 4: Visual Design + Interaction Polish
**Rationale:** Depends on Phase 2 (working routes) and Phase 3 (real thumbnails). The load-bearing aesthetic work. Frontend-design skill principles apply here.
**Delivers:** Splash picker final (oversized type, asymmetric, motion on first paint), category galleries with asymmetric tile layouts and discipline accents, piece detail pages magazine-grade, View Transitions for thumbnail-to-detail navigation, per-discipline motion moments as defined in Phase 1 brief
**Avoids:** Fade-in-on-every-section, motion library bloat (≤50KB gzipped on splash), scroll-jacking, hover-only affordances that break on touch
**Research flag:** View Transitions API, GSAP magnetic effects, CSS `animation-timeline` — all standard, well-documented. No research phase needed.

### Phase 5: Mobile + Performance + Pre-Launch QA
**Rationale:** Mobile issues always surface later than expected and are cheaper to fix before a recruiter bounces.
**Delivers:** Real-device testing across iPhone Safari + Android Chrome + desktop Safari + desktop Firefox. Lighthouse mobile ≥85 performance, ≥95 accessibility. `prefers-reduced-motion` verified. OG/Twitter card metadata present. 30-second user test passed.
**Avoids:** Recruiter-attention friction, motion accessibility failures, slow first paint on 4G mobile

### Phase 6: Deploy + Handoff
**Rationale:** Custom domain + deployment is straightforward but the maintenance handoff is not. Caleb needs to add a piece end-to-end without developer help before the site is declared shipped.
**Delivers:** Site live on custom domain (`caleblim.com` or similar), Caleb successfully added a test piece end-to-end, bus-factor doc reviewed and tested, all external links verified, email contact confirmed delivering to inbox
**Avoids:** Maintenance-becomes-developer's-job-forever, stale site, platform lock-in by inertia

### Phase Ordering Rationale

- Stack decision before content audit before visual direction before routing before visuals — each phase creates a hard dependency for the next
- Content authoring (Phase 3) runs as early as possible because it's Caleb's work, not developer work, and is usually the longest pole
- PDF pipeline (Phase 3, Astro path) must precede gallery design (Phase 4) to avoid designing against wrong aspect ratios
- Mobile/QA (Phase 5) is a dedicated phase, not a post-launch footnote — PDF on iOS Safari is a known silent failure mode

### Research Flags

Needs additional research during planning:
- **Phase 3 (Astro path only):** Validate `pdfjs-dist` + `@napi-rs/canvas` against Caleb's specific PDFs. 30-minute proof-of-concept, not a full research sprint.

Standard patterns (no research phase needed):
- **Phase 2:** Astro content collections + Zod schema are well-documented and heavily used
- **Phase 4:** View Transitions API (Astro built-in), GSAP magnetic effects, CSS `animation-timeline` — all well-documented
- **Phase 6:** Cloudflare Registrar setup + Framer or Cloudflare Pages DNS — standard one-time setup

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (recommendation), MEDIUM (version pins) | Framer path verified against official pricing/docs. Astro/GSAP/Motion package renames verified. Version pins accurate as of May 2026 but drift; check at install time. |
| Features | HIGH (table stakes + anti-features), MEDIUM (motion recommendations) | Table stakes and anti-features corroborated across recruiter-facing sources. Motion feature recommendations from Awwwards 2025 SOTD analysis — not instrumented data. |
| Architecture | HIGH (routing model, content schema, build order), MEDIUM (PDF thumbnail pipeline) | Astro content collections are canonical and stable. PDF pipeline tool selection (`pdfjs-dist` + `@napi-rs/canvas`) is one of several viable approaches; picked for portability over Poppler. |
| Pitfalls | HIGH (iOS Safari PDF bug, motion accessibility, Framer lock-in), MEDIUM (cross-functional positioning) | iOS Safari bug is Apple-confirmed multi-year. Motion accessibility is WebAIM/consensus. Framer lock-in confirmed in Framer's own docs. Cross-functional positioning pitfall is industry-pattern reasoning. |

**Overall confidence:** MEDIUM-HIGH. Recommendation is clear and well-supported. Main uncertainty is Caleb's actual technical comfort level, which determines whether the stack recommendation is correct.

### Gaps to Address

- **Caleb's actual technical comfort level** — validate before stack is locked. The code path requires GitHub.dev (browser-based git editor, no terminal) + a screenshot walkthrough. Whether that clears Caleb's bar is unknown. Ask him directly, or have him attempt a test edit, before committing to either path.
- **Specific domain string** — `caleblim.com` assumed but availability unverified. Check Cloudflare Registrar before finalizing. Fallback options: `caleblim.co`, `caleb.work`, or a middle-name variant.
- **Content readiness** — Personal Projects content is explicitly undefined for v1 per PROJECT.md. If it genuinely has zero ready pieces, drop it from the splash picker at launch rather than shipping an empty room. Confirm with Caleb before roadmap is finalized.
- **PDF shareability** — some Finance slide decks may contain client data or confidential models. Confirm which pieces are actually shareable before the pipeline ingests them.

---

## Sources

### Primary (HIGH confidence)
- [Framer Pricing (official)](https://www.framer.com/pricing) — plan limits, CMS caps, domain offer
- [Framer Help — Porting your data from Framer](https://www.framer.com/help/articles/porting-your-data-from-framer/) — lock-in / no HTML export confirmed
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) — schema + getStaticPaths patterns
- [GSAP Pricing (now free)](https://gsap.com/pricing/) — all Club plugins free post-Webflow acquisition
- [Motion.dev](https://motion.dev/) — package rename from `framer-motion` to `motion`, v12 current
- [Lenis (Darkroom Engineering)](https://lenis.darkroom.engineering/) — package rename from `@studio-freight/lenis`
- [Apple Developer Forums — iOS Safari PDF iframe bug](https://developer.apple.com/forums/thread/649982) — multi-year confirmed bug
- [Webflow Accessibility Checklist — Avoid scrolljacking](https://webflow.com/accessibility/checklist/task/avoid-scrolljacking)

### Secondary (MEDIUM confidence)
- [Readymag — Award-winning portfolios analysis](https://blog.readymag.com/award-winning-portfolios/) — feature differentiator patterns
- [Awwwards SOTD portfolios 2025](https://www.awwwards.com/websites/winner_category_portfolio/) — motion/interaction patterns
- [MDN — View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) — browser coverage, fallback behavior
- [Chrome Developers — View Transitions 2025](https://developer.chrome.com/blog/view-transitions-in-2025)
- [DomainDetails — Best registrars 2026](https://domaindetails.com/kb/getting-started/best-domain-registrars-compared) — Cloudflare/Porkbun vs GoDaddy comparison
- [Smashing Magazine — Respecting Users' Motion Preferences](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/)

### Tertiary (LOW confidence)
- GoDaddy Feb 2026 ToS change — reported in registrar-comparison posts; verify directly if Caleb has an existing GoDaddy account
- Framer free domain offer (Jan 2026+) — reported widely; verify current state on framer.com/pricing before purchase

---
*Research completed: 2026-05-09*
*Ready for roadmap: yes — pending resolution of the Framer vs. Astro open question*
