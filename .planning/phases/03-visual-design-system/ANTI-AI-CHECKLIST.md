# Phase 3 Anti-AI-Tell Checklist

**Purpose:** Manual walk-through gate that the executor + `/gsd-ui-review` + `/gsd-code-review` use at phase exit to verify VISUAL-04 / ROADMAP Phase 3 SC6 compliance.

**Run order:**
1. `npm run build` (must exit 0)
2. `bash scripts/verify-anti-ai-tells.sh` (must exit 0 — automated grep gate)
3. `npm run preview` and walk this checklist at 1280×800 desktop AND at 375px / 768px mobile widths
4. Open `.planning/sketches/001-direction-comparison/index.html` side-by-side and compare `.variant-b` fidelity

Each item: tick `[x]` when verified, `[ ]` while pending. Leave a one-line note if a borderline case needs review.

---

## Automated grep gates (verify-anti-ai-tells.sh covers these)

- [ ] **A1** No `Inter` font reference anywhere in `src/` or `astro.config.mjs` (whole-word grep)
- [ ] **A2** No `lucide-*`, `@radix-ui/*`, `@shadcn/*`, `tailwindcss`, `tailwindcss-animate` in `package.json`
- [ ] **A3** No purple / violet / fuchsia gradient in `src/` or `dist/_astro/*.css`
- [ ] **A4** No "Built with X" / "Made with X" footer copy in `dist/**/*.html`
- [ ] **A5** No `bento`, `bento-grid`, `bento-tile` identifiers in `src/`
- [ ] **A6** No `rounded-2xl shadow-md` or `shadow-md rounded-2xl` utility combos (shadcn card tell)
- [ ] **A7** No `lucide` reference anywhere

## Visual sweep (manual — preview at 1280×800)

- [ ] **V1 — No centered hero with gradient.** Splash hero band is asymmetric 3-column (portrait | name+roles | bio sticker), NOT a centered title with gradient background.
- [ ] **V2 — No shadcn-style cards.** Discipline cards use solid accent backgrounds + per-card static rotation + per-card decorative geometry. NOT translucent gray cards with rounded-2xl + drop shadow.
- [ ] **V3 — No Inter rendering.** Inspect splash name + question bar + card titles in DevTools → Computed → font-family. Must show "Bricolage Grotesque Variable". NOT Inter, NOT system-ui fallback (means font failed to load).
- [ ] **V4 — No purple gradients.** Walk splash, all four galleries, about, detail, 404. No linear-gradient or radial-gradient in purple/violet/fuchsia.
- [ ] **V5 — No lucide / hero icons.** No icon-component imports. The only "icons" in the site are typographic glyphs: `←` (back-pill), `↓` (question-bar arrow), `→` (markers). All inline text.
- [ ] **V6 — No bento-grid composition.** Galleries use sketch's asymmetric 5-tile (Bucket B) or its variants (A, C). NOT a uniform 3×3 / 4×3 bento. Tiles have visible rotation + varied sizes + intentional negative space.
- [ ] **V7 — No "Built with Astro" footer.** Footer reads `caleb lim — 2026` / `available for full-time roles, brand+analyst+design` / `singapore · global`. No build-tool attribution.

## Voice / copy sweep (ROADMAP SC6 + voice contract carries from Phase 2 D-14)

- [ ] **C1** No "passionate / multidisciplinary / intersection of" filler in any new copy added in Phase 3 (about bio is Phase 2 carry-forward and exempt from re-review)
- [ ] **C2** No "Hire Me" big-type CTA — the four discipline cards ARE the primary CTA
- [ ] **C3** No exclamation points in any new Phase 3 copy
- [ ] **C4** No skill bars, percentage charts, or testimonial sliders
- [ ] **C5** Splash question bar reads exactly: `What do you wish to see?` with `<em>see</em>` in italic terracotta Fraunces

## Sketch fidelity sweep (Phase 3 SC6 — compare against sketch .variant-b)

- [ ] **S1** Splash topbar shows `caleb lim` lowercase mono + status pill ("OPEN TO ROLES" with pulsing acid dot) + empty nav slot (Phase 4 wires)
- [ ] **S2** Splash 4 discipline cards visible above the fold @ 1280×800 without scroll
- [ ] **S3** Each discipline card carries the correct accent color (design=terracotta, finance=cobalt, personal=lime, marketing=plum)
- [ ] **S4** Each discipline card carries its k1–k4 decoration (k1 outline circle, k2 italic lime numeral, k3 dotted line, k4 lime triangle)
- [ ] **S5** Card rotations match sketch: k1 -1°, k2 +1°, k3 -0.5°, k4 +0.7°
- [ ] **S6** Category page is ink-black background; category title shows `<label> /<count>` with the numeral in italic Fraunces in the discipline accent
- [ ] **S7** Gallery uses Bucket A / B / C per piece count; tiles have rotation + decorative geometry per sketch
- [ ] **S8** Detail page is paper background; detail header carries discipline accent via top border
- [ ] **S9** About page is paper background; bio paragraph renders in Fraunces 15.5px at 1.42 line-height
- [ ] **S10** 404 page is paper background; giant "404" in Bricolage display; caption in Fraunces italic; four DisciplineCards repeated below

## Sign-off

- [ ] **`/gsd-code-review` PASS** — grep gates green, no forbidden deps, no Inter, no lucide
- [ ] **`/gsd-ui-review` PASS** — visual sweep S1–S10 clean against sketch
- [ ] **Manual executor sign-off** — all items above ticked

**Phase 3 cannot ship until every box is ticked.**
