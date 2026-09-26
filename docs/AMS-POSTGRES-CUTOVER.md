# AMS PostgreSQL Cutover Architecture

PostgreSQL is available as an opt-in relational foundation. The JSON database remains the production source of truth until every cutover gate passes.

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
