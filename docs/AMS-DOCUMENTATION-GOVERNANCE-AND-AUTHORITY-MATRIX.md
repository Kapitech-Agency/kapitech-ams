# AMS Documentation Governance and Authority Matrix

**Status:** ACTIVE, mandatory for documentation changes. **Updated:** 5 November 2026.
**Scope:** repository documentation organization, precedence, maintenance, consolidation, archival and evidence. No authority to edit software, Finance formulas, auth, RBAC or data.

## 1. Single-source-of-truth model

A requirement has one **normative owner**. Other files link to that owner, supply a bounded implementation example or keep dated evidence. Repeated instructions are not independent authorities. `AGENTS.md` and `docs/README.md` remain entry points.

| Concern | Normative owner | Supplemental context (not competing authority) |
|---|---|---|
| AI execution safety and branch | `AGENTS.md` | `AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md` |
| Product scope/module ownership | `AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` | Role blueprint, gap register |
| Navigation and route depth | `architecture/ams-navigation-information-architecture.md` | Master Structure |
| Main-workspace relative order | `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` §4.10 | Content Architecture Guidelines (high-level explanation only) |
| Domain-specific card/record content | `AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md` | Role matrix and source contracts |
| Visual tokens, geometry, breakpoints | `../AMS-DESIGN-SYSTEM.md` | `AMS-UX-INTERACTION-STANDARDS.md` (usage) |
| Shared component implementation | `AMS-SHARED-UI-SYSTEM.md` | `ui/shared-ui-inventory.json` generated consumers |
| Interaction geometry and per-page behavior | `AMS-UX-INTERACTION-STANDARDS.md` | Drawer, Modal, Kanban domain guidelines |
| UX heuristics and acceptance methodology | `AMS-END-TO-END-UX-AUDIT-AND-QUALITY-STANDARDS.md` | E2E regression matrix |
| Frontend engineering contracts | `AMS-FRONTEND-ENGINEERING-STANDARDS.md` | Shared UI catalogue |
| Backend integrity, security | `AMS-BACKEND-API-AND-DATA-INTEGRITY.md` | actual server guards/code/tests |
| Logical data/schema definitions | `AMS-DATA-MODEL-AND-DATA-DICTIONARY.md` | deployed schema/migration evidence |
| Workflow transitions | `AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md` | current domain code/tests |
| Finance formulas and accounting | `FINANCE-EXCEL-ALIGNMENT.md` + tested actual logic | `AMS-FINANCE-WORKSPACES.md` only owns current UI grouping |
| Current Finance UI grouping | `AMS-FINANCE-WORKSPACES.md` (six presentation areas) | five master taxonomy areas still own domain classification |
| Staged delivery order | `AMS-END-TO-END-DELIVERY-ROADMAP.md` | Stage-by-Stage Checklist |
| Current requirement status | `AMS-FEATURE-CONTENT-GAP-REGISTER.md` with refreshed evidence | Traceability register, checkpoint, progress history |
| Verification and regression scenarios | `AMS-E2E-AND-REGRESSION-TEST-MATRIX.md` | UX audit playbook |
| Recovery from interrupted AI work | `AMS-RESUME-AFTER-INTERRUPTION.md` + latest `AMS-EXECUTION-CHECKPOINT.md` | older progress archives |
| Production deployment and recovery | indexed current production runbooks in `docs/README.md` | historical PostgreSQL staging documents are non-operational |

## 2. Current UX decisions that supersede older examples

- Dashboard visible views: **Overview, Analytics**. Do not recreate removed Performance tab.
- Inbox default: **Messages**. No standalone Inbox Overview.
- Finance: **five target taxonomy groups** in Master Structure/IA, **six current UI presentation work areas** in Finance Workspaces. Do not mutate worksheet IDs or API contracts.
- Approved Dashboard Overview is visual baseline. Current shared UI components and exact Design System geometry are mandatory.
- Breadcrumbs contextual on deep record pages, not duplicated globally.
- UI availability is not backend implementation. Missing source is not zero or healthy empty.
- Stage 5 explicit user acceptance remains required before broad Stage 6 implementation.

## 3. Document lifecycle and labels

Every normative file should have: title, purpose, scope, authority, status (ACTIVE / SUPPORTING / HISTORICAL / SUPERSEDED / ARCHIVED), owner by role, updated date, dependencies, and amendment/supersession history. Snapshot/commit notes must say what they do and do not prove.

**ACTIVE** = current authority for named concern. **SUPPORTING** = detail and examples under owner. **HISTORICAL** = dated evidence, never executable by default. **SUPERSEDED** = explicit target successor and migration path. **ARCHIVED** = retained read-only context. A newer timestamp alone does NOT trump an explicit domain/security authority.

## 4. Merge vs keep vs archive

Merge only if two files have substantially the same purpose, audience, rule authority and update cadence. Before merging, map every heading, unique assertion, ID, link, code/test contract and status reference to a successor. Preserve historical context with a migration pointer and avoid altering links consumed by code, tests or bots. Do not merge Finance formulas with UI guidance, or backend/security control contracts with UX heuristics. Do not move active files until path consumers and redirects are verified.

**Preferred safe consolidation:** one execution entry point (`AMS-END-TO-END-EXECUTION-PROMPT.md`) that selects the authorized task's specialist specification, not three independent stage schedules. UX law/heuristic acceptance remains in UX audit playbook; exact geometry remains in the Design System and interaction guidance. Keep historical implementation logs distinct from current gap/traceability truth.

## 5. AI reading protocol

1. Read `AGENTS.md` and `docs/README.md`.
2. Identify requested task, scope, user decision, current branch/SHA, and designated normative domain owner using matrix above.
3. Read only needed specialist contracts, current route/components/callers/code/test, plus current gap/checkpoint.
4. Mark conflicting statements with file/section, evidence and authority; do not blend or choose by recency alone.
5. Execute bounded authorized work; verify outputs and update only affected source-of-truth locations.
6. Maintain source links, evidence dates and status; report unresolved conflicts.

## 6. Documentation change acceptance

No documentation change is complete unless the owner/role is clear, competing normative phrasing removed or explicitly superseded, all affected links/path consumers validated, source/target/history distinguished, current SHA noted for implementation claims, and all referenced test/acceptance conditions retained. Use `AMS-DOCUMENTATION-VALIDATION-CHECKLIST.md` for gates and `AMS-DOCUMENTATION-CONSOLIDATION-MAP.md` for non-destructive migration plans.
