# Caleb Lim Portfolio

## What This Is

A personal portfolio website for Caleb Lim — a cross-functional generalist targeting analyst and brand management roles. Recruiters land on a splash screen ("What do you wish to see?"), pick one of four disciplines (Graphic Design, Financial Models, Personal Projects, Marketing), and see every piece in that pile. The site itself doubles as a brand artifact — its design has to read as confident enough to back the pitch.

## Core Value

A recruiter from any of the analyst / brand / marketing / design worlds can self-select into the work that's relevant to *their* role in under a minute and walk away convinced Caleb can do that job. If the splash + first category page don't accomplish that, nothing else matters.

## Requirements

### Validated

- [x] Splash landing page with the prompt "What do you wish to see?" featuring Caleb's name and four category cards (Design / Finance / Personal / Marketing) — Phase 1
- [x] Four discipline pages — one per category — each showing every piece in that discipline as a browseable gallery — Phase 1; Personal renders empty-state per D-11
- [x] Piece detail page: large asset preview (image/PDF) + short context blurb structured as Context / Role / Outcome — Phase 1 + Phase 2 (paginated PDF render + Open full PDF link)
- [x] About / bio page — short personal intro establishing the cross-functional pitch — Phase 2 (122-word first-person bio)
- [x] Downloadable resume PDF — Phase 2 (`public/caleb-lim-resume.pdf`, 193 KB, all metadata stripped; header link is Phase 4)

### Active
- [ ] Contact mechanism (email link or simple form)
- [ ] Links out to LinkedIn and other relevant socials
- [ ] Bold / expressive visual identity — oversized type, strong color, playful layout (the brand-creative-with-finance-chops energy)
- [ ] **Design must NOT read as AI-generated.** No generic shadcn-card / purple-gradient / centered-hero template look. Distinctive, opinionated layouts in the Readymag and Framer reference vein — magazine-grade typography, asymmetric / non-grid composition, motion as a first-class element. Use the `frontend-design` skill's principles when implementing.
- [ ] Mobile-responsive — recruiters skim on phones
- [ ] Custom domain (TBD — to be recommended) deployed on a free or cheap host
- [ ] Initial content uploaded: 5–15 pieces total spread across the four categories — Phase 2 shipped 2 non-draft pieces (PVL design + marketing); finance flipped to `draft: true` per Caleb's call; remaining 3+ pieces backfill via FUTURE-06

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
- **No existing domain or hosting account.** Target domain is `caleblim.com` (subject to availability check at deploy time via Cloudflare Registrar). Hosting on Cloudflare Pages.
- **Content shareability:** All planned pieces are public / Caleb's to share — no NDA redaction needed.
- **Per-category content asymmetry:** Strong on Graphic Design + Marketing, thinner on Financial Models, Personal Projects undefined. All four splash cards still appear, but the gallery layout for Finance / Personal must hold up with as few as 1–3 pieces (no "thin gallery looks like a placeholder" failure mode).

## Constraints

- **Tech stack**: **Astro** with content collections (markdown + Zod schema), build-time PDF rasterization via `pdfjs-dist` + `@napi-rs/canvas`, motion via `motion` (formerly framer-motion) v12 and selective GSAP. Deployed to **Cloudflare Pages** (free tier, unlimited bandwidth). Domain via **Cloudflare Registrar** (~$10/yr). Decided after research surfaced a Framer-vs-Astro fork; owner is comfortable enough with markdown + git that no-code platform's main value disappeared, and Astro avoids the platform-lock-in pitfall.
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
| Astro (code) over Framer (no-code) | Caleb is comfortable with markdown + git, removing Framer's main draw (visual editor for non-coders). Astro avoids platform lock-in (no HTML export from Framer), gets $0 hosting on Cloudflare Pages, and has a cleaner build-time PDF rasterization pipeline. Both platforms can hit the same visual ceiling. | — Pending |
| Pause to sketch visual directions before requirements lock | Caleb wants to see 2–3 throwaway HTML mockups of splash + category page before committing to a roadmap. Visual direction is load-bearing for the brand pitch and shouldn't be deferred entirely to the UI phase. | — Pending |

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
*Last updated: 2026-05-11 after Phase 2 (asset-pipeline-real-content) completion via gap closure. Pipeline productionized: `scripts/pdf-preprocess.mjs` rasterizes source PDFs at build time → `cover.webp` + paginated `page-N.webp` + `.cache.json`; About page + 193 KB EXIF-stripped resume live; piece detail template renders paginated `<img>` sequence + Open full PDF link. Two real PVL pieces shipped (design with full PDF pipeline exercised; marketing image-only); finance flipped to `draft: true` per scope deferral. 13 smoke gates green. SC2 (5-15 pieces) and the bold/expressive visual identity requirement remain Active — Phase 3 (visual-design-system) carries the latter.*
