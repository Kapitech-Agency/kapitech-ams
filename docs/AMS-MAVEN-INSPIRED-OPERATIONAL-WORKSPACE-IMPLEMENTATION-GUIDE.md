# AMS Maven-Inspired Operational Workspace Implementation Guide

**Repository:** Kapitech-Agency/kapitech-ams  
**Branch:** main  
**Product:** Kapitech Agency Management System  
**Reference case study:** https://www.orbix.studio/case-studies/maven-finance-management  
**Scope:** Detailed content architecture for cards, charts, registers, detail workspaces, and cross-module context.  
**Status:** Implementation-level companion guide. This document describes intended UI content; it is not evidence that the source, data, or workflow already exists.  
**Primary implementation order:** Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings.

## 1. Purpose and authority

This guide translates the product and UX principles observed in the Maven Finance Management case study into detailed content requirements for Kapitech AMS. Adopt the task-oriented workspace structure, visual information hierarchy, focused analysis, consistent interaction patterns, and low-friction movement between related records. Do not copy Maven's financial product architecture or treat it as the source of truth for Kapitech's business processes.

Read this document with the following repository authorities:

1. AGENTS.md and docs/README.md.
2. docs/AMS-END-TO-END-DELIVERY-ROADMAP.md for canonical Stage 0–15 sequencing and stage gates.
3. docs/AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md for the frontend redesign process, view contracts, evidence, and Stage 5 sign-off.
4. docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md for the canonical purpose, relative region order, and content requirements of every workspace. Section 4.10 is the mandatory composition matrix.
5. docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md for product ownership, canonical records, operational workflow, data boundaries, and Finance rules.
6. docs/architecture/ams-navigation-information-architecture.md for approved navigation, destinations, routes, and navigation depth.
7. AMS-DESIGN-SYSTEM.md for visual tokens, component geometry, typography, breakpoints, motion, and accessibility.
8. docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md and docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md for role-aware emphasis, fields, filters, and visualization choices.
9. docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md for evidence-backed implementation status and missing dependencies.
10. docs/AMS-EXECUTION-CHECKPOINT.md and docs/AMS-RESUME-AFTER-INTERRUPTION.md for current progress and timeout recovery.

This guide adds detail to the approved specifications. It does not override them. If this guide and the main-content restructuring specification disagree about a workspace's relative content order, follow the main-content restructuring specification. If this guide proposes a card or visualization whose data is not supported by the current source, do not fabricate the data. Record the gap and preserve a truthful UI state.

## 2. Product goal and hard constraints

AMS must feel like an operational workspace designed for a Creative & IT Development Agency, rather than a generic SaaS admin template.

The interface must help users quickly understand:
- What needs attention.
- Which task, project, client, financial record, or system record is affected.
- Who owns the next action.
- What deadline, state, amount, or dependency matters.
- Where to go to complete the next supported action.

The nine primary modules remain exactly:

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

Finance retains the five approved areas:
- Overview & Control.
- Transactions & Cash.
- Receivables & Payables.
- Project Finance.
- Accounting & Reports.

Do not add CRM, Quotations, Proposals, or generic Approvals as new primary modules.

### 2.1 Frontend-only boundary

For this structural-redesign stage, change page composition, content hierarchy, existing frontend components, supported interactions, responsive presentation, accessibility, focused tests, and documentation. Do not change backend/API contracts, database/schema, authentication, permissions, Finance formulas/posting, payment behavior, integrations, or production configuration.

When an intended screen depends on an unavailable source, model, provider, permission, or workflow, present the state honestly and record the dependency. Do not create client-side pseudo-persistence or fake success.

### 2.2 Canonical record ownership

- Clients owns client/company and supported contact identity.
- Inbox owns communication threads and incoming requests.
- Projects owns project, task, milestone, and supported delivery/review records.
- Finance owns quotation, invoice, payment, transaction, expense, ledger, and accounting records.
- Team & Resources owns people, vendor identity, allocations, and time records according to the current data contract.
- Documents owns canonical files and document metadata.
- Website CMS owns content and supported publication state.
- Settings owns system/security/configuration records.
- Dashboard is an aggregation and drill-down layer, not a new record store.

A contextual summary may show source-backed fields from another module. Editing and lifecycle actions must remain with the canonical owner and follow existing authorization.

## 3. Global page and component contract

### 3.1 Page header

A page header normally contains a clear title, a short description only when useful, contextual breadcrumbs for deep records, and relevant controls such as date range, scope selector, or a supported primary action. Do not duplicate the title across the shell, tabs, and main content. Do not place unrelated KPIs in the header.

### 3.2 Card anatomy

A card must serve a distinct user question. Include only the applicable fields from this contract:

- Identity: descriptive title and a clarifying subtitle only when required.
- Primary value: exact count, amount, percentage, duration, or record value.
- Scope: reporting period, as-of date, selected project/client, or other relevant scope.
- Comparison: a valid previous period, defined target, or meaningful category comparison.
- Status: text and semantic indicator with a documented meaning.
- Context: reason, breakdown, owner, deadline, unit, or source needed to interpret the value.
- Interaction: a supported link or action that goes to the authoritative source or filtered workspace.
- Provenance: source, currency/unit, date basis, or freshness where needed to prevent misinterpretation.

Do not force all fields into all cards. Use the smallest complete presentation that communicates the card's purpose.

### 3.3 Operational record cards

An actionable record card should usually display:
- Recognizable record identity.
- Owning project/client/campaign/context when relevant.
- Current status.
- Owner/PIC.
- Due date or next commitment.
- A concrete source-backed reason for the displayed priority.
- One useful path to the canonical record.

Keep board cards concise. Long descriptions, full histories, and secondary metadata belong in a detail surface.

### 3.4 Visualization contract

Every chart must answer a real question and provide:
- Title framed around the data or decision.
- Metric definition and unit.
- Period/date basis.
- Valid categories or series.
- Exact readable values through labels, table, accessible tooltip, or equivalent.
- A legend when multiple series require it.
- Source/drill-down where supported.
- Honest empty/error/unavailable states.

Choose visuals by meaning:
- Line: comparable values over time.
- Vertical or horizontal bars: category or period comparison.
- Stacked bars: parts of a meaningful total.
- Donut: small-category composition when proportions add insight and exact values remain available.
- Progress bar: measured completion against a valid denominator or target.
- Timeline/calendar: actual dates, schedule windows, and supported dependencies.
- Table: precise records, formal values, or detailed comparisons.
- List: actionable queue or chronological events.

Do not depict current statuses as historical trends. Do not imply targets or capacity when there is no valid denominator. A chart is not required merely to make a page look visual.

### 3.5 Data honesty

- Missing data is not zero.
- Unknown is not healthy.
- Not configured is not connected.
- Saving is not the same as saved.
- A successful CMS save is not proof of public deployment.
- An issued invoice is not payment.
- An invoice/expense arithmetic difference is not automatically profit or cash flow.
- Logged time is not automatically capacity, utilization, billable time, or recognized cost.
- A scheduled publication is not a confirmed publication.
- A file existing is not proof of review, approval, permission, or acceptance.

### 3.6 Visual hierarchy

Follow AMS-DESIGN-SYSTEM.md. Preserve the existing dark-first system, panel hierarchy, typography, spacing, geometry, and responsive breakpoints. Use crimson for meaningful brand emphasis and actions. Use success, warning, danger, and information colors only for defined states. Use the existing lucide-react dependency and established components. Do not introduce another UI framework, a parallel token system, arbitrary z-index, layout hacks, excessive glass/blur, decorative bento layouts, or unnecessary dependencies.

### 3.7 Universal data states

Every important data surface must distinguish:
- Loading.
- Loaded with records.
- Empty source.
- Error.
- Unavailable/not implemented.
- No access.
- Not configured.
- Stale data when freshness is material.

Actions must be real and permission-safe. No inert controls or false success messages.

---

# 4. Module 01: Dashboard

## 4.1 Module purpose and workspaces

Dashboard answers: What needs attention across agency operations, how is the agency performing, and which source record should the user inspect next?

Retain Overview, Performance, and Analytics. Complete all three before proceeding to Inbox.

## 4.2 Overview composition

Follow the production-ready dashboard reference supplied by the user as the layout pattern. Adapt its large financial/chart card, compact portfolio companion, concise metric groups and short row lists to Kapitech data. Do not copy bank-specific labels, sample data or unsupported financial assumptions.

Follow this card order:
1. Compact page/reporting scope.
2. **Finance + Projects portfolio** as the primary card row. Finance leads with outstanding receivables, cash received and recorded expenses as separate values plus a source-backed issued-invoice/expense trend. Projects pairs it with active-project totals, a risk/deadline donut and Creative/IT workload bars.
3. **Projects in progress + Needs attention.** Show saved project-progress bars only when valid progressPercent is present; otherwise show “Progress not recorded”. Needs attention is a compact secondary exception card, severity-sorted and visually distinct from canonical Inbox triage. Never use artificial labels such as “Priority 01”.
4. **Task queue + Upcoming deadlines.** Keep task filters, state, owner and due date in a clear queue; pair it with the source-backed deadline horizon and concise commitment rows.
5. **Team workload + Client delivery focus.** Use proportional task-load bars, factual recorded-time values and source-backed client delivery signals.
6. **Recent activity + Workspace shortcuts** at the bottom.

Let the financial trend and project risk visualization establish the primary visual anchors. Use balanced card proportions, compact counters, bars and concise rows. Preserve AMS design tokens and responsive behavior. Do not invent values, create inferred project progress, repeat a generic KPI strip or bury Finance and Projects beneath exception lists.

### Card group A: Needs Attention

This is a compact secondary exception card below the Finance and Projects cards. Sort danger/critical items before warnings and informational items, preserve source order inside each severity, and keep authorized Inbox triage in its own source-backed subsection. Do not manufacture hierarchy with rank numbering; use card placement, relative visual weight and actual source-backed urgency.

**A1. Delivery Risks**
- Project name and client.
- Affected task or milestone.
- Status and owner.
- Deadline.
- Exact reason the record meets the risk rule.
- Direct link to the owning project/task.
- A short next-action label only when a supported action exists.

**A2. Blocked Work**
- Task/deliverable.
- Project/client.
- Owner.
- Recorded blocker or prerequisite.
- Relevant due date or duration context.
- Source link and supported next action.

**A3. Inbox Exceptions**
- Subject/request identity.
- Sender/client.
- Category/channel.
- Status and priority.
- Current owner.
- Configured SLA/due information when supported.
- Link to the canonical thread.

**A4. Finance Exceptions**
- Exception type.
- Invoice, bill, account, or transaction reference.
- Client/vendor/account context.
- Amount and currency when authorized.
- Relevant date/period.
- State and source link.

Do not combine unlike financial exceptions into one amount.

**A5. Contract/Renewal Exceptions**
- Client and agreement/retainer.
- Expiry/renewal date.
- State.
- Owner.
- Next obligation.
- Link to Clients.

**A6. Integration Exceptions**
- Supported provider.
- Actual state/error.
- Last verified timestamp where available.
- Owner and safe diagnostic destination.
- Show only for a real issue and an authorized user.

Do not render empty filler cards. Use exception groups only when their source data is available.

### Card group B: Operating Indicators

Select a restrained subset of distinct indicators. Every card contains an exact value, clear definition/snapshot, and filtered source link when supported.

**B1. Active Projects**
- Count using the approved project-state definition.
- Current snapshot context.
- Link to Project Registry.

**B2. Overdue Tasks**
- Count of eligible incomplete tasks past their due date.
- Clear overdue semantics.
- Link to matching task view.

**B3. Active Clients**
- Count based on canonical client/relationship state.
- No inference from an old project alone.
- Link to Clients Directory.

**B4. Open Requests**
- Count of eligible actionable Inbox records.
- Applicable status definition.
- Link to Inbox.

**B5. Outstanding Receivables**
- Current permitted open invoice balance.
- Currency and as-of date.
- Link to Accounts Receivable.

**B6. Upcoming Commitments**
- Count of valid milestones/deliverables due within a named horizon.
- The horizon must be visible.
- Link to the relevant list.

Do not display all possible indicators if doing so creates clutter or duplicates information elsewhere.

### Card group C: Creative and IT Workstreams

**C1. Creative Workload**
- Active task/project measure from a valid source.
- Completed versus total only when the denominator is comparable.
- Overdue or blocked count if available.
- Period/snapshot.
- Link to the relevant project/task records.

**C2. IT Development Workload**
- The same measurement basis as Creative.
- Matching definition and period.
- Equivalent source context and link.

Do not compare a count of Creative tasks with a count of IT projects. Do not infer workstream category from arbitrary names. If classification is missing, show an unavailable/unsupported comparison or a different valid grouping.

Use proportional bars only when the denominator has a genuine meaning, such as total eligible tasks or configured capacity.

### Card group D: Deadline Horizon

Use a compact timeline or date-grouped actionable list with:
- Overdue.
- Due today.
- Due soon.
- Later.

Each item contains work-item identity, project/client, owner, actual deadline, status, days overdue/days remaining when valid, and source link. Use real dates and timezone semantics. No fabricated schedule dates.

### Card group E: Recorded-Time Context

When actual time logs exist, show:
- Total recorded hours for the valid period.
- Number of entries.
- Comparison by contributor or project when meaningful.
- Exact hours and reporting period.
- Link to Time Tracking.

Label the metric as recorded time. Do not call it utilization, capacity, billable hours, or actual cost without a valid source contract.

### Card group F: Client Delivery Focus

This is a delivery-prioritization list, not a client health score.

Sort canonical client groups by:
1. Overdue commitments.
2. Overdue tasks.
3. Blocked tasks.
4. Unassigned tasks.
5. Tasks in review.
6. Nearest upcoming commitment.
7. Open-task load.
8. Project count.
9. Client name as a stable tie-breaker.

Each client row shows:
- Client identity.
- Relevant projects/commitment context.
- Overdue task count.
- Blocked task count.
- Unassigned task count.
- Tasks in review.
- Open tasks.
- Nearest valid commitment.
- Link to client/project context.

Keep the urgent metric order: overdue, blocked, unassigned, in review, open tasks. Preserve unavailable as unavailable. Use the documented responsive 2/3/5-column arrangement at the established breakpoints.

### Card group G: Finance Control

Show only distinct operational signals that add value, such as:
- Outstanding receivables.
- Overdue receivables.
- Recorded expenses for a valid period.
- Bank reconciliation exceptions.
- Supported pending financial actions.

Each metric needs source, period/as-of date, currency, and link. Avoid repeating identical values already displayed in the indicator strip. Never combine issued invoice, cash received, expense, cash balance, and profit into one ambiguous number.

### Card group H: Workspace Shortcuts

Each shortcut should have a destination name and, when needed, a concise purpose. Link to supported destinations such as Projects, Inbox, Clients, Finance, Team & Resources, or Documents. Do not use shortcuts as decorative KPI tiles.

### Card group I: Recent Activity

When a real activity/audit source is available:
- Event description.
- Actor when permitted.
- Affected record.
- Timestamp.
- Recorded outcome.
- Source link.

Do not fabricate events or claim this list contains all activity if its source is partial.

## 4.3 Performance workspace

### Reporting controls
- Reporting period.
- Comparison period when supported.
- Relevant workstream filter only if source-backed.
- Explicit date and comparison semantics.

**KPI 1: Task Completion**
- Completed count and total eligible count.
- Percentage only when the denominator is valid.
- Period and comparison where comparable.
- Link to task source.

**KPI 2: Overdue Tasks**
- Exact count or valid rate with denominator.
- Period/snapshot semantics.
- Comparison when valid.
- Link to source.

**KPI 3: Blocked Tasks**
- Exact count.
- Clear period/snapshot basis.
- Link to source.

**KPI 4: Active Projects**
- Count under the approved status definition.
- Snapshot/period basis.
- Link to project source.

### Task Status Distribution
Use a readable bar/distribution view that displays status label, exact count, percentage of a defined total if valid, scope, and filtered source link. Do not imply trend from a current snapshot.

### At-Risk Project Queue
Use a table/list with project, client, owner, status, next milestone, deadline, specific risk, and link/action. The record list is primary; a chart alone is insufficient.

### Recorded Time Comparison
Show total hours, entry count, contributor/project grouping, exact values, date range, and source drill-down. Use horizontal bars only for comparable measures.

### Definitions
Explain task inclusion, timezone/date basis, comparison, unit, and material source limitations concisely.

## 4.4 Analytics workspace

Keep one focused report surface at a time, using a consistent accessible report selector.

### Inquiry Pipeline
- Valid period.
- Saved-date volume trend when available.
- Current status distribution.
- Category or requested-service demand.
- Exact counts and percentages.
- Inbox drill-down.

Exclude Careers applicants, vendors, newsletters, and unrelated messages. Do not infer conversion or booked revenue from inquiry counts or free-text budget.

### Project Status
- Current active/total context.
- Current status groupings.
- Exact counts and percentage of a defined total.
- Proportional bars where useful.
- Project Registry drill-down.

Label as current state unless historical snapshots support an actual trend.

### Financial Movement
- Reporting period.
- Invoice value by issue date.
- Eligible expense total by recorded date.
- Currency and aggregation basis.
- Exact period values/table.
- Source links.

Any arithmetic difference is not automatically posted profit or cash flow. Reuse existing Finance semantics.

### Receivables
- Current open invoice balance.
- Aging groups only if their semantics are supported.
- Exact values and currency.
- As-of date.
- Link to Accounts Receivable.

Do not imply the reporting-period filter changes a current snapshot unless it does.

### Delivery Trend
Only display a historical trend if comparable historical records exist. Potential measures include task completion, on-time milestone delivery, throughput, and persisted revision/quality events. Include exact values and definitions.

### Service Demand/Campaign Performance
Show service demand or campaign outcomes only when sourced. Include objective, period, KPI definition, actual value, unit/source, and relevant drill-down. A publication date does not prove campaign performance.

### Dashboard acceptance
- Overview, Performance, and Analytics have distinct purposes.
- Finance and Projects are the first and most prominent Overview cards; hierarchy does not rely on artificial priority numbering.
- Finance trend values come from canonical issued-invoice and eligible-expense records, with source and period semantics clear; no arithmetic difference is described as posted profit or cash flow.
- Project visuals use current saved project/deadline/task records. Project progress bars appear only when valid saved progressPercent exists.
- Needs attention follows the Finance/Projects row; exceptions are severity-ranked and not mixed into the Inbox source.
- Task queue, deadlines, team workload, client delivery focus, audit activity and shortcuts are arranged in balanced responsive card rows.
- No fake values, unsupported trends, sub-10px operational text or duplicated metrics without a reason.
- Every visual has exact readable values and a defined scope.
- Drill-down opens the canonical source.
- Dashboard remains an aggregation layer.

---

# 5. Module 02: Inbox

## 5.1 Purpose and workspaces

Inbox manages incoming communication requiring triage, assignment, response, follow-up, or resolution. Retain Overview, Messages, Follow-ups, and Routing & Templates.

## 5.2 Overview cards and queue

**Card A: New Messages**
- Count using existing unread/new semantics.
- Scope/source and snapshot context.
- Link to filtered queue.

**Card B: Unassigned Messages**
- Count of records without a valid owner.
- Priority context if available.
- Link to unassigned view.

**Card C: Urgent Requests**
- Count using a configured priority rule.
- Definition and scope.
- Link to the relevant queue.

**Card D: Follow-ups Due**
- Count of genuine due/overdue follow-ups.
- Owner context.
- Link to canonical follow-up records.
- Omit or show unavailable if lifecycle/data is unsupported.

**Actionable Queue**
- Subject/request.
- Sender/client.
- Category/channel.
- Priority and state.
- Owner.
- Received date.
- Configured SLA/due information.
- Related client/project.
- Direct record link and supported next action.

Do not place a duplicate full Messages table in Overview.

## 5.3 Messages workspace

### Filters
Search, All Messages, Sales Inquiries, Client Requests, Project & Support, and supported status/priority/owner/channel/date filters and saved views. These are views over canonical message records.

### Register row
- Sender or subject.
- Channel/source.
- Received date.
- Category.
- Status.
- Priority.
- Owner.
- SLA/due context if configured.
- Related client/project.
- Unread/starred state if supported.

### Selected-thread detail
Group identity/current state, sender and linked context, chronological conversation, attachments, internal notes, ownership, workflow state, and authorized actions. Use a split-pane on wide screens only when it remains readable. On mobile, provide a clear detail/back path.

Resolved and Archived have different meanings. Do not claim that a message was sent/delivered without provider confirmation.

## 5.4 Follow-ups workspace

Internal views: Due Today, Upcoming, Overdue, Completed.

Each record shows:
- Follow-up title or task.
- Source conversation.
- Client/contact.
- Owner.
- Due date/time.
- Status.
- Supported next action.

If the source workflow is not implemented, do not create mock follow-ups or local-only completion.

## 5.5 Routing & Templates

### Routing Rules
Each rule contains its name, enabled state, supported conditions, destination/owner, category/priority behavior, rule order, conflicts, updated context if recorded, and supported preview/test/edit/disable actions.

### Response Templates
Each template contains name, channel/context, category, content preview, supported variables, version/update when available, actual state, and supported edit/preview action.

No invented variables, routing engine behavior, send success, or provider status.

---

# 6. Module 03: Projects

## 6.1 Purpose and workspaces

Projects owns delivery. Finance owns financial truth. Team & Resources owns people/capacity. Documents owns files.

Retain Overview, Project Registry, Tasks & Execution, Planning & Delivery, Content & Campaigns, Project Resources, and Project Controls.

## 6.2 Overview

**Delivery Exceptions**
- Project/client.
- Task/milestone.
- Owner.
- Due date.
- Status.
- Recorded risk reason.
- Source link.

**At-Risk Milestones**
- Milestone.
- Project/client.
- Target date.
- Owner.
- State.
- Dependency/issue where recorded.
- Link.

**Blocked Work**
- Task/deliverable.
- Project.
- Owner.
- Recorded blocker/prerequisite.
- Due date.
- Source link.

**Pending Reviews**
- Deliverable/version.
- Project/client.
- Reviewer.
- Submission time.
- Actual review state.
- Supported next action.
- Show only if persisted review records exist.

**Resource Conflicts**
- Person/resource.
- Affected project(s).
- Overlapping allocation/schedule.
- Date range.
- Source-backed conflict.
- Link to allocation.

## 6.3 Project Registry

### Filters
Search, lifecycle/status, client, owner/PIC, date range, and supported workstream/health filters.

### Row/card
- Project identity.
- Client.
- Workstream/type when defined.
- Status.
- Owner.
- Start/due dates.
- Next milestone.
- Defined source-backed health signal where supported.
- Authorized actions.

Planning, Active, On Hold, Completed, and Archived are filters over canonical project records. Board/table/timeline are alternate presentations of the same records when supported.

## 6.4 Tasks & Execution

### Board/Kanban card
- Task title.
- Project/campaign.
- Client where useful.
- Assignee.
- Priority if defined.
- Due date.
- Current stage.
- Dependency/blocker indicator if supported.
- Recorded time if useful.

Keep cards compact. Avoid descriptions, full histories, and large action bars on every card. Counts must reflect real task states.

### List view
Columns: task, project, status, assignee, priority, due date, dependency/blocker, time if supported, and authorized actions. It must provide a keyboard-operable alternative to drag-and-drop.

### My Tasks
Use authenticated user scope. Each row shows task, project, status, priority, due date, blocker/dependency, and next action. Never hardcode the user identity or bypass policy with a client-only filter.

### Task Lists
Show list identity, associated project, owner/state where supported, valid total/completed counts, and ordering. Tasks stay canonical.

### Dependencies
Show dependent task, prerequisite, state, owners, due-date conflict if valid, and links to both records. Do not infer persisted dependencies from visual order.

## 6.5 Planning & Delivery

### Project Brief
Identity, client, objective, scope summary, owner, start/due dates, and source-linked decisions/brief documents.

### Scope & Deliverables
Deliverable, description/acceptance criteria if supported, owner, due date, version, state, evidence, and project link.

### Milestones
Name, due date, owner, state, dependency, project, and source-backed progress.

### Timeline
Actual project/milestone/task date ranges, status, owner, dependency when supported, and link to the source. Never generate missing dates.

### Deliverable Tracking
Deliverable, version/evidence, deadline, owner, reviewer, current review state, and next action. Persisted workflow required.

### Internal Quality Review
Version, criteria, reviewer, state, findings, recheck history, and evidence. If there is no persisted workflow, keep unavailable.

### Client Review
Submitted deliverable/version, client/reviewer, submission timestamp, actual feedback, state, owner, and next action. Do not invent approval events.

### Revision History
Version, timestamp, requester/source, reason if recorded, owner, outcome, evidence. Use actual history records.

## 6.6 Content & Campaigns

### Content Calendar
- Content title.
- Client/project/campaign.
- Channel.
- Format/type where sourced.
- Owner.
- Planned date.
- Confirmed publication state where available.
- Review/blocker context.

Filters: date, client/project, campaign, channel, owner, and supported state.

### Planning & Briefs
Title, objective, client/project/campaign, audience if captured, format, channel, requirements, owner, deadline, assets, and state.

### Production Pipeline
Content, current stage, owner, deadline, blocker, project/client, asset/version, and next action. Use a board only if records support its lifecycle.

### Creative Assets & Versions
Asset identity, related content/project, version, canonical Documents reference, owner, updated time, and access state.

### Internal Review
Content/version, reviewer, actual review state, recorded feedback, review date, and next action.

### Client Review & Feedback
Content/version, client, submission time, actual feedback, reviewer, state, owner, and next action.

### Revision Tracking
Content/version, request, requester, reason, owner, due date, and persisted history.

### Publishing Schedule
Content, channel, planned publication time, actual confirmation/live reference when available, state, and owner. Manual publication must be identified as manual.

### Campaign Tracking & Performance
Campaign, objective, period, budget source if applicable, defined KPI, actual result, unit, source, and drill-down. Never fake reach, impressions, conversions, spend, or ROI.

Supported lifecycle may follow Brief → Planning → Production → Internal Review → Client Review → Revision → Approved → Scheduled → Published → Reporting only to the extent the actual workflow supports those states.

## 6.7 Project Resources

### Assignment surface
Project, assigned people, project role, allocation period, allocated effort when defined, workload context, and link to Team & Resources.

### Workload visualization
Use capacity comparison only when the capacity source and denominator are valid. Clearly distinguish planned effort, available capacity, recorded time, and actual cost.

### Conflict list
Person, projects, overlapping allocation, dates, source-backed reason, and link to the allocation record.

## 6.8 Project Controls

### Change Requests
Request, reason, project, requester, owner, recorded schedule/scope/cost impact, decision/state, and persisted decision history.

### Risks, Issues & Blockers
Type, description, project, defined impact/severity, owner, due/review date, mitigation/next action, and state.

### Budget Summary / Planned vs Actual
Project, Finance-sourced plan/budget, period/category, actual, variance, currency, definitions, and link to authoritative Finance detail.

### Delivery Health
Show underlying schedule, milestone, blocker, dependency, and review signals. Use a combined score only if its formula is documented and source-backed.

### Reports & Closure
Acceptance evidence, open tasks/issues, handover references, project documents, and supported close/archive state.

### Related Project Files
Show contextual references from Documents, not a second file store.

---

# 7. Module 04: Clients

## 7.1 Purpose and workspaces

Clients owns canonical client/contact identity, onboarding, agreements, service commitments, and service-history context. Retain Directory, Onboarding, Agreements, and Service & Health.

## 7.2 Directory and Client 360

### Directory row
Client/company identity, supported contact context, relationship owner, valid state, relevant renewal/service context, and link to Client 360.

### Client 360 identity
Client name/identifier, relationship state, owner, and permitted primary-contact information.

### Projects panel
Project, status, owner, next milestone, real delivery exception, and project link.

### Agreements panel
Agreement/retainer, state, effective/expiry dates, next renewal/obligation, and canonical document.

### Finance panel
Permitted quotations/invoices/outstanding context with currency, state, and direct Finance links. Do not duplicate financial records.

### Inbox panel
Relevant conversations/requests, status, owner, last activity if available, and thread link.

### Documents panel
Authorized related files with canonical ownership.

### Service history panel
Actual source-linked issues, feedback, dates, and recorded outcomes.

Client 360 is a contextual view, not an independent client master.

## 7.3 Onboarding

### Readiness summary
Applicable requirements, completed requirements, outstanding/overdue requirements, blockers, and a readiness state only if an actual validated rule exists.

### Checklist row
Requirement, stage, owner, due date, state, blocker, evidence/document link, and next action.

### Required Documents
Document type, actual evidence state, canonical file reference, owner, and outstanding requirement. A file's existence alone does not imply approval.

### Kickoff Readiness
Show the requirements that determine readiness, outstanding blockers, and evidence. Do not turn profile completeness into kickoff approval.

## 7.4 Agreements

### Contracts & SOWs
Agreement identity, client, type, state, effective date, expiry, owner, canonical document/version, and next obligation.

### Retainers & Service Commitments
Client, service scope, period, included hours/units, valid recorded usage, remaining hours/units only when calculable, authorized rates/terms, renewal date, state, and agreement link.

### Renewal Schedule
Agreement, client, renewal/expiry date, owner, state, recorded notice/renewal obligations, and supported next action.

### Contract History
Actual persisted versions/events with timestamps, permitted actor/context, and linked evidence. Do not synthesize a history.

## 7.5 Service & Health

### SLA Monitoring
Client/request, configured target, working calendar, elapsed time, pause/breach semantics, state, owner, and source link. Require valid configuration.

### Service Issues & Feedback
Issue/request, client, source Inbox record, priority/impact, owner, state, last recorded update, and next action.

### Client Health
Use individually defined source-backed signals. Do not create an unexplained score from message counts, invoice value, or task volume. If health rules are absent, present underlying service, delivery, agreement, and renewal context.

### Service History
Chronological source-linked event, date, owner, state/outcome, and original record.

---

# 8. Module 05: Finance

## 8.1 Non-negotiable Finance rules

Preserve all established financial formulas, account mappings, historical data, posting, tax/rounding, invoice/payment conversion, reconciliation, maker-checker controls, and period locks. Keep the five approved areas and current worksheet identities. Finance UI changes must never imply an unverified accounting result.

Always distinguish quotation value, contract value, issued invoice, recognized revenue, amount due, payment instruction, confirmed bank movement, cash received, expenses, bank balance, cash flow, and posted profit.

## 8.2 Overview & Control

### Executive Summary cards

**Issued Invoice Value**
- Value of eligible invoices issued in the selected period.
- Currency and issue-date basis.
- Reporting period and source link.

**Cash Received**
- Confirmed receipts under the existing contract.
- Currency and receipt-date basis.
- Period and source link.

**Outstanding Receivables**
- Current eligible open invoice balance.
- Currency and as-of date.
- Definition and Accounts Receivable link.

**Recorded Expenses**
- Eligible expense total.
- Period, date basis, and currency.
- Expenses register link.

**Cash/Bank Position**
- Account/scope.
- Balance under the source's current semantics.
- Currency and as-of date.
- Provisional/reconciled state.
- Cash & Bank link.

**Financial Exceptions**
- Actual exception count by supported type.
- Filter/drill-down to the source register.

These cards are options, not a requirement to show all at once. Select a restrained set that prevents duplicated values and supports a real decision.

### Finance Dashboard
Use valid invoice/expense trends or source-backed exception summaries. State period, date basis, currency, and definitions. Do not derive formal profit/cash flow from simple arithmetic.

## 8.3 Transactions & Cash

### Cash & Bank summary
Selected account, valid opening/balance figure, period movement, closing/provisional balance where defined, reconciliation state, and genuine exception count.

### Cash & Bank register
Date, reference/description, account, transaction type, source/counterparty, debit, credit, currency, status, reconciliation/evidence state, and permitted detail/action.

### Revenue summary and register
Use a distinct source-backed measure, selected period, currency, date basis, revenue/invoice reference, client/project, date, amount, state, and source record. Never equate invoice with payment.

### Expenses summary and register
Eligible recorded expense total, period/currency, vendor/payee, category, date, amount, project/budget link, record state, evidence, and supported action.

### Petty Cash
Valid opening/movements/closing balance, evidence, actual reconciliation state, and register fields: date, reference, description, amount, currency/account, type, evidence, state.

Do not show reconciled or connected status without evidence.

## 8.4 Receivables & Payables

### Quotations register
Quotation identity/number, client, version, created/issue date under current semantics, expiry where supported, currency, total, actual state, related project/client, and existing authorized actions.

Retain the current quotation builder and calculation contract. Do not create a second quotation store.

### Accounts Receivable summary cards
Potential distinct cards:
- Total outstanding.
- Overdue outstanding.
- Due soon, if available.
- Paid amount only when the scope and definition are clear.

Each card needs amount, currency, current/reporting scope, source definition, and filtered register link. Omit redundant cards.

### Accounts Receivable register
Invoice number, client, issue date, due date, total, paid amount, outstanding amount, aging/state, project, and existing authorized actions.

### Accounts Payable summary
Outstanding bills and overdue/due-soon payables only if the data contract supports them. Every card contains amount, currency, scope, and register link.

### Accounts Payable register
Bill/vendor, bill date, due date, total, paid amount, outstanding, state, linked project/evidence, and supported actions.

Vendor reference comes from Team & Resources. No duplicate vendor master.

## 8.5 Project Finance

### Project Finance
Project/client, period, source-derived values, related budget/expense/invoice context, and authorized Finance detail links.

### Operational Budget
Approved plan, period/category, actual source, variance, currency, definition, and linked detail.

### Project Allocation
Project, allocation category/resource, period, source-backed amount/percentage, calculation basis, and record link.

### Team Fee
Existing calculation basis and current permitted source inputs/results. Do not recreate formulas or present an independent estimate as actual cost.

## 8.6 Accounting & Reports

Prioritize formal reports and registers over dashboard cards.

### Journal
Date/period, journal reference, source, account, debit, credit, state, audit/detail, and permitted post/reverse actions.

### Chart of Accounts
Code, name, type, category, active state, existing mapping where relevant, and allowed actions.

### Monthly P&L
Period, formal income rows, expense rows, defined subtotals, posted profit/loss under current rules, currency, and source details.

### Cash Flow
Defined movements by category/source/time. Do not equate it with a balance.

### Balance Sheet
Report date, formal asset/liability/equity hierarchy, subtotals/totals according to existing rules, currency, and source details.

### Monthly Closing
Period, actual close/lock state, checklist, blockers, owner, evidence, persisted history, and authorized actions.

### Annual Summary
Comparable periods and formally defined values. Maintain drill-down and clear period semantics.

---

# 9. Module 06: Team & Resources

## 9.1 Team & Capacity

### Team Directory
Person identity, department/team, job role, manager where supported, permitted active/employment state, and valid availability context.

### Capacity Allocation
Person, project/task, period, assigned effort, defined capacity basis, schedule/availability, source-backed conflicts, and record link.

### Availability & Workload
Use calendar/list comparison only if schedule and allocation sources are real. Show person, period, approved absence where permitted, allocation overlap, related project, and source-backed reason. No-data is not zero workload.

## 9.2 People Operations

Target workspaces: Profiles & Employment Details, Employee Onboarding/Offboarding, Employment Contracts & Status, Leave & Absence, Training & Development, Performance Reviews & History, and People Operations Reports.

### Onboarding/offboarding
Employee, requirement, owner, due date, state, blocker, evidence, and supported next action.

### Employment contracts/status
Permitted employment status, effective dates, contract references, owner, and restricted documents.

### Leave & absence
Person, type, dates, real approval state, schedule conflicts where valid, and allowed action. Only approved leave affects capacity according to current rules.

### Training/development
Actual record, training/course, date, state, and supported completion details. No invented skill or performance score.

### Performance reviews/history
Persisted review, date, permitted reviewer, actual outcome, and history. Apply existing sensitive-data restrictions.

### People Operations reports
Source-backed counts/trends, period, scope, definition, and accessible detail.

## 9.3 Vendors & Freelancers

### Vendor register
Canonical vendor identity, service/category, active/engagement state, owner/contact details where permitted, and relevant work context.

### Skills & Service Matrix
Actual skill/service category, verified qualification or source, and availability if supported. Do not infer expertise.

### Contracts & Rates
Vendor, scope/terms, period, rate/currency where authorized, state, and canonical document.

### Engagement Status
Vendor/project, engagement dates, owner, state, next action, and agreement link.

Finance owns bills and payments.

## 9.4 Time Tracking

### Time Logs
Person, date, project/task, duration, billable classification as actually defined, note/state where supported, and permitted correction actions.

### My Timesheet
Authenticated user's eligible entries, period, entry details, totals, actual workflow state, validation context, and supported actions.

### Timesheet Control
Authorized review queue and persisted review history only where the workflow exists.

### Billable/Non-billable
Filtered view of canonical time entries. True, false, and unset must remain distinct.

### Time by Project
Comparable hours by project/period, exact values, and source entries. Do not imply billed time or recognized cost automatically.

---

# 10. Module 07: Documents

## 10.1 Single Document Library

Keep one canonical library. SOPs & Policies, Legal & Corporate, Finance & Tax, HR & People, Security & Infrastructure, and Project & Client Files are categories/saved views, not separate repositories.

### Register
Search and metadata filters precede the register. Rows show filename/title, category, owner, related record, upload/update date, version where supported, permitted classification/state, and authorized actions.

### Upload
Use existing supported upload behavior. Show applicable metadata, category, related record if supported, real validation/upload state, and recoverable failure feedback.

### Document detail
Identity, metadata, owner, related record, version chronology if supported, access/retention context, and permitted file actions.

### Preview states
Distinguish ready, loading, unsupported format, failed, access denied, and missing file. Do not imply preview/download success without confirmation.

Do not invent version restore/history. Use private-vault and object-integrity rules from the relevant repository contracts.

---

# 11. Module 08: Website CMS

## 11.1 Shared register/editor pattern

Keep Case Studies, Services, Insights, Testimonials, and Careers.

Register:
- Search.
- Content-specific filters.
- Actual editorial/publication-state filters.
- Content identity.
- Update/publication dates.
- Supported completeness/language metadata.
- Actions.

Editor sequence where supported:
1. Identity.
2. Editorial content.
3. Media/assets.
4. Metadata/SEO.
5. Supported language/translation.
6. Preview.
7. Publication/save outcome.

Do not add unsupported fields. Draft, saving, saved, pending, failed, unknown, and confirmed publication are different states. Save success does not prove public deployment.

## 11.2 Case Studies

Register: title, public-safe client/project attribution, completeness where defined, visibility/publication state, updated date, preview/edit.

Editor: identity, body/content, media/assets, metadata, preview, supported publication controls. Never expose private client delivery material.

## 11.3 Services

Register: title, category, supported order, visibility/publication state, language/content completeness where available, update time, actions.

Editor: approved Creative and IT service information. Do not add Mobile App as a service.

## 11.4 Insights

Register: title, category, author where available, editorial state, update/publish date, language/SEO context where supported, actions.

Editor: supported title/slug/content/taxonomy/media/SEO/language fields. Do not add unsupported scheduling.

## 11.5 Testimonials

Register: statement/identity, attribution, recorded permission/consent state when available, visibility/publication state, update date, actions.

Editor: statement, attribution, supported ratings, recorded permission evidence. Presence of text is not evidence of consent.

## 11.6 Careers

### Jobs
Title, department/type/location when sourced, state, publication/expiry dates, public reference, supported actions.

### Applicants
Restricted queue containing applicant identity, job, received timestamp, actual stage, reviewer, next action, and permitted attachments. Follow existing applicant/HR privacy rules.

### Recruitment History
Actual persisted events, dates, stages, and permitted context. Do not infer historical events from current state.

Applicants belong to Careers, not Inbox sales inquiries.

---

# 12. Module 09: Settings

## 12.1 System Overview

Status sections should show:
- Current source-backed state.
- Checked time.
- Source.
- Exception details.
- Supported safe next step.

Distinguish database connectivity, migration status, backup existence, backup verification, and tested restore. Do not use decorative charts or claim recovery readiness without evidence.

## 12.2 Users & Access

### User register
User identity, account state, role/access context under existing policy, supported MFA/security state, last relevant activity where available, and authorized actions.

### User/security detail
Current configuration, authorized changes, validation, explicit confirmation for sensitive actions, and audit context. Never show credentials, MFA secrets, or recovery codes. Do not create another authorization model in frontend code.

## 12.3 Audit Log

Register columns: timestamp, actor, action, target, result, sanitized metadata.

Filters: time range, actor, action, target/type, result when supported.

Detail is read-only and must not expose secrets or unnecessary personal/bank data. Do not claim completeness if the source is partial/unavailable.

## 12.4 Integrations

Each integration record shows provider, actual configured state, last verification/sync when available, errors, owner, permitted safe action, and diagnostics/source context.

Distinguish Not Configured, Configured, Connected, Sync Succeeded, Degraded, Failed, Unknown, and Production Ready according to actual evidence. These states must not be conflated.

Kopra stays unconfigured/unverified until the required official contract, authorized sandbox/UAT, access, idempotency, inquiry, and reconciliation evidence exists. Keep secrets server-side.

## 12.5 Preferences

Group personal preferences separately from global policy, access/security, and integration settings. Each preference shows name, current supported value, brief explanation where needed, save/reset controls, and truthful outcome/error feedback.

---

# 13. Role-aware presentation

Role-aware presentation changes emphasis, not authorization or business meaning.

### Agency Leadership
Prioritize real cross-module exceptions, delivery portfolio, client commitments, financial control signals, resource pressure, and valid performance analysis.

### Project Manager
Prioritize assigned projects, task execution, milestones, dependencies, blockers, pending reviews, dates, and resource conflicts.

### Creative Team
Prioritize brief, assigned content, production stage, asset/version, review feedback, revision deadline, and publication plan when supported.

### IT Development Team
Prioritize development tasks, dependencies, blockers, milestones, assigned work, actual review/acceptance state, and relevant documents.

### Marketing/Client Service
Prioritize inquiry queue, client requests, follow-ups, client context, content/campaign, and supported public CMS actions.

### Finance
Prioritize financial exceptions, receivables/payables, transactions, reconciliation, formal reports, and established financial controls.

### People/Resource Management
Prioritize team directory, real allocation conflicts, approved availability, time records, vendor engagements, and authorized people operations.

### System Administration
Prioritize user/access, security, audit, integrations, migration/backup/restore evidence.

### Individual Contributor
Prioritize My Tasks, own timesheet when supported, assigned projects, blockers, deadlines, and relevant documents.

Preserve baseline task information. Respect multi-role users and every existing permission/privacy boundary. Job title is not authorization role.

---

# 14. Cross-module relationships and detail links

Use the canonical record source for contextual views:

| Relationship | Source owner | Contextual consumers |
|---|---|---|
| Client/company/contact | Clients | Projects, Inbox, Finance, Documents |
| Inquiry/thread/request | Inbox | Dashboard, Clients |
| Project/task/deliverable | Projects | Dashboard, Clients, Team & Resources |
| Agreement/retainer | Clients | Dashboard and valid Finance/project context |
| Quotation/invoice/payment/ledger/expense | Finance | Dashboard, Clients, Projects |
| Person/vendor | Team & Resources | Projects and Finance references |
| Allocation/time log | Team & Resources | Projects, Dashboard, Project Finance where supported |
| Document/file metadata | Documents | Authorized related modules |
| Public content/job/applicant | Website CMS | Public website and relevant summaries |
| System/security/integration state | Settings | Shell and relevant operational summaries |

Contextual panels should show the minimum useful fields and a direct route to the authoritative record. Do not implement parallel record editing. Use established breadcrumbs for deeper record context without duplicating sidebar or primary tabs.

---

# 15. Module implementation checklist

Before implementing a workspace, the AI agent must record:
- Module/workspace/worksheet and requirement ID.
- Primary user task and question answered.
- Current source component and route.
- Existing content order.
- Specific mismatch backed by source/tests.
- Intended before/after content order.
- Exact card/register/chart fields.
- Source of each metric and displayed field.
- Period, currency, unit, and date/time semantics.
- Related-record owner and destination.
- Permission-sensitive information.
- Supported and unsupported actions.
- Loading, empty, error, unavailable, no-access, and not-configured states.
- Responsive layout and keyboard behavior.
- Focused regression tests and acceptance evidence.

A structural redesign is not complete because labels have been polished, one card has moved, or a test passes. The actual working surface must match its purpose.

# 16. Acceptance and execution protocol

Follow the canonical Stage 4 module order:
1. Dashboard.
2. Inbox.
3. Projects.
4. Clients.
5. Finance.
6. Team & Resources.
7. Documents.
8. Website CMS.
9. Settings.

Implement one bounded workspace or worksheet slice at a time. Begin by refreshing live main, recent commits, source/tests, checkpoint, current CI, and Quality Gate. Preserve correct changes already present.

For each slice:
1. Read relevant specifications and source.
2. Define the primary task and before/after content order.
3. Verify available source data and existing contract.
4. Implement the material structural difference.
5. Add/update focused regression tests.
6. Run applicable typecheck, tests, and build.
7. Inspect the diff for unrelated changes, fake data, duplicate records, and scope violations.
8. Update the gap register, progress record, and checkpoint.
9. Commit directly to main when authorized and supported.
10. Verify checks for the exact source/test SHA.
11. Report exact changes, files, SHA, checks, limitations, and next action.

Do not claim CI, browser verification, deployment, or production readiness without evidence. A timeout requires state recovery, not a blind retry. Continue routine authorized slices automatically, but stop at the Stage 5 user sign-off gate and genuine business/security/Finance decisions.

## Final AI instruction

Implement a task-oriented, visual-first operational workspace for Kapitech's Creative & IT Development Agency. Use this document to define the detailed content of each card, chart, register, and detail surface. Use the Main-Content Restructuring Specification for required composition and content order, the Design System for visual implementation, the Master Structure for canonical ownership and workflows, the roadmap for stage sequencing, and the gap register for verified implementation status.

Every card must answer a useful question. Every displayed value must have a valid source and definition. Every supported action must perform its real operation. Every unavailable capability must remain honest. Preserve existing records, routes, permissions, Finance semantics, and security boundaries. Implement in small verified slices, starting with Dashboard, and continue in the approved order.
