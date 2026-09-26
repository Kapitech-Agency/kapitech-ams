# AMS Relational Database Migration Plan

## Current state

The AMS still uses an encrypted JSON persistence layer. The current implementation has:

- AES-256-GCM encryption at rest.
- Atomic file replacement.
- A persistent-file fingerprint guard that rejects stale writes from another application process.
- Rolling encrypted backups and schema-level backup integrity checks.

The fingerprint guard is a safety net, not a replacement for database transactions. The target architecture is PostgreSQL.

## Migration principles

1. **Parallel, non-destructive migration.** Keep the JSON database read-only as the rollback source until PostgreSQL verification is complete.
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

## Cutover gates

A production cutover should not proceed until all are true:

- Row counts reconcile for every migrated collection.
- Foreign-key checks pass.
- Monetary totals reconcile for invoices, payments, expenses, proposals and pipeline values.
- Audit-log chain verifies.
- User/session migration is verified without exposing plaintext credentials or session tokens.
- Private-document storage keys remain resolvable and encrypted files decrypt successfully.
- Backup and restore are tested from the PostgreSQL backup.
- Application integration tests pass against PostgreSQL.
- A rollback test has been rehearsed.

## Recommended implementation order

1. Add PostgreSQL driver and migration tooling.
2. Define versioned SQL schema and indexes.
3. Add a repository/data-access layer behind the existing route handlers.
4. Build a one-way JSON -> PostgreSQL migration command with dry-run and reconciliation output.
5. Add integration tests against an isolated PostgreSQL database.
6. Run staging migration and restore rehearsal.
7. Switch production reads/writes to PostgreSQL.
8. Keep encrypted JSON snapshot as rollback evidence for the agreed retention period.
9. Remove JSON persistence only after operational sign-off.

**Important:** this plan intentionally does not add a PostgreSQL dependency or alter production persistence yet. The next implementation step should be the schema/repository layer, followed by a reversible migration command.
