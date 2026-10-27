# AMS Main-Content Restructuring Specification

**Product:** Kapitech Agency Management System (AMS)  
**Primary stage:** Stage 4 — Main-content hierarchy across all nine modules  
**Status:** Mandatory target specification; implementation must be proven with source, test and runtime evidence  
**Last updated:** 25 October 2026  
**Authority:** Master Structure and Navigation IA define product ownership and approved navigation; this document defines the target main-content composition and relative region order for each workspace; the Role-Based Content Blueprint and Worksheet Role Presentation Matrix refine role-aware content; AMS-DESIGN-SYSTEM.md defines visual tokens/geometry; the End-to-End Delivery Roadmap defines stage order. The Feature & Content Gap Register records verified implementation status, not a competing target.

> **This is a structural overhaul, not a cosmetic revision.** Re-derive each page from Kapitech's real agency tasks, canonical records, user decisions and role needs. Rebuild the content hierarchy and main working area if the current structure is wrong. Do not preserve an unsuitable layout simply because it already exists. Preserve correct data sources, routes, supported business behavior, permissions, accounting logic and security boundaries.

## 1. Purpose and non-negotiable outcomes

Kapitech is a Creative & IT Development Agency. AMS is the operational workspace for client relationships, incoming requests, creative and technical delivery, planning, team/vendor capacity, time, agency finance, documents, website publishing and system administration. It is not a generic SaaS dashboard and not nine copies of a KPI-card layout.

Every page must make clear:
1. Where am I, and what is this view responsible for?
2. What is the main task or decision?
3. Which record, period, client, project or status is in scope?
4. What needs attention and why?
5. Which data is authoritative/current and permitted for my role?
6. Which actions are actually available, and what will each do?
7. What does an empty, unavailable, failed, pending or confirmed state mean?

### Structural overhaul means
- Start with the user task, not the current JSX/tree.
- Define the primary question, primary work surface, ordered hierarchy, data semantics, actions and states before coding.
- Reorder, regroup, separate, remove or replace entire regions when needed.
- Choose the right surface: register, queue, board, editor, timeline/calendar, report, detail or settings group. Alternate modes must use the same canonical data.
- Make the actual work surface dominant. Place register search/filter/sort before a long register. Put summary indicators first only when they are needed to interpret or choose an action.
- Rebuild each unfinished workspace individually; a shared component change does not complete all consuming pages.
- Specify error/recovery, empty, filtered-empty, stale/unavailable, restricted, pending and success behavior where applicable.
- Include breadcrumb as an explicit cross-cutting requirement on eligible deep-detail pages, not as a global bar.
- Retest neighboring views affected by shared components.

### These are not a redesign
- Moving the same KPI strip above/below a register without rethinking why the content exists.
- Tweaking colors/padding or converting everything to cards while preserving a broken hierarchy.
- Applying the same Dashboard pattern to financial reports, CMS editors, task boards and audit logs.
- Adding decorative metrics/charts, sample data, fake states, fake success or zeroes for missing values.
- Creating new top-level modules for worksheets/records, CRM, Proposal/Quotation or generic Approval.
- Opportunistically changing backend/API/schema/authentication/RBAC/financial rules in Stage 4.
- Claiming visual quality/accessibility because CI passes.

## 2. Authority and global usability standards

Read and apply these repository contracts together:
- [Master Structure](AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md): module/workspace responsibility and domain boundaries.
- [Navigation IA](architecture/ams-navigation-information-architecture.md): routes, approved navigation and breadcrumb policy.
- [AMS Design System](../AMS-DESIGN-SYSTEM.md): exact layout/tokens, shared variants, responsive rules and accessibility target.
- [Role-Based Main Content Blueprint](AMS-ROLE-BASED-CONTENT-BLUEPRINT.md): role-appropriate default presentation.
- [Worksheet Role Presentation Matrix](AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md): fields, persona emphasis and presentation per worksheet.
- [Content Architecture Guidelines](AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md): page/workspace content hierarchy.
- [Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md): requirement states/evidence.
- [Stage-by-Stage Execution Checklist](AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md): implementation stages and exit gates.

External evaluation baselines:
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), target Level AA: contrast, keyboard operation, resize/reflow, focus, semantic relationships and target size.
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/): established widget interaction behavior; prefer semantic HTML/native controls.
- [ISO 9241-110:2020](https://www.iso.org/standard/75258.html): task suitability, self-descriptiveness, predictable conventions, learnability, controllability and error handling.
- [Nielsen Norman Group — Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/): finding records, comparing data, inspecting/editing a record and performing row actions.

These references are acceptance baselines, not proof of compliance. The AMS Design System remains the authority for local geometry. Record the exact views, widths, interactions and accessibility checks actually tested.

### 2.1 External UI references are comparative input, not design authority

The user-provided `shadcn-admin-main` archive was reviewed as a historical comparative admin-interface example. It is not a replacement template for AMS. The same rule applies to third-party admin starters, screenshots, component galleries and other visual references.

**Current selected visual/component reference:** the user selected [Maven Finance Management by Orbix Studio](https://www.orbix.studio/case-studies/maven-finance-management) on 26 October 2026. Use Maven as the primary reference for visual information hierarchy, concise cards, data visualization, operational rows, and low-friction interaction patterns across AMS. Do not copy its brand colors, mobile product architecture, financial assumptions, or feature set. The production Dashboard screenshot remains a supplementary layout comparator only where it agrees with the latest approved workspace composition. The authority split is explicit: this specification §4.10 controls content order; `docs/AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md` controls component content and interaction contracts; `AMS-DESIGN-SYSTEM.md` controls Kapitech tokens and geometry; current source/domain contracts control data and actions.

**Patterns worth evaluating only when they solve the selected Kapitech task**
- A clear page identity and purpose, with a visible hierarchy between the main work surface and secondary context.
- Filters, period scope and primary actions placed directly with the register, queue, report or editor they control.
- Readable register/table density, recognizable record identity, relevant status/owner/deadline context and understandable row actions.
- Predictable workspace navigation and active state, coherent forms/validation, honest loading/empty/error feedback, responsive behavior and keyboard interaction.
- Reusable patterns where the user task and behavior are genuinely the same, without forcing identical page layouts across modules.

**Do not transfer from the reference**
- Demo records, placeholder names/content, generated metrics, sample numbers, decorative charts or generic SaaS KPI/bento layouts that do not support the selected task.
- Brand styling, theme/tokens, navigation taxonomy, route structure, page/workspace ownership, data model, workflow assumptions or permission model.
- Starter architecture or dependency choices wholesale. Do not add shadcn, Radix or another component/chart system merely to reproduce visual parity; the existing AMS stack and shared primitives remain the baseline.

**Required adoption gate before implementation**
1. State the selected workspace's primary user task and decision.
2. Identify the specific reference pattern and the usability problem it appears to solve.
3. Map that pattern to canonical AMS records, source-backed fields and currently supported actions.
4. Check it against the Master Structure, Navigation IA, this specification's per-workspace content contract, AMS Design System, role-based presentation rules and relevant domain/security contracts.
5. Record whether the pattern is adopted, adapted or rejected and why. Reject it if it only adds visual resemblance, complexity or decoration, or changes route/record ownership, data meaning, access or an established workflow.

The before/after content-order sketch must still be derived from the actual AMS view and this specification. Visual similarity to a reference is not evidence of structural redesign, implementation completeness, design-system compliance or accessibility conformance. This policy supplements the existing contracts; it does not create a second design system or authorize new dependencies.

## 3. Shared anatomy and surface selection

This is a hierarchy of responsibilities, not a template every page must copy. Render only what supports the task.

1. **Application shell:** approved global topbar and nine-module navigation.
2. **Workspace context:** approved workspace tabs; one active-state owner.
3. **Page identity:** one clear title; a short purpose sentence only when needed; selected-record identity on detail views.
4. **Actions:** primary action and supported secondary/row actions, permission-aware.
5. **Scope/discovery:** period, search, filter, sort, category or view controls relevant to the surface.
6. **Actionable alerts:** real exceptions, overdue items, stale data or configuration errors only when sourced.
7. **Primary work surface:** register, queue, board, editor, report, calendar, detail or settings.
8. **Supporting context:** related records, definitions, history or metrics that help the primary job.
9. **Feedback/recovery:** validation, pending, no-data, filtered-empty, error/retry and confirmed outcome.

| User job | Choose | Avoid |
|---|---|---|
| Understand operational position | A few decision-grade indicators, urgent exceptions, meaningful trends and drill-down | All metrics treated equally; Dashboard as a record master |
| Find/compare/act on records | Search/filter/sort then a clearly identified register with row actions | Decorative KPI strip before the real task; cards that impede comparison |
| Progress work through stages | Status-aware board plus list/keyboard alternative, real blockers and supported actions | Drag-only interaction or fabricated counts |
| Plan dates/dependencies | Timeline/calendar/milestones with date, owner and dependency context | Detached calendar that is disconnected from records and controls |
| Create or edit | Clear record context, related fields grouped logically, inline errors and safe save/cancel | Scattered input cards or unclear primary action |
| Analyze finance/performance | Period/source context, formal values/report, useful comparison and drill-down | Decorative charts, mixed units or false zeroes |
| Inspect a record | Identity, status/actions, core facts, lifecycle/history and links to canonical related records | Duplicating whole modules inside record detail |
| Resolve an exception | Queue with impact, owner, timestamp, source and safe next action | Warning color with no record/action context |
| Configure system | Grouped settings with current state, explanation, authorization and real save feedback | Exposed secrets or implied success before operation finishes |

General requirements:
- The primary surface appears early and dominates.
- Discovery controls precede the register they control.
- Identity, state, deadline/period and comparison fields stay adjacent; numeric values include clear units and consistent alignment.
- Missing, stale, partial and genuine zero are distinct.
- Remove duplicated titles/counts, stacked empty cards, purposeless lines/whitespace and duplicate gutters.
- Maintain one title owner, one page gutter and one primary vertical scroll owner.
- Shared components provide consistency, not identical composition.

## 4. Detailed target structure by module

## 4.1 Dashboard

**Question:** What needs attention across agency operations, and how is Kapitech performing over the selected period?  
**Views:** Overview, Performance, Analytics. Dashboard summarizes canonical sources and is not an independent record store.

### Overview

Use the user-supplied [Fynix AI Finance Management dashboard reference](https://www.behance.net/gallery/234937291/AI-Finance-Management-SaaS-UX-UI-DashboardDesign) for **information design**, not domain copying: a clear headline value, compact related metrics, a meaningful trend, proportional distribution, and concise record/activity lists. Adapt those patterns to Kapitech's canonical finance, project, task, client and audit records. Keep the AMS dark-first design system; do not copy the reference's personal-wallet labels, sample amounts, colors or AI assistant features.

**Required content order**
1. **Header and navigation.** Keep Create invoice/Invoices, New project/Projects and Refresh as permission-aware primary actions. Keep authorized Tasks, Clients and Documents shortcuts visible in the header; do not repeat them as a bottom card. Keep Overview/Performance/Analytics navigation here, without a global Overview date selector. Finance trend/movement and Recorded Time each have their own period control inside their owning card. Performance and Analytics retain their shared reporting controls.
2. **Project delivery + Needs attention.** Start with a short active-project list showing client, status, saved progress (only when recorded) and due date. All/Creative/IT filters must change the project list. Pair this with severity-sorted, source-backed cross-module exceptions and separately sourced Inbox triage. Distinguish a confirmed clear state from unavailable sources.
3. **Task queue + Upcoming deadlines.** The task queue shows actionable tasks, project/client context when recorded, owner, status and due date. Action needed, Review, Overdue, Blocked and Unassigned filters change the actual records. The deadline card shows the 30-day horizon, a proportional overdue/near-term/later bar, All/Overdue/Today–7 days/Days 8–30 filters, and concise date-linked rows. Do not apply a historical reporting period to current open queues.
4. **Finance + Projects portfolio.** Finance uses outstanding receivables as its headline value, an issued-invoice versus eligible-expense line chart, compact cash-received and expense movement bars, and a source-backed quotation follow-up queue with a functional stage filter. Project Portfolio uses Active, Overdue and Open tasks metrics, a donut only when current risk/deadline groups exist, and comparative Creative/IT open-task bars. Keep these current snapshots distinct from historical movement and from cash/profit semantics.
5. **Team workload + Client delivery focus.** Show comparative open-task bars by owner and actual recorded-time values/bars for the selected reporting period. Sort client groups by saved overdue commitments/tasks, blocked and unassigned work, review tasks and nearest upcoming commitment. Do not present task counts as utilization or invent a client-health score.
6. **Recent activity.** Use a compact audit-style record list with event, actor, timestamp and severity/outcome where supplied. Only make an event clickable when an authorized canonical destination exists. This is lower-priority context, not the task queue.

**Pattern-to-workspace mapping**
- Headline balance and compact metrics map to outstanding receivables and current Active/Overdue/Open-task counts.
- Cashflow trend maps to the source-backed issued-invoice/eligible-expense comparison; a simple difference is not posted profit or cash flow.
- Category distribution maps to current project risk/deadline signals; horizontal comparison maps to actual Creative/IT task load.
- Recent transactions map to canonical quotation follow-up and audit activity, kept separate by source and semantics.
- Header controls provide authorized quick access and view navigation, without a global date selector on Overview. Date controls live in the card whose historical measures they scope. A filter must alter the records shown or it should not exist.

**Empty-state behavior:** use a contextual card label, clear title, one concise explanation, and an authorized next action where useful. Use a restrained success treatment only when available records confirm a clear/complete state. Keep genuine empty, filtered-empty, loading, stale and unavailable states distinct. Do not repeat a generic "Nothing to show" message, invent zeroes, or render placeholder chart slices/bars.

**Copy density:** favor values, chart marks, legends, sparklines, bars, functional filters and short record rows. Remove repeated explanations and period labels already visible in the header or chart. Keep microcopy only when it establishes source, period, currency, date basis, availability or a real business distinction.

**Required header and filter behavior**
- The Dashboard header has one clear title and purpose, then a small, permission-aware set of operational actions: **Create invoice** when invoice-creation permission and the canonical receivables route are both available; otherwise **Invoices** when the invoice register is readable. Show **New project** when project creation is permitted; otherwise **Projects** when the project workspace is readable. Keep **Refresh** compact with loading/disabled feedback. Authorized Tasks/Clients/Documents shortcuts remain visible in this header, but no generic **New task** action is added. Task creation belongs to its owning workspace.
- Header actions use consistent control height, compact icon/label spacing, clear primary/secondary emphasis, responsive arrangement, and hover/focus/disabled/loading states. Never show an action when its route is unavailable or use presentation to grant permission.
- The quotation pipeline is a current-state follow-up queue, not a historical trend. Stage filters change visible records and identify approved quotations without a linked invoice as awaiting conversion. Show only fields supported by canonical quotation records.
- Performance and Analytics expose the existing shared reporting controls. Overview does not show a global date selector.
- Finance owns the Month/Quarter/Year and period controls used by its invoice/expense trend, cash-received and expense movement. Team Workload owns the independent Month/Quarter/Year and period controls for Recorded Time. Changing one card's period does not change another card.
- Open tasks, project portfolio health, outstanding receivables, Needs Attention and the deadline horizon remain current-state measures unless their own source-backed filter explicitly changes their scope.
- Project, task, deadline and quotation filters require visible selected state, accessible labels and actual result changes; filtered-empty messages should name the active context.

**Responsive composition:** use the established 12-column grid and preserve sensible proportions at desktop sizes; reflow the pairs into single-column cards on narrow screens without horizontal overflow. Maintain visual variety through scale, meaningful data marks and concise rows rather than decorative numbering or another generic KPI strip.

Finance fields retain different meanings: issued invoice value, cash received, expenses, outstanding receivables, cash balance and posted profit are separate concepts. Never convert unavailable data into zero. Project progress bars may use only a valid saved progressPercent; do not infer completion from task counts.

### Performance
Period/comparison controls → trends grouped by delivery/client-service/commercial-financial/resource load where valid → exact values or data table → source drill-down. Metrics may include on-time delivery, task throughput, revision/quality trend, renewals, valid Finance trends and resource utilization. Definitions and time windows must be comparable; handle zero/missing baselines honestly.

**Performance main-content order:** reporting-period scope and date/source caveat → decision-grade KPI strip (task completion, overdue tasks, blocked tasks, active projects) → primary task-status distribution and at-risk project queue → recorded-time summary and ranked contributor comparison → concise source/measurement notes. Task/project analysis must appear before time/resource context. The same completion rate must not be repeated as an oversized duplicate in the detail panel. Recorded time is not capacity, utilization or billable time unless a valid source contract supports that meaning.

### Analytics
Period and supported grouping/filter → reports grouped by business question → exact values, source, units and definitions → drill-down. Possible topics: inquiry outcomes where compatible records exist, delivery trend, renewals/retainers, AR aging and Finance-derived project profitability. Never rebuild Finance formulas in Dashboard.

**Analytics main-content order:** shared reporting scope and source/time semantics → consistent responsive selector for supported reports → one focused report surface → exact values/definitions and authorized source links. Do not mix metrics from a period-scoped report with current-snapshot KPIs outside that report.

- **Financial movement:** compare issued-invoice values by issue date with eligible expenses by recorded date; show the source trend and exact period values/table. Label the difference as arithmetic comparison, not posted profit or cash flow.
- **Receivables:** show current open balances from issued invoices and available source records; do not imply the reporting-period filter changes this current snapshot.
- **Inquiry pipeline:** when the current role may access Inbox, show canonical inquiry counts, saved-date volume, current status grouping and requested-service demand. Exclude Careers applicants/vendors/newsletters; do not infer conversion rates, booked revenue or numeric budget from free text.
- **Project status:** show source-backed active/total project context and group counts by saved current status with legible proportional bars plus exact counts/percentages. Do not present current states as historical period trends.
- Each visual must have a readable label, definition, source and date/currency/unit context where applicable; important values must remain inspectable without depending on color alone.

**Acceptance:** No fake metrics; every chart answers a real question; sources, period and units are clear; drill-down obeys authorization; important values remain inspectable without relying only on color/chart.

**Overview content order:** header actions and visible shortcuts → Project delivery + Needs attention → Task queue + Upcoming deadlines → Finance + Projects portfolio → Team workload + Client delivery focus → full-width Recent activity at the bottom. Operational urgency determines row order; the Fynix reference informs each card's content patterns, not unsupported financial semantics.

**Client Delivery Focus ordering:** sort canonical client groups by overdue commitments, overdue tasks, blocked tasks, unassigned tasks, tasks in review, nearest upcoming commitment, open-task load, project count and then saved client name. Apply task-signal ranking only where the task source is accessible and available; missing metrics remain unavailable, not zero. This is a delivery-prioritization view, not a client health, contract or SLA score.

**Visible metric order inside each client row:** Overdue tasks → Blocked tasks → Unassigned tasks → Tasks in review → Open tasks. On small screens use two columns; expand to three columns from 600px and five from 1100px. Keep the most urgent status measures first, do not omit the unassigned-work signal when task records are available, and preserve unavailable values as unavailable rather than zero.

## 4.2 Inbox

**Question:** Which incoming conversation needs triage, assignment, response, follow-up or resolution?  
**Views:** Overview, Messages, Follow-ups, Routing & Templates. Categories and saved/status views stay within their owning workspace.

### Overview
The first work surface is the actionable incoming queue: new, unassigned or urgent items and due/overdue follow-ups only where real source data supports them. Counts must have clear meanings and link to the corresponding filtered view. Do not duplicate the complete Messages register.

### Messages
Controls first: search; All Messages, Sales Inquiries, Client Requests and Project & Support views; supported status/priority/owner/channel/date filters and saved views. Register fields: recognizable sender/contact or subject, channel/source, received date, category, status/priority, owner/PIC, configured due/SLA and linked client/project. A selected thread may use an existing split-pane on wide screens; compact mode needs a clear detail/back path. Detail groups conversation history, attachments, internal notes, current ownership/state and authorized actions. Unread, Starred, Resolved and Archived are views of the same canonical records. Resolved and Archived have different meanings.

### Follow-ups
Views: Due Today, Upcoming, Overdue and Completed. Each item links to its source thread and exposes owner, due date, status and next supported action. If follow-up/notification source/workflow is missing, mark it unavailable and track dependency instead of faking records.

### Routing & Templates
Use an internal section switcher:
- Routing Rules: actual rule name/state, supported conditions, destination/owner/category, priority/order, conflicts and allowed preview/test/edit/disable actions.
- Response Templates: identity, channel/context, supported variables, version/update, preview and allowed edit/retire actions.

Do not claim a message was sent before provider confirmation. Job applicants live under Website CMS → Careers → Applicants, not Inbox sales queues.

**Acceptance:** One canonical thread; accurate filtered queue; no duplicate lead/request; honest SLA/sending state; permissions preserved; failure is recoverable.

## 4.3 Projects

**Question:** What has Kapitech committed to deliver, how is delivery progressing, and what blocks completion? Projects owns delivery; Finance owns financial truth; Team & Resources owns people/capacity; Documents owns files.

### Overview
Prioritize delivery exceptions, at-risk/late milestones, blockers and pending reviews. Every exception links to the exact record. Summary context must not duplicate the full Project Registry.

### Project Registry
One canonical project register with search and filters for lifecycle/status, client, owner/PIC, due date and supported health. Planning, Active, On Hold, Completed and Archived are views over the same data. Prioritize project identity, client, owner, status, milestone/due context and meaningful health. Board/table/timeline modes are alternate views over the same projects when supported. Keep create/edit/archive permission and workflow guards.

### Tasks & Execution
Views: Board/Kanban, List, My Tasks, Task Lists and Dependencies where supported, all from the same canonical task data. Tasks show readable identity, project, status/stage, owner, priority, due date, valid estimate/actual time, dependency and allowed actions. Stage counts are real. Dependencies/blockers are visible. List mode is a keyboard alternative to drag-and-drop. My Tasks is scoped to authenticated identity/policy.

### Planning & Delivery
- Project Brief: objective, client context, owner, scope summary, dates and source-linked decisions.
- Scope & Deliverables: deliverable, acceptance criteria, owner, due date, version and status if canonical records exist.
- Milestones: name, due date, owner/dependency, state and project link.
- Timeline: actual project/milestone/task dates and dependencies.
- Deliverable Tracking: evidence/version, deadline, reviewer and review state if supported.
- Internal Quality Review: real criteria/checklist, reviewer, findings and recheck history only when a persisted workflow exists.
- Client Review: version-specific submission, recorded feedback/timestamp and next action only when supported.
- Revision History: chronological versions, requester/reason and history linked to source records.

If schema or review workflow is missing, do not simulate a persisted process in UI-only state. Record the gap and keep the feature unavailable until a later authorized stage provides the source.

### Content & Campaigns
Support the lifecycle Brief → Planning → Production → Internal Review → Client Review → Revision when requested → Approved for Publishing → Scheduled → Published/Publication Confirmed → Performance Reporting only where the actual contract supports it.
- Content Calendar: date range and client/project/campaign/channel/owner filters.
- Planning & Briefs: objective, format, channel, requirements, owner, deadline and asset references.
- Production Pipeline: actual stage, owner, due date, blocker and next action.
- Creative Assets & Versions: canonical Documents assets, versions, context and permissions.
- Internal/Client Review: version-specific feedback and state.
- Revision Tracking: reason/requester, owner, due date and history.
- Publishing Schedule: scheduled time, channel, actual confirmation and live reference if available.
- Campaign Tracking: objective, period, budget source, KPI definitions and results from actual sources.
Manual publication must be labelled manual. Do not fake automated publish/ad performance.

### Project Resources
Assigned team, allocation dates/effort, workload and availability linked to Team & Resources. Separate planned capacity, recorded time and actual cost. No duplicate staff directory or private compensation.

### Project Controls
- Change Requests: request/reason, justified scope/time/cost impact, owner and decision history.
- Risks, Issues & Blockers: severity/impact, owner, due/review, state, mitigation and next action.
- Budget Summary/Planned vs Actual: Finance-sourced values, period, definitions and variance; no duplicate ledger.
- Delivery Health: documented basis from schedule/dependency/review/issues; no invented profitability score.
- Reports & Closure: acceptance, handover, open issues, canonical docs and close/archive state.
- Related Project Files: contextual view of Documents Library, not a second file store.

**Acceptance:** Alternate modes use the same records; dependency/review is truthful; finance resolves to Finance; files resolve to Documents; keyboard use is supported; unavailable workflows are not simulated.

## 4.4 Clients

**Question:** Who is the client, what has Kapitech committed to, is onboarding ready, and what service/renewal needs attention?  
**Views:** Directory, Onboarding, Agreements, Service & Health.

### Directory and Client 360
One canonical company/contact directory, with Companies and Contacts as views/filters. Prioritize recognizable identity, status, relationship owner and relevant service/renewal context. Client 360 aggregates authorized contacts, agreements, projects, Finance references, retainer usage, Inbox conversations/requests, documents and service history; it is not another client master.

### Onboarding
Checklist grouped by onboarding stage/service where supported. Each requirement has owner, due date, status, blocker and canonical evidence/record reference. Separate missing evidence from source errors. Kickoff readiness is based on configured requirements and validated evidence, not a cosmetic manually-green checklist.

### Agreements
Subareas: Contracts & SOWs, Retainers & Service Commitments, Renewal Schedule and Contract History as supported. Show client, agreement type, state, effective/expiry date, owner, version/document and next obligation. Retainers show period, service scope, included units/hours, rates/terms as authorized, carryover only if configured, usage/remaining and renewal. Quotes, invoices, payments and accounting remain owned by Finance.

### Service & Health
SLA only when target, working calendar, pause rules, event timestamps and breach semantics are configured. Link issues/feedback to Inbox-owned requests; show owner, impact, status, update and next action. Health indicators need defined sources/formulas; otherwise label unknown/not configured. Service history is source-linked.

**Acceptance:** One client identity, no second request queue/finance ledger, real onboarding evidence, honest SLA/health and permission-safe private context.

## 4.5 Finance

**Question:** What is the authoritative financial state for this period, which receivable/payable/cash action needs attention, and does the record reconcile?  
**Five areas:** Overview & Control; Transactions & Cash; Receivables & Payables; Project Finance; Accounting & Reports.

Finance restructuring must not alter formulas, posting, account mappings, historical transactions, tax/rounding, maker-checker, payment meaning or period close.

### Overview & Control
- Executive Summary: selected period, exact meaning/source of summary values, exceptions and links.
- Dashboard: validated comparisons/trends that complement the summary instead of duplicating it.
- Quotation value, issued invoice, recognized revenue, cash received, receivable, expenses, cash/bank balance, budget and posted profit are separate.
- State period, currency, source/freshness and definitions where needed.

### Transactions & Cash
- **Cash & Bank:** accounts, opening/period movement/closing or provisional balance according to source, transactions, reconciliation state and exceptions.
- **Revenue:** canonical revenue/invoice records, client/project, date/value/currency/state; invoice is not payment receipt.
- **Expenses:** supplier/category, transaction date, amount/currency, project/budget link and record status.
- **Petty Cash:** ledger, supported opening/movements/closing, evidence and genuine reconciliation state.
- Bank reconciliation/Kopra needs valid provider evidence; layout never implies connectivity.

### Receivables & Payables
- **Quotations:** canonical register/builder, identity, client, version/state, dates, currency/value and supported review/send/convert actions.
- **Accounts Receivable:** invoice identity/number, client, issue/due dates, total/paid/outstanding, aging/state and existing authorized payment action.
- **Accounts Payable:** bill/vendor, bill/due date, total/paid/outstanding, state and supported actions.
- **Vendor reference:** links to Team & Resources' canonical supplier; no second vendor master.
- Relevant status/client/vendor/period/overdue filters precede long registers and reflect real records.

### Project Finance
- **Project Finance:** project/client/period, sourced values and permitted links to Finance detail.
- **Operational Budget:** approved plan, period/category, actual source, variance and definitions.
- **Project Allocation:** canonical allocation records by project/category/resource/period and sourced amounts/percentages.
- **Team Fee:** existing calculation basis, source inputs/results and Finance-only controls as permitted.
- Separate estimate, time-log, invoice, cash and recognized-cost semantics. Never derive missing profitability or change formulas.

### Accounting & Reports
- **Journal:** date/period/source/account/debit/credit/state, permitted post/reverse actions, exception and audit.
- **Chart of Accounts:** code/name/type/category/active state and existing mappings.
- **Monthly P&L:** period and formal income/expense/profit rows/subtotals.
- **Cash Flow:** defined movements by category/source/time; not balance.
- **Balance Sheet:** report date and formal assets/liabilities/equity hierarchy.
- **Monthly Closing:** period checklist, blockers, owner, actual lock/close state and history.
- **Annual Summary:** comparable periods with exact defined values and detail.
Prefer registers/formal report tables. Charts are secondary and only useful for comparisons.

**Acceptance:** Existing worksheet identities remain; no duplicate ledger; numbers reconcile; semantic distinctions are clear; no content-only change alters accounting/posting.

## 4.6 Team & Resources

**Question:** Who is available/skilled/accountable, what workload conflicts exist, and which people/vendor/time action requires attention?  
**Views:** Team & Capacity, People Operations, Vendors & Freelancers, Time & Availability/Time Tracking as supported.

### Team & Capacity
- Team Directory: canonical person, department/team, work role, manager and permitted state/availability.
- Roles & Departments: organizational role is not an application authorization role.
- Capacity Allocation: person/project/period, configured capacity basis, assigned effort, utilization definition and conflicts.
- Availability & Workload: approved absence, assignment and schedule conflicts. Use a calendar/list plus exact values where useful.

### People Operations
Supported target areas: Profiles & Employment Details, Employee Onboarding/Offboarding, Employment Contracts & Status, Leave & Absence, Training & Development, Performance Reviews & History, People Operations Reports.
- Every view links to the same canonical Team Directory person.
- Queues/checklists show owner, due date, state, blocker and evidence.
- Restrict employment terms, compensation, reviews and HR files to current policy.
- Only approved leave affects availability, using real state/dates.
- Do not invent performance/training scores or a browser-only HR lifecycle where secure data/workflow is missing.

### Vendors & Freelancers
- Directory: one provider identity, service/category, active/engagement state and business metadata.
- Skills & Service Matrix: actual capability/category/qualification and sourced availability.
- Contracts & Rates: scope, terms, rate/currency and restricted document reference for authorized roles.
- Engagement Status: provider/project, dates, owner, state and next action.
Finance owns vendor bills/payments; Team & Resources owns vendor identity.

### Time & Availability / Time Tracking
- Time Logs: person, date, project/task, duration, recorded billable class, note/state and permitted actions.
- My Timesheet: secure own-record scope, period, entries/totals and real lifecycle only if implemented.
- Timesheet Control: authorized review queue and history if supported.
- Billable/Non-billable: filtered view of canonical logs; true, false and unset remain distinct.
- Time by Project: comparable hours/effort with period and drill-down.
Do not equate planned capacity, logged hours, invoiced time and recognized cost.

**Acceptance:** One person/vendor source; restricted HR information; true availability/classification; no invented capacity or billing value.

## 4.7 Documents

**Question:** Which authorized document/version belongs to a client, project, agreement, finance item, CMS content or people record, and what safe action can the user take?

Use one canonical Document Library. SOPs & Policies, Legal & Corporate, Finance & Tax, HR & People, Security & Infrastructure and Project & Client Files are categories/saved views, not separate libraries.

- Search/category/metadata filters precede the register.
- Prioritize title/filename, category, owner/related record, upload/update date, version, permitted classification and state.
- The register remains primary; use header upload action and secure drawer rather than oversized upload/KPI panels ahead of the list.
- Detail/preview/history shows canonical owner/link, version chronology, access/retention and authorized actions.
- Upload/download/preview follows private-vault and object-integrity contracts.
- Project/client links point to the same document, with selective breadcrumbs for deep detail.

**Acceptance:** No duplicate repository or privacy leak; access/version ownership is valid; preview/storage errors are truthful and recoverable.

## 4.8 Website CMS

**Question:** Which public content needs to be authored, reviewed or published, and what publication state has actually been confirmed?

Workspaces: Case Studies, Services, Insights, Testimonials and Careers. CMS Overview is optional only for real cross-content status/exceptions, not a duplicate register.

### Shared register/editor
- Put search, content-specific filters/state and list actions before the register.
- Prioritize title, type/context, editorial/publication state, update/publish date, supported language/completeness and actions.
- Editor field flow: identity → editorial content → media/assets → metadata/SEO → supported translation → preview → publishing.
- Put validation near fields; show truthful saving/pending/error/confirmation.
- Draft, review-ready, scheduled, requested, published-confirmed, failed or unknown states appear only if actual workflow/provider supports them.
- Clicking publish is not proof of publication; avoid redundant KPI strips.

### Case Studies
Title; public-safe client/project attribution; completeness; visibility/publication state; updated date; preview/editor. Never leak private delivery material.

### Services
Title/category; supported display order/visibility; content/language completeness; state; preview/edit. Follow Kapitech's approved Creative & IT service catalog; do not add Mobile App as a service.

### Insights
Title/category/author when available, editorial state, update/publish dates, language and preview/edit. Calendar/scheduling uses real content records if supported.

### Testimonials
Attribution, statement, permission/consent evidence if recorded, visibility/publish state and update date. Presence of text does not prove consent.

### Careers
- Jobs: title, type/department/location when sourced, status, publish/expiry and public reference.
- Applicants: restricted queue with applicant/job, received time, actual stage, reviewer and next action; CV/files/notes follow policy.
- Recruitment History: chronological events on the same applicant/job, not a second store.
Applicants are recruitment records, not Inbox sales leads. Never fake application or upload success.

**Acceptance:** Fit-for-purpose content-type registers/editors, canonical records, verified publication states and restricted applicant data.

## 4.9 Settings

**Question:** What system/configuration state is current, who is authorized to manage it, and what safe action is available?

### System Overview
Show sourced status, checked time, source and exceptions. Separate database connectivity, migration status, backup existence and proven recovery. Prefer status/exception lists over decorative charts and restrict operational actions.

### Users & Access
Show user/account register, roles/access context from current policy and supported security/MFA workflows. Job role is separate from authorization. Sensitive changes follow existing gate/confirmation/audit; never display passwords, MFA secrets or recovery codes.

### Audit Log
Searchable/paginated events with time, actor, action, target, result and sanitized metadata. Retain read-only semantics. Do not claim completeness if the source is unavailable; redact secrets and unnecessary personal/bank data.

### Integrations
List only supported providers with actual configured environment/state, last verified/sync, errors, owner and safe next action. Connected/enabled/degraded/stale/failed/unknown/not-configured must reflect evidence. Secrets stay server-side. Kopra remains disabled/unconfigured until official contract, authorized sandbox/UAT, permission, idempotency, inquiry and reconciliation requirements are met.

### Preferences
Separate personal display/saved-view preferences from global policy, account security and integration settings. Save/reset outcomes must be real; don't imply local-only state changed server settings.

**Acceptance:** State is source-backed, sensitive actions restricted, saved results confirmed only on success, audit retained, secrets hidden.

## 4.10 Mandatory screen-composition matrix

**This is the implementation-facing composition contract for Stage 4.** Sections 4.1–4.9 define the purpose, data and field requirements. This matrix defines the required relative order of the main content for each workspace so that implementation cannot substitute generic cards or the previous component arrangement for the intended workspace.

This matrix does **not** add primary modules, routes, persistent navigation tiers, data sources, business states or permissions. The Navigation IA remains authoritative for which destinations exist. Worksheet names below describe target worksheet/view organization; show them as actual working controls only where the approved navigation/source contract supports them. A target worksheet without verified data or workflow must remain unavailable and be recorded in the Feature & Content Gap Register, not simulated.

| Module / workspace | Required main-content order | Primary working surface and acceptance focus |
|---|---|---|
| Dashboard / Overview | Header with permission-aware actions and authorized Tasks/Clients/Documents shortcuts → Project delivery + Needs attention → Task queue + Upcoming deadlines → Finance + Projects portfolio (Finance-owned period controls) → Team workload + Client delivery focus (Recorded Time-owned period controls) → full-width Recent activity | Operational urgency determines row order. Fynix informs card patterns: headline metrics, source-backed trends, proportional distributions and concise record lists. Do not put shortcuts at the bottom, duplicate period scope, invent AI insights or financial values, or turn unavailable records into zeroes. |
| Dashboard / Performance | Period and comparison controls → meaningful performance trends grouped by business question → exact values or accessible table → definitions, source, unit and authorized drill-down | Analysis area. Every metric has a comparable period and a defensible definition. |
| Dashboard / Analytics | Report/business-question selection → supported scope and filters → report/table or justified chart → metric definitions, source and period → source-record drill-down | Analytical report. Do not duplicate Overview or reimplement Finance calculations. |
| Inbox / Overview | Actionable incoming queue → source-backed counts as links to filtered work → due/urgent/unassigned items → recent activity if it adds context | Queue first. Do not render a second full Messages register or fabricate follow-ups. |
| Inbox / Messages | Search and scope controls → category and supported status/priority/owner/channel/date filters → one canonical thread register/list → selected-thread details → conversation history, attachments, internal notes and authorized actions | Canonical message/thread queue with selected-record review. Split view is allowed when it fits the existing responsive pattern; compact layout must provide a clear back path. |
| Inbox / Follow-ups | Due Today/Upcoming/Overdue/Completed view controls → follow-up register → selected source conversation/context → owner, due date, state and supported next action | Follow-up queue only if canonical follow-up records and lifecycle exist. Otherwise show unavailable and record the dependency. |
| Inbox / Routing & Templates | Internal Routing Rules / Response Templates switcher → relevant register → selected rule/template details or editor → supported preview, validation, save and outcome feedback | Configuration workspace. Do not expose unsupported rules or claim a message was sent without provider confirmation. |
| Projects / Overview | Delivery exceptions → at-risk/late milestones and blockers → pending reviews or decisions → capacity concerns when sourced → links to the exact underlying records | Portfolio exceptions. Never duplicate the complete Project Registry. |
| Projects / Project Registry | Search and filters → one canonical project register → permitted row actions → selected-project detail/context | Register first. Statuses such as Planning, Active, On Hold, Completed and Archived are views/filters over the same project records, not separate workspaces. |
| Projects / Tasks & Execution | Project/owner/work scope → Board/List/My Tasks and other supported view controls → canonical task board or list → task detail → dependency, activity and action context where supported | Task execution surface. Board and list use the same task source; List remains a keyboard alternative. My Tasks follows authenticated identity and existing policy. |
| Projects / Planning & Delivery | Selected project context → internal worksheet selector → the selected brief/scope/milestone/timeline/deliverable/review/revision surface → associated evidence and next supported action | Planning records and timeline. Keep each worksheet task-specific. QA, client review, deliverable acceptance and revision history are unavailable until their canonical sources/workflows are verified. |
| Projects / Content & Campaigns | Client/project/campaign/date/channel scope → calendar, production pipeline or register appropriate to the selected view → content/asset detail → version-specific review/revision → publishing state and results where sourced | Creative production and campaign workspace. Use canonical Documents assets. Separate planned publication from confirmed publication; do not fake ad metrics or approvals. |
| Projects / Project Resources | Project and period scope → assigned team/resource allocations → workload/capacity or schedule visualization when sourced → conflicts and linked member/project details | Allocation view. Team & Resources owns person identity and overall availability. Planned capacity, logged time and actual cost remain distinct. |
| Projects / Project Controls | Risk/change/issue/budget/report/closure scope → selected control register or report → impact, owner, due date, mitigation or decision history → source-linked Finance values and Documents evidence → supported closure action | Exception/control workspace. Budget comes from Finance; files come from Documents. Do not invent a single untraceable project-health or profitability score. |
| Clients / Directory | Search and supported identity/status/owner filters → canonical company/client/contact register → selected Client 360 context → linked agreements, projects, Inbox history, Finance references and documents allowed for the user | Client register with contextual 360 detail. Contacts is a distinct list only if canonical contact data supports it; otherwise do not invent a multi-contact model. |
| Clients / Onboarding | Client and onboarding scope → actual readiness blockers/requirements → checklist/register with owner, due date and status → required evidence/document links → next supported action | Checklist/readiness workspace. Profile completeness is not the same as onboarding completion or kickoff approval. |
| Clients / Agreements | Agreement type/status/expiry/renewal controls → canonical agreements/retainers register → selected agreement details and version/document → obligations, usage or renewal context → supported reminder/action | Agreement and renewal workspace. Quotations, invoices, payments and accounting remain Finance-owned. Contract History requires a canonical version/event source. |
| Clients / Service & Health | Configured SLA/service exceptions → linked service issue/feedback register → source-backed service/health indicators with definitions → service history → owner and next action | Service oversight. Link requests to Inbox-owned records. SLA and health must not be fabricated when source rules or telemetry are absent. |
| Finance / Overview & Control | Reporting period, currency and source context → urgent financial/control exceptions → Executive Summary values with explicit meanings → complementary comparative analysis → formal source drill-down | Decision-ready financial overview. Do not repeat the same values in duplicate KPI sections or confuse invoice, revenue, cash and profit. |
| Finance / Transactions & Cash | Account and period scope → Cash & Bank, Revenue, Expenses or Petty Cash selector → ledger/register appropriate to the selected worksheet → reconciliation/evidence/exception context → supported transaction detail/actions | Transaction register or ledger first. Distinguish ledger balance, bank-reported balance, cash movement and reconciliation status. |
| Finance / Receivables & Payables | Quotation/AR/AP worksheet selector → status/client/vendor/period/overdue filters → canonical quotation, invoice or bill register → aging/outstanding and selected-record details → existing authorized follow-up/payment/conversion actions | Formal register. Keep vendor identity linked to Team & Resources. Do not create a second quote, invoice or payment store. |
| Finance / Project Finance | Project and period controls → approved budget/allocation/team-fee worksheet → source-backed values and plan-vs-actual variance → definitions and linked Finance transactions → permitted detail | Financial worksheet/report. Reuse established formulas and source values; do not independently calculate missing profit. |
| Finance / Accounting & Reports | Journal/Chart of Accounts/report/closing selector → relevant period/account filters → formal ledger, register or report table → totals/subtotals and source detail → supported close/review actions where authorized | Formal financial data surface, not a decorative dashboard. Preserve journal posting, account mappings, reconciliation, period locks and closing semantics. |
| Team & Resources / Team & Capacity | Team/person/period scope → canonical Team Directory or allocation register → assigned work and supported capacity/availability context → conflicts and linked project details | Team roster and capacity planning. Explain the capacity basis and distinguish no data from zero availability. |
| Team & Resources / People Operations | Authorized people-operation queue or person selector → selected lifecycle worksheet (onboarding/offboarding/contracts/leave/training/performance/reporting) → relevant checklist or record register → protected details/history → owner, due date and next permitted action | Role-restricted HR workspace. Keep one canonical person identity. Do not expose employment, compensation, performance or HR documents to unauthorized users. |
| Team & Resources / Vendors & Freelancers | Search and approved vendor filters → canonical vendor register → internal skills/contracts-rates/engagement view → selected provider detail and permitted documents → Finance references for bills/payments | Supplier/provider workspace. Finance references the same vendor. Restrict commercial, tax and bank details. |
| Team & Resources / Time Tracking | Period/person/project scope → Time Logs or permitted personal/review view → canonical time-entry register → totals/grouping for billable class or project → entry detail and supported correction/review controls | Time-record surface. Do not imply My Timesheet ownership or Timesheet Control review if current identity scopes/workflows are absent. True, false and unset billable values remain distinct. |
| Documents / Document Library | Search/category/metadata filters → single canonical document register → selected document metadata and related record → preview/version chronology only when supported → secure permitted file actions | Document register first. Categories are filters/saved views. Do not create separate repositories or claim version history/restore that the source does not establish. |
| Website CMS / Case Studies | Search/content-state filters → case-study register → selected editor grouped by identity/content/media/metadata → preview → saved CMS status and separately verified public visibility | Purpose-built case-study editor. Respect publication permissions and client-safe attribution; do not imply live deployment from a successful save alone. |
| Website CMS / Services | Search/category/publication filters → service register and ordering where supported → service editor grouped by content/media/language/metadata → preview → confirmed CMS outcome and public verification as available | Service catalog editor. Maintain approved Kapitech service taxonomy and existing public CMS contract. |
| Website CMS / Insights | Search/category/editorial-state filters → article register → editor grouped by title/slug/content/taxonomy/media/SEO/language → preview → publication feedback | Editorial workspace. Include only fields and language/SEO features supported by the actual editor/API. |
| Website CMS / Testimonials | Publication/search filters → testimonial register → editor for statement/attribution/rating where supported/permission state if recorded → preview → saved state and public-output verification | Testimonial register/editor. Do not invent permission approval or rating data. |
| Website CMS / Careers | Jobs/Applicants/Recruitment History internal selector → selected register/queue → selected job or restricted applicant detail → lifecycle/history and permitted actions → truthful save/publication feedback | Keep job openings separate from applicant pipeline while keeping both owned by Careers. Recruitment History requires persisted canonical events. Restrict candidate PII and CVs. |
| Settings / System Overview | System area selector or grouped sections → actual source-backed status and last-check context → migration/backup/restore evidence table → exceptions and safe authorized next steps | Operational status/register. Distinguish backup created, backup verified and restore proven; do not expose infrastructure secrets. |
| Settings / Users & Access | User/security section selector → authorized accounts/roles/MFA register or configuration → selected account/setting details → validation and explicit confirmation for sensitive changes → audit context | Security configuration. Existing server-side policy remains authoritative; no parallel frontend access model. |
| Settings / Audit Log | Supported time/actor/event/target filters → chronological audit register → selected event details and safe metadata | Read-only audit surface. Never expose secrets or mutate historical events. |
| Settings / Integrations | Integration list/status and source freshness → selected integration's internal sections → actual configuration/diagnostics/mapping/sync evidence permitted to the role → clear errors and safe supported next actions | Integration operations. Clearly distinguish configured, available, connected, sync-success and production-ready. Kopra remains unavailable/unverified until provider evidence exists. |
| Settings / Preferences | Preference group → current supported values and concise explanation → clear save/reset controls → confirmed outcome or recoverable validation error | Simple settings surface. Personal preferences do not alter shared business records or permissions. |

### 4.10.1 How this matrix must be applied

1. Preserve the relative order shown for the selected workspace unless current source constraints or higher-authority domain rules require a documented exception.
2. Implement the **main working surface** named in the matrix. Do not replace it with generic KPI cards, a decorative chart or repeated summary panels.
3. Sections 4.1–4.9 remain the detailed target for fields, content, and business distinctions. The Role-Based Content Blueprint and Worksheet Role Presentation Matrix refine role-aware emphasis and useful columns; they may not remove essential task information or change this base composition.
4. The Navigation IA defines persistent navigation and routes. This matrix does not create new sidebar entries. Sub-views are internal worksheet controls, filters, saved views, report selectors or editor sections as appropriate.
5. The Feature & Content Gap Register and current source/tests determine whether a target view is implemented and usable. Do not activate unsupported functionality simply because it appears in this target matrix.
6. If a target cannot be supported within the authorized frontend-only stage, keep the view honest, record its requirement/dependency, and continue with the next authorized structural slice.
7. For each implementation, record the actual before/after composition and prove the result with focused tests and browser evidence when available. Cosmetic changes alone do not pass the structural acceptance gate.

---

## 5. Record detail, relationships and breadcrumb

Breadcrumbs are conditional, not global. Use them where a deep detail page benefits from ancestry/return path. Omit on obvious roots, Dashboard, primary Inbox workspaces and established Finance tabs when location is already clear.

- Trail items are meaningful ancestors; the current record title is the page heading and is not repeated in the trail.
- Ancestors must be real, valid routes and obey record-level authorization.
- Direct entry, refresh, back/forward and selected-record changes must not leave stale ancestry.
- Related records open in their canonical owner module.
- Compact screens collapse the trail or use a clear back-to-parent control; no second global navigation row or horizontal overflow.
- Use semantic navigation/name, visible keyboard focus and decorative noninteractive separators.
- Track UX-NAV-BREADCRUMB-001. A shared component alone is not completion; test eligible consumers, intentional exclusions, real route targets and runtime behavior.

## 6. Universal data-state and interaction requirements

| State | Required behavior |
|---|---|
| Loading | Stable structure and honest progress; no fake final data |
| Populated | Clear scope/source, record identity and permitted actions |
| Empty source | Explain no records exist and offer a valid action if available |
| Filtered empty | Indicate active filters and allow clearing without losing unrelated context |
| Unavailable/unconfigured | Identify missing source/configuration; no fake zero/success |
| Stale/partial | Disclose freshness/partiality when relevant; only offer real refresh/recovery |
| Restricted | Avoid leaking protected data; comply with no-access policy |
| Validation error | Associate error with field/action and explain correction |
| Pending | Prevent unsafe duplicate submits and communicate progress |
| Success | Confirm only after authoritative success and show the canonical result |
| Failed/unknown | Explain next safe action; never blindly retry non-idempotent/financial flows |

Tabs/filters change the view of canonical records, not business truth. URL/query state, selected navigation, direct entry and browser history must agree. Each enabled control performs its label's action. Risky transitions use approved confirmation; failure must not create duplicates or silently discard input.

## 7. Role-aware presentation

Adapt default emphasis, never authorization:
- **Executive/BOD:** major exceptions, defined trends and permitted aggregate drill-down.
- **Project Manager/Lead:** deadlines, dependencies, blockers, reviews, resource conflicts and next action.
- **Creative/Designer/Videographer:** brief, assigned work, asset/version, feedback and due date.
- **Developer/IT:** implementation tasks, technical dependencies, acceptance criteria, specs/files and release state.
- **Marketing/Communications:** inquiry triage, content/calendar, client review and source-backed campaign result.
- **Finance/Accounting:** authoritative transactions, billing/payment status, reconciliation, periods and audit.
- **HR/access administrator:** only authorized personnel/account/security functions.
- **CMS/recruiter:** editorial/publication queue and restricted applicant workflow.
- **General contributor:** own/assigned records according to policy.

Multi-role users may combine/select supported views but cannot gain access. Sensitive HR, applicant, financial, audit and integration details must not leak through cards, tooltips, hidden fields, exports or aggregates.

## 8. Responsive and accessibility contract

Follow AMS-DESIGN-SYSTEM.md §2.7 for all dimensions, tokens and component variants.
- Test applicable widths: 1440, 1280, 1100, 1024, 900/899, 768, 600/599, 390 and 320 CSS px.
- Test 200% text resize/zoom and 320px reflow.
- Align heading, tabs, controls, tables, content and empty states to one gutter.
- Use wide tables, contained horizontal scroll or compact/detail views as appropriate. No page-wide horizontal overflow.
- Preserve record identity, key state and critical actions on small screens; no essential hover-only control.
- Check semantic hierarchy, labels/errors, keyboard/focus, icon-only names, dialogs/focus return, tabs, contrast, target size and reduced motion.
- Evaluate actual colors/states against WCAG 2.2 AA; tokens alone are not proof.
- Charts require label, unit, source, period, legend and accessible exact-value inspection where relevant.
- Automated tests do not replace browser/keyboard review. Report precisely what was and was not tested.

## 9. Stage 4 implementation sequence

Work as a sequence of bounded but structurally meaningful module slices:
1. **Baseline:** inspect current main, all views, routes, source data/actions and tests; preserve verified work and update the gap register.
2. **Shared shell prerequisite:** fix proven title/gutter/scroll defects that obstruct content, without recreating navigation.
3. **Dashboard:** Overview, Performance, Analytics.
4. **Inbox:** Overview, Messages/views, Follow-ups and Routing & Templates where real source contracts exist.
5. **Projects:** Overview, Registry, Tasks & Execution, Planning & Delivery, Content & Campaigns, Project Resources, Project Controls.
6. **Clients:** Directory/Client 360, Onboarding, Agreements, Service & Health.
7. **Finance:** audit/restructure each worksheet in all five areas, not just Finance landing.
8. **Team & Resources:** Team & Capacity, People Operations, Vendors & Freelancers, Time & Availability as supported.
9. **Documents:** canonical Library/search/categories, detail/version, related-record context.
10. **Website CMS:** shared register/editor then Case Studies, Services, Insights, Testimonials, Careers Jobs/Applicants/History.
11. **Settings:** System Overview, Users & Access, Audit Log, Integrations and supported Preferences.
12. **Breadcrumb consumers:** audit eligible/excluded routes and verify actual consumers.
13. **Cross-module pass:** related links resolve to their canonical source and maintain useful context.
14. **Regression/evidence:** test all changed consumers and update gap/progress docs.

Before coding a slice, record the current hierarchy and the observed task problem, then define the new content order, primary surface, source-owned fields/semantics, controls/actions, role focus, states, responsive transformation and acceptance tests. Retain existing blocks only if justified by that contract. Report verified slices and continue to the next authorized slice; stop at real blocker/formal gate, not after a plan-only report.

## 10. Mandatory per-view design record

For every workspace/worksheet, record:
1. Stable view ID and canonical owner.
2. Primary user/persona and task goal.
3. Main question/decision and intended next action.
4. Selected work surface and why.
5. Ordered content hierarchy top to bottom.
6. Fields/semantics: identity, status, date, units/currency, source and meaning.
7. Search/filter/sort/period/view controls and action placement.
8. Canonical related records and breadcrumb policy.
9. Role-aware content and restricted fields under existing permissions.
10. Applicable states and recovery behavior.
11. Responsive transformation and information that stays discoverable.
12. Accessibility/keyboard acceptance checks.
13. Automated tests and browser/runtime evidence needed.
14. Missing source/workflow dependencies and open decisions.
15. Exact completion evidence: commit SHA, tests, screenshots/runtime findings and gaps.

Do not code a generic screen before understanding this record. The record is not implementation proof; source/test/runtime evidence is still required.

## 11. Stage 4 completion gate

Stage 4 may be marked complete only when:
- [ ] Every active view in all nine modules has been structurally rebuilt or explicitly assessed under this specification.
- [ ] Every view defines its task, primary surface, ordered hierarchy, source semantics, actions, states and role-aware presentation.
- [ ] Missing source/workflow contracts remain explicitly blocked/unavailable, not replaced with fake local state.
- [ ] Breadcrumb consumers and intentional exclusions are tracked under UX-NAV-BREADCRUMB-001.
- [ ] Shared component consumers and neighboring views are regression-tested.
- [ ] Responsive behavior follows the Design System and preserves key identity/status/actions.
- [ ] Permission boundaries and Finance calculations/workflows remain intact.
- [ ] Test/CI evidence belongs to the exact final SHA; visual/runtime evidence is separated from source-only evidence.
- [ ] Gap register/progress docs reflect complete, partial, missing, blocked and unverified states.
- [ ] Consolidated Stage 5 visual review is prepared.

Stage 4 completion does not mean Stage 5 visual review or user sign-off has passed. Authenticated visual/accessibility review and explicit user acceptance are still required before broad Stage 6 functional implementation.

## 12. Final instruction to the implementing AI

Treat this file as the mandatory main-content restructuring contract. Do not merely polish existing screens, move cards or stop after an audit. Inspect the latest main and rebuild each unfinished workspace for Kapitech's actual user tasks, canonical records, role needs and global usability/accessibility baselines. Work in verified slices, commit authorized changes to main, keep evidence/gap status current, preserve valid workflows/security/business semantics and never skip the roadmap's actual gates. If a requirement lacks a canonical data/workflow contract, do not invent it; record the blocker and continue with the next authorized task.
