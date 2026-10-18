# AMS Implementation Traceability Register

**Purpose:** Prevent AI and human implementers from confusing planned functionality with verified implementation.  
**Status:** Maintained evidence register containing dated audit/checkpoint snapshots. Some entries may not reflect the latest `main` HEAD until re-audited; do not treat historical branch/PR status as a live GitHub status.  
**Authority:** `AGENTS.md` defines working rules; the master guide defines target requirements. Current implementation status must be re-verified against current source, latest CI results, and production evidence where relevant.

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
| UX-001: Shared AMS layout retained | IMPLEMENTED_UNVERIFIED | `src/pages/admin/AdminLayout.tsx`, existing AMS primitives | No design system or dependency replacement; responsive visual review remains pending. |
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

Renewal Schedule is available from either Agreements worksheet at `/admin/contracts?view=renewals`. It derives rows from active contract records with a valid renewal or end date, and active retainer terms stored on canonical client records. Active entries without dates remain visible as “Date not set.” Metrics are withheld when either source is unavailable; a partial-source warning avoids treating a failed source as zero. The schedule links back to the owning contract or retainer register and never creates a second renewal dataset, recalculates retainer billing, or automatically expires agreements. Contract History remains target-only.

**Verification:** AMS Quality Gate and AMS CI passed on code SHA `f29e6ba2da1e0a7deb40f86dac75096ef127bdd4`. Quality Gate passed typecheck, 711 regression tests (691 passed, 0 failed, 20 skipped), and production build. AMS CI passed PostgreSQL migrations, security regression tests, PostgreSQL integration tests, dependency audit, production build, packaged-migration verification, and production HTTP smoke test. Browser-level and role-specific checks remain unverified.

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
