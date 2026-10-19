# AMS Execution Checkpoint

**Purpose:** Compact resume pointer for the current delivery effort. This is not a replacement for the roadmap, gap register, specifications, or current source.  
**Recovery procedure:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Canonical sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement inventory:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`

> All SHAs and CI statuses below are dated snapshots, not live state. On every resume, fetch the current `main` HEAD and current workflow results before editing. Update this file after every meaningful slice.

## 1. Last verified code snapshot

Snapshot refreshed on **19 October 2026** after resolving the Settings backup-history regression on the current source.

| Item | Evidence at snapshot |
|---|---|
| Code HEAD | `bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba` |
| Commit | [fix(settings): distinguish historical backup verification](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba) |
| Changed source | `src/pages/admin/AdminSettings.tsx` only |
| AMS CI | **Passed** on this SHA: [run 39239473226](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39239473226) |
| AMS Quality Gate | **Passed** on this SHA: [run 39239473547](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39239473547) |
| Corrected regression | `tests/admin-settings-module-regression.test.ts`: historical snapshots no longer inherit the newest backup's freshness/integrity/restore status |

### Failure diagnosis and resolution

The previous code HEAD `2afe419030b861064258531167c98398e89b5661` failed AMS CI [39237266847](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39237266847) and AMS Quality Gate [39237266842](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39237266842). Both stopped at the same backup-health regression assertion. The mobile snapshot cards already used `backupVerificationFor(backup)`, but the desktop table still rendered a generic `Verified / Needs check` badge based on the latest backup. The fix now uses the same per-snapshot helper in the desktop table. Both workflows passed on `bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba`.

The correction is presentation-only. It does not change the backup endpoint, security/readiness logic, permissions or backup infrastructure. Per-snapshot verification remains explicitly unavailable when the server does not provide that evidence.

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

Re-verify current source and CI on every resume; this list records completed evidence and the next authorized action.

1. **Rehydrate live state:** fetch current `main`, recent commits, relevant source and current CI/Quality Gate results before editing.
2. **Preserve the verified Settings fix:** the historical backup status regression is fixed on `bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba`; both CI workflows passed. Do not reapply the change unless new source evidence shows a regression.
3. **Reconcile frontend documentation:** keep the gap register, progress notes and this checkpoint aligned with current `main` and exact workflow evidence. Old SHAs/run results remain historical.
4. **Continue the earliest unfinished Stage 4 content slice:** use `docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md`, `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` and the content-first implementation map. Preserve approved navigation and verified work. Do not choose an easy gap out of sequence.
5. **Validate and checkpoint:** make one coherent frontend-only change, retain regression strength, verify the exact source SHA and relevant CI, and update source/test/runtime status separately.

The authenticated browser/viewport review and explicit user sign-off remain unverified and mandatory at Stage 5. The current tools have not established an authenticated production/browser session; do not claim screenshots, computed-layout, keyboard/touch or visual acceptance were completed. Do not start broad Stage 6 workflow/backend work before the user's explicit sign-off.

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
