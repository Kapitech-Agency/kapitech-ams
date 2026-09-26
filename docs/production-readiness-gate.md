# Production Readiness Gate

The AMS exposes `GET /api/system/production-readiness` for an authenticated security/IT operator.

In PostgreSQL mode, production readiness requires:

- PostgreSQL connection succeeds.
- Hardening migrations `012_document_vault_integrity`, `013_security_controls`, and `014_notification_secret_removal` are recorded.
- Telegram bot credentials are supplied only through the runtime environment and are not persisted in PostgreSQL.
- Every active AMS user has TOTP MFA enabled.
- PostgreSQL backup/DR reports a fresh backup inside the configured RPO and a verified restore rehearsal.
- Private Document Vault uses configured durable object storage, is healthy, and every private file has integrity metadata.

The endpoint returns HTTP 409 while any gate is incomplete and HTTP 200 only when all gates pass.

A passing CI build is not sufficient by itself. Production infrastructure state must still be configured and verified.
