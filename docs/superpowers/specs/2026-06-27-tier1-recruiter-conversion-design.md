# Tier 1 — Recruiter conversion pass

Date: 2026-06-27
Status: design approved, pending written-spec review

## Why

The site's job (per CLAUDE.md): a recruiter from any of the analyst / brand /
marketing / design worlds self-selects into the work relevant to *their* role
and walks away convinced, in under a minute. The splash and the first category
page are the highest-stakes screens. Three things currently undercut that:

1. **Category pages don't scale down.** `Gallery.astro` is a 12-col grid where
   each piece spans 4 columns. With one piece (design, finance, saas all have
   exactly 1) that's a single card beside 8 empty columns — reads as
   "unfinished," which kills the pitch harder than any styling issue.
2. **Above-the-fold doesn't signpost.** The hero is charming but the "About Me"
   copy is vibe, not value. A brand or analyst recruiter can't tell in five
   seconds "this room is for me."
3. **No share credibility.** Pasting the link into an email or LinkedIn DM
   renders a bare URL, not a preview card.

This spec covers Tier 1 only. Tier 2 (case-study project pages, filling the
`personal` room) and Tier 3 (motion, dark mode, hero cleanup) are deferred and
reassessed after Tier 1 ships.

## Locked decisions

- **Mixed content reality.** Categories will hold anywhere from 0 to many
  pieces. The category layout must look deliberate at every count, not just
  when full.
- **Pragmatic anti-vibecode.** Keep the editorial identity (serif italic accent
  via Fraunces, UPPERCASE display headers, one accent per discipline room).
  Apply anti-vibecode to the *mechanics*: button tiers with the full state set,
  soft diffuse shadows, 2:1 button padding, single accent fill per view,
  semantic colour for status only, feedback/loading on actions, plain copy with
  no em dashes. New Tier 1 elements are built against the existing token sheet
  (`src/styles/tokens.css`). This is a deliberate, documented divergence from
  strict anti-vibecode (which forbids serif and ALL-CAPS); CLAUDE.md requires
  the expressive face.
- **Empty room: keep but redeem.** The `personal` room stays clickable from the
  splash. The stub copy is rewritten so it reads as an honest, deliberate note
  with strong links to populated rooms — not "this room is still being hung."

## Scope — four workstreams

### A. Count-aware category layout (the centerpiece)

Replace the one-grid-fits-all body of `src/pages/[category].astro` (currently
either the coming-soon stub or a flat `Gallery`) with a layout that branches on
piece count `n`:

- **n === 0** → redeemed stub (workstream D copy). Single raised panel, honest
  note, accent-filled links to the rooms that have work. (Largely the existing
  `.b-coming` block; copy + framing change only.)
- **n === 1** → **featured card**: large hero image and the piece's
  title / role / context / outcome set beside it (image left, text right on
  desktop; stacked on mobile), filling the content column. Reads as a chosen
  highlight. Whole card links to the piece page.
- **n === 2** → two half-width cards (span 6 each), larger thumbs than the grid
  tile. No empty column.
- **n >= 3** → first piece in the featured-wide treatment (span 12 banner),
  remaining pieces in the existing 3-across grid (`Gallery`, unchanged for the
  tail).

Implementation: a new `FeaturedPiece.astro` component for the 1-piece and
lead-piece treatments; `[category].astro` selects the arrangement by `n`;
`Gallery.astro` is reused as-is for the 3+ tail. Existing tokens, accent var,
hover/focus/reduced-motion patterns carried over verbatim.

Acceptance: visit each of `/design`, `/finance`, `/saas` (n=1) — no empty
column, card fills the width deliberately. `/personal` (n=0) — redeemed stub.
Temporarily add a draft piece to confirm the 2- and 3+ arrangements render
without empty columns, then remove it (or verify via a stub fixture).

### B. Above-the-fold signposting (home)

In `src/pages/index.astro`:

- Replace the vague "About Me" body with one plain positioning line plus a
  mapping that lets a recruiter tie each room to a kind of role
  (design → brand / visual, finance → analyst, saas → product / build,
  personal → range). Tone stays human; no em dashes; sentence case in body.
- The four discipline cards already carry "view the work" cues — confirm each
  card's label reads as "this is the pile for *your* job," tightening copy only,
  not restructuring the card grid.
- The discipline-label stamps over the hero portrait are noise — *deferred to
  Tier 3*, not touched here (listed so it isn't forgotten).

Acceptance: a first-time reader can state, after five seconds above the fold,
which of the four rooms maps to their role. Copy contains no em dashes.

### C. Share / credibility plumbing

- Add per-page Open Graph + Twitter meta to `src/layouts/Base.astro` (title,
  description, type, url, image), driven by props so each page can override.
  Category and piece pages pass their own title/description.
- Add one static OG image at `public/og-default.png` (1200x630) referenced as
  the default. Per-piece OG images are out of scope for Tier 1 (a single strong
  default is enough to stop the bare-URL problem).
- Verify (do not rebuild) that resume download and contact (email / telegram /
  linkedin) are reachable in one click from every page via the Base nav.

Acceptance: pasting the deployed URL into a link-preview validator (or LinkedIn
DM composer) renders a titled card with the OG image. Resume and at least one
contact method are one click from home, a category page, and a piece page.

### D. Anti-vibecode mechanics pass (applied across A–C)

Applied to every element built or touched in A–C:

- Buttons / links-as-actions carry the full state set: default, `:hover`,
  `:active`, `:disabled` where applicable, `:focus-visible` ring. Async actions
  (copy email/telegram, download resume) show inline confirmation
  ("Copied!" / spinner) — much of this already exists in `Base.astro`; confirm
  and fill gaps.
- Shadows stay soft and diffuse (existing recipe). No hard slabs, no side
  accent stripes, no second decorative hue.
- One accent fill per view (the discipline accent, already per-room).
- 4px spacing scale and existing grid; no off-scale one-off values in new CSS.
- Copy: sentence-case body and eyebrows where they aren't part of the
  deliberate editorial UPPERCASE display set; no em dashes anywhere.

Acceptance: self-check new/changed UI against the anti-vibecode non-negotiables;
the only intentional divergences are the documented editorial ones (serif
accent, UPPERCASE display headers).

## Non-goals (Tier 1)

- Case-study restructure of single-piece pages (`[category]/[slug].astro`) — Tier 2.
- Filling the `personal` room with real work — Tier 2 / owner-supplied.
- Hero portrait label cleanup, motion, view transitions, dark mode — Tier 3.
- Per-piece OG images — later.
- Any change to the build-time PDF rasterization pipeline.

## Files touched

- `src/pages/[category].astro` — count-aware branching (A, D).
- `src/components/FeaturedPiece.astro` — **new** (A).
- `src/components/Gallery.astro` — reused for the 3+ tail; no change expected.
- `src/pages/index.astro` — above-the-fold copy + signposting (B, D).
- `src/layouts/Base.astro` — OG/Twitter meta props (C); confirm action states (D).
- `public/og-default.png` — **new** static OG image (C).

## Risks / watch-items

- The `verify-build.sh` smoke test and `verify-anti-ai-tells.sh` gate exist;
  new copy and markup must not trip the anti-AI-tells check. Run both before
  calling done.
- Featured-card text uses `title`, `role`, `context`, `outcome` — all confirmed
  present and required in `src/content.config.ts`, so no fallback needed.
- Deploy is push-to-`main` (Vercel). No staging gate; verify locally with the
  dev server and the smoke script before pushing.
