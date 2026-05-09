# Caleb Lim Portfolio

## What This Is

A personal portfolio website for Caleb Lim — a cross-functional generalist targeting analyst and brand management roles. Recruiters land on a splash screen ("What do you wish to see?"), pick one of four disciplines (Graphic Design, Financial Models, Personal Projects, Marketing), and see every piece in that pile. The site itself doubles as a brand artifact — its design has to read as confident enough to back the pitch.

## Core Value

A recruiter from any of the analyst / brand / marketing / design worlds can self-select into the work that's relevant to *their* role in under a minute and walk away convinced Caleb can do that job. If the splash + first category page don't accomplish that, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Splash landing page with the prompt "What do you wish to see?" featuring Caleb's name and four category cards (Design / Finance / Personal / Marketing)
- [ ] Four discipline pages — one per category — each showing every piece in that discipline as a browseable gallery
- [ ] Piece detail page: large asset preview (image/PDF) + short context blurb structured as Context / Role / Outcome
- [ ] About / bio page — short personal intro establishing the cross-functional pitch
- [ ] Downloadable resume PDF, linked from header / about
- [ ] Contact mechanism (email link or simple form)
- [ ] Links out to LinkedIn and other relevant socials
- [ ] Bold / expressive visual identity — oversized type, strong color, playful layout (the brand-creative-with-finance-chops energy)
- [ ] **Design must NOT read as AI-generated.** No generic shadcn-card / purple-gradient / centered-hero template look. Distinctive, opinionated layouts in the Readymag and Framer reference vein — magazine-grade typography, asymmetric / non-grid composition, motion as a first-class element. Use the `frontend-design` skill's principles when implementing.
- [ ] Mobile-responsive — recruiters skim on phones
- [ ] Custom domain (TBD — to be recommended) deployed on a free or cheap host
- [ ] Initial content uploaded: 5–15 pieces total spread across the four categories

### Out of Scope

- Per-recruiter personalized share links (e.g. `/r/acme-corp`) — considered and rejected in favor of pick-on-arrival splash; simpler, no manual link curation
- Long-form case studies — Caleb wants asset + short context, not multi-section writeups per piece
- CMS / admin UI — at 5–15 static pieces, content lives in the repo and updates ship via git
- Blog / writing section — not part of the v1 pitch
- Authentication / private/gated content — everything is public to recruiters
- Internationalization — single-language (English) is sufficient
- Live interactive demos for personal projects — content not defined yet, treat as static for v1

## Context

- **Background:** Caleb has materials across four disciplines because his work history spans analyst and brand management. The portfolio is being built ahead of future job applications, not in response to a specific opening — so it needs to hold up across a range of recruiter types rather than be tuned to one role.
- **Content shape:** Materials are mostly static deliverables — slide decks for the financial models, PDFs and posters for graphic design, campaign artifacts for marketing. Personal projects content is undefined for v1 and will be filled in later. This means the site is a gallery of finished assets, not a showcase of running apps or live tools.
- **Recruiter behavior:** Hiring managers and recruiters typically spend ~30 seconds skimming a portfolio before deciding whether to dig in. The splash → category → gallery flow has to make the first relevant piece reachable in two clicks.
- **No existing domain or hosting account.** Build will include a domain recommendation and a free/cheap host pick.

## Constraints

- **Tech stack**: Must support static-file-heavy content (PDF previews, image galleries) AND high-fidelity custom layouts with motion — pure-Markdown SSGs (Hugo / Eleventy with default templates) are likely too constrained. Specific framework TBD in research; likely candidates are Next.js / Astro with Framer Motion / GSAP, or a no-code platform (Framer, Readymag, Webflow). Research should compare both paths.
- **Budget**: Hosting should be free or near-free. Domain is the only required ongoing cost.
- **Content volume**: 5–15 pieces at launch — architecture should stay light (no CMS, no DB needed).
- **Maintenance**: Caleb is not a developer — updates need to be either (a) low-friction enough for him to do himself, or (b) not needed often.
- **Skim time**: Recruiter attention budget is ~30s on the splash. The four-category picker has to be instantly scannable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Splash-on-arrival picker (no global filter) | Recruiters self-select by role; eliminates noise from disciplines they don't care about | — Pending |
| Asset + short context per piece (not full case study) | Recruiter-skimmable; doesn't require Caleb to write long-form for every piece | — Pending |
| Bold / expressive aesthetic over editorial-minimal | Site itself acts as a brand-portfolio piece; signals creative credibility for the brand-management half of the pitch | — Pending |
| Cross-functional positioning over single-track | Caleb has genuine range across analyst / brand / design / marketing — leaning into the generalist pitch rather than narrowing | — Pending |
| Static site, no CMS | At 5–15 pieces with infrequent updates, a CMS is overhead with no payoff | — Pending |
| Reject generic AI-template aesthetic; reference Readymag + Framer | Caleb is pitching brand-management roles — a generic centered-hero / shadcn-card site would actively *undermine* the pitch. Reference sites have magazine-grade typography, asymmetric layouts, and scroll-driven motion. UI implementation must use the `frontend-design` skill's principles (no purple gradients, no generic AI tropes). | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after initialization*
