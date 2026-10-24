# AMS Implementation Traceability Register

**Purpose:** Prevent AI and human implementers from confusing planned functionality with verified implementation.  
**Status:** Maintained evidence register containing dated audit/checkpoint snapshots. Some entries may not reflect the latest `main` HEAD until re-audited; do not treat historical branch/PR status as a live GitHub status.  
**Authority:** `AGENTS.md` defines working rules; the master guide defines target requirements. Current implementation status must be re-verified against current source, latest CI results, and production evidence where relevant.

**Delivery-sequence boundary:** This register is the requirement/evidence ledger, not an independent stage plan. Follow [`AMS-END-TO-END-DELIVERY-ROADMAP.md`](AMS-END-TO-END-DELIVERY-ROADMAP.md) for stage order and [`AMS-FEATURE-CONTENT-GAP-REGISTER.md`](AMS-FEATURE-CONTENT-GAP-REGISTER.md) for the wider cross-module coverage inventory. Keep requirement IDs and technical evidence here; link the relevant IDs from the gap register rather than creating duplicate status systems.

## 1. Mandatory principle

A feature is not implemented merely because it appears in documentation, has a route, responds to a click, changes local state, renders a fixture/mock, or passes a build.

A capability is verified only when its UI, persisted behavior, API validation, server-side authorization, canonical relationships, failure behavior, cross-module effects, and relevant tests have evidence.

This register defines what must be assessed; it does not claim every feature's current status. Sections with dated audit/branch/PR references are historical evidence as of the date recorded in that section, not assertions that a branch or PR remains open today. Before making a current status decision, check the latest `main` commit, current workflow runs, relevant source and tests, and production-readiness evidence when applicable.

## 2. Allowed status vocabulary

| Status | Meaning | Evidence required |
|---|---|---|
| NOT_ASSESSED | No current review completed | Unknown; never treated as done |
| TARGET_ONLY | Desired capability is documented but not verified in code | Requirement reference |
| IMPLEMENTED_UNVERIFIED | Code appears present; proof incomplete | Source reference and missing proof |
| IMPLEMENTED_VERIFIED | Behavior and applicable tests are verified | Source/API/schema/permission/test/commit evidence |
| PARTIAL | Some behavior works; known gaps remain | Verified behavior and exact gaps |
| UI_ONLY | UI exists without verified persisted outcome | Component/route and missing layer |
| API_ONLY | Server capability exists without a complete usable workflow | API/service and missing UI |
| DEMO_ONLY | Uses fixture/mock/preview state | Data source and production gap |
| BLOCKED_EXTERNAL | Requires provider contract/access/credentials/environment/certification | Exact blocker |
| DEPRECATED_PENDING | Intended to retire; consumers or compatibility are not cleared | Replacement and dependencies |
| ACCEPTED_EXCEPTION | Reviewed temporary gap | Owner, rationale, risk and review date |

Never use DONE, COMPLETE or PRODUCTION_READY without evidence for IMPLEMENTED_VERIFIED and the applicable release gate.

## 3. Requirement ID format

- NAV-###: navigation/structure.
- UX-###: interaction/layout/accessibility.
- FE-###: frontend behavior.
- BE-###: API/security/persistence.
- DATA-###: entity relationships/integrity.
- FLOW-###: business workflows.
- FIN-###: Finance/accounting.
- BANK-###: Kopra.
- TEST-###: acceptance/regression.
- OPS-###: deployment/backup/monitoring/recovery.

Keep IDs stable. Never reuse a retired ID.

## 4. Required traceability row

| Field | Required content |
|---|---|
| Requirement ID | Stable ID |
| Requirement | Observable user/business outcome |
| Target module/submenu | Owning module and view |
| Current status | One allowed status |
| Evidence | Source file, API, schema/migration, permission, test and commit |
| Canonical source | Entity/API/store that owns the data |
| Dependencies | Upstream/downstream flows |
| Role boundary | View/create/edit/submit/authorize/post/close permissions |
| Failure behavior | Validation, conflict, timeout, retry, recovery and audit |
| Acceptance tests | Test IDs and expected persisted outcome |
| Remaining gap | Exact gap, or None if verified |
| Review reference | Task/PR/commit and reviewer/sign-off |
| Last reviewed | ISO date and exact commit SHA |

Never place secrets, production personal data, bank account numbers or private payloads in this register.

## 5. Initial requirement coverage

The items below are audit requirements, not claims of completion.

### Global architecture
- NAV-001: Exactly nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings.
- NAV-002: Every submenu has one owner, a real route/view and appropriate permission.
- NAV-003: Legacy routes are preserved, redirected or retired only after consumer/access/test review.
- UX-001: Shell, header, tabs, spacing, forms, tables and states follow the AMS design system.
- FE-001: URL/query state and active navigation stay consistent.
- BE-001: Protected reads/mutations enforce authorization server-side.
- DATA-001: Cross-module links use canonical records, not clones.

### Dashboard and Inbox
- FLOW-001: Dashboard metrics use authoritative sources and explicit definitions/periods.
- FLOW-002: Inbox intake deduplicates repeated provider events and links related records.
- FLOW-003: Resolve/reopen/archive/follow-up actions persist and preserve history.
- DATA-002: Job applications remain in CMS Careers, not default sales leads.
- UX-002: Loading, empty, filter-empty, unavailable, stale, error and denied states differ.

### CRM, Clients and Projects
- FLOW-010: Lead/opportunity stage guards and history are explicit.
- DATA-010: Canonical company/contact identity is shared across Clients and current linked-record consumers; no duplicate identity store is introduced.
- FLOW-011: The existing Finance quotation UI and current quotation API share one lifecycle; no standalone CRM quotation UI is required.
- FLOW-012: Closed Won handover is validated and cannot create duplicate projects.
- FLOW-013: Contract/SOW/change-order decisions and versions remain traceable.
- FLOW-014: Onboarding/Client 360 link to source records.
- FLOW-015: Retainer usage derives from eligible time entries and explicit period rules.
- FLOW-016: Content/campaign workflow retains brief, asset version, review, revision, publication evidence and metric source.
- FLOW-017: SLA metrics exist only when target/calendar/timestamp evidence is sufficient.

### Finance
- FIN-001: All twenty current worksheet keys map to five target Finance areas without loss.
- FIN-002: Quote builder/templates/version/status/print output are verified.
- FIN-003: Invoice templates, numbering, due dates, partial payments and ageing use canonical Finance records.
- FIN-004: Existing formulas, account mapping, transactions, journal controls, closing and report definitions are regression-tested.
- FIN-005: Purchase/expense request, budget checks, vendor bills, AP and payments are linked.
- FIN-006: Vendor master is canonical under Team & Resources; Finance uses linked ledger views.
- FIN-007: Bank movement, payment and journal events are duplicate-safe.
- FIN-008: Maker-checker and period-close guards remain enforced.
- FIN-009: Reporting periods have consistent month/quarter/year/timezone semantics.

### Team, Documents, CMS and Settings
- FLOW-020: Approved leave updates availability without silently rescheduling commitments.
- FLOW-021: People Operations records enforce confidentiality.
- FLOW-022: Time entries link once to valid project/task/retainer records.
- DATA-020: Document versions stay canonical and use authenticated vault access.
- FLOW-023: CMS publish status reflects persisted/public-source outcome.
- FLOW-024: Applicant records remain separate from CRM and access-controlled.
- BE-020: Integration secrets stay server-side and are redacted.

### Kopra H2H
- BANK-001: No API endpoints, payloads, signatures, certificates or status semantics are invented.
- BANK-002: Enabled features match the actual bank agreement/technical spec.
- BANK-003: Timeout/unknown transfer results lead to inquiry/reconciliation, not blind retry.
- BANK-004: Payment queue, batch, reconciliation and journal linkage are idempotent.
- BANK-005: Sandbox/UAT, security, authorization, reconciliation, incident and rollout gates pass before production.

## 6. Evidence hierarchy

1. Current implementation source and route definition.
2. Server validation, authorization, repository and schema/migration.
3. Automated tests and actual run result.
4. Repeatable integration/E2E scenario with persisted before/after evidence.
5. Production readiness evidence when making production claims.

Screenshots do not prove persistence. A test file existing does not prove it passed. A bank product page does not prove API access has been enabled for Kapitech.

## 7. Definition of verified

Mark IMPLEMENTED_VERIFIED only when scope is explicit, current source/permissions/persistence have been inspected, cross-module outcomes are confirmed, relevant failure/denial/retry cases are tested, regressions pass, external blockers are cleared, and evidence references the exact commit.

## 8. End-of-task report

Report requirement IDs completed and partial, files/source changed, API/schema/permission impact, tests actually run, financial/security/regression consequences, external blockers, branch/commit/deployment status, and requirements excluded by the scope boundary.


## 9. Navigation consolidation change record, 16 October 2026

This record tracks the source patch on branch `feat/ams-nine-module-navigation-2026-10-16`. It is not evidence of production deployment.

| Requirement | Status | Source evidence | Validation state / gap |
|---|---|---|---|
| NAV-001: Nine-module primary navigation | IMPLEMENTED_VERIFIED | `src/lib/amsNavigationAccess.ts`, `tests/ams-primary-navigation.test.ts`, `tests/ams-navigation-access.test.ts` | Role-aware primary/contextual navigation regression coverage passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`; the Quality Gate recorded 562 tests (542 passed, 0 failed, 20 skipped), and the production build succeeded. The same SHA passed AMS CI including PostgreSQL integration, dependency audit and production HTTP smoke checks. |
| NAV-002: Contextual feature ownership | IMPLEMENTED_UNVERIFIED | `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminLayout.tsx`, `tests/ams-sidebar-subnavigation.test.ts` | Contextual destination ownership, active-state, and route-policy alignment tests passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`; browser-level visual/layout behavior remains unverified. |
| NAV-003: CRM/Proposal/old Careers URL compatibility | IMPLEMENTED_UNVERIFIED | `src/App.tsx`, `src/lib/amsNavigationAccess.ts`, route/access tests | CRM aliases redirect to Clients, Proposal aliases redirect to Finance quotations, and the former Inbox Job Applications URL redirects to CMS Careers applicants. Typecheck, the full test suite, and production build passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`; browser back/forward and real-user direct-entry checks remain unverified. |
| NAV-004: Quotations owned by Finance UI | IMPLEMENTED_UNVERIFIED | `src/App.tsx`, `src/pages/admin/AdminFinanceWorkspace.tsx`, `src/pages/admin/AdminInvoicing.tsx` | Existing quotation component/API reused; Finance route assertions, expanded navigation regression suite, PostgreSQL integration tests and build passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`. Browser route entry and manual quote-to-invoice interaction were not separately exercised. |
| NAV-005: Approval primary entry retired without data deletion | IMPLEMENTED_UNVERIFIED | `src/lib/amsNavigationAccess.ts`, `src/lib/amsModuleSubnavigation.ts`, `src/App.tsx`, `tests/approval-rbac-audit-regression.test.ts` | Approval is absent from primary/contextual navigation. The legacy route remains protected because server notifications still link to it and it is the only current UI for the generic `/api/approvals` queue across Invoice, Proposal, Project and Expense records. The queue retains maker-checker and audit behavior. This patch deliberately preserves that compatibility UI instead of deleting active workflow behavior; its future contextual replacement is a separate migration. Browser-level deep-link behavior remains unverified. |
| SEC-001: Existing permissions retained | IMPLEMENTED_UNVERIFIED | `src/lib/amsNavigationAccess.ts`, unchanged role guard and server/API permission layers | Role-policy tests, the expanded navigation route-policy suite, PostgreSQL integration tests, and CI smoke checks passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`; live browser direct-route checks for each user role remain unverified. |
| UX-001: Shared AMS layout retained | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminLayout.tsx`, `src/index.css`, `src/components/admin/AdminModulePrimitives.tsx`; shell geometry and Dashboard responsive-grid tests | Existing primitives and design tokens retained. Safe-area shell and canonical Dashboard grid corrections passed AMS CI 39198777481 and Quality Gate 39198777527 on `78fe090409640e989a60700b1465186d42bf872f`. Authenticated responsive, keyboard/focus and visual review remain pending. |
| DOC-001: Target documentation aligned | IMPLEMENTED_UNVERIFIED | Master guide, navigation IA, traceability, AGENTS, Copilot, UX and workflow audit | Authoritative docs updated; targeted conflict scan found no stale ten-module target in the files reviewed, though a full repository-wide link/reference scan is not exhaustive. The expanded route-policy regression suite and both CI workflows passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`. The documentation snapshot at `8109958da1f988bf0557d05799c73c6b4f1c7b2f` also passed both workflows. Responsive visual review and browser-history/direct-entry checks remain unverified. |

**CI evidence, feature SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`:**
- AMS Quality Gate: **success**. Job `Typecheck, tests, and production build` ran `bun run lint`, `node --import tsx --test tests/**/*.test.ts`, and `bun run build`.
- Unit/regression suite: **562 tests, 542 passed, 0 failed, 20 skipped**.
- Production build: **success**, Vite 6.4.4, 1,690 modules transformed; 55 PostgreSQL migration files packaged into `dist/db/postgres`.
- AMS CI: **success**. The verify job also ran `bun run db:migrate`, the Node test suite, `tests/postgres-integration.test.ts`, `bun audit --audit-level=high`, the production build, and a production-runtime smoke test against a temporary PostgreSQL service. The smoke checks included health response, unauthenticated route protection, login/session, protected readiness endpoint, and existing CMS API data.
- The build logs still show pre-existing `import.meta` CommonJS-format warnings in `src/lib/clientStore.ts` and `src/lib/runtimeMode.ts`. Build completed successfully; these were not changed as part of navigation scope.
- Browser-level manual review of responsive layouts, navigation history/back-forward, and real user-role direct URL entry has not been performed in this environment. Source/unit tests and the CI runtime smoke do not prove every requested browser interaction; retain those items as unverified until exercised in the deployed-like browser environment.


### NAV-006: Single Careers applicant workspace

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/App.tsx`, `src/pages/admin/AdminInbox.tsx`, `src/pages/admin/AdminCmsCareers.tsx`, `src/lib/amsNavigationAccess.ts`.

The previous Inbox Job Applications URL redirects to Website CMS → Careers → Applicants. Inbox filters job-application records out of its editable dataset and provides a contextual shortcut to Careers. Applicant status, notes, detail and deletion actions remain in CMS Careers. Finance/PM access is limited to `/admin/cms/careers?tab=applicants`; those roles cannot access the job-opening editor. Admin retains the current full Careers capability.

**Verification:** AMS Quality Gate and AMS CI passed on source commit `de19e79e369963eac41e5742b3ed4933d5fcb521`. The Quality Gate ran typecheck/lint, 562 tests (542 passed, 0 failed, 20 skipped) and production build. AMS CI also passed database migration, security regression tests, PostgreSQL integration tests, dependency audit and production-runtime smoke checks. Role-access unit tests assert the applicant-only route. Browser-level redirect interaction and keyboard/screen-reader validation remain unverified.

**Compatibility boundary (separate follow-up):** Source inspection confirms the generic queue is still an active write/read workflow: `server/routes.ts` serves `/api/approvals` and `/api/approvals/:id/action`, persists approval and decision audit events, enforces the reviewer permission and self-approval block, and emits notifications linking to `/admin/approvals`. The UI accepts Invoice, Proposal, Project and Expense references. Those actions are not automatically mirrored into each source record's lifecycle, so redirecting the legacy route into Finance or Projects would strand pending approval records and would imply a business-flow migration not present in this navigation patch. Keep the route protected but absent from primary/contextual navigation until a separately reviewed workflow migration embeds/migrates queue records and notification destinations. No API, queue data, audit events or maker-checker behavior has been deleted. No production deployment has been performed.

### NAV-007: Primary/contextual navigation route-policy regression

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `tests/ams-navigation-route-consolidation.test.ts`, `src/lib/amsNavigationAccess.ts`, `src/lib/amsModuleSubnavigation.ts`, `src/App.tsx`, `src/pages/admin/AdminLayout.tsx`.

The regression suite iterates through Admin, Finance, PM, Creative, and Freelancer navigation destinations and asserts that each visible primary/contextual link is permitted by the shared route policy. It also covers destination duplication, legacy CRM/Proposal/Careers aliases, Finance quotation ownership, role-limited Careers applicants, and the protected-but-unlinked Approval compatibility route.

**Verification:** AMS Quality Gate and AMS CI passed at source SHA `de19e79e369963eac41e5742b3ed4933d5fcb521`. The route/access regression is automated; real-browser interaction, back/forward and responsive visual behavior remain unverified.


### NAV-008: Inbox message categories and saved-view navigation hierarchy

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/pages/admin/AdminInbox.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/admin-pages-jsx-regression.test.ts`.

The direct Inbox workspaces remain Overview, Messages, Follow-ups, and Routing & Templates. Inside Messages, the category navigation contains All Messages, Sales Inquiries, Client Requests, and Project & Support. Starred remains a supported saved view reachable from Messages controls through `/admin/inbox?view=starred`, rather than appearing beside message-category worksheets. The combined “Resolved & Archived” placeholder was removed from category navigation because these are distinct statuses/views and do not yet have a verified implementation. Client Requests, Project & Support, Follow-ups, and Routing & Templates remain explicitly non-interactive target-only destinations until connected to real workflows.

**Scope and data boundary:** Frontend navigation and regression assertions only. No API, database, authentication/session, CSRF/MFA, RBAC policy, Finance behavior, or business data was changed.

**Verification:** On follow-up source SHA `2c9e1693af16844a0576c55f4c19bb93f60c1846`, AMS Quality Gate passed typecheck, regression tests (707 tests, 687 passed, 0 failed, 20 skipped), and production build. AMS CI also passed its configured migration, security regression, PostgreSQL integration, dependency audit, packaged-migration verification, production build, and production HTTP smoke-test steps. An earlier test run had exposed a stale aria-label expectation, which was corrected before this successful run. Browser-level navigation, keyboard, and responsive checks remain unverified.

### NAV-009: Release Readiness placeholder does not inherit Settings workspace navigation

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`, `src/App.tsx`, `src/lib/amsNavigationAccess.ts`.

The existing `/admin/navigation/release-readiness` route remains intact and keeps its route-access policy, but it no longer receives the persistent Settings workspace tabs. The master architecture marks Release Readiness as a placeholder, not a navigable Settings workspace, until the feature is verified. This corrects contextual navigation only; it does not remove the route, change its guard, or claim that release-readiness telemetry is operational.

**Verification:** AMS Quality Gate and AMS CI passed on source SHA `e7ca334c7acc26235a3ecf4319fcafed3f7b7448`. The Quality Gate passed typecheck, 707 regression tests (687 passed, 0 failed, 20 skipped), and the production build. AMS CI also passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit (no vulnerabilities in 266 packages), production build, packaged-migration verification, and production HTTP smoke tests. Browser-level visual and direct-entry checks remain unverified; CI success does not by itself prove a production deployment.

### NAV-010: Projects Overview has a distinct source-backed workspace

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminProjects.tsx`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/projects-module-regression.test.ts`.

Projects Overview is separately addressable at `/admin/projects?projects=overview`. It summarizes open projects, recorded delivery exceptions, open tasks, overdue milestones, and counts by project status from the existing project data. The delivery-exception list links to the existing project detail drawer, and status rows link to the corresponding Project Registry filter. Project Registry has an explicit workspace destination at `/admin/projects?projects=all`; the legacy `/admin/projects` entry continues to open the registry. Planning & Delivery, Content & Campaigns, and Project Resources remain target-only until their respective views are implemented. No API, database, RBAC, authentication, finance logic, or business record was changed.

**Verification:** AMS Quality Gate passed at source SHA `f5baa3f2b26894dbde9d14e88860562c5fdbbc87`: typecheck, 707 tests (687 passed, 0 failed, 20 skipped), and production build. AMS CI also passed PostgreSQL migrations, security regression, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test. Browser-level visual and role-specific navigation checks remain unverified.

### NAV-011: Planning & Delivery has a source-backed project plan view

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminProjects.tsx`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/projects-module-regression.test.ts`.

Planning & Delivery is addressable at `/admin/projects?projects=planning-delivery`. It selects a canonical project and displays the existing notes, client, owner, service, dates, status, progress, team and recorded milestone dates/completion. It links to the existing task execution workspace. Scope/acceptance criteria, a separate deliverable register, internal QA outcomes, client-review outcomes, and revision history are labeled as not separately tracked in the current project model; no synthetic records are created. No API, database, role policy, authentication, Finance logic, or business record is changed.

**Verification:** AMS Quality Gate and AMS CI passed on code SHA `ef955a4eff43a1109739e0df01b8a4ca7d3fffbd`. Quality Gate passed typecheck, 707 regression tests (687 passed, 0 failed, 20 skipped), and production build. AMS CI passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test. Browser-level visual and role-specific checks remain unverified.

### NAV-012: Project Resources uses canonical project assignment records

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminProjects.tsx`, `src/lib/projectStore.ts`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/projects-module-regression.test.ts`.

Project Resources is addressable at `/admin/projects?projects=resources`. It selects an existing project and presents its recorded owner/team membership, optional explicit resource allocation entries, and the same canonical project task assignments. Assignment counts are calculated from task assignee values; resource allocation percentages are shown only when explicit allocation records exist. Cross-project staffing availability, time-log actuals and overload/capacity percentages remain explicitly outside this view and are not inferred from task counts. No API, database, authentication, access policy, Finance logic or business record was changed.

**Verification:** AMS Quality Gate and AMS CI passed on code SHA `8047cdf531fbcdf2d7e9e7db49ac20c99901cfdf`. Quality Gate passed typecheck, 707 regression tests (687 passed, 0 failed, 20 skipped), and production build. AMS CI passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test. Browser-level visual and role-specific checks remain unverified.

### NAV-013: Roles & Departments uses canonical team member records

**Status:** IMPLEMENTED

**Source:** `src/pages/admin/AdminTeams.tsx`, `tests/team-resource-data-availability.test.ts`.

Roles & Departments is available inside Team & Capacity at `/admin/team?view=roles-departments`. It groups existing team member records by their recorded division and role and shows counts for members, active records, other statuses, and names. Export uses the same grouped records. The worksheet is read-only and does not modify RBAC or account access. People Operations and Availability & Workload remain target-only because onboarding/employment/leave workflows and authoritative leave-calendar data are not yet established in the connected sources.

**Verification:** AMS Quality Gate and AMS CI passed on source SHA `4f176af7c18541762a7b755806ff35597a0096b2`. Quality Gate passed typecheck, 708 regression tests (688 passed, 0 failed, 20 skipped), and production build. AMS CI passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test. Manual browser-level and role-specific checks remain unverified.

### NAV-014: Dashboard workspace query values always resolve to one active view

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/components/admin/GlobalExecutiveDashboard.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/ams-nine-module-workspace-regression.test.ts`.

Dashboard exposes Overview, Performance, and Analytics. A missing or unsupported `view` value now renders Overview, activates its navigation tab, and replaces an invalid `view` query with the canonical `/admin/dashboard` URL. This prevents unknown query values from rendering Analytics with no active workspace tab. The existing `view=tasks` compatibility redirect remains in `DashboardWorkspaceRoute`. No dashboard data source, API, role access, or business logic was changed.

**Verification:** AMS Quality Gate and AMS CI passed on code SHA `a1d161046c77034a77c74db9fbb1ba4974fe027e`. Quality Gate passed typecheck, 710 regression tests (690 passed, 0 failed, 20 skipped), and production build. AMS CI passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test. Browser history and keyboard interaction checks remain unverified.

### NAV-015: Agreements Renewal Schedule aggregates existing contract and retainer dates

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/pages/admin/AdminContracts.tsx`, `src/pages/admin/AdminClientRetainers.tsx`, `tests/ams-nine-module-workspace-regression.test.ts`.

Renewal Schedule is available from either Agreements worksheet at `/admin/contracts?view=renewals`. It derives rows from active contract records and active retainer terms stored on canonical client records. It is a view over those records, not a separate renewal dataset. The content-first register now places searchable title/client/source discovery and a timing filter before the primary list, distinguishes a filtered-empty result from a truly empty register, supports retry when either source is unavailable, and labels partial source coverage instead of claiming a full total. Missing dates remain explicit. Contract and retainer source records do not expose accountable owner or next-action fields, so the page states this limitation and links to the canonical source registers. It does not recalculate retainer billing or automatically expire agreements. Contract History remains target-only.

**Verification:** The searchable deadline-register source and test-scope correction passed AMS Quality Gate [39207367066](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367066) and AMS CI [39207367178](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367178) on code SHA `939cd800a4321c8049e27cb383c1176cf9c8866b`. Browser-level search/filter, keyboard, role and viewport behavior remains unverified.

### NAV-016: Inbox Unread is a saved view over canonical New-status records

**Status:** IMPLEMENTED_UNVERIFIED

**Source:** `src/pages/admin/AdminInbox.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/admin-pages-jsx-regression.test.ts`.

Messages now exposes an Unread saved view at `/admin/inbox?view=unread`, which filters the same canonical inbound records to records with `status: new`. The current Inbox already uses this state as its pending/unread queue and advances records to `in-review` through the existing Mark Read action. The view has a return link to All Messages and a distinct CSV filename. It is not a separate data store or independent read-receipt model. Resolved and Archived remain unsupported because the current lead status contract does not expose those as separate verified states.

**Verification:** AMS Quality Gate passed on code SHA `a76626ae2b3c4809ce19d7f049035effc421887f`: typecheck, 711 regression tests (691 passed, 0 failed, 20 skipped), and production build. AMS CI for that SHA was cancelled before its database/integration/smoke-test steps could be verified, so end-to-end CI is not claimed as passed. Browser-level keyboard and role-specific checks remain unverified.

### NAV-017: Project Controls remains target-only until its dedicated workspace is implemented

**Status:** TARGET_ONLY

**Source:** `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminProjects.tsx`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/ams-navigation-access.test.ts`.

The Project Controls navigation item is disabled because its former destination, `?projects=budget`, renders only the existing Budget vs Actual view and does not cover the approved Project Controls scope. The legacy Budget vs Actual view remains addressable directly, but it no longer marks Project Controls as the active workspace. Project Controls can be activated after its own source-backed surface includes the relevant project changes, risks, budget health, and closure context. No project record, business rule, API, database, or access policy was changed.

**Verification:** AMS Quality Gate and AMS CI passed on code SHA `e224a5df5d01462d4f76b8b0b1f87bafba1ebe42`. Quality Gate passed typecheck, 711 regression tests (691 passed, 0 failed, 20 skipped), and production build. AMS CI passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test.

### NAV-018: Inbox invalid view query values normalize to Overview

**Status:** IMPLEMENTED_VERIFIED at source commit `059432b567de1e556c13263deb324309b6467142`.

**Source:** `src/pages/admin/AdminInbox.tsx`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/ams-primary-navigation.test.ts`.

Inbox keeps the approved direct workspace order (Overview, Messages, Follow-ups, Routing & Templates). An unsupported explicit `view` value now resolves to Overview and replaces the query with `view=overview`, while preserving unrelated query parameters. Legacy `view=jobs` compatibility remains owned by the existing route redirect to Website CMS → Careers → Applicants. The Admin primary navigation regression now asserts the exact nine-module sequence with Settings in position nine. AMS Quality Gate and AMS CI both passed at the source commit; browser-level back/forward and visual verification remain unverified.

### NAV-019: Tasks & Execution worksheet navigation is URL-addressable and role-aware

**Status:** IMPLEMENTED_VERIFIED at source checkpoint `6e0e4959b47b66c7a8e18af49aca7363bc81466d`.

**Source:** `src/components/admin/TasksWorkspace.tsx`, `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminLayout.tsx`, `tests/task-workspace-data-parity-regression.test.ts`, `tests/ams-sidebar-subnavigation.test.ts`.

Tasks & Execution now exposes Board / Kanban and List as query-driven worksheets at all viewport widths. The task queues (All Tasks, My Tasks, Due & Overdue, Review Queue, Blocked, Completed) remain views of the same task records and are shown at desktop and compact widths. Unsupported `layout` values resolve to List without dropping other query parameters. Task Lists and Dependencies remain visible as unavailable targets until backed by actual workflows. Role-aware workspace ownership keeps a PM's `taskscope=my` view under Projects while preserving existing route access rules. AMS Quality Gate and AMS CI passed at the tested checkpoint. Browser-level responsive interaction and visual sign-off remain unverified.

### NAV-021: Inbox categories and saved views are navigated inside Messages

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build, and CI passed; browser-level navigation remains unverified).

**Source:** `src/pages/admin/AdminInbox.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`.

The Messages workspace keeps All Messages, Sales Inquiries, Client Requests, and Project & Support in its category row. Unread and Starred are presented as saved views within Messages and link to the existing canonical inbound records. Resolved and Archived are shown as non-interactive target-only views because the current inbound status contract does not expose distinct verified resolved/archive states. Unsupported query values still normalize to Inbox Overview. No API, status model, database, permissions or inbox business behavior was changed.

### NAV-022: Planning & Delivery worksheet hierarchy is represented without dead links

**Status:** IMPLEMENTED_VERIFIED (typecheck, regression tests, production build and AMS CI passed at current main checkpoint; browser-level navigation remains unverified).

**Source:** `src/pages/admin/AdminProjects.tsx`, `tests/ams-sidebar-subnavigation.test.ts`.

The Projects → Planning & Delivery workspace now exposes the master-guide worksheet order: Project Brief, Scope & Deliverables, Milestones, Timeline, Deliverable Tracking, Internal Quality Review, Client Review, and Revision History. Project Brief is the only currently navigable worksheet because the existing project record exposes notes, dates, progress, and milestone data in a combined brief/schedule view. Other worksheet entries are visibly target-only and non-interactive until their individual destinations exist. This is navigation-stage work only; no project data, model, API, delivery workflow, or content panel logic changed.

### NAV-023: Client Directory and Onboarding worksheet navigation preserves one canonical client record set

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build and AMS CI passed; browser-level navigation remains unverified).

**Source:** `src/pages/admin/AdminClients.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`.

The Directory exposes the live Companies worksheet on the canonical client/account list. Contacts is shown as target-only because contact details remain fields on the canonical client rows; there is no distinct Contacts register/view to navigate to yet. Onboarding remains its own contextual workspace rather than a duplicated status link inside Directory. Onboarding Checklist, Required Documents and Kickoff Readiness are represented as target-only until their dedicated worksheet destinations exist. Existing `scope=onboarding` route compatibility, client record fields, data ownership and permissions remain unchanged.

### NAV-024: Finance areas and existing worksheets follow their owning workspace

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build and AMS CI passed; browser-level finance navigation remains unverified).

**Source:** `src/lib/amsModuleSubnavigation.ts`, `src/lib/financeWorkbook.ts`, `src/pages/admin/AdminFinanceWorkspace.tsx`, `tests/ams-sidebar-subnavigation.test.ts`.

Finance retains the five approved areas in order: Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, Accounting & Reports. The navigation regression maps all 20 entries in `FINANCE_WORKBOOK_GROUPS` to their owner tab, including Chart of Accounts and the reporting/closing worksheets. Quotations remains a dedicated Finance view owned by Receivables & Payables at the existing canonical route; it is not a standalone primary module. No Finance calculations, transactions, APIs, posting behavior or permission rules were changed. Browser interaction, refresh and back/forward navigation remain unverified.

### NAV-025: Team & Resources worksheet navigation follows workspace ownership and route policy

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build and AMS CI passed; browser-level navigation remains unverified).

**Source:** `src/pages/admin/AdminTeams.tsx`, `src/lib/amsModuleSubnavigation.ts`, `src/lib/amsNavigationAccess.ts`, `tests/ams-sidebar-subnavigation.test.ts`.

Team & Capacity exposes Team Directory, Roles & Departments, Capacity Allocation, and a disabled Availability & Workload view. Vendors & Freelancers exposes its Directory and the Admin-authorized Skills & Service Matrix route, with Contracts & Rates and Engagement Status explicitly target-only. Time Tracking continues to use its canonical Time Logs route. People Operations remains target-only because no separate HR workflow route/model is available. Route access remains based on current route policy; no permissions, person/vendor data, time entries, or business logic changed.

### NAV-026: Document Library categories remain in one workspace with canonical query state

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build and AMS CI passed at source SHA `67931f5dbeb800acb99ab03dd0f60d3ce1212e81`; browser-level navigation remains unverified).

**Source:** `src/pages/admin/AdminDocuments.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/ams-sidebar-subnavigation.test.ts`.

Documents has one primary workspace, Document Library. Project & Client Files, SOPs & Policies, Legal & Corporate, Finance & Tax, HR & People, and Security & Infrastructure remain category/filter views in the same canonical library. The current category dropdown preserves its query selection for deep links; an unsupported `documents` value now resolves to All files and removes the invalid parameter via history replacement. No document data, vault logic, mutation path or access policy changed.

**Verification:** [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39155134268) and [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39155134370) passed on source SHA `67931f5dbeb800acb99ab03dd0f60d3ce1212e81`. Browser-level navigation, refresh and back/forward checks remain unverified.

### NAV-027: Website CMS content-type and Careers worksheet navigation follows route ownership

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build and AMS CI passed at source SHA `67931f5dbeb800acb99ab03dd0f60d3ce1212e81`; browser-level navigation remains unverified).

**Source:** `src/lib/amsModuleSubnavigation.ts`, `src/App.tsx`, `src/pages/admin/AdminCmsCareers.tsx`, `tests/ams-sidebar-subnavigation.test.ts`.

Website CMS exposes the five content-type workspaces in order: Case Studies, Services, Insights, Testimonials, and Careers. Careers contains Jobs for roles permitted to manage openings and Applicants for permitted applicant reviewers. Recruitment History is explicitly non-interactive target-only. Unsupported Careers tab queries normalize to the canonical tab for the current role, and the legacy Inbox jobs route redirects to Careers → Applicants. No CMS data, publishing behavior, APIs, or role/access policy changed.

**Verification:** [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39155134268) and [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39155134370) passed on source SHA `67931f5dbeb800acb99ab03dd0f60d3ce1212e81`. Browser-level navigation, direct-entry, refresh and back/forward checks remain unverified.


### NAV-028: Settings Integrations exposes the documented nested workspace structure

**Status:** IMPLEMENTED_VERIFIED (source regression, typecheck, production build and AMS CI passed at source SHA `67931f5dbeb800acb99ab03dd0f60d3ce1212e81`; browser-level navigation remains unverified).

**Source:** `src/pages/admin/AdminSettings.tsx`, `src/lib/amsModuleSubnavigation.ts`, `tests/admin-settings-module-regression.test.ts`.

Settings → Integrations now contains internal worksheets for Integration Overview and Website & CMS Integrations. The latter uses the existing CMS metadata form and its existing API path. Bank Mandiri Kopra H2H is present as an explicitly disabled target-only worksheet because the dedicated bank integration workflow is not configured. The nested `integration` query is URL-addressable; unknown or out-of-scope values are removed with history replacement. No backend/API, bank connection, credentials, Finance rules, or access policy was changed.

**Verification:** [AMS Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39155134268) and [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39155134370) passed on source SHA `67931f5dbeb800acb99ab03dd0f60d3ce1212e81`. Browser-level keyboard, refresh and back/forward checks remain unverified.

## 10. End-to-end business workflow audit — 16 October 2026

**Checkpoint:** Navigation branch `feat/ams-nine-module-navigation-2026-10-16` at `abd71d5343ed668b24a0f73d1cf40d594a36204b`, with navigation PR #167 still open. Audit changes are isolated on `audit/ams-e2e-workflow-2026-10-16`; audit PR #168 is based on the navigation branch and remains unmerged. Audit source checkpoint `5f27dc2defbd3172d6734c26845035e19cb35f42` passed the AMS Quality Gate and AMS CI. No production deployment or production-record mutation was performed.

**Evidence boundary:** Source inspection, repository regression assertions, and CI establish code-level safeguards. No live browser journey, authorized production data inspection, isolated UI fault-injection session, real payment, publication, or bank transfer was executed during this audit. Accordingly, the rows below are not marked `IMPLEMENTED_VERIFIED` solely from a build or source assertion.

### 10.1 Confirmed frontend remediations

| Requirement | Status | Evidence | Remaining verification |
|---|---|---|---|
| FIN-010: Embedded Finance distinguishes failed sources from valid empty ledgers | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminInvoicing.tsx`; `tests/finance-ui-consistency.test.ts`. Retains last successful invoice/expense/context rows if a source fails; shows source warning; preserves prior metrics if a payload is absent; blocks source-dependent mutations/exports while loading or unavailable. | Test asserts source behavior and CI runs it; a real API-failure/retry interaction with preserved persisted totals has not been exercised. |
| FE-002: Project save success requires a canonical server record | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminProjects.tsx`; `tests/frontend-functional-regression.test.ts`. A success envelope without `data.project` refreshes the project list and does not silently substitute the local draft or close the drawer as saved. | No isolated runtime test injected a malformed success envelope; ordinary persisted create/edit journey remains unverified. |
| DATA-021: Project editor can reference the canonical client | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminProjects.tsx`; `src/lib/clientStore.ts`; `server/postgres-project-repository.ts`; `server/routes.ts`; `tests/frontend-functional-regression.test.ts`. Roles already permitted to read clients can select an existing client; the chosen ID is sent through the existing project API. Manual/unlinked entry remains available, and changing selected identity fields clears that link rather than silently associating a different client. | Browser create/edit, API response, and persisted `client_id` reconciliation were not run against an isolated database. Existing projects without a client ID were not auto-linked by display-name guessing. |
| FE-003: Incomplete private document upload cleanup is visible to the operator | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminDocuments.tsx`; `tests/frontend-functional-regression.test.ts`; existing authenticated document API/middleware. Cleanup result is checked; if metadata deletion cannot be confirmed, the vault list is refreshed and the user is told to inspect it before retrying. | No controlled vault upload failure or delete-failure scenario was executed in a non-production UI session. |

### 10.2 Workflow coverage and status

| Workflow | Current status | Observed implementation / dependencies | Gap and classification |
|---|---|---|---|
| Dashboard and reporting | IMPLEMENTED_UNVERIFIED | `src/components/admin/GlobalExecutiveDashboard.tsx` reads dashboard overview, projects, tasks, time logs, invoices and expenses. Live-unavailable values can display as unavailable; preview samples are gated by explicit fixture mode. Trend labels distinguish invoice/expense difference from posted profit. | No persisted-data reconciliation of dashboard KPIs against their source rows or period boundaries was executed. Dashboard/source integration remains unverified. |
| Client lifecycle | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminClients.tsx`; `/api/clients` and client interaction APIs. Client reads show loading/error behavior, and save waits for a canonical returned client before success. Project editor now supports explicit client ID selection where the role can read Clients. | No end-to-end create → edit → project link → Finance detail journey; duplicate-identity and archival behavior were not tested against isolated records. |
| Project delivery / tasks | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminProjects.tsx`; `/api/projects`, task endpoints; source and existing tests cover API-backed project/task lists, persisted response handling, Kanban state and empty source behavior. | No browser drag/drop/save/reload scenario or full handover → project → task → client → Finance journey was run. Contract/change-order handover and duplicate-handover invariants need end-to-end evidence. |
| Team & resources | PARTIAL | `src/pages/admin/AdminTeams.tsx`, `src/pages/admin/AdminTimeLogs.tsx`; time logs are project/task-associated and UI validates duration while APIs validate project/task assignment. Team workspace preview rows are gated by fixture mode. Vendor master is owned by Team & Resources and linked from Finance. | Workload figures, actual retainer usage, fee records and task/team effects were not reconciled using persisted examples. Leave, payroll, and full resource scheduling must not be assumed operational from the visible Team UI. |
| Finance transactions, receivables, payables | PARTIAL | `src/pages/admin/AdminFinanceWorkspace.tsx`, `src/pages/admin/AdminInvoicing.tsx`, existing finance APIs/repositories, Finance regression suite. Embedded ledger source failures and project-save feedback are addressed without changing financial formulas or API contracts. | The audit did not reconcile real invoice/payment rows to AR, expense/vendor liability rows to AP, account mappings to journals, project cost totals to source expense/time-fee records, or report totals to a known baseline. Use isolated transactional E2E evidence before marking the accounting path verified. |
| Quotations / approval / handover | PARTIAL | Quotation UI is owned by Finance and continues using existing quotation/proposal APIs and stable record history. The generic approval route stays protected but absent from primary/contextual navigation because active approval records and notifications still target it. | Quote → acceptance evidence → contract/SOW → project creation exactly once was not run end to end. Approval UI retirement remains `DEPRECATED_PENDING` until the current queue, notification destinations, decision audit, and source-record effects are migrated together. |
| Documents / private vault | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminDocuments.tsx`, `apiClient.ts`, authenticated document middleware in `server/routes.ts`. Load failure differs from empty results; the two-stage upload now reports uncertain cleanup. | Authenticated upload/download/version/delete and role denial were not executed in a browser with private files. Storage transaction/orphan behavior remains a server/persistence verification item. |
| Inbox / cross-module destinations | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminInbox.tsx` reads server-backed leads and filters `type === 'career'` out of Inbox's client-inquiry data; polling and API-backed interactions are present. Career applications are handled in CMS Careers. | Provider-event deduplication, stale/deleted destination handling, notification parity, and read/unread persistence were not exercised in an isolated integration journey. |
| Website CMS / Careers | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminCmsCareers.tsx`; current job-opening CMS API and career-type lead records. Job management and applicant management live in the same Careers workspace, with role-limited applicant route access. | No public-site publication outcome or applicant status/CV permission journey was validated in the deployed-like environment. No public website code was changed. |
| Settings, permissions and security | IMPLEMENTED_UNVERIFIED | Existing navigation/access tests and API/server permission checks remain in place; time-log routes validate assignment/scope internally; private document APIs use dedicated access middleware. | A direct-URL and protected-API allow/deny matrix for every production role/session state was not executed during this audit. Existing source/tests are not a substitute for that live matrix. |
| Leave / payroll / comprehensive HR operations | NOT_ASSESSED | No workflow behavior was verified as part of this audit beyond the existing Team/resource interfaces described above. | Do not rely on leave approvals, payroll posting, or automatic resource availability updates without a separate source/API/data audit. |
| Mandiri Kopra H2H | BLOCKED_EXTERNAL | `docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md` is the authority; the bank-issued API/authorization contract and approved sandbox are not evidenced by this audit. | Do not invent provider endpoints, signatures, transfer statuses or run live transfers. Continue only after the official contract, credentials, and sandbox/UAT are approved. |

### 10.3 Follow-up boundaries

- No backend route, Express behavior, PostgreSQL schema/migration, authentication/security control, role semantics, financial formula, account mapping, journal rule, bank integration, public-site code, dependency, or operational record was changed by this audit branch.
- Existing architecture/workbook notes identify separate accounting verification gaps including credit note/refund flows, retainer/deferred-revenue treatment, fully reconciled net project margin, and automatic bank-feed matching. These need an authorized Finance/backend audit and an approved baseline; this UI task does not make them functional.
- Treat an unknown provider outcome or failed cleanup as unresolved, not as a confirmed failed transaction. Never encourage a blind retry for a possible payment, journal or publication side effect.
- Manual browser responsive, keyboard/focus, back/forward, role-direct-route, upload failure, save-response failure, and Finance source outage scenarios remain explicit release-test work.


## 11. Data-source, API-contract, security and financial-integrity audit — 17 October 2026

**Starting checkpoint:** audit PR #168 started from source HEAD `90bc6ffb1714180df437d73ebe21a357731ff25b`, with navigation PR #167 still open/unmerged at `abd71d5343ed668b24a0f73d1cf40d594a36204b`. Audit branch remains `audit/ams-e2e-workflow-2026-10-16`; no changes were made to production records, protected server/API/security/database/accounting/bank/public-site implementation, and no merge/deploy was performed.

### 11.1 Data-source and environment evidence

| Requirement | Status | Evidence | Limit |
|---|---|---|---|
| DS-001: Source selection and JSON fallback semantics | IMPLEMENTED_UNVERIFIED | `server/data-source.ts`, `server/application-data-repository.ts`, `server/postgres.ts`, `server.ts`. Non-production source defaults to JSON if `KAPITECH_DATA_SOURCE` is unset; explicit `postgres` selects PostgreSQL. Production validation requires explicit PostgreSQL mode, valid database URL and encryption key. Postgres connection/configuration failure does not silently fall back to JSON; PostgreSQL-backed API requests are held at 503 while initialization is incomplete. | This describes current source logic, not every developer machine's env. Do not infer a particular development environment from its default. |
| DS-002: Actual production source at observation time | IMPLEMENTED_VERIFIED | Read-only `GET https://ams.kapitech.id/api/health/ready` returned status `ok`, application `healthy`, database `connected`, `dataSource=postgres`, auth `operational`, and reported database latency 20 ms at `2026-10-17T06:18:33Z`. | This is a direct, timestamped health probe, not proof of all production release gates, data correctness, backup restorability or migration parity. |
| DS-003: Authenticated production-readiness gates | PARTIAL | Read-only unauthenticated `GET /api/system/production-readiness` returned HTTP 401, consistent with the existing auth/permission guard. CI tests the gate against an isolated PostgreSQL runtime. | Live gate payload is not available without authorized Security/IT access. Applied migration checksums, backup/restore evidence, reconciliation signoff and live vault/notification gates remain unverified. |
| DS-004: Migration inventory documentation | IMPLEMENTED_VERIFIED | Repository tree contains 55 PostgreSQL migration files, with filename prefixes through `055`; distinct full filenames share prefixes `053` and `054`. `README.md` now describes the repository inventory rather than the stale “through 049” statement. | Filename count is not the actual live `schema_migrations` table state. Verify through the authorized production-readiness gate; no migration/schema was run or modified against production. |

### 11.2 Newly confirmed findings

| ID / priority / category | Evidence and impact | Follow-up/status |
|---|---|---|
| API-001 · P2 · Category B (frontend) | `src/lib/apiClient.ts`: the existing timeout/network-error response for mutating requests used generic “Please try again” wording. A mutation may have completed even when its response did not reach the browser, making blind manual retry capable of creating duplicate records or duplicate side effects. `apiBinaryRequest` has the same ambiguity for document upload. | **Fixed in audit branch.** Mutating-request failures now say the result is unknown and instruct users to inspect the target record before retry. Binary upload errors advise checking the private vault. Regression test: `tests/frontend-functional-regression.test.ts`. No automatic retry behavior or API contract changed. |
| API-003 · P2 · Category B (frontend) | `src/lib/apiClient.ts`: an explicit HTTP 5xx response from a mutating request was returned as a conventional server error without warning that the operation may have partially or fully persisted before the response failed. This could encourage an unsafe manual retry for create/update/delete operations. | **Fixed in audit branch.** Mutating HTTP 5xx responses now preserve the server's error detail where provided and add a warning to check the record before retrying. The existing frontend regression test now asserts this behavior. No automatic retry, API contract or backend behavior changed. AMS Quality Gate and AMS CI passed on source/test commit `d996fb563ea2c6a2ec295c526a2c23303594e37a`: 568 tests, 548 passed, 0 failed, 20 skipped; typecheck and production build passed; all 8 isolated PostgreSQL integration tests passed; dependency audit found no vulnerabilities in 266 packages. These source-level regression assertions do not replace runtime fault-injection. |
| DOC-002 · P1 · Category A (frontend data-loss risk) | `src/pages/admin/AdminDocuments.tsx`, `src/lib/apiClient.ts`, existing `PUT /api/documents/:id/content` and `DELETE /api/documents/:id` contracts. The server writes encrypted storage, then updates metadata/status and returns a response; a timeout can hide a successful result. Previously the UI tried to delete the newly created document on any upload error. In PostgreSQL mode that DELETE removes the metadata and its storage object, so a completed upload whose response was lost could be destroyed by the frontend recovery attempt. This is a code-path risk; no production data loss was observed. | **Fixed in audit branch.** HTTP no-response/timeout and 5xx outcomes are treated as ambiguous: the vault is refreshed and auto-delete is not attempted. Returned HTTP 4xx failures continue through existing cleanup. Regression test: `tests/frontend-functional-regression.test.ts`. Storage/database compensation is still not proven atomic; see protected follow-up below. |
| API-002 · P2 · Category C (backend/CORS contract) | `server.ts`: `PUBLIC_API_PATHS` includes public CMS services/projects/testimonials/insights and lead submission/upload paths but omits `/cms/careers`; `applyPublicApiCors` only sets `Access-Control-Allow-Origin` for those allowed paths (or `/cms/insights/*`). The separate public-site repository's `src/lib/apiClient.ts` uses `https://ams.kapitech.id/api` in production and `src/pages/Careers.tsx` calls `/api/cms/careers` cross-origin. Its failure handler silently retains bundled local positions. This omission prevents the browser from reading the CMS Careers response from the website origin even though the API route itself returns public, published positions to a direct request without an Origin header. | **Not changed (protected backend/public website).** Minimal separately authorized fix: add the explicit public read path `/cms/careers` to the AMS CORS allowlist, and add origin-allow/deny + browser hydration regressions. Test with a CMS opening that differs from local fallback, and verify it appears after publication. The direct endpoint returned two published positions during this audit; that alone does not prove browser CORS worked. |
| CMS-001 · P2 · Category C (concurrency risk) | `server/routes.ts`: Careers POST/PUT/DELETE each reads the full current position array, edits it in memory and writes a full replacement. `server/postgres-cms-repository.ts:updateSettings()` reads settings and upserts the merged values without an observed row lock or version check around the read-modify-write sequence. Two concurrent editor requests can therefore race and the later replacement may overwrite an earlier change; a live lost-update has not been reproduced. | **Not changed (protected backend).** Stage a controlled parallel create/edit/delete test with distinct jobs and verify both results persist. Minimal separately authorized design should atomically mutate the career collection or serialize/version the current settings value, with rollback/concurrency regression tests. |
| DOC-003 · P2 · Category C/D (storage recovery) | Existing document upload API performs a storage-object write and a separate metadata update. The server attempts cleanup on metadata failure and the UI now handles unknown responses without deleting the record. The inspected source does not establish a distributed transaction between PostgreSQL and the external object store. | **Unmodified.** Follow-up: inject storage-success/metadata-update-failure, response-timeout and cleanup-failure cases in isolated staging. Specify and verify an idempotent reconciliation/recovery operation for orphaned objects or `pending_upload` records. Never attempt such tests against production files. |
| SEC-001 · P3 · Category F (review decision) | Read-only `GET /api/health/ready` exposes application version, selected data source, database connected state, latency and auth status. No exploit or unauthorized data exposure was demonstrated; this may be intended operational monitoring. | **Potential hardening review only.** Security/operations should decide whether these fields are approved for unauthenticated access and, if not, propose a narrow disclosure reduction while keeping load-balancer readiness semantics. No server code changed. |
| DOC-004 · P3 · documentation drift | `README.md` previously said the PostgreSQL migration chain ended at 049 even though the current repository contains 55 files through prefix 055. | **Fixed in audit branch.** README now distinguishes repository inventory from applied production migration state. |

### 11.3 Cross-module and financial integrity evidence

- Client/project: `server/postgres-project-repository.ts` validates an explicitly supplied client ID exists before project create and uses a transaction; updates include an `updatedAt` concurrency check. Existing PostgreSQL integration coverage includes proposal-to-invoice line items, project/task/time-log client relationship, CRM conversion, won-deal conversion, expense lifecycle and invoice line-parent integrity. This establishes controlled test evidence, not a reconciliation of all production rows.
- Invoices/payments/expenses: `server/postgres-invoice-repository.ts` uses transaction-scoped payment idempotency keys and payment rows; `server/postgres-expense-repository.ts` checks expense idempotency/fingerprint and version state. Existing tests cover relevant server invariants. No new duplicate payment or inconsistent balance was observed because production finance records were not read/reconciled.
- Finance workbook/reporting: `src/lib/financeWorkbook.ts`, `server/routes.ts`, invoice/expense repositories and `docs/FINANCE-EXCEL-ALIGNMENT.md` were inspected. Journal drafts use source-linked mapping and posting controls. The workbook documentation explicitly says Monthly P&L, Cash Flow, Balance Sheet and Annual Summary may show previews and/or posted-journal data and remain provisional pending source exceptions, opening-balance reconciliation, reviewed/posted journals and evidenced close controls. There is no bank-feed integration or automatic bank statement-line matching. No financial formula, account mapping, posting rule or historical record was changed.
- Production financial reconciliation remains unverified: no authorized before/after data set was supplied and no transaction or destructive operation was performed. Specifically, invoice/payment/AR, expense/vendor-bill/AP, project actual cost/margin, journal/account balances, opening balances, Cash Flow, P&L, Balance Sheet and close-period restrictions were not numerically reconciled against a known baseline.
- Authorization: existing Express routes inspected retain server-side `requireAuth`/permission middleware, document object-level access checks, and explicit financial/project-profits role guards. The live production readiness endpoint requires authentication and returned 401 without credentials. No exhaustive direct-route/API deny matrix was run for each role; report this as unverified, not as a vulnerability.

### 11.4 Validation for audit source checkpoint

**Source commit tested:** `90bc6ffb1714180df437d73ebe21a357731ff25b`, before this section and README wording were added.

- AMS Quality Gate: success; lint/typecheck, 568 tests (548 passed, 0 failed, 20 skipped), production build succeeded.
- AMS CI: success; migration/package validation, same unit/regression suite, 8 PostgreSQL integration tests passed, `bun audit --audit-level=high`, production build and isolated PostgreSQL HTTP/auth/CMS smoke tests passed.
- Workflow links: [Quality Gate](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39009690483) · [AMS CI](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39009690524).
- The new timeout/ambiguous-upload source assertions were included in the tested code checkpoint. The subsequent README/traceability snapshot at commit `5bad3b7fcec5d4a49f407aa174dd6f4baa531dba` also passed both AMS Quality Gate and AMS CI with the same 568-test result and isolated PostgreSQL validation. For any later amendments, the workflow runs attached to the current PR head remain the authority; these repository assertions are not a browser-based fault-injection test.

### 11.5 Protected remediation queue

1. **P2 — Restore public Careers CMS cross-origin access (API-002):** separately authorize and patch the backend CORS allowlist and cover the real browser origin / fallback-distinguishing E2E test.
2. **P2 — Prove storage recovery (DOC-003):** staged fault-injection for successful object write + failed/unknown metadata update, cleanup failure and reconciling stale pending records/objects.
3. **P1/P2 release gate — Production financial reconciliation:** Security/IT authorizes the production-readiness gate and controlled Finance/DB evidence; reconcile source record counts/links, payment totals, posted journals, opening balances and reporting-period balances. No formulas or financial records are to be changed as part of this audit.
4. **P3 — Health endpoint information disclosure decision (SEC-001):** security/operations decide whether the unauthenticated readiness detail is intended.
5. **Operational verification — Authorization matrix:** run permitted/denied direct URL/API tests for Admin, Finance, PM, Creative and Freelancer using approved isolated/test identities without changing roles or weakening checks.

No claim of full data-integrity, production-readiness or financial-statement verification should be made until the corresponding evidence above exists.


## 12. Follow-up integrity findings carried forward from stacked audits — 17 October 2026

### 12.1 Frontend Finance cache hydration

| Requirement | Status | Evidence | Remaining limitation |
|---|---|---|---|
| FIN-011: Only replace Finance cache when the API returns a valid collection envelope | IMPLEMENTED_VERIFIED (source regression and CI passed; browser runtime remains unverified) | `src/lib/financeStore.ts` now requires HTTP success, no explicit `success: false`, and the expected invoice/expense array before replacing the related cache. A valid empty array remains authoritative; malformed/error payloads preserve last-known-good cache and trigger the existing retry path. Regression coverage: `tests/frontend-functional-regression.test.ts`. | Static regressions validate the source contract. Mounted-browser recovery behavior still requires an isolated malformed-HTTP-200 test. |

### 12.2 Source-proven protected-system risks

| Finding | Category / priority | Evidence and classification | Required follow-up |
|---|---|---|---|
| FIN-021: Vendor-bill payment retries without a stable reference | Category C/E / P1 conditional financial risk | `server/postgres-finance-workbook-repository.ts`: a missing payment reference is replaced with a generated `VP` value and becomes the record key. The repository locks the bill and enforces remaining balances, but this record path does not expose stable request replay semantics. Repeated partial payment with a newly generated reference may create a second payment while the bill retains a balance. No duplicate payment was executed or observed. | Separately authorize a stable operation idempotency key/fingerprint and transaction regression coverage for replay, conflicting payloads, concurrent submissions, partial payments and outstanding-balance conflicts. Frontend warning text is not a substitute for server idempotency. |
| DATA-023: Invoice list may combine different database snapshots | Category C/D/E / P2 concurrency risk | `server/postgres-invoice-repository.ts`: `list()` reads invoice headers, items and payment rows through separate pool queries without a shared read snapshot. A payment committed between those queries could produce a composite response with inconsistent header and payment-row totals. This remains an inferred race; no runtime mismatch was reproduced. | Add a coherent read snapshot or equivalent single-query contract and isolated PostgreSQL concurrent reader/writer regression. Reconcile live rows read-only before any repair decision. |
| FIN-024: JSON invoice-payment idempotency differs from PostgreSQL | Category C/E / P2 in JSON environments, P1 if ever used for real transactions | `server/routes.ts` JSON mode records incoming invoice payments without the PostgreSQL repository's key replay and request-fingerprint check. The current production guard rejects JSON mode, so this is not evidence of a production duplicate. | Backend owner should implement parity if JSON payment writes remain supported, or formally disallow financial writes in JSON mode. Test same-key replay, conflicting payloads and concurrent retry. |
| OPS-002: Production environment validator is not part of current start/build/CI automation | Category C/F / P2 release-control gap | `scripts/validate-production-env.ts` checks production TLS, HTTPS, durable document storage, backup/restore and reconciliation environment evidence. `package.json` exposes it as a separate `validate:production-env` command, while the current start/build scripts and `.github/workflows/ams-ci.yml` do not invoke it. This does not prove production configuration is unsafe. | Authorized release owner should decide whether it belongs in the deployment gate and verify the live environment without exposing secrets. No startup, CI or deployment behavior was modified by this documentation/audit task. |
| OPS-003: JSON rollback procedure conflicts with the production source guard | Category C/F / P1 during a rollback incident | `server.ts` blocks production API work unless the data source is PostgreSQL, while older README/cutover instructions described switching production to JSON. README and `docs/AMS-POSTGRES-CUTOVER.md` now identify the JSON rollback as blocked under current behavior. | Design and rehearse an authorized rollback path on staging. Do not bypass the guard or switch the live production runtime to JSON. |

### 12.3 Additional automated evidence and limitations

The earlier PR #169 adds an isolated mock-fetch API client regression suite covering mutating-request timeout, read timeout and binary upload timeout. This follow-up adapts its assertions to the current API client's clearer messages rather than reverting the newer implementation from PR #168. Combined source/test head `6fb61d4cf4e7ecee9b0d4f385cca66d76d280ded` passed AMS Quality Gate and AMS CI: 572 tests, 552 passed, 0 failed, 20 skipped; typecheck and production build passed; all 8 isolated PostgreSQL integration tests passed; dependency audit found no vulnerabilities in 266 packages; migration packaging and isolated PostgreSQL HTTP smoke checks passed. These checks validate the tested code paths and isolated environment only. Both workflows must pass again on the latest PR head before merging.

The findings above are source-level risks and release-control gaps, not claims that duplicate live payments, a live invoice read mismatch, or unsafe production TLS was observed. No backend endpoint, authentication/RBAC control, database schema/migration, production record, bank operation, finance formula, account mapping or posting rule was modified.


## Active main-line checkpoint — 19 October 2026

### DASH-CTA-001: Dashboard project action opens the authorized creation flow

**Status:** IMPLEMENTED_VERIFIED for source, typecheck, regression tests and production build on `d26aefe57a2936b710fe7f806e8779713645a7b2`; authenticated browser verification remains outstanding.  
**Scope:** Frontend route/presentation only. No API, persistence, business rule, Finance calculation or permission policy change.

**Source:** `src/components/admin/GlobalExecutiveDashboard.tsx`, `src/pages/admin/AdminProjects.tsx`.  
**Test:** `tests/ams-dashboard-overview-hierarchy.test.ts` asserts permission-aware CTA routing and consumption of the `create=1` query.  
**Acceptance:** Users with `canManageProjects` see “New project” and open the existing project-creation drawer from Dashboard. Other users receive “Open Projects” and no creation query. The query is removed using replace navigation; the existing permission check remains authoritative.  
**Validation:** AMS Quality Gate [39156558846](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39156558846) and AMS CI [39156558805](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39156558805) succeeded on the resulting commit. Local lint/test/build could not be run in the current execution environment. Browser deep-link/role interaction remains outstanding.  
**Next action:** Verify direct entry, URL cleanup and drawer access in authenticated browser sessions across permitted and read-only roles during Stage 5.

### PROJ-PLANNING-003: Planning & Delivery exposes source-backed brief, milestones and timeline views

**Status:** IMPLEMENTED_VERIFIED for source, typecheck, regression tests and production build on `c0c63aea176ced4fc5c72613d056f1d5f28c3352`; authenticated browser verification remains outstanding.
**Scope:** Frontend/query navigation and presentation over existing `AgencyProject` and `ProjectMilestone` records only. The current model does not supply separate scope/deliverable, internal QA, client review, revision history or dependency records; those worksheets remain unavailable.

**Source:** `src/pages/admin/AdminProjects.tsx`, `src/lib/projectStore.ts`.  
**Tests:** `tests/ams-sidebar-subnavigation.test.ts`, `tests/projects-module-regression.test.ts`.  
**Acceptance:** Project Brief, Milestones and Timeline have distinct query state; project selector preserves the active worksheet; unknown worksheet values normalize to Brief; leaving Planning & Delivery removes stale worksheet state; no records are invented and no untracked workflow outcomes are inferred.  
**Validation:** AMS Quality Gate [39157322660](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157322660) and AMS CI [39157322657](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157322657) passed on that source commit. No local test/build can be claimed.
**Next action:** Carry direct entry, refresh/back/forward, keyboard and responsive tests into Stage 5.

### TIME-LOGS-002: Billing and project time worksheets are source-backed read-only views

**Status:** IMPLEMENTED_VERIFIED for source, typecheck, regression tests, production build and AMS CI on descendant commit `9067e10f2d11333ada9b655de72241684e869e15`; authenticated browser verification remains outstanding.
**Scope:** Frontend filter/query state and aggregation over the existing canonical time log API response. No time-entry mutation, business rule, access policy, billing rule or Finance posting behavior changed.

**Source:** `src/pages/admin/AdminTimeLogs.tsx`.  
**Tests:** `tests/ams-sidebar-subnavigation.test.ts`, `tests/ams-nine-module-workspace-regression.test.ts`, existing time-log ownership/project-integrity/reconciliation suites.  
**Acceptance:** Billable, non-billable and unclassified flags remain distinct; project grouping uses only recorded project ID/name; totals stay constrained to the shared reporting period; selection filters the underlying rows; page counts use the filtered set. My Timesheet and Timesheet Control remain unavailable because personal scope and review state were not established.  
**Validation:** The initial run exposed an over-escaped test regex. Correction commit [9067e10f](https://github.com/Kapitech-Agency/kapitech-ams/commit/9067e10f2d11333ada9b655de72241684e869e15) passed AMS Quality Gate [39157823377](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157823377) and AMS CI [39157823474](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39157823474), including regression tests, production build, migration packaging and HTTP smoke test. Feature source from this record is included unchanged in that tested descendant commit. Local test/build cannot be claimed.
**Next action:** Browser-check URL deep links, filters, missing project references and empty-period states. Trace billing effects before making any Finance claim.


### VENDOR-SKILLS-001: Vendor directory links only authorized users to the canonical Skills & Service Matrix

**Status:** IMPLEMENTED_VERIFIED for source, typecheck, regression tests and production build on descendant commit `84a0d3b1bf49b02a9720e02dc01a1ab3b7c2d40b`; authenticated browser verification remains outstanding.
**Scope:** Navigation connection only. It reuses the current route policy and current matrix page; it does not change role assignments or permission rules.

**Source:** `src/pages/admin/AdminVendors.tsx`, `src/pages/admin/AdminTeams.tsx`, `src/lib/amsNavigationAccess.ts`.  
**Tests:** `tests/ams-nine-module-workspace-regression.test.ts` checks that both loading/loaded tabs reuse `canAccessAmsRoute`, link to the existing query route and preserve the Admin-only policy.  
**Acceptance:** Skills & Service Matrix is shown only when the current policy permits `/admin/vendors?view=skill-matrix`. The destination renders existing source-backed internal role-focus and vendor-skill coverage panels. Contracts & Rates and Engagement Status remain disabled.  
**Validation:** Initial runs [39158112419](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39158112419) and [39158112445](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39158112445) found an old assertion expecting the tab to stay disabled. Correction commit [84a0d3b1](https://github.com/Kapitech-Agency/kapitech-ams/commit/84a0d3b1bf49b02a9720e02dc01a1ab3b7c2d40b) passed AMS Quality Gate [39158246211](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39158246211) and AMS CI [39158246209](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39158246209), including typecheck, regression tests, production build, migration package and HTTP smoke test. Local tests could not be run.
**Next action:** Browser-verify authorized tab visibility, direct-route denial and back/forward navigation in Stage 5.


### SHELL-GEOMETRY-001: Responsive shell and Dashboard follow the canonical design system

**Status:** IMPLEMENTED_UNVERIFIED. Source changes and configured CI typecheck, regression tests and production build are verified on descendant `main` SHA `eac230c51703535dc4bcfe7e051b0d3d57839b61`; responsive browser/viewport verification remains outstanding.  
**Source:** `src/index.css`; `src/pages/admin/AdminLayout.tsx`; `tests/ams-shared-shell-scroll-regression.test.ts`.  
**Findings:** The single primary `main` scroller and independent sidebar/drawer scroll regions are already enforced by source and regression tests. All `!important` declarations inspected are scoped to print/export rules. The newer `AMS-DESIGN-SYSTEM.md` contract was being overridden by responsive legacy rules: a 720px Dashboard width cap; 18/24 mobile title; 9/10px ad-hoc radii; 7px KPI gap; repeated page-shell padding/gap; and smaller mobile Dashboard card/header typography.  
**Change in this batch:** Removed conflicting narrow-screen Dashboard width, duplicate page-shell overrides, title downscaling and ad-hoc radius/padding overrides. Dashboard KPI cards now use radius 12, spacing tokens, 16px padding, readable labels and 20/28 metric values. Topbar utility groups use radius 8 and token spacing. Shared panel header/body geometry stays owned by the shared components.  
**Tests:** `tests/ams-shared-shell-scroll-regression.test.ts` now asserts canonical page-shell/title/card geometry and prevents the identified responsive overrides from returning.  
**Latest validation:** the complete descendant source/test tree on `eac230c51703535dc4bcfe7e051b0d3d57839b61` passed AMS CI [39204437062](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204437062) and AMS Quality Gate [39204436950](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204436950). Earlier focused source SHAs and CI evidence remain in history. Browser QA at 1440, 1280, 1100, 1024, 900, 899, 768, 600, 599, 390 and 320px as applicable, keyboard/scroll verification, and authenticated production visuals remain Stage 5 acceptance items; they are not claimed as completed.


### FINANCE-NAV-ARAP-001: Receivables & Payables default destination and worksheet order

**Status:** IMPLEMENTED_UNVERIFIED. The approved destination/worksheet order is present on main and the current descendant SHA `78fe090409640e989a60700b1465186d42bf872f` passed both AMS CI and Quality Gate; authenticated browser validation remains pending.  
**Target:** `src/lib/amsModuleSubnavigation.ts`, `src/pages/admin/AdminFinanceWorkspace.tsx`, `tests/ams-sidebar-subnavigation.test.ts`, `tests/finance-ui-consistency.test.ts`.  
**Finding:** The approved Master Structure lists Quotations first in Receivables & Payables, but the workspace appended Quotations after Accounts Receivable, Accounts Payable and Vendors. The persistent workspace tab also opened Accounts Receivable instead of the first approved worksheet.  
**Correction:** Receivables & Payables now opens `/admin/finance?tab=quotations`; the page lists Quotations before the group's existing worksheets. The existing legacy `/admin/finance/quotations` route, Finance permissions, quotation APIs, data records and invoice-conversion behavior remain unchanged.  
**Validation:** Regression assertions added for destination, active workspace state and worksheet order. The batch must pass both AMS Quality Gate and AMS CI. Browser direct-link, refresh/history and role checks remain Stage 5 requirements. No backend/API/database/accounting logic changed.


### CI correction checkpoint — 19 October 2026

**Trigger:** Finance navigation bulk commit `40f646153ae7bb19b8263baa593767d885bb1787`.  
**Evidence:** AMS Quality Gate [39160813145](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39160813145) passed typecheck but regression tests found two stale/incorrect assertions: a legacy test still expected Receivables & Payables to open Accounts Receivable, and the responsive geometry regex omitted the actual child `> div` and expected spacing not present in CSS. These are test expectation defects; the shell selector and Finance navigation implementation are intentional. AMS CI [39160813121](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39160813121) had passed typecheck and was still running security regression checks at last inspection.  
**Correction:** Align the legacy navigation assertion with the approved first worksheet, Quotations, and make the shell regression match the actual responsive selector and whitespace. No production logic, accounting calculations, backend, API, database, or authorization code changed. Both workflows must pass for this correction batch before it is marked verified.


### Follow-up correction — responsive regression selector

The first correction commit `b6abb278d95587bc46326facb6294ee6be7271da` updated the Finance assertion but its CSS regex still included an extra `> div` that the actual KPI card selector does not contain. AMS Quality Gate [39160999440](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39160999440) therefore still failed only the responsive geometry regression. The test now matches the actual `section[aria-label="Executive key performance indicators"] article` selector and accepts the existing whitespace around CSS values. The Finance assertion correction remains in place. Revalidate both workflows on this follow-up commit before marking the batch verified.



### Finance navigation follow-up — primary route collision

**Date:** 19 October 2026. **Scope:** Finance frontend navigation only.  
**Root cause:** The worksheet visibility helper compared each worksheet destination against primary sidebar destinations and hid a worksheet whenever the URLs matched. Finance's primary destination intentionally opens Executive Summary, so that same rule removed Executive Summary from Overview & Control's worksheet row. The previous Quotations ordering fix did not address this collision, which explains why the navigation still appeared incomplete.  
**Correction:** Worksheet visibility now checks route permission only. A URL shared with the parent module is not grounds to hide a worksheet. The worksheet navigation is explicitly labelled **Finance worksheets**, while the persistent five-area navigation remains the group-level navigation. Quotation remains first under Receivables & Payables. Regression tests now cover all five group destinations, active state, the worksheet visibility rule, permissions and Quotation ordering.  
**Boundaries:** No server/API/database/auth/RBAC/finance calculation or posting logic changed. Verify the resulting commit with both AMS CI and AMS Quality Gate; authenticated browser checks and production deployment verification remain separate gates.


### FINANCE-NAV-ACTIVE-STATE-001: Worksheet active-state color

**Status:** IMPLEMENTED_UNVERIFIED. The primary crimson worksheet active state is present on main and the current descendant SHA `78fe090409640e989a60700b1465186d42bf872f` passed both AMS CI and Quality Gate; authenticated browser review remains pending.  
**Finding:** Finance worksheet tabs explicitly used `variant="secondary"`, so the active worksheet looked neutral instead of using the approved crimson active-navigation treatment.  
**Correction:** Use the existing shared `AdminSectionTabs` `primary` variant for the worksheet row. Its active state uses `border-accent/20 bg-accent/10`, following the color-token rules in `AMS-DESIGN-SYSTEM.md`. This avoids page-specific CSS or a new color token. Automated tests assert the worksheet variant and the shared accent styling.  
**Boundaries:** No backend/API/database/auth/RBAC/finance calculation or posting logic changed. Check AMS Quality Gate and AMS CI before calling it validated; authenticated browser review is still needed for visual confirmation.


## Stage 4 structural main-content execution checkpoint — 19 October 2026

### AMS-MAIN-CONTENT-STRUCTURE-001: Dashboard, Inbox and Projects Overview

**Status:** IMPLEMENTED_UNVERIFIED per slice; Stage 4 overall remains in progress.

- Dashboard Overview: commit `8826a3c8528860fa472906db105f851e2270a61f` prioritizes source-backed overdue-task and project-risk exceptions, separates unavailable from zero, keeps outstanding invoices and team utilization in the primary metric strip, and leaves average project budget/cash difference as supporting indicators. AMS CI [39203157223](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39203157223) and Quality Gate [39203157309](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39203157309) passed.
- Dashboard Performance: commit `83a07eee49c199a32df089d74738f0b840c94baa` moved task completion and project attention before time and supporting metrics, uses exact task-status distribution and current-week time bounds. CI [39202525397](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202525397) and Quality Gate [39202525339](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202525339) passed.
- Dashboard Analytics: commit `eabf3a3ecddfe9ddc795d5814b5a20f238152334` moved the selectable-period invoice/expense report before supporting metrics. Assertion wording was corrected in `9f3b254093569517f9b6bdb848d036f44c92079e`; CI [39202815124](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202815124) and Quality Gate [39202815087](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39202815087) passed.
- Inbox Overview/Messages: commits `76916e1fc3c01cfa179f4dce96f2ae7131fe95f4`, `20be67dfd7907ce0f6c1f95a46f03224312e92e7`, `2b092f63f874b24908338d38c976f16a6a2069ca`, `f20927ff8a5dc24db3ca3335d82f8d9a9f282c6e` and `9398b0f884faa3b4055f7d7d0feaa8c2f3a6ff6b` remove duplicate monitor counts/CTA, align the split at 1100px, add source-backed status/priority and unassigned scopes, truthfully distinguish loading/refreshing/stale/unavailable/live, and show total matching triage count against the eight-row visible cap. CI and Quality Gate passed on the latest Inbox source/test SHA `9398b0f884faa3b4055f7d7d0feaa8c2f3a6ff6b`: CI [39204078559](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204078559), Quality Gate [39204078557](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204078557).
- Projects Overview: source commit `7e9aacfa9a5f4be9b34db6494f4aeeaae94a9372` made exception/status analysis primary and removed the duplicate summary metric. The first Quality Gate exposed a stale four-column test assertion; `eac230c51703535dc4bcfe7e051b0d3d57839b61` corrected the assertion for three metrics. CI [39204437062](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204437062) and Quality Gate [39204436950](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39204436950) then passed.
- All source work in these slices remains partial until Stage 5 authenticated browser, viewport, keyboard and explicit visual sign-off checks. No production post-login appearance is claimed. No backend, API, database, auth/RBAC or Finance formula/business logic was changed.


## Stage 4 Clients Directory and Onboarding — 19 October 2026

Status: IMPLEMENTED_UNVERIFIED by source slice; Stage 4/5 acceptance remains in progress.

Directory source: src/pages/admin/AdminClients.tsx; regression coverage in tests/ams-nine-module-workspace-regression.test.ts.
- Status, industry and location filters are now rendered using their existing state and source options. The status control and spend-cap filter remain hidden in the Lead-scoped Onboarding view because status is already constrained there and spend cap is not an onboarding control.
- The directory filter controls and ordering passed AMS CI [39206483169](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206483169) and AMS Quality Gate [39206483182](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206483182) on 3e1897df6c60aa3ae6e2fbe348b13534efa93cc1.

Onboarding source: src/pages/admin/AdminClients.tsx, src/lib/amsModuleSubnavigation.ts; regressions in tests/ams-nine-module-workspace-regression.test.ts and tests/ams-sidebar-subnavigation.test.ts.
- URL-selected Lead scope clears incompatible status/spend-cap filters and pagination. Onboarding is a distinct module workspace, not a duplicate Directory footer filter.
- The workspace plainly states that the underlying onboarding checklists, required-document evidence and kickoff-readiness records are not available as separate source records. Profile readiness explicitly covers client profile completeness only.
- Contextual create/export actions now reflect the Lead scope: new records default to Lead; action labels and the CSV filename identify Onboarding accounts. This changes frontend defaults and labels only.
- The client detail relationship timeline no longer repeats the persistent footer Log interaction action.
- AMS CI [39206734168](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206734168) and AMS Quality Gate [39206734181](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39206734181) passed on 6c42b94fb3db56304015772025fa234564bea716.

Acceptance still pending: Browser verification of direct routes, query/back-forward handling, filter behavior, keyboard/focus and viewport sizes with authenticated authorized roles. Do not mark the separate onboarding checklist/document/kickoff worksheets complete until their canonical records, ownership and evidence are implemented. No backend/API/database/authorization or financial calculations changed.


**Stage 4 content-first follow-up (19 October 2026):** `src/pages/admin/AdminContracts.tsx` and `tests/ams-nine-module-workspace-regression.test.ts` restructure Renewal Schedule as the primary searchable timing queue. Source availability, lifecycle values, canonical links and write behavior remain unchanged. Source/test verification completed on `939cd800a4321c8049e27cb383c1176cf9c8866b`: AMS Quality Gate [39207367066](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367066) and AMS CI [39207367178](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207367178) both passed. Browser, role and viewport behavior remains Stage 5.


**Validation correction:** AMS CI run [39207144110](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207144110) and Quality Gate [39207144113](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207144113) on `9d0db39395d7ed26685b77e66efe86789a1d1688` both stopped at TypeScript checking because the icon `ShieldAlert` remained used by the pre-existing Contracts overview strip after its import was removed during the renewal-only cleanup. The next commit restores that import; no behavior or source records are altered by the correction. Recheck both workflows on the fix SHA.


**Regression assertion follow-up:** On `4af1ec687dd39deeca5933d54023f357b57d14f9`, Typecheck passed but the Quality Gate's new Renewal Schedule regression failed because its JSX slice ended at the filtered-empty conditional before the source-boundary note. The source text itself exists after that branch. The test is corrected to assert the note against the full component while keeping control/register ordering scoped to the schedule region. Re-run CI and Quality Gate on the new commit.


**Stage 4 source slice — Finance Dashboard (19 October 2026):** `src/pages/admin/AdminFinanceWorkspace.tsx` compares issued invoice value, recorded cash in, recorded cash out and net movement proxy for the selected month/quarter/year against the previous comparable period using shared reporting-period helpers. The Dashboard uses an exact-value comparison table followed by selected-period transaction activity; Executive Summary remains company totals and the recent invoice register. The changes are presentation-only. Both CI workflows must pass on the resulting SHA before the slice is marked source/test verified.


### NAV-016: Clients Service & Health telemetry guard

Status: IMPLEMENTED_UNVERIFIED as a source/test slice; live SLA functionality remains unavailable.

Source: `src/pages/admin/AdminClientSlaMonitoring.tsx`.
Regression: `tests/ams-nine-module-workspace-regression.test.ts` asserts that the workspace explicitly declares telemetry not configured; states uptime, MTTR, compliance, incident history and snapshots as unavailable; shows prerequisites only; links to the canonical Contracts & SOW workspace; keeps Service Issues & Feedback, Client Health and Service History target-only; and prevents sample SLA performance values from being introduced.

Verification: AMS CI [39207941880](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207941880) and AMS Quality Gate [39207941811](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39207941811) passed on source/test SHA `98a8662f4228622dabb8afe4500a05db94eb4201`. Telemetry provider setup, configured targets/calendars/pause rules, timestamped incidents and Inbox-owned Service Issues remain canonical dependencies. Authenticated browser, role, keyboard and responsive checks remain Stage 5.


### FIN-AR-AGING-001: Accounts Receivable aging is source-backed and secondary to the register

**Source:** src/pages/admin/AdminInvoicing.tsx, current invoice records scoped to selected currency. The register and pagination remain first. A secondary aging report splits issued, non-cancelled positive invoice balances into current/not-yet-due, 1–30, 31–60, 61–90, 90+ overdue, and missing/invalid due-date buckets. It shows counts, amounts and balance share, and replaces the duplicated AR KPI strip. While the invoice source is blocked, the panel suppresses aging totals, explains the source state and exposes the existing refresh action rather than implying zero debt. No API, account, invoice/payment formula, posting, workflow state or permission policy changed.

**Tests:** tests/finance-ui-consistency.test.ts verifies source/status/positive-balance rules, invalid-date handling, bucket share calculation, register-first ordering, blocked-source recovery and empty state. Both AMS CI and AMS Quality Gate must pass on the resulting SHA. Browser, screen-reader, responsive viewport and production visual verification remain Stage 5.


**Finance breakpoint test correction:** CI and Quality Gate on `b93f08e595831489bd85b15d9107303b9fa06730` failed four source assertions expecting `lg:flex-1` or using over-escaped `min-[1100px]` regexes after the 1100px breakpoint adjustment. Three suites now assert the current implementation instead of the outdated class. This test-only correction is separate from Accounts Receivable aging; verify both suites on the corrective commit before declaring the combined slice green.


### FIN-AP-ORDER-001: Accounts Payable register and payment schedule precede summary

**Source:** src/pages/admin/AdminFinanceWorkspace.tsx, Accounts Payable worksheet. The canonical bill register remains the primary work surface, and the installment schedule uses saved bill terms and linked vendor-bill-payment records. The two-metric strip for total bills and IDR-only outstanding is moved below both tables so it does not interrupt the register-to-payment-schedule flow. Foreign-currency bills remain disclosed separately. No source formula, payment behavior or authorization changes.

**Tests:** tests/finance-ui-consistency.test.ts asserts bill register → payment schedule → summary order while preserving compact card ownership and contract-linked payment distinction. Confirm both AMS workflows on this exact commit; responsive/keyboard browser evidence remains Stage 5.


### FIN-CASH-PETTY-RECON-001: Petty Cash hands off to canonical reconciliation

**Source:** src/pages/admin/AdminFinanceWorkspace.tsx, Petty Cash worksheet. Ledger remains primary; a clear handoff points to /admin/finance?tab=cash-bank, where Cash & Bank owns statement/cash-count reconciliation evidence for account 1100. No duplicate reconciliation record, formula, permission or payment behavior was added.

**Tests:** tests/finance-ui-consistency.test.ts asserts handoff placement after the ledger, intended destination and absence of a second cash-reconciliation writer inside Petty Cash. Exact-SHA CI and Quality Gate plus Stage 5 browser/period verification remain required.


### FIN-ANNUAL-COMPARISON-001: Annual Summary compares comparable calendar years

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`. Selected year comes from the existing Finance reporting-period control; previous year derives from the selected calendar year. Source-operating rows and posted General Ledger rows remain separate, with selected amount, previous amount, difference and measurement basis per line. Source cash values remain labelled proxies; posted GL metrics remain posted-only and preliminary until reconciled.

**Tests:** `tests/finance-ui-consistency.test.ts` verifies selected/previous-year snapshots, current-minus-prior arithmetic, separate source/ledger sections, posting basis, partial-source wording and CSV comparison actions. Exact-SHA CI and Quality Gate plus Stage 5 year-selection/responsive/accessibility verification remain required.


**Annual test correction:** The first complete Quality Gate run after tree restoration passed Typecheck and the new selected/previous-year test but failed the older “Annual Summary includes years represented only by Cash & Bank records” assertion because it expected `getYearKey(movement.date) === selectedYear`. The same canonical source filter now lives in `buildAnnualSnapshot(year)` and is invoked with both years. The assertion is corrected to reflect this factoring and explicitly checks both selected/previous snapshot calls. Retest the correction SHA.


### FIN-CLOSING-PREFLIGHT-001: Separate checklist progress from server-validated closure

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx` Monthly Closing. The checklist remains a canonical `monthly-closing` register; the final close gate is enforced by the existing server and PostgreSQL finance workbook repository. The UI now describes the exact high-level server checks and provides direct Journal and Cash & Bank review routes. It does not calculate or persist a parallel readiness status.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts the workspace layer order, server-gate descriptions, canonical tabs and unchanged close-disabled condition. No backend/API/database/permission/payment/period-close behavior changed. Exact-SHA CI and Quality Gate and Stage 5 browser/responsive checks remain required.


### FIN-JOURNAL-QUEUE-001: Put source transaction posting queue before journal register

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`, Journal. The source posting queue now leads the worksheet and owns Generate source drafts. The persisted General Journal register follows with Add journal entry; mapping reference follows and offers a route to canonical Chart of Accounts. The queue stays a source projection, not a second journal store. No posting, permission or business logic changed.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts order, correct placement of both existing actions and the Chart of Accounts link. Exact-SHA CI/QG plus Stage 5 responsive, keyboard and route/history checks remain required.


### FIN-BS-SUBTOTALS-001: Formal Balance Sheet section subtotals

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`. The posted-ledger Balance Sheet now inserts Total assets, Total liabilities, and Total equity including current earnings after the matching account groups. Values reuse existing aggregate variables and current posted-journal/account-normal-balance logic. Current earnings remain separately identified; account 3200 opening offset and source exception warnings remain.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts statement section order, subtotal-to-existing-variable bindings, posted-only source status and retained exception/offset disclosures. No formula, posting, API, database or permission behavior changed. Exact-SHA CI and Quality Gate plus Stage 5 responsive/accessibility checks remain.


### FIN-PNL-STATEMENT-001: Present posted General Ledger P&L as formal rows

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`. The operating preview comparison and source detail remain primary for operational review. The separate posted General Ledger result now uses a three-row `FinanceDataTable` for Revenue, Expense-account activity, and Posted GL result, with measurement basis, selected-period posted journal count and an export action. The source values come from the existing `getPostedLedgerIncomeStatement` helper; no accounting calculation or posting behavior changes. Empty periods show a dash plus explicit no-posted-entry text, not implied zero.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts the report table follows operating preview, row definitions/bases, export, and honest no-posted-entry handling. Both AMS workflows must pass on the exact commit; Stage 5 browser/role/responsive/accessibility checks remain required.


### PROJ-REGISTRY-DEADLINE-001: Canonical Project Registry deadline filters

Source: src/pages/admin/AdminProjects.tsx and src/lib/projectDeadlineFilters.ts. Project Registry filters canonical targetEndDate by local date-only boundaries: overdue non-completed projects, deadlines today through day 7, days 8–30, and missing/invalid dates. Completed projects do not appear in urgency windows. Reset and pagination behavior are wired to the existing registry filter state. The filter is cleared when leaving Registry to avoid an invisible filter affecting other project worksheets.

Tests: tests/project-deadline-filters.test.ts covers boundary dates, leap days, inclusive/exclusive windows, completed items, and invalid/missing dates. tests/projects-module-regression.test.ts verifies selector and reset pipeline. Exact-SHA CI/Quality Gate and Stage 5 viewport/keyboard/role checks remain required.


### PROJ-TASKS-EMPTY-STATE-001: Canonical Tasks source and Board empty-state hierarchy

Source: src/components/admin/TasksWorkspace.tsx. The workspace records whether a valid canonical task array has ever loaded. Before the first successful response, it presents an unavailable state and the existing API retry rather than implying the queue has zero tasks. Known records remain visible after a later failed refresh with the existing warning. Board gets a separate true-empty/filtered-empty notice, lane empty copy accounts for active filters, and lane geometry follows the Kanban guideline minimum 280px. Board/List still operate on the same record set; no backend, persistence, permission or status-transition behavior changed.

Tests: tests/task-workspace-data-parity-regression.test.ts asserts unavailable/source recovery, Board filtered-empty semantics, lane copy and geometry. Existing task parity tests continue to cover canonical data, permissions and ambiguous update outcomes. Exact-SHA CI and Quality Gate plus Stage 5 responsive/keyboard and Stage 6/8 status lifecycle evidence remain required.


### PROJ-PLANNING-SELECTED-RECORD-001: Preserve explicit project identity in Planning & Delivery

Source: src/pages/admin/AdminProjects.tsx. When the URL provides planningProject, selection now resolves only that ID/slug. A missing selection shows Selected project unavailable and avoids falling back to another project. If canonical project options exist, the user can select one; the default recovery removes only planningProject, preserving the selected worksheet and other query parameters. No API, persistence, RBAC or workflow logic changed.

Tests: tests/projects-module-regression.test.ts verifies explicit-ID resolution, no silent substitution, selector query update and stale-query recovery. Stage 5 must verify direct URL, refresh/back-forward, keyboard and responsive states.


### PROJ-RESOURCES-SELECTED-RECORD-001: Preserve explicit project identity in Project Resources

Source: src/pages/admin/AdminProjects.tsx. When the URL provides resourcesProject, selection resolves only that project ID/slug. Missing selection shows Selected project unavailable and does not fall back to a different project. Available canonical project choices provide recovery; the default action removes only resourcesProject and preserves other query parameters. No API, persistence, authorization or allocation semantics changed.

Tests: tests/projects-module-regression.test.ts verifies explicit selection, unavailable recovery, selector query update and stale-query clearing. Stage 5 must verify direct URL, refresh/back-forward, keyboard and responsive states.


### FIN-OP-BUDGET-SOURCE-001: Do not infer zero expense actuals after source failure

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`. Operational Budget tracks whether the expense source has ever loaded successfully. A successful empty response remains a valid zero; a first-load error presents Actual, Variance and row count as unavailable. If a later refresh fails, last-known actuals remain visible with a stale label and variance is withheld until recovery. A real retry reuses the current Finance loader. No API, formula, persistence, payment, posting or permission behavior changed.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts source-loaded tracking, unavailable/stale states, variance suppression, retry wiring and the existing fresh-source budget-minus-actual formula. Verify both AMS CI and Quality Gate on this exact commit; authenticated browser/viewport evidence remains Stage 5.


### FIN-PROJECT-SOURCE-001: Project Finance distinguishes failed and empty project sources

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`. Project Finance tracks whether the core Projects source has succeeded. A valid successful empty response continues to mean no projects returned; a first-load error uses an unavailable empty state and a retry action; a later failure keeps last-known project rows visible but marks the source stale. No API or Finance calculations change.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts successful-source tracking, the real retry callback, stale vs initial-unavailable copy and the conditional empty-state message. `SUB-FIN-PROJECT-ALLOCATION-PERIOD` remains blocked because the canonical allocation editor does not define a period field.


### FIN-PROJECT-ALLOCATION-PERIOD-001: Do not imply historical periods without a canonical allocation period

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`, Project Allocation. Existing record definitions include project, contract value, vendor commitment, obligations, Team Fee total, allocation percentages and status, but no effective month/quarter. The existing policy note now states that this is the saved allocation per project, not a historical period snapshot. The selected reporting period does not create history.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts the user-facing limitation and rejects a fabricated effective-period filter. A canonical effective-date/history field remains a Stage 6 data-model dependency.


### FIN-TEAM-FEE-SOURCE-001: Team Fee separates source states and date semantics

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`, Team Fee. The supplementary member-fee register and core expense source now each distinguish source-unavailable from a valid empty response; failed refresh labels last-known data stale, and the existing Finance loader provides retry. Copy explains that member milestones filter by due date (or creation date without one), while the displayed paid date is informational and expense source rows use expense date. No settlement, payment or accounting logic changed.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts per-source failure/empty/stale states, retry, dynamic empty messaging and date semantics. Any per-installment due-date/history model remains a later canonical data dependency. Exact-SHA CI and Quality Gate plus Stage 5 browser validation remain required.


### DOC-LIBRARY-PERIOD-001: Remove the invisible global reporting-period filter

**Source:** `src/pages/admin/AdminDocuments.tsx`. The list previously intersected category/search with `matchesDate(updatedAt/uploadedAt/createdAt)` from the global reporting-period context despite no visible document-date control. That could hide older canonical files without explaining why. The register now scopes to its visible category and search, then applies its existing sorting/pagination. File metadata dates remain displayed; the global period still works in worksheets that explicitly use it. No API, storage, authorization or document ownership behavior changed.

**Tests:** `tests/ams-nine-module-workspace-regression.test.ts` asserts that Documents no longer imports/invokes the reporting-period hook or an invisible date filter while preserving the canonical category/search pipeline. Exact-SHA CI and Quality Gate plus authenticated browser file/version/accessibility checks remain required.


**Document period-filter regression correction:** Quality Gate [39224785364](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39224785364) and AMS CI [39224785447](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39224785447) failed because an existing global-period test still expected the old `matchesDate(doc.updatedAt...)` call. The test now verifies the reporting-period shell remains available while Documents is excluded from invisible date scoping. Keep the UX fix and validate both workflows on the corrective commit.


### CMS-SERVICES-PUBLISH-STATE-001: Do not equate saved publication flag with live-site verification

**Source:** `src/pages/admin/AdminCmsServices.tsx`. Save and toggle actions already check the CMS API response and update the canonical record's `isPublished` field. User-facing success messages now confirm that the CMS status was saved and direct the editor to verify the public Services page; they no longer claim that the service was independently confirmed visible or hidden on the public website. Mutation APIs, stored fields and public response filtering remain unchanged.

**Tests:** `tests/cms-services-workflow-regression.test.ts` asserts accurate CMS-state feedback and rejects old messages asserting public visibility. Actual public rendering and responsive/browser behavior remain Stage 5 verification.


### CMS-CASES-PUBLISH-STATE-001: Distinguish saved case-study flag from live public output

**Source:** src/pages/admin/AdminCmsProjects.tsx. Successful save/toggle mutations now confirm that the CMS isPublished flag was saved and direct the editor to verify the public /work page. Messages no longer claim that a public page was independently confirmed visible or hidden. The underlying CMS API, stored field and public filter are unchanged.

**Tests:** tests/ams-nine-module-workspace-regression.test.ts asserts saved-CMS-state wording and rejects the prior live-publication claim. Exact-SHA CI and Quality Gate plus public-render/browser checks remain required.


**Case Studies publication-copy regression correction:** Quality Gate [39225942437](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39225942437) failed on an outdated assertion in `tests/frontend-functional-regression.test.ts` that required the old public-live success string. The assertion now expects CMS-state wording and explicitly rejects the old claim. Publication flags, draft defaults and public route filtering remain untouched; verify both workflows on the corrective SHA.


### CMS-TESTIMONIALS-PUBLISH-STATE-001: Distinguish saved testimonial flag from live public output

**Source:** src/pages/admin/AdminCmsTestimonials.tsx. Toggle and save success copy now confirms that the CMS publication state was saved and asks the editor to verify the public Testimonials page. The UI no longer states that public output has been confirmed visible or hidden. Existing CMS API, persisted isPublished field, legacy flag defaults and public response filter remain untouched.

**Tests:** tests/ams-nine-module-workspace-regression.test.ts and tests/frontend-functional-regression.test.ts assert accurate saved-state wording and reject the previous live-publication claim. Exact-SHA CI and Quality Gate plus public-render/browser checks remain required.


### CMS-CAREERS-PUBLISH-STATE-001: Distinguish saved job flag/deletion from public output verification

**Source:** src/pages/admin/AdminCmsCareers.tsx. Job toggle feedback now confirms CMS Published/Draft state and prompts verification of the public Careers page. Delete confirmation describes deleting the CMS job record, retaining existing applications, and checking public visibility afterwards. API mutations, stored fields, route policy and applicant records remain unchanged.

**Tests:** tests/ams-nine-module-workspace-regression.test.ts asserts accurate publication/deletion feedback, retained application wording, existing API calls and rejection of live-site assertions. Exact-SHA CI and Quality Gate plus public Careers rendering/submission and responsive browser checks remain required.


### CMS-INSIGHTS-PUBLISH-STATE-001: Report the saved editorial state accurately

**Source:** src/pages/admin/AdminCmsInsights.tsx. Successful saves now distinguish Published, published→Draft, existing Draft update and new Draft creation. Published state copy points the editor to the public Insights page to verify actual output. Content APIs, statuses and stored fields are unchanged.

**Tests:** tests/ams-nine-module-workspace-regression.test.ts verifies prior state detection, explicit saved-state wording, current update API, list refresh and the existing public article link. Exact-SHA CI and Quality Gate plus actual public rendering and responsive/browser review remain required.


**Insights validation follow-up:** Exact-SHA runs AMS Quality Gate [39229655648](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39229655648) and AMS CI [39229655663](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39229655663) stopped at typecheck: insights was referenced, but the component's canonical collection state is items. The source and regression matcher now use items; API behavior is unchanged. Confirm typecheck, tests, build and CI on the fix SHA.


### SET-INTEGRATION-STATUS-001: Do not equate notification settings availability with provider connection

**Source:** src/pages/admin/AdminSettings.tsx. A successful api.notifications.getSettings request is now represented as Available, with neutral treatment and an explanation that delivery readiness is reported separately below. The existing production-readiness gate remains the delivery readiness signal. No API, provider configuration or secret exposure changed.

**Tests:** tests/admin-settings-module-regression.test.ts asserts the settings request state enum, availability wording, readiness-gate separation and rejection of Connected semantics for the settings request. Exact-SHA CI and Quality Gate plus Stage 5 route/keyboard/responsive review and Stage 10 provider contract verification remain required.


**Settings regression follow-up:** Runs [39230395340](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39230395340) and [39230395335](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39230395335) failed only the new source assertion expecting `label={notificationLabel}`; `SummaryCard` exposes it as `status={notificationLabel}`. The assertion is corrected to match the actual component contract. Verify the new SHA through typecheck, regression tests, build and AMS CI.


### FIN-ANNUAL-BILLING-LABEL-001: Distinguish invoice value from recognized revenue

**Source:** `src/pages/admin/AdminFinanceWorkspace.tsx`. Annual Summary's operational row now reads “Issued invoice value (excluding tax)” with localized English/Indonesian label and basis. It states that the value uses the IDR issued-invoice date and invoice total less recorded tax, not recognized accounting revenue. Posted GL revenue remains a separate posted-journal measure. No calculations or ledger/posting behavior changed.

**Tests:** `tests/finance-ui-consistency.test.ts` asserts the accurate metric/basis, rejects the ambiguous “Annual Revenue / Invoice Value” within the worksheet, and checks both existing dictionary translations. Exact-SHA CI and Quality Gate must pass; Stage 5 must verify the year-comparison table and localized labels visually.


**Annual Summary test follow-up:** Runs [39231399160](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39231399160) and [39231399029](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39231399029) failed test 330 because the test expected single-quoted dictionary entries but `FINANCE_UI_COPY` uses double-quoted keys and values. The assertion now checks the exact double-quoted map values for English and Indonesian. Source calculation and published content changes remain unchanged.


**Annual Summary assertion cleanup:** Exact-SHA runs [39231747201](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39231747201) and [39231747102](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39231747102) still failed test 330 due one remaining old regex that expected single-quoted dictionary keys. The exact dictionary membership checks already assert the actual double-quoted entries; the stale regex is removed. Source translation dictionary and financial calculations remain unchanged.


### SET-BACKUP-RECOVERY-STATUS-001: Separate snapshot presence, integrity, freshness and restore verification

**Source:** src/pages/admin/AdminSettings.tsx consumes the existing server SecurityStatus fields. “Recovery verified” now requires `backupIntegrity.valid`, `backupFresh === true` and `restoreVerified === true`. The card exposes integrity/freshness/restore evidence and no longer uses “Healthy” or “100% Verified” from integrity alone. Recent-backup rows distinguish the latest record's check from older snapshots because the backup-list API exposes timestamp/size, not per-snapshot verification. The Integration Overview Backup/DR row uses the same readiness conditions.

**Tests:** tests/admin-settings-module-regression.test.ts checks the three readiness criteria, evidence wording, historical per-snapshot limitation, and rejects integrity-only or shared-status logic. API/server logic and backup policies remain unchanged. Exact-SHA CI, Quality Gate, and Stage 5 authenticated/responsive verification remain required.


### VIEW-TEAM-VENDORS: Make the canonical provider directory the primary work surface

**Source:** `src/pages/admin/AdminVendors.tsx`. Removed the four-card snapshot with non-temporal mini-trends from ahead of the register and stopped applying the global reporting-period context to the vendor master list. The source-backed search/category/type/status/vetting controls now precede a named directory heading and live result count; provider cards, empty/error states and pagination remain the primary register. The existing embedded Add Vendor action was retained in the register header. No API, record identity, role policy, route, supplier bill/payment ownership or workflow transition changed.

**Tests:** `tests/ams-nine-module-workspace-regression.test.ts` verifies content order and rejects a returning KPI snapshot/global-period filter. `tests/admin-pages-jsx-regression.test.ts` verifies the shared directory hierarchy/detail drawer; `tests/finance-ui-consistency.test.ts` checks that embedded vendor creation remains available. The first validation runs exposed old snapshot-order assertions, a removed embedded button, and then a duplicate test variable; these were corrected without removing the behavioral coverage.

**Exact-SHA verification:** [AMS Quality Gate run 39801867733](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39801867733) and [AMS CI run 39801867597](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39801867597) both completed successfully for `0494f5ee77284d60abf1de0cc574590e15bd656e`. Browser/role/viewport/keyboard evidence remains **NOT VERIFIED** pending Stage 5. Requirement remains partially complete because Contracts & Rates and Engagement Status lack supported surfaces and visual acceptance has not occurred.


### VIEW-TEAM-TIME: Put the canonical time-entry register ahead of supporting summaries

**Source:** `src/pages/admin/AdminTimeLogs.tsx`. The Time Tracking workspace now exposes reporting-period-derived person and project filters before the canonical register. The billing filter is shown in Billable/Non-billable; billing classification and project summaries now follow the register. General Time Logs metrics are scoped by current filters and appear only in the base view to avoid duplicate summary panels. Both mobile and desktop row presentations distinguish true, false and unset billable values as Billable, Non-billable and Unclassified. No endpoint, persisted record, mutation permission or backend workflow changed.

**Tests:** `tests/ams-nine-module-workspace-regression.test.ts` verifies scope-before-register and supporting-summaries-after-register hierarchy, current scope derivation and unset classification. `tests/admin-pages-jsx-regression.test.ts` checks person/project control presence, responsive register and owner-based delete guard. The source still uses the existing reporting-period context and canonical Time Logs API.

**Exact-SHA verification:** AMS Quality Gate [39808274650](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39808274650) and AMS CI [39808274692](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39808274692) both passed for `977c9e1dcf1a0c3008ae5d168fcf318763f4e086`. Browser/role/viewport/keyboard evidence remains **NOT VERIFIED** pending Stage 5. Requirement remains partially complete because My Timesheet and Timesheet Control are unsupported and Finance/retainer propagation needs later integration verification.


### VIEW-DOCS-LIBRARY: Add source-backed metadata filters and a complete filter reset

**Source:** `src/pages/admin/AdminDocuments.tsx`. Added explicit readiness and linked-record filters ahead of the single canonical document register. Readiness uses the existing `readyOf` rule; linked-record presence uses the saved `relatedEntity` and `relatedId` fields. Active-filter detection now includes URL-backed category, search, readiness and relationship scopes. Reset clears those filter dimensions, removes the `documents` query parameter while preserving unrelated URL parameters, and resets pagination. Sorting remains separate from filtering.

**Preserved contracts:** canonical `api.documents.getAll()` source, category matching, safe loading/error/last-known-good behavior, unauthorized record clearing on 401/403, existing upload/download/delete operations, file validation, access checks, owner/related-record details and existing private-vault boundaries remain. No version model, storage API, second library, or publication/public file path was added.

**Tests:** `tests/ams-nine-module-workspace-regression.test.ts` asserts filter-before-register and upload-after-register order, readiness and relationship filter logic, all-dimension reset and URL category removal, plus no invisible global reporting-period filter. The first Quality Gate run exposed an overly specific selector that assumed `AdminFilterBar` and its slug were on one line; the test selector was corrected without weakening the structural assertion.

**Exact-SHA verification:** AMS Quality Gate [39809646327](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39809646327) and AMS CI [39809646405](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39809646405) passed on `11f1402dc1df439fdf89c14bf0f292bb8bcfb7df`. Stage 5 actual browser/role/responsive/keyboard acceptance is **NOT VERIFIED**. The UI model has no established version chronology, and storage durability/recovery remains an operational dependency.


### VIEW-CMS-SERVICES: Filter the canonical service register by saved publication state

**Source:** `src/pages/admin/AdminCmsServices.tsx`. Added an explicit Published/Drafts filter inside the existing shared filter bar before the service register. Search/category/publication scopes now work together, pagination resets when those scopes change, and Reset clears all of them. The header no longer characterizes the whole managed collection as live; it describes service content and saved publication state for the public `/services` page.

**Semantics preserved:** Published means `isPublished === true`, matching the current service public-response contract. The Drafts view uses the existing non-true state the UI already displays as Draft. No API, source, rich editor fields, CMS identity, role, route or public publishing behavior changed. Status feedback continues to confirm only the saved CMS flag and asks the editor to verify public visibility separately.

**Tests and evidence:** `tests/cms-services-workflow-regression.test.ts` covers the filter ordering/state/reset and publication wording. Exact-SHA AMS Quality Gate [39810591135](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810591135) and AMS CI [39810590666](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810590666) passed for `b682f09eb5a41b89d12215c0488e4c1228b0888a`. Stage 5 authenticated browser/public-output review remains **NOT VERIFIED**.


### VIEW-CMS-CASES: Filter the canonical case-study register by saved publication state

**Source:** `src/pages/admin/AdminCmsProjects.tsx`. Added Published/Drafts scope alongside the existing search and pillar controls, and included it in pagination resets and Reset action behavior. The empty-state copy names publication scope. The existing normalizer's legacy rule is preserved: `isPublished !== false` means Published, while only explicit false means Draft. New records still begin as drafts. No backend/public route or mutation behavior changed.

**Tests and evidence:** `tests/ams-nine-module-workspace-regression.test.ts` verifies filter/register order, legacy semantics, all-filter reset and empty-state guidance. Exact-SHA AMS Quality Gate [39810998385](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810998385) and AMS CI [39810997918](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39810997918) passed for `4d975a0a1da92df5e2871fdc38a71eeb0ac2775d`. Stage 5 authenticated browser and actual public `/work` visibility checks remain **NOT VERIFIED**.


### VIEW-CMS-INSIGHTS: Reset all editorial filters from the canonical register

**Source:** `src/pages/admin/AdminCmsInsights.tsx`. The existing filter bar already supports search, language, editorial status, category, author and featured state using server-backed query parameters. Added a localized Reset filters action that clears all six filters and returns pagination to page one. The action is disabled only when all filters are neutral and remains within the existing filter bar before transient status feedback and the register.

**Preserved contracts:** no API/source, CMS status, translation, author/category taxonomy, block editor, content record, permission or public route changes. The reset acts only on list query state; request sequence guards and server-paginated totals continue unchanged. Success feedback still distinguishes saved CMS state from public-page visibility.

**Tests and evidence:** `tests/ams-nine-module-workspace-regression.test.ts` checks hierarchy, all filter resets, neutral disabled state, and unchanged API use. AMS Quality Gate [39811959165](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959165) and AMS CI [39811959406](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39811959406) passed on `c0abd3a211e293d9e359c40b29eec12cc851f420`. Stage 5 direct-route, actual public-output, responsive and keyboard evidence remains **NOT VERIFIED**.


### VIEW-CMS-TESTIMONIALS: Scope the canonical register by saved publication state

**Source:** `src/pages/admin/AdminCmsTestimonials.tsx`. Added an existing-primitive publication selector beside testimonial search. The state scope filters the current normalized list before pagination; Reset clears search and publication scope; changes return to page one. The existing normalization rule (`isPublished !== false`) is preserved, so missing legacy flags remain Published and explicit false is Draft.

**Preserved contracts:** the existing `api.cms.getTestimonials()`, create/update/delete calls, record IDs, publication toggle, editor drawer, rating/quote/attribution fields, permission boundaries, public route and saved-status feedback remain unchanged. Filtering is frontend list state only; it does not edit records or assert that public cache/deployment output changed.

**Regression and exact-SHA evidence:** `tests/ams-nine-module-workspace-regression.test.ts` checks publication filter order, state predicate, legacy semantics, reset, page-one behavior and localized options. Source patch [62a36021](https://github.com/Kapitech-Agency/kapitech-ams/commit/62a36021267e243cb11b8811b505d8da885b3c93); corrected and validated source/test SHA [7186f3e7](https://github.com/Kapitech-Agency/kapitech-ams/commit/7186f3e7fe4e36f8b7954702a1e23998320082bc). AMS Quality Gate [39824956954 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39824956954) and AMS CI [39824955735 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39824955735). Authenticated browser, role, keyboard and public-output evidence remains **NOT VERIFIED**.


### VIEW-CMS-CAREERS: Contract review, no structural change required in this slice

**Source reviewed:** `src/pages/admin/AdminCmsCareers.tsx`, with existing tests in `tests/ams-nine-module-workspace-regression.test.ts` and `tests/frontend-functional-regression.test.ts`.

The current composition matches the approved separation: role-aware Jobs and Applicants tabs; independent job/application filters and registers; canonical career applications filtered from the existing `api.leads.getAll()` response by `type === 'career'`; URL query state for the Applicants view; separate pagination; restricted applicant detail drawer. Recruitment History remains visibly disabled as target-only because no persisted canonical event history is available. No structural change was made to Careers, and the view remains **PARTIALLY COMPLETE** pending authorized role, applicant privacy, public-output, responsive and keyboard review.

### VIEW-SETTINGS-OVERVIEW: Put readiness context before the backup evidence register

**Source:** `src/pages/admin/AdminSettings.tsx`. Reordered existing sections from SummaryCards → Recent Production Backups → System Integrity to SummaryCards → System Integrity/readiness/reason → Recent Production Backups. Added semantic section markers for regression identification. This fixes the content-order mismatch with the required system status/readiness → evidence register hierarchy.

**Preserved contracts:** no backend/API, source, data, role guard, direct route/query, snapshot action, integrity action or backup status formula changed. Backup health still requires valid integrity, fresh backup and verified restore; older snapshots do not inherit the latest snapshot's checks.

**Tests and exact-SHA evidence:** `tests/admin-settings-module-regression.test.ts` enforces the content order and keeps the evidence semantics in view. [Source/test commit c964f1a7](https://github.com/Kapitech-Agency/kapitech-ams/commit/c964f1a7bc7cc64a35561db0b22dded2a84ec1d7). AMS CI [39825954237 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39825954237); the AMS Quality Gate test/build job [39825954065 succeeded](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39825954065), but its run-level metadata was still marked `in_progress` when inspected. No authenticated browser screenshots were captured.


### VIEW-SETTINGS-AUDIT: Separate filters from the canonical register and inspect a selected event safely

**Source/test SHA:** [df1dd2ab](https://github.com/Kapitech-Agency/kapitech-ams/commit/df1dd2aba4804f08f01f4e6576cab6da4c515282). Source changes started in [d7106446](https://github.com/Kapitech-Agency/kapitech-ams/commit/d71064466d183e4a78ad465d2f69407828bb516f), with regression hierarchy assertions corrected in [57b7bf36](https://github.com/Kapitech-Agency/kapitech-ams/commit/57b7bf36e72b19c8065f75b2b99ff04caa387379). The final option lists use explicit `string` types after exact-SHA typecheck caught an `unknown` inference in the first draft.

**Structural change:** the audit workspace now follows title → separated responsive filter bar → feedback → existing chronologically returned read-only register → selected event drawer. Actor and event selectors use unique values from loaded canonical records, while shared reporting-period filtering and the existing outcome/search/export/pagination behavior remain intact. Reset clears local query/actor/event/outcome state and returns to page 1 without altering the global report period.

**Data/safety boundaries:** current `SecurityAuditLog` has ID, timestamp, action, actor, IP, details and severity. The current endpoint also returns actor role and user-agent context. The drawer shows those safe explicit fields and omits `hash`, `prevHash` and arbitrary `metadata`. The model has no structured target/resource field; target references can only be searched when present inside details. A dedicated target filter is deliberately not fabricated in this frontend-only scope.

**Tests and evidence:** `tests/admin-settings-module-regression.test.ts` checks actor/event option sources, predicates, time scope, filter reset, selected event details, and suppression of hash/arbitrary metadata fields. AMS Quality Gate [39827295446 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39827295446) and AMS CI [39827294995 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39827294995). No browser screenshot or authorized-role test was captured; Stage 5 review remains required.


### VIEW-SETTINGS-ACCESS: Scope the canonical account register

**Final source/test SHA:** [f5d4bf9f](https://github.com/Kapitech-Agency/kapitech-ams/commit/f5d4bf9fac2a3d6038ea06c5c5c5c0964c8d617e), following UI implementation [d602c798](https://github.com/Kapitech-Agency/kapitech-ams/commit/d602c7985f10c26aaf05ab501341467135701d07) and a test-only reset-assertion correction.

The existing server-managed account register now has text search by name/username/email, role and status filters, Reset and a visible-vs-total count. Role options come from current canonical account records; filtered records drive responsive cards/table and pagination. Query changes return to page 1. Filtered-no-match is separate from a genuinely empty canonical list and an unavailable source.

The account workspace remains guarded by `canManageAdminAccounts`; no auth/RBAC policy, root/master deletion protection, account mutation, MFA or password workflow changed. Regression checks cover filter predicates, hierarchy, pagination and states. AMS Quality Gate [39828405506 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39828405506) and AMS CI [39828405520 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39828405520). Authorized browser/accessibility evidence remains unverified.


### VIEW-SETTINGS-INTEGRATIONS: Distinguish unknown server evidence from explicit review states

**Final source/test SHA:** [e80b9c11](https://github.com/Kapitech-Agency/kapitech-ams/commit/e80b9c119f528714ae69314160beafcf97798fd7), following UI changes in [709f5c59](https://github.com/Kapitech-Agency/kapitech-ams/commit/709f5c5921725c2215743ffe5ea3319e464fe060), declaration-order correction [0f5408ac](https://github.com/Kapitech-Agency/kapitech-ams/commit/0f5408ac66ea1848dadb2b1833b2ef4ff533274a), and regression assertion corrections.

The Integration Overview previously substituted a PostgreSQL label when no datasource was returned, represented missing document/backup signals as review, and treated undefined gates like false. It now distinguishes positive, explicit negative and unknown states for datasource, document vault, backup recovery and runtime/encryption/MFA/notifications. A separate evidence boundary explains that notification-settings availability and production readiness do not confirm provider connectivity, delivery or sync. Website & CMS copy says the existing form manages CMS metadata and does not report provider/sync health.

No API, server, permission, session or write workflow changed. Kopra H2H remains unavailable. Tests cover state sources, evidence-boundary text, nested route behavior and the disabled Kopra item.

**Exact-SHA evidence:** AMS Quality Gate [39832811773 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39832811773); AMS CI [39832811706 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39832811706). Browser/provider evidence has not been captured; the requirement remains partially complete.


### VIEW-SETTINGS-PREFERENCES: Requirement gap identified, implementation deliberately blocked

Reviewed `src/pages/admin/AdminSettings.tsx`, `src/lib/amsModuleSubnavigation.ts`, `src/lib/apiClient.ts`, and the mandatory Settings composition contract. The active Settings tab union and workspace navigation expose only System Overview, Users & Access, Audit Log and Integrations. The client includes application-level CMS metadata and notification-settings APIs but no canonical per-user preference model or endpoint.

No frontend was added. Repurposing shared CMS/notification settings or adding localStorage-only presentation controls would not satisfy the requirement that personal preferences have reliable save/reset semantics and not affect other users. Record `VIEW-SETTINGS-PREFERENCES` as **MISSING / BLOCKED BY CANONICAL SOURCE CONTRACT** until an approved per-user source, fields and persistence behavior exist.

Next Stage 4 slice returns to the roadmap's prescribed start: Dashboard → Overview. No source/test changes were made for this review.


### VIEW-DASH-OVERVIEW: Add recent activity from the existing permission-filtered audit response

**Final source/test SHA:** [2b926a98](https://github.com/Kapitech-Agency/kapitech-ams/commit/2b926a98c55660fad47c66497e07f034080e805a); UI change [efe57f61](https://github.com/Kapitech-Agency/kapitech-ams/commit/efe57f61caec877d9de94f8e7f42ff14c00034a2), with a test-only correction in the final SHA.

The Overview now includes a Recent Activity panel after supporting metrics. It uses recentActivity returned by the existing dashboard endpoint, which obtains audit events from the canonical audit repository only when the server-side actor can view audit logs. The frontend panel also gates visibility with canViewSecurityAuditLogs. It shows at most five events using action, actor, UTC timestamp and severity, with a link to Settings → Audit Log. Loading, unavailable and genuine empty-list states are separate.

The panel intentionally omits IP/user-agent, free-form details and chain/hash/arbitrary metadata. The existing response lacks a structured owning-record target or URL, so a direct record link is not available and was not invented. No API, backend, auth or permission rule was changed.

Regression tests/ams-dashboard-overview-hierarchy.test.ts asserts hierarchy, permission-gating, source-backed state, safe fields and canonical log destination. AMS Quality Gate [39834166472 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39834166472) and AMS CI [39834166397 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39834166397). Browser/accessibility evidence remains open.


### VIEW-DASH-PERFORMANCE: Combine project risk signals and prioritize exceptions before truncation

**Final source/test SHA:** [03872a67](https://github.com/Kapitech-Agency/kapitech-ams/commit/03872a6725fb9338e46a89f2d5a4c38ff3b433fe); code change [c6289365](https://github.com/Kapitech-Agency/kapitech-ams/commit/c62893650223bb9f80477e6d1fdfa737bfe1df55), followed by a regression correction for the existing source-order assertion.

The “Projects needing attention” list used health OR status, meaning a populated health value could mask a risk-bearing status. It also took the first eight records before sorting. The view now combines both source fields, prioritizes explicit overdue projects, orders due dates ascending, and uses name/title as deterministic fallback before the existing eight-item limit.

No new risk signal, metric, source or mutation was added. Task distribution, tracked-time window, project set and the existing at-risk/overdue labels remain unchanged. Regression tests/ams-dashboard-overview-hierarchy.test.ts validates the combined signals and order.

Exact-SHA AMS Quality Gate [39836485893 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39836485893), AMS CI [39836486043 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39836486043). Browser-based validation remains open.


### VIEW-DASH-ANALYTICS: Select a single business report and expose exact financial values

**Source/test SHA:** [d812fe60252cec1385b74d6ac88b04ef8306fe1d](https://github.com/Kapitech-Agency/kapitech-ams/commit/d812fe60252cec1385b74d6ac88b04ef8306fe1d).

**Structural change:** Dashboard Analytics no longer places a financial trend next to a project-status panel and then appends a mixed-scope KPI strip. It now places report selection and scope context first and displays one focused report at a time: Financial movement, Receivables, or Project status. Financial movement includes an exact-value table with date boundaries, period totals, invoice/expense date definitions, source and currency context. Receivables and project status are identified as current snapshots, not filtered trends. Each report drills into its canonical owner via existing routes.

**Data/behavior boundary:** Retains current invoice, expense and project snapshot sources, established statuses and existing financial amount/balance fields. Trend values are unchanged; only bucket date boundaries are added as presentation metadata. The arithmetic invoice/expense difference is not renamed or treated as posted profit. No API, backend, database, route, auth/RBAC, persistence, or Finance calculation/posting change.

**Regression coverage:** `tests/ams-dashboard-analytics-structure.test.ts`, `tests/ams-dashboard-overview-hierarchy.test.ts`, `tests/ams-nine-module-workspace-regression.test.ts`, and `tests/frontend-functional-regression.test.ts` assert report selection/order, exact period values, source date definitions, empty/unavailable behavior, snapshot semantics and canonical drill-down destinations.

Exact-SHA AMS Quality Gate [39840053958 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39840053958) and AMS CI [39840053891 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39840053891). **Browser/visual/accessibility status: NOT VERIFIED.** Authenticated role, viewport/reflow, keyboard/focus and touch/chart checks remain in Stage 5, followed by the mandatory explicit user sign-off.


### VIEW-INBOX-OVERVIEW: Expand the default queue to all open actionable records

**Source/test checkpoint:** [620abf26ca51336db7efd186e2ff395eeb159722](https://github.com/Kapitech-Agency/kapitech-ams/commit/620abf26ca51336db7efd186e2ff395eeb159722); structural code commit [94c55740](https://github.com/Kapitech-Agency/kapitech-ams/commit/94c55740b8f1907624e4edb2273f9600a36ad1bd).

The default Needs action queue previously filtered only `status === 'new'`, hiding unassigned open records and urgent/high-priority records in other open statuses until another scope was selected. It now includes open records satisfying any of those conditions. The same pure tested predicates compute Needs action, Unassigned and Priority counts; closed records are excluded from those scopes. Existing search/status/priority/global period filters, source records, age/priority ordering, max-eight preview, split-pane selected-record review and permitted actions remain unchanged.

Files: `src/pages/admin/AdminInbox.tsx`, `src/lib/inboxTriage.ts`, `tests/ams-inbox-triage.test.ts`, `tests/ams-nine-module-workspace-regression.test.ts`.

Exact-SHA AMS Quality Gate [39841510406 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39841510406) and AMS CI [39841510154 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39841510154). **Authenticated browser/visual/accessibility state: NOT VERIFIED.** The inspected inbound record contract has no real due-date/SLA field for this workflow, so no follow-up date or reminder was fabricated. Continue Stage 4 with Inbox → Messages, then complete Stage 5 visual/responsive/accessibility review and obtain explicit user sign-off before broad Stage 6+ work.


### VIEW-INBOX-MESSAGES: Promote source and owner context in the canonical message register

**Exact source/test SHA:** [22f41ee82802390998c67472358922df73a2d103](https://github.com/Kapitech-Agency/kapitech-ams/commit/22f41ee82802390998c67472358922df73a2d103).

All Messages exposes owner/channel filters backed by the existing submission collection and includes those predicates in the same filter used by the displayed queue/register. Reset clears the new selections, and changing tabs resets scoped filters consistently. Accessible Review/Table controls let users switch the same records between selected-record review and table mode. The general table surfaces sender/context, channel, source, Owner/PIC, status/priority, received time and actions. Sales Inquiries retains requested services and budget columns. The canonical type fallback, Careers exclusion, source/API, route/query state, permission rules and mutation workflow are preserved.

**Changed files:** `src/pages/admin/AdminInbox.tsx`, `tests/ams-inbox-messages-workspace.test.ts`, `tests/ams-nine-module-workspace-regression.test.ts`.

Exact-SHA AMS Quality Gate [39842788314 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39842788314) and AMS CI [39842788268 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39842788268). **Authenticated browser, responsive, keyboard/touch and visual state: NOT VERIFIED.** No due/SLA, project relation or message-history fields were fabricated. Next implementable Stage 4 slice is Projects → Planning & Delivery; Inbox Follow-ups and Routing/Templates remain blocked by missing canonical model/workflow contracts.

### VIEW-CLIENTS-DIRECTORY: Restore the desktop identity cell and promote recorded service context

Exact source/test SHA: [efa9d4adb8da82a603b1250ab32847e8bbae5277](https://github.com/Kapitech-Agency/kapitech-ams/commit/efa9d4adb8da82a603b1250ab32847e8bbae5277); UI source change [69dd56c3](https://github.com/Kapitech-Agency/kapitech-ams/commit/69dd56c385d1a71c62820b1f823844af16f1362f).

The desktop client table had a Client account header, yet normal client rows omitted its matching identity cell and began with industry. This misaligned row semantics and removed the client name from the primary desktop register. The fix gives each row a shared first cell for company identity and record ID. Normal client rows additionally expose recorded Service / Retainer context immediately after status. Loading rows and empty states use the correct separate column counts for Lead onboarding and normal client directory scopes; table width allows the added context without narrowing every column.

No owner/account manager field exists on the canonical AgencyClient model, so the UI keeps owner unavailable instead of treating primary contact as owner. No API, backend, database, permission or business workflow changes.

Tests: tests/ams-client-directory-register-structure.test.ts and tests/admin-pages-jsx-regression.test.ts.

Exact-SHA Quality Gate [39844036978 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39844036978) and CI [39844037103 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39844037103). Authenticated visual/role/accessibility status: NOT VERIFIED. Next Stage 4 slice: Finance → Overview & Control.

### VIEW-FIN-OVERVIEW: Prioritize live overdue exceptions before financial summary metrics

**Current source/test SHA:** [69f46b3f648a844ce1765d0bb885c79275eabe23](https://github.com/Kapitech-Agency/kapitech-ams/commit/69f46b3f648a844ce1765d0bb885c79275eabe23). Finance Executive Summary source/test sequence: [15fefd15](https://github.com/Kapitech-Agency/kapitech-ams/commit/15fefd15340d3c57d6ecab077cedacdac012aa34), assertion correction [7f923146](https://github.com/Kapitech-Agency/kapitech-ams/commit/7f923146a92bf252cff0382fc3706ed5f116d58d).

Executive Summary now places selected-period context first, then the current overdue-invoice exception queue, then period KPIs, definitions and recent invoices. The exception queue is independent of selected invoice issue-date period, uses `getEffectiveInvoiceStatus` and outstanding balance, preserves all matching rows for pagination, labels source stale/unavailable states and links to Accounts Receivable. Period KPIs distinguish invoice value issued, recorded invoice payments, expense records and current receivables. Current receivables are explicitly a snapshot; cash movement remains distinct from client payments and posted GL profit.

**Changed files:** `src/pages/admin/AdminFinanceWorkspace.tsx`, `tests/ams-finance-overview-structure.test.ts`.

Exact-SHA AMS Quality Gate [39846034348 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39846034348) and AMS CI [39846034388 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39846034388). Typecheck, regression tests, production build, migrations, security regression tests, PostgreSQL integration, dependency audit, packaged migration verification and HTTP smoke test passed. No finance math, posting, database, API, route or permission changes. **Browser/visual/role/accessibility status: NOT VERIFIED.** Proceed in Stage 4 with Team & Resources → Team & Capacity, preserving the distinction between planned allocation, tracked time and configured capacity.


### VIEW-TEAM-CAPACITY: Make historical time ranges and the 40-hour reference explicit

**Source/test SHA:** [8eaea7e097835fd5519dfc952bf85379d5c828d5](https://github.com/Kapitech-Agency/kapitech-ams/commit/8eaea7e097835fd5519dfc952bf85379d5c828d5); source patch [9eb71c9c](https://github.com/Kapitech-Agency/kapitech-ams/commit/9eb71c9cd15e43fb3e8e2fe0a61a5251333d5dea).

Historical tracked-time columns now display concrete calendar-week date ranges. Percentages are labeled as recorded time compared with a 40h/week reference, not verified utilization or actual availability. CSV labels expose the same period and calculation basis. Historical time and planned resource-allocation rows remain distinct. No calculation, source contract, assignment, availability calendar or Finance rule changed. Exact-SHA Quality Gate [39847121119 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39847121119) and CI [39847121189 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39847121189). Browser/visual/accessibility state: **NOT VERIFIED**.

### VIEW-TEAM-CAPACITY: Prioritize the Roles & Departments source matrix

**Latest source/test SHA:** [b874a0bacf6304f4c21ec1e0ca8c0c1febd34861](https://github.com/Kapitech-Agency/kapitech-ams/commit/b874a0bacf6304f4c21ec1e0ca8c0c1febd34861); structural source commit [d06b5d6f](https://github.com/Kapitech-Agency/kapitech-ams/commit/d06b5d6f5d5bc876ddd71ad15ac3d95a5dd0769d).

Roles & Departments no longer places duplicate counts for department, role, team members and active records ahead of the grouped matrix. The permission note is consolidated into the matrix description, which preserves the distinction between roster metadata and Settings access policy. Existing unavailable/empty states and route policy remain unchanged. No permissions, role assignment, model or endpoint changed. Exact-SHA Quality Gate [39847810072 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39847810072) and AMS CI [39847810037 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39847810037). Browser/visual/accessibility review remains open. Continue Stage 4 with Skills & Service Matrix; preserve the Admin-only route.


### VIEW-TEAM-SKILLS: Keep internal and vendor skill-source states independent

**Source/test SHA:** [e7ec1292a6dea9d825b2d95d056cb37457d70f76](https://github.com/Kapitech-Agency/kapitech-ams/commit/e7ec1292a6dea9d825b2d95d056cb37457d70f76); source patch [fec89326](https://github.com/Kapitech-Agency/kapitech-ams/commit/fec893269c7d379900a7eaba874f7aa779cf8501).

Internal capability focus and vendor skill coverage now use source-specific availability. A failed member source does not mask loaded vendor skill records; a failed vendor source does not hide the internal role matrix. If stale rows remain, the view preserves them with source-failure context; it does not reinterpret unavailable as confirmed empty or zero. Loading and confirmed-empty are distinct. The role matrix remains a role/division-derived focus description, not proficiency or qualifications. Vendor skills remain those recorded in the current vendor register. No new model, API, permission, route or HR feature was introduced.

Changed files: src/pages/admin/AdminTeams.tsx, tests/team-resource-data-availability.test.ts, tests/ams-team-skill-matrix-source-independence.test.ts. Exact-SHA Quality Gate [39849098853 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39849098853) and AMS CI [39849099042 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39849099042). Browser/visual/role/accessibility state: **NOT VERIFIED**. Continue Stage 4 at Documents → Library.


### VIEW-DOCS-LIBRARY: Search by linked client/project name and enforce canonical link semantics

**Source/test SHA:** [6da546a61792c6f01ef9609fa1feff9f894bf41f](https://github.com/Kapitech-Agency/kapitech-ams/commit/6da546a61792c6f01ef9609fa1feff9f894bf41f). Previous structural baseline [11f1402d](https://github.com/Kapitech-Agency/kapitech-ams/commit/11f1402dc1df439fdf89c14bf0f292bb8bcfb7df) introduced the metadata filters and reset behavior.

The Document Library search text now includes canonical linked Client/Project names and IDs in addition to the existing document title, description, category, department, tags, access metadata and file type. The linked name is resolved only against the existing authorized client/project reference list; the record ID remains searchable if its display name is unavailable. The linked/unlinked filter is true only for a non-empty ID whose entity is exactly Client or Project. General/unknown entity IDs do not imply a canonical link.

**Changed files:** src/pages/admin/AdminDocuments.tsx, src/lib/documentLibrarySearch.ts, tests/ams-document-library-linked-record-search.test.ts, tests/ams-nine-module-workspace-regression.test.ts.

Exact-SHA Quality Gate [39849779600 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39849779600) and AMS CI [39849779585 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/39849779585). Typecheck, regression tests, production build, security tests, PostgreSQL integration, migration package check and production HTTP smoke passed. No API, storage, file permission, route or business workflow changed. **Browser/visual/role/accessibility: NOT VERIFIED.** Continue Stage 4 with Website CMS → Careers & Applicants.


### VIEW-CMS-CAREERS: Keep the last successful applicant register visible during refresh recovery

**Implementation SHA:** [de42f24c9af61dd26c69272a221f9e1ad87c008d](https://github.com/Kapitech-Agency/kapitech-ams/commit/de42f24c9af61dd26c69272a221f9e1ad87c008d). Final test SHA: [d185484084027089eea3cad16764f7e4bd437a4b](https://github.com/Kapitech-Agency/kapitech-ams/commit/d185484084027089eea3cad16764f7e4bd437a4b).

The applicants register now keeps the last successfully loaded records visible while a refresh is running. If refresh fails after a successful load, a warning distinguishes stale data from current source state. If the last successfully loaded list was empty, the UI no longer reports a confirmed current empty result after a failed refresh. Initial-load skeleton and unavailable states stay separate.

**Changed files:** `src/pages/admin/AdminCmsCareers.tsx`, `tests/ams-careers-applicant-refresh-state.test.ts`. Applicant ownership in Careers, Inbox applicant exclusion, current route access, status updates and existing data contracts remain unchanged. No backend, API, database, permission, route, package or lockfile changes.

Exact-SHA Quality Gate [40066713946 passed](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40066713946). AMS CI [40066713864 failed at dependency audit](https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/40066713864) due one high `body-parser` denial-of-service advisory for versions below 1.20.9. Typecheck, migration, security regression and PostgreSQL integration passed; downstream build and smoke steps were skipped. Do not claim full CI passed. Resolve the audit finding in an authorized dependency-maintenance task, outside this UI slice. Browser/visual/accessibility status: **NOT VERIFIED**.

Next Stage 4 slice: Settings → System Overview. Verify source-backed status, freshness and exceptions. Distinguish backup existence, integrity verification and proven restore.
