# AMS Content-First UX/UI Implementation Map

Date: 17 October 2026

## Scope and boundaries

This map records the source-backed frontend review and implementation order for the content-first workspace task. The required design authority remains `AMS-DESIGN-SYSTEM.md`. Module ownership and allowed workflow remain defined by `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md`, the navigation architecture, and the business/workflow contracts. This document does not authorize server, API, database, authentication, RBAC-policy, financial-calculation, or business-logic changes.

Baseline inspected: `main` at `356ba6d57b1993dccafcea7e7a6f40a977afda04`. GitHub Actions baseline run 39040482509 (Typecheck, tests, production build) and run 39040482525 (verify) completed successfully. A GitHub API status-context query returned no legacy status contexts; the Actions check-runs above are the baseline evidence. Browser-level visual validation is not implied by these checks.

## Approved module and view inventory

| Module | Canonical working area | Current contextual views and ownership | UX/UI audit disposition |
|---|---|---|---|
| Dashboard | Source-backed executive overview with operational exceptions and drill-downs | Overview, Performance, Analytics under `/admin/dashboard` | Preserve the Dashboard as structural reference. Keep period/source context attached to metrics; do not introduce fixture values or duplicate KPI cards. |
| Inbox | Inbound queue with search, filters, triage, selected-record review and follow-up | Overview, Client inquiries, Starred. Legacy `view=jobs` is a compatibility path to Website CMS → Careers → Applicants, not an Inbox-owned hiring workspace. | Remove the repeated per-view KPI strip so contextual tabs and queue controls lead directly into the work. Keep the direct Careers Applicants link and existing message/lead actions. |
| Projects | Portfolio/delivery register, with tasks and details as supporting workspaces | Projects, Delivery, Budget, Archived and Tasks; task route remains `/admin/tasks` | Preserve the current project/task lifecycle, view-query routing, boards and tables. Avoid inflating every view with overview KPIs; review each view alongside its filters and primary register. |
| Clients | Client directory first, with relationship context and linked records | Client directory, Onboarding, Contracts, Retainers and SLA monitoring | Keep Retainers and SLA as separate purpose-built workspaces. Preserve canonical client links, visibility and record actions. |
| Finance | One purpose-built register/report/control per financial work area | Overview & Control; Transactions & Cash; Receivables & Payables; Project Finance; Accounting & Reports. Existing worksheet-level views remain within the owning group. | Retain the five-group hierarchy and existing worksheets. No formula, posting, payment, reconciliation, period-lock, maker-checker, permission, source or record changes. |
| Team & Resources | Team directory, capacity and resource allocation | Team directory, Capacity, Skill matrix, Vendors & freelancers, Time tracking | Preserve role visibility, vendor/time links, allocation semantics and confidential fields. |
| Documents | Private searchable document register with preview/download and related-record context | Document vault/list, categories and existing upload/detail flows | Preserve protected storage flow and current permission-driven actions. Never construct direct storage URLs. |
| Website CMS | Content-type-specific register and its shared editor/drawer | Case Studies, Insights, Testimonials, Services, Careers. Careers has Job openings and Applicants workspaces. | Remove redundant pre-register KPI strips on CMS pages. Keep content counts adjacent to filters/results and preserve editor, publication, bilingual content and applicant association behavior. |
| Settings | Grouped system state, access/security, audit and integrations | System overview, Access & security, Audit log and Integrations | Preserve security controls, MFA, server-side permissions, backups, audit history and confirmation behavior. |

## Phase order

1. Shared page shell and contextual navigation: inspect header, tab/query alignment, single-gutter ownership, and layout stability before local page changes.
2. Dashboard, Inbox, Projects/Tasks: establish a clear primary work surface and contextual controls without changing workflow semantics.
3. Clients and Finance: improve content hierarchy only; keep relationship ownership and all Finance calculations/contracts untouched.
4. Team & Resources, Documents, Website CMS, Settings: apply the right working-area pattern per view; avoid repeated dashboard strips on registers.
5. Cross-module responsive/accessibility pass: review 1440, 1024, 768, 390 and 320px layouts where source/browser validation permits; check keyboard, focus, pending/error, empty/filter-empty and unavailable states.
6. Targeted frontend tests, typecheck/lint, production build and final diff review. Run CI against the change branch. Report authenticated browser/production verification only if it was actually performed.

## First implementation slice

Confirmed root cause: Case Studies, Services, Insights, Testimonials and Careers each placed a four-card (or role-specific) metric strip ahead of the page's main list/editor. Inbox did the same per local view. This duplicates counts already exposed beside results or contextual tabs and pushes the queue/register below a secondary summary block.

Change intent: remove those summary strips and their now-unused display-only counters/imports; leave module headers, queue/register/filter controls, all source-backed record data, editor drawers, statuses, route/query behavior and authorized actions intact. Remove the case-study filter's extra top margin because the shared page shell already owns vertical spacing.

## Evidence and remaining verification

Source review covered the canonical page shell/navigation primitives and source files for all nine modules, Finance navigation/workbook grouping, page-specific CMS/Inbox working areas, and existing regression tests. The baseline CI passed. The current implementation branch still requires its own CI run, full diff review, responsive/browser inspection, and final source-boundary scan before it can be declared ready.

Browser verification requires a supported authenticated test environment. If that is unavailable, document it rather than inferring visual correctness from JSX, tests, or build output.
