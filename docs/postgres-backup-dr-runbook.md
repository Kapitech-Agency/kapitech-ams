# PostgreSQL Backup & Disaster Recovery Runbook

## Production contract

When `KAPITECH_DATA_SOURCE=postgres`, the AMS does **not** create or download local JSON database backups. PostgreSQL backups must be handled by a durable backup provider or an operations scheduler outside the application runtime.

This avoids assuming that `pg_dump`, local disk persistence, or backup storage is available in serverless/container deployments.

## Required environment contract

Configure:

- `KAPITECH_POSTGRES_BACKUP_PROVIDER` — provider/service name.
- `KAPITECH_POSTGRES_BACKUP_LATEST_AT` — ISO-8601 timestamp of the latest successful backup.
- `KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT` — ISO-8601 timestamp of the latest successful restore rehearsal.
- `KAPITECH_POSTGRES_BACKUP_RPO_MINUTES` — maximum accepted backup age; default 15.
- `KAPITECH_POSTGRES_BACKUP_RTO_MINUTES` — recovery objective; default 60.
- `KAPITECH_POSTGRES_BACKUP_RETENTION_DAYS` — retention target; default 35.

The application treats PostgreSQL backup health as production-ready only when a provider is configured, the latest backup is inside the RPO, and a restore rehearsal has been verified.

## Recommended operational policy

- Continuous/WAL-capable recovery where supported by the managed PostgreSQL provider.
- Daily full recovery point plus provider-native point-in-time recovery.
- Encrypted backups using provider-managed encryption and KMS/key-management controls.
- Retain at least 35 days online unless the agency's contractual/compliance requirements require longer.
- Perform a restore rehearsal at least monthly and after major schema migrations.
- Keep restore verification separate from backup creation; a successful backup alone does not prove recoverability.
- Store backup copies in a separate failure domain from the primary database.
- Restrict backup/restore access to infrastructure administrators and audit all restore operations.

## RPO / RTO

The application defaults are **RPO 15 minutes** and **RTO 60 minutes**. These are operational targets, not proof that the infrastructure currently achieves them. The provider and restore rehearsal must demonstrate the target before production cutover.

## Cutover gate

Do not switch production to PostgreSQL solely because migrations and application tests pass. The cutover remains blocked until:

1. Data reconciliation is complete.
2. PostgreSQL backup provider is configured.
3. Latest backup is inside the RPO.
4. Restore rehearsal succeeds.
5. Restore timestamp is published through `KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT`.
6. The AMS `/system/security/status` endpoint reports the backup as configured, fresh, and restore-verified.
7. A disaster-recovery owner and escalation path are documented.

## Important

The AMS intentionally does not claim to have created a real PostgreSQL backup from the application process. The environment contract reports the state of the actual infrastructure backup system. This prevents a false-positive "backup healthy" status when the runtime has no durable backup capability.
