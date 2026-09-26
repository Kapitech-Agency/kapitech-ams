# JSON → PostgreSQL Reconciliation

This stage is deliberately read-only against the existing JSON database and does not perform a production cutover.

## Commands

- `npm run db:migrate` creates the relational schema in the configured PostgreSQL database.
- `npm run db:reconcile` compares the encrypted JSON source with the PostgreSQL target.

## Reconciliation checks

The current runner records:

- encrypted JSON source SHA-256
- record counts for core AMS domains
- duplicate IDs
- broken internal references
- proposal totals
- invoice totals
- invoice payments/balances
- expenses
- CRM pipeline value
- PostgreSQL target counts
- count parity
- a durable `migration_runs` ledger in PostgreSQL

A reconciliation failure exits non-zero and records the report.

## Safety

The reconciliation command does not insert, update, or delete business records in PostgreSQL. It only reads the JSON source and target and writes a migration-run report.

The production JSON database remains the source of truth until:

1. A deterministic importer is implemented.
2. A staging copy of production data is imported.
3. All count and relationship checks pass.
4. Financial totals reconcile exactly.
5. Document storage references reconcile.
6. Audit-chain verification passes.
7. Backup and restore are rehearsed.
8. Application repository adapters are integrated and tested.
9. A rollback procedure is verified.

## Important

Do not run reconciliation against a PostgreSQL database that contains unrelated data and interpret count parity as a migration success. Use a dedicated AMS staging database for rehearsal.
