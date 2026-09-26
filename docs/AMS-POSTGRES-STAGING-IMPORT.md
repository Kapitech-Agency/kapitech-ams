# AMS JSON → PostgreSQL staging importer

The importer is the next controlled step after reconciliation. It reads the encrypted JSON store without modifying it and can write only to an explicitly designated staging PostgreSQL environment.

## Modes

Validation only:

```bash
KAPITECH_MIGRATION_MODE=validate npm run db:import
```

Staging import:

```bash
KAPITECH_MIGRATION_MODE=import \
KAPITECH_MIGRATION_ENV=staging \
KAPITECH_MIGRATION_ALLOW_WRITE=true \
npm run db:import
```

The command requires:

- `KAPITECH_DATA_ENCRYPTION_KEY`
- `KAPITECH_POSTGRES_URL`
- PostgreSQL migrations applied first with `npm run db:migrate`

Import writes are refused when:

- `KAPITECH_MIGRATION_ENV` is not `staging`
- `KAPITECH_MIGRATION_ALLOW_WRITE` is not `true`
- `NODE_ENV=production`

## Safety model

- The encrypted JSON file is read-only.
- Source IDs are preserved.
- Source duplicate IDs and broken foreign keys fail the run before writes.
- The import uses one PostgreSQL transaction. A failure rolls back the import transaction.
- Core rows use deterministic stable-ID upserts.
- Target-only rows are never deleted.
- Secrets are never printed in migration reports.
- Migration metadata is recorded in `migration_runs`.
- Document contents are not copied by this phase; only document metadata/access rows are migrated.

## Current scope

Imported core domains:

- users and sessions
- leads
- CRM deals
- clients
- projects
- proposals and proposal items
- tasks
- time logs
- invoices, invoice items and invoice payments
- expenses
- approvals
- vendors
- document metadata and access
- notifications
- audit logs

Still requires a separate reconciliation/import stage:

- CMS services/projects/testimonials/settings
- notification settings/secrets
- physical private document storage verification
- audit-chain verification against the source before cutover
- PostgreSQL financial aggregate parity
- application repository adapter/cutover
- restore rehearsal and production cutover

Do not point the importer at production PostgreSQL. Production JSON remains the source of truth until the full validation and cutover gates are completed.
