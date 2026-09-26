# AMS PostgreSQL Foundation

The PostgreSQL path is now implemented as a parallel, opt-in foundation. The existing encrypted JSON persistence remains the active production store.

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
- Business writes are not routed to PostgreSQL yet.
- Production cutover is intentionally deferred until JSON -> PostgreSQL transformation, reconciliation, staging rehearsal, restore testing, and application integration testing are complete.

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

## Running the foundation migration

Only run this against a dedicated staging/development PostgreSQL database first:

`npm run db:migrate`

Do not point it at the production JSON directory. This command does not import JSON records; it only creates the relational schema and records migration 001.

## Next stage

1. Build deterministic JSON -> PostgreSQL transformation.
2. Add row-count, relationship, financial-total, audit-chain, and document-storage reconciliation.
3. Add isolated PostgreSQL integration tests.
4. Rehearse migration and restore on staging.
5. Introduce repository adapters behind the existing route handlers.
6. Cut over reads/writes only after explicit validation and rollback sign-off.
