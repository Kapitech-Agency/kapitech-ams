# AMS Resume After Timeout or Interruption Protocol

**Repository:** `Kapitech-Agency/kapitech-ams`  
**Required branch:** `main`  
**Canonical sequence:** [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md)  
**Requirement evidence:** [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)  
**Current recovery pointer:** [AMS Execution Checkpoint](AMS-EXECUTION-CHECKPOINT.md)  
**Status:** Mandatory for all AI agents and delegated repository work.

## 1. Purpose

This procedure prevents drift, repeated work, and wrong-task execution after a timeout, tool failure, context reset, new chat turn, or resumed session.

A short follow-up such as **“lanjutkan”, “lanjutkan dari titik terakhir”, “continue”, or “resume” means resume the existing authorized task from verified repository state**. It does not mean invent a new task, repeat completed work, redesign the solution, or ask the user to paste the master prompt again.

A checkpoint is a recovery aid, not permission to assume that code, CI, runtime, or deployment has remained unchanged. The current source and tests outrank stale memory or an old checkpoint SHA.

## 2. Non-negotiable rules

1. **Restore state before editing.** Re-establish the repository, branch, commit, changed files, task stage, latest checks, and last unfinished acceptance item first.
2. **Always refresh `main`.** Fetch live `main` HEAD and recent history. A SHA copied from chat or an old checkpoint is not the current HEAD until re-verified.
3. **Inspect before retrying.** A timed-out write may have succeeded remotely. Inspect branch, commit, target file, and workflow before recreating the change.
4. **Preserve completed work.** Validate completed slices against current source and checks; do not repeat or revert them merely because the session changed.
5. **Resume the same scope.** Use the latest explicit user instruction and repository documents. Do not ask the user to repeat requirements already present.
6. **Follow the canonical roadmap.** Continue at the earliest unmet stage/exit gate in `AMS-END-TO-END-DELIVERY-ROADMAP.md`. Do not invent a competing schedule.
7. **Treat failed CI as a blocker.** Diagnose the actual failing job/test/assertion and source. Fix the root cause. Never suppress, delete, skip, or weaken a security/regression test merely to turn CI green.
8. **Tie claims to evidence.** A commit does not prove CI, E2E, browser behavior, production deployment, or readiness. Report only checks actually verified.
9. **Use bounded slices.** Work one independently verifiable module, worksheet, bug, or workflow at a time. Save a checkpoint before long/high-risk operations and after each meaningful slice.
10. **Preserve delivery rules.** Commit directly to `main` when authorized and supported. Never force-push, blindly reset, overwrite concurrent commits, or bypass repository protections.
11. **Continue without needless prompting.** Routine work inside the approved scope proceeds automatically. Stop only when a genuine business/security/accounting decision, sign-off gate, destructive action, external dependency, or scope change requires user input.
12. **Do not claim background work.** If execution stops, leave a durable checkpoint and precise next step; do not promise to continue asynchronously.

## 3. Mandatory resume procedure

### Step A — Rehydrate the repository

- Confirm repository `Kapitech-Agency/kapitech-ams` and intended branch `main`.
- Fetch live branch metadata; record exact current HEAD and commit message.
- Inspect recent commits since the last checkpoint, separating source, tests, docs, and unrelated work.
- Check current changed files/working tree when a local workspace is available. If not, use the repository interface and state that local status could not be inspected.
- If the previous operation may have committed, verify it before trying the write again.
- Never assume that the current source equals remembered code, that deployment occurred, or that a workflow belongs to the newest SHA.

### Step B — Restore scope and last verified point

Read this protocol and `docs/AMS-EXECUTION-CHECKPOINT.md`, then verify against `AGENTS.md`, `docs/README.md`, the roadmap, the stage checklist, gap register, implementation traceability, relevant module specifications/maps, current code/tests, and applicable domain/security/runbook documents.

Confirm:
- the last task that is actually verified;
- the first unfinished acceptance criterion;
- existing work to preserve;
- whether a user sign-off/release gate applies;
- whether the checkpoint or gap register is older than recent code changes.

Progress notes are summaries and may lag repository history. Reconcile conflicting status against current source and tests; do not accept a stale checklist as proof.

### Step C — Check the newest CI before unrelated feature work

- Find the latest applicable CI/workflow runs for current `main`.
- Distinguish success, failure, cancelled, in-progress, queued, and unavailable evidence. Running or absent results are not passes.
- If a relevant check failed, inspect the failing job and logs. Identify the first actionable failure and separate it from cascading failures.
- If a failure was introduced by recent work, fix it first; run the targeted test and applicable wider checks; commit the smallest valid fix; verify CI for the new SHA.
- If a failure predates the resumed slice, document the evidence and safest scoped response instead of hiding it.
- Never weaken security tests to make a broken change pass.

### Step D — Choose one next task

- Select the earliest roadmap stage whose exit gate is unmet.
- Within that stage, choose one priority unfinished item from the current gap register with prerequisites satisfied.
- Compare the intended change with latest source, recent commit history/diffs, tests, and requirement status. If already implemented, verify it and move to the next unfinished item.
- Do not skip stage gates. Stage 5 visual/content review requires explicit user sign-off before broad Stage 6 implementation.
- Do not invent data, routes, workflows, API contracts, or production behavior to make a page look complete.

### Step E — Implement and verify a bounded slice

1. Identify intended user-visible result, affected files/consumers, known behavior to preserve, and relevant acceptance criteria.
2. Make the smallest complete change for this slice.
3. Add/update regression tests for the behavior and critical negative paths.
4. Run the targeted test and applicable typecheck/lint/build/security checks.
5. Inspect the diff for unrelated edits, accidental deletions, duplicate implementations, fake success states, and scope violations.
6. Update the gap register and evidence/progress notes for requirements actually verified.
7. Commit a coherent slice directly to `main` when authorized; record exact SHA.
8. Inspect CI for that exact SHA before marking the slice verified.

If a write or test tool times out, return to Step A instead of retrying based on assumption.

### Step F — Maintain the durable checkpoint

Update `docs/AMS-EXECUTION-CHECKPOINT.md` after every substantial slice, before a long/high-risk operation, and whenever a blocker or task boundary changes. Keep it concise and operational, not a second roadmap.

Record:
- active roadmap stage and one bounded requirement/module slice;
- last verified commit SHA and factual result;
- current `main` HEAD as a dated snapshot;
- changed paths/commit(s) and whether each write/commit was confirmed;
- checks actually completed, result and workflow links/IDs;
- pending/failed checks and blockers;
- last completed acceptance item and exactly one next action;
- any required user decision/sign-off;
- update date/time and links to authoritative evidence.

Use “unknown/not verified” until evidence resolves the state. A started task, agent claim, or timed-out tool does not establish completion.

### Step G — Report, then continue within authorization

After a meaningful slice or blocker, report the stage/slice, verified result, changed files, current main SHA, actual checks with results and links, remaining gap, and next action. Continue routine work already authorized without waiting for a new prompt, while honoring Stage 5 sign-off and all security/accounting/release gates.

## 4. Recovery decision table

| State found after resume | Required response |
|---|---|
| Latest change is committed and relevant CI passed | Verify the next acceptance item and continue from the first unmet checklist item. |
| Latest change committed but CI is running | Inspect source/tests, but do not claim pass; verify the actual run. |
| Latest change committed and CI failed | Diagnose and repair the failure before unrelated feature work. |
| Write timed out; commit/file status is unknown | Query current `main` and target path before retrying the write. |
| Main advanced during interruption | Rebase decisions on new `main`; inspect overlap and avoid overwriting concurrent changes. |
| Checkpoint conflicts with source/tests/CI | Trust current verified evidence for implementation state and reconcile the checkpoint/gap records. |
| Permission, external contract, runtime evidence, or user decision is missing | Record the exact blocker; do not fabricate verification or bypass controls. |

## 5. Scope and delivery protections

- Keep the nine top-level modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, and Settings.
- Do not restart approved navigation implementation.
- During Stage 4 main-content restructuring, preserve routes, permissions, backend/API/database/schema/authentication, Finance formulas/postings, business logic, source ownership, and established workflows unless the authorized stage permits a narrowly reviewed change.
- Preserve the five Finance areas and existing accounting/quotation behavior.
- Follow `AMS-DESIGN-SYSTEM.md` and the relevant interaction/domain standards; target WCAG 2.2 Level AA.
- Check the expected current HEAD before a direct-to-`main` update. Never force an update.
- Do not label the project complete or production-ready before its formal gates and evidence are satisfied.

## 6. Relationship to other docs

This is the canonical recovery procedure, not a new stage plan. The roadmap controls sequence; the gap register controls requirement status/evidence; domain documents control their domains; `docs/AMS-EXECUTION-CHECKPOINT.md` stores the current resume pointer. Root `AGENTS.md`, Copilot instructions, the documentation index, and the stage checklist point agents here.
