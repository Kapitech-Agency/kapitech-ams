import crypto from 'crypto';
import { getPostgresPool, withPostgresTransaction } from './postgres.ts';
import { postgresAuditLogRepository, type AuditEntry } from './postgres-audit-log-repository.ts';

export type InsightLanguage = 'id' | 'en';
export type InsightStatus = 'draft' | 'published' | 'archived';

export interface InsightListFilters {
  language?: InsightLanguage;
  status?: InsightStatus;
  categoryId?: string;
  authorId?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function toJson(value: unknown, fallback: any): any {
  if (value === null || value === undefined) return fallback;
  return typeof value === 'object' ? value : fallback;
}

function localizeJsonName(value: any, language: InsightLanguage): string {
  if (!value || typeof value !== 'object') return '';
  return String(value[language] || value.en || value.id || '').trim();
}

function mapCategory(row: any, language: InsightLanguage = 'en'): any {
  return {
    id: row.id,
    slug: row.slug,
    name: toJson(row.name, {}),
    displayName: localizeJsonName(row.name, language),
    description: toJson(row.description, {}),
    seoTitle: toJson(row.seo_title, {}),
    seoDescription: toJson(row.seo_description, {}),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

function mapTag(row: any, language: InsightLanguage = 'en'): any {
  return {
    id: row.id,
    slug: row.slug,
    name: toJson(row.name, {}),
    displayName: localizeJsonName(row.name, language),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

function mapAuthor(row: any, language: InsightLanguage = 'en'): any {
  if (!row) return null;
  const data = toJson(row.data, {});
  const localized = toJson(data.localized, {});
  return {
    ...data,
    id: row.id,
    slug: row.slug,
    name: localizeJsonName(localized.name, language) || row.name,
    role: localizeJsonName(localized.role, language) || row.role || data.role || '',
    bio: localizeJsonName(localized.bio, language) || row.bio || data.bio || '',
    avatar: row.avatar || data.avatar || '',
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

function mapInsight(
  row: any,
  language: InsightLanguage = 'en',
  category?: any,
  author?: any
): any {
  const data = toJson(row.data, {});
  return {
    ...data,
    id: row.id,
    contentGroupId: row.content_group_id,
    language: row.language,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: toJson(row.content, []),
    coverImage: row.cover_image || '',
    categoryId: row.category_id || null,
    category: category || null,
    authorId: row.author_id || null,
    author: author || null,
    tags: toJson(row.tags, []),
    status: row.status,
    isFeatured: Boolean(row.is_featured),
    readingTime: Number(row.reading_time || 1),
    publishedAt: asIso(row.published_at),
    keyTakeaways: toJson(row.key_takeaways, []),
    faq: toJson(row.faq, []),
    relatedInsightIds: toJson(row.related_insight_ids, []),
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    ogImage: row.og_image || '',
    canonicalUrl: row.canonical_url || '',
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at)
  };
}

export class PostgresInsightRepository {
  async list(filters: InsightListFilters = {}): Promise<{ items: any[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, Number(filters.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize || 12)));
    const language = filters.language || undefined;
    const status = filters.status || undefined;
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (language) {
      values.push(language);
      clauses.push('i.language = $' + values.length);
    }
    if (status) {
      values.push(status);
      clauses.push('i.status = $' + values.length);
    }
    if (filters.categoryId) {
      values.push(filters.categoryId);
      clauses.push('i.category_id = $' + values.length);
    }
    if (filters.authorId) {
      values.push(filters.authorId);
      clauses.push('i.author_id = $' + values.length);
    }
    if (filters.featured !== undefined) {
      values.push(filters.featured);
      clauses.push('i.is_featured = $' + values.length);
    }
    if (filters.search?.trim()) {
      values.push('%' + filters.search.trim().toLowerCase().slice(0, 120) + '%');
      clauses.push('(LOWER(i.title) LIKE $' + values.length + ' OR LOWER(COALESCE(i.excerpt, \'\')) LIKE $' + values.length + ' OR LOWER(COALESCE(i.slug, \'\')) LIKE $' + values.length + ')');
    }

    const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
    const countResult = await getPostgresPool().query<{ count: string }>(
      'SELECT COUNT(*)::bigint AS count FROM cms_insights i' + where,
      values
    );
    const total = Number(countResult.rows[0]?.count || 0);
    const offset = (page - 1) * pageSize;
    const listValues = [...values, pageSize, offset];

    const { rows } = await getPostgresPool().query(
      `SELECT
         i.*,
         c.id AS category_row_id, c.slug AS category_slug, c.name AS category_name,
         c.description AS category_description, c.seo_title AS category_seo_title, c.seo_description AS category_seo_description,
         c.created_at AS category_created_at, c.updated_at AS category_updated_at,
         a.id AS author_row_id, a.slug AS author_slug, a.name AS author_name,
         a.role AS author_role, a.bio AS author_bio, a.avatar AS author_avatar,
         a.data AS author_data, a.created_at AS author_created_at, a.updated_at AS author_updated_at
       FROM cms_insights i
       LEFT JOIN cms_insight_categories c ON c.id = i.category_id
       LEFT JOIN cms_insight_authors a ON a.id = i.author_id
       ${where}
       ORDER BY i.is_featured DESC, i.published_at DESC NULLS LAST, i.created_at DESC
       LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
      listValues
    );

    return {
      items: rows.map(row => mapInsight(
        row,
        language || row.language,
        row.category_row_id ? mapCategory({
          id: row.category_row_id,
          slug: row.category_slug,
          name: row.category_name,
          description: row.category_description,
          seo_title: row.category_seo_title,
          seo_description: row.category_seo_description,
          created_at: row.category_created_at,
          updated_at: row.category_updated_at
        }, language || row.language) : null,
        row.author_row_id ? mapAuthor({
          id: row.author_row_id,
          slug: row.author_slug,
          name: row.author_name,
          role: row.author_role,
          bio: row.author_bio,
          avatar: row.author_avatar,
          data: row.author_data,
          created_at: row.author_created_at,
          updated_at: row.author_updated_at
        }, language || row.language) : null
      )),
      total,
      page,
      pageSize
    };
  }

  async findById(id: string): Promise<any | null> {
    const { rows } = await getPostgresPool().query('SELECT * FROM cms_insights WHERE id=$1', [id]);
    return rows[0] ? mapInsight(rows[0], rows[0].language || 'en') : null;
  }

  async findBySlug(slug: string, language?: InsightLanguage): Promise<any | null> {
    const values: unknown[] = [slug];
    const languageClause = language ? ' AND i.language=$2' : '';
    if (language) values.push(language);
    const { rows } = await getPostgresPool().query(
      `SELECT
         i.*,
         c.id AS category_row_id, c.slug AS category_slug, c.name AS category_name,
         c.description AS category_description, c.seo_title AS category_seo_title, c.seo_description AS category_seo_description,
         c.created_at AS category_created_at, c.updated_at AS category_updated_at,
         a.id AS author_row_id, a.slug AS author_slug, a.name AS author_name,
         a.role AS author_role, a.bio AS author_bio, a.avatar AS author_avatar,
         a.data AS author_data, a.created_at AS author_created_at, a.updated_at AS author_updated_at
       FROM cms_insights i
       LEFT JOIN cms_insight_categories c ON c.id=i.category_id
       LEFT JOIN cms_insight_authors a ON a.id=i.author_id
       WHERE i.slug=$1${languageClause}
       LIMIT 1`,
      values
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return mapInsight(
      row,
      language || row.language,
      row.category_row_id ? mapCategory({
        id: row.category_row_id,
        slug: row.category_slug,
        name: row.category_name,
        description: row.category_description,
        seo_title: row.category_seo_title,
        seo_description: row.category_seo_description,
        created_at: row.category_created_at,
        updated_at: row.category_updated_at
      }, language || row.language) : null,
      row.author_row_id ? mapAuthor({
        id: row.author_row_id,
        slug: row.author_slug,
        name: row.author_name,
        role: row.author_role,
        bio: row.author_bio,
        avatar: row.author_avatar,
        data: row.author_data,
        created_at: row.author_created_at,
        updated_at: row.author_updated_at
      }, language || row.language) : null
    );
  }

  async findVariant(contentGroupId: string, language: InsightLanguage): Promise<any | null> {
    const { rows } = await getPostgresPool().query(
      'SELECT * FROM cms_insights WHERE content_group_id=$1 AND language=$2 LIMIT 1',
      [contentGroupId, language]
    );
    return rows[0] ? mapInsight(rows[0]) : null;
  }

  async create(input: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
      const now = input.createdAt || new Date().toISOString();
      const { rows } = await client.query(
        `INSERT INTO cms_insights (
          id,content_group_id,language,title,slug,excerpt,content,cover_image,category_id,author_id,tags,status,
          is_featured,reading_time,published_at,key_takeaways,faq,related_insight_ids,seo_title,seo_description,og_image,
          canonical_url,data,created_at,updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19,$20,$21,$22,$23::jsonb,$24,$24
        ) RETURNING *`,
        [
          input.id,
          input.contentGroupId,
          input.language,
          input.title,
          input.slug,
          input.excerpt || '',
          JSON.stringify(input.content || []),
          input.coverImage || '',
          input.categoryId || null,
          input.authorId || null,
          JSON.stringify(input.tags || []),
          input.status || 'draft',
          Boolean(input.isFeatured),
          Number(input.readingTime || 1),
          input.publishedAt || null,
          JSON.stringify(input.keyTakeaways || []),
          JSON.stringify(input.faq || []),
          JSON.stringify(input.relatedInsightIds || []),
          input.seoTitle || '',
          input.seoDescription || '',
          input.ogImage || '',
          input.canonicalUrl || '',
          JSON.stringify(input),
          now
        ]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapInsight(rows[0]);
    });
  }

  async update(id: string, patch: any, audit?: AuditEntry): Promise<any | null> {
    return withPostgresTransaction(async client => {
      const currentResult = await client.query('SELECT * FROM cms_insights WHERE id=$1 FOR UPDATE', [id]);
      if (!currentResult.rows[0]) return null;
      const current = currentResult.rows[0];
      const merged = {
        ...mapInsight(current),
        ...patch,
        updatedAt: new Date().toISOString()
      };
      const { rows } = await client.query(
        `UPDATE cms_insights SET
          content_group_id=$2,language=$3,title=$4,slug=$5,excerpt=$6,content=$7::jsonb,cover_image=$8,
          category_id=$9,author_id=$10,tags=$11::jsonb,status=$12,is_featured=$13,reading_time=$14,published_at=$15,
          key_takeaways=$16::jsonb,faq=$17::jsonb,related_insight_ids=$18::jsonb,seo_title=$19,seo_description=$20,
          og_image=$21,canonical_url=$22,data=$23::jsonb,updated_at=$24
         WHERE id=$1 RETURNING *`,
        [
          id,
          merged.contentGroupId,
          merged.language,
          merged.title,
          merged.slug,
          merged.excerpt || '',
          JSON.stringify(merged.content || []),
          merged.coverImage || '',
          merged.categoryId || null,
          merged.authorId || null,
          JSON.stringify(merged.tags || []),
          merged.status || 'draft',
          Boolean(merged.isFeatured),
          Number(merged.readingTime || 1),
          merged.publishedAt || null,
          JSON.stringify(merged.keyTakeaways || []),
          JSON.stringify(merged.faq || []),
          JSON.stringify(merged.relatedInsightIds || []),
          merged.seoTitle || '',
          merged.seoDescription || '',
          merged.ogImage || '',
          merged.canonicalUrl || '',
          JSON.stringify(merged),
          merged.updatedAt
        ]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return rows[0] ? mapInsight(rows[0]) : null;
    });
  }

  async delete(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const { rowCount } = await client.query('DELETE FROM cms_insights WHERE id=$1', [id]);
      if (rowCount !== 1) return false;
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return true;
    });
  }

  async listCategories(language: InsightLanguage = 'en'): Promise<any[]> {
    const { rows } = await getPostgresPool().query('SELECT * FROM cms_insight_categories ORDER BY LOWER(COALESCE(name->>$1, name->>\'en\', name->>\'id\', \'\'))', [language]);
    return rows.map(row => mapCategory(row, language));
  }

  async createCategory(input: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
      const { rows } = await client.query(
        `INSERT INTO cms_insight_categories (id,slug,name,description,seo_title,seo_description)
         VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb) RETURNING *`,
        [
          input.id, input.slug, JSON.stringify(input.name || {}), JSON.stringify(input.description || {}),
          JSON.stringify(input.seoTitle || {}), JSON.stringify(input.seoDescription || {})
        ]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapCategory(rows[0], input.language || 'en');
    });
  }

  async deleteCategory(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const { rowCount } = await client.query('DELETE FROM cms_insight_categories WHERE id=$1', [id]);
      if (rowCount !== 1) return false;
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return true;
    });
  }

  async listAuthors(): Promise<any[]> {
    const { rows } = await getPostgresPool().query('SELECT * FROM cms_insight_authors ORDER BY LOWER(name)');
    return rows.map(mapAuthor);
  }

  async createAuthor(input: any, audit?: AuditEntry): Promise<any> {
    return withPostgresTransaction(async client => {
      const { rows } = await client.query(
        `INSERT INTO cms_insight_authors (id,slug,name,role,bio,avatar,data)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,
        [input.id,input.slug,input.name,input.role || '',input.bio || '',input.avatar || '',JSON.stringify(input)]
      );
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return mapAuthor(rows[0]);
    });
  }

  async deleteAuthor(id: string, audit?: AuditEntry): Promise<boolean> {
    return withPostgresTransaction(async client => {
      const { rowCount } = await client.query('DELETE FROM cms_insight_authors WHERE id=$1', [id]);
      if (rowCount !== 1) return false;
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return true;
    });
  }

  async listTags(language: InsightLanguage = 'en'): Promise<any[]> {
    const { rows } = await getPostgresPool().query('SELECT * FROM cms_insight_tags ORDER BY LOWER(COALESCE(name->>$1, name->>\'en\', name->>\'id\', \'\'))', [language]);
    return rows.map(row => mapTag(row, language));
  }

  async upsertTags(tags: Array<{ slug: string; name: any }>, language: InsightLanguage, audit?: AuditEntry): Promise<any[]> {
    if (!tags.length) return [];
    return withPostgresTransaction(async client => {
      const output: any[] = [];
      for (const tag of tags) {
        const found = await client.query('SELECT * FROM cms_insight_tags WHERE slug=$1 FOR UPDATE', [tag.slug]);
        if (!found.rows[0]) {
          const inserted = await client.query(
            'INSERT INTO cms_insight_tags (id,slug,name) VALUES ($1,$2,$3::jsonb) RETURNING *',
            [`tag_${crypto.randomBytes(5).toString('hex')}`, tag.slug, JSON.stringify(tag.name || {})]
          );
          output.push(mapTag(inserted.rows[0], language));
        } else {
          const current = found.rows[0];
          const mergedName = { ...(current.name || {}), ...(tag.name || {}) };
          const updated = await client.query(
            'UPDATE cms_insight_tags SET name=$2::jsonb,updated_at=NOW() WHERE id=$1 RETURNING *',
            [current.id, JSON.stringify(mergedName)]
          );
          output.push(mapTag(updated.rows[0], language));
        }
      }
      if (audit) await postgresAuditLogRepository.appendWithinTransaction(client, audit);
      return output;
    });
  }
}

export const postgresInsightRepository = new PostgresInsightRepository();
