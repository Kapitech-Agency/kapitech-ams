# AI Execution Prompt: AMS Content-First UX/UI Clarity Upgrade (Frontend Only)

> **Execution-order authority:** For the current end-to-end initiative, use [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md) and [AMS End-to-End Execution Prompt](AMS-END-TO-END-EXECUTION-PROMPT.md). This document defines the general frontend visual/content scope during the roadmap's visual stages; it does not define a competing overall schedule and does not authorize backend or workflow changes on its own. For the specific Stage 4 structural-redesign task, use [AMS Frontend Structural Redesign Execution Prompt](AMS-FRONTEND-STRUCTURAL-REDESIGN-EXECUTION-PROMPT.md) as the focused operating prompt and [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md) as the canonical per-workspace content target. This general prompt's shared design and frontend safeguards still apply.

Act as the senior frontend UX/UI engineer for Kapitech Agency Management System. Execute an evidence-based redesign of the primary content area of all existing AMS modules and their actual subtabs, following the user's Dashboard screenshot as the layout reference.

Repository: Kapitech-Agency/kapitech-ams  
Production branch: main  
Objective: make every page clear, task-oriented, readable, and visually consistent.  
Scope: frontend UX/UI only. This is an execution task, not a request to stop after an audit.

## Mandatory structural-redesign specification

Before auditing or editing page main content, read [AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md](AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md) in full. Its per-view contract, source audit findings, structural-vs-local-fix definition, module targets, frontend-stage order, and completion evidence are mandatory. Do not chase minor component gaps while the selected workspace's structural acceptance criteria remain unmet.

## 1. Read these documents first

Read in full:
1. AGENTS.md
2. AMS-DESIGN-SYSTEM.md
3. docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md
4. docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md
5. docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md
6. docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md
7. docs/AMS-UX-INTERACTION-STANDARDS.md
8. docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md
9. docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md
10. Relevant Drawer, Modal, Kanban, Finance, navigation architecture, and regression guides for touched views.

Use actual code and tests as evidence. A target-state guide or route does not prove the feature is implemented.

## 2. Hard boundary: do not touch backend

Do not edit server.ts, server/, API route/service/repository implementations, API contracts, db/, SQL, migrations, schemas, persistence, data source, seed/demo records, or backend tests.

Do not edit authentication, session, CSRF, MFA/TOTP, RBAC/authorization policy, encryption, audit, backups, notifications/integrations, Finance calculations, journal posting, payment flows, bank reconciliation, period locks, maker-checker controls, or canonical data relationships.

Do not add dependencies or replace the current React/Tailwind/icon/motion/chart system.

Allowed: frontend layout, hierarchy, existing UI components/styles, readable labels, responsive behavior, accessible interaction states, presentation-only tab state that does not alter access policy, and focused frontend regression tests.

If a UX/UI issue appears to require a protected change, do not make it. Keep current behavior, present the state truthfully, and report the exact blocker.

## 3. Design target and rules

### Global design specification (mandatory)

- `AMS-DESIGN-SYSTEM.md`, especially section 2.7, is the single source of truth for spacing relationships, page gutters, component sizes, type roles, radius, breakpoints, interaction targets and visual states.
- Do not invent CSS pixel values, one-off margins/paddings, new breakpoints, radii, z-index values or component variants. Use existing tokens/shared primitives and named variants. If a required rule is missing or conflicts with current source, document the gap and propose one central specification correction before implementation.
- Target WCAG 2.2 Level AA and use WAI-ARIA APG patterns where composite widget behavior is needed. Verify contrast, keyboard, focus, semantic labels, zoom/reflow, non-color cues and reduced motion; do not claim conformance based on build success alone.
- Use canonical viewport widths and breakpoint-edge checks listed in the Design System. At minimum, touched screens must be inspected at desktop, tablet and mobile widths and at 320 CSS px reflow; check 200% text resize.
- This task is documentation/reference-aware: design values describe the desired system. Do not claim the current code already matches until the relevant source and rendered behavior have been checked.

Use the user-provided Dashboard screenshot as a structural reference for:
- one clear page header and purpose;
- clear contextual navigation and selected state;
- appropriate proportions between summary, primary work area, and supporting context;
- readable status, dates, labels and financial values;
- useful information density and clear action hierarchy;
- restrained dark AMS styling.

Do not copy example names/values or force every module to use the same KPI count or card layout. Keep each primary working area dominant.

Follow AMS-DESIGN-SYSTEM.md for exact tokens, type scale, spacing, components, themes and motion. Reuse existing AdminPageShell, AdminModuleHeader, contextual navigation primitives, panels, tables, status badges, buttons, Skeleton, charts, Drawer, Modal and ConfirmDialog.

AdminPageShell owns the outer gutter. No nested page padding or negative margin hacks. One module header only. URL/query state, tab state and browser history must agree. Use sentence case, tabular numerals and meaningful status colors. Never shrink important text to fit more columns. Do not add inert actions, fake cards, unsupported capability, or fake/demo data.

## 4. Expected composition by module

Confirm actual routes/views before changes. Follow the module content architecture guideline.

- Dashboard: source-backed decision-oriented KPIs, meaningful trends, portfolio/delivery health, exceptions, recent activity and drill-downs. Distinguish issued invoices, cash collected, revenue, costs, profit, receivables and balances.
- Inbox: queue and filters are primary, with message/conversation detail, owner, priority, due date, notes and supported actions. Careers applicants remain in CMS.
- Projects: portfolio/list/board is primary. Keep project/client, stage, owner, deadline, progress, health, milestones and costs clear. Delivery progress is not a cost estimate.
- Clients: directory first on directory views; organized relationship details, interactions, projects, contracts, retainer and SLA workspaces.
- Finance: five primary workspaces: Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, Accounting & Reports. Each one must present its own relevant register/report/control instead of cloning the Overview KPI dashboard.
- Team & Resources: clear directory, capacity, vendors/freelancers, skills and time-tracking subareas.
- Documents: searchable document register with relevant metadata and secure supported actions.
- Website CMS: content-type-specific registers/editors, publication state, shared drawer patterns; distinguish Careers jobs from applicants.
- Settings: grouped configuration and system-state controls with clear impact and existing confirmation/permission behavior.

> **Mandatory sequencing rule:** Follow the canonical [End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md). This frontend-only prompt covers the navigation, shared-shell, content-gap/design, main-content and visual QA work in the roadmap's visual stages. Carry forward prior verified work; report each meaningful slice with evidence and continue to the next planned visual slice when safe. Obtain explicit user sign-off at the roadmap's visual acceptance gate before broad functional workflow implementation. Do not expand this document's frontend-only permission into backend, database, security-policy or business-rule changes.

## 5. Work phases: execute sequentially

Use docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md. Report durable progress after each phase/slice and continue, except where a true blocker, ambiguity, destructive action, or protected-scope decision requires input.

### Phase 0: Establish a safe baseline
- Confirm repo, branch, HEAD, working-tree state, latest commits, and CI status.
- Preserve unrelated in-progress/user changes.
- Identify existing UX/UI work and do not duplicate it.
- Do not merge incomplete or unverified work.

### Phase 1: Audit every module/view
Inventory each actual module/subtab, including Dashboard, Inbox, Projects/Tasks, Clients/Onboarding/Retainers/SLA, all Finance tabs and secondary workspaces, Team/Capacity/Vendors/Time, Documents, every CMS content type and Careers Applicants, and Settings.

For each view record:
- primary user question and main task;
- main work area and correct content order;
- header/nav owner and URL/query state;
- confirmed hierarchy, typography, overflow, alignment, redundant control, table, board, drawer/modal, empty/unavailable/error-state issues;
- existing shared primitives to use;
- protected-layer dependencies;
- expected responsive and regression checks.

Do not infer features from documentation alone.

### Phase 2: Build a change map
Create a concise view-by-view matrix with current state, confirmed problem, intended hierarchy, shared primitive, specific frontend-only change, and verification plan. Group repeated defects by root cause. Shared shell/header/gutter/tab consistency should normally be addressed before local polish.

### Phase 3: Implement bounded slices
Recommended sequence, adjusted based on actual dependencies:
1. Shared shell, header, navigation placement, gutter consistency, tab-switch stability, reporting-period presentation.
2. Dashboard information hierarchy, graph context/legend, supporting panels and responsive layout.
3. Inbox queue/detail hierarchy and useful states.
4. Projects/Tasks portfolio, board/table, detail drawers and card readability.
5. Clients directory/detail/relationship views.
6. Finance primary workspace hierarchy, worksheet navigation, report period, register/table clarity, and truthful source-state presentation.
7. Team & Resources, Documents, Website CMS/Careers, Settings.
8. Shared drawers, modal/confirmation behavior, typography, UI cleanup, accessibility and responsive regression.

For each slice:
- State scope and objective.
- Inspect shared component consumers and route owners.
- Make the smallest coherent frontend-only change.
- Do not change API/data/security/business behavior.
- Verify the changed view plus neighboring views/tabs and URL active state.
- Report affected files, visible behavior and validation before proceeding.

Do not conduct an indiscriminate rewrite of entire pages or CSS. Remove legacy UI/CSS only after proving it is unused and checking every affected consumer.

### Phase 4: Visual and interaction regression
Check 1440px, 1024px, 768px, 390px, and 320px where practical. For every affected view validate:
- all authorized tabs remain reachable and route/query/active state agrees;
- one header and one page gutter; no abrupt shifts or duplicate toolbars;
- no clipping, overlapping actions, disappearing controls, unreadable text, or unintended page-wide horizontal scroll;
- primary work area remains dominant, secondary panels stack appropriately;
- table identity/status/actions remain discoverable, with deliberate horizontal scrolling when needed;
- drawer/modal focus, Escape, focus restoration, unsaved changes, confirmations and safe-area behavior comply with existing guides;
- keyboard use and reduced-motion behavior remain usable;
- loading, populated, empty, no-match, partial/unavailable/stale, error, restricted, pending and success states are truthful;
- English/Indonesian text remains usable where the app supports language switching;
- existing API/data/permissions/calculations are unchanged and no fixtures were introduced.

Do not claim a screen/interaction/viewport was tested unless it was actually tested. If live login is unavailable, clearly mark live visual tests as unverified and distinguish source/test evidence.

### Phase 5: Validate
Run applicable repository checks:
- npm run lint
- npm run build
- targeted frontend/navigation/module regression tests for touched views
- broader existing tests if safely available in the environment.

Do not edit backend files or backend tests to make frontend validation pass. Record exact commands and results. Fix frontend-only regressions where in scope, then rerun the affected checks.

### Phase 6: Final diff and delivery
Review the complete diff and ensure no backend/API/database/auth/RBAC/financial calculation/integration/dependency changes slipped in. Summarize changed files, behavior improved, checks actually run, test outcomes, unverified states, and blockers. Follow the repository's existing branch and delivery policy. Never claim complete if UI interaction or validation remains unverified.

## 6. Forbidden shortcuts

- Do not stop after the audit; continue through frontend-only implementation.
- Do not merely recolor the old layout while leaving the content hierarchy unclear.
- Do not copy the Dashboard layout onto all modules.
- Do not fill gaps with meaningless cards or invented values.
- Do not put oversized KPI strips above every register, queue, form or editor.
- Do not create repeated headers, duplicate actions, duplicate destinations or parallel primitives.
- Do not use tiny text to force too many columns onto a screen.
- Do not modify protected backend/business logic to fix a UI symptom.
- Do not delete CSS without evidence and regression checks.
- Do not report a build as proof that UX is good.
- Do not silently skip a module or subtab.
- Do not use one generic content layout for every role. Read the role-based blueprint and worksheet matrix, and verify actual permissions before adapting content. Role-aware presentation can prioritize authorized information but must not grant access or change data/business meaning.

## 7. Required stage report

Stage: [number/name]  
Scope: [module/view]  
Finding: [confirmed root cause]  
Frontend changes: [files and user-visible result]  
Protected boundary: [diff-reviewed confirmation of no backend/API/database/auth/RBAC/business calculation changes]  
Validation: [commands, viewports, interactions actually tested, with results]  
Remaining: [gaps and blockers]  
Resume point: [next concrete action]

Start with Phase 0, finish the inventory and change map, then execute all safe UI-only slices in order. Request clarification only for a genuine ambiguity or a change that crosses the protected boundary.
