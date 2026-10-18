# Kapitech AMS — GitHub Copilot Instructions

Read root AGENTS.md before coding. It defines task boundaries, conflict resolution, verification and reporting. Read `docs/README.md` for the documentation index and authority rules; historical migration notes are not current production instructions.

## Required documentation by task
- Target modules/workflows: docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md and docs/architecture/ams-navigation-information-architecture.md.
- Requirement status/evidence: docs/AMS-IMPLEMENTATION-TRACEABILITY.md.
- Current production operations: docs/PRODUCTION-CUTOVER.md, docs/production-cutover-checklist.md, docs/production-readiness-gate.md, docs/postgres-backup-dr-runbook.md, and docs/private-document-vault.md.
- UI: AMS-DESIGN-SYSTEM.md and docs/AMS-UX-INTERACTION-STANDARDS.md.
- Main content and role-aware worksheet presentation: docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md and docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md.
- Shared interactions: docs/AMS-DRAWER-GUIDELINES.md, docs/AMS-MODAL-GUIDELINES.md, docs/AMS-KANBAN-GUIDELINES.md.
- Frontend: docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md.
- Business transitions: docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md.
- Data model: docs/AMS-DATA-MODEL-AND-DATA-DICTIONARY.md.
- Backend/API/security: docs/AMS-BACKEND-API-AND-DATA-INTEGRITY.md.
- Finance: docs/FINANCE-EXCEL-ALIGNMENT.md.
- Verification: docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md.
- Kopra only when in scope: docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md.

## Non-negotiable rules
- Do only the scope requested. Documentation-only means no application-code changes.
- Target is nine primary modules: Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings. CRM, Proposal and Approval are not primary modules.
- Target specifications are not proof of implementation. Inspect current code, APIs, schema, permissions and test evidence.
- Do not delete APIs, data, audit trails, quotation conversion, maker-checker or period-close controls because a legacy sidebar item is removed. Keep the existing quotation workflow in Finance; do not build a replacement CRM pipeline or generic approval engine.
- Preserve Finance formulas, mappings, transaction meaning, reports, journal controls and closing behavior unless a business-rule change is explicitly approved and reconciled.
- Reuse current components, tokens, API client, stores and permission patterns; do not build parallel systems for convenience.
- The frontend is not the source of business logic or permission authority.
- Never use fixtures as production truth or hardcode success.
- Preserve session, CSRF, MFA, RBAC, encryption, private document vault and audit controls.
- Runtime selects json/postgres through KAPITECH_DATA_SOURCE and defaults to json if unset; production configuration requires postgres. Verify authorized runtime/readiness evidence before source claims or migrations.
- Never commit secrets, private documents, real bank data or sensitive provider payloads.
- Kopra remains provider-dependent until official contract/access/testing are available. Never invent endpoints/cryptography or call production payments in ordinary tests.
- Run and report actual tests, lint, build and relevant E2E checks. A build alone is not workflow proof.
- Prefer small, reversible, evidence-backed changes; report uncertainty rather than guessing.
