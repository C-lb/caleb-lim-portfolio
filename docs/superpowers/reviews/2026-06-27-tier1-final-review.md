# Tier 1 "recruiter conversion" — final whole-branch review

Range: `1309503..bb7e7ea` (5 commits, 5 tasks)
Reviewer: final whole-branch gate
Date: 2026-06-27

## 1. Merge verdict

**Ready after fixes.**

No Critical findings. The branch is integration-sound: prop/type contracts match the
content schema, `pieces[0]` / `pieces.slice(1)` are guarded by the count branch, all four
`/[category]` routes still emit, OG/meta wiring is correct, and the new CSS holds the
anti-vibecode line (one accent, soft diffuse shadows, no side stripes, no second accent).
The blockers to a clean merge are the two already-queued meta-description em dashes (ground
truth, not re-counted here) plus the Minor items below. Nothing here needs a redesign; the
fixes are small and mechanical.

## 2. Findings

(Excludes the ground-truth items: the two pre-existing RED gate scripts, the verified
non-draft counts, and the two known shipped meta-description em dashes in `index.astro` and
`Base.astro`.)

### Critical
None.

### Important

**I-1 — Heading-type inconsistency between the lead piece and the gallery tail.**
`src/components/FeaturedPiece.astro:36` titles the piece with `<h3>`, but
`src/components/Gallery.astro:35` titles each tile with a plain `<span class="g-ttl">` (no
heading element). On a `>=2` page the two render side by side: the lead is an `<h3>`, the
rest are unstructured spans. The page `<h2>` lives at `[category].astro:78`, so the lead's
`<h3>` nests correctly under it — that part is sane. The defect is that the gallery tiles
that are peers of the lead carry no heading at all, so a screen-reader rotor shows exactly
one piece heading on a multi-piece page and none for the others. This is a pre-existing
Gallery trait the branch did not introduce, but the branch is what first places an `<h3>`
piece title next to those heading-less tiles, making the asymmetry newly visible.
*Fix:* promote `g-ttl` to `<h3>` in Gallery (`<h3 class="g-ttl">{piece.data.title}</h3>`)
so the lead piece and the tail share one heading level under the page `<h2>`. Restyle
`.g-ttl` to `margin:0` if the default `<h3>` margin disturbs the card. If you would rather
not touch Gallery in this branch, log it as a fast-follow — but the two pieces ranking
differently in the a11y tree is the kind of thing this gate exists to catch.

### Minor

**M-1 — `<dl>` used for two non-term/definition pairs.**
`src/components/FeaturedPiece.astro:38-41` renders Context/Outcome as a `<dl>` with
`<dt>`/`<dd>`. "Context" and "Outcome" are section labels, not dictionary terms, so the
description-list semantics are a slight stretch (the same content on the detail page at
`[category]/[slug].astro` uses plain labelled blurb blocks, not a `<dl>`). Not wrong enough
to block — `<dl>` for metadata key/value pairs is defensible and screen readers announce it
cleanly. Flagging only for consistency with the detail page's treatment. *Fix (optional):*
mirror the detail-page markup, or leave as-is.

**M-2 — Off-scale `2px` margin in new CSS.**
`src/components/FeaturedPiece.astro:119` — `.feat-cr dt { margin-bottom: 2px; }` is off the
4px spacing scale (the project's smallest token is `--sp-1: 4px`). Everything else in this
file uses tokens correctly. *Fix:* drop to `var(--sp-1)` or remove (the `dt`/`dd` already
read as a unit at this size).

**M-3 — `void DISCIPLINE_ACCENT` dead-import suppression now slightly more load-bearing,
unchanged but worth a note.** `src/pages/index.astro:62` still imports `DISCIPLINE_ACCENT`
only to `void` it for the lint. The branch does not touch this, but since the branch adds a
real consumer of `DISCIPLINE_ACCENT` next door (FeaturedPiece imports it directly from
`../styles/disciplines`), the splash's import-and-void is now purely cosmetic. Not a branch
defect; noting so a future cleanup can delete the import and the `void` line together. No
action required for merge.

### Verified clean (no finding)

- **Integration / prop contracts:** `FeaturedPiece` destructures `{ title, role, context,
  outcome, hero }` from `piece.data`; all five are required, non-empty fields in
  `src/content.config.ts:11-17`, so no `undefined` reaches the template. `category` prop is
  typed `Category` and only used for the accent lookup and the href.
- **`pieces[0]` safety:** every `FeaturedPiece` render sits inside the `n === 1` or `n >= 2`
  (`else`) branch of `[category].astro:113-122`, both of which guarantee `pieces[0]` exists.
  The `n === 0` branch never touches it.
- **`pieces.slice(1)` correctness:** on `n >= 2`, lead = `pieces[0]`, gallery =
  `pieces.slice(1)` — no overlap, no dropped piece, order preserved (the array is pre-sorted
  by `order` at `[category].astro:23`).
- **Link consistency:** FeaturedPiece links `/${category}/${piece.id}`; Gallery links the
  same; `[slug].astro:36` keys `getStaticPaths` on `p.id`. All three agree, so no broken
  links from the new lead-piece card.
- **All four routes still emit:** `getStaticPaths` at `[category].astro:15` maps over
  `CATEGORIES` unchanged; the body branch only changes what renders, not which params emit.
- **Anti-vibecode (new CSS):** single accent confined to the eyebrow + cue
  (`--accent`, FeaturedPiece:62,86 region); shadows are soft diffuse blurs with negative
  spread (no hard slabs); no side accent stripe; full interactive states present
  (`:hover` gated behind `(hover:hover) and (pointer:fine)`, `:focus-visible`,
  `prefers-reduced-motion`); spacing uses tokens except M-2. The `outline: 3px` /
  `translateY(-3px)` values match Gallery's existing card pattern verbatim, so they are
  house-consistent, not off-scale ad-hoc values.
- **Gallery grid change:** `auto-fit minmax(260px,360px)` + `justify-content:center` is the
  right idiom for killing trailing empty gutters on small tails; phone breakpoint switches to
  `minmax(220px,1fr)` so cards stretch full-width. Removing the old `grid-column: span N`
  rules is clean — no orphaned selectors left behind.
- **OG / meta correctness:** `site` set in `astro.config.mjs`; `ogUrl` and `canonical` built
  with `new URL(..., Astro.site)` → absolute URLs. One of each tag (no duplicates). Canonical
  uses `Astro.url.pathname` against `site`, correct per-page. Twitter `summary_large_image`
  pairs with the 1200x630 `public/og.png`. `description` flows through with a sane fallback.
- **Em dashes in shipped copy:** every `—` match outside the two known meta descriptions is
  inside a code comment, not user-facing copy. The new shipped strings (`cardLens`,
  `comingSoonLead`, `comingSoonBlurb`, "Featured work", "View piece", the rewritten About-Me
  positioning line) are all clean.
- **Banned filler:** no `passionate` / `multidisciplinary` / `intersection of` in any shipped
  string. (The About page mentions the ban only in a code comment.)
- **Empty-room copy rewrite:** reads as deliberate ("posted here yet" + push to the populated
  rooms), drops the "still being hung" unfinished tell. `readyCategories` is recomputed from a
  fresh non-draft `getCollection`, so the "work that's ready" links stay accurate.

## 3. Not verifiable from the diff

- **`public/og.png` actual dimensions / content.** The diff shows a 29 KB binary added. I did
  not open it; confirm it is genuinely 1200x630 and renders legibly when scaled to a
  link-preview card. (The `summary_large_image` card assumes ~2:1; a mis-sized image degrades
  silently.)
- **`Image priority` behaviour.** `priority` is a valid Astro 5 `<Image>` prop (sets eager +
  high fetchpriority). Whether it is the right call depends on whether the featured image is
  actually above the fold on the category page — plausible for the sole/lead piece, but not
  confirmable without rendering. Low risk.
- **Live render of the `>=2` layout.** The FeaturedPiece + Gallery(rest) stacking and the
  900px / 600px breakpoint handoffs look correct in CSS but were not browser-verified here.
- **Visual contrast of `.b-card-lens` at `opacity:0.68` on the accent card backgrounds.**
  `--paper` at 0.68 over each discipline tile colour may dip under WCAG AA for 13px text on
  the lighter tiles (the splash already has a documented contrast note for the status tag).
  Worth a quick contrast check on the design/finance tiles; not blocking.
