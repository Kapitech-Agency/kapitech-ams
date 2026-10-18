# AMS Navigation and Information Architecture

**Status:** Approved navigation target, updated 18 October 2026.
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

### Navigation depth and breadcrumbs

Use four concepts, but do not render all of them as persistent menu tiers:

1. **Primary module** — one of the nine modules.
2. **Workspace** — a distinct work area inside a module.
3. **Worksheet/view** — table modes, content categories, statuses, filters and saved views inside the owning workspace.
4. **Record detail** — the selected record and its contextual sections, not another menu destination by default.

Keep the persistent navigation to the primary module and current workspace. Put worksheets and state/filter views inside the relevant workspace instead of growing the sidebar into a long list of features.

Breadcrumbs are conditional. Use them for deep record/detail views when the parent path genuinely helps orientation or return navigation. For example, show ancestors `Projects → Project Registry` above a `Website Redesign` record heading. Do not repeat the current page title in both breadcrumb and heading. Do not add breadcrumbs to obvious module roots or primary tab views where the current location is already clear. Breadcrumb links must lead to valid parent destinations and respect existing route/role behavior. At compact widths, collapse the path or offer a clear back-to-parent action without introducing another persistent navigation bar.

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

Projects has seven workspaces:
1. **Overview** — source-backed portfolio context and exceptions; it must not duplicate the full registry.
2. **Project Registry** — one canonical project register. Planning, Active, On Hold, Completed and Archived are filters/saved views, not separate workspaces.
3. **Tasks & Execution** — Board/Kanban, List, My Tasks, Task Lists and Dependencies over the same task records.
4. **Planning & Delivery** — brief, scope/deliverables, milestones, timeline, deliverable tracking, internal QA, client review and revision history.
5. **Content & Campaigns** — content calendar/planning, production pipeline, creative assets/versions, reviews, publishing status/schedule and campaign performance where supported.
6. **Project Resources** — team, assignments and workload, using availability/capacity from Team & Resources.
7. **Project Controls** — changes, risks/issues/blockers, project health, budget vs actual, reports and closure.

Project Files are contextual links into Documents, not a second file repository. Finance is authoritative for financial values; Clients owns retainers/SLA and client relationship records; Team & Resources owns people, vendor and time records.

### 3.4 Clients

Clients has four workspaces:
1. **Directory** — the canonical company/client and contact directory. Companies and Contacts are worksheet/filter modes; Client 360° is contextual detail for a selected client, not a second directory.
2. **Onboarding** — checklist, required documents and kickoff readiness.
3. **Agreements** — contracts/SOWs, retainers/service commitments, renewal schedule and contract history.
4. **Service & Health** — SLA monitoring, service issues/feedback, client health and service history.

Client Requests and inbound conversations are owned by Inbox. Clients may show linked request context, but must not create a competing request queue or status system. Finance owns quotations, invoices, payments and accounting records. Legacy CRM data may remain for compatibility, but there is no standalone CRM workspace.

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

Team & Resources has four workspaces: **Team & Capacity**, **People Operations**, **Vendors & Freelancers**, and **Time Tracking**. Team Directory is the canonical team-member identity/profile. People Operations links employment, onboarding/offboarding, leave, training and performance records to that identity; it must not create a competing Employee Directory. Vendor/freelancer records are canonical here and Finance references the same supplier records. Preserve role restrictions: vendor billing access does not grant team-directory or time-entry access.

### 3.7 Documents

Documents has one canonical **Document Library** workspace. Project & Client Files, SOPs & Policies, Legal & Corporate, Finance & Tax, HR & People, and Security & Infrastructure are categories/filters/saved views within the library, not separate workspaces. Avoid duplicate Overview and All Documents destinations when they show the same register. Contextual attachments link to canonical file/version records. Do not create competing repositories or expose private storage URLs/secrets.

### 3.8 Website CMS

Keep content-type workspaces for Case Studies, Services, Insights, Testimonials and Careers. CMS Overview is distinct only if it provides cross-content publishing/status context and useful drill-downs; it must not duplicate or route to the Case Studies register. Careers contains Jobs, Applicants and Recruitment History as internal worksheets/tabs, not primary/sidebar entries. Careers owns supported job-opening and applicant workflows. Do not create a second CMS or show placeholders as functional.

### 3.9 Settings

Settings owns authorized access, configuration, audit and integration screens. Keep integrations grouped within one Integrations workspace. Bank Mandiri Kopra H2H may use internal sections/tabs for Overview & Status, Connection & Environment, Accounts & Mapping, Synchronization & Diagnostics, and Audit Trail; do not make every detail a persistent menu level. Preferences remain within the relevant settings surface unless there is a distinct route, permission boundary and workflow. Direct route access remains guarded. The release-readiness placeholder is not a navigable feature until verified.

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
- [ ] Worksheets, statuses and saved views stay inside their owning workspace; record details do not add menu depth by default.
- [ ] Breadcrumbs appear only where parent context improves deep navigation and do not repeat the current page title.
- [ ] Direct unauthorized routes and server-side permissions remain protected.
- [ ] Finance worksheets and existing records are preserved.
- [ ] Build, type, regression and supported E2E checks are executed and reported honestly.

## 7. Related specifications

- `../AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`
- `../AMS-IMPLEMENTATION-TRACEABILITY.md`
- `../AMS-UX-INTERACTION-STANDARDS.md`
- `../../AMS-DESIGN-SYSTEM.md`
