# AMS Execution Checkpoint

**Purpose:** Compact resume pointer for the current delivery effort. This is not a replacement for the roadmap, gap register, specifications, or current source.  
**Recovery procedure:** [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)  
**Canonical sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement inventory:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Delivery branch:** `main`

> All SHAs and CI statuses below are dated snapshots, not live state. On every resume, fetch the current `main` HEAD and current workflow results before editing. Update this file after every meaningful slice.

## 1. Last verified code snapshot

Snapshot captured on **19 October 2026**, before adding the resume-protocol documentation:

| Item | Evidence at snapshot |
|---|---|
| Code HEAD | `b8a4d817f1766efafe0910fe6a642c50411b0985` |
| Commit | [`fix(settings): require full backup recovery evidence`](https://github.com/Kapitech-Agency/kapitech-ams/commit/b8a4d817f1766efafe0910fe6a642c50411b0985) |
| Commit timestamp | 2026-10-19 09:46:11 UTC |
| AMS CI | **Failed** on this SHA: [run 39232557256](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39232557256) |
| AMS Quality Gate | **Failed** on this SHA: [run 39232557234](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39232557234) |
| Failure location observed | `verify` job → `Security regression tests` step in AMS CI. Exact failing assertion/root cause was not yet established. |
| Previous known-green code SHA | `4705fa480367294b93de68168d42816f83883ef7`; [AMS CI run 39232113519](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39232113519) and [Quality Gate run 39232113339](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39232113339) both reported success for that earlier SHA only. |

The recovery-protocol document was committed as [`46a442c`](https://github.com/Kapitech-Agency/kapitech-ams/commit/46a442c5404bfcd63df803a4a5b5d1b43f175b5e). Its initial CI/Quality Gate results were later superseded by subsequent commits and must not be treated as current.

The follow-up wiring was committed in [AGENTS.md commit c009082](https://github.com/Kapitech-Agency/kapitech-ams/commit/c00908291478ab33669ef775e12d064541e15e59), [Copilot instructions commit 39ff238](https://github.com/Kapitech-Agency/kapitech-ams/commit/39ff23884bf51e596cb59c26d677b5fafc942fbc), [docs index commit 9cdb692](https://github.com/Kapitech-Agency/kapitech-ams/commit/9cdb69248fcf9134c7196d0d2d5893584f159d48), and [stage checklist commit bf68a1c](https://github.com/Kapitech-Agency/kapitech-ams/commit/bf68a1cb06d198a734a06258aebe2c6cfcaf5375). At the latest pre-checkpoint-refresh snapshot, `main` HEAD was [`bf68a1c`](https://github.com/Kapitech-Agency/kapitech-ams/commit/bf68a1cb06d198a734a06258aebe2c6cfcaf5375): [AMS CI run 39237059910](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39237059910) was still in progress at `Apply PostgreSQL migrations`, while [AMS Quality Gate run 39237059903](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39237059903) failed at `Regression tests`. These outcomes are not passes. Fetch the newest runs after any further commit and diagnose the actual failure before unrelated product work.

Do not weaken security tests to silence a failure. Diagnose the actual log, and never assume a previous failure still has the same root cause on a later SHA.

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

Re-verify each item against live `main`; this list is not proof that the work has been completed.

1. **Rehydrate live state:** fetch current `main`, recent commits, current source and latest CI/Quality Gate runs. Compare with the snapshots above.
2. **Resolve the known CI blocker if it remains active:** inspect the failed AMS CI `verify` job's `Security regression tests` output for the relevant current SHA. Identify the exact failing assertion and root cause. Preserve the security requirement and test strength. Run the targeted test and applicable wider checks, commit the smallest valid fix, then verify workflows for the new SHA.
3. **Reconcile Stage 4 evidence:** review relevant recent CMS/Finance/Settings commits and the affected current source. Update the gap register and evidence/progress notes when the current source proves a status change.
4. **Choose one next unfinished Stage 4 slice:** use the current gap register, content specification and implementation map; do not choose a module based only on this snapshot. Verify the prerequisites, preserve completed work, and scope one slice.
5. **Test, commit and checkpoint:** run targeted regression checks and applicable typecheck/build/security checks, commit a coherent slice to `main` where supported, record the exact SHA, inspect CI for that SHA, and update this file.

If current `main` already contains a fix for step 2, verify it and move to step 3. If the failure cannot safely be resolved within the current scope, document the precise blocker rather than claiming CI passed.

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
