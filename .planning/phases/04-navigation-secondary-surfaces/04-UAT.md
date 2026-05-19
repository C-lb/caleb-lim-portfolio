---
status: complete
phase: 04-navigation-secondary-surfaces
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
mode: mvp
started: 2026-05-18T09:40:00Z
updated: 2026-05-18T17:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Splash header chrome
expected: |
  On the splash (/), the header shows 4 visible affordances: brand link, mailto link
  whose visible text IS the full email "caleb.lim.2024@smu.edu.sg" (no "email" label),
  LinkedIn (new tab), Resume download. Desktop ≥768px, no hamburger.
result: pass
resolved_after: 1 inline fix
prior_attempts:
  - attempt: 1
    reported: "instead of email being caleblimster, put caleb.lim.2024@smu.edu.sg and instead of it being called 'email', call it my full email name to avoid people needing to click the link to know my email"
    severity: major
    fixed_by:
      - src/layouts/Base.astro:34 — mailto target + link text now caleb.lim.2024@smu.edu.sg (full email)
      - src/pages/about.astro:32-33 — removed "email" label span; link text already the email, swapped address
      - scripts/verify-build.sh:543 — Gate 19a grep updated to new address
      - scripts/verify-build.sh:642 — Gate 19e grep updated to new address

### 2. Header consistency across routes
expected: |
  Walk: / → /design (or /marketing, whichever is populated) → click into one piece → /about →
  visit any non-existent URL to hit /404. The same 4-affordance header reads identically on every
  page (same brand link, same email link "caleb.lim.2024@smu.edu.sg", same linkedin, same resume —
  no missing items, no shifted positions). Capture one quick screenshot per route shape if convenient.
result: pass
note: "Passed after 5 inline fixes during walk — email correction, role-link scroll, bio-card clickable, About wireframes, two palette refreshes + analyst/designer role color swap to --teal."

### 3. Detail-page prev/next + back-pill
expected: |
  Open any populated piece (e.g. one in /design or /marketing). At the bottom of the detail page
  you should see:
    - A "Back to [Category]" pill/link returning to the gallery you came from (this was already
      shipped in Phase 3 — confirm it's still there).
    - NO prev/next pager today, because each populated category has exactly 1 piece. This is
      correct behavior (hide-at-edges). The pager is wired in source and will appear automatically
      when a 2nd piece lands in any discipline.
  If you see a "next" or "prev" link pointing to a different discipline — that's a bug; report it.
result: pass

### 4. About contact block + bio rewrite + scrollable wireframes
expected: |
  Visit /about. Walk: new bio paragraph (humanised tone, 117 words, starts "I'm Caleb, and I don't pick
  a lane.", em-dashes removed) → 3 photo wireframes in horizontal scrollable carousel, centered initial
  state → resume download (preserved) → contact block with symmetric label/value rows (email + linkedin) → NO Calendly.
result: pass

### 5. Mailto deliverability (manual external)
expected: |
  From an account that ISN'T caleb.lim.2024@smu.edu.sg, send a short test email to
  caleb.lim.2024@smu.edu.sg. Within 5 minutes, check the SMU inbox. Should arrive,
  not spam-foldered, not bounced.
result: pass

### 6. LinkedIn link safety (opens in new tab)
expected: |
  On the splash (/) header AND on /about: click the LinkedIn link. Opens in new tab, goes to
  https://linkedin.com/in/caleblkr. Gate 20 (target=_blank rel=noopener noreferrer) holds.
result: pass
note: "User: 'it works' (= pass)"

### 7. Skip-to-content keyboard walk
expected: |
  Load the splash (/) in a fresh tab (so focus starts outside the page). Press Tab ONCE. You
  should see a "Skip to content" link appear top-left (it's hidden until focused). Press Enter.
  Focus should jump PAST the header to the <main> element — Tab once more to confirm you're now
  on the splash's first interactive element, not still on header chrome.
  Repeat the same on /about and on one populated piece detail page.
result: pass

### 8. mailto link opens mail client
expected: |
  On /about, click the "caleb.lim.2024@smu.edu.sg" link. Your default mail client (Mail.app,
  Outlook, Gmail web compose, etc.) should open with a new draft addressed to
  caleb.lim.2024@smu.edu.sg. No subject line should be prefilled (clean link, per O-3 RESOLVED).
result: pass

### 9. Splash role labels scroll to matching cards (UAT-driven enhancement)
expected: |
  On http://localhost:4321/, click each of the four role labels under CALEB LIM:
    - "analyst" → page scrolls down (finance card is dropped — empty discipline — so this
      lands at the .b-cards container roughly, NOT on a specific finance card)
    - "brand strategist" → page scrolls to the Marketing card
    - "designer" → page scrolls to the Graphic Design card
    - "marketer" → page scrolls to the Marketing card (same target as brand strategist)
  Scroll should be smooth (animated, ~300ms), not an instant jump. If your OS has
  prefers-reduced-motion enabled, it WILL be an instant jump — that's correct.
  Focusing a role label with Tab should show a visible focus ring (ink-colored outline).
result: pass
resolved_after: 1 inline fix
prior_attempts:
  - attempt: 1
    reported: "scrolls, and also shakes the corresponding card"
    severity: enhancement
    fixed_by:
      - src/components/DisciplineCard.astro:273-277 — added .b-card.is-shaking class re-using card-shake @keyframes with 0ms delay so it fires on demand
      - src/pages/index.astro:572-580 — click handler now adds .is-shaking to target card after scroll, force-reflows to re-trigger, removes class on animationend

### 10. "THE PITCH" bio card is clickable → /about (UAT-driven enhancement)
expected: |
  On http://localhost:4321/, click anywhere on the yellow/acid "THE PITCH" bio card
  (the rotated card containing "CROSS-FUNCTIONAL — BY DESIGN." and ending with "→ KEEP READING").
  The entire card is now a single click target — clicking anywhere on it navigates to /about.
  Hovering should lift the card slightly (subtle translateY animation). Tabbing onto the card
  shows a focus ring. The "→ KEEP READING" text inside remains the visual cue.
result: pass

### 11. About page wireframes (UAT-driven enhancement)
expected: |
  Visit http://localhost:4321/about. Between the bio paragraph and the resume download, you
  should see 3 dashed-border placeholder boxes laid out in a row (3-col desktop, 1-col mobile):
    - PHOTO · 01 — at the desk — wide shot     (wider, 3:4 aspect)
    - PHOTO · 02 — in the studio — portrait    (4:5 aspect)
    - PHOTO · 03 — process / sketch in progress (4:5 aspect)
  Each box has a dashed terracotta border and reads as scaffolding (intentional placeholder,
  NOT a finished gallery). When you have real photos, drop them in src/assets/about/ and
  replace the <figure>s. The bio above + contact block below should be unchanged.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
fixes_applied_inline: 37

## Gaps

- truth: "Header + About mailto address should be caleb.lim.2024@smu.edu.sg, and the visible link text should be the full email itself (not 'email' or 'Contact') so recruiters can read the address without clicking"
  status: fixed_inline
  reason: "User reported on Test 1: instead of email being caleblimster, put caleb.lim.2024@smu.edu.sg and instead of it being called 'email', call it my full email name to avoid people needing to click the link to know my email"
  severity: major
  test: 1
  fix_commit: pending
  files_modified:
    - src/layouts/Base.astro
    - src/pages/about.astro
    - scripts/verify-build.sh
  artifacts:
    - "verify-build.sh ALL GREEN exit 0 after rebuild"
  missing: []

- truth: "About page: (a) photo wireframes now in a horizontally-scrollable carousel with scroll-snap, centered initial position via inline script when overflowing or CSS justify-content when fitting; (b) email row restored 'email' label span matching the linkedin row for visual symmetry within the contact list (header still shows full email as link text — different surface, different intent); (c) bio paragraph rewritten in a more voice-y/passionate tone (119 words, banned-phrase clean — avoids the literal 'passionate' trigger word by conveying voice through ownership statements instead)"
  status: fixed_inline
  reason: "User reported during Test 4: keep the 3 photo wireframes to be scrollable, but its initial setting be centralised with the website. give my email a email label similar to linkedin's, change the bio paragraph to sound more humanised and passionate."
  severity: enhancement
  scope_note: "Phase 3 about territory. Bio rewrite supersedes Phase 2 D-12/D-14 verbatim contract — comment updated to reflect that. ABOUT-01 gate still passes (119 words, no banned phrases)."
  test: "Test 4 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/about.astro (bio rewrite + email label restored + photo-track CSS overhaul + inline scroll-center script + comment update)
  artifacts:
    - "bio: 119 words (was 111); ABOUT-01 OK"
    - "contact list: email + linkedin rows now symmetric (both have label spans)"
    - "3 <figure> wireframes inside .about-photos-track; carousel scrolls on overflow, centers on fit"
  banned_phrase_check: "passionate/multidisciplinary/intersection-of all absent from new bio copy; conveyed via 'work that excites me', ownership statements, and rhythm-of-the-day imagery instead"
  followup_2026_05_18_T4: "User: 'no em dashes for the description'. Replaced both em-dashes in bio with commas. 117 words now; ABOUT-01 still OK."
  missing: []

- truth: "Splash card layout: 2×2 matrix (two columns, two rows) instead of a single 4-wide row. Personal Projects (k3) card decoration redesigned — replaces horizontal dotted line with a 4-pointed editorial sparkle/star motif (CSS-only, two crossed radial-gradient ellipses with tapered ends, rotated 12deg)."
  status: fixed_inline
  reason: "User reported during Test 3: Make the cards in a 2x2 matrix, and pick a new card design for personal projects"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Grid template flipped from '1.2fr 0.85fr 1fr 1fr' to '1fr 1fr' for the 4-card case (CSS grid wraps to 2 rows naturally). k3 .deco fully rewritten — distinct from k1 circle / k2 numeral / k4 triangle."
  test: "Test 3 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (gridTemplate 4-key flipped to 1fr 1fr)
    - src/components/DisciplineCard.astro (k3 deco replaced; comment updated)
  artifacts:
    - "dist/index.html: grid-template-columns: 1fr 1fr (was 1.2fr 0.85fr 1fr 1fr)"
    - "k3 deco: editorial 4-point sparkle, top-right corner, ink color over deep-gold background"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Splash shows all 4 discipline cards (design, finance, personal, marketing). Empty disciplines (finance + personal) render as non-clickable placeholders with 'in the works — coming soon' cue. Reverses Phase 3 SPLASH-04 drop-card decision."
  status: fixed_inline
  reason: "User reported during Test 3 walk: add placeholder cards for finance analyst and personal projects as well"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Reverses SPLASH-04 (D-07). Placeholders use the same discipline color + decoration as populated cards but render as <div> (no href, no hover-lift, italic cue text). Gate 18 (Phase 3 SPLASH-04 contract) still passes because placeholder cards emit no href — the gate counts splash hrefs vs populated routes, and unmoving 2-vs-2 keeps it OK."
  test: "Test 3 (raised)"
  fix_commit: pending
  files_modified:
    - src/components/DisciplineCard.astro (added isEmpty prop + conditional <a>/<div> + .is-empty CSS modifier)
    - src/pages/index.astro (render all 4 categories; isEmpty derived from countByCategory; role-link href no longer falls back to #cards)
  artifacts:
    - "dist/index.html: 4 card-{cat} IDs present (design, finance, personal, marketing); 2 .is-empty classes on finance+personal; href count still 2 (design, marketing only)"
    - "verify-build ALL GREEN — Gate 18 SPLASH-04 contract still satisfied"
  missing: []

- truth: "Palette refresh — earthier/more muted direction. Hex changes: paper #f4ebd9 → #f2ebdb, acid #e8a82a → #dc972a, cobalt #2e6e8f → #8ba1a9, terracotta #cc7722 → #b4a682, plum #6a8a5a → #536644. New dedicated token --design (#8c6326) for Graphic Design; previously Design rode --terracotta, now --terracotta is a decorative-only accent (no discipline binding)."
  status: fixed_inline
  reason: "User reported during Test 2 walk: paper should be #f2ebdb, create a separate colour for graphic design which should be #8c6326, terracotta should be #b4a682, acid should be #dc972a, and plum should be #536644, cobalt should be #8ba1a9"
  severity: enhancement
  scope_note: "Phase 3 design system refresh. Pivot from Mexican-folk rustic-vibrant to earthy-muted (olive/umber). Affects every splash card, every gallery accent, every page that consumes the discipline colors. Verify-build still ALL GREEN — no gate checks specific hexes, only structural HTML facts."
  test: "Test 2 (raised)"
  fix_commit: pending
  files_modified:
    - src/styles/tokens.css
    - src/styles/disciplines.ts
    - src/components/DisciplineCard.astro (k1 swapped from var(--terracotta) → var(--design))
  artifacts:
    - "dist/_astro/_category_.P8HQrWqh.css contains new --design token + updated hexes"
    - "/design gallery --accent: #8c6326 (umber, was ochre #cc7722)"
    - "/marketing gallery --accent: #536644 (forest sage, was deep sage #6a8a5a)"
  hexes_updated:
    paper: "#f4ebd9 → #f2ebdb"
    design: "(new) #8c6326"
    acid: "#e8a82a → #dc972a"
    cobalt: "#2e6e8f → #8ba1a9"
    terracotta: "#cc7722 → #b4a682 → #82785d (v2 same UAT, deepened to olive-khaki)"
    plum: "#6a8a5a → #536644"
    teal: "#87a96b → #b4a682 (v2 same UAT, absorbs prior terracotta value)"
    ink: "#0a0a0a (unchanged)"
  v2_followup: "User refined v1 mid-walk: 'terracotta should be #82785d, teal should change to terracotta's current colour'. Net effect — terracotta deepened from taupe to olive-khaki; teal moves from sage-green into the taupe slot. Both still decorative-only (no discipline binding)."
  missing: []

- truth: "The 'THE PITCH' bio card on the splash should be clickable and navigate to /about — the entire card is the click target, not just the '→ KEEP READING' text"
  status: fixed_inline
  reason: "User reported on Test 2: for about, make it accessible to the card that mentions keep reading"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Tiny change: div → anchor + 4 lines of hover/focus CSS."
  test: "Test 2 (raised), Test 10 (verifies)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro
  artifacts:
    - "dist/index.html: bio block emits as <a href=\"/about\" class=\"b-bio\"...>"
  missing: []

- truth: "About page should include wireframe placeholders where photos of Caleb will eventually go — 3 dashed-border placeholder boxes between bio and resume-link"
  status: fixed_inline
  reason: "User reported on Test 2: add some wireframes to show photos of me as well"
  severity: enhancement
  scope_note: "Phase 3 about territory. ~60 LOC: 3 figures + scoped CSS for the wireframe boxes + responsive grid. Also refactored ABOUT-01 gate to scope to <p class=\"bio\"> only (was counting all <article> text including wireframe captions, tripping the 80-150 word range)."
  test: "Test 2 (raised), Test 11 (verifies)"
  fix_commit: pending
  files_modified:
    - src/pages/about.astro
    - scripts/verify-build.sh (Gate 9 ABOUT-01 scoping refactor — perl multi-line slurp for bio-only word count)
  artifacts:
    - "dist/about/index.html: 3 <figure class=\"about-photo\"> elements present"
    - "verify-build.sh ALL GREEN: About bio is 111 words (gate scoped to <p class=\"bio\"> only)"
  missing: []

- truth: "The four role labels under CALEB LIM on the splash should be clickable and scroll to their matching discipline card. Mapping: analyst→finance, brand strategist→marketing, designer→design, marketer→marketing. When a discipline is empty (its card was dropped per SPLASH-04), the role link falls back to the cards container."
  status: fixed_inline
  reason: "User reported on Test 2: under Caleb Lim, make the roles clickable and they lead to the respective graphic cards by scrolling down"
  severity: enhancement
  scope_note: "This is Phase 3 splash territory (role labels live in the hero block, not in nav chrome), but landing it inline is cheap — ~40 LOC across 2 files and the existing splash CSS treats roles as a non-decorative element so anchoring them is natural."
  test: "Test 2 (raised), Test 9 (verifies)"
  fix_commit: pending
  files_modified:
    - src/components/DisciplineCard.astro
    - src/pages/index.astro
  artifacts:
    - "dist/index.html role-link anchors: analyst→#cards, brand strategist→#card-marketing, designer→#card-design, marketer→#card-marketing"
    - "verify-build.sh ALL GREEN after rebuild"
  reduced_motion: "smooth scroll honors prefers-reduced-motion: reduce — falls back to instant jump"
  missing: []

- truth: "Footer center copy reworded and spaced: 'available for part-time, full-time internship roles · brand · analyst · design' — previously 'available for full-time roles, brand+analyst+design'. Bullet separators (with &nbsp; padding) replace the plus-sign run-together; role intent narrowed from 'full-time' to 'part-time, full-time internship roles' to match Caleb's current SMU-student availability."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'for the footer, instead of full-time, put part-time, full-time internship roles, and space out brand • analyst • design'"
  severity: enhancement
  scope_note: "Phase 4 chrome territory — footer lives in src/layouts/Base.astro alongside the header. Surgical 1-line copy edit, no gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/layouts/Base.astro (footer .center span: copy + separator overhaul)
  artifacts:
    - "dist/index.html: 'available for part-time, full-time internship roles<br>brand &nbsp;·&nbsp; analyst &nbsp;·&nbsp; design'"
    - "verify-build ALL GREEN"
  followup_2026_05_18_T8: "User: 'remove first • and js leave a newline for brand analyst design'. Replaced the first bullet separator with a <br>; now line 1 = availability, line 2 = role taxonomy. Bullets between brand/analyst/design retained."
  missing: []

- truth: "Splash bio card (.b-bio): headline + decoration overhaul. h3 was 'CROSS-FUNCTIONAL — BY DESIGN.' → now 'learn more about me.' (rendered uppercase via existing CSS text-transform, preserves splash uppercase rhythm). Mono tag '→ THE PITCH' → '→ ABOUT' (closer match to new CTA). Decorative '04' italic-serif strike numeral removed — it semantically collided with the 4-card grid count — replaced with an inline SVG silhouette glyph (head + shoulders, stroked outline, opacity 0.18) anchored bottom-right. Card layout/click behavior/href all unchanged."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'change the cross functional by design to learn more about me, and change the card design as 04 is irrelevant'"
  severity: enhancement
  scope_note: "Phase 3 splash territory; cosmetic + copy. CSS rename .b-bio-strike → .b-bio-mark (text-only positioning → SVG positioning). No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised), Test 10 (the bio card click target — copy/decoration change only, click target intact)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (bio card markup: h3 copy, tag copy, '04' strike → SVG silhouette mark; CSS .b-bio-strike block → .b-bio-mark)
  artifacts:
    - "dist/index.html: <h3>learn more about me.</h3> renders 'LEARN MORE ABOUT ME.' via text-transform uppercase"
    - "dist/index.html: bio card now emits inline SVG silhouette in .b-bio-mark slot (no '04' numeral anywhere in the bio card)"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Question bar (.b-question) recolored into the terracotta family + 'see' emphasis unstyled + eye emoji punctuation flourish added. Marker pill: bg --acid (turmeric) → --terracotta (taupe), text --ink → --paper for AA contrast. Down arrow: --cobalt → --design (umber) for terracotta-family two-tone rhythm. <em>see</em> tag removed entirely so 'see' inherits the parent sans/uppercase treatment (no more serif-italic terracotta intrusion). After question mark, a small 👁 glyph (.q-eye, aria-hidden) reads as a punctuation flourish — sized 0.9em with 0.25em left margin and -0.05em vertical-align tweak so it sits on the question's baseline."
  status: fixed_inline
  reason: "User reported during Test 8 walk (three follow-ups): (a) 'for the pick one and arrow element on what you would like to see, change its colours to either colours of terracotta'; (b) 'change font of see to be the same as the rest'; (c) 'if possible for the see line put an eye emoticon after the question mark'"
  severity: enhancement
  scope_note: "Phase 3 splash question-bar territory. Pure cosmetic / copy change. .b-question .q em CSS block removed (now dead — em element no longer in markup). No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (markup: em around 'see' removed, <span class='q-eye'>👁</span> appended; CSS: .b-question .marker bg+color swap, .b-question .q em block deleted, .b-question .arrow color swap, .b-question .q-eye new block)
  artifacts:
    - "dist/index.html: 'wish to see? <span class=\"q-eye\" aria-hidden=\"true\">👁</span>'"
    - "marker bg now --terracotta; arrow color now --design"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Splash card render order swap: marketing and personal swapped positions in the 2x2 grid. Old (CATEGORIES order): row1 = design|finance, row2 = personal|marketing. New (splash-specific order): row1 = design|finance, row2 = marketing|personal. CATEGORIES export itself untouched (still the canonical content/route order) — the splash now uses its own SPLASH_ORDER literal so other consumers (content collections, breadcrumbs) keep their existing iteration order."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'swap marketing and personal projects'"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Decoupled splash render order from CATEGORIES canonical order — clean separation, no downstream breakage. Verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (allCategoriesOnSplash: was = CATEGORIES; now an explicit ['design','finance','marketing','personal'] literal typed as readonly Category[])
  artifacts:
    - "dist/index.html card emission order: card-design, card-finance, card-marketing, card-personal (was design, finance, personal, marketing)"
    - "row 1 (desktop 2x2): design (populated) | finance (placeholder)"
    - "row 2 (desktop 2x2): marketing (populated) | personal (placeholder)"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Bio card headline + tag revision (2nd pass on the same card from prior fix): h3 'learn more about me.' → 'why choose caleb?' (recruiter-facing CTA framing, still uppercased by existing h3 text-transform). Tag glyph '→ ABOUT' → '★ ABOUT' — arrow swapped for a star, signaling 'featured/marquee' rather than 'next step'."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'for learn more about me, change it to why choose caleb? and the line about, change the arrow to a star'"
  severity: enhancement
  scope_note: "Phase 3 splash territory; cosmetic+copy. No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised), Test 10 (the bio card click target — copy change only)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (b-bio-tag text and h3 text)
  artifacts:
    - "dist/index.html: <span class='b-bio-tag'>★ ABOUT</span> and <h3>why choose caleb?</h3>"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Question-bar eye glyph swapped from Apple/system emoji (👁) to a hand-drawn inline SVG: an eye-shape stroke path (Q curves above/below) with a filled circular pupil. Stroke and pupil inherit currentColor; .q-eye color set to var(--design) (umber, matches the down-arrow's two-tone terracotta-family color rhythm). Sizing tightened (28×18px) and vertical-align nudged to sit on the question's optical baseline."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'change the eye to be an icon instead of apple's emoji'"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Removes platform-emoji rendering inconsistency (👁 renders very differently across macOS/Windows/Linux) in favor of a deterministic in-house glyph. No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (replaced <span class='q-eye'>👁</span> with inline <svg class='q-eye'>; rewrote .q-eye CSS for SVG sizing/color)
  artifacts:
    - "dist/index.html: question bar emits .q-eye <svg> (no emoji codepoint)"
    - "eye color: var(--design) umber"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Discipline card rest-tilt rebalanced to column-paired symmetry: positions 1 & 3 lean left (k1 design -1deg, k4 marketing -1deg — was +0.7deg); positions 2 & 4 lean right (k2 finance +1deg, k3 personal +1deg — was -0.5deg). Hover behavior updated — was 'tiny counter-tilt of -0.3deg with lift', now 'snap to rotate(0deg) (perpendicular to the resting tilt) with lift'. Reads as askew-at-rest, square-when-interacted."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'realign the card orientations so they are tilted to the same side for 1st and 3rd, and 2nd and 4th. update the feature that tilts it perpendicular when hovered for each card.'"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Note splash render order is design-finance-marketing-personal (post-swap), so the bottom-left card is k4 marketing and the bottom-right is k3 personal — flipping k3 and k4 rest tilts achieves the desired column-paired pattern without remapping CATEGORIES. Affects /404 too (same component) but per design intent the column-symmetric tilt also reads correctly on a 4-card stack."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/components/DisciplineCard.astro (.b-card:hover transform rotate(-0.3deg) → rotate(0deg); .b-card.k3 transform rotate(-0.5deg) → rotate(1deg); .b-card.k4 transform rotate(0.7deg) → rotate(-1deg))
  artifacts:
    - "verify-build ALL GREEN"
  missing: []

- truth: "Question-bar eye glyph tightened: was 'see? <space>👁/<svg>' with 0.35em margin-left, now 'see?<svg>' (no space in markup) with 0.12em margin-left — visually sits flush beside the question mark instead of with a perceptible gap."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'move the eye to be beside the question mark'"
  severity: enhancement
  scope_note: "Phase 3 splash territory; pure CSS+markup tweak."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (removed space char between '?' and <svg>; .q-eye margin-left 0.35em → 0.12em)
  artifacts:
    - "dist/index.html: 'wish to see?<svg class=\"q-eye\"...'"
    - "verify-build ALL GREEN"
  missing: []

- truth: "Star glyphs enlarged. (a) Bio card tag star: '★' inside .b-bio-tag was rendering at the same size as the surrounding mono tag text (~12px); split into a dedicated .b-bio-tag-star span sized 1.7em, inline-block, vertical-align: middle + margin-top -0.15em so the geometric center of the star aligns with the optical centerline of the ABOUT caps (follow-up: 'align the star with about'). (b) k3 (Personal) card sparkle decoration: enlarged from 84×84px to 120×120px, radial-gradient ellipse beams scaled 5×40px → 7×58px to match. Both stars now read as prominent editorial marks rather than punctuation flecks."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'make the stars bigger' + follow-up: 'align the star with about'"
  severity: enhancement
  scope_note: "Phase 3 splash territory; pure CSS+markup tweak. No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (wrapped bio tag star in .b-bio-tag-star span; added .b-bio-tag-star CSS block; centerline alignment tweak)
    - src/components/DisciplineCard.astro (.b-card.k3 .deco: width/height 84 → 120; radial-gradient ellipses 5/40 → 7/58)
  artifacts:
    - "verify-build ALL GREEN"
  missing: []

- truth: "Card hover-rotate fix: pre-existing bug where .b-card:hover { transform: ... rotate(0deg) } was being shadowed by per-k rest-tilt rules (.b-card.k1 { transform: rotate(-1deg) } etc.). Both selectors had equal specificity (0,2,0), and the per-k rules came AFTER the hover rule in source order — so source-order tiebreak made the rest tilt win even on hover, and the hover rotate visibly never applied. Fix: moved the .b-card:hover block to AFTER all per-k blocks so it now wins on the tiebreak. Empty cards remain inert (.b-card.is-empty:hover at specificity 0,3,0 still overrides)."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'why does graphic and marketing not rotate when hovered over?' — verified the specificity bug: k1 and k4 are the populated cards (Design & Marketing), so they were the visible victims; k2 and k3 are empty placeholders and don't hover-rotate by design."
  severity: bug
  scope_note: "Phase 3 splash territory. Source-order CSS bug, not a logic bug — pre-existed since Phase 3 build but went unnoticed because previous hover rotate (-0.3deg) was imperceptible vs the rest tilt (-1deg / +1deg). Fix is to reorder, no value changes."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/components/DisciplineCard.astro (relocated .b-card:hover block from top of styles to bottom; removed duplicate .b-card.is-empty:hover I'd briefly introduced)
  artifacts:
    - "verify-build ALL GREEN"
  missing: []

- truth: "Question-bar eye glyph anti-newline fix: with --fs-q at clamp-large size, the inline SVG eye glyph was wrapping onto its own line below the question text on some viewport widths because there was no break-opportunity protection between the trailing 'see?' word and the SVG element. Wrapped 'see?<svg>' in a new .q-tail span with white-space: nowrap so the question may still break elsewhere in the sentence but the question mark and the eye glyph stay glued together on the same line."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'the eye is on a newline visually and not beside the question mark. adjust accordingly'"
  severity: bug
  scope_note: "Phase 3 splash territory. Also required Gate 2 (verify-build.sh) regex to accept the new <span class=\"q-tail\"> wrapper around 'see' — pattern now matches three historical forms: bare, <em>see, and <span class=\"q-tail\">see."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (wrapped 'see?<svg>' in <span class='q-tail'>; added .q-tail nowrap CSS rule; .q-eye made display: inline-block)
    - scripts/verify-build.sh (Gate 2 grep pattern extended to accept <span class=\"q-tail\">see form)
  artifacts:
    - "dist/index.html: 'wish to <span class=\"q-tail\"...>see?<svg class=\"q-eye\"...></svg></span>'"
    - "verify-build ALL GREEN (Gate 2 still recognizes the prompt under the new wrapper)"
  missing: []

- truth: "About page values subsection: between the bio paragraph and the photo wireframes, a new <section class='values'> with a mono-uppercase '— values' eyebrow heading and a flex-wrap row of six pill-styled attribute chips: Curious / Owner mentality / Cross-functional / Detail-obsessed / Bias to ship / Numbers + craft. Pills alternate outline (odd) and filled (even) styles drawn from the new earth-tone palette — chip 2 = acid turmeric, chip 4 = terracotta taupe, chip 6 = umber design. Each pill is rotated ±1deg in alternating directions, echoing the splash discipline-card tilt language. Chip copy is curated from the bio's voice (owner mentality, cross-functional, numbers + craft) rather than corporate-generic adjectives."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'for the about page, create a values subsection after the bio description, that constitutes some pills of certain attributes i carry to myself'"
  severity: enhancement
  scope_note: "Phase 3 about territory. About page now reads: bio → values pills → photo wireframes → resume link → contact block. No gate impact (Gate 9 ABOUT-01 still scopes word count to .bio paragraph only). Verify-build ALL GREEN."
  test: "Test 4 (raised, was already passing)"
  fix_commit: pending
  files_modified:
    - src/pages/about.astro (added <section class='values'> with 6 chip <li>s; added .values + .values-h + .values-list + .values-pill CSS with nth-child color and rotation variants)
  artifacts:
    - "dist/about/index.html: 6 .values-pill elements present"
    - "verify-build ALL GREEN"
  missing: []
  followup_2026_05_18_T4: "User: 'these pills should be straight on the onset. when hovered over, they will turn terracotta, and lift up'. Removed all nth-child rotation + alternating-fill rules — pills now uniformly render straight (no transform) and outline-only at rest. On hover each pill fills terracotta (bg + border + paper text), lifts -3px, and gets a subtle drop shadow; 180ms ease transition on transform/colors/shadow."

- truth: "New 'open for roles' availability pill on the splash hero, positioned above CALEB LIM inside the .b-name block. Mono uppercase '★ open for roles', rotated -3deg as an editorial sticker; bg uses a brand-new --lime palette token (#b8c945 chartreuse lime) — the bright go-signal pops against the muted earth-tone palette. Token registered in src/styles/tokens.css alongside the other discipline/decoration tokens."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'for the open roles pill on the landing page, create a separate colour for it, and make it lime green'"
  severity: enhancement
  scope_note: "Phase 3 splash territory + Phase 3 design token addition. New --lime token added (not in UI-SPEC.md verification_override register — flagged as a follow-up: register or document as UAT-driven exception). No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/styles/tokens.css (added --lime #b8c945)
    - src/pages/index.astro (new <span class='b-open-roles'> inside .b-name above the <h1>; added .b-open-roles CSS block)
  artifacts:
    - "dist/index.html: <span class='b-open-roles' aria-label='Currently open to roles'>★ open for roles</span>"
    - "dist/_astro/*.css: --lime token present"
    - "verify-build ALL GREEN"
  open_question_for_user: "Confirmed location: placed above CALEB LIM in the hero. If you meant a different element (e.g. the footer availability line restyled as a pill, or replacing the '→ PICK ONE' marker), say so and I'll relocate."
  missing: []
  user_resolved_2026_05_18_T8: "User clarified — meant the existing OPEN TO ROLES status pill in the header (StatusPill.astro). Reverted: (1) removed the new .b-open-roles span above CALEB LIM, (2) removed its scoped CSS block, (3) recolored the existing StatusPill .dot background from var(--acid) (deep gold / brown) → var(--lime) (chartreuse green). The new --lime token is now active on its intended target. Net effect: header blink is now lime green; no redundant pill above the name."

- truth: "Splash portrait converted from a single static rotated <Image> into an Instagram-style carousel. Three slides: (1) the real portrait.jpg, (2) wireframe placeholder 'PHOTO · 02 — candid' (dashed terracotta border, dark bg, mono+serif typography mirroring the /about page wireframe pattern), (3) wireframe placeholder 'PHOTO · 03 — process / sketch'. Controls: a pair of prev/next circular arrow buttons revealed on container hover or focus-within (opacity 0 → 1, 180ms ease) positioned at left/right midpoints; three dot indicators centered at the bottom showing active slide (active = full paper, scale 1.25; inactive = 45% paper). The portrait container's rotate(-1.2deg) was removed so the carousel sits square. JS controller (15 LOC inside the existing inline <script>) wires click handlers on arrows + dots + ArrowLeft/ArrowRight keyboard support; modular index ((i + N) % N) wraps around at edges. Aspect-ratio 4/5 preserved via CSS so slides fill the same box."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'straighten my profile photo. make it such that when hovered over, they can interact with it by clicking an arrow, and it shows a different profile photo. there should also be dots at the bottom to show which profile photo they are seeing, as if scrolling through an instagram post'"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Only one real portrait file exists (src/assets/portrait.jpg) — slots 2 & 3 are intentional dashed-border wireframes until real images are dropped in. When ready, replace .bp-wireframe markup with <Image src={...}> in the same slide slot; no JS change needed. Container is now straight per user request. Verify-build ALL GREEN (no gate references the .b-portrait transform)."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (b-portrait markup expanded with .bp-track + 3 .bp-slide + 2 .bp-arrow + 3 .bp-dot; CSS block rewritten — removed transform, added .bp-* rules; inline <script> appended 15-LOC carousel controller)
  artifacts:
    - "dist/index.html: data-portrait-carousel present, 3 .bp-slide, 2 .bp-arrow, 3 .bp-dot"
    - "verify-build ALL GREEN"
  reduced_motion: "Slide opacity transition + dot scale transitions are flat 240ms / 180ms — the global prefers-reduced-motion block in tokens.css clamps these to 0.01ms automatically; functionality (slide cycling) is unchanged, only the fade is removed."
  missing: []

- truth: "k2 (Finance) and k4 (Marketing) card decorations redesigned to be thematically tied to their disciplines, and recolored from var(--acid) (deep gold/orange) to var(--paper) (warm cream). (a) k2 Finance: was an oversized italic Fraunces '2' numeral in orange — replaced with a four-bar mini bar-chart (4 stacked linear-gradients in paper, varying heights 28%/60%/44%/80% sketching a performance chart). (b) k4 Marketing: initial swap was a broadcast/signal-ripple ('wifi icon'); user follow-up flagged it as not edgy enough and requested something in the family of k3's sparkle. SECOND PASS: k4 deco is now an 8-point starburst — long primary cross drawn on .deco (6×48 + 48×6 ellipses, paper, rotated 8deg) + shorter secondary diagonal cross drawn on .deco::before (4×34 + 34×4 ellipses, rotated 45deg). Reads as a marketing 'starburst/featured/highlight' mark. Family-resemblance to k3 (Personal's 4-point sparkle on acid) but visually distinct: 8 points vs 4, paper-on-plum vs ink-on-acid, less rotation. Both decorations are pure CSS — no SVG, no markup changes beyond removing the now-unused k2Numeral text emission. DisciplineCard.astro template simplified: .deco span always renders empty (CSS handles each k's glyph). Frontmatter constant k2Numeral removed."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'change the current design for financial model and marketing cards. change the orange colour to be paper if not terracotta. change the designs so they look more tied to its respective card themes'"
  severity: enhancement
  scope_note: "Phase 3 splash territory. Pre-existing UI-SPEC.md D-03 mapping defined k2 as 'oversized Fraunces numeral' and k4 as 'triangle' — both now superseded by UAT-driven thematic decorations. Verify-build ALL GREEN (no gate references the k2 numeral text or the k4 triangle shape)."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/components/DisciplineCard.astro (frontmatter k2Numeral const removed; both .deco span emissions now empty; .b-card.k2 .deco CSS rewritten to bar-chart linear-gradients; .b-card.k4 .deco CSS rewritten to broadcast-ripple radial-gradients)
  artifacts:
    - "verify-build ALL GREEN"
  missing: []

- truth: "About values pill copy replaced — user-curated list now reads: Curious / Challenges Processes / AI Agency & Stewardship / Leverages on AI / Thrives in Ambiguity / Adaptive. Reframes the values from the prior 'craft + ownership' vocabulary (owner mentality, cross-functional, detail-obsessed, bias to ship, numbers + craft) to an 'AI-leveraging adaptive operator' frame — more aligned with how Caleb is now positioning himself for analyst/brand/marketing roles in 2026. Pill styling (straight at rest, terracotta+lift on hover) unchanged."
  status: fixed_inline
  reason: "User reported during Test 4 walk: 'For values, currently put one to be Curious; Challenges Processes; AI Agency & Stewardship; Leverages on AI; Thrives in Ambiguity; Adaptive'"
  severity: enhancement
  scope_note: "Phase 3 about territory; pure copy swap. The ampersand in 'AI Agency & Stewardship' is encoded as &amp; in the JSX/Astro source. No gate impact, verify-build ALL GREEN."
  test: "Test 4 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/about.astro (six <li class='values-pill'> texts replaced)
  artifacts:
    - "dist/about/index.html: 6 .values-pill elements with new copy present"
    - "verify-build ALL GREEN"
  missing: []

- truth: "About values heading polish: removed em-dash prefix ('— values' → 'values') and tightened the heading's vertical rhythm — section top margin reduced from --sp-5 (24px) to --sp-4 (16px) and heading bottom margin from --sp-3 to --sp-2, so the heading sits closer to its pills and to the bio paragraph above. Reads more uniformly with the bio→pills→wireframes flow now that there's no leading punctuation visually pulling it apart."
  status: fixed_inline
  reason: "User reported during Test 4 walk: 'remove the dash on the line of values, and shift it higher so it is more aesthetically uniformed across the page'"
  severity: enhancement
  scope_note: "Phase 3 about territory; pure copy + spacing tweak."
  test: "Test 4 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/about.astro (h2 text '— values' → 'values'; .values margin-top --sp-5 → --sp-4; .values-h margin-bottom --sp-3 → --sp-2)
  artifacts:
    - "verify-build ALL GREEN"
  missing: []

- truth: "Optical centerline alignment pass for the inline glyphs: (a) bio-card '★ ABOUT' tag star — was using vertical-align:middle alone; added position:relative + top:-0.22em so the star's geometric center sits on the cap-midpoint of the smaller mono ABOUT caps (vertical-align:middle alone aligns on baseline+½x-height which sits below the cap-midpoint for uppercase). (b) Question-bar eye SVG — same treatment: vertical-align:middle + position:relative + top:-0.18em so the eye sits centrally with the large 'WHAT DO YOU WISH TO SEE?' caps."
  status: fixed_inline
  reason: "User reported during Test 8 walk: 'align the star with about' + follow-up: 'position the star to be centralised with the ABOUT too' + 'position the eye glyph to be centralised with the line'"
  severity: enhancement
  scope_note: "Phase 3 splash territory; pure positioning tweak. No gate impact, verify-build ALL GREEN."
  test: "Test 8 (raised)"
  fix_commit: pending
  files_modified:
    - src/pages/index.astro (.b-bio-tag-star margin-top → position:relative top:-0.22em; .b-question .q-eye vertical-align:-0.18em → vertical-align:middle + position:relative top:-0.18em)
  artifacts:
    - "verify-build ALL GREEN"
  missing: []
