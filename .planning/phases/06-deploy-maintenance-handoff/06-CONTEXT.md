# Phase 6: Deploy & Maintenance Handoff - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning
**Mode:** mvp (carried from project default; this phase ships the v1.0 milestone)

<domain>

Get the site live on a custom domain with SEO/social hygiene, and prove FOUND-04's maintenance pitfall closed by Caleb personally shipping a new piece via GitHub.dev with no developer involvement.

This is the final phase before milestone v1.0 ships. Scope spans: (1) custom domain registration + DNS + HTTPS verification, (2) SEO/social asset bundle (OG card, sitemap, robots.txt), (3) cross-browser end-to-end verification, (4) Caleb-runs-it-himself maintenance proof, (5) two folded Phase 5 polish items (detail-page LCP, D-08 stragglers).

The host is **Vercel** (D-13 amended Phase 5, was Cloudflare Pages). Production is already live at `https://caleb-lim-portfolio.vercel.app` from `main` branch auto-deploys. Phase 6 work amounts to: register the domain → point DNS at Vercel → ship the SEO/handoff deliverables → record the dry run.

</domain>

<phase_boundary>

**In scope:**
- Domain registration (`caleblim.com` or confirmed fallback) + DNS configuration in Vercel + HTTPS / cert verification
- OG/Twitter card metadata + a single static OG image at `public/og.png` (cream-on-ink, 1200×630)
- `@astrojs/sitemap` integration + minimal hand-authored `robots.txt`
- Cross-browser end-to-end smoke (iPhone Safari, Android Chrome, desktop Safari, desktop Firefox)
- `README.md` + numbered screenshots documenting the Caleb-adds-a-piece flow
- Caleb-driven dry run: one new image-hero piece added end-to-end via GitHub.dev
- Detail-page LCP fix (Plan 05-09 §Deferred carryover — apply Plan 05-04's `priority`/`sizes` treatment to detail-page hero)
- Plan 05-06 stragglers fix (remove 3 per-source `transition: none` blocks in `StatusPill.astro`, `[category].astro`, `[slug].astro` that violate D-08)
- Amend ROADMAP §Phase 6 + REQUIREMENTS FOUND-04 to say Vercel (not Cloudflare Pages) — to be done with the CONTEXT.md commit

**Out of scope (defer to v1.1+ polish backlog):**
- PWA manifest / mask-icon / full PNG favicon set (squid-invader `favicon.svg` is canonical)
- Per-page generated OG cards (Satori / @vercel/og)
- CI Lighthouse budgets / automated regression gates
- Plausible / GA / any analytics
- Email contact form (mailto is canonical per Phase 4)
- 5+ piece backlog content authoring (project floors at 5; FOUND-05 closed in Phase 2)

</phase_boundary>

<implementation_decisions>

### Caleb-adds-a-piece maintenance proof (FOUND-04 SC3)
- **D-01:** **Walkthrough format = README + numbered screenshots.** Single `README.md` at repo root with 5–8 screenshots captured *during the actual dry run* (the dry run IS the documentation source). Renders on github.com/c-lb/caleb-lim-portfolio. Screenshots committed under `/docs/contributing/` (or similar — executor's discretion on path).
- **D-02:** **Depth = markdown frontmatter + image hero only.** The dry run covers the 70%-case piece: create `.md` under `src/content/pieces/`, set frontmatter (title, category, role, outcome, context, hero: image reference), drop a JPG/PNG into `src/assets/`, commit via GitHub.dev, push, watch Vercel auto-deploy. PDF rasterization flow gets a brief "see CONTRIBUTING.md" pointer (or a single inline paragraph in the README — executor's discretion) — NOT walked through in screenshots.

### SEO bundle (FOUND-04 SC4)
- **D-03:** **OG/Twitter card = single static cream-on-ink 1200×630 PNG at `public/og.png`.** Reused on every page via `<meta property="og:image">` in `src/layouts/Base.astro`. Card design carries the magazine-maximalist tokens (`--paper` cream, `--ink` near-black, one accent — executor picks from `--design` / `--teal` / `--terracotta` / `--lime`). Type uses Bricolage Grotesque (brand mark) + JetBrains Mono (tagline). No per-page specificity — the recruiter sharing a deep link is rare enough not to justify the Satori build cost. Twitter Card metadata uses `summary_large_image`.
- **D-04:** **Sitemap = `@astrojs/sitemap` integration (auto-generated at build).** Add the integration to `astro.config.mjs`. Site URL = production custom domain (or `caleb-lim-portfolio.vercel.app` until domain lives). Hand-author `public/robots.txt` with `User-agent: *` / `Allow: /` / `Sitemap: <full-url>/sitemap-index.xml`.
- **Favicon NOT in scope.** The existing `public/favicon.svg` (squid invader) is canonical. No new favicon files, no PWA manifest, no mask-icon, no full PNG set.

### Phase 5 carryover fold-ins
- **D-05:** **Detail-page LCP fix is in scope.** Plan 05-08 measured 3121ms on `/design/design-real-piece` vs splash's 1671ms. Root cause likely: the PDF-rasterized hero PNG is un-optimized (no `priority`, no `sizes`, possibly large file). A focused plan applies Plan 05-04's pattern (`priority="high"` / `loading="eager"` / explicit `sizes`) to the detail-page hero `<Image>` in `src/pages/[category]/[slug].astro`. Target: detail-page LCP <2s. Re-audit via `bash scripts/lighthouse-audit.sh <prod-url>` after deploy.
- **D-06:** **Plan 05-06 stragglers fix is in scope.** Remove these three per-source `transition: none` blocks that contradict D-08 exempt classifications #12 (StatusPill hover scale), #16 (back-pill color), #18 (pager color):
  - `src/components/StatusPill.astro:77-80` — `.pill { transition: none; }` + `.pill:hover { transform: none; }` under `@media (prefers-reduced-motion: reduce)`
  - `src/pages/[category].astro:136-138` — `.b-cat-back { transition: none; }` under `@media (prefers-reduced-motion: reduce)`
  - `src/pages/[category]/[slug].astro:320-322` — `.pager-link { transition: none; }` under `@media (prefers-reduced-motion: reduce)`
  Re-verify with the same desktop reduced-motion walk Plan 05-06 used. Closes D-08 cleanly before milestone v1.0 ships.
- **D-07:** **Amend ROADMAP §Phase 6 + REQUIREMENTS FOUND-04 to say Vercel.** Both currently reference Cloudflare Pages / Cloudflare Registrar — stale per D-13 amendment. Edits applied in the same commit as this CONTEXT.md. Pattern matches the 2026-05-18 FOUND-03 amendment block (inline amendment note + date).

### Claude's discretion (not user-discussed; defaulted from project conventions)

- **D-08:** **Domain registrar = Cloudflare Registrar** for `caleblim.com` (~$10/yr at-cost; PROJECT.md original plan). Fallback order if unavailable: `caleblim.co` → `caleb.work` → `caleblimkr.com` (middle-name variant). Executor runs the availability check as the first task; if `caleblim.com` is available, register it; otherwise walk down the fallback list and surface the result as a checkpoint for Caleb to confirm before locking the registration. **Alternative path:** Vercel Domains (one-click via Vercel dashboard, ~$15/yr — slightly more expensive but eliminates the Cloudflare→Vercel DNS-pointer step). If Caleb prefers Vercel Domains during the registrar checkpoint, executor switches paths.
- **D-09:** **Cross-browser test matrix = the four browsers explicit in ROADMAP SC2:** iPhone Safari (iPhone 15 / iOS 26.4.2 per Phase 5 rig), Android Chrome (Caleb's available Android device or a BrowserStack/lambdatest free-tier session — executor's discretion), desktop Safari (Mac), desktop Firefox (Mac). Test recorded in `06-VERIFICATION.md` with per-browser pass/fail per the same critical-path walk Plan 05-08 used. No automation — manual smoke only.
- **D-10:** **Walkthrough screenshots live under `/docs/contributing/` or similar** — executor's choice of exact path. README.md at repo root references them via relative paths.
- **D-11:** **OG card design execution** — executor authors the card in any tool (Figma export, hand-coded Satori one-off, Photoshop, etc.). Constraints: 1200×630, cream `--paper` background, ink `--ink` "CALEB LIM" brand mark in Bricolage Grotesque, an accent color from the existing palette, optional tagline in JetBrains Mono. Source file (Figma URL or `.psd`) noted in `06-VERIFICATION.md` for future re-renders.

</implementation_decisions>

<canonical_refs>

### Project foundation
- `.planning/PROJECT.md` — Project value, constraints, key decisions. **Note:** Constraints section already says Vercel Hobby (amended 2026-05-18); FOUND-04 row in REQUIREMENTS still says Cloudflare Pages — fixed by D-07.
- `.planning/REQUIREMENTS.md` — Full requirements list. FOUND-04 is the Phase 6 anchor and is the only un-validated requirement (25/26 already complete). Amendment per D-07 will land this commit.
- `.planning/ROADMAP.md` §"Phase 6: Deploy & Maintenance Handoff" — Goal + 4 SCs. Mode: mvp. Amendment per D-07 will land this commit (Cloudflare Pages → Vercel in goal text + SC1).
- `.planning/STATE.md` — Current Position; Phase 5 complete, Phase 6 in discuss.

### Phase 5 carryover artifacts (must read before planning)
- `.planning/phases/05-mobile-performance-accessibility/05-08-SUMMARY.md` §Deferred — detail-page LCP + Vercel branch-alias slug + D-08 stragglers (carried by D-05 / D-06 / informational)
- `.planning/phases/05-mobile-performance-accessibility/05-06-SUMMARY.md` §Out-of-Scope Findings — the 3 `transition: none` blocks listed in D-06 with exact file:line refs
- `.planning/phases/05-mobile-performance-accessibility/05-09-SUMMARY.md` — Splash a11y gap closure (recent reference for similar focused-fix pattern Plan 06-XX detail-LCP can mirror)
- `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` — SC sign-off template Plan 06-XX verification mirrors
- `.planning/phases/05-mobile-performance-accessibility/lighthouse/design_design-real-piece-summary.json` — baseline detail-page audit (perf 94 / a11y 100 / LCP 3121ms)

### Implementation files Phase 6 will touch
- `src/layouts/Base.astro` — add OG/Twitter meta tags + canonical URL + site title metadata
- `astro.config.mjs` — add `@astrojs/sitemap` integration + site URL
- `public/robots.txt` — new (hand-authored)
- `public/og.png` — new (1200×630, cream-on-ink, magazine-maximalist)
- `src/pages/[category]/[slug].astro` — detail-page hero `<Image>` gets `priority` + `sizes` (D-05)
- `src/components/StatusPill.astro` — drop reduced-motion `transition: none` block lines 77-80 (D-06)
- `src/pages/[category].astro` — drop reduced-motion `transition: none` block lines 136-138 (D-06)
- `src/pages/[category]/[slug].astro` — drop reduced-motion `transition: none` block lines 320-322 (D-06)
- `README.md` — new (repo root, walkthrough doc + screenshots)
- `/docs/contributing/` (or equivalent path) — new directory for the 5-8 walkthrough screenshots
- `package.json` — add `@astrojs/sitemap` dep

### Build verification harness (do not regress)
- `scripts/verify-build.sh` — 25 gates (Phase 1–5). Phase 6 may add a Gate 26 (sitemap.xml + robots.txt + og.png all present in `dist/`) — planner's discretion.
- `scripts/lighthouse-audit.sh` — re-run against detail page after D-05 fix; expect detail LCP <2s post-fix.

### External references
- Vercel dashboard: https://vercel.com/c-lb/caleb-lim-portfolio (already live; domain settings here)
- GitHub repo: https://github.com/C-lb/caleb-lim-portfolio
- Current production URL: https://caleb-lim-portfolio.vercel.app (no Deployment Protection)
- Cloudflare Registrar (target for `caleblim.com`): https://dash.cloudflare.com/?to=/:account/registrar
- LinkedIn Post Inspector (OG verify): https://www.linkedin.com/post-inspector/
- `@astrojs/sitemap` docs: https://docs.astro.build/en/guides/integrations-guide/sitemap/

</canonical_refs>

<deferred>

Captured from discussion + Phase 5 carryover review, NOT acted on in Phase 6:

- **Per-page Satori-generated OG cards** — rejected D-03 alternative. Reconsider in v1.1 if LinkedIn deep-link sharing becomes a measured use case.
- **Full favicon set + PWA manifest + mask-icon** — squid-invader SVG is canonical. Add only if a recruiter actually adds the site to their iOS home screen and reports a bad icon.
- **Hand-authored sitemap.xml** — rejected D-04 alternative; the manual-update maintenance pitfall it creates is exactly what FOUND-04 guards against.
- **Vercel Domains as primary registrar** — D-08 fallback path; surfaces as registrar checkpoint, not a default.
- **Automated Lighthouse CI gate** — surfaced in Phase 5 D-16 as a v1.1 candidate. Stays deferred.
- **Email contact form** — `mailto:` is canonical (PROJECT.md, Phase 4). Out of scope.
- **Plausible / GA / analytics** — Out of scope per PROJECT.md "free or near-free" constraint and zero-recruiter-data preference.
- **Branch-alias Vercel `<scope>` slug discovery** — will surface naturally on the first non-`main` branch push during Phase 6 work; not a discrete task.

</deferred>

<scope_fence>

**If during planning or execution something surfaces that is not covered above, treat it as scope creep and defer.** Specifically:

- New page templates, new content types, new visual surfaces → deferred to v1.1
- Analytics / tracking / consent — out of scope; do not add
- Per-page OG card generation — D-03 rejected; if user re-raises, add to v1.1 backlog
- Favicon expansion — out of scope per user input 2026-05-20; if user re-raises with a specific browser failure, then in-scope
- Performance-perf beyond detail-page LCP (D-05) — splash and gallery are already SC2-green; do not re-tune
- Domain alternatives beyond the D-08 fallback chain — checkpoint with user before pivoting

</scope_fence>
