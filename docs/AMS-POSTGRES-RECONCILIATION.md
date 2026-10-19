# JSON → PostgreSQL Reconciliation — Historical Staging Procedure

This describes an early migration-stage reconciliation utility. Treat it as a historical/staging-only procedure, not as evidence of the current production data source or a production cutover step. The required production contract specifies PostgreSQL in `README.md` and `docs/PRODUCTION-CUTOVER.md`; use `docs/production-readiness-gate.md` and `docs/production-cutover-checklist.md` to assess readiness. Do not point this procedure at live production data or infer runtime mode from this file.

## Commands

- `npm run db:migrate` creates the relational schema in the configured PostgreSQL database.
- `npm run db:reconcile` compares the encrypted JSON source with the PostgreSQL target.

## Reconciliation checks

The runner described when this document was authored was designed to record:

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

The following gates described the early migration plan. They do not establish that JSON is the current production source. The production contract now documented in `README.md` and `docs/PRODUCTION-CUTOVER.md` requires PostgreSQL; verify the actual authorized runtime and readiness evidence separately. These checks remain useful for an isolated staging migration rehearsal:

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

Do not run reconciliation against live production or against a PostgreSQL database that contains unrelated data and interpret count parity as migration success. Use a dedicated, isolated AMS staging database. This utility is not a production rollback tool and does not, by itself, authorize a source switch.
