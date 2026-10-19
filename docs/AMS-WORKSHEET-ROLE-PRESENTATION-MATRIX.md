# AMS Worksheet Role Presentation Matrix
## Detailed default content, fields, controls, and visualization emphasis by work persona

- **Repository:** Kapitech-Agency/kapitech-ams
- **Status:** Target-state presentation specification; not a permission definition or implementation evidence
- **Parent specification:** `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md`
- **Coverage:** Nine AMS primary modules and their defined workspaces/worksheets
- **Last updated:** 18 October 2026

---

## 1. Purpose and how to use this matrix

This document takes the role-aware content requirements from the main Content Blueprint down to worksheet-level defaults. It specifies what the main content should emphasize for each kind of work, what information should be scannable first, which fields/controls are useful, and whether a visualization adds genuine value.

It must be read with:
- `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md` for the detailed worksheet content contracts, shared patterns, data truthfulness, and acceptance criteria.
- `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` for target workflows, canonical source ownership, Finance protections, and module requirements.
- `docs/architecture/ams-navigation-information-architecture.md` for approved navigation and route ownership.
- `AMS-DESIGN-SYSTEM.md` and `docs/AMS-UX-INTERACTION-STANDARDS.md` for shared visual primitives and behavior.

This matrix is not an RBAC definition. The persona names describe intended work needs, not exact current application role names. Before implementation, map them to the actual authorized users, claims, routes, server policies, record visibility, and current fields. Where the actual app lacks a field/data contract, mark it as a gap instead of inventing a value.

## 2. Persona key

| Key | Work persona | Core responsibility |
|---|---|---|
| **EXE** | Owner / BOD / Executive | Business outcomes, portfolio risk, decisions, and escalation |
| **PM** | Project Manager / Operations | Project delivery, planning, tasks, dependencies, and resources |
| **CR** | Creative / Marketing | Briefs, content production, creative review, campaigns, and publishing |
| **DEV** | Developer / IT | Technical tasks, dependencies, issues, QA, and technical delivery |
| **CS** | Client Service / Account coordination | Client communication, requests, relationship obligations, and follow-up |
| **FIN** | Finance / Accounting | Transactions, receivables/payables, accounting, reconciliation, and closing |
| **HR** | People Operations / HR | Employment lifecycle, leave, training, performance, and people reporting |
| **CMS** | CMS Editor / Content administrator | CMS content editing, review, publication, and careers workflow where assigned |
| **SA** | System Administrator / IT operations | Users/access, integration state, audit, backup, and system configuration |

A persona listed as “secondary” receives only relevant, authorized context. Its appearance here does not authorize a new route or grant data/action access.

## 3. Global rules for adapting presentation

1. Keep one canonical record and business status across all roles and views.
2. Adapt default priority, column visibility/order, filters, saved views, chart prominence, and the next action shown first. Do not redefine values, create duplicate business records, or change workflow state from presentation code.
3. Use the least amount of content that supports the user's actual job while keeping critical exceptions and required context discoverable.
4. A high-risk exception relevant to an authorized workflow must not be hidden by a role preset.
5. Personal saved views and team-shared views must be visually distinguishable if both exist. A filter preset is not a business status.
6. Users with multiple responsibilities may have a combination of relevant defaults; authorization remains the existing source of truth.
7. Use role-specific dashboards sparingly. Prefer a shared workspace with relevant defaults over maintaining parallel screens when the underlying task is the same.
8. Do not infer that someone is an Executive, Finance, HR, or System Admin because they select a persona in the UI.
9. Do not expose sensitive fields through hidden columns, tooltips, chart drill-downs, exports, browser state, or a shared detail panel.
10. If role-specific persistence, new preference storage, new RBAC mappings, or permission contract changes are required, flag them for separate scope review. This document does not authorize those changes.

### 3.1 Difference between emphasis and access

| Allowed presentation variation | Must not happen as a side effect |
|---|---|
| Default columns and their order | Returning a restricted field to the browser and only hiding its column |
| Initial filter or saved view | Treating that filter as access control |
| Default chart/report prominence | Changing the calculation, source, unit, or meaning of a metric |
| Priority sorting over the same authorized records | Changing business priority/status or silently mutating records |
| Hiding irrelevant non-sensitive UI controls | Hiding a required risk warning or bypassing a required confirmation |
| Role-aware drill-down links to authorized destinations | Creating a second master record or opening a destination outside permission |

---

## 4. Worksheet-level role presentation matrix

### 4.1 Dashboard

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Overview** | EXE; secondary PM, CS, FIN, HR, SA according to access | Source-backed attention queue, most important exceptions, selected-period context, useful drill-downs | EXE: business-level decisions and material risks. PM: delivery blockers and due work. CS: requests/follow-ups. FIN: financial exceptions. HR: authorized people-operation deadlines. SA: verified system/integration incidents. | Use a compact KPI group only where definitions are valid; keep the exception/action list dominant. Include at most a few distinct charts. |
| **Performance** | EXE; PM; FIN; CR where campaign reporting exists | Period selector, relevant comparison, trend values, explanation/definition, source and drill-down | EXE: cross-business trends. PM: schedule/reliability/throughput. FIN: source-defined financial periods. CR: campaign/content outcomes with verified source data. | Line for time trend or bar for category/period comparison. Do not combine unrelated measures on a shared axis. |
| **Analytics** | EXE; PM; FIN; CR; CS where source data supports it | Focused analytic question, period and dimensions, data source, definitions, chart/table and drill-down | EXE: decisions and risk. PM: delivery/revision/capacity trends. FIN: AR aging and formal financial analysis. CR: campaign performance. CS: relationship/renewal indicators only if defined. | Each visualization answers one question. Provide exact-value table/detail where required; omit unsupported analysis. |

### 4.2 Inbox

| Worksheet/view | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Overview** | CS; PM; secondary EXE | Urgent/unassigned items, due/overdue follow-ups, recent meaningful activity, priority and owner | EXE receives aggregated exception context. CS sees client inquiry/request next actions. PM sees project/support requests. Other users see only relevant permitted queues. | Ordered queue/exception list. Counts may summarize but should not replace actionable rows. |
| **Messages — All Messages** | CS; secondary PM, CR, DEV, FIN according to assignments | Sender, subject/summary, channel, received date, status, priority, owner, due/SLA if valid, linked record; search/status/category filters | Show the user's assigned or authorized work first. Use owner/category/channel as filters rather than extra navigation. | List plus conversation detail/split pane when readable. No chart. |
| **Messages — Sales Inquiries** | CS; authorized executive/marketing context | Inquiry summary, source/contact, received date, owner, priority, next response/follow-up, existing linked commercial/client reference | Prioritize response ownership and next step; never introduce a standalone CRM pipeline. | Queue/table with clear urgency and assignment. |
| **Messages — Client Requests** | CS; PM if linked to delivery | Client/project, request summary, received date, priority, owner, due/SLA if configured, status and next action | CS emphasizes response/follow-up. PM emphasizes delivery impact and project link. | Actionable queue. Link to one canonical thread/request. |
| **Messages — Project & Support** | DEV; PM; CS | Project, requester, issue summary, priority, owner, status, timestamp, dependency/SLA where valid | DEV emphasizes technical context and blocker. PM sees delivery impact. CS sees permitted communication context. | Queue/table; optional related task/issue link. No aggregate chart needed. |
| **Messages — Unread / Starred / Resolved / Archived** | Any permitted Inbox user | Same thread identity and core columns, with active filter visible | Useful personal/status filter only; preserve distinct semantics of Resolved versus Archived. | Same table/split-pane pattern; do not create new datasets or navigation rows. |
| **Follow-ups — Due Today** | CS; PM; any assigned owner | Follow-up, linked thread/client/project, owner, deadline, priority, next action | Emphasize items assigned to user and the approaching/overdue condition. | Due-date ordered queue. No chart. |
| **Follow-ups — Upcoming** | CS; PM; any assigned owner | Upcoming follow-up, linked record, owner, scheduled date, status | Keep upcoming work visible without overwhelming users with completed history. | List/calendar only if dates and workload make a calendar useful. |
| **Follow-ups — Overdue** | CS; PM; any assigned owner; EXE summary | Overdue duration, owner, linked record, priority, next safe action | Escalation context for EXE should summarize, not expose all message contents indiscriminately. | Ordered exception list; use semantic overdue indicator with text. |
| **Follow-ups — Completed** | Assigned owner; CS/PM | Completed item, completion date/outcome, linked record and history | History-focused; actions should be limited to the supported reopen/review path. | Table/history list. No chart by default. |
| **Routing & Templates — Routing Rules** | Authorized SA/Inbox administrator; designated operations lead | Rule name/purpose, condition, destination/owner, active state, last outcome/error when recorded | Operational users may see only limited routing context; configuration controls remain restricted to existing authorized roles. | Rules table + detail/editor. No chart. |
| **Routing & Templates — Response Templates** | CS; CR; authorized CMS/Inbox admin | Name, use case, channel/language, text preview, current state, updated date and owner if present | Emphasize approved reusable content relevant to user's channel and language. Personalization/merge fields need clear preview. | Register and editor preview. Preview is not proof of sending. |

### 4.3 Projects

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Overview** | PM; EXE summary; secondary DEV/CR | Portfolio exceptions, upcoming milestones, overdue delivery, blockers, pending reviews, useful filters | EXE: material portfolio risk. PM: next actions and ownership. CR/DEV: assigned work only where relevant. | Exception list plus optional distinct project-stage/trend chart. Do not duplicate registry. |
| **Project Registry** | PM; EXE summary; CS contextual | Project, client, owner/PM, status, deadline, progress, risk/health, financial reference where authorized | PM: owner, dates, progress, blockers. EXE: status/risk/major deadline. CS: client projects/health context when authorized. | Primary project table; statuses are filters/saved views, not separate registers. |
| **Tasks & Execution — Board/Kanban** | PM; CR; DEV | Task identity, stage, owner, due date, priority, project, blocker/dependency cue | CR sees creative pipeline tasks; DEV sees technical tasks; PM sees the broader authorized board. | Board for stage transitions; counts reflect actual filtered records. Provide non-drag alternative. |
| **Tasks & Execution — List** | PM; CR; DEV; assigned staff | Task, project/list, status, assignee, priority, deadline, dependency, estimate/actual if valid | Use sensible role-specific default filters/columns; preserve one underlying task set. | Register; no chart required. |
| **Tasks & Execution — My Tasks** | All assigned users | Assigned tasks ordered by overdue/due soon/blocked, with project, status, deadline and next action | Default to the current user's assigned tasks. Do not infer ownership from a manually selected persona. | Compact personal task list. Optional counters only if source-backed. |
| **Tasks & Execution — Task Lists** | PM; CR; DEV | List/group name, project, task count, owner and due context if supported | Emphasize relevant project/team groupings. Avoid a second task identity. | List/table or grouped view. |
| **Tasks & Execution — Dependencies** | PM; DEV | Blocked task, predecessor/successor, responsible owner, due dates and impact | DEV emphasizes technical dependencies; PM emphasizes critical delivery impact. | Dependency table or simple flow visualization; table remains the accessible alternative. |
| **Planning & Delivery — Project Brief** | PM; CR; DEV; CS as needed | Objective, scope, target outcome, client/project, owner, dates, acceptance criteria and linked references | CR emphasizes creative objective/audience/format; DEV emphasizes technical scope/dependencies; PM sees all delivery context permitted. | Structured detail/editor; no chart. |
| **Planning & Delivery — Scope & Deliverables** | PM; CR; DEV; CS | Deliverable, definition/acceptance criteria, owner, due date, status, client review state | Client Service sees client-facing scope context; delivery roles see assignment and acceptance criteria. | Register/checklist over canonical deliverables. |
| **Planning & Delivery — Milestones** | PM; EXE summary; CR/DEV as assigned | Milestone, target date, owner, related deliverables/dependencies, status and risk | EXE emphasizes at-risk milestones; PM emphasizes schedule and next dependency. | Timeline/list. Use timeline when sequence adds insight. |
| **Planning & Delivery — Timeline** | PM; CR; DEV | Task/milestone schedule, target/actual dates, dependencies and current state | Focus on the timeline of assigned/selected project; keep exact dates available. | Timeline/calendar with list alternative; same underlying records as task/milestone views. |
| **Planning & Delivery — Deliverable Tracking** | PM; CR; DEV | Deliverable, current stage/version, owner, due date, awaiting QA/client review/revision and next step | Each team sees the deliverables they own or are authorized to review. | Action queue/register. |
| **Planning & Delivery — Internal Quality Review** | PM; CR; DEV; assigned reviewer | Item/version, reviewer, review checklist, deadline, comments and result | Reviewers see assigned reviews first; authors see actionable feedback where allowed. | Review queue + detail. No generic Approval workspace. |
| **Planning & Delivery — Client Review** | CS; PM; CR; DEV as relevant | Deliverable/version, client review state, sent/review date, feedback, next action, owner | CS emphasizes response/follow-up; production team emphasizes feedback and revision requirement. | Queue/history. Only confirmed recorded outcomes may show approved. |
| **Planning & Delivery — Revision History** | CR; DEV; PM | Version, requester, date, revision reason, feedback, owner and resulting state | Emphasize what changed and why, not aggregate vanity counts. | Chronological list/version history. |
| **Content & Campaigns — Content Calendar** | CR; PM; CS as relevant | Content title, channel, campaign/client, owner, planned/publish date and production/publication state | CR sees production schedule; PM sees delivery deadlines; CS sees permitted client commitments. | Calendar with agenda/list alternative. |
| **Content & Campaigns — Content Planning & Briefs** | CR; PM; CS for brief context | Objective, audience, content format, channel, deliverables, owner, due date and feedback context | CR emphasizes creative requirements; CS reads client brief/feedback context; PM sees dependencies and delivery date. | Structured brief register/editor. |
| **Content & Campaigns — Content Production Pipeline** | CR; PM | Content item, current stage, owner, deadline, blocker, reviewer and next action | CR works from production/review stages; PM sees delivery bottlenecks. | Board/list using same content records as calendar. |
| **Content & Campaigns — Creative Assets & Versions** | CR; DEV when technical assets assigned; PM | Asset name, version, related content, owner, update date, review state and secure Documents link | Show current working version and history without allowing unreviewed file duplication. | Asset/version list or gallery if thumbnails materially help. No chart. |
| **Content & Campaigns — Internal Review** | CR; PM; assigned reviewer | Item/version, checklist, reviewer, due date, comment and outcome | Reviewer-focused queue with the next decision/action prominent. | Queue + detail. Approval remains workflow-specific. |
| **Content & Campaigns — Client Review & Feedback** | CS; CR; PM | Client feedback, affected version, received date, requested change, owner and due date | CS emphasizes communication and follow-up; CR emphasizes requested edits. | Feedback queue/history. |
| **Content & Campaigns — Revision Tracking** | CR; PM | Revision reason, requester, version, owner, due date and status | Sort by deadline and blocked work; preserve feedback context. | Register/queue. No chart needed. |
| **Content & Campaigns — Publishing Schedule & Status** | CR; CMS; PM | Planned date, channel, content owner, publication status, target/live URL when verified | CR/CMS need publishing readiness; PM needs commitment and blocked status. | Calendar/queue. Distinguish scheduled, manually marked, and externally confirmed publication. |
| **Content & Campaigns — Campaign Tracking & Performance** | CR; EXE summary; FIN only for permitted financial context | Objective, period, channel, client/project, planned budget, source-backed results and source/date range | CR prioritizes campaign outcome; EXE sees decision-level summary. FIN remains owner of financial actuals. | Compare only comparable series; table is needed for exact values. |
| **Project Resources — Project Team** | PM; assigned contributors; EXE summary | Assigned person, responsibility, work role, linked work items and relevant availability | PM sees authorized project assignment coverage; individuals see their own relevant work. | Team assignment table. Avoid revealing private HR data. |
| **Project Resources — Assignments** | PM; CR/DEV for own assignments | Person, project/task, planned dates, effort estimate if supported, status and conflict | Emphasize unresolved assignments and capacity conflicts. | Assignment register/timeline. |
| **Project Resources — Workload** | PM; EXE summary; HR/Team lead if authorized | Person/project, period, valid effort/availability, defined capacity and overload warning | PM acts on conflicts; EXE receives aggregate pressure only. | Horizontal bars or stacked allocation when measures are comparable; show exact values/table and missing-data state. |
| **Project Controls — Change Requests** | PM; EXE/CS/FIN when authorized and relevant | Change, requester, rationale, scope impact, dates, price/time impact references, owner, status/history | PM reviews delivery impact; Finance sees commercial/financial references only through authorized source records; CS sees permitted client context. | Queue/register with status and history. |
| **Project Controls — Risks, Issues & Blockers** | PM; DEV; CR; EXE summary | Type, project, severity, owner, impact/mitigation, due date, status and next action | EXE: material unresolved risks. PM: risk owner/mitigation. DEV/CR: assigned blockers and technical/creative context. | Prioritized exception register. Avoid decorative pie charts. |
| **Project Controls — Budget Summary / Planned vs Actual** | PM; EXE; FIN | Approved plan, actual from valid Finance source, category/period, variance and provenance | PM sees project-control context; EXE sees summary; FIN drills into authoritative ledger/report. | Paired bar or variance table only when values are comparable and both exist. |
| **Project Controls — Delivery Health** | PM; EXE summary | Late tasks/milestones, scope change, capacity risk, pending review, unresolved issue and defined current status | Explain each factor. Do not invent a composite health score. | Status/exception list and optionally a sourced trend. |
| **Project Controls — Reports & Closure Checklist** | PM; CS; EXE summary | Delivery/acceptance status, outstanding issues, handover evidence, linked deliverables/docs and closure blockers | PM owns operational closure; CS gets client handover context; EXE sees unresolved material items. | Checklist/register. Readiness must be evidence-backed. |
| **Project Controls — Related Project Files** | PM; CR; DEV; CS according to access | Canonical Document reference, filename, type/category, version, relation to project and updated date | Show role-relevant files only; no local copy of Documents master. | Filtered document list. No chart. |

### 4.4 Clients

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Directory** | CS; EXE summary; PM for project-linked context | Client/company, relationship status, owner, primary authorized contact, active service context, latest meaningful activity | CS emphasizes relationship and next follow-up. EXE sees authorized client-risk summary. PM opens the same canonical client from a project. | Searchable register; no default KPI strip. |
| **Companies** | CS; EXE summary; PM if authorized | Company identity/status, relationship owner, relevant active project/service context, contacts count only if valid | Prioritize account identity and relationship state; don't duplicate a second company master. | Table/list. |
| **Contacts** | CS; assigned staff with permission | Contact identity, company/client, work role if present, permitted communication channels and relationship state | Only authorized users see contact details; prefer practical communication context over unnecessary personal information. | Table/list. |
| **Client 360°** | CS; EXE at decision level; PM contextual; FIN only authorized finance references | Header identity/status/owner/next important date; sections for projects, agreements, Finance references, Inbox, Documents and feedback | CS sees service/relationship needs. PM sees delivery-linked context. EXE sees material risk/renewal context. Finance values remain sourced in Finance. | Detail workspace with internal sections; avoid many duplicate overview cards. |
| **Onboarding — Checklist** | CS; PM; assigned owner | Requirement, linked source record/document, owner, due date, status, blocker and evidence | Prioritize missing/blocked requirements and the next accountable owner. | Checklist/register. |
| **Onboarding — Required Documents** | CS; assigned reviewer; authorized HR/Finance only for their documents | Requirement, document reference, received/verified status, owner, date and access state | Display only permitted file metadata; the canonical file remains in Documents. | Requirement list. No chart. |
| **Onboarding — Kickoff Readiness** | CS; PM; EXE summary for material delay | Blocking conditions, missing requirements, owner and next action | PM/CS need exact blockers; EXE needs concise readiness/risk summary. | Checklist plus exception list; no invented readiness score. |
| **Agreements — Contracts & SOWs** | CS; EXE summary; PM project scope context | Client, agreement type, dates/expiry, status, owner, authorized scope/file reference | CS sees commitments and renewal actions. PM sees current scope. EXE sees significant expiry/contract risks. | Register and chronological history. |
| **Agreements — Retainers & Service Commitments** | CS; PM; FIN authorized for financial reference | Period, included/used/remaining units, service scope, renewal date and status from valid records | PM/CS see utilization and service commitments; FIN sees quote/invoice records in Finance only. | Usage/progress bar only with valid denominator; display units and exact values. |
| **Agreements — Renewal Schedule** | CS; EXE summary; PM if renewal changes project planning | Renewal/notice date, client, agreement/retainer, owner and next action | Prioritize renewal deadline and accountable owner, not a sales pipeline. | Calendar/list. |
| **Agreements — Contract History** | CS; authorized executive/legal owner | Agreement/version, effective period, state changes, decision/renewal references and secure document link | Role-scoped history; keep prior terms auditable. | Chronological list. |
| **Service & Health — SLA Monitoring** | CS; PM; EXE exception summary | SLA target/clock, linked request, priority, owner, due/breach state and pause/calendar context where configured | CS handles response; PM sees delivery-caused risk; EXE sees material exception summaries. | Queue/table with deadline indicators; no score if prerequisites are missing. |
| **Service & Health — Service Issues & Feedback** | CS; PM; CR/DEV for assigned project-related items | Source request, issue, client/project, owner, severity, date, status and next action | Link to the Inbox-owned thread or canonical issue; never create a competing request queue. | Action queue/list. |
| **Service & Health — Client Health** | CS; EXE; PM contextual | Defined indicators behind health state: open service issue, overdue commitment, feedback, renewal timing or valid utilization | Show the reason a client is flagged and what to do next. Do not hide weak data behind a numeric black box. | Indicator list and optional trend only with a defined score/time series. |
| **Service & Health — Service History** | CS; PM contextual; EXE summary | Significant service events/feedback, date, linked request/project, outcome and owner | Emphasize meaningful recent changes and source links rather than repeated all-activity streams. | Timeline/list. |

### 4.5 Finance

Finance role defaults must preserve all current worksheet keys, formulas, posting, payment/reconciliation controls, API contracts, authorization, and record relationships. The matrix may influence column order and emphasis only, not accounting meaning.

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Overview & Control — Executive Summary** | FIN; EXE appropriately scoped | Valid selected-period figures, source/definition/unit/currency, key due items and exceptions, drill-down | FIN can inspect detailed financial position. EXE sees approved decision-level aggregation and material exceptions. | Small set of defined comparisons; no conflation of invoice, revenue, cash, or profit. |
| **Overview & Control — Dashboard** | FIN; authorized EXE | Validated financial trends, period controls, source freshness and linked registers | Executive preset may summarize; Finance preset can expose more financial context within its permission. | Charts answer distinct financial questions and have table alternatives. |
| **Transactions & Cash — Cash & Bank** | FIN; authorized SA only for relevant integration state | Account and transaction registers, dates, references, direction, amount/currency, recorded status, source and reconciliation state | FIN works the transactions/reconciliation. SA sees integration health/diagnostics only where authorized, not an alternative bank ledger. | Table first; trends only when balance/movement histories are valid and defined. |
| **Transactions & Cash — Revenue** | FIN; EXE read-only summary if authorized | Revenue/invoice source reference, client, issue/due date, amount/currency and actual financial state | FIN needs operational record details; EXE sees permitted source-backed totals. | Register/report. Preserve revenue recognition semantics. |
| **Transactions & Cash — Expenses** | FIN; PM limited project-cost context if authorized | Date, category, vendor reference, purpose, project allocation, amount, document source, state and payment link | FIN gets financial process detail. PM gets only authorized project allocation/actual context. | Register; category chart only if it helps analysis and totals reconcile. |
| **Transactions & Cash — Petty Cash** | FIN; designated fund custodian | Fund/account, transaction date/type, reference, description, amount, responsible user, source document and recorded balance if valid | Custodian prioritizes entries/reconciliation; accounting reviews evidence and controls. | Transaction table with exact amounts. No decorative charts. |
| **Receivables & Payables — Quotations** | FIN; CS/sales-commercial context where authorized; EXE summaries | Quote number, client, version, state, amount/currency, valid-through date, owner and contract/conversion reference | FIN maintains the canonical quotation workflow; CS tracks authorized quote context. | Register/builder. Preview is not proof of sending/acceptance. |
| **Receivables & Payables — Accounts Receivable** | FIN; EXE aggregate; CS limited client-collection context | Invoice, client, issue/due date, original amount, recorded paid/credited value if valid, outstanding amount, aging and status | FIN prioritizes collection and aging. CS sees only authorized client context and next permitted follow-up. EXE sees summarized exposure. | Aging buckets/bar may help, but exact actionable register is primary. |
| **Receivables & Payables — Accounts Payable** | FIN; designated payables operator | Supplier, source bill/reference, due date, amount/currency, status, permitted payment reference and exception state | Emphasize upcoming/overdue obligation and blocked/uncertain state. Access to supplier master data remains separate. | Due/exception queue and exact table. |
| **Receivables & Payables — Vendors financial reference** | FIN; vendor/accounting personnel with authorization | Canonical vendor reference plus Finance-specific bills, payment and ledger context | Only finance-specific permitted fields; vendor identity belongs to Team & Resources. | Linked register/detail. No second vendor directory. |
| **Receivables & Payables — Vendor bills/payment references** | FIN | Vendor, bill/source, issue/due dates, amount/currency, supporting document, state and payment reference | If these records are already represented by Accounts Payable, use a useful filter/detail section rather than duplicate independent maintenance. | Register. |
| **Project Finance — Project Finance** | FIN; PM/EXE source-linked summary where authorized | Project/client, period, source-linked financial measures and underlying Finance references | FIN sees authoritative detail; PM sees project-control context; EXE gets decision-level totals. | Defined comparison/report, with underlying register and Finance links. |
| **Project Finance — Operational Budget** | FIN; PM; EXE summary | Budget category, period, approved plan, actual source, variance and scope/definition | PM owns operational monitoring; FIN validates actual values and mapping. | Paired bar/variance table only for comparable plan and actual. |
| **Project Finance — Project Allocation** | FIN; PM limited context | Project/category/resource, allocation period, amount/percentage and source references | PM sees allocation needed for delivery; FIN preserves calculation and financial control. | Table; use comparison visuals only for meaningful allocation choices. |
| **Project Finance — Team Fee** | FIN; explicitly authorized reviewers | Existing fee basis/period/project, current calculated values, source inputs and relevant control/history | Show the established calculation/result only. Avoid expanding compensation detail to general project users. | Exact values/table; no new chart needed by default. |
| **Accounting & Reports — Journal** | FIN/accounting only according to policy | Journal/date/period/source, account/debit/credit, state, permitted review/posting controls and audit detail | Prioritize drafts/exceptions/close controls, while preserving existing separation of duties. | Formal table/detail. Never make chart the operational posting interface. |
| **Accounting & Reports — Chart of Accounts** | FIN; designated accounting administrator | Code, name, type/category, active state and mapping fields used by existing system | Configuration actions only for authorized roles; retain downstream report dependencies in view. | Searchable table. No chart required. |
| **Accounting & Reports — Monthly P&L** | FIN; EXE authorized summary | Selected period, established income/expense/profit line items and subtotals with exact values | FIN sees report detail; EXE sees relevant summarized result. Preserve the canonical report. | Table first; optional comparable-period trend with clear definition. |
| **Accounting & Reports — Cash Flow** | FIN; EXE summary | Defined cash movement categories, period, source and exact amounts | Distinguish movement from cash balance and bank balance. | Table/report plus chart only if category/time trend adds understanding. |
| **Accounting & Reports — Balance Sheet** | FIN; authorized executive | Reporting date, assets, liabilities, equity and existing statement hierarchy | Keep formal report structure intact; no invented simplification that hides required accounts/subtotals. | Structured report table. Chart optional and secondary. |
| **Accounting & Reports — Monthly Closing** | FIN/accounting authorized closers | Period, checklist/control status, blockers, exception owner, history, lock/close state | Prioritize unresolved blockers; show actual close state and required authorized action. | Close-control table/exception queue. |
| **Accounting & Reports — Annual Summary** | FIN; EXE summary | Year, comparable reporting periods, exact report values, defined year-over-year comparisons | EXE sees annual decisions/trends; FIN retains formal source-linked detail. | Line/column comparisons with comparable periods; table remains available. |
| **Additional target finance views — templates/bank reconciliation/purchasing** | FIN; designated operators; SA for authorized diagnostics | Only approved and implemented source fields, actual state, source links, owner and safe next action | Treat as target-only until code/API/permission/workflow evidence exists. Bank outcome and reconciliation require particular care. | Tables/queues are primary. Never imply bank connectivity or payment success from presentation alone. |

### 4.6 Team & Resources

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Team & Capacity — Team Directory** | HR/team lead; PM; EXE aggregate | Name, department/team, work role, status, manager/lead and non-sensitive availability/assignment context | PM sees work assignment context; HR sees authorized people details; EXE gets aggregate capacity where approved. | Searchable people register. Restrict HR/compensation fields. |
| **Team & Capacity — Roles & Departments** | HR/team lead; authorized SA for security roles when assigned | Department and work-role membership from canonical records | Distinguish organizational job role from application permission role. Do not turn this into a second access-control system. | Table/tree only if hierarchy genuinely helps. |
| **Team & Capacity — Capacity Allocation** | PM; team lead; HR limited context | Person, project, period, recorded/configured capacity, assigned effort, utilization definition and conflict | PM focuses on assignment conflicts; HR/team lead sees authorized capacity trends. | Horizontal bars/stacked allocation only when data comparable; exact allocation table included. |
| **Team & Capacity — Availability & Workload** | PM; individual contributors; HR authorized summary | Availability period, approved absence, assignments, valid effort and schedule conflicts | PM manages delivery impact; an individual sees their own schedule; HR sees permitted absence overview. | Calendar/list more useful than generic pie chart. |
| **People Operations — Profiles & Employment Details** | HR; employee's authorized self-service view if available | Canonical Team Directory identity, job/department, manager, employment dates/status and secure document references | Restricted fields appear only to roles allowed by policy. No competing employee master. | Detail form/register; no chart. |
| **People Operations — Employee Onboarding** | HR; assigned onboarding owner; manager limited progress | Employee, checklist item, owner, due date, status, blocking reason and evidence | HR sees full authorized lifecycle; manager sees assigned/appropriate progress context. | Queue/checklist. |
| **People Operations — Employee Offboarding** | HR; assigned manager/IT operator for their tasks | Last day, handover, asset/document checklist, access-removal request/check and outstanding items | IT sees authorized access-removal tasks; it does not gain unrelated HR visibility. | Restricted checklist and audit history. |
| **People Operations — Employment Contracts & Status** | HR; authorized executive/finance context where permitted | Contract type/status, dates/expiry, reminder, document link and history | Confidential terms/compensation must remain restricted; general team users see only allowed operational status. | Due-date queue/register. |
| **People Operations — Leave & Absence** | Employee for own records; manager/HR per policy; PM for available schedule context | Person, period, type, status and authorized approval/history | Manager reviews assigned requests; PM sees the availability information required for planning, not all HR details. | Calendar plus actionable request list. |
| **People Operations — Training & Development** | HR; employee/manager as authorized | Training record, objective, provider, dates, completion/certificate and skill tags | Employee/manager views should emphasize own/assigned learning outcomes; restricted notes remain private. | Register/timeline. Completion chart only when reporting is useful and data exists. |
| **People Operations — Performance Reviews & History** | HR; authorized reviewer/manager; employee access if the real policy supports it | Review period, reviewer, goals/criteria, completion state, action plan and prior history | Only authorized participants see narrative/private performance data. Never put these records into general Dashboard cards. | Restricted register/detail/history; no public team performance chart. |
| **People Operations — People Operations Reports** | HR; executive aggregate if authorized | Headcount/status, upcoming contract expiry, leave/absence, training and review completion with definitions/time window | EXE only receives approved aggregate data; HR sees the necessary operational details. Suppress sensitive small-group breakdowns when required by policy. | Simple bar/line for trends with tables/details; no invented headcount or derived sensitive scores. |
| **Vendors & Freelancers — Directory** | PM; procurement/designated operator; FIN authorized vendor reference | Supplier name, service category, engagement state, business contact and owner where present | PM selects a relevant provider; FIN links to the same supplier identity, with finance details protected. | Searchable register. |
| **Vendors & Freelancers — Skills & Service Matrix** | PM; CR; DEV; designated purchasing owner | Service capability, skill/category, work type and permitted rates/availability metadata | Make supplier fit comparable for task assignment; don't invent ratings or capabilities. | Filterable matrix/table. |
| **Vendors & Freelancers — Contracts & Rates** | Designated vendor manager; FIN authorized reference | Provider, scope, term dates, rate/currency, status and document reference | Rate and payment/tax data restricted to authorized roles. | Register/detail. |
| **Vendors & Freelancers — Engagement Status** | PM; vendor manager; FIN for linked financial context | Provider, project/engagement, dates, owner, state and next action | PM sees availability/engagement status; FIN sees linked bill/payment references in Finance. | List/queue. |
| **Time Tracking — Time Logs** | Employee for own entries; PM/authorized reviewer; FIN if costing scope permits | Person, date, project/task, duration, billable flag, category, notes and status | Individual view favors own records; PM/reviewer sees the scope assigned to them; financial costing visibility stays restricted. | Exact-duration table. |
| **Time Tracking — My Timesheet** | Individual contributor | Selected period, own entries, valid total, missing/submitted/approved/locked status and permitted correction action | Keep current period and exceptions prominent. Totals use existing calculation rules. | Compact period table/calendar; no chart required. |
| **Time Tracking — Timesheet Control** | PM/team lead/reviewer authorized by current workflow; FIN only if permitted | Person, period, submitted entries, exceptions, reviewer, state and history | Reviewer queue prioritizes awaiting review and exception resolution. | Queue/register, with actual audit trail. |
| **Time Tracking — Billable / Non-billable** | PM; FIN authorized; individual for own data | View of canonical logs grouped by existing billable classification, person/project/date/duration | Show only fields required for the user's legitimate work. Do not calculate billing or margin using UI-only values. | Table; optional comparison bar for meaningful reporting. |
| **Time Tracking — Time by Project** | PM; EXE aggregate; FIN authorized costing | Project/person/period, valid hours/effort and source context | PM sees delivery effort; FIN sees only authorized costing implications; EXE gets portfolio-level summary. | Horizontal comparison by project/person if useful, with precise values and period. |

### 4.7 Documents

| Worksheet/view | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **Document Library / category filters** | All roles with authorized document access | Filename, category, related record, owner, updated date, version, permitted classification and status | Preset may favor project/creative files, contracts, Finance/tax, HR, or technical documents for the work persona. Access is still enforced by the canonical document policy. | Searchable table/list; category facets. No decorative chart. |
| **Document detail / preview / version history** | Record owner and authorized collaborators | Identity, source record, version, date, permitted access/retention context, preview availability and secure actions | Show relevant relation and approved actions. HR/Finance/security documents retain restricted access. | Detail view, preview and chronological version list; no chart. |

### 4.8 Website CMS

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **CMS Overview (optional)** | CMS; EXE summary if permitted | Cross-content status, publishing/sync exceptions and items needing action | CMS sees actionable content issues; EXE sees only a concise publication/operations summary if it aids a decision. | Small summary and exception queue only if it adds value beyond content registers. |
| **Case Studies** | CMS; CR; authorized account owner for review context | Title, attribution, content state, updated date, preview and edit action | Emphasize editorial completeness and confirmed publication state. | Content register/editor/preview. |
| **Services** | CMS; CR | Service name, content category/language/completeness and publication state | Focus on editing and publication tasks. | Content register; no chart required. |
| **Insights** | CMS; CR | Title, category, author if available, state, updated/published date and preview/edit | Prioritize draft/review/publish queue and content freshness. | Register; optional publication calendar if editorial scheduling exists. |
| **Testimonials** | CMS; CR; authorized reviewer | Attribution, statement, permission/approval state if recorded, publication state and updated date | Clearly distinguish content readiness from permission/approval evidence. | Register/editor; no chart required. |
| **Careers — Jobs** | CMS/recruiter | Job title, department/type/location where relevant, status, publish/expiry dates and public job reference | Keep open/closed/publication actions and their outcomes clear. | Register and editor; no chart needed. |
| **Careers — Applicants** | Authorized recruiter/HR; assigned interviewer/reviewer | Applicant, job reference, received date, actual stage/status, PIC and next action | Access to identity, CV, notes and decisions follows the sensitive applicant-data policy. No commercial CRM stages. | Restricted queue and detail/history. |
| **Careers — Recruitment History** | Authorized recruiter/HR | Linked applicant/job, chronological state/decision, actor/date and allowed reason/context | History is tied to the canonical applicant and not a second applicant list. | Timeline/list. No chart needed for case-level use. |

### 4.9 Settings

| Worksheet | Primary personas | Default content and controls | Role-aware emphasis | Visual decision |
|---|---|---|---|---|
| **System Overview — System Status** | SA; executive read-only summary only if intended | Confirmed service/health state, checked time, relevant source and safe next action | SA gets diagnostics/authorized controls; EXE gets summary without dangerous configuration actions. | Status list/exception panel; don't use charts for one current health state. |
| **System Overview — Database Migrations** | SA/release operator only per current policy | Actual migration state, pending/failed status and safe diagnostic reference | Ordinary users should not see actions that imply permission to migrate production. | Status/table. No chart. |
| **System Overview — Backup Management** | SA/authorized operator | Backup time/scope/status, retention and restoration verification where known | Separate backup existence from verified recoverability; restrict restore/delete controls. | History table/status, not a fabricated green KPI. |
| **Users & Access — User Accounts** | SA/authorized access administrator | User identity, account state, authorized role/access context and relevant activity if available | No user gets access-management controls solely from seeing a page. | Register/details with audited actions. |
| **Users & Access — Roles & Permissions** | Authorized SA/security administrator | Existing role definitions/mappings, permission context and change audit | Describe the canonical server-side security model; never build a second client-side role system. | Structured table/matrix. |
| **Users & Access — Security & MFA** | SA/security admin; limited self-service where supported | Security/MFA state, supported reset/recovery workflow and audit context | Sensitive operations require existing re-auth/authorization and confirmation. Never expose secrets/recovery codes outside permitted flow. | Status/detail and explicit actions. |
| **Audit Log** | SA/security; Finance/HR reviewer only within allowed audit scope | Time, actor, event/action, target reference, result and safe metadata | Tailor default filters to authorized investigation purpose; sanitize secret and personal/bank data. | Searchable audit register. Chart not needed by default. |
| **Integrations — Integration Overview** | SA; module-specific integration operator; executive status summary if authorized | Configured integration, verified state, last check/sync, errors and owner where valid | Keep unknown/stale separate from healthy. Do not grant diagnostics/actions to a role with only read access. | Integration list and exceptions. |
| **Integrations — Website & CMS Integrations** | SA/CMS administrator according to access | Connection/sync state, last confirmed result, affected content and diagnostics safe for role | CMS operator focuses on actionable content sync; SA on connection details within policy. | Status/exception table. |
| **Integrations — Bank Mandiri Kopra H2H** | Explicitly authorized FIN operator and SA/integration operator | Actual service/environment state, last verified result, sync errors, account mapping and audit context as permitted | FIN focuses on bank operations that belong to Finance; SA handles authorized integration diagnostics. Sensitive keys/certificates remain protected. | Exception/transaction queues and structured configuration; no decorative chart. Live payment controls must not be introduced by a presentation spec. |
| **Preferences** | Individual user or authorized settings owner | Supported personal display/view preferences, current value, clear save/reset outcome | User preferences do not grant access or alter shared source data. Shared versus personal settings must be clear. | Simple setting groups; no chart. |

---

## 5. Cross-role scenarios that must be validated

### 5.1 One record, different useful defaults
A project should keep the same identity/status and linked records while a PM, developer, creative contributor and executive see different relevant priorities. All users with access must still be able to reach the canonical project and follow established permission rules.

### 5.2 Multi-role users
If an employee operates as PM and Creative/Marketing, present useful combined priorities or let them use supported workspace views. Do not show a user a persona switch that grants additional access. Keep the default manageable and avoid concatenating every column/KPI from both roles.

### 5.3 Sensitive information
HR, applicant/CV, compensation, vendor banking/tax data, Finance records, audit information, security diagnostics and integration credentials must be governed by current authorization. Sensitive values must not leak through dashboard aggregates, tooltips, detail cards, hidden columns, browser state or exports.

### 5.4 Ownership and handoff
- A client request opened from Inbox and viewed in Client 360 remains the same canonical request/thread.
- A Project-linked Finance summary opens the authoritative Finance record.
- A file opened from Projects or Clients resolves to Documents' canonical file/version.
- Team capacity shown in Projects is derived from the same valid source records as Team & Resources.
- A content item opened from a project and from Website CMS remains the same content record and publication state.

### 5.5 Role changes / permission changes
If an account's actual permissions change, the UI must stop exposing previously authorized data/actions according to the existing system's session/authorization behavior. Saved views and browser navigation cannot preserve unauthorized access. Any implementation gap must be raised rather than solved only by changing presentation.

---

## 6. Worksheet-ready implementation checklist

For every worksheet, complete all of the following before considering its main content ready:

- [ ] Primary persona and secondary personas are mapped to actual authorized users.
- [ ] One-sentence user question and next decision/action are explicit.
- [ ] Default content order and one primary working area are defined.
- [ ] Required visible fields/columns and default order are specified.
- [ ] Role-specific priorities/filters/columns are distinguished from permission rules.
- [ ] Search, filters, sort order, empty/no-match behavior and saved-view semantics are specified.
- [ ] Primary, row and bulk actions have real supported outcomes and correct scope.
- [ ] Relevant chart/visualization has a defined decision question, metric source, period and unit; otherwise the reason for no chart is recorded.
- [ ] High-risk exceptions remain visible to relevant authorized users.
- [ ] Detail sections and record links point to canonical source records.
- [ ] Sensitive fields and role restrictions have been checked against real implementation contracts.
- [ ] Loading, populated, empty source, no matches, partial/unavailable, stale, error, restricted, pending and confirmed-success states are defined as applicable.
- [ ] Desktop, tablet, narrow/mobile, keyboard and screen-reader behavior preserve the core task.
- [ ] Example content uses only one or a small number of clearly labelled representative examples and never masquerades as production data.
- [ ] Current source/API/schema/permission evidence is recorded before claiming the target is implemented.

## 7. Open items for implementation discovery

The following require source and permission verification before converting target presentation into code:

1. The actual RBAC roles, permission claims, record-level restrictions, and route coverage.
2. Which per-user presentation preferences/saved views currently persist, and whether they are personal or shared.
3. Which fields and timestamps are available for actual sort/filter/chart behavior in each worksheet.
4. Which measures have documented/verified formulas, period boundaries, freshness and provenance.
5. Which target worksheets/routes are live, incomplete, absent, or backed only by a placeholder.
6. Which role-specific presets can be implemented in the frontend without adding APIs/preferences schema or changing authorization.
7. How confidential/aggregate information is protected in dashboard queries, report endpoints, exports, chart tooltips, and deep links.

Do not resolve these gaps by adding fixture data, assuming permissions based on job title, inventing formulas, or introducing new persistence without separate approval.

## 8. Related specifications

- `AGENTS.md`
- `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md`
- `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`
- `docs/architecture/ams-navigation-information-architecture.md`
- `docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md`
- `docs/AMS-UX-INTERACTION-STANDARDS.md`
- `AMS-DESIGN-SYSTEM.md`
- `docs/AMS-IMPLEMENTATION-TRACEABILITY.md`
- `docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md`
