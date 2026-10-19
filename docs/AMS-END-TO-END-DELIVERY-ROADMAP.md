# AMS End-to-End Delivery Roadmap

**Status:** Canonical execution sequence for the AMS delivery initiative  
**Last updated:** 19 October 2026  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Required delivery branch:** `main`  
**Goal:** Move the current repository state through verified navigation, clear module content, complete business workflows, cross-module integrity, testing, operational readiness, and an evidence-backed production release.

> This roadmap defines **order, dependencies, stage gates, and delivery evidence**. It is not proof that any feature is implemented or production is healthy. Always reconcile it against current `main`, source code, tests, current CI and authorized runtime evidence.

## 1. Source-of-truth hierarchy

Use the documents according to their distinct roles; do not let several documents independently redefine the delivery sequence.

1. **User's latest explicit instruction** — determines current goals and scope, within security and production safeguards.
2. **`AGENTS.md` and `docs/README.md`** — task boundaries, documentation authority and repository operating rules.
3. **This roadmap** — canonical end-to-end stage order, prerequisites, exit gates and progression rules.
4. **`docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md`** — current requirement-by-requirement status, evidence, gap owner, dependencies, blockers and next action. Update it from evidence; never fill it with assumptions.
5. **`docs/AMS-END-TO-END-EXECUTION-PROMPT.md`** — copy/paste operating prompt that applies this roadmap to an AI execution session.
6. **Product and UX authority:** `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` owns product/workflow boundaries; `docs/architecture/ams-navigation-information-architecture.md` owns approved destinations and navigation depth; `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` owns baseline per-workspace content composition and relative region order (especially §4.10); `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md` and `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md` refine role-aware presentation; `AMS-DESIGN-SYSTEM.md` owns visual tokens/geometry; and `docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md` provides shared page anatomy/high-level priorities. `docs/AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md` defines the frontend redesign method, view contracts, evidence and Stage 5 approval gate; it does not replace this roadmap's stage sequence.
7. **Domain contracts:** `docs/AMS-DATA-MODEL-AND-DATA-DICTIONARY.md`, `docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md`, `docs/AMS-BACKEND-API-AND-DATA-INTEGRITY.md`, `docs/FINANCE-EXCEL-ALIGNMENT.md`, and `docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md`.
8. **Verification and operations:** `docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md`, `docs/AMS-IMPLEMENTATION-TRACEABILITY.md`, `docs/PRODUCTION-CUTOVER.md`, `docs/production-cutover-checklist.md`, `docs/production-readiness-gate.md`, `docs/postgres-backup-dr-runbook.md`, `docs/AMS-RESTORE-REHEARSAL.md`, and `docs/private-document-vault.md`.

When a lower-level document contains an older stage sequence, use it for its domain-specific requirements but follow this roadmap for delivery order. Correct cross-references when discovered. If a genuine product/business/security conflict remains, record it and ask the user; do not silently choose a behavior.

Use [AMS Stage-by-Stage Execution Checklist](AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md) as the detailed operator checklist for all entry criteria, implementation checks, evidence and exit gates. It supplements this roadmap and does not replace its canonical order. Breadcrumb implementation is a required cross-cutting item: baseline/audit at Stage 0, shared behavior at Stage 2, tracking at Stage 3, eligible detail-page implementation at Stage 4, and visual/accessibility/sign-off verification at Stage 5.

## 2. Non-negotiable execution rules

- Inspect current `main`, current source, recent commits and CI before every new stage or resume after interruption. Preserve correct work already present; do not redo it without evidence.
- The approved navigation consists of nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings. Finance retains its five approved areas. CRM, Proposal/Quotation and generic Approval are not additional primary modules.
- Work in small, verifiable slices. Within module-based work, implement one module or clearly bounded worksheet/workflow slice at a time.
- Send the user a durable report at baseline, after every meaningful slice, before a high-risk decision, and at every stage boundary. Include commit SHA, changed files, verified behavior, exact checks/results, remaining work, unverified items and the next single task.
- After reporting a routine slice, continue to the next already-authorized task when safe. **Do not wait for approval after every routine slice.** Stop for the visual sign-off gate, material business/product decision, sensitive/destructive production action, scope boundary, unresolved security issue, or when the user explicitly asks to pause.
- A timeout is not completion. Reduce batch size, checkpoint the last safe unit, report its exact state, then re-fetch `main` and the relevant CI/source before resuming. Never repeat already verified changes or assume a commit/deployment/test completed without evidence.
- Commit verified checkpoints directly to `main`, as requested. Do not create a new branch or PR, force-push, or bypass repository protection; report the blocker if direct-to-main is unavailable.
- Scope may be full-stack across this end-to-end roadmap as authorized by the user, but every change must follow the technical/domain contract and tests. No unapproved business-rule change, destructive data change, production payment, credential change, or security-control bypass is implied.
- Treat a UI target as a target until source/tests prove it is functional. Do not use mock data or hardcoded success in production paths.
- Do not claim “complete,” “E2E passed,” “production-ready,” “deployed,” or “integration works” without the corresponding evidence.

## 3. Delivery stages and exit gates

### Stage 0 — Baseline, historical-work preservation and audit inventory

**Objective:** Establish what exists now and where work can safely continue.

Actions:
- Record current main HEAD, latest relevant commits, changed files, relevant GitHub Actions state and any observable baseline failures.
- Review `docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md`, `docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`, recent source commits and tests. These are useful history, not a substitute for current verification.
- Inventory all nine modules, workspaces, worksheets, routes, major UI/content states, API/data source dependencies, permission boundaries and key cross-module workflows.
- Populate the gap register with evidence and a status for every requirement. Distinguish verified complete, partial, missing, broken, not tested, target-only and externally blocked.

**Deliverables:** Baseline report, inventory/gap-register initial pass, protected-scope map, ranked first tasks.

**Exit gate:** The next task is based on evidence from current `main`; prior work to preserve and existing blockers are explicitly recorded.

### Stage 1 — Complete and verify the approved navigation

**Objective:** Finish remaining navigation and route-ownership gaps without reopening approved information architecture.

- Verify nine primary modules and their workspace/worksheet hierarchy.
- Verify Finance's five areas: Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, Accounting & Reports.
- Verify destinations, active state, route/query state, direct links, refresh, browser history, role-visible navigation and legacy compatibility behavior.
- Keep filters/saved views inside the owning workspace. Do not delete records, APIs, audit history, maker-checker controls or valid compatibility paths because a menu is retired.

**Deliverables:** Completed navigation gap rows and targeted tests.

**Exit gate:** Every visible destination maps to the correct supported view or is explicitly recorded as blocked/target-only; navigation regressions are resolved or reported with a concrete reason.

### Stage 2 — Shared shell, geometry and navigation consistency

**Objective:** Establish stable page geometry before detailed module work.

Verify and resolve remaining shared-root problems in the authenticated shell, single-header ownership, contextual navigation rows, page gutter, tab-switch stability, width constraints, scroll ownership and responsive shell fallback. Carry forward already completed shell work rather than replacing it. Also establish or reuse a shared, accessible breadcrumb primitive only if the existing implementation requires one. Breadcrumbs remain conditional; they must not create a second global navigation layer or force themselves onto obvious roots and established primary tabs.

**Deliverables:** Shared-shell changes with affected-consumer list and tests.

**Exit gate:** No known shell defect is masked by unrelated page-specific padding/negative-margin hacks; affected module consumers are checked.

### Stage 3 — Complete the feature and content gap register

**Objective:** Define the full target versus actual state before filling gaps opportunistically.

For every module/workspace/worksheet and workflow:
- Specify primary user question, page purpose, dominant work area, visible metadata, fields, filters, actions, states and linked records.
- Map each displayed metric/field to its canonical source, period/timezone/currency semantics and freshness.
- Map actions to supported UI, route, API, authorization, canonical entity, workflow transition, audit evidence, side effects and recovery behavior.
- Mark whether the need is a visual/presentation gap, frontend interaction gap, backend/API gap, data/schema gap, permission/security gap, test gap or provider dependency.
- Identify duplicate/competing ownership, target-only features, missing acceptance criteria and conflicts between documents.

**Deliverables:** Updated `AMS-FEATURE-CONTENT-GAP-REGISTER.md`, ranked by impact and dependency, including open decisions and evidence links.

**Exit gate:** Every currently specified module and workflow has an explicit status and next action. Unknowns remain marked unknown, not silently represented as missing or complete.

### Stage 4 — Finish main-content hierarchy across all nine modules

**Objective:** Fully re-architect the main-content hierarchy across all nine modules using the mandatory [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md). This is a structural overhaul, not a cosmetic revision or preservation of the current page layout.

Proceed one bounded view/module slice at a time:
1. Dashboard — Overview, Performance, Analytics.
2. Inbox — Overview, Messages/categories/saved views, Follow-ups, Routing & Templates as supported.
3. Projects — Overview, Project Registry, Tasks & Execution, Planning & Delivery, Content & Campaigns, Project Resources and Project Controls as supported.
4. Clients — Directory, Onboarding, Agreements, Service & Health; client details remain contextual.
5. Finance — all five top-level areas and existing worksheets.
6. Team & Resources — Team & Capacity, People Operations, Vendors & Freelancers, Time & Availability as supported.
7. Documents — canonical document register, linked records and secure detail behavior.
8. Website CMS — each actual content type/editor, publication state, Careers jobs and Applicants.
9. Settings — actual settings groups and supported account/application/security/integration controls.

For each slice, follow the content blueprint and worksheet matrix. Keep the primary work area dominant; use task-specific composition rather than applying Dashboard cards to every screen. Show one representative example per distinct function when that is sufficient to assess layout; do not create fake production data or extra records simply to fill space. Preserve real data sources and existing supported actions. Track the explicit breadcrumb requirement in the gap register and the detailed execution checklist. Implement ancestor trails on eligible deep record/detail pages, preserve valid permission-aware parent routes, do not repeat the current title in the trail, and use the approved compact-screen fallback. Intentionally omit breadcrumbs where the current location is already clear.

**Deliverables:** Per-view design records; restructured module views; updated requirement/gap evidence; breadcrumb consumer verification; targeted tests; direct-to-main checkpoints. Follow [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md).

**Structural-overhaul rule:** Do not merely move KPI strips, alter card styling or apply a shared template. Rebuild the hierarchy from task, primary work surface, canonical records, action priority and role context. Retain content only when justified. Preserve real data, routes, permissions and business semantics.

**Exit gate:** Every active view is either reviewed and accepted against its content contract or explicitly marked blocked/unverified with its reason. No module is declared complete because a shared component changed or a build passed.

### Stage 5 — Visual, responsive and accessibility review with user sign-off

**Objective:** Let the user evaluate the full visual experience before broad functional expansion.

Check the applicable 1440, 1024, 768, 390 and 320 px viewports; shell and local scrolling; table/board usability; action placement; text density; loading, populated, empty, no-match, unavailable/stale, restricted, validation/error, pending and success states; keyboard/focus; reduced motion; drawers and modals. Recheck all tabs and neighboring views changed by shared components.

Separate source-level checks from browser-level evidence. Do not claim live visual verification when browser/authenticated access was not available. The visual matrix must include eligible breadcrumb routes: link destinations, title non-duplication, keyboard/focus, permission behavior, refresh/history and compact-width presentation. Do not treat source assertions as proof of authenticated visual acceptance.

**Deliverables:** Consolidated visual audit and acceptance report with pass/fail/unverified items and supporting commit/test evidence.

**Exit gate (mandatory user decision):** Obtain the user's explicit sign-off on the visual/content structure, or record requested changes and return to the relevant Stage 2–5 slice. Do not start the broad functional implementation stage until this sign-off is received.

### Stage 6 — End-to-end workflow, data and API traceability

**Objective:** Trace product behavior and data ownership before implementing missing functions.

For each business workflow, map:
- User/role, route and UI action.
- Input fields, validation, state transition, preconditions and expected outcome.
- API/client contract, server handler/service, permission enforcement and record scope.
- Canonical entity, persistence/write owner, version/concurrency behavior, audit events and idempotency key.
- Downstream module effects, notifications, external provider interaction and recovery/compensation.
- Positive/negative tests, duplicate submission, stale data, permission denial, partial failure, timeout/unknown result and retry.

Use the data dictionary and workflow state-machine docs as domain contracts, then verify current code and schema.

**Deliverables:** Workflow traceability matrix and dependency-ranked vertical-slice plan.

**Exit gate:** All high-value workflows have clear source ownership, dependency and acceptance criteria. Product/security/accounting ambiguities are listed as decisions rather than guessed.

### Stage 7 — Foundation gaps, security and data-integrity plan

**Objective:** Prioritize cross-cutting prerequisites that make vertical slices safe.

Audit and plan as required by evidence:
- Runtime configuration, API validation and error semantics.
- Session/CSRF/MFA/RBAC enforcement and record-level access.
- Canonical record ownership, duplicate prevention, stable identifiers and version/concurrency checks.
- Database migrations and compatibility/backfill/reconciliation requirements.
- Idempotency, audit history, event correlation and safe recovery.
- Document storage and integrity, notifications, background jobs and external-provider failure.
- Observability, sanitized logs, operational alerts, rate/size limits and resilience.

Do not make broad schema, security or business-rule changes as speculative cleanup. Sequence each required implementation behind an explicit, reviewed change plan and relevant tests.

**Deliverables:** Foundation gap register, risk classification, implementation plan and tests/rollback approach for changes that are actually required.

**Exit gate:** Blocking foundation risks have an approved remediation path; no high-risk assumption is embedded in feature implementation.

### Stage 8 — Core agency workflows, end-to-end vertical slices

**Objective:** Connect UI, API, persistence and business transitions one workflow at a time.

Recommended dependency-aware sequence (adjust only for a verified dependency and record why):
1. Inquiry intake → Inbox thread/categorization/owner/follow-up → link to existing compatible lead/opportunity only where contract requires it.
2. Qualification/scoping → canonical quotation/version in Finance → authorized review/sending and quote outcome.
3. Accepted scope/contract/SOW/change order → validated onboarding and handover → one canonical project creation.
4. Project/task/milestone/deliverable → assignment and dependencies → internal QA/client review/revisions → completion/closure.
5. Client directory/360, onboarding evidence, agreement/renewal, retainer/SLA status and linked requests.
6. Documents: upload/version/link, access checks, audit, integrity verification and safe failure/recovery.
7. Website CMS content lifecycle and Careers applicants, including publication confirmation and restricted personal data.
8. Team & Resources: people records, leave/availability, training/performance restrictions, vendor/freelancer and time entry as supported.
9. Cross-module notifications/follow-ups/automation only when a real event/action/delivery path is implemented and tested.

For each vertical slice, cover happy path and relevant rejection, permission denial, duplicate, concurrent/stale update, retry, timeout/unknown outcome, provider unavailable and recovery cases. Do not create parallel CRM, quote, task, document or approval stores.

**Deliverables:** Tested vertical slices and updated gap/traceability evidence.

**Exit gate per slice:** The end result is verified across UI/API/persistence and affected modules for the declared scope; unfinished side effects remain visible and documented.

### Stage 9 — Finance quote-to-cash, purchase-to-pay and accounting integrity

**Objective:** Verify financial state end-to-end without changing established meanings or calculations accidentally.

Cover as applicable:
- Quotation template/version, acceptance and billing terms.
- Invoice creation, issue/cancel state, partial/full payment and receivable balances.
- Purchase/expense request, budget checks, authorization controls, vendor bills and payable balances.
- Cash/bank, petty cash, source links and duplicate prevention.
- Journal creation/posting/reversal, Chart of Accounts, account mappings, P&L, cash flow, balance sheet and monthly/year-end close.
- Project finance, allocation, team-fee costing and existing report/workbook reconciliation.

Preserve formulas, historical results, account codes, rounding/tax behavior, maker-checker controls, close-period protections and current canonical write paths. An accepted quotation is not cash; an issued invoice is not a receipt; an unconfirmed payment request is not a settled transfer. Do not conduct live money movement in CI.

**Deliverables:** Applicable Finance regression evidence, baseline-to-result reconciliation, unresolved discrepancy list and safe recovery notes.

**Exit gate:** All affected calculations and records reconcile, or the release remains blocked for an explicit unresolved discrepancy/business decision.

### Stage 10 — Integrations, event automation and provider-dependent features

**Objective:** Enable only integrations backed by real contracts, runtime configuration and proof.

Verify enabled notification channels, webhook/import source identity, duplicate detection, bounded retry/replay, last-sync/error states, manual recovery and audit. CMS publishing must not appear successful until confirmed. Bank Mandiri Kopra H2H requires official current specifications, approved access and sandbox/UAT certification, per-feature enablement, server-side secret handling, status inquiry, unknown-outcome recovery, idempotency and reconciliation.

Never invent provider endpoints/cryptography, expose secrets in frontend/logs, blindly retry uncertain transfers, or test real transfers as normal regression.

**Deliverables:** Integration-specific acceptance evidence and explicit configured/unconfigured/blocked states.

**Exit gate:** Every enabled feature has valid runtime configuration and evidence for its actual contract. Provider-dependent features that are not ready remain disabled/unconfigured and are reflected in release scope.

### Stage 11 — Security, privacy, reliability and performance hardening

**Objective:** Validate the whole system against its threat and reliability boundaries.

Run risk-based reviews for authentication/session/CSRF/MFA, server-side RBAC and record scoping, confidential employee/applicant/private-document data, secret redaction, audit integrity, input/output safety, dependency vulnerabilities, request limits, concurrency/idempotency, denial/error behavior, availability and acceptable latency. Use existing policies and current tooling; do not invent a new auth model.

**Deliverables:** Evidence-backed security/reliability findings, remediations, accepted residual risks and retest results.

**Exit gate:** No unresolved critical/high-risk issue remains without an explicitly accepted release decision and mitigations.

### Stage 12 — Full regression, end-to-end tests and UAT

**Objective:** Validate behavior from user intent through persisted effects across roles/modules.

Use `docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md` and existing test contracts. Include:
- Lint/typecheck, unit/component and production build checks.
- Navigation/query/deep-link and module/worksheet tests.
- API validation/authorization/negative tests as applicable.
- Cross-module vertical journeys from Stage 8–10.
- Finance/accounting reconciliation suite.
- Duplicate/retry/concurrency/timeout/partial failure tests.
- Roles, privacy/security, keyboard/accessibility and responsive cases.
- User acceptance against the approved scenarios, with findings recorded and retested.

**Deliverables:** Test execution matrix with command/run, commit SHA, environment, result and linked defect/remediation.

**Exit gate:** All mandatory tests pass; blocked/unavailable tests and accepted residual risks are explicitly signed off. A green build alone is not E2E evidence.

### Stage 13 — Data migration, backup, restore and disaster-recovery proof

**Objective:** Prove operational recovery against current production contracts without risking production data.

Verify all migrations discovered by the current loader, applied version/checksum parity, reviewed reconciliation evidence, backup freshness within RPO, artifact integrity, isolated restore rehearsal against the same latest backup artifact, private document object integrity, RTO/RPO ownership and runbook accuracy. Use dedicated isolated rehearsal targets; never run destructive rehearsals against production.

**Deliverables:** Authorized readiness-gate details, backup-provider evidence, restore rehearsal results, reconciliation references, document-vault integrity evidence and operational recovery sign-off.

**Exit gate:** Required backup/restore/reconciliation gates are proven by actual current evidence; documentation or a successful database ping alone is insufficient.

### Stage 14 — Production readiness review and release authorization

**Objective:** Prove release prerequisites before deployment or declaration of readiness.

Follow `docs/PRODUCTION-CUTOVER.md`, `docs/production-cutover-checklist.md`, `docs/production-readiness-gate.md`, `docs/postgres-backup-dr-runbook.md` and `docs/private-document-vault.md`. Verify current Hostinger repository/branch/domain/runtime configuration with authorized access, current CI, production settings, PostgreSQL, full migration/checksum parity, reviewed reconciliation, active-user MFA, backup/restore evidence, private-document object integrity and required enabled notification configuration.

The documented authenticated `GET /api/system/production-readiness` gate must return HTTP 200 with `productionReady=true`. HTTP 401 is not a readiness verdict; HTTP 409 means one or more gates are incomplete; HTTP 503 means readiness evaluation did not complete.

**Deliverables:** Release evidence bundle, explicit go/no-go decision, verified commit and deployment plan, smoke-test plan, incident/recovery contacts and rollback/recovery approach suitable for the current database and deployment.

**Exit gate:** Authorized readiness and release checks pass. Do not deploy or declare production ready based only on documentation, source inspection or passing CI.

### Stage 15 — Deployment verification and stabilization

**Objective:** Confirm the actual release behaves correctly in the production environment.

- Verify the intended `main` commit was deployed to the correct Hostinger project/domain.
- Run non-destructive live smoke tests and authorized authenticated role-specific workflows.
- Inspect safe application/runtime logs and telemetry, backup freshness, error rates and key workflow indicators.
- Verify primary modules and critical journeys, including no unexpected duplicate records or financial state change.
- Use the approved incident, rollback/recovery and data-restoration procedures if a release causes a serious issue.
- Record known limitations, operational ownership and follow-up date.

**Deliverables:** Deployment SHA/release evidence, live smoke-test outcomes, stabilization report, known limitations and handover.

**Exit gate:** Production deployment and critical smoke tests are confirmed in the live environment. Otherwise status remains deployed-unverified or not deployed.

## 4. Feature/content coverage required by the roadmap

The gap register must account for the entire product, not only visible navigation:

- All nine modules, each approved workspace/worksheet, record detail and role-visible variant.
- Main-content purpose, fields, filters, actions, metrics/reports, source/period, empty/loading/stale/error/restricted states and responsive behavior.
- Canonical entity/source ownership and module links.
- Lifecycle/state transitions, actors, guards, status history, side effects, idempotency, concurrency and recovery.
- UI/API/server/persistence/permission/audit traceability where the feature is functional.
- Cross-module workflows, notifications, integrations, private documents and provider-dependent capabilities.
- Finance calculations and report reconciliation.
- Security, accessibility, performance, observability, backup, restore and deployment readiness.
- Testing: unit/component, API, integration, E2E, role/security, regression and live smoke tests.

Do not mark an item done simply because it appears in a menu, component, database table or documentation. Use the exact evidence appropriate to the claim.

## 5. Checkpoint/report format

After baseline and each meaningful slice, report:

- **Stage/slice and status:** complete, in progress, blocked or unverified.
- **Evidence-based findings:** what current source/test/runtime proves.
- **Changes:** files and observable behavior.
- **Commit:** exact SHA and link on `main`.
- **Validation:** actual command/CI/run and result.
- **Preserved work:** earlier changes verified and not repeated.
- **Open gaps/blockers:** exact requirement and dependency.
- **Unverified claims:** browser, role, provider, production and recovery states not tested.
- **Next single task:** the next action in this roadmap.

Keep the report useful and short enough to scan, but do not omit blockers. Then continue automatically within the authorized scope when safe. Pause only at explicit user sign-off/decision gates, serious blockers, security/destructive action decisions, or an explicit user request to pause.

## 6. Definition of done

The AMS rollout is not complete until all in-scope requirements are either verified against their acceptance criteria or explicitly excluded from the release with user agreement and no false capability claims; all critical workflows pass their relevant end-to-end checks; Finance results reconcile; security/permissions/privacy constraints pass; backup, restore and recovery evidence pass; current production-readiness gate is green; the intended release is deployed and smoke-tested; and the final report records exact commits, evidence, residual risks and ownership.

If any mandatory gate cannot be verified, report the project as **not yet production-ready** and identify the exact blocker.