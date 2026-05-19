---
phase: 04
slug: navigation-secondary-surfaces
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-18
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Phase 4 ships build-time static HTML changes only — no runtime input, no auth, no
server. Threat surface is two outbound link boundaries (LinkedIn, mailto) plus
one build-time content-collection boundary (Caleb-authored .md frontmatter).
The threat model in each of the three plan files was authored at plan time;
this audit verifies every declared mitigation in built code (read-only).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| origin (caleblim.com) → linkedin.com | User-initiated outbound navigation in a new tab (Plan 04-01 header + Plan 04-03 About contact block) | Click handoff; opener-tab handle + Referer header risk |
| origin (caleblim.com) → user MUA | Mailto handoff (Plan 04-01 header + Plan 04-03 About contact block) | mailto URI handed to local mail client; published email address exposed to crawlers |
| build-time content collection → static HTML | Caleb-authored `src/content/pieces/*/index.md` frontmatter flows into HTML attrs at build time | `category`, `order`, `title`, `draft` consumed by `getStaticPaths` |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Tampering | LinkedIn anchor in header (Base.astro) — reverse tabnabbing via `window.opener` rebind | mitigate | `rel="noopener"` literal in `src/layouts/Base.astro:36`; Gate 20 in `scripts/verify-build.sh:686–739` enforces site-wide noopener token in every `target="_blank"` anchor's `rel` value | closed |
| T-04-02 | Information disclosure | LinkedIn anchor in header — Referer header leaks current page URL to linkedin.com | mitigate | `rel="noreferrer"` literal in `src/layouts/Base.astro:36`; same Gate 20 enforces noreferrer site-wide | closed |
| T-04-03 | Information disclosure | mailto link broadcasts the personal email address to view-source crawlers / spam scrapers | accept | Accepted — see Accepted Risks Log (R-04-A). Obfuscation breaks no-JS recruiters + screen readers; Gmail/SMU spam filter is the operative defense |
| T-04-04 | Tampering | Resume PDF link (`<a href="/caleb-lim-resume.pdf" download>`) — `download` attribute silently no-ops if asset is ever moved off-origin | mitigate | Resource lives same-origin under `public/caleb-lim-resume.pdf`; `download` attribute literal in `src/layouts/Base.astro:37` and `src/pages/about.astro:60`. No active Phase-4 control needed; Pitfall P-5 documented for Phase 6 deploy review (future-trap, not a current vuln) | closed |
| T-04-05 | Spoofing (a11y) | `aria-current="false"` would be announced gratuitously by screen readers on every non-splash route | mitigate | `aria-current={isHome ? 'page' : undefined}` in `src/layouts/Base.astro:32` — Astro 5 drops `undefined`-valued attributes (Pitfall P-4); Gate 19f at `scripts/verify-build.sh:666–668` greps every built page for the literal `aria-current="false"` and fails on any match. Source-scan confirms no occurrence | closed |
| T-04-06 | Tampering | Detail-pager href cross-discipline injection — if `piece.data.category` were ever attacker-controlled, pager links could escape the discipline scope | accept | Accepted — see Accepted Risks Log (R-04-B). Content is Caleb-authored; Zod schema in `src/content.config.ts` enforces `category: z.enum(CATEGORIES)`; Gate 21c in `scripts/verify-build.sh` is the post-build belt-and-braces (every pager href must start with `/<current-cat>/`) | closed |
| T-04-07 | Information disclosure | Build-time-leaked draft pieces appearing in prev/next neighbour chain | mitigate | Literal `({ data }) => data.draft !== true` predicate in `src/pages/[category]/[slug].astro:19` filters draft pieces from the byCategory grouping before sort + findIndex (Pattern S4 — matches `[category].astro:13` verbatim, NOT `!data.draft` which would also drop undefined) | closed |
| T-04-08 | Denial of service (build-time) | Infinite loop in Gate 22 next-chain walk if a future bug emits a self-referential pager | mitigate | `max_iters=20` cap on the `while` loop at `scripts/verify-build.sh:823–824` plus explicit `[[ "$next_slug" == "$current" ]] && break` self-loop guard. Belt-and-braces — caps wall-clock at 20 iterations even if both guards fail | closed |
| T-04-09 | Tampering | LinkedIn anchor in About contact block — reverse tabnabbing (second occurrence on site) | mitigate | `rel="noopener"` literal in `src/pages/about.astro:74`; Gate 20 enforces site-wide | closed |
| T-04-10 | Information disclosure | LinkedIn anchor in About contact block — Referer leak (second occurrence) | mitigate | `rel="noreferrer"` literal in `src/pages/about.astro:74`; Gate 20 enforces site-wide | closed |
| T-04-11 | Information disclosure | mailto address exposed in About contact block (second occurrence — header + About) | accept | Accepted — same risk profile as R-04-A. Scrapers index pages, not occurrences; doubling the surface from 1 to 2 occurrences per page does not materially change the spam vector |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-04-A | T-04-03, T-04-11 | Mailto address is published openly in header + About contact block. Obfuscation (JS-encoded mailto / "click to reveal") would break no-JS recruiters and screen readers; the UX cost is higher than the marginal spam reduction. Inbox-side spam filtering (Gmail / SMU) is the operative defense. Note: the implemented mailto (`caleb.lim.2024@smu.edu.sg`) differs from the plan-time value (`caleblimster@gmail.com`) — the risk profile is identical (public mailto exposure) and the accept disposition carries over unchanged. | David Chin (project owner) | 2026-05-18 |
| R-04-B | T-04-06 | Pager href cross-discipline injection presumes attacker control over `piece.data.category`. The actor model is "Caleb commits markdown" — no third-party input ever enters the build. Zod `z.enum(CATEGORIES)` fails the build on invalid categories. Gate 21c provides a post-build cross-check. Accepting because the threat presupposes a trust-boundary violation that does not exist in the deployed architecture (no PR-from-stranger flow, no CMS write path). | David Chin (project owner) | 2026-05-18 |

---

## Unregistered Flags

The Phase 4 inline UAT additions (smile SVG icon in `src/pages/index.astro`,
role-link click handler triggering card-shake in `index.astro` +
`DisciplineCard.astro`, site-wide SVG favicon at `public/favicon.svg` referenced
from `src/layouts/Base.astro:26`) appeared after the plan-time threat register
was authored. Audit assessment:

- **Smile SVG** — inline static SVG, no external network, no event handlers, no `<script>` injection vector. No new threat surface.
- **role-link click handler** — same-origin in-document anchor navigation + CSS class toggle for the card-shake animation. No new outbound boundary, no input handling.
- **Favicon SVG** — same-origin static asset under `public/`. SVG file inspected: pure path/rect markup, no embedded `<script>`, no `foreignObject`, no external `xlink:href`. Astro serves it as `image/svg+xml` via `<link rel="icon">`; the browser sandboxes favicon SVGs (no script execution). No new threat surface.

None of these flags map to a new STRIDE category requiring registration. Logged here for traceability per the unregistered-flag convention.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-18 | 11 | 11 | 0 | gsd-security-auditor (Claude Opus 4.7 1M) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (R-04-A, R-04-B)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-18
