# Kapitech AMS workflow audit and implementation plan

**Audit date:** 15 October 2026  
**Scope:** Existing frontend routes, module workspaces, API contracts, persistence repositories, financial workbook alignment, and operational workflow requirements.

## Executive finding

Kapitech AMS already has substantial application and backend foundations. The primary gap is not a lack of every feature from scratch; it is the disconnect between the available back-end workflows and the front-end navigation/routes, plus several operational dashboards that show preview data or do not yet derive their metrics from authoritative records. Preserve working data models, audit trails, approval gates, and conversion paths. Extend existing components and API contracts before proposing new schemas.

## Evidence from repository audit

- `server/routes.ts` already exposes protected workflows for public leads and lead management, CRM deals, CRM proposals, internal approvals, projects, tasks, time logs, invoices, expenses, the finance workbook, vendors, documents, CMS content, notifications, search, and the dashboard overview.
- **Baseline finding before this change:** `/admin/crm`, `/admin/proposals`, and `/admin/approvals` redirected to Dashboard despite existing `AdminClientLeadAccounts.tsx`, quotation workflow in `AdminInvoicing.tsx`, and approvals APIs. This branch reconnects those destinations to protected workspaces rather than recreating CRM/proposal business logic.
- **Baseline finding before this change:** `AdminTimeLogs.tsx` and `AdminVendors.tsx` existed but their routes reused `AdminTeams.tsx`. This branch routes Time to `AdminTimeLogs.tsx` and Vendors to `AdminVendors.tsx`, keeps the existing Team workspace, and preserves legacy Team query links with redirects.
- Dashboard already exposed an overview endpoint, but Performance/Analytics and KPI fallbacks mixed unavailable live data with demo figures. This branch loads project, task, time-log, invoice, and expense records directly for Performance/Analytics and labels explicit fixture previews. Missing production source records are represented as unavailable, not as sample data.
- Projects already provides project CRUD, Kanban/table views, execution stages, task links, and archive. This branch changes “actual cost” displays and exports to use Finance expenses linked by project ID, rather than multiplying project budget by task progress. If the Finance source cannot be read, the actual/variance stays unavailable.
- Finance has a 20-worksheet workbook mapping, invoice/payment and expense/vendor flows, project finance, journals, closing, and reports. This branch reuses the existing quotation workflow for the Proposals route; it does not replace the workbook or alter proposal-to-invoice conversion rules.
- Website CMS already has dedicated CRUD/publish editors for case studies, services, testimonials, Insights, and Careers. The sidebar grants Website visibility to authorized editors of any existing CMS content type. No new media/review module has been invented without an end-to-end workspace.
- Tasks already provides list/board layouts, views for all/my/due/review/blocked/completed, task CRUD, assignees, status updates, checklists, and project links. Extend only after confirming the current model/API contracts so existing task workflows and permissions remain intact.
- Finance contains a workbook mapping for 20 worksheets, finance source records, project finance, vendor bills/payments, journal drafts/posting, monthly closing, and accounting reports. It must remain aligned to the Kapitech workbook. Do not replace the existing finance module or calculate accounting figures from unrelated proxies.
- Website CMS already contains dedicated editors for case studies, services, testimonials, Insights, and Careers, backed by CMS APIs. Audit publish states, field validation, content relations, and public-site parity before adding new CMS menus. Do not expose menu items for capabilities with no functioning workflow.
- Backend and tests already cover authorization boundaries, financial conversion integrity, journal controls, transaction integrity, and project/task persistence. All changes must retain the existing regression gates.

## Target sidebar taxonomy

The sidebar contains **modules only**, grouped under short labels. No individual view, list, tab, or CRUD action should become a sidebar module.

| Group | Modules |
|---|---|
| Overview | Dashboard |
| Sales | Inbox, CRM, Proposals, Clients |
| Delivery | Projects, Tasks, Team, Time, Reviews |
| Finance | Finance, Vendors |
| Content | Website |
| Operations | Documents |

Settings remains in its established utility/footer position unless the app’s existing permissions and layout convention call for a dedicated Administration workspace. Submenus belong within their own module page using the established tab/navigation primitives.

## Implementation status and remaining audit work

### Implemented in this change set (subject to passing final CI)
- Sidebar groups: Overview, Sales, Delivery, Finance, Content, Operations. Sidebar entries are modules only; existing design tokens and geometry stay unchanged.
- Reconnected CRM, Proposals, and Approvals routes to existing/added protected workspaces. Approval request/review actions call existing permission-checked APIs, preserve the maker-checker restriction, and use the existing audit-enabled backend.
- Separated Team, Time, and Vendors navigation; legacy Team deep links redirect to their dedicated module.
- Dashboard Performance/Analytics use current project/task/time/invoice/expense sources. “Cash collected”, “cash surplus/deficit”, and invoice-expense difference are deliberately distinguished from accounting revenue/net profit.
- Project budget actuals are derived from linked Finance expense records; delivery progress is not treated as a financial actual.
- Regression assertions cover module grouping, workspace routes, source-backed Dashboard metrics, project cost calculations, and approval controls.

### Known gaps deliberately not represented as completed
- The new Approvals module is a generic approval register. It should not be described as a completed client deliverable review or automatic project/invoice state-transition engine: domain-specific transitions still need requirements and integration tests.
- Full project profitability should reconcile billable revenue, posted expenses/vendor costs, time-based labor cost, and approved allocations. Linked expenses alone are not a complete margin calculation.
- Dashboard financial chart difference is not a posted profit figure; source-aligned accounting reports in Finance remain authoritative.
- Remaining CMS audit should test all fields/status transitions and parity with public content feeds, especially media, localization, SEO metadata, and previews. Existing editors already have CRUD/publish workflows, so these are verification items rather than automatic new modules.
- Task dependency/recurrence features should only be added after required persistence, API authorization, notifications, and regression coverage are confirmed. Existing task views/CRUD should be preserved.
- CI on the final head and the deployed ams.kapitech.id UI must be verified before declaring production completion.
## Module requirements to validate and close

### Dashboard (priority 1)
Executive overview, active project/task status, upcoming and overdue work, risk/blocked work, pipeline and proposal exposure, invoicing/collections, operating expense and net contribution, pending approvals, and capacity. KPI values, charts, and tables must use live API/finance/project/task/time-log records with reporting-period filters. Demo fixtures may appear only in explicit preview mode and must be labeled.

### Projects (priority 2)
Project directory and filters, stages/status, ownership and team, client link, schedule, deliverables/milestones, work plan, budget/commitments, linked task execution, actual costs from Finance, project margin/profitability, archived projects, and handover history. Do not confuse a progress estimate with financial actuals.

### Tasks (priority 3)
Unified task backlog, my work, upcoming/overdue, review, blocked, completed, board/table layouts, priority, assignee, due date, project linkage, checklists, safe status transitions, history/notifications, and reliable CRUD. Dependencies, reminders/recurrence, and additional workflow states should only be added after data-model and authorization review.

### Finance (priority 4)
Keep the existing Excel-aligned registers and controls: invoices and actual payments, expenses and vendor bills/payments, bank/cash and petty cash, AR/AP, project finance/profitability, budget variance, chart of accounts, journal drafts and posting controls, month-end closing, P&L/cash flow/balance-sheet/annual reports, audit trail, role-based approvals, and reconciliation. Use source-linked totals and clearly label any unposted/proxy report.

### Website CMS (priority 5)
Keep case studies, services, testimonials, Insights, and Careers. Verify content CRUD, publish/draft/archived lifecycle, slugs, localization, metadata, preview/public links, media/file constraints, validation, and consistency between CMS records and public API output. Add media/pages/SEO workflows only when storage, permissions, validation, and public consumption are end-to-end.

### Other modules
- **Inbox:** inquiry/client lead intake, job applicants, status/priority/assignment, notes, starred items, safe conversion and response tracking.
- **CRM:** lead/deal pipeline, value and win probability, owner, next action/date, activity history, and explicit conversion to client/project without duplicate records.
- **Proposals:** quotation line items/tax/discount, version/status transitions, approval, sent/accepted/rejected state, validity, client linkage, and conversion to invoice.
- **Clients:** account/contact directory, status, related projects/finance, retainer terms/hours, and service/SLA tracking.
- **Team / Time:** staff directory, capacity/allocation, skills, billable time records tied to project/task, exports, edit/delete permissions, and finance links.
- **Reviews:** one queue for deliverable/client and internal operational approvals, with requester, reviewer, comments, decisions, timestamps, and audit trail; do not conflate approval states with task completion.
- **Vendors:** profiles, skills, rates, verification, contracts, commitments, vendor bills, and settlement records.
- **Documents / Operations:** secure documents, SOPs/policies, role/permission administration, audit logs, backups, security and readiness checks.

## Research references

The requirements above synthesize established practice rather than copying another product’s UI:
- Project Management Institute, PMBOK Guide / performance domains: governance, scope, schedule, finance, stakeholders, resources, and risk: https://www.pmi.org/standards/pmbok
- Atlassian, project schedules, roadmaps, dependencies, milestones, and resource allocation: https://www.atlassian.com/agile/project-management/project-schedule and https://www.atlassian.com/agile/project-management/project-roadmap
- HubSpot, lifecycle stages and lead/deal pipeline management: https://knowledge.hubspot.com/records/use-lifecycle-stages and https://www.hubspot.com/products/crm/pipeline-management
- Xero, transaction records and bank reconciliation: https://www.xero.com/us/guides/record-accounting-transactions/ and https://central.xero.com/0/article/Reconcile-your-bank-account
- WordPress, publishing roles/capabilities and revision history: https://wordpress.org/documentation/article/roles-and-capabilities/ and https://wordpress.org/documentation/article/revisions/
- monday.com, project boards, milestone/dependency tracking, planned-vs-actual, and workload/dashboard practice: https://support.monday.com/hc/en-us/articles/360014437599-Project-management-with-monday-com

## Delivery and safety rules

1. Preserve existing business, CRM conversion, proposal-to-invoice, project/task, and Excel finance flows.
2. Reuse existing API clients, repositories, primitives, permissions, and templates.
3. No fake production data. Live values must be derived from authoritative records; unavailable values must be labelled honestly.
4. No menu/submenu entry unless a supported, permission-checked workspace is reachable.
5. Run TypeScript, relevant regression tests, production build, security/database tests, and production HTTP smoke checks before merge.
6. Keep the current AMS visual system, tokens, spacing, and interaction conventions. Feature completeness does not require a UI redesign.
