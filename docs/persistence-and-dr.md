# AMS Persistence and Disaster Recovery

**Status:** Production DR overview. This document summarizes the current documented PostgreSQL production contract and links to the operational runbooks. It does not prove the live Hostinger configuration or a successful backup/restore.

## 1. Current documented production contract

The repository's production configuration requires:

- `NODE_ENV=production`
- `KAPITECH_DATA_SOURCE=postgres`
- `KAPITECH_POSTGRES_URL`
- `KAPITECH_DATA_ENCRYPTION_KEY`

The current runtime guard blocks production API work when the selected source is not PostgreSQL. Do not infer the active deployed configuration from the code default or this document. An authorized operator must verify the actual runtime and `GET /api/system/production-readiness` before making a production-readiness claim.

**Use the operational references:**

- `docs/PRODUCTION-CUTOVER.md` — documented production deployment contract and Hostinger handoff.
- `docs/production-cutover-checklist.md` — release evidence checklist.
- `docs/production-readiness-gate.md` — endpoint semantics and runtime gates.
- `docs/postgres-backup-dr-runbook.md` — PostgreSQL backup/restore contract and RPO/RTO targets.
- `docs/AMS-RESTORE-REHEARSAL.md` — isolated PostgreSQL backup restore rehearsal and migration-checksum verification; never a production target.
- `docs/private-document-vault.md` — private document storage integrity and recovery requirements.

A source-code change, healthy database connection, successful CI run, or backup timestamp alone does not prove production recovery readiness.

## 2. PostgreSQL database recovery

For PostgreSQL-mode production, follow `docs/postgres-backup-dr-runbook.md` and the authorized infrastructure provider's recovery procedure. Do not replace the PostgreSQL recovery process with a JSON file restore.

Before a recovery action, the incident/release owner must identify the approved recovery point and backup artifact, preserve relevant incident evidence, protect or stop writes using the approved maintenance procedure, restore to the intended isolated or approved target, verify schema/migration compatibility, validate data and financial reconciliation, and run authorized application smoke tests before resuming service. A production restore must follow the approved operations procedure; do not improvise a destructive command based only on a Markdown example.

Database recovery and document-object recovery are separate requirements. A successful PostgreSQL restore is not sufficient if required private document objects are absent or fail integrity checks. Consult `docs/private-document-vault.md`; downloads must remain behind the authenticated AMS endpoint and must never expose underlying object-storage URLs.

## 3. Legacy encrypted JSON backup utility — historical/staging use only

The repository also contains a legacy utility, `scripts/restore-ams-db.mjs`, for matching encrypted JSON database snapshots. These steps are **not a PostgreSQL production recovery procedure** and must not be used to bypass the production source guard.

For an isolated legacy/staging JSON archive only, after confirming the archive format, script compatibility, encryption key, and a non-production destination, the utility may support a verification run such as:

```bash
node scripts/restore-ams-db.mjs /absolute/path/to/backup.bak --verify-only
```

Do not run a destructive restore command against a live directory or current production environment by copying commands from this historical section. Any use of a legacy JSON restore must be explicitly approved, isolated, and reconciled; changing production back to JSON is not an available rollback under the current production guard unless a separately authorized change establishes and rehearses a supported procedure.

Older persistence/migration notes may describe a prior stage when JSON was the active store. Such notes are historical and do not establish the current runtime mode.

## 4. Private document vault

Private document metadata, access policy, and object recovery must be validated together. The current production contract requires durable document storage and integrity evidence before release readiness can pass. Refer to `docs/private-document-vault.md` for object integrity, encryption, provider requirements, and recovery rules.

- Keep private document objects outside the public static web root.
- Require authenticated, permission-checked downloads and object-level access checks.
- Keep encryption keys, provider secrets and signed credentials out of source control, logs and documentation.
- Verify the correspondence between restored database metadata and actual stored objects.
- Never treat a successful database-only restore as complete document recovery.

## 5. Smoke test and sign-off

After an approved restore or recovery, run the current production smoke-test and release gate. At minimum, verify authorized login/session behavior, primary module navigation, Clients, Projects, Finance records/reports, Documents access/integrity, Website CMS state and audit continuity as applicable to the incident. Do not use retired CRM navigation as a required primary-module check.

Production readiness requires an authorized operator to observe `GET /api/system/production-readiness` return HTTP 200 with `productionReady=true`, followed by required live smoke tests. HTTP 401, HTTP 409, HTTP 503, successful CI, or database connectivity alone are not readiness evidence.
