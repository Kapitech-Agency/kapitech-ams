# Remaining Projects workspaces — UI/UX restructuring

**Updated:** 2 November 2026. **Baseline:** `0f1b261af70c6a329fe16926753d57b8e16e2677`. **Scope:** frontend presentation/routing only, using approved Dashboard Overview and the [Shared UI System](AMS-SHARED-UI-SYSTEM.md). Existing backend, project/task mutations, Finance calculations and access policy remain unchanged.

## Workspace and source contract

| Workspace | Worksheets | Actual source / limits |
|---|---|---|
| Planning & Delivery | Project Brief; Milestones; Timeline | Existing project notes, client/owner/service/tools, dates, milestones and tasks. Timeline retains undated/invalid records for review and never invents date ranges or prerequisite links. Separate deliverable acceptance, versioned review and revision history remain unavailable, disclosed within the brief. |
| Content & Campaigns | Production Work; Assets & References; Calendar & Publishing; Campaign Performance | Production is explicitly the selected project's existing tasks, not a newly invented content/campaign entity. References are recorded design/repository/live URLs, not a versioned asset store. Publishing and performance show source-unavailable states with useful links to real work; no fake campaign identity, channel, calendar entry, publication or ad metric. |
| Project Resources | Team & Allocations; Task Ownership; Capacity & Conflicts | Existing project lead/team, resource allocation entries and task assignee references. Percentages describe recorded entries in this project. Reversed allocation dates are review cues, not repaired values. Cross-project availability, conflicts and capacity denominator remain unconnected; navigate to existing Team/Time Tracking when permitted. |
| Project Controls | Delivery Signals; Changes & Risks; Budget & Actuals; Handover & Closure | Read-only schedule/ownership/review/blocked-tag signals, existing Finance expense projection and project budget, open task/milestone counts and recorded references. Signals are not persisted risk records. Changes/risks require their own source. Completed lifecycle/progress is not signed acceptance, handover approval or formal closure. |

Content & Campaigns and Project Controls now have navigable frontend workspaces; this does not mark their missing domain workflows as implemented. The preserved internal `projects=budget` route belongs to Controls navigation but retains its existing behavior. No CMS publishing flow or Documents data is relabelled as client campaign work.

## Routing, selection and access

- Workspace: `projects=planning-delivery|content-campaigns|resources|controls`.
- Worksheet/scope pairs: `planningView` / `planningProject`; `contentView` / `contentProject`; `resourceView` / `resourcesProject`; `controlView` / `controlsProject`.
- Existing Planning URLs retain `brief|milestones|timeline`. New views use the canonical keys in `src/lib/projectDeliveryPresentation.ts`.
- Accept a canonical project ID or legacy slug. Explicit invalid IDs show recovery, never another project's brief. Missing selection uses the existing first-open/first-project default. Worksheet links clone query context; cross-workspace task/brief/timeline links carry canonical IDs.
- Scope changes clear the old record inspector, filters and pagination. Source refresh updates/removes task inspection from the current project. Browser query state determines selected worksheet; invalid worksheet keys normalize to the supported default.
- Only existing Admin/PM route permissions expose these workspaces. Creative/Finance/Freelancer access and server authorization are unchanged. Link gates parse pathname and search separately using the canonical helper. Edit project delegates to the existing permission-gated project Drawer; no new save flow is introduced.

## Composition and interactions

One shared module header → project context/picker/source actions → shared worksheet navigation → the selected brief/register/allocation/report/availability surface → source detail and permitted next action. No KPI filler, duplicate module header, disabled target-tab strip or production preview.

`ProjectDeliveryWorkspaces` is a domain composition over AdminPanel, AdminSectionTabs, AdminFilterToolbar/Field, AdminDataTableShell, AdminTablePagination, DashboardControl, DashboardEmptyState, ProfileIdentity and Drawer. Shared primitives own geometry. Domain CSS only owns grids, record containment and responsive composition. Desktop tables have captions/column headers and a named keyboard-scroll region; equivalent cards replace them below 1100px.

Registers offer search, record type, recorded state, owner/unassigned and date/title sorting, reset, real filtered totals and pagination. Applied field filters remain visible when closed. Inspect opens a shared read-only Drawer with the actual brief, owner/date/stage/priority/tags/checklist, or the milestone/schedule record. Existing execution/project editor remains the route for changes. Empty, filtered-empty, loading, unavailable and invalid-scope states use shared presentation and useful recovery actions.

Source dates are never repaired, fabricated or silently omitted. Flagged Done tasks remain inspectable; changing stage does not prove a blocker cleared. Unsafe/non-HTTP(S) reference URLs are not rendered as active links. Source text is rendered as escaped React text.

## Finance and source integrity

Budget & Actuals reuses the unchanged `getRecordedExpense` / `recordedExpenseTotals` projection and existing currency formatter. Null/unavailable is an em dash, while a verified zero remains zero. No new variance, revenue, forecast, profit, capacity or completion formula is introduced. Existing load/create/edit/delete/status/checklist functions and API calls remain in AdminProjects.

## Evidence and remaining gates

Automated tests render all fourteen worksheets and verify scope/aliases, role policy, one current module link, invalid/missing dates, blocked completed tasks, unknown versus zero Finance cost, unsafe links, read-only gating and loading/unavailable/no-project states. Legacy presentation assertions are replaced with active-composition/semantic coverage; mutation/security regressions stay intact.

Local actual-component browser QA uses external read-only fixtures, never production seed/example records. Verify scope switching, filter/reset, pagination, task/milestone inspection, existing editor/detail return, links, light/dark and narrow layouts before delivery. Authenticated production writes, missing campaign/review/risk/closure workflows and user visual sign-off remain separate gates.
