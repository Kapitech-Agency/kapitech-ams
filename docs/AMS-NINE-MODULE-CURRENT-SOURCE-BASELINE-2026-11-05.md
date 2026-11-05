# AMS Nine-Module Current Source Baseline

**Date:** 5 November 2026  
**Source commit inspected:** `4e183dfd49a79b0b2b6800e317672544299de687`  
**Scope:** Source-backed module/routing inventory, frontend audit triage and release gates. **Not** an authenticated browser, role-permission, production, or usability acceptance certificate.

## Executive assessment

All nine requested primary modules have an application route or route group and concrete React component owners in `src/App.tsx`. This supports **route/component presence**, not a claim that every workflow is functional or visually approved. Core JSX/TSX workspace files were inspected for basic presence of filters, error/empty handling, and domain markers. Such static markers cannot establish correctness, accessibility, usability, effective RBAC, data completeness or mutation success.

The latest documentation CI and Quality Gate run observed at this source checkpoint succeeded; AMS CI on `4e183dfd` was pending when the baseline was prepared. Use current GitHub Actions results, not this snapshot, when resuming.

## Nine-module source map and audit gate

| Module | Route / component source | Evidence-backed state | Required verification before approval |
|---|---|---|---|
| Dashboard | `/admin/dashboard` → `src/components/admin/GlobalExecutiveDashboard.tsx` | Route and a large component present. Overview/Analytics terms in source; error/empty/filter indicators present | Verify actual two-tab navigation, finance/project priority, per-card period filters, source-backed charts, role-specific action availability, mobile cards, and real data semantics |
| Inbox | `/admin/inbox` → `src/pages/admin/AdminInbox.tsx` via `InboxWorkspaceRoute` | Messages workspace component and route present; source includes filter and failure handling patterns | Validate Messages default landing, category filters, read/triage flow, follow-ups and templates end to end, keyboard/compact reader behavior |
| Projects | `/admin/projects` and `/admin/tasks` → `AdminProjects.tsx`, `TasksWorkspace` | Registry, Overview and tasks route/component evidence; component has filtering and empty/error patterns | Validate all planning, resources, delivery, campaigns and closeout worksheets against real API/state; no synthetic progress or health |
| Clients | `/admin/clients/all-clients`, `/clients/retainers`, `/clients/sla-monitoring` → `AdminClients.tsx`, `AdminClientRetainers.tsx`, `AdminClientSlaMonitoring.tsx` | Directory, retainers and SLA routes present; filters and fallbacks visible in core component | Test 360, client onboarding, agreements, retainers, SLA source failures and permission-aware handoffs |
| Finance | `/admin/finance`, `/admin/finance/quotations` → `AdminFinanceWorkspace.tsx`, `AdminInvoicing.tsx` | Main finance and quotations routes present; Finance core file includes Petty Cash and Receivables terms | Verify 20 worksheet identifiers, six rendered UI work areas, quotations, cash, journals, posting, import/export, legal access boundaries; **do not change formulas** |
| Team & Resources | `/admin/team`, `/admin/vendors`, `/admin/time-logs` → `AdminTeams.tsx`, `AdminVendors.tsx`, `AdminTimeLogs.tsx` | Team/Vendors/Time routes present, Skill Matrix marker in team component | Verify directory, capacity/workload distinction, vendor role access, skills, time validation and source-backed availability |
| Documents | `/admin/documents` → `AdminDocuments.tsx` | Dedicated register component, filtering and error/empty patterns present | Validate categories, entity linkage, authorized preview/download/upload, versioning, audit and restrictive permissions |
| Website CMS | `/admin/cms/projects`, `/services`, `/testimonials`, `/insights`, `/careers` → matching `AdminCms*.tsx` | Dedicated editors/routes for five content areas; their sources include filters and role-related branches | Verify draft/review/publish, source integrity, editor rights, media, SEO/localization, Careers applicants, publication status in real runtime |
| Settings | `/admin/settings` → `AdminSettings.tsx` | Dedicated component includes Notifications and Integrations markers and filtering/error handling | Verify account/MFA, integrations, notifications, access/audit states, save-feedback, guarded configuration, mobile accessibility |

## Additional route and compatibility findings

- `src/App.tsx` contains legacy redirects for `/crm`, `/proposals`, `/invoicing`, `/executive`, old client entry and relevant team worksheet variants. Confirm browser navigation and query preservation before removing redirects.
- `/admin/navigation/live-activity` and `/admin/navigation/release-readiness` still resolve to `AmsNavigationPlaceholder` routes. A placeholder route is not evidence of feature completion.
- `/admin/approvals` resolves to a legacy/deprecated placeholder behind a module permission route. Keep it outside primary product navigation; actual intended deprecation remains subject to code/route review.
- The CMS Careers route uses a CMS module guard. This does not, by itself, prove that every applicant subview has the intended finer-grained authorization.
- Visible keyword and file size checks are **triage only**; they are not a complete semantic code audit.

## Recommended release sequence and acceptance gates

### Gate 1. Documentation and CI integrity

- Run and inspect `npm run docs:check` on the exact release SHA.
- Verify AMS CI and Quality Gate on that same SHA; an older successful run is insufficient.
- Align the canonical gap register against the real source, with evidence references, before declaring each view ready.

### Gate 2. Frontend visual and usability acceptance

- Inspect each module at desktop, tablet and 320px mobile under representative authorized roles.
- Verify navigation, form state, filters, sorting/pagination, empty/loading/error/unavailable states, data/chart legend, breadcrumbs on eligible details, consistent action sizing and keyboard focus.
- Explicit user acceptance remains mandatory at Stage 5. Do not infer approval from the existence of this audit.

### Gate 3. Functional regression and source integrity

- Run relevant source-backed record read/write, permission-denial, no-data and error-recovery tests.
- Keep frontend-only structural work separate from backend/data changes. User approval is required before broadening the technical scope.
- Treat missing source/permission as unavailable, never as success or a fake zero.

### Gate 4. Production operational readiness

- Confirm database migration, finance invariants, access/auth controls, backup/restore rehearsal, monitoring, rollback and relevant production smoke evidence using actual runbooks.
- Obtain explicit production release approval. Route presence and UI polish alone do not authorize production-ready labeling.

## Suggested immediate bounded backlog

1. Verify actual Dashboard Overview/Analytics navigation and financial period/chart behavior in an authenticated browser against source-backed data.
2. Verify Inbox Messages default, follow-ups and response templates at mobile width and by role.
3. Audit Projects/Clients/Finance core workflows with a source-backed matrix, fixing visual issues within approved FE-only scope, one module at a time.
4. Continue Team, Documents, CMS and Settings, then execute cross-module E2E regression and secure release review.
5. Update `AMS-FEATURE-CONTENT-GAP-REGISTER.md` with specific evidence per issue, not blanket pass/fail based on source markers.

## What this baseline does not certify

- Complete frontend visual quality, user acceptance, state correctness or source-backed chart accuracy.
- Actual mutation, backend integrity, auth/MFA/RBAC security or Finance correctness.
- Current production deployment readiness or live user behavior.
- CI results of commits newer than the inspected baseline.

**Result:** route/component inventory established for all nine modules. Full production readiness remains **NOT VERIFIED**. Preserve existing FE/BE/Finance constraints.

## Dashboard frontend correction — 5 November 2026

- Source discovery: `GlobalExecutiveDashboard.tsx` still exposed an active Performance tab despite the approved Overview + Analytics presentation contract.
- Frontend-only correction at commit `eb58e3ecf9a9c13a49981880f946bc010ad77a52`: permitted visible views changed to Overview/Analytics; legacy `?view=performance` now redirects to Analytics. The unused PerformanceView implementation remains preserved temporarily so existing calculations and historical logic are not rewritten in this UI-only slice.
- Overview hierarchy source-structure regression test was adjusted for the new Analytics branch boundary at commit `27dfc71019b3e2735e43d4a70b7ba5bbe73964df`.
- Generated Shared UI inventory was aligned to JSX invocation removal at commit `129a542c825c1e29ffa76310eaa19dd94b6ea7dc`.
- Intermediate CI failures were caused by the stale Shared UI inventory. Exact-head CI must be verified again after the inventory adjustment; do not treat earlier CI success as a test of this UI change.
- Authenticated visual verification remains required for Desktop/Tablet/320px, role-specific navigation and deep-link redirect behavior. This is not Stage 5 user acceptance.
