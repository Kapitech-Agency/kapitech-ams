import insightEditorialPack from '../content/insight-editorial-packs/mvp-vs-prototype-vs-proof-of-concept.id.json';
import { getPostgresPool } from './postgres.ts';
import { allProjects } from '../src/data/projectsData.ts';
import { allSolutionsAndServices } from '../src/data/servicesData.ts';

type SeedKind = 'services' | 'projects';

const SEED_VERSION = 'public-cms-defaults-v1';
const CMS_BOOTSTRAP_LOCK_KEY = 726150391;
const INSIGHT_EDITORIAL_SEED_KEY = 'insight-editorial:mvp-vs-prototype-vs-proof-of-concept:id:v1';

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


    const insightSeedRow = await client.query<{ key: string }>(
      'SELECT key FROM cms_seed_state WHERE key = $1 FOR UPDATE',
      [INSIGHT_EDITORIAL_SEED_KEY]
    );

    if (insightSeedRow.rowCount === 0) {
      const pack = insightEditorialPack as any;
      const editorial = pack.editorial || {};
      const seo = pack.seo || {};
      const slug = String(seo.slug || '').trim();
      const existing = slug
        ? await client.query<{ id: string }>('SELECT id FROM cms_insights WHERE slug = $1 LIMIT 1', [slug])
        : { rowCount: 0, rows: [] as Array<{ id: string }> };

      if (slug && existing.rowCount === 0 && editorial.language === 'id') {
        const now = new Date().toISOString();

        const categoryResult = await client.query<{ id: string }>(
          'SELECT id FROM cms_insight_categories WHERE slug = $1 LIMIT 1',
          [String(editorial.categorySlug || '').trim()]
        );
        const categoryId = categoryResult.rows[0]?.id || null;

        const publisherSlug = 'kapitech-editorial-team';
        const publisherResult = await client.query<{ id: string }>(
          'SELECT id FROM cms_insight_authors WHERE slug = $1 LIMIT 1',
          [publisherSlug]
        );
        let authorId = publisherResult.rows[0]?.id || null;

        if (!authorId) {
          const nextAuthorId = 'seed_author_kapitech_editorial_team';
          await client.query(
            'INSERT INTO cms_insight_authors (id,slug,name,role,bio,avatar,data,created_at,updated_at) ' +
            'VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8) ON CONFLICT (slug) DO NOTHING',
            [
              nextAuthorId,
              publisherSlug,
              'Kapitech Editorial Team',
              'Editorial',
              'Editorial perspectives from Kapitech Agency on design, technology, digital products, and delivery.',
              '',
              JSON.stringify({ source: 'editorial-bootstrap', organization: 'Kapitech Agency' }),
              now
            ]
          );
          const createdAuthor = await client.query<{ id: string }>(
            'SELECT id FROM cms_insight_authors WHERE slug = $1 LIMIT 1',
            [publisherSlug]
          );
          authorId = createdAuthor.rows[0]?.id || nextAuthorId;
        }

        const insightId = 'seed_insight_mvp_vs_prototype_vs_poc_id';
        const contentGroupId = 'seed_insight_group_mvp_vs_prototype_vs_poc';
        const tags = Array.isArray(editorial.tags)
          ? editorial.tags.slice(0, 30).map((tag: any) => ({
              slug: String(tag?.slug || '').trim(),
              name: String(tag?.name || '').trim()
            })).filter((tag: any) => tag.slug && tag.name)
          : [];

        await client.query(
          'INSERT INTO cms_insights (' +
          'id,content_group_id,language,title,slug,excerpt,content,cover_image,category_id,author_id,tags,status,' +
          'is_featured,reading_time,published_at,key_takeaways,faq,related_insight_ids,seo_title,seo_description,' +
          'og_image,canonical_url,data,created_at,updated_at) ' +
          'VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,' +
          '$19,$20,$21,$22,$23::jsonb,$24,$24)',
          [
            insightId,
            contentGroupId,
            'id',
            String(editorial.title || '').trim(),
            slug,
            String(editorial.excerpt || '').trim(),
            JSON.stringify(Array.isArray(editorial.content) ? editorial.content : []),
            String(editorial.coverImage || '').trim(),
            categoryId,
            authorId,
            JSON.stringify(tags),
            'published',
            Boolean(editorial.isFeatured),
            Math.min(180, Math.max(1, Number(editorial.readingTime || 13))),
            now,
            JSON.stringify(Array.isArray(editorial.keyTakeaways) ? editorial.keyTakeaways : []),
            JSON.stringify(Array.isArray(editorial.faq) ? editorial.faq : []),
            JSON.stringify(Array.isArray(editorial.relatedInsightIds) ? editorial.relatedInsightIds : []),
            String(seo.title || '').trim(),
            String(seo.description || '').trim(),
            String(seo.ogImage || '').trim(),
            String(seo.canonicalUrl || '').trim(),
            JSON.stringify({ source: INSIGHT_EDITORIAL_SEED_KEY, format: pack.format, editorial, seo }),
            now
          ]
        );
      }

      await client.query(
        'INSERT INTO cms_seed_state (key) VALUES ($1) ON CONFLICT DO NOTHING',
        [INSIGHT_EDITORIAL_SEED_KEY]
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
