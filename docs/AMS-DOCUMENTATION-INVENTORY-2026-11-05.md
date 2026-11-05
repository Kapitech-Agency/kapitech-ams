# AMS Documentation Inventory and Link Baseline — 5 November 2026

**Status:** Verified recursive Git tree inventory, partial documentation validation.  
**Repository HEAD at inventory:** `eb2e2f3b692934afc7bcadae25fbe774955a08e4`. **Tree truncated:** false.  
**Tracked files:** 504; **Markdown:** 60; **docs Markdown:** 56; **docs Markdown bytes:** 2070772.

## Checked and confirmed
- Recursively enumerated current Git `main` tree rather than depending on README links.
- Read and checked Markdown relative file-link destinations in **all 56 `docs/**/*.md` files**, using tracked paths from the same tree. No nonexistent relative **file paths** were detected in this check.
- Existing root Markdown, in-source documentation paths, Markdown `#anchors`, external links and non-Markdown references were **not** part of that relative-link check.
- No files were moved or deleted. Historical evidence remains accessible.

## Classification caution
Table categories below are **inventory triage based on path/title**, not final line-by-line normative ownership or archive approval. Use `AMS-DOCUMENTATION-GOVERNANCE-AND-AUTHORITY-MATRIX.md` for real authority. The documentation consolidation map governs what may eventually be moved after a full inbound-reference audit.

## Complete tracked Markdown inventory

| File | Size KiB (rounded) | Preliminary classification |
|---|---:|---|
| `.github/copilot-instructions.md` | 5 | Governance, general or operations |
| `AGENTS.md` | 22 | Governance, general or operations |
| `AMS-DESIGN-SYSTEM.md` | 60 | Domain / specialist contract |
| `docs/AMS-AI-PHASED-IMPLEMENTATION-WORKFLOW.md` | 25 | Domain / specialist contract |
| `docs/AMS-BACKEND-API-AND-DATA-INTEGRITY.md` | 6 | Domain / specialist contract |
| `docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md` | 12 | Domain / specialist contract |
| `docs/AMS-CLIENTS-WORKSPACES.md` | 9 | Domain / specialist contract |
| `docs/AMS-CONTENT-ARCHITECTURE-AND-MODULE-WORKSPACE-GUIDELINES.md` | 23 | Governance, general or operations |
| `docs/AMS-DATA-MODEL-AND-DATA-DICTIONARY.md` | 12 | Domain / specialist contract |
| `docs/AMS-DOCUMENTATION-CONSOLIDATION-MAP.md` | 5 | Governance, general or operations |
| `docs/AMS-DOCUMENTATION-GOVERNANCE-AND-AUTHORITY-MATRIX.md` | 7 | Governance, general or operations |
| `docs/AMS-DOCUMENTATION-VALIDATION-CHECKLIST.md` | 4 | Governance, general or operations |
| `docs/AMS-DRAWER-GUIDELINES.md` | 6 | Domain / specialist contract |
| `docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md` | 10 | Governance, general or operations |
| `docs/AMS-END-TO-END-DELIVERY-ROADMAP.md` | 31 | Governance, general or operations |
| `docs/AMS-END-TO-END-EXECUTION-PROMPT.md` | 9 | Execution entry / specialist |
| `docs/AMS-END-TO-END-UX-AUDIT-AND-QUALITY-STANDARDS.md` | 38 | Domain / specialist contract |
| `docs/AMS-EXECUTION-CHECKPOINT.md` | 211 | Historical evidence / working register |
| `docs/AMS-FEATURE-CONTENT-GAP-REGISTER.md` | 106 | Governance, general or operations |
| `docs/AMS-FINANCE-WORKSPACES.md` | 8 | Domain / specialist contract |
| `docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md` | 7 | Domain / specialist contract |
| `docs/AMS-FRONTEND-ONLY-UXUI-EXECUTION-PROMPT.md` | 16 | Execution entry / specialist |
| `docs/AMS-FRONTEND-STRUCTURAL-REDESIGN-AUDIT-AND-EXECUTION-SPEC.md` | 37 | Domain / specialist contract |
| `docs/AMS-FRONTEND-STRUCTURAL-REDESIGN-EXECUTION-PROMPT.md` | 19 | Execution entry / specialist |
| `docs/AMS-IMPLEMENTATION-TRACEABILITY.md` | 211 | Historical evidence / working register |
| `docs/AMS-INBOX-MESSAGE-REDESIGN.md` | 14 | Domain / specialist contract |
| `docs/AMS-KANBAN-GUIDELINES.md` | 3 | Domain / specialist contract |
| `docs/AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md` | 73 | Governance, general or operations |
| `docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md` | 106 | Governance, general or operations |
| `docs/AMS-MAVEN-INSPIRED-OPERATIONAL-WORKSPACE-IMPLEMENTATION-GUIDE.md` | 79 | Governance, general or operations |
| `docs/AMS-MODAL-GUIDELINES.md` | 6 | Domain / specialist contract |
| `docs/AMS-NAVIGATION-FIRST-PHASED-EXECUTION-PROMPT.md` | 1 | Execution entry / specialist |
| `docs/AMS-POSTGRES-CUTOVER.md` | 4 | Historical / staging, verify per index |
| `docs/AMS-POSTGRES-FOUNDATION.md` | 4 | Historical / staging, verify per index |
| `docs/AMS-POSTGRES-RECONCILIATION.md` | 2 | Historical / staging, verify per index |
| `docs/AMS-POSTGRES-STAGING-IMPORT.md` | 4 | Historical / staging, verify per index |
| `docs/AMS-PROJECT-DELIVERY-WORKSPACES.md` | 6 | Domain / specialist contract |
| `docs/AMS-RELATIONAL-MIGRATION.md` | 5 | Historical / staging, verify per index |
| `docs/AMS-RESTORE-REHEARSAL.md` | 3 | Historical / staging, verify per index |
| `docs/AMS-RESUME-AFTER-INTERRUPTION.md` | 10 | Governance, general or operations |
| `docs/AMS-ROLE-BASED-CONTENT-BLUEPRINT.md` | 79 | Governance, general or operations |
| `docs/AMS-SHARED-UI-SYSTEM.md` | 18 | Governance, general or operations |
| `docs/AMS-STAGE-BY-STAGE-EXECUTION-CHECKLIST.md` | 43 | Governance, general or operations |
| `docs/AMS-STRUCTURAL-REDESIGN-PROGRESS.md` | 391 | Historical evidence / working register |
| `docs/AMS-UX-INTERACTION-STANDARDS.md` | 12 | Domain / specialist contract |
| `docs/AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md` | 169 | Historical evidence / working register |
| `docs/ams-workflow-audit.md` | 14 | Historical evidence / working register |
| `docs/AMS-WORKSHEET-ROLE-PRESENTATION-MATRIX.md` | 54 | Governance, general or operations |
| `docs/architecture/ams-navigation-information-architecture.md` | 15 | Governance, general or operations |
| `docs/FINANCE-EXCEL-ALIGNMENT.md` | 16 | Domain / specialist contract |
| `docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md` | 10 | Governance, general or operations |
| `docs/KAPITECH-AMS-FULL-UXUI-REDESIGN-PROMPT.md` | 24 | Execution entry / specialist |
| `docs/persistence-and-dr.md` | 5 | Governance, general or operations |
| `docs/postgres-backup-dr-runbook.md` | 3 | Governance, general or operations |
| `docs/private-document-vault.md` | 2 | Governance, general or operations |
| `docs/production-cutover-checklist.md` | 3 | Governance, general or operations |
| `docs/PRODUCTION-CUTOVER.md` | 7 | Governance, general or operations |
| `docs/production-readiness-gate.md` | 2 | Governance, general or operations |
| `docs/README.md` | 21 | Governance, general or operations |
| `README.md` | 10 | Governance, general or operations |

## Outstanding verification
1. Parse Markdown anchors and cross-file fragments and confirm headings.
2. Search all 504 tracked paths, source contents, tests, CI and scripts for references to docs before any rename.
3. Review old Dashboard Performance, Inbox Overview and Finance classification commands **in the operative body** of normative files; current top-of-file notes are compatibility safeguards, not final body-level normalization.
4. Compare content blocks for actual duplicate normative rules and preserve every unique contract.
5. Verify working copies/CI/tests and actual UI for implementation claims, without extrapolating from dated reports.

**Gate:** this inventory passes the recursive file-enumeration and `docs/` relative **file-target** stage only; full consolidation/archival acceptance remains PARTIAL.
