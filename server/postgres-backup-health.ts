import { getDataSourceMode } from './data-source.ts';

export type PostgresBackupHealth = {
  configured: boolean;
  provider: string;
  latestBackupAt: string | null;
  latestBackupSha256: string | null;
  latestBackupAgeMinutes: number | null;
  backupFresh: boolean;
  integrity: {
    valid: boolean;
    checkedAt: string;
    latestBackupAt: string | null;
    restoreVerifiedAt: string | null;
    restoreVerified: boolean;
    restoreBackupSha256: string | null;
    restoreMatchesLatestBackup: boolean;
    reason?: string;
  };
  rpoMinutes: number;
  rtoMinutes: number;
  retentionDays: number;
};

function readIsoEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function readPositiveInt(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function getPostgresBackupHealth(): PostgresBackupHealth {
  if (getDataSourceMode() !== 'postgres') {
    return {
      configured: false,
      provider: 'json-local',
      latestBackupAt: null,
      latestBackupSha256: null,
      latestBackupAgeMinutes: null,
      backupFresh: false,
      integrity: {
        valid: false,
        checkedAt: new Date().toISOString(),
        latestBackupAt: null,
        restoreVerifiedAt: null,
        restoreVerified: false,
        restoreBackupSha256: null,
        restoreMatchesLatestBackup: false,
        reason: 'PostgreSQL backup health is only applicable when KAPITECH_DATA_SOURCE=postgres.'
      },
      rpoMinutes: readPositiveInt('KAPITECH_POSTGRES_BACKUP_RPO_MINUTES', 15),
      rtoMinutes: readPositiveInt('KAPITECH_POSTGRES_BACKUP_RTO_MINUTES', 60),
      retentionDays: readPositiveInt('KAPITECH_POSTGRES_BACKUP_RETENTION_DAYS', 35)
    };
  }

  const provider = process.env.KAPITECH_POSTGRES_BACKUP_PROVIDER?.trim() || '';
  const latestBackupAt = readIsoEnv('KAPITECH_POSTGRES_BACKUP_LATEST_AT');
  const latestBackupSha256Raw = process.env.KAPITECH_POSTGRES_BACKUP_LATEST_SHA256?.trim().toLowerCase() || '';
  const latestBackupSha256 = /^[0-9a-f]{64}$/.test(latestBackupSha256Raw) ? latestBackupSha256Raw : null;
  const restoreVerifiedAt = readIsoEnv('KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT');
  const restoreBackupSha256Raw = process.env.KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256?.trim().toLowerCase() || '';
  const restoreBackupSha256 = /^[0-9a-f]{64}$/.test(restoreBackupSha256Raw) ? restoreBackupSha256Raw : null;
  const now = Date.now();
  const latestBackupAtMs = latestBackupAt ? new Date(latestBackupAt).getTime() : null;
  const ageMs = latestBackupAtMs !== null && Number.isFinite(latestBackupAtMs)
    ? now - latestBackupAtMs
    : null;
  const rpoMinutes = readPositiveInt('KAPITECH_POSTGRES_BACKUP_RPO_MINUTES', 15);
  const rtoMinutes = readPositiveInt('KAPITECH_POSTGRES_BACKUP_RTO_MINUTES', 60);
  const retentionDays = readPositiveInt('KAPITECH_POSTGRES_BACKUP_RETENTION_DAYS', 35);
  const backupFresh = ageMs !== null && ageMs >= 0 && ageMs <= rpoMinutes * 60 * 1000;
  const restoreVerifiedAtMs = restoreVerifiedAt ? new Date(restoreVerifiedAt).getTime() : null;
  const restoreMaxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const restoreVerificationFresh = restoreVerifiedAtMs !== null
    && Number.isFinite(restoreVerifiedAtMs)
    && restoreVerifiedAtMs <= now
    && now - restoreVerifiedAtMs <= restoreMaxAgeMs;
  const restoreVerified = restoreVerificationFresh;
  const restoreMatchesLatestBackup = Boolean(
    latestBackupSha256 &&
    restoreBackupSha256 &&
    latestBackupSha256 === restoreBackupSha256
  );

  let reason: string | undefined;
  if (!provider) reason = 'No PostgreSQL backup provider is configured.';
  else if (!latestBackupAt) reason = 'Backup provider is configured but no successful backup timestamp is published.';
  else if (!latestBackupSha256) reason = 'The latest backup hash is missing or invalid.';
  else if (!backupFresh) reason = 'The latest reported PostgreSQL backup is outside the configured RPO.';
  else if (!restoreVerifiedAt) reason = 'A successful restore rehearsal has not been reported.';
  else if (!restoreVerificationFresh) reason = 'The latest restore rehearsal is older than the configured retention window.';
  else if (!restoreBackupSha256) reason = 'The restore rehearsal is not bound to a backup SHA-256.';
  else if (!restoreMatchesLatestBackup) reason = 'The restore rehearsal was verified against a different backup than the latest reported backup.';

  return {
    configured: Boolean(provider && latestBackupAt && latestBackupSha256 && backupFresh && restoreVerified && restoreMatchesLatestBackup),
    provider: provider || 'unconfigured',
    latestBackupAt,
    latestBackupSha256,
    latestBackupAgeMinutes: ageMs === null ? null : Math.round(ageMs / 60000),
    backupFresh,
    integrity: {
      valid: Boolean(
        provider &&
        latestBackupAt &&
        latestBackupSha256 &&
        backupFresh &&
        restoreVerificationFresh &&
        restoreBackupSha256 &&
        restoreMatchesLatestBackup
      ),
      checkedAt: new Date().toISOString(),
      latestBackupAt,
      restoreVerifiedAt,
      restoreVerified,
      restoreBackupSha256,
      restoreMatchesLatestBackup,
      ...(reason ? { reason } : {})
    },
    rpoMinutes,
    rtoMinutes,
    retentionDays
  };
}
