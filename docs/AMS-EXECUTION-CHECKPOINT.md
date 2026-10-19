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
| Latest application source commit | `926291d005bbdef2c1e06779d28145d230606ddf` |
| Commit | [fix(inbox): remove residual applicant card branch](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf) |
| Changed source/test | `src/pages/admin/AdminInbox.tsx`; `tests/ams-nine-module-workspace-regression.test.ts` |
| AMS CI | **Passed** on this SHA: [run 39246295872](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39246295872) |
| AMS Quality Gate | **Passed** on this SHA: [run 39246295800](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39246295800) |
| Validation detail | Typecheck, regression tests and production build passed in Quality Gate. AMS CI security regression tests, production build and production HTTP smoke test passed. |

### Recent verified source slices

- [Settings backup-history correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/bc5c19ca7187c7bdfd7918bb97dcd3f7bbd34fba): desktop backup rows use per-snapshot `backupVerificationFor(backup)`; both CI workflows passed on that source SHA.
- [Dashboard money truthfulness correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/febd4f42a18718230dd2ebccec5b975a0083ef68): non-finite monetary values display unavailable rather than numeric zero; both CI workflows passed.
- [Inbox register semantics correction](https://github.com/Kapitech-Agency/kapitech-ams/commit/87b53aa61cd7c973869da73ef4273c8cb5f4cc7e): generic table labels now reflect services and budget, and the empty state refers only to inquiries; both CI workflows passed.
- [Inbox applicant-presentation cleanup](https://github.com/Kapitech-Agency/kapitech-ams/commit/926291d005bbdef2c1e06779d28145d230606ddf): removed the final unreachable applicant-only branches, fields and status choices from Inbox presentation. The one ingress filter `item.type !== 'career'`, the legacy redirect and CMS Careers → Applicants route remain. A regression assertion allows optional whitespace when checking for candidate-specific conditional branches. AMS CI and Quality Gate both passed on this exact SHA.

The older CI failures on `2afe419030b861064258531167c98398e89b5661` are resolved by the verified Settings correction and are not current failures. This checkpoint is a dated evidence pointer, not a live branch status feed. Re-fetch `main` and workflow results before acting; a documentation-only commit does not change the application source snapshot that was tested.

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

Re-verify live source and CI on every resume; this list records the tested source state and next authorized task.

1. **Rehydrate live state:** fetch current `main`, recent commits, relevant source and latest AMS CI/Quality Gate results.
2. **Preserve verified fixes:** Settings backup-history, Dashboard money availability, Inbox content copy, and Inbox applicant-presentation cleanup all have successful exact-SHA CI evidence. Do not repeat them without a demonstrated regression.
3. **Continue Stage 4 in canonical order:** proceed to Projects, beginning with Overview/Registry and then Tasks & Execution, Planning & Delivery, and Resources. Inspect current code/tests before choosing a defect. Do not infer project progress, capacity, dependencies or data fields that the current model does not provide; unavailable worksheets remain unavailable.
4. **Validate one bounded slice:** keep regression coverage, inspect the exact source diff, verify CI on the code SHA, then update this checkpoint and the affected gap rows.
5. **Keep the release gate:** authenticated browser/viewport review and explicit user sign-off remain outstanding at Stage 5. No authenticated production/browser session has been established, so screenshots, computed-layout, keyboard/touch and visual acceptance are not claimed. Do not begin broad Stage 6 workflow/backend implementation before user sign-off.

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
