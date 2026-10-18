# AMS Navigation-First Phased Execution Prompt

**Repository:** Kapitech-Agency/kapitech-ams  
**Required delivery branch:** main  
**Purpose:** Execute the approved AMS navigation structure first, then proceed through content hierarchy, shared components, responsive behavior, and regression testing in tightly bounded stages. This prompt is intentionally strict because previous implementation attempts drifted into unrelated work and were interrupted by timeouts.

## Copy-paste execution instruction

Act as the senior engineer implementing the currently approved Kapitech AMS plan. Read and obey AGENTS.md, README.md, docs/README.md, docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md, docs/architecture/ams-navigation-information-architecture.md, docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md, and the other applicable UX/UI guidelines before editing.

### Non-negotiable execution rules

1. **Follow the stage order exactly. Do not skip, combine, or reorder stages.**
2. **The current active task is Stage 1: finish and verify navigation. Do not start content redesign, global CSS cleanup, responsive redesign, unrelated module improvements, or any other later stage until Stage 1 has passed its acceptance criteria and the user explicitly instructs you to continue.**
3. Work on **one bounded stage, and within module-based stages one module at a time**. Do not attempt a full-repository rewrite in one tool call or one long, uncheckpointed run.
4. Send the user a durable progress report when the baseline is established, after every meaningful implementation slice, and at the completion of each stage. Then **stop and wait for the user's instruction to continue to the next stage**. Do not silently proceed into the next stage after a report.
5. Before every write, confirm the current main HEAD and preserve concurrent changes. The user has requested direct-to-main delivery: commit directly to main, without creating a branch or PR, unless the user explicitly changes that instruction. Never force-push or overwrite a concurrent update.
6. Do not report a change or test as complete without evidence from the current source, exact command result, or relevant GitHub Actions run.
7. If an unexpected issue belongs to a later stage, record it under “Deferred to Stage [N]”; do not fix it prematurely. If a true blocker or protected-layer decision prevents progress, stop and report the exact blocker.
8. If an operation risks timing out, shrink the current batch. Make a safe checkpoint, report the last verified commit and exact remaining task, then stop. On resumption, re-fetch main and the relevant files before continuing. Never rely on assumptions from before a timeout.

## Stage 0 — Baseline and scope lock

Before changing code:

- Confirm repository, current main HEAD, recent related commits, current CI state, and the existing navigation implementation.
- Read the current navigation IA, master structure, progress register, and relevant route/navigation tests.
- Inventory what is already correct, incomplete, broken, or unverified. Continue from the actual current state; do not redo completed work merely to follow a checklist.
- Define the files and behavior in scope for the active stage.
- Report: baseline HEAD, what is already complete, confirmed navigation gaps, allowed files, protected areas, first bounded implementation slice, and tests to run.

Do not change source files during this baseline report unless a tiny, necessary documentation correction is explicitly within the task. Then proceed only with Stage 1.

## Stage 1 — Complete and verify navigation only

**This is the active stage. Do not work on later stages yet.**

Use docs/architecture/ams-navigation-information-architecture.md and the master structure guide as the target. Verify actual code before treating a documented destination as implemented.

### Required navigation structure

The nine primary modules are:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

CRM, Proposal/Quotation, and generic Approval must not be primary modules. Removing these menu entries does not authorize deleting their historical records, routes, APIs, permissions, maker-checker controls, or compatibility behavior.

Finance must retain these five primary areas:

- Overview & Control
- Transactions & Cash
- Receivables & Payables
- Project Finance
- Accounting & Reports

Follow the navigation IA for the approved workspace and worksheet ownership in every other module. Do not invent a new navigation hierarchy or make each filter/status into a sidebar item.

### Navigation implementation checklist

- Map every visible primary destination, workspace tab, and relevant worksheet tab to its canonical current route or supported query state.
- Ensure each destination opens the correct owning module and view; no unrelated fallback pages, dead links, duplicate destinations, blank content, or incorrect tab labels.
- The selected tab must agree with the URL and remain correct after direct URL entry, refresh, and browser back/forward navigation.
- Verify the overview/default view remains reachable where it is required, even where its URL matches the module root.
- Check that navigation is reachable for permitted roles and does not expose unauthorized destinations. Do not change server authorization or invent new permissions.
- Preserve query parameters, record identifiers, canonical write paths, existing route guards, and legacy compatibility behavior.
- Ensure menu depth follows primary module → workspace → worksheet/filter/saved view → selected record detail. Do not turn every worksheet, filter, or record detail into a persistent sidebar level.
- Make only navigation-related frontend changes and tightly targeted navigation regression tests. Do not use this stage to redesign page content, rework global CSS, clean unrelated legacy code, change API/data behavior, or add dependencies.

### Stage 1 acceptance gate

Stage 1 is complete only when:

- All nine primary modules and their approved workspace/subnavigation structure have been compared with the navigation IA.
- Every visible navigation destination has been checked against the actual route/view; all exceptions are documented.
- URL state, active tab, direct loading, refresh, and browser history behavior are verified to the extent the environment allows.
- Relevant navigation tests and applicable build/type/lint checks have run, with exact outcomes recorded. If any check cannot run, say so; do not imply it passed.
- The final diff contains only changes appropriate to Stage 1, and the commit is on main.

After the acceptance gate is met, deliver the Stage 1 report and **STOP**. Wait until the user explicitly says to continue before starting Stage 2.

## Stage 2 — Main content hierarchy, one module per checkpoint

Start only after the user authorizes continuation from Stage 1. Follow the content architecture guide, role-based content blueprint, worksheet matrix, design system, and actual source.

For each module, identify the user's primary task, main working area, information order, needed context, filters, supported actions, and truthful loading/empty/error/unavailable states. Do not make every page look like the Dashboard and do not add fake KPI cards or data.

Work through the following sequence, rechecking current main so existing completed work is not repeated:

1. Dashboard — Overview, Performance, Analytics.
2. Inbox.
3. Projects and Tasks.
4. Clients.
5. Finance — all five primary areas and the relevant worksheets.
6. Team & Resources.
7. Documents.
8. Website CMS — content types and Careers → Applicants.
9. Settings.

**Implement one module or one clearly bounded portion of a module at a time.** Run the relevant checks, commit a safe verified slice to main, report its result and remaining items, and stop for the user's instruction before starting the next module. Never claim a module is complete if any active view within its declared scope was skipped.

## Stage 3 — Shared component consistency

Start only after Stage 2 is complete and authorized. Address confirmed shared root causes such as duplicate headers, inconsistent contextual tabs, page gutter ownership, repeated toolbars, shared table behavior, drawer/modal patterns, and tab-switch layout shifts.

Inspect every affected consumer before changing a shared primitive. Avoid broad refactors. Test the affected module and neighboring consumers. Report and stop at the stage boundary.

## Stage 4 — Responsive layout, scrolling, and interaction

Start only after Stage 3 is complete and authorized. Fix source-confirmed issues in page/shell scroll ownership, clipping, horizontal overflow, responsive control placement, table/board usability, keyboard navigation, focus behavior, reduced motion, drawers, and modals.

Where practical, verify at 1440, 1024, 768, 390, and 320 pixels. Separate source-level checks from real browser verification; never claim screenshots, viewport tests, or authenticated production checks were performed if they were not.

Report and stop at the stage boundary.

## Stage 5 — Cross-module regression and validation

Start only after Stage 4 is complete and authorized. Run the applicable lint/typecheck, production build, route/navigation tests, frontend regression tests, and relevant cross-module journeys. Recheck permissions and protected business behavior without changing those protected layers.

If a new failure is introduced, stop unrelated work and repair or revert the responsible slice before proceeding. Record exact commands, commit SHA, CI run, pass/fail result, and any untested scenario.

Report and stop at the stage boundary.

## Stage 6 — Final diff and delivery review

Start only after Stage 5 is complete and authorized. Review the full task diff against the original baseline. Confirm no unexpected backend/API/database/authentication/RBAC, Finance calculation, integration, dependency, or unrelated file changes occurred. Verify current main HEAD, relevant CI, and deployment evidence separately.

Do not claim production deployment or authenticated visual QA unless verified. Deliver a final report of completed scope, deferred work, commits, exact test evidence, unverified items, and any remaining risk.

## Protected scope for navigation and frontend stages

Unless the user gives a separate explicit authorization, do not modify:

- Backend/server implementation, API contracts, database/schema/migrations, persistence or source-of-truth rules.
- Authentication, sessions, CSRF, MFA/TOTP, authorization policy/RBAC, or server security controls.
- Finance calculations, journal posting, payment/reconciliation rules, period locks, maker-checker behavior, or canonical business records.
- Notifications, integrations, private document storage, backups, or production configuration.
- Dependency manifests or lockfiles.

If a navigation symptom appears to require one of these changes, preserve the protected behavior and report the blocker rather than crossing the boundary.

## Required progress report format

Use this report after the baseline, after meaningful slices, and at every stage boundary:

### Stage [number] — [name]

- **Status:** Complete / In progress / Blocked
- **Verified result:** What is actually finished.
- **Changed files and behavior:** Paths and concise description, or “No files changed”.
- **Commit:** Exact main commit SHA and link, or “Not committed”.
- **Validation:** Exact checks and observed results. Mark pending, failed, or not run honestly.
- **Remaining in this stage:** Concrete checklist items.
- **Deferred to later stage:** Findings deliberately not addressed now.
- **Risk / unverified:** Browser/runtime/role states not actually verified.
- **Next action:** One exact bounded task.

End every stage-completion report with an explicit statement that implementation is paused at the stage gate and will not proceed until the user directs the next stage. Do not append unrelated enhancements or start another stage after that report.
