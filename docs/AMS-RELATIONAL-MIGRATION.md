# AMS Relational Database Migration Plan — Historical Reference

> **Runtime-status clarification:** This document contains foundation/migration guidance and may include statements from an earlier rollout stage. server/data-source.ts supports json/postgres and defaults to json if KAPITECH_DATA_SOURCE is unset; README specifies postgres as the required production configuration. This document alone does not prove the deployed data source. Before migration, rollback or production claims, verify authorized runtime configuration and GET /api/system/production-readiness. Do not switch sources or migrate production data based on this document alone.

## Historical status and verification requirement

This document records an earlier logical migration plan and is not the current production execution runbook. The following notes describe the encrypted JSON persistence implementation and intended migration principles at the time it was authored. Do not treat statements about the live store, pending drivers, schemas, repositories or cutover stages as current facts. The current required production contract is in `README.md` and `docs/PRODUCTION-CUTOVER.md`; use `docs/production-cutover-checklist.md`, `docs/production-readiness-gate.md`, and `docs/postgres-backup-dr-runbook.md` for operational verification. Confirm current `main`, actual migrations and authorized runtime readiness before acting.

The JSON persistence implementation has included:

- AES-256-GCM encryption at rest.
- Atomic file replacement.
- A persistent-file fingerprint guard that rejects stale writes from another application process.
- Rolling encrypted backups and schema-level backup integrity checks.

The fingerprint guard is a safety net, not a replacement for database transactions. The configured target and active production source must be verified for the current release before executing any migration.

## Migration principles

1. **Historical migration principle:** the original plan kept the JSON database read-only as a possible rollback source during migration. Do not assume that switching production back to JSON is executable; the current production source guard may block it. Follow the current, validated PostgreSQL recovery runbook instead.
2. **No direct production cutover without a rehearsal.** Run the migration against a production-sized staging copy first.
3. **Deterministic IDs.** Preserve existing AMS IDs so relationships remain traceable.
4. **Explicit foreign keys.** Do not infer relationships from display names after migration.
5. **Transaction boundaries.** Each business operation that changes related records must be committed atomically.
6. **Audit preservation.** Preserve the audit-log chain and verify it after import.
7. **Encrypted backups before and after cutover.** Keep a pre-cutover encrypted JSON snapshot and a PostgreSQL backup.
8. **Rollback window.** Keep the old JSON snapshot untouched until post-cutover validation is signed off.

## Initial PostgreSQL domain model

Core tables:

- users
- sessions
- leads
- crm_deals
- proposals
- proposal_items
- clients
- projects
- tasks
- time_logs
- invoices
- invoice_items
- invoice_payments
- expenses
- approvals
- vendors
- documents
- document_access
- notifications
- cms_services
- cms_projects
- cms_testimonials
- cms_settings
- audit_logs
- notification_settings

High-value relationships:

- crm_deals -> clients
- proposals -> crm_deals / projects
- proposal_items -> proposals
- projects -> clients
- tasks -> projects
- time_logs -> projects / tasks / users
- invoices -> clients / projects
- invoice_items -> invoices
- invoice_payments -> invoices
- approvals -> users
- documents -> users and related business records
- document_access -> documents / users
- audit_logs -> users where an actor account exists

## Historical cutover gates — reference only

The following conditions were part of the earlier proposed migration plan. They are not a live status report or a substitute for the current production-readiness endpoint:

- Row counts reconcile for every migrated collection.
- Foreign-key checks pass.
- Monetary totals reconcile for invoices, payments, expenses, proposals and pipeline values.
- Audit-log chain verifies.
- User/session migration is verified without exposing plaintext credentials or session tokens.
- Private-document storage keys remain resolvable and encrypted files decrypt successfully.
- Backup and restore are tested from the PostgreSQL backup.
- Application integration tests pass against PostgreSQL.
- A rollback test has been rehearsed.

## Historical recommended implementation order — not an active task list

1. Add PostgreSQL driver and migration tooling.
2. Define versioned SQL schema and indexes.
3. Add a repository/data-access layer behind the existing route handlers.
4. Build a one-way JSON -> PostgreSQL migration command with dry-run and reconciliation output.
5. Add integration tests against an isolated PostgreSQL database.
6. Run staging migration and restore rehearsal.
7. Switch production reads/writes to PostgreSQL.
8. Keep encrypted JSON snapshot as rollback evidence for the agreed retention period.
9. Remove JSON persistence only after operational sign-off.

**Historical note:** the plan originally deferred adding a PostgreSQL dependency and identified schema/repository work as the next step. That statement does not describe the current repository. Inspect current `package.json`, `db/postgres/`, migration loader, repositories, tests and the production-readiness gate. Do not start from this old sequence as though those steps were still undone.
