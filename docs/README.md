# Kapitech AMS Documentation Index

**Updated:** 19 October 2026  
**Repository:** `Kapitech-Agency/kapitech-ams`  
**Purpose:** Identify the authoritative product, design, engineering, evidence, and operational documents without confusing target specifications with verified implementation.

> **Critical:** A document describes intent, a procedure, or evidence within its stated scope. It does not prove that a feature is implemented, that a historical branch/PR is still current, or that production is healthy. Verify current `main`, relevant source and tests, current CI, and authorized production-readiness evidence before taking action.

## 1. Authority and conflict-resolution rules

Use these rules when documents appear to conflict:

1. Follow the user's latest explicit instruction for the active task, within repository and security safeguards.
2. Read root [`AGENTS.md`](../AGENTS.md) and [GitHub Copilot instructions](../.github/copilot-instructions.md) for task boundaries and delivery rules.
3. Use current application source, server-side policies, schema/migrations, tests, latest CI runs, and verified runtime evidence to determine what exists and what is currently safe. Do not let a target document override observed current behavior.
4. Use [AMS Master Structure & AI Implementation Guide](AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md) for target product/workflow ownership; [navigation IA](architecture/ams-navigation-information-architecture.md) for approved navigation; [AMS Design System](../AMS-DESIGN-SYSTEM.md) for visual authority.
5. Use domain documents for their limited domain authority: [Finance alignment](FINANCE-EXCEL-ALIGNMENT.md) for accounting/worksheet semantics, [workflow state machines](AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md) for transitions, [data dictionary](AMS-DATA-MODEL-AND-DATA-DICTIONARY.md) for logical ownership, and the [Kopra integration spec](integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md) for planned bank-integration constraints.
6. Use [Implementation Traceability](AMS-IMPLEMENTATION-TRACEABILITY.md) as an evidence register, not a live repository-status feed. Its dated snapshots must be rechecked against current `main`.
7. For production operation, use the current operational runbooks in Section 5. Historical/staging documents in Section 6 are not alternative production instructions.

When two active product documents disagree, do not silently choose a more convenient interpretation. Prefer the approved Master Structure + navigation IA for module ownership/navigation; preserve domain-owned business rules; identify the conflict and update the documents together.

For execution sequencing, `AMS-END-TO-END-DELIVERY-ROADMAP.md` is canonical. The feature/content gap register records current requirement status and evidence, not a second schedule. `AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` remains the target product/workflow specification; its implementation-stage guidance must be read consistently with the roadmap rather than treated as a competing numbered rollout. Routine slices receive reports and continue within the user's authorized scope; stop at the explicit visual sign-off gate and for genuine decision/blocker gates.

## 2. Canonical product and data specifications

| Document | Purpose / authority |
|---|---|
| [AMS Master Structure & AI Implementation Guide](AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md) | Target nine-module architecture, workspaces, workflows, data ownership, Finance, integration boundaries, and acceptance criteria. Target specification, not proof of implementation. |
| [AMS End-to-End Delivery Roadmap](AMS-END-TO-END-DELIVERY-ROADMAP.md) | **Single canonical stage sequence** from current baseline through design, workflow completion, validation, operational readiness, deployment verification and stabilization. |
| [AMS Stage-by-Stage Execution Checklist](AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md) | Detailed mandatory checklist for Stage 0–15 entry/exit criteria, breadcrumb implementation/verification, cross-module acceptance, evidence, bulk commits and timeout recovery. Supplements the canonical roadmap; does not replace its stage order. |
| [AMS Navigation Information Architecture](architecture/ams-navigation-information-architecture.md) | Approved primary modules, workspace ownership, route/deep-link behavior, breadcrumbs, and legacy-route policy. |
| [AMS Role-Based Content Blueprint](AMS-ROLE-BASED-CONTENT-BLUEPRINT.md) | Content purpose, page anatomy, chart/metric contracts, role-aware presentation, and cross-module rules. |
| [AMS Main-Content Restructuring Specification](AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md) | Mandatory detailed Stage 4 contract to structurally rebuild main content across all nine modules and worksheets, including data, actions, states, role-aware presentation, breadcrumbs, responsive behavior and acceptance. Not a cosmetic-revision guide. |
| [AMS Worksheet Role Presentation Matrix](AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md) | Concrete persona emphasis, expected fields/columns, filters/actions, and visualization choice by worksheet. Personas do not grant permissions. |
| [AMS Data Model and Data Dictionary](AMS-DATA-MODEL-AND-DATA-DICTIONARY.md) | Logical entity ownership, relationships, field definitions, integrity rules, and current-contract cautions. |
| [AMS Feature & Content Gap Register](AMS-FEATURE-CONTENT-GAP-REGISTER.md) | Requirement-level inventory across modules, content, workflows, data, access, tests and production readiness; statuses must be revalidated against current evidence. |
| [AMS Business Workflow State Machines](AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md) | Target state transitions, guards, side effects, and required transition tests. Map conceptual states to current enums before coding. |
| [Finance Excel Alignment](FINANCE-EXCEL-ALIGNMENT.md) | Finance worksheet/source mapping, established calculations, posting controls, workbook alignment, and known limitations. |
| [Kopra H2H Integration Specification](integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md) | Planned/provider-dependent bank integration. Official bank contract and approved sandbox evidence are required before connector implementation. |

### Approved top-level navigation

AMS has nine primary modules: **Dashboard, Inbox, Projects, Clients, Finance, Team & Resources, Documents, Website CMS, Settings**. CRM, Proposal, and generic Approval are not primary modules. Removing a navigation link does not authorize deleting historical records, APIs, permission policies, maker-checker controls, or other workflow dependencies.

Finance has five approved areas: **Overview & Control, Transactions & Cash, Receivables & Payables, Project Finance, Accounting & Reports**. Preserve the existing worksheet identities, canonical records, accounting semantics, and source/API behavior.

## 3. Visual, UX/UI, and content implementation

| Document | Use it for |
|---|---|
| [AMS Design System](../AMS-DESIGN-SYSTEM.md) | **Single visual authority:** tokens, exact spacing relationships, component geometry and variants, typography, responsive breakpoint/viewport contract, motion, and WCAG 2.2 AA target. |
| [AMS UX and Interaction Standards](AMS-UX-INTERACTION-STANDARDS.md) | Applies the canonical visual contract across pages; no competing tokens, dimensions or breakpoint values. |
| [AMS Content Architecture & Module Workspace Guidelines](AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md) | Page anatomy and the task-specific main working area for each module. |
| [AMS Frontend-only UX/UI Execution Prompt](AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md) | **Canonical execution prompt for current frontend-only content/UX/UI work.** Requires target docs, source audit, bounded implementation slices, and verification. |
| [AMS Full UX/UI Redesign Prompt](KAPITECH-AMS-FULL-UXUI-REDESIGN-PROMPT.md) | Historical general-purpose prompt. For the current end-to-end mission use the delivery roadmap and end-to-end prompt; use the frontend-only prompt for a narrowly scoped visual task. |
| [AMS Structural Redesign Progress](AMS-STRUCTURAL-REDESIGN-PROGRESS.md) | Compact progress roll-up. Commit/CI mentions inside individual slices are evidence for those exact commits, not proof the latest `main` is passing. |
| [AMS Content-First UX/UI Implementation Map](AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md) | Detailed view-by-view implementation/change history. Check the latest source and progress roll-up before treating historical checkpoints as current. |
| [Drawer Guidelines](AMS-DRAWER-GUIDELINES.md) | Shared drawer use, responsive geometry, focus, form and action behavior. |
| [Modal Guidelines](AMS-MODAL-GUIDELINES.md) | Shared modal/confirmation behavior, focus management, safety and visual contract. |
| [Kanban Guidelines](AMS-KANBAN-GUIDELINES.md) | Board stages, drag/drop, pending/rejected writes, read-only behavior, and responsive interaction. |

Do not restart an independent architecture redesign from the older general prompt. Implement the already approved structure unless the user explicitly approves a product change.

## 4. Engineering, security, workflow, and verification

| Document | Use it for |
|---|---|
| [AMS Frontend Engineering Standards](AMS-FRONTEND-ENGINEERING-STANDARDS.md) | Frontend routes/state/API-client use, mutation states, forms, overlays, permission-safe UX, and acceptance checklist. |
| [AMS Backend API and Data Integrity Standards](AMS-BACKEND-API-AND-DATA-INTEGRITY.md) | Server validation, authorization, transaction/concurrency, idempotency, audit, and persistence boundaries. |
| [AMS E2E and Regression Test Matrix](AMS-E2E-AND-REGRESSION-TEST-MATRIX.md) | Cross-module behavior, Finance, role/security, bank-testing, and release evidence. |
| [AMS Implementation Traceability Register](AMS-IMPLEMENTATION-TRACEABILITY.md) | Requirement IDs and evidence. Historical rows/PR references are dated snapshots; recheck current branch and workflows. |
| [AMS AI Phased Implementation Workflow](AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md) | Safe incremental AI execution, audit-first stages, checkpoints, recovery after interruption, validation and delivery reporting. |
| [AMS End-to-End Execution Prompt](AMS-END-TO-END-EXECUTION-PROMPT.md) | Canonical copy/paste operating prompt. It follows the roadmap, carries forward existing changes, requires evidence-based status updates and timeout-safe checkpoints. |
| [Legacy Navigation-First Prompt](AMS-NAVIGATION-FIRST-PHASED-EXECUTION-PROMPT.md) | Compatibility pointer only. Use the End-to-End Execution Prompt and Delivery Roadmap; this filename is not a separate schedule. |
| [AMS Workflow Audit](ams-workflow-audit.md) | Historical audit findings as of its stated date; not current implementation status or target navigation authority. |

## 5. Current documented production and operations references

These documents define the current **documented contract** for production operations. They do not prove that Hostinger, database, backup infrastructure, storage or notifications are configured and healthy.

| Document | Purpose |
|---|---|
| [Production Cutover / Hostinger Handoff](PRODUCTION-CUTOVER.md) | Documented production environment, deployment target, configuration contract and release requirements. Verify saved Hostinger repository, domain, branch, and variables before deployment. |
| [Production Cutover Checklist](production-cutover-checklist.md) | Required runtime and artifact evidence before production readiness is declared. |
| [Production Readiness Gate](production-readiness-gate.md) | Authenticated `GET /api/system/production-readiness` checks and response semantics. |
| [PostgreSQL Backup & DR Runbook](postgres-backup-dr-runbook.md) | PostgreSQL provider backup, restore verification, RPO/RTO expectations and DR ownership. |
| [Private Document Vault Contract](private-document-vault.md) | Private object storage, checksums, access, and coordinated document recovery. |
| [Persistence and DR Overview](persistence-and-dr.md) | High-level recovery index and explicit distinction between current PostgreSQL production recovery and legacy JSON restore tooling. |

Before any production claim or destructive operation, verify the latest deployed release, authorized runtime settings, the full runtime-discovered migration/checksum set, reconciliation, MFA, backup/restore artifact binding, document-object integrity, and enabled integration readiness. Do not assume that a successful build or database health check satisfies the complete readiness gate.

## 6. Historical migration and staging-only references

The documents below preserve useful context, migration utilities, or earlier rollout plans. They are **not alternate production runbooks** and must not be followed as if their old rollout assumptions were current.

| Document | Classification and caution |
|---|---|
| [PostgreSQL Foundation](AMS-POSTGRES-FOUNDATION.md) | Historical initial-schema/staging foundation. Do not infer the current schema or repeat migration 001 against production. |
| [PostgreSQL Reconciliation](AMS-POSTGRES-RECONCILIATION.md) | Historical/staging reconciliation method. Not proof of live source mode or authorization to cut over. |
| [PostgreSQL Staging Import](AMS-POSTGRES-STAGING-IMPORT.md) | Staging-only importer. Does not perform the production repository cutover or physical document-object migration. |
| [Relational Migration Plan](AMS-RELATIONAL-MIGRATION.md) | Earlier logical migration plan. Do not treat its “next stage” list or rollback assumptions as current tasks. |
| [PostgreSQL Cutover and Rollback Constraints](AMS-POSTGRES-CUTOVER.md) | Earlier cutover safety context; explicitly documents that JSON rollback is blocked under the current production guard. It is not an executable JSON rollback procedure. |
| [PostgreSQL Backup Restore Rehearsal](AMS-RESTORE-REHEARSAL.md) | Staging-only PostgreSQL dump restore into an isolated empty rehearsal database, including migration checksum verification. It is not a production restore command or proof of provider readiness. |
| [Structural UX/UI Change Map](AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md) | Detailed dated history. See Section 3. |

Historical docs must retain their context but must not state old deployment/migration stages as current facts. If their instructions are reused for staging, verify compatibility with the current scripts and source first.

## 7. Module and integration scope boundaries

- No standalone CRM, Proposal, or generic Approval primary module.
- Keep quotation workflows in Finance and preserve compatible records/APIs where consumers still rely on them.
- Keep client requests and message threads owned by Inbox; Careers applicants are owned by Website CMS → Careers → Applicants.
- Keep canonical vendors/freelancers under Team & Resources; Finance references their records.
- Keep private documents in the canonical Documents library and preserve authenticated, permission-checked access.
- Keep bank integration provider-dependent until the official contract, enabled-feature list, sandbox, and certification requirements are available.
- Role/persona presentation may change default priority or useful columns only within existing permissions; it must never grant access or change business meaning.
- Do not create fake production data, parallel record stores, new permission models, or frontend-only states for money movement.

## 8. Change and maintenance rules

1. Update the canonical owner document first, then reconcile all secondary references touched by that change.
2. Add explicit **status**, **scope**, **last reviewed date**, and **evidence reference** when the document records changing implementation or operational state.
3. Distinguish **target specification**, **verified implementation**, **historical snapshot**, **staging-only procedure**, and **provider-dependent capability**.
4. Do not hardcode the latest migration prefix in readiness docs; check all migration files discovered by the current runtime loader against applied versions and checksums.
5. When retiring a document, keep it only if history/recovery value remains; add a superseded/historical notice and link to its replacement.
6. A documentation update does not itself verify code, current CI, runtime configuration, or a live deployment.
