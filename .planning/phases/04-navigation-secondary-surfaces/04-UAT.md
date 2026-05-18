---
status: testing
phase: 04-navigation-secondary-surfaces
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
mode: mvp
started: 2026-05-18T09:40:00Z
updated: 2026-05-18T12:15:00Z
---

## Current Test

number: 7
name: Skip-to-content keyboard walk
expected: |
  Load the splash (/) in a fresh tab (so focus starts outside the page). Press Tab ONCE.
  You should see a "Skip to content" link appear top-left (it's visually hidden until focused).
  Press Enter. Focus should jump PAST the header chrome to the <main> element — Tab once more
  to confirm you're now on a splash control (e.g. a role label or the brand link), not the
  header email/linkedin/resume chrome.
  Repeat on /about and on one populated piece detail page.
awaiting: user response

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
result: pending

### 8. mailto link opens mail client
expected: |
  On /about, click the "caleb.lim.2024@smu.edu.sg" link. Your default mail client (Mail.app,
  Outlook, Gmail web compose, etc.) should open with a new draft addressed to
  caleb.lim.2024@smu.edu.sg. No subject line should be prefilled (clean link, per O-3 RESOLVED).
result: pending

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
result: pending

### 10. "THE PITCH" bio card is clickable → /about (UAT-driven enhancement)
expected: |
  On http://localhost:4321/, click anywhere on the yellow/acid "THE PITCH" bio card
  (the rotated card containing "CROSS-FUNCTIONAL — BY DESIGN." and ending with "→ KEEP READING").
  The entire card is now a single click target — clicking anywhere on it navigates to /about.
  Hovering should lift the card slightly (subtle translateY animation). Tabbing onto the card
  shows a focus ring. The "→ KEEP READING" text inside remains the visual cue.
result: pending

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
result: pending

## Summary

total: 11
passed: 6
issues: 0
pending: 5
skipped: 0
fixes_applied_inline: 9

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
