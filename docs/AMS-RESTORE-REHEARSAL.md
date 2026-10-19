# PostgreSQL Backup Restore Rehearsal — Isolated Staging Only

**Purpose:** Verify a PostgreSQL backup can be restored into a dedicated, empty rehearsal database and that the restored database includes the required AMS tables and exactly matches the current repository's migration versions/checksums.

**Boundary:** This is a staging rehearsal utility, not a production restore command and not proof that the production backup provider or live environment is healthy. Do not point it at production.

## Preconditions

- Use an authorized, isolated PostgreSQL rehearsal database that contains **no tables**.
- Set `KAPITECH_POSTGRES_REHEARSAL_URL` to the rehearsal database connection URL.
- The script compares the rehearsal target URL to `KAPITECH_POSTGRES_URL` when the production URL is present and rejects a matching target; that guard is an additional safeguard, not a reason to use a shared or production environment.
- Supply a PostgreSQL custom-format dump (starts with `PGDMP`) or plain SQL dump that is compatible with the current restore tooling.
- Ensure the required PostgreSQL client utility (`pg_restore` for custom dumps or `psql` for plain SQL) is installed and available in the execution environment.
- Verify the backup artifact is from the intended authorized source; do not place real secrets or connection strings in documentation or logs.

## Run

Run from the repository root after the rehearsal environment variable is configured:

```bash
npm run db:restore-rehearsal /path/to/postgres-backup.dump
```

The script refuses to continue if the rehearsal URL is missing, the target contains existing tables, or it matches the configured production database URL. It restores the dump within a transaction where supported by the invoked PostgreSQL tool.

## What is verified

After restore, the script checks that:
- Required tables include `schema_migrations`, `users`, `migration_runs`, `notification_settings`, and `documents`.
- The restored migration history has exactly the migration versions loaded by the current release.
- Every restored migration checksum matches the expected checksum loaded from the current repository.
- A compact result reports the backup SHA-256, byte size, format, sanitized target label, migration count, checksum-verification result, user count, and required-table names without logging the database payload or connection password.

A passing rehearsal does not by itself prove business-data reconciliation, financial correctness, document-object recovery, production configuration, backup-provider readiness, or successful live smoke tests. Follow the current operational references in `docs/README.md`, `docs/PRODUCTION-CUTOVER.md`, `docs/production-cutover-checklist.md`, `docs/production-readiness-gate.md`, `docs/postgres-backup-dr-runbook.md`, and `docs/private-document-vault.md`.

## Safety boundary

- Never run this rehearsal against the live PostgreSQL production database.
- Never weaken the production source guard or change production into JSON/development mode to simulate recovery.
- Keep the production backup artifact untouched; restore only to the isolated rehearsal target.
- Database restore and private document-object restore are separate concerns.
- If migration checksums differ, treat the rehearsal as failed and investigate the artifact/release mismatch rather than suppressing the check.
