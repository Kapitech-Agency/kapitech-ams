# AMS Navigation and Information Architecture

**Status:** Approved navigation target, updated 16 October 2026.
**Authority:** Latest product decision, current route/access implementation, AMS master guide, and implementation traceability register.

## 1. Global rules

- The product has exactly nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, and Settings.
- Primary entries represent modules, not worksheets, views, or legacy routes.
- CRM, Proposal/Quotation, and generic Approval are not primary modules. Do not build a replacement sales pipeline, separate proposal workspace, or new approval engine.
- Removing a menu does not authorize deleting records, API contracts, IDs, history, business controls, or active consumers.
- Each feature has one owning module and canonical write path. Other modules may show contextual/read-only linked records.
- Navigation visibility is not authorization. Existing route guards and server permissions remain authoritative.
- This is consolidation, not redesign. Preserve existing AMS design tokens, component patterns, shared shell, and Finance business rules.
- Documentation is not implementation evidence. Verify source and execute tests.

## 2. Approved primary modules

| Order | Module | Canonical entry | Feature ownership |
|---|---|---|---|
| 1 | Dashboard | `/admin/dashboard` | Role-permitted source-backed summaries and drill-downs |
| 2 | Inbox | `/admin/inbox` | Notifications, inbound inquiries, actionable activity and follow-up supported by current code |
| 3 | Projects | `/admin/projects` | Project delivery, tasks/Kanban, milestones, project status and project work views |
| 4 | Clients | `/admin/clients/all-clients` | Client directory, onboarding, contracts, retainers, SLA and relationship health where implemented |
| 5 | Finance | `/admin/finance` | Transactions, cash, receivables/payables, project finance, accounting and reports |
| 6 | Team & Resources | `/admin/team` for roles allowed by policy | Team/capacity; vendor/freelancer and time subareas according to current permissions |
| 7 | Documents | `/admin/documents` | Canonical documents, files, versions and authorized attachments |
| 8 | Website CMS | `/admin/cms/projects` for Admin; `/admin/cms/insights` for eligible editors | Public content and supported Careers workflows |
| 9 | Settings | `/admin/settings?tab=overview` | Authorized account/application configuration, access, audit and integrations |

Settings may remain pinned in the existing system area. It remains the ninth primary module. Role visibility continues to follow the actual route policy.

## 3. Module subnavigation

### 3.1 Dashboard
Local views are Overview, Performance and Analytics. Values are summaries of their source modules. Do not imply an unimplemented activity/analytics route is functional.

### 3.2 Inbox

Inbox has exactly four direct workspace entries:

1. **Overview** — source-backed summary of messages requiring attention, follow-ups, and recent activity.
2. **Messages** — one canonical message/thread workspace with worksheets for All Messages, Sales Inquiries, Client Requests, and Project & Support. Unread, Starred, Resolved, and Archived are filters or saved views within Messages, not separate sidebar entries.
3. **Follow-ups** — views for Due Today, Upcoming, Overdue, and Completed over the existing follow-up records. Do not create a duplicate task system.
4. **Routing & Templates** — internal sections or tabs for Routing Rules and Response Templates. Do not expose each as a separate direct submenu.

Use the same canonical message/thread records across categories, filters and saved views. Resolved and Archived remain distinct statuses even though they are accessed from the same workspace. Other supported filters, such as priority, owner/PIC, channel and date range, belong inside Messages and must not increase sidebar complexity.

Notification targets route to the owning record/module using existing authorization. Careers applicants are managed only in Website CMS → Careers → Applicants. Inbox may provide a contextual shortcut, but it must not expose a competing applicant status, notes or delete workflow. Inbox is not an approval register.

### 3.3 Projects
Project views include the existing registry/overview, delivery, budget and archived views. Tasks/Kanban/list are views over the same records. Financial values remain sourced from Finance. Client retainers/SLA belong to Clients, vendor master/time records to Team & Resources, and canonical files to Documents.

### 3.4 Clients
Directory, onboarding, contracts, retainers and SLA monitoring remain contextual views under Clients where supported and role-permitted. Client/account/contact data stay canonical; Project, Finance, Inbox and Documents references are linked views.

### 3.5 Finance
Finance keeps five top-level areas:

1. **Overview & Control**: Executive Summary and Dashboard.
2. **Transactions & Cash**: Cash & Bank, Revenue, Expenses and Petty Cash.
3. **Receivables & Payables**: Accounts Receivable, Accounts Payable and vendor-linked financial references.
4. **Project Finance**: Project Finance, Operational Budget, Project Allocation and Team Fee.
5. **Accounting & Reports**: Journal, Chart of Accounts, Monthly P&L, Cash Flow, Balance Sheet, Monthly Closing and Annual Summary.

Preserve all twenty current worksheet keys and their API/source behavior. The existing quotation UI is reachable at `/admin/finance/quotations` from Finance's Receivables & Payables area. Legacy `/admin/proposals` redirects there. Reuse existing components, APIs, IDs, status history and quote-to-invoice logic. Do not add a Proposal module or duplicate store.

Navigation consolidation must not change financial formulas, account codes, journal rules, posting, allocations, receivables, payables, reconciliation, closing or workbook mappings.

### 3.6 Team & Resources
Team/capacity, vendor/freelancer and time-record features remain subareas, not primary modules. Vendor data stays canonical here and Finance references the same records. Preserve role restrictions. Vendor billing access does not grant team-directory or time-entry access.

### 3.7 Documents
Documents owns canonical file metadata and versions. Contextual attachment views link to those records. Do not create competing repositories or expose private storage URLs/secrets.

### 3.8 Website CMS
Preserve existing editor routes for Portfolio/Case Studies, Services, Insights, Testimonials and Careers. Careers owns supported job-opening and applicant workflows. Do not create a second CMS or show placeholders as functional.

### 3.9 Settings
Settings owns authorized access, configuration, audit and integration screens. Direct route access remains guarded. The release-readiness placeholder is not a navigable feature until verified.

## 4. Legacy route compatibility

| Legacy route | Navigation behavior | Data/security behavior |
|---|---|---|
| `/crm`, `/admin/crm` | Redirect to Clients directory; no standalone CRM UI | Preserve CRM/deal records, IDs, APIs, history and consumers. Do not rebuild a sales pipeline. |
| `/admin/clients/lead-accounts` | Redirect to Clients directory | Keep route access guarded. |
| `/admin/inbox?view=jobs` | Redirect to `/admin/cms/careers?tab=applicants` | Preserve old links while keeping one Careers applicant management workspace. Finance/PM access is limited to the applicant tab. |
| `/admin/proposals` | Redirect to `/admin/finance/quotations`, preserving query/hash | Reuse existing quotation API/component and conversion behavior. |
| `/admin/approvals` | No primary/local link or command-palette shortcut. Keep protected direct route as `DEPRECATED_PENDING`. | Preserve approval records, API, audit and maker-checker. Full retirement waits for owner/consumer validation. |
| `/admin/invoicing` | Keep existing Finance compatibility redirect | Preserve current query-based destination mapping. |
| `/admin/vendors`, `/admin/time-logs` | Keep protected feature routes within Team & Resources context | Preserve records, permissions and consumers. |

Do not redirect distinct source-record links indiscriminately. Preserve valid IDs/query/hash. Do not delete backend routes or data just to clean menus.

## 5. Active state, deep links and shared layout

- Active/expanded state follows route and query, including role-specific variants.
- Reload, browser back/forward and direct URL entry preserve the permitted destination.
- Contextual tabs do not duplicate destinations already visible globally.
- Redirects must not loop or discard valid context.
- Shared shell owns padding, headers and tab layout. Avoid duplicate headers, nested padding, arbitrary offsets and unapproved motion.
- Existing authentication, route guards and server permissions remain authoritative.

## 6. Acceptance criteria

- [ ] Admin has eight workspace links plus pinned Settings: nine primary modules total.
- [ ] No standalone CRM, Proposal, Approval, Vendors or Time Tracking primary item exists.
- [ ] Role-specific items match the existing route permission policy.
- [ ] Clients, Team & Resources, Finance, Documents and CMS contain links to supported, owned features.
- [ ] Quotations are accessible inside Finance with the current records/API.
- [ ] CRM and Proposal legacy routes redirect intentionally. Approval remains protected but unlinked pending dependency review.
- [ ] No duplicate global/contextual destinations or stale active states.
- [ ] Direct unauthorized routes and server-side permissions remain protected.
- [ ] Finance worksheets and existing records are preserved.
- [ ] Build, type, regression and supported E2E checks are executed and reported honestly.

## 7. Related specifications

- `../AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`
- `../AMS-IMPLEMENTATION-TRACEABILITY.md`
- `../AMS-UX-INTERACTION-STANDARDS.md`
- `../../AMS-DESIGN-SYSTEM.md`
