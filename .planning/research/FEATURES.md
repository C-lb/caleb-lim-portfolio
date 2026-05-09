# Feature Research

**Domain:** Designer-grade personal portfolio website (analyst + brand cross-functional positioning)
**Researched:** 2026-05-09
**Confidence:** HIGH for table stakes / anti-features (heavily corroborated across recruiter-facing sources). MEDIUM for motion-feature recommendations (referenced from Awwwards 2025 SOTD winners and Readymag/Framer ecosystem guidance, not from instrumented data).

---

## Positioning Frame

This isn't a UX-designer portfolio (where reviewers want process artifacts and usability rationale) and it isn't an engineer portfolio (where reviewers want shipped code links and stack tags). It's a **brand+analyst hybrid recruiter funnel**. Two reviewer archetypes have to be satisfied within ~30 seconds:

- **Brand / marketing recruiter:** wants to see craft, taste, range, and that the candidate can hold a creative concept end-to-end. They are forgiving about copy length but unforgiving about visual identity.
- **Analyst / finance recruiter:** wants to see legible deliverables (decks, models), evidence of quantitative work, and that the candidate is not "just" a designer. They are forgiving about visual flourish but unforgiving if they can't tell what the work *was*.

Every feature decision below is graded against both archetypes. The site has to feel like a brand artifact (to satisfy archetype 1) without burying what the work actually was (which would lose archetype 2).

---

## Feature Landscape

### Table Stakes (Recruiters bounce if missing)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Splash with the four-category picker | This is the project's distinguishing UX premise. "What do you wish to see?" + 4 cards is the *whole* router for cold visitors. | LOW | Must be parseable in <5s. Card hover or short reveal animation OK. Don't gate it behind an "Enter site" splash *before* the picker — that's two splashes back-to-back. |
| One discipline page per category, all pieces shown | A picker that leads to a near-empty page kills the pitch. Even with 1–4 pieces per category, layout has to feel deliberate, not sparse. | LOW–MED | At low volume, a "magazine spread" layout (varied tile sizes, mix of image+caption) reads better than a uniform grid. |
| Per-piece detail page with large asset preview + Context/Role/Outcome | Recruiters need to know what they're looking at within seconds. Without "Role" they assume generalist = nothing was actually owned. Without "Outcome" the analyst recruiter has nothing to grade. | MED | Keep blurb to 3–6 lines per block. Asset is hero; copy is support. |
| Resume PDF download | Every recruiter's mental model. Missing = friction = bounce. Standard advice: header link, not buried in footer. ([copyfol.io](https://blog.copyfol.io/portfolio-website-resume), [enhancv.com](https://enhancv.com/blog/portfolio-on-resume/)) | LOW | Static asset link. No gating, no email capture. See anti-features. |
| Contact mechanism that works on mobile | Recruiter is on a phone between meetings. Tap-to-email or tap-to-Calendly. Form is also fine but adds maintenance. | LOW | See contact pattern decision below. |
| LinkedIn link in header or footer | Universal recruiter cross-reference. Missing this looks evasive. | LOW | Outbound icon link. Don't put a full social bar — just the relevant ones. |
| Mobile-responsive everything | ~50%+ of first portfolio views happen on phone. Mobile breakage on a *design* portfolio reads as a craft failure, not a tech one. ([Dribbble](https://dribbble.com/resources/career/junior-ux-designer-portfolio)) | MED | On mobile, hover-driven reveals must convert to scroll-driven or always-visible. |
| Short About / bio with the cross-functional pitch | The whole site only makes sense once a recruiter clocks "this person is intentionally hybrid, not unfocused." About page is where that frame gets installed. | LOW | 80–150 words. First-person. Personal hook + credibility + what you solve. ([format.com](https://www.format.com/magazine/resources/photography/online-portfolio-about-page-step-by-step-guide), [uxpin.com](https://www.uxpin.com/studio/blog/ux-designer-bio-examples/)) |
| Strong, distinctive type system | The single biggest "is this AI-generated?" tell. Default Inter at default sizes = template smell. Recruiter pattern-matches in 2 seconds. | LOW (decision)<br>MED (execution) | Pair an editorial display face (e.g. a serif or grotesk display) with a clean text face. Oversized headline scale (clamp() up to 8–14vw). |
| Fast first paint | If splash takes >2s on a recruiter's hotel wifi, the pitch dies on the runway. | MED | Static export, lazy-load below-the-fold imagery, prefetch on hover for category cards. |
| Page-not-found page that's on-brand | Free brand hit. Cheap to do well, looks lazy when missing. | LOW | One sentence, on-brand type, link home. |

### Differentiators (What makes top portfolios memorable)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **View Transitions API for piece-card → piece-detail** | The signature interaction in 2025 award sites: clicking a thumbnail morphs it into the hero image of the detail page rather than a hard nav. Reads as "shipped by someone with taste" without writing a single bespoke animation. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API), [Chrome Developers, 2025 update](https://developer.chrome.com/blog/view-transitions-in-2025)) | LOW–MED | Browser-native. ~85% browser coverage in 2025. Falls back gracefully to hard nav. Works for both SPA (Next.js) and MPA (Astro). |
| **Scroll-driven reveal for piece detail content** | On the detail page, asset + Context/Role/Outcome blurbs reveal in sequence as the visitor scrolls — not floating-in confetti, just a paced unfurl. Top Awwwards 2025 portfolios use this almost universally. ([Readymag blog](https://blog.readymag.com/award-winning-portfolios/)) | MED | CSS `animation-timeline: view()` is now native. Falls back to nothing. Use 8–24px translate distances; longer is gimmicky. |
| **Asymmetric / non-grid composition on category pages** | The fastest visual shortcut to "this isn't a Squarespace template." Mixed tile sizes, intentional negative space, broken alignment. Aligns with the editorial-magazine reference (Readymag aesthetic). | MED | CSS Grid `grid-template-areas` per breakpoint, or a manually-laid-out `position: absolute` composition for desktop and a stack on mobile. |
| **Custom cursor on desktop** | Used by ~every Awwwards SOTD portfolio in 2025. Even subtle (small dot follower with a hover-scale on links) signals craft. ([Framer Velocity Cursor component](https://www.framer.com/marketplace/components/velocity-cursor/)) | LOW | Disable on touch. Disable for `prefers-reduced-motion`. Don't replace the cursor with a giant blob — readability matters. |
| **Per-discipline accent palette** | Each of the four categories carries its own accent color. Reinforces the picker as a real navigation, not decoration. Also helps the analyst recruiter who comes for Finance not feel like they walked into a graphic design site by mistake. | LOW | One token swap per category. Pulled through to the piece-detail header so context is preserved. |
| **PDF preview rendered as in-page image, not embedded viewer** | A native iframe PDF viewer is ugly, slow, and breaks on mobile. Top portfolios pre-render page 1 (or a curated spread) to a high-quality PNG/WebP, show that as the hero, and link "Open full PDF" for those who want it. ([commoninja.com](https://www.commoninja.com/blog/creative-ways-to-present-your-pdf-content-on-websites)) | MED | At build time, render PDFs to images via `pdfjs` or `pdf-poppler`. Cache. Saves ~5s of perceived load vs embedded viewer. |
| **"Outcome" surfaced as a tagline on the gallery card** | On the Finance gallery especially, showing a one-line outcome ("Reduced WACC modeling cycle from 3d → 4h") on the card itself does more for the analyst recruiter than any in-piece copy. | LOW | Card = thumbnail + title + one outcome line. |
| **Magnetic / hover-deflection on the four category cards** | The picker is the most-interacted element on the site. Cards that subtly lean toward the cursor read as alive without being twee. | LOW | GSAP or a 20-line vanilla JS magnetic effect. |
| **A "tour" / "shuffle" easter egg** | One link in the footer like "I trust your judgement → show me everything" that pulls a curated 6-piece sample across all four disciplines. Catches the recruiter who doesn't know what bucket they're hiring for. | LOW | Static curated list, no shuffling logic needed. |
| **Smooth scroll only where it earns its keep** | Lenis/Locomotive-style smooth scroll on detail pages where scroll-driven reveals are timed; native scroll on gallery pages where users want to scan fast. | LOW | Don't apply globally — global smooth scroll on gallery pages frustrates skim-readers. |

### Anti-Features (Deliberately do NOT build)

| Feature | Why Requested / Surface Appeal | Why Problematic | Alternative |
|---------|-------------------------------|-----------------|-------------|
| **"Skill bars" with percentages (Photoshop 87%, Excel 92%)** | Looks "complete" on a portfolio. Easy to drag into any template. | Universal AI-template tell. Every "make me a portfolio" generator outputs them. They're also meaningless — nobody is 87% at Photoshop. Reads as junior. ([Dribbble guide on portfolio mistakes](https://dribbble.com/resources/career/junior-ux-designer-portfolio)) | A short, plain-text "tools" line on the About page. Or just don't list tools — show the work. |
| **Testimonial slider / carousel** | Feels like social proof. | Engagement data is brutal: most users see slide 1 and scroll. Sliders also scream "WordPress widget." ([Sumy Designs](https://www.sumydesigns.com/testimonial-slider/)) | If a testimonial earns a place at all, embed *one*, in-line, near the relevant piece. Otherwise omit. |
| **Generic centered hero with gradient + CTA button** | Default of every starter template. | The single strongest "AI-generated" signal. Purple gradient + centered headline + rounded-square CTA = instant disqualification for a brand-creative pitch. | The splash *is* the hero. Asymmetric, type-led, no gradient. |
| **shadcn-card grid for the gallery** | Default aesthetic of every Next.js starter from 2024–2025. | Recruiters from creative shops have seen 200 of these. Reads as "developer pretending to design." | Asymmetric editorial composition. Mixed tile sizes. Real typography hierarchy. |
| **Generic blog with two posts that haven't been updated in 18 months** | "Thought leadership" instinct. | A stale blog actively damages credibility. It signals "started a thing, abandoned it." Already Out of Scope per PROJECT.md, but worth restating: a blog is only worth shipping if there is a publishing cadence. | Skip entirely for v1. If writing matters later, ship a `/writing` page with external links to where the writing already lives (Medium, Substack, LinkedIn articles). |
| **Long-form case studies with research/process/wireframes** | Standard advice for UX portfolios. | Wrong audience. The brand+analyst recruiter wants the artifact and the outcome — not the journey. Already Out of Scope per PROJECT.md. Reaffirmed by the research: "too visual-heavy with no story" is one failure mode, but the matching failure mode is "too much story, no work." For static deliverables, the artifact carries the story. | Context / Role / Outcome blurb is the right size. Three to six lines per block. |
| **"Hire Me" CTA in big type on the homepage** | Common on freelance portfolios. | Caleb is targeting full-time roles, not contracts. "Hire me" reads desperate and freelance-y. ([copyfol.io](https://blog.copyfol.io/portfolio-website-resume) — there's even a referenced GitHub thread on whether to do "Download CV" or "Hire Me," and the consensus is "neither, just make contact obvious") | Subtle "Get in touch" link in the header/footer. Resume download is a separate affordance. |
| **Email-gated resume download** | "Capture leads" instinct. | A recruiter spending 30 seconds on a portfolio will *not* fill in an email form to download a CV. They will leave. This is a 100% conversion-killer for the only conversion that matters. | Direct PDF link. No gating. |
| **Splash before the splash ("intro animation, click to enter")** | Tempting because cinematic intros are part of the Awwwards-y aesthetic. | Adds a click before the actual decision-making splash. Two splashes = recruiter bounces or assumes the site is broken. | The four-category picker *is* the splash. Make the picker itself feel cinematic (motion on first paint, oversized type), not a precursor to one. |
| **Cookie banner for a static portfolio with no analytics** | Reflexive add. | Looks legalistic on a personal site. If you don't run third-party trackers (and v1 shouldn't), there's nothing to consent to. | If you must add analytics, use a privacy-first option (Plausible, Fathom, or Vercel Analytics) which is consent-exempt under GDPR/ePrivacy interpretations and skip the banner. |
| **Dark mode toggle** | "Polish" instinct. | Zero recruiter ever bounced because a portfolio was missing dark mode. Maintaining two color palettes that *both* look intentional doubles the visual design work for no recruiter-facing value. | Pick one mode. Commit to it. The bold/expressive direction in PROJECT.md actually argues *against* dark mode default — bold color over high-contrast neutrals reads better in light. |
| **Auto-playing background video / hero reel** | "Cinematic" instinct. | Bandwidth hit, accessibility hit, mobile battery hit. Most browsers block autoplay-with-audio anyway. | Static or scroll-revealed hero. If video matters for one piece, autoplay it muted *on its own piece page* with a poster fallback. |
| **AI chat widget ("Ask my portfolio anything!")** | 2024–2025 hype trend. | Reads as gimmicky. Recruiters want to read the work, not interrogate a bot about it. Maintenance liability if it hallucinates. | Don't. |
| **Site-wide custom font that costs $$ per pageview** | "Premium" instinct. | Adobe Fonts / Monotype web licenses can blow past free tiers fast. | Use a self-hosted variable font (Pangram, Pangram Pangram free fonts, Google Fonts variable, or a single licensed file you've paid for). |
| **Newsletter signup** | "Build an audience" instinct. | Nothing on a job-seeking portfolio benefits from a newsletter. | Skip. |
| **Generic "What I do" tri-column ("Design / Develop / Strategize")** | Every consultant template ever. | Reads as filler and the icons are universally bad. | The four-category picker already answers "what I do" with actual artifacts. |

---

## Specific Pattern Decisions

### Splash / category picker pattern

**Recommendation:** Single splash. Name + tagline + the question + four cards, all on one screen. No "click to enter." No pre-splash animation that the user has to dismiss.

**Rationale:** Top 2025 portfolios that use a category-picker pattern (a minority — most go single-page-scroll) treat it as the actual landing, not an interstitial. Roman Jean-Elie's *Portfolio '25* and similar Awwwards SOTD winners ([awwwards.com](https://www.awwwards.com/sites/portfolio-25-1)) use a strong typographic landing where the navigation choice *is* the hero. Two-step splashes lost favor around 2018 and now read dated.

**Concrete shape:**
- Above the fold on desktop: name (oversized, anchor) + sub-line ("designer / analyst / generalist" or whatever Caleb lands on) + the prompt + four cards.
- Cards labeled with category name + tiny piece-count indicator (e.g. "Graphic Design — 6 pieces"). The piece count signals the gallery is real, not a placeholder.
- On mobile: prompt + stacked cards. Skip the oversized name treatment if it pushes cards below the fold.

### Resume download pattern

**Recommendation:** Header link visible on every page ("Resume" or "CV ↓"). Direct PDF link. No email gate. Filename `caleb-lim-resume.pdf` (recruiters save it; the filename matters).

**Rationale:** Recruiter sources are unanimous — header placement, not footer. ([copyfol.io](https://blog.copyfol.io/portfolio-website-resume), [enhancv.com](https://enhancv.com/blog/portfolio-on-resume/)) Email-gating is a hard no for a job-seeking portfolio (different from a freelance lead-gen site).

**Detail:** Also link the resume from the About page. Two affordances, one source-of-truth file.

### Contact pattern

**Recommendation:** Plain `mailto:` link in header + a slightly larger contact block on the About page with email + LinkedIn + (optional) Calendly link. **No contact form for v1.**

**Rationale:**
- A form requires a backend (Formspree / Web3Forms / Netlify Forms) which adds a dependency for ~zero recruiter-facing benefit. Recruiters who want to reach out either email or LinkedIn-message — they don't fill out forms on candidate portfolios.
- Mailto works on mobile, desktop, and copies to clipboard via right-click. Spam risk on a low-traffic personal site is negligible; if it materializes, swap in a form later.
- Calendly is a useful *secondary* affordance for "if it's easier, grab time directly" — but only if Caleb actually wants to take cold calls. If not, skip it.

### Per-piece detail page pattern

**Recommendation:** One page per piece. Hero asset (rendered image, not embedded PDF). Below the hero: three tight blocks — Context (what was the brief / problem), Role (what Caleb specifically did), Outcome (what shipped or what changed). Optional: 2–4 secondary images / detail shots / additional spreads. Footer of the page: prev/next within the same category, plus "Back to [Category]".

**Rationale:** Three to six lines per block is the recruiter-skimmable sweet spot. The Role block is non-negotiable for the cross-functional pitch — without it, a brand recruiter assumes Caleb only designs and an analyst recruiter assumes he only analyzes.

**For the static deliverable types:**
- **Slide decks (Finance):** Render 3–6 representative slides as a vertical sequence below the hero. Linking the full deck as PDF is optional and depends on whether the deck is sharable.
- **Posters / single-asset graphic design:** Hero is the asset at high res. Maybe one detail crop. Done.
- **Multi-page PDFs:** Hero is the cover. Two or three interior spreads as image renders. "Open full PDF" link.
- **Marketing campaigns:** Hero is the lead asset (the campaign hero image). Below: a row of supporting executions (social, OOH, etc.) at smaller size.

### Motion / interaction stack

**Recommendation:** Use the View Transitions API + CSS `animation-timeline` as the spine. Layer in GSAP only where bespoke motion needs frame-perfect timing (custom cursor, magnetic cards, hero scroll sequences if any).

**Rationale:**
- **View Transitions API** is browser-native, ~85% supported as of 2025, falls back gracefully, and is what gives the "click thumbnail → it morphs into the next page's hero" effect without a SPA. ([Chrome Developers, 2025 update](https://developer.chrome.com/blog/view-transitions-in-2025)) That's the single most-impressive interaction a portfolio can ship for the cost.
- **CSS scroll-driven animations** (`animation-timeline: view()`) handle 80% of reveal-on-scroll work natively. No JS, no library bundle.
- **GSAP** is still the right tool for ScrollTrigger-pinned sequences and the custom cursor. ([codolve.com on GSAP vs Framer Motion](https://codolve.com/blog/gsap-vs-framer-motion))
- **Framer Motion / Motion** ([motion.dev](https://motion.dev/)) is fine if the stack ends up being React/Next, but for a 5–15 piece static portfolio with mostly CSS-doable motion, it's overkill bundle. Skip unless React component animations specifically need it.
- Honor `prefers-reduced-motion` everywhere. This is a one-line CSS guard and not negotiable.

---

## Feature Dependencies

```
Splash picker
    ├── requires ──> Per-discipline accent palette (so cards have differentiable identity)
    └── requires ──> 4 discipline pages exist (even if 1 piece each at launch)

Discipline page
    └── requires ──> Per-piece detail page (each card needs a destination)

Per-piece detail page
    ├── requires ──> Asset rendered as image (not iframe PDF for hero)
    └── requires ──> Context / Role / Outcome content for every piece

View Transitions
    └── enhances ──> Splash → discipline page navigation
    └── enhances ──> Discipline → piece detail navigation
    └── degrades gracefully ──> regular nav on unsupported browsers

Custom cursor + magnetic cards
    └── enhances ──> Splash picker (the most-touched element)
    └── conflicts ──> mobile/touch (must disable)
    └── conflicts ──> prefers-reduced-motion (must disable)

Resume PDF
    ├── linked from ──> Header (every page)
    └── linked from ──> About page

Contact (mailto)
    ├── linked from ──> Header (every page)
    └── linked from ──> About page

About page
    └── carries ──> Cross-functional pitch (the frame that makes the four-category split coherent)
```

### Dependency notes

- **Discipline pages must exist with at least one piece each at launch.** A picker that leads to "Coming soon" kills the pitch entirely. Per PROJECT.md the launch volume is 5–15 pieces — distribute so no category has zero. If one category genuinely has zero ready, drop the category from the picker for v1; don't ship an empty room.
- **Asset rendering pipeline (PDF → image) is the highest-risk technical piece.** It can't be deferred because it gates how every Finance and Design piece presents. Worth front-loading.
- **Per-piece content (Context / Role / Outcome) is the highest-risk *content* piece.** Caleb has the assets; he probably hasn't written the blurbs. The roadmap should treat content authoring as its own work item, not a footnote.

---

## MVP Definition

### Launch with (v1)

- [ ] Splash with the four-category picker — the actual product hypothesis lives here
- [ ] Four discipline pages, each with at least one piece
- [ ] Per-piece detail pages with rendered hero + Context / Role / Outcome
- [ ] About page (80–150 words, first-person, cross-functional hook)
- [ ] Resume PDF linked from header
- [ ] Mailto link + LinkedIn link in header/footer
- [ ] Mobile-responsive across all of the above
- [ ] Distinctive type system (display + text pairing, oversized headline scale)
- [ ] Per-discipline accent color
- [ ] Asymmetric category page composition (not a uniform grid)
- [ ] 404 page on-brand

### Add after validation (v1.x)

- [ ] View Transitions API for thumbnail → detail navigation — adds the "wow" but isn't strictly required for the core funnel to work
- [ ] Custom cursor — desktop polish; defer if it pushes launch
- [ ] Scroll-driven reveals on detail pages
- [ ] Magnetic effect on category cards
- [ ] "Outcome" tagline on Finance gallery cards (requires Caleb to write succinct outcome copy for each piece)
- [ ] "Show me everything" curated tour link

### Future consideration (v2+)

- [ ] Calendly embed (only if Caleb actually wants inbound calls)
- [ ] Per-piece secondary images / detail shots / additional spreads (content-volume dependent)
- [ ] Privacy-first analytics (Plausible / Fathom) once there's signal worth measuring
- [ ] OG image generation per piece (improves LinkedIn share fidelity if pieces start being shared)
- [ ] More pieces (target 15+ across the four categories)

### Explicitly out (do not build, ever, on this site)

- Skill bars / percentage charts
- Testimonial slider
- Centered-hero-with-gradient
- Generic shadcn-card grid
- Stale blog
- Long-form case studies
- "Hire Me" CTA
- Email-gated resume
- Pre-splash intro animation
- Cookie banner without trackers
- Dark mode toggle
- Autoplay video hero
- AI chat widget
- Newsletter signup
- "What I do" tri-column

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|-----------|---------------------|----------|
| Four-category splash picker | HIGH | LOW | P1 |
| Discipline pages | HIGH | LOW | P1 |
| Per-piece detail with Context/Role/Outcome | HIGH | MED (content authoring) | P1 |
| Resume PDF + header link | HIGH | LOW | P1 |
| Mailto + LinkedIn | HIGH | LOW | P1 |
| Mobile responsive | HIGH | MED | P1 |
| About page with cross-functional hook | HIGH | LOW (writing-bound) | P1 |
| Distinctive type system | HIGH | LOW (decision)/MED (execution) | P1 |
| Asymmetric gallery composition | HIGH | MED | P1 |
| Per-discipline accent color | MED | LOW | P1 |
| PDF → image render pipeline | HIGH | MED | P1 |
| View Transitions API | MED | LOW–MED | P2 |
| Scroll-driven reveals on detail pages | MED | LOW | P2 |
| Custom cursor (desktop only) | LOW–MED | LOW | P2 |
| Magnetic category cards | LOW | LOW | P2 |
| "Outcome" tagline on Finance cards | MED | LOW | P2 |
| "Show me everything" tour | LOW | LOW | P2 |
| Calendly embed | LOW (depends on Caleb's preference) | LOW | P3 |
| Privacy-first analytics | LOW | LOW | P3 |
| OG image per piece | LOW | MED | P3 |

---

## Competitor Feature Analysis

| Feature | Awwwards SOTD portfolios (2025, e.g. Cyd Stumpel, Roman Jean-Elie) | Framer template portfolios (e.g. Fuel, Palmer) | Our approach |
|---------|----------------|------------|--------------|
| Landing pattern | Strong typographic landing, often single page with anchor scroll to sections | Multi-section single-page scroll with hero + work + about + contact | **Four-category picker as landing** — a deliberate inversion. The site routes by recruiter intent, not by section. |
| Case study depth | Full-page case studies with hero + writeup + multiple images | Templated 2–3-section detail pages | **Asset-first short detail page** — Context/Role/Outcome blurb only. Skim-optimized. |
| Motion stack | GSAP + ScrollTrigger + sometimes Three.js + custom cursor | Framer's built-in scroll/animation primitives | **Native CSS (View Transitions + animation-timeline) + GSAP only where needed.** Cheaper bundle, future-proof. |
| Contact | Embedded form or "let's talk" CTA → Calendly | Templated contact page with form | **Mailto + LinkedIn.** Form is needless complexity for a portfolio audience that doesn't fill out forms. |
| Resume | Often missing (designers de-emphasize CV in favor of "let's chat") | Sometimes a "download CV" button | **Always-visible header link, direct PDF.** Analyst recruiters expect it; brand recruiters won't penalize it. |
| Aesthetic | Editorial, asymmetric, magazine-grade typography | Polished but recognizably templated | **Editorial + bold color** — leans Readymag rather than Framer. |

---

## Sources

- [Readymag — Award-winning portfolios analysis](https://blog.readymag.com/award-winning-portfolios/)
- [Readymag — Best websites of 2025](https://blog.readymag.com/websites-of-the-year-2025/)
- [Readymag — Mobile web design examples](https://blog.readymag.com/mobile-web-design-with-readymag/)
- [Readymag — 8 design portfolio examples](https://blog.readymag.com/design-portfolio-examples-for-inspiration/)
- [Awwwards — Cyd Stumpel Portfolio 2025 SOTD](https://www.awwwards.com/sites/cyd-stumpel-portfolio-2025)
- [Awwwards — Portfolio '25 by Roman Jean-Elie SOTD](https://www.awwwards.com/sites/portfolio-25-1)
- [Awwwards — Best portfolio websites](https://www.awwwards.com/websites/winner_category_portfolio/)
- [Framer — Splash page templates category](https://www.framer.com/templates/category/splash-page/)
- [MDN — View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Chrome Developers — What's new in view transitions 2025](https://developer.chrome.com/blog/view-transitions-in-2025)
- [Codolve — GSAP vs Framer Motion 2026](https://codolve.com/blog/gsap-vs-framer-motion)
- [Motion.dev — animation library](https://motion.dev/)
- [Framer Marketplace — Velocity Cursor component](https://www.framer.com/marketplace/components/velocity-cursor/)
- [Copyfolio — How to add resume to portfolio](https://blog.copyfol.io/portfolio-website-resume)
- [Enhancv — Including portfolio link on resume](https://enhancv.com/blog/portfolio-on-resume/)
- [Format — Writing the about page](https://www.format.com/magazine/resources/photography/online-portfolio-about-page-step-by-step-guide)
- [UXPin — UX designer bio examples](https://www.uxpin.com/studio/blog/ux-designer-bio-examples/)
- [Sumy Designs — Don't hide testimonials in a slider](https://www.sumydesigns.com/testimonial-slider/)
- [Dribbble — 15 UX portfolio mistakes](https://dribbble.com/resources/career/junior-ux-designer-portfolio)
- [UX Planet — Portfolio case study template](https://uxplanet.org/ux-portfolio-case-study-template-plus-examples-from-successful-hires-86d5b0faa2d6)
- [Toptal — Case study portfolios](https://www.toptal.com/designers/ui/case-study-portfolio)
- [Common Ninja — Creative ways to present PDFs on websites](https://www.commoninja.com/blog/creative-ways-to-present-your-pdf-content-on-websites)
- [Noble Desktop — Financial analyst portfolio guide](https://www.nobledesktop.com/careers/financial-analyst/portfolio-tips)
- [Design Shack — Portfolio contact form solutions](https://designshack.net/articles/business-articles/what-to-do-with-your-portfolios-contact-form-3-popular-solutions/)

---
*Feature research for: Designer-grade personal portfolio (analyst + brand cross-functional)*
*Researched: 2026-05-09*
