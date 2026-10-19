# AMS Execution Checkpoint

**Purpose:** Compact resume pointer for the current delivery effort. This is not a replacement for the roadmap, gap register, specifications, or current source.  
**Recovery procedure:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Canonical sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement inventory:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`

> All SHAs and CI statuses below are dated snapshots, not live state. On every resume, fetch the current `main` HEAD and current workflow results before editing. Update this file after every meaningful slice.

## 1. Last verified code/test snapshot

Latest application/test snapshot verified on **19 October 2026**:

| Item | Evidence |
|---|---|
| Latest source/test commit | `4e57c8b4b8d7b3aabf3393b48499627db2015b40` |
| Commit | [test(clients): assert local renewal date semantics](https://github.com/Kapitech-Agency/kapitech-ams/commit/4e57c8b4b8d7b3aabf3393b48499627db2015b40) |
| Changed application source | `src/pages/admin/AdminClientRetainers.tsx`; `src/lib/retainerDateDefaults.ts` |
| Regression tests | `tests/client-retainer-date-defaults.test.ts`; `tests/admin-pages-jsx-regression.test.ts` |
| AMS CI | **Passed**: [run 39253706334](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39253706334) |
| AMS Quality Gate | **Passed**: [run 39253706326](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39253706326) |
| Validation detail | Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed. |

### Recent verified frontend slices

- [Settings backup-history correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba): desktop rows use per-snapshot verification; both workflows passed.
- [Dashboard monetary truthfulness correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68): non-finite amounts show unavailable, not zero; both workflows passed.
- [Inbox applicant-presentation cleanup](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf): removed unreachable Careers-only UI while preserving the source filter and CMS route; both workflows passed.
- [Tasks local-date correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/af65907022d9973b3859145e0971bf22a6caf343): due-date defaults use local calendar fields; both workflows passed.
- [Planning tab query preservation](https://github.com/Kapitech-Agency/kapitech-ams/commit/444b9891b33e7891567341711dfa9a8d29866bf4): active Planning tabs preserve `planningProject`; both workflows passed.
- [Clients exports and Onboarding copy](https://github.com/Kapitech-Agency/kapitech-ams/commit/1ae8209b39ff65cc7cbb6c302ddc9815efc5720c): one visible scope-aware export handler, profile-only Onboarding columns, preserved Directory financial fields, truthful readiness copy; both workflows passed.
- [Retainer default dates and renewal date-only handling](https://github.com/Kapitech-Agency/kapitech-ams/commit/88d7804dfc2d9f73fd2afeb16bd33d08b54519a1) with corrected regression coverage at [`4e57c8b4b8d7b3aabf3393b48499627db2015b40`](https://github.com/Kapitech-Agency/kapitech-ams/commit/4e57c8b4b8d7b3aabf3393b48499627db2015b40): create/reset defaults use the local calendar; Renewal Schedule uses validated date-only calendar arithmetic and date rendering. Due today counts as day 0, day 30 is included, invalid dates are excluded from the summary and no longer gain a warning by null coercion, and the entered date remains stable at negative UTC offsets. The new tests exercise Jakarta day boundaries, the 0/1/30/31-day cases and Honolulu date display.

The first validation attempt on source commit [`88d7804dfc2d9f73fd2afeb16bd33d08b54519a1`](https://github.com/Kapitech-Agency/kapitech-ams/commit/88d7804dfc2d9f73fd2afeb16bd33d08b54519a1) failed because an older responsive-retainer test asserted the prior `renewalDays(item.renewal) <= 30` implementation expression. The fix commit `4e57c8b4b8d7b3aabf3393b48499627db2015b40` updated that assertion to verify the shared highlight helper, invalid-date guard, both responsive styles and inclusive 0–30-day summary filter. It did not remove the test or loosen its behavior checks. Both workflows passed on the follow-up SHA.

This checkpoint is a dated evidence pointer, not a live branch status feed. Re-fetch `main` and exact workflow results before acting; docs-only commits do not change the source/test snapshot that was tested.

## 2. Active delivery stage

**Stage 4 — Main-content hierarchy across all nine modules: in progress.**

The gap register's snapshot for `AMS-MAIN-CONTENT-STRUCTURE-001` recorded some Dashboard, Inbox, Projects Overview and Clients slices as source/test-verified, with other workspaces and worksheets open. This should not be treated as a complete summary of every later commit already on `main`.

Recent repository history includes further work/tests for **Website CMS, Finance and Settings**. On resume, compare recent commit diffs with current code/tests and update the relevant gap rows/traceability/progress notes before selecting the next content slice. Do not repeat completed work simply because a summary has not caught up.

### Scope to preserve

- Approved nine-module navigation is considered implemented; do not build it again.
- Stage 4 is a task-based structural overhaul, not cosmetic polishing. Follow `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` and `docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`.
- Work in bounded, source-backed, tested slices. Commit directly to `main` when supported and authorized.
- Do not opportunistically change backend/API/database/schema/auth/session/CSRF/MFA/RBAC, Finance calculations/postings, permissions, provider contracts, or established business logic during the structural/UI stage.
- Stage 5 visual/responsive/accessibility review and **explicit user sign-off** remain a mandatory gate before broad Stage 6 work.

## 3. Immediate resume sequence

Re-verify live source and CI on every resume; this list is a dated recovery pointer.

1. **Rehydrate:** fetch current `main`, recent history, relevant source and exact current CI/Quality Gate results.
2. **Preserve verified slices:** Settings backup history, Dashboard money fallback, Inbox applicant ownership, Tasks local dates, Planning query context, Clients scope-aware exports/evidence-based Onboarding copy, Retainer local-date defaults and Renewal Schedule calendar-day handling have successful exact-SHA evidence.
3. **Continue structural main-content redesign, not ad hoc gap chasing:** follow [AMS Frontend Structural Redesign Audit & Execution Specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md) and [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md). Use the canonical module/workspace order and the View Structure Contract. The Renewal Schedule date-only fix is already source/test-verified; do not select another isolated Clients defect unless it blocks the current structural slice or is a new regression. For each selected view, document current-vs-target composition and implement its material structural changes before moving to the next view.
4. **Validate one bounded slice:** inspect current source/tests and gap row, make the smallest complete change, retain negative-path regression tests, verify both CI workflows on the source/test SHA, then update checkpoint and gap evidence.
5. **Release gate remains closed:** authenticated browser/viewport/accessibility review and explicit user sign-off are still required at Stage 5. No authenticated screenshot or browser visual/keyboard/touch test has been performed in this execution. Do not start broad Stage 6 workflow/backend implementation before approval.

## 4. Checkpoint update template

Update the current fields after each substantial slice. Keep the file concise and operational.

- **Updated at:** YYYY-MM-DD HH:MM UTC
- **Stage / slice:** one roadmap stage and one bounded requirement/module/workspace
- **Current main HEAD:** full SHA + commit link (dated live snapshot)
- **Last verified commit:** full SHA + exact verified outcome
- **Changed paths:** file list or commit link
- **Tests/checks:** exact command or job, result, and run link
- **Unverified items/blockers:** precise evidence and impact
- **Gap/traceability updates:** requirement IDs and links
- **Last completed acceptance item:** one concrete statement
- **Next single action:** one actionable step
- **User decision/sign-off:** requirement and gate, or “none”
- **Environment limits:** browser/runtime/access limits only when actually applicable

Do not replace evidence with generic phrases such as “continued”, “fixed”, “done”, or “looks good”.

## 5. Current next-action rule

For the structural main-content objective, also follow [AMS Frontend Structural Redesign Audit and Execution Specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md). Do not treat date/CSV/copy/query bug fixes as structural redesign completion. Implement the selected view's structure contract, validate the actual composition, and preserve the Stage 5 user sign-off gate.



When the user says “lanjutkan” or similar, do not ask them to restate the task and do not give only another prompt or plan. Follow [the resume protocol](AMS-RESUME-AFTER-INTERRUPTION.md), inspect the current source and CI, carry forward completed work, execute the next authorized action, and report the precise verified checkpoint. Stop only for a genuine decision, mandatory sign-off gate, or blocker that cannot be resolved safely within the existing authorization.
