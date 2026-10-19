# AMS Data Model and Data Dictionary

**Purpose:** Define logical domain ownership, key business fields, relationships and integrity rules.  
**Status:** Logical target model plus observed current-contract examples; not a physical migration script.  
**Critical rule:** Inspect current TypeScript types, APIs, server repositories, database migrations, JSON compatibility and runtime configuration before deciding what exists physically.

## 1. Runtime/persistence note

Current implementation source selection is defined in server/data-source.ts. The runtime default is not evidence of the deployed production configuration.

server/data-source.ts supports json/postgres and defaults to json when KAPITECH_DATA_SOURCE is unset. README specifies PostgreSQL as the required production configuration. Source code alone cannot prove the deployed mode. Verify authorized runtime configuration and readiness evidence before migration/production claims; never switch sources as part of a model-only task.

## 2. Data ownership principles

- Each entity has one canonical identity/write path.
- Other modules show linked views, not cloned master records.
- Derived values disclose their source/calculation.
- Preserve IDs, links, versions, audit history and source references during migrations.
- Use stable IDs and explicit relationships, not display names as join keys.
- Enforce invariants server-side and, where supported, in persistence.
- Keep secrets and private payloads out of business records/logs.
- A database table existing does not prove the app currently reads/writes it in production.

## 3. Logical relationship overview

Mermaid diagram relationship summary (logical target only):
- Account has Contacts, Leads, Opportunities, Projects and Retainer Periods.
- Existing legacy opportunity records may reference Quotations; Quotations have Versions and may produce multiple milestone Invoices. Preserve existing relationships without requiring a standalone CRM UI.
- Contracts own Change Orders and govern Projects.
- Projects contain Tasks and Deliverables and consume Time Entries.
- Client Requests relate to Inbox Threads.
- Vendor records own Vendor Bills; bills relate to Payment Requests.
- Invoices receive Payment Records.
- Payment Requests relate to Bank Transactions; Bank Transactions relate to Reconciliation Matches.
- Payment/Expense source records relate to Journal Source Links.
- Employees relate to Leave Requests, Training Records and Performance Reviews.
- Documents own Document Versions.

This describes target relationships only. Verify actual entity/table names, cardinality and join paths before implementation. Do not generate schema automatically from this overview.

## 4. Logical entities

### Account and contact
Account may include stable ID, legal/display name, type, status, owner, source, necessary registration/tax identifiers, primary contacts, timestamps and merge/archive history. Contact may include ID, account relationship, name, business email/phone, role/title, communication preference, source and status.

Lead conversion must link/update shared identity without creating duplicate company/contact records. Preserve historical contract/invoice snapshots where evidence requires. Merges retain prior references and audit. Collect only necessary personal data.

### Lead and opportunity
Lead: ID, source/provider reference, account/contact link, need/service interest, indicative budget if known, qualification, owner, next action, activity links, merge/conversion references and audit metadata.

Opportunity: ID, account/contact, service/project context, amount/currency, close date, stage, probability if used, owner, next action, quote/contract links, won/lost reason and stage history.

Do not conflate opportunity amount, weighted forecast, quote value, contract value, invoice issued, recognized revenue and cash received.

### Quotation and version
Target quote fields: stable quote ID, centralized document number, account/contact, opportunity/project links, template, version, status, issue/validity dates, currency, line items, discount/tax policy, subtotal/total, scope/exclusions/assumptions, timeline/milestones, terms, sent/acceptance metadata, rendered document reference and audit history.

Current source includes AgencyInvoice with optional type invoice/quotation, proposal APIs under /api/crm/proposals, and accepted-proposal immutability tests. Audit these existing interfaces/conversion paths before choosing a canonical persistence approach. Never merge/delete existing records by guess; preserve IDs and history.

### Contract, SOW and change order
Contract: ID, account, source quote/version, parties, type, dates/status, renewal terms, obligations, owner, secure file/version references and audit history.

SOW/change order: parent contract/project, version, scope delta, deliverables, schedule, price/billing impact, decision evidence and effective date. Active/signed terms are not overwritten in place.

### Project, task, deliverable and campaign item
Project: ID, account, source opportunity/quote/contract/handover, owner/team, scope/timeline baseline, milestones, task/deliverable links, budget reference, risks, files and closure history.

Task: ID, project, parent/dependency/task-list links where implemented, owner/assignees, status, priority, dates, estimates/actual effort if supported, checklist, completion evidence and audit.

Deliverable/campaign item: project/client/campaign relationship, channel/format, brief, asset versions, owner, due/publish dates, review/revision history, publication evidence/URL, metric definition and report source. Boards/lists/calendars are views over the same records.

### Inbox thread and client request
Inbox thread: source/channel, external message reference, timestamps, content/file reference, category, owner, status, follow-up, related records, delivery/inbound status and history.

Client request: account/client, category, source, priority, owner, due/SLA terms when configured, status, resolution evidence and project/contract link. Stable provider IDs prevent duplicate intake. Careers applicants are not sales leads by default.

### Vendor/freelancer
Canonical vendor belongs to Team & Resources. Logical fields: supplier ID, legal/display name, contacts, services/skills, contract/rate history with effective dates, verification, secure documents, active status, and restricted payment details.

Finance vendor bills, payments and ledger views must reference this master, not create a competing directory.

### Employee and People Operations
Employee: ID, work identity, role/department/manager, employment status/dates, skills, authorized document references and lifecycle history.

Leave: employee, leave type/policy, dates, state, decision and availability impact. Training: employee, objective/course, provider, dates, completion and certificate. Performance review: employee, period, reviewers, criteria/goals, confidential feedback, action plan, finalized version and audit.

Employment/compensation/performance access is restricted. Projects sees only capacity/availability required for planning.

### Time entry
Time entry: ID, user/employee, project/task/client/retainer links, date, duration, billable classification, category, notes, status and audit timestamps.

Prevent duplicate counting across time reports and retainer usage. Corrections after billing/closing remain auditable.

### Invoice and payment
Observed current AgencyInvoice fields in src/lib/financeStore.ts include ID, invoice number, optional type, client name/company/email/phone, optional project/lead IDs, line items, subtotal/discount/tax/total, amount paid/balance due, payment rows, currency IDR/USD, status, issue/due/paid/approved dates, notes/terms, audit trail and timestamps.

Current InvoiceStatus is draft, sent, partially_paid, paid, overdue, cancelled. This is observed source evidence, not permission to change the enum without checking server validation, persistence, consumers and tests.

Payment records include ID, amount, date, method, optional settlement account code, reference, recorder and notes.

Invoice creation/issue is not cash receipt. Preserve current payment normalization and balance semantics. Bank confirmation links to the canonical payment; it does not create another receipt/journal.

### Expense, bill and payment request
Observed AgencyExpense fields include ID, type/category, description, amount/date, recurrence, receipt reference, vendor/contract links, vendor payment metadata, payment status/payment rows, paid date/method/account code, metadata, recorder and creation timestamp.

A purchase request, bill and expense may have different lifecycles. Do not overload one current record type without auditing the business contract. Payment request logically links to its source, amount/currency, source account, beneficiary/reference, actors, validation results, external reference and status history. It is not proof of settlement.

### Journal, accounts and period close
Journal entry: source type/ID, entry date/period, lines, account, debit/credit, status, creator/reviewer/poster, source sync reference, correction/reversal link and audit history.

Chart of Accounts: code, name, type, normal balance, active status and report mapping. Adding an account must not change report formulas unless explicitly mapped.

Period close: period, state, checklist controls, reconciliation evidence, exceptions, authorized closer, timestamp and reopen history. Do not rewrite posted journals or closed periods silently.

### Bank account, bank transaction and reconciliation
Bank account configuration: internal ID, provider, masked account identifier, permitted currency, GL mapping and enabled state.

Bank transaction: provider reference where supplied, internal correlation ID, account, direction, amount/currency, dates and counterparty/reference fields if returned, normalized safe status and ingestion checkpoint.

Reconciliation match: bank transaction, canonical payment/receipt/fee source, match status/evidence, actor/time, override reason and audit. Provider payload fields remain undefined until the official spec exists.

### Documents and CMS
Document: stable ID, canonical storage reference, filename/media type/size, owner, access classification, retention category and versions. Never expose object-storage URLs/secrets.

CMS entry: stable ID, content type, slug, editable/localized/SEO fields if supported, publication state, revision and editor/publisher metadata. Career applicant is a distinct personal-data record linked to a job.

## 5. Integrity and uniqueness requirements

Audit safeguards for account/contact identities and merge aliases; external message IDs; quote numbers and versions; handover-to-project uniqueness; invoice numbers/payment references; duplicate vendor bills; journal source IDs; bank references/callbacks; time entry/retainer usage; CMS slugs; and audit-chain integrity.

These are logical requirements. Physical constraints require schema review, duplicate analysis and a safe migration plan.

## 6. Field-definition template

For each new field, record meaning, type/nullability/default, normalization/validation, canonical owner/write path, role visibility, source-vs-derived classification, formula/timezone/currency semantics, retention/audit/version rules, API/UI consumers, migration/backfill/recovery and tests.

## 7. Prohibited shortcuts

- No competing company/contact masters.
- No separate quote store across legacy APIs and Finance; Finance is the quotation UI owner and stable IDs/history must be preserved.
- No Finance vendor master duplicating Team & Resources.
- No duplicate cash/AR/AP/journal event for the same financial event.
- No independent page-local status calculators that contradict domain rules.
- No assumption that a table means its API/source is active in production.
- No physical schema migration directly from this logical dictionary without source audit.
