# Production Readiness and Cutover Checklist

The authenticated AMS readiness gate is `GET /api/system/production-readiness`. It evaluates the runtime, encryption, PostgreSQL connectivity, all shipped migration checksums, relational-data reconciliation, MFA coverage, backup/restore readiness, document storage integrity, and notification configuration.

Use this checklist for an initial PostgreSQL cutover and for release readiness checks after the system is in PostgreSQL mode.

## Required configuration and evidence

- `NODE_ENV=production`.
- `APP_URL` uses HTTPS.
- `KAPITECH_DATA_SOURCE=postgres` and `KAPITECH_POSTGRES_URL` points to the intended production database.
- `KAPITECH_DATA_ENCRYPTION_KEY` is configured as a valid 32-byte key.
- `KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT` and `KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256` match the completed, reviewed reconciliation evidence.
- The latest `migration_runs` record has status `succeeded`, all reconciliation checks are true, its source hash matches the signed-off hash, and the reconciliation completed before sign-off.
- Every migration discovered by the current release's runtime loader exists in `schema_migrations` with the exact expected checksum. The repository migration chain currently includes migrations through 049. Presence of only hardening migrations 012 to 014 is not sufficient.
- Every active AMS user has TOTP MFA enabled.
- The PostgreSQL backup provider reports a recent backup inside the configured RPO, valid integrity metadata, and a successful restore rehearsal for the same latest backup artifact.
- Durable document storage is configured and healthy. All private documents have integrity metadata and their stored objects pass integrity verification.
- Enabled notification channels have their required runtime credentials and destinations configured.
- Telegram bot credentials are runtime-managed through environment variables and are not stored in PostgreSQL.

## Verify the gate

The endpoint requires authentication and either `canViewSecurityAuditLogs` or `canAccessServerAndApi`.

- HTTP 200 with `productionReady=true` means every runtime gate passed.
- HTTP 409 with `productionReady=false` means at least one gate is incomplete. Review the returned `gates` and `status` details.
- HTTP 401 for an unauthenticated request is expected and is not proof that production readiness passed or failed.
- HTTP 503 means the readiness evaluation itself failed and requires investigation.

CI passing and `/api/health/ready` reporting a connected database do not replace this operational gate.

Do not declare a release production-ready until an authorized operator observes HTTP 200 with `productionReady=true` and the latest deployment has passed live smoke tests.
