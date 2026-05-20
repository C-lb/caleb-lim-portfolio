# Phase 6: Deploy & Maintenance Handoff — Research

**Researched:** 2026-05-20
**Domain:** static site deploy + DNS + SEO/social asset hygiene + non-dev maintenance handoff
**Confidence:** HIGH (stack is verified; sequencing landmines are well-known)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01** Walkthrough format = README.md + numbered screenshots committed to repo. No Loom, no video, no third-party host.
- **D-02** Walkthrough depth = markdown frontmatter + image hero only. PDF flow gets a "see CONTRIBUTING.md" pointer or single inline paragraph, NOT a screenshot walk.
- **D-03** OG card = single static cream-on-ink 1200×630 PNG at `public/og.png`. Reused on every page via `<meta>` in `src/layouts/Base.astro`. Twitter card type = `summary_large_image`. NOT per-page Satori-generated.
- **D-04** Sitemap = `@astrojs/sitemap` integration (auto-generated at build). Hand-author `public/robots.txt` with `User-agent: *` / `Allow: /` / `Sitemap: <site>/sitemap-index.xml`.
- **D-05** Detail-page LCP fix in scope. Target: detail-page LCP <2s (was 3121ms in Plan 05-08 baseline). Mirror Plan 05-04's splash treatment on `src/pages/[category]/[slug].astro` hero.
- **D-06** Plan 05-06 stragglers fix in scope. Remove the three per-source `transition: none` reduced-motion blocks at `StatusPill.astro:82-85`, `[category].astro:140-142`, `[slug].astro:332-334`.
- **D-07** Hosting = Vercel (amended; already live at https://caleb-lim-portfolio.vercel.app). ROADMAP + REQUIREMENTS amended this CONTEXT commit.
- **D-08** Domain registrar = Cloudflare Registrar (default) for `caleblim.com` (~$10/yr at-cost). Fallback chain: `caleblim.co` → `caleb.work` → `caleblimkr.com`. Alternative single-vendor path = Vercel Domains. Availability check is the first task; if `caleblim.com` is taken, executor walks the fallback list and surfaces as a checkpoint.
- **D-09** Cross-browser matrix = iPhone Safari (iPhone 15 / iOS 26.4.2 from Phase 5 rig), Android Chrome, desktop Safari (Mac), desktop Firefox (Mac).
- **D-10** Walkthrough screenshots path = executor's choice; recommend `/docs/contributing/` per CONTEXT canonical_refs. README at repo root references via relative paths.
- **D-11** OG card design tool = executor's discretion (Figma export / hand-coded Satori one-off / Photoshop / Sharp script). Constraints: 1200×630, cream `--paper` bg, ink `--ink` "CALEB LIM" brand in Bricolage Grotesque, one accent from palette, optional JetBrains Mono tagline.

### Claude's Discretion (use research recommendations)
- Exact `/docs/contributing/` vs `/docs/screenshots/caleb-adds-a-piece/` path (D-10) — recommendation below.
- OG card tool (D-11) — recommendation below.
- Android Chrome device source (D-09) — recommendation below.

### Deferred Ideas (OUT OF SCOPE)
- Per-page Satori-generated OG cards (D-03 alternative)
- Full PNG favicon set / PWA manifest / mask-icon (squid-invader `favicon.svg` is canonical)
- Hand-authored sitemap.xml (D-04 alternative)
- Vercel Domains as primary registrar (D-08 fallback only)
- Automated Lighthouse CI gate (Phase 5 D-16 carryover)
- Email contact form (mailto canonical)
- Plausible / GA / analytics
- Branch-alias Vercel `<scope>` slug discovery (will surface naturally on first non-`main` push)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-04 | Deployed to caleblim.com (subject to availability check) on Vercel, domain registered via Cloudflare Registrar (default; Vercel Domains alternative per D-08) | §Vercel Custom Domain + §Domain Registration Sequencing (below); plus §Validation Architecture HTTPS cert + DNS resolution signals. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Astro stack, Vercel deploy, Cloudflare Registrar domain (per CLAUDE.md GSD:project block — note the Cloudflare Pages reference is stale, amended this commit per D-07).
- All file edits must go through a GSD workflow (`/gsd-execute-phase` for Phase 6 work). No direct repo edits outside the workflow.
- Skim time / recruiter focus constraint applies — Phase 6 deliverables must not slow first paint on the home route. LCP <2s on splash already locked from Phase 5; detail-page LCP <2s is the D-05 target.

## Summary

Phase 6 is six discrete vertical slices riding on top of an already-deployed Vercel site. Five are mechanical (domain, sitemap, OG card, two carryover fixes); one is human-load-bearing (Caleb runs GitHub.dev himself and we capture screenshots).

**The actual technical surface area is small.** The site already auto-deploys from `main` to `caleb-lim-portfolio.vercel.app` with no Deployment Protection. The work is wiring DNS, adding an Astro integration, dropping in a PNG, adding `<meta>` tags, and removing three CSS blocks. The risk-bearing parts are: (1) `caleblim.com` may be unavailable — fallback chain must execute, not be deferred; (2) DNS propagation introduces wall-clock latency outside our control; (3) the Caleb-runs-it dry run depends on a human and a real Vercel auto-deploy round-trip; (4) detail-page LCP 3121ms is NOT fixable by adding `priority`/`sizes` — those props already ship per Plan 05-04 — the real fix is responsive `widths` + format generation.

**Primary recommendation:** Sequence the phase as: Wave 1 = parallel low-blast-radius slices (sitemap+robots, OG card+meta, straggler removal, detail-LCP fix); Wave 2 = domain registration + DNS wiring + HTTPS verify (gated on Wave 1 because `site` URL in `astro.config.mjs` flips from `caleb-lim-portfolio.vercel.app` to `caleblim.com` once the domain lives); Wave 3 = Caleb GitHub.dev dry-run + screenshots + README + cross-browser smoke + phase-exit verification.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Custom domain + DNS | CDN / Static (Vercel) + Domain Registrar (Cloudflare) | — | Vercel terminates HTTPS and serves; Cloudflare Registrar owns the DNS zone where the A record lives. No app code involved. |
| OG / Twitter meta tags | Frontend Server (Astro SSG) | Static asset (`public/og.png`) | Tags rendered into `<head>` at build time from `src/layouts/Base.astro`. PNG sits in `public/`. |
| Sitemap + robots.txt | Frontend Server (Astro build) | Static asset (`public/robots.txt`) | `@astrojs/sitemap` runs at `astro build` and emits to `dist/sitemap-{index,0}.xml`. robots.txt is hand-authored under `public/`. |
| Detail-page hero LCP optimization | Frontend Server (Astro `<Image>`) | CDN edge serving | `<Image widths={…} sizes={…}>` runs at build time, emits `srcset` + responsive WebP variants under `dist/_astro/`. Vercel CDN serves. |
| Reduced-motion CSS hygiene | Browser (CSS scoped styles) | — | Scoped style blocks in Astro components. No JS, no build pipeline change. |
| README walkthrough + screenshots | Static documentation (git-versioned) | — | Renders on github.com/c-lb/caleb-lim-portfolio. Nothing in `dist/`. |
| Cross-browser smoke | Browser (manual test rig) | — | Pure observation. Recorded in `06-VERIFICATION.md`. |
| Caleb GitHub.dev dry run | Browser (github.dev) → CI (Vercel) → CDN edge | git (source-of-truth) | github.dev commits → push → Vercel webhook → build → deploy → live. End-to-end verifies the maintenance loop. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/sitemap` | 3.7.2 (verified npm 2026-03-26) [VERIFIED: npm registry, official Astro docs] | Auto-generate sitemap-index.xml + sitemap-0.xml at build time, traversing all SSG routes incl. `getStaticPaths()` dynamic ones | Official Astro integration. Eliminates the manual-update pitfall FOUND-04 guards against. ~5min setup. [CITED: docs.astro.build/en/guides/integrations-guide/sitemap/] |

### Supporting (already in repo — no install)
| Library | Version | Purpose | Used For |
|---------|---------|---------|----------|
| `astro` | 5.18.1 [VERIFIED: package.json] | SSG framework | `<Image>` with `priority`/`widths`/`sizes`, sitemap integration hook, build pipeline |
| `sharp` | 0.34.5 [VERIFIED: package.json devDependencies] | Image processing | Powers Astro's `<Image>` srcset generation; can optionally script the OG card render |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@astrojs/sitemap` | Hand-authored sitemap.xml | Rejected by D-04. Manual-update pitfall = same maintenance failure FOUND-04 prevents. |
| Cloudflare Registrar | Vercel Domains | D-08 fallback. Single-vendor DNS reduces one Cloudflare→Vercel step at the cost of ~$5/yr and slight registrar lock-in. Surfaces as a registrar checkpoint, not a default. |
| Static `public/og.png` | Per-page Satori (`satori` + `@vercel/og`) | Rejected by D-03. ~2hr setup for marginal benefit at portfolio scale; static keeps brand control + zero dependencies. |
| Figma export for OG card | Hand-coded Sharp script | Sharp script gives reproducibility (re-render on token change) but adds boilerplate. Figma export is faster for v1.0 ship; Sharp script is the "do-it-once-properly" v1.1 candidate. |

**Installation:**
```bash
npx astro add sitemap     # adds @astrojs/sitemap to deps + edits astro.config.mjs
# OR explicit:
npm install @astrojs/sitemap
```

**Version verification:**
- `npm view @astrojs/sitemap version` → **3.7.2** (verified 2026-05-20; published 2026-03-26).
- Astro 5.x compatibility confirmed via GitHub issue trail and official docs.

## Package Legitimacy Audit

> slopcheck not available in this environment (no `pip` on macOS). Manual verification only.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@astrojs/sitemap` | npm | ~5 yrs (3.x line since 2024) | hundreds of thousands/wk | [withastro/astro](https://github.com/withastro/astro/tree/main/packages/integrations/sitemap) | unavailable — manual `[VERIFIED: npm registry, official Astro docs]` | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none. `@astrojs/sitemap` is the canonical Astro-team-published integration; its publisher account (`@astrojs`) is the official scope. Planner does NOT need to gate this install behind `checkpoint:human-verify` — but if executor wants to slopcheck-it-in-CI, that's a 5-line shell snippet they can drop in.

## Architecture Patterns

### System Architecture Diagram

```
[Caleb / Recruiter Browser]
        │
        │ HTTPS (TLS via Let's Encrypt, Vercel-managed)
        ▼
[caleblim.com  apex] ── DNS A 76.76.21.x ──► [Vercel Edge CDN]
[www.caleblim.com] ── DNS CNAME cname.vercel-dns.com ──► [Vercel Edge CDN]
        │                                                    │
        │                                                    │ serves from
        ▼                                                    ▼
[/sitemap-index.xml]                          [dist/ — Astro SSG output]
[/robots.txt]                                 ├── index.html        ◄── splash
[/og.png]                                     ├── design/index.html ◄── gallery
[/favicon.svg]                                ├── design/<slug>/index.html
                                              │     ┌── hero <Image> (srcset)
                                              │     ├── paginated PDF thumbs
                                              │     └── OG/Twitter meta tags
                                              ├── about/index.html
                                              ├── 404.html
                                              ├── sitemap-index.xml ◄── @astrojs/sitemap
                                              ├── sitemap-0.xml
                                              └── _astro/ (hashed assets)
                                                    │
                                                    ▼
                                              [Sharp at build time]
                                              hero.webp 1280×1600 ──► variants @ widths

[GitHub repo C-lb/caleb-lim-portfolio]
        │
        │ webhook on push to main
        ▼
[Vercel build pipeline] ── npm run build ──► [dist/] ── deploy ──► Edge CDN

[github.dev editor (browser-based VS Code)]
        │
        │ Caleb adds src/content/pieces/<slug>/index.md + hero.{webp,png,jpg}
        │ commits + pushes to main
        ▼
[GitHub] ──► (same webhook path above) ──► live on caleblim.com
```

### Recommended Project Structure (additions only)
```
caleb-lim-portfolio/
├── README.md                                       # NEW — walkthrough doc + screenshots
├── astro.config.mjs                                # MODIFY — add site + sitemap()
├── public/
│   ├── favicon.svg                                 # unchanged (canonical squid invader)
│   ├── og.png                                      # NEW — 1200×630 static OG card
│   ├── robots.txt                                  # NEW — hand-authored
│   ├── caleb-lim-resume.pdf                        # unchanged
│   └── source-pdfs/                                # unchanged (generated PDFs for fullPdf)
├── docs/
│   └── contributing/                               # NEW per D-10 recommendation
│       ├── 01-open-github-dev.png                  # numbered screenshots
│       ├── 02-create-piece-folder.png
│       ├── …
│       └── 06-piece-live-on-prod.png
├── src/
│   ├── layouts/
│   │   └── Base.astro                              # MODIFY — add OG/Twitter meta tags + canonical
│   ├── components/
│   │   └── StatusPill.astro                        # MODIFY — drop transition:none block (D-06)
│   └── pages/
│       ├── [category].astro                        # MODIFY — drop transition:none block (D-06)
│       └── [category]/[slug].astro
│                                                   # MODIFY — add widths to hero Image (D-05)
│                                                   # MODIFY — drop transition:none block (D-06)
└── package.json                                    # MODIFY — add @astrojs/sitemap
```

### Pattern 1: `@astrojs/sitemap` configuration for SSG content collections
**What:** Auto-traverses `getStaticPaths()` output for dynamic routes and emits sitemap entries.
**When to use:** Required by D-04. Works out-of-the-box for this site because all routes are SSG (no `output: 'server'`).
**Example:**
```javascript
// astro.config.mjs — Source: https://docs.astro.build/en/guides/integrations-guide/sitemap/
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://caleblim.com',   // CRITICAL — sitemap requires this
  integrations: [sitemap()],
});
```
- The `site` value MUST begin with `http://` or `https://` and MUST match production. If domain registration falls back to `caleblim.co`, this URL changes too — wire it last after the registrar checkpoint resolves.
- Output: `dist/sitemap-index.xml` (the entry point bots read) + `dist/sitemap-0.xml` (the actual URL list). Reference `sitemap-index.xml` from `robots.txt`.
- `getStaticPaths()` dynamic routes (`[category]/[slug].astro`, `[category].astro`) are picked up automatically at build time — confirmed by Astro docs. [CITED: docs.astro.build/en/guides/integrations-guide/sitemap/]

### Pattern 2: OG/Twitter `<meta>` tags in shared layout
**What:** Drop the 7-tag set into `src/layouts/Base.astro` `<head>`. All pages inherit. Single static image at `/og.png`.
**Where:** Insert immediately after the existing `<link rel="icon">` line (Base.astro:26).
**Example:**
```astro
---
// Base.astro — additions
const canonicalURL = new URL(Astro.url.pathname, Astro.site).toString();
const ogImage = new URL('/og.png', Astro.site).toString();
const description = "Caleb Lim — cross-functional generalist. Brand, marketing, financial models, graphic design.";
---
<!-- inside <head>, after existing <link rel="icon"> -->
<link rel="canonical" href={canonicalURL} />
<meta name="description" content={description} />

<!-- OpenGraph (Facebook, LinkedIn, Slack, Discord) -->
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
```
- `Astro.site` is sourced from `astro.config.mjs`'s `site` field (added in Pattern 1). If `site` is unset, `new URL(…, undefined)` throws — sequencing requires Pattern 1 + 2 in the same slice.
- `og:image` MUST be an absolute URL — `/og.png` alone fails on most validators.
- `og:type` should be `"website"` for splash + gallery + 404, and ideally `"article"` for piece-detail pages. For MVP, `"website"` everywhere is acceptable and avoids per-page conditional logic. [CITED: ogmagic.dev/blog/twitter-card-image-guide; myogimage.com/blog/og-image-size-meta-tags-complete-guide]
- LinkedIn caches the first crawl for ~7 days. After publishing, use [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to force re-fetch. [CITED: krumzi.com/blog/open-graph-image-sizes…]

### Pattern 3: Detail-page hero LCP fix (D-05) — responsive widths, not priority
**What:** Add `widths={[...]}` to the existing `<Image>` at `src/pages/[category]/[slug].astro:97-103`.
**When to use:** The detail-page hero is already wired with `priority` and `sizes` — Plan 05-04 shipped them. The 3121ms LCP is NOT a priority/sizes problem.
**Root cause (verified via dist/ inspection):**
- The hero source `src/content/pieces/design-real-piece/hero.webp` is 1280×1600, 260KB.
- Current build emits ONE `<img>` tag at full 1280×1600 native dimensions — no `srcset`, no responsive variants. [VERIFIED: inspected dist/design/design-real-piece/index.html line by line, 2026-05-20].
- Without a `widths` array, Astro's `<Image>` skips srcset generation. A mobile viewport downloads the full 1280×1600 image instead of a 640w or 960w variant.

**Example:**
```astro
{/* Source: src/pages/[category]/[slug].astro — modify existing Image */}
<Image
  src={hero}
  alt={title}
  class="detail-hero"
  priority
  widths={[480, 768, 960, 1280]}
  sizes="(max-width: 960px) 100vw, 960px"
  format="webp"
/>
```
- Mirror Plan 05-04's pattern from `GalleryA12.astro` which used `widths={[280, 560]}` for gallery tiles. Detail-page hero needs a larger range because the CSS sets `max-width: 960px` on `.detail` and the image fills it.
- Picking widths: the rendered max is 960px CSS, so 1× = 960w, 2× DPR = 1920w (which exceeds the source's 1280; cap at 1280). Mobile <540 = 480w. Mid-range = 768w.
- `format="webp"` is the Astro 5 default and matches the source. Optionally add `format="avif"` for further compression — but AVIF adds CPU at build (sharp encodes ~5× slower than webp) and broswer support is now universal in 2026, so it's a reasonable add. RECOMMEND: stick to `webp` for the first pass; only add `avif` if Lighthouse still shows the image as the LCP bottleneck post-widths-fix.

**Expected impact:**
- Mobile Lighthouse audit on `/design/design-real-piece` should drop the LCP element bytes from ~260KB → ~50KB (the 768w webp variant for a 4G-throttled mobile profile).
- Target: detail-page LCP <2000ms (currently 3121ms). The gap is large enough that responsive widths alone should clear it.

### Pattern 4: Straggler removal (D-06) — three exact-location surgical deletions
**What:** Three CSS blocks that contradict D-08 #12 (StatusPill hover), #16 (back-pill color), #18 (pager color).
**Verified locations (re-grepped 2026-05-20 — line numbers drifted slightly from CONTEXT):**

| File | Line range | Block to delete |
|------|------------|-----------------|
| `src/components/StatusPill.astro` | **82-85** | `@media (prefers-reduced-motion: reduce) { .pill { transition: none; } .pill:hover { transform: none; } }` |
| `src/pages/[category].astro` | **140-142** | `@media (prefers-reduced-motion: reduce) { .b-cat-back { transition: none; } }` |
| `src/pages/[category]/[slug].astro` | **332-334** | `@media (prefers-reduced-motion: reduce) { .pager-link { transition: none; } }` |

**Why they were originally added:** Plan 05-06 made the global `*, *::before, *::after { transition: 0.01ms }` reduced-motion clamp surgical (removed it from `tokens.css`) and replaced it with per-source disables. These three blocks were per-source disables added by earlier plans (likely Plan 05-03 or 05-04) that pre-dated Plan 05-06's D-08 surgical policy. Plan 05-06 noted them in §Out-of-Scope but didn't touch them because they were outside that plan's `files_modified`. The exemption rationale per D-08:
- #12 StatusPill hover-scale → user-initiated feedback motion, exempt
- #16 back-pill color → color-only transition (no spatial motion), exempt
- #18 pager-link color → color-only, exempt
- The three `transition: none` blocks suppress these EXEMPT motions, contradicting D-08.

**Why removing them doesn't regress Phase 5 a11y:** They suppress color/transform motion only — no scroll-driven animation, no autoplay, no decorative rotation. D-08's surgical policy explicitly classifies these as essential interaction feedback (#12 #16 #18). Removing them restores the canonical D-08-compliant behavior. No new motion is introduced; existing JS-gated suppressions (carousel autoplay, slow-scroll) and Plan 05-06's two per-source `animation: none` disables (b-card, b-bio entrance shakes) remain intact and continue to suppress non-essential motion.

### Anti-Patterns to Avoid
- **Don't propose Loom / video walkthrough.** D-01 forbids.
- **Don't propose Per-page Satori-generated OG cards.** D-03 forbids.
- **Don't propose PWA manifest / mask-icon / full PNG favicon set.** Squid-invader `favicon.svg` canonical per Caleb 2026-05-20.
- **Don't propose Cloudflare Pages migration.** D-07 locked on Vercel.
- **Don't add `<meta>` tags without first adding `site:` to astro.config.mjs.** `Astro.site` returns undefined otherwise, and `new URL(path, undefined)` throws at build.
- **Don't re-set Cloudflare proxy to "Proxied" (orange cloud) for the apex A record.** Conflicts with Vercel's auto-HTTPS; causes redirect loops. Use "DNS only" (grey cloud). [CITED: vercel community + multiple Cloudflare-to-Vercel migration guides]
- **Don't hand-roll a sitemap when `@astrojs/sitemap` exists.** D-04 forbids; would re-introduce the maintenance pitfall.
- **Don't put screenshots in `public/`.** They'd ship as deployed static assets. Use `docs/contributing/` — git-tracked, NOT served at runtime.
- **Don't conflate "priority" with "responsive widths."** Detail-page hero already has `priority`; D-05's actual fix is adding `widths={[...]}` so srcset emits.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | Hand-edited `public/sitemap.xml` | `@astrojs/sitemap` integration | Drifts on every new piece; D-04 forbids; would re-create the maintenance pitfall. |
| OG image generation | Per-page render via Satori build hook | Single static `public/og.png` (D-03) | Per-page is a 2-hour build for portfolio-scale recruiter rarely deep-linking. |
| Markdown editor for non-dev | Decap/Darkmatter/Dhub CMS | github.dev (in-browser VS Code, free, zero install) | D-02 already chose markdown-frontmatter-only; github.dev is the canonical browser-based git editor and the user has confirmed familiarity. CMS is overkill. |
| TLS certificate | Self-managed Let's Encrypt | Vercel auto-provisioning | Vercel provisions Let's Encrypt cert automatically once DNS verifies. Free, zero-config. [CITED: vercel.com/docs/domains/working-with-domains] |
| Responsive image generation | Pre-render with Sharp script | Astro `<Image widths={...}>` | Astro 5's built-in pipeline already wraps sharp. Plan 05-04 established the pattern. |
| robots.txt build-time generation | Astro endpoint or build hook | Hand-authored `public/robots.txt` | Three lines. Maintenance pitfall = zero (only changes if site URL changes; same trigger as `astro.config.mjs` `site` update). |

**Key insight:** Phase 6 is mostly *removing* hand-rolled options. The site is already deployed; the SEO bundle is three small files; the maintenance proof is a human task. Resist the urge to build deployment tooling — Vercel + Astro + github.dev is the full stack.

## Runtime State Inventory

> Phase 6 is partially a config/deploy phase, not a rename/refactor — but the doc amendments per D-07 (Cloudflare Pages → Vercel) qualify as a string-rename that touches multiple files. Inventory:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — site has no DB, no user accounts, no analytics store. ChromaDB / Mem0 / Redis: not used in this project. | None |
| Live service config | **Vercel project settings** at https://vercel.com/c-lb/caleb-lim-portfolio — Production Branch = `main`, no Deployment Protection (verified per CONTEXT). Production domain currently `caleb-lim-portfolio.vercel.app`; Phase 6 adds `caleblim.com` (apex) + likely `www.caleblim.com` (redirect → apex). **GitHub repo settings** at https://github.com/C-lb/caleb-lim-portfolio — Vercel webhook is the only meaningful runtime config. | Update Vercel domain settings via dashboard. Update CONTACT.md in github.dev walkthrough only after domain is live. |
| OS-registered state | None — no Windows Task Scheduler, no launchd, no systemd, no pm2. Local dev uses `npm run dev` (ephemeral). | None |
| Secrets/env vars | None used in the build — no `.env`, no `VERCEL_*` secrets, no Vercel Environment Variables set per project settings. | None — if Vercel adds env vars during domain wiring (unlikely), they're scoped per env and don't affect content. |
| Build artifacts | `dist/` (build output, gitignored). `node_modules/` (gitignored). `public/generated/pdf-thumbs/` is committed per Phase 2 D-03 — these are content artifacts, not stale builds. Phase 6 does NOT change PDF rasterization, so generated/ should stay clean. | Verify `npm run build` round-trips cleanly after Wave 1; no stale `dist/` cache to clear. |
| Doc-rot from D-07 (Cloudflare→Vercel rename in CONTEXT.md + ROADMAP.md + REQUIREMENTS.md) | **CLAUDE.md** still references "Cloudflare Pages (free tier, unlimited bandwidth)" + "Cloudflare Pages: connect git repo, set build command to npm run build" in two places (lines 12, 75). **PROJECT.md** also still references Cloudflare Pages in the "Constraints" section per CLAUDE.md GSD:project block. | **Add to Phase 6 scope:** a small doc-amendment task to fix CLAUDE.md + PROJECT.md to say Vercel. This is FOUND-04 doc-rot cleanup. Pattern matches the 2026-05-18 FOUND-03 amendment style. |

**The canonical question for D-07:** After CONTEXT.md + ROADMAP.md + REQUIREMENTS.md were amended this commit, what other repo files still reference "Cloudflare Pages" as the deploy target? Answer: CLAUDE.md and PROJECT.md (per CLAUDE.md GSD:project source ref). The planner should add a Wave-1 doc-amendment task to fix these before milestone v1.0 ships.

## Common Pitfalls

### Pitfall 1: Cloudflare proxy on apex A record
**What goes wrong:** Apex domain points to Vercel via A record, but Cloudflare's "Proxied" (orange cloud) is left ON. Cloudflare's SSL terminates at Cloudflare; Vercel's auto-HTTPS also terminates. Result: redirect loops or 525/526 SSL errors.
**Why it happens:** Cloudflare's default for newly-added DNS records is Proxied if the zone is on a Cloudflare nameserver pair. For Cloudflare Registrar specifically, the registrar-managed zone defaults to proxy ON.
**How to avoid:** When adding the A record at Cloudflare, set the proxy status to "DNS only" (grey cloud icon). If keeping Proxied is desired (for Cloudflare's CDN benefits), set Cloudflare SSL mode to "Full (strict)" instead — but this is more setup and Vercel's own edge CDN already handles caching, so "DNS only" is simpler.
**Warning signs:** `curl -I https://caleblim.com` returns a redirect loop or 525 error after DNS propagates.

### Pitfall 2: `astro.config.mjs` site URL set before domain lives
**What goes wrong:** `site: 'https://caleblim.com'` is set, but `caleblim.com` doesn't resolve yet. Sitemap generation succeeds (Astro doesn't probe the URL at build), but `og:url`, `canonical`, and `sitemap-index.xml` URLs all point to a dead domain. Recruiter sees broken canonical links.
**Why it happens:** Sequence inversion — slice that wires `site:` lands before the domain-registration slice.
**How to avoid:** Use a 2-step domain swap. Step 1 (Wave 1): set `site: 'https://caleb-lim-portfolio.vercel.app'` so meta tags + sitemap point at the working Vercel default subdomain. Step 2 (Wave 2): once `caleblim.com` (or fallback) is live and HTTPS green, flip `site:` to the custom domain and redeploy.
**Warning signs:** OG preview tools (LinkedIn Post Inspector, twitter.com/cards-validator) show a dead-link image after first deploy.

### Pitfall 3: github.dev needs a manual "save and commit" — Caleb may not realize
**What goes wrong:** Caleb edits a file in github.dev, sees "1" badge on the source-control icon, but forgets to type a commit message + click the checkmark. Browser tab closes, edits lost. Or — Caleb commits but doesn't "Sync" to push.
**Why it happens:** github.dev's UI is VS Code-faithful — uses the Source Control side panel, not a "Save" button. Non-dev users miss the workflow.
**How to avoid:** Screenshot the source-control panel state explicitly in the README walkthrough. Show the "Commit & Push" button (single click that commits then pushes on github.dev when there's no untracked branch state) and the success state where the badge count drops to 0.
**Warning signs:** Caleb says "I added the piece but it's not on the site" — first thing to check is whether the commit actually pushed.

### Pitfall 4: DNS propagation latency outside our control
**What goes wrong:** DNS records set at Cloudflare can take 5min – 48hr to propagate globally. Vercel verification status flips from "Invalid Configuration" → "Valid Configuration" → SSL provisioning → live. During the gap, manual testing returns inconsistent results across networks.
**Why it happens:** TTL on existing NXDOMAIN responses cached by recursive resolvers worldwide.
**How to avoid:** Use `dig +short caleblim.com @1.1.1.1` and `dig +short caleblim.com @8.8.8.8` to check propagation against authoritative resolvers. Wait until both return the Vercel A record before opening the Vercel dashboard verification check.
**Warning signs:** Vercel dashboard stays on "Invalid Configuration" for >30 min after DNS records are set. Re-check `dig` results before assuming Vercel is wrong.

### Pitfall 5: LinkedIn 7-day cache on OG card
**What goes wrong:** First share of caleblim.com on LinkedIn caches whatever OG meta was live at that moment. If you fix og:image afterwards, the old card persists for ~7 days.
**Why it happens:** LinkedIn aggressively caches OG metadata to reduce load on shared sites.
**How to avoid:** Verify OG card via [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) BEFORE the first organic share. The inspector force-fetches and updates the cache.
**Warning signs:** Caleb posts to LinkedIn, the card looks wrong. Solution: run the Post Inspector against the URL — that refetches the cache.

### Pitfall 6: Astro `<Image>` `priority` without `widths` doesn't emit srcset
**What goes wrong:** Plan 05-04 added `priority` and `sizes` to the detail-page hero. Both are necessary but not sufficient for responsive image loading. Without a `widths` array, Astro emits exactly one `<img>` at the source's native dimensions — for a 1280×1600 source, every mobile visitor downloads ~260KB.
**Why it happens:** `sizes` tells the browser how big the image will display; `widths` tells Astro which variants to GENERATE. They're complementary. Stack-Overflow-grade misunderstanding to think one implies the other.
**How to avoid:** Always pair `widths={[...]}` with `sizes="..."`. Astro docs are explicit. [CITED: docs.astro.build/en/reference/modules/astro-assets/]
**Warning signs:** Lighthouse "Properly size images" audit fails on a page despite `priority` being set; LCP element bytes ≈ source bytes.

## Code Examples

### Adding sitemap + site URL (Wave 1 — uses Vercel default subdomain)
```javascript
// astro.config.mjs — Source: docs.astro.build/en/guides/integrations-guide/sitemap/
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Phase 6 Wave 1 — points at Vercel default subdomain until custom domain lives.
  // Wave 2 flips this to https://caleblim.com (or fallback) after DNS verifies.
  site: 'https://caleb-lim-portfolio.vercel.app',
  integrations: [sitemap()],
});
```

### Minimal robots.txt (Wave 1)
```
User-agent: *
Allow: /

Sitemap: https://caleb-lim-portfolio.vercel.app/sitemap-index.xml
```
Wave 2 swaps the URL to the custom domain once DNS is green.

### Detail-page hero LCP fix (Wave 1)
```astro
{/* src/pages/[category]/[slug].astro — modify the existing <Image> at line 97-103 */}
<Image
  src={hero}
  alt={title}
  class="detail-hero"
  priority
  widths={[480, 768, 960, 1280]}
  sizes="(max-width: 960px) 100vw, 960px"
/>
```

### OG/Twitter meta block in Base.astro (Wave 1)
See Pattern 2 above — exact snippet to drop into `src/layouts/Base.astro` between line 26 (favicon link) and line 27 (font preload).

### Removing the three D-06 stragglers (Wave 1)
```bash
# Verify the exact blocks before editing:
grep -n "prefers-reduced-motion" src/components/StatusPill.astro src/pages/\[category\].astro src/pages/\[category\]/\[slug\].astro
# Expected:
#   src/components/StatusPill.astro:82
#   src/pages/[category].astro:140
#   src/pages/[category]/[slug].astro:332
```
Delete the 3-4 lines starting at each match (the `@media` open + content + close brace).

### Vercel domain wiring via dashboard (Wave 2 — manual)
1. Cloudflare Registrar: register `caleblim.com` (or fallback). At-cost ~$10.46/yr.
2. Vercel dashboard → Project `caleb-lim-portfolio` → Settings → Domains → "Add Domain" → enter `caleblim.com`.
3. Vercel shows "Invalid Configuration" + the required DNS records:
   - Apex: `A` record `@` → `76.76.21.21` (or the IP Vercel shows — Anycast pool, may differ).
   - www subdomain: `CNAME` `www` → `cname.vercel-dns.com`.
4. Cloudflare dashboard → caleblim.com → DNS → Records → Add the two records. **CRITICAL: Proxy status = "DNS only" (grey cloud)**, not Proxied (orange cloud).
5. Wait for DNS propagation. Verify via `dig +short caleblim.com @1.1.1.1` returning the Vercel IP.
6. Vercel dashboard → Domain status flips to "Valid Configuration" → SSL auto-provisions in 1-5 min.
7. Verify cert chain via `curl -vI https://caleblim.com 2>&1 | grep -E 'SSL|TLS|issuer'`.

### `caleblim.com` availability check (executor's first task)
```bash
# CLI check (whois may be installed; if not, use Cloudflare dashboard search):
whois caleblim.com | head -10
# OR:
curl -s "https://api.cloudflare.com/.../registrar/domains/check?domain=caleblim.com" \
  -H "Authorization: Bearer $CF_API_TOKEN"
# OR simplest — Cloudflare dashboard → Domain Registration → Register Domain → search.
```
If unavailable, walk down D-08's fallback chain and surface a checkpoint to Caleb before locking the registration.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloudflare Pages free tier (PROJECT.md original plan) | Vercel default subdomain → custom domain on Vercel | 2026-05-18 D-13 (Phase 5) | Already deployed; Phase 6 just adds custom domain. No re-platform work. |
| Hand-authored sitemap.xml (common at portfolio scale) | `@astrojs/sitemap` 3.7.x auto-generation | 2024 with Astro 5.x ecosystem maturity | Maintenance pitfall closed by absence. |
| Per-page rendered OG cards (Satori / @vercel/og — popular 2024-2025) | Single static OG card (D-03 decision) | Project-specific tradeoff 2026-05-20 | ~2 hours saved; recruiter rarely deep-links. |
| `priority` alone for LCP (Plan 05-04 assumption) | `priority` + `widths` + `sizes` for responsive srcset | Re-discovered 2026-05-20 via dist/ inspection for this research | Detail-page LCP path: 3121ms → target <2000ms. |

**Deprecated/outdated:**
- Cloudflare Pages references in CLAUDE.md (lines 12, 75) and PROJECT.md — stale per D-07; need amending.
- The original `priority`/`sizes`-only treatment of the detail-page hero (Plan 05-04 Task 3) — necessary but insufficient. D-05 plan should ADD `widths`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vercel's Anycast A-record IP for apex domains is in the `76.76.21.x` pool [ASSUMED — verify via Vercel dashboard when adding the domain] | §Vercel domain wiring example | Wrong IP = DNS misconfiguration; Vercel dashboard shows the correct value at add-time. Low risk because executor reads it from Vercel UI before setting at Cloudflare. |
| A2 | `caleblim.com` is currently available at Cloudflare Registrar [ASSUMED — verified during executor's first task in Phase 6] | §Domain Registration Sequencing | If taken, D-08 fallback chain executes. Already planned; not a planning-time blocker. |
| A3 | The Caleb-runs-it dry run will succeed first try if README walkthrough is well-screenshot-ed [ASSUMED — depends on Caleb's familiarity with github.dev] | §Pattern 5 / Pitfall 3 | If Caleb hits a github.dev quirk we didn't screenshot, the dry run loops. Mitigation: dispatch the README+screenshots first, then have Caleb execute the dry run with a checkpoint after the commit step. |
| A4 | LinkedIn Post Inspector + Twitter Card Validator work without auth in 2026 [CITED: ogmagic.dev confirms LinkedIn caches ~7 days; Twitter Card Validator was retired by X in 2023, replaced by [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) which may also be deprecated] [ASSUMED] | §Pattern 2 / §Validation Architecture | If Twitter Validator is dead, fall back to opening twitter.com/intent/tweet with the URL and checking the card preview, or to a third-party tool like opengraph.dev. |
| A5 | Vercel SSL provisions within 1-5 min of "Valid Configuration" status [CITED: vercel.com/docs/domains/working-with-domains; verified across multiple Cloudflare-to-Vercel migration guides] | §Pitfall 4 | If slower, just wait. No code or plan change. |
| A6 | Removing the three D-06 stragglers does not regress Phase 5 reduced-motion verification on iPhone 15 iOS 26.4.2 [ASSUMED based on D-08's surgical-policy logic — the blocks suppress motions D-08 classifies as exempt; removing them restores exempt status] | §Pattern 4 | If removal breaks a real-iPhone walk, Phase 6 verification slice catches it. Low risk because the blocks are color/transform-only suppressors, not scroll/autoplay/decorative-motion. |
| A7 | github.dev supports drag-and-drop file upload for binary images directly into a Astro content collection folder [ASSUMED — github.dev does support drag-and-drop in 2026 per VS Code feature parity] | §Pattern 5 / Pitfall 3 | If drag-and-drop fails for binary, Caleb's path becomes: download image locally → use github.dev's "Upload" command — adds 1-2 screenshots to the README walkthrough but doesn't block the workflow. |

**Three of these (A1, A2, A4) get resolved at execute-time by reading the Vercel dashboard, running an availability check, or opening the Inspector URL — no blocker.** A6 is verified by the same reduced-motion walk Plan 05-08 used. A3 / A7 are human factors and surface during the dry run itself.

## Open Questions

1. **Should the OG card render programmatically (Sharp script) or be a Figma export?**
   - What we know: D-03 locks the design (cream-on-ink, 1200×630, Bricolage + JetBrains Mono); D-11 leaves the tool to executor.
   - What's unclear: which approach the planner should default to.
   - Recommendation: **Sharp script** (committed at `scripts/render-og-card.mjs`). The repo already ships `sharp@0.34.5` as devDep. Reproducibility wins for v1.0 — re-renders on token change without re-opening Figma. ~30min build, lives in git, no external file. If Caleb has a Figma file already, executor surfaces a checkpoint: "Sharp script vs your existing Figma — your call."

2. **Should `og:type` differ per page (`"website"` for splash/galleries, `"article"` for piece-detail)?**
   - What we know: D-03 doesn't specify; the meta block is in shared Base.astro.
   - Recommendation: `"website"` everywhere for MVP. Per-page `"article"` adds a Base.astro prop and small per-template plumbing. Defer to v1.1 if LinkedIn shares become a measured use case.

3. **Where exactly do the screenshots live — `docs/contributing/` or `docs/screenshots/caleb-adds-a-piece/`?**
   - What we know: D-09 (additional_context) suggests the longer path; D-10 (CONTEXT) leaves it to executor.
   - Recommendation: **`docs/contributing/`** (CONTEXT canonical_refs path). Shorter, conventional, matches existing OSS norms (`docs/contributing/` reads as "how-to-contribute docs" which is exactly what this is). README at repo root references via relative path `docs/contributing/01-…png` for github.com rendering.

4. **Android Chrome test device source?**
   - What we know: D-09 leaves it to executor; ROADMAP SC2 just says "Android Chrome."
   - Recommendation: Try in this order — (a) ask Caleb if he has a personal Android device (zero-cost, real); (b) if not, use BrowserStack free trial (one session is enough for the smoke walk); (c) last resort, Chrome DevTools Android emulation (DOES NOT satisfy SC2 per Phase 5 D-15 "real-device-only" rule for Android cells — flag this in `06-VERIFICATION.md` if it has to ship). Caleb's preference surfaces at the cross-browser checkpoint.

5. **Does `astro add sitemap` mutate `astro.config.mjs` in a way that conflicts with manual `site` edit?**
   - What we know: `astro add` writes both the import + `integrations: [sitemap()]` line. The `site:` field is separate.
   - Recommendation: Run `astro add sitemap` first (it edits config), then manually add the `site:` field. Confirm the edit doesn't strip existing config (none currently per Wave 1 baseline — `astro.config.mjs` is two-line minimal).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | ✓ (presumed — Phase 1-5 shipped) | ≥20 per Astro 5 | — |
| npm | Install `@astrojs/sitemap` | ✓ | — | — |
| Astro 5.18.1 | All page rendering | ✓ | 5.18.1 [VERIFIED: package.json] | — |
| `sharp` 0.34.5 | Astro Image srcset + optional OG card script | ✓ | 0.34.5 [VERIFIED: package.json devDeps] | — |
| Vercel CLI (optional) | `vercel domains add` command — alt to dashboard | ✗ likely | — | Use Vercel dashboard UI (recommended path anyway — Caleb may need to see the UI) |
| `dig` | DNS propagation check | ✓ on macOS (built-in BIND tools) | — | nslookup or web-based `dnschecker.org` |
| `whois` | Domain availability check (CLI) | ? (BSD whois on macOS by default) | — | Cloudflare dashboard domain search |
| `curl` | HTTPS cert chain verification | ✓ | — | OpenSSL `openssl s_client -connect caleblim.com:443` |
| Lighthouse | `bash scripts/lighthouse-audit.sh` re-audit | ✓ via npx (existing script auto-fetches) | — | — |
| github.dev | Caleb's GitHub.dev dry run | ✓ (browser-based; no install) | — | — |
| LinkedIn Post Inspector | OG card validation | ✓ (auth via LinkedIn login) | — | opengraph.dev or socialsharepreview.com (third-party OG renderers) |
| Twitter Card Validator | OG/Twitter card validation | ⚠️ formerly cards-dev.twitter.com; status unclear in 2026 per A4 | — | opengraph.dev preview or X's tweet-intent URL with link preview |
| Figma / Photoshop / Sharp | OG card render (D-11 — executor's choice) | ✓ (Sharp) / ? (Figma+PS) | — | Sharp script is the zero-install fallback; ships in repo as `devDependencies` |
| Android Chrome device | D-09 cross-browser cell | ? (depends on Caleb) | — | BrowserStack free trial (web-based) |

**Missing dependencies with no fallback:** none — every blocking dep is satisfied or has a viable web-based alternative.

**Missing dependencies with fallback:** Android device (BrowserStack), Twitter Card Validator (opengraph.dev), Vercel CLI (dashboard).

## Validation Architecture

> Required per Nyquist Dimension 8. workflow.nyquist_validation is enabled (no .planning/config.json `false` opt-out).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Bash + `scripts/verify-build.sh` (25 gates from Phase 1-5) + `scripts/lighthouse-audit.sh` (Phase 5 mobile audit) + manual cross-browser walk. No Vitest/Jest/Playwright in this project. |
| Config file | `scripts/verify-build.sh`, `scripts/lighthouse-audit.sh` (Phase 5 build) |
| Quick run command | `bash scripts/verify-build.sh` (all 25 gates; expect ALL GREEN after Wave 1) |
| Full suite command | `bash scripts/verify-build.sh && bash scripts/lighthouse-audit.sh https://<prod-url>` |
| Phase gate | `06-VERIFICATION.md` sign-off (mirrors `05-VERIFICATION.md` template) before milestone v1.0 ships |

### Phase Requirements → Test Map

| SC | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|--------------|
| SC1 (HTTPS cert chain on caleblim.com) | `https://caleblim.com` resolves to Vercel deployment, valid Let's Encrypt cert, no warnings | smoke + manual | `curl -vI https://caleblim.com 2>&1 \| grep -E 'subject:\|issuer:\|HTTP/'` + browser visual | ❌ Wave 0 — add gate |
| SC1 (DNS resolution) | `dig +short caleblim.com @1.1.1.1` returns Vercel A IP | automated | `dig +short caleblim.com @1.1.1.1 \| grep -E '^76\.76\.21\.'` (or whichever IP Vercel assigned) | ❌ Wave 0 |
| SC1 (Vercel "Valid Configuration") | Vercel dashboard shows domain status green | manual checkpoint | Visual check in vercel.com/c-lb/caleb-lim-portfolio/settings/domains | n/a (UI) |
| SC2 (cross-browser end-to-end) | 5 routes × 4 browsers = 20 cells PASS | manual matrix | Recorded in `06-VERIFICATION.md` per-cell pass/fail | ❌ Wave 0 — add template |
| SC3 (Caleb adds-a-piece via GitHub.dev) | Caleb creates `src/content/pieces/<slug>/index.md` + hero asset in github.dev, commits, Vercel auto-deploys, piece visible on prod | manual end-to-end with screenshot capture | Caleb walks it; orchestrator captures screenshots | n/a (human task) |
| SC3 (README + numbered screenshots) | `README.md` at repo root renders on github.com; 5-8 screenshots under `docs/contributing/`; links resolve | smoke | `test -f README.md && grep -c 'docs/contributing/' README.md` | ❌ Wave 0 — add gate |
| SC4 (OG card + meta) | `public/og.png` exists 1200×630; `<meta property="og:image">` references absolute URL; LinkedIn Post Inspector renders card correctly | automated + manual | `test -f public/og.png && file public/og.png \| grep 1200x630` + manual Inspector visit | ❌ Wave 0 — add Gate 26a |
| SC4 (sitemap.xml present) | `dist/sitemap-index.xml` + `dist/sitemap-0.xml` exist after build; URLs use production domain | automated | `npm run build && test -f dist/sitemap-index.xml && test -f dist/sitemap-0.xml && grep -c 'caleblim.com\|caleb-lim-portfolio.vercel.app' dist/sitemap-0.xml` | ❌ Wave 0 — add Gate 26b |
| SC4 (robots.txt present) | `public/robots.txt` exists, references sitemap-index.xml URL | automated | `test -f public/robots.txt && grep -c 'Sitemap:' public/robots.txt` | ❌ Wave 0 — add Gate 26c |
| SC5 (D-05 detail-LCP <2s) | Lighthouse mobile on `/design/design-real-piece` returns LCP ms < 2000 | automated re-audit | `bash scripts/lighthouse-audit.sh https://caleblim.com` + `jq '.lcp_ms < 2000' lighthouse/design_design-real-piece-summary.json` | ✓ (lighthouse-audit.sh from Phase 5; re-uses existing harness) |
| SC5 (perf ≥80, a11y ≥95 — Phase 5 thresholds carried) | All 5 Lighthouse routes pass thresholds on prod domain | automated | Same script; `jq '.perf >= 80 and .a11y >= 95'` per summary.json | ✓ |
| SC6 (D-06 stragglers removed) | The three `transition: none` blocks no longer exist; reduced-motion walk on real iPhone passes | automated + manual | `! grep -nE '@media \(prefers-reduced-motion: reduce\)' src/components/StatusPill.astro \| grep -A1 transition` + 06-VERIFICATION reduced-motion walk | ❌ Wave 0 — add gate |
| SC6 (D-08 motion-by-motion table re-passes) | Same 9 motions Plan 05-08 verified — but #12, #16, #18 now ALSO fire (per D-06 exempt) | manual | iOS Reduce Motion ON + walk the 3 exempted surfaces; record in 06-VERIFICATION.md | n/a (manual) |

### Sampling Rate
- **Per task commit:** `bash scripts/verify-build.sh` (must stay GREEN throughout Wave 1)
- **Per wave merge:** `npm run build && bash scripts/verify-build.sh` + visual smoke at `npm run preview`
- **Phase gate:** Full suite + Lighthouse audit on production URL + cross-browser matrix + Caleb-driven dry run + sign off `06-VERIFICATION.md`

### Wave 0 Gaps

These verification artifacts don't exist yet and Wave 0 should create them before Wave 1 work begins:

- [ ] **`06-VERIFICATION.md`** — copy `05-VERIFICATION.md` template structure (SC sign-off table, Critical-Path Walk, Reduced-Motion Walk, Lighthouse Evidence anchors). Pre-fill SC1-SC6 rows for Phase 6.
- [ ] **Extend `scripts/verify-build.sh` with Gate 26** — single new gate with three sub-checks:
  - Gate 26a: `public/og.png` exists, is PNG, is 1200×630.
  - Gate 26b: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist after build.
  - Gate 26c: `public/robots.txt` exists and contains `Sitemap:` line.
- [ ] **Add to verify-build.sh: D-06 straggler absence gate** (Gate 27?) — `grep -c "transition: none"` against each of the three files; expect 0. Keeps regression-proof.
- [ ] **README.md scaffolding** — empty template at repo root with placeholders for the 5-8 numbered screenshot embeds. Filled in during Wave 3.
- [ ] **Cross-browser matrix template in 06-VERIFICATION.md** — 5×4 table (`/`, `/design`, `/design/<slug>`, `/about`, `/<bad>` 404 × iOS Safari / Android Chrome / desktop Safari / desktop Firefox), per-cell PASS/FAIL columns.
- [ ] **Domain availability check log** — a `06-VERIFICATION.md` row recording which domain was actually registered (`caleblim.com` or fallback) + date + registrar account.

### Manual checkpoints (cannot be automated)

- After domain registered → checkpoint with Caleb to confirm domain choice before locking
- After OG card rendered → visual checkpoint with Caleb before commit (brand-critical artifact)
- After README + screenshots drafted → checkpoint with Caleb before commit (he's the audience)
- Caleb-runs-it dry run → human-driven; orchestrator captures screenshots as it happens
- Cross-browser matrix → manual per cell, 5min each = ~100min total
- LinkedIn Post Inspector + Twitter card preview → orchestrator runs, Caleb sees the preview render

## Sources

### Primary (HIGH confidence)
- [docs.astro.build/en/guides/integrations-guide/sitemap/](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — `@astrojs/sitemap` install + config + dynamic-routes behavior
- [docs.astro.build/en/reference/modules/astro-assets/](https://docs.astro.build/en/reference/modules/astro-assets/) — `<Image>` `priority` / `widths` / `sizes` / `format` semantics
- [vercel.com/docs/domains/working-with-domains](https://vercel.com/docs/domains/working-with-domains) — custom-domain DNS + SSL provisioning
- [vercel.com/docs/git](https://vercel.com/docs/git) — auto-deploy default behavior (main → production, other branches → preview)
- [vercel.com/kb/guide/a-record-and-caa-with-vercel](https://vercel.com/kb/guide/a-record-and-caa-with-vercel) — A record IP pool for apex domains
- Phase 5 artifacts (HIGH — internal sources, verified by build):
  - `.planning/phases/05-mobile-performance-accessibility/05-04-PLAN.md` — splash + gallery + detail priority/sizes pattern
  - `.planning/phases/05-mobile-performance-accessibility/05-06-SUMMARY.md` — surgical reduced-motion policy + the three deferred stragglers (re-verified line numbers via grep 2026-05-20)
  - `.planning/phases/05-mobile-performance-accessibility/05-08-SUMMARY.md` — phase-exit verification template + Lighthouse rig
  - `.planning/phases/05-mobile-performance-accessibility/lighthouse/design_design-real-piece-summary.json` — baseline LCP 3121ms
  - `dist/design/design-real-piece/index.html` — verified hero `<img>` has `fetchpriority="high"` + `sizes` but NO `srcset` (the actual D-05 root cause)

### Secondary (MEDIUM confidence — WebSearch verified against official sources)
- [ogmagic.dev/blog/twitter-card-image-guide](https://ogmagic.dev/blog/twitter-card-image-guide) — Twitter card meta tag spec for 2026
- [myogimage.com/blog/og-image-size-meta-tags-complete-guide](https://myogimage.com/blog/og-image-size-meta-tags-complete-guide) — 1200×630 universal recommendation
- [krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide](https://krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide) — LinkedIn 7-day cache behavior
- [npmjs.com/package/@astrojs/sitemap](https://www.npmjs.com/package/@astrojs/sitemap) — version 3.7.2 verified via `npm view`

### Tertiary (LOW confidence — flagged in Assumptions Log)
- Vercel Anycast A-record IP `76.76.21.21` — verify in dashboard at add-time (A1)
- Twitter Card Validator URL status in 2026 (A4) — may be deprecated; OG-preview tools as fallback

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@astrojs/sitemap@3.7.2` verified on npm registry + official docs; site is already on Astro 5.18.1.
- Architecture: HIGH — patterns are direct reuse of Plan 05-04 (priority/widths/sizes) and Plan 05-06 (surgical reduced-motion); both shipped and verified in Phase 5.
- Pitfalls: HIGH — Cloudflare-proxy redirect loop, LinkedIn 7-day cache, DNS propagation latency are well-documented across multiple official + community sources.
- Detail-page LCP root cause: HIGH — verified by direct dist/ inspection 2026-05-20 (single `<img>`, no srcset, 1280×1600 native).
- Domain registration sequencing: MEDIUM — D-08 fallback chain is documented; actual availability of caleblim.com gets resolved on first execution task.

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (stable stack; only Astro version drift would invalidate the `@astrojs/sitemap` install instructions, and Astro maintains backward compatibility within 5.x)
