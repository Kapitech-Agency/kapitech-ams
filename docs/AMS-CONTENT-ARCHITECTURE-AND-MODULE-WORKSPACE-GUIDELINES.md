# AMS Content Architecture & Module Workspace Guidelines

Purpose: make the primary content area of every Kapitech AMS module easy to understand, task-oriented, and consistent with the user-provided Dashboard reference without forcing every module into one dashboard template.

Scope: frontend UX/UI and content presentation only. This guide does not authorize backend, API, database, authentication, authorization-policy, or business-rule changes.

## 1. Source of truth

Follow the user's latest explicit instruction and repository rules in AGENTS.md. AMS-DESIGN-SYSTEM.md is the authority for tokens, typography, spacing, component geometry, theme, motion, and accessibility. The AMS master structure guide defines product, module and workflow ownership. The Navigation IA defines approved destinations and navigation depth. The End-to-End Delivery Roadmap owns the overall stage sequence. `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` is the canonical target for per-workspace main-content composition, required relative region order, and structural acceptance. This guide defines the shared page anatomy and high-level module priorities; it does not override that per-workspace target. `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md` defines role-aware content and presentation, while `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md` defines persona-specific emphasis and defaults. The Feature & Content Gap Register records evidence-backed implementation availability and does not make target-only features available.

Inspect current source code and tests before implementing anything. Requirements describe the target, not proof that a feature exists. Report conflicts rather than silently inventing a new rule.

The provided Dashboard screenshot is a structural reference for hierarchy, information density, clear working areas, and useful supporting panels. It is not permission to copy example values, names, fake data, exact KPI counts, or identical page composition across unrelated modules.

## 2. Primary UX objective

Every page should quickly answer:
1. Where am I?
2. What is this page for?
3. What information matters most?
4. What can I do next?
5. If I cannot proceed, why, and what is the safe next step?

A page is not clear just because it has cards, tabs, and a polished color scheme. Its information order, primary work area, and supported actions must be obvious.

Core principles:
- Task first. Build around the user's primary job.
- One dominant working area. The main queue, register, board, report, or editor should own the page.
- Purposeful density. Prefer clear grouping, alignment, and readable type to empty layouts or cramped content.
- Progressive disclosure. Keep key identity, state, and next action visible; put secondary details in appropriate detail views.
- Context before interpretation. Values need clear labels and relevant period, unit, currency, source, status, and freshness.
- Real actions only. A visible control must lead to a supported action and truthful outcome.
- Shared patterns, suitable composition. Modules share AMS visual and interaction patterns but not an identical arrangement of cards.
- Truthful data states. Zero, empty, no filter matches, unavailable data, stale data, access denial, and request failure must not be conflated.
- Reuse before replacement. Extend existing shared primitives and route owners rather than creating duplicate components.

## 3. Canonical page anatomy

Use this as a decision framework. Do not force every item onto every page.

### 3.1 Module header
- Use one module header, normally the existing AdminModuleHeader.
- Show the module/view name and a concise explanation only when useful.
- Place primary and genuinely global actions in the header action area.
- Never repeat the same title or description below a selected tab.
- Align header, tabs, controls, content, tables, and empty states to the same page gutter.
- At narrow widths, actions may wrap or use an existing compact layout, but must not clip.

### 3.2 Contextual navigation
- Reuse established workspace navigation, AdminTopbarTabs, and AdminSectionTabs patterns where appropriate.
- Keep module-owned views within their owning workspace.
- URL/query state, selected tab, browser history, and active state must agree.
- Do not create duplicate destinations under different labels or a second tab row that repeats the same choices.
- When primary workspace tabs and secondary worksheets both exist, make their hierarchy clear.
- Use this hierarchy consistently: primary module → workspace → worksheet/filter/saved view → selected record detail. Worksheets, statuses and saved views stay inside their workspace; do not promote every item into the sidebar.
- Limit persistent navigation to the primary module and its current workspace. Do not add another global navigation layer for record details.
- Use breadcrumbs selectively for deep records when ancestor context helps the user orient or return. Show valid parent links (for example, Projects → Project Registry) and let the record title identify the current page. Do not repeat the current title in both breadcrumb and page heading. Skip breadcrumbs on obvious roots and primary tabs. At narrow widths, collapse the path or use a clear back-to-parent control.
- Preserve route ownership and role-visible navigation. Do not change authorization policy.

### 3.3 Page-level controls
- Place reporting period, search, filters, sorting, and view controls near the data they affect.
- Show the actual selected period/value instead of a generic “Filter” label when possible.
- Do not imply a reporting period changes data it does not govern.
- Group controls by purpose, show active filters, and make clearing them straightforward.
- Avoid a large standalone toolbar card when simple inline controls fit the existing design system.
- On narrow screens, controls must wrap or use an accessible compact pattern rather than disappear.

### 3.4 Summary metrics
- Use KPI cards only when they help the user understand operational state or make a decision.
- Do not reuse the same KPI set in unrelated modules.
- Keep label, value, unit, period, and status context unambiguous.
- Use tabular numerals for counts, amounts, percentages, and timestamps.
- Avoid decorative, duplicated, unexplained, or non-actionable metrics.
- Do not put KPI strips above every table, form, or queue. Task views should usually bring the working area into view quickly.
- Never use hardcoded/fixture values to make a screen look populated.
- Never infer zero from a missing or unavailable source.

### 3.5 Primary working area
Choose a format that matches the job:
- Register/directory: searchable, sortable, filterable table/list with clear row identity, status, and actions.
- Queue: work ordered by meaningful priority, with owner, status, due date/SLA, and next action when supported.
- Board: clear stages, usable task cards, and a keyboard/non-drag alternative for essential actions.
- Analytical view: chart/report with period, labels, legend, units, context, and drill-down where available.
- Detail workspace: identity/status first, then related sections and history in a readable hierarchy.
- Editor: grouped fields, visible validation, logical tab order, and shared drawer/save/cancel behavior.
- Settings: grouped controls with clear current state, explanation, and supported apply/save actions.

Do not let banners, decorative charts, oversized KPI strips, or duplicate action areas visually compete with the primary working area.

### 3.6 Supporting context
- Use supporting panels only when they help the primary workflow, such as recent activity, deadlines, risk, related records, or quick actions.
- Keep supporting content visually subordinate.
- Use two columns only while both areas remain readable; stack supporting panels at compact widths.
- Quick actions must lead to real supported destinations/actions.
- Activity items should distinguish event type, summary, timestamp, and outcome.

## 4. Module-specific content hierarchy

These are intended UX priorities, not claims that every target feature is implemented. Verify actual code and the master structure guide before changing any view.

### Dashboard
Primary question: what needs attention across operations, and how is the business performing?
- Source-backed, decision-relevant KPIs; meaningful trends; portfolio/delivery health; exceptions; recent activity; drill-downs.
- Keep metrics distinct: issued invoice value, cash collected, revenue, expenses, profit, receivables, and account balances are not interchangeable.
- Label provisional/live-period values and unavailable history accurately.
- Avoid charts that exist only to fill empty space.

### Inbox
Primary question: which message or request should I handle next?
- Message/request queue as the primary area, with search and useful operational filters.
- Selected conversation details in a clear split pane/detail workspace when appropriate.
- Sender/source, summary, status, priority, owner, and due date should be scannable.
- Preserve supported notes, attachments, conversation history, linked records, follow-up, resolution, and archive actions.
- Job applicants belong in Website CMS → Careers → Applicants, not Inbox.
- Distinguish empty inbox, no matching filters, and source error.

### Projects
Primary question: what is in progress, overdue, blocked, or at risk?

Use seven workspaces, each with one clear job:
- **Overview:** source-backed portfolio context and exceptions; not a duplicate full register.
- **Project Registry:** one canonical project list. Planning, Active, On Hold, Completed and Archived are filters/saved views.
- **Tasks & Execution:** Board/Kanban, List, My Tasks, Task Lists and Dependencies over shared task records.
- **Planning & Delivery:** brief, scope/deliverables, milestones, timeline, deliverable tracking, QA, client review and revisions.
- **Content & Campaigns:** calendar, planning/briefs, production, assets/versions, reviews, publishing schedule/status and campaign tracking.
- **Project Resources:** assigned team, assignments and workload from Team & Resources.
- **Project Controls:** changes, risks/issues/blockers, budget/health, reports and closure.

Link project files to Documents and show financial values from Finance. Do not create duplicate file stores, budget ledgers, or separate records for alternate views. Keep delivery progress distinct from cost. Do not bury the working area under excessive KPI cards, and retain supported keyboard alternatives and existing lifecycle behavior.

### Clients
Primary question: what is the relationship state, and what needs to happen next?

Use four workspaces:
- **Directory:** one canonical client/company/contact directory; Companies and Contacts are views/filters. Client 360° is selected-record context, not another master directory.
- **Onboarding:** checklist, required documents and kickoff readiness linked to canonical records.
- **Agreements:** contracts/SOWs, retainers/service commitments, renewal schedule and contract history.
- **Service & Health:** SLA, issues/feedback, client health and service history.

Client Requests and message threads remain owned by Inbox; Clients may display linked context but must not create a competing queue/status system. Finance owns quotations, invoices, payments and accounting. Use shared drawers and preserve canonical record relationships/permissions.

### Finance
Primary question: what is the financial position for the selected period, and which transaction/control needs attention?

Primary tabs:
- Overview & Control
- Transactions & Cash
- Receivables & Payables
- Project Finance
- Accounting & Reports

Each tab needs its own purpose-built register/report/control, not a copy of the Overview KPI dashboard.
- Overview & Control: financial position, controls, exceptions, and drill-downs.
- Transactions & Cash: transactions, cash/bank movements, account selection, and reconciliation context.
- Receivables & Payables: invoice balances, due dates, payment status, payables, and supported quotation access.
- Project Finance: budgets, invoices, receipts, recorded costs, and properly defined profitability values where available/authorized.
- Accounting & Reports: journals, registers, P&L, cash flow, balance sheet, monthly closing, and reports supported by the current application.

Keep secondary worksheets subordinate to primary navigation. Do not label cash movement proxies as reconciled balances, issued invoices as cash collected, or differences as posted profit unless existing rules support that meaning. Do not change accounting calculations, postings, maker-checker, period locks, permissions, or data sources in a UI-only task. Missing data must not be replaced by fixtures or zero.

### Team & Resources
Primary question: who is available, accountable, or overloaded?
- Keep four workspaces: Team & Capacity, People Operations, Vendors & Freelancers, and Time Tracking.
- Team Directory owns the canonical team-member identity/work profile. People Operations links employment lifecycle, leave, training and performance details to the same person; do not create a second Employee Directory.
- Vendors & Freelancers owns the canonical supplier/provider record; Finance references it for vendor-related financial activity.
- Surface role/type, assignments, availability, workload and status where supported. Distinguish measured capacity from unavailable data, keep time records legible, and preserve role visibility and confidential cost access.

### Documents
Primary question: can I find the right document and understand its ownership and access?
- Use one canonical **Document Library** workspace with search and metadata/category filters.
- SOPs & Policies, Legal & Corporate, Finance & Tax, HR & People, Security & Infrastructure, and Project & Client Files are categories/filters/saved views, not separate workspace destinations.
- Avoid redundant Overview and All Documents pages that lead to the same register.
- Show identity, related record, type/category, date, status and access context where available.
- Use existing secure flows, never expose/construct storage URLs, and make upload state/per-file failure clear. Keep empty, source-unavailable and access-denied states distinct.

### Website CMS
Primary question: which content item am I managing, and what is its publication state?
- Use content-type workspaces for Case Studies, Services, Insights, Testimonials and Careers, with relevant filters inside each.
- CMS Overview is only useful as a genuinely cross-content publishing/status summary. It must not duplicate a content register or point to Case Studies.
- Careers has internal Jobs, Applicants and Recruitment History worksheets/tabs; they are not global/sidebar workspaces. Keep job openings distinct from applicant review and preserve the correct applicant/files/notes/status association.
- Use shared drawers for create/edit workflows, including bilingual content. Keep publication state, public visibility and confirmed save outcome clear. Do not invent records to improve visual density.

### Settings
Primary question: which system setting/security control am I reviewing, and what happens if I change it?
- Group configuration/system status, Users & Access, Audit Log and Integrations by purpose.
- Keep integration-specific sections (status, environment, account mapping, sync/diagnostics, audit) inside the selected integration workspace, not as an extra persistent navigation layer.
- Keep Preferences within a relevant settings surface unless a distinct route, permission boundary and workflow justify a separate workspace.
- Show current state, concise explanation, validation and supported actions. Retain confirmation/authorization for sensitive operations. Do not expose secrets or weaken MFA, access controls, backups, audit, or security behavior in a UI-only task.

## 5. Shared visual and interaction rules

- Visual dimensions and variants are owned exclusively by `AMS-DESIGN-SYSTEM.md`, including its canonical spacing relationship map, component size contract, responsive transformation matrix and WCAG 2.2 AA target. This document defines content composition, not alternative pixel values.
- Build each workspace as a clear information hierarchy with task-appropriate density. Do not force every module into the same grid/card recipe; reuse the same tokens, type roles and shared component variants.
- Group tightly related elements; use the prescribed spacing relationships rather than manual margins. Outer page gutter, section rhythm, card padding, control gaps, and overlay geometry must each have one owner.
- Content must remain understandable at 200% text resize and a 320 CSS px layout width. Keep tables/boards as contained horizontal-scroll regions when two-dimensional structure is essential; do not create page-wide horizontal scrolling.

- Follow AMS-DESIGN-SYSTEM.md for all tokens, colors, fonts, spacing, radii, states, and sizes.
- Crimson is a restrained brand/primary accent. Use semantic success, warning, danger, and info colors for operational states.
- AdminPageShell owns outer page padding. Never add a second gutter, negative-margin workaround, or page-specific shell padding.
- Reuse existing header, navigation, panels, table shells, status badges, buttons, Skeleton, chart, Drawer, Modal, and ConfirmDialog components as appropriate.
- Do not create parallel design primitives, new icon stacks, new chart libraries, or a second theme.
- Use sentence case and tabular numerals.
- Do not shrink essential labels, field descriptions, statuses, deadlines, record identity, or financial values below the design system's legible scale to fit more information.
- Keep one clear primary action per working region; use existing secondary/ghost hierarchy for other actions.
- Trace actual usage before removing CSS or UI as legacy. Verify consumers and affected views first.

## 6. Responsive acceptance

Use the canonical viewport matrix from `AMS-DESIGN-SYSTEM.md`: 1440, 1280, 1100, 1024, 900, 899, 768, 600, 599, 390 and 320 CSS px; validate relevant breakpoint edges and text resize/reflow. The matrix describes acceptance, not permission to create local breakpoints.

Check 1440px, 1024px, 768px, and 390px, and 320px when practical.
- Required authorized views remain reachable below the navigation breakpoint.
- Keep one consistent gutter across headers, tabs, controls, content, tables, and empty states.
- At compact widths, stack secondary content rather than compressing two unreadable columns.
- Tables may scroll horizontally when needed, but scrolling must be usable and important identity/status/actions remain discoverable.
- Verify mobile topbar controls do not collide or clip.
- Touch targets, forms, drawer actions, and safe areas remain usable.
- Essential information is not hover-only.
- Respect reduced-motion preferences and avoid unpausable auto-rotation without a clear need.

## 7. Required state and interaction review

| State | UX requirement |
|---|---|
| Loading | Existing skeleton patterns; no simulated records. |
| Populated | Source-backed values and supported actions. |
| Empty | Explain what belongs here; offer an action only when supported. |
| No matches | Say filters returned no matches and allow clearing them. |
| Partial/unavailable | Identify affected sources and interpretation limits. |
| Stale | Indicate freshness limits where known and follow existing behavior. |
| Error | Explain what failed and the next safe action; no internal stack trace. |
| Restricted | Existing access-denied behavior without exposing restricted data. |
| Pending | Prevent conflicting duplicate submission; preserve unsaved work as required. |
| Success | Show only when the established flow confirms the outcome. |

Every control needs a clear label, keyboard behavior, pending/error feedback, and real outcome. Keep URL and active-tab state aligned. Follow drawer/modal guides for focus, Escape, focus restoration, confirmations, and stacked overlays.

## 8. Strict frontend-only boundary

Allowed:
- Reorganize current frontend content hierarchy, layout, typography, and responsive behavior.
- Reuse/refine current frontend presentation components and state display.
- Correct UI-only active-tab presentation when authorization and business rules remain unchanged.
- Improve labels, grouping, accessibility, and existing loading/empty/error states.
- Add targeted frontend UI regression tests.
- Remove styling only after proving it is unused and checking affected views.
- Update frontend UX documentation.

Not allowed without later explicit authorization:
- Backend/server/API implementation or contract changes.
- Database/schema/migration/persistence/seed/data-source changes.
- Authentication/session/CSRF/MFA, RBAC, authorization-policy, or security changes.
- Financial/accounting formulas, posting, payment, reconciliation, period locks, or canonical data changes.
- Notification/external integration changes.
- New dependencies, frameworks, chart/icon stacks, or fake/demo records.

If a UI issue requires a protected change, leave that layer untouched. Improve the safe presentation and document the blocker.

## 9. Implementation and definition of done

Follow docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md.

1. Record branch, HEAD, working-tree state, baseline CI, and existing UX/UI work. Preserve unrelated changes.
2. Inspect actual source and inventory every module and subtab.
3. Map each view to its primary user question, work-area type, content order, shared components, confirmed issues, and responsive/test coverage.
4. Group changes by root cause; fix shared hierarchy before local polish where practical.
5. Implement one bounded frontend slice at a time and report after each slice.
6. Verify touched views and sibling tabs, URLs, actions, states, and responsive layouts.
7. Run applicable checks and targeted frontend regression tests. Do not edit backend files/tests to make frontend checks pass.
8. Review the complete diff to confirm the protected boundary was respected.

A view is ready only when its purpose/next action are clear, the main work area is dominant, tabs and URLs agree, shared tokens/components are used, important text is legible, applicable states are truthful, responsive layouts are checked, and validation is reported honestly. A passing build alone does not prove UX quality.

## 10. Related documents

- AGENTS.md
- AMS-DESIGN-SYSTEM.md
- docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md
- docs/AMS-UX-INTERACTION-STANDARDS.md
- docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md
- docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md
- docs/architecture/ams-navigation-information-architecture.md
- docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md
- docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md
- docs/AMS-DRAWER-GUIDELINES.md
- docs/AMS-MODAL-GUIDELINES.md
- docs/AMS-KANBAN-GUIDELINES.md
- docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md
