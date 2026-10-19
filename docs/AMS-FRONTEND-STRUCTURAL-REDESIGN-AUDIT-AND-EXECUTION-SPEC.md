# AMS Frontend Structural Redesign Audit and Execution Specification

**Repository:** Kapitech-Agency/kapitech-ams  
**Scope:** Frontend-only navigation, routing, shared shell, main-content structure, interactions, responsive behavior, accessibility, and user visual review  
**Roadmap coverage:** Refines the official end-to-end roadmap's Stages 0–5. Does not replace or renumber the canonical Stages 0–15.  
**Status:** Mandatory execution specification. This document records a dated source audit and defines how the remaining frontend redesign must be completed.

> **Primary objective:** The user must be able to review the real AMS screens and decide whether the frontend is ready before the team begins broad backend, API, data-model, workflow, integration, or production-readiness work. Deliver a task-appropriate main-content redesign, not a sequence of isolated component fixes.

## 1. Audit conclusion

The current implementation has meaningful improvements, but the structural redesign is **not complete**. Several screens have received genuine composition changes, including Dashboard priority exceptions, Inbox triage and record review, Projects planning/resource areas, and changes to some Finance worksheet hierarchies. It would be inaccurate to say that no structural work has occurred.

Delivery is uneven. Recent implementation history also contains many narrow fixes: date interpretation, CSV export behavior, query-string preservation, wording, empty/error states, status semantics, and regression-test corrections. These changes can be necessary and valuable, but they do not prove that each module's primary working area has been re-derived from Kapitech's operating needs.

The problem to correct is the work method:

1. Tasks have too often started from a small gap found in existing source code rather than from the approved structure for the selected view.
2. Routine bug fixes and structural redesign have been mixed, allowing small defects to displace the user's main objective.
3. Better loading/error states, shared primitives, labels, query preservation, or passing source tests have sometimes been mistaken for completion of content architecture.
4. Many target workspaces remain partially complete or explicitly unavailable.
5. Browser-level visual and responsive review is still needed; source inspection and CI do not prove the visual experience is ready.
6. Progress summaries may lag current source. Status must be verified against live main, diffs, tests, CI, and available browser evidence.

**Recommendation:** Preserve correct implementation and current behavior. Do not restart the repository or rebuild approved navigation. Change the execution discipline. For each workspace, state the actual task and decision, compare current composition with the target specification, implement the material structural difference, and prove it with focused tests plus rendered visual evidence where available.

## 2. Authority and mandatory reading

Read the following before implementing a structural view, and follow their internal links where relevant:

1. [AGENTS.md](../AGENTS.md)
2. [AMS Design System](../AMS-DESIGN-SYSTEM.md)
3. [AMS Master Structure & AI Implementation Guide](AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md)
4. [AMS Navigation Information Architecture](architecture/ams-navigation-information-architecture.md)
5. [AMS Content Architecture & Module Workspace Guidelines](AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md)
6. [AMS Role-Based Content Blueprint](AMS-ROLE-BASED-CONTENT-BLUEPRINT.md)
7. [Worksheet Role Presentation Matrix](AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md)
8. [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md)
9. [AMS Content-First UX/UI Implementation Map](AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md)
10. [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md)
11. [AMS Frontend-Only UX/UI Execution Prompt](AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md)
12. [AMS AI Phased Implementation Workflow](AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md)
13. [AMS Resume After Timeout or Interruption Protocol](AMS-RESUME-AFTER-INTERRUPTION.md)
14. [AMS Execution Checkpoint](AMS-EXECUTION-CHECKPOINT.md)
15. [AMS Stage-by-Stage Execution Checklist](AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md)
16. Relevant interaction, frontend engineering, Finance, Drawer, Modal, Kanban, accessibility, security, and regression documentation for the actual view.

The Main-Content Restructuring Specification controls the target main-content composition and relative region order for each workspace; it does not replace the Navigation IA. The Master Structure controls product/workflow ownership; the Navigation IA controls approved destinations and navigation depth; the Design System controls visual tokens and geometry; the Role-Based Content Blueprint and Worksheet Role Presentation Matrix refine role-aware emphasis without changing baseline content requirements or permissions; the gap register tracks evidence-backed implementation status. Historical implementation-map entries are not automatically current. When two documents conflict, follow the precedence in AGENTS.md, inspect source/test evidence, and document unresolved conflicts rather than guessing.

## 3. Audit snapshot and evidence limits

The source snapshot reviewed during this audit was main at [4e57c8b4b8d7b3aabf3393b48499627db2015b40](https://github.com/Kapitech-Agency/kapitech-ams/commit/4e57c8b4b8d7b3aabf3393b48499627db2015b40), titled “test(clients): assert local renewal date semantics”. This SHA is a dated snapshot, not a permanent current head.

At the last check, both [AMS CI run 39253706334](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39253706334) and [AMS Quality Gate run 39253706326](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39253706326) were still in progress for that SHA. Refresh their status and current main before claiming success. The earlier snapshot [61b910aa58e6142133df66895a8f2c2542a87949](https://github.com/Kapitech-Agency/kapitech-ams/commit/61b910aa58e6142133df66895a8f2c2542a87949) had both [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39252279384) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39252279056) pass. That only proves the earlier SHA.

### 3.1 Source observations that motivate this specification

- **Dashboard:** GlobalExecutiveDashboard.tsx already has Overview, Performance and Analytics, priority exceptions, supporting indicators and a project register. It is more developed than some modules, but visual hierarchy, source meanings, role/direct-route behavior, chart accessibility and browser responsiveness remain acceptance items. Preserve correct content; redesign only where the target contract is not met.
- **Inbox:** AdminInbox.tsx has triage and selected-record review, plus multiple view modes and message filters. Follow-ups and Routing & Templates are recorded as missing/unavailable. Adding a small status/filter improvement does not complete these target workspaces.
- **Projects:** AdminProjects.tsx has the portfolio, planning/delivery, resources, sprint/tasks, budget and archive views. The gap register still records Content & Campaigns, Project Controls, Scope & Deliverables, Deliverable Tracking, Internal Quality Review, Client Review, Revision History, Task Lists and Dependencies as absent or not supported by canonical records. Do not fake these features.
- **Clients:** AdminClients.tsx and associated contract/retainer/SLA pages provide Directory, Onboarding, Agreements and Service & Health starting points. Recent commits include export correctness, scope handling, truthful copy and date corrections. These are useful supporting fixes, but Onboarding Checklist, Required Documents, Kickoff Readiness, Contract History and Service History remain incomplete or unavailable; client health also has source/telemetry dependencies.
- **Finance:** AdminFinanceWorkspace.tsx contains extensive worksheet logic. The five approved areas are Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, and Accounting & Reports. Several report/register hierarchies have been adjusted, but source, role, recovery and visual review remain. Finance must not be rewritten as a generic dashboard.
- **Team & Resources:** AdminTeams.tsx, AdminVendors.tsx and AdminTimeLogs.tsx provide some team, allocation, skills, vendor and time-log views. People Operations, Vendor Contracts & Rates, Vendor Engagement Status, My Timesheet and Timesheet Control remain incomplete/unavailable in the gap register.
- **Documents:** AdminDocuments.tsx has a private document register, categories, search/sort, upload, preview/download and deletion. The currently verified UI model does not establish a complete version-history workspace.
- **Website CMS:** Separate editors exist for Case Studies, Services, Insights, Testimonials and Careers. Some recent commits improve feedback so a successful CMS mutation is not falsely presented as proof that public deployment/cache has updated. This is correct semantics, not proof that every register/editor has ideal composition.
- **Settings:** AdminSettings.tsx separates System Overview, Access & Security, Audit Log and Integrations. Backup and connection status meanings have improved, but authenticated role, route, responsive, keyboard and browser visual review remain.

These are source-level observations, not a claim that this audit captured final production screenshots. Re-check current source and current checks on each resume.

## 4. What counts as structural redesign

A view is structurally redesigned only when the content architecture is intentionally matched to its actual user task and material differences have been implemented.

Structural changes can include:
- reordering page regions so the correct primary work surface becomes dominant;
- grouping related identity, state, owner, deadline/period, amount/source and next action together;
- separating a register/queue from selected-record review or analysis;
- replacing an unsuitable arrangement of generic cards with the right register, queue, board, report, timeline, editor, detail workspace or settings group;
- removing duplicate headers, repeated counts/KPI strips, redundant empty cards or supporting panels that interrupt the task;
- adding a documented detail/split-pane/compact back path where it improves the real workflow;
- establishing a clearer distinction between global module navigation, workspace/worksheet navigation, filters, saved views and presentation toggles;
- adapting content grouping and default focus to the role matrix while preserving permission boundaries;
- defining honest unavailable, restricted, stale, empty, loading, error and success states in the new composition.

These changes do **not independently** count as structural redesign:
- changing padding, color, type size, border, radius or icons;
- changing copy alone while keeping content order and primary working area unchanged;
- fixing a date default, CSV header/newline, query parameter, formatting function or test assertion;
- adding one filter or empty-state message to an otherwise unchanged screen;
- moving a KPI strip without a task-based reason;
- making a shared primitive more reusable without redesigning its consuming views;
- adding a view-state branch while leaving the wrong work surface dominant.

These supporting changes are still allowed and often necessary. Record them as bug fixes or interaction hardening, not as completion of the structural requirement.

Do not use a minimum lines-changed threshold. A concise refactor may fundamentally change structure. Completion is based on the view contract, visible composition, preserved semantics, checks, and evidence—not diff size.

## 5. Frontend-first sequence

The canonical end-to-end roadmap remains authoritative. This section refines the frontend portion of Stages 0–5 only.

### Stage 0 — Recover baseline and preserve work

- Fetch live main, recent commits, current source, relevant tests and current CI.
- Verify prior changes are actually present before repeating them.
- Separate structural requirements from independent defects and backend/model dependencies.
- Reconcile the checkpoint, progress notes and gap register against source evidence.
- Choose the earliest unmet **structural** acceptance criterion, not merely the next easy defect.

**Exit:** current baseline is verified and there is one clear starting slice.

### Stage 1 — Navigation and routing

Approved navigation is considered implemented; preserve it rather than rebuilding it. Verify primary modules, workspace hierarchy, route ownership, active state, query parameters, deep links, refresh/back/forward, legacy redirects and permission-safe destinations. Fix only proven routing/navigation regressions. Do not invent extra primary modules or redo completed navigation because the session was interrupted.

**Exit:** route/query behavior is source/test-verified; remaining browser proof is listed for Stage 5.

### Stage 2 — Shared shell and page geometry

Verify the page gutter/header owners, location of contextual tabs, primary scroll owner, sidebar/topbar behavior, responsive geometry, focus/overlay behavior and design-system tokens. Do not patch a shared shell defect with arbitrary page-specific padding, negative margins, duplicated headers or CSS hacks. Recheck all consuming pages after shared changes.

**Exit:** shared geometry works for affected route types and does not depend on local workarounds.

### Stage 3 — View contracts and gap evidence

For the selected workspace, create/update the View Structure Contract in Section 6. Use the approved navigation IA, main-content specification, role blueprint, worksheet matrix and current gap row. This must be a focused design step followed by implementation in the same bounded work slice; it is not permission to endlessly audit without changing the UI.

**Exit:** intended structure, current mismatch, supported data/actions, tests and visual acceptance are explicit.

### Stage 4 — Structural redesign across all modules

Work in the module/workspace order from the Main-Content Restructuring Specification:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

Within each module, use its documented workspace order and the worksheet matrix. Do not jump among unrelated modules to patch minor defects.

For each slice:
1. Define the view contract and show current versus target content order.
2. Inspect current route/query ownership, source fields, permissions and tests.
3. Identify material structural differences.
4. Implement the new composition and content order while preserving supported behavior and data meaning.
5. Add/update targeted frontend regression coverage.
6. Run focused checks, then applicable wider checks.
7. Capture actual browser evidence when authorized access exists.
8. Update the gap register, progress note and checkpoint with precise evidence.
9. Continue to the next documented workspace when the current slice is verified.

Missing APIs/models/providers do not permit fake runtime features. Keep unavailable capabilities explicitly unavailable, record their dependencies and continue with the source-supported UI. Do not expand into backend scope to make a screen appear complete.

**Exit:** all frontend-eligible views meet their view contracts or are explicitly blocked with evidence. “Shared component updated” is not an exit criterion.

### Stage 5 — Visual/responsive/accessibility review and user sign-off

Review the rendered app, not only source code or JSX assertions. Verify all in-scope routes and active tabs; information hierarchy and primary work area; desktop/tablet/mobile reflow; scroll ownership and overlays; tables/boards/forms/drawers/modals; keyboard/focus/labels; zero versus empty versus filter-empty versus unavailable/stale/error; typography, contrast, non-color status cues, 200% text resize/reflow and reduced motion; role-sensitive visibility where authorized; and current CI for the exact SHA.

Follow the exact viewport and breakpoint set in AMS-DESIGN-SYSTEM.md. Do not claim browser review when no authorized browser/session was available; list the limitation.

Prepare a module-by-module frontend readiness report and stop for the user's explicit approval. Do not begin broad Stage 6 workflow/data/API work until the user approves the frontend. If the user requests corrections, implement them and repeat affected verification.

## 6. Required View Structure Contract

Before implementing a selected view, record this contract in the structural progress record or link to the existing design record. Reuse existing requirement IDs; do not create duplicate gap entries.

| Field | Required answer |
|---|---|
| Module / workspace / worksheet | Canonical name from the approved navigation IA. |
| View / requirement ID | Existing ID from the gap register. |
| Primary user task | What the user is trying to complete in this view. |
| Key question | Decision the page must answer quickly. |
| Current structure | Actual component/route, content order, primary work surface and visible controls. |
| Structural mismatch | Specific gap between current composition and the target; cite source evidence. |
| Target content order | Ordered regions from first to last, with the primary area clearly named. |
| Primary work surface | Register, queue, board, report, editor, timeline, detail, or configuration group—and why. |
| Essential data/context | Identity, status, owner, dates/period, source, units, linked records and next action as applicable. |
| Filters and views | Controls supported by current fields and the role matrix. |
| Actions | Supported actions, permission restrictions and truthful outcome feedback. |
| Data semantics | Canonical source/record owner, known vs unknown values, date/amount meanings, and no duplicate source of truth. |
| Required states | Loading, valid empty, filter-empty, unavailable, stale, restricted, validation error, operation error, pending/unknown outcome, success where applicable. |
| Navigation state | Route, query parameters, selected record/tab, direct links and browser history behavior. |
| Responsive/accessibility | Desktop/tablet/mobile composition, focus/keyboard, labels, contrast, non-color cues and reflow. |
| Structural edits planned | What will be reordered, regrouped, separated, removed or replaced. |
| Dependencies/out-of-scope items | Missing API/model/workflow/provider or business decision. Keep current UI truthful. |
| Tests/evidence | Specific assertions, commands/workflows, screenshots/viewports and limits. |
| Acceptance | Observable conditions that prove this view meets the target. |

### 6.1 Before/after sketch is mandatory

For every structural change, include a short before/after content-order sketch.

Illustrative example only:

**Before:** Header → generic KPI strip → unrelated summary cards → register → selected-record context below the fold.

**Target:** Header + relevant scope → actionable exceptions only if this view needs them → dominant primary register/report with its controls → selected record/context → supporting summary.

Do not copy the example blindly. A Finance formal report may need its report first; a CMS editor may need a content register first; Inbox may need triage controls and selected-record review. The actual composition must come from the selected workspace specification.

### 6.2 Preserve good structure; change the wrong structure

If the current rendered structure already meets the target contract and visual criteria, preserve it and record the evidence. Do not make needless changes to demonstrate activity.

If it does not meet the target, change its structure even when this requires reordering or regrouping substantial regions. The existing component tree is not the design authority.

## 7. Required content direction per module

The complete field-level requirements remain in the Main-Content Restructuring Specification, Role-Based Content Blueprint and Worksheet Role Presentation Matrix. The following summaries must guide view contracts.

### 7.1 Dashboard

Dashboard summarizes canonical sources; it is not an independent record store.

- **Overview:** reporting scope; actionable cross-agency exceptions; decision-grade indicators with clear definition/period/unit/source; meaningful delivery/client/Finance/resource summaries; relevant recent activity only where supported.
- **Performance:** valid period/comparison; delivery throughput, on-time work, quality or resource metrics only where valid; inspectable trends/values; source drill-down.
- **Analytics:** report filter/grouping; reports grouped by business question; exact values, source definitions, periods/units; authorized drill-down.

Keep issued invoice value, collected cash, recognized revenue, recorded expenses, cash balance, receivables and posted profit distinct. No invented metrics or decorative charts.

### 7.2 Inbox

- **Overview:** queue first; new/urgent/unassigned/due items only when source data supports them; counts map to filtered queue; selected record context.
- **Messages:** search/filters, one canonical register with contact/subject, source/channel, received date, category, priority/status, owner, configured due/SLA and linked client/project; selected-thread conversation/history/attachments/internal notes/permitted actions.
- **Follow-ups:** Due Today/Upcoming/Overdue/Completed only with a real canonical follow-up source.
- **Routing & Templates:** rule/template directory and editor only when source contracts exist. Never claim a message was sent before provider confirmation.
- Careers applicants remain in Website CMS → Careers → Applicants.

### 7.3 Projects

- **Overview:** delivery exceptions, at-risk/late milestones and pending reviews, linked to exact records; not a duplicate Project Registry.
- **Project Registry:** canonical register; client, owner, lifecycle/status, dates and meaningful health; alternative board/table/timeline over the same records where supported.
- **Tasks & Execution:** board/list and supported scopes over the same tasks; identity, project, stage/status, owner, priority, due date and existing time/dependency fields; keyboard-accessible list alternative.
- **Planning & Delivery:** Project Brief, Scope & Deliverables, Milestones, Timeline, Deliverable Tracking, Internal Quality Review, Client Review and Revision History only to the extent their sources/state machines exist.
- **Content & Campaigns:** target composition from calendar/brief, production, assets/versions, review, revision, schedule/publication and results only when existing canonical records support the view.
- **Project Resources:** project-scoped assignments/allocations; overall capacity remains owned by Team & Resources.
- **Project Controls:** change/risk/issue/budget controls only when canonical records and permissions exist.

Keep unsupported canonical workflow views unavailable. Do not simulate QA approvals, client review, revision records, task dependencies or campaign state locally.

### 7.4 Clients

- **Directory / Client 360:** find/compare clients; clear identity/contact/account owner/status and source-backed linked project, service and agreement context.
- **Onboarding:** verified profile and supported next steps; profile completeness must not equal onboarding approval. Checklist, Required Documents and Kickoff Readiness need canonical evidence and completion ownership.
- **Agreements:** contracts/terms, retainers, renewal schedule, dates, owner and next action. Use documented local-calendar date semantics. Contract History requires real version/event source.
- **Service & Health:** SLA and service issue/feedback context only from supported telemetry/records; no invented health score or incidents.

### 7.5 Finance

Keep exactly these five approved areas:
1. Overview & Control
2. Transactions & Cash
3. Receivables & Payables
4. Project Finance
5. Accounting & Reports

Give each worksheet its own task-suitable hierarchy. Overview is decision-ready; Transactions & Cash separates Cash & Bank, Revenue, Expenses and Petty Cash; AR/AP prioritizes registers and supported aging/installment context; Project Finance distinguishes operational budget/allocation/team fees from accounting truth; Accounting & Reports gives Journal, Monthly Closing, Annual Summary, Monthly P&L, Cash Flow and Balance Sheet their correct report/register structure and clear source basis.

**Finance safety:** do not change formula, tax treatment, invoice/quotation behavior, journal posting, payment, reconciliation, period lock, closing, maker-checker, ledger meaning, permissions or established business workflow during frontend redesign.

### 7.6 Team & Resources

- **Team & Capacity:** internal roster, role/department and source-backed assignment/capacity context.
- **People Operations:** personnel lifecycle, employment terms, leave/availability, training/performance only with authorized source/policies; keep restricted HR detail private.
- **Vendors & Freelancers:** directory/skills/engagement/contracts only where supported; vendor bills and payments remain Finance-owned.
- **Time Tracking:** canonical logs, billable/non-billable and project breakdown. My Timesheet/Timesheet Control need verified identity scope and real submission/review policy.

No invented leave calendar, timesheet approval, historical vendor rates, or capacity percentage from missing data.

### 7.7 Documents

Use the private document register as the primary surface, with supported search/category/sort and clear identity, type/category, owner, updated/upload date, access/permission and linked client/project. Details/preview show supported file metadata and permitted actions. Do not imply version history, signature history, retention or successful restore when the canonical source does not prove it.

### 7.8 Website CMS

Each content type must have a purpose-built register/editor, not copies of one generic editor.
- **Case Studies:** publication state, client/project, deliverables, media, narrative and outcome.
- **Services:** classification, service copy, ordering, language/SEO, assets and publication state where supported.
- **Insights:** editorial register/article structure, blocks, takeaways/FAQ, taxonomy, media/SEO, language and related content.
- **Testimonials:** quote, author/attribution, rating, language and publication status.
- **Careers:** distinct Jobs and restricted Applicants surfaces; Recruitment History only with canonical event history.

A successful CMS mutation confirms stored CMS state, not independent public deployment/cache freshness.

### 7.9 Settings

- **System Overview:** status/readiness with source/freshness, backup integrity and restore verification kept distinct.
- **Users & Access/Security:** user identity, access/MFA and configuration grouped according to existing authorization.
- **Audit Log:** read-only event register with identity, timestamp, result and supported filters.
- **Integrations:** distinguish configured, available, connected and delivery-ready states; a successful settings request alone is not proof of provider connectivity.

Never expose secrets or bypass server-owned security controls.

## 8. Design-system and interaction requirements

Apply AMS-DESIGN-SYSTEM.md and the interaction standards without inventing a second system.

1. One page title/header owner, one outer gutter owner, and one primary content scroll owner.
2. Separate primary navigation, contextual workspace tabs, worksheet navigation, in-page filters and view toggles.
3. One obvious primary action; secondary actions do not compete for attention.
4. Main working area appears early and gets visual dominance appropriate to its purpose.
5. Controls precede the register they control. Keep identity, status, owner, deadline/period, amount/unit/source and next action together.
6. Keep supporting summaries only if they help the primary decision. Remove redundant KPI strips and empty card stacks.
7. Use existing tokens, components and named variants. No arbitrary breakpoints, one-off margins, negative-offset hacks or unexplained z-index values.
8. Support direct URLs, query state, refresh, browser back/forward, focus/keyboard, 200% text resizing, reflow and reduced motion.
9. Status must not depend on color alone; maintain semantic labels, accessible names and sensible reading order.
10. Do not silently remove important fields on mobile. Use the documented compact detail pattern or useful horizontal scrolling.

## 9. Frontend-only boundary before approval

Permitted: frontend hierarchy/layout; approved route/tab/query presentation; labels/units/data-state messaging; existing API contracts consumed as-is; responsive/accessibility improvements; frontend regression tests; evidence/progress documents.

Not permitted in this phase: backend services, API contract changes, persistence, database/schema/migrations, authentication/session/CSRF/MFA/RBAC policy, security controls, Finance calculations/postings, integrations or established business workflows.

If target content requires missing backend/model/provider support:
1. preserve honest existing source states;
2. identify the missing canonical record, owner, policy or transition;
3. do not add fake runtime records or success behavior;
4. record the dependency in the gap register;
5. defer implementation to the correct later stage.

The frontend may clearly present the fact that a capability is unavailable. It must not simulate it as functional.

## 10. How to prove a view is structurally complete

Use this checklist per view:

- [ ] View Structure Contract is completed or linked.
- [ ] Current rendered/source structure and its mismatch with target are documented.
- [ ] Before/after content-order sketch exists.
- [ ] Primary working area matches the actual task and is not displaced by decorative/duplicate regions.
- [ ] Related context, controls, filters and actions have a deliberate order.
- [ ] Unsupported capabilities remain unavailable and dependencies are recorded.
- [ ] Correct data source, route/query behavior, permission and business semantics are preserved.
- [ ] Focused regression tests assert the intended hierarchy/interaction/state.
- [ ] Typecheck/build and applicable CI results exist for the exact SHA.
- [ ] Browser screenshots and viewport details are recorded when available.
- [ ] Other consumers of changed shared components were checked.
- [ ] Gap-register status is supported by current source/test/runtime evidence.

If a change only fixes date, CSV, wording, query-state or empty-state behavior and does not change the content architecture, classify it as a supporting fix and leave the structural criterion open.

## 11. Prevent random gap chasing

Select work using this priority:
1. Navigation/shell defect blocking safe frontend evaluation.
2. Earliest unfinished structural requirement in the documented module/workspace order.
3. A genuine regression introduced by the slice just completed.
4. A dependency that blocks the current view and cannot be represented truthfully.
5. Minor polish after the structural acceptance gate.

Do not:
- jump across modules for easy minor fixes while the current structural view is unfinished;
- alternate between unrelated modules just because new issues are discovered;
- continue adding local fixes while leaving the primary work surface unchanged;
- mark views complete because shared primitives changed;
- report target-only or disabled features as implemented;
- change approved product taxonomy or business semantics silently.

A small fix may interrupt a slice only when it addresses a regression, data misrepresentation, security issue, or routing defect that materially blocks evaluation. Explain why, validate it, then return to the previous structural sequence.

## 12. Test and visual evidence

For every slice, run targeted regression checks, relevant test suite, current typecheck/build, and relevant CI. Inspect the diff for accidental deletions, unrelated changes, fake data, duplicate sources and scope violations. A JSX-string assertion helps guard source behavior but cannot prove visual quality.

Where authorized browser access exists, inspect actual screens for:
- route ownership/selected state;
- header and page gutters;
- order and dominance of the primary work surface;
- register/board/detail placement and actions;
- nested scrolling, mobile detail/back, drawers/modals;
- keyboard/focus, labels, empty/error/unavailable states;
- documented desktop/tablet/mobile/boundary viewport widths.

If no authorized browser or role is available, report the limitation rather than claiming visual verification or fabricating screenshots.

## 13. Stage 5 review gate

At the end of frontend scope, provide a module-by-module readiness report with verified/partial/missing/blocked/not-verified status, source and commit links, test/CI links, browser evidence with viewport/role context where available, responsive/accessibility results, known defects, and backend/model dependencies intentionally deferred.

**Do not begin broad Stage 6+ workflow/data/API implementation until the user explicitly approves the frontend structure.** A passing build, a green CI run or an agent-generated report is not a substitute for the user's visual sign-off.

If the user asks for corrections, implement them in scope, repeat affected checks, refresh visual evidence and resubmit for review.

## 14. Required progress/checkpoint fields

After each meaningful slice update the execution checkpoint, structural progress record and relevant gap-register rows with:
- current live main SHA and timestamp;
- official roadmap stage and one bounded view/workspace ID;
- actual structural result and changed paths/commit;
- supporting bug fixes clearly separated from structural changes;
- tests/CI results and links for the exact SHA;
- visual evidence or exact reason it remains unavailable;
- requirements complete/partial/missing/blocked/not verified;
- the next single action in canonical order;
- explicit confirmation that Stage 5 approval is still required.

After a timeout, follow AMS-RESUME-AFTER-INTERRUPTION.md, check whether the previous write/commit succeeded, refresh main and CI, and continue from verified state. Never restart from a stale SHA or ask the user to repaste the task.

## 15. Immediate instruction for the next session

1. Read this document and all required MD documents above.
2. Fetch current main, recent commits and current CI/Quality Gate; reconcile previous work.
3. Verify completed navigation and shell work without rebuilding it from scratch.
4. Continue the Stage 4 main-content structural redesign in canonical module/workspace order, not by selecting arbitrary small defects.
5. For each unfinished view, document the current-vs-target mismatch, then implement the material content-hierarchy correction in one bounded slice.
6. Test, commit directly to main when authorized, record exact evidence and continue to the next authorized structural slice.
7. Finish Stage 5 visual review and stop for the user's explicit frontend approval before broad backend/workflow stages.

This is an execution specification, not another planning-only request. Do not claim completion until source, behavior, checks and available rendered evidence show that the view meets its contract.
