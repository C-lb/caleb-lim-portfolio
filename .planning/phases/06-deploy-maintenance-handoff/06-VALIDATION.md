---
phase: 06
slug: deploy-maintenance-handoff
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `06-RESEARCH.md` § Validation Architecture (HIGH confidence).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bash gates (`scripts/verify-build.sh` — 25 gates carried from Phase 1-5) + Lighthouse harness (`scripts/lighthouse-audit.sh`) + manual cross-browser walk. No Vitest / Jest / Playwright in this project. |
| **Config file** | `scripts/verify-build.sh`, `scripts/lighthouse-audit.sh` |
| **Quick run command** | `bash scripts/verify-build.sh` (all gates) |
| **Full suite command** | `bash scripts/verify-build.sh && bash scripts/lighthouse-audit.sh https://<prod-url>` |
| **Estimated runtime** | ~30s build gates, ~90s Lighthouse per route × 5 routes |

---

## Sampling Rate

- **After every task commit:** Run `bash scripts/verify-build.sh` (must stay GREEN throughout Wave 1)
- **After every plan wave:** Run `npm run build && bash scripts/verify-build.sh` + visual smoke at `npm run preview`
- **Before `/gsd:verify-work`:** Full suite + Lighthouse audit on production URL + cross-browser matrix + Caleb-driven dry run + sign off `06-VERIFICATION.md`
- **Max feedback latency:** ~30s for the build gate; ~90s per route for Lighthouse

---

## Per-Task Verification Map

> Populated by execute-phase as plans are written. Initial seed from RESEARCH § Phase Requirements → Test Map.

| Task ID | Plan | Wave | SC / Req | Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|----------|----------|-----------|-------------------|-------------|--------|
| TBD | 06-00 | 0 | scaffold | Add Gate 26a/b/c + Gate 27 to verify-build.sh; create 06-VERIFICATION.md from 05 template | smoke | `bash scripts/verify-build.sh` (expect new gates RED until satisfied) | ❌ Wave 0 | ⬜ pending |
| TBD | TBD | 1 | SC4 (OG card) | `public/og.png` exists, 1200×630 PNG | automated | `test -f public/og.png && file public/og.png \| grep 1200x630` | ❌ Wave 0 → Wave 1 fills | ⬜ pending |
| TBD | TBD | 1 | SC4 (sitemap) | `dist/sitemap-index.xml` + `dist/sitemap-0.xml` after build, URLs reference site | automated | `npm run build && test -f dist/sitemap-index.xml && grep -c '<loc>' dist/sitemap-0.xml` | ❌ Wave 0 → Wave 1 fills | ⬜ pending |
| TBD | TBD | 1 | SC4 (robots.txt) | `public/robots.txt` exists, has `Sitemap:` line | automated | `test -f public/robots.txt && grep -c 'Sitemap:' public/robots.txt` | ❌ Wave 0 → Wave 1 fills | ⬜ pending |
| TBD | TBD | 1 | SC5 (detail LCP) | Lighthouse mobile on `/design/design-real-piece` LCP < 2000ms after adding `widths` array | automated | `bash scripts/lighthouse-audit.sh <url> && jq '.lcp_ms < 2000' lighthouse/design_design-real-piece-summary.json` | ✓ harness from Phase 5 | ⬜ pending |
| TBD | TBD | 1 | SC6 (D-06 stragglers) | The three `transition: none` blocks no longer exist; reduced-motion walk passes | automated + manual | Gate 27: `! grep -nE 'transition:\s*none' src/components/StatusPill.astro src/pages/\[category\].astro src/pages/\[category\]/\[slug\].astro` | ❌ Wave 0 → Wave 1 satisfies | ⬜ pending |
| TBD | TBD | 2 | SC1 (DNS + HTTPS) | `dig +short caleblim.com` returns Vercel A IP; `curl -vI https://caleblim.com` shows valid Let's Encrypt cert | automated + manual checkpoint | `dig +short caleblim.com @1.1.1.1` + `curl -vI https://caleblim.com 2>&1 \| grep -E 'subject:\|issuer:\|HTTP/'` | ❌ Wave 2 creates | ⬜ pending |
| TBD | TBD | 2 | SC1 (Vercel config) | Vercel dashboard shows domain status "Valid Configuration" | manual checkpoint | Visual check in vercel.com dashboard | n/a (UI) | ⬜ pending |
| TBD | TBD | 3 | SC2 (cross-browser) | 5 routes × 4 browsers = 20 cells PASS | manual matrix | Recorded in `06-VERIFICATION.md` per-cell | ❌ Wave 0 template | ⬜ pending |
| TBD | TBD | 3 | SC3 (GitHub.dev dry run) | Caleb creates `src/content/pieces/<slug>/index.md` + hero in github.dev, commits, Vercel auto-deploys, piece visible on prod | manual end-to-end with screenshot capture | Human task — orchestrator captures screenshots | n/a (human) | ⬜ pending |
| TBD | TBD | 3 | SC3 (README) | `README.md` at repo root renders on github.com; screenshots under `docs/screenshots/caleb-adds-a-piece/` (D-09); links resolve | smoke | `test -f README.md && grep -c 'docs/screenshots/' README.md` | ❌ Wave 3 creates | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **`06-VERIFICATION.md`** — copy `05-VERIFICATION.md` template structure (SC sign-off table, Critical-Path Walk, Reduced-Motion Walk, Lighthouse Evidence anchors). Pre-fill SC1-SC6 rows for Phase 6.
- [ ] **Extend `scripts/verify-build.sh`:**
  - Gate 26a: `public/og.png` exists, is PNG, is 1200×630
  - Gate 26b: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist after build
  - Gate 26c: `public/robots.txt` exists and contains `Sitemap:` line
  - Gate 27: D-06 straggler absence — `! grep -nE 'transition:\s*none' src/components/StatusPill.astro src/pages/\[category\].astro src/pages/\[category\]/\[slug\].astro` returns nothing
- [ ] **README.md scaffolding** — empty template at repo root with placeholders for 5-8 numbered screenshot embeds (filled during Wave 3)
- [ ] **Cross-browser matrix template in `06-VERIFICATION.md`** — 5×4 table (`/`, `/design`, `/design/<slug>`, `/about`, `/<bad>` 404 × iOS Safari / Android Chrome / desktop Safari / desktop Firefox), per-cell PASS/FAIL columns
- [ ] **Domain availability check log** — row in `06-VERIFICATION.md` recording which domain was actually registered (`caleblim.com` or D-08 fallback) + date + registrar account

---

## Manual-Only Verifications

| Behavior | SC | Why Manual | Test Instructions |
|----------|----|-----------|-------------------|
| Domain availability check + registration | SC1 | Registrar-side interactive flow | Cloudflare Registrar search for `caleblim.com` → if taken walk D-08 fallback chain (caleblim.co → caleb.work → caleblimkr.com) → register → record in 06-VERIFICATION |
| Vercel domain "Valid Configuration" green state | SC1 | Vercel dashboard UI | Visit vercel.com/c-lb/caleb-lim-portfolio/settings/domains after DNS records added; wait until status = "Valid Configuration" (typically <60s) |
| OG card visual sanity (cream-on-ink, 1200×630) | SC4 | Brand-critical artifact | Show Caleb the rendered PNG before commit; capture his approval in 06-VERIFICATION |
| LinkedIn Post Inspector preview | SC4 | Tool is web-form-driven | `https://www.linkedin.com/post-inspector/` → enter caleblim.com → capture screenshot of rendered card; note LinkedIn's 7-day cache means first preview may show subdomain card |
| Twitter Card Validator preview | SC4 | Tool is web-form-driven (and may be deprecated 2026 — see RESEARCH A4 fallback) | `https://cards-dev.twitter.com/validator` if still live; otherwise use `https://www.opengraph.xyz/url/` as fallback |
| Caleb-adds-a-piece dry run | SC3 | Inherent human task — that's the SC | Caleb opens repo at github.dev → creates `src/content/pieces/<category>/<slug>/index.md` with frontmatter → uploads hero image to `public/pieces/<slug>/` → commits to main → watches Vercel deploy → visits prod URL → confirms piece visible; orchestrator captures numbered screenshots throughout |
| Cross-browser matrix (5 routes × 4 browsers) | SC2 | No Playwright in project; manual walks per Phase 5 rig | Per cell: load route, confirm no console errors, sanity-check visuals, exercise critical interactions (gallery click, detail page open, scroll, back button); ~5min × 20 cells ≈ 100min total |
| Reduced-motion walk after D-06 straggler removal | SC6 | Requires real device with iOS Reduce Motion ON | iPhone 15 / iOS 26.4.2 → Settings → Accessibility → Motion → Reduce Motion ON → walk the 3 previously-exempt surfaces (StatusPill animation, category page transition, detail page hover) → confirm no motion fires |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Gate 26a/b/c, Gate 27, 06-VERIFICATION.md, README scaffold)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for build gates (Lighthouse is per-route, ~90s each — acceptable for phase-exit)
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0 lands

**Approval:** pending
