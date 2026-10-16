# AMS Navigation Information Architecture

Status: approved for implementation by product owner in this work item
Scope: information architecture and in-module navigation flow
Guardrail: preserve the existing AMS visual system; change navigation ownership, routing, context and labels only where needed.

## Global rules

1. **Sidebar = global destinations.** The flat role-aware sidebar owns direct entry to cross-module work areas and high-priority features. Do not duplicate one of its destinations as another clickable global/workspace submenu entry.
2. **Module tabs = local views.** Tabs are appropriate when they switch mutually related views inside one workspace (for example, Projects: Delivery/Budget/Archived; Finance: worksheet group and worksheet). They must not leak into unrelated sibling pages.
3. **In-page controls = state, not navigation.** Pipeline stages, table filters, board/table/timeline layout, inbox queues, editor Details/Preview, search and pagination stay inside their owning page. Do not create more global links for simple filters.
4. **One active owner.** Query, hash and pathname must resolve to one clear active destination; selected tabs must remain consistent with the URL and role permissions.
5. **Role-safe disclosure.** Reuse the canonical AMS route access policy for navigation visibility. A visual link is never the security boundary.
6. **Progressive disclosure.** Keep the global sidebar compact and scannable. Use two levels of tabs only where the workspace has genuine information depth (currently the 20-sheet Finance workbook).
7. **Direct links must land on a real state.** Avoid anchors that point into unopened drawers or conditional content; deep links should select the relevant view/filter first.
8. **Keep the current UI system.** No redesign of colors, typography, spacing, controls, or shell. Reuse existing primitives and patterns.

## Target structure by module

| Global area | Sidebar destinations | In-workspace navigation | Controls that remain local |
|---|---|---|---|
| Operational Overview | Dashboard & Hub; My Hub | Dashboard workspace: Overview, Performance, Analytics; Activity can remain a contextual destination for the related activity route. Do not show dashboard tabs on the personal My Hub task route. | KPI period, dashboard filters and drill-downs. |
| Client & Pipeline | Sales & Pipeline; Client Directory; Client Onboarding; Inbox; Contracts; SLA Monitoring | No generic CRM submenu: all six work areas already have direct sidebar entry. | Pipeline stage tabs; client scopes (All, Active, Onboarding, At-risk); inbox views/queues; contract/SLA filters. Client Onboarding must open the directory already scoped to onboarding leads, not an anchor inside a closed client-detail drawer. |
| Delivery & Operations | Project Hub; Tasks / Assigned Tasks; Project Files; Team & Capacity; Timesheet Control; Retainer Hours Pool | Projects workspace only: Delivery, Budget, Archived. Do not show these project tabs on Tasks, Files, Team, Timesheets or Retainers. Remove the ambiguous extra Team tab because Team & Capacity already owns that destination. Team, Task, Timesheet and Retainer views belong to their own page/workspace. | Project board/table/timeline selector, project filters, task status/priority/assignee, team view and timesheet filters. |
| Finance & Ledger | Finance Overview; Invoicing & Revenues; Profitability & Expenses; Project Profitability; Quotations; Vendor Ledger; Approvals | Finance workspace: retain the five workbook groups and their 20-sheet model. Hide worksheet links that are the same direct destinations already owned by the sidebar (Executive Summary, Accounts Receivable, Accounts Payable and Project Finance). Keep all other workbook sheets available under their group; the active worksheet is still identified by the current content and sidebar state. Do not add generic Finance tabs to Quotations, Vendor Ledger or Approvals pages. | Search, reporting period, worksheet-specific filtering and record actions. |
| Marketing CMS | Insights; Portfolio / Case Studies; Testimonials; Services; Careers | No shared CMS section tab bar inside each CMS page because those same pages are all direct sidebar entries. Editor-level tabs such as Details/Preview remain because they switch editor modes, not CMS destinations. | Search, published/draft filters, category filters, editor mode, pagination. |
| System Center | Settings pinned at the sidebar bottom; existing permissions and MFA behavior stay unchanged. | Settings workspace retains unique permitted sections: Access & Security, Audit, Integrations and system readiness entry where applicable. The default Overview is reached by the Settings sidebar link and should not be duplicated as another clickable tab. | Account/security forms, audit filters, backup checks and integration settings. |

## Route and behavior corrections required

- Restrict the Dashboard context bar to Dashboard/Activity routes. It must not appear over My Hub.
- Restrict Projects context tabs to `/admin/projects` only; module siblings have their own direct destinations.
- Do not render a generic CRM or Finance bar above each sibling page when its destinations are already exposed globally.
- Remove repeated CMS page tabs from the CMS page headers.
- Replace the Client Onboarding fragment deep link with a query-driven scope such as `/admin/clients/all-clients?scope=onboarding`; hydrate the page filter from the URL and support browser back/forward.
- Keep user-specific route access and role-aware destination transforms (Finance/Creative Project Hub and Freelancer Assigned Tasks) intact.
- Filter Finance workbook sheet navigation against role-visible sidebar destination signatures to avoid clickable duplicates. Preserve the workbook grouping and all unique worksheets.
- Add regression coverage for route scope deep links, role-based menu ownership, contextual bar visibility, CMS sidebar-only ownership and the Finance duplicate-destination rule.

## Acceptance criteria

1. A user does not see the same global destination as clickable links in the sidebar and a workspace/submenu.
2. Tabs only appear on the owning workspace and do not imply unrelated pages belong to the current route.
3. Every primary sidebar item lands on a usable page or explicit workflow state.
4. Query-driven views survive reload and browser navigation and produce an unambiguous active state.
5. Existing role access, MFA exception paths, finance workbook calculations/data, and existing UI tokens are not weakened or rewritten.
6. Typecheck, focused navigation regression tests, full regression suite, and production build pass.
