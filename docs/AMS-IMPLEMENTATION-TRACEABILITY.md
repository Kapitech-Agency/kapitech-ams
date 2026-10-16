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
