import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getPostgresPool } from './postgres.ts';

const LOCK_KEY = 'kapitech:ams:postgres:migrations';

// Migration 046 was published in several revisions before it reached production.
// Only these exact, previously committed checksums may be treated as legacy applied versions.
// Any unknown checksum mismatch still fails closed.
const LEGACY_MIGRATION_CHECKSUMS: Record<string, readonly string[]> = {
  '046_seed_seo_educational_insights': [
    '50608edcb6e6bf3f93e713f79234ef7627877bfc8d53c47a9c4195c473a1fa2f',
    'a355292211030f74ed90190c99b41e2d34dd08c9f7f85a6ce80ceea0893460e8',
    '7edf0a3f0c23d72d8ae44ba23240ca39a9e1c6c73f734892f016653218a8009e'
  ]
};

export function isAcceptedLegacyMigrationChecksum(version: string, appliedChecksum: string): boolean {
  return LEGACY_MIGRATION_CHECKSUMS[version]?.includes(appliedChecksum) ?? false;
}

function checksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function migrationVersion(fileName: string): string {
  return fileName.replace(/\.sql$/, '');
}

export function normalizeMigrationSql(sql: string): string {
  const withoutLeadingWrapper = sql.replace(
    /^\s*(?:(?:--[^\r\n]*(?:\r?\n|$)\s*)|(?:\/\*[\s\S]*?\*\/\s*))*BEGIN;\s*/i,
    ''
  );
  return withoutLeadingWrapper.replace(/\s*COMMIT;\s*$/i, '');
}

import fsSync from 'node:fs';

function defaultMigrationsDir(): string {
  const cwdCandidate = path.resolve(process.cwd(), 'db/postgres');
  const entrypoint = process.argv[1];
  const entrypointDir = entrypoint ? path.dirname(entrypoint) : null;
  const candidates = [
    entrypointDir ? path.resolve(entrypointDir, 'db/postgres') : null,
    entrypointDir ? path.resolve(entrypointDir, '../db/postgres') : null,
    cwdCandidate
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      if (fsSync.existsSync(candidate)) return candidate;
    } catch {}
  }

  return cwdCandidate;
}

export async function loadPostgresMigrations(migrationsDir = defaultMigrationsDir()): Promise<Array<{ version: string; sql: string; checksum: string }>> {
  const files = (await fs.readdir(migrationsDir))
    .filter(file => /^\d+_.+\.sql$/.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  if (!files.length) throw new Error('No PostgreSQL migration files were found.');
  return Promise.all(files.map(async file => {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    return { version: migrationVersion(file), sql, checksum: checksum(sql) };
  }));
}

export async function runPostgresMigrations(): Promise<string[]> {
  const migrations = await loadPostgresMigrations();
  const pool = getPostgresPool();
  const client = await pool.connect();
  const appliedVersions: string[] = [];
  try {
    await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [LOCK_KEY]);
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), checksum TEXT NOT NULL)'
    );
    const applied = await client.query<{ version: string; checksum: string }>('SELECT version, checksum FROM schema_migrations');
    const appliedByVersion = new Map(applied.rows.map(row => [String(row.version), String(row.checksum || '')]));

    for (const migration of migrations) {
      const existingChecksum = appliedByVersion.get(migration.version);
      if (existingChecksum) {
        if (existingChecksum !== migration.checksum) {
          if (!isAcceptedLegacyMigrationChecksum(migration.version, existingChecksum)) {
            throw new Error('Migration ' + migration.version + ' checksum mismatch. Refusing to start against a modified migration.');
          }
          console.warn(
            '[PostgreSQL] Migration ' + migration.version
            + ' matches a known historical checksum. Keeping it marked as applied; newer seed content is handled by a follow-up migration.'
          );
        }
        appliedVersions.push(migration.version);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(normalizeMigrationSql(migration.sql));
        await client.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)', [migration.version, migration.checksum]);
        await client.query('COMMIT');
        appliedVersions.push(migration.version);
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch {}
        throw error;
      }
    }
    return appliedVersions;
  } finally {
    try { await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [LOCK_KEY]); } catch {}
    client.release();
  }
}