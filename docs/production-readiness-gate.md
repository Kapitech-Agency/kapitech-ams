# Production Readiness Gate

`GET /api/system/production-readiness` is an authenticated operator endpoint. It requires `canViewSecurityAuditLogs` or `canAccessServerAndApi`.

In PostgreSQL mode, the runtime gate checks all of the following:

- Production runtime configuration, HTTPS `APP_URL`, PostgreSQL as the configured data source, and a valid data-encryption key.
- Successful PostgreSQL connectivity.
- Complete migration version coverage and checksum equality for every migration discovered by the current release's migration loader. The hardening migrations `012_document_vault_integrity`, `013_security_controls`, and `014_notification_secret_removal` are required checkpoints, but they do not replace verification of the rest of the chain. The current repository chain runs through migration 049.
- Reviewed relational reconciliation with a successful `migration_runs` record, all checks true, the same source hash in the database and environment sign-off, and completion before sign-off.
- TOTP MFA enabled for every active AMS user.
- Fresh PostgreSQL backup inside the configured RPO, integrity valid, and restore rehearsal verified against the same latest backup artifact.
- Durable Document Vault object storage configured and healthy, integrity metadata present for every private file, and object integrity verification successful.
- Credentials/destinations configured for notification channels that are enabled.

Response semantics:

- HTTP 200 and `productionReady=true`: all readiness gates passed.
- HTTP 409 and `productionReady=false`: one or more readiness gates are incomplete. Inspect the `gates` and `status` payload.
- HTTP 401: the caller is not authenticated or lacks a valid session. This response is expected when checking the endpoint anonymously and must not be interpreted as a readiness result.
- HTTP 503: the readiness evaluation could not complete; investigate the server-side failure.

A passing CI build or a healthy `/api/health/ready` response is not sufficient by itself. Production infrastructure state must still be configured and verified through this gate before declaring release readiness.
