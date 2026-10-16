# AMS Implementation Traceability Register

**Purpose:** Prevent AI and human implementers from confusing planned functionality with verified implementation.  
**Status:** Baseline register template. Update the applicable entries whenever requirements are audited or delivered.  
**Authority:** AGENTS.md defines working rules; the master guide defines target requirements.

## 1. Mandatory principle

A feature is not implemented merely because it appears in documentation, has a route, responds to a click, changes local state, renders a fixture/mock, or passes a build.

A capability is verified only when its UI, persisted behavior, API validation, server-side authorization, canonical relationships, failure behavior, cross-module effects, and relevant tests have evidence.

This register defines what must be assessed; it does not claim every feature's current status.

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


## 11. Data integrity, API contract, security, and financial consistency audit — 16 October 2026

**Checkpoint and scope:** The audit started from workflow-audit checkpoint `498f39724c133634d9b98cc25cd77a625cd5c3ff` (PR #168 head) and is isolated on `audit/ams-data-integrity-review-2026-10-16`. The audit changes are submitted separately as PR #170, stacked on PR #168. No production records were read or mutated; no server/API/authentication/RBAC/schema/migration/finance formula/bank/public-site implementation was changed.

### 11.1 Data-source selection and runtime evidence

| Environment | Verified implementation/configuration | Verification status |
|---|---|---|
| Development | `server/data-source.ts` selects the normalized `KAPITECH_DATA_SOURCE`; unset defaults to `json`. Explicit `postgres` selects the PostgreSQL repository. | IMPLEMENTED_VERIFIED at source level; actual developer process environment not inspected. |
| Test/CI | The CI workflow used an isolated PostgreSQL service/database for migration, integration, and HTTP smoke checks. The exact audit-head CI logs show `KAPITECH_POSTGRES_URL` pointing to the test service; its value is masked and not recorded here. | IMPLEMENTED_VERIFIED for that isolated CI run only. |
| Production configuration guard | `server.ts` requires production runtime, `KAPITECH_DATA_SOURCE=postgres`, a valid PostgreSQL URL, and the data-encryption key. A configuration error makes readiness return 503 and the API middleware return 503 rather than serving JSON-backed business writes. PostgreSQL initialization/migration is marked unready and API calls receive 503 until the runtime is ready. | IMPLEMENTED_VERIFIED at source level; current Hostinger runtime status remains unverified. |
| Live production data source/readiness | The audit shell could not resolve `ams.kapitech.id`; the web fetcher also could not open the health endpoints. No Hostinger runtime-configuration connector was available in this session. No environment value or secret was inferred from README/CI. | BLOCKED_EXTERNAL / environment evidence missing. Required evidence: an authorized operator observes `GET /api/health/ready` reporting `dataSource: postgres` and the authenticated `GET /api/system/production-readiness` returns HTTP 200 with `productionReady=true` on the currently deployed release. Do not share credentials or secrets in the report. |

**Confirmed runtime/runbook inconsistency:** `docs/AMS-POSTGRES-CUTOVER.md` and the previous README described a JSON rollback route, while `server.ts` intentionally rejects non-PostgreSQL configuration in production and disables API work with HTTP 503. This means rollback-to-JSON is **not executable under the current production guard**. The docs now identify this limitation. Do not bypass the guard or change production runtime mode to a non-production value. An implementation-level rollback design needs separate authorization and tests.

### 11.2 Frontend correction

| Requirement | Status | Evidence | Remaining verification |
|---|---|---|---|
| FIN-011: Finance server hydration only replaces a cache from a valid collection envelope | IMPLEMENTED_UNVERIFIED | `src/lib/financeStore.ts`; `tests/frontend-functional-regression.test.ts`. Hydration now requires HTTP success, a payload that does not explicitly state `success:false`, and the expected invoice/expense array. A valid empty array remains authoritative; malformed/error payloads do not replace the cache and keep the existing retry path active. | The static regression was executed in CI. A controlled runtime test with a malformed HTTP-200 payload and a mounted component was not run; other legacy store consumers do not expose an explicit public hydration-status API, so user-visible empty-vs-unavailable states outside the main Finance workspace still need browser verification. |

### 11.3 Confirmed source-level data-integrity findings and protected follow-up

| Finding | Category / priority | Evidence and observed behavior | Required follow-up |
|---|---|---|---|
| JSON-mode invoice payment idempotency differs from PostgreSQL | Category C — backend/API contract; P2 in dev/test, P1 if JSON mode were ever used for real transactions | `server/routes.ts` — JSON branch of `POST /api/finance/invoices/:id/pay` stores the request idempotency key but appends a new payment without checking for an existing key. `server/postgres-invoice-repository.ts` uses an invoice row lock, an advisory lock keyed to the invoice+idempotency key, and request-fingerprint comparison before replay. The production startup guard blocks JSON mode, so this is not evidence of a production duplicate payment. | Separately authorized backend task: implement equivalent JSON-mode replay/conflict semantics if JSON payments remain supported, or formally prohibit financial mutations in JSON mode. Test same-key replay, same-key/different-payload conflict, concurrent requests, and uncertain timeout/retry. |
| Invoice summary read does not explicitly flag a stored-ledger mismatch | Category D/E — data/financial integrity risk; potential, not a confirmed discrepancy | `server/postgres-invoice-repository.ts`: `mapInvoice/list` maps displayed `amountPaid` from `invoices.amount_paid` (falling back to the sum only when stored amount is falsy) and derives `balanceDue`; `recordPayment` explicitly compares stored `amount_paid` with the sum of `invoice_payments` and throws `INVOICE_PAYMENT_LEDGER_INCONSISTENT` before writing. The list/read path does not perform the same integrity assertion. No active database rows were accessible, so no mismatch is claimed. | Authorized read-only DB audit: compare each invoice `amount_paid` with the sum of its payment rows and `balance_due` with `total - sum(payments)`; quantify and report any discrepancies before any repair. Do not edit/recalculate production rows from this frontend task. |
| Documented JSON rollback vs production data-source guard | Category C/F — backend/runtime contract and operational recovery; P1 during a rollback incident | `server.ts` production validation + global API readiness gate versus `docs/AMS-POSTGRES-CUTOVER.md` rollback sequence. Code returns 503 for production JSON mode, while the prior procedure told operators to switch production back to JSON. Docs were updated to mark that sequence blocked under the current guard. | Separately authorized implementation decision: specify the supported rollback target, data reconciliation, backup restore, cutover gate, and fail-closed runtime behavior. Rehearse on staging; do not add a JSON bypass in this phase. |
| Actual Hostinger production source/readiness | Category F — environment blocker; high release significance | The repository guard and readiness endpoint can be inspected, but the actual deployed configuration could not be observed. CI PostgreSQL is isolated test evidence, not production evidence. | Authorized operator records safe readiness status for the current deployed release. No environment secret values should be copied into source/docs or this report. |

### 11.4 Security, contract, and persistence review

- **Observed code controls:** API mutations use same-origin credentials and attach the CSRF header when the cookie is available; server middleware verifies the token/origin for authenticated state-changing requests. Protected routes enforce session, MFA, and server-side permissions. Production misconfiguration blocks API business traffic with HTTP 503. The generic error handler sanitizes unhandled server errors to status-specific messages for clients.
- **Persistence:** `withPostgresTransaction` wraps operations in a transaction and retries PostgreSQL serialization/deadlock SQLSTATEs only. The project repository verifies selected client IDs and uses row locks/optimistic timestamp checks; task IDs are preserved to protect historical time-log references. PostgreSQL invoice creation/payment use transactions; payment replay behavior has integration coverage.
- **Financial controls:** PostgreSQL invoice writes validate invoice-item subtotal, discount/tax/total consistency, relationship validity, period close, and payment-row versus stored-balance consistency on the payment mutation path. These source/test observations do not prove existing production rows reconcile.
- **Security not proven live:** The direct-URL/API permission matrix for each production role/session state, TOTP coverage, current TLS/database SSL settings, secret exposure review of the deployed bundle, backup/restore artifact, private-object integrity, and live readiness gates were not observed. No confirmed exploitable security vulnerability was established by this audit.
- **Accounting limitation carry-forward:** Finance workbook documentation continues to identify provisional financial statements until source journals are reviewed/posted and opening balances/source exceptions are reconciled. Credit note/refund flows, retainer/deferred revenue, automatic bank-feed matching, fully reconciled project margin, and live statement reconciliation are not declared implemented by this audit.

### 11.5 Validation and exact audit head

At source checkpoint `b14249ec9b4790c0ee28ec41034d4a6f7b0790c1`, both AMS Quality Gate and AMS CI completed successfully:
- Quality Gate: lint/typecheck, **568 tests / 548 passed / 0 failed / 20 skipped**, production build succeeded.
- AMS CI: same 568-test suite, **8 PostgreSQL integration tests passed**, dependency audit, migration packaging validation, production build, and isolated PostgreSQL runtime/HTTP readiness/auth/CMS smoke checks passed.
- The PostgreSQL HTTP smoke is on the temporary CI database. It is not a live production-source or financial reconciliation check.
- The traceability and runbook updates in PR #170 trigger a new CI run; final release evidence must refer to the resulting documentation-inclusive head.

No production merge or deployment was performed.
