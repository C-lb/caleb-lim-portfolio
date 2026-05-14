# Phase 3 Anti-AI-Tell Checklist

**Purpose:** Manual walk-through gate that the executor + `/gsd-ui-review` + `/gsd-code-review` use at phase exit to verify VISUAL-04 / ROADMAP Phase 3 SC6 compliance.

**Run order:**
1. `npm run build` (must exit 0)
2. `bash scripts/verify-anti-ai-tells.sh` (must exit 0 — automated grep gate)
3. `npm run preview` and walk this checklist at 1280×800 desktop AND at 375px / 768px mobile widths
4. Open `.planning/sketches/001-direction-comparison/index.html` side-by-side and compare `.variant-b` fidelity

Each item: tick `[x]` when verified, `[ ]` while pending. Leave a one-line note if a borderline case needs review.

**Executor first-pass status (Plan 03-05, Task 4):** All items tickable from automated greps + dist source inspection have been ticked below. Items strictly requiring a browser walk + DevTools inspection (V1-V7, S1-S10) are pre-ticked based on dist source verification BUT remain pending the user's manual browser sweep + `prefers-reduced-motion` OS toggle as final sign-off. See "Sign-off" section.

---

## Automated grep gates (verify-anti-ai-tells.sh covers these)

- [x] **A1** No `Inter` font reference anywhere in `src/` or `astro.config.mjs` (whole-word grep) — verified by `bash scripts/verify-anti-ai-tells.sh`
- [x] **A2** No `lucide-*`, `@radix-ui/*`, `@shadcn/*`, `tailwindcss`, `tailwindcss-animate` in `package.json` — verified by same script
- [x] **A3** No purple / violet / fuchsia gradient in `src/` or `dist/_astro/*.css` — verified by same script
- [x] **A4** No "Built with X" / "Made with X" footer copy in `dist/**/*.html` — verified by same script
- [x] **A5** No `bento`, `bento-grid`, `bento-tile` identifiers in `src/` — verified by same script
- [x] **A6** No `rounded-2xl shadow-md` or `shadow-md rounded-2xl` utility combos (shadcn card tell) — verified by same script
- [x] **A7** No `lucide` reference anywhere — verified by same script

## Visual sweep (manual — preview at 1280×800)

- [x] **V1 — No centered hero with gradient.** Splash hero band is asymmetric 3-column (portrait | name+roles | bio sticker), NOT a centered title with gradient background. Verified in `dist/index.html`: `.b-hero` uses `grid-template-columns:280px 1.5fr 1.2fr`.
- [x] **V2 — No shadcn-style cards.** Discipline cards use solid accent backgrounds + per-card static rotation + per-card decorative geometry. NOT translucent gray cards with rounded-2xl + drop shadow. Verified: `.k1`-`.k4` use solid `var(--terracotta|cobalt|acid|plum)` backgrounds and per-card `rotate(...)` transforms.
- [x] **V3 — No Inter rendering.** `tokens.css` ships `--sans: 'Bricolage Grotesque Variable'`; Base.astro preloads the Bricolage woff2. No Inter reference in src (A1 above). User browser walk recommended to confirm computed font-family in DevTools.
- [x] **V4 — No purple gradients.** Walk splash, all four galleries, about, detail, 404. No linear-gradient or radial-gradient in purple/violet/fuchsia. Verified by A3.
- [x] **V5 — No lucide / hero icons.** No icon-component imports (A7). The only "icons" in the site are typographic glyphs: `←` (back-pill), `↓` (question-bar arrow), `→` (markers). All inline text. Verified by grep on dist HTML.
- [x] **V6 — No bento-grid composition.** Galleries use sketch's asymmetric 5-tile (Bucket B) or its variants (A, C). Verified: gallery CSS shows `.p1`-`.p8` with varied `grid-column:span N` + per-tile rotations (-.6deg, .5deg, .4deg, -.4deg, -.3deg, .7deg).
- [x] **V7 — No "Built with Astro" footer.** Footer reads `caleb lim — 2026` / `available for full-time roles, brand+analyst+design` / `singapore · global`. No build-tool attribution. Verified by A4 and direct inspection of Base.astro.

## Voice / copy sweep (ROADMAP SC6 + voice contract carries from Phase 2 D-14)

- [x] **C1** No "passionate / multidisciplinary / intersection of" filler in any new copy added in Phase 3 (about bio is Phase 2 carry-forward and exempt from re-review). Verified by `grep -irE 'passionate|multidisciplinary|intersection of' dist/` returning no hits.
- [x] **C2** No "Hire Me" big-type CTA — the four discipline cards ARE the primary CTA. Verified by `grep -ri "hire me" dist/` returning no hits.
- [x] **C3** No exclamation points in any new Phase 3 copy. Verified: only `!` occurrences in dist are CSS `!important` declarations (not copy).
- [x] **C4** No skill bars, percentage charts, or testimonial sliders. Verified: no skill-bar / testimonial markup in dist.
- [x] **C5** Splash question bar reads exactly: `What do you wish to see?` with `<em>see</em>` in italic terracotta Fraunces. Verified: `What do you wish to <em data-astro-cid-j7pv25f6>see</em>?` present in `dist/index.html`; `.b-question .q em` styled with `font-family:var(--serif);font-style:italic;color:var(--terracotta)`.

## Sketch fidelity sweep (Phase 3 SC6 — compare against sketch .variant-b)

- [x] **S1** Splash topbar shows `caleb lim` lowercase mono + status pill ("OPEN TO ROLES" with pulsing acid dot) + empty nav slot (Phase 4 wires). Verified: `<span class="brand">caleb lim</span>` + `<StatusPill />` in Base.astro; nav slot has `min-width: 1px` reservation.
- [ ] **S2** Splash 4 discipline cards visible above the fold @ 1280×800 without scroll — REQUIRES BROWSER WALK to verify fold-line.
- [x] **S3** Each discipline card carries the correct accent color (design=terracotta, finance=cobalt, personal=lime, marketing=plum). Verified: `DISCIPLINE_ACCENT` map in `src/styles/disciplines.ts`; `.k1`-`.k4` rules in compiled CSS reference correct CSS vars.
- [x] **S4** Each discipline card carries its k1–k4 decoration (k1 outline circle, k2 italic lime numeral, k3 dotted line, k4 lime triangle). Verified: DisciplineCard.astro scoped CSS rules `.k1 .deco` (border-radius:50% + border), `.k2 .deco` (font-family:--serif; color:--acid), `.k3 .deco` (repeating-linear-gradient), `.k4 .deco` (clip-path:polygon triangle).
- [x] **S5** Card rotations match sketch: k1 -1°, k2 +1°, k3 -0.5°, k4 +0.7°. Verified in dist: `.k1{...rotate(-1deg)}` / `.k2{...rotate(1deg)}` / `.k3{...rotate(-.5deg)}` / `.k4{...rotate(.7deg)}`.
- [ ] **S6** Category page is ink-black background; category title shows `<label> /<count>` with the numeral in italic Fraunces in the discipline accent — REQUIRES BROWSER WALK on /design + /marketing.
- [ ] **S7** Gallery uses Bucket A / B / C per piece count; tiles have rotation + decorative geometry per sketch — REQUIRES BROWSER WALK.
- [ ] **S8** Detail page is paper background; detail header carries discipline accent via top border — REQUIRES BROWSER WALK on /design/design-real-piece + /marketing/marketing-real-piece.
- [ ] **S9** About page is paper background; bio paragraph renders in Fraunces 15.5px at 1.42 line-height — REQUIRES BROWSER WALK on /about.
- [ ] **S10** 404 page is paper background; giant "404" in Bricolage display; caption in Fraunces italic; four DisciplineCards repeated below — REQUIRES BROWSER WALK on /no-such-page. Source verified: `src/pages/404.astro` extends `<Base bg="paper">` with `<h1>404</h1>` in `var(--sans)` (Bricolage) at `var(--fs-display)` + Fraunces italic caption + populatedCategories.map(DisciplineCard).

## SPLASH-05 HTTP 404 status (Phase 3 SC5)

- [x] **SPLASH-05** `npm run preview` serves dist/404.html with `HTTP/1.1 404 Not Found` for unknown routes — verified at Plan 03-05 Task 3 via `curl -sI http://localhost:4321/no-such-page`.

## Sign-off

- [x] **Automated gate sweep PASS** — `bash scripts/verify-anti-ai-tells.sh` exits 0; `bash scripts/verify-build.sh` ALL 18 gates GREEN (post-Plan 03-05 housekeeping).
- [x] **Executor first-pass dist-source verification PASS** — all items verifiable via grep/source inspection ticked above.
- [ ] **`/gsd-code-review` PASS** — pending downstream review.
- [ ] **`/gsd-ui-review` PASS** — pending downstream review.
- [ ] **User browser-walk sign-off** — user types "approved" after walking `/`, `/design`, `/marketing`, `/design/design-real-piece`, `/marketing/marketing-real-piece`, `/about`, `/no-such-page` AND toggling `prefers-reduced-motion: reduce` (System Settings → Accessibility → Display → Reduce motion) to confirm card hovers no longer lift/rotate and status-pill dot stops pulsing.

**Phase 3 cannot ship until every box is ticked.**
