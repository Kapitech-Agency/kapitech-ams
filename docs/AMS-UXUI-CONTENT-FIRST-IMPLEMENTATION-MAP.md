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

## Second implementation slice: Documents

Confirmed hierarchy before this slice: header and contextual tabs were followed by a four-card metrics strip, a large upload/dropzone panel, and only then the search/sort controls and document register. The header already exposes the upload drawer, so the KPI strip was secondary and the large drag-and-drop surface unnecessarily pushed the primary register down.

Change intent: remove the four-card KPI strip and its display-only summaries, place search/sort and the document register first, then keep the existing upload/dropzone panel below the register. The header upload action, browse control, drag-and-drop behavior, upload drawer, private-vault wording, record states, filters, sorting, permissions and source data remain intact.

## Third implementation slice: Clients and SLA workspaces

The Retainers page had three large hand-built metric cards using a separate visual pattern from the shared AMS metric component. The values themselves remain relevant to this workspace, so they are retained and moved to the shared `AdminMetricStrip` with the same source-derived values and the existing reconciliation notice.

SLA Monitoring had an explicit telemetry-unavailable notice followed by four large em-dash metric tiles that repeated the same missing-source explanation before the setup checklist. The repeated unavailable tiles are removed. The truthful unavailable notice, setup requirements and Contracts & SOW link now form the main sequence; no metrics are replaced by zeros or sample values.

## Fourth implementation slice: Team & Resources

The vendor-directory view included an “Average SLA Compliance” KPI with a permanently hardcoded em dash and a caption saying that SLA data is not tracked in the current vendor model. That did not expose a real decision metric and visually competed with source-backed vendor count, monthly external burn, and renewal information. The unsupported tile is removed. Active contractor, burn and renewal metrics plus their existing unavailable-data states remain unchanged; no model or permission behavior was changed.

## Fifth implementation slice: Projects

The active portfolio and archived-project views each rendered a four-card summary before the actual portfolio table/board register. The metrics are source-derived and remain useful as supporting context, so they are retained in the same views but moved after their primary `AdminPanel` register. The page header continues to show the active/completed record count; portfolio search, status/health/client/owner filters, board/table/timeline selection, pagination and project actions are unchanged. No project/task workflows or calculations were changed.

## Sixth implementation slice: Clients and Team & Resources registers

The Clients directory had a header-level account count, a three-metric strip, then search/filter controls and the directory table. The metric strip is now retained below the directory; the search, scopes, pagination, export, relationship drawer and editing behavior are unchanged.

Team Directory, Vendor & Contractor Directory and Time Log Ledger also began with large KPI strips before their filters and primary list/table. Their existing source-backed summaries now sit after the relevant register. Capacity and Skill Matrix retain their analytical summaries before the capacity view/table because those values provide context for interpreting those analytical surfaces. The Vendor & Contractor Directory no longer includes the unsupported per-row SLA column, whose only value was a permanent dash with a tooltip explaining that the current model does not track SLA. Vendor data, contract and finance links, permissions and all calculations remain unchanged.

## Detailed view-by-view audit and disposition

| Module / view | Primary work surface and content order | Disposition and verification focus |
|---|---|---|
| Dashboard · Overview | Decision KPIs and live exceptions, then supporting activity/drill-down | Existing Dashboard remains the reference. No KPI formulas, source contracts, period scope or navigation changed in this task. |
| Dashboard · Performance | Performance-specific visual/report surface and period context | Retain existing metrics/charts; inspect period labels, legend, loading/unavailable states and narrow-width overflow during visual QA. |
| Dashboard · Analytics | Source-backed analytic charts and supporting explanations | Retain current chart implementation and navigation. Do not replace missing series with fixtures. |
| Inbox · Overview | Incoming queue controls, queue/list, record detail and follow-up actions | Removed the redundant per-view KPI strip. Direct Careers Applicants link remains. |
| Inbox · Client inquiries | Inquiry stage counts and triage/board view | Kept inquiry-status visualization and existing records/actions. Confirmed it is a different work surface from the main queue, not a duplicate dashboard. |
| Inbox · Starred | Starred inbound records and their source-backed detail | Uses same queue source/actions. No separate KPI summary remains. |
| Projects · Portfolio | Search/status/health/client/owner filters, board/table/timeline portfolio | Moved its four source-derived portfolio metrics below the primary portfolio register. Preserved layout selector, filters, route/query behavior, rows and actions. |
| Projects · Delivery | Selected project, task board, task filters and detail drawer | Preserved project selector, task lifecycle, keyboard/drag interactions, permissions and empty states. Task view route remains separately reachable. |
| Projects · Budget | Budget-versus-recorded-expense table with explicit cost basis | Preserved source mappings, displayed calculations, project links and pagination; no budget or expense calculation changed. |
| Projects · Archived | Archive filters/table and project details | Moved archived summary cards below the archive register. Kept historical records and edit/view controls as implemented. |
| Tasks | Dedicated task workspace at `/admin/tasks` | Preserved list/board and project scopes. Detailed browser checks still require authenticated interaction testing. |
| Clients · Directory | Header/actions, search/status scopes, directory/table and details | Moved the three-metric summary below the directory so filters/table are encountered first. Row fields, pagination, export, profile/edit and relationship links unchanged. |
| Clients · Onboarding | Existing directory state scope via URL/query | Preserved query-backed scope and client lifecycle. No separate onboarding data model was introduced. |
| Clients · Lead Accounts & Pipeline (existing direct workspace) | Stage/search/owner filters, pipeline register, pagination and compact summary | Follow-on slice removes the duplicated top KPI strip while keeping the existing filtered register and summary values/actions. No standalone sidebar module is added. |
| Clients · Contracts | Search/status filters, contract/SOW register, lifecycle actions and linked document references | The four source-backed lifecycle counts now use the shared AMS metric strip below the register. Search, pagination, contract state transitions, document links, permissions and drawer form remain unchanged. |
| Clients · Retainers | Reconciliation notice, shared metric strip, filters and retainer agreements | Unified three relevant metrics under the shared AMS primitive. Existing usage caveat and saved values remain. |
| Clients · SLA monitoring | Telemetry-unavailable state, setup checklist, Contracts & SOW action | Removed four repeated unavailable tiles. The explicit unconfigured message remains; no mock telemetry introduced. |
| Finance · Overview & Control | Executive summary/report context and operational controls | Five primary workspace groups remain. Preserve metric meaning, report range and source-status distinctions. |
| Finance · Transactions & Cash | Cash/bank, revenue, expenses and petty cash source registers | Each worksheet retains its own register and source caveat. Cash/bank and petty cash continue to disclose reconciliation/provisional status. |
| Finance · Receivables & Payables | Receivables, vendor bills, vendors/freelancers | Invoices, due dates, recorded payment/bill rows and supported vendor references remain the primary records. |
| Finance · Project Finance | Project finance, operational budget, project allocation and team fee | Keep each worksheet separate. No allocations, expense mappings, costs, fees or profitability formulas changed. |
| Finance · Accounting & Reports | Journal, Chart of Accounts, P&L, cash flow, balance sheet, closing, annual summary | Retain all worksheet views and disclosed proxies/posted-ledger distinctions. Changes to formulas, posting, reconciliation and closing are outside scope. |
| Team · Directory | Search/status/Pod controls, member table/card directory and profile/allocation actions | Moved headcount/role-group metrics below the team register/cards. Member assignment and recorded-time semantics unchanged. |
| Team · Capacity | Historical tracked utilization and capacity/project-assignment view | Retained analytical metrics before the capacity table because they provide context; values remain explicitly historical, not forecast. |
| Team · Skill Matrix | Vendor/internal capability coverage table | Retained coverage metrics and table hierarchy. Counts remain source-derived with unavailable states. |
| Team · Vendors & Freelancers | Search/tier/category/agreement filters and contract directory | Moved relevant contractor/burn/renewal metrics below the vendor directory. Removed the unsupported SLA summary and per-row placeholder column. |
| Team · Time Tracking | Project/time-type search filters, time-entry form when opened, ledger/pagination | Moved tracked/billable totals below the filtered ledger. Form save/delete behavior and role checks unchanged. |
| Documents · Vault | Search/sort, private document register and metadata/actions | Removed redundant metric strip; moved existing upload/dropzone surface below the register. Header upload action and secure API/drawer workflow preserved. |
| CMS · Case Studies | Search/status filters and case-study register/editor | Removed pre-register metric strip and extra top margin. Source records, editor/publication behavior and filtering untouched. |
| CMS · Services | Content register and editor | Removed pre-register metric strip; preserved category/publication behavior and existing editor. |
| CMS · Insights | Search/status filters and insight editor/register | Removed pre-register metric strip and now-unused display-only counts. Publication and bilingual editing unchanged. |
| CMS · Testimonials | Testimonial register and editor | Removed pre-register metric strip; retained existing records/actions. |
| CMS · Careers · Job openings | Job-opening controls and content register | Removed redundant KPI strip. Existing add/edit/delete drawer/confirmation actions remain. |
| CMS · Careers · Applicants | Applicant register/details | Same Careers view uses query-backed Applicants selection and permission-specific actions. No Inbox duplicate or new applicant data source added. |
| Settings · System overview | Source-backed readiness, backups/snapshots and server status | Preserve server-owned status and explicit unavailable/error states. Sensitive actions and confirmation remain unchanged. |
| Settings · Access & security | Password/MFA/account/security controls | Protected security scope. No authentication, session, MFA, account policy or permission logic edited. |
| Settings · Audit log | Audit register/filter/pagination | Audit data and policy untouched. Source errors must not masquerade as empty history. |
| Settings · Integrations | Integration status/configuration and save feedback | UI displays current source status; no API/provider configuration or credentials changed. |

## Validation and delivery status

Source review covered the canonical page shell and contextual navigation primitives, all nine primary modules, the actual Finance worksheet grouping, page-level CMS/Inbox workflows, and targeted frontend regression tests.

Initial implementation was merged into `main` through [PR #175](https://github.com/Kapitech-Agency/kapitech-ams/pull/175), with squash commit `3a693a20aee65d01d175ad194992aa1a60913733`. Both post-merge checks on that `main` commit passed:
- [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39044280168)
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39044280079)

The first delivery diff contained only frontend page components, frontend regression tests, and this implementation map. No backend, API, database, auth/session, RBAC, Finance calculation, dependency, or migration files were included. The follow-on Lead Accounts & Time Tracking slice merged through [PR #176](https://github.com/Kapitech-Agency/kapitech-ams/pull/176) as squash commit `162b3cce51c18751da68fdb8764a7a074a7f02a7`; both workflows passed before merge ([Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39044548147), [CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39044548311)). The Contracts hierarchy slice was implemented on `fix/ams-contracts-content-first-2026-10-17`, based on `162b3cce51c18751da68fdb8764a7a074a7f02a7`. Typecheck caught an orphaned JSX closing tag during the first run; that specific issue was corrected before final validation. The corrected source commit `26b43fc10126df3b0d45fa943e3bcf765e90a3d9` passed both [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39044907166) and [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39044907082). Repository delivery and the live authenticated visual check remain separate from these automated checks.

## Follow-on implementation slice: Lead Accounts & Time Tracking

The existing Lead Accounts & Pipeline workspace showed the same Open Deal Value and Weighted Probability twice: first in three large KPI cards above search/stage/owner filters, then again in the compact Pipeline Summary below the directory. The top KPI section has been removed. The filtered table now leads the workspace, while the compact summary retains open value, weighted probability, contract-review count and ready-to-sign count. The display-only proposal count and icon import were removed with the redundant section. No lead-stage transitions, source records, proposal deep links, permissions or save behavior were changed.

The dedicated Time Tracking page showed period-filtered tracked/billable totals before its entry form and recent-entry ledger. The existing metric strip is moved below the ledger, preserving its source calculations and reporting-period scope. The entry form, scroll-to-form header action, delete confirmation, pagination and API flows are unchanged.

## Next slice: Contracts & SOW

Contracts & SOW previously placed four hand-built overview cards before the search/status controls and primary contract register. The counts are meaningful for the lifecycle, so they remain source-derived but now use the shared `AdminMetricStrip` after the searchable, paginated register. The row actions, workflow transitions, document references, authorization checks, and drawer editor are unchanged. No contract status, mutation, API, or persisted data behavior is changed.

## Follow-on Contracts interaction slice: shared confirmations

The Contracts lifecycle workspace now uses the existing shared `ConfirmDialog` for status changes to Expired and Terminated, and for deleting a draft. Browser-native `window.confirm` calls were removed. Each dialog identifies the affected contract, explains the impact, and uses the existing `transitioningId` for busy-state protection. Existing permission checks, API mutations, record updates and success/error notices remain in the same handlers. Transition request errors are surfaced using the page's existing error notice.

## Follow-on Contracts form-control consistency slice

The Contracts status filter and editor dropdowns for type, client, project, and currency now use the shared `CustomSelect`, aligning keyboard, focus, and visual behavior with AMS. `CustomSelect` now supports disabled individual options and skips them during Arrow/Home/End navigation; pointer and Enter/Space activation are guarded as well. This preserves the existing rule that a new unlinked change-order cannot be selected while keeping a legacy change-order record readable/editable. Data options, values, and update handlers remain the same.

## Follow-on Project Profitability hierarchy slice

The Project Profitability report displayed four aggregate KPI cards before the primary financial register and its project/client search. The table now leads the workspace; the same source-derived project count and IDR-only collection, outstanding, and contribution summaries remain directly below it. Per-currency row values, the contribution formula disclosure, search behavior, loading/error states, refresh action, and aggregate-only privacy boundary remain unchanged. No financial formula, source mapping, API contract, or accounting logic changed.

## Follow-on Time Tracking control consistency slice

The linked-task field in the Time Tracking entry form used the last native `<select>` in the page. It now uses the shared `CustomSelect` while keeping the same task ID value, task-title labels, handler, “No linked task” option, and disabled condition when no project or eligible tasks are available. This is a presentation/control consistency change only; the time-entry form's persistence, task linkage, validation, and permission logic are unchanged.

## Follow-on Vendor Directory hierarchy and detail surface

The standalone Vendor Directory now leads with directory controls and vendor cards, followed by the empty/unavailable state and pagination; its four source-derived snapshot metrics are below the working register. The loading skeleton mirrors that content-first order and four-metric count. The long-form vendor profile detail now uses the shared `Drawer` with the Edit action in its fixed footer instead of a `Modal` incorrectly named `vendor-delete-modal`. The selected vendor, rate, contact details and notes remain unchanged; the existing edit handler, permissions, mutations and data sources stay intact.

## Follow-on Team & Resources loading hierarchy slice

The shared Team workspace loading state now mirrors the selected view's actual content order. Team Directory, Vendor & Contractor Directory, and Time Logs show a filter/surface placeholder, then the main register placeholder, then supporting metric placeholders. Capacity & Allocation and Skill Matrix keep metric-first loading placeholders because their aggregate values frame the analytical view. This changes loading presentation only; source requests, data availability flags, metrics, filters, records, permissions, and actions are unchanged.

## Follow-on Team & Resources filter consolidation slice

The Team Directory and Vendor & Contractor Directory previously exposed the same search dimension in both the module header and the primary directory toolbar, using separate state variables that were both applied to the same results. Vendor category was similarly selectable twice. The redundant header search/category controls are removed; Team Department, Team Pod, status, team search, vendor search/category/tier/agreement filters remain available in their owning directory workspaces. Header actions retain Invite Member, Add Vendor / Contractor, Export and Refresh. Result filtering and permissions continue to use the existing source records and predicates, without changing business data or API behavior.

## Follow-on Team & Resources detail surfaces

The member profile and vendor profile detail views now use the shared `Drawer` instead of `Modal`, matching their multi-section content and making secondary actions available in a fixed footer. The member drawer retains role, department, allocation, active-project and skill information; Open Projects and Allocate remain available. The vendor drawer retains contact/commercial/location/status/skills/contract information plus Portfolio, GitHub and Edit vendor actions. This changes only the presentation surface and action placement; selection state, permissions, project allocation, vendor editing, data sources and mutations are unchanged.

## Follow-on Clients header consistency slice

The Clients & Key Accounts header previously repeated the Active clients KPI value as an `active accounts` badge, while the same source-backed count remained in the summary strip below the register. The header badge is removed; the primary directory remains the dominant work surface and the metric strip still provides Active clients, billed value and spend-cap compliance in its supporting position. Header title, description, export/create actions, query scopes, filters, register, permissions and lifecycle behavior remain unchanged.

## Remaining visual verification and limits

Authenticated browser-level UX/visual testing was not performed in this environment. In particular, the 1440px, 1024px, 768px, 390px, and 320px viewport pass, actual keyboard/focus flow, direct-route/browser-history checks, drawer interactions, and permission-specific visual scenarios remain unverified in a live AMS session. CI verifies static/type/regression/security/build gates but does not replace those visual checks.

No frontend change is currently blocked by a backend requirement. The known visual-verification limitation is documented rather than inferred as a pass. The branch is ready for repository review; production deployment and live Hostinger verification have not been claimed.



## Structural UX/UI audit and scrollbar repair checkpoint · 17 October 2026

### Baseline and evidence limits

Current source audit baseline: main at 35bc936ef96972a233196d3f3c92b2e5bb24d2d7. This is newer than the historical checkpoints above. The latest main commit removes a duplicate active-client count from the Clients header. At this exact SHA, GitHub Actions reports AMS Quality Gate success (run 39049550837) and AMS CI success (run 39049550897). Those are CI results, not an authenticated browser or visual audit.

The current workspace could not clone the repository because this execution environment could not resolve/connect to github.com. Source inspection therefore used current-main GitHub file/tree results. No local checkout, working-tree status, local npm command, computed-style inspection, screenshot capture, authenticated session, or live cross-browser interaction was available. Keep these limitations explicit.

The referenced local assets DESIGN(1).md and screen.png were not found in the accessible runtime or repository tree. The screenshot's structural principles described in the user request are retained as guidance, but this checkpoint does not claim to have visually inspected either asset. AMS-DESIGN-SYSTEM.md and the already-written content-first map remain the design authority.

Use these evidence tags in the matrix:
- SOURCE: confirmed directly in current source or route definitions.
- CI: test/check outcome reported by GitHub Actions for the named SHA.
- BROWSER-UNVERIFIED: requires authenticated runtime, computed styles, keyboard/touch, or viewport verification.
- RISK: likely user impact supported by source pattern but not reproduced in the browser.
- SOURCE/DOC CONFLICT: current implementation disagrees with current documentation.

### Route-by-route audit and structural redesign map

This matrix describes actual route owners and query states located in src/App.tsx, src/lib/amsModuleSubnavigation.ts, src/lib/amsNavigationAccess.ts, and the current component source. A route or component is evidence of rendered code, not proof of persistence or completion of its underlying business workflow.

| Actual route / view state | Current primary task and source evidence | Finding / priority / confidence | Target content order and working surface | Responsive and interaction acceptance |
|---|---|---|---|---|
| /admin/dashboard, default or view=overview | GlobalExecutiveDashboard; AdminPageShell; dashboard-owned source summaries and drill-downs. | Existing content-first work is already in main. Continue to verify actual labels, source/period context and unavailable states. BROWSER-UNVERIFIED. | Module header and contextual views → decision-relevant source-backed exceptions and operational metrics → dominant trend/portfolio area → activity and quick actions that lead to existing records. Do not add a fixed number of cards. | Metric labels/unit/period remain readable at 320px; chart legend and overflow stay usable; links and filters remain keyboard reachable. |
| /admin/dashboard?view=performance | Same component, query selects Performance. | Query-driven route is source-confirmed; visual/data-source states not runtime-verified. | Header/context → performance-specific period and filters → primary trend/report with legend and units → supporting breakdowns and linked exceptions. | Long labels and series wrap without clipping; focus movement does not cause uncomfortable scrolling; missing series remain unavailable rather than fabricated. |
| /admin/dashboard?view=analytics | Same component, query selects Analytics. | Source-confirmed. BROWSER-UNVERIFIED. | Header/context → selected reporting context → principal chart/analysis → source-backed supporting comparisons and drill-downs. | Distinguish no data from a failed source; chart and tables reflow at narrow widths with keyboard-readable alternatives. |
| /admin/inbox, view=overview | AdminInbox; fetches existing lead/inquiry records, filters out type=career in refreshInbox, and supports overview/queue/table/split-style surfaces. | Queue work exists, but the component has multiple view modes and must not expose a competing applicant workflow. SOURCE. | Header/context tabs → search/status/priority controls and clear selected scope → dominant inbound queue → selected message/review detail on wide screens or a readable single-column detail flow on narrow screens → secondary history/actions. | Queue and reader do not become two unreadable columns; selected item stays in sync; actions have keyboard access and pending/error feedback. |
| /admin/inbox?view=client | Inbox's client-request queue over the same filtered non-career source. | Source-confirmed. BROWSER-UNVERIFIED. | Header/tabs → client-request filters → request queue → selected request detail and supported client-link/conversion action. | Filter changes, reset and selected detail remain discoverable; no duplicate search control or clipped action row. |
| /admin/inbox?view=starred | Inbox's starred subset of non-career records. | Source-confirmed. BROWSER-UNVERIFIED. | Header/tabs → starred queue and search/filter context → selected record detail → source-backed action/history. | Empty-starred state is distinct from source failure; focus remains visible in horizontally overflowing control rows. |
| Legacy /admin/inbox?view=jobs | Protected route wrapper redirects the legacy jobs view to /admin/cms/careers?tab=applicants. AdminInbox also filters career items out of its source collection and its valid active tabs exclude jobs, but the file still contains a Candidate pipeline board branch and candidate-specific actions. | SOURCE/DOC CONFLICT and dead/unreachable UI risk, P1. The jobs board exists in source, but current route/state and data filtering conflict with its reachability. Do not reintroduce this board in Inbox. The canonical applicant view remains CMS Careers. | Keep the legacy redirect. The Inbox owns inquiry triage only. Remove or isolate unreachable candidate-only presentation in a later bounded frontend slice after regression coverage proves no current supported Inbox path depends on it; preserve canonical lead/application records and handlers in their owning route. | Verify legacy deep link, reload/back/forward, CMS Applicants entry, and role-specific permissions. Ensure no candidate record/action appears in the Inbox queue. |
| /admin/projects, projects absent/all, layout=board/table/timeline | AdminProjects; query holds projects view, layout and selected project. Current code has portfolio board, a horizontally scrollable table and timeline view. | Content-first ordering and metric relocation are already in main. Table min-width is intentional and has a horizontal wrapper. Scroll affordance is a confirmed CSS issue for some board selectors, but runtime impact is BROWSER-UNVERIFIED. | Header with view and primary actions → relevant portfolio filters/search and board/table/timeline switch → dominant portfolio surface → supporting source-backed summary after the main register → selected project drawer/details when requested. | Table scroll stays inside its wrapper; all columns and actions can be reached with keyboard/touch; switching layout does not lose selected project or create page-wide horizontal scroll. |
| /admin/projects?projects=sprint and optional project=slug | Sprint & Delivery view within AdminProjects; related task board and project selector. | Source-confirmed route/query. Kanban affordance requires repair and visual validation. | Header/context → selected project and task search/priority/assignee controls → board as primary work area → selected task/project detail drawer and relevant milestones/checklist. | Preserve keyboard stage movement, click/tap alternative, pending/rollback behavior and empty-lane targets. Horizontal board overflow must have a visible/discoverable affordance. |
| /admin/projects?projects=budget | Project budget versus recorded Finance expense context. | Source-confirmed. Finance semantics are protected. | Header/context → budget-specific filters and project selector → budget-versus-recorded-expense register → source explanation and secondary aggregate values. | Unit/currency and recorded-cost source stay clear; missing expense data is not shown as zero; long table scroll stays local. |
| /admin/projects?projects=archived | Archived/completed project register and details. | Content-first metrics are already moved after the main register in main. | Header/context → archive filters/search → archive register and details → historical summaries below. | Long client/project names and actions remain discoverable; viewport changes do not reveal a second page gutter. |
| /admin/tasks, taskscope=all/my/due/review/blocked/completed; board/table | TasksWorkspace; actual scope labels and a board/table switch are present. Task rows link back to project delivery. | Source-confirmed. Exact mutation/access outcomes require runtime tests. | Header and scope tabs → task search and priority/assignee/status filters → dominant board or register → task detail → linked project context and supporting totals. | Preserve query values and task/project links; each board action has a keyboard/touch alternative; scroll stays on the board or table rather than the document. |
| /admin/clients/all-clients, default directory | AdminClients; client search, active status scope, sortable table, paging and detail/edit entry points. | Main table already has an overflow-x-auto wrapper around its wide table and an outer clipped border shell. Summary strip is below the register on current main. SOURCE. | Header and client-context tabs → search/status filters and reset → client directory register → supporting metric strip → client relationship drawer when selected. | Horizontal table scrollbar remains discoverable; identity/contact/status/actions remain reachable at 320px without shrinking essential text. |
| /admin/clients/all-clients?scope=onboarding and client detail via client query/hash context | Existing directory's onboarding scope and client selection/detail panels; there is no separately confirmed duplicate onboarding store in this source. | Source-confirmed; detailed interaction flow BROWSER-UNVERIFIED. | Header → onboarding scope and search → client register or readiness workspace → selected client identity/status → contacts, interaction timeline, contracts, projects, retainer/SLA links, document/history context where implemented. | Selection survives URL reload where supported; details are structured and scroll internally; links keep canonical IDs and role access. |
| /admin/clients/lead-accounts | Legacy route redirects to the main Clients directory. The existing AdminClientLeadAccounts source file alone does not prove the separate route is still rendered. | SOURCE. Preserve compatibility behavior and avoid a duplicate client/CRM pipeline. | Redirect to Clients with valid query/hash preserved by existing logic. Do not add another primary module. | Direct entry and browser back/forward must be checked against the authenticated route guard. |
| /admin/contracts | AdminContracts; search/status controls, contract/SOW register, lifecycle actions and a shared Drawer form. Current content-first metric placement has already landed. | Source-confirmed. Lifecycle behavior and focus/scroll are BROWSER-UNVERIFIED. | Header/primary create action → search and status filters → contract register and lifecycle actions → supporting lifecycle metrics → shared drawer for create/edit. | Long forms scroll within the drawer; fixed footer, labels, validation, busy confirmation and focus restoration must work. |
| /admin/clients/retainers | AdminClientRetainers; reconciliation notice, relevant metric strip, tier/health filters, searchable agreement register and paging. | Existing content-first slice is in main. Source-confirmed. | Header → reconciliation caveat when applicable → tier/health/search filters → retainer agreement register → supporting metrics/period summary. | Never show unavailable usage as a valid zero; filters and wide rows remain usable at narrow sizes. |
| /admin/clients/sla-monitoring | AdminClientSlaMonitoring explicitly renders “No verified SLA telemetry source”, setup steps and a route to manage the commercial definition. | Honest unavailable state is SOURCE-confirmed. Do not replace with dummy metrics. | Header → clear unavailable explanation → prerequisite checklist → existing definition-management action. | The unavailable condition must stay distinct from zero SLA breaches and from request failure. |
| /admin/finance?tab=executive-summary or dashboard | AdminFinanceWorkspace renders Overview & Control and selected-period summary/controls. | Current Finance structure and business semantics are protected; values/reconciliation not browser-verified by this audit. | Five primary Finance area tabs → Overview & Control → selected period/status context → exceptions and key controls → meaningful source-backed summaries → drill-downs. | The selected report period is visible and readable; no proxy appears as reconciled cash or posted profit; source errors remain visible. |
| /admin/finance?tab=cash-bank, revenue, expenses, petty-cash | Transactions & Cash grouping; existing workbook and source-register render paths. | Source-confirmed; reconciliation and values must not be rewritten as part of the visual fix. | Primary Finance areas → worksheet tabs → reporting context and source caveat → transaction/cash register → selected record detail/actions. | Keep cash movement, issued invoice and reconciled statement distinct; tables scroll locally and retain row actions. |
| /admin/finance?tab=accounts-receivable, accounts-payable or vendors | Receivables & Payables grouping, with existing invoice/vendor bill/vendor-linked views. | Source-confirmed. Preserve canonical vendor IDs and existing Finance workflow. | Primary areas → relevant worksheet → period/status/search filters → receivable/payable register → due/status/payment details and linked canonical vendor/client. | Currency, due date, outstanding balance and status remain readable; no mutation or permission change. |
| /admin/finance/quotations and legacy /admin/proposals | Existing quotation UI is rendered using AdminInvoicing embedded in Finance. /admin/proposals redirects to the existing Finance quotation route. | Source-confirmed compatibility and ownership. No standalone quote store/workflow should be added. | Finance → Receivables & Payables → Quotations → searchable quotation register → existing detail/editor and supported invoice handoff. | Preserve quote ID, query/hash, conversion controls, permissions and browser history. |
| /admin/finance?tab=project-finance, operational-budget, project-allocation or team-fee | Project Finance grouping and individual existing worksheets. | Source-confirmed; margin/allocation formulas, mapping and accounting meaning are outside UI scope. | Primary areas → worksheet-specific context → the relevant linked project finance register/report → source-backed details and caveats. | Clearly distinguish budgets/commitments, recorded expenses, invoice and collection; don't infer final reconciled margin. |
| /admin/finance?tab=journal, chart-of-accounts, monthly-pnl, cash-flow, balance-sheet, monthly-closing or annual-summary | Accounting & Reports group. Existing source contains draft journal posting controls, report previews and period-closing controls. | Source-confirmed; financial meaning and controls are protected. Source/report reconciliation needs its own evidence. | Primary areas → worksheet tabs → period and source state → the worksheet-specific ledger/report/checklist → exceptions/control details and authorized actions. | Keep preview vs posted journal, cash proxy vs reconciled balance, and period close readiness distinct. No calculation, posting, period lock or permissions change. |
| /admin/team; view=capacity-allocation | AdminTeams; directory and capacity/allocation modes share the canonical Team workspace. Wide team tables use .ams-teams-table in a horizontal scroll wrapper. | Source-confirmed; a real Team-specific table variant exists and must survive cleanup. | Directory: filters/search/pod/status → people register/cards → supporting team metrics. Capacity: period/context and source-backed allocation measures → capacity work area/register → linked project/assignment details. | Table actions and last columns remain reachable; long lists have a single local scroll region; confidential rates remain gated by existing permissions. |
| /admin/vendors; view=skill-matrix | AdminVendors supports vendor directory and skill matrix; vendor/time are subareas within Team & Resources. | Source-confirmed. Vendor-detail drawer and content-first register are already on main. | Directory: filters/search → vendor register/cards → detail drawer → supporting snapshot. Skill Matrix: capability/coverage context → matrix/register → vendor/internal skill details. | Preserve canonical vendor link IDs, role-specific visibility, detail drawer scrolling and visible horizontal affordance where needed. |
| /admin/time-logs | AdminTimeLogs; new time-entry form, recent-entry ledger, filters/pagination and linked task selector. | Source-confirmed; tracked/billable metric relocation is already in main. | Header/add action → period/project/task/type filters → time-entry register → supporting totals → shared form/drawer. | Preserve exact task linkage; form never overflows short mobile view; submit/delete pending/error/confirmation and record access are preserved. |
| /admin/documents, documents=all/sops/legal/finance/hr/infra | AdminDocuments; tabbed private vault, search/sort, register/list, viewer/download and upload flow. | Source-confirmed. Table uses a min-width register inside overflow-x-auto; private storage flow protected. | Header and category tabs → search/sort and upload action → document register/list and clear empty/no-match/unavailable state → selected document preview and upload drawer as needed. | Horizontal table reaches last action column; row actions have accessible names; drawer/body scroll and private download path remain intact. |
| /admin/cms/projects | Case Studies register/editor. | Existing content-first slice is in main; source-backed content/publication behavior remains unchanged. | Header/create action → search/status filters → case-study register → shared editor drawer/detail. | Bilingual fields, publication status, loading/error, focus, and long fields remain accessible. |
| /admin/cms/services | Services register/editor. | Existing content-first slice is in main. | Header → search/category/status controls → services register → editor/detail. | Long labels, enabled/published state and table horizontal scroll remain visible; no CMS data invented. |
| /admin/cms/insights | Insights register/editor with bilingual content. | Existing content-first slice is in main. | Header → search/status filters → insight register → shared editing form/drawer and preview. | Draft/published status, form errors and focus remain readable in Indonesian and English. |
| /admin/cms/testimonials | Testimonials register/editor using the shared Drawer for multi-field edit. | Existing content-first slice is in main. Source shows a legacy component state name/modal-like variable, but rendered create/edit surface is Drawer. | Header → testimonial register → selected create/edit Drawer → confirm any destructive delete with shared confirmation. | Do not infer overlay type from state variable names; verify actual focus/scroll/pending behavior in browser. |
| /admin/cms/careers (jobs default for permitted job managers) | AdminCmsCareers; query selects jobs vs applicants; job register, search/status filters, create/edit/delete controls. | Source-confirmed and separate from applicant review. Public CMS hydration/CORS is an API boundary excluded from this task. | Header and Careers tabs → job filters/search → openings register → add/edit Drawer and destructive confirmation. | Public/published state stays truthful; editor remains within viewport and keyboard-operable. |
| /admin/cms/careers?tab=applicants | AdminCmsCareers applicant register/detail/notes/status, permission-specific view; same canonical lead/application source is queried then filtered to type=career. | Source-confirmed. Must remain the single applicant management workspace. | Header/tabs → applicant search/status filters → applicant register → selected applicant identity/status/files/notes/detail and supported actions. | Ensure user roles can only see controls already allowed; CV/private files and applicant details do not leak across permissions. |
| /admin/settings or tab=overview | AdminSettings system overview and server status, backup history, integrity and integration state where permission permits. | Source-confirmed; source status and privileged action controls are protected. | Header/global actions when authorized → state/error notices → system/backup overview and detailed register → supporting recovery context. | A failed request must not look like “no backups”; actions show real pending/error outcome. |
| /admin/settings?tab=security; aliases profile/rbac | Settings Access & security; current code normalizes profile/rbac to security and guards by current session capability. | Source-confirmed. Authentication/MFA/access policy is not to be altered. | Header/context → account profile and security sections → focused MFA/password/admin controls appropriate to current permission → confirm/descriptive states. | Keep sensitive controls accessible and readable without exposing restricted data; validate focus, unsaved/pending and direct-route behavior. |
| /admin/settings?tab=audit | Audit log/search/outcome filters/pagination. | Source-confirmed, including a separate explicit auditError empty state. | Header → audit filters → audit register → pagination; retain last-known-good entries and error notice when applicable. | Do not conflate failed request with empty history; wide log table scroll must remain inside its wrapper. |
| /admin/settings?tab=integrations; aliases branding/api | Integration and branding metadata state/configuration under current access checks. | Source-confirmed. No integration credentials or provider config may be changed here. | Header/context → grouped integration/branding sections → current state, editable metadata and existing save/error feedback. | Current status not color-only; form labels/errors/actions remain visible on narrow screens. |
| /admin/login?redirect=... | AdminLogin; root/body lock scrollbar/overflow on mount, cleanup restores prior inline styles; carousel auto-advances every six seconds. | Style restoration code exists, but route-transition/failure cleanup and reduced-motion/pause behavior have not been browser-tested. RISK, P1 for transition verification. Do not alter authentication/session flow. | Preserve approved copy and form → optional carousel controlled by visible accessible controls → short-viewport-safe composition. Keep auth feedback distinct and scroll lock limited to the login route. | Test short/tall/mobile viewports, keyboard, reduced motion, load failure, focus and login success/failure/logout/return. A CSS lock must not leak to authenticated pages. |
| /admin/approvals | Actual src/App.tsx redirects directly to /admin/dashboard inside the protected route tree. Current navigation architecture says keep this legacy route protected and unlinked as DEPRECATED_PENDING while notifications/consumers remain. | SOURCE/DOC CONFLICT, P1 for route ownership clarification; no route/workflow modification in this task. | Keep current route behavior until the owner separately approves compatibility/deprecation migration. Keep approval records, audit and maker-checker protected. | Test existing notification/deep links and role access after a separate approved decision; visuals alone must not retire it. |
| /admin/crm, /crm, /admin/proposals, /admin/invoicing, /admin/executive and wildcard fallback | Compatibility redirects or fallbacks are declared in App.tsx; the old Proposal destination resolves to Finance quotations. | SOURCE. Preserve routing and query/hash behavior; do not add duplicate primary modules. | Keep canonical owner destinations and valid existing links. | Direct-entry, reload, browser back/forward and authorized-route checks are still required. |
| /admin/navigation/live-activity and /admin/navigation/release-readiness | Routes render AmsNavigationPlaceholder kinds activity/readiness, not the full intended module implementations. | Source confirms placeholders; exact product availability is not established by docs alone. TARGET/placeholder status. | Do not represent these as complete features or build decorative fake telemetry. Show truthful existing placeholder behavior until separately scoped. | Make sure direct access remains under existing route guards; avoid implying production readiness from a placeholder. |
| Shared shell, contextual tabs, command palette, reporting period, Drawer, Modal, ConfirmDialog, menus/popovers/toasts | Layout and components are shared across module routes. AdminWorkspaceNavigationContext injects tabs around the header through shared page-shell primitives. | Shared ownership is source-confirmed; the render tree and computed layout need actual browser evidence. Risk of accidental duplicate gutter/header or focus/scroll regression if changed in one-off page CSS. | One shell owner for outer gutter/main scroll → one module header → one contextual tab layer → local control row → task-specific primary work area → supporting content. Use shared overlay primitives. | Test all changed consumers, not just the route initiating a shared CSS change. Focus, body lock, scroll restoration and active query state must survive transitions. |

### Structural redesign decisions grouped by root cause

1. Shared shell and page geometry (P0 to validate): the authenticated shell clips its outer frame intentionally and the main element owns primary vertical scrolling; sidebar and mobile drawer navigation have justified independent scroll owners. Keep those constraints until a measured browser reproduction proves one is wrong. Do not bulk-remove overflow rules. Confirm the root/body horizontal overflow is not masking a child-width defect. Use min-width:0 and min-height:0 at the correct flex/grid boundaries, not arbitrary fixed heights.
2. Horizontal-scroll affordance (P1): global thumb styling uses a very subtle line color; overflow-x-auto overrides it with another color/size, while topnav and several Kanban selectors explicitly hide their scrollbars. Correct those style rules to one coherent, visible policy. Retain local horizontal overflow wrappers for wide tables/boards and maintain local scroll chaining boundaries. Do not promise identical native scrollbar rendering across OS/browser.
3. Table selector specificity (P1): current src/index.css explicitly says table variants should use scoped selectors instead of !important, but table-related !important overrides remain. Actual consumers confirmed: .ams-projects-table in AdminProjects, .ams-teams-table in multiple AdminTeams table workspaces, and .settings-system-table in AdminSettings backups/audit/access tables. Keep each intentional variant's geometry and remove CSS-specificity workarounds in a bounded slice. Preserve .ams-table-actions and .ams-table-action behavior used by multiple modules. Keep the print-specific !important rules in the print stylesheet because their purpose is separate.
4. Inbox ownership (P1): AdminInbox refresh filters career submissions out, active tab validation excludes jobs, and App redirects the legacy view=jobs route to CMS Careers Applicants, yet an Inbox Candidate pipeline board branch and related candidate copy/actions remain in the file. The safe target is one applicant workflow in CMS and no candidate pipeline in Inbox. Treat removal as a separate frontend slice with regression tests; do not modify the canonical applicant API/data.
5. Repeated metrics/content order (P1): prior content-first changes for Inbox, Projects, Clients, Contracts, Team, Time Tracking, Vendors, Documents and CMS are already in main. Re-audit those current source diffs rather than reapplying the old card relocation. Focus on remaining routes/states and any new regressions.
6. Truthful availability and record context (P1/P2): SLA monitoring properly states telemetry is unconfigured. Finance must maintain the current distinction among invoice value, cash collected, recorded expenses, posted journals and reconciled balances. Continue preserving no-data/no-match/unavailable/error differences.
7. Overlay/route behavior (P2): login, mobile drawer, shared Drawer/Modal and contextual-tab injection all have nontrivial ownership/lifecycle. Do not refactor them from CSS inspection alone; verify focus/scroll restoration at runtime.
8. Retire legacy CSS/UI only with proof (P2/P3): document all consumers and keep valid compatibility routes/data. The approvals route discrepancy requires product/route-owner decision outside a visual-only cleanup.

### Scroll ownership map and acceptance

| Region | Intended axis / owner | Current source evidence | Required action and proof |
|---|---|---|---|
| html/body/root | No accidental document-wide scroll in authenticated shell; horizontal overflow must not be silently hidden. | src/index.css sets html scrollbar-gutter: stable and smooth scrolling; body has overflow-x: hidden. | First inspect DOM scrollWidth/clientWidth and computed styles in browser. Fix offending child width before retaining body clipping. Keep stable gutter only if no duplicate blank gutter/jump is measured. |
| Authenticated shell | Outer frame clips to viewport; main owns primary vertical page scroll. | AdminLayout root uses h-screen + overflow-hidden; .ams-shell also overflow:hidden; main has h-full/min-h-0/overflow-y-auto. | Preserve intentional clipping. Verify only one visible primary vertical scrollbar and no double-gutter/blank strip at 1440, 1024, 900, 768, 390 and 320. |
| Desktop sidebar | Independent vertical scroll for long navigation, with pinned top brand and bottom profile. | Sidebar inner nav is flex-1/min-h-0/overflow-y-auto/custom-scrollbar; outer aside clips. | Keep nav footer stable; verify long nav by keyboard, wheel and touchpad plus focus visibility. |
| Mobile nav drawer | Body/background lock plus independent navigation-content vertical scroll; header/footer remain fixed inside drawer. | AdminLayout's effect snapshots/restores body overflow; drawer is fixed/inset; inner panel is 100dvh/overflow-hidden; nav region flex-1/min-h-0/overflow-y-auto. | Test reaching the last nav item at 320/390px; Escape, close button and navigation must restore prior focus/body overflow; no lock leaks on route unmount. |
| Main page content | Single vertical scroll owner under sticky topbar. | AdminLayout main uses overflow-y-auto; ams-content and page shell use min-height constraints and one outer gutter owner. | Verify route changes preserve sensible scroll position; no nested page scroll except a declared register/board/detail region. |
| Module/context tabs | Horizontal overflow inside AdminSectionTabs; every tab remains discoverable. | AdminSectionTabs adds overflow-x-auto and ams-topnav-scroll; current CSS hides scrollbar for that class. Tab items use NavLink and visible focus-ring utility. | Make the scrollbar visible where supported, ensure focused/off-screen tab can be reached, auto-reveal active/focused tab where needed, and test keyboard focus traversal. |
| Wide data tables/registers | Horizontal scroll on their nearest wrapper, never on the entire document. | Projects, Team, Clients, Documents, Careers and Settings have wide minimum-width tables inside overflow-x-auto wrappers; some shell elements clip overflow. | Standardize thumb/track style, test first/last columns and actions, keep sticky headers/focus rings visible, and ensure wrapper can receive keyboard/touch input where needed. |
| Kanban/board | Horizontal board/lane overflow handled by board owner; vertical content remains scrollable without making a page-wide strip. | .ams-kanban-scroll and .ams-project-kanban-board/.ams-project-kanban-task-board explicitly hide scrollbars. Tasks and Projects also expose non-drag board/table or keyboard controls in source. | Stop hiding essential board scrollbars. Preserve drag handles, keyboard movement, click/touch alternatives, empty lane and pending/revert feedback. Verify board owners directly in browser. |
| Drawer, modal, confirmation, detail pane | Scroll long body content internally; header/footer and focus semantics follow shared component guides. | Shared CSS has dialog overscroll containment; module code uses Drawer, Modal and ConfirmDialog. Reader panes may intentionally clip content. | Do not globally remove overflow clipping. Test long body, pinned footer, Escape/busy protection, backdrop rules, stacked overlays, focus trap/restore and background lock. |
| Login/carousel media | Login layout intentionally locks document scroll; internal crop/animation frames clip media. | AdminLogin snapshots/restores inline root/body overflow, scrollbarWidth and overscroll styles; its effect starts a 6-second carousel interval. | Test short viewport, load failure, reduced motion, keyboard and authentication transitions. Preserve intentional media clipping and auth behavior; only fix a reproduced leak. |

### Table CSS consumer register

| Selector group | Confirmed consumers | Safe target |
|---|---|---|
| .ams-projects-table | Project portfolio table in src/pages/admin/AdminProjects.tsx; min-width is wrapped with overflow-x-auto. | Keep its deliberate 42px header and multi-line/11px row padding as an explicit variant. Remove redundant !important without dropping the variant. |
| .ams-teams-table | Multiple tables inside src/pages/admin/AdminTeams.tsx: people directory and other Team/Resource views, with min-widths appropriate to each view. | Keep 44px header, 48px rows and responsive padding as an explicit Team variant. Remove redundant !important and preserve right/center alignment variants. |
| .settings-system-table | Backup, audit and account/access tables in src/pages/admin/AdminSettings.tsx. | Keep 44px headers and 48px body rows as a Settings variant; scope style without !important. |
| .ams-table-actions / .ams-table-action | Shared table actions are used by Clients, Documents and other shared-table surfaces. | Keep icon hit-area and compact action geometry, focus, destructive semantic color and primary state. Remove !important only where normal scoped specificity preserves behavior. |
| Print media rules | The print section around src/index.css lines 378–439 intentionally overrides screen layout during print. | Retain until an independent print-specific audit justifies a change; do not remove every !important globally. |

### Exact frontend implementation order

Phase A (this checkpoint): source and route inventory, this audit matrix, scroll ownership map and structural redesign map. No application code was changed before documenting this map.

Phase B (shared scroll policy): unify the CSS used by global scrollers, overflow-x-auto, custom-scrollbar, contextual tabs and Kanban boards. Stop hiding scrollbars on essential horizontal navigation/boards. Keep root/body/shell ownership constraints until live measurements verify a different owner is required. Add regression assertions for the shared policy where repository test conventions support it.

Phase C (table geometry cleanup): remove !important only from the scoped data-table variants/actions listed above; keep their explicit geometry and keep print rules untouched. Verify table width, row/header padding, alignment and button dimensions on Projects, all Team table variants, Settings, Clients, Documents and CMS.

Phase D (inbox ownership cleanup): after the scroll/table slice is stable, remove unreachable candidate-pipeline UI from Inbox if source-level regression coverage confirms that the only canonical applicant workspace remains CMS Careers → Applicants. Preserve the legacy redirect, the source API, authorization, record IDs and supported inquiry workflows. Do not change server state or data.

Phase E (remaining module-specific hierarchy): revisit every row in the route matrix, using new screenshot/runtime evidence for any actual defect. Do not duplicate the previous content-first work already in main. Keep each module's register/queue/board/report/editor composition task-specific.

Phase F (regression and delivery): run npm run lint, npm run build, npm run test, and GitHub Actions on the exact feature-branch HEAD. When an authenticated browser is available, capture before/after screenshots and run keyboard/scroll/overlay tests at 1440, 1280, 1024, 900, 768, 390 and 320px plus 200% zoom/reduced-motion checks. If browser access remains unavailable, list those checks as unverified. Do not merge or deploy without the requested release decision.

### Current verified state and outstanding work

- The baseline source commit and the latest main CI outcomes are recorded above.
- This section is source-level evidence. No authenticated module screenshot, computed overflow measurement, viewport test or keyboard/touch session was performed in this environment.
- Confirmed source defects to address first: essential tab and Kanban scrollbar hiding; conflicting table-related !important; candidate pipeline code remaining in Inbox despite current route/data filtering and Careers ownership.
- Risks that require browser reproduction before deciding a fix: body overflow-x hidden masking child overflow; scrollbar-gutter stable interacting with main-only scroll ownership; login scroll-style restoration across successful/failed auth navigation; mobile drawer and nested detail scroll.
- Protected behavior remains unchanged: no server/API/DB/auth/session/CSRF/MFA/RBAC policy/Finance formula/posting/payment/data-source/workflow/permission/dependency changes.
- GitHub branch created for isolated work: audit/ams-structural-uxui-2026-10-17, based on the refreshed main SHA 35bc936ef96972a233196d3f3c92b2e5bb24d2d7. This audit-document update is the gate before application-source edits.


## Implementation progress report · 17 October 2026

### Slice 1 · Shared scrollbar and table styles

- Files changed: src/index.css and tests/ams-scrollbar-and-table-regression.test.ts.
- Normalized global, .overflow-x-auto, and .custom-scrollbar thumb contrast and sizing around the muted/text tokens, with a visible hover state.
- Replaced explicit hidden-scrollbar rules for .ams-topnav-scroll, .ams-kanban-scroll, .ams-project-kanban-board, and .ams-project-kanban-task-board with thin visible scrollbars and consistent thumb styles.
- Added a reduced-motion media rule that disables root smooth scrolling.
- Removed screen-layout !important overrides from shared table actions and the Projects, Team, and Settings table variants. Their intended row/header geometry remains explicit. Print-only !important directives are retained.
- Deliberately kept body horizontal clipping, stable scrollbar gutter, shell clipping, and existing main/sidebar/drawer scroll ownership. Their effects require live computed-style and viewport evidence before changing.
- Added source regression checks for hidden scrollbar policies, reduced motion, and scoped table variants.

### Slice 2 · Inbox ownership

- Files changed: src/pages/admin/AdminInbox.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- Removed the unreachable Inbox job controls and duplicate Candidate pipeline board, along with the empty Starred candidate work panel.
- The Starred queue now uses a single-column register rather than reserving half of the layout for an empty candidate panel. Search copy refers to contact records instead of candidate reviews.
- Kept the existing career-record exclusion in Inbox, the legacy view=jobs redirect to /admin/cms/careers?tab=applicants, and the canonical CMS applicant list/detail workflow. No API, route, data, status transition, or permission code was changed.
- Added a regression assertion guarding the sole Careers applicant workspace and the compatibility redirect.

### Slice 3 · Context tab discoverability

- Files changed: src/components/admin/AdminModulePrimitives.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- AdminSectionTabs now checks the active link's bounding rectangle when activeKey changes and adjusts only that tab strip's scrollLeft when the selected item falls outside the visible area. It does not call scrollIntoView, so this logic does not deliberately scroll the page vertically.
- Added regression assertions for the active-link reference and horizontal reveal logic.
- Browser confirmation of tab behavior after deep-link loads, resize, focus traversal, and keyboard navigation is outstanding.

### Slice 4 · Login carousel motion control

- Files changed: src/pages/admin/AdminLogin.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- Added a localized, keyboard-focusable Pause/Resume control with a proper text label. Existing previous/next controls remain circular and unchanged in geometry.
- Automatic rotation starts paused when prefers-reduced-motion: reduce is active. A preference change to reduced motion pauses an active rotation. The interval and media-query listener are cleaned up with the effect.
- Kept login/authentication, session state, redirect handling, MFA, CSRF, and remember-device behavior unchanged. The carousel retains manual previous/next controls.
- The first attempt used Play/Pause icons, but the app's lucide-react import bridge does not export those names. CI exposed the issue, and the icons were replaced with localized text controls. The final source no longer imports unsupported icons.

### Validation state at the implementation checkpoint

At commit 881dd732baae439a561cc623cad7f3daf0a2e900:
- AMS Quality Gate: passed, run https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39050728048.
- AMS CI: running the production HTTP smoke test when last checked, run https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39050728056. Final validation for the updated audit-map commit must be checked separately.
- Additional direct source assertions passed for: no hidden-scrollbar rules left in src/index.css, no screen-table !important in the named variants, tab reveal references, login pause-control state/labels, preserved arrow-button geometry, and removal of the duplicate Inbox candidate board/group.
- The repository could not be cloned in this local execution environment, so local npm run lint, npm run build, or npm run test were not run. Do not present GitHub workflow results as locally executed commands.
- No authenticated browser, branch preview, computed-style inspection, viewport screenshots, or keyboard/touch session could be run here. No after-screenshot exists for the branch changes. Do not claim visual completion or WCAG conformance based on source checks.

### Changed-file inventory and protected-boundary review

Only these files were changed on this audit branch:
1. docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md
2. src/index.css
3. src/pages/admin/AdminInbox.tsx
4. src/pages/admin/AdminLogin.tsx
5. src/components/admin/AdminModulePrimitives.tsx
6. tests/ams-scrollbar-and-table-regression.test.ts

No server, API, database, migration, auth/session implementation, CSRF/MFA/RBAC policy, Finance calculation/accounting workflow, dependency, route definition, or production data-source file was changed. Existing URLs, permissions, and workflow behavior are preserved by code inspection and focused regression tests, subject to final CI and runtime confirmation.

### Remaining work and exact resume point

- Refresh Actions and verify that the final branch HEAD's AMS Quality Gate and AMS CI both finish successfully after this report is committed.
- When a legitimate authenticated browser session and branch preview are available, run the required viewport matrix: 1440, 1280, 1024, 900, 768, 390, and 320px. Check 200% zoom, reduced motion, keyboard, touch/trackpad/wheel, overflowing tables and Kanban, active query tabs, drawers/modals, login success/failure/logout, and scroll-lock cleanup. Capture before/after screenshots for every reproduced problem.
- Continue module-specific adjustments only where source evidence or browser reproduction supports them. Prior content-first slices in main remain the baseline; do not repeat them blindly.
- Reassess the remaining unreachable candidate-specific branches and status helpers inside AdminInbox.tsx only if compiler/test evidence or a fuller consumer search justifies that cleanup. The visible duplicate board/filter/empty group is removed; record filtering and CMS ownership remain protected.
- The route/documentation discrepancy for /admin/approvals remains intentionally untouched and needs a separate route-owner decision if behavior is to change.
- Current main baseline remains 35bc936ef96972a233196d3f3c92b2e5bb24d2d7 at the last refresh. This branch is for review only; no merge or deployment was performed.



## Follow-up checkpoint · Inbox route-state and scroll ownership · 17 October 2026

### Slice 5 · Remove unreachable recruitment states from Inbox

- Files changed: src/pages/admin/AdminInbox.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- Removed jobs from the InboxTab type and removed job-only branches from the view-state effect, status filter, bulk status transition/copy, CSV naming, header action labels, table headers/cells/pagination label, empty selection state, and confirmation dialog.
- The filter options now list only the enquiry/inbound states handled by Inbox. Hiring stages remain inside Website CMS → Careers → Applicants.
- Retained the source filter that excludes type=career records, the visible Careers Applicants link, the legacy /admin/inbox?view=jobs redirect in src/App.tsx, and the CMS Careers applicant list/render path. No route/API/data/status-transition/permission change was made.
- Added regression assertions that reject an Inbox jobs-tab type or activeInboxTab jobs conditional, verify the career filter and canonical CMS route, and preserve the compatibility redirect.
- Direct source checks on commit c43a42b0f7b7a34eaa82152bbe9bbcfa1bcb9224 passed. AMS Quality Gate passed at that SHA. AMS CI for that SHA was still running at the last recorded poll; verify the newer final HEAD below before claiming final CI success.

### Slice 6 · Single horizontal scroll owner for the Inbox table

- File changed: src/pages/admin/AdminInbox.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- The Inbox directory table had nested horizontal overflow: outer .ams-table-scroll and inner .overflow-x-auto. The inner feature wrapper now uses min-w-0 and the outer .ams-table-scroll is the sole horizontal owner.
- Added regression assertions for the single-owner structure and rejection of the inner overflow class.
- This corrects a concrete source-level nested-scroll risk. The actual browser scrollbar count, thumb visibility, horizontal action-column reachability, and touch/keyboard behavior still require runtime verification.

### Current branch QA and remaining work

- Latest branch head after the two follow-up slices and this document entry is to be read from GitHub Actions/branch metadata at the time of review. Check that exact SHA's AMS Quality Gate and AMS CI before further changes.
- No authenticated browser or branch preview was available. No viewport screenshots, computed-style checks, live wheel/touch tests or login/logout transitions were performed.
- Remaining source-only Career type guards in the Inbox reader were left in place as defensive rendering paths. The reachable Inbox navigation/type/state and directory list no longer advertise or expose a recruitment pipeline. Revisit the defensive detail guards only if a full source consumer audit demonstrates a safe, nonbehavioral cleanup.
- Main remains the previously confirmed baseline unless refreshed branch metadata reports otherwise. The audit branch is not merged or deployed.



## Follow-up checkpoint · Client financial metadata and SLA state · 17 October 2026

### Slice 7 · Preserve the distinction between recorded zero and missing data

- Files changed: src/pages/admin/AdminClients.tsx and tests/ams-client-detail-data-state-regression.test.ts.
- Added one presentation-level SLA state classifier shared by client filtering, directory row status, SLA counts, and compliance calculations. States now distinguish not configured, spend not recorded, healthy, near cap, and over cap.
- Exposed the existing SLA filter in the client directory filter toolbar, including a separate "Spend not recorded" state. Existing search, status scope, query state, API and record model remain unchanged.
- Directory rows and client detail drawer now show localized "Not recorded" / "Belum dicatat" when usage data is absent. A recorded numeric zero is still rendered as a valid zero. An absent cap is labelled "Not configured" / "Belum ditetapkan" rather than being formatted as zero.
- SLA compliance only compares configured caps where spend data is actually recorded. The KPI context identifies how many configured spend caps have actual recorded data. When some configured records lack spend data, the compliance KPI is not given the positive/success tone even when the observed subset exceeds the threshold.
- Cumulative billed value and its directory KPI now preserve incomplete-data status. The whole-client total is unavailable if one or more client values are missing or invalid, and missing billed values sort after valid amounts. A genuine zero remains numeric zero.
- Client CSV export leaves an absent cap/spend value blank instead of exporting a false zero. It still exports numeric zero as 0.
- The regression test covers missing versus zero in the drawer, SLA classification/filter/compliance, complete billed totals, missing values in sort order, and CSV semantics.
- No Finance calculation, persisted client fields, API payload, database, backend, authentication, permissions, workflow or route was changed.

### Validation evidence

- At commit af9b14e612e5d63f3c941ef162131d94a790cec3, AMS Quality Gate passed: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39051949535.
- At the same SHA, AMS CI passed: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39051949466. The workflow covered typecheck, regression tests, production build, security tests, PostgreSQL integration tests, dependency audit, packaged migrations and production HTTP smoke test.
- Source checks also confirmed: unrecorded spend has a distinct classifier and filter, only recorded spend enters the SLA-compliance denominator, incomplete billed totals return unavailable, missing billed values sort after valid values, and the CSV does not serialize absent SLA fields as zero.
- These results are from GitHub Actions. Local npm scripts and authenticated browser/visual checks were unavailable in this execution environment. No responsive screenshots or computed-style results are claimed.

### Resume point

Refresh the current branch HEAD and Actions after this documentation update. Then continue with route-specific source/browser QA only where an authenticated preview can demonstrate the problem. Highest outstanding validation remains browser-based verification of scroll ownership, responsive layout, table last-column reachability, active-tab reveal, client drawer scroll/focus restoration, and login/logout scroll-lock restoration. The /admin/approvals source/documentation discrepancy remains deliberately untouched. Do not merge or deploy this review branch without a separate instruction.



## Follow-up checkpoint · Settings availability, Inbox accessibility, and mobile Documents actions · 17 October 2026

### Slice 8 · Backup unavailable state is distinct from an empty history

- Files changed: src/pages/admin/AdminSettings.tsx and tests/admin-settings-module-regression.test.ts.
- Added a frontend-only backup-source error state separate from the general system overview error banner.
- When backup history is empty because the backup request failed, Settings now says "Backup status unavailable" and offers retry. The "No production backups found" state and Create Snapshot prompt appear only when the source response successfully returned an empty history.
- When a refresh fails after earlier backup rows loaded successfully, the prior rows remain visible and a warning says the entries are the last successfully loaded data. While refresh is in progress, existing rows remain visible with a refreshing message.
- Successful backup responses clear the backup-specific error. The server API, permissions, snapshot flow, integrity action and persistence behavior were not changed.
- Regression checks cover unavailable status, valid empty state, and preservation of previous rows.

### Slice 9 · Inbox starred action has semantic button behavior

- Files changed: src/pages/admin/AdminInbox.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- Replaced the star icon's direct click handler on a table cell with a real button. It exposes a localized name based on whether the record is starred, reports state through aria-pressed, and has visible keyboard focus.
- Existing canManageCrm authorization remains the guard. Unauthorized users receive a disabled control; the existing update handler/API call and row-selection workflow are preserved.
- Added a regression assertion for button semantics, accessible state, permission gating, focus style and the removal of the non-semantic cell action.

### Slice 10 · Mobile Documents action targets

- Files changed: src/pages/admin/AdminDocuments.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- Increased mobile Preview, Download and Delete buttons from 36×36px to 40×40px. All three now expose the design-system focus ring. Download remains disabled when no eligible URL exists, and Delete remains permission-gated.
- No private-file URL, secure download or deletion workflow was modified.
- A first regression assertion used a regex that stopped at the JSX arrow in the click handler, causing a test-only failure. The assertion was corrected to allow JSX expression content. The application change itself remained the intended 40×40px targets.

### Validation for combined source changes

- Commit 7f17d3501e3a30c6d4dd6ed0df7abca5eb02daaf passed AMS Quality Gate: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39052613323.
- The same commit passed AMS CI: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39052613329. This includes typecheck, regression tests, production build, security regression tests, PostgreSQL integration tests, dependency audit, packaged migrations and production HTTP smoke test.
- Those runs cover the combined Client, Settings, Inbox, scrollbar/navigation, login and mobile Documents changes at that source checkpoint. The follow-up audit-map commit still needs its own CI result checked.

### Current scope and remaining verification

- Files changed in the frontend slices remain limited to the AMS audit map, shared navigation primitive, main CSS, Clients, Documents, Inbox, Login, Settings, and their focused frontend regression tests.
- No backend/server, API contract, database/migration, auth/session, CSRF/MFA/RBAC policy, Finance formula, dependency or production data-source file was changed.
- The editor for client records still initializes optional SLA fields as zero when opening an edit form and serializes zero on save. This was not changed because it can affect persisted payload semantics and needs a separate approved data-contract/workflow review. The display, filter, compliance and export fixes described in Slice 7 remain frontend presentation fixes.
- Browser-based verification is outstanding: authenticated module screenshots, scroll ownership and last-column reachability at the required widths, keyboard/touch behavior, drawer/modal focus and scroll restoration, login success/failure/logout style-lock cleanup, and native scrollbar behavior in another browser engine. The source checks and CI do not substitute for these runtime tests.
- Repository main was last verified at 35bc936ef96972a233196d3f3c92b2e5bb24d2d7. Refresh main and the review branch before any future release decision. This branch remains unmerged and undeployed.



## Follow-up checkpoint · Team & Resources unavailable-data states · 17 October 2026

### Slice 11 · Distinguish missing time/project data from recorded zero activity

- Files changed: src/pages/admin/AdminTeams.tsx and tests/team-resource-data-availability.test.ts.
- Member allocation status now checks time-log source availability before calculating tracked-time status. When the source is loading or failed, it displays "Loading time data" or "Time data unavailable", returns an unknown percentage, and does not label all members as "No time logged".
- Team Directory status filtering now includes an explicit unavailable option. The existing "No time logged" / bench filter matches only the state computed from a successfully loaded time-log collection. Leave status remains visible even when time logs are unavailable, while the tracked percentage is shown as unknown.
- Table, grid, profile drawer and allocation drawer show an em dash for unknown workload percentages and neutral status styling rather than treating an unavailable source as 0%.
- Team Directory summary context now distinguishes unavailable/loading time logs from "without entries". CSV export writes "Unavailable" for tracked hours when the source was not loaded, while a real, successfully loaded zero remains zero.
- Project assignment counts, pod/focus labels, detail panels and allocation drawer now distinguish an unavailable project source from an actual empty assignment list. Project counts show an em dash with a source-specific message instead of 0.
- Capacity history and upcoming allocation rows now distinguish unavailable/loading sources from 0% utilization or "No plan". The related CSV columns export "Unavailable" when the relevant source did not load. The future-plan empty-state explanation only appears after project data loaded successfully and no saved dated plans were found.
- Added focused regression tests in tests/team-resource-data-availability.test.ts. They check source ownership, filter behavior, unknown values, CSV output, and the separation between unavailable sources and valid empty/zero states.
- No time logs, project assignments, saved resource allocations, backend behavior, API contracts, formulas, permissions or data model were modified.

### Validation at the Team & Resources source checkpoint

- At commit 44aa4df8a491600cd1af371be965324bdfcbf13e, AMS CI passed: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39053344590.
- This is CI evidence for typecheck, regression tests, production build and the broader AMS CI workflow. AMS Quality Gate for that exact SHA was still pending at the last poll; it must not be described as passed unless its run later reports success.
- Source-level assertions on that SHA passed for: unknown workload percentage, explicit unavailable filter, project counts and allocation rows showing unavailable, capacity CSV not emitting false zero/no-plan, and source-gated empty-plan messaging.
- No authenticated browser preview, computed-style inspection, or mobile/keyboard/touch screenshot was performed. Visual QA for Team tabs, the resource table and the allocation drawer remains outstanding.

### Resume point

After this documentation update, fetch the current branch HEAD and check the exact SHA's AMS Quality Gate and AMS CI. The review branch remains separate from main, with no merge or deployment. Next visual verification should focus on the seven required viewport widths, table horizontal reachability, filter behavior during source failure/recovery, and scroll/focus restoration in resource drawers. Do not change the protected data contracts to simplify the unavailable-state presentation.



## Follow-up checkpoint · Documents vault unavailable and access-denied states · 18 October 2026

### Slice 12 · Separate a genuinely empty vault from a failed document request

- Files changed: src/pages/admin/AdminDocuments.tsx and tests/ams-scrollbar-and-table-regression.test.ts.
- Initial document load or refresh errors now use a dedicated "Documents unavailable" state when there are no previously loaded records. The UI does not present the vault as empty and does not encourage an upload based on a failed request.
- For transient service failures after successful data has loaded, Documents retains the last-known-good list and shows an error/retry notice stating that the visible rows are the last successfully loaded data. During refresh, loaded rows stay visible with a refresh status.
- Access failures are handled differently from transient service failures. When either the initial or retried request reports 401/403, the list is cleared and private detail/delete selections are reset so stale private records do not remain visible after a session or permission failure. The existing retry for transient 401/502/503 responses is preserved.
- Successful empty responses still use the genuine empty-vault message and may show Upload when the current user's existing permission allows it. Search/filter no-match messaging remains separate from the empty-vault state.
- Regression tests now cover the empty-vault versus unavailable state, retaining loaded rows on transient failures, clearing rows after access denial, and clearing private detail/delete state on access failure.
- No API, document payload, storage, permission policy, backend route or server behavior was changed.

### Validation at the Documents follow-up checkpoint

- At commit 84c86652ea13eedf8242c41592d2775f8a054d11, AMS CI passed: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39053725106.
- At the same SHA, AMS Quality Gate passed: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39053724975.
- Focused source checks confirmed: the unavailable state takes precedence over the empty-vault state; transient failures retain last-known-good rows; access failures clear cached rows and selected detail/delete targets; mobile document actions remain 40×40px with focus styles.
- These checks were run by repository CI. Authenticated browser-state testing and screenshots were not available, so exact rendered layout, real 401/403 navigation behavior and focus/scroll restoration still require visual/runtime verification.

### Resume point

The exact source HEAD verified here is 84c86652ea13eedf8242c41592d2775f8a054d11. The branch remains 50 commits ahead of main and 0 commits behind the checked main baseline 35bc936ef96972a233196d3f3c92b2e5bb24d2d7. Refresh both branch references before any later delivery decision. Nothing in this checkpoint is merged to main or deployed.

## Follow-up checkpoint · Nine-module source sweep and responsive interaction consistency · 18 October 2026

### Coverage rule

This checkpoint completes a source-backed pass across all nine primary AMS modules. It distinguishes pre-existing content-first changes already present in `main` from new follow-up changes in this review branch. A file does not need an artificial edit merely to claim that its module was reviewed; verified source structure and regression coverage are recorded instead. Business workflows, API contracts, permissions, persistence, authentication, database behavior, and Finance calculations remain outside this UI-only change.

### Module-by-module disposition

| Primary module | Source-backed review and disposition in this sweep |
|---|---|
| Dashboard | The overview metric grid now uses two columns from 390px instead of waiting until the general small-screen breakpoint; the invoice/expense chart legend remains visible and wraps on narrow screens. Live-data-unavailable labels and chart source descriptions remain intact. |
| Inbox | The earlier branch slice removes the unreachable applicant pipeline and keeps recruitment review in the canonical CMS Careers workspace. Star toggles retain proper button semantics, state announcement, keyboard focus, and permission gating. |
| Projects & Tasks | Projects keeps its source-backed portfolio table ahead of supporting metrics. Tasks now places the primary filtered queue/register ahead of KPI and team workload summaries so daily work is reached first. Compact table/board action controls have a shared minimum target size and visible keyboard focus. Task lifecycle, source mapping, and mutation behavior are unchanged. |
| Clients | The earlier branch slice preserves missing-versus-zero distinctions, incomplete totals, spend/SLA availability and CSV behavior. The register remains ahead of supporting metrics; no client data contract or save payload was changed. |
| Finance | The current worksheet remains the active work surface with source error/stale-record notices and no inferred values for failed sources. Shared table-action target/focus styling applies here as well. No accounting rules, formulas, permissions, or financial persistence changed. |
| Team & Resources | The earlier branch slice distinguishes unavailable project/time sources from real zero activity across Team, Vendor, capacity and time-log views. Directory/register context and existing retry paths remain source-backed; shared table target/focus styling applies. |
| Documents | The earlier branch slice distinguishes an empty vault from a failed request, retains known-good records during transient failures and clears private selected/deletion targets on access denial. The register remains before the upload area; mobile actions use 40px controls. |
| Website CMS | Insights block movement/removal controls now use supported icon-bridge exports, 36px controls and visible focus. Testimonials deletion uses the shared ConfirmDialog with the affected author and impact stated. Careers continues to own both openings and applicants; CMS data and publication logic are unchanged. |
| Settings | The earlier branch slice distinguishes backup status unavailable from a genuinely empty backup history, retains known-good rows on transient failures and handles access denial separately. Shared table target/focus styling applies to system tables. Security policy and privileged actions were not altered. |

### Cross-module interaction consistency

- Table action buttons and links with compact 32px utility classes receive a 36px minimum target on desktop and 40px on screens below 640px. Compact task-board actions follow the same rule. Focus-visible outlines use the existing AMS accent token.
- Added `tests/ams-nine-module-workspace-regression.test.ts` as a source-level regression matrix covering all nine primary modules, key content ordering, source availability messaging, canonical Careers ownership, and shared touch/focus affordances.
- The Tasks, Dashboard, CMS Insights, Testimonials, stylesheet, and audit-map changes remain limited to presentation, control affordance, and test/documentation surfaces. No backend, API, database, authentication/session, RBAC-policy, Finance calculation, dependency, or migration changes were included.

### Automated validation

At source commit `53edaaa063c649a0b1a840aa9ac56dac58848314`, both workflows completed successfully:

- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39054972582): type check, security regression tests, PostgreSQL integration tests, production build, and production HTTP smoke test passed.
- [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39054972524): typecheck, regression tests and production build passed.

These runs validate source commit `53edaaa063c649a0b1a840aa9ac56dac58848314`, before this documentation-only checkpoint. Re-read workflow status for the resulting audit-map commit before treating that later SHA as validated.

### Remaining acceptance checks

Automated tests do not establish visual or interaction correctness in an authenticated browser. The remaining acceptance gate is to inspect all nine routes and their contextual tabs at 1440, 1024, 768, 390 and 320px; verify last-column reachability, horizontal scroll discoverability, native scrollbars, keyboard/touch interactions, drawer and dialog focus/scroll restoration, and login/logout scroll-lock cleanup. This runtime verification has not been claimed or substituted by CI. This audit branch remains separate from `main`; no merge or deployment is implied by this checkpoint.


## Follow-up checkpoint · Direct-to-main delivery and cross-module scroll access · 18 October 2026

The nine-module source sweep was fast-forwarded directly to `main` at `c9768dfd4eefd81f614162d6812b7538bd047a17`. The implementation has since continued with direct pushes to `main`; earlier checkpoint sentences describing the audit branch as unmerged are historical, not the current delivery state.

This follow-up makes primary horizontally scrollable registers and boards keyboard-focusable and exposes each as a named region across Dashboard, Inbox, Projects, Tasks, Clients, Finance, Team & Resources, Documents, Website CMS and Settings. The main content scrollbar now reserves a stable gutter, increases Chromium/WebKit scrollbar geometry from 6px to 8px, and adds a visible keyboard-focus outline to horizontal scroll regions. These are presentation/accessibility changes only.

Regression assertions now cover the scrollbar geometry, last-row register scroll affordances, and named keyboard-accessible data regions. Authenticated browser/device acceptance checks remain outstanding: verify actual appearance and last-column reachability at 1440, 1024, 768, 390 and 320px, keyboard/touch scrolling, theme behavior, and drawer/dialog focus and scroll restoration. No browser-level pass is claimed by this source checkpoint.


### Data availability states in Inbox, Team & Resources, and Settings · 18 October 2026

- Inbox now persists a load-error state, exposes a retry alert, retains the last successful records after refresh failures, and avoids presenting a failed source as an empty/live queue.
- Vendor, vendor-skill and time-log descriptions now disclose when live sources are unavailable; retained last-known-good records are identified rather than framed as current live totals.
- Settings summary cards distinguish unavailable backup/security status from a real “No snapshot” or a verified zero-user value. Retry paths remain tied to existing status APIs.

These changes address display-state interpretation and recovery only; they do not alter endpoints, persistence, permission checks, business calculations, or security settings.


### Finance table geometry parity · 18 October 2026

The shared Finance register renderer uses the existing `ams-finance-table` design-system variant. Row density and compact action hit-target rules apply consistently to each worksheet using that renderer rather than relying on generic table defaults. This is a frontend presentation-only correction; record data, sort/pagination behavior, accounting calculations, authorization and API contracts are unchanged.

## Full structural redesign execution checkpoint · 18 October 2026

This checkpoint continues the existing source-backed nine-module content-first work. It does not mark the full redesign complete.

### Direct-to-main implementation slices

- Dashboard overview (118dec382792eb4f3ec458733dc135292d180c7c): retained all eight existing KPI values but made four operational measures primary. Supporting finance, utilization and budget indicators now follow the invoice-versus-expense chart and delivery distribution, before the active-project register. No metric source, calculation or label meaning changed.
- Scroll ownership (8a1f11e06f6fb4a58b1d8f5a794e27250f2dd71c): document-level html now uses automatic scrollbar gutter while .ams-shell > main remains the stable vertical workspace scroller. Added regression coverage for duplicate gutter reservation.
- Client Retainers (5566448291eee09ff3db765f24f19ac69176db71): moved the existing KPI strip after filters and the agreement register. Existing records, warning context, filters, sorting, actions and permission checks remain unchanged.
- Time Tracking (49fc1a013372869ba4fc0a2f2338942aff6eee33): moved the multi-field time-entry form into the shared Drawer. The ledger remains the primary workspace; save, validation, unknown-outcome recovery, API payload and permissions are unchanged. The existing regression test was updated for the drawer interaction in d60f6708f27a518bfc43aab20ed5565d88d3bb64.
- Shared contextual tabs (af7868d9ea7c8038cac3d68fc48f4f65684030d5): primary and secondary workspace tabs now share compact 32px geometry and 11px labels. Primary navigation uses a restrained accent-tint selected state; secondary worksheet navigation uses a neutral selected state. Route matching, access filtering, active state and scroll-to-active behavior remain unchanged. The existing tab-style assertion was updated in ef41117ec845dddc9fc5e07e683a69b1fa973995.
- CMS Careers (f7b30ed829b0d152707acc50c518e7126731b7fe): Jobs/Applicants tabs now use the same compact height and label scale while retaining their role-specific visibility, counts, tab semantics, keyboard navigation, and query behavior.

### Automated validation evidence

- Quality Gate and AMS CI passed at f7b30ed829b0d152707acc50c518e7126731b7fe: typecheck, regression tests, production build, PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit and production HTTP smoke test.
- A prior failing test run was caused by an assertion that still expected the retired inline time-entry form and underline-style tabs. The implementation was retained; assertions were updated to reflect the intended frontend structure and rerun successfully.

### Current remaining scope

The redesign remains in progress. Continue source-backed structural review of every active module and subtab, including Dashboard Overview/Performance/Analytics; Inbox Overview/Client/Starred and its queue/review/table modes; Projects portfolio/Delivery/Budget/Archived and Tasks list/board; Clients directory/Onboarding/Contracts/Retainers/SLA; the five Finance primary workspaces and their worksheets; Team directory/Capacity/Skill matrix/Vendors/Time Tracking; Documents views; every CMS content type plus Careers Jobs/Applicants; and Settings overview/security/audit/integrations and other actual configured views.

The original Dashboard screenshot was not present as an inspectable repository asset in this execution context. The existing content-architecture guideline and prior source-backed reference analysis remain the available structural evidence. Do not claim screenshot reinspection.

Authenticated browser/device visual validation is still unverified. Before calling the redesign complete, inspect the live authenticated UI at 1440, 1280, 1024, 900, 768, 390 and 320px; check long tables/boards, last-column reachability, keyboard/touch scrolling, drawer/modal focus and scroll restoration, reduced motion, light/dark theme, and route/query-state stability. Source tests and successful CI do not substitute for those checks.


## Full structural redesign execution checkpoint · Shared topbar navigation and workspace stability · 18 October 2026

This checkpoint extends the earlier nine-module source sweep. It does not mark the full redesign complete.

### Direct-to-main implementation slices

- `3d7a489b4bc018ad876e4b1e749d2549aa54c918`: moved contextual module navigation from the page-header injection point into a persistent shell-owned navigation row immediately below the global topbar. The row is sticky in the main workspace and uses the canonical `AdminSectionTabs` component, preserving role-filtered destinations, route/query active state, and horizontal scroll-to-active behavior.
- `ddc009ce7d5bee2ad7fbfd182257d5c8f865fc7b`: added Inbox and Documents to the shared contextual navigation, using their existing `view` and `documents` query state. Removed their duplicated page-local tab bars so one visible control owns each destination.
- `b49ff9d3a9d512846848c073f8ce5fc5881c2e20`: updated source-level regression assertions that still required Inbox tabs to remain inside the old page body. The first test run on the navigation migration exposed those stale assumptions; the test expectations were corrected to verify shell-owned navigation instead. CI and Quality Gate then passed.
- `caca1b7295fe17c17bb443da24884f931d9ddb24`: removed Finance's conditional two-column/stacked worksheet-navigation layout. Worksheet navigation now uses a consistent responsive row, with the contextual search aligned to the right on desktop when that worksheet supports search. Finance calculations, worksheet keys, source data and permissions were not changed.
- `cb4f054389b3a518fb93723f336399ddc3ff02cd`: removed the duplicate Services count from the CMS page header, leaving the filtered result count adjacent to the register controls. Removed an unused Settings tab import. Added a source-level regression assertion for the Services count location.

### Automated validation

- [AMS CI for shared topbar navigation regression update](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103165387): passed.
- [AMS Quality Gate for shared topbar navigation regression update](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103165318): passed.
- [AMS CI for stable Finance worksheet navigation](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103329454): passed.
- [AMS Quality Gate for stable Finance worksheet navigation](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103329479): passed.
- [AMS CI for CMS count cleanup](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103476072): passed.
- [AMS Quality Gate for CMS count cleanup](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103476052): passed.

These checks validate typechecking, regression tests and production build as configured by the workflows. They do not establish authenticated browser-level visual correctness.

### Current state and remaining acceptance

The shared topbar navigation now covers Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS and Settings through the actual route/subnavigation mapping. Finance retains its secondary worksheet navigation inside the Finance workspace; Careers retains its Jobs/Applicants tabs within Careers. These are distinct navigation levels, not duplicated primary destinations.

The Dashboard reference image from Google Drive still has not been rendered by the available browser/fetch environment. The Drive permission may be correctly configured; this execution environment's inability to render it is not evidence of an access-setting problem. Do not claim that the screenshot has been inspected.

Continue the full module-by-module structural pass and verify every active subtab, data state, drawer/modal, table/board and narrow-width layout. Authenticated browser/device validation at 1440, 1280, 1024, 900, 768, 390 and 320px remains outstanding. Keep all changes frontend-only and commit directly to `main`; do not declare the redesign complete based only on passing CI.


### Settings context clarity · 18 October 2026

- `8153fc69d2190cd4b2bb2cdd6882585b511ac8d0`: the Settings header description now follows the selected topbar workspace, explaining system readiness, security, audit review, or server-managed connections/public metadata as appropriate. This changes presentation copy only.
- `ad1d241283fe417a8e2ff16bd6631c4a0b0171f5`: regression coverage now describes Settings tabs as shell/topbar navigation and checks the contextual header descriptions.
- [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103613440) and [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103613434) passed for the resulting source commit.

The next work remains module-specific content hierarchy and responsive interaction review. The screenshot reference remains unverified in this environment, and authenticated browser visual acceptance is still outstanding.


### Register-first workspace pass · Projects, Clients, Team & Resources, Time Tracking, and Finance · 18 October 2026

- `0d7fd077a7b0ed5cbf30074089e05d77ab837d25`: moved active-project and archived-project KPI strips below their primary portfolio registers. Corrected regression expectations so the test title and actual content hierarchy agree.
- `f73cfacc1d2889aee0c4f4590635b1cd74a97ff7` and `66c233b33d9bb67c7db5d6c881cae9e90b23301d`: moved client account metrics after the searchable directory and pagination. The first quality-gate run surfaced a second stale ordering assertion in the general page regression suite; that assertion was corrected to verify the directory-first hierarchy.
- `af4517c7cc63a57d2874ebb61351b1945ef26427`: moved Team Directory, Team Vendor Directory, and the Team workspace Time Tracking summaries after their primary registers. This slice was re-applied from the clean parent source after an initial JSX transformation error; the resulting source passed typecheck and the subsequent corrected test run.
- `b1a4211e04fd16b6178c0315c632c74025261204`: replaced the inline New Time Entry panel in Team & Resources with the shared Drawer pattern, keeping form fields, validation, save action, and permission guard intact. The standalone Time Tracking page already uses a Drawer.
- `f7b72f17ded0d5f8c611e86580529ff6b740fefa`: moved Finance Cash & Bank, Accounts Payable, and Petty Cash KPI strips below their primary registers while retaining reconciliation notes, payment schedule and linked payment workflows in place.

### Validation for the register-first pass

- [Project portfolio/archive order · AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103813371) and [Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39103813305): passed.
- [Team/time drawer and summary order · AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39104413800) and [Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39104413791): passed.
- [Finance register-first order · AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39104607254) and [Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39104607318): passed.

The main content rule for directory and transaction views is now explicit: filters and the actionable register come first; supporting KPI summaries follow the register unless the view is intentionally analytical (for example, Dashboard, P&L, cash-flow analysis, or allocation configuration). The existing vendor snapshot placement in the Finance-embedded Vendor Directory is intentionally preserved as its own summary-led workflow.

Authenticated visual E2E review remains outstanding. Continue checking the remaining subtabs and responsive states before declaring completion.
