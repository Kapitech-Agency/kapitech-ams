# AMS PostgreSQL Cutover Architecture

> **Runtime-status clarification:** This document contains foundation/migration guidance and may include statements from an earlier rollout stage. server/data-source.ts supports json/postgres and defaults to json if KAPITECH_DATA_SOURCE is unset; README specifies postgres as the required production configuration. This document alone does not prove the deployed data source. Before migration, rollback or production claims, verify authorized runtime configuration and GET /api/system/production-readiness. Do not switch sources or migrate production data based on this document alone.

This guide describes cutover safety gates and rollback mechanics. It does not prove whether a specific deployed environment has completed cutover; verify actual runtime mode and readiness evidence.

> **Implementation audit note (16 October 2026):** The current runtime guard in `server.ts` rejects production configuration unless `KAPITECH_DATA_SOURCE=postgres`; when production mode is `json`, it blocks the API with HTTP 503. Therefore the JSON-switch rollback steps below are not executable under the current production guard, even though they describe a desired rollback sequence. Do not attempt to bypass this guard or run production in a non-production mode. Treat rollback-to-JSON as blocked until a separately authorized implementation reconciles the runtime guard, financial idempotency parity, deployment procedure, and reconciliation evidence. The actual Hostinger runtime configuration was not available to this audit.

## Source selection

Set:

```bash
KAPITECH_DATA_SOURCE=json
```

for the current JSON source, or:

```bash
KAPITECH_DATA_SOURCE=postgres
```

only after formal cutover approval.

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

## Rollback

Rollback is an explicit operational action, not an automatic fallback:

1. Stop writes.
2. Preserve PostgreSQL state for incident analysis.
3. Identify the last verified JSON snapshot.
4. Restore/rehearse that snapshot in isolation.
5. Reconcile restored JSON against the last accepted state.
6. Switch the explicit source mode back to JSON.
7. Restart application processes under the approved release.
8. Validate authentication, permissions, financials, documents, CMS and notifications.
9. Record the incident and reconciliation result.

Until this runbook has been rehearsed with staging data, production cutover remains blocked.
