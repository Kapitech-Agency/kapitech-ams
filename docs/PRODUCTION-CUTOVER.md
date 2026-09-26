# Kapitech AMS Production Cutover

This runbook is the operational handoff for the PostgreSQL production deployment.

## 1. Runtime

Production must run with:

- Node.js 22.x
- `NODE_ENV=production`
- `KAPITECH_DATA_SOURCE=postgres`
- `PORT=3000`
- `APP_URL=https://kapitech.id`

The repository uses:

```text
Build: npm run build
Start: npm start
```

The production build creates `dist/server.cjs` and packages the versioned PostgreSQL migrations under `dist/db/postgres`.

## 2. Required production configuration

Set these values in the hosting environment. Never commit their real values.

### Database and encryption

```text
KAPITECH_POSTGRES_URL=<production PostgreSQL URL>
KAPITECH_POSTGRES_SSL=require
KAPITECH_POSTGRES_SSL_REJECT_UNAUTHORIZED=true
KAPITECH_DATA_ENCRYPTION_KEY=<32-byte key>
```

The application refuses production startup when the datasource is not PostgreSQL, the database URL is missing, or the encryption key is invalid.

### Initial Master administrator

Only for a fresh PostgreSQL database:

```text
ADMIN_INITIAL_USERNAME=<initial username>
ADMIN_INITIAL_EMAIL=<valid email>
ADMIN_INITIAL_PASSWORD=<temporary strong password>
```

The startup bootstrap creates the first Master administrator only when the `users` table is empty. It does not overwrite an existing password.

After first login, enable TOTP MFA for every active administrator before treating the cutover as complete.

### Durable private document storage

A production PostgreSQL cutover requires durable object storage:

```text
KAPITECH_DOCUMENT_STORAGE_PROVIDER=s3-compatible
KAPITECH_DOCUMENT_STORAGE_BUCKET=<bucket>
KAPITECH_DOCUMENT_STORAGE_ENDPOINT=https://<endpoint>
KAPITECH_DOCUMENT_STORAGE_REGION=<region>
KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID=<access-key>
KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY=<secret-key>
KAPITECH_DOCUMENT_STORAGE_SESSION_TOKEN=<optional>
```

Local filesystem storage is not considered durable production object storage.

### Backup and restore evidence

Publish the exact artifact identity used by the backup and restore rehearsal:

```text
KAPITECH_POSTGRES_BACKUP_PROVIDER=<provider>
KAPITECH_POSTGRES_BACKUP_LATEST_AT=<ISO-8601>
KAPITECH_POSTGRES_BACKUP_LATEST_SHA256=<64-hex SHA-256>
KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT=<ISO-8601>
KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256=<64-hex SHA-256>
KAPITECH_POSTGRES_BACKUP_RPO_MINUTES=15
KAPITECH_POSTGRES_BACKUP_RTO_MINUTES=60
KAPITECH_POSTGRES_BACKUP_RETENTION_DAYS=35
```

The restore verification hash must match the latest backup hash.

### Reconciliation signoff

Before cutover, publish the verified reconciliation evidence:

```text
KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT=<ISO-8601>
KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256=<64-hex SHA-256>
```

The stored `migration_runs` record must be a successful `encrypted-json` reconciliation run with matching source hash, complete checks, and completion time not later than the signoff timestamp.

## 3. Migration and DR commands

Run from the repository root:

```bash
npm ci
npm run db:migrate
npm run db:restore-rehearsal /path/to/postgres-backup.dump
npm run db:reconcile
npm run validate:production-env
npm run build
npm start
```

The restore rehearsal target must be an isolated, empty PostgreSQL database. Never point it at production.

Run `npm run validate:production-env` after the production environment variables are configured and before the final build/start step. The preflight checks the required configuration shape, HTTPS requirements, encryption-key format, durable storage settings, backup/restore evidence format and hash binding, reconciliation evidence format, and optional notification completeness. It never prints secret values and does not replace the dynamic production-readiness endpoint.

## 4. Release gate

Do not declare the application production-ready until:

1. CI passes type-check, PostgreSQL migrations, security regression, PostgreSQL integration, dependency audit, production build, artifact verification, and HTTP smoke.
2. PostgreSQL backup and restore hashes are bound to the same backup artifact.
3. Reconciliation evidence is source-hash bound and signed off.
4. Durable document storage and object integrity verification are healthy.
5. All active users have MFA enabled.
6. The production readiness endpoint reports every gate as ready.

## 5. Hostinger handoff

The production source of truth is `main`. The former `production/hostinger` branch is kept only as a compatibility release ref and is currently identical to `main`. Do not develop or hotfix independently on `production/hostinger`.

For Hostinger Node.js Web Apps, configure:

- Repository: `Kapitech-Agency/Kapitech-Agency.github.io`
- Branch: `main`
- Node.js: 22.x
- Build command: `npm run build`
- Start command: `npm start`
- Output directory: `dist`
- Entry/runtime: `dist/server.cjs`
- Port: `3000` unless Hostinger injects another application port

The production build runner now limits Rayon worker creation to one thread by default, with an explicit `RAYON_NUM_THREADS` override available. This addresses the previously observed Hostinger `ThreadPoolBuildError: Resource temporarily unavailable` failure mode on constrained shared hosting.

Hostinger's current Node.js GitHub deployment flow follows the branch configured for the application. Configure Hostinger to track `main`, so every production deployment uses the same source of truth as GitHub. Do not point Hostinger at an older hardening branch or an arbitrary commit SHA.

