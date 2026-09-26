# Kapitech Agency Management System (AMS)

Production-grade internal Agency Management System for Kapitech Agency.

## Runtime

- Node.js 22
- Express API + React/Vite frontend
- Hostinger deployment compatible
- HttpOnly session cookies
- SameSite=Strict + CSRF protection
- TOTP MFA with one-time recovery codes
- AES-256-GCM encrypted persistent data
- Rolling encrypted database backups
- Private server-side document vault

## Production environment

Core production configuration:
- `NODE_ENV=production`
- `KAPITECH_DATA_SOURCE=postgres`
- `KAPITECH_POSTGRES_URL`
- `KAPITECH_DATA_ENCRYPTION_KEY`
- `ADMIN_INITIAL_USERNAME`
- `ADMIN_INITIAL_PASSWORD`
- `ADMIN_INITIAL_EMAIL` are required only when the PostgreSQL database does not already contain a Master admin. Existing PostgreSQL installations keep their existing administrator.
Optional:
- `KAPITECH_DATA_DIR`
- `KAPITECH_DB_BACKUP_RETENTION` (3-30, default 14)
- `KAPITECH_DB_BACKUP_DIR`
- `GEMINI_API_KEY`
- `KAPITECH_TELEGRAM_BOT_TOKEN`
- `KAPITECH_TELEGRAM_CHAT_ID`
- PostgreSQL runtime: `KAPITECH_DATA_SOURCE=postgres`, `KAPITECH_POSTGRES_URL` and optional SSL/pool settings.
- PostgreSQL mode: `KAPITECH_POSTGRES_BACKUP_PROVIDER`, `KAPITECH_POSTGRES_BACKUP_LATEST_AT`, `KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT`, `KAPITECH_POSTGRES_BACKUP_RPO_MINUTES`, `KAPITECH_POSTGRES_BACKUP_RTO_MINUTES`, `KAPITECH_POSTGRES_BACKUP_RETENTION_DAYS`
- PostgreSQL production Document Vault: `KAPITECH_DOCUMENT_STORAGE_PROVIDER`, `KAPITECH_DOCUMENT_STORAGE_BUCKET`, `KAPITECH_DOCUMENT_STORAGE_ENDPOINT`, `KAPITECH_DOCUMENT_STORAGE_REGION`, `KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID`, `KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY` (optional `KAPITECH_DOCUMENT_STORAGE_SESSION_TOKEN`)
- PostgreSQL migration chain currently runs through migration 024. Telegram bot credentials remain runtime-managed via `KAPITECH_TELEGRAM_BOT_TOKEN` and are not persisted in PostgreSQL.
- S3-compatible provider stores only application-encrypted objects; the AMS never exposes the underlying object URL.

Generate a 32-byte encryption key with:

`openssl rand -hex 32`

Do not commit runtime data, credentials, encryption keys, or private document files.

## Verification

CI runs:
`npm ci`
`npm run lint`
`npm run build`

For production smoke testing, use:
`GET /api/health`
and
`GET /api/auth/me`

An unauthenticated `/api/auth/me` response of HTTP 401 is expected.

## Persistence and recovery

Rolling encrypted backups are created before live database replacement. Privileged IT/Master users can request a manual snapshot through the System Backup API.

Restore utility:

`node scripts/restore-ams-db.mjs /absolute/path/to/backup.bak --force`

The relational migration target is documented in `docs/relational-schema.sql`. Keep the current encrypted store until relational migration reconciliation and rollback tests are complete.
