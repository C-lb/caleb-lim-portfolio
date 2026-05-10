---
phase: 1
slug: walking-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 1 uses `npm run build` (Astro content layer + Zod) as the integration test, plus a smoke shell script over `dist/`. Vitest deferred to Phase 2 (when `scripts/pdf-preprocess.mjs` becomes load-bearing). |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run test:smoke && npm run pdf-poc` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run test:smoke`
- **Before `/gsd-verify-work`:** Full suite must be green (build + smoke + pdf-poc all exit 0)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-XX-XX | TBD | 1 | PIECE-01 | — | Each piece detail page renders a hero `<img>`, never an iframe | smoke | `npm run build && grep -RL 'iframe' dist/{design,finance,personal,marketing}/*/index.html` | ❌ W0 (script) | ⬜ pending |
| 1-XX-XX | TBD | 1 | PIECE-01 | — | All four category routes resolve and link to ≥1 detail page | smoke | `npm run build && for c in design finance personal marketing; do test -d dist/$c; done` | ❌ W0 (script) | ⬜ pending |
| 1-XX-XX | TBD | 1 | PIECE-02 | — | Each detail page contains "Context", "Role", "Outcome" text | smoke (HTML grep) | shell script over `dist/**/*.html` | ❌ W0 (script) | ⬜ pending |
| 1-XX-XX | TBD | 1 | Schema (gate) | T-1-01 | Build fails on missing required frontmatter field | manual | inject piece missing `outcome:`, expect non-zero exit from `npm run build` | manual one-time | ⬜ pending |
| 1-XX-XX | TBD | 1 | Schema (gate) | T-1-02 | Build fails on path-traversal hero reference | manual | inject `hero: "../../../etc/passwd"`, expect non-zero exit | manual one-time | ⬜ pending |
| 1-XX-XX | TBD | 2 | POC (criterion 4) | — | `npm run pdf-poc` exits 0 and emits non-zero PNG | smoke | `npm run pdf-poc && test -s pdf-poc-out.png` | ❌ W0 (script) | ⬜ pending |
| 1-XX-XX | TBD | 2 | Deploy (criterion 5) | — | `npm run build` produces a `dist/` deployable to a preview URL | manual | run `astro preview` locally OR push to a Cloudflare Pages preview branch and confirm the URL renders | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs will be filled in by the planner; per-task mapping happens at plan-creation time.*

---

## Wave 0 Requirements

- [ ] `scripts/verify-build.sh` — runs the smoke greps above on `dist/`
- [ ] `package.json` — wire `"test:smoke": "scripts/verify-build.sh"` and `"pdf-poc": "node scripts/pdf-poc.mjs"`
- [ ] `.nvmrc` containing `22.16.0`
- [ ] `package.json` — pin `astro@^5.18.1`, `pdfjs-dist@^5.7.284`; do NOT install `@napi-rs/canvas` directly (it lands as pdfjs's optionalDep at `^0.1.100`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Schema rejects missing required field | Schema gate | One-time fault injection — automating it would require a separate test harness Phase 1 doesn't justify | Temporarily edit one piece's frontmatter to remove `outcome:`, run `npm run build`, confirm non-zero exit and a clear error message naming the missing field. Revert. |
| Schema rejects path-traversal hero | T-1-02 | Same fault-injection rationale | Temporarily edit one piece's frontmatter to set `hero: "../../../etc/passwd"`, run `npm run build`, confirm non-zero exit. Revert. |
| Preview URL renders correctly | Phase 1 success criterion 5 | Visual check — automating requires a headless browser harness that's overkill for Phase 1 | After `npm run build`, run `npx astro preview` and load `http://localhost:4321/`. Click each of the four discipline cards. Click into one piece per discipline. Confirm hero image renders + Context / Role / Outcome blocks present. (Cloudflare Pages preview branch URL is the equivalent if wired up.) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
