# AMS Role-Based Main Content Blueprint
## Target specification for role-aware content, worksheets, data tables, and visualizations

- **Repository:** Kapitech-Agency/kapitech-ams
- **Status:** Target-state UX/content specification; not implementation evidence
- **Scope:** Main content across all nine primary AMS modules, workspaces, worksheets, record details, stakeholder perspectives, visualizations, and presentation states
- **Audience:** Product owner, agency leadership, employees, UX/UI designers, frontend implementers, QA, and AI coding agents
- **Language:** English
- **Last updated:** 18 October 2026

---

## 1. Purpose

This document defines what the main content of every AMS module, workspace, worksheet, and record detail should communicate, how information should be organized, and how its default presentation should adapt to the user's work responsibilities and stakeholder needs.

It is the content specification that sits between the approved navigation architecture and visual implementation. It must help a designer or AI understand not only a page name, but also:

- The principal question the page answers.
- The user roles or stakeholder personas who need it.
- Which information should appear first and why.
- The primary working area and its required fields/columns.
- The filters, saved views, supported actions, and record relationships.
- Whether a chart or other visual treatment is useful, and what question it must answer.
- What information may be personalized, what remains consistent, and what must remain inaccessible without authorization.
- How the page should behave in loading, empty, error, restricted, stale, and responsive states.
- Which source module owns the underlying records and business meaning.

This blueprint defines intended content and presentation. It does not prove that a route, worksheet, data source, API, calculation, integration, permission, or action is implemented. At implementation time, verify the actual repository, routes, data contracts, permissions, and tests before describing any capability as available.

Use `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md` as the companion specification for worksheet-level persona defaults, visible fields, controls, role-specific emphasis, and visualization decisions. This blueprint explains the common rules and content purpose; the companion matrix makes those defaults concrete across the nine modules.

## 2. Authority and required companion documents

Follow the precedence and task boundaries in root AGENTS.md. Use the related specifications together:

1. **docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md** — target modules, worksheets, workflow responsibilities, cross-module ownership, Finance boundaries, and business rules.
2. **docs/architecture/ams-navigation-information-architecture.md** — approved primary modules, workspaces, navigation depth, routes, and destination ownership.
3. **docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md** — page anatomy, shared content hierarchy, and UX expectations.
4. **AMS-DESIGN-SYSTEM.md** — visual tokens, layout, components, typography, interactions, accessibility, and responsive presentation.
5. **docs/AMS-UX-INTERACTION-STANDARDS.md** — navigation, states, tables, forms, accessibility, and consistency checks.
6. The specialist Finance, frontend engineering, business workflow, data dictionary, document vault, drawer/modal, Kanban, and regression documents whenever relevant.

If documents conflict, do not silently blend the alternatives. Follow AGENTS.md, identify the conflict, check actual source contracts when implementation is in scope, and report unresolved decisions.

## 3. Non-negotiable principles

### 3.1 One system, one canonical source

A module may show relevant linked context from another module, but it must not create a second master record, ledger, task system, file repository, message queue, or status system.

| Information | Canonical owner | Other modules may show |
|---|---|---|
| Cross-module operational summary | Dashboard is an aggregation, not a data master | Authorized summaries and drill-down links |
| Messages, inquiries, and follow-ups | Inbox | Linked conversation/request context inside a client or project detail |
| Project, task, milestone, deliverable, and campaign records | Projects | Linked project context in Dashboard and Clients |
| Client/company/contact identity, onboarding, agreements, retainers, SLA, relationship health | Clients | Linked client context in Projects, Inbox, and Finance |
| Quote, invoice, payment, expense, bank/cash record, journal, accounting reports | Finance | Authorized summaries and source-linked references |
| Team member identity, people operations, vendor master, time logs, availability/capacity | Team & Resources | Workload/resource references in Projects and finance references in Finance |
| Canonical file metadata, versions, and secure file access | Documents | Contextual attachment/document links in business records |
| Public-site content and Careers records | Website CMS | Verified publication state or permitted links elsewhere |
| Users, roles, access/security configuration, integrations, audit | Settings and existing security services | Permission-aware state indicators only |

### 3.2 Role-based presentation is not authorization

The interface may prioritize information for a user's responsibilities. It must not infer or grant access from a persona selector, route visibility, saved view, dashboard card, or frontend filter.

- Existing route guards, backend authorization, and record-level access remain authoritative.
- A role/persona preset may only select among fields, data, actions, and destinations the user is already authorized to use.
- Hiding a table column is not a security control. Restricted data must not be delivered to or exposed by the frontend.
- A user who performs multiple functions may receive a combined set of useful priorities only within the intersection of their existing permissions.
- Role and stakeholder labels below are design personas, not claims that identically named RBAC roles already exist in AMS.

### 3.3 Complete information, progressive disclosure

- Keep the fields required for the primary job visible in the main working area.
- Place secondary metadata, audit/history, attachments, and related records in purposeful internal sections or record details.
- Do not hide essential information merely to create a minimal look.
- Do not place every possible field, KPI, chart, activity feed, and action on the same screen.
- Keep the next action and its consequence understandable.
- Detail views must preserve record identity, status, and return context.

### 3.4 Visualizations must earn their space

Every chart must answer a concrete user question, use a trustworthy data source, and communicate period, unit, metric definition, comparison, and freshness when applicable. If the same question is answered more clearly by a table, queue, board, timeline, or simple status list, do not add a chart.

### 3.5 Truthful presentation

Never make a page appear more complete by inventing records, KPI values, chart series, calculated health scores, external integration state, saved outcomes, or permissions. Distinguish real zero from unavailable data and distinguish no matching filters from an empty source dataset.

### 3.6 Consistent shell, task-specific composition

Use the established AMS shell, design system, shared components, and navigation patterns. Do not force every module into identical cards, identical KPI strips, or a dashboard-style grid. The same design system can support a compact queue, a full-width register, a form/editor, a financial report, or a project timeline.

---

## 4. Role and stakeholder presentation model

### 4.1 Recommended personas

These personas describe common work needs. They must be mapped to actual users and approved permissions during implementation; they must not become a parallel permission model.

| Persona | Main question | Content to prioritize | Useful presentation patterns |
|---|---|---|---|
| Owner / BOD / Executive | What is happening, what is at risk, and which decision needs attention? | Cross-module exceptions, portfolio health, financial summaries, client risks, capacity pressure, unresolved decisions | Concise source-backed KPIs, trends, ordered exception lists, drill-downs |
| Project Manager / Operations | What is blocked, overdue, due next, or waiting for a decision? | Project registry, milestones, task dependencies, owners, resource load, scope changes, pending reviews | Register, task board, deadline queue, timeline, risk list |
| Creative / Marketing | What content must be produced, reviewed, revised, scheduled, or published? | Briefs, creative assets and versions, content calendar, campaign assignments, client feedback, publication state | Calendar, production board, review queue, asset/version list |
| Web Developer / IT | What technical task, dependency, issue, or delivery obligation needs work? | Assigned tasks, dependencies, blockers, acceptance criteria, deadlines, review/QA state, related technical files | Task list/board, dependency view, issue queue, linked detail |
| Client Service / Account coordination | Which client relationship or request needs a response or follow-up? | Client identity, requests, messages, contracts, retainer/SLA context, deadlines, feedback, renewal reminders | Client directory, Inbox queue, Client 360, due list, status history |
| Finance / Accounting | Which financial record needs review, collection, payment, reconciliation, posting, or close? | Transactions, receivables/payables, document references, unmatched items, posting/close controls, verified reports | Financial register, aging table, transaction queue, reconciliation list, formal reports |
| People Operations / HR | Which employment lifecycle, leave, training, or people record needs action? | Onboarding/offboarding, employment status, contract expiry, leave/absence, training, review completion, authorized capacity context | Protected registers, calendars, due-date queues, employee detail |
| CMS / Editorial | Which content record needs editing, review, publishing, or follow-up? | Content type, draft/publication status, updated date, content owner, validation/publishing issues | Content register, editor, preview, publishing queue |
| System Administrator / IT operations | What setting, access control, integration, backup, or incident requires safe action? | System state, user/access changes, integration connectivity, sync exceptions, audit events, backup verification | Configuration groups, searchable audit table, exception list, confirmed system status |

Use the closest relevant persona for each real employee. Do not create a separate UI for every job title if two roles perform the same task and have the same authorized information.

### 4.2 Adaptation layers

Role-aware content should use four clearly separated layers.

**Layer A — Shared workspace baseline**
- Every user sees the same conceptual purpose, canonical data definition, status meaning, page hierarchy, and source-record identity for a workspace.
- Labels and metric definitions cannot change meaning between users.
- A record has one status/business identity even when displayed differently in multiple workspaces.

**Layer B — Authorized role/persona preset**
- Changes default priority/order of relevant information, default worksheet, useful columns, saved filters, chart visibility, and supported actions shown first.
- Uses only permitted data and actions.
- May choose a different starting view without creating duplicate records, route ownership, or business logic.
- Should make the user's main job faster, not hide critical warnings.

**Layer C — Individual preferences**
- May include preferred table columns, density mode when supported, saved filters, default presentation (table/board/calendar where available), and reporting-period preference.
- Must not override authorization, source-of-truth values, required financial/system controls, or another user's private view unexpectedly.
- Clearly distinguish personal saved views from shared/team views.
- Do not introduce new persistence or preference infrastructure without explicit implementation scope and architecture review.

**Layer D — Current task or record context**
- Record selection, active filters, reporting period, due date, and detail state refine what is displayed in the current workspace.
- URL and active-tab state must remain consistent with the current route.
- Breadcrumbs are contextual for deep records, not a global role-personalization mechanism.

### 4.3 What must remain consistent across roles

The following may not change merely because the role/preset changes:

- Metric definitions, currency, units, date boundaries, timezone, and data provenance.
- Business status meaning and lifecycle constraints.
- Canonical record identity, record relationships, and module ownership.
- Existing permissions, route guards, server-side authorization, and restricted-field handling.
- Financial calculations, accounting postings, payment and reconciliation semantics.
- Security state, audit history, validated save/publish/send outcomes, and error meaning.
- Required information needed to perform an authorized high-risk task safely.

### 4.4 Priority order when choosing default content

Prioritize content in this order:
1. Required safety, authorization, or high-risk exception relevant to the current task.
2. Work the current user owns that is due, overdue, blocked, or awaiting their decision.
3. Information required to complete the selected workflow.
4. Context that materially changes the user's interpretation or next action.
5. Secondary reporting and optional analytics.

Never reorder content so aggressively that a meaningful exception becomes invisible. A role may have a shorter default view, but the user must still be able to reach other authorized information in the proper workspace.

---

## 5. Page anatomy by type

Do not force each page to include every section. Choose the minimum hierarchy that fully supports the page's primary job.

### 5.1 Overview / executive workspace
1. One header with the workspace name and only necessary context/actions.
2. A compact group of relevant, source-backed measures if they guide decisions.
3. The primary decision area: exceptions, trends, portfolio status, or due actions.
4. One or two supporting visualizations or context panels only when they add distinct value.
5. Useful links to the owning source workspaces.

### 5.2 Register / directory worksheet
1. Header and authorized primary create/export actions when supported.
2. Search, filters, sorting, and current-scope indicators.
3. A dominant table/list with clear identity, status, owner, date, and next action as relevant.
4. Row details and row actions that do not conflict with selection.
5. Pagination/virtualization appropriate to the existing implementation; clear empty/error/no-match states.

KPI strips are not the default for every register.

### 5.3 Queue / follow-up / exception worksheet
1. Header and concise current scope.
2. A meaningful priority/due-date/status queue.
3. Items ordered using an explicit, understandable rule; allow supported sorting or filtering.
4. Each row identifies the item, owner, deadline/SLA where valid, related record, and next action.
5. Selecting an item leads to the canonical record or a stable detail workspace.

### 5.4 Board / pipeline worksheet
1. Clear status/stage columns with readable counts when the counts are valid.
2. Cards containing the minimum identity, owner, due date, priority, and blocker state needed to decide next action.
3. Supported transitions, explicit pending/error feedback, and a keyboard-accessible alternative to drag-and-drop.
4. Views operate on the same canonical records as the list/register.
5. Avoid overcrowded cards and arbitrary colors; colors use established semantic tokens.

### 5.5 Detail workspace
1. Identity/title and business status.
2. Main next action, subject to permission and lifecycle rules.
3. Essential summary fields and dates.
4. Related sections: activity/history, attachments, linked records, comments/reviews, or financial references only when relevant.
5. Clear path back to the owning workspace; use conditional breadcrumbs when they improve orientation.
6. Do not repeat data from source modules as independently editable copies.

### 5.6 Calendar / timeline
- Show a meaningful time window, understandable labels, and a clear indication of overdue, scheduled, or at-risk items.
- Use color alongside text/icons; never convey status through color alone.
- Provide a list alternative or accessible record details.
- Do not show a deadline as a confirmed schedule when only a rough estimate exists.
- Keep timeline/calendar and list modes linked to the same records.

### 5.7 Editor / form / configuration
- Group fields by user purpose rather than database table.
- Keep labels visible and describe constraints next to the field.
- Use shared drawer/modal patterns according to their specialist guidelines.
- Keep save/cancel/submit behavior and pending/error feedback consistent.
- Show actual current configuration and the consequence of sensitive changes.
- A preview, client-side validation, or optimistic UI is not proof of persistence, send, publish, payment, or integration success.

### 5.8 Analytical / financial report
- State the question, reporting period, units/currency, source, and definition before interpretation.
- Distinguish totals, rates, balances, movement, and period-end values.
- Use a chart only when it improves comparison/trend interpretation; keep exact values and audit/report details available in a table.
- Do not infer a financial or operational conclusion that the source data does not support.

### 5.9 Reference layout recipes

These wireframes describe content hierarchy, not exact pixels or permission rules. Use existing AMS components/tokens and adapt spacing responsively. They are examples of page anatomy; do not create a separate bespoke design system for each recipe.

**A. Executive / operational overview**

```text
[Module / workspace title]                         [Primary permitted action]
[Concise context / selected period]

[Relevant metric]  [Relevant metric]  [Relevant metric]   (optional, source-backed)

[Main exception / decision queue             ] [One distinct supporting trend]
[Identity | priority/state | owner | deadline ] [Question + period + legend      ]
[Next action / source-record link             ] [Authorized drill-down if real    ]

[Supporting context or recent meaningful activity, only if useful]
```

Use this pattern for Dashboard Overview, selected module Overviews, and Finance Executive Summary where the summary drives decisions. If the user must process a queue, make the queue the larger/primary area. Do not add metrics just to fill the row.

**B. Register / directory worksheet**

```text
[Workspace / worksheet title]                       [Create / other permitted action]
[Search] [Relevant filters] [Sort] [View]            [Active filter scope / Clear]

[Canonical table or list                                                    ]
[Identity] [Status] [Owner] [Date / amount] [Related record] [Next action]
[Pagination / result scope / safe bulk actions when implemented]

[Row selection opens detail; row actions do not accidentally activate the row]
```

Use this for Project Registry, Client Directory, Accounts Receivable/Payable, Time Logs, Document Library, CMS registers, and similar worksheets. KPI cards are optional and usually unnecessary above a high-throughput table.

**C. Queue / exception worksheet**

```text
[Queue title]                                            [Permitted action]
[Scope / priority / due-date filters]

[URGENT or OVERDUE group only if actual records match the condition]
[Item summary] [Owner] [Due/SLA] [Related record] [Next action]
[Other actionable groups / clear empty-filter state]

[No chart unless a distinct analytical question adds material value]
```

Use for Inbox Follow-ups, client issues, review queues, Finance exceptions, onboarding blockers, and close-control tasks. Sort order must be explicit (for example overdue first, then due date); do not silently change business priority or state.

**D. Record detail**

```text
[Ancestor breadcrumb when useful: Parent workspace]          (optional)
[Record name / identifier] [Actual status] [Permitted next action]
[Key identity / owner / dates / relevant summary]

[Main detail section]
[Related records] [Documents / versions] [Activity/history] (only applicable sections)
[Clear return path to the owning workspace]
```

The current record title appears once as the page heading. Breadcrumbs are only for helpful ancestors; do not create another row of persistent navigation. Every related-record panel links to the canonical owner and follows the current user's access.

**E. Role adaptation without changing the page's meaning**

Example: the same Project Registry record source may default to owner/deadline/blocker columns for a Project Manager and status/health/key deadline columns for an executive. The project identity, business status, metric definition, authorized data, and source links remain consistent. A selected persona may not grant additional permissions.

**F. Responsive transformations**

- Desktop: keep the main working surface dominant; use a secondary panel only if both areas remain readable.
- Tablet: stack secondary context or move record detail into an established compact pattern; preserve identity/status/next action.
- Mobile: keep key identity, status, deadline and permitted next action discoverable. Allow useful horizontal table scrolling or a compact row/detail path rather than silently removing important fields.
- All sizes: retain keyboard access, non-hover affordances, active filter scope, truthful statuses, and confirmation for sensitive actions.

---

## 6. Chart and visual selection standards

### 6.1 Select the visual for the question

| User question | Preferred visual | Avoid |
|---|---|---|
| How did a metric change over time? | Line chart, or columns for discrete periods | Pie/donut chart for a time series |
| Which categories are highest/lowest? | Horizontal bar chart with clear value labels | Angled labels, excessive series, 3D effects |
| How does actual compare with plan/budget? | Paired bars or a clearly labeled variance table/bar | A percentage without denominator or context |
| What is the workflow stage of each item? | Board, grouped register, or stage/status distribution when it adds insight | Treating a stage chart as a substitute for actionable items |
| What needs attention first? | Priority queue, exception table, due list | A decorative aggregate chart with no record drill-down |
| When do work items overlap or become late? | Calendar/timeline plus accessible list alternative | A dense chart without task identity or dates |
| What amount/status is actually recorded? | Searchable, auditable table/register | Chart-only presentation of records needing action |
| How are parts of one total composed? | Stacked bar; donut only for a few mutually exclusive categories with a meaningful total | Many small slices or categories with unclear relationship |

### 6.2 Chart acceptance requirements

Every chart must have:
- A specific question it answers and a clear title.
- Source-backed values only; no fixtures or made-up missing history.
- Reporting period/date range, unit/currency, and timezone where relevant.
- Legible axis labels, units, legends, and comparison definitions.
- A distinct loading, no data, unavailable, and error state.
- Accessible color contrast and non-color cues for series/status.
- A table or textual summary when users need exact values.
- A drill-down only when a real authorized destination exists.
- Consistent behavior when the role or current filter changes.

Do not render a chart if the data is too incomplete to support it. Explain the unavailable measure, offer the source table or safe next step, and do not draw a fabricated zero line.

### 6.3 Dashboard chart budget

For each overview page, prefer a small number of clearly differentiated visualizations. As a starting design budget, use no more than two primary charts unless the page's decision-making needs clearly justify more. Supporting exception lists and source links are often more valuable than adding another chart.

This is a design heuristic, not a hard limit that may remove critical information.

### 6.4 Financial reporting safeguards

- Revenue, invoice value, cash received, outstanding receivables, expenses, profit, bank/account balance, and cash movement are different measures.
- Every financial chart/table must use the existing Finance definition and valid source.
- If period comparison is unavailable or denominator is zero, do not invent a percentage.
- “Planned vs Actual” must define which plan and which recorded actual values are compared.
- Do not recalculate or reinterpret formulas to produce a prettier chart.

### 6.5 Metric and visualization specification contract

Before implementing any KPI, status aggregate, trend or chart, document the following. If an item cannot be proven from current source/API/business rules, mark it as a discovery gap or target-only requirement.

| Metric contract field | Required definition |
|---|---|
| Metric name and stable UI label | One understandable name; avoid labels that imply a different business measure |
| Decision question | What decision or interpretation should the number/chart support? |
| Canonical owner/source | Owning module and existing source endpoint/record/report; Dashboard is an aggregator, not the record owner |
| Calculation authority | Existing tested business calculation or documented definition. Do not invent a new frontend formula |
| Unit and dimensions | Currency/unit, percentage/count/duration, applicable category, client/project/status dimensions |
| Time semantics | Business timezone, period start/end, reporting granularity, as-of date, and whether it is an event date or period-end snapshot |
| Comparison rule | Prior period/budget/target or none; baseline and denominator semantics must be valid |
| Freshness and provenance | Last successful update/verified time where available; known source/staleness limitations |
| Missing/invalid states | Distinguish real zero, no records, partial source, unavailable, stale, error and undefined comparison |
| Role presentation | Which personas benefit and what prominence/default filter changes; definitions remain the same |
| Drill-down | Real authorized destination at the correct data grain, or explicitly no drill-down |
| Acceptance evidence | Source value/report/API contract and relevant tests or reconciliation evidence |

Implementation rules:
- Do not implement a metric solely because it appears in a wireframe.
- A percentage is only valid when numerator, denominator and period semantics are defined; if denominator is zero or unavailable, show an appropriate unavailable state.
- Do not combine unlike units, periods, currencies or accounting meanings on a shared axis.
- Do not use a chart tooltip or dashboard aggregation to expose information the current user is not authorized to see.
- A table alternative must remain available when exact values, auditability or row-level actions are important.
- When no chart is useful, state “No chart needed” and specify the register, queue, timeline, or simple status summary that better serves the task.

---

## 7. Module and worksheet content blueprint

All structures below describe target content, not verified implementation. At implementation time, confirm which fields, actions, data sources, and presentation modes already exist.

### 7.1 Dashboard

**Primary purpose:** show operational state and the next decisions required across AMS without becoming a second record system.

#### Overview
- **Primary area:** source-backed attention/exception list plus concise context.
- **Useful content:** overdue or at-risk projects, tasks requiring action, follow-ups due, client service issues, overdue invoices, reconciliation exceptions, upcoming contract renewals, capacity pressure, and integration incidents when relevant/available.
- **Metrics:** only role-relevant, available measures. Label metric, period, unit/currency, source and freshness as appropriate.
- **Visual:** at most a small set of useful trends/portfolio comparisons. A source-linked exception list is often the main area.
- **Actions:** open the owning Project, Inbox, Clients, Finance, Team & Resources, Documents, CMS, or Settings destination.
- **Must not:** combine unlike financial measures, use hardcoded counts, show restricted data, or imply Dashboard owns these records.

#### Performance
- **Primary area:** period comparisons and trends relevant to authorized scope.
- **Possible series:** delivery timeliness, task throughput, client health, revenue/cash, or resource load when definitions/data are available.
- **Controls:** reporting period and supported comparison.
- **Visual:** line for time trend; bar for category/period comparison.
- **Must not:** calculate a new business KPI ad hoc or treat missing history as zero.

#### Analytics
- **Primary area:** focused analysis that goes beyond the high-level overview.
- **Possible analysis:** delivery trends, revision/quality patterns, financial reporting using valid Finance definitions, AR aging, retention/renewal indicators, or campaign performance where reliable data exists.
- **Visual:** one question per chart with clear filters, source and drill-down.
- **Must not:** repeat Overview with renamed cards or use metrics unsupported by source data.

### 7.2 Inbox

**Primary purpose:** triage inbound communication and ensure follow-ups have an owner and next action.

#### Overview
- Primary area: message/request items that require attention and due/overdue follow-up context.
- Supporting information: recent activity and concise counts if source-backed.
- Keep actions and urgent items more prominent than general charts.

#### Messages — All Messages
- Queue/list of canonical threads.
- Suggested columns/context: sender/contact, short subject/summary, source/channel, received/updated time, category, status, priority, owner/PIC, due date/SLA when valid, linked client/project.
- Filters: status, priority, owner/PIC, channel, category and date range as supported.
- Primary action: open thread, assign, classify/link, respond through a supported integration, create/link a follow-up, resolve/reopen, or archive when permitted.
- Use a split-pane layout only if both the queue and conversation remain readable at common desktop widths; provide appropriate compact behavior.

#### Messages — Sales Inquiries
- Same canonical message record with a sales-inquiry category/view.
- Highlight inquiry summary, source/contact, owner, priority, response/follow-up due date and linked commercial/client context where available.
- Do not make a new lead/opportunity master or expose a standalone CRM pipeline.

#### Messages — Client Requests
- Same canonical message records categorized as client requests.
- Highlight client/project reference, request summary, urgency, assigned owner, due date/SLA if configured, current status and next action.
- Client detail may link back to the thread, but Inbox remains the request/conversation owner.

#### Messages — Project & Support
- Same canonical messages with project/support categorization.
- Highlight project link, issue/request summary, priority, owner, status and relevant deadline/SLA.
- Do not create a second support record when an existing source record is the canonical item.

#### Messages — filters and saved views
- Unread, Starred, Resolved and Archived are filters/saved views, not separate workspaces.
- Resolved and Archived remain distinct business states.
- Show the active filter scope and allow clearing it. Empty filtered results must be distinct from an empty source.

#### Follow-ups — Due Today / Upcoming / Overdue / Completed
- One follow-up dataset with views by due date/status.
- Suggested columns: follow-up title/context, linked thread/client/project, owner/PIC, due date, status, priority where supported.
- Primary area is an actionable list ordered by due urgency.
- Do not create a duplicate general task system or infer due dates.

#### Routing & Templates — Routing Rules
- Show only real supported routing rules, their purpose/conditions, destination/owner, enabled state and observable recent outcome if available.
- Provide authorized create/edit/test actions only where those features exist.
- Keep configuration feedback clear and do not claim a message was routed until confirmed.

#### Routing & Templates — Response Templates
- Register of template name, intended use, channel/language, status, last updated, preview and authorized owner where available.
- Editor preview should distinguish placeholder content from the actual message payload.
- Do not claim a message was sent from preview or template selection alone.

### 7.3 Projects

**Primary purpose:** control project delivery from registry and planning through execution, review and closure.

#### Overview
- Main area: portfolio exception list, upcoming deadlines/milestones, blockers and projects needing a decision.
- Optional summary: active/on-hold/at-risk distribution when real statuses support it.
- Must not duplicate a full Project Registry table below or above a dashboard grid.

#### Project Registry
- Canonical project register with project identity/name, client, owner/PM, status, planned dates/deadline, progress, health and budget reference where supported.
- Status views Planning, Active, On Hold, Completed and Archived are filters/saved views over the same records.
- Useful filters: client, status, owner, deadline/date range, service/type and valid health indicator.
- Primary actions: open detail, create/edit where supported, change permitted status, and archive according to policy.
- Financial fields link to Finance definitions; do not create project-local accounting values.

#### Tasks & Execution — Board / Kanban
- Show status columns and task cards with task identity, project, owner, priority, due date and blocker/dependency cue when available.
- Keep transitions and drop targets understandable; provide keyboard/list alternatives.
- Counts should reflect source records and active filter scope.

#### Tasks & Execution — List
- Task table with task identity, project/task list, status, assignee, priority, due date, dependency/blocked state, estimate/actual only if valid time logging exists.
- Support useful filters, sort, search and bulk actions only where behavior is implemented and safe.

#### Tasks & Execution — My Tasks
- Personalized view of canonical tasks the current user owns or is assigned to.
- Prioritize overdue, due next, blocked, and tasks awaiting the user.
- Never infer assignment or ownership from the UI alone.

#### Tasks & Execution — Task Lists
- Grouping and task-list membership over the same canonical tasks.
- Show list purpose/project, task counts, and next deadlines if supported.
- Do not create a second task identity.

#### Tasks & Execution — Dependencies
- List or simple dependency diagram focusing on blocked items, predecessor/successor, owner, planned dates and impact.
- Show only real dependency relationships and avoid decorative network diagrams.
- Provide a readable tabular alternative to any visual dependency display.

#### Planning & Delivery — Project Brief
- Purpose/objective, client/project identity, owner, scope context, success criteria, important dates and source-linked references.
- Editing belongs in the existing supported project edit flow.

#### Planning & Delivery — Scope & Deliverables
- Deliverable register: item, description/acceptance criteria, owner, due date, status, client visibility/review state when supported.
- Scope changes must reference the established change-control workflow.

#### Planning & Delivery — Milestones
- Register or timeline of milestone identity, target date, owner, linked deliverables/dependencies, status and risk.
- A timeline is useful where it reveals sequence or delay; retain a list with exact dates.

#### Planning & Delivery — Timeline
- Project schedule view over existing milestones/task dates, not a second schedule source.
- Show dependencies and actual/target dates only when recorded.

#### Planning & Delivery — Deliverable Tracking
- Queue of deliverables awaiting work, QA, client review or revision.
- Identify the responsible person, current version/reference, due date and next step.

#### Planning & Delivery — Internal Quality Review
- Review queue, checklist/criteria, reviewer, due date, result and linked deliverable version.
- A review may change content state only through the established workflow and permission rules.

#### Planning & Delivery — Client Review
- Deliverables waiting for client response, feedback summary, sent/review date and revision needs if those data exist.
- Do not imply that a client has reviewed or approved an item without a recorded outcome.

#### Planning & Delivery — Revision History
- Chronological history of versions/revision requests, who requested them, feedback, related version and completion state.
- Use a timeline/list rather than charting events without analytical value.

#### Content & Campaigns — Content Calendar
- Calendar/list of content items with title, client/project, campaign/channel, owner, publish/planned date and production/publication status.
- Calendar must remain linked to the underlying content records and provide a list alternative.

#### Content & Campaigns — Content Planning & Briefs
- Brief register/editor with objective, audience, format/channel, deliverable requirements, owner, due date and approval context when supported.

#### Content & Campaigns — Content Production Pipeline
- Status-based board/list for assigned production items, with owner, due date, blockers and current review stage.
- Use the same content records across calendar, pipeline and publication views.

#### Content & Campaigns — Creative Assets & Versions
- Asset/version list showing item, file reference to Documents, version, owner, related content, update date and review status.
- Documents owns the canonical file metadata and secure storage flow.

#### Content & Campaigns — Internal Review
- Internal review queue with reviewer, checklist, comments, relevant content version and outcome.
- Avoid a generic Approval module; this is a contextual content workflow.

#### Content & Campaigns — Client Review & Feedback
- Client-facing feedback context, reviewer/respondent where available, feedback date, related version, requested changes and current decision state.
- Do not present a preview link as proof that content was delivered or approved.

#### Content & Campaigns — Revision Tracking
- List of revisions with request date, requester, reason/feedback, owner, due date and current state.

#### Content & Campaigns — Publishing Schedule & Publication Status
- Planned/scheduled publication date, channel, target URL/reference, assigned owner and confirmed publication state when the mechanism returns one.
- Manual status must be identified honestly if automated publishing is not integrated.

#### Content & Campaigns — Campaign Tracking & Performance
- Campaign register: objective, period, client/project, channel, owner, planned budget and current state when recorded.
- Performance report: metric definition, date range, source and actual value. Do not fabricate advertising data.

#### Project Resources — Project Team
- Assigned members, responsibility, work role and linked work items where supported.
- Personal data and cost information remain permission controlled.

#### Project Resources — Assignments
- Assignment list with person, project/task, planned dates, estimated effort, status and conflicts where valid data exists.
- Team & Resources remains source for person availability and capacity.

#### Project Resources — Workload
- Show allocation/capacity with definitions and period.
- A horizontal bar comparison can help reveal overload if capacity and effort are trustworthy. A table is still needed for exact workload and owner.
- Missing timesheet/capacity data must not appear as 0% utilization.

#### Project Controls — Change Requests
- Request, requester, reason, affected scope/deliverables, expected impact on timing/cost where provided, reviewer/owner, status and decision history.
- Price/billing outcomes link to approved commercial/Finance records.

#### Project Controls — Risks, Issues & Blockers
- Register with item type, summary, project, severity/priority, owner, due/target date, mitigation/next action and status.
- An exception list is generally more useful than a pie chart.

#### Project Controls — Budget Summary / Planned vs Actual
- Present approved/planned amounts and recorded actual values with definition/source and relevant period.
- Use a paired bar or variance table only when both values are available and semantically comparable.
- Never build a new ledger, recalculate Finance totals, or assert project profit without valid Finance records.

#### Project Controls — Delivery Health
- Explain underlying signals such as late tasks/milestones, scope change, resource pressure, pending reviews and unresolved issues.
- If no approved health formula exists, show individual signals rather than inventing a composite score.

#### Project Controls — Reports & Closure Checklist
- Summarize actual deliverables, acceptance/outstanding issues, handover records, close-out tasks and archive readiness.
- Checklist status must reflect linked business records where required, not cosmetic completion alone.

#### Project Controls — Related Project Files
- Contextual filtered view into Documents.
- Show permitted filename, category/type, version, project relationship and update time as available.
- Never create a second project file store or expose storage URLs.

### 7.4 Clients

**Primary purpose:** maintain canonical client identity and make relationship, onboarding, service, and contractual obligations clear.

#### Directory
- One canonical company/client/contact register.
- Primary identity fields: company/client name, relationship status, primary contact, service context, relationship owner and latest relevant activity where permitted.
- Companies and Contacts are views/filters over canonical records.
- Search, status, owner and relevant service/client filters should reflect available fields.

#### Companies worksheet/view
- Company/account identity, relationship status, authorized client owner, active project/service context, and relevant contact count or latest interaction only if available.
- Selecting a company opens Client 360° context rather than another duplicate master record.

#### Contacts worksheet/view
- Contact identity, client/company relation, role/position if available, work contact channels authorized for the current user, and relationship status.
- Personal/contact data must be appropriately limited.

#### Client 360° record detail
- First section: identity, relationship status, relationship owner, active service context, next important date/action.
- Internal sections: contacts, projects/deliverables, agreements/retainers, linked Finance summaries, Inbox conversations/requests, Documents, feedback, and relevant history.
- Each section should link to the canonical owning record. Do not permit edits to other modules' data through unreviewed duplicate fields.

#### Onboarding — Onboarding Checklist
- Onboarding item, linked requirement/record, owner, due date, status, blocking reason and completion evidence/reference.
- Provide readiness summary only when required checklist items and linked records are valid.

#### Onboarding — Required Documents
- List required and received document references, requirement owner, verification status and due date.
- Documents remains the secure source; do not copy files into a second storage area.

#### Onboarding — Kickoff Readiness
- Show blocking requirements, owner and next action before kickoff.
- Do not mark ready based solely on a manually ticked cosmetic checklist when required records remain missing.

#### Agreements — Contracts & SOWs
- Agreement register with client, agreement type, owner, status, start/end/expiry dates, scope reference and authorized document link.
- Support expiration and history context. Quote, invoice and payment values link to Finance.

#### Agreements — Retainers & Service Commitments
- Client, service scope, period, included hours/units, used/remaining units from valid Time Tracking records, renewal date and terms/status.
- Do not double-count time usage or calculate from missing entries as if the value were zero.

#### Agreements — Renewal Schedule
- Queue/calendar of upcoming renewals with client, agreement/retainer, renewal date, accountable owner, notice deadline, and next action.
- Do not create a parallel CRM sales pipeline.

#### Agreements — Contract History
- Chronological agreement versions/status changes and authorized linked documents. Preserve history; do not overwrite past terms silently.

#### Service & Health — SLA Monitoring
- Active SLA commitments, relevant response/resolution clocks, breach risks and history only when SLA definition, business calendar, timestamps and pause rules are supported.
- Separate measured SLA status from unconfigured/manual tracking.

#### Service & Health — Service Issues & Feedback
- Linked issues/request feedback with source module, client/project, owner, urgency, status, date and next action.
- Inbox owns the request/conversation itself; avoid a second queue.

#### Service & Health — Client Health
- Show meaningful indicators such as unresolved service issues, relationship feedback, renewal timing, overdue commitments, or retainer utilization when defined.
- State why a client is flagged. Do not invent a black-box health score.

#### Service & Health — Service History
- Timeline/list of significant service events, feedback and linked requests/projects subject to access.
- Prioritize recent meaningful changes, not a duplicate all-activity stream.

### 7.5 Finance

**Primary purpose:** provide a reliable financial control and accounting workspace. This blueprint does not change the existing Finance rules, calculations, IDs, API contracts, journal behavior, permissions, or twenty existing worksheet keys.

The five workspaces remain Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, and Accounting & Reports.

#### Overview & Control — Executive Summary
- Main area: selected-period financial position and prioritized financial exceptions.
- Possible measures: recognized revenue, recorded expenses, outstanding AR, due/overdue invoices, recorded cash/bank context, and profit only when the existing definition is valid.
- Separate distinct financial measures, show period/currency/definition and source, and provide authorized drill-downs.
- A short trend chart may support analysis; the exception register should make next actions clear.

#### Overview & Control — Dashboard
- Purpose-built validated financial charts/metrics for the authorized reporting scope.
- Do not duplicate executive summary metrics unless the visualization answers a distinct question.
- Exact transaction amounts and formal report outputs remain accessible from registers/reports.

#### Transactions & Cash — Cash & Bank
- Main area: account/transaction register and recorded bank/cash movement.
- Suggested fields: account, transaction date, reference, direction, amount/currency, source/payee, status, match/reconciliation state and link to source record where available.
- Distinguish a recorded balance from a bank-confirmed balance; expose freshness and sync status if supplied by the source.
- A balance trend is valid only when history and balance definitions are reliable.

#### Transactions & Cash — Revenue
- Existing revenue record/invoice workflow register.
- Suggested fields: invoice/source reference, client, issue/due dates, amount/currency, current financial status, recorded receipts/payment links where available.
- Do not treat issued invoice amount as cash received or independently recalculate revenue recognition.

#### Transactions & Cash — Expenses
- Expense register with date, category, vendor/payee reference, purpose, amount/currency, project or cost allocation where supported, source document, status and payment link.
- Any approval/payment state is the one represented by the established workflow; do not create frontend-only money states.

#### Transactions & Cash — Petty Cash
- Petty cash records with fund/account, transaction date, type, amount, description, responsible user, supporting document and recorded balance where supported.
- Keep reconciliation and approval semantics faithful to existing Finance rules.

#### Receivables & Payables — Quotations
- Quotation register and builder using existing canonical quotation records and workflow.
- Show quotation number, client, version, status, amount/currency, valid-through date, owner and conversion/contract reference where available.
- Use templates through the supported template path. Preview does not mean sent/accepted; keep version/history and transition semantics.

#### Receivables & Payables — Accounts Receivable
- Receivable/invoice register with invoice ID/number, client, issue/due dates, original amount, paid/credited amount if valid, outstanding balance, aging bucket and state.
- Prioritize overdue/due items and their follow-up, but keep exact values available.
- Aging chart can be useful if bucket definitions and source data are correct; the register is the action area.

#### Receivables & Payables — Accounts Payable
- Payable register with vendor reference, source invoice/bill, due date, amount/currency, payment status and permitted payment references.
- Prioritize due/overdue obligations and blocked/exception items; do not imply payment was executed without confirmed status.

#### Receivables & Payables — Vendors financial reference
- Link to the canonical supplier record in Team & Resources.
- Show Finance-specific ledger/payment/bill context only for authorized users.
- Do not create a second vendor master or let finance access implicitly grant vendor personal-data access.

#### Receivables & Payables — Vendor bills and payment references
- Record list with vendor, bill/reference, date, due date, amount/currency, source document, status and payment reference as actually recorded.
- If the same data is already in Accounts Payable, prefer a relevant filter/detail section over a duplicate independent register.

#### Project Finance — Project Finance
- Project-linked financial records and summaries using existing source definitions.
- Show project/client, authorized financial values, period, source and links to underlying Finance records.
- A profitability chart is permitted only if both revenue/cost definitions and underlying records support it.

#### Project Finance — Operational Budget
- Approved/recorded operational budget categories, period, plan, actual and variance when those values already exist.
- Display the defined budget source and avoid silently merging estimates, commitments and actual expenses.

#### Project Finance — Project Allocation
- Existing allocation data with project, category/resource, assigned amount/percentage, period and source references where available.
- Preserve current allocation rules; do not infer or redistribute financial amounts through presentation code.

#### Project Finance — Team Fee
- Existing team-fee calculations and associated period/project/resource context under current Finance definitions.
- Exact totals, source inputs and restrictions must remain visible to authorized users. Never redesign the UI by altering formulas.

#### Accounting & Reports — Journal
- Journal list/detail with date, journal reference, period, source record, debit/credit values, state and permitted posting/review actions.
- Clearly distinguish draft, posted, reversed, or other actual statuses used by the application.
- No chart needed for routine posting control; use exact table values and audit/detail context.

#### Accounting & Reports — Chart of Accounts
- Searchable account register with code, account name, type/category, active state and mapping information where available.
- This is configuration/master data. Changes must respect the current accounting workflow and cannot silently rewrite historic reports.

#### Accounting & Reports — Monthly P&L
- Formal period report with income, expenses and profit/loss totals as defined by existing accounting logic, plus exact line-item detail.
- Optional trend/comparison chart is secondary to the report table and requires comparable periods.
- Explain selected period and currency; preserve existing calculation behavior.

#### Accounting & Reports — Cash Flow
- Report of cash movement for the selected period and its defined categories.
- Keep movement, closing balance, bank balance and cash position conceptually distinct.
- Show exact values in the report table; use bars/lines only if the underlying series supports useful interpretation.

#### Accounting & Reports — Balance Sheet
- Formal financial position at the selected reporting date: assets, liabilities and equity using the existing report definitions.
- Exact hierarchy, subtotals and reporting date must remain visible. Charts are usually secondary and optional.

#### Accounting & Reports — Monthly Closing
- Period-close control register with period, checklist/control status, exceptions, accountable owner and available audit details.
- Highlight open blockers and close readiness only where the current workflow calculates or records them.
- Preserve locks, posting controls, maker-checker and audit behavior.

#### Accounting & Reports — Annual Summary
- Annual period and year-over-year summaries based on valid financial reports.
- Use comparable-period trend bars/lines where definitions are consistent, with exact values and links to monthly/detail reports.

#### Additional target views requiring verification
- Document Templates, Bank Accounts, Bank Transactions & Reconciliation, Bank Mandiri Kopra H2H, and Purchase & Expense Requests may be represented as internal views when approved and supported.
- They are target-only until the existing data/API/workflow is verified. Do not imply that documentation creates new records, a transaction workflow, a connected bank service, or a new worksheet key.
- Do not change the preserved twenty worksheet keys or Finance calculations merely to fit this content model.

### 7.6 Team & Resources

**Primary purpose:** identify accountability, available capacity, people lifecycle obligations, supplier records, and time records.

#### Team & Capacity — Team Directory
- Canonical team-member identity and permitted work profile.
- Suggested columns: name, team/department, work role, status, manager or lead where available, skills, active assignment count and availability summary if authorized.
- Avoid sensitive HR/compensation information in the general register.

#### Team & Capacity — Roles & Departments
- Organizational classification and authorized membership view based on the existing model.
- Do not create a competing role/permission management system here; security roles remain governed by Settings and backend authorization.

#### Team & Capacity — Capacity Allocation
- Allocation by person/project/period with recorded or configured capacity, assigned effort, valid time log/estimate sources and utilization definition.
- Show unavailability separately from missing data.
- A stacked bar or horizontal allocation view can help compare people, but exact assignments and dates remain in the table.

#### Team & Capacity — Availability & Workload
- Period-based availability, approved absence, active assignments and conflict warnings when valid data exists.
- Calendar/list preferred to a generic utilization pie chart.
- Do not silently reassign projects or change deadlines based on leave.

#### People Operations — People Profiles & Employment Details
- Detail linked to Team Directory identity.
- Employment fields, manager, department, start/end dates, status and secure document references according to existing permissions.
- Do not create an Employee Directory master independent from Team Directory.

#### People Operations — Employee Onboarding
- Checklist register with new team member, owner, due date, item/status and blockers.
- Include document, equipment, training and initial assignment references where tracked.

#### People Operations — Employee Offboarding
- Checklist and timeline for last working date, handover, asset return, document/knowledge handover, access-removal request/check, and final tasks.
- A UI checkbox is not proof of external account revocation.

#### People Operations — Employment Contracts & Status
- Authorized contract/status register with type, effective dates, expiry/reminder, document reference and history.
- Restrict compensation/confidential contract details.

#### People Operations — Leave & Absence
- Request/record list plus calendar views where supported: person, period, type, status and approval/review history per the existing process.
- Clearly distinguish requested, approved, rejected, cancelled and unavailable states where applicable.

#### People Operations — Training & Development
- Training register with employee, learning objective, provider, dates, status/completion, certificate and skill tags where recorded.
- Costs and private notes only when relevant and authorized.

#### People Operations — Performance Reviews & History
- Restricted register of review period, reviewer, status, completion due date and related employee record.
- Detail includes established criteria, feedback, goals, action plan and history.
- Never expose personal performance details in general team views.

#### People Operations — People Operations Reports
- Source-backed summaries such as headcount/status, upcoming employment-contract expiry, absence, training completion and review completion.
- Show time window and definitions; suppress or aggregate restricted personal data according to existing policy.

#### Vendors & Freelancers — Directory
- Canonical supplier/provider list with name, service category, engagement status, business contact and authorized relationship owner.
- Sensitive tax/payment/bank details must be protected; Finance does not create a duplicate vendor master.

#### Vendors & Freelancers — Skills & Service Matrix
- Supplier/service capabilities, relevant skill categories, rate references or service types where authorized, and engagement availability if defined.
- Use a searchable table/matrix rather than a chart unless there is a clear selection decision to support.

#### Vendors & Freelancers — Contracts & Rates
- Agreement/provider, dates, scope, rate/currency, status and secure document reference subject to permissions.
- Financial details should not be exposed to users without authorization.

#### Vendors & Freelancers — Engagement Status
- Current/previous engagement, linked project or purchase/vendor record, effective dates, owner and status.
- Preserve links to Projects, Documents and Finance records.

#### Time Tracking — Time Logs
- Searchable register: person, date, project/task, duration, billable flag/category, notes and review status.
- Exact duration and date take precedence over charts.

#### Time Tracking — My Timesheet
- Current user's valid time entries grouped by period/status, with totals only when computed by existing rules.
- Make missing, draft, submitted, approved or locked states clear if supported.

#### Time Tracking — Timesheet Control
- Authorized review queue with person, period, submitted time, exceptions, reviewer and current control state.
- Keep correction and lock actions within the current process and audit requirements.

#### Time Tracking — Billable / Non-billable
- View over the same time logs grouped by billable classification.
- Do not create duplicate time entries or infer billability where undefined.

#### Time Tracking — Time by Project
- Project/person/period summary calculated from valid time logs and current rules.
- A bar chart can compare effort by project/person for a defined period. Show exact hours and do not interpret recorded time as profit.

### 7.7 Documents

**Primary purpose:** find the canonical file and understand its relationship, version, access, and lifecycle.

#### Document Library
- One searchable, filterable canonical register.
- Suggested columns: document/file name, category/type, related record, owner, last updated, version, sensitivity/access classification where authorized, and status.
- Categories/views: Project & Client Files, SOPs & Policies, Legal & Corporate, Finance & Tax, HR & People, Security & Infrastructure.
- Filter/search first; do not add charts merely to fill the page.

#### Document record detail / preview
- File identity, canonical source/related business record, category, version/date, owner, permitted access/retention information and available preview.
- Actions may include preview, download, upload/replace, version history or deletion only where supported and authorized.
- Show per-file validation/progress/error; preserve version/audit rules.
- If preview is unavailable, say so and use a secure app download path. Never expose raw storage/object URLs.

### 7.8 Website CMS

**Primary purpose:** manage content by type and make save/review/publication state verifiable.

#### CMS Overview (optional)
- Only include if it provides useful cross-content publishing status, items requiring attention, sync/publish errors, or recently updated items with direct drill-down.
- Do not duplicate a Case Studies or another content-type register.

#### Case Studies
- Content register with title, client/subject attribution as permitted, content owner, draft/publication status, last updated, and preview/edit actions.
- Case study business outcomes and metrics must be verified/approved for publication.

#### Services
- Service register with title/name, content category, language/content completeness, publication status, and updated date where available.
- Use fields from the canonical CMS source.

#### Insights
- Article register with title, category, author if supported, draft/review/published state, updated/published date and preview/edit actions.

#### Testimonials
- Register with attributed source, content, permission/approval status where supported, publication status, and last update.
- Avoid implying permission/approval if the system has no recorded evidence.

#### Careers — Jobs
- Job register: title, department/type/location if applicable, status, publish/expiry dates and public job reference.
- Create/edit/close/unpublish actions must follow the supported CMS workflow.
- Closing a job must not delete its applicants or recruitment history.

#### Careers — Applicants
- Restricted applicant queue: applicant identity, job reference, received date, current stage/status, recruiter/PIC and next action where permitted.
- Attachments/CVs and personal notes must be access controlled.
- Do not treat applicants as sales leads or place their lifecycle in Inbox.

#### Careers — Recruitment History
- Chronological status/decision history linked to one applicant/job application.
- It is history context, not a second applicant register. Respect data retention/privacy rules.

### 7.9 Settings

**Primary purpose:** inspect and change authorized system/account/integration settings safely.

#### System Overview — System Status
- Show confirmed current health/state, last check/update and relevant source. A placeholder or unavailable probe must not appear as green success.

#### System Overview — Database Migrations
- Migration state based on the actual authorized source; identify pending/failed/unknown states honestly.
- UI visibility does not permit ordinary users to run migrations.

#### System Overview — Backup Management
- Backup history/status, timestamp, scope, retention and verification/restorability where known.
- Distinguish backup completed from restore verified. Restrict destructive/system-level actions.

#### Users & Access — User Accounts
- Authorized register of user identity, status, last activity or account metadata if available.
- Sensitive account actions require explicit authorization and existing audit behavior.

#### Users & Access — Roles & Permissions
- Role/access configuration or inspection that reflects the canonical backend security model.
- Clearly distinguish descriptive UI from effective permissions. Do not implement a separate frontend authorization system.

#### Users & Access — Security & MFA
- Authorized security/MFA status and supported management/reset workflow with confirmation and audit.
- Never display secrets or recovery material after its permitted one-time disclosure.

#### Audit Log
- Searchable, filterable list with time, actor, action/event, target/reference, outcome and other safe audit metadata.
- Redact secrets and unnecessary personal/bank data. No chart is required for ordinary event investigation.

#### Integrations — Integration Overview
- Catalog/status of genuinely configured integrations with last verified result and status detail.
- Unknown or stale is different from connected/healthy.

#### Integrations — Website & CMS Integrations
- Integration configuration/status and last sync/error context based on current mechanisms.
- Do not claim content synced or published until confirmed.

#### Integrations — Bank Mandiri Kopra H2H
- Only show the capability/configuration panels approved and supported by the actual agreement/specification and implementation.
- Internal panels may include Overview & Status, Connection & Environment, Accounts & Mapping, Synchronization & Diagnostics, Audit Trail.
- Credential/certificate handling is privileged and secret-safe. Do not show secret values or allow an ordinary UI user to run a live transfer as a diagnostic shortcut.
- Status, balance, transaction and payment labels must distinguish requested, submitted, processing, confirmed success, confirmed failure, unknown and reconciliation exception according to the actual bank contract.

#### Preferences
- Keep within an appropriate settings surface unless an independently justified route and workflow exist.
- Personal presentation preferences may control supported display options but may not alter authorization, accounting definitions, shared canonical content or other users' preferences.

---

## 8. Module-specific role emphasis

The following table recommends defaults, not separate permission grants. A persona can use only its already-authorized information and actions.

| Module/workspace | Executive / BOD | PM / Operations | Creative / Marketing | Developer / IT | Client Service | Finance / Accounting | People Ops | CMS Editor / Admin |
|---|---|---|---|---|---|---|---|---|
| Dashboard | Cross-module priorities, trend and exceptions | Delivery risks, workload and overdue work | Campaign/content deadlines when relevant | Technical blockers and tasks | Requests, SLA/renewals | Financial control/aging exceptions | HR deadlines and authorized capacity summary | Publishing/integration exceptions when authorized |
| Inbox | Important unresolved exceptions | Project/client work awaiting action | Content/client feedback and follow-up | Support/technical inquiries | Incoming client work, owner and due date | Finance-related inquiries within permission | Only messages appropriate to authorized HR workflow | Website inquiries; never applicant data by default |
| Projects | Portfolio risk and decision points | Registry, milestones, dependencies, scope, workload | Content planning, assets, review and publishing | Assigned tasks, dependency, blockers and QA | Client review and deliverables relevant to account | Source-linked budget/financial context, not ledger copies | Capacity and absence context only as needed | Content campaign or public content references if assigned |
| Clients | Relationship health, risk, renewal | Client impact on project delivery | Brief, approval/feedback context | Authorized technical project context | Client identity, agreements, service issues, next action | Authorized quote/invoice references | Limited to authorized employment/client staffing context | Client attribution only when required to edit content |
| Finance | Decision-ready financial position and exceptions | Approved project financial summary only | Budget/campaign spend context only if permitted | No default financial detail unless authorized | Invoice/receivable context only if authorized | Full authorized finance workspace | Restricted budget/cost context only if needed | No default access |
| Team & Resources | Aggregate capacity/operational concerns | Assignment and availability conflicts | Relevant team assignment/capacity | Relevant assignment and time record | Assigned account-team context | Canonical vendor reference and authorized finance details in Finance | People lifecycle, contracts, leave/training/reviews as permitted | No default people details |
| Documents | Executive/decision docs within permission | Project/client files and delivery docs | Creative assets/versions/briefs | Technical docs and approved access | Client agreements and service files | Finance/tax documents | Restricted HR documents | CMS content support files |
| Website CMS | High-level publication state if authorized | Project content schedule context | Editorial/content workflows | Technical integration status only when assigned | Approved content/client review links | No default finance data | No default HR data; Careers applicant access only if authorized | Content registers, editor, preview and publish state |
| Settings | Read-only system state if authorized | No default privileged configuration | No default privileged configuration | Authorized system/integration controls | No default privileged configuration | Finance-specific authorized integration status only | Authorized HR-relevant user/settings tasks only | Authorized CMS integration controls |

If a person has more than one responsibility, combine only relevant priorities from permitted contexts; do not combine all pages into a cluttered view.

---

## 9. Standard specification required for every worksheet

Before a worksheet is designed or redesigned, its specification should contain the following fields. If an item does not apply, explicitly say why rather than omitting it without explanation.

1. **Canonical path:** module → workspace → worksheet/detail.
2. **Target status:** target-only, existing and verified, incomplete, unavailable, or awaiting verification.
3. **Primary question:** the main job the worksheet answers in one sentence.
4. **User personas:** primary persona, secondary personas, and any restricted persona boundary.
5. **Main working area:** register, queue, board, calendar, timeline, report, editor, detail view, or configuration.
6. **Information hierarchy:** ordered list of what appears first, second, and in supporting context.
7. **Required visible data:** record identity, status, owner, dates, amounts/units, source, and linked entities as appropriate.
8. **Columns/fields:** exact content, useful default ordering, and why each field helps the job.
9. **Role emphasis matrix:** default metrics/columns/filters/actions that differ by persona; explicit invariants. Complete the relevant worksheet row in `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md` and verify it against actual roles/permissions.
10. **Search and filters:** only filters backed by real fields and useful to the intended job.
11. **Saved views:** distinguish personal/team saved views from business statuses and canonical worksheets.
12. **Primary action:** exact supported action and confirmed expected outcome.
13. **Secondary and row actions:** permissions, lifecycle constraints, bulk-scope semantics and failure outcomes.
14. **Visualization decision:** chart type/question/source/period/units/drill-down, or a stated reason why no chart is needed.
15. **Detail context:** history, files, comments, related records or metadata required to complete the job.
16. **Source ownership:** canonical module/entity and allowed contextual references.
17. **Statuses and exceptions:** business meaning, next action and any unknown/unconfigured state.
18. **Page states:** loading, populated, empty source, no filter matches, partial/unavailable, stale, error, restricted, pending and success.
19. **Responsive behavior:** desktop priority, narrow layout, table/board alternative, non-hover access and keyboard support.
20. **Accessibility:** semantic headings, accessible controls, keyboard order, focus, contrast and non-color state cues.
21. **Acceptance criteria:** observable conditions a reviewer can confirm.
22. **Evidence gap:** what must be inspected in source/API/data contract before implementation.

Do not begin a broad implementation when the main content for a required worksheet remains ambiguous. Resolve the specification or clearly flag a target-only assumption first.

---

## 10. Role-based visual behavior rules

- A user should not need to configure every view manually before it becomes useful. Provide a sensible role/work-purpose default where current architecture supports it.
- Favor a small number of coherent presets over a custom layout for every individual employee.
- Presets may order, select, summarize, filter or visually emphasize authorized content; they cannot change source data or business definitions.
- A saved filter must disclose its active scope. A saved view is not a new business status or record collection.
- Role-sensitive KPI sets must be source-backed and use consistent definitions; they can omit irrelevant measures rather than calculate substitutes.
- Essential warnings relevant to a permitted task must not be hidden merely because a role preset prefers a simpler page.
- Default columns should optimize the expected job while leaving relevant authorized fields discoverable.
- Keep high-risk action controls and their confirmation states in the same authorized workflow even if their visual prominence varies by role.
- Any change to persisted user preferences, shared saved views, or customization infrastructure must be verified against the existing frontend/backend design and separately authorized if it changes data contracts.
- Do not expose sensitive HR, financial, client, vendor, applicant, security, or integration data in a chart tooltip, dashboard aggregation, exported table, browser state, or shared screen beyond existing permissions.

## 11. Responsive and information-density rules

- Use the common AMS page shell and single gutter.
- Keep the primary work area visible early. Avoid large banners or duplicated KPI strips above a queue/register.
- At desktop, use supporting columns only when both areas remain readable and the relationship is useful.
- At tablet/mobile widths, stack supporting content and preserve essential identity, status, due date, and next action.
- Tables can scroll horizontally when required; do not silently remove critical fields. Provide a usable compact row or record detail path where the current pattern supports it.
- Preserve keyboard alternatives to drag interactions and do not make essential information hover-only.
- Do not introduce a second page header or a duplicated row of navigation to fit more worksheet choices.
- Use conditional breadcrumbs for deep record pages where they improve location/return context; never add a breadcrumb to every page simply to fill the header.

## 12. Cross-module consistency scenarios

Review at least these cases when turning the blueprint into UI:

1. Opening a client from an Inbox thread shows the same canonical client and returns to the original thread/context where supported.
2. Opening a project from Client 360 shows the canonical project; project financial references link to Finance.
3. Project files, creative assets, contracts, invoices and employee documents point to canonical Documents records with correct permissions.
4. Task, board, calendar, milestone and project registry views describe the same canonical project/task state.
5. Retainer consumption derives from valid shared time records, not independent manual totals.
6. Vendor entries in Finance reference the Team & Resources vendor master; finance-only access does not reveal restricted vendor details.
7. Dashboard cards and charts link to source modules and do not mislabel financial or operational values.
8. CMS publication states reflect the genuine content source and do not assume preview equals publication.
9. Careers applicant details and history remain within authorized CMS Careers workflows, not Inbox or general Dashboard aggregates.
10. Settings/integration status is based on verified provider/system state; unknown or stale does not display as healthy.

## 13. Acceptance checklist

A module/workspace/worksheet is content-ready when:

- [ ] Its primary question and target user are explicit.
- [ ] The main working area fits the job and dominates the page.
- [ ] Relevant roles have useful defaults without contradictory data or duplicated UI.
- [ ] Permission-sensitive data/actions remain governed by existing authorization.
- [ ] Required fields/columns, sort order and filters are defined and useful.
- [ ] Every chart has a specific question, valid source, defined unit/period, legible labels and a truthful state.
- [ ] If no chart is needed, a clear task-appropriate presentation is used instead.
- [ ] Record identity, status, owner, dates, and next action are visible when they are critical.
- [ ] Related records link to their canonical source; no second record store exists.
- [ ] Loading, empty, no-match, unavailable/stale, error, restricted and pending states are specified.
- [ ] Mobile/tablet and keyboard access preserve the core workflow.
- [ ] Navigation depth, active URL state, and conditional breadcrumbs are consistent.
- [ ] Content definitions align with the master guide, navigation IA, design system and specialist workflow/data rules.
- [ ] Target requirements are not described as implemented until source/test evidence proves it.

## 14. Implementation and change-control boundary

This specification supports planning and visual UX/UI implementation; it does not grant permission to alter protected business behavior.

- For visual-only tasks, preserve backend/API/database/authentication/session/CSRF/MFA/RBAC/permission-policy/Finance logic and existing workflow outcomes.
- Do not add dependencies, fake runtime data, new business stores, new chart libraries, or a parallel design system.
- Verify routes, role behavior, actual data shape, existing fields, shared components and regression tests before implementation.
- When a required presentation depends on missing source data or unsupported functionality, design an honest unavailable/limited state and document the gap.
- Any new role configuration, preference persistence, report formula, workflow transition, external integration, or data contract requires separate scope review and explicit authorization as applicable.
- Work in small reviewable slices. Report the files changed, evidence checked, validations actually run, and remaining target-only requirements.

## 15. Related specifications

- AGENTS.md
- docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md
- AMS-DESIGN-SYSTEM.md
- docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md
- docs/architecture/ams-navigation-information-architecture.md
- docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md
- docs/AMS-UX-INTERACTION-STANDARDS.md
- docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md
- docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md
- docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md
