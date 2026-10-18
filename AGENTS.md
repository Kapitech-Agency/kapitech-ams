# AI Coding Agent Instructions — Kapitech AMS

**Read this file before changing anything in this repository.** These rules apply to AI coding agents, assistants, autonomous coding tools, and humans delegating repository work to AI. Start with [`docs/README.md`](docs/README.md) for the documentation authority/index and to distinguish active specifications from historical/staging references.

## 1. Read the right documentation first

Before implementation, read:

1. **README.md** — runtime, production safeguards, commands, and deployment constraints.
2. **AMS-DESIGN-SYSTEM.md** — mandatory visual and interaction system; source of truth for UI.
3. **docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md** — target-state navigation, modules, worksheets, workflows, cross-module data, Finance, Kopra preparation, migration sequence, and acceptance criteria.
4. **The specialized document(s) relevant to the task:**
   - Finance/accounting: **docs/FINANCE-EXCEL-ALIGNMENT.md**
   - Existing business/workflow evidence: **docs/ams-workflow-audit.md**
   - Drawer forms: **docs/AMS-DRAWER-GUIDELINES.md**
   - Modal/confirmation: **docs/AMS-MODAL-GUIDELINES.md**
   - Kanban/task boards: **docs/AMS-KANBAN-GUIDELINES.md**
   - Module content hierarchy and frontend-only UX/UI execution: **docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md** and **docs/AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md**
   - Detailed role-aware main content and worksheet defaults: **docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md** and **docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md**
   - PostgreSQL/schema/cutover/recovery: the relevant **docs/AMS-POSTGRES-*.md**, **docs/AMS-RELATIONAL-MIGRATION.md**, and recovery runbooks
   - Private documents: **docs/private-document-vault.md**

Do not read one file, infer the rest, and begin a broad rewrite. Inspect the actual files and connected flows relevant to the task.

## 2. Resolve conflicts correctly

Use this order of authority:

1. The user's **latest explicit instruction for the current task**, including a stated scope boundary.
2. Current production-critical security/data-integrity controls and actual code/API/database behavior, unless the user explicitly authorizes a reviewed business change.
3. Specialized, current technical contracts for the domain being changed (database, accounting, permissions, bank provider, document storage).
4. **AMS-DESIGN-SYSTEM.md** for visual style and component interaction rules.
5. **AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md** for the intended future module/navigation/workflow architecture.
6. Specialized domain guides and audit documents for the factual evidence and rules they cover.
7. Older audit snapshots, comments, memory, assumptions, and examples.

The master structure guide is a **target-state specification**, not proof that every listed feature already exists. Older audit documents are snapshots of their audit date, not automatically the latest implementation status. If two documents disagree, do not silently blend them: identify the exact conflict, verify the code and data contract, preserve safe existing behavior, and update documentation to reflect the decision.

For navigation changes, the master guide defines the **target taxonomy**. For UI styling, the design system wins. For existing Finance calculations/accounting, the Finance alignment document and actual tested business logic remain the baseline; a navigation change must not recalculate or reinterpret them.

## 3. Separate current state from target state

At the start of a task, classify each affected capability as one of:

- **Existing and verified**
- **Existing but incomplete**
- **UI present, backend/API incomplete**
- **Backend/API present, UI missing**
- **Demo/fixture/preview only**
- **Requires schema/migration**
- **Blocked by external provider, contract, or credentials**
- **Target design only / not implemented**

Never describe a target submenu as an existing feature merely because it appears in documentation. Never present a preview, fake API, fixture, optimistic state, or localStorage value as production data. Use honest unavailable/loading/error states.

## 4. Boundaries and prohibited shortcuts

- Do only the work requested. A documentation-only task changes documentation only. A frontend-only task must not change backend/API/database/auth/session/CSRF/MFA/RBAC/finance formulas.
- Do not rewrite entire modules when an incremental change is sufficient.
- Do not make a new UI framework, token system, component library, API client, store, master directory, ledger, or permission mechanism when a canonical one already exists.
- Do not delete a route, endpoint, data model, API, migration, audit record, or workflow merely because its old sidebar entry is being removed. First map consumers and move the user-facing entry to its target workflow.
- The approved target has nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, and Settings. CRM, Proposal/Quotation and Approval are not primary modules. Do not delete their APIs, records, audit history, maker-checker controls or valid contracts. The existing quotation workflow remains reachable through Finance using canonical records; do not create a new pipeline or duplicate quote store.
- Vendors, Time Tracking, People Operations, Content & Campaign Operations, and Kopra H2H are subareas, not additional top-level sidebar modules.
- Never add Mobile App as a Kapitech service.
- Never hardcode success states, KPI values, API responses, accounting totals, bank statuses, or publish status.
- Never weaken server-side authorization because a button is hidden in the UI.
- Never switch production data source or bypass PostgreSQL, existing security controls, encrypted storage, backups, or readiness gates.
- Never hardcode credentials or put secrets/personal data into source control, browser storage, logs, tests, or this documentation.
- Never submit or retry real bank transfers without the exact authorized workflow, current bank specification, required permission, and explicit task scope.

## 5. Mandatory repository workflow

1. Confirm repository, current branch, HEAD, and changed files. Avoid overwriting changes from another contributor.
2. Inspect the relevant component, caller/route, API client, server route/service, data model/schema, permissions, and tests. Follow the request from UI to persisted outcome.
3. State the desired behavior and affected flows. Identify regression risks before editing.
4. Reuse established components/API contracts/repositories. Keep the change scoped and incremental.
5. If persistence changes are necessary, design a forward migration with compatibility, backfill, indexes/constraints, rollback or recovery, and duplicate-data considerations. Never edit an already-shipped migration to change its meaning.
6. Add or update automated tests for the changed behavior, including negative paths and permissions.
7. Run the actual relevant test, lint, and build scripts from package.json; verify the resulting exit status. Do not claim checks passed if not run.
8. For workflow changes, test the entire flow and cross-module link, not only the isolated component.
9. Verify navigation, keyboard and form behavior, loading/empty/error/success states, permissions and mobile/narrow layouts where relevant.
10. Report files changed, business behavior affected, migration/API changes, tests executed with results, remaining uncertainty, and any external prerequisite.

Production deployments are sourced from **main** as configured for Kapitech. Commit/push to main only when that is explicitly requested or clearly authorized by the current task and repository workflow. Never force-push or bypass release gates.

## 6. Finance rules are high risk

- Read **docs/FINANCE-EXCEL-ALIGNMENT.md** and inspect actual Finance code/tests before changing financial workflows.
- Preserve current 20-worksheet business logic, accounting mappings, formula behavior, existing transactions, invoice/payment conversion, journal draft/posting controls, period-close controls and report definitions unless the user explicitly approves a business-rule change.
- Clearly distinguish quotation value, contract value, issued invoice, revenue recognition, amount due, payment instruction, confirmed bank movement and cash received.
- Invoice creation is not payment. Bank submission is not bank confirmation. Reconciliation is not permission to create a second ledger event.
- Do not post duplicate payments/journals from callbacks, retries, source events or imported bank transactions.
- Preserve maker-checker controls and period lock behavior even when an Approval menu is removed.
- Verify financial values against baseline data and accounting regression tests before declaring success.

## 7. UI rules are not optional

- Follow **AMS-DESIGN-SYSTEM.md** and the relevant drawer/modal/kanban guidelines. Inspect current tokens/components instead of trusting memory.
- Use the existing page shell, topbar/section-tab patterns, spacing, typography, status colors, button hierarchy and table patterns.
- Do not create a second page header under a subtab or change content padding when the user switches tabs.
- Forms normally use the shared Drawer; modals are for the purposes permitted by the modal guideline. Do not build parallel custom overlay systems.
- Every interactive control must perform its labeled operation, show pending/disabled behavior, handle errors, and synchronize with the source of truth.
- Optimistic updates must roll back on failure; prevent conflicting duplicate submits.
- Keep the existing dark-first premium AMS design. No ad-hoc redesign, arbitrary colors, !important, fake dashboard cards, inert buttons, or placeholder routes.

## 8. APIs, security, and data integrity

- Use the established typed API client and route/service structure. Do not make direct browser fetch calls around the API client without a justified pattern.
- Validate authorization server-side for every protected read and mutation; validate input server-side as well.
- Respect session/HttpOnly cookies, CSRF, MFA/TOTP, existing permission gates, encryption, and audit requirements.
- Treat content, user files, uploaded filenames, webhook bodies and all external-provider data as untrusted.
- Use stable external references and idempotency for imports, webhooks, document conversion, lead conversion, invoice creation and bank flows.
- Distinguish retryable and permanent failures. An unknown financial result must be reconciled/inquired into, not presumed failed and resubmitted.
- Keep errors helpful to the operator and sanitized of stack traces, SQL internals, secrets, bank credentials and unnecessary personal data.
- Add no new external integration unless its documented credentials/contracts, failure modes, and operator workflow are known.

## 9. Final acceptance rule

Do not declare completion because code compiles or a menu renders. Confirm the user's requested behavior, related end-to-end flow, permissions, persistence, failure cases, non-duplication, regression tests, and production implications. If some capability remains target-only or provider-dependent, mark it as such explicitly.


## 10. Complete engineering document map

Read domain-specific documents for substantial tasks:
- Target modules/workflows: docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md.
- Navigation and URL ownership: docs/architecture/ams-navigation-information-architecture.md.
- Requirement status/evidence: docs/AMS-IMPLEMENTATION-TRACEABILITY.md.
- UX and spacing/margin/padding: docs/AMS-UX-INTERACTION-STANDARDS.md and AMS-DESIGN-SYSTEM.md.
- Module content hierarchy and AI frontend-only UX/UI execution: docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md and docs/AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md.
- Role-based content specification across all nine modules, including worksheet fields, visualization rules, and role-aware presentation: docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md.
- Concrete per-worksheet role defaults, fields/columns, controls and visualization decisions: docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md.
- Documentation authority/index: docs/README.md.
- Concrete per-worksheet persona defaults, fields/columns, controls, and visual choices: docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md.
- Documentation index and source-of-truth classification: docs/README.md.
- Current production operations contract: docs/PRODUCTION-CUTOVER.md, docs/production-cutover-checklist.md, docs/production-readiness-gate.md, docs/postgres-backup-dr-runbook.md, and docs/private-document-vault.md. Historical/staging PostgreSQL migration notes must not be treated as live production instructions.
- Frontend routes/state/API/forms: docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md.
- Business transitions/side effects: docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md.
- Logical entities/canonical ownership: docs/AMS-DATA-MODEL-AND-DATA-DICTIONARY.md.
- Backend/API/authorization/transactions/idempotency: docs/AMS-BACKEND-API-AND-DATA-INTEGRITY.md.
- Finance: docs/FINANCE-EXCEL-ALIGNMENT.md.
- E2E/regression: docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md.
- Kopra when in scope: docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md.

### 10.1 Runtime data-source caveat

server/data-source.ts supports json and postgres and defaults to json if KAPITECH_DATA_SOURCE is unset. README specifies postgres as required production configuration. Verify authorized runtime configuration/readiness evidence; do not migrate production data, switch sources, roll back or claim the active store based on an old Markdown statement or the code default.

Older PostgreSQL foundation/cutover files may describe earlier rollout stages. Their unqualified source-of-truth claims are historical until checked against current code, README, deployed configuration and the readiness gate.

### 10.2 Target documents are not implementation evidence

The master architecture, navigation, state machine and data dictionary define intended behavior. They do not prove the feature, relationship, API or permission is implemented. Use traceability to connect every requirement to current source, server validation, schema, access policy and tests. Implement approved targets through scoped changes/migrations rather than assuming they are already live.
