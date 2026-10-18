# AMS Master Structure & AI Implementation Guide
## Master Specification for Kapitech AMS Navigation, Modules, Worksheets, Workflows, Data, Integrations, and Acceptance Criteria

- **Repository:** Kapitech-Agency/kapitech-ams
- **Branch produksi:** main
- **Deployment target:** Hostinger, following the repository's current deployment pipeline
- **Document status:** Baseline architecture and instructions for future implementation work
- **Important:** This document defines the target state. All implementers must follow the root AGENTS.md for source precedence, task boundaries, verification of the actual state, and change procedures.
- **Scope at publication:** Structure specification only. This document does not itself change application code, the database, production configuration, or bank integrations.
- **Document language:** English; UI navigation labels use the English terminology adopted by AMS.

---

## 1. Purpose and How to Use This Document

This document is the primary instruction source for AI developers tasked with designing, auditing, implementing, testing, and releasing the major restructuring of Kapitech Agency Management System (AMS). It defines the target navigation structure, module responsibilities, submenus and worksheets, features, statuses, business workflows, data ownership, module boundaries, integrations, security, migration stages, and acceptance criteria.

The goal of AMS is to provide one integrated operating system for Kapitech's creative and IT agency. It must support work from the initial inquiry through sales, agreements, client onboarding, delivery, invoicing, payments, accounting, support, renewals, people operations, website content, and operational audit.

### 1.1 Core Principles

1. **One sidebar with nine primary modules.** Do not create a new sidebar module merely because a feature has its own workflow.
2. **End to end, not just a collection of pages.** Every feature must account for its initial state, process, user actions, statuses, failures, exceptions, outcome, history, and cross-module impact.
3. **One authoritative data source.** Cross-module references must point to the same record rather than copying data into independent master records.
4. **Preserve established business rules.** In particular, Finance navigation restructuring must not silently change formulas, historical transactions, account mappings, calculations, journal posting, period closing, or existing production behavior.
5. **Do not replace the AMS design with a new design.** Follow AMS-DESIGN-SYSTEM.md, use Dashboard as the structural page reference, and follow the existing drawer/modal/Kanban guides and established patterns in other modules.
6. **Keep security and transaction controls within the workflow.** A standalone generic Approval module is not required; maker-checker and authorization controls must remain in the relevant transaction workflows.
7. **Distinguish planned capabilities from actual functionality.** Do not present a control as functional unless the backend, API, permissions, and integration genuinely support it. Inactive features must be identified as unconfigured or unavailable, not shown as successful.
8. **Preserve historical data.** Navigation changes must not delete, duplicate, or change the meaning of existing business data.
9. **Maintain traceability.** Important statuses, changes, sensitive actions, exceptions, and external integrations must have appropriate audit trails.
10. **Make retries safe.** Repeated actions, callbacks, polling, synchronization, and timeout handling must not create duplicate payments, journals, invoices, leads, projects, or other business records.

### 1.2 Working Rules for AI Developers

Before implementation:

- Read the repository on the main branch and the relevant guidelines, including AMS-DESIGN-SYSTEM.md, the drawer/modal/Kanban guides, navigation and access definitions, Finance structure, Finance store/API, database migrations, and relevant tests.
- Verify the actual branch, commit, working-tree state, folder structure, APIs, data models, permissions, migration chain, and build results. Do not assume this document means every feature is already available.
- Map the target navigation to the current implementation. Distinguish existing, partially implemented, missing, simulated/demo-only, and externally blocked capabilities.
- Prepare a small, reviewable migration plan before broad changes. Work incrementally rather than attempting one large rewrite.
- Preserve existing data sources and business rules unless a business change has been explicitly approved.
- Add database migrations only when needed; make them ordered, safe for production, idempotent where appropriate, and compatible with existing data. Do not edit or remove historical migrations that have already shipped.
- Run lint, build, relevant tests, and smoke tests. Record actual results. Never claim tests passed without running them.
- Never write credentials, tokens, secrets, sensitive personal data, or private file contents to logs or documentation.
- Do not deploy, change production, or modify backend/API/database/security/authentication/RBAC based on assumptions. Follow the explicit scope of the active implementation task.
- When the task asks only for architecture, an audit, or documentation, do not turn it into application-code changes.

---

## 2. Repository and Technical Architecture Boundaries

The target repository is Kapitech-Agency/kapitech-ams. The production branch is main, and production deployment targets Hostinger.

The runtime and technical boundaries must be re-verified before each major task. Documented repository foundations include Node.js 22, Express API, React/Vite frontend, TypeScript, Tailwind v4, PostgreSQL as the production data source, session-cookie authentication, CSRF protection, TOTP MFA, RBAC, encrypted data, backups, and a private document vault.

### 2.1 Boundaries That Must Not Be Crossed Without Explicit Authorization

- Do not replace, bypass, or weaken authentication, sessions, CSRF, MFA, recovery codes, RBAC, permission enforcement, audit logs, encryption, backups, or the document vault.
- Do not move sensitive business logic into the frontend.
- Do not use mock/demo/fixture/local-preview data as production data.
- Do not add a dependency or UI/diagram/chart library merely for convenience without a strong technical justification.
- Do not delete a feature, route, table, record, or workflow just because it does not match the new menu arrangement. Map dependencies and prepare a deprecation plan first.
- Do not add Mobile App as a Kapitech service. Mobile App is not part of Kapitech's service offering.
- Do not change the public domain, deployment configuration, production database, credentials, or external integrations without explicit task scope and testing.
- Do not treat a hidden menu as a security control. Authorization must be enforced server-side.
- Do not change Finance report formulas without reconciliation evidence proving that old and new outputs are consistent, or explicit approval for the business-rule change.

### 2.2 Mandatory UI Style Rules

Use the existing AMS design system; do not create a second design system.

- Dark-first, premium, operasional, kompak tetapi mudah dibaca.
- Reference tokens recorded in the design system: background #09090c, panel #0f0f14, line #20202a, text #f3f3f6, muted #8b8b99, crimson #dc143c, success #34d399, warning #f5a524, danger #f97066, info #5b8cff. Verify the source-of-truth tokens before changing anything.
- Crimson is the brand accent; do not use the danger color for every button or active element.
- Use Inter/system typography and the sizes, scale, gaps, padding, control heights, table rows, sidebar, topbar, breakpoints, and components defined by the active guidelines.
- Avoid generic UI patterns that conflict with the AMS concept, such as excessive bento dashboards, glassmorphism, blur, decorative lines, or purposeless animation.
- Switching tabs/subtabs must not cause page padding, header, workspace height, or content position to jump.
- Each page needs clear context: title, a short description when the module pattern uses one, clear content hierarchy, helpful empty state, loading/error states, and a visible primary action.
- Do not create duplicate headers. Follow the current pattern: one page context header, then navigation/tabs, then content. Do not add another header below a subtab.
- Add/Create buttons must use the primary AMS treatment, with the red brand accent in line with the active design rules.
- Use the shared drawer/form patterns where required by the guidelines; do not reintroduce legacy modals or dropdowns for convenience.
- Avoid fake data, inert buttons, dead-end routes, empty tabs, unsupported KPIs, and labels that fail to explain their meaning.
- Use sentence case, tabular figures for money and numeric values, consistent statuses, and clear human-readable labels.

---

## 3. Target Primary Navigation

The sidebar must display only the following nine primary modules. Worksheets and internal features must not appear as top-level sidebar modules.

1. Dashboard
2. Inbox
3. Projects
4. Clients
5. Finance
6. Team & Resources
7. Documents
8. Website CMS
9. Settings

CRM, Proposal/Quotation, and generic Approval are not primary modules. Preserve existing records, API contracts, IDs, audit history and workflow controls wherever still consumed. The existing quotation workflow remains reachable through Finance using canonical records and the current API. Do not rebuild a sales pipeline, create a second quotation store, or introduce a generic approval engine. Vendors, Time Tracking, People Operations, Content & Campaign Operations and Kopra H2H remain subareas, not additional top-level modules.

Visible navigation items must be accessible to the appropriate roles and lead to functional destinations. Do not show links that only open empty pages.

### 3.1 Navigation depth and breadcrumb policy

Use a clear hierarchy rather than exposing every operational view as a navigation item:

1. **Primary module:** one of the nine modules listed above.
2. **Workspace:** a distinct job area inside a module, such as Messages, Project Registry, or Document Library.
3. **Worksheet or view:** a table mode, content category, status view, filter, or saved view inside its owning workspace. These are not additional module/sidebar entries.
4. **Record detail:** the selected business record and its related sections. A record is context inside its owning workspace, not a new navigation level by default.

Keep persistent navigation to the primary module and the relevant workspace. Do not add a third global menu layer for worksheets, statuses, or individual records.

Breadcrumbs are **conditional, not global**. Use them when a deep record/detail page benefits from a clear return path, especially when it was opened from a registry or linked record. Example: breadcrumb ancestors `Projects → Project Registry`, followed by the page title `Website Redesign`. Do not add breadcrumbs to obvious module roots, Dashboard, Inbox's primary workspaces, or the established Finance tabs when the current location is already clear. Do not repeat the current page title in both the breadcrumb and the page heading. Breadcrumb ancestors must be valid links that respect existing route permissions; the current page heading identifies the destination. On compact screens, collapse the path or provide a clear back-to-parent control without adding a second navigation bar.

---

## 4. Module 01 — Dashboard

### 4.1 Structure

- Overview
- Performance
- Analytics

### 4.2 Purpose

Dashboard is a business and operations summary, not an independent source of records. Its values must come from source modules and use consistent metric definitions.

### 4.3 Overview

Show metrics that are actually available and relevant to the user's role, such as:

- Active projects, task overdue, milestones at risk.
- Active clients, client requests awaiting action.
- Client-request activity from Inbox, client health from Clients, and authorized quotation/invoice/cash summaries from Finance.
- Revenue, outstanding receivables, overdue invoices, expenses, cash position, and profit indicators from Finance.
- Team utilization/capacity from Team & Resources when sufficient time and capacity data exists.
- Critical integrations requiring attention, including bank synchronization status when enabled.
- A feed of important actions and exceptions requiring attention.

Do not combine revenue, issued invoices, cash received, profit, and account balances into one metric. Every value must have a period, definition, source, timestamp when relevant, and drill-down.

### 4.4 Performance

- Clear period comparisons.
- Trends for delivery, pipeline, revenue/cash, client health, and resource load.
- Reporting-period controls consistent with Finance reports where relevant.
- Drill down to the source module.
- Percentage changes must be handled safely when the baseline is zero or unavailable.

### 4.5 Analytics

- Lead conversion and win/loss analysis.
- Delivery timeliness, task throughput, and revision/quality trends when metrics are available.
- Revenue, expenses, cash flow, AR aging, and project profitability based on valid data.
- Client renewal/retainer indicators.
- Do not add charts for decoration. Every chart must answer a business question.

### 4.6 Acceptance Criteria

- No hardcoded or fixture/demo numbers in production.
- Reporting period, timezone, metric definition, currency, and source must be clear.
- Selecting a KPI opens the relevant source record or transaction, subject to permissions.
- Unavailable data must be labelled unavailable/stale, not represented as a false zero.
- Roles must only see data they are authorized to access.

---

## 5. Module 02 — Inbox

### 5.1 Structure

Inbox uses four direct workspace entries. Message categories and personal/status views must be grouped inside their owning workspace instead of becoming separate sidebar submenus.

1. **Overview**
   - Source-backed summary of incoming messages and work requiring attention.
   - Show actionable counts, upcoming/overdue follow-ups, and recent activity only when the data is available and permitted.

2. **Messages**
   - **Worksheets:** All Messages, Sales Inquiries, Client Requests, Project & Support.
   - **Filters / saved views:** Unread, Starred, Resolved, Archived.
   - **Shared message workspace:** Search, priority, status, owner/PIC, channel, date range and other supported filters belong in this workspace rather than creating more sidebar items.
   - Message categories, status filters and saved views must refer to the same canonical message/thread records. They must not create duplicate datasets or independent message workflows.
   - Resolved and Archived remain distinct statuses. Grouping them in the same workspace does not combine their business meaning.

3. **Follow-ups**
   - **Views:** Due Today, Upcoming, Overdue, Completed.
   - Present the related message/thread, owner/PIC, due date, status and supported next action.
   - These are views of the existing follow-up records, not new records or a duplicate task system.

4. **Routing & Templates**
   - **Routing Rules:** Existing, supported rules for category, channel, ownership/PIC and message distribution.
   - **Response Templates:** Manage and use supported response templates.
   - Use internal tabs or a clear section switcher for these two areas. Do not expose each as a separate direct Inbox submenu.

**Navigation rule:** The Inbox sidebar/submenu must contain only Overview, Messages, Follow-ups, and Routing & Templates. All other message categories and views belong within these workspaces as worksheets, filters or saved views.

Job applications are not sales leads and must not be managed in Inbox; they belong in Website CMS → Careers → Applicants. Website inquiries may enter Inbox.

### 5.2 Core Capabilities

Each message/thread should have the following fields as appropriate to its source:

- Source/channel and external reference.
- Name/contact data and links to an account, lead, client, or project when identifiable.
- Received time, status, priority, category, assigned owner/PIC, due date/SLA.
- Conversation history, internal notes, attachment references, and related-record links.
- Star/favorite, follow-up due date, resolution reason, archive/reopen status.
- Duplicate detection and the ability to merge or link existing records.
- Routing by category, channel, ownership, or approved rules.
- Maintainable response templates.

### 5.3 Workflow

1. A message/inquiry arrives through a genuinely connected channel.
2. The system securely stores the message and external reference.
3. Initial classification may be rule-assisted; users can correct it.
4. The system identifies possible existing lead/client/project records to prevent duplication.
5. The message is assigned to a PIC/owner with a clear priority and due date.
6. The owner responds, requests more information, creates a follow-up, or links/creates a lead or client request.
7. A message can be resolved only when the relevant resolution requirements are met.
8. Resolved threads can be reopened when a new response arrives.
9. Archiving does not mean permanent deletion. Retention follows the data policy.

### 5.4 Acceptance Criteria

- A lead is created only once when the same message is retried.
- Each thread has a direct link to its related record.
- SLA is displayed only when the required rules, working calendar, and timestamps are available.
- Do not claim a message was sent unless the provider confirms it.
- Starred, follow-up, archive, resolve, and routing actions must have real effects, not be decorative.

---

## 6. Legacy CRM, quotation and approval compatibility boundary

The standalone CRM UI and sales-pipeline module are outside the approved navigation. Existing CRM/deal records, stable IDs, APIs, audit history and current consumers remain intact. The old `/crm` and `/admin/crm` routes redirect to Clients. Do not reintroduce a standalone sales pipeline or duplicate client/account/contact store.

Clients owns supported client identity, directory, onboarding, retainers, SLA and related contracts. Inbox remains the owner of inbound communication and inquiry state. Legacy lead/deal records may still be referenced by existing consumers; preserving this data does not create a primary UI requirement.

The standalone Proposal menu is retired. The existing quotation UI/API remains under Finance at `/admin/finance/quotations`, and `/admin/proposals` redirects there. Keep quotation records, versions, status transitions, numbering, history, permissions and quote-to-invoice conversion unchanged. Do not add a second quote store or workflow.

The generic Approval item is absent from primary/contextual navigation. Keep existing workflow-specific maker-checker, posting, period-close, request history, API and audit behavior. The current `/admin/approvals` route remains protected but unlinked as `DEPRECATED_PENDING`, because its consumers and safe owning workflows have not yet been proven complete. Do not claim full retirement until that dependency review is complete.

## 7. Module 03 — Projects

Projects is the primary source for delivery management. Existing commercial/opportunity records may supply handover context where required by preserved compatibility workflows; this does not authorize a standalone CRM UI or a new sales pipeline. Finance is the authoritative source for financial values. Projects must not create journals or reconstruct Finance values independently.

### 7.1 Navigation Structure

Projects should expose seven clear workspaces. Group related tools within their owning workspace instead of making every feature a direct submenu.

**A. Overview**
- Portfolio summary, source-backed delivery exceptions, upcoming milestones, and useful drill-downs.
- Must not duplicate the Project Registry as a second full project list.

**B. Project Registry**
- One canonical project register.
- Planning, Active, On Hold, Completed, and Archived are filters or saved views over the same project records, not separate workspaces or separate datasets.
- Search, sort, status, client, owner, due date, and supported health filters stay with the registry.

**C. Tasks & Execution**
- Board / Kanban
- List
- My Tasks
- Task Lists
- Dependencies

These views operate on the same canonical task records.

**D. Planning & Delivery**
- Project Brief
- Scope & Deliverables
- Milestones
- Timeline
- Deliverable Tracking
- Internal Quality Review
- Client Review
- Revision History

**E. Content & Campaigns**
- Content Calendar
- Content Planning & Briefs
- Content Production Pipeline
- Creative Assets & Versions
- Internal Review
- Client Review & Feedback
- Revision Tracking
- Publishing Schedule & Publication Status
- Campaign Tracking & Performance

Review/approval is a stateful part of the content workflow, not a separate generic Approval module.

**F. Project Resources**
- Project Team
- Assignments
- Workload

People, availability, and capacity remain sourced from Team & Resources.

**G. Project Controls**
- Change Requests
- Risks, Issues & Blockers
- Budget Summary and Planned vs Actual
- Delivery Health
- Reports & Closure Checklist
- Related Project Files

Related Project Files are contextual links/filter views into the canonical Documents library. Do not create a second project-file repository. Project financial values remain sourced from Finance, and this workspace must not recreate ledgers, journal entries, or Finance calculations.

### 7.2 Lifecycle project

1. Existing commercial context and the project handover requirements are checked; a project is marked ready only when its required scope and terms are verified.
2. Handover requirements are checked and the project record is prepared/created.
3. The project template, brief, scope, deliverables, milestones, timeline, owner, team, and canonical Documents references are set.
4. Tasks, dependencies, assignments, estimated effort, due dates, and acceptance criteria are created.
5. Resource availability is checked with Team & Resources.
6. Work proceeds through board/list views, with progress updated from real task records.
7. Deliverables go through internal QA, client review, feedback, and revision tracking.
8. Scope changes are recorded through change requests and assessed for impact on price, time, and billing.
9. Completion is verified, open issues are recorded, files are handed over, and the closure checklist is completed.
10. The project is archived according to policy while its history is retained.

### 7.3 Tasks, Kanban, and Dependencies

- Each task has one identity, status, owner, priority, due date, estimate/actual values if time logging is available, project, task list, and dependencies.
- Kanban, list, My Tasks, and task details are different views of the same dataset.
- Drag-and-drop must persist the relevant status/order and respect transition rules.
- Unmet dependencies must be visible and correctly accounted for.
- Board changes must not create duplicate tasks or inconsistent statuses in other views.
- Filters, search, pagination, grouping, and empty states must behave consistently across views.

### 7.4 Content & Campaigns

Content workflow:

Brief → Planning/Calendar → Production → Internal Review → Client Review → Revision (when requested) → Approved for Publishing → Scheduled → Published/Publication Confirmed → Performance Reporting.

Features:

- Content calendar per project/client/campaign/channel/date.
- Content items with brief, format, copy/caption, channel, owner, assets, due date, campaign link, and required metadata.
- File/version history.
- Review checklists and comments linked to the relevant version.
- Revisions must retain feedback context and the identity of the requester.
- Publishing schedule.
- Publication status and live URL/reference when genuinely available.
- Campaign objective, period, channel, planned budget, campaign assets, metric definitions, actual-result source, and report.
- Campaign performance figures must include their source and date range. Do not invent or infer advertising-platform data when no connection exists.

If automated publishing is not integrated, AMS may still manage the calendar and manual status, but it must state the status honestly and must not claim that it published content automatically.

### 7.5 Project Budget and Health

- Budget summaries use financial values from Finance.
- Planned vs. actual views distinguish estimates, time-log effort, vendor costs, billed amounts, and recorded financial data.
- Project health considers delivery risks, late tasks/milestones, scope changes, resource overload, pending client reviews, and unresolved issues.
- Health formulas must be documented and consistent; do not claim financial profitability without the correct Finance data.

---

## 8. Module 04 — Clients

Clients owns the canonical client/account/contact directory and the post-conversion relationship workspace. Legacy CRM records and consumers may remain for compatibility, but there is no standalone CRM UI or competing client/contact directory. Do not create duplicate companies, contacts, contracts, or projects during conversion.

### 8.1 Structure

Clients has four workspaces. Avoid separate Overview and Directory destinations that show the same client list.

**A. Directory**
- One canonical company/client and contact directory.
- Companies and Contacts are worksheet/filter modes within the directory, not duplicate directories.
- Client 360° opens the selected client's contextual detail view; it is not a second client master.

**B. Onboarding**
- Onboarding Checklist
- Required Documents
- Kickoff Readiness

Checklist items must link to the relevant canonical records and must not simulate completed business requirements.

**C. Agreements**
- Contracts & SOWs
- Retainers & Service Commitments
- Renewal Schedule
- Contract History

Quotation, invoice, payment, and accounting records remain owned by Finance. Agreement views may link to their authorized references.

**D. Service & Health**
- SLA Monitoring
- Service Issues & Feedback
- Client Health
- Service History and relationship context

Client Requests are owned by Inbox. Clients may show linked requests/conversations in Client 360° or service context but must not create a second request queue or separate request status system. Renewal or expansion context belongs with the client relationship; do not recreate a standalone sales pipeline.

### 8.2 Client 360°

A single client-relationship page summarizing, subject to access permissions:

- Company/contact identity and relationships.
- Existing commercial/opportunity history, when retained and linked for compatibility; do not provide a separate sales-pipeline workspace.
- Contracts, SOWs, scope, expiry, and renewal obligations.
- Active and historical projects, deliverables, risks, and milestones.
- Finance summaries such as quotation/invoice references, outstanding receivables, and payment status.
- Retainer allocation, included/used/remaining hours.
- Inbox conversation, requests, SLA, support history.
- Documents and feedback.

Client 360 is an aggregation/view, not a place to recreate source records.

### 8.3 Onboarding and Lifecycle

Closed Won → client account confirmed → onboarding checklist → documents/contracts verified → kickoff ready → active service → ongoing support → renewal/expansion or offboarding.

Onboarding criteria must be configurable for the service type. Do not mark a project ready merely because a cosmetic checklist is complete; checklist items must reference the correct documents/records.

### 8.4 Retainers and SLA

- Retainer register: period, client, included hours/units, service scope, rates/terms, carry-over policy if applicable, renewal date, status.
- Used/remaining hours are calculated from valid time logs associated with the service/retainer under the agreed rules.
- Batasi double counting time entry.
- SLA monitoring requires a target definition, working calendar, pause rules, valid event timestamps, priority, owner, and breach rules.
- If required events or data integrations are unavailable, label SLA monitoring as manual/limited or not configured. Do not fabricate SLA scores.
- Renewals/opportunities must link to CRM and must not duplicate client identity.
- Retainer invoices are generated through Finance using the shared billing schedule and records.

---

## 9. Module 05 — Finance

Finance has established worksheets, reports, and transactions. Navigation may be reorganized, but accounting and calculation rules must not change as a side effect of changing labels.

### 9.1 Finance Navigation Structure

Finance uses five top-level areas. Preserve all twenty current worksheet keys and existing transaction, accounting, and posting behavior.

**A. Overview & Control**
- Executive Summary
- Dashboard

**B. Transactions & Cash**
- Cash & Bank
- Revenue
- Expenses
- Petty Cash

**C. Receivables & Payables**
- Quotations
- Accounts Receivable
- Accounts Payable
- Vendor bills and payment references
- Vendor & Freelancer financial reference views

**D. Project Finance**
- Project Finance
- Operational Budget
- Project Allocation
- Team Fee

**E. Accounting & Reports**
- Journal
- Chart of Accounts
- Monthly P&L
- Cash Flow
- Balance Sheet
- Monthly Closing
- Annual Summary

### 9.2 Existing worksheet inventory and compatibility map

Worksheet definitions in source code have included the following 20 existing worksheet views. Verify the current live/source inventory at implementation time and preserve all data and underlying business logic.

| Existing worksheet | Target group | Responsibility |
|---|---|---|
| Executive Summary | Overview & Control | Summary of the selected reporting period |
| Dashboard | Overview & Control | Validated financial charts/KPIs |
| Cash & Bank | Transactions & Cash | Recorded bank/cash accounts, balances, and movements |
| Revenue | Transactions & Cash | Existing revenue records and invoice workflow |
| Expenses | Transactions & Cash | Existing expense recording workflow |
| Petty Cash | Transactions & Cash | Petty cash management |
| Accounts Receivable | Receivables & Payables | Invoice balances, aging, and receivable payments |
| Accounts Payable | Receivables & Payables | Liabilities and payment status |
| Vendors | Receivables & Payables, reference to Team & Resources master | References supplier/payee records managed in Team & Resources |
| Project Finance | Project Finance | Project-linked financial information |
| Operational Budget | Project Finance | Budget operasional |
| Project Allocation | Project Finance | Existing financial/resource allocation |
| Team Fee | Project Finance | Existing team-fee calculation |
| Journal | Accounting & Reports | Journal and posting controls |
| Chart of Accounts | Accounting & Reports | Account list and mapping |
| Monthly P&L | Accounting & Reports | Laba rugi periode |
| Cash Flow | Accounting & Reports | Pergerakan kas |
| Balance Sheet | Accounting & Reports | Statement of financial position |
| Monthly Closing | Accounting & Reports | Kontrol penutupan periode |
| Annual Summary | Accounting & Reports | Annual financial summary |

**Potential additional views/workflows — target only, not a claim of implementation:**

- Quotations: canonical quotation register and builder within Receivables & Payables, using the existing quotation workflow.
- Document Templates: centrally maintained reusable quotation/invoice templates only if the current data/API and permission contracts support this capability; otherwise record as target-only.
- Bank Accounts, Bank Transactions & Reconciliation, and Bank Mandiri Kopra H2H may be dedicated views/subtabs under **Transactions & Cash**; whether each is a worksheet ID or nested view must follow the current Finance architecture, without creating duplicate business stores.
- Purchase & Expense Requests may be a view over a dedicated workflow only if schema and backend support it; do not use a frontend-only status list for real money transactions.

The legacy Vendors worksheet must not become a second vendor master. It refers to the canonical vendor record managed in Team & Resources and exposes only the supported Finance ledger/payment references. Preserve existing vendor-payment and expense links. Verify these links against the current schema and migration history rather than assuming a particular migration number is the latest.

### 9.3 Existing Finance rules that must be preserved

- Do not replace real Finance records with sample/workbook fixture/demo data.
- Do not change existing totals, rounding, tax calculations, account mapping, project allocation/team fee logic, journal creation/posting, receivable/payable balances, closing logic, or historical report results without explicit approval and a proven reconciliation plan.
- Chart of Accounts changes must not implicitly change report calculations unless the intended account mapping is implemented and validated.
- Creating an invoice is not the same event as receiving cash.
- Issuing a quotation is not revenue recognition or cash.
- Sending a payment instruction is not a confirmed payment.
- Payments and source journal entries must not be duplicated through bank reconciliation.
- Amounts, dates, currency, exchange conversion, and tax behavior must follow existing explicit configuration/policy, not arbitrary defaults.
- Monthly and annual reports should use the same authoritative posted accounting data and the same period definitions.
- Monthly close must restrict or explicitly govern backdated changes, adjustments, reopen actions, and audit history.
- Existing workbook logic is business reference; avoid reproducing spreadsheet-like implementation text in UI. The UI should express business actions naturally.

### 9.4 Quotations and templates

The canonical user-facing quotation workspace is in Finance. Legacy CRM/proposal records, routes, and APIs may remain for compatibility where current consumers require them, but they do not authorize a separate CRM Sales Desk or a competing quotation workspace. Quote creation, editing, sending, acceptance, and invoice conversion must use the existing canonical quotation lifecycle and preserve stable IDs, history, and conversion behavior.

**Template catalog for quotation:**
- Website Development / Company Profile
- E-commerce / Web Application
- UI/UX Design / Product Audit
- Branding / Logo / Visual Identity
- Video Production / Creative Content
- Graphic Design / Key Visual / Motion / 2D Animation
- Social Media / Digital Ads
- Product Photography
- Creative / IT Retainer
- Maintenance / IT Support
- Blank Custom Quotation

Do not include Mobile App as a Kapitech service template.

**Quotation data:**
- Unique controlled document number, client/contact, account, CRM opportunity, optional project/reference, issue date, validity, currency, line items, quantity/unit, unit price, discount, tax configuration, subtotal, total, scope, deliverables, assumptions, exclusions, timeline, milestones, payment terms, legal/business notes, prepared-by metadata, version, and status.
- Template content should be reusable and configurable by authorized roles. A template must not freeze a previous customer's personal data or pricing accidentally.
- Support draft, ready-to-send, sent, accepted, rejected, expired, and superseded/versioned states as applicable.
- Support preview/print/PDF output using approved document layout, consistent logo/company data, numbering, signature/acceptance field if approved, and page-break-safe rendering.
- Record sent timestamp and recipient/channel only when the application can substantiate the action.
- Revisions preserve history. A sent quote must not be silently overwritten.
- On acceptance, connect to contract/closing and the correct billing plan. Milestone projects may generate multiple invoices based on terms.
- Do not automatically post revenue/cash/journal merely because a quote is accepted.
- Pricing/tax/discount rules must align with Finance configuration and the user's actual service catalog.

### 9.5 Invoice builder and templates

**Template catalog for invoice:**
- Project Deposit / Kickoff
- Milestone Billing
- Phase Completion
- Final Delivery
- Monthly Retainer
- Maintenance & Support
- Creative Production
- Additional Scope / Change Order
- Digital Marketing Management Fee
- Blank Custom Invoice

**Invoice data and capability:**
- Unique centralized invoice numbering, client/account, source quotation/contract/SOW/project/retainer/milestone, issue/due date, currency, line items, taxes/discounts, subtotal/total, payment terms, billing address/reference, notes, document version, payment records, outstanding balance, and invoice status.
- Create from accepted quotation, contracted milestone, retainer billing schedule, or approved custom workflow.
- Preview, print/PDF, document history, due-date monitoring, partial and full payment, overdue calculation, and cancellation controls.
- Distinguish draft, issued/sent, partially paid, paid, overdue, and cancelled with valid transition rules consistent with the existing invoice model.
- Record payments using the existing Finance payment workflow. Do not invent a second payments ledger.
- Invoice creation must not create cash receipt or bank mutation.
- For multiple milestone invoices, retain one source quotation and link each invoice to its respective milestone without duplicating quote totals.
- Number generation must be centralized and collision-safe; do not use random numbers as the only uniqueness guarantee.
- Tax is configured by policy. Do not hardcode tax percentages solely inside the UI.
- Cancellation, credit note, refund, and correction semantics must follow existing accounting capabilities and must not rewrite posted history silently.

### 9.6 Purchasing & Expense Control

Workflow:

Purchase/Expense Request → Budget & Policy Check → Transaction-specific Authorization → Vendor Bill/Expense Record → Payment Request → Payment Execution/Confirmation → Bank Reconciliation → Journal/Accounting.

**Subviews:**
- Expense Register
- Purchase & Expense Requests
- Budget Availability Check
- Purchase Orders where appropriate
- Vendor Bills
- Accounts Payable
- Vendor Ledger & Payments
- Recurring Expenses & Subscriptions
- Expense Categories & Supporting Documents

Required features:
- Requester, department/project, vendor, purpose, amount estimate, category, proposed payment date, budget line, supporting docs, cost center and status.
- Budget availability and threshold checks must reference authoritative finance/project budget data.
- Threshold-based controls and maker-checker separation apply to sensitive transactions. Do not create a standalone Approval module.
- Vendor invoice reference, invoice date/due date, line items/tax as relevant, amount, linked purchase/expense request and related contract.
- Payment batch/reference, status, proof and bank reference.
- Recurring expenses should create scheduled obligations or reminders according to defined rules, not silently create bank payments.
- Vendor/ freelancer master comes from Team & Resources; Finance references the same record.
- Record exceptions such as budget exceeded, missing receipt, duplicate bill, beneficiary mismatch, rejected request, failed payment, and disputed vendor amount.
- Reimbursement may need its own type within Expense Control rather than being forced into a purchase-order flow.

### 9.7 Cash, bank and reconciliation controls

- Cash & Bank remains the authoritative Finance cash/bank view. Bank integration enriches it with verified external information.
- Bank account metadata must safely reference accounts and GL mapping; full bank account numbers should be masked where appropriate.
- Distinguish ledger balance, bank-reported balance, available balance, and last-synced balance. Display source and timestamp.
- Reconcile opening/closing balance and transaction rows over a clear date window.
- Match on reference, amount, date, currency and counterparty as applicable. Handle split/combined fees/transfers through an explicit manual exception flow if automatic matching is ambiguous.
- Never auto-mark a transaction reconciled solely because amounts look similar when more than one candidate exists.
- Reconciliation result and any manual override need operator, timestamp, reason, and evidence/audit history.
- A feed delay is not a zero balance and not evidence that no transactions occurred.
- Duplicate bank callbacks/imported statement rows must be deduplicated using stable bank identifiers where available.

### 9.8 Accounting & Reports

**Journal**
- Source-linked journal entries, draft/posted status, balanced debit/credit validation, controlled posting, reversal/correction through traceable entries, and audit trail.
- One financial event must not create duplicate journal records.

**Chart of Accounts**
- Account code/name/type/status, report grouping, mapping rules, and guardrails around change/deactivation.
- Existing account mapping and dependencies must be identified before changes.

**Monthly P&L / Cash Flow / Balance Sheet / Annual Summary**
- Share period-selection behavior and clear selected month/quarter/year. Support year selection beginning in 2021, in line with Kapitech's founding year and the established reporting requirement.
- Quarter Q1–Q4 can be offered for comparisons where applicable.
- Display reporting period and definition rather than generic “Filter” labels.
- Preserve consistent formulas; expose drill-down to supporting entries when permission allows.

**Monthly Closing**
- Period open/closing review, unresolved reconciliation exceptions, unposted drafts, required reports, authorized close, close timestamp, and controlled reopen.
- A closed period must not silently change from late mutations. Corrections should follow policy and remain auditable.
- Close checklist is a control workflow, not a separate Approval module.

---

## 10. Bank Mandiri Kopra H2H — prepared integration scope

### 10.1 Navigation

Business transaction screens live under:

Finance → Transactions & Cash → Bank Mandiri Kopra H2H.

Connection and technical configuration live under:

Settings → Integrations → Bank Integrations → Bank Mandiri Kopra H2H.

This split is intentional. Finance users work with balances, transactions, transfers, status, and reconciliation. Authorized technical/security admins manage connectivity and secret/certificate configuration.

### 10.2 Bank feature facts and limits

Bank Mandiri's official public Kopra H2H / Mandiri H2H Payment information describes API integration between the bank and a company ERP/internal system, and lists feature families including balance inquiry, transaction status/history, beneficiary-name inquiry, transfers to Mandiri and other banks (including rail options subject to service), foreign-currency transfers, payroll, and bill payment inquiry/payment. The customer applies through a Bank Mandiri business contact, signs the required agreement, supplies documents, develops the application, and tests with the bank; service acceptance and enabled feature set are not guaranteed.

Official starting references for future implementers:
- https://www.bankmandiri.co.id/variant-kopra-host-to-host
- https://www.bankmandiri.co.id/mandiri-h2h-payment
- https://www.bankmandiri.co.id/en/payroll

These references are orientation only. Before coding or enabling the connector, obtain the current bank-provided technical specification, service agreement, credential/certificate requirements, sandbox information, supported endpoints, network/IP allowlisting needs, signing/encryption rules, payload and response schema, callback mechanism, service limits, status semantics, fee rules, and production certification/testing criteria. Official marketing pages are not the API contract.

Do not infer endpoints, headers, tokens, HMAC/signature algorithms, certificate formats, idempotency field names, pagination rules, balance formats, or callback payloads. Implement only from the approved current technical documentation and bank test results.

### 10.3 Finance → Transactions & Cash → Bank Mandiri Kopra H2H

**A. Kopra Overview**
- Integration/service status and last successful check.
- Last successful balance inquiry per authorized account.
- Last synchronization/transaction inquiry timestamp.
- Pending, failed, unknown, or exception counts.
- Unreconciled bank transaction count.
- Current environment label (test/sandbox or production).
- No “connected” or “real-time” claim without evidence from an actual successful request and a timestamp.

**B. Balance Inquiry**
- Inquiry for accounts authorized for the integration.
- Bank-reported balance and timestamp.
- Available versus ledger balance only where API supplies those fields.
- Request status, error summary, and inquiry history.
- Stale-data warning if the last successful response is too old under the defined policy.

**C. Transaction Inquiry & Mutations**
- Transaction history and transaction status inquiry.
- Filter by date window, account, direction, amount, reference, status, and counterparty when data is returned by the bank.
- Bank-side stable reference and internal reference.
- Pagination/cursor/window control according to the actual bank spec.
- Data sync checkpoints to prevent gaps/overlap.
- Duplicate detection; incomplete responses and gaps must be visible.

**D. Beneficiary Name Inquiry**
- Collect transfer beneficiary/account inputs.
- Call the bank's supported verification service when available.
- Display verified name/result and timestamp.
- Block, warn, or require stronger review on mismatch according to policy.
- Do not reveal unnecessarily sensitive beneficiary/account details to unauthorized users.

**E. Transfers & Payments**
- Internal transfer to a Mandiri account.
- Interbank transfer via rails actually approved/enabled (for example SKN, RTGS, BI-FAST where supported).
- Foreign-currency transfer only when contract, account, rail, and API support it.
- Payroll batch workflow if contractually enabled.
- Bill-payment inquiry and payment where supported.
- Initiation from an approved Finance payment request; no raw ad-hoc payment bypassing Finance records.
- Amount, currency, source account, recipient, verified beneficiary result, purpose/reference, requested execution date/rail if supported, transaction fee if returned/contracted, bank status, and external reference.
- A payment submission requires clear confirmation/review before sending. Separate create/edit, submit, authorize, and inspect actions according to the bank's approval model and AMS role policy.

**F. Payment Queue & Batch**
- View payment requests ready for bank execution.
- Validate totals, required fields, account/beneficiary, duplicate instruction, payment window, budget, permissions, and batch composition.
- Show each child transaction's outcome. Batch accepted is not equal to every transfer successful.
- Support partial batch success and item-level exception resolution.
- Payroll batch has stricter permission/data visibility.
- No mass-retry button that resubmits instructions without resolving each uncertain transaction.

**G. Transaction Status & Exceptions**
Normalized AMS states should distinguish at least:
- Draft / Not Submitted.
- Awaiting Review or Authorization.
- Submitted / Processing.
- Confirmed Successful.
- Rejected / Confirmed Failed.
- Unknown / Awaiting Reconciliation.
- Reconciliation Exception.

The normalized states must map to the actual bank specification; do not assume the bank uses these exact labels.

Timeout handling:
1. Store the attempted request safely with internal correlation/idempotency data before dispatch, according to the approved architecture.
2. If transport times out after submission, mark status unknown, not failed by assumption.
3. Query transaction status using the bank-supported inquiry process and reference.
4. Never issue a blind duplicate transfer.
5. If the bank cannot resolve the state automatically, route it to an authorized exception operator with history.
6. Retry only under the confirmed bank rules and documented idempotency semantics.

**H. Bank Reconciliation**
- Import/inquire bank-side transactions.
- Match against actual Finance payments, receipts, fees, and other bank movement.
- Use stable source IDs and bank reference wherever available.
- Queue unmatched and ambiguous records.
- Support partial/manual match only with an explicit choice and reason.
- Track unrecorded bank fees, unknown credits/debits, refunds/returns, duplicate entries, and timing differences.
- Do not create a new receipt/payment/journal if the corresponding source event already created it. Reconciliation links the bank movement to the existing accounting event.
- Provide close-period summary: matched, unmatched, in review, and excluded with reason.

**I. Bank Mapping & Rules**
- Bank account to general ledger cash/bank account mapping.
- Transaction code/type mapping and fee mapping.
- Safe matching rules and thresholds.
- Manual-review criteria and exception reasons.
- Every configuration change has actor, time, before/after audit, and access restriction.
- Configuration changes never rewrite posted historical journal entries silently.

**J. Transaction History & Audit**
- Searchable inquiry and transfer history.
- Link Finance payment request, bank transaction ID/reference, invoice/vendor where relevant, and ledger/journal references.
- Who created, reviewed, authorized, submitted, resolved, or reconciled.
- Timestamps, source outcome, exception resolution, and supported receipt/confirmation reference.
- Mask personal/bank account data in logs.
- Do not persist secrets or raw sensitive payloads unnecessarily.

### 10.4 Settings → Integrations → Bank Mandiri Kopra H2H

- Integration Overview.
- Environment selection/label and explicit production safety guard.
- Connection/service status.
- Credentials, keys and certificates through a secure server-side secret/configuration mechanism, never frontend storage.
- Account mapping and authorized account configuration.
- Connection test and service checks using approved non-destructive calls.
- Polling/synchronization policy and checkpoint visibility.
- Webhook/callback configuration if the bank supports it.
- Error diagnostics with redaction.
- Audit history for configuration updates.
- Operational disable/incident mode that prevents new submissions without corrupting existing transaction status.

Never:
- Commit bank credentials, API keys, client secrets, private keys, access tokens, certificates containing secrets, real payment payloads or production account data into source control.
- Ship secrets to browser code or send them to analytics/logging.
- Put secret values in toast messages or exceptions.
- Treat a successful HTTP response as proof of a completed transfer unless the official response state confirms completion.
- Use live bank transfers in CI or automated tests.

### 10.5 Core controls around bank transfers

- Server-side authentication and per-action authorization.
- Least privilege, independent roles for creator/reviewer/authorizer where bank/policy requires.
- Beneficiary inquiry and mismatch control.
- Payment amount/limit and duplicate checks before dispatch.
- CSRF protection for session-based web mutations and protections required by the bank protocol.
- Secure secret storage, rotation, expiry checks, certificate lifecycle, transport security, IP/network controls as required by the bank.
- Request signing/encryption exactly as specified by the bank; do not invent cryptography.
- Idempotency/correlation strategy compatible with bank behavior.
- Rate limiting and controls against rapid resubmission.
- Masked account details, sanitized error logs, sensitive-data retention limits.
- Immutable audit entries for sensitive events; no user action should rewrite audit history.
- Monitoring and operational alerting for repeated failures, stale data, uncertain payments, reconciliation backlog, and credential expiry.
- Documented break-glass/disable process that does not expose secrets and does not erase history.

### 10.6 Integration testing readiness gates

Do not enable live transactions until all applicable gates pass:

1. Approved service agreement and current specification received from Bank Mandiri.
2. Access to the bank's permitted test environment and credentials.
3. Request signing/authentication, certificates, payload validation, and network constraints validated.
4. Balance, transaction/status inquiry, beneficiary, transfer, bill payment, payroll, or other features each tested only if enabled.
5. Positive, rejected, validation error, timeout, duplicate/retry, partial batch, unknown status, callback replay, stale data, and reconciliation scenarios tested.
6. Bank-confirmed reference mapping and accounting linkage tested end-to-end.
7. Roles and separation of duties validated.
8. Secret redaction, security and audit controls reviewed.
9. Reconciliation and month-close interaction tested with representative data.
10. Production enablement and rollback/runbook explicitly approved.

Sandbox testing is not proof of production access. A mock provider used in tests is not a real bank integration and must be visibly distinguished from production connection status.

---

## 11. Module 06 — Team & Resources

### 11.1 Structure

Team & Resources has four workspaces. Keep one canonical identity per team member and link all people operations records to it.

**A. Team & Capacity**
- Team Directory (canonical team-member identity and work profile)
- Roles & Departments
- Capacity Allocation
- Availability & Workload

**B. People Operations**
- People Profiles & Employment Details, linked to Team Directory
- Employee Onboarding
- Employee Offboarding
- Employment Contracts & Status
- Leave & Absence
- Training & Development
- Performance Reviews & History
- People Operations Reports

People Operations must not introduce a competing Employee Directory or second identity master.

**C. Vendors & Freelancers**
- Directory (canonical supplier/provider records)
- Skills & Service Matrix
- Contracts & Rates
- Engagement Status

**D. Time Tracking**
- Time Logs
- My Timesheet
- Timesheet Control
- Billable / Non-billable
- Time by Project

### 11.2 People Operations

Prepared for future expansion, even when some screens can be introduced in phases.

**People Profiles & Employment Details**
- Reuse the canonical Team Directory person identity for work contact, job title, department, manager, start date, employment status, skills, secure document references, and authorized history.
- Avoid collecting personal data that is not needed for a defined business purpose.

**Onboarding**
- Predefined checklist, employment documentation, role/department setup, equipment/assets if tracked, training, and initial assignment.
- Track completed, pending, blocked, owner, and due date.
- Restrict confidential employment documents.

**Offboarding**
- Last working date, handover, project reassignment, asset return, document/knowledge handover, account access removal request/check, and final checklist.
- Do not use a UI-only checkbox as proof that access has been revoked from external systems.
- Retain necessary audit/business records while restricting the departed user's active access.

**Employment Contracts & Status**
- Contract type/status, start/end dates, expiry reminders, document reference, renewal history, and restricted employment notes.
- Avoid exposing compensation or contract details in general team views.

**Leave Management**
- Leave types and rules configurable to actual company policy.
- Request, review, approved/rejected/cancelled states, balances only when policy and data support them, date overlap validation, leave history, and audit.
- Approval is transaction-specific and role-bound, not a global Approval module.
- Changes in approved leave update availability calculations.

**Availability & Absence Calendar**
- Availability by day/period, approved leave, declared unavailability, and capacity impact.
- Project scheduling sees only the availability fields it needs.
- Distinguish absence from no data entered.

**Training & Development**
- Training record, learning objective, provider, dates, cost if Finance link is appropriate, attendance/completion, certificates, skill tags, and future training needs.
- Sensitive employee notes restricted by role.

**Performance Reviews and History**
- Defined review period, reviewer, goals/objectives, criteria, narrative feedback, action plan, review status, and timeline.
- Private performance records visible only to authorized roles.
- Use consistent review process and preserve prior review versions/history.
- Do not derive automatic salary/discipline decisions without explicitly approved policy.

**People Operations Reports**
- Headcount/status, upcoming contract expiry, leave/absence summary, training completions, review completion, capacity summaries.
- Reports respect role-based data filtering.

### 11.3 Vendors & Freelancers

- One master record per supplier/provider with contact, service categories, skills, contract, agreed rates, tax/payment information as authorized, documents, active/inactive state and history.
- Finance's Vendors worksheet links to the canonical master and displays ledger/payment details; it must not hold a competing directory.
- Vendor engagement and agreements relate to projects and vendor bills without duplicating the supplier.
- Keep vendor personal/bank details highly restricted.

### 11.4 Time Tracking

- Time entry date, user, project/task, duration, billable flag, category, notes, status and modification history.
- Detect impossible/duplicate time entries according to defined policy.
- Timesheet control has appropriate review, lock and correction paths.
- Project, retainer and capacity views consume the same valid time records; do not independently re-enter hours.
- Late corrections after a period or billing run must be auditable and must respect retainer/invoice close rules.

### 11.5 Availability automation

Approved leave → availability calendar → workload/capacity computation → project plan warning/reassignment option. Do not silently remove assignments or change project deadlines solely because leave is created; flag the impact and apply explicit planning decisions.

---

## 12. Module 07 — Documents

### 12.1 Structure

**Document Library** is the single canonical workspace for files and document records.

The following are categories, filters, or saved views inside that library, not separate top-level workspaces:
- Project & Client Files
- SOPs & Policies
- Legal & Corporate
- Finance & Tax
- HR & People
- Security & Infrastructure

Do not create separate Overview, All Documents, or category destinations when they lead to the same register. A cross-category summary may appear within the library only when it provides distinct, useful information and links into the same canonical records.

### 12.2 Capabilities

- Search, filter, preview where supported, upload/download, file metadata, categories/tags, versions, timestamps, owner, retention classification, access policy, and links to source business records.
- Documents may be linked from client, contract, project, quote, invoice, vendor, employee, CMS, or compliance context.
- Context views link to a canonical file/version rather than creating repeated copies.
- Sensitive legal, financial, HR, bank integration, and security documents require least-privilege access.
- Secure document vault rules remain intact. Don't expose underlying bucket/object URLs or secret storage paths.
- File deletion, retention, and replacement need appropriate permission and audit. A replacement must not silently eliminate the required version history.
- Scan/validate supported file types/size; treat file names and content as untrusted input.
- If preview/format conversion is unavailable, expose a safe download route rather than a fake viewer.

### 12.3 Finance and bank documents

Quotation/invoice PDFs are generated artifacts linked to the canonical document source. Bank proofs/receipts and statement evidence should be linked to the transaction/reconciliation source record with proper access and retention, not scattered across personal folders.

---

## 13. Module 08 — Website CMS

### 13.1 Structure

Website CMS uses content-type workspaces:
- Case Studies
- Services
- Insights
- Testimonials
- Careers

An optional CMS Overview is valid only as a cross-content publishing/status summary with distinct useful drill-downs. It must not duplicate a content-type register or route Overview to Case Studies.

Careers contains internal worksheets/tabs:
- Jobs
- Applicants
- Recruitment History

These are views inside Careers, not additional primary/sidebar modules. Job opening management and applicant review remain distinct workflows within the same owning workspace.

### 13.2 CMS workflow

Draft → review/preview → publish → verified sync/status → update or unpublish/archive according to permissions.

- CRUD features must be real and integrated with the current public site mechanism.
- Show save and publish errors, validation problems, and sync/retry outcomes.
- No duplicate publish action should create duplicate content.
- Preview must reflect actual draft content and layout as closely as possible.
- Published status must be based on confirmed CMS/public-site state, not only an optimistic client state.
- Case studies, service entries, insights and testimonials must use the actual persisted CMS source and correct publication permissions.
- Respect the repository's public CMS integrity policy: legacy fixtures or bundled records must not be treated as verified published client content unless ownership/permissions/metrics/publication are verified.
- Do not publish unreviewed client outcomes or unsupported metrics.

### 13.3 Careers

**Jobs**
- Job title, description, department/type/location if applicable, required skills, status, publish dates, expiry, and public job-page reference.
- Add, edit, unpublish/close, and archive behavior.
- Closing a job must not delete prior applicants/history.

**Applicants**
- Applicant source, job reference, received date, status, attachment references, recruiter/PIC, notes, stage history, and decision reason as appropriate.
- Applicant lifecycle must be independent from commercial lead stages.
- Treat personal data and CVs as restricted records; avoid showing them in Inbox or general public CMS reports.
- Do not invent automated emails or integrations unless actually configured.

**Recruitment History**
- Status timeline and decision history.
- Preserve records according to privacy and retention policy.
- Report only data the system is allowed to aggregate.

---

## 14. Module 09 — Settings

### 14.1 Structure

**A. System Overview**
- System Status
- Database Migrations
- Backup Management

**B. Users & Access**
- User Accounts
- Roles & Permissions
- Security & MFA

**C. Audit Log**

**D. Integrations**
- Integration Overview
- Website & CMS Integrations
- Bank Mandiri Kopra H2H
  - Internal sections/tabs: Overview & Status; Connection & Environment; Accounts & Mapping; Synchronization & Diagnostics; Audit Trail
  - Credential and certificate management remains permission-restricted and secret-safe.

Keep integration details inside the selected integration workspace. Do not expose every diagnostic/configuration subsection as another persistent navigation layer.

**E. Preferences**
- Keep personal display/preferences within the relevant settings surface unless there is a genuinely distinct workflow, permission boundary, and route that justify a separate workspace.

### 14.2 Settings policy

- Only expose settings backed by a real feature and correct permissions.
- System health is observational; it must not let an ordinary user alter infrastructure secrets.
- Migration status must reflect real database migration state, not a fixed success label.
- Backup status must distinguish completed backup from verified/restorable backup.
- RBAC changes are highly sensitive; preserve current enforcement and audit.
- MFA reset, role grant, privileged access, integration enablement and secret rotation require explicit authorization and audit history.
- Integration environment state must be unambiguous and safe. Production actions must have clear environment cues and stronger guards.
- Never show, return, export, or log a full secret after it has been saved.
- Error logs should be useful for troubleshooting while redacting tokens, account number portions, personal identifiers, and bank payload secrets.

---

## 15. Cross-Module Workflow & Automation

Workflow & Automation is a platform capability, not a new sidebar module and not a fake engine that merely displays a list of rules.

### 15.1 Event/trigger map

| Trigger / source event | Target/action | Guardrail |
|---|---|---|
| Website/customer inquiry received | Inbox: create/link thread; CRM: lead candidate if qualified/needed | Stable external ID/duplicate detection |
| Inbox categorized as sales | Existing linked lead/opportunity record only where required by the current intake contract | Keep the Inbox thread, link an existing record where needed, and do not create a parallel CRM UI or duplicate conversation |
| Opportunity moves to Closed Won | Validate handover; prepare client onboarding and project | Idempotent conversion; required scope/terms |
| Quotation accepted | Update shared quote state; prepare contract/billing plan | Must not auto-create duplicate quote/invoice or cash event |
| Contract/milestone billing becomes due | Finance prepares invoice per valid schedule | No premature issue/posting; valid source terms |
| Invoice is close to/past due | AR reminder/follow-up task | Respect payment status, communication configuration and role |
| Expense request authorised | Make eligible payment request available to bank flow | Budget, beneficiary, permission and duplicate checks |
| Bank transfer confirmed | Update bank transaction/payment state, source-linked accounting flow | Do not duplicate payment/journal |
| Bank mutation ingested | Propose a reconciliation match | Ambiguous match to human exception queue |
| Approved leave changes | Recompute availability and warn on project/resource conflict | Do not silently reassign or reschedule commitments |
| Time entry validated | Update workload/retainer usage/project effort | One authoritative time record; no double counting |
| Client contract/retainer near renewal | Create/link a Clients renewal follow-up and, only where required, a compatible legacy opportunity reference | Avoid duplicate renewal records; do not expose a standalone CRM pipeline |
| CMS content published | Sync public content/status if supported | Confirmed state; retry-safe |
| Job application received | CMS Careers Applicants | Restricted personal-data access, not sales CRM |

### 15.2 Automation engine requirements

If/when implementation uses a general automation engine:

- Every rule has a business purpose, trigger, filters/conditions, action, owner/configuration permission, enabled status, version/history, last run and error state.
- Events have stable IDs and idempotency/deduplication strategy.
- Retries are bounded and safe. Distinguish retryable transport failures from permanent business-validation errors.
- The event handler records correlation ID and safe failure metadata.
- Avoid synchronous chains that make user actions hang while unrelated systems are unavailable.
- External integration outages cannot corrupt the source transaction record.
- Every material automatic action is traceable to its trigger and resulting record.
- Notifications or reminders are only shown/sent if the corresponding delivery capability truly exists.
- Provide manual recovery/replay with permissions and audit.

---

## 16. Shared data model and boundaries

This section defines logical ownership. It does not require a full database rewrite or dictate exact physical tables until the current schema has been audited.

| Entity/domain | Canonical owner | Consumers |
|---|---|---|
| Company/account and contacts | Canonical client identity in Clients; legacy CRM consumers use linked records | Inbox, Projects, Finance, Documents |
| Lead and opportunity | Existing legacy records/API compatibility, not a primary UI module | Inbox and current consumers where still used |
| Quote/quotation and quote versions | Existing canonical quotation API/records surfaced by Finance | Finance, Documents and any legacy API consumer |
| Contract/SOW/change order | Canonical contract record with secure Documents references | CRM, Clients, Projects, Finance |
| Client onboarding/retainer/SLA | Clients | Projects, Team & Resources, CRM, Finance |
| Project/task/deliverable/campaign item | Projects | Clients, Documents, Dashboard, Finance summaries |
| Employee identity and team membership | Team & Resources → Team Directory | People Operations, Projects/capacity, authorized reports and Settings |
| Employment, leave, training, performance | Team & Resources → People Operations, linked to Team Directory identity | Authorized reports and capacity views |
| Vendor/freelancer master | Team & Resources | Finance AP/expense records, Projects, Documents |
| Time log | Team & Resources → Time Tracking | Projects, Clients retainer use, Finance costing if supported |
| Invoice, payment, expense, payable, ledger, journal | Finance | CRM/client/project summary and Dashboard |
| Bank account integration config/credentials | Settings → Integrations; secret values server-side only | Finance bank operations via approved server APIs |
| Bank inquiry/transaction response references | Finance bank connector domain | Cash & Bank, reconciliation, payment status, audit |
| Document/file/version | Documents/private document vault | Linked business contexts |
| Website CMS entry | Website CMS | Public site, Dashboard status if needed |
| Access/roles/security/audit | Settings/security services | All modules through server-side checks |

### 16.1 Duplicate-prevention principles

- Search/link existing company and contact before creating a new identity.
- Convert lead to client as a state/relationship transition against the same account/contact identity, not clone-and-delete.
- A quotation authored from CRM is the same quotation shown in Finance.
- A vendor selected in Finance references the canonical supplier record.
- Invoice payment, bank movement and journal record have explicit relationships and source identity.
- Bank statement/inquiry retries use stable transaction references where available.
- All event-driven creation flows define unique constraints or equivalent idempotency safeguards.
- Dashboard and 360 views are aggregates, not secondary ledgers.

### 16.2 Naming, statuses and IDs

- Status labels are normalized at the application layer but preserve raw provider status safely for diagnostics where appropriate.
- Every entity should use the repository's established identifier strategy and API contracts.
- Never invent a new ID format or number-generation technique before checking existing patterns.
- Business document numbers require central, collision-safe allocation and audit/version rules.
- Dates use explicit business timezone and consistent date-range semantics. Displayed period boundaries must match backend query boundaries.
- Monetary values use correct decimal/currency treatment already used by Finance; do not use floating-point arithmetic casually for accounting.

---

## 17. Cross-module lifecycle maps

### 17.1 Existing quotation-to-delivery compatibility

Inquiry → Inbox classification/owner → existing lead/opportunity record where required by the current intake contract → existing qualification/scoping workflow → quotation authoring and versioning in Finance → existing negotiation/contract handling → client onboarding → project handover → project setup → delivery and review → closure → client renewal/expansion. Preserve legacy stages and API consumers, but do not present a standalone CRM pipeline as an approved AMS module.

Every arrow represents a real persisted relationship and guard condition. It is not only a redirect between screens.

### 17.2 Quote-to-cash

Scope/pricing → quotation draft → authorized review where required → sent → accepted/rejected/expired → valid contract/terms → invoice or milestone billing schedule → invoice issued → Accounts Receivable → payment request/receipt → bank confirmation if Kopra is used → receipt/payment recorded exactly once → bank reconciliation → source-linked journal/accounting → reporting/month close.

Key distinctions:
- Accepted quote is not cash.
- Issued invoice is not cash.
- Payment request submitted to the bank is not necessarily a completed transfer.
- Bank-confirmed payment and Finance accounting event must be linked to avoid duplicate posting.
- Payment partial/full changes outstanding balance according to existing Finance rules.
- Exceptions remain visible until resolved.

### 17.3 Purchase-to-pay

Purchase/expense request → budget/policy check → relevant approval/authorization → vendor bill or expense record → AP due date → authorized payment request → bank transaction if H2H is enabled → confirmed result → payable/payment state update → bank reconciliation → accounting → reporting/period close.

### 17.4 Retainer management

Client retainer terms → period/included hours → project/service allocation → valid time logs → used and remaining hours → limit/overage warning according to policy → invoice generation per schedule → renewal reminder/opportunity → revised terms and next period.

### 17.5 People-to-capacity

Employee/contract status → work availability and approved leave → capacity calculations → project assignment/workload → time entry → completed work and effort reporting → training/performance development history.

Personal/performance records are not generally exposed to project users; Projects should see only required capacity and assignment data.

### 17.6 Content-to-campaign result

Campaign brief → content items/calendar → production/assets → internal review → client review/revisions → approved → scheduled → publication confirmation → metrics ingested or recorded with source → campaign performance report.

A manual publishing workflow must remain truthful if no channel API is connected.

### 17.7 H2H bank transaction

Eligible Finance payment request → validation/budget/recipient check → review/authorization per policy → server-side authenticated request to bank → returned result or unknown → status inquiry if needed → confirmed bank transaction → source-linked Finance record update → reconciliation against statement/mutation → correct accounting/reporting state.

No blind retry after timeout. No duplicate payment/journal. No frontend-held bank secrets.

---

## 18. Roles, permissions and governance

The exact role matrix must be reconciled against existing RBAC. The following is a capability matrix to guide that audit, not permission to invent roles or grant access automatically.

| Capability | Typical restriction |
|---|---|
| View module records | Based on existing module/record scope |
| Edit sales lead/opportunity | Assigned/authorized sales roles |
| Create/send quotation | Sales/finance permissions; controlled edits and version history |
| Issue invoice/record payment | Finance permissions and existing accounting policy |
| Submit bank transfer | Explicit transaction permission with required validation |
| Authorize bank transfer | A separate authorized role when required; do not self-authorize where policy prohibits |
| View bank configuration/secrets metadata | Restricted integration admin; no secret reveal after save |
| Resolve uncertain bank transaction | Authorized Finance/integration operator with audit |
| Change account/GL mapping | Authorized Finance/admin with explicit history |
| Post or reverse journal | Existing Finance/accounting privilege and checks |
| Close/reopen accounting period | Restricted finance control with reason/history |
| View/edit employee contracts | Restricted People Ops/admin |
| View performance reviews/compensation | Highly restricted and separated from general project access |
| View applicant CV/contact data | Restricted recruitment/authorized HR roles |
| Change role/MFA/integration permission | Restricted admin, audited |
| Edit published website content | CMS permission; publish rights separate if existing policy supports separation |

Enforce permission server-side for APIs and data retrieval; frontend hiding is supplemental only. Audit sensitive read/export where policy and architecture require it.

---

## 19. Error states and operational readiness required across modules

Every non-trivial workflow must handle at minimum:

- Loading/in-progress.
- No records / empty state.
- Validation errors.
- Permission denied.
- Network/API failure.
- Stale data / last-sync time.
- Partial success when an operation spans multiple records.
- Duplicate/conflict.
- Record changed by another user.
- External service unavailable.
- Uncertain outcome requiring inquiry/reconciliation.
- Recoverable versus permanent error.
- Retry, cancel, and safe navigation when applicable.

Messages should describe what happened, what was saved, what was not saved, and the next action. Do not display raw stack trace, secret, SQL details, private identifiers or bank response payload to ordinary users.

---

## 20. Mandatory staged implementation and timeout-safe execution protocol

This guide defines the target product, module/workflow ownership and domain acceptance requirements. It must not create a competing delivery schedule. The current end-to-end sequence, dependencies, deliverables and exit gates live in:

- `docs/AMS-END-TO-END-DELIVERY-ROADMAP.md` — the single canonical stage sequence from baseline through production stabilization.
- `docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md` — current requirement-level status, evidence, dependencies, blockers and next action.
- `docs/AMS-END-TO-END-EXECUTION-PROMPT.md` — the copy/paste instructions for the executing AI.
- `docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md` — execution discipline, verification and timeout recovery.
- `docs/AMS-IMPLEMENTATION-TRACEABILITY.md` — requirement IDs and implementation evidence, revalidated against current `main`.
- `docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md` — test coverage and release evidence.

The Master Structure remains authoritative for the target state described in this document. The navigation IA remains authoritative for approved navigation ownership. The design system remains authoritative for visual tokens and interaction standards. Domain guides remain authoritative for Finance, data ownership, workflow state machines, security, APIs, private documents, integrations and production operations. Their local examples or historical stage numbers do not supersede the end-to-end roadmap.

### 20.1 Required execution behavior

1. **Inspect before editing.** Re-fetch current `main`, inspect the latest relevant commits, source, tests and CI. Verify the status of previous work and preserve correct changes; do not restart from zero because a prompt or session changed.
2. **Follow the roadmap order.** Execute the stages and acceptance criteria in `docs/AMS-END-TO-END-DELIVERY-ROADMAP.md`. Do not skip, combine, reorder or silently broaden stages. Findings that belong to later stages are recorded for later unless they are required to safely complete the current stage.
3. **Work in bounded slices.** Each slice must have a clear outcome, files/flows in scope, validation plan and safe checkpoint. For module-based work, do one module or well-bounded worksheet/workflow slice at a time.
4. **Report continuously.** Send a durable user-facing report at baseline, after each meaningful slice, when a blocker or significant risk appears, and at each stage gate. Include exact current/committed SHA, changed files, what is verified, tests and results, remaining items, unverified areas and one next action. A commit message alone is not a report.
5. **Continue after routine reports.** A report is a checkpoint, not an automatic pause request. Continue to the next task within the already-authorized end-to-end scope when safe. Do not ask for permission after each routine slice.
6. **Honor real approval gates.** Stop at the roadmap's explicit visual/content sign-off before broad functional expansion, and whenever a genuine business/product decision, change to a financial rule, authorization/security decision, destructive or live-production action, scope change or unresolved critical risk requires user input. Do not treat broad roadmap scope as permission for an unreviewed risky operation.
7. **Timeout recovery.** A timeout is not completion. Shrink the batch, complete and verify the smallest safe unit, and report the last verified commit, exact check status and next task. On resumption, fetch current `main`, changed files and CI before editing. Do not repeat already verified work or assume uncommitted changes survived.
8. **Commit safely.** Commit verified checkpoints directly to `main` in line with the user's instruction and repository policy. Never create a branch/PR instead without instruction, force-push, overwrite concurrent work or bypass repo protection. If a main-branch write is blocked, stop and report the actual blocker.
9. **Respect phase-specific scope.** During visual stages, reuse current routes, APIs, records and supported interactions; do not implement missing business workflows or cross into protected backend/API/data/security/business behavior as opportunistic cleanup. Later full-stack stages must follow their reviewed plan and appropriate tests.
10. **Use evidence, not assumption.** A documented feature is not proof of functionality. Do not claim a route, field, API, permission, CI result, browser/viewport behavior, external integration or deployment was verified unless the corresponding evidence exists.
11. **Keep evidence current.** Update the feature/content gap register for requirement-level changes, the structural redesign progress file for UX/UI slices, and the implementation traceability register for workflow/functional evidence. Historical snapshots remain labeled historical until revalidated.
12. **Avoid unsafe shortcuts.** Do not invent production data; create duplicate record stores; weaken access/security; alter Finance meaning/calculations without approval and reconciliation; run destructive recovery against production; or retry an uncertain external payment blindly.

### 20.2 Required progress report

Use this compact structure for every meaningful slice and stage boundary:

- **Stage/slice and status:** complete, in progress, blocked or not verified.
- **Verified result:** observable behavior supported by evidence.
- **Files and changes:** specific repository paths and purpose.
- **Commit:** exact SHA/link on `main`, or clearly state not committed.
- **Validation:** exact tests/commands/CI and actual pass/fail/pending/not-run result.
- **Preserved work:** earlier change(s) verified and not repeated.
- **Remaining gaps/dependencies:** requirement IDs from the gap register where possible.
- **Risk/unverified:** browser, role, runtime, data, provider or deployment evidence not available.
- **Next action:** one precise bounded task.

### 20.3 Stage-sequence authority

The required stages are: baseline and preservation; navigation; shared shell/geometry; feature/content gap register; main-content hierarchy for all nine modules; visual/responsive/accessibility review with user sign-off; workflow/data/API traceability; foundation/security/data-integrity plan; core agency vertical workflows; Finance quote-to-cash/purchase-to-pay/accounting integrity; integrations and automation; security/reliability/performance hardening; full regression/E2E/UAT; migration/reconciliation/backup/restore/DR proof; production readiness authorization; and deployment verification/stabilization.

Use the roadmap for the exact stage numbers, scope, dependencies, deliverables and exit criteria. Do not independently infer that one of these stages has passed. If its acceptance evidence is missing, keep the relevant requirement unverified and do not claim production readiness.

### 20.4 Production-readiness standard

This specification alone does not make AMS production-ready. Follow the current production runbooks and verify the actual release, authorized runtime configuration, PostgreSQL connectivity/source selection, every migration discovered by the runtime loader and exact checksums, completed/reviewed relational reconciliation, active-user MFA coverage, fresh valid backup, restore rehearsal against the same latest backup artifact, private-document object integrity, enabled notification configuration, current CI and live smoke tests.

The authenticated `GET /api/system/production-readiness` endpoint must return HTTP 200 with `productionReady=true` before declaring the documented runtime gate green. HTTP 401 is not a readiness verdict, HTTP 409 means a gate is incomplete, and HTTP 503 means the gate evaluation could not complete. A passing build, healthy database ping, or completed documentation is insufficient. If any mandatory gate or deployed smoke test cannot be verified, report **not yet production-ready** with the exact blocker.

## 21. Minimum quality and acceptance checklist

### Navigation and UX
- [ ] Exactly nine approved primary modules only: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, and Settings.
- [ ] Every submenu is functional, access-controlled, and has an explicit purpose.
- [ ] No duplicate modules for Quotations, Approvals, Vendors, Time Tracking, People Operations, or Kopra.
- [ ] Tabs/subtabs preserve header and content geometry.
- [ ] No stale UI remnants, dead buttons, fake records or placeholder routes.
- [ ] Forms/drawers have validation, cancel behavior, error handling and success state.
- [ ] Empty/loading/error/stale states are present and understandable.
- [ ] Visual implementation follows current AMS guidelines.

### Data and workflows
- [ ] Company/contact identity remains canonical across Clients and any retained legacy CRM consumers; no standalone CRM pipeline UI or duplicate identity store is introduced.
- [ ] Quotation records, versions and conversion history use the canonical existing workflow and remain accessible through Finance; legacy consumers reference the same records where still required.
- [ ] Vendor master is shared between Team & Resources and Finance.
- [ ] Invoice/payment/journal relationships are explicit and duplicate-safe.
- [ ] Closed Won handover cannot create duplicate project.
- [ ] Content lifecycle records revision and review history.
- [ ] Leave/capacity/time-entry behavior is consistent.
- [ ] Client retainer usage derives from eligible time records.
- [ ] CMS publishing and Careers applicants use correct record types.
- [ ] Workflow retries are idempotent.
- [ ] Source records and audit histories are retained appropriately.

### Finance
- [ ] Existing Finance workbook/worksheet inventory is accounted for.
- [ ] Existing Finance formulas, transactions, mappings, journal and closing behavior are preserved unless approved otherwise.
- [ ] Quotation templates, version history, acceptance and PDF/print work.
- [ ] Invoice templates, numbering, payment status and aging work.
- [ ] Invoice issued does not imply cash received.
- [ ] Purchasing, budget checks, vendor bills and AP/payment lifecycle work.
- [ ] Existing reports agree with baseline or approved change evidence.
- [ ] Partial payment and overdue logic are correct.
- [ ] Month close/reopen follows existing accounting controls.
- [ ] No duplicate journal from payment or bank reconciliation.

### Kopra
- [ ] Actual bank spec and access approved before provider implementation.
- [ ] Test and production environments are clearly distinct.
- [ ] Secrets stay server-side and are redacted from logs.
- [ ] Bank feature availability is configured, not assumed.
- [ ] Timeout produces unknown state and status inquiry, not blind retry.
- [ ] Beneficiary validation and permission/limit checks work as required.
- [ ] Batch outcomes tracked per payment.
- [ ] Payment confirmation is distinct from submission.
- [ ] Bank transaction references map to the correct Finance records.
- [ ] Reconciliation ambiguity goes to an exception queue.
- [ ] All sensitive bank actions are audited.
- [ ] No real transactions are triggered by automated tests/CI.

### Security, testing and release
- [ ] Server-side permissions apply to each sensitive endpoint.
- [ ] Auth/session/CSRF/MFA/RBAC are preserved.
- [ ] Schema migrations are ordered, repeatable where designed, and safe for existing data.
- [ ] Lint and production build pass.
- [ ] Automated tests cover workflows and failure scenarios.
- [ ] API and E2E tests cover relevant permission boundaries.
- [ ] Data integrity/financial regression checks pass.
- [ ] Smoke tests and release notes reflect actual verification.
- [ ] Deployment is made only through the current approved main branch process.

---

## 22. What this document does not authorize

This guide defines the intended structure and future implementation requirements. It does not itself authorize an AI to:

- Rewrite the application's business logic wholesale.
- Change the production schema without a migration and rollback plan.
- Change financial formulas or accounting policy.
- Send real bank instructions or create real money movements.
- Enable Kopra production credentials or live payments.
- Weaken roles, authorization, audit or data security.
- Replace the design system with a new design.
- Use fixtures or mocked API results as production data.
- Delete old records or historical data to fit the new navigation.
- Declare work complete without test/build/verification evidence.

Every code task still needs a scoped plan, source inspection, implementation, tests, and explicit reporting of changed files, migrations, known risks, checks performed, and remaining blockers.

---

## 23. Official Bank Mandiri references for Kopra research

These are external references to re-check during implementation. They are not a substitute for the current technical specification or contract delivered to Kapitech.

1. Kopra Host to Host: https://www.bankmandiri.co.id/variant-kopra-host-to-host
2. Mandiri H2H Payment: https://www.bankmandiri.co.id/mandiri-h2h-payment
3. Bank Mandiri Payroll: https://www.bankmandiri.co.id/en/payroll

The future implementation owner must verify current terms, eligibility, fee schedules, exact service options, API contract, security requirements, environment and testing procedure with the Bank Mandiri relationship/business contact. Bank capabilities and availability can change.

---

## 24. Final definition of success

AMS is structurally complete when its **nine approved primary modules** form one coherent operational ecosystem:

- **Dashboard** exposes accurate, role-permitted summaries and drill-downs from authoritative source modules.
- **Inbox** captures and routes supported communications, inquiries and follow-ups.
- **Projects** manages contracted delivery, tasks, milestones, content, campaigns and outcomes.
- **Clients** maintains canonical account/contact relationships, onboarding and ongoing service lifecycle.
- **Finance** controls quotations through the existing Finance workflow, invoices, bills, receivables/payables, cash, bank reconciliation, journals and reports.
- **Team & Resources** manages authorized people, vendors/freelancers, time and capacity records.
- **Documents** securely retains canonical files, metadata and version history.
- **Website CMS** manages supported website content and Careers workflows.
- **Settings** controls authorized user, application, audit and integration configuration.

CRM, Proposal/Quotation and generic Approval are not primary modules. Retaining legacy records, APIs or protected compatibility routes does not add them back to the primary navigation or authorize building competing workflows.

The defining test is not whether every menu exists. It is whether users can navigate to the correct owner, understand the purpose of each workspace, and move through approved business processes with canonical source records, valid status transitions, secure permissions, visible exceptions, traceable decisions, consistent accounting, no duplicate transactions and no unnecessary manual re-entry.

Structural work is not complete until the user has reviewed the navigation and workspace stages. Functional work is not complete until relevant persisted outcomes, cross-module effects, failure paths and tests provide evidence. Each implementation must use the staged checkpoint and timeout-safe reporting protocol in Section 20.

---

## 25. AI implementation anti-mistake contract (mandatory)

This section is intentionally explicit because this repository contains production business rules, security controls, dated audit documents and a desired future navigation that is broader than the currently verified implementation.

### 25.1 Never confuse target navigation with shipped functionality

The navigation in this guide is the **desired target state**. It does not mean that every page, endpoint, database table, API contract, report, integration or permission already exists.

Before implementing a target item, trace and classify:
1. Sidebar item and route.
2. Page/view and its data source.
3. API client methods used by the view.
4. Server route, service/repository and validation.
5. Database schema/migration and uniqueness/relationship constraints.
6. Role/permission checks on both server and UI.
7. Existing test coverage and real production usage, where verifiable.

Record gaps instead of faking completion. A control is not end-to-end merely because it can be clicked or changes local React state.

### 25.2 Documentation hierarchy and conflict policy

Use this exact scope separation:

| Concern | Primary authority | Conflict handling |
|---|---|---|
| Current user task and scope boundary | Latest explicit user instruction | Do not expand scope without authorization |
| Current implementation and runtime behavior | Repository code, tests, schema/migrations, verified provider contracts | Inspect before altering; preserve working behavior |
| Visual language and interaction | AMS-DESIGN-SYSTEM.md and the relevant shared-component guide | Do not invent a parallel system |
| Target module/navigation/workflow | This master guide | Target must be mapped to actual code before implementation |
| Finance process and accounting controls | docs/FINANCE-EXCEL-ALIGNMENT.md plus actual Finance logic/tests | Preserve calculations, journal controls and reconciliation unless a specific business-rule change is approved |
| Older findings and historical state | docs/ams-workflow-audit.md and commit history | Treat dated statuses and route taxonomies as snapshots, not live truth |
| Deployment/runtime readiness | README.md, release/runbook documents and verified CI/production readiness result | Do not claim production readiness from source inspection alone |
| Bank H2H behavior | Current Bank Mandiri contract, technical spec and test certification | Never infer API schemas from marketing descriptions |

If a conflict affects financial outcomes, access control, existing data, public publishing, a bank transaction, or production operation, stop the conflicting mutation and report the specific conflict before proceeding. For lower-risk choices, select the most consistent existing repository pattern and document the assumption.

### 25.3 Requirements traceability

For a large change, maintain an implementation checklist mapping:
- Requirement ID / target submenu.
- Current status: verified, incomplete, UI-only, backend-only, demo-only, schema-required, externally blocked or target-only.
- Existing source file/API/schema.
- Intended change.
- Dependencies and source-of-truth record.
- Role/permission boundary.
- Failure/retry behavior.
- Test required and actual result.
- Any unresolved assumption.

Do not mark a requirement done until the UI, persisted data, API validation, permission enforcement, related cross-module behavior, and relevant tests prove it. If a test is impossible due to missing bank access or credentials, label the capability externally blocked and state which evidence is missing.

### 25.4 Scope safety: what menu consolidation means

The target has exactly nine top-level navigation modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings.

This taxonomy is not permission to delete underlying capabilities:
- Removing the standalone Proposal menu must preserve quotation records, sent/accepted/rejected/expired states, quote versions and quote-to-invoice conversion. Make the existing workflow reachable through Finance without creating a second UI/data implementation.
- Removing the generic Approval menu must preserve workflow-specific maker-checker permissions, finance posting controls, period closing controls, request history, audit trail and valid API consumers. The current protected direct route remains unlinked as DEPRECATED_PENDING until a safe workflow owner is verified.
- Removing CRM from primary navigation does not authorize deleting underlying CRM/deal records, APIs, history or valid consumers. The old route redirects to Clients; do not rebuild a standalone sales pipeline.
- Vendors and Time Tracking become subareas, but preserve their canonical records, routes/API contracts that are still consumed, record links and relevant redirects.
- The target does not introduce separate stores for invoice, quotation, vendor, project finance, time entries or bank transactions.
- A legacy route may be redirected or removed from navigation only after route consumers, deep links, tests, external clients and access rules are assessed.

### 25.5 Explicit frontend and backend boundary

The user's task scope controls whether a change is UI-only, full-stack, documentation-only, or audit-only. Do not infer authorization to change a different layer.

For frontend/UI-only work:
- Do not change server routes/services, database schema/migrations, Finance calculations, authentication/session/CSRF/MFA, RBAC policy, endpoint contracts, or seeded/production data.
- Use current APIs and report the backend dependency if a requested UI behavior cannot be implemented safely with existing contracts.
- Never fabricate persistence through local state/localStorage just to make a button appear to work.

For full-stack workflow work:
- Preserve backward compatibility where used, validate authorization server-side, design migration and recovery, add tests, and trace the record end-to-end.
- Do not shift sensitive authorization or business calculations to frontend code.
- API contracts, request types, response types, validation, logs, event handling and UI states must agree.

For documentation-only work:
- Change documentation only.
- Do not treat a documentation commit as application implementation, successful production verification, a live API connection, or a completed migration.

### 25.6 Shared data contract: one business event, one canonical record

Before adding a model, search for an existing entity/API/store and verify whether the request is an alternate view or state transition of an existing record.

- A company/contact must remain a shared identity between CRM and Clients.
- CRM and Finance quotation builders must reference the same quote and version history.
- Invoice payments, bank transactions and journal entries must be linked by canonical references and must not be separate ledgers for the same event.
- Vendor profiles live in Team & Resources; finance vendor bills/ledger/payment views reference that master.
- Project Finance displays Finance-authoritative actuals and may not invent accounting totals from project completion percent.
- Time-based retainer consumption must use valid, eligible time logs and must prevent duplicate counting.
- Inbox content and CMS recruitment applications are different domains; do not convert applicants into sales leads.
- Documents are canonical files/versions with links from business contexts, not repeated attachments copied into separate stores.
- Every integration/import/callback/conversion must define stable identity, duplicate detection, conflict resolution and safe retry.

### 25.7 Mutation discipline and transaction safety

Before a mutating action, determine:
- Is this a draft, an issued business document, a posted accounting entry, a request, or a confirmed external transaction?
- What role can create, update, issue, submit, authorize, reverse or close it?
- What is the legal status transition?
- What happens if the browser retries, the server times out, the response is lost, or the external provider partially succeeds?
- Can the action be safely repeated? If not, what idempotency/lookup guard exists?
- What audit entry, version, source reference, journal, notification or linked workflow is required?

Never:
- Silently overwrite a sent quotation or issued invoice version.
- Mark an invoice paid merely because a payment request was sent.
- mark a bank transfer failed or resend it solely because a network call timed out.
- Treat reconciliation matching as a new payment/receipt event.
- Rewrite posted journals or closed periods without the existing correction/reversal/reopen controls.
- Auto-close an exception without evidence.

### 25.8 UI acceptance is interaction-level, not screenshot-level

For each changed UI, verify:
- The intended action is visible and makes sense in context.
- All controls work and are disabled while conflicting saves are pending.
- Validation and server errors remain visible and actionable.
- Save success reflects confirmed API persistence.
- Cancel/close behavior protects in-progress edits and does not dismiss a mutation silently.
- Search/filter/sort/pagination/grouping use the correct data and compose predictably.
- Empty state differs from loading, error, unavailable and no-permission states.
- Drawers, modals, dropdowns, focus trap, keyboard use and scroll ownership follow shared guidelines.
- Query-string tabs/deep links preserve correct active state and browser back/forward behavior where applicable.
- Narrow viewport and keyboard use remain usable.
- Optimistic state is reverted when a server mutation fails.

Do not use screenshot similarity as the sole definition of completion.

### 25.9 Data migration rules

For every schema/data migration:
1. Inspect the current schema and shipped migration chain.
2. Do not edit checksums/contents of a migration already shipped.
3. Add a new, ordered migration with deterministic behavior and appropriate transaction/locking strategy.
4. Backfill only from validated source-of-truth records; produce duplicate/conflict reports for ambiguous rows.
5. Add indexes/constraints only after understanding existing duplicates and rollout ordering.
6. Maintain compatibility with application versions during deploy/rollback where applicable.
7. Run migration tests against a representative copy or controlled environment, not the live production DB casually.
8. Record expected row counts, invariants and reconciliation queries.
9. Verify backup and recovery plan before destructive or difficult-to-reverse changes.
10. Test that rerun/restart does not double-apply business effects.

Never migrate live JSON/production data or change the production datasource by undocumented script.

### 25.10 Tests that should accompany a workflow change

Select tests according to impact; do not rely on build alone.

- Unit/domain logic tests for transitions, calculations and validation.
- API tests for accepted/rejected input and authorization boundaries.
- Persistence tests for relationships, unique constraints, migration and audit history.
- Integration tests between source and destination modules.
- E2E test for the user journey from entry point to final persisted outcome.
- Failure-path tests for timeout, duplicate/retry, partial save, permission denial and stale/conflicting record.
- Finance regression comparing representative values and report outputs with the baseline.
- Bank integration tests using a provider sandbox or contract fixtures; never real transfer calls in general CI.
- UI checks for error/empty/loading state, navigation geometry and existing shared interactions.

Test fixtures must be clearly test-only and never leak into production source records or live dashboard metrics.

### 25.11 Required reporting at end of any implementation task

The task report must state:
1. Scope requested and scope actually performed.
2. Files changed and why.
3. Existing behavior intentionally preserved.
4. User-visible behavior and workflow affected.
5. API/schema/migration/permission implications.
6. Tests/commands actually run and pass/fail result.
7. Known gaps, external dependencies and assumptions.
8. Whether commit/push/deployment occurred; include commit SHA and target branch when applicable.
9. What remains unverified.

Do not say “fully complete,” “production-ready,” “E2E passed,” or “bank integration works” unless the relevant evidence exists. Report partial completion honestly.

### 25.12 Documentation maintenance rule

When implementation changes the route taxonomy, workflow, data ownership, security boundary, or user-visible behavior, update the relevant docs in the same task if requested/in scope. Update evidence and date labels rather than allowing historical snapshots to appear current. The master guide describes target architecture; it should be revised when an approved target decision changes. It must not be updated to declare a target feature implemented before the implementation and tests prove it.

### 25.13 AI preflight checklist (complete before editing)

- [ ] I identified the user's exact scope boundary.
- [ ] I checked current branch/HEAD and existing changes.
- [ ] I read root AGENTS.md and the task-specific authoritative docs.
- [ ] I inspected current source/API/schema and tests rather than relying on descriptions alone.
- [ ] I separated target-only requirements from verified existing features.
- [ ] I mapped the source-of-truth record and downstream effects.
- [ ] I identified permission/security/data-integrity risks.
- [ ] I know the relevant negative/failure and regression tests.
- [ ] I will reuse current design-system components and architecture.
- [ ] I have not assumed a bank API capability or fabricated an external response.

If any item is false, investigate it or explicitly report the blocker before making a risky change.


---

## 26. Companion Engineering Specifications and Document Authority

This guide defines the product target and module requirements. Use specialist documents below for implementation mechanics and verification.

| Question | Companion document |
|---|---|
| Which requirements exist and which are verified? | docs/AMS-IMPLEMENTATION-TRACEABILITY.md |
| Which transitions and side effects are valid? | docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md |
| Which entity owns a field/relationship? | docs/AMS-DATA-MODEL-AND-DATA-DICTIONARY.md |
| How are UX, spacing, margins/padding and interaction applied? | docs/AMS-UX-INTERACTION-STANDARDS.md and AMS-DESIGN-SYSTEM.md |
| What should each module/workspace/worksheet display for each role, including columns, actions, and charts? | docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md |
| What are the concrete persona defaults and worksheet-level field/action priorities? | docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md |
| How are active, target, historical and staging documents classified? | docs/README.md |
| What are the concrete default columns, filters, action priorities, and visual choices by persona for each worksheet? | docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md |
| Which frontend route/state/API patterns apply? | docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md |
| Which backend/API/transaction controls apply? | docs/AMS-BACKEND-API-AND-DATA-INTEGRITY.md |
| How are E2E/regression results proven? | docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md |
| How is route/navigation ownership defined? | docs/architecture/ams-navigation-information-architecture.md |
| What is known/unknown about Kopra? | docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md |

Read root AGENTS.md first. GitHub Copilot's entry point is .github/copilot-instructions.md.

### 26.1 Runtime data-source verification

server/data-source.ts supports json and postgres and defaults to json if KAPITECH_DATA_SOURCE is unset. The production configuration in README requires postgres. Verify authorized runtime configuration and GET /api/system/production-readiness before data-source claims, migration, cutover or rollback. Older PostgreSQL notes may describe earlier rollout phases; do not rely on them without reconciliation against current code/configuration.

### 26.2 Change-control rule

For each implementation, update the traceability register, map the requirement to current source/API/schema/permissions, validate state transitions and failure paths, run relevant tests and report evidence. Target-only or externally blocked requirements remain labelled as such.
