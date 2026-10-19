# AMS Execution Checkpoint

**Purpose:** Compact resume pointer for the current delivery effort. This is not a replacement for the roadmap, gap register, specifications, or current source.  
**Recovery procedure:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Canonical sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement inventory:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`

> All SHAs and CI statuses below are dated snapshots, not live state. On every resume, fetch the current `main` HEAD and current workflow results before editing. Update this file after every meaningful slice.

## 1. Last verified code snapshot

Latest application source snapshot verified on **19 October 2026**:

| Item | Evidence |
|---|---|
| Latest application source commit | `febd4f42a18718230dd2ebccec5b975a0083ef68` |
| Commit | [fix(dashboard): preserve unavailable money values](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68) |
| Changed source/test | `src/components/admin/GlobalExecutiveDashboard.tsx`; `tests/dashboard-metric-truthfulness.test.ts` |
| AMS CI | **Passed** on this SHA: [run 39240238235](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39240238235) |
| AMS Quality Gate | **Passed** on this SHA: [run 39240238176](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39240238176) |
| Validation detail | Typecheck, regression tests and production build passed; CI's verification job and production build also passed. |

### Recent verified source slices

- [Settings backup-history correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba): the desktop backup register now uses the per-snapshot `backupVerificationFor(backup)` helper. AMS CI [39239473226](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39239473226) and Quality Gate [39239473547](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39239473547) passed on that exact source SHA.
- [Dashboard money truthfulness correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68): non-finite amounts now display an em dash instead of formatted zero; genuine numeric zero remains a zero amount. A regression assertion covers the fallback.

The preceding CI failures on `2afe419030b861064258531167c98398e89b5661` are resolved on the verified Settings source commit above. This checkpoint is a dated evidence pointer, not a live branch status feed. Re-fetch current `main` and the exact workflow results before acting; a following documentation-only checkpoint commit does not change the tested application source snapshot.

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

Re-verify live source and CI on every resume; this list records the tested source state and the next authorized task.

1. **Rehydrate live state:** fetch current `main`, recent commits, relevant source, and latest AMS CI/Quality Gate results.
2. **Preserve verified fixes:** the Settings backup-history correction on `bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba` and Dashboard non-finite money correction on `febd4f42a18718230dd2ebccec5b975a0083ef68` both passed both workflows. Do not reapply these slices without evidence of a regression.
3. **Continue Stage 4 in canonical module order:** Dashboard's source-backed money formatting gap is addressed; proceed to the earliest remaining Inbox/Projects view with a concrete source-supported defect. Follow the content specification, worksheet matrix and gap register. Keep unsupported workspaces truthful and do not create fake functionality for missing canonical models.
4. **Validate one bounded slice:** preserve regression strength, inspect exact commit diff and CI for the new source SHA, then update the progress record and affected gap rows with the evidence.
5. **Keep the release gate:** authenticated browser/viewport review and explicit user sign-off remain outstanding at Stage 5. No authenticated production/browser session was established, so screenshots, computed-layout, keyboard/touch and visual acceptance are not claimed. Do not begin broad Stage 6 workflow/backend implementation before user sign-off.

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
