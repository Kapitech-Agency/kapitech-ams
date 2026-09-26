import { getPostgresPool } from './postgres.ts';
import { allProjects } from '../src/data/projectsData.ts';
import { allSolutionsAndServices } from '../src/data/servicesData.ts';

type SeedKind = 'services' | 'projects';

const SEED_VERSION = 'public-cms-defaults-v1';
const CMS_BOOTSTRAP_LOCK_KEY = 726150391;

function seedId(kind: SeedKind): string {
  return `${SEED_VERSION}:${kind}`;
}

export async function ensurePostgresCmsDefaults(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [CMS_BOOTSTRAP_LOCK_KEY]);

    const seedRows = await client.query<{ key: string }>(
      'SELECT key FROM cms_seed_state WHERE key = ANY($1::text[]) FOR UPDATE',
      [[seedId('services'), seedId('projects')]]
    );
    const seeded = new Set(seedRows.rows.map((row) => row.key));

    if (!seeded.has(seedId('services'))) {
      const countResult = await client.query<{ count: string }>(
        'SELECT COUNT(*)::bigint AS count FROM cms_services'
      );
      if (Number(countResult.rows[0]?.count || 0) === 0) {
        for (const item of allSolutionsAndServices) {
          const now = new Date().toISOString();
          await client.query(
            `INSERT INTO cms_services
              (id,name,slug,description,data,created_at,updated_at)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6,$6)
             ON CONFLICT DO NOTHING`,
            [
              `seed_srv_${item.slug}`,
              item.title,
              item.slug,
              item.heroSubtitle,
              JSON.stringify({
                ...item,
                id: `seed_srv_${item.slug}`,
                isPublished: true,
                createdAt: now,
                updatedAt: now
              }),
              now
            ]
          );
        }
      }
      await client.query(
        'INSERT INTO cms_seed_state (key) VALUES ($1) ON CONFLICT DO NOTHING',
        [seedId('services')]
      );
    }

    if (!seeded.has(seedId('projects'))) {
      const countResult = await client.query<{ count: string }>(
        'SELECT COUNT(*)::bigint AS count FROM cms_projects'
      );
      if (Number(countResult.rows[0]?.count || 0) === 0) {
        for (const item of allProjects) {
          const now = new Date().toISOString();
          await client.query(
            `INSERT INTO cms_projects
              (id,name,slug,description,data,created_at,updated_at)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6,$6)
             ON CONFLICT DO NOTHING`,
            [
              item.id,
              item.title,
              item.id,
              item.desc,
              JSON.stringify({
                ...item,
                slug: item.id,
                createdAt: now,
                updatedAt: now
              }),
              now
            ]
          );
        }
      }
      await client.query(
        'INSERT INTO cms_seed_state (key) VALUES ($1) ON CONFLICT DO NOTHING',
        [seedId('projects')]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
