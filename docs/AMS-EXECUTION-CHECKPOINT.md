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
| Latest source/test commit | `aba169fe8dcc493c1a404cc534ebd630f8e74fbf` |
| Commit | [test(clients): include bom in csv export assertion](https://github.com/Kapitech-Agency/kapitech-ams/commit/aba169fe8dcc493c1a404cc534ebd630f8e74fbf) |
| Application source changed | `src/pages/admin/AdminClients.tsx` |
| Regression tests changed | `tests/ams-nine-module-workspace-regression.test.ts` |
| AMS CI | **Passed** on this SHA: [run 39248843929](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39248843929) |
| AMS Quality Gate | **Passed** on this SHA: [run 39248843922](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39248843922) |
| Validation detail | Typecheck, regression tests, security regression tests, production build, and production HTTP smoke test passed. |

### Recent verified frontend slices

- [Settings backup-history correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba): desktop rows use per-snapshot verification; both CI workflows passed.
- [Dashboard monetary truthfulness correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68): non-finite amounts show unavailable, not zero; both CI workflows passed.
- [Inbox register semantics correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/87b53aa61cd7c973869da73ef4273c8cb5f4cc7e): inquiry labels/empty copy corrected; both CI workflows passed.
- [Inbox applicant-presentation cleanup](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf): unreachable Careers-only UI removed while preserving the source filter and CMS route; both CI workflows passed.
- [Tasks local-date correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/af65907022d9973b3859145e0971bf22a6caf343): due-date defaults use local calendar fields; both CI workflows passed.
- [Planning tab query preservation](https://github.com/Kapitech-Agency/kapitech-ams/commit/444b9891b33e7891567341711dfa9a8d29866bf4): selecting Brief/Milestones/Timeline preserves `planningProject`; both CI workflows passed.
- [Clients CSV truthfulness and encoding](https://github.com/Kapitech-Agency/kapitech-ams/commit/d7d53b3b0cf7f58319935341424dfc7d75b1bd16), with final regression boundary correction at `aba169fe8dcc493c1a404cc534ebd630f8e74fbf`: missing/non-finite billed values export blank, valid zero stays zero, the header specifies IDR, row separators use real newlines and the Blob contains an actual UTF-8 BOM. The new regression checks these semantics. Both workflows passed on the final test SHA `aba169fe8dcc493c1a404cc534ebd630f8e74fbf`.

An initial test attempt on `d7d53b3b0cf7f58319935341424dfc7d75b1bd16` incorrectly limited its search span to stop before the Blob expression, so the BOM assertion did not inspect the expression. The follow-up test commit `aba169fe8dcc493c1a404cc534ebd630f8e74fbf` expands the test boundary through URL creation. The app source was not weakened and the BOM assertion remains active. The Quality Gate and CI both passed on the corrected test SHA.

This checkpoint is a dated evidence pointer, not a live branch status feed. Re-fetch `main` and the exact workflow results before acting; a docs-only commit does not change the application/test SHA that was tested.

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
2. **Preserve verified slices:** Settings backup history, Dashboard money fallback, Inbox scope/candidate cleanup, Tasks local date, Planning tab query context and Clients CSV correctness/encoding all have successful exact-SHA evidence.
3. **Continue Stage 4 in canonical module order:** finish Clients Directory source/test gaps, then Clients Onboarding and Agreements. Keep checklist/document/kickoff-readiness, Contract History and other absent canonical record views unavailable. Do not invent owner/next-action fields or infer history from timestamps.
4. **Validate one bounded slice:** source diff, existing/new regression coverage and both CI workflows for the source SHA. Update progress and gap evidence after completion.
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

When the user says “lanjutkan” or similar, do not ask them to restate the task and do not give only another prompt or plan. Follow [the resume protocol](AMS-RESUME-AFTER-INTERRUPTION.md), inspect the current source and CI, carry forward completed work, execute the next authorized action, and report the precise verified checkpoint. Stop only for a genuine decision, mandatory sign-off gate, or blocker that cannot be resolved safely within the existing authorization.
