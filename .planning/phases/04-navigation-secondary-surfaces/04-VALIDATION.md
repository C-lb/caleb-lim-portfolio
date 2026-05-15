---
phase: 4
slug: navigation-secondary-surfaces
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Populated by gsd-planner using `## Validation Architecture` from 04-RESEARCH.md.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | {bash + grep via scripts/verify-build.sh — no node test runner yet} |
| **Config file** | scripts/verify-build.sh (Phase 3 established gate 1–18) |
| **Quick run command** | `bash scripts/verify-build.sh` |
| **Full suite command** | `npm run build && bash scripts/verify-build.sh` |
| **Estimated runtime** | ~{TBD by planner} seconds |

---

## Sampling Rate

- **After every task commit:** Run `bash scripts/verify-build.sh` (relevant gate subset)
- **After every plan wave:** Run `npm run build && bash scripts/verify-build.sh`
- **Before `/gsd:verify-work`:** Full suite must be green + human walk for SC4 mailto delivery
- **Max feedback latency:** {TBD by planner} seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {populated by planner} | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `scripts/verify-build.sh` with Phase 4 gates (19a–f, 20, 21a/b/c, 22 per RESEARCH.md)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| mailto link delivers to real inbox | CONTACT-03 (SC4) | Cannot automate external SMTP delivery confirmation | Send a test email from a different account to caleblimster@gmail.com; verify receipt |
| Visual chrome placement consistency across all routes | CONTACT-04 (SC1) | Layout regression requires human eye | Browser walk: splash → each gallery → each piece detail → about → 404; confirm header visible + identical |
| Tap target ≥44px on desktop ≥768px | CONTACT-04 (SC1) | Phase 5 owns mobile audit; Phase 4 only confirms desktop affordances visible | Inspect element on each header link; height + padding ≥44px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < {TBD} seconds
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
