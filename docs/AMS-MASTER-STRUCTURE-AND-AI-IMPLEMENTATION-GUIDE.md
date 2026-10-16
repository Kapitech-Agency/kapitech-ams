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

1. **One sidebar with ten primary modules.** Do not create a new sidebar module merely because a feature has its own workflow.
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

The sidebar must display only the following ten primary modules. Worksheets and internal features must not appear as top-level sidebar modules.

1. Dashboard
2. Inbox
3. CRM & Sales
4. Projects
5. Clients
6. Finance
7. Team & Resources
8. Documents
9. Website CMS
10. Settings

Standalone Proposal, Approval, and legacy CRM modules must not remain as primary sidebar modules. **CRM & Sales must remain available** as the complete sales/business module. Quotations are workflows in CRM & Sales and Finance backed by one shared quotation record. Generic Approval is not a primary module; transaction-level authorization controls remain in place. Vendors, Time Tracking, People Operations, Content & Campaign Operations, and Kopra H2H are subareas, not additional top-level modules.

Visible navigation items must be accessible to the appropriate roles and lead to functional destinations. Do not show links that only open empty pages.

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
- Sales pipeline and forecast from CRM.
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

- Inbox Overview
- All Messages
- Sales Inquiries
- Client Requests
- Project & Support Requests
- Follow-ups
- Starred
- Resolved & Archived
- Routing & Response Templates

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

## 6. Module 03 — CRM & Sales

CRM & Sales manages the commercial process before and during closing. Clients manages active client relationships. Company/contact identity must be shared so lead conversion does not create duplicate company/contact records.

### 6.1 Navigation Structure

**A. Sales Overview**

**B. Leads & Prospecting**
- Lead Database
- Lead Sources
- Lead Capture
- Qualification & Scoring
- Lead Assignment
- Nurture & Re-engagement
- Duplicate Management

**C. Sales Pipeline**
- Pipeline Board
- Opportunity Register
- Opportunity Details
- Sales Forecast
- Stalled Deals
- Won & Lost Deals

**D. Accounts & Contacts**
- Companies & Contacts
- Relationship History
- Account 360°

**E. Sales Activities**
- Calls & Meetings
- Emails & Notes
- Sales Tasks
- Follow-up Queue

**F. Sales Desk**
- Discovery & Brief
- Service Fit
- Scope & Deliverables
- Estimation & Pricing
- Quotation Builder
- Negotiation History

**G. Contracts & Closing**
- Contract Register
- Service Agreements
- Statements of Work
- Change Orders
- Closing Checklist

**H. Project Handover**
- Ready for Handover
- Handover Checklist
- Commercial Summary
- Handover History

**I. Sales Reports**
- Lead Conversion
- Pipeline Performance
- Win / Loss Analysis
- Revenue Forecast
- Salesperson Performance

### 6.2 Lead Database and Qualification

A lead contains source data, contact, needs, desired services, indicative budget when known, decision role, expected timing, source, owner, qualification state, activity history, and related opportunity. Keep unknown fields unknown; do not invent commercial data.

Scoring may use clear, reviewable, explainable rules. A score must not be the sole rejection criterion. Duplicate management must support reviewing, merging, or linking records while preserving history.

### 6.3 Opportunity Pipeline and Lifecycle

Recommended pipeline:

New → Qualification → Discovery → Scoping → Quotation → Negotiation → Contract → Closed Won / Closed Lost.

Every stage transition has exit criteria, required fields, next actions, and audit history. A stage is not merely a visual label.

- **New:** source and owner are recorded.
- **Qualification:** initial need and service fit are assessed.
- **Discovery:** meetings/briefs and decision-makers are recorded.
- **Scoping:** deliverables, exclusions, assumptions, dependencies, timeline, and estimates are defined.
- **Quotation:** a quotation is created from the shared record using a template and prepared for review.
- **Negotiation:** price/scope/terms changes and communications are recorded in history/version records.
- **Contract:** the service agreement/SOW and closing checklist are completed.
- **Closed Won:** the commercial requirements for handover are validated.
- **Closed Lost:** a lost reason is required; activity history is retained.

Pipeline value and forecast must distinguish deal amount, probability-weighted forecast, quotation value, contracted value, invoiced revenue, and cash received.

### 6.4 Sales Desk and Quotations

The CRM Quotation Builder uses the same authoritative quotation records as Finance. Do not create a duplicate quotation store.

Required inputs include account/contact, opportunity, scope/deliverables, quantity, price, discounts/tax as configured in Finance, assumptions/exclusions, timeline, payment terms, validity, notes, and version history.

Sales must not bypass Finance controls to change tax, document numbering, terms, or authorized pricing. A sent quotation must be revised as a new version with history rather than silently overwriting the sent version.

### 6.5 Contracts & Closing

- Contract Register and Active/Expired/Expiring views.
- Service agreements and Statements of Work.
- Change orders/change requests with scope, timeline, value, billing, and policy-required approval impacts.
- Closing checklist.
- Contract dates, parties, references, status, version, secure document link, renewal terms, and obligations.
- Legal documents are stored in Documents; CRM stores references and business metadata.

### 6.6 Project Handover

The handover must include:

- Accepted quotation/contract/SOW and the approved version.
- Scope and exclusions.
- Deliverables, milestones, dependencies, target timeline.
- Client PIC, internal PIC, stakeholders, and communication preferences.
- Budget/contract value and billing milestones.
- Risk, assumption, open issues, special commitments.
- Required files and meeting/brief summary.
- Handover readiness checklist, owner, timestamp, and history.

A project must be created or activated only once from a qualifying handover. Retries must not create duplicate projects.

### 6.7 Sales reports

- Lead conversion with consistent numerator/denominator definitions.
- Pipeline aging and stalled opportunities.
- Win/loss analysis by source/service/owner based on valid data.
- Forecast with relevant probabilities and dates.
- Sales performance should account for quality and outcomes, not only nominal value.

---

## 7. Module 04 — Projects

Projects is the primary source for delivery management. CRM starts the deal and transfers commercial context; Finance is the authoritative source for financial values. Projects must not create journals or reconstruct Finance values independently.

### 7.1 Navigation Structure

**A. Projects Overview**

**B. Project Registry**
- Planning
- Active Projects
- On Hold
- Completed
- Archived

**C. Planning & Scope**
- Project Brief
- Scope & Deliverables
- Milestones
- Timeline

**D. Tasks & Execution**
- Board / Kanban
- List
- My Tasks
- Task Lists
- Dependencies

**E. Project Resources**
- Project Team
- Assignments
- Workload

**F. Deliverables & Quality**
- Deliverable Tracking
- Internal Quality Review
- Client Review
- Revision History

**G. Content & Campaign Operations**
- Content Calendar
- Content Planning & Briefs
- Content Production Pipeline
- Creative Assets & Versions
- Internal Review & Approval
- Client Review & Feedback
- Revision Tracking
- Publishing Schedule
- Publication Status & Links
- Campaign Tracking
- Campaign Performance Reports

**H. Changes, Risks & Issues**
- Change Requests
- Risks
- Issues
- Blockers

**I. Budget & Project Health**
- Budget Summary
- Planned vs Actual
- Delivery Health

**J. Project Files**

**K. Project Reports & Closure**

### 7.2 Lifecycle project

1. CRM marks the project as ready for handover.
2. Handover requirements are checked and the project record is prepared/created.
3. The project template, brief, scope, deliverables, milestones, timeline, owner, team, and project folder are set.
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

### 7.4 Content & Campaign Operations

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

## 8. Module 05 — Clients

Clients manages active accounts and the client relationship lifecycle after a lead becomes an account. Company/contact identity is shared with CRM. Do not create duplicate companies, contacts, contracts, or projects during conversion.

### 8.1 Structure

**A. Client Overview**

**B. Client Directory**
- Companies
- Contacts
- Client 360°

**C. Onboarding**
- Onboarding Checklist
- Required Documents
- Kickoff Readiness

**D. Contracts & Agreements**
- Contract Register
- Active Contracts
- Expiring Contracts
- Contract History

**E. Retainers**
- Retainer Register
- Included Hours
- Used & Remaining Hours
- Renewal Schedule

**F. SLA & Service Operations**
- SLA Monitoring
- Client Requests
- Service Issues
- SLA History

**G. Client Growth & Health**
- Client Health
- Renewal Opportunities
- Upsell & Cross-sell
- Feedback & Reviews

### 8.2 Client 360°

A single client-relationship page summarizing, subject to access permissions:

- Company/contact identity and relationships.
- CRM opportunities and sales history.
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

## 9. Module 06 — Finance

Finance has established worksheets, reports, and transactions. Navigation may be reorganized, but accounting and calculation rules must not change as a side effect of changing labels.

### 9.1 Finance Navigation Structure

**A. Overview & Control**
- Executive Summary
- Dashboard

**B. Revenue & Receivables**
- Quotations
- Revenue & Invoices
- Accounts Receivable
- Document Templates

**C. Expenses & Payables**
- Expense Register
- Purchase & Expense Requests
- Budget Availability Check
- Purchase Orders (when the purchasing process requires them)
- Vendor Bills
- Accounts Payable
- Vendor Ledger & Payments
- Recurring Expenses & Subscriptions
- Expense Categories & Supporting Documents

**D. Cash Management**
- Cash & Bank
- Bank Accounts
- Bank Transactions & Reconciliation
- Bank Mandiri Kopra H2H
- Petty Cash

**E. Project Finance**
- Project Finance
- Operational Budget
- Project Allocation
- Team Fee

**F. Accounting & Reports**
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
| Cash & Bank | Cash Management | Recorded bank/cash accounts, balances, and movements |
| Revenue | Revenue & Receivables | Existing revenue records and invoice workflow |
| Expenses | Expenses & Payables | Existing expense recording workflow |
| Petty Cash | Cash Management | Petty cash management |
| Accounts Receivable | Revenue & Receivables | Invoice balances, aging, and receivable payments |
| Accounts Payable | Expenses & Payables | Liabilities and payment status |
| Vendors | Expenses & Payables, reference to master | References supplier/payee records managed in Team & Resources |
| Project Finance | Project Finance | Project-linked financial information |
| Operational Budget | Project Finance | Budget operasional |
| Project Allocation | Project Finance | Existing financial/resource allocation |
| Team Fee | Project Finance | Existing team-fee calculation |
| Journal | Accounting & Reports | Journal and posting controls |
| Chart of Accounts | Accounting & Reports | Account list and mapping |
| Monthly P&L | Accounting & Reports | Laba rugi periode |
| Cash Flow | Accounting & Reports | Pergerakan kas |
| Balance Sheet | Accounting & Reports | Posisi keuangan |
| Monthly Closing | Accounting & Reports | Kontrol penutupan periode |
| Annual Summary | Accounting & Reports | Annual financial summary |

**New worksheet views needed:**

- Quotations: quotation register and quotation builder.
- Document Templates: centrally maintained reusable quotation/invoice templates.
- Bank Accounts, Bank Transactions & Reconciliation, and Bank Mandiri Kopra H2H may be dedicated workspace views/subtabs under Cash Management; whether each is a worksheet ID or nested subview must follow current Finance workspace architecture, without creating duplicate business stores.
- Purchase & Expense Requests may be a view over a dedicated workflow only if schema and backend support it; do not use a frontend-only status list for real money transactions.

The old Vendors worksheet must not become a second vendor master. It should refer to the canonical vendor record managed in Team & Resources and show finance ledger/payment views. Preserve the existing vendor-payment and expense links, including migration 049 relationships if still current.

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

Quotation is available from CRM Sales Desk and Finance, but both must operate on one authoritative record.

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

### 9.7 Cash Management and bank reconciliation

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

Finance → Cash Management → Bank Mandiri Kopra H2H.

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

### 10.3 Finance → Cash Management → Bank Mandiri Kopra H2H

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

## 11. Module 07 — Team & Resources

### 11.1 Structure

**A. Team & Capacity**
- Team Directory
- Roles & Departments
- Capacity Allocation
- Availability & Workload

**B. People Operations**
- Employee Directory & Profiles
- Employee Onboarding
- Employee Offboarding
- Employment Contracts & Status
- Leave Management
- Availability & Absence Calendar
- Training & Development
- Performance Reviews
- Performance History
- People Operations Reports

**C. Vendors & Freelancers**
- Directory
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

**Employee Directory & Profiles**
- Employee identity, work contact, job title, department, manager, start date, employment status, skills, secure links to documents, and authorized history.
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

## 12. Module 08 — Documents

### 12.1 Structure

- Document Overview
- All Documents
- Project & Client Files
- SOPs & Policies
- Legal & Corporate
- Finance & Tax
- HR & People
- Security & Infrastructure

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

## 13. Module 09 — Website CMS

### 13.1 Structure

- CMS Overview
- Case Studies
- Services
- Insights
- Testimonials
- Careers
  - Jobs
  - Applicants
  - Recruitment History

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

## 14. Module 10 — Settings

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
- Bank Integrations
  - Bank Mandiri Kopra H2H
  - Connection & Service Status
  - Account Mapping
  - Integration Environment
  - Credentials & Certificate Management
  - Connection Testing
  - Synchronization & Status Checks
  - Error Logs & Diagnostics
  - Integration Audit Trail

**E. Preferences**

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
| Inbox categorized as sales | CRM lead or opportunity candidate | Keep Inbox thread; link, don't copy conversation into a new unrelated record |
| Opportunity moves to Closed Won | Validate handover; prepare client onboarding and project | Idempotent conversion; required scope/terms |
| Quotation accepted | Update shared quote state; prepare contract/billing plan | Must not auto-create duplicate quote/invoice or cash event |
| Contract/milestone billing becomes due | Finance prepares invoice per valid schedule | No premature issue/posting; valid source terms |
| Invoice is close to/past due | AR reminder/follow-up task | Respect payment status, communication configuration and role |
| Expense request authorised | Make eligible payment request available to bank flow | Budget, beneficiary, permission and duplicate checks |
| Bank transfer confirmed | Update bank transaction/payment state, source-linked accounting flow | Do not duplicate payment/journal |
| Bank mutation ingested | Propose a reconciliation match | Ambiguous match to human exception queue |
| Approved leave changes | Recompute availability and warn on project/resource conflict | Do not silently reassign or reschedule commitments |
| Time entry validated | Update workload/retainer usage/project effort | One authoritative time record; no double counting |
| Client contract/retainer near renewal | Create/link CRM renewal opportunity or follow-up | Avoid duplicate renewal opportunities |
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
| Company/account and contacts | Shared identity used by CRM & Sales and Clients | Inbox, Projects, Finance, Documents |
| Lead and opportunity | CRM & Sales | Dashboard, Inbox, Project Handover, Finance references |
| Quote/quotation and quote versions | One shared quotation record; Sales authoring and Finance control | CRM, Finance, Documents, project handover |
| Contract/SOW/change order | Canonical contract record with secure Documents references | CRM, Clients, Projects, Finance |
| Client onboarding/retainer/SLA | Clients | Projects, Team & Resources, CRM, Finance |
| Project/task/deliverable/campaign item | Projects | Clients, Documents, Dashboard, Finance summaries |
| Employee, leave, training, performance | Team & Resources → People Operations | Projects/capacity, authorized reports and Settings |
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

### 17.1 Sales-to-delivery

Inquiry → Inbox classification/owner → CRM lead → qualification/discovery → scope/estimation → quotation versioning → negotiation → contract/SOW → Closed Won readiness → client onboarding → project handover → project setup → delivery and review → closure → client renewal/expansion.

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

## 20. Implementation sequencing and rollout plan

The complete structure is broad. Implement it in verified vertical slices. Do not attempt to launch all new features and bank transfer production simultaneously.

### Phase 0 — Repository and requirements audit

- Inspect current routes, side navigation, subnavigation, pages, API, data stores, database schema/migrations, RBAC, Finance workbook definitions, reports, fixtures, integrations and tests.
- Map every desired nav item to an existing or missing functional capability.
- Identify duplicate APIs/entities, unused/legacy routes, demo-only feature paths and broken links.
- Record baseline build/lint/tests and important Finance totals before changes.
- Read design-system and interaction guidelines.
- Deliver a gap matrix and safe migration plan before major edits.

**Exit gate:** A reviewer can see exactly which items already exist, partially exist, need new implementation, or depend on external integration.

### Phase 1 — Navigation and shared shell

- Align the ten primary nav entries, access rules, nested module routes, page titles and active states.
- Preserve route compatibility as needed; do not break bookmarked/deep-linked routes without redirects/migration plan.
- Normalize header/page padding/tab structure/drawers using existing design system.
- Remove obsolete module-level entry points only after verifying replacement paths and record dependencies.
- Keep actions working and expose no active dead routes.

**Exit gate:** Every visible primary/subnav item has a real destination, correct access, consistent visual hierarchy, and no unintended duplicates.

### Phase 2 — Core CRM/client/project handover

- Complete CRM lifecycle and stage criteria.
- Canonical account/contact relationship and lead-to-client conversion.
- Shared quotation reference.
- Handover checklist and project creation guards.
- Project delivery and Content & Campaign Operations.
- Client 360, onboarding, retainer/SLA relation.
- Build tests for duplicate prevention and lifecycle transitions.

**Exit gate:** A test lead can progress through a validated sales-to-project lifecycle with preserved references and no duplicate account/project/quote.

### Phase 3 — Finance document and workflow completeness

- Map all existing Finance worksheets into the target groups.
- Preserve existing Finance values/formulas and historical report output.
- Add authoritative Quotation builder and reusable Document Templates workflow.
- Complete invoice templates and numbering controls based on existing finance model.
- Complete purchasing/expense-control workflow with canonical vendors.
- Link source events, payment records, bank ledger and journal without duplicate postings.
- Implement/review roles and transaction-specific maker-checker rules.
- Regression test invoice/quote/AP/AR/reports/month close with baseline data.

**Exit gate:** Quote, contract and billing paths function, and Finance reconciliation proves existing financial calculations are preserved.

### Phase 4 — People Operations and resources

- Add profiles/contracts/onboarding/offboarding/leave/availability/training/performance history as schema and RBAC allow.
- Connect availability to capacity/project warnings.
- Connect validated time logs to workload/retainer/project effort.
- Ensure employee personal/performance fields are restricted.
- Add retention and audit behavior.

**Exit gate:** Approved leave changes workload projections correctly; users cannot access restricted HR records through routes or APIs.

### Phase 5 — Finance bank reconciliation foundations

- Establish canonical bank account mapping and ledger reconciliation model.
- Implement import/manual reconciliation capabilities where useful before live H2H.
- Define unique bank references, match rules, exceptions and accounting integration.
- Test missing statement row, duplicate row, fee, partial/ambiguous match, reversal/return, and period close.
- Keep bank connector behind feature/configuration flags until integration is approved.

**Exit gate:** Bank activity can be matched to source records without duplicate cash/payment/journal entries.

### Phase 6 — Kopra H2H integration

- Obtain current official bank specification and approved access.
- Build server-side connector behind an isolated provider boundary.
- Separate non-destructive inquiry services from payment-submit capabilities.
- Implement test/sandbox before production.
- Implement transaction status polling/callbacks exactly according to bank spec.
- Implement timeout/unknown-state handling and idempotency.
- Test beneficiary, balance, history/status, transfer, bill payment and payroll only where enabled.
- Run bank/UAT certification, security review, reconciliation review, operational runbook, alerting and rollback preparation.
- Activate production transaction submission only after explicit operational sign-off.

**Exit gate:** End-to-end test evidence exists per enabled feature and no transfer can be re-submitted blindly or posted twice.

### Phase 7 — Dashboard, monitoring, and hardening

- Ensure metrics use authoritative data.
- Check loading/empty/error/stale statuses in all modules.
- Add audit/report coverage and cross-module drill-down.
- Run E2E, regression, permission, duplicate/idempotency, responsive, and production smoke tests.
- Verify database migration status and backup restore readiness.
- Verify production deploy source/main status per the repository's current process.

**Exit gate:** Measurable acceptance criteria below all pass or accepted exceptions are explicitly documented.

---

## 21. Minimum quality and acceptance checklist

### Navigation and UX
- [ ] Ten main modules only.
- [ ] Every submenu is functional, access-controlled, and has an explicit purpose.
- [ ] No duplicate modules for Quotations, Approvals, Vendors, Time Tracking, People Operations, or Kopra.
- [ ] Tabs/subtabs preserve header and content geometry.
- [ ] No stale UI remnants, dead buttons, fake records or placeholder routes.
- [ ] Forms/drawers have validation, cancel behavior, error handling and success state.
- [ ] Empty/loading/error/stale states are present and understandable.
- [ ] Visual implementation follows current AMS guidelines.

### Data and workflows
- [ ] Company/contact identity is shared between CRM and Clients.
- [ ] Quotation records and versions are shared between CRM and Finance.
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

AMS is considered structurally complete only when its ten modules form one coherent operational ecosystem:

- Inbox captures and routes communications.
- CRM converts qualified demand into commercial commitments.
- Clients maintains the canonical account relationship and ongoing service lifecycle.
- Projects delivers contracted scope, tasks, content, campaigns and outcomes.
- Finance controls documents, bills, receivables/payables, cash, bank integration, reconciliation, journals and reports.
- Team & Resources manages the people/vendor/time/capacity records that drive delivery.
- Documents securely retains canonical files and version history.
- Website CMS publishes authorized website content and manages recruitment records.
- Settings controls users, permission, integration configuration and security.
- Dashboard exposes useful, accurate, permission-aware views of all those sources.

The defining test is not whether every menu exists. It is whether the business processes move between the modules with correct source records, explicit status transitions, secure permissions, visible exceptions, traceable decisions, consistent accounting, no duplicate transactions, and no manual re-entry of the same data.


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

The target has exactly ten top-level navigation modules: Dashboard, Inbox, CRM & Sales, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings.

This taxonomy is not permission to delete underlying capabilities:
- Removing a standalone Proposals menu must preserve quotation records, sent/accepted/rejected/expired states, quote versions, and quote-to-invoice conversion. Make quotation reachable through CRM & Sales and Finance.
- Removing the general Approval menu must preserve workflow-specific maker-checker permissions, finance posting controls, period closing controls, request history, audit trail, and any valid API consumers. Map each approval process to the owning business workflow.
- Removing a legacy CRM menu must not remove CRM & Sales.
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
