# AMS Documentation Current State

**As of:** 5 November 2026  
**Status:** ACTIVE navigation and governance summary. This is **not** a product implementation completion certificate.

## One entry point per job

| Task | Read first | Read next |
|---|---|---|
| Agent startup and safety | `../AGENTS.md` | `README.md`, `AMS-DOCUMENTATION-GOVERNANCE-AND-AUTHORITY-MATRIX.md` |
| End-to-end implementation | `AMS-END-TO-END-EXECUTION-PROMPT.md` | `AMS-END-TO-END-DELIVERY-ROADMAP.md`, stage-specific specifications |
| Frontend structural changes | `AMS-FRONTEND-STRUCTURAL-REDESIGN-EXECUTION-PROMPT.md` | `AMS-MAIN-CONTENT-RESTRUCTURING-SPECIFICATION.md`, `../AMS-DESIGN-SYSTEM.md` |
| UX interaction | `AMS-UX-INTERACTION-STANDARDS.md` | `AMS-SHARED-UI-SYSTEM.md` |
| UX evidence and acceptance | `AMS-END-TO-END-UX-AUDIT-AND-QUALITY-STANDARDS.md` | `AMS-E2E-AND-REGRESSION-TEST-MATRIX.md` |
| Resume after interruption | `AMS-RESUME-AFTER-INTERRUPTION.md` | `AMS-EXECUTION-CHECKPOINT.md`, latest Git HEAD and CI |
| Requirement status and evidence | `AMS-FEATURE-CONTENT-GAP-REGISTER.md` | `AMS-IMPLEMENTATION-TRACEABILITY.md` and actual source/tests |
| Documentation validation | `AMS-DOCUMENTATION-VALIDATION-CHECKLIST.md` | `AMS-DOCUMENTATION-CONSOLIDATION-MAP.md`, `npm run docs:check` |

## Current approved UX presentation contracts

- Dashboard has **Overview** and **Analytics**. There is no standalone Performance tab. Source-backed comparison content belongs in Analytics.
- Inbox opens **Messages**; no separate Inbox Overview. Follow-ups and Routing & Templates retain their appropriate workflows.
- Finance has five master business taxonomy groups and six current rendered work areas. Maintain 20 workbook worksheets and Quotations. Presentation changes do not authorize changes to accounting semantics, API endpoints, permission guards, or data.
- The approved Dashboard Overview is the visual reference, not a universal layout template for every module.
- Stage 5 requires explicit visual/user sign-off before broader functional delivery.

## Evidence status, not a production claim

- Latest audited documentation integrity workflow: **PASS** at commit `53946679d91b7162b70c1073b8d7aff5f5beadcf`. Run: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42009375071.
- The **AMS Quality Gate** at that commit also completed with **success**. Run: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42009375028.
- AMS CI was **in progress** when this summary was authored. Check the run for the latest result: https://github.com/Kapitech-Agency/kapitech-ams/actions/runs/42009375049.
- Automated `docs:check` validates supported Markdown links and literal documentation references. It does not validate all dynamic references, semantic duplicates, product usability, user acceptance, or runtime state.

## Stable historical evidence

Keep the existing paths for `AMS-STRUCTURAL-REDESIGN-PROGRESS.md`, `AMS-UXUI-CONTENT-FIRST-IMPLEMENTATION-MAP.md`, `AMS-IMPLEMENTATION-TRACEABILITY.md`, and `AMS-EXECUTION-CHECKPOINT.md`. These record dated evidence and do not independently establish a live feature's readiness.

For a new task, verify the actual latest Git SHA, tests, runtime, permissions and user-approved scope. Do not infer completion from a historical record or this summary.

## Maintenance contract

Update this file only when approved ownership or current UX presentation changes. Do not paste recurring implementation logs here. Use `AMS-DOCUMENTATION-GOVERNANCE-AND-AUTHORITY-MATRIX.md` to resolve conflicts and `AMS-DOCUMENTATION-VALIDATION-CHECKLIST.md` for verification evidence.
