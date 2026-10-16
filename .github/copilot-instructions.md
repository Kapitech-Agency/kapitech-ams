# Kapitech AMS — GitHub Copilot Instructions

Before coding, read root **AGENTS.md**. It is the primary AI agent contract for this repository.

For all UI changes, read **AMS-DESIGN-SYSTEM.md** and the relevant interaction guideline:
- Drawer: **docs/AMS-DRAWER-GUIDELINES.md**
- Modal and destructive confirmation: **docs/AMS-MODAL-GUIDELINES.md**
- Kanban: **docs/AMS-KANBAN-GUIDELINES.md**

For target navigation, modules, workflows and cross-module data, read **docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md**. It describes the intended target, not proof that every feature already exists.

For Finance changes, read **docs/FINANCE-EXCEL-ALIGNMENT.md** and inspect current Finance source/tests. Preserve accounting formulas, existing worksheet behavior, transaction history, journal controls, approval/maker-checker and period-close guards unless the user explicitly approves a business-rule change.

For current implementation evidence, read **docs/ams-workflow-audit.md**, but treat its implementation status/taxonomy as a dated audit snapshot. The master structure guide supersedes its old sidebar taxonomy; actual source code, tests and production data must be checked before declaring feature status.

Non-negotiable rules:
- Do only the requested scope. Documentation-only means no application code changes.
- Do not replace the AMS design with a new design system or introduce a parallel component/API/store.
- Do not delete backend APIs, schema, data, audit trails or controls merely because a legacy sidebar module is removed.
- Keep only the ten target top-level modules from the master guide; subareas remain inside the relevant module.
- Do not use demo/fixture data as production data or hardcode success.
- Preserve session, CSRF, MFA, server-side authorization, RBAC, encrypted storage and audit requirements.
- Never commit credentials, keys, private documents, real bank account data, or bank payloads.
- Kopra H2H is a planned/provider-dependent integration until bank documentation, account access, technical contract and environment are verified. Never invent endpoints or initiate real payments in tests.
- Run and report real tests, lint, build and relevant E2E checks. Do not claim a check passed if it was not executed.
- Prefer small, validated, reversible changes and report uncertainties rather than silently guessing.
