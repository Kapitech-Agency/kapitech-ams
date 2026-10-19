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
| Latest source/test commit | `1ae8209b39ff65cc7cbb6c302ddc9815efc5720c` |
| Commit | [fix(clients): keep onboarding readiness copy evidence-based](https://github.com/Kapitech-Agency/kapitech-ams/commit/1ae8209b39ff65cc7cbb6c302ddc9815efc5720c) |
| Changed application source | `src/pages/admin/AdminClients.tsx` |
| Regression tests | `tests/ams-nine-module-workspace-regression.test.ts` |
| AMS CI | **Passed** on this SHA: [run 39251017014](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39251017014) |
| AMS Quality Gate | **Passed** on this SHA: [run 39251017167](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39251017167) |
| Validation detail | Typecheck, regression tests, security regression tests, production build and production HTTP smoke test passed. |

### Recent verified frontend slices

- [Settings backup-history correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba): desktop rows use per-snapshot verification; both workflows passed.
- [Dashboard monetary truthfulness correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68): non-finite amounts show unavailable, not zero; both workflows passed.
- [Inbox applicant-presentation cleanup](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf): removed unreachable Careers-only UI while preserving the source filter and CMS route; both workflows passed.
- [Tasks local-date correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/af65907022d9973b3859145e0971bf22a6caf343): due-date defaults use local calendar fields; both workflows passed.
- [Planning tab query preservation](https://github.com/Kapitech-Agency/kapitech-ams/commit/444b9891b33e7891567341711dfa9a8d29866bf4): active Planning tabs preserve `planningProject`; both workflows passed.
- [Clients CSV and Onboarding source/test corrections](https://github.com/Kapitech-Agency/kapitech-ams/commit/1ae8209b39ff65cc7cbb6c302ddc9815efc5720c): one visible export handler now serves both scopes. Onboarding export includes contact/profile columns without billing or spend-cap fields and uses its own filename/toast. Directory export preserves missing billed values as blank, valid zero, the IDR label, and its existing SLA-budget/current-daily-spend columns. CSV uses a UTF-8 BOM and actual newline separators. The Onboarding header describes recorded profile review rather than claiming readiness can be confirmed without checklist/document/kickoff records. Both workflows passed on this exact SHA.

An intermediate attempt [`e8d44f3b2730d300a53e0fe33319ad1a75d4a6af`](https://github.com/Kapitech-Agency/kapitech-ams/commit/e8d44f3b2730d300a53e0fe33319ad1a75d4a6af) failed the existing Client detail regression because consolidation omitted the Directory export's SLA budget and current daily spend columns. Those fields were restored in [`dcca9f2c9f0d242968423e37d63b2bb4a86d3ad5`](https://github.com/Kapitech-Agency/kapitech-ams/commit/dcca9f2c9f0d242968423e37d63b2bb4a86d3ad5); both workflows passed on that correction. The current tested SHA `1ae8209b39ff65cc7cbb6c302ddc9815efc5720c` includes the restoration and Onboarding copy change. No regression was deleted or skipped.

This checkpoint is a dated evidence pointer, not a live branch status feed. Re-fetch `main` and workflow results before acting; docs-only commits do not change the source/test snapshot that was tested.

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

1. **Rehydrate:** fetch current `main`, recent history, relevant source and current exact-SHA CI/Quality Gate results.
2. **Preserve verified slices:** Settings backup history, Dashboard money fallback, Inbox applicant ownership, Tasks local dates, Planning query context, and Clients scope-aware exports/evidence-based Onboarding copy have successful exact-SHA evidence.
3. **Continue Stage 4 in canonical module order:** Clients Directory and Onboarding source/test changes are verified. Continue to Clients → Agreements, beginning with local-calendar consistency in the Retainer renewal-date defaults. Keep Contract History target-only until canonical version/event history exists; do not infer owner/next-action fields from dates.
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

When the user says “lanjutkan” or similar, do not ask them to restate the task and do not give only another prompt or plan. Follow [the resume protocol](AMS-RESUME-AFTER-INTERRUPTION.md), inspect the current source and CI, carry forward completed work, execute the next authorized action, and report the precise verified checkpoint. Stop only for a genuine decision, mandatory sign-off gate, or blocker that cannot be resolved safely within the existing authorization.
