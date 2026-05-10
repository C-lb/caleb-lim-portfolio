---
phase: 01-walking-skeleton
plan: 01
subsystem: walking-skeleton
tags: [astro, content-collections, zod-schema, getStaticPaths, image-optimization, walking-skeleton]

# Dependency graph
requires:
  - phase: 00-bootstrap
    provides: planning artifacts (PROJECT.md, ROADMAP.md, REQUIREMENTS.md, phase 01 PLAN/CONTEXT/RESEARCH/SKELETON)
provides:
  - Astro 5 project scaffold with pinned deps (astro ^5.18.1, pdfjs-dist ^5.7.284, typescript ^5.6.3) and Node 22.16.0 lock
  - Zod-validated content collection schema with shared category enum (single source of truth at src/content/categories.ts) and image() helper, including Phase 2 forward-compat optional fields (pdfPaginate, fullPdf, outcomeTagline)
  - Three dynamic routes — splash (/), category gallery (/[category]), and piece detail (/[category]/[slug]) — built off the schema
  - One end-to-end-rendered piece (Graphic Design, with placeholder content per checkpoint override) proving PIECE-01 (hero <img>, no iframe) and PIECE-02 (Context/Role/Outcome blocks)
affects: [01-walking-skeleton-02, 01-walking-skeleton-03, 02-asset-pipeline, 03-visual-system]

# Tech tracking
tech-stack:
  added:
    - astro@^5.18.1
    - pdfjs-dist@^5.7.284 (devDep; transitively pulls @napi-rs/canvas — used here for placeholder hero generation)
    - typescript@^5.6.3
  patterns:
    - "Shared category enum at src/content/categories.ts consumed by both the Zod schema and getStaticPaths — adding a fifth category is a one-line change (D-12)"
    - "Function-form schema `({ image }) => z.object(...)` — bare object form has no image() access (pitfall avoided)"
    - "Path discipline: src/content.config.ts (NOT src/content/config.ts — Astro 5 idiom)"
    - "Colocated piece content: src/content/pieces/[slug]/index.md adjacent to hero asset; resolved via image() schema helper for Sharp build-time optimization (D-04)"
    - "Dynamic [category]/[slug].astro returns BOTH params keys in getStaticPaths (pitfall 4 — params object missing required key fails build)"
    - "Gallery template includes empty-state branch so all four category routes build before all four pieces land"

key-files:
  created:
    - .nvmrc (22.16.0)
    - .gitignore
    - package.json
    - package-lock.json
    - astro.config.mjs
    - tsconfig.json (extends astro/tsconfigs/strict)
    - src/content.config.ts (Zod schema with shared CATEGORIES enum)
    - src/content/categories.ts (single source of truth — D-12)
    - src/content/pieces/design-real-piece/index.md (placeholder content)
    - src/content/pieces/design-real-piece/hero.png (1200×800 PLACEHOLDER PNG)
    - src/pages/index.astro (splash with "What do you wish to see?" prompt)
    - src/pages/[category].astro (dynamic gallery + empty-state branch)
    - src/pages/[category]/[slug].astro (dynamic detail with <Image> + Context/Role/Outcome sections)
  modified: []

key-decisions:
  - "Override D-09/D-10 for Graphic Design piece: user explicitly authorized PLACEHOLDER content at the Task 3 human-action checkpoint. Hero is a generated 1200×800 PNG with the literal word PLACEHOLDER rendered into it (mirrors D-08 Personal Projects placeholder pattern from plan 01-02). Title and all three CRO blurbs contain visible PLACEHOLDER signal so it can never be mistaken for shippable content."
  - "Schema uses .min(1) on title/role/outcome/context (NOT bare z.string()) — closes pitfall 3's empty-string sneak-through (T-1-03 mitigation)."
  - "All four category routes build in this plan (not just /design) — gallery template's empty-state branch handles /finance, /personal, /marketing showing '(No pieces in this discipline yet.)' until plan 01-02 fills them. This validates the routing scales before plan 01-02."

patterns-established:
  - "Pattern: Shared category enum (src/content/categories.ts) imported by schema + both getStaticPaths layers — single source of truth, no string-literal duplication"
  - "Pattern: Per-piece colocated content directory (src/content/pieces/[slug]/{index.md, hero.png}) — adjacent assets resolved via image() helper, sets up Phase 2's per-piece source.pdf colocation"
  - "Pattern: Astro <Image src={frontmatterField}> bound directly to schema-validated image() field — no manual import gymnastics, Sharp runs at build, srcset/width/height emitted automatically"
  - "Pattern: Bare semantic HTML with no design system in placeholder phase — explicitly avoids stock Tailwind / shadcn / Inter tells from CLAUDE.md 'What NOT to Use' table"

requirements-completed: [PIECE-01, PIECE-02]

# Metrics
duration: 8min
completed: 2026-05-10
---

# Phase 1 Plan 1: Walking-Skeleton Slice (Astro scaffold + schema + one rendered piece) Summary

**Astro 5 project + Zod content schema with shared category enum + three dynamic routes + one end-to-end piece (placeholder Graphic Design) proving PIECE-01 / PIECE-02 against a real `npm run build`.**

## Performance

- **Duration:** ~8 min (Task 1 commit 11:43:20 +08, Task 2 commit 11:51:19 +08)
- **Started:** 2026-05-10T03:43:20Z (Task 1 commit, prior session)
- **Completed:** 2026-05-10T03:51:19Z (Task 2 commit)
- **Tasks:** 2 implementation tasks (Task 3 was a human-action checkpoint resolved by user override)
- **Files modified:** 12 created / 0 modified

## Accomplishments

- Astro 5 scaffold lives end-to-end: deps pinned, Node version locked, schema parses, `npx astro sync` succeeds, `npm run build` exits 0 producing 6 static pages.
- Schema is wired with the load-bearing patterns (function form `({ image }) => z.object(...)`, shared `CATEGORIES` enum, `.min(1)` on every required string, optional Phase 2 forward-compat fields) — Plan 02 can author three more pieces without touching the schema.
- All four discipline routes resolve at build time (not just /design) — `/finance`, `/personal`, `/marketing` render their gallery's empty state. The walking skeleton's routing is provably four-wide before any of those pieces land.
- The Graphic Design detail page renders an Astro-optimized `<img>` (Sharp-converted to webp, 4kB from 15kB source) with explicit Context / Role / Outcome `<section>` blocks. PIECE-01 and PIECE-02 are green for the first piece.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold project + pin deps + lock Node version + commit empty schema** — `745835f` (chore)
2. **Task 2: Author the Graphic Design piece + wire splash, gallery, and detail routes** — `728bfd4` (feat)
3. **Task 3: Caleb supplies the Graphic Design piece's hero image and brief blurbs** — _checkpoint:human-action; resolved by user override authorizing PLACEHOLDER content (see Deviations below). No commit._

_Note: SUMMARY commit follows separately under the orchestrator's wave-end protocol._

## Files Created/Modified

- `.nvmrc` — Node version pin (22.16.0) matching Cloudflare Pages v3 build image and pdfjs-dist@5.7.284's `engines` field
- `.gitignore` — node_modules, dist, .astro, .env, .env.production, .DS_Store, pdf-poc-out.png
- `package.json` — Pinned deps (astro ^5.18.1, pdfjs-dist ^5.7.284, typescript ^5.6.3); scripts pre-stub `pdf-poc` and `test:smoke` for plans 02 and 03
- `package-lock.json` — Deterministic install lock (~7000 lines; @napi-rs/canvas lands transitively at ^0.1.100, NOT pinned at the top level)
- `astro.config.mjs` — Bare config; no integrations in Phase 1 (Tailwind / fonts / motion land Phase 3+)
- `tsconfig.json` — Extends `astro/tsconfigs/strict`
- `src/content.config.ts` — Zod schema, function form, shared CATEGORIES enum, `.min(1)` on every required string, Phase 2 forward-compat optionals
- `src/content/categories.ts` — `CATEGORIES = ['design', 'finance', 'personal', 'marketing'] as const` (D-12)
- `src/content/pieces/design-real-piece/index.md` — Graphic Design piece (placeholder content per user override)
- `src/content/pieces/design-real-piece/hero.png` — 1200×800 PLACEHOLDER PNG (visibly a stand-in)
- `src/pages/index.astro` — Splash with literal "What do you wish to see?" prompt and four CATEGORIES links
- `src/pages/[category].astro` — Dynamic gallery (D-11), reads CATEGORIES from shared module, includes empty-state branch
- `src/pages/[category]/[slug].astro` — Dynamic detail (D-11, PIECE-01, PIECE-02), `<Image src={hero}>` + three `<section>` blocks; getStaticPaths returns BOTH `category` and `slug` keys

## Decisions Made

- **Plan 01-01 followed as written for the scaffold and routing layers.** Schema, route templates, and category enum match the plan's `<interfaces>` block verbatim.
- **Override at Task 3 checkpoint:** user explicitly authorized PLACEHOLDER content for the Graphic Design piece (orchestrator passed the override down). This is structurally identical to D-08's Personal Projects placeholder — visibly-stand-in title + role + outcome + context, generated solid-color hero PNG with literal "PLACEHOLDER" text rendered into it. The piece carries `draft: false` so it renders, validating the route end-to-end. Real Caleb-supplied content lands in Phase 2 alongside the Finance / Marketing real pieces.

## Deviations from Plan

### User-authorized override (not a Rule 1–3 deviation)

**1. [Override at checkpoint] Graphic Design piece content authored as PLACEHOLDER instead of Caleb-supplied real content**

- **Found during:** Task 3 (human-action checkpoint)
- **Plan stance:** D-09 says "real-but-brief" CRO blurbs for the three real pieces (Graphic Design / Finance / Marketing). Plan Task 3 paused execution to wait for Caleb to supply title + hero + 1–2-line Context / Role / Outcome.
- **What changed:** Caleb / orchestrator authorized using PLACEHOLDER content for the Graphic Design piece — same pattern as D-08's Personal Projects stand-in (plan 01-02 Task 2). Real content swaps in pre-launch.
- **Implementation:** Generated hero.png via @napi-rs/canvas one-shot (1200×800, "#cccccc" bg, "#333333" text, 96px sans-serif "PLACEHOLDER" centered — 15.5kB on disk, well > 1KB). Frontmatter title is "Phase 1 Skeleton — Graphic Design"; role/outcome/context blurbs each begin "PLACEHOLDER —" so the visible signal is unmistakable in rendered HTML. The outcome blurb explicitly references SPLASH-04 fallback (drop the card) if real content never materializes.
- **Files modified:** src/content/pieces/design-real-piece/index.md, src/content/pieces/design-real-piece/hero.png
- **Verification:** `npm run build` passes; rendered detail HTML contains the literal substring "PLACEHOLDER" three times (in role, outcome, context); PIECE-01 (no iframe) and PIECE-02 (Context/Role/Outcome) gates green.
- **Committed in:** 728bfd4 (Task 2 commit)

---

**Total deviations:** 1 user-authorized override (no auto-fix Rule 1–3 triggers fired during this plan).
**Impact on plan:** Plan 01-01's stated goal — prove the schema → content → routing pipeline against one piece — is achieved. The override changes _what_ content sits in the piece, not _whether_ the pipeline works. Plan 01-02's Personal Projects placeholder pattern (D-08) established that PLACEHOLDER stand-ins are an acceptable substrate for Phase 1 — this just extends that substrate one piece earlier than the original plan envisioned.

## Issues Encountered

- **ImageMagick (`convert`) not installed on the executor host** — fell back to the plan's documented Node + `@napi-rs/canvas` recipe (the package was already in `node_modules` as a transitive optionalDep of `pdfjs-dist@^5.7.284`, exactly as Task 1's pin scheme intended). Generated as a one-shot `node --input-type=module -e "..."` invocation; no script committed (per plan's "do NOT commit this script" guidance for the placeholder-generation recipe).

## Known Stubs

The Graphic Design piece is a labeled stub authorized by user override. Tracked here for the verifier and for the Phase 2 / pre-launch swap:

| Stub | File | Reason | Resolution |
|------|------|--------|------------|
| `title: "Phase 1 Skeleton — Graphic Design"` | src/content/pieces/design-real-piece/index.md | User override at Task 3 checkpoint — real Caleb-supplied title pending | Phase 2 swap-in (or drop the piece if real content never materializes) |
| `role` / `outcome` / `context` all begin with "PLACEHOLDER —" | src/content/pieces/design-real-piece/index.md | Same as above — visible signal preserved per user override spec | Phase 2 swap-in |
| `hero.png` is a generated solid-color PNG with literal "PLACEHOLDER" text | src/content/pieces/design-real-piece/hero.png | D-10 says plain image; user authorized stand-in mirroring D-08 | Phase 2 swap-in (real Caleb-supplied JPG/PNG/WEBP) |

The Graphic Design piece is a deliberate stand-in — the plan's _goal_ (one rendered piece end-to-end through every layer of the stack) is unaffected. Plan 01-02 will add three more pieces (Finance + Marketing real, Personal placeholder); the Graphic Design piece's PLACEHOLDER status remains until pre-launch swap.

## Next Phase Readiness

- **Plan 01-02** can run as-is — schema and routes are fixed, all it needs to do is author three more pieces (Finance real, Marketing real, Personal placeholder) under the existing routing template, then write `scripts/verify-build.sh` for the smoke test. No schema or route changes needed.
- **Plan 01-03** (parallel, Wave 2) — the PDF rasterization POC — is fully unblocked. `pdfjs-dist` and `@napi-rs/canvas` are installed and verified working (the placeholder hero generation in this plan was a free smoke test of `@napi-rs/canvas` itself).
- **Phase 2** — when real content lands, the Graphic Design piece's placeholder swap is a one-file edit (frontmatter + hero replacement). No code change required.
- **Open follow-up:** the `<Image>` JSX comments (`{/* PIECE-01: ... */}`, `{/* PIECE-02: ... */}`) live inside the rendered `.astro` template; they're stripped at build by Astro's compiler so they don't ship to the HTML — verified by greps above. Future maintainers should note the route file's Context/Role/Outcome `<section>` ordering matches PIECE-02's prescribed read order (the smoke test in plan 01-02 will assert all three labels are present, not their order — but the visual flow follows the plan).

---

## Self-Check

**Files claimed → existence:**
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-a77ce063ec3005657/src/content/pieces/design-real-piece/index.md` — FOUND
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-a77ce063ec3005657/src/content/pieces/design-real-piece/hero.png` — FOUND
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-a77ce063ec3005657/src/pages/index.astro` — FOUND
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-a77ce063ec3005657/src/pages/[category].astro` — FOUND
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-a77ce063ec3005657/src/pages/[category]/[slug].astro` — FOUND

**Commits claimed → git log:**
- `745835f` (Task 1) — FOUND on worktree-agent-a77ce063ec3005657
- `728bfd4` (Task 2) — FOUND on worktree-agent-a77ce063ec3005657

**Build gates:**
- `npm run build` — exit 0 (verified twice)
- `dist/index.html`, `dist/{design,finance,personal,marketing}/index.html`, `dist/design/design-real-piece/index.html` — all exist
- `<iframe` substring in `dist/design/design-real-piece/index.html` — NOT present (PIECE-01 negative gate green)
- `Context` / `Role` / `Outcome` substrings in `dist/design/design-real-piece/index.html` — all present (PIECE-02 positive gate green)
- `What do you wish to see` in `dist/index.html` — present (SPLASH-01 placeholder-fidelity gate green)

## Self-Check: PASSED

---
*Phase: 01-walking-skeleton*
*Completed: 2026-05-10*
