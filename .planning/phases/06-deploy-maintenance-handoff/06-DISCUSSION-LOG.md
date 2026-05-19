# Phase 6 — Discussion Log

**Session date:** 2026-05-20
**Tool:** `/gsd-discuss-phase 6`
**Areas presented:** 4
**Areas discussed:** 3 (Caleb-adds-a-piece walkthrough; SEO bundle; Phase 5 carryover fold-in)
**Areas defaulted (Claude's discretion):** 1 (Domain + registrar — locked to Cloudflare Registrar for `caleblim.com` with fallback chain)

---

## Area presentation (multiSelect)

> Phase 6 (Deploy & Maintenance Handoff). Picks tagged with [user] were selected for deep-dive; the remainder defaulted.

| Area | Outcome |
|------|---------|
| Domain + registrar | [defaulted to Cloudflare Registrar; fallback chain locked in CONTEXT D-08] |
| Caleb-adds-a-piece walkthrough | [user] |
| SEO bundle (meta + favicons + sitemap + robots) | [user] |
| Phase 5 carryover fold-in | [user] |

---

## Area 1 — Caleb-adds-a-piece walkthrough

### Q1: Format
- Options: README + numbered screenshots / README + 2–3min Loom / README + both
- **Selected: README + numbered screenshots** (recommended)
- Rationale (Claude's framing accepted by user): durable artifact, lives in git, renders on github.com, no third-party dependency that could rot. Cost ~30min of screenshot capture during the dry run.

### Q2: Depth
- Options: markdown + image hero only / full coverage incl. PDF rasterization / image only + separate CONTRIBUTING.md for PDFs
- **Selected: markdown frontmatter + image hero only** (recommended)
- Rationale (Claude's framing accepted): covers the 70%-case piece; PDF flow gets a pointer note. Keeps the dry run scoped — FOUND-04 closes by demonstrating *one* end-to-end success, not by exhausting every path.

→ Locked as D-01, D-02 in 06-CONTEXT.md.

---

## Area 2 — SEO bundle

### Mid-session correction
- Initial AskUserQuestion call included a favicon-scope question. User interrupted: "It already has a favicon on the browser tab of squid invader."
- `public/favicon.svg` confirmed canonical. Favicon question dropped; re-asked the remaining two only. **Decision: no new favicon files, no PWA manifest, no mask-icon.** Surfaced in scope_fence in CONTEXT.md.

### Q3: OG/Twitter card strategy
- Options: single static cream-on-ink card / per-page Satori-generated / per-page hand-crafted PNGs
- **Selected: single static cream-on-ink card** (recommended)
- Rationale: portfolio-scale recruiter rarely deep-links; per-page Satori is ~2hrs setup for marginal benefit; static stays perfectly on-brand and adds zero dependency.

### Q4: Sitemap + robots.txt
- Options: `@astrojs/sitemap` integration + minimal robots.txt / hand-authored / skip both
- **Selected: `@astrojs/sitemap` integration + minimal robots.txt** (recommended)
- Rationale: auto-generation survives content changes without manual updates — same maintenance pitfall FOUND-04 guards against. ~5min setup. Hand-authored alternative was rejected for the same reason.

→ Locked as D-03, D-04 in 06-CONTEXT.md.

---

## Area 3 — Phase 5 carryover fold-in

### Q5: Detail-page LCP 3121ms
- Options: fold into Phase 6 plan / defer / spike inline
- **Selected: fold a Phase 6 plan to fix it** (recommended)
- Rationale: root cause is likely a one-line `priority` / `sizes` add on the detail-page hero, mirroring Plan 05-04's splash treatment; ~30min plan + re-audit. Recruiters clicking through to a specific piece shouldn't hit a visibly-slow hero.

### Q6: Plan 05-06 stragglers (3 `transition: none` blocks)
- Options: fold into Phase 6 / defer to v1.1 polish backlog
- **Selected: fold into Phase 6** (recommended)
- Rationale: ~15min work; closes D-08 cleanly before milestone v1.0 ships. Three exact `file:line` refs are already documented in 05-06-SUMMARY.

### Q7: ROADMAP + REQUIREMENTS doc rot (Cloudflare → Vercel)
- Options: amend now in CONTEXT commit / defer to planning / document drift only
- **Selected: amend now as part of 06-CONTEXT.md** (recommended)
- Rationale: keeps source-of-truth docs honest going into planning; matches the FOUND-03 amendment pattern from 2026-05-18.

→ Locked as D-05, D-06, D-07 in 06-CONTEXT.md.
→ Doc amendments applied in the same commit as this CONTEXT.md.

---

## Claude's discretion items (not asked; documented for traceability)

- **D-08:** Domain registrar default = Cloudflare Registrar for `caleblim.com` (~$10/yr). Fallback chain: `caleblim.co` → `caleb.work` → `caleblimkr.com`. Vercel Domains is the alternative path if Caleb prefers it during the registrar checkpoint.
- **D-09:** Cross-browser matrix per ROADMAP SC2 = iPhone Safari (iPhone 15 / iOS 26.4.2 per Phase 5 rig), Android Chrome (executor's discretion on device source), desktop Safari, desktop Firefox.
- **D-10:** Walkthrough screenshots path under `/docs/contributing/` or executor's preferred path.
- **D-11:** OG card design tool = executor's discretion (Figma export / hand-coded Satori one-off / Photoshop).

---

## Deferred items captured

- Per-page Satori-generated OG cards (D-03 alternative)
- Full PNG favicon set + PWA manifest + mask-icon (out of scope per user)
- Hand-authored sitemap.xml (D-04 alternative; rejected for maintenance reasons)
- Vercel Domains as primary registrar (D-08 alternative; surfaces as checkpoint, not default)
- Automated Lighthouse CI gate (Phase 5 D-16 carryover)
- Email contact form (mailto canonical per PROJECT.md / Phase 4)
- Plausible / GA / analytics (out of scope per PROJECT.md "free or near-free" constraint)
- Branch-alias Vercel `<scope>` slug discovery (will surface naturally on first non-`main` push)
