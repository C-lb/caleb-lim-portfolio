# Resume — Caleb Lim Portfolio Setup

**Last touched:** 2026-05-09
**Status:** Mid-flow inside `/gsd-new-project`. Research done, Astro path locked. Paused before sketching visual directions.

## What's Done

- ✅ PROJECT.md — full context captured (4 categories, splash UX, asset+context piece pages, bold/expressive aesthetic, no-AI-look constraint, Readymag/Framer references)
- ✅ config.json — YOLO mode, standard granularity, parallel, opus models, all workflow agents on
- ✅ Research — 4 parallel researchers + synthesizer complete. Files in `.planning/research/`
- ✅ Astro decision locked — Astro + content collections + Cloudflare Pages + Cloudflare Registrar (~$10/yr domain). Reasoning: Caleb is comfortable with markdown + git, killing Framer's main draw; Astro avoids platform lock-in.

## What's Pending (in order)

1. **Sketch visual directions** — 2 throwaway HTML mockups of splash + Graphic Design category page. Two directions to compare:
   - **A: Editorial brutalist** — oversized serif display, near-monochrome + one accent, asymmetric grid, generous whitespace, restrained motion. "Analyst who can also design."
   - **B: Magazine maximalist** — large sans display, layered color blocks, density-of-information collage, scroll-driven moments, rotated/skewed elements. "Brand creative with finance chops."
2. **REQUIREMENTS.md** — generate v1 / v2 / out-of-scope with REQ-IDs based on PROJECT.md + research + chosen visual direction
3. **ROADMAP.md** — spawn `gsd-roadmapper` (opus). Synthesizer suggested 7 phases:
   - Phase 0: Stack Decision + Content Audit (stack already locked — collapses to content audit only)
   - Phase 1: Visual Direction + Design System
   - Phase 2: Core Structure + Routing
   - Phase 3: Asset Pipeline + Real Content
   - Phase 4: Visual Design + Interaction Polish
   - Phase 5: Mobile + Performance + QA
   - Phase 6: Deploy + Handoff
4. **CLAUDE.md** — generate via `gsd-sdk query generate-claude-md`
5. **STATE.md** — initialized by roadmapper

## How to Resume

Open this dir (`cd ~/projects/new-project`) and run:

```
/gsd-sketch
```

Tell it: "Two visual directions for splash + Graphic Design category page — Editorial brutalist (A) vs Magazine maximalist (B). Read .planning/RESUME.md for context."

After picking a direction and `/gsd-sketch --wrap-up`, run:

```
/gsd-progress
```

It should pick up at requirements + roadmap. If it doesn't auto-route, run:

```
/gsd-new-project
```

— it'll see PROJECT.md exists and route to the correct continuation step, OR error and tell you to use `/gsd-progress`. (`/gsd-progress` is the safer default.)

## Open Questions Surfaced by Research

- Are any Financial Models / Marketing material pieces NDA'd or have client data? May need redaction or to drop pieces.
- What's the actual piece distribution per category? If a category has 0 pieces ready, drop it from the v1 splash.
- Personal Projects content is undefined — will fill in as it materializes; OK to launch with placeholder or 1 piece.
- Domain string TBD — research recommends `caleblim.com` if available, fallback options to be checked at deploy time.

## Files Index

- `.planning/PROJECT.md` — what we're building
- `.planning/config.json` — workflow knobs
- `.planning/research/STACK.md` — Framer-vs-Astro comparison (Astro chosen)
- `.planning/research/FEATURES.md` — table stakes / differentiators / anti-features
- `.planning/research/ARCHITECTURE.md` — Astro content collections, PDF rasterization pipeline, routing
- `.planning/research/PITFALLS.md` — AI-tells, cross-functional traps, iOS Safari PDF bug, motion overuse
- `.planning/research/SUMMARY.md` — synthesized roadmap implications
