# AMS JSON → PostgreSQL Staging Importer — Staging Only

This importer is strictly for an explicitly designated staging PostgreSQL environment. It reads the encrypted JSON source without modifying it; it is not a production importer, production cutover procedure, or evidence of the deployed production data source. The historical sequence described here may have advanced. For the production contract, use `README.md`, `docs/PRODUCTION-CUTOVER.md`, `docs/production-cutover-checklist.md`, and `docs/production-readiness-gate.md`.

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

Never point this importer at production PostgreSQL or execute it against live production records. This importer does not switch application repositories, perform a full business cutover, or copy and verify physical private-document objects. Do not infer current production mode from this staging guide; verify authorized runtime configuration and `GET /api/system/production-readiness`.
