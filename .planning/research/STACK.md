# Stack Research

**Domain:** Personal portfolio site, design-led, non-developer owner, 5–15 static asset pieces
**Researched:** 2026-05-09
**Confidence:** HIGH (recommendation), MEDIUM (specific version pins — verify at build time)

---

## TL;DR — The Recommendation

**Build it in Framer. Pay $10/mo (Basic). Buy the domain at Cloudflare Registrar.**

Caleb is not a developer. The site has 5–15 pieces and will update infrequently — but it *will* update (new role, new piece, tweaked copy), and every update needs to be friction-free or the site stales. A code-built Next.js / Astro stack gives a marginally higher design ceiling and more raw control, but the cost is that every content change routes through git + npm + a deploy. For a brand-management portfolio whose entire pitch is "I am the operator who ships," shipping a site you can't update yourself is the wrong artifact.

Framer's design ceiling is high enough that Readymag/Framer-tier work is routinely produced on it (the platform is literally one of the two reference points). The "AI-generated tell" — purple gradients, centered hero, shadcn cards, Inter on slate-50 — comes from *templates and defaults*, not from the platform itself. A blank Framer canvas with deliberate typography, asymmetric composition, and motion is indistinguishable from a hand-coded site to recruiter eyes. The risk to design fidelity is template-pick discipline, not platform ceiling.

The code-built path is documented below as a fallback — if Caleb later partners with a developer, or if Framer's constraints bite, Astro 5 + Motion + GSAP + Lenis on Cloudflare Pages is the recommended escape hatch.

---

## Primary Path: Framer (no-code, recommended)

### Plan & Cost

| Item | Choice | Cost | Notes |
|------|--------|------|-------|
| Framer plan | **Basic, billed annually** | ~$10/mo ($120/yr) | Required for custom domain. Free plan forces a `*.framer.website` subdomain + a "Made in Framer" banner — both undermine the brand-credibility pitch. |
| Custom domain | **Cloudflare Registrar** | ~$10.46/yr (.com, at-cost) | At-cost pricing, no upsells, no renewal hike. Framer connects to it via DNS records. |
| Total Y1 | | **~$130** | |
| Total Y2+ | | **~$130/yr** | |

The Basic plan covers 30 pages, 1 CMS collection, 10 GB bandwidth/mo, 1 free `.com` on annual billing. At 5–15 pieces, none of these limits bite. As of January 2026 Framer also includes the first year of a `.com` domain on annual Basic — meaning Y1 can effectively be ~$120 if you take Framer's domain and skip Cloudflare. The Cloudflare-Registrar route is recommended anyway because it gives Caleb full DNS control independent of Framer (portability if he ever migrates).

### Why Framer for this project

| Constraint | How Framer satisfies it |
|------------|-------------------------|
| Non-dev owner edits content himself | Visual editor. New piece = drag asset onto a category page, type the Context/Role/Outcome blurb, hit publish. No git, no CLI, no build step. |
| Readymag/Framer-grade design fidelity | Free-form canvas (not a grid template), real typography controls (any Google Font + custom uploads), Motion (formerly Framer Motion) baked in for scroll/hover/page transitions. The reference aesthetic is the platform's home turf. |
| 5–15 static pieces | Well under page/CMS-item caps on Basic. CMS not strictly needed at this size — could be hand-laid pages — but using one collection for "Pieces" with category/role/outcome fields makes adding new work a 30-second job. |
| Free or near-free | $130/yr all-in is at the low end for any serious portfolio. |
| Mobile-responsive | Framer's "breakpoints" model is per-canvas-size, not auto-derived — meaning Caleb (or whoever designs it) actually controls the mobile composition rather than letting bootstrap-style auto-stacking produce a bland phone layout. |
| Fast iteration on the splash | Splash is the highest-stakes screen (recruiter has ~30s). Visual editing means iterating on type scale, color, layout takes minutes, not deploy cycles. |

### Motion capabilities (built-in, no extra tooling)

Framer ships with **Motion** (the open-source library formerly called Framer Motion, renamed to Motion in mid-2025, now at v12 as of early 2026) as its native animation engine. From the visual editor you get scroll-driven animations, page transitions, hover/click micro-interactions, and timeline-style sequencing without writing JS. For anything Motion can't do, Framer also exposes a "Code Components" escape hatch (React) — but the reference aesthetic Caleb wants is comfortably inside what the visual layer covers.

### PDF and slide-deck handling (this is core content)

This is the one place Framer needs care, because PDFs aren't a first-class type — you have to choose how to present them.

**Recommended pattern:** **export each PDF / deck as a high-res cover image (PNG or WebP) for the gallery and detail page, and host the actual PDF as a downloadable link.** Reasons:

1. Inline PDF viewers (Framer's iframe component pointed at a PDF, or third-party embeds) render slowly, look stock, and break on mobile Safari.
2. A recruiter scanning a 30-second portfolio wants the *cover frame* — the visual hook — not a paginated reader. They'll click "Download" or "Open PDF" if they want to read it.
3. A custom cover image is also where the bold typography lives — it's part of the brand artifact.

**For multi-page slide decks specifically:** export 2–4 hero slides as images, stack them on the detail page (asymmetric, oversized), and link to the full deck. This treats decks like an editor would — pull pull-quotes, not a reader-pane.

**If Caleb insists on inline PDF previews later:** Speaker Deck (free, no ads, clean embeds) is the cleanest external host. Issuu is overkill and visually dated. Avoid PDF.js iframes on Framer.

### What NOT to do on Framer

| Avoid | Why |
|-------|-----|
| Picking a template from the marketplace and editing it | This is the single biggest "AI-generated tell" risk. Templates have shared DNA; recruiters who see portfolios all day spot them instantly. **Start blank.** |
| Default Framer fonts (Inter, system stack) on the splash | Same generic-tech-startup tell. Pair an editorial display face (Söhne, GT America, PP Editorial New, or a free alternative like Instrument Serif / Tasa Orbiter) with a clean grotesk for body. The splash and category headers are where typography earns its keep. |
| Auto-generated CMS layouts | Framer's "auto-grid" CMS list looks like every other Framer site. Use Manual layout and place each card deliberately, even if that means hand-placing 15 cards. At this volume, manual placement is feasible and is the difference between a portfolio and a directory. |
| Stock motion presets (fade-in-up on every section) | This is the new "purple gradient." Use motion deliberately — one or two earned moments per page, not a fade on every block. |
| Free-plan launch | The Framer subdomain + watermark actively undermine the brand-credibility pitch. Either pay or don't ship. |

---

## Fallback Path: Code-built (Astro + Motion + GSAP + Lenis)

Use this path if (a) Caleb partners with a developer, (b) Framer's constraints turn out to bite (unlikely at this scale), or (c) Caleb decides he wants the site to also serve as a coding artifact.

### Core Technologies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Astro** | 5.x (currently 5.17, stable) | Static site framework | Content-site optimised. Ships near-zero JS by default — animations hydrate only where used (`client:visible`), which is the right model for a portfolio with motion in some sections and not others. 2–3× faster page loads than Next.js for content-driven sites. View Transitions API support is built-in for free page transitions. |
| **Motion (`motion`)** | 12.x | React/JS animation library | The renamed, currently-maintained Framer Motion. Use the `motion` package, not the deprecated `framer-motion`. Imports are `motion/react`. Component-level animations: hover, gesture, layout, scroll. |
| **GSAP** | 3.13+ | Timeline + scroll-trigger animation | **Now 100% free, including all Club plugins (ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, etc.)** as of Webflow's 2024 acquisition. Use ScrollTrigger for the cinematic scroll-driven sequences that define the Readymag reference look. GSAP and Motion solve different problems — Motion for component states, GSAP for orchestrated timelines and scroll math. |
| **Lenis** | latest (`lenis` package, formerly `@studio-freight/lenis`) | Smooth scroll | Industry-default smooth scroll for design-led 2026 sites. ~4 KB. Pairs with GSAP ScrollTrigger via a single rAF tick. The `lenis/react` import gives you the React provider. |
| **Tailwind CSS** | 4.x | Utility CSS | **Optional and use carefully.** Tailwind is fine for spacing/layout primitives but is also the fastest path to the generic-AI-look if you lean on its defaults. If you use it, write a custom theme (custom font scale, custom color palette, custom spacing) — the stock Tailwind defaults are themselves an "AI tell." Plain CSS / CSS Modules with a custom design system is equally valid and more likely to feel bespoke. |

### Hosting

| Choice | Cost | Why |
|--------|------|-----|
| **Cloudflare Pages** | Free | Unlimited bandwidth on the free tier (Vercel: 100 GB cap and the Hobby plan technically prohibits commercial use, which a portfolio for job applications arguably is). 500 builds/month is plenty. Global edge. Git-based deploys. |
| Netlify | Free (100 GB) | Fine alternative; better forms handling out of the box if Caleb wants a contact form without writing function code. |
| Vercel | Free for hobby | Avoid for this — Hobby's commercial-use restriction is a grey area for a portfolio used in a job hunt. Move only if Caleb later shifts to a Next.js stack. |

### Why Astro, not Next.js

Next.js is the obvious choice if you live in React and you're building an app. For a 5–15 piece content site, Next.js is overkill — it ships more JS by default, hydrates more aggressively, and the App Router's mental model is heavier than this project warrants. Astro's "islands" model (ship HTML, hydrate only the components that need interactivity) maps cleanly onto a portfolio: the gallery is static HTML, the scroll-motion sequence on the splash is one hydrated island. The result is faster, simpler, and just as capable for design fidelity.

### Why NOT to ship the code path for THIS project

The code path is technically excellent and produces a beautiful site. But it requires:

- A developer (or Caleb learning git, npm, Astro, deploy pipelines)
- A local dev environment (Node, terminal, editor)
- Every content update to go through a code change → commit → push → wait-for-deploy loop
- Image optimisation, font loading, and performance hygiene as Caleb's responsibility

This is the right stack for a developer-owned portfolio. It is the wrong stack for a non-developer's portfolio that needs to stay alive across years of casual updates.

### Installation (if going this route)

```bash
# Scaffold
npm create astro@latest -- --template minimal
cd <project>

# Animation + scroll
npm install motion gsap lenis

# Optional but common
npm install -D tailwindcss@latest @astrojs/react

# Deploy via Cloudflare Pages: connect git repo, set build command to `npm run build`, output dir to `dist/`.
```

---

## Path Comparison

| Dimension | Framer (recommended) | Code (Astro + Motion + GSAP + Lenis) |
|-----------|----------------------|--------------------------------------|
| **Design ceiling** | High. Same ceiling as the reference sites Caleb cited (Framer is one of them). | Marginally higher — total control over every pixel and every animation frame. |
| **AI-generated-look risk** | **Medium-high if you pick a template.** Low if you start blank. The risk is template discipline. | **Medium-high if you ship shadcn defaults / stock Tailwind.** Low if you build a custom design system. The risk is library discipline. |
| **Maintenance for non-dev** | Easy. Visual editor. New piece = ~2 minutes. | Hard. Requires git, npm, an editor, deploy awareness. |
| **Time to first publish** | Days, mostly spent on design decisions. | 1–2 weeks if Caleb hires a dev or learns enough to ship. |
| **Y1 cost** | ~$130 ($120 Framer + $10 domain) | ~$10 (just the domain — hosting free) |
| **Y2+ cost** | ~$130/yr | ~$10/yr |
| **PDF / deck handling** | Cover-image + download link pattern. Manual but full control. | Same pattern recommended. Optionally use `react-pdf` (which wraps PDF.js) for inline preview, but the cover-image pattern is still better for skim-time UX. |
| **Recruiter perception** | "This person ships." Indistinguishable from code at a glance. | "This person ships and codes." Slight bonus for the dev-adjacent half of Caleb's pitch — but the analyst/brand recruiters won't know or care. |
| **Lock-in** | Framer-specific. Migration = rebuild. | Portable HTML/CSS/JS. |
| **Right answer for THIS project** | **Yes.** | No, unless Caleb partners with a developer. |

---

## Domain Recommendation

**Cloudflare Registrar.** $10.46/yr for `.com` at-cost, no markup, no renewal hike, free WHOIS privacy, free DNS. The constraint is you must use Cloudflare's nameservers — which is fine, their DNS is excellent and connecting to Framer is two records.

Alternatives: **Porkbun** (~$11/yr, friendlier UI, no nameserver lock-in) is the runner-up if Caleb wants nameserver flexibility. **Avoid GoDaddy** (Feb 2026 ToS change reclassified consumers as "Business Customers" to strip protections — currently the consensus avoid-at-all-costs registrar). Namecheap is fine but more expensive at renewal (~$14/yr) than the leaders.

For the actual domain string: prefer `caleblim.com` / `caleblim.co` / `caleb.work` over creative TLDs (`.design`, `.studio`, `.me`) — recruiters trust `.com` reflexively, and "trust" is the entire game on a portfolio aimed at hiring decisions.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **shadcn/ui defaults, untouched** | Recruiter-recognisable as the 2024–2026 AI-template stack. Slate background, Inter font, rounded-2xl card, "✨ AI-powered" copy energy. Actively undermines the brand pitch. | If using shadcn, treat it as a primitive layer and rebuild the visual style from scratch. Better: skip it entirely for this site — it's a SaaS-app library, not a portfolio library. |
| **Bootstrap themes / generic SSG starters** | Same problem, older era. | Start from blank in Framer or a minimal Astro template. |
| **Hugo / Eleventy with default themes** | Built for blogs and docs, not magazine-grade portfolios. Theme ecosystem skews developer-utilitarian. Custom layouts are possible but non-trivial, and the platform doesn't reward design effort the way Framer / Astro do. | Astro for the code path; Framer for no-code. |
| **`framer-motion` package (the old name)** | Deprecated in favour of `motion`. Still works but receives no updates. | `motion` package, `motion/react` import. |
| **`@studio-freight/lenis`, `@studio-freight/react-lenis`** | Retired when Studio Freight became Darkroom Engineering. | `lenis` package, `lenis/react` import. |
| **Vercel free tier for this commercial-adjacent use** | Hobby plan technically prohibits commercial use; portfolio for job hunt is grey area. | Cloudflare Pages (unlimited bandwidth, no commercial restriction on free tier). |
| **GoDaddy** | Feb 2026 ToS change reclassified consumers as Business Customers, stripping consumer protections. | Cloudflare Registrar or Porkbun. |
| **Inline PDF viewers as the primary preview** | Slow, look stock, mobile-Safari-fragile. Recruiters won't read a paginated PDF in-browser. | Cover image + download link. Optionally Speaker Deck for slide decks. |
| **Issuu flipbooks** | Visually dated, shouty UI, freemium watermarks. | Speaker Deck (free, clean) for decks; native download for PDFs. |
| **Webflow for THIS project** | Webflow's strength is CMS-heavy long-content sites with lots of editorial structure. For 5–15 static pieces it's overkill — steeper learning curve than Framer, harder visual editor, and the design-fidelity ceiling is similar to Framer's at this scale. Reasonable choice but not the best one here. | Framer. |
| **Readymag for THIS project** | High design ceiling but the personal plan publishes only one site, the editor is more constrained than Framer's, and motion/interactivity is weaker than Framer's. Excellent for editorial case-study sites; less ideal for a multi-page splash → category → gallery flow. | Framer. |

---

## Stack Patterns by Variant

**If Caleb wants to launch in under a week and never touch code:**
- Framer Basic + Cloudflare Registrar.
- Start blank, not from a template.
- Manual CMS layouts. One pattern: a single "Pieces" CMS collection with `category`, `title`, `role`, `outcome`, `cover`, `pdf` fields. Each category page filters this collection.

**If Caleb partners with a developer or wants the site to also signal "I can hold my own technically":**
- Astro 5 + Motion 12 + GSAP 3.13+ + Lenis on Cloudflare Pages.
- Cloudflare Registrar for the domain.
- Custom design system. No Tailwind defaults shipped untouched.
- Content lives in `src/content/` as MDX with front-matter; new piece = new MDX file + commit.

**If the design constraint slips later (Caleb decides editorial-minimal is fine):**
- The fallback options expand significantly — Cargo, Are.na, even a hand-rolled Astro site become viable.
- Don't take this path unless the brand pitch shifts. The current pitch *requires* the bold/expressive aesthetic.

---

## Version Compatibility (code path only)

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `astro` | 5.x | Node 18.20.8+ / 20.3+ / 22+ | Astro 5 requires modern Node; check `engines` field before deploying. |
| `motion` | 12.x | React 18 + 19 | If using React 19, double-check peer-dep compatibility at install — Motion supports both but verify warnings. |
| `gsap` | 3.13+ | Any modern bundler | Now 100% free including ScrollTrigger, ScrollSmoother, SplitText. Old `gsap/dist/gsap-trial` workarounds no longer needed. |
| `lenis` | latest | Pairs with `gsap.ticker` for ScrollTrigger sync | `lenis/react` for Astro+React integration; vanilla `lenis` for `.astro` files directly. |
| Tailwind | 4.x | Astro 5 | Astro 5 has first-class Tailwind 4 integration via `@astrojs/tailwind`. Tailwind 4 changed config format (CSS-first config) — be aware. |

---

## Confidence Notes

- **HIGH confidence: recommendation (Framer for this project), GSAP free status, Motion package rename, Astro 5 stable, Cloudflare Pages free-tier generosity.** Verified across multiple authoritative sources, including Framer's, Webflow's, Astro's, and Cloudflare's official communications.
- **MEDIUM confidence: specific version pins.** Verified accurate as of May 2026 but version numbers drift; check at install time.
- **MEDIUM confidence: Framer free-domain offer (Jan 2026 onward).** Reported widely but verify current state on framer.com/pricing before purchase.
- **LOW confidence: GoDaddy ToS specifics.** Reported in multiple registrar-comparison posts; if Caleb already has a GoDaddy account, verify directly with their current ToS rather than relying on third-party summaries.

---

## Sources

- [Framer Pricing (official)](https://www.framer.com/pricing)
- [Framer Help — comparing plans](https://www.framer.com/help/articles/best-use-cases-for-each-framer-plan/)
- [Framer Free Plan limits 2026](https://framerbite.com/blog/framer-free-plan-limitations)
- [Framer SEO 2026 (oma-kase)](https://www.oma-kase.com/blog/framer-seo-2026)
- [Webflow makes GSAP 100% free (Webflow Blog)](https://webflow.com/blog/gsap-becomes-free)
- [GSAP Pricing (now free)](https://gsap.com/pricing/)
- [Motion.dev — current docs](https://motion.dev/)
- [Motion (motiondivision/motion) GitHub](https://github.com/motiondivision/motion)
- [Astro 5.0 launch blog](https://astro.build/blog/astro-5/)
- [Astro releases (GitHub)](https://github.com/withastro/astro/releases)
- [Lenis (Darkroom Engineering)](https://lenis.darkroom.engineering/)
- [Lenis GitHub](https://github.com/darkroomengineering/lenis)
- [Cloudflare Pages vs Netlify vs Vercel 2026 (DanubeData)](https://danubedata.ro/blog/cloudflare-pages-vs-netlify-vs-vercel-static-hosting-2026)
- [Hosting free-tier comparison 2026 (agentdeals)](https://agentdeals.dev/hosting-free-tier-comparison-2026)
- [Best domain registrars 2026 (DomainDetails)](https://domaindetails.com/kb/getting-started/best-domain-registrars-compared)
- [Cheapest domain registrars 2026](https://domaindetails.com/registrars/cheapest)
- [Speaker Deck](https://speakerdeck.com/)
- [Astro vs Next.js 2026 (PkgPulse)](https://www.pkgpulse.com/guides/astro-vs-nextjs-2026)
- [Astro + GSAP portfolio reference (Codrops)](https://tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio-a-minimalist-astro-gsap-build-with-reveals-flip-transitions-and-subtle-motion/)
- [Framer vs Webflow 2026 (TheAlien)](https://www.thealien.design/insights/webflow-vs-framer)
- [Portfolio platform comparison (The Crit)](https://thecrit.co/resources/portfolio-platform-comparison)

---

*Stack research for: design-led non-dev portfolio with Readymag/Framer-grade fidelity, 5–15 static pieces*
*Researched: 2026-05-09*
