# AMS PostgreSQL Cutover and Rollback Constraints

> **Runtime-status clarification:** This document contains foundation/migration guidance and may include statements from an earlier rollout stage. server/data-source.ts supports json/postgres and defaults to json if KAPITECH_DATA_SOURCE is unset; README specifies postgres as the required production configuration. This document alone does not prove the deployed data source. Before migration, rollback or production claims, verify authorized runtime configuration and GET /api/system/production-readiness. Do not switch sources or migrate production data based on this document alone.

This is a safety reference for understanding the earlier JSON-to-PostgreSQL cutover process and current rollback constraints. It is not evidence of the live Hostinger configuration and is not an executable production rollback runbook. Use `docs/PRODUCTION-CUTOVER.md`, `docs/production-cutover-checklist.md`, `docs/production-readiness-gate.md`, and `docs/postgres-backup-dr-runbook.md` for the current PostgreSQL production contract; verify runtime readiness before making production claims.

> **Implementation audit note (16 October 2026):** The current runtime guard in `server.ts` rejects production configuration unless `KAPITECH_DATA_SOURCE=postgres`; when production mode is `json`, it blocks API work with HTTP 503. Therefore the JSON-switch rollback steps below are not executable under the current production guard. Do not bypass this guard or run production in a non-production mode. Treat rollback-to-JSON as blocked until a separately authorized implementation reconciles runtime behavior, financial idempotency parity, deployment procedures, backups and reconciliation evidence. The current Hostinger environment configuration was not verified by this documentation change.

## Source selection

Do not use this historical guide to select or switch the live production data source. The production contract documented in `README.md` and `docs/PRODUCTION-CUTOVER.md` requires `KAPITECH_DATA_SOURCE=postgres`. The application source default, staging setup, or this guide alone does not prove the deployed setting. Confirm the authorized runtime configuration and authenticated `GET /api/system/production-readiness` result before taking action.

Invalid values fail closed.

## Required cutover gates

All must be true:

1. JSON → PostgreSQL migration completes successfully.
2. Count reconciliation passes.
3. Financial reconciliation passes.
4. Audit-chain integrity passes.
5. Private-document integrity passes.
6. CMS and notification parity passes.
7. Encrypted-backup restore rehearsal passes.
8. Application integration/E2E validation passes against PostgreSQL.
9. Rollback procedure is rehearsed.

The application must not silently fall back from PostgreSQL to JSON. A PostgreSQL failure after cutover must be treated as a database availability incident.

## Rollback constraint

The current production source guard blocks API work when production is configured to use JSON. Therefore, switching production back to JSON is **not an executable rollback under the current guard**. Do not bypass the guard, change production into a non-production mode, or follow the historical source-switch steps.

Until a separately authorized rollback design is implemented and rehearsed, treat rollback-to-JSON as blocked. A future recovery procedure must preserve incident evidence, define a supported PostgreSQL recovery/restore path, reconcile financial and document state, confirm application compatibility, specify the recovery point, and pass an isolated rehearsal. Use `docs/postgres-backup-dr-runbook.md` for the current PostgreSQL backup/recovery contract and involve the authorized operations owner.
