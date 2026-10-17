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

## Remaining visual verification and limits

Authenticated browser-level UX/visual testing was not performed in this environment. In particular, the 1440px, 1024px, 768px, 390px, and 320px viewport pass, actual keyboard/focus flow, direct-route/browser-history checks, drawer interactions, and permission-specific visual scenarios remain unverified in a live AMS session. CI verifies static/type/regression/security/build gates but does not replace those visual checks.

No frontend change is currently blocked by a backend requirement. The known visual-verification limitation is documented rather than inferred as a pass. The branch is ready for repository review; production deployment and live Hostinger verification have not been claimed.
