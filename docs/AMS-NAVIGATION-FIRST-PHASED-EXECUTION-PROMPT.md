# AMS Phased UX/UI Execution Prompt: Navigation + Main Content

**Repository:** Kapitech-Agency/kapitech-ams  
**Required delivery branch:** main  
**Scope:** Complete the approved navigation implementation and the ongoing main-content UX/UI redesign, then finish shared-component consistency, responsive/scroll fixes, regression validation, and delivery review. This is a full rollout plan, not a navigation-only task.

## Copy-paste execution instruction

Act as the senior frontend engineer responsible for completing the current AMS navigation and structural UX/UI work. Read and obey AGENTS.md, README.md, docs/README.md, docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md, docs/architecture/ams-navigation-information-architecture.md, docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md, docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md, docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md, and all applicable UX/UI/content/role/domain guides.

The goal is to finish the current work coherently. **Do not interpret this prompt as permission to only work on navigation and ignore the main-content redesign.** Navigation is the first gate; main-content implementation and verification are an explicit major stage immediately afterwards. Some navigation, shared-shell and main-content changes already exist in main. Preserve and continue that work rather than restarting from zero.

## Non-negotiable execution and reporting rules

1. Follow the stage sequence in this document. Do not skip, reorder, combine, or silently broaden stages.
2. Before implementation, inspect the current main, recent commits, progress document, change map, relevant source and tests. Build a per-view status inventory: verified complete, partially complete, not started, failing, or not verified.
3. The existing progress document contains prior work on shared navigation geometry, Dashboard hierarchy/Analytics/progress presentation, Finance worksheet context, and other structural slices. Treat these as **existing work to verify and carry forward**, not as an instruction to repeat or as proof that the latest source is fully correct. Inspect recent commits as well; do not rely on historical snapshots alone.
4. Work in small, independently verifiable slices. Within the main-content stage, handle one module or a clearly bounded portion of one module at a time. Avoid one large unbounded refactor or a single enormous tool operation.
5. **Report progress to the user at the baseline, after each meaningful slice, and at each stage milestone. Then continue to the next planned slice/stage automatically when safe.** Do not wait for the user to re-authorize every routine next step. Stop and ask only for a true blocker, material ambiguity in business/product decisions, destructive action, protected-scope change, or when the user explicitly asks you to pause.
6. If tool delivery or the context may time out, reduce the batch size, finish and verify the smallest safe unit, checkpoint it, and send the user a durable report before proceeding. A report must identify the last verified commit and exact next task so work can resume without repeating good changes.
7. Before every write, refresh current main and preserve concurrent updates. The user has required **direct-to-main delivery**: do not create a branch or PR, force-push, or overwrite newer work.
8. A passing build alone does not prove navigation correctness or good UX. Never claim a source route, interaction, viewport, browser flow, CI job, or deployment was verified without evidence.
9. If an issue belongs to a later stage, record it as deferred and do not fix it prematurely. Do not let one unrelated finding redirect the active task.
10. Keep changes within frontend UX/UI and focused frontend tests. Respect all protected scopes listed below.

## Stage 0 — Baseline and carry-forward inventory

Before editing implementation code:

- Confirm repository, current main HEAD, recent commits, related changes, and latest relevant CI state.
- Read the navigation IA, master structure, current progress roll-up, content-first implementation map, and relevant route/module tests.
- Inventory the nine primary modules, workspaces, worksheets, major content areas, and affected routes.
- For every view, record: status; existing source-backed behavior; what is already changed in main; remaining concrete defect; affected files; tests and browser evidence available; next action.
- Specifically verify existing structural slices rather than assuming completion: shared navigation/shell geometry; Dashboard overview, analytics and project-progress presentation; Finance workspace/worksheet context; Inbox saved views; Projects/Tasks worksheets and workspace structure; and any relevant recent module commits.
- Identify whether there are failing checks on the baseline and distinguish pre-existing failures from new regressions.
- Report the baseline HEAD, verified work to preserve, remaining Stage 1 navigation gaps, carried-forward main-content gaps, protected boundaries, and first bounded task.

**Do not restart previous work simply because this prompt is being introduced.** Continue from current source and verified repository history.

## Stage 1 — Finish and verify approved navigation

Use docs/architecture/ams-navigation-information-architecture.md and docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md as the approved target. This stage means completing and verifying the remaining navigation gaps, not rewriting routes or repeating already valid changes.

### Required primary modules

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

CRM, Proposal/Quotation, and generic Approval are not primary sidebar modules. Removing a menu entry does not authorize deleting historical records, APIs, route compatibility, permissions, maker-checker controls, or transaction history.

Finance must retain these five top-level areas:

- Overview & Control
- Transactions & Cash
- Receivables & Payables
- Project Finance
- Accounting & Reports

Follow the approved navigation IA for the workspaces and worksheet ownership inside each other module. Keep the hierarchy primary module → workspace → worksheet/filter/saved view → selected record detail. Do not promote every status, filter, saved view or record detail to a persistent sidebar item.

### Navigation acceptance checks

- Every visible module/workspace/tab destination maps to the correct canonical route or supported query state and opens content owned by that destination.
- No wrong-module fallback, dead link, duplicate destination, blank destination, incorrect tab label, or unreachable required Overview/workspace remains untracked.
- Active tab, URL/query state, direct URL loading, refresh, and browser back/forward behavior agree.
- Role-filtered navigation remains aligned with actual route policy. Do not change server authorization or treat menu visibility as security.
- Existing identifiers, query parameters, route guards, canonical write paths and legacy compatibility behavior are preserved.
- Run relevant navigation tests and applicable lint/typecheck/build checks; record exact outcomes.
- Document any environment limitation explicitly. Never report untested browser behavior as verified.

Only navigation-focused implementation changes should be introduced in this stage. Preserve the content changes already in main; do not revert them or expand them opportunistically during navigation fixes.

When the navigation acceptance criteria pass, report the outcome and proceed to Stage 2. Do not stop merely to ask for permission to start the next planned stage.

## Stage 2 — Finish the main-content hierarchy module by module

**This stage is a core deliverable of the full rollout. Do not omit it after navigation.** Use the content architecture guide, role-based content blueprint, worksheet presentation matrix, design system, UX interaction standards, and actual source/test evidence.

For each page/view, answer these questions before changing it:

- Where am I, and what is this view for?
- What primary job does this workspace help the user complete?
- What is the dominant work area: queue, register, board, report, detail workspace, editor, or settings group?
- What context, period, owner, status, filters, metadata, supported actions and supporting panel are required?
- What is already correct and should be kept?
- What is the smallest frontend change that resolves the verified content-hierarchy problem?
- Which tests and neighboring views may regress?

Do not merely recolor existing pages. Do not copy the Dashboard composition onto all modules. Do not add meaningless cards, invented KPI values, fake/demo records, unsupported actions, duplicate toolbars, or a second competing record system. Use clear loading, populated, empty, no-match, stale/unavailable, access-restricted, error, pending and success states where applicable.

### Main-content work order

Reconcile this list against current source and the view-by-view map before editing. Existing finished items must be marked verified and retained; incomplete items must continue from their current state.

1. **Dashboard**
   - Overview, Performance and Analytics.
   - Verify content ordering, source and period context, main project/delivery workspace, supporting metrics, chart legends/units, responsive panel proportions, unavailable progress values and drill-downs.
   - Historical commits describe some Dashboard hierarchy and Analytics work already performed. Verify latest main rather than redoing those changes blindly.

2. **Inbox**
   - Overview, canonical Messages queue, message categories/saved views, Follow-ups, and Routing & Templates according to current capability and approved IA.
   - Keep Careers applicants in Website CMS → Careers → Applicants; do not introduce a second applicant workflow.
   - Make queue/detail hierarchy, owner, status, priority, due date, source and supported next actions clear.

3. **Projects and Tasks**
   - Overview, Project Registry, Tasks & Execution worksheets, Planning & Delivery, Content & Campaigns, Project Resources, and Project Controls as supported by actual implementation.
   - Verify route/view identity, task list/board semantics, project and client identity, stage, owner, deadline, progress, milestones and cost meaning.
   - Keep Project Files linked to the canonical Documents workspace. Do not invent target-only controls.

4. **Clients**
   - Directory, onboarding, agreements, retainers/SLA and service/health workspaces as implemented.
   - Keep canonical client records and linked requests; do not recreate an Inbox request queue or a standalone CRM.

5. **Finance**
   - All five approved areas and relevant worksheets, not just the module header.
   - Verify each area has the right dominant register/report/control and does not simply repeat Overview KPIs.
   - Preserve formulas, values, posting, journal behavior, invoice/quotation records, receivables/payables, period controls, allocation, reconciliation, permissions and APIs exactly as they are.
   - Quotations remain in Finance; do not create a second proposal/quote store.

6. **Team & Resources**
   - Team & Capacity, People Operations, Vendors & Freelancers, and Time & Availability according to approved IA and actual role access.
   - Keep confidential fields and existing authorization behavior intact.

7. **Documents**
   - Searchable document register and clear metadata, version/record identity, access state and supported actions.
   - Preserve the private document vault and authorized attachment behavior.

8. **Website CMS**
   - Each actual content type/editor, publication state, and Careers jobs versus applicants.
   - Preserve publish permissions, status semantics and existing content records.

9. **Settings**
   - Group actual settings by task and risk; clarify current state, explanation and supported save/apply actions.
   - Preserve authentication, MFA, access, audit, integration and system-security behavior.

### Required per-module execution loop

For each module or bounded worksheet group:

1. Inspect the current page component, route/state, shared primitives, role presentation contract, tests and recent commit history.
2. Record the concrete problem and planned frontend-only change.
3. Implement the smallest coherent change.
4. Run the targeted relevant tests and applicable checks.
5. Review the diff and commit a safe verified slice directly to main.
6. Report the changed paths, visible behavior, exact tests/results, commit SHA, unresolved views and the next planned slice.
7. Continue to the next module/slice automatically when safe. Do not stop for routine approval, but do stop when a genuine decision or blocker requires the user.

Do not declare a module complete until every active view in the declared scope has been checked or explicitly listed as unverified/blocked.

## Stage 3 — Complete shared-component and page-shell consistency

Begin after the required main-content areas have been reviewed, while carrying forward any shared primitives already implemented. Inspect and address only evidenced remaining root causes, such as:

- Duplicate module headers, navigation strips or toolbars.
- Inconsistent workspace/worksheet tab hierarchy and active styling.
- Gutter/spacing ownership and page-shell width.
- Table/register row identity, density, filters and action alignment.
- Shared drawer, modal, confirmation and empty-state patterns.
- Layout shifts when changing tabs or query states.
- Shared component behavior inconsistent across modules.

Inspect all affected consumers before changing a shared primitive. Do not create parallel components or conduct an indiscriminate CSS rewrite. Verify the changed module and neighboring consumers.

## Stage 4 — Responsive layout, overflow, scroll ownership and accessibility

Trace actual ownership across body, shell, main content and local tables/boards before changing overflow. Fix verified issues only; do not remove clipping, scroll-lock or positioning rules based on guesses.

Where browser access is available, check 1440, 1024, 768, 390 and 320 pixel widths. Confirm there is no unintended page-wide horizontal scrolling, clipped controls, overlapping actions, unreadable text, broken table identity, inaccessible tabs, trapped focus, or incorrect drawer/modal behavior. Verify keyboard use, focus restoration and reduced-motion behavior when relevant.

Clearly separate source/test evidence from authenticated browser validation. If browser access is unavailable, report it as unverified rather than claiming the visual QA passed.

## Stage 5 — Cross-module regression and complete validation

Run the current repository's real scripts for lint/typecheck, production build, navigation tests, relevant frontend regression suites, and any targeted cross-module journeys. Do not guess script names; inspect package scripts. Recheck direct routes, refresh, browser history, active workspace state, role-based visibility, table/drawer/modal behavior and truthful data states.

For each check, record exact command or CI run, commit SHA and outcome. If a regression is introduced, stop unrelated work, diagnose and fix or revert that slice before continuing. Do not weaken tests just to get a green result.

## Stage 6 — Final diff, progress record and delivery

- Fetch the latest main and review the complete diff for the rollout.
- Confirm no protected backend/API/database/authentication/RBAC/Finance formula/integration/dependency scope was changed.
- Update docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md with completed slices and exact evidence; retain historical notes as historical rather than claiming they represent current HEAD.
- Verify relevant current CI results, and separately state if Hostinger deployment or authenticated production/browser QA was not verified.
- Report completed scope, remaining/unverified items, commits, test/build/CI results, risks and next action.

## Protected scope

Unless the user authorizes it as a separate task, do not change backend/server code, API contracts, database/schema/migrations, persistence/source-of-truth rules, authentication/session/CSRF/MFA, authorization policy/RBAC, encryption, audit, financial calculations or posting, payment/reconciliation rules, period locks, maker-checker behavior, integrations, private document storage, backup/recovery infrastructure, production configuration, dependencies or lockfiles.

If a UI/navigation issue needs a protected change, preserve the current safe behavior and report the exact blocker instead of crossing the boundary.

## Mandatory progress report format

Use this after baseline and every meaningful implementation slice:

### Stage [number] — [stage name] / [module or slice]

- **Status:** Complete / In progress / Blocked
- **Verified result:** Only what is supported by current evidence.
- **Changed files and user-visible behavior:** Paths and a short description, or “No files changed”.
- **Commit:** Exact main SHA and link, or “Not committed”.
- **Validation:** Exact checks and observed results; mark pending, failed or not run honestly.
- **Already completed and preserved:** Relevant earlier slices not repeated.
- **Remaining in this stage:** Specific unresolved views/tasks.
- **Deferred to later stage:** Issues intentionally not addressed yet.
- **Risk / unverified:** Browser, viewport, role or runtime coverage not actually tested.
- **Next action:** One precise bounded slice from the sequence.

Send the report before the user is left without a durable checkpoint or the run risks a timeout. Then continue to the next planned slice when safe. Pause only for a true blocker, material decision, protected-scope boundary, explicit user request to pause, or when the current change has not passed its required safety checks.
