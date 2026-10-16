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


## 11. Data integrity, backend contract, security and financial consistency audit — 16 October 2026

**Starting checkpoint:** Prior audit head `498f39724c133634d9b98cc25cd77a625cd5c3ff` on `audit/ams-e2e-workflow-2026-10-16`, with navigation PR #167 and E2E audit PR #168 both open/unmerged. This phase is isolated on `audit/ams-data-integrity-2026-10-16`. No merge, deployment, Hostinger configuration write, protected backend/schema/security/accounting change, or production-record mutation was performed.

### 11.1 Runtime data-source evidence

| Check | Status | Evidence | Limit |
|---|---|---|---|
| Production active data source at observation time | IMPLEMENTED_VERIFIED (snapshot only) | Read-only GET `https://ams.kapitech.id/api/health/ready` returned `status=ok`, `services.dataSource=postgres`, `database=connected`, `auth=operational`, latency 18 ms at endpoint time `2026-10-16T16:16:32.750Z` (23:16:32 WIB). GET `/api/health` returned `status=ok`, application healthy. | A health/readiness response is time-bound evidence. No credentials or protected configuration were read. The authenticated `/api/system/production-readiness` gate was not called; backup/restore, reconciliation, MFA coverage, migration checksums and durable document-storage integrity therefore remain unverified. |
| Runtime mode selection and no-fallback behavior | IMPLEMENTED_UNVERIFIED (environment-specific) | `server/data-source.ts` defaults to JSON when `KAPITECH_DATA_SOURCE` is absent. `server.ts` requires PostgreSQL, URL and encryption key in production, and returns 503 to API requests on production misconfiguration or while PostgreSQL initializes. `server/postgres.ts` throws if its connection URL is absent; it does not route queries to JSON. | Development/test defaulting to JSON is explicit and expected; it is not evidence for production. Production snapshot above confirms PostgreSQL was live at the time checked. |
| Full production environment validation is part of startup/release automation | PARTIAL | `scripts/validate-production-env.ts` checks production datasource, TLS flags, HTTPS URL, encryption key, durable document storage and backup/restore/reconciliation evidence. `package.json` declares it as a separate `validate:production-env` script. `scripts/build-production.mjs` only builds the client/server and copies migrations; `start` runs `node dist/server.cjs`. `.github/workflows/ams-ci.yml` does not run the validator as a CI step. The runtime readiness route checks the main readiness gates but does not directly inspect the PostgreSQL SSL-disable / certificate-validation flags. | This is a release-control/configuration evidence gap, not proof that production TLS is disabled or that production storage is misconfigured. Authorized deployment environment and readiness-gate output are required to resolve it. No environment variables or secrets were displayed. |

### 11.2 Carry-forward from the earlier workflow audit

The previously remediated Finance empty-vs-unavailable behavior, Project canonical-save feedback, Project-to-client selector, and document-upload cleanup messaging were not reopened as defects. Their major integration paths remain unverified in a browser/isolated data journey: Finance ledger outage/retry and source-to-report reconciliation; persistence of the selected project `clientId`; controlled private-vault failure/cleanup; quote → contract/SOW → project handover; notification destination/read-state persistence; and the direct-URL/API permission matrix for every production role. Full accounting reconciliation, credit-note/refund semantics, retainer/deferred revenue, net project margin, automatic bank-feed matching, leave/payroll, and Kopra H2H also remain outstanding. See section 10 for the current coverage matrix.

### 11.3 New finding: ambiguous mutation timeout prompts safe next action

| Field | Finding |
|---|---|
| ID / category | API-001 / Category A — confirmed frontend/API-client behavior |
| Severity | P2 — a timeout can invite duplicate business actions; no duplicate production transaction was observed |
| Evidence | `src/lib/apiClient.ts`: `apiRequest` and `apiBinaryRequest` previously returned “Please try again” after a fetch rejection/abort even for POST/PUT/PATCH/DELETE. Invoice/payment, expense, and document operations can be non-idempotent or have server-side idempotency only for particular operations. |
| Correction | The JSON API client now returns an unknown-outcome message for mutating requests when no HTTP response is received. Binary upload timeout likewise tells the user to inspect the vault before retrying. Read-only GET timeout retains the retry-appropriate message. No automatic retry, API contract, or backend behavior was added/changed. |
| Regression evidence | New isolated mock-transport tests in `tests/api-client-unknown-outcome.test.ts` check aborted POST, GET, and document upload behavior without sending a network request. Exact CI status is recorded in the PR/workflow result for this audit head; test source alone is not evidence that it passed. |
| Remaining limit | This avoids misleading advice but cannot tell whether the remote mutation committed. Reliable status inquiry/idempotency remains a server/domain responsibility and must be checked per operation before repeating a timed-out action. |

### 11.4 Protected-system and financial findings

| ID | Category / status | Evidence and impact | Minimum follow-up |
|---|---|---|---|
| SEC-001: production environment validation integration | Category C / PARTIAL, conditional risk | `server.ts` validates source mode, URL shape and data-encryption key; the stand-alone validator additionally checks TLS flags, durable object storage and backup/reconciliation evidence. No evidence from the public health endpoints establishes the actual TLS flags or full readiness result. | Authorized backend/release owner should decide whether the validator must be a mandatory pre-deploy gate and whether the TLS/certificate policy should also be checked by startup/readiness. Execute it against the actual environment without emitting secret values. Do not make the current audit change to backend startup or deployment configuration. |
| DATA-022: relational persistence and relationship enforcement | IMPLEMENTED_UNVERIFIED | Source inspection found PostgreSQL foreign keys in `db/postgres/001_initial_schema.sql` for client/project/task/invoice relationships and repositories use transaction/row-lock/version safeguards for core project, task, invoice, expense and Finance workbook paths. Existing isolated CI includes proposal-to-invoice, delivery project/task/time-log and won-deal conversion scenarios. | No live production row counts, orphan scan, duplicate analysis or encrypted-JSON-to-PostgreSQL reconciliation report was accessed in this task. Run the approved reconciliation/production-readiness gate before any release claim. |
| FIN-020: source record → financial report reconciliation | PARTIAL / not runtime-reconciled | Code and isolated PostgreSQL tests support transaction-backed invoice/payment, expense and Finance workbook operations. Source review alone cannot establish that current live invoice payments equal amount-paid/balance fields or that AP/cash/journal/P&L/Balance Sheet reports reconcile to current source rows. | Use an authorized isolated PostgreSQL dataset and the existing documented accounting rules. Record invoice/payment/expense/bill/journal identifiers, period, currency, expected-versus-actual minor-unit amounts and report outputs. Do not edit formula/account/journal code during this audit. |
| SEC-002: runtime security and record-scope checks | IMPLEMENTED_UNVERIFIED | Source inspection confirmed protected router middleware, existing permission guards, HttpOnly session/CSRF patterns, and safe JSON error envelopes; CI smoke checks unauthenticated `/api/auth/me` as 401 and verifies the session-cookie flags. | No direct-URL/API role-by-role exercise was performed against production. A live authenticated readiness gate / access-denial matrix is still required. |
| INT-001: duplicate/retry/concurrency behavior | PARTIAL | Invoice payment repository implements transactional row locks and idempotency-key/fingerprint handling; expense create/payment supports idempotency/version safeguards; Finance workbook uses optimistic version checks and period-close locks. | Safeguards differ by operation; not every mutation has an idempotency key. The frontend unknown-outcome patch does not provide exactly-once semantics. Review each write path with operation-specific tests before claiming global duplicate prevention. |
| BANK-001: Mandiri Kopra H2H | BLOCKED_EXTERNAL | No official customer-specific bank contract, credentials or approved sandbox/UAT evidence was produced. | Continue only after the bank-issued contract, idempotency/status inquiry rules and sandbox authorization are available. No bank operation was executed. |

### 11.5 Scope and evidence boundary

Only `src/lib/apiClient.ts`, `tests/api-client-unknown-outcome.test.ts` and this traceability update are changed by this phase. No Express routes, runtime configuration, authentication/session/CSRF/MFA/RBAC logic, schema or migrations, finance formulas/account mappings/journal rules, production records, public website, dependencies or deployment settings were modified. Production health was read-only; the authenticated production readiness result and actual environment secret/configuration values remain uninspected.


### 11.6 Additional source-proven concurrency and duplicate-payment risks

| ID | Category / severity | Evidence and observed code path | Classification / safe follow-up |
|---|---|---|---|
| FIN-021: vendor-bill payment retry is not idempotent when reference is omitted | Category C + E / **P1 conditional financial risk** | `src/pages/admin/AdminFinanceWorkspace.tsx` defines the `vendor-bill-payment` form with optional `reference`. In `server/postgres-finance-workbook-repository.ts`, `normalise('vendor-bill-payment')` substitutes a newly generated `uid('VP')` when reference is blank and uses that value as `record_key`. `finance_workbook_records` has a unique `(record_type, record_key)` key, but a retry with no reference gets a different key and new ID. The repository checks the bill's remaining total and installment allocation, but does not accept or replay a request idempotency key in this record path. A repeated partial payment using Unassigned/FIFO could therefore be recorded twice while the bill still has remaining balance. | **Code-level defect confirmed; no duplicate live record was observed and the retry was not executed.** Leave backend changes out of this audit. Separately authorize stable request idempotency/fingerprint handling for this record type (or an equivalent persisted operation key) plus transaction tests covering same-key replay, key reuse with different payload, partial payment and remaining-balance conflict. The frontend unknown-outcome warning reduces blind-retry encouragement but cannot supply server-side exactly-once semantics. |
| DATA-023: invoice header and child payment rows can be read from different snapshots | Category C + E / **P2 concurrency risk** | `server/postgres-invoice-repository.ts` `list()` reads invoice headers, invoice items, and invoice payments with three independent pool queries; `findById()` also reads the header then item/payment rows separately without one read transaction. A concurrent `recordPayment()` commit between those statements can produce a response where header `amountPaid/balanceDue/status` reflect the earlier snapshot but the embedded payment rows reflect the later snapshot. `server/postgres-project-repository.ts` similarly reads project and task rows separately for `list()` and `findById()`, allowing a task list to be from a different instant than its project row. | **Concurrency race inferred from SQL boundaries; not reproduced against an isolated database.** Backend follow-up should provide a consistent read snapshot for each composite response (for example, an appropriately isolated read transaction or equivalent single-snapshot query) and add concurrent reader/writer tests. Do not patch or reformat client-side totals to conceal a stale composite response. |
| FIN-022: source record → workbook report parity | PARTIAL / evidence blocked | Migration and repository tests verify relationships/validation, and the isolated CI PostgreSQL suite passed 8 integration cases. No authorized production-reconciliation report, live record-level sample, or authenticated production-readiness gate result was obtained in this audit. | No claim is made that the live accounts reconcile. Run the existing approved production readiness/reconciliation process and an isolated dataset reconciliation; only then establish whether any numerical discrepancy exists. |

**CI result for audit head `6e53c1ef34d3875dee462b76e46f97c64fd9474f`:** AMS Quality Gate and AMS CI both succeeded. Quality Gate ran `bun run lint`, 569 tests (549 passed, 0 failed, 20 skipped) and production build. AMS CI additionally passed migration/package validation, the same test suite, 8 PostgreSQL integration tests, `bun audit --audit-level=high`, production build and isolated PostgreSQL HTTP smoke checks. These results validate existing automated scenarios; they do not reproduce the vendor retry case or the multi-query read race described above.
