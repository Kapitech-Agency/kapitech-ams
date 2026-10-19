# AMS Frontend Structural Redesign Execution Prompt

**Repository:** `Kapitech-Agency/kapitech-ams`  
**Execution branch:** `main`  
**Production target:** `https://ams.kapitech.id`  
**Task type:** Frontend structural implementation, verification and checkpointed delivery  
**Controlling specification:** [AMS Frontend Structural Redesign Audit and Execution Specification](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md)

## Copy-paste execution instruction

Act as the senior frontend engineer executing the controlling structural-redesign specification linked above.

Read that specification **in full** before changing application code. This is an execution task, not a request to create another plan or repeat the audit. Reconcile it with the current repository, find the earliest unfinished structural requirement, redesign that view around Kapitech's actual operational task, implement the material content-structure change, verify it, update the durable checkpoint, and continue in the documented order.

The objective is to make the actual main content of every AMS module/workspace fit its purpose. Do not substitute a series of isolated component fixes, copy changes, cosmetic polish, or test-only changes for structural redesign.

## 1. Read and follow the repository authorities

Read in full, then follow relevant cross-references:

1. `AGENTS.md` and `docs/README.md`.
2. `docs/AMS-END-TO-END-DELIVERY-ROADMAP.md`. This owns the overall Stage 0–15 sequence.
3. `docs/AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md`. This controls the frontend structural-redesign method, view contract, module targets, evidence and Stage 5 approval gate.
4. `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`.
5. `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`.
6. `docs/architecture/ams-navigation-information-architecture.md`.
7. `AMS-DESIGN-SYSTEM.md`.
8. `docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md`.
9. `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md` and `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md`.
10. `docs/AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md`.
11. `docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md` and `docs/AMS-UX-INTERACTION-STANDARDS.md`.
12. `docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md`, `docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md`, `docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`, and `docs/AMS-EXECUTION-CHECKPOINT.md`.
13. `docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md` and `docs/AMS-RESUME-AFTER-INTERRUPTION.md`.
14. Relevant module, Finance, drawer, modal, Kanban, accessibility and regression guides.

Respect each document's defined authority. The End-to-End Delivery Roadmap owns the overall stage sequence. The Structural Redesign Audit and Execution Specification owns the audit findings, bounded frontend execution method, verification discipline and Stage 5 user sign-off gate. `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` owns the baseline target main-content composition and required relative content order for each workspace. The Role-Based Content Blueprint and Worksheet Role Presentation Matrix refine persona-specific fields/emphasis without overriding baseline content requirements, approved navigation or permissions. The Navigation IA owns approved destinations and navigation depth. The Design System owns visual tokens/geometry. The Feature & Content Gap Register owns evidence-backed implementation availability and blockers. Target documents describe intended behavior; they are not proof that code implements it. If active specifications conflict, follow `AGENTS.md`, inspect current source and tests, preserve domain contracts, and record unresolved conflicts instead of guessing.

## 2. Restore the live state before acting

At the start of this session and after every interruption:

1. Fetch the current `main` HEAD, recent commits, relevant diffs, source files and tests.
2. Check the latest CI and Quality Gate results for the exact source/test SHA. Historical run statuses are not current evidence.
3. Reconcile the execution checkpoint, structural progress record, gap register and implementation map with current source.
4. Preserve correct work already present. Do not rebuild completed navigation or repeat completed structural slices just because a checkpoint is stale.
5. Separate structural requirements from supporting bug fixes, minor polish and backend/provider dependencies.
6. Choose the earliest unfinished structural requirement in the approved sequence, not the easiest unrelated defect.

Do not report progress based only on memory, a prior conversation, or an old SHA. Do not claim a feature is implemented because its target documentation or route exists.

## 3. Hard scope boundary: frontend only

### Allowed

- Main-content hierarchy, page composition and task-specific information architecture.
- Approved frontend navigation/tab/query presentation where supported by current contracts.
- Reordering and grouping of existing source-backed content.
- Existing shared frontend components, styles and documented design-system patterns.
- Responsive behavior, accessible interactions and honest UI states.
- Focused frontend regression tests.
- Evidence, progress, gap-register and checkpoint documentation.
- Actual browser-based visual verification when authorized browser access is available.

### Do not change

- Backend services, Express/API routes or API contracts.
- Database, SQL, schema, migrations, persistence, data models, seed data or server-side business rules.
- Authentication, session, CSRF, MFA/TOTP, RBAC or authorization policy.
- Encryption, audit controls, private-document authorization, notification services or external integrations.
- Finance calculations, journal/posting behavior, payments, bank reconciliation, period locks, maker-checker controls or established financial workflows.
- Dependencies, core frontend stack, public website, hosting or production configuration.

Do not create fake runtime data, fake successful actions, duplicate records or a second data source. If a desired UI capability lacks a supported API, model, provider, permission or business transition, represent its state truthfully, record the exact dependency, and defer that capability to its proper stage. Do not exceed frontend scope to make a screen appear finished.

## 4. Preserve approved product structure

The approved primary modules are exactly:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

Do not add standalone CRM, Proposal/Quotation or generic Approval primary modules. The approved navigation is considered implemented; verify it and correct only demonstrated defects instead of rebuilding it.

Finance retains these five areas:

1. Overview & Control
2. Transactions & Cash
3. Receivables & Payables
4. Project Finance
5. Accounting & Reports

Preserve canonical record ownership, route contracts, business meanings, permissions, established Finance calculations and current workflows. Persona-based emphasis may not grant access or alter business meaning.

## 5. Execute the canonical frontend stages

Follow the frontend stages in the controlling specification. They refine, but do not replace or renumber, the canonical overall roadmap.

### Stage 0: Baseline and preservation

Verify current source, recent history, tests and CI. Reconcile progress records. Identify one bounded starting slice.

### Stage 1: Navigation and routing verification

Verify destinations, active state, direct URLs, query state, refresh, browser back/forward and supported legacy redirects. Do not rebuild completed navigation.

### Stage 2: Shared shell and page geometry

Verify the header/title owner, outer page-gutter owner, contextual tab location, primary scroll owner, sidebar/topbar, overlays and responsive behavior. Correct the actual shared owner rather than patching individual views with duplicated headers, arbitrary local padding, negative margins, unexplained z-index or CSS hacks.

### Stage 3: View structure contract

Document the selected view's actual purpose, current composition, specific mismatch and intended content order. Proceed to implementation in the same bounded slice. Do not remain in audit/planning mode.

### Stage 4: Structural redesign

Work in the documented module order:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

Within each module, follow the workspace and worksheet order in the controlling specification, the Main-Content Restructuring Specification and the worksheet matrix. Complete a bounded workspace/worksheet slice and verify it before moving to an unrelated view. Continue automatically to the next authorized structural slice after reporting verified progress. Do not repeatedly stop for routine approval.

### Stage 5: Visual, responsive and accessibility review

Review the actual rendered screens when authorized access is available. Record verified, partial, missing, blocked and not-verified states. Prepare a module-by-module readiness report and stop for the user's explicit frontend approval. Do not start broad Stage 6+ workflow/data/API work before that approval.

## 6. Required view contract before implementation

For each selected view, add to or link from the existing structural progress record. Reuse existing requirement IDs instead of creating duplicates.

Record:

- Module, workspace, worksheet and existing requirement ID.
- Primary user task and the question the view must answer.
- Actual source component/route, current content order and primary work surface.
- Evidence-backed structural mismatch with the target.
- A concise **before** sketch showing current regions in order.
- A concise **after** sketch showing intended regions in order.
- The intended primary surface: register, queue, board, report, timeline, editor, selected-record review, detail or settings workspace.
- Essential source-backed information and context, such as identity, status, owner, period/deadline, amount/unit/source and linked records when relevant.
- Supported primary/secondary actions, filters and navigation.
- Applicable loading, populated, no-data, filter-empty, error, stale/unavailable and restricted states.
- Route/query behavior, permission boundary, data source and business semantics to preserve.
- Material structural change to implement.
- Focused regression checks and required browser/responsive evidence.

The before/after sketch must describe a meaningful change in content order, grouping, primary work surface or task flow when the existing design is wrong. A change limited to color, spacing, copy, icon, one filter, empty-state wording or a shared primitive does not independently satisfy the structural requirement.

## 7. Design from the task, not from existing JSX

Identify what the user needs to decide or complete, then make the correct data, context and controls available together. The current component tree is implementation evidence, not the design answer.

Where required by the target specification:

- Make the correct register, queue, board, report, editor or record-review surface visually dominant.
- Put relevant controls and filters directly with the surface they govern.
- Group related identity, status, owner, date/period, value/unit/source and next action.
- Separate list/queue and selected-record review when that makes the workflow clearer.
- Remove duplicate headers, repeated KPI strips, redundant cards and unrelated supporting panels.
- Distinguish workspace tabs, worksheet navigation, filters and view-mode toggles.
- Preserve important information on mobile by using the documented compact-detail or horizontal-scroll patterns rather than silently omitting fields.
- Keep the design appropriate to that module. Do not force every module into the same dashboard template.

Do not count minor corrections as structural completion. Record supporting bug fixes separately. Keep data truthful: no fake production examples to fill the layout, no zeros standing in for missing values, and no unsupported capability shown as functional.

## 8. Design system and accessibility

- `AMS-DESIGN-SYSTEM.md` and the existing token source are the visual authority.
- Reuse documented shared components, variants and layout patterns. Do not create a parallel design system or invent dimensions, breakpoints, radii, spacing values or z-index values.
- Maintain one owner for page header, outer gutter and primary scroll container.
- Use accessible names, semantic status labels, non-color cues, predictable keyboard/focus behavior and sensible reading order.
- Review tables, boards, forms, drawers, modals, empty/error/unavailable states and long content where relevant.
- Verify documented desktop, tablet, mobile and breakpoint-edge viewports, 200% text resizing/reflow and reduced motion as specified by the design system.
- Treat WCAG 2.2 AA as a verification target. Do not claim conformance merely because build or automated checks pass.

## 9. Verification and evidence per slice

For each bounded implementation slice:

1. Inspect the diff and confirm the material structural mismatch was addressed.
2. Confirm protected backend/domain files and unrelated code were not changed.
3. Add or update focused frontend regression tests for the intended hierarchy, interactions, route/query state and relevant edge states.
4. Run relevant targeted checks, then applicable test, lint/typecheck and production build scripts. Confirm the current scripts in `package.json` before running them.
5. Inspect the latest CI and Quality Gate results for the exact pushed SHA.
6. When authorized browser access is available, inspect the rendered route, active workspace, data state and required viewport sizes. Link or record genuine evidence.
7. Check consuming views when a shared component changes.
8. Update the existing requirement/gap entry, structural progress record, implementation map and execution checkpoint to reflect actual evidence.

A green build, source-string test, shared-component update or screenshot alone does not prove that every workspace is structurally complete. If browser/role access is unavailable, describe the exact limitation and leave visual verification as not verified. Never fabricate screenshots, CI results or runtime evidence.

## 10. Progress reporting and timeout-safe delivery

Work in small, independently verifiable slices. Send a durable checkpoint after the baseline and after each meaningful slice. Do not accumulate several substantial changes without reporting.

Every checkpoint must include:

- Timestamp and current live `main` SHA.
- Canonical roadmap stage and one bounded module/workspace/requirement ID.
- Structural problem and what materially changed from before to after.
- Changed paths and exact commit link.
- Supporting bug fixes listed separately from structural work.
- Commands/tests, CI and Quality Gate results for the exact SHA.
- Rendered visual evidence and viewport details, or the reason unavailable.
- Evidence-backed status: verified complete, partial, missing, blocked or not verified.
- Gap/progress/checkpoint records updated.
- Remaining blockers/dependencies.
- The next single action in canonical order.
- Confirmation that Stage 5 user sign-off remains required.

Follow `docs/AMS-RESUME-AFTER-INTERRUPTION.md` after timeout or context reset. Refresh current `main`, relevant diffs and CI first. Check whether the last write/commit succeeded. Resume from verified state; do not restart or trust a stale SHA.

Commit directly to `main` when authorized and supported by repository rules. Do not create a branch/PR as a workaround, force-push, bypass protections or overwrite concurrent changes. If direct push is blocked, record the precise blocker and preserve the work safely.

## 11. Definition of ready for frontend sign-off

The frontend is ready for user review only when:

- All nine modules and their in-scope workspaces have been assessed against the actual operational task.
- Every eligible view meets its structural contract, or its remaining dependency/blocker is explicitly evidenced.
- Cosmetic and bug-fix-only changes are not falsely counted as structural redesign.
- Approved navigation, route/query behavior, permissions, canonical data meaning and existing business workflows remain intact.
- Unsupported capabilities remain visibly honest and are not simulated as working.
- Focused tests and applicable typecheck/build/CI evidence are recorded for the relevant SHA.
- Responsive and accessibility review is documented, including any verification limitations.
- The gap register, structural progress record, implementation map and checkpoint agree with current source evidence.
- A module-by-module Stage 5 review is provided and work stops for the user's explicit approval before broad Stage 6+ work.

## 12. Required slice report

Use this format after each meaningful slice:

**Stage / requirement:**  
**Current main SHA:**  
**Task and structural mismatch:**  
**Before → after:**  
**Changed paths / commit:**  
**Supporting fixes, not structural completion:**  
**Tests and exact results:**  
**CI / Quality Gate:**  
**Browser evidence / limitations:**  
**Requirement and progress records:**  
**Remaining blocker:**  
**Next action in canonical order:**  
**Stage 5 sign-off:** Pending / Approved

## Immediate instruction

Read the controlling specification in full. Fetch current `main`, recent commits and current CI. Reconcile the checkpoint and gap register against source. Verify completed navigation without rebuilding it. Select the earliest unfinished workspace in canonical order, define its view contract, implement the material main-content redesign, test it, record exact evidence and continue with the next authorized slice. Do not stop after another audit or plan. Do not begin broad backend/workflow work before the user's Stage 5 approval.
