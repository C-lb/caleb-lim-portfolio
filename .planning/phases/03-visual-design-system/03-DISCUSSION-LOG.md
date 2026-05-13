# Phase 3: Visual Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 03-visual-design-system
**Areas discussed:** Discipline → accent color mapping; Asymmetric gallery layout system; Splash hero content; Motion baseline + 404 voice

---

## Discipline → Accent Color Mapping

### Q1 — Mapping assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Sketch 001 mapping | Design = terracotta, Finance = cobalt, Personal = electric lime, Marketing = plum. Already validated against the splash composition; cobalt-on-finance and lime-on-personal carry meaning (cobalt = serious / lime = playful). | ✓ |
| Marketing gets the loudest color | Marketing = lime, Personal = plum, Design = terracotta, Finance = cobalt. Marketing strong pile; lime grabs eye first. | |
| Design gets the loudest color | Design = lime, Marketing = terracotta, Finance = cobalt, Personal = plum. Design as visual-credibility anchor. | |

**User's choice:** Sketch 001 mapping (recommended)
**Notes:** Locked the sketch's k1–k4 sequence as the canonical mapping; recommended over alternatives because the splash composition was tuned to this exact color rhythm.

### Q2 — Category page background

| Option | Description | Selected |
|--------|-------------|----------|
| Ink-black bg, accent on tiles + accents | Per sketch 001: every category page has the same ink-black canvas; accent shows up on hero numerals, back-pill, 1–2 tile fills. Identity through dosage, not full-page shifts. | ✓ |
| Accent-flooded background per category | Each category floods bg with its accent. More immediate identity but lime + plum at full bleed fight thumbnail covers. | |
| Cream paper bg with accent header strip | Stay on splash's cream paper, run accent header strip. More editorial, but loses the inverted-room moment from the sketch. | |

**User's choice:** Ink-black bg, accent on tiles + accents (recommended)
**Notes:** Confirmed the sketch's inverted-room treatment for all 4 category pages; accent dosage (numeral + pill + 1–2 tiles) carries discipline identity without aggressive backgrounds.

---

## Asymmetric Gallery Layout System

### Q1 — Adaptation rule

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed templates per piece-count bucket | Define ~3 hand-tuned layouts (1–2 / 3–5 / 6–8). `order` field picks slot. Caleb keeps low-friction workflow. | ✓ |
| Per-piece `tileSize` field in frontmatter | Add `tileSize` enum to schema. Maximum control, ongoing design work per piece. | |
| Deterministic algo from `order` | Pure function of order. Zero per-piece config but kills magazine-grade variety across galleries. | |
| Hand-coded per-piece, no system | One-off Astro file per gallery. Bespoke composition; adding pieces = editing files. | |

**User's choice:** Fixed templates per piece-count bucket (recommended)
**Notes:** Templates absorb the design work once; ongoing maintenance stays the existing "set order, ship piece" workflow.

### Q2 — Bucket boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| 1–2 / 3–5 / 6–8 with sketch-derived shapes | A: hero + wide. B: sketch's 5-tile. C: B + extra row. Covers Personal, Finance, Marketing, Design at current counts. | ✓ |
| 1 / 2–3 / 4–6 / 7+ — finer buckets | Four templates; better fidelity at low counts but more design surface. | |
| 1–3 / 4–7 / 8+ — coarser buckets | Two templates effectively; simplest but 1-piece using same template as 3-piece looks empty. | |

**User's choice:** 1–2 / 3–5 / 6–8 with sketch-derived shapes (recommended)
**Notes:** Sketch's 5-tile composition becomes Bucket B (the "house" template). A and C extend symmetrically.

---

## Splash Hero Content

### Q1 — Portrait

| Option | Description | Selected |
|--------|-------------|----------|
| I have a portrait ready | Caleb supplies a portrait file during execution. Wired through `<Image>` into hero band. | ✓ |
| Use sketch's placeholder pattern for now | Stylized placeholder (dark canvas + duotone overlay + dashed circle + caption). Lets us launch without photoshoot but undercuts personality pitch. | |
| Skip the portrait column entirely | Drop portrait, restructure hero band as 2 columns. Cleaner but loses editorial-cover feel. | |

**User's choice:** Portrait ready (recommended)
**Notes:** Caleb supplies the file at execute time. Per Specifics in CONTEXT.md, portrait readiness is treated as a Phase 3 blocker — we don't ship placeholder.

### Q2 — Splash bio block

| Option | Description | Selected |
|--------|-------------|----------|
| Shorter splash teaser | ~40–60 words distilled from /about. Lead cross-functional pitch, end with hook to question bar. | ✓ |
| Same copy as /about (122 words) | Single source of truth; full bio crowds hero band, pushes 4 cards below fold @ 1280px. | |
| Pure tagline, no body copy | One-line; max scannability; risks reading thin. | |

**User's choice:** Shorter splash teaser (recommended)
**Notes:** Teaser is its own copy (NOT extracted from /about); splash needs hand-tuned line breaks for sticker-style block.

### Q3 — Roles list

| Option | Description | Selected |
|--------|-------------|----------|
| 4 roles matching the four disciplines | `analyst · brand strategist · designer · marketer`. Mirrors cards below. Sketch's odd/even color alternation. | ✓ |
| Hybrid pitch sentence (no role list) | One editorial sentence below name. Stronger voice; loses mirror-to-cards moment. | |
| More than 4 roles, freeform | 6–8 specific roles. Reads as rolodex; probably dabbler-coded. | |

**User's choice:** 4 roles matching the four disciplines (recommended)
**Notes:** 1:1 mirror to discipline cards is conceptual, not positional — roles list reads horizontally; cards have their own visual rhythm.

---

## Motion Baseline + 404 Voice

### Q1 — Motion baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Sketch-equivalent only | Card hover translateY + slight rotation, gallery tile hover-scale, pulsing status pill. Pure CSS, zero JS. View Transitions / scroll reveals stay deferred. | ✓ |
| Sketch + Astro View Transitions on splash → gallery | Pulls MOTION-01 forward. Free with Astro 5; risks Safari edge cases. | |
| Sketch + GSAP scroll-driven reveals on detail page | Pulls MOTION-02 forward; adds gsap dependency; bigger first-paint blast radius. | |

**User's choice:** Sketch-equivalent only (recommended)
**Notes:** Reduced-motion media query wired in Phase 3 (2 lines of CSS) even though FOUND-03 verification is owed to Phase 5.

### Q2 — 404 voice + treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Cream paper, big editorial type, dry one-liner | Splash-bg paper; "404" or "NOT FOUND" in Bricolage huge; one dry caption; four discipline cards repeated below. | ✓ |
| Inverted ink-black, witty/playful copy | Category-style canvas; joke copy; risks reading try-hard. | |
| Minimal/business: "Page not found" + link list | Safest; explicit success criterion is "on-brand 404" — minimal may read as missing the brief. | |

**User's choice:** Cream paper, big editorial type, dry one-liner (recommended)
**Notes:** 404 reuses the splash's `DisciplineCard` component (single source of truth) for the "rooms that do exist" repeat below the headline.

---

## Claude's Discretion

Areas where the discussion deferred to Claude (captured in CONTEXT.md `<decisions>` → "Claude's Discretion"):

- Anti-AI-tell verification mechanism (Phase 3 SC6 exit gate) — implement as ANTI-AI-CHECKLIST.md reviewed by `/gsd-code-review` + `/gsd-ui-review`.
- Bricolage display preload list — preload only the woff2 file used by largest above-the-fold type-set.
- Astro `<Image>` use for tile thumbnails — continues from Phase 2; paginated `<img>` in detail page stays unchanged.
- Detail page styling — body inherits cream-paper canvas (NOT inverted ink); detail header carries discipline accent.
- Mobile collapse @ ≤900px — match sketch's pattern; Phase 3 ships responsive CSS but does not verify on hardware (Phase 5 owns).
- Status pill copy — "OPEN TO ROLES" with pulsing lime dot per sketch; one-string change at execution if Caleb prefers different wording.
- Splash 4-card vs N-card flexibility — if Personal drops per SPLASH-04 / D-07, splash becomes a 3-card layout; planner adds a layout variant task.

## Deferred Ideas

Carried forward in CONTEXT.md `<deferred>`:

- Header chrome (mailto / LinkedIn / Resume header link) — Phase 4
- Prev/next within discipline + "Back to [Category]" detail-page footer — Phase 4
- About-page contact block — Phase 4
- Mobile/perf/a11y polish + iPhone Safari verification + Lighthouse + reduced-motion gate — Phase 5
- View Transitions API (MOTION-01), CSS scroll-driven reveals (MOTION-02), custom cursor (MOTION-03), magnetic splash cards (MOTION-04) — v2
- Outcome tagline on Finance gallery cards (CONTENT-01), "Show me everything" tour (CONTENT-02) — v2
- OG/Twitter cards, robots.txt, sitemap.xml, favicon set — Phase 6
- Calendly, privacy-first analytics — FUTURE-01/02 post-v1 only
- Per-piece secondary images / detail spreads beyond hero + paginated PDF — FUTURE-04, v2
