# AMS Navigation Information Architecture

**Status:** Target-state specification aligned with the AMS Master Structure and AI Implementation Guide.  
**Scope:** Primary navigation, module ownership, local navigation, URL state, deep links, and role-aware visibility.  
**Implementation status:** This defines the target; it is not proof that every target item has shipped. Inspect current route/navigation source before making implementation claims.

## 1. Global rules

The target product has exactly ten primary modules: Dashboard, Inbox, CRM & Sales, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, and Settings.

1. **Sidebar = primary destinations.** Do not duplicate worksheets, filters, detail views, or CRUD actions as primary modules.
2. **Module tabs = related local views.** A tab belongs only to the workspace it changes.
3. **In-page controls = local state.** Search, filters, sorting, pagination, pipeline stages, Kanban/list modes, editor Details/Preview, and queues remain within their owning workspace.
4. **One canonical owner.** Cross-module views reference canonical records; they do not clone master records or create parallel ledgers.
5. **One unambiguous route state.** Pathname, query parameters and relevant hash fragments must resolve to one active destination. Reload and browser back/forward must preserve URL-driven views.
6. **Role-aware visibility is not authorization.** Reuse current route access policy for display and enforce access server-side on every protected API.
7. **Deep links must open a real usable state.** Do not link to a conditional element inside a closed drawer or an unavailable page.
8. **No dead navigation or simulated completion.** Record unimplemented target features in the traceability register.
9. **Preserve legacy compatibility.** Assess bookmarks, consumers, tests, permissions and stored references before redirecting or removing paths.
10. **Preserve the current AMS design.** Use the shared page shell and design system. This document does not authorize a redesign.

## 2. Target structure by module

### 2.1 Dashboard
- Overview
- Performance
- Analytics

Dashboard tabs apply only to Dashboard. Personal task workspaces or activity routes must not inherit unrelated Dashboard tabs. Metrics and drill-downs use authoritative source data.

### 2.2 Inbox
- Inbox Overview
- All Messages
- Sales Inquiries
- Client Requests
- Project & Support Requests
- Follow-ups
- Starred
- Resolved & Archived
- Routing & Response Templates

These are views over inbox-related records. Job applications belong in Website CMS → Careers → Applicants, not the sales inbox. Website inquiries may enter Inbox.

### 2.3 CRM & Sales
- Sales Overview
- Leads & Prospecting
- Sales Pipeline
- Accounts & Contacts
- Sales Activities
- Sales Desk
- Contracts & Closing
- Project Handover
- Sales Reports

Quotations are workflows in CRM & Sales and Finance backed by one authoritative quotation lifecycle. Do not add a primary Proposals/Quotations module or a second quotation store.

### 2.4 Projects
- Projects Overview
- Project Registry
- Planning & Scope
- Tasks & Execution
- Project Resources
- Deliverables & Quality
- Content & Campaign Operations
- Changes, Risks & Issues
- Budget & Project Health
- Project Files
- Project Reports & Closure

Board/list/timeline are local presentation modes. Content calendar, production stages, reviews, revisions, publishing schedule and campaign reporting belong inside Content & Campaign Operations.

### 2.5 Clients
- Client Overview
- Client Directory
- Onboarding
- Contracts & Agreements
- Retainers
- SLA & Service Operations
- Client Growth & Health

Company/contact identity is shared with CRM & Sales. Client 360 aggregates linked project, contract, Inbox and Finance records rather than creating copies.

### 2.6 Finance
- Overview & Control
- Revenue & Receivables
- Expenses & Payables
- Cash Management
- Project Finance
- Accounting & Reports

Preserve all twenty current source-code worksheet destinations under Finance. Quotation/template workflows and future Kopra operations belong inside Finance. Navigation regrouping must not change accounting logic.

### 2.7 Team & Resources
- Team & Capacity
- People Operations
- Vendors & Freelancers
- Time Tracking

Leave, availability, employment contracts, onboarding/offboarding, training, performance history, vendor master data and time records live here. Finance references the same vendor master and eligible time records.

### 2.8 Documents
- Document Overview
- All Documents
- Project & Client Files
- SOPs & Policies
- Legal & Corporate
- Finance & Tax
- HR & People
- Security & Infrastructure

Contextual file views link to canonical files and versions.

### 2.9 Website CMS
- CMS Overview
- Case Studies
- Services
- Insights
- Testimonials
- Careers: Jobs, Applicants, Recruitment History

Editor-level Details/Preview controls stay inside the editor. Do not duplicate CMS destinations as a second clickable tab bar.

### 2.10 Settings
- System Overview
- Users & Access
- Audit Log
- Integrations
- Preferences

Technical Kopra connection configuration belongs under Settings → Integrations. Daily bank balance, transaction, payment queue and reconciliation views belong to Finance.

## 3. Navigation ownership matrix

| Module | Owns | Must not become a separate primary module |
|---|---|---|
| Dashboard | Business and operational summaries | Standalone KPI/report cards |
| Inbox | Communications and intake queues | Job Applications |
| CRM & Sales | Leads, opportunities, quotations, sales contracts, handover | Proposals, generic Approval |
| Projects | Delivery, tasks, deliverables, content and campaigns | Tasks/Content Calendar/Campaigns as primary modules |
| Clients | Active client identity, onboarding, retainers, SLA, relationship health | Competing company/contact master |
| Finance | Invoices, quotations/templates, expenses, payables, cash/bank, journals/reports, Kopra | Vendor master, generic Approval, separate bank ledger |
| Team & Resources | People, capacity, vendor master, time records | Standalone Time Tracking/Vendors |
| Documents | Canonical files and versions | Copied file stores per module |
| Website CMS | Public content and recruitment records | Careers Applicants as primary module |
| Settings | Access, security, audit and integration configuration | Daily financial transactions |

## 4. URL and interaction contract

- Reuse the current page shell, module header, and section-tab primitives.
- Do not add nested page padding or a second header below a subtab.
- Query parameters are authoritative for query-driven views.
- Normalize path/query state so one URL cannot produce contradictory active destinations.
- Reload, browser back and forward preserve the intended view.
- Role-specific aliases such as My Hub or Assigned Tasks obey current access helpers and server-side checks.
- Do not expose active placeholders. Record unimplemented target routes in traceability.
- Do not duplicate a primary destination as a local tab unless a useful contextual action is documented.

## 5. Finance navigation rules

- Use the six Finance groups in the master guide.
- Preserve every current worksheet key from src/lib/financeWorkbook.ts; verify the source before editing.
- New quote/template and bank views follow the existing workspace architecture. A submenu does not automatically require a new table, API or store.
- Reuse current invoice, expense, vendor, journal and reporting sources.
- Keep reporting-period state visible and consistent; avoid redundant filter cards.
- Do not remove old destinations until the owning module workflow, permission and compatibility path are verified.

## 6. Legacy destination policy

Removing a standalone Proposals, Approval, Vendors or Time menu is not permission to delete its underlying capability.

For each legacy route:
1. Identify consumers, deep links, API callers, permission checks, tests and stored references.
2. Map it to a target owner/subview.
3. Decide preserve, redirect or deprecate from evidence.
4. Preserve data, audit history, quote-to-invoice conversion, maker-checker and period-close controls.
5. Add route/access regression tests.
6. Remove obsolete visible navigation only after the replacement works.

## 7. Acceptance criteria

- [ ] Exactly ten primary modules are specified.
- [ ] No standalone Proposals, generic Approval, Vendors or Time Tracking primary module is added.
- [ ] Every submenu maps to an owner, route/view, permission and traceability requirement.
- [ ] Every visible link opens a real permitted state.
- [ ] Query-driven views survive reload and browser navigation.
- [ ] Direct unauthorized routes/API calls remain blocked.
- [ ] Finance worksheet data and behavior are preserved.
- [ ] Navigation tests, full tests, lint and build are run and reported.

## 8. Related specifications
- ../AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md
- ../AMS-IMPLEMENTATION-TRACEABILITY.md
- ../AMS-UX-INTERACTION-STANDARDS.md
- ../../AMS-DESIGN-SYSTEM.md
