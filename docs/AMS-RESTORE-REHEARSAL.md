# Legacy Encrypted JSON Backup Restore Rehearsal — Isolated Only

This rehearsal validates a legacy encrypted JSON backup by restoring it to an isolated directory. Despite the utility filename `scripts/postgres-restore-rehearsal.ts`, this procedure does **not** restore a PostgreSQL database backup and is not a PostgreSQL production disaster-recovery procedure. For current PostgreSQL production recovery, use `docs/postgres-backup-dr-runbook.md` and the readiness/release runbooks.

## Preconditions

- Set `KAPITECH_DATA_ENCRYPTION_KEY`.
- Use a backup file from the AMS backup directory.
- Do not point the output directory at the live AMS data directory.

## Run

```bash
npx tsx scripts/postgres-restore-rehearsal.ts /path/to/kapitech_db_*.bak /tmp/kapitech-restore-rehearsal
```

The script:
1. Reads the backup read-only.
2. Decrypts AES-256-GCM when the `KAPI-ENC-V1:` envelope is present.
3. Parses the JSON.
4. Verifies required AMS collections exist and are arrays.
5. Writes only an isolated copy with restrictive permissions.
6. Prints counts and byte sizes without printing database contents or secrets.

## Safety boundary

This is an isolated legacy-JSON rehearsal tool, not a production restore endpoint. It never replaces the live database and does not modify the application data directory. Do not use it as a substitute for a PostgreSQL restore or to bypass the production data-source guard.

A real disaster recovery restore should first stop application writes, preserve the failed data directory, restore into a controlled location, validate application startup and reconciliation, and only then promote the restored data according to the incident runbook.
