# AMS PostgreSQL Foundation — Historical Staging Reference

> **Runtime-status clarification:** This document contains foundation/migration guidance and may include statements from an earlier rollout stage. server/data-source.ts supports json/postgres and defaults to json if KAPITECH_DATA_SOURCE is unset; README specifies postgres as the required production configuration. This document alone does not prove the deployed data source. Before migration, rollback or production claims, verify authorized runtime configuration and GET /api/system/production-readiness. Do not switch sources or migrate production data based on this document alone.

This is a historical description of the PostgreSQL foundation and its original staged rollout. It is retained for context and staging work, not as current production rollout instructions. The schema, repository adapters, migration chain, and operating contract may have advanced since this phase. Before any production action, inspect the current `main` source and verify authorized runtime configuration and `GET /api/system/production-readiness`. The operational references are `README.md`, `docs/PRODUCTION-CUTOVER.md`, `docs/production-cutover-checklist.md`, `docs/production-readiness-gate.md`, and `docs/postgres-backup-dr-runbook.md`.

## Components

- `db/postgres/001_initial_schema.sql` — versioned relational schema.
- `server/postgres.ts` — PostgreSQL connection pool, parameterized query helper, transaction helper, and health check.
- `scripts/postgres-migrate.ts` — transactional migration runner with advisory locking and migration checksums.
- `tests/postgres-foundation.test.ts` — schema coverage and fail-closed configuration checks.

## Safety rules

- PostgreSQL is never used unless `KAPITECH_POSTGRES_URL` is explicitly configured.
- The current JSON database is not modified by the PostgreSQL foundation.
- Migration 001 is checksum-protected. A modified already-applied migration is rejected.
- Migration execution uses a PostgreSQL advisory lock so concurrent migration processes cannot race.
- **Historical state at the time this foundation document was written:** business writes had not yet been routed to PostgreSQL, and production cutover was deferred. These statements are not current-state evidence. Use the current production runbooks and runtime readiness gate to assess the deployed system.

## Configuration

Required:

`KAPITECH_POSTGRES_URL`

Optional:

- `KAPITECH_POSTGRES_SSL=require|disable` (default: `require`)
- `KAPITECH_POSTGRES_SSL_REJECT_UNAUTHORIZED=true|false` (default: `true`)
- `KAPITECH_POSTGRES_POOL_MAX` (default: 10)
- `KAPITECH_POSTGRES_IDLE_TIMEOUT_MS` (default: 10000)
- `KAPITECH_POSTGRES_CONNECTION_TIMEOUT_MS` (default: 5000)
- `KAPITECH_POSTGRES_STATEMENT_TIMEOUT_MS` (default: 15000)

## Historical foundation migration example — staging only

This example describes the initial migration phase only. Never run this document's commands against production or assume migration 001 is the current full schema. Use a dedicated, isolated development/staging database and verify the current migration loader and scripts first.

`npm run db:migrate`

At the time of the original foundation stage, migration 001 created the initial relational schema and did not import the legacy JSON records. The current `npm run db:migrate` command invokes the current migration runner and may apply all pending migrations discovered by the release loader; do not assume it applies only migration 001. Inspect the current script and migration loader, and use an isolated staging database for rehearsal. Verify applied versions/checksums and the authorized readiness evidence before production actions.

## Historical next-stage plan — reference only

The following was the staged plan at the time this document was written, not an instruction for work that remains to be done:

1. Build deterministic JSON → PostgreSQL transformation.
2. Add row-count, relationship, financial-total, audit-chain, and document-storage reconciliation.
3. Add isolated PostgreSQL integration tests.
4. Rehearse migration and restore on staging.
5. Introduce repository adapters behind existing route handlers.
6. Complete cutover only after explicit validation and operational sign-off.

Before any current action, follow the production runbooks listed above and inspect the current source. Do not infer deployment status from this historical plan.
