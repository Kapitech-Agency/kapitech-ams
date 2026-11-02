# AMS Shared UI System — contract and implementation preparation

**Updated:** 2 November 2026. **Visual reference:** the approved Dashboard → Overview. **Scope:** all nine AMS modules; presentation, interaction and component architecture. This document does not authorize changes to business rules, source data, permissions, Finance, auth or backend contracts.

The Design System owns tokens and exact geometry. This document owns component selection, composition, lifecycle, cleanup and adoption. The master/module specifications still own workflow meaning. A component in a specification is not proof of a persisted capability.

## 1. Architecture and ownership

1. `src/index.css`: semantic theme tokens, base input/table/overlay styles, shared overlay geometry. Use existing dark/light variables; do not create another theme.
2. `src/components/ui`: low-level reusable behavior: button, select, date/period controls, skeleton, portal, drawer, modal and confirmation.
3. `src/components/admin/AdminModulePrimitives.tsx`: page shell, navigation, header, panels, metrics, notice, status, table surface and pagination. `AdminModuleHeader.css`, `OperationalWorkspace.css`, `AdminFilterToolbar.css`, `DashboardControls.css` and `DashboardEmptyState.css` own their respective reusable geometry.
4. `src/components/charts/DashboardCharts.tsx`: existing chart primitives. Dashboard-local SVG compositions remain domain views until extracted with a second real consumer.
5. Domain compositions live beside their workspace: Inbox reader/templates, project records, task records. Compose shared primitives; keep domain fields, source callbacks and permissions in the domain owner.
6. Pages assemble these layers. Page CSS may control grid, containment and supported view layout; it must not redefine shared control padding, heading geometry, overlays, tokens or status meaning.

Do not add a new UI framework, icon set, chart package, store, CSS-reset layer or parallel component directory. Preserve current import paths unless a migration updates every consumer and test in the same change. Dashboard-prefixed shared names remain canonical names; renaming them for appearance alone creates unnecessary compatibility code.

## 2. Required component catalogue

“Existing” means source exists and has an application consumer; it does not mean every workspace is visually accepted. “Compose” means use the existing primitives, not create another base component. “Extract on adoption” requires a real first consumer and reviewed second use before becoming a generalized API.

| Family | Canonical source / composition | Rules and availability |
|---|---|---|
| App shell and gutter | AdminLayout + AdminPageShell | Existing. One page shell; shell owns gutter and navigation placement. `ams-ui-workspace` enables shared control/empty-state styling throughout AMS. |
| Page header | AdminModuleHeader + AdminModuleHeader.css | Existing. Workspace geometry is the default (26/32 title, 23/29 below 600px, following Overview); one h1, optional contextual eyebrow/status, concise description, right-side actions, then navigation. Authentication screens use their own existing layout. |
| Navigation / worksheet tabs | DynamicAdminSidebar, AdminTopbarTabs, AdminSectionTabs | Existing. Explicit current key for query routes; one current link per group. Keep role gates, history and deep links. Crimson navigation differs from neutral filters. |
| Primary / utility / icon actions | DashboardControl | Existing. Use named variants/sizes; accessible icon name, disabled/pending state. Card actions require `ams-dashboard-card-action` inside `ams-overview-panel`; use the complete contract. |
| Form submit / cancel / destructive | Button | Existing. Preserve form, type, ref, loading and disabled props. A form submit and compact card action are named contexts, not competing design systems. |
| Segmented choices | DashboardFilterGroup | Existing. Neutral selected filter; no page-built pill rows. Navigation is not a filter. |
| Search + filter disclosure | AdminFilterToolbar + AdminFilterField | Existing. Search always visible; fields initially closed; count excludes search; state persists while closed; clear/reset uses caller-owned state. Three/four-column named compositions collapse at existing breakpoints. |
| Legacy filter adapter | AdminFilterBar | Still used by active Clients/Team/Documents/CMS screens. Not dead code. No new consumers; migrate each caller's search, filters, sort and reset together. Remove only at zero consumers. |
| Inputs / textarea / labels / help | Native controls with existing token classes | Existing controls, partial composition consistency. Use visible associated label, stable ID, error/help association, native required/disabled semantics. A reusable FormField is an extraction candidate; do not ship an unused wrapper or replace validation logic. |
| Select / option menu | CustomSelect + DropdownPortal | Existing. Preserve option values/disabled state, keyboard behavior, portal containment and accessibility name. Never infer authorization from a disabled option. |
| Date / reporting period | CustomDatePicker, CustomReportPeriodPicker, AdminReportingPeriodBar | Existing. Reuse date helpers and reporting context. Missing dates stay unknown; period changes do not change stored dates or business rules. |
| Checkbox / radio / switch | Native controls in existing forms | Compose. Visible labels, keyboard state and effective hit area. Extract a shared wrapper when adopted; do not restyle each page or change opt-in semantics. |
| Panels / sections | AdminPanel + Overview context | Existing. One outline per owning surface. No nested decorative cards. H2 title/actions share a row; dense records use quiet separators. |
| KPI / metric strip | AdminMetricCard / AdminMetricStrip | Existing. Real source, scope, period and unit; missing is not zero. No fabricated trend arrays or padding-only metrics. |
| Charts / distributions | DashboardCharts + source-backed domain compositions | Existing. Labels/units/legend, non-color evidence, empty/unavailable state and drill-down. No fabricated axes, denominators, capacity or financial totals. |
| Table / sorting / pagination | AdminDataTableShell + native table + AdminTablePagination | Existing. Embedded variant inside a panel; caption, column headers, aria-sort, named keyboard scrolling, stable keys. Pagination counts the actual filtered collection. |
| Responsive record cards | ProjectRegistryRecords / TaskExecutionViews / MessageWorkspace | Existing domain compositions. Same identity, source state and actions as the desktop view; do not create one universal business-record schema. |
| Board / Kanban | Existing task/project wrappers + record components | Compose. Stage comes from source; preserve drag handles and keyboard List alternative, read-only gates, pending state and rollback. Follow Kanban guidelines. |
| Empty / filtered-empty / unselected / unavailable | DashboardEmptyState | Existing. Approved compact Overview anatomy, appropriate copy and useful Retry/Reset/Open action. Unavailable reads cannot look like a valid empty source. |
| Loading / skeleton | Skeleton + caller aria-busy/status | Existing. Match destination layout; decorative skeleton is aria-hidden; preserve previous data on refresh when supported. |
| Inline feedback / notice / validation | AdminModuleNotice + existing field feedback | Existing notice; field feedback remains a composition/extraction candidate. Use text + tone, polite status for routine updates, alert for actionable failure. No fake success or swallowed server errors. |
| Toasts / notifications | AdminNotificationCenter + existing module feedback | Partial consolidation. Notification center is canonical for server notifications; local toast state is not a new event store. A toast presenter may be extracted with an actual consumer; do not add unused global state. |
| Create / edit / long detail | Drawer | Existing. Named size, body scroll, pinned footer, focus/return, busy dismissal block. Preserve source values and save/retry behavior. |
| Short detail / confirmation | Modal / ConfirmDialog | Existing. Use existing focus/overlay infrastructure; destructive consequence and exact record identity. Never use a modal for a long entry form. |
| Popover / dropdown / context menu | DropdownPortal + caller | Existing positioning primitive. Outside/Escape dismissal, anchor/return focus and named actions; do not implement another overlay root. |
| Person / avatar / profile | ProfileIdentity + UserAvatar | Existing. Only real supported identity opens profile; Unassigned is text. Use existing public-profile behavior, not a session-derived duplicate drawer. |
| Brand / icons | AmsBrandLogo + untitled-ui-icon-bridge | Existing. One approved icon family; no decorative WebGL effects in the operating workspace. |
| Files / uploads / document preview | Existing Documents and attachment compositions + Drawer | Domain composition. Access and MIME/size validation remain authoritative. Extract presentation only; never invent a file store, upload success or public URL. |
| Currency / numeric / status presentation | Existing currency helpers + AdminStatusBadge | Compose. Preserve currency, unit, rounding and source-owned meanings. Paid, posted, accepted, submitted and confirmed are different. |
| Command / timer / export / bulk action | CommandPalette, GlobalTimerControl, canonical domain callbacks | Existing domain/application flows. Reuse shared controls; preserve scope, selection, permission, concurrency and error behavior. |
| Editor / rich content / publishing | Existing CMS editor + shared controls/Drawer | Domain composition. Reuse safe rendering/sanitization and actual publish outcome. No new editor dependency during UI preparation. |
| Activity / audit / timeline | Existing Dashboard/Settings/domain records | Domain composition. Source actor/time/outcome, real dates and filtered scope; no fabricated history or scheduling. |

## 3. Universal interaction contract

Every adopted component/flow must specify: purpose and owner; typed input/output props; source versus local UI state; allowed actions; permissions; keyboard and focus; responsive layout; loading, valid-empty, filtered-empty, unavailable, stale, denied, validation failure, saving, confirmed success and retry states where applicable. Mark a non-applicable state explicitly instead of inventing UI.

- Hover, focus, pressed, selected/current, disabled and pending are distinct. Do not identify state by color alone. Navigation uses `aria-current`; toggles use `aria-pressed`/`aria-expanded`; sort uses `aria-sort`.
- Pending requests block conflicting submit/dismiss paths. Components emit callbacks; they do not grant permissions, recalculate Finance or invent persistence. Existing canonical refresh/rollback controls stay in the caller.
- Create/edit: trigger → shared Drawer → existing validation/save → authoritative response → refresh → visible result. Retry retains safe inputs. Delete: exact record → existing confirmation → pending → authoritative result. Bulk/export: show actual selected/filtered scope and preserve existing contract; do not silently change what gets exported.
- Lists: search/filter → sort → paginate the same authorized collection → inspect record → return to preserved context. Cross-module actions use canonical IDs and permitted existing routes.
- Dark/light semantic tokens, visible keyboard focus, reduced motion, long labels, zoom, safe-area-aware overlays and no document overflow are required. Verify at the existing 1280/1100/900/600/390px breakpoints, with 320px/zoom checks where the specific control needs them. Automated tests alone do not prove WCAG conformance.

## 4. Nine-module adoption matrix

| Module | Existing foundations / next bounded adoption | Business boundary |
|---|---|---|
| Dashboard | Approved Overview remains the reference. Shared actions/header/empty state/chart foundations already consumed. Keep its dense header/action variant and domain chart compositions. | Do not rework approved composition or fabricate KPI/history. |
| Inbox | Shared header/filter/reader/empty state and tabs. Follow-ups/templates remain source-backed domain compositions. | No fake support/client-request source, sending or routing persistence. |
| Projects | Shared header, Registry filters/records, task views, drawers and controls. Migrate remaining Planning/Resources forms/state presentation by owner. | No invented task lists/dependency edges, milestones, acceptance or Finance cost. |
| Clients | Shared shell/header/table/Drawer; migrate active legacy filter composition and local empty/form feedback next. Legacy lead-account route redirects to Clients. | Keep client identity/onboarding and existing contracts/retainer/SLA permissions. |
| Finance | Shared header/shell/overlays/pagination and current workbook surfaces. Review presentation worksheet by worksheet, preserving all existing callbacks/calculations. | No changes to formulas, ledgers, maker-checker, posting, bank state or locked periods. |
| Team & Resources | Shared shell/header/filters/Drawer/profile. Adopt disclosure filters and repeatable form/feedback patterns next. | Task counts are not hours/capacity; preserve assignments/time-entry/payroll permissions. |
| Documents | Shared shell/header/table/Drawer; review filter/field/file/preview presentation together. | Preserve private-vault access, versions, upload validation and signed/download behavior. |
| Website CMS | Shared shell/header/legacy filters/Drawer; adopt disclosure/filter and editorial feedback by content type. | Persisted draft/publication states, translation and sanitization remain authoritative. |
| Settings | Shared shell/header/tabs/overlays; retain active inline server readiness and security/backup/account behavior. | No auth/RBAC/CSRF/MFA/session/storage/cutover changes. |

This is a complete preparation/catalogue across modules, not a claim that all active legacy consumers have already migrated. Active legacy filters and domain-specific form/toast markup remain required until their replacements preserve the full flow. Do not delete them to make a migration count appear complete.

## 5. Implementation sequence and definition of done

1. Inventory actual consumers and affected routes, including literal lazy imports and portals. Classify existing, incomplete, missing, or target-only. Check current source and exact-SHA CI, not old screenshots.
2. Choose the existing component from the catalogue. If absent, write a small typed contract and implement it with its first real consumer; use existing tokens/behavior infrastructure. No unused library or production showcase/preview route.
3. Move geometry to the shared owner; migrate callers with their original source, callbacks, permission and state. Preserve approved Overview. New CSS must not append another workaround for an existing shared contract.
4. Verify semantic render, keyboard/focus, pending/error/retry, dark/light, narrow layout and adjacent/cross-module flows. Tests must exercise actual use; remove tests of deleted unreachable markup only when they are replaced with active-flow/compatibility coverage.
5. Remove the superseded component, imports, selectors and package only after zero consumers and route/data contracts are checked. Never remove a backend, model, access gate or compatibility redirect as UI cleanup.
6. Regenerate `npm run ui:audit`, review [inventory](ui/shared-ui-inventory.json), run `npm run ui:check`, full tests, lint and build, save local visual evidence, update checkpoint/gaps, push to main and verify both exact-SHA workflows. User visual acceptance remains its separate gate.

## 6. Cleanup evidence and safeguards

The 2 November cleanup removes five unreachable components: DataMigrationModal, ConvertToCrmModal, ProductionReadinessCard, UserProfilePublicDrawer and PatternWaves; PatternWaves.css; and the unreachable AdminClientLeadAccounts page. Active Settings readiness, ProfileIdentity, Clients compatibility redirect and CRM APIs/stores remain intact. Remove the unused `ogl` dependency. Business libraries retained for tests/contracts and TypeScript environment declarations are not unused visual design.

Remove 95 earlier CSS rules only when a later rule has the **same complete selector, declaration sequence, importance and ancestor media/supports conditions**. Keep the last copy and all fallback declarations; do not touch keyframes, layers, nested rules or different declarations. This reduces duplicate source while preserving cascade winners. It is not a claim that every old selector in GlobalExecutiveDashboard.css is dead. The remaining stylesheet contains live shell, Finance, Team, chart and approved Dashboard rules; its extraction must follow real-consumer visual checks.

`scripts/audit-shared-ui.mjs` follows static imports/re-exports/literal dynamic imports from `src/main.tsx`; it reports real component consumers, workspace compositions, stylesheets and exact duplicates. Dynamic class construction, authorization, persistence and visual correctness require separate review. The report never auto-deletes. Tests guard freshness, zero unreachable UI components, duplicate-rule safety, approved shared defaults and retained compatibility behavior.

## 7. Document alignment

Use this catalogue with [Design System](../AMS-DESIGN-SYSTEM.md), [frontend standards](AMS-FRONTEND-ENGINEERING-STANDARDS.md), [UX standards](AMS-UX-INTERACTION-STANDARDS.md), [Drawer](AMS-DRAWER-GUIDELINES.md), [Modal](AMS-MODAL-GUIDELINES.md) and [Kanban](AMS-KANBAN-GUIDELINES.md). Historical screenshots/counts and former Shadcn comparisons are not current design authority. Record an exception in the owning contract with its actual source/consumer and acceptance evidence; do not silently introduce a second rule.
