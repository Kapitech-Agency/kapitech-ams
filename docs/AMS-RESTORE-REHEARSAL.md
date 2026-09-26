# AMS Encrypted Backup Restore Rehearsal

The rehearsal restores an encrypted JSON backup into an isolated directory and validates the decrypted AMS schema.

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

## Production safety

This is a rehearsal tool, not a production restore endpoint. It never replaces the live database and does not modify the application data directory.

A real disaster recovery restore should first stop application writes, preserve the failed data directory, restore into a controlled location, validate application startup and reconciliation, and only then promote the restored data according to the incident runbook.
