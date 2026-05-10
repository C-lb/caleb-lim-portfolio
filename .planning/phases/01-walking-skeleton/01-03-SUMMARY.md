---
phase: 01-walking-skeleton
plan: 03
subsystem: pdf-rasterization-poc
tags: [pdf-rasterization, poc, pdfjs-dist, napi-rs-canvas, phase-2-derisk, throwaway]

# Dependency graph
requires:
  - phase: 01-walking-skeleton
    plan: 01
    provides: pdfjs-dist@^5.7.284 pinned (devDep), @napi-rs/canvas@^0.1.100 transitive optionalDep, pdf-poc-out.png in .gitignore, "pdf-poc" pre-stubbed npm script, .nvmrc=22.16.0
provides:
  - Working scripts/pdf-poc.mjs verbatim Mozilla pdf2png canonical pattern (legacy/build/pdf.mjs entry, built-in pdfDocument.canvasFactory, no workerSrc)
  - Local POC validation against a real ~28 MB / 64-page Caleb portfolio PDF on macOS Node 24.15.0 — exit 0, 91511-byte 1440x810 PNG
  - samples/.gitkeep + samples/* gitignore line so the directory shape ships without committing the PDF (user override at Task 1 checkpoint)
  - Reference template for Phase 2's productionized scripts/pdf-preprocess.mjs
affects: [02-asset-pipeline]

# Tech tracking
tech-stack:
  added: []  # All deps were already pinned by 01-01; this plan exercises them but adds nothing new.
  patterns:
    - "Verbatim Mozilla canonical pdf2png pattern: import getDocument from 'pdfjs-dist/legacy/build/pdf.mjs'; use pdfDocument.canvasFactory (not hand-instantiated @napi-rs/canvas); never set GlobalWorkerOptions.workerSrc in Node — the legacy entry runs the worker in-process"
    - "Informative process.exit codes: 0 success / 1 render crash / 2 input missing / 3 zero-byte output — turns the POC's pass/fail into a single line in any build log"
    - "Throwaway-script discipline: scripts/pdf-poc.mjs lives outside the npm `build` path, output (pdf-poc-out.png) is gitignored, dist/ never contains the artifact — Phase 2 builds clean from this reference, not on top of it (D-05)"
    - "Sample-input gitignore pattern: `samples/*` + `!samples/.gitkeep` keeps the directory tracked while the actual PDF stays local — accommodates Caleb's portfolio PDFs (potentially NDA'd, large) without forcing them into git"

key-files:
  created:
    - scripts/pdf-poc.mjs
    - samples/.gitkeep
  modified:
    - .gitignore  # added `samples/*` and `!samples/.gitkeep` (user override Task 1)

key-decisions:
  - "Override at Task 1 checkpoint (user-authorized): Caleb's PDF (G15 G5 Case Presentation, ~28 MB, 64 pages) is copied locally to samples/poc-input.pdf but NOT committed. samples/ is gitignored except .gitkeep. This is the plan's documented `fallback path` (01-03-PLAN.md lines 97–98) and means CF Pages venue verification (Task 3 Option A) cannot run for this plan — the gitignored PDF can't reach the build container."
  - "Task 3 venue: Option C (degraded — local macOS only). Per CONTEXT.md `Claude's Discretion` (preview deploy is `recommended but not required` for Phase 1 sign-off). Phase 2's first task must include a CI-suitable PDF strategy + a CF Pages binary-compat smoke test — Assumption A2 (`@napi-rs/canvas-linux-x64-gnu prebuilt loads in CF gVisor sandbox`) remains soft-validated only on macOS until Phase 2."
  - "POC is intentionally throwaway (D-05): Phase 2's scripts/pdf-preprocess.mjs builds CLEAN from this reference, not by editing it. The POC is a probe, not a foundation. Decision: leave the POC in place as Phase 2's reference implementation rather than delete it — its presence costs ~60 lines, its absence would cost Phase 2 a context re-read."

patterns-established:
  - "Pattern: Standalone POC script convention — `scripts/<name>-poc.mjs`, gitignored output, not on `build` path, informative exit codes. Phase 2's preprocess script will adopt the same exit-code discipline."
  - "Pattern: Sample-input gitignore (`samples/*` + `!samples/.gitkeep`) — accommodates user-supplied test fixtures without forcing them into git. Phase 2 may extend this to per-piece source.pdf colocation if NDA constraints surface."
  - "Anti-pattern dodged: Did NOT install @napi-rs/canvas directly (Pitfall 5 — 1.0 is a breaking major incompat with pdfjs 5.7's expected ^0.1.100). Did NOT set GlobalWorkerOptions.workerSrc (Pitfall — Node usage breaks if set). Did NOT put POC on the build path (D-05)."

requirements-completed: []  # No requirement IDs are mapped to this plan; it's a Phase-2-derisk POC, not a feature.

# Metrics
duration: ~3min
completed: 2026-05-10
---

# Phase 1 Plan 3: PDF Rasterization POC (pdfjs-dist + @napi-rs/canvas) Summary

**Standalone throwaway POC at `scripts/pdf-poc.mjs` runs against Caleb's real ~28 MB / 64-page case-presentation PDF on macOS Node 24.15.0 — exits 0, emits a 91511-byte 1440x810 PNG. D-06 success bar met. Phase 2 unblocked.**

## Performance

- **Duration:** ~3 min (Task 1 commit 12:00, Task 2 commit 12:01)
- **Started:** 2026-05-10T03:58:00Z (worktree branch verification)
- **Completed:** 2026-05-10T04:01:45Z (Task 2 commit)
- **Tasks:** 2 implementation tasks committed atomically (Task 1 = checkpoint resolved by user override; Task 3 = checkpoint resolved as Option C local-only per the same override)
- **Files modified:** 3 (1 modified — `.gitignore`; 2 created — `scripts/pdf-poc.mjs`, `samples/.gitkeep`)

## Accomplishments

- **POC works against a real, non-trivial Caleb PDF.** 28 MB, 64-page slide deck. The POC reads page 1 (per spec) and rasterizes it cleanly. Phase 2's first concern — does the library stack even tolerate Caleb's actual portfolio shape? — is now answered yes for the macOS half of the matrix.
- **Verbatim Mozilla canonical pattern shipped, no deviations.** Legacy entry, built-in canvasFactory, no workerSrc, exit codes per spec. Pitfalls 1 (pdfjs-dist regression), 5 (@napi-rs/canvas 1.0 incompat), 6 (Node engine), 7 (Workers vs Pages BUILD env confusion) all dodged because 01-01 pinned the right versions and this plan used the canonical pattern verbatim.
- **POC stays throwaway.** Output gitignored, build script does not invoke `pdf-poc`, dist/ does not contain `pdf-poc-out.png`. Phase 2 builds `scripts/pdf-preprocess.mjs` clean from this reference rather than evolving it in place — D-05's intent is preserved.
- **Directory shape ships without the PDF.** `samples/.gitkeep` is committed; `samples/poc-input.pdf` is gitignored. Anyone cloning the repo sees where the POC expects its input without inheriting the actual binary.

## Task Commits

Each task was committed atomically:

1. **Task 1: User-supplied PDF + gitignore samples/** — `72660dd` (chore)
2. **Task 2: Write `scripts/pdf-poc.mjs`** — `bfd14f1` (feat)
3. **Task 3: Verify POC runs in Cloudflare Pages preview build environment** — _checkpoint:human-verify; resolved as Option C (local macOS only) per user override at Task 1 checkpoint. No commit. See Deviations below._

_Note: SUMMARY commit follows separately under the orchestrator's wave-end protocol._

## Files Created/Modified

- `scripts/pdf-poc.mjs` — verbatim Mozilla pdf2png canonical pattern (60 lines). Imports `getDocument` from `pdfjs-dist/legacy/build/pdf.mjs`. Uses `pdfDocument.canvasFactory` (the built-in NodeCanvasFactory that pulls @napi-rs/canvas via pdfjs's optionalDep resolution). No `GlobalWorkerOptions.workerSrc`. Informative exit codes: 0 success, 1 render crash, 2 input missing, 3 zero-byte output. Defaults: input `samples/poc-input.pdf`, output `pdf-poc-out.png` (both overridable via argv).
- `samples/.gitkeep` — empty breadcrumb file. With `samples/*` in .gitignore but `!samples/.gitkeep` un-ignoring this one file, the directory persists in git while the PDF stays local.
- `.gitignore` — appended two lines: `samples/*` and `!samples/.gitkeep`. Header comment cites the user override at Task 1 checkpoint and the deferred-CF-Pages-verification consequence.

## Decisions Made

- **Plan 01-03 followed as written for the script content.** Task 2's verbatim Mozilla pattern is unaltered. All static invariants from the plan's `<verify>` block are green: `legacy/build/pdf.mjs` import, no `workerSrc`, `pdfDocument.canvasFactory`, all four exit codes present.
- **Override at Task 1 checkpoint (user-authorized at orchestrator level):** PDF is local-only; samples/ gitignored. This selects the plan's documented "fallback path" (01-03-PLAN.md lines 97–98).
- **Override at Task 3 checkpoint (consequence of Task 1 override):** CF Pages venue verification is deferred. Option C path chosen — local macOS verification only. Per CONTEXT.md "Claude's Discretion", preview-deploy verification is "recommended but not required" for Phase 1 sign-off, so this is a documented soft-fail rather than a blocker.

## Deviations from Plan

### User-authorized overrides (not Rule 1–3 deviations)

**1. [Override at Task 1 checkpoint] PDF is gitignored, not committed**

- **Found during:** Task 1 (human-action checkpoint) — resolved by user override before pause.
- **Plan stance:** Task 1 documented two paths: (a) recommended — Caleb commits a small public-OK PDF, which unlocks CF Pages verification in Task 3 Option A; (b) fallback — gitignore samples/, run POC locally only.
- **What changed:** User explicitly directed the fallback path (override block in agent prompt, lines: "Commit choice — DO NOT commit the PDF; gitignore `samples/`"). The actual file Caleb supplied — `G15 G5 Case Presentation.pdf` — is ~28 MB, well over the plan's "≤ 500KB" comfort threshold for committing, so the fallback is the right call irrespective of NDA concerns.
- **Implementation:** `cp "/Users/caleb/Downloads/G15 G5 Case Presentation.pdf" samples/poc-input.pdf`. Added `samples/*` and `!samples/.gitkeep` to `.gitignore`. `git status` confirms `samples/poc-input.pdf` is ignored, `samples/.gitkeep` is tracked.
- **Files modified:** `.gitignore`, `samples/.gitkeep` (created), `samples/poc-input.pdf` (copied locally — NOT committed).
- **Verification:** `git check-ignore -v samples/poc-input.pdf` returns `.gitignore:11:samples/*`; `git check-ignore -v samples/.gitkeep` returns `.gitignore:12:!samples/.gitkeep` (negated, i.e. tracked).
- **Committed in:** `72660dd` (Task 1 commit — gitignore + .gitkeep, NOT the PDF itself).

**2. [Override at Task 3 checkpoint] CF Pages venue verification deferred (Option C, not Option A)**

- **Found during:** Task 3 (human-verify checkpoint) — resolved by the same user override block before pause.
- **Plan stance:** Task 3 lists three options. Option A (CF Pages preview build) is preferred. Option B (any Linux box). Option C (macOS only) is "the worst path — leaves Assumption A2 unverified going into Phase 2 — but it's not a blocker for Phase 1 sign-off per CONTEXT.md 'Claude's Discretion' (preview deploy is 'recommended but not required')."
- **What changed:** Option C selected. Local macOS verification only, on Node 24.15.0. The PDF is gitignored so Option A (CF Pages branch deploy) cannot run as-is — the build container would not have the input file. Option B (separate Linux box) was not attempted; orchestrator did not authorize spinning up a Linux environment.
- **Implication for Phase 2:** Phase 2's first task must include (a) a CF Pages binary-compat smoke test for `@napi-rs/canvas-linux-x64-gnu` in the gVisor sandbox, AND (b) a CI-suitable PDF strategy — either commit small fixtures alongside `scripts/pdf-preprocess.mjs`, or use a synthetic PDF generated at build time, or move the POC's PDFs into a separate (gitignored or LFS) location that CI can mount. Assumption A2 remains soft-validated.
- **Files modified:** None (checkpoint task, no commit).
- **Verification:** `npm run pdf-poc` exits 0 locally, emits 91511-byte PNG at 1440x810. Verified on macOS, Node 24.15.0, with @napi-rs/canvas-darwin-arm64 prebuilt.
- **Committed in:** N/A (the Task 2 commit `bfd14f1` is the artifact; the deferred-verification status is captured here in SUMMARY).

---

**Total deviations:** 2 user-authorized overrides (no auto-fix Rule 1–3 triggers fired during this plan).
**Impact on plan:** D-05 / D-06 / Phase 1 success criterion 4 ("rasterizes a real PDF without crashing in CI") are met for the macOS half of the matrix only. The Linux/CF Pages half is deferred to Phase 2's first task. Phase 1 sign-off is unaffected per CONTEXT.md "Claude's Discretion."

## Issues Encountered

- **None during script execution.** POC ran first try.
- **`node_modules/` was not present in the worktree** — ran `npm install --no-audit --no-fund` (282 packages, ~2s). Expected for a fresh-checkout worktree; not a deviation.
- **Node 24.15.0 vs .nvmrc's 22.16.0** — local environment is on 24.15.0 (newer than the pinned 22.16.0). Both satisfy pdfjs-dist@5.7.284's `>=22.13.0 || >=24` engine constraint (Pitfall 6). CF Pages will use the 22.16.0 from `.nvmrc`. The POC ran fine on 24, which is the tighter test. No action needed.
- **`samples/poc-input.pdf` is 28.6 MB** — exceeds the plan's `≤ 500KB if committing` comfort threshold but the fallback path applies (gitignored), so size doesn't matter. Phase 2 will need a smaller / synthetic / LFS strategy for CI.

## Known Stubs

None at the script level — the POC is complete for what D-05/D-06 ask of it. The "stub" lives at the verification level: CF Pages venue verification is deferred. Tracked in Deviation #2 above.

## Threat Flags

None. The POC exercises the same `@napi-rs/canvas` prebuilt-binary install surface that 01-01 already mitigated (T-1-02). No new network endpoints, no new auth paths, no new file-access patterns at trust boundaries — the POC reads one user-supplied PDF and writes one PNG, both at fixed local paths.

## Next Phase Readiness

- **Phase 2 can begin.** D-05 throwaway POC pattern is in place — `scripts/pdf-preprocess.mjs` (Phase 2 first task) builds CLEAN from this reference, not by editing `scripts/pdf-poc.mjs`. The POC stays as documentation.
- **Phase 2 first task MUST include:**
  1. CF Pages binary-compat smoke test for `@napi-rs/canvas-linux-x64-gnu` in the gVisor sandbox (Assumption A2 — soft-validated only locally on macOS).
  2. A CI-suitable PDF strategy: either commit small (~200KB) fixture PDFs alongside `scripts/pdf-preprocess.mjs`, or generate a synthetic PDF at build time, or use git-LFS / a separate sample-store path that the CF Pages build can fetch. The current `samples/poc-input.pdf` is gitignored and 28 MB — neither suitable.
  3. Multi-page handling (PIECE-04) — the POC reads page 1 only; Phase 2 needs the full doc.
  4. Output destination: `public/generated/pdf-thumbs/` (per Phase 2 plan), committed to git per Phase 2 success criterion 1. The POC's `pdf-poc-out.png` at repo-root pattern does NOT carry forward.
- **No code or schema changes need to be made by Phase 2 before this is usable.** The POC is reference-only; Phase 2 reads it and writes a new file.

---

## Self-Check

**Files claimed → existence:**
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-abb22ea241e2b98b5/scripts/pdf-poc.mjs` — FOUND (60 lines)
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-abb22ea241e2b98b5/samples/.gitkeep` — FOUND (0 bytes, intentional)
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-abb22ea241e2b98b5/samples/poc-input.pdf` — FOUND on disk, NOT in git index (correct per user override)
- `/Users/caleb/projects/new-project/.claude/worktrees/agent-abb22ea241e2b98b5/.gitignore` — MODIFIED (samples lines appended)

**Commits claimed → git log:**
- `72660dd` (Task 1 — chore: gitignore + .gitkeep) — FOUND on worktree-agent-abb22ea241e2b98b5
- `bfd14f1` (Task 2 — feat: pdf-poc.mjs) — FOUND on worktree-agent-abb22ea241e2b98b5

**Acceptance gates:**
- `samples/poc-input.pdf` exists in worktree but NOT committed — VERIFIED (`git check-ignore -v` confirms)
- `samples/.gitkeep` is committed — VERIFIED (in `72660dd`)
- `scripts/pdf-poc.mjs` written following RESEARCH.md Pattern 6 verbatim — VERIFIED (legacy import / no workerSrc / canvasFactory / exit codes 0/1/2/3 all present)
- `npm run pdf-poc` exits 0 locally and produces a non-zero-byte `pdf-poc-out.png` — VERIFIED (exit 0, 91511 bytes, 1440x810)
- `dist/` does not contain `pdf-poc-out.png` — VERIFIED (no `dist/` exists yet; `npm run build` is not invoked by `pdf-poc`)
- POC is NOT on build path — VERIFIED (`package.json` "build" = `astro build`, not `astro build && pdf-poc`)
- All tasks committed atomically — VERIFIED (2 task commits, plus this SUMMARY commit follows)
- No modifications to STATE.md or ROADMAP.md — VERIFIED (`git status` clean of those paths)

## Self-Check: PASSED

---
*Phase: 01-walking-skeleton*
*Completed: 2026-05-10*
