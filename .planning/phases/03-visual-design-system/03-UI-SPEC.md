---
phase: 3
slug: visual-design-system
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-14
revised: 2026-05-14
---

# Phase 3 — UI Design Contract

> Visual and interaction contract for the Magazine-maximalist visual system. The locked anchor is `.planning/sketches/001-direction-comparison/index.html` `.variant-b` (CSS lines 262–627). Numbers below are extracted verbatim from that sketch — re-deriving them is how the magazine composition becomes a portfolio template (anti-AI-tell, see CONTEXT.md D-17 + RESEARCH.md "Don't Hand-Roll").

---

## Verification Override Register

This phase's design intentionally exceeds two of `gsd-ui-checker`'s default thresholds. Both are SaaS-app defaults; this is a magazine-grade portfolio whose typographic and spatial hierarchy IS the brand artifact. The overrides are bounded, enumerated, and audit-greppable.

`grep -A 1 "verification_override" 03-UI-SPEC.md` — machine-readable audit hook for `/gsd-ui-review` and `/gsd-code-review`.

| verification_override | Dimension | Default Threshold | Override Value | Justification | Source |
|-----------------------|-----------|-------------------|----------------|---------------|--------|
| OVERRIDE-01 | Dimension 4 — Typography (font-size count) | Max 4 font-size tokens | 11 sizes (`--fs-display`, `--fs-cat`, `--fs-q`, `--fs-card`, `--fs-h3`, `--fs-ttl`, `--fs-body`, `--fs-tile-role`, `--fs-mono`, `--fs-card-no`, `--fs-deco-numeral`) | Magazine-grade typographic hierarchy is the brand artifact for a portfolio targeting brand-management roles. Reducing to 4 sizes would force the design into the editorial-minimalist Variant A direction the user explicitly rejected. | PROJECT.md "bold/expressive visual identity"; REQUIREMENTS.md VISUAL-01 (locks the type triple); REQUIREMENTS.md VISUAL-04 (rejects Inter — implies intentional type system); CONTEXT.md D-15/D-16; sketch 001 README.md (winner = Variant B "Magazine maximalist") |
| OVERRIDE-02 | Dimension 4 — Typography (font-weight count) | Max 2 font-weights | 6 weights (800, 700, 600, 500, 400, 300) — each role-coded, not stylistic noise | Bricolage variable axis exists precisely to render multi-weight hierarchy without per-weight HTTP cost. Fraunces 300 italic IS the editorial pairing — without the light italic accent, Fraunces collapses into "another serif." | sketch 001 lines 357, 364–365, 374–379, 384, 399, 411, 435, 441, 482, 557, 596; CONTEXT.md D-15/D-16 (Bricolage `wght` 200..800 axis shipped, Fraunces italic-only variable, JetBrains Mono 400 + 600) |
| OVERRIDE-03 | Dimension 5 — Spacing (4-multiple constraint) | All spacing values multiples of 4 in standard set {4, 8, 16, 24, 32, 48, 64} | Standard token scale conforms; 7 sketch-locked raw values exist as documented component spacing OUTSIDE the token system | Magazine-maximalist composition requires sketch-locked tile/pill geometry that doesn't quantize to a 4px grid. Restructuring would shift sketch composition. Override is bounded — any NEW spacing value must conform to the token scale. | sketch 001 lines 285, 299, 314, 387, 424, 452, 586 |

**Override discipline:** Overrides are NOT a blanket exemption. New typography roles must justify themselves against the existing 11-size system (extend the system, don't sprawl it). New spacing values must conform to the strict token scale below. The sketch-locked raw values are an enumerated whitelist — anything beyond them is drift.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (plain CSS + custom properties) |
| Preset | not applicable — D-17 explicitly rejects Tailwind/shadcn; CLAUDE.md "What NOT to Use" treats stock Tailwind/shadcn defaults as anti-AI-tells |
| Component library | none — components are hand-rolled `.astro` files in `src/components/` per RESEARCH.md "Recommended Project Structure" |
| Icon library | none — VISUAL-04 forbids lucide; icons are SVGs hand-drawn or absent. The single "→" arrow on the question bar and "←" on the back-pill are typographic glyphs, not icon components. |
| Font | **Bricolage Grotesque** (display, variable `wdth`+`opsz`+`wght`) + **Fraunces** italic (editorial accent, italic-only variable) + **JetBrains Mono** (micro-labels, 400 + 600). All self-hosted via Fontsource. **Inter is forbidden.** |

### Architecture additions (from RESEARCH.md / D-17 / D-18)

| Path | New / Modified | Purpose |
|------|----------------|---------|
| `src/styles/tokens.css` | NEW | `:root` CSS custom properties — colors, fonts, motion timing |
| `src/styles/disciplines.ts` | NEW | `DISCIPLINE_ACCENT` const (D-01) — single source of truth for category→accent hex |
| `src/layouts/Base.astro` | NEW | Global chrome, font preload, topbar pill, footer, `bg: 'paper' \| 'ink'` prop |
| `src/components/DisciplineCard.astro` | NEW | Splash + 404 card. `k: 1\|2\|3\|4` selects k1–k4 decoration variant |
| `src/components/StatusPill.astro` | NEW | Topbar "OPEN TO ROLES" + pulsing lime dot |
| `src/components/GalleryA12.astro` | NEW | Bucket A template (1–2 pieces) |
| `src/components/GalleryB35.astro` | NEW | Bucket B template (3–5 pieces) — sketch's exact 5-tile composition |
| `src/components/GalleryC68.astro` | NEW | Bucket C template (6–8 pieces) |
| `src/pages/index.astro` | MODIFIED | Splash hero band + question bar + 4 cards (extends Base) |
| `src/pages/about.astro` | MODIFIED | Restyle on Base, paper bg, type via tokens |
| `src/pages/[category].astro` | MODIFIED | Bucket-template switch, ink bg, accent flow |
| `src/pages/[category]/[slug].astro` | MODIFIED | Detail header carries discipline accent, container styling, paper bg |
| `src/pages/404.astro` | NEW (D-14) | Cream paper, big "404", dry caption, 4 DisciplineCards repeated below |

---

## Spacing Scale

The spacing TOKEN scale is strict and conforming to the 4-multiple standard set. Sketch-locked raw values that fall outside this scale live in the dedicated section below — they are NOT tokens.

### Token scale (strict, conforming)

| Token | Value | Usage |
|-------|-------|-------|
| `--sp-1` | 4px | Roles list inter-token gap; stamp margin nudges |
| `--sp-2` | 8px | Pulsing-dot inline padding; status-pill internal margins; back-pill vertical padding |
| `--sp-4` | 16px | Hero-band gap (sketch line 314); bio-block internal gap; gallery tile vertical padding |
| `--sp-5` | 24px | Bio-block right padding (sketch line 387, second value); category header column gap when in scale |
| `--sp-6` | 32px | Category page padding; gallery top margin; category back-pill row spacing; category header `b-cat-head gap: 32px` |
| `--sp-8` | 48px | Below-fold breathing on detail page (CRO blurb stacks); 404 caption-to-cards gap |
| `--sp-10` | 64px | Bio sticker bottom inset (sketch line 387, third value — accommodates the strike-text deco + KEEP READING chip); page-level vertical rhythm |

**Contract for new spacing decisions:** Any spacing value introduced during execution that is NOT on the sketch-locked list below MUST come from this token scale. The override (OVERRIDE-03) is bounded to the enumerated sketch-locked values only — not a blanket exemption to invent new raw-px values.

### Sketch-Locked Component Spacing (Outside Token Scale)

These raw-px values are extracted verbatim from sketch 001 `.variant-b` and sized for specific composition decisions. They live as raw values inside their owning component's scoped style block — they are NOT promoted to tokens. Each is enumerated with its sketch line citation so `/gsd-code-review` can verify nothing new sneaks into this list.

| Component | Property | Value | Sketch Line | Why |
|-----------|----------|-------|-------------|-----|
| Status pill (`StatusPill.astro`) | `padding` | `6px 14px` | line 299 | Sized for 11px JetBrains Mono micro-text + 8px lime dot. 4-multiple padding would oversize the pill and break the topbar grid. |
| Splash cards row (`.b-cards`) | `gap` | `10px` | line 452 | Tighter than 16px to keep all 4 cards visible above the fold @ 1280px. Rounding to 12px breaks the 4-card fit. |
| Splash outer (`.b-splash`) | `padding` | `22px 28px 22px` | line 285 | Hand-tuned for above-the-fold composition — every additional 2px of vertical pad pushes the cards lower. |
| Gallery tile (`.b-piece`) | `padding` | `16px 18px` | line 586 | 16 is in scale; 18 is sketch-locked horizontal — hand-tuned to fit 22px tile title + 13px italic role caption with breathing room. |
| Question bar (`.b-question`) | `padding` | `12px 0` | line 424 | Tuned to align with 2px ink borders top + bottom, producing the magazine-rule effect. |
| Bio block (`.b-bio`) | `padding` | `22px 24px 64px` | line 387 | 24 + 64 are token-scale; 22 is sketch-locked top — hand-tuned so the `→ THE PITCH` tag clears the sticker corner. The 64px bottom reserves room for the absolute-positioned `→ KEEP READING` chip. |
| Splash card interior (`.b-card`) | `padding` | `14px 16px 16px` | (sketch composition) | Tuned to keep card title baseline aligned across rotated cards (the sketch's -1° to +1° rotations would misalign on a strict 16px top pad). |
| Category gallery grid (`.b-pieces`) | `gap` | `12px` | line 578 | Tighter than 16px so the asymmetric tile composition reads as a magazine spread rather than a card grid. Rounding to 16px adds visual gutter that breaks the sketch's compressed rhythm. |

**Decoration absolutes** (e.g. `right: -22px`, `top: -22px`, `top: 18px right: 16px`) — verbatim per sketch lines 495–516. These are `position: absolute` placement, not spacing — they are spatial composition and are not subject to the spacing scale at all.

---

## Typography

> **Override note:** This system declares 11 font-size roles and 6 font-weight roles. See `verification_override` register above (OVERRIDE-01, OVERRIDE-02) for justification. Each role is enumerated below with semantic purpose and sketch line citation — the count is intentional, role-coded, and bounded.

### Font-size roles (11, all sketch-locked)

| Token | Size | Semantic role | Sketch line |
|-------|------|---------------|-------------|
| `--fs-display` | `clamp(72px, 11vw, 168px)` | Splash hero name `CALEB LIM.` — the brand anchor | 357 |
| `--fs-cat` | `clamp(56px, 8vw, 130px)` | Category page title (e.g. `GRAPHIC / DESIGN`) | 557 |
| `--fs-q` | `clamp(22px, 3vw, 38px)` | Splash question bar `WHAT DO YOU WISH TO SEE?` | 435 |
| `--fs-card` | `clamp(22px, 2.7vw, 36px)` | Discipline card name on splash | 482 |
| `--fs-h3` | 26px | Bio sticker headline `CROSS-FUNCTIONAL — BY DESIGN.` | 399 |
| `--fs-ttl` | 22px | Gallery tile title | 596 |
| `--fs-body` | 15.5px | Bio paragraph + roles list (same size, different families per index) | 403, 374 |
| `--fs-tile-role` | 13px | Gallery tile role caption (italic Fraunces) | 600 |
| `--fs-mono` | 11px | JetBrains Mono micro-labels (status pill, back-pill, footer, topbar nav) | 295–296, 392–393 |
| `--fs-card-no` | 9px | Splash card index number (top-left of each card, JetBrains Mono uppercase) | 470 |
| `--fs-deco-numeral` | clamp(64px, 8vw, 96px) | Fraunces italic decorative numeral inside Finance card and bio-sticker overflow | 411 (bio-strike), k2 deco |

### Font-weight roles (6, all role-coded)

| Weight | Role | Where |
|--------|------|-------|
| 800 | Display + card name — the loud moments | Splash name, category title, splash card name |
| 700 | Secondary headline tier | Bio sticker headline `h3`, gallery tile title |
| 600 | Mono micro-labels (emphasized) | Status pill text, marker chips, "→ PICK ONE", back-pill, footer mono |
| 500 | Roles list (cobalt sans entries) | Mid-weight to harmonize with Fraunces italic alternation in roles list |
| 400 | Body copy + mono default + Fraunces italic decorative | Bio paragraph (Fraunces), JetBrains Mono default, decorative italic numerals |
| 300 | Fraunces italic accent — the editorial moment | Question bar `<em>`, category title italic numeral, italic role-list entries — light weight is the entire point of the editorial pairing |

### Faces (D-15 / D-16)

| Face | Source | Variable axes shipped | Usage role |
|------|--------|----------------------|------------|
| Bricolage Grotesque | `@fontsource-variable/bricolage-grotesque` 5.2.10 | `opsz` 12..96, `wdth` 75..100, `wght` 200..800 (full) | Display + body sans (`--sans`) |
| Fraunces | `@fontsource-variable/fraunces` 5.2.9 | italic-only | Editorial accent (`--serif`) |
| JetBrains Mono | `@fontsource-variable/jetbrains-mono` 5.2.8 | 400 + 600 | Micro-labels, status pill, "→ PICK ONE" markers (`--mono`) |

**Loading contract:** Self-hosted via Fontsource. `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous">` for the **single** Bricolage display woff2 used above the fold (the `latin-full-normal.woff2` per RESEARCH.md Pitfall — exact filename — D-16 exercises `opsz` and `wdth`, so use `full-normal`). `font-display: swap` is shipped by Fontsource defaults — do NOT override. Latin subset only (English-only site).

### Type scale (locked to sketch CSS)

| Role | Size | Weight | Line Height | Family | Notes |
|------|------|--------|-------------|--------|-------|
| Splash name `h1` | `clamp(72px, 11vw, 168px)` | 800 | 0.82 | sans | `font-variation-settings: "wdth" 100, "opsz" 96`; letter-spacing -0.045em; uppercase. Sketch line 357. |
| Category title `h2` | `clamp(56px, 8vw, 130px)` | 800 | 0.85 | sans | letter-spacing -0.04em; uppercase. Italic numeral inside uses Fraunces italic at weight 300 in `--accent`. Sketch line 557. |
| Card name | `clamp(22px, 2.7vw, 36px)` | 800 | 0.88 | sans | letter-spacing -0.03em; uppercase. Sketch line 482. |
| Question bar | `clamp(22px, 3vw, 38px)` | 600 | 1 | sans | Italic Fraunces 300 in terracotta for the inline emphasis. Sketch line 435. |
| Bio heading `h3` | 26px | 700 | 1.05 | sans | letter-spacing -0.02em; uppercase. Sketch line 399. |
| Tile title `.ttl` | 22px | 700 | 1 | sans | letter-spacing -0.02em. Sketch line 596. |
| Body / bio | 15.5px | 400 | 1.42 | serif | Fraunces non-italic for body; italic for `<em>` emphasis. Sketch line 403. |
| Roles list | 15.5px | 500 | 1.0 | sans (odd) / serif italic (even) | Odd-index in cobalt sans, even-index in italic terracotta Fraunces. Sketch lines 374–379. |
| Tile role caption | 13px | 400 | 1.2 | serif italic | Sketch line 600. |
| Topbar / pill / micro-labels | 11px | 600 | 1.0 | mono | letter-spacing 0.1em–0.16em; uppercase. Sketch lines 295–296, 392–393. |
| Card number `0N` | 9px | 600 | 1.0 | mono | letter-spacing 0.1em. Sketch line 470. |
| Decorative numeral | clamp(64px, 8vw, 96px) | 300/400 | 1.0 | serif italic | Fraunces italic, used for the bio-sticker shadow numeral (`.b-bio-strike`, ink @ 10% opacity, sketch line 411) and the Finance card's italic numeral deco in lime. |

**Tokens (in `tokens.css`):**

```css
:root {
  --sans:  "Bricolage Grotesque Variable", -apple-system, system-ui, sans-serif;
  --serif: "Fraunces Variable", Georgia, serif;
  --mono:  "JetBrains Mono Variable", ui-monospace, monospace;

  --fs-display:      clamp(72px, 11vw, 168px);
  --fs-cat:          clamp(56px, 8vw, 130px);
  --fs-q:            clamp(22px, 3vw, 38px);
  --fs-card:         clamp(22px, 2.7vw, 36px);
  --fs-h3:           26px;
  --fs-ttl:          22px;
  --fs-body:         15.5px;
  --fs-tile-role:    13px;
  --fs-mono:         11px;
  --fs-card-no:      9px;
  --fs-deco-numeral: clamp(64px, 8vw, 96px);

  --lh-display: 0.82;
  --lh-cat:     0.85;
  --lh-card:    0.88;
  --lh-tight:   1.0;
  --lh-bio:     1.42;
}
```

---

## Color

### Tokens (D-01 / sketch lines 262–273)

| Token | Hex | Role |
|-------|-----|------|
| `--paper` | `#f4ebd9` | Warm cream — splash / about / detail / 404 surface |
| `--ink` | `#0a0a0a` | Near-black — category surface, body text on paper |
| `--terracotta` | `#e85d2a` | Design accent (k1) |
| `--cobalt` | `#1947ff` | Finance accent (k2) |
| `--acid` (electric lime) | `#d4ff3a` | Personal accent (k3); also "interior" decorative-fill color (status dot, k2 italic numeral, bio-sticker fill, question-bar marker chip) |
| `--plum` | `#5a1a55` | Marketing accent (k4) |
| `--teal` | `#0d5e5a` | Sketch-only fifth accent for Bucket B's `p5` tile fill — NOT a discipline color, NOT exposed beyond gallery-tile decoration |

### 60 / 30 / 10 split

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--paper` `#f4ebd9` on splash/about/detail/404; `--ink` `#0a0a0a` on category | Per-page surface. Each surface is monochrome dominant (cream OR ink, not both). |
| Secondary (30%) | The opposite of the page bg (ink text on paper, paper text on ink) | Body copy color, status-pill body, back-pill body |
| Accent (10%) | The four discipline accents + `--acid` interior fills | Reserved-for list below |

### Accent reserved-for (explicit list — never "all interactive elements")

The four discipline accents are reserved for:

1. **Splash card backgrounds** — k1=terracotta, k2=cobalt, k3=acid, k4=plum (sketch lines 495, 498, 504, 510)
2. **Splash name "LIM" + period punctuation** — `.lim` in terracotta, `.stop` in cobalt (sketch lines 364–365)
3. **Roles list odd/even alternation** — odd in cobalt, even in italic terracotta Fraunces (sketch lines 378–379)
4. **Bio sticker block fill** — acid (sketch line 384)
5. **Question bar inline emphasis** — italic terracotta Fraunces inside the `.q em` (sketch line 441)
6. **Question bar marker chip** — acid background (sketch line 430)
7. **Question bar arrow glyph** — cobalt (sketch line 446)
8. **Status pill pulsing dot** — acid (sketch line 302)
9. **Topbar nav hover state** — terracotta (sketch line 308)
10. **Category-page italic numeral inside `h2 em`** — `--accent` (per-discipline, via wrapper `style="--accent: <hex>"`) (sketch line 562 → RESEARCH.md Pattern 2)
11. **Category back-pill** — paper bg with ink text (NOT accent — accent flows on the title's italic numeral)
12. **Gallery tile background fills** — 1–2 tiles per gallery carry the discipline accent (Bucket B p1 hero = terracotta, p2 wide = cobalt, p3/p4/p5 use acid/plum/teal sequence — sketch lines 603–612)
13. **Detail-page header accent treatment** — accent-color top border or accent fill behind the back-pill, plus `--accent` italic numeral in the title block (CONTEXT.md "Detail page styling" discretion)
14. **Bio-sticker `.b-bio-strike` shadow numeral** — ink at 10% opacity (sketch line 411 — not accent, listed for completeness so it's not mistaken)

**Accent is NOT used for:** body links (use ink on paper / paper on ink with underline-on-hover); generic hover backgrounds; decorative noise; gradient stops.

### Accent contrast notes (a11y, Phase 3 declares — Phase 5 verifies on hardware)

WCAG AA minimums for body copy (4.5:1) and large text (3:1). Computed on the named pairs:

| Text on background | Contrast ratio (computed) | Status | Where used |
|--------------------|---------------------------|--------|------------|
| ink on paper | ~17.8 : 1 | PASS AAA | Body copy, splash bg + text |
| paper on ink | ~17.8 : 1 | PASS AAA | Category page, status pill text |
| paper on terracotta `#e85d2a` | ~4.1 : 1 | PASS AA large only — use only for ≥18px / ≥14px-bold (card name is 22–36px @ 800 weight, qualifies) | k1 card text, p1 hero tile text |
| paper on cobalt `#1947ff` | ~7.3 : 1 | PASS AA all sizes | k2 card text, p2 hero tile text |
| **ink on acid `#d4ff3a`** | ~14.8 : 1 | PASS AAA | k3 card text, bio-sticker text, p3 tile text |
| paper on plum `#5a1a55` | ~12.6 : 1 | PASS AAA | k4 card text, p4 tile text |
| paper on teal `#0d5e5a` | ~7.4 : 1 | PASS AA all sizes | p5 tile text only (not a discipline color) |
| **acid on paper** | ~1.4 : 1 | FAIL — never use for text | acid is fill-only on paper surface (e.g. bio-sticker bg shows ink text on top, NOT acid text on cream) |
| **acid on ink** | ~12.6 : 1 | PASS AAA | k2 italic-numeral deco, status pill dot (not text), question bar marker chip if surface inverts |
| terracotta on ink | ~3.6 : 1 | PASS AA large only | Topbar nav hover state (sketch line 308 — uppercase mono 11px, but sketch doesn't gate hover for a11y; flag for Phase 5 audit) |

**Contract:** Acid is **never used as a text color on paper**. Acid as a text color requires ink as the surface. This is the single contrast trap in the system — call it out at code-review.

### Forbidden colors (anti-AI-tells, VISUAL-04 + automated check)

- No purple gradients (linear or radial). `scripts/verify-anti-ai-tells.sh` greps for them. RESEARCH.md line 659.
- No slate / shadcn neutral scales (`#f1f5f9`, `#0f172a`, etc.) — none in tokens.
- No "destructive red" semantic — no destructive actions in Phase 3 (see Copywriting Contract below).

---

## Copywriting Contract

### Page-level copy

| Element | Copy | Source |
|---------|------|--------|
| Site title (`<title>` template) | `{page} — Caleb Lim` | Convention; D-18 Base.astro |
| Topbar status pill | `OPEN TO ROLES` (uppercase mono with pulsing acid dot prefix) | CONTEXT.md "Status pill copy" — one-string change at execution time if Caleb prefers "AVAILABLE FOR HIRE" / "TAKING INTERVIEWS" |
| Topbar brand mark | `caleb lim` (lowercase mono) — placeholder slot in Base.astro topbar; Phase 4 wires the mailto/LinkedIn/Resume affordances into the topbar grid | D-18 + Phase 4 deferred items |
| Footer center | `available for full-time roles, brand+analyst+design` (italic Fraunces 14px) | Sketch line 528–530; Caleb may tune |
| Footer left | `caleb lim — 2026` (uppercase mono 11px) | Sketch line 524 |
| Footer right | `singapore · global` (uppercase mono 11px) | Sketch convention |

### Splash copy

| Element | Copy |
|---------|------|
| Name `h1` | `CALEB` newline `LIM.` — `LIM` in `<span class="lim">` (terracotta), period in `<span class="stop">` (cobalt) |
| Stamp (top-right of name block) | `EST. 2026 · SG` (uppercase mono, rotate(4deg)) |
| Roles list (4 spans, mirroring discipline cards per D-10) | `analyst` · `brand strategist` · `designer` · `marketer` (Caleb may tune wording at execution time as long as the 1:1 mirror to the four cards is preserved) |
| Bio sticker tag | `→ THE PITCH` (uppercase mono 11px) |
| Bio sticker `h3` | `CROSS-FUNCTIONAL — BY DESIGN.` (uppercase sans 26px) |
| Bio sticker body `p` | **40–60 word teaser, hand-tuned for line breaks.** Voice contract from Phase 2 D-14 carries forward: NO "passionate / multidisciplinary / intersection of" filler. Leads with the cross-functional pitch, ends with a hook pointing at the question bar. *Draft for execution-time confirmation:* "Analyst eye, designer hand. Eight years splitting time between brand systems, financial models, and the campaigns that move them. Pick the room that's relevant to your hire — every piece in it is mine end-to-end." (~38 words, tune to fit) |
| Bio sticker bottom-right arrow | `→ KEEP READING` (uppercase sans 700, 13px) |
| Bio sticker shadow numeral (`.b-bio-strike`) | `04` (the four disciplines) — semantic decoration, ink at 10% opacity |
| Question bar marker | `→ PICK ONE` (uppercase sans 800, 13px, acid background, rotate(-2deg)) |
| Question bar `q` | `What do you wish to <em>see</em>?` — `<em>` in italic terracotta Fraunces 300 |
| Question bar arrow glyph | `↓` (cobalt, 32px sans) |
| Card number prefix | `0N / 04` (uppercase mono 9px) — N is the k-index 1–4, "/ 04" is the total |
| Card name labels | k1: `Graphic / Design`, k2: `Financial / Models`, k3: `Personal / Projects`, k4: `Marketing` (uppercase via CSS, source as-shown) |

### Category page copy

| Element | Copy |
|---------|------|
| Back-pill | `← splash` (uppercase mono 11px, paper bg with ink text, 999px radius) |
| Category title `h2` | `<category label>` `<em>/{pieces.length}</em>` — e.g. `GRAPHIC / DESIGN <em>/04</em>` (label uppercase sans, `<em>` numeral in italic Fraunces in `--accent`) |
| Meta line (right side of header) | `04 PIECES · UPDATED MAY 2026` (uppercase mono, label-only — number echoed in acid via `<strong>`) |

### Detail page copy (Phase 3 styling only — copy authored Phase 2)

Phase 2 already shipped Context / Role / Outcome blurbs per piece. Phase 3 adds:

| Element | Copy |
|---------|------|
| Detail header back-pill | `← {category label}` (uppercase mono, paper bg ink text on the cream-paper detail page; for visual continuity the back-pill carries an `--accent` underline or top-border) |
| Section labels | `CONTEXT` / `ROLE` / `OUTCOME` (uppercase mono 11px, ink at 60% opacity, above each blurb block) |
| "Open full PDF" link (Phase 2 spec) | `Open full PDF →` (Fraunces italic 14px, ink, accent underline on hover) |

### 404 page copy (D-14)

| Element | Copy |
|---------|------|
| `h1` | `404` (Bricolage display 168px equivalent, ink on paper) |
| Caption | `This page doesn't exist. The four that do are below.` (Fraunces italic 18px, ink, ~40% opacity) |
| Below caption | Four DisciplineCard components (reuses splash component — single source of truth) |

### Empty / error / destructive states

| State | Phase 3 contract |
|-------|------------------|
| **Empty state — empty discipline** | Per D-07: empty discipline drops its splash card AND its `/[category]` route returns 404 (no styled empty state shipped). The 404 page is the empty state. **No "no pieces yet" placeholder copy exists.** |
| **Empty state — gallery with 1–2 pieces** | Per D-04 / Bucket A: not an empty state — bucket template absorbs the absence. Hero + one wide tile reads as intentional, not thin. |
| **Error state** | None — Phase 3 is static SSG; no runtime errors surface to the user. The 404 doubles as the catch-all "wrong URL" affordance. |
| **Destructive actions** | **None.** Phase 3 has zero destructive actions (no delete, no overwrite, no logout — there is no auth, no mutation). Contract: do not introduce destructive copy or red semantic color in this phase. If a future phase adds destructive actions, declare them in that phase's UI-SPEC. |
| **Primary CTA** | The four discipline cards ARE the primary CTA. There is no separate "Get Started" / "Sign Up" / "Hire Me" button — the splash composition resolves to "pick a card." |

### Voice contract (carries from Phase 2 D-14, applies everywhere new copy is written)

- No "passionate / multidisciplinary / intersection of" filler
- No "Hire Me" CTA in big type (rejected per Out of Scope)
- No "Built with X" footer (rejected per VISUAL-04)
- No exclamation points
- Dry, declarative, sentence fragments OK. The 404 caption ("This page doesn't exist. The four that do are below.") is the voice template — drop it, point at the way out, move on.

---

## Visual States (interaction contract)

### Splash discipline card (`DisciplineCard.astro`)

| State | Treatment |
|-------|-----------|
| Default | k-specific bg + text color (k1–k4 per sketch); `transform: rotate({-1° to +1°})`; `border-radius: 10px`; `padding: 14px 16px 16px`; deco rendered absolutely per k variant |
| Hover (pointer) | `transform: translateY(-2px) rotate(-0.3deg)`; `transition: transform 0.3s ease` |
| Focus (keyboard) | `outline: 3px solid var(--ink)` on paper-bg cards (k1, k2, k4); `outline: 3px solid var(--paper)` on acid card (k3); `outline-offset: 4px`. **Sketch does not specify focus state — UI-SPEC mandates it for a11y. Phase 5 verifies keyboard nav.** |
| Active (mouse-down) | `transform: translateY(0) rotate(0deg)` (collapses the lift) |
| Visited | No styling change — color is meaningless on category bg fills |
| Reduced-motion (`prefers-reduced-motion: reduce`) | `transition: none`; `transform: none` (collapses rotation to 0deg AND disables hover lift) |

### Gallery tile (`.b-piece` inside Bucket A/B/C templates)

| State | Treatment |
|-------|-----------|
| Default | bg + text color per p-slot (p1=terracotta, p2=cobalt, p3=acid, p4=plum, p5=teal in Bucket B; Bucket A uses p1+p2 only; Bucket C extends with p6–p8 cycling the palette with slight rotation variance); `transform: rotate({per-tile})`; `border-radius: 8px`; `padding: 16px 18px` |
| Hover | `transform: scale(1.02) rotate(-0.3deg)`; `z-index: 2`; `transition: transform 0.25s ease` |
| Focus | `outline: 3px solid var(--paper)` (gallery is on ink bg); `outline-offset: 3px` |
| Active | `transform: scale(0.99)` |
| Reduced-motion | `transition: none`; `transform: none` |

### Topbar status pill (`StatusPill.astro`)

| State | Treatment |
|-------|-----------|
| Default | `--ink` bg, `--paper` text, mono 11px, `padding: 6px 14px`, `border-radius: 999px`; pulsing acid dot prefix |
| Pulse animation | `animation: pulse 1.6s ease-in-out infinite` on the dot only — `0%/100% { opacity: 1 } 50% { opacity: 0.4 }` (sketch lines 303–305) |
| Reduced-motion | `animation: none` on the dot; dot remains visible at full opacity |

### Topbar nav links (placeholder for Phase 4 — Phase 3 leaves layout room)

| State | Treatment |
|-------|-----------|
| Default | Mono 11px uppercase, paper text on ink topbar (or ink text on paper topbar — sketch shows the topbar inheriting the page bg), `padding: 6px 0` |
| Hover | `color: var(--terracotta)` (sketch line 308). **Note Phase 5 a11y check** — terracotta on ink is 3.6:1 (large-text only); flag if 11px text fails. Phase 4 will revisit with the actual nav links rendered. |
| Phase 3 contract | Render `<header class="topbar"><StatusPill /></header>` only. The nav `<nav>` slot exists in markup but renders no children. Phase 4 fills it. |

### Back-pill (category page + detail page)

| State | Treatment |
|-------|-----------|
| Default | Paper bg, ink text, mono 11px uppercase, `padding: 8px 14px`, `border-radius: 999px` |
| Hover | `background: var(--accent)`; text stays ink (acid/lime accent: ink stays readable; terracotta/cobalt/plum: switch text to paper for AA). Underline persists. |
| Focus | `outline: 3px solid var(--paper)` on ink-bg pages, `outline: 3px solid var(--ink)` on paper-bg pages; `outline-offset: 3px` |
| Reduced-motion | (no motion to disable; static state) |

### Question bar (splash only)

Static element — no states beyond default. Marker chip is decorative, not interactive.

### Bio sticker (splash only)

Static element — no hover. Decorative `b-bio-strike` numeral is non-interactive (`pointer-events: none`).

### Body links (about, detail-page CRO blurbs)

| State | Treatment |
|-------|-----------|
| Default | `color: var(--ink)` (or `--paper` on ink bg); `text-decoration: underline`; `text-decoration-thickness: 1px`; `text-underline-offset: 0.18em` |
| Hover | `color: var(--accent)` if inside an accent-flow wrapper; otherwise `color: var(--terracotta)` as default brand-link accent |
| Focus | `outline: 2px solid var(--accent, var(--ink))`; `outline-offset: 2px` |
| Visited | No color change (single-page site doesn't benefit from visited semantics; recruiters re-visit) |

### Global focus ring contract

Every interactive element MUST have a visible focus ring. Default ring: `outline: 3px solid <contrasting-token>; outline-offset: 3–4px`. **No `outline: none` anywhere** — verified in code review.

---

## Layout & Composition Contract

### Splash above-the-fold composition (SPLASH-01, sketch lines 283–530)

@ 1280px viewport, the following MUST be visible without scroll:

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: status-pill ────────────────────────── [nav slot empty] │ <- 22px top
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌─────────────────────┐  ┌────────────────────┐ │
│  │          │  │  CALEB              │  │ → THE PITCH        │ │
│  │ portrait │  │  LIM.               │  │ CROSS-FUNCTIONAL — │ │
│  │  280px   │  │  [ROLES x 4]        │  │ BY DESIGN.         │ │
│  │  rot     │  │                     │  │ {bio body, ~50w}   │ │
│  │ -1.2°    │  │                     │  │           → KEEP   │ │
│  │          │  │                     │  │           READING  │ │
│  └──────────┘  └─────────────────────┘  └────────────────────┘ │
│   280px           1.5fr                    1.2fr                 │ <- min-height 380px
├─────────────────────────────────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [→PICK]  What do you wish to *see*?                          ↓ │ <- question bar
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────┐  ┌──────┐  ┌────────┐  ┌────────┐                  │
│  │  k1    │  │  k2  │  │   k3   │  │   k4   │                  │
│  │ DESIGN │  │ FIN  │  │  PERS  │  │  MKT   │                  │
│  └────────┘  └──────┘  └────────┘  └────────┘                  │
│   1.2fr        0.85fr     1fr         1fr      gap: 10px        │ <- 1fr remaining
├─────────────────────────────────────────────────────────────────┤
│ caleb lim — 2026 · *available for full-time roles* · sg/global │ <- 22px bottom
└─────────────────────────────────────────────────────────────────┘
```

`grid-template-rows: auto auto auto 1fr auto` on `.b-splash`; `gap: 14px`. Cards row absorbs remaining `1fr`. Per CONTEXT.md "Specifics" — if execution shows cards pushed below fold, **shorten the bio teaser first**, then drop further before reducing card prominence.

### Splash 4-card vs N-card flexibility (CONTEXT.md "Splash 4-card vs N-card")

| Populated disciplines | `b-cards` grid-template-columns | k-index assignment |
|-----------------------|---------------------------------|--------------------|
| 4 (default) | `1.2fr 0.85fr 1fr 1fr` | k1=design, k2=finance, k3=personal, k4=marketing |
| 3 (Personal dropped per D-07) | `1fr 1fr 1fr` | k1=design, k2=finance, k4=marketing (skip k3 visually; deco mapping unchanged) |
| 2 | `1fr 1fr` | preserve k mapping for whichever two remain |
| 1 | `1fr` (full-bleed card) | preserve k mapping |

Per CONTEXT.md, planner adds the N-card variant CSS as a specific task.

### Category page layout (sketch lines 533–612)

```
┌─────────────────────────────────────────────────────────────────┐
│ topbar (inverts to ink-bg context)                              │
├─────────────────────────────────────────────────────────────────┤
│ ┌────────┐                                                       │
│ │←splash │      GRAPHIC / DESIGN /04           04 PIECES ·       │ <- header, 32px pad
│ └────────┘                                      UPDATED MAY 2026 │
│ ─────────────────────────────────────────────────────────────── │ <- border-bottom #333
│                                                                  │
│ ┌─────────────┐    ┌─────────────┐                              │
│ │             │    │      p2     │   <- 5-tile B composition    │
│ │     p1      │    │   (3 cols)  │                              │
│ │  3×2 hero   │    └─────────────┘                              │
│ │             │    ┌────┐ ┌────┐ ┌────┐                        │
│ │             │    │ p3 │ │ p4 │ │ p5 │                        │
│ └─────────────┘    └────┘ └────┘ └────┘                        │
│  6-col grid, grid-auto-rows: 240px, gap: 12px                    │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile collapse @ ≤900px (sketch lines 615–626)

Phase 3 ships responsive CSS, Phase 5 verifies on hardware:

- `.b-splash`, `.b-category` padding → 24px
- `.b-cards` → `1fr 1fr` (4 → 2 columns)
- `.b-pieces` → `1fr 1fr`, `grid-auto-rows: auto`
- Each `.b-piece` → `grid-column: span 1; grid-row: span 1`; `aspect-ratio: 4/5`; `min-height: 220px`
- `.b-cat-head`, `.b-question` → `1fr` (collapses to single column)
- `.b-hero` → `1fr` (portrait above name above bio)
- `.b-portrait` → `aspect-ratio: 4/3`

### Detail page layout (Phase 3 adds tokens + container; Phase 2 paginated `<img>` block stays)

- Body: paper bg (NOT ink — readability of CRO copy)
- Container: `max-width: 960px`; centered; `padding: 32px`
- Header: title (sans 800, large) + back-pill + accent stripe
- CRO blurbs: 3 stacked blocks, each labeled with mono uppercase tag, body in serif 15.5px @ 1.42 line-height
- Hero image: existing `<Image>` component output from Phase 1+2
- Paginated PDF `<img>` sequence: existing block from Phase 2 D-04, untouched

---

## Motion Contract (D-11 / D-13)

| Element | Motion | Disabled under reduced-motion? |
|---------|--------|---------------------------------|
| Splash card hover | `translateY(-2px) rotate(-0.3deg)` over 0.3s ease | YES |
| Gallery tile hover | `scale(1.02) rotate(-0.3deg)` over 0.25s ease | YES |
| Status pill dot | `pulse 1.6s ease-in-out infinite` (opacity 1↔0.4) | YES |
| Card / tile static rotation (sketch -1° to +1°) | Static — not motion | N/A — kept under reduced-motion (it's composition, not animation) |
| Anything else | NONE — Phase 3 ships zero JS-driven motion | — |

**Reduced-motion shorthand (one block in tokens.css or Base.astro `<style is:global>`):**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .b-card:hover, .b-piece:hover { transform: none !important; }
}
```

(Sketch's per-card static rotations are kept — the contract is "no motion under reduced-motion," not "no transforms." Static `transform: rotate(-1deg)` is composition.)

---

## Accessibility Contract

| Concern | Phase 3 contract | Phase that verifies |
|---------|------------------|---------------------|
| Color contrast (body) | Body copy ≥4.5:1 — verified above for ink/paper, paper/cobalt, ink/acid, paper/plum, paper/teal | Phase 5 (Lighthouse a11y ≥95) |
| Color contrast (large text) | Card text ≥3:1 — paper on terracotta is 4.1:1 (AA Large), passes for the 22–36px @ 800 weight card titles | Phase 5 |
| Color contrast (accent text on ink) | Acid on ink 12.6:1 (AAA), terracotta on ink 3.6:1 (Large only — flagged for nav-link audit when Phase 4 wires the topbar nav) | Phase 4 (when nav arrives) + Phase 5 |
| Focus visibility | Every interactive element MUST have a visible focus ring (3px outline, contrasting token, 3–4px offset). No `outline: none`. | Phase 5 keyboard walk |
| Tap targets | Cards and tiles are large by composition (≥44px in every dimension). Back-pill at `padding: 8px 14px` with mono 11px text → ~28px tall — Phase 5 to bump to 44px equivalent if mobile audit flags. | Phase 5 |
| Keyboard nav | Tab order: topbar → hero band (skip if no interactive children) → 4 cards left-to-right → footer. Phase 3 ships semantic `<a>` elements; doesn't add `tabindex` overrides. | Phase 5 |
| Reduced-motion | Wired (D-13) — see Motion Contract above. Verified at OS level Phase 5. | Phase 5 |
| Screen-reader text | Card `<a>` has accessible name from card-name text content. Decorative `<span class="deco">` MUST have `aria-hidden="true"` on every variant (k1–k4, p1–p5). Status pill: dot is `<span aria-hidden="true">` — pill text "OPEN TO ROLES" is the SR-readable content. | (declared here, executor implements) |
| `<html lang="en">` | Set in Base.astro per RESEARCH.md Pattern 1 | (executor) |
| Image alt text | Portrait: `alt="Portrait of Caleb Lim"`. Gallery tile thumbs reuse Phase 2's piece `title` as alt. Decorative bg patterns: not images, no alt. | (executor) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — D-17 explicitly rejects shadcn; CLAUDE.md "What NOT to Use" treats stock shadcn defaults as anti-AI-tells |
| Third-party registries | none | not applicable — zero third-party UI block dependencies in Phase 3 |
| npm dependencies (font-only) | `@fontsource-variable/bricolage-grotesque` 5.2.10, `@fontsource-variable/fraunces` 5.2.9, `@fontsource-variable/jetbrains-mono` 5.2.8 | **vetted via npm registry on 2026-05-14** — all three are MIT-licensed font-only packages from the official Fontsource org; verified scope `@fontsource-variable/*` resolves to `github.com/fontsource/fontsource`. No JS code execution surface — packages are CSS + woff2 only. |

**Anti-AI-tell verification gate (Phase 3 SC6):** Implemented as `scripts/verify-anti-ai-tells.sh` (per RESEARCH.md "Anti-AI-Tell Verification" §) PLUS manual checklist `.planning/phases/03-visual-design-system/ANTI-AI-CHECKLIST.md`. Both gates MUST pass before phase exit. Specifically forbidden in Phase 3:

- `Inter` font reference anywhere in `src/`, `astro.config.mjs`, `package.json`
- `lucide-*`, `@radix-ui/*`, `@shadcn/*`, `tailwindcss-animate`, `tailwindcss` in dependencies
- Purple gradients (linear or radial)
- "Built with X" footer copy
- `bento` class names
- shadcn-style `rounded-2xl shadow-md` cards
- Bento-grid composition
- Centered hero with gradient

---

## Component Inventory

| Component | File | Props | States | Notes |
|-----------|------|-------|--------|-------|
| `Base` | `src/layouts/Base.astro` | `title: string`, `bg?: 'paper' \| 'ink'` (default `'paper'`) | — | Imports tokens.css + Fontsource CSS; preloads Bricolage display woff2; renders topbar + slot + footer |
| `StatusPill` | `src/components/StatusPill.astro` | none (copy is internal — change at execution time) | default, reduced-motion (no pulse) | Always rendered in Base topbar |
| `DisciplineCard` | `src/components/DisciplineCard.astro` | `category: Discipline`, `accent: string`, `k: 1\|2\|3\|4` | default, hover, focus, active, reduced-motion | Used by splash AND 404 (single source of truth per D-14) |
| `GalleryA12` | `src/components/GalleryA12.astro` | `pieces: Piece[]`, `category: Discipline` | — (composition only) | Renders 1–2 pieces: hero (`p1` 6-col span) + wide tile (`p2` 6-col span) |
| `GalleryB35` | `src/components/GalleryB35.astro` | `pieces: Piece[]`, `category: Discipline` | — | Sketch's exact 5-tile composition (lines 603–612). Renders only N tiles where N = `pieces.length` (3, 4, or 5). |
| `GalleryC68` | `src/components/GalleryC68.astro` | `pieces: Piece[]`, `category: Discipline` | — | Bucket B + extra row of three 2×1 tiles (orders 6–8). Slight rotation variance to avoid literal repeat. |

**No additional component files needed for Phase 3.** Page-level styles (splash hero band, category header, detail header) live in scoped `<style>` blocks within their respective `.astro` page files.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (FLAG noted for `→ KEEP READING` directional cue — accepted as sketch-locked)
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS WITH OVERRIDE (OVERRIDE-01 + OVERRIDE-02 — see Verification Override Register)
- [ ] Dimension 5 Spacing: PASS WITH OVERRIDE (OVERRIDE-03 — see Verification Override Register; token scale conforms strictly, sketch-locked raw values enumerated outside the scale)
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
