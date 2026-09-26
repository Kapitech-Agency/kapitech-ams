# AMS persistence and disaster recovery

## Current production mode

The live AMS remains deployable on Hostinger without an external database service. Persistent business data is stored in the server-side encrypted database file under the configured data directory.

Production requires:
- `KAPITECH_DATA_ENCRYPTION_KEY`: 32-byte key represented as 64 hex characters or valid base64.
- `KAPITECH_DB_BACKUP_RETENTION`: optional rolling retention from 3 to 30 snapshots. Default 14.

The application creates encrypted rolling snapshots before live database replacement. Manual snapshots are available to privileged IT/Master accounts through the System Backup API.

## Private document vault

Uploaded files are stored under the server data directory in `private-documents`, outside the public static web root. Metadata is stored in the AMS database. Downloads require a valid session, module permission, and object-level document access. Private files are encrypted at rest when `KAPITECH_DATA_ENCRYPTION_KEY` is configured.

The upload limit is 25 MB per document. Executable MIME types are intentionally not accepted.

## Restore procedure

1. Stop application writes through the deployment/maintenance workflow.
2. Copy the current database file as a safety backup.
3. Select a `kapitech_db_*.bak` snapshot from the backup directory.
4. Verify the snapshot without changing production:
   `node scripts/restore-ams-db.mjs /absolute/path/to/backup.bak --verify-only`
5. If verification passes and the maintenance window is active, restore:
   `node scripts/restore-ams-db.mjs /absolute/path/to/backup.bak --force`
6. Ensure the same `KAPITECH_DATA_ENCRYPTION_KEY` is present.
6. Start/redeploy AMS and run the smoke test.
7. Verify login, dashboard, finance, CRM, documents, and audit integrity.

## Relational migration target

The repository includes `docs/relational-schema.sql` as the normalized target schema. The current route layer remains deployable on Hostinger while the relational database service is provisioned. JSON remains the live compatibility store until cutover reconciliation is completed. The migration target covers identity, sessions, CRM, projects, proposals, invoices/payments, expenses, approvals, documents, notifications, and audit logs.

A future cutover should be performed as a controlled migration with:
- schema creation,
- full data export from the current encrypted store,
- row-count and financial reconciliation,
- dual-read verification,
- cutover,
- rollback snapshot.

The current JSON store must not be deleted until the relational cutover has passed reconciliation and rollback validation.
