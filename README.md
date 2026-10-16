# Kapitech Agency Management System (AMS)

Production-grade internal Agency Management System for Kapitech Agency.

## Runtime

- Node.js 22
- Express API + React/Vite frontend
- Hostinger deployment compatible
- HttpOnly session cookies
- SameSite=Strict + CSRF protection
- TOTP MFA with one-time recovery codes
- AES-256-GCM encrypted persistent data
- Rolling encrypted database backups
- Private server-side document vault

## Production environment

Core production configuration:
- `NODE_ENV=production`
- `KAPITECH_DATA_SOURCE=postgres`
- `KAPITECH_POSTGRES_URL`
- `KAPITECH_DATA_ENCRYPTION_KEY`
- `ADMIN_INITIAL_USERNAME`
- `ADMIN_INITIAL_PASSWORD`
- `ADMIN_INITIAL_EMAIL` are required only when the PostgreSQL database does not already contain a Master admin. Existing PostgreSQL installations keep their existing administrator.
Optional:
- `KAPITECH_DATA_DIR`
- `KAPITECH_DB_BACKUP_RETENTION` (3-30, default 14)
- `KAPITECH_DB_BACKUP_DIR`
- `GEMINI_API_KEY`
- `KAPITECH_TELEGRAM_BOT_TOKEN`
- `KAPITECH_TELEGRAM_CHAT_ID`
- PostgreSQL runtime: `KAPITECH_DATA_SOURCE=postgres`, `KAPITECH_POSTGRES_URL` and optional SSL/pool settings.
- PostgreSQL mode: `KAPITECH_POSTGRES_BACKUP_PROVIDER`, `KAPITECH_POSTGRES_BACKUP_LATEST_AT`, `KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT`, `KAPITECH_POSTGRES_BACKUP_RPO_MINUTES`, `KAPITECH_POSTGRES_BACKUP_RTO_MINUTES`, `KAPITECH_POSTGRES_BACKUP_RETENTION_DAYS`
- PostgreSQL production Document Vault: `KAPITECH_DOCUMENT_STORAGE_PROVIDER`, `KAPITECH_DOCUMENT_STORAGE_BUCKET`, `KAPITECH_DOCUMENT_STORAGE_ENDPOINT`, `KAPITECH_DOCUMENT_STORAGE_REGION`, `KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID`, `KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY` (optional `KAPITECH_DOCUMENT_STORAGE_SESSION_TOKEN`)
- PostgreSQL migration chain currently runs through migration 049. Migration status must still be checked against the live database before declaring a release ready. Telegram bot credentials remain runtime-managed via `KAPITECH_TELEGRAM_BOT_TOKEN` and are not persisted in PostgreSQL.
- S3-compatible provider stores only application-encrypted objects; the AMS never exposes the underlying object URL.

Generate a 32-byte encryption key with:

`openssl rand -hex 32`

Do not commit runtime data, credentials, encryption keys, or private document files.

## Verification

CI runs:
`npm ci`
`npm run lint`
`npm run build`

For production smoke testing, use:
`GET /api/health`
and
`GET /api/auth/me`

An unauthenticated `/api/auth/me` response of HTTP 401 is expected.

## Public CMS data integrity

Bundled portfolio fixtures are not seeded into the production CMS. Existing bundled project records and default testimonials are quarantined by migration 048 until an editor verifies ownership, permissions, outcome metrics, and publication approval. Migration 049 adds indexed vendor/contract links to expense records and backfills matching legacy vendor-payment marker records without changing their ledger amounts. Only reviewed CMS entries explicitly published by an authorized editor should appear as client work or testimonials.

## Persistence and recovery

Rolling encrypted backups are created before live database replacement. Privileged IT/Master users can request a manual snapshot through the System Backup API.

Restore utility:

`node scripts/restore-ams-db.mjs /absolute/path/to/backup.bak --force`

PostgreSQL is the authoritative data source in production. Encrypted JSON persistence remains available for controlled development/test. **Current runtime limitation:** `server.ts` blocks the production API when `KAPITECH_DATA_SOURCE` is not `postgres`, so a rollback to JSON is not executable under the current production guard. Do not bypass the guard or switch production to a non-production runtime. Any JSON rollback requires a separately authorized change reconciling the startup guard, rollback procedure, payment idempotency parity, verified backups, and reconciliation evidence.

Release readiness: an authorized security/IT operator must verify `GET /api/system/production-readiness` returns HTTP 200 with `productionReady=true`. The gate checks all migrations and checksums shipped with the release, MFA coverage, reconciliation evidence, backup/restore status, durable document storage, and enabled notification channels. See `docs/production-readiness-gate.md` and `docs/production-cutover-checklist.md`.

## AI agent and architecture documentation

Before any AI-assisted code change, read [AGENTS.md](AGENTS.md). GitHub Copilot also receives repository-specific rules in [.github/copilot-instructions.md](.github/copilot-instructions.md).

Core references:
- [AMS Design System](AMS-DESIGN-SYSTEM.md): visual tokens, layout, shared components and interaction rules.
- [AMS Master Structure & AI Implementation Guide](docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md): target navigation, modules, workflows, shared data, Finance, Kopra H2H preparation, implementation phases and acceptance criteria.
- [Finance Excel Alignment](docs/FINANCE-EXCEL-ALIGNMENT.md): existing Finance process and accounting controls.
- [AMS Workflow Audit](docs/ams-workflow-audit.md): dated audit evidence; its historical route taxonomy/status must not be mistaken for the current target state.
- [Drawer Guidelines](docs/AMS-DRAWER-GUIDELINES.md), [Modal Guidelines](docs/AMS-MODAL-GUIDELINES.md), and [Kanban Guidelines](docs/AMS-KANBAN-GUIDELINES.md): required shared interactions.

Important: the master structure document describes the **target state**, not a claim that every listed feature has shipped. Verify actual code, APIs, schema, permissions, tests, and production readiness before changing or reporting implementation status.


## AMS Engineering Standards

Read AGENTS.md before AI-assisted changes. GitHub Copilot's repository-specific rules are in .github/copilot-instructions.md.

### Product and navigation
- docs/AMS-MASTER-STRUCTURE-AND-AI-IMPLEMENTATION-GUIDE.md — target modules/workflows.
- docs/architecture/ams-navigation-information-architecture.md — route and navigation ownership.
- docs/AMS-IMPLEMENTATION-TRACEABILITY.md — requirements, evidence and implementation status.

### UX and frontend
- AMS-DESIGN-SYSTEM.md — exact tokens, layout and shared components.
- docs/AMS-UX-INTERACTION-STANDARDS.md — hierarchy, spacing ownership, interaction and visual consistency.
- docs/AMS-FRONTEND-ENGINEERING-STANDARDS.md — routes, state, API use, forms and mutations.
- docs/AMS-DRAWER-GUIDELINES.md, docs/AMS-MODAL-GUIDELINES.md, docs/AMS-KANBAN-GUIDELINES.md — shared interaction contracts.

### Domain, backend and verification
- docs/AMS-BUSINESS-WORKFLOW-STATE-MACHINES.md — valid state transitions and side effects.
- docs/AMS-DATA-MODEL-AND-DATA-DICTIONARY.md — canonical entities and logical relationships.
- docs/AMS-BACKEND-API-AND-DATA-INTEGRITY.md — server/API/security/transaction rules.
- docs/FINANCE-EXCEL-ALIGNMENT.md — established Finance workflow and controls.
- docs/AMS-E2E-AND-REGRESSION-TEST-MATRIX.md — cross-module regression and E2E evidence.
- docs/integrations/BANK-MANDIRI-KOPRA-H2H-INTEGRATION.md — planned, provider-dependent Kopra integration requirements.
- docs/ams-workflow-audit.md — dated findings, not the latest target taxonomy.

### Runtime source-of-truth warning

server/data-source.ts selects json or postgres through KAPITECH_DATA_SOURCE and defaults to json if the variable is unset. Production configuration specified in this README requires KAPITECH_DATA_SOURCE=postgres. Never infer the deployed source from the code default or an old runbook. Verify authorized runtime configuration and GET /api/system/production-readiness before a production-source claim, cutover, migration or rollback.

The master guide defines the target architecture, not proof that every feature has shipped. Verify code, APIs, schema, permissions, tests and provider evidence before reporting implementation status.
