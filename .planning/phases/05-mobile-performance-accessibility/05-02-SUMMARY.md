---
phase: 5
plan: 02
subsystem: deploy-infra
tags: [vercel, ci, deploy, sc2, wave-1, infra-only]
requires: [05-01]
provides:
  - "SC2 instrumentation live: production Vercel deploy of caleb-lim-portfolio reachable at https://caleb-lim-portfolio.vercel.app"
  - "Push → auto-deploy pipeline verified (empty-commit push to main produced fresh deploy in ~17s)"
  - "Production URL recorded in 05-VERIFICATION.md for Plan 05-08 Lighthouse target"
  - "Deployment Protection confirmed DISABLED — public unauthenticated 200 OK"
affects:
  - ".planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md — Vercel Project Bootstrap section + Lighthouse target URL + Phase Exit Sign-Off tickbox"
  - "Git: 2 commits pushed to origin/main during this plan (1 documentation, 1 empty trigger)"
tech-stack:
  added:
    - "Vercel (host) — Astro framework preset auto-detected; default static build; no vercel.json shipped; production branch = main"
  patterns:
    - "Push-to-main → auto-deploy verified ~17s end-to-end (build + edge propagation)"
key-files:
  created:
    - ".planning/phases/05-mobile-performance-accessibility/05-02-SUMMARY.md"
  modified:
    - ".planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md"
decisions:
  - "Lighthouse target switched from branch-alias preview URL → production URL. Plan 05-02 originally assumed a working `phase-5` branch would carry Wave-1 work and Lighthouse would audit a `caleb-lim-portfolio-git-phase-5-<scope>.vercel.app` preview. Actual execution landed all Wave-1 plans (05-03, 05-04, 05-05) directly on `main`, so no preview branch ever existed. Production URL is now the SC2 audit target; numerical thresholds (Perf ≥85, A11y ≥95, splash LCP <2000ms) are unchanged. Plan 05-08 must call `bash scripts/lighthouse-audit.sh https://caleb-lim-portfolio.vercel.app`."
  - "Branch-alias `<scope>` slug deferred. The expected pattern is `caleb-lim-portfolio-git-<branch>-<scope>.vercel.app`. Probed `c-lb`, `clb`, and no-scope on the `main` branch — all 404'd, which is expected because Vercel only serves branch aliases for non-production branches. The actual `<scope>` slug Vercel assigned this project will be discovered on the first non-main push. Not blocking — Lighthouse target is the production URL."
  - "No `vercel.json`, no `@vercel/astro` adapter, no `astro.config.mjs` change. Default Astro static build, per 05-RESEARCH §4.2 step 6. Vercel auto-detected everything."
  - "Deployment Protection left DISABLED (confirmed via headers — no `www-authenticate` on 200 response). The site is intentionally public; Caleb's portfolio is meant for recruiters to reach without auth."
metrics:
  duration: ~5min (resume only — Tasks 1+2 had completed in prior agent run; this agent ran Task 3 verification + write-up)
  completed: 2026-05-19
---

# Phase 5 Plan 05-02: Vercel Bootstrap Summary

Wave-1 SC2 instrumentation gate. GitHub `C-lb/caleb-lim-portfolio` is now wired
to Vercel; pushing to `main` auto-deploys to `https://caleb-lim-portfolio.vercel.app`
within ~17 seconds. Production URL is the Lighthouse audit target for Plan 05-08.

No source files touched — this plan was 100% infrastructure setup + one
record-keeping markdown edit. Default Astro static build; no `vercel.json`, no
adapter, no env vars.

## Tasks Completed

| # | Task | Outcome | Commits |
|---|------|---------|---------|
| 1 | Push GitHub repo state | Done by prior agent — 18 commits `0690fb9..0dd79a2` pushed to `origin/main` | (pre-this-agent) |
| 2 | User imports repo into Vercel | Done by Caleb at vercel.com/new on 2026-05-19; production URL `https://caleb-lim-portfolio.vercel.app` returned | (user-driven) |
| 3 | Record bootstrap + verify push-trigger | Production URL recorded; empty commit push verified fresh deploy in ~17s | `14fb499`, `254cc74`, `cfa1e17` |

## Verification Evidence

### Production URL liveness

Probed `https://caleb-lim-portfolio.vercel.app` via HEAD before any new push.
Returned: `200 OK`, `server: Vercel`, `x-vercel-cache: HIT`, `content-type: text/html; charset=utf-8`.
No `www-authenticate` header — Deployment Protection is disabled (public site as intended).

### Push-trigger latency

| Probe | x-vercel-id | x-vercel-cache | age (s) |
|-------|-------------|----------------|---------|
| Pre-deploy edge (cb=…) | sin1::g9jhm-1779152280443-d96985ae0a47 | HIT | 583 |
| Post-deploy (cb=…, 17s after push) | sin1::4mspc-1779152296187-2f12dccf9ccb | HIT | 0 |

New `x-vercel-id` + `age:0` in the post-push probe confirms Vercel served a
fresh build, not a stale cache. Pipeline is live.

### Branch-alias slug

Plan's expected `caleb-lim-portfolio-git-main-c-lb.vercel.app` returned 404.
This is expected — Vercel only serves branch aliases for *non-production*
branches; `main` is the production branch and lives at the bare project domain.
The actual `<scope>` slug Vercel assigned this project will be discovered on
the first non-`main` push (Phase 6 work likely).

## Deviations from Plan

### Auto-fixed / adapted

**1. [Rule 3 — Blocking adaptation] Plan assumed a `phase-5` working branch; reality used `main` directly**
- **Found during:** Task 3 resume (curl-probing the planned branch-alias URL `caleb-lim-portfolio-git-phase-5-c-lb.vercel.app` would have 404'd because no such branch was ever pushed — Wave-1 plans 05-03/04/05 all committed straight to `main`)
- **Issue:** Plan 05-02 Task 2 in the original PLAN told the executor to `git checkout -b phase-5` + push that branch to trigger a preview deploy. By the time this plan ran, all Wave-1 work was already on `main` and `main` was already the production-deploying branch.
- **Adaptation:** Reframed Task 2 as "verify the production deploy works" (since Vercel is now deploying `main` directly) and Task 3 as "push an empty commit to `main` to time the auto-deploy latency end-to-end" — equivalent gate, same evidence, fits actual git state.
- **Files modified:** `.planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` (recorded as "plan-vs-reality drift" inline)
- **Commits:** `14fb499`, `254cc74`, `cfa1e17`

**2. [Rule 2 — Missing critical functionality] Lighthouse target URL needed updating in 05-VERIFICATION.md**
- **Found during:** Task 3
- **Issue:** Template stub said preview URL TBD with default pattern `caleb-lim-portfolio-git-phase-5-c-lb.vercel.app`. Per drift above, that URL will never exist for this phase. Plan 05-08 would have run Lighthouse against a 404.
- **Fix:** Updated the Lighthouse Scores section header to point at `https://caleb-lim-portfolio.vercel.app`.
- **Commit:** `14fb499`

## Deferred Items

- **Branch-alias `<scope>` slug discovery** — first non-`main` push (Phase 6, deploy to `caleblim.com` work) will reveal the exact slug Vercel assigned to this project. Not blocking SC2.
- **CI Lighthouse gate** — already deferred per D-16 (manual-only for Phase 5).

## Known Stubs

None. Vercel project is fully functional; production URL serves real content.

## Self-Check: PASSED

- `[ -f .planning/phases/05-mobile-performance-accessibility/05-02-SUMMARY.md ]` → FOUND (this file, just written)
- `git log --oneline | grep 14fb499` → FOUND (docs commit)
- `git log --oneline | grep 254cc74` → FOUND (empty trigger commit)
- `git log --oneline | grep cfa1e17` → FOUND (push-verification commit)
- `grep -F 'Vercel Project Bootstrap' .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` → present
- `grep -F 'caleb-lim-portfolio.vercel.app' .planning/phases/05-mobile-performance-accessibility/05-VERIFICATION.md` → present (multiple matches)
- No source files in `src/` modified by this plan (verified — git log for these commits touches only `.planning/`)
