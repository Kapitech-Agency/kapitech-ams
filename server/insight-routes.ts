
import crypto from 'crypto';
import type { Router, Request, Response } from 'express';
import {
  getDatabase,
  saveDatabase,
  recordAuditLog
} from './db';
import {
  AuthenticatedRequest,
  isMasterAdministrator,
  rateLimitPublic,
  requireAuth,
  requirePermission
} from './auth';
import { getDataSourceMode } from './data-source.ts';
import {
  postgresInsightRepository,
  type InsightLanguage,
  type InsightStatus
} from './postgres-insight-repository.ts';

type InsightBlock = Record<string, unknown>;

const LANGUAGES = new Set<InsightLanguage>(['id', 'en']);
const STATUSES = new Set<InsightStatus>(['draft', 'published', 'archived']);

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function optionalUrl(value: unknown): string {
  const candidate = clean(value, 2000);
  if (!candidate) return '';
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function audit(req: AuthenticatedRequest, action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') {
  return {
    action,
    actor: req.user!.username,
    actorRole: req.user!.role,
    actorUserId: req.user!.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string,
    details,
    severity
  };
}

function language(value: unknown): InsightLanguage {
  return value === 'id' ? 'id' : 'en';
}

function status(value: unknown): InsightStatus {
  const candidate = String(value || 'draft').toLowerCase();
  return STATUSES.has(candidate as InsightStatus) ? candidate as InsightStatus : 'draft';
}

function slugify(value: unknown): string {
  return clean(value, 180)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(item => clean(item, maxLength)).filter(Boolean);
}

function localizedMap(value: unknown, max: number): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of ['id', 'en']) {
    if (source[key] !== undefined) {
      const text = clean(source[key], max);
      if (text) result[key] = text;
    }
  }
  return result;
}

function block(value: unknown): InsightBlock | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const type = clean(item.type, 32).toLowerCase();

  if (type === 'paragraph') {
    const text = clean(item.text, 12000);
    return text ? { type, text } : null;
  }

  if (type === 'heading') {
    const level = Number(item.level);
    const text = clean(item.text, 500);
    if (!text || (level !== 2 && level !== 3)) return null;
    return { type, level, text };
  }

  if (type === 'list') {
    const items = stringArray(item.items, 100, 1200);
    return items.length ? { type, ordered: Boolean(item.ordered), items } : null;
  }

  if (type === 'quote') {
    const text = clean(item.text, 4000);
    if (!text) return null;
    const attribution = clean(item.attribution, 240);
    return { type, text, ...(attribution ? { attribution } : {}) };
  }

  if (type === 'image') {
    const url = optionalUrl(item.url);
    const alt = clean(item.alt, 300);
    if (!url || !alt) return null;
    const caption = clean(item.caption, 500);
    return { type, url, alt, ...(caption ? { caption } : {}) };
  }

  if (type === 'table') {
    const headers = stringArray(item.headers, 20, 300);
    const rows = Array.isArray(item.rows)
      ? item.rows.slice(0, 100).map(row => stringArray(row, 20, 500)).filter(row => row.length)
      : [];
    return headers.length && rows.length ? { type, headers, rows } : null;
  }

  if (type === 'callout') {
    const text = clean(item.text, 3000);
    if (!text) return null;
    const title = clean(item.title, 240);
    const tone = ['info', 'warning', 'success', 'neutral'].includes(String(item.tone))
      ? String(item.tone)
      : 'neutral';
    return { type, text, tone, ...(title ? { title } : {}) };
  }

  if (type === 'code') {
    const code = clean(item.code, 20000);
    if (!code) return null;
    const codeLanguage = clean(item.language, 32);
    return { type, code, ...(codeLanguage ? { language: codeLanguage } : {}) };
  }

  if (type === 'link') {
    const url = optionalUrl(item.url);
    const label = clean(item.label, 300);
    return url && label ? { type, url, label } : null;
  }

  if (type === 'divider') return { type };

  return null;
}

function blocks(value: unknown): InsightBlock[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).map(block).filter((item): item is InsightBlock => Boolean(item));
}

function faq(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map(item => {
    const source = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      question: clean(source.question, 500),
      answer: clean(source.answer, 5000)
    };
  }).filter(item => item.question && item.answer);
}

function tags(value: unknown): Array<{ slug: string; name: string; id?: string }> {
  const raw = Array.isArray(value) ? value : [];
  const unique = new Map<string, { slug: string; name: string; id?: string }>();
  for (const entry of raw.slice(0, 30)) {
    const source = entry && typeof entry === 'object' ? entry as Record<string, unknown> : { name: entry };
    const name = clean(source.name, 120);
    const slug = slugify(source.slug || name);
    if (!name || !slug || unique.has(slug)) continue;
    unique.set(slug, {
      slug,
      name,
      ...(source.id ? { id: clean(source.id, 100) } : {})
    });
  }
  return Array.from(unique.values());
}

function publishedAt(value: unknown, currentStatus: InsightStatus): string | null {
  if (currentStatus !== 'published') return value ? clean(value, 60) : null;
  const candidate = value ? new Date(String(value)) : new Date();
  return Number.isNaN(candidate.getTime()) ? new Date().toISOString() : candidate.toISOString();
}

async function uniqueSlug(candidate: string, currentId?: string): Promise<string> {
  const base = candidate || 'insight-' + Date.now().toString(36);
  let next = base;
  for (let attempt = 1; attempt <= 100; attempt += 1) {
    const existing = getDataSourceMode() === 'postgres'
      ? await postgresInsightRepository.findBySlug(next)
      : getDatabase().cmsInsights.find((item: any) => item.slug === next);
    if (!existing || existing.id === currentId) return next;
    next = (base + '-' + (attempt + 1)).slice(0, 120);
  }
  throw new Error('Unable to generate a unique insight slug.');
}

function summary(item: any): any {
  if (!item) return null;
  return {
    id: item.id,
    contentGroupId: item.contentGroupId,
    language: item.language,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt || '',
    coverImage: item.coverImage || '',
    categoryId: item.categoryId || null,
    category: item.category || null,
    authorId: item.authorId || null,
    author: item.author || null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    status: item.status,
    isFeatured: Boolean(item.isFeatured),
    readingTime: Number(item.readingTime || 1),
    publishedAt: item.publishedAt || null,
    updatedAt: item.updatedAt || null,
    seoTitle: item.seoTitle || '',
    seoDescription: item.seoDescription || '',
    ogImage: item.ogImage || '',
    canonicalUrl: item.canonicalUrl || ''
  };
}

function detail(item: any, alternates: Array<{ language: InsightLanguage; slug: string }>, related: any[]): any {
  return {
    ...summary(item),
    content: blocks(item.content),
    keyTakeaways: stringArray(item.keyTakeaways, 12, 1200),
    faq: faq(item.faq),
    relatedInsightIds: stringArray(item.relatedInsightIds, 12, 100),
    alternateLanguages: alternates,
    relatedInsights: related.map(summary).filter(Boolean)
  };
}

function withJsonRelations(item: any, db: ReturnType<typeof getDatabase>): any {
  if (!item) return null;
  const category = item.categoryId ? db.cmsInsightCategories.find((entry: any) => entry.id === item.categoryId) || null : null;
  const author = item.authorId ? db.cmsInsightAuthors.find((entry: any) => entry.id === item.authorId) || null : null;
  return { ...item, category, author };
}

function payload(body: any, lang: InsightLanguage, existing?: any): any {
  const currentStatus = status(body.status ?? existing?.status);
  const title = clean(body.title ?? existing?.title, 240);
  const slug = slugify(body.slug ?? existing?.slug ?? title);
  const contentGroupId = clean(body.contentGroupId ?? existing?.contentGroupId, 120)
    || 'insight_group_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');

  if (!title) throw new Error('Insight title is required.');
  if (!slug) throw new Error('Insight slug is required.');

  return {
    ...(existing || {}),
    language: lang,
    contentGroupId,
    title,
    slug,
    excerpt: clean(body.excerpt ?? existing?.excerpt, 700),
    content: blocks(body.content ?? existing?.content),
    coverImage: optionalUrl(body.coverImage ?? existing?.coverImage),
    categoryId: clean(body.categoryId ?? existing?.categoryId, 120) || null,
    authorId: clean(body.authorId ?? existing?.authorId, 120) || null,
    tags: tags(body.tags ?? existing?.tags),
    status: currentStatus,
    isFeatured: Boolean(body.isFeatured ?? existing?.isFeatured),
    readingTime: Math.min(180, Math.max(1, Number(body.readingTime ?? existing?.readingTime ?? 1) || 1)),
    publishedAt: publishedAt(body.publishedAt ?? existing?.publishedAt, currentStatus),
    keyTakeaways: stringArray(body.keyTakeaways ?? existing?.keyTakeaways, 12, 1200),
    faq: faq(body.faq ?? existing?.faq),
    relatedInsightIds: stringArray(body.relatedInsightIds ?? existing?.relatedInsightIds, 12, 100),
    seoTitle: clean(body.seoTitle ?? existing?.seoTitle, 180),
    seoDescription: clean(body.seoDescription ?? existing?.seoDescription, 320),
    ogImage: optionalUrl(body.ogImage ?? existing?.ogImage),
    canonicalUrl: optionalUrl(body.canonicalUrl ?? existing?.canonicalUrl),
    updatedAt: new Date().toISOString()
  };
}

async function resolveTags(value: unknown, lang: InsightLanguage): Promise<Array<{ id?: string; slug: string; name: string }>> {
  const input = tags(value);
  if (!input.length) return [];
  if (getDataSourceMode() === 'postgres') {
    return postgresInsightRepository.upsertTags(
      input.map(tag => ({ slug: tag.slug, name: { [lang]: tag.name } })),
      lang
    );
  }

  const db = getDatabase();
  return input.map(tag => {
    const existing = db.cmsInsightTags.find((entry: any) => entry.slug === tag.slug);
    if (existing) {
      existing.name = { ...(existing.name || {}), [lang]: tag.name };
      existing.updatedAt = new Date().toISOString();
      return { id: existing.id, slug: existing.slug, name: tag.name };
    }

    const now = new Date().toISOString();
    const created = {
      id: 'tag_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      slug: tag.slug,
      name: { [lang]: tag.name },
      createdAt: now,
      updatedAt: now
    };
    db.cmsInsightTags.push(created);
    return { id: created.id, slug: created.slug, name: tag.name };
  });
}

export function registerInsightRoutes(apiRouter: Router): void {
  apiRouter.get('/cms/insights', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const canManage = Boolean(user && (isMasterAdministrator(user) || user.permissions?.canManageCmsContent));
      const lang = language(req.query.language);
      const requestedStatus = STATUSES.has(String(req.query.status || '') as InsightStatus)
        ? String(req.query.status) as InsightStatus
        : undefined;
      const currentStatus = canManage ? requestedStatus : 'published';
      const page = Math.max(1, Number(req.query.page || 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 12)));
      const search = clean(req.query.search, 120);

      if (getDataSourceMode() === 'postgres') {
        const result = await postgresInsightRepository.list({
          language: lang,
          status: currentStatus,
          categoryId: clean(req.query.categoryId, 120) || undefined,
          authorId: clean(req.query.authorId, 120) || undefined,
          featured: req.query.featured == null ? undefined : String(req.query.featured) === 'true',
          search,
          page,
          pageSize
        });
        res.json({
          success: true,
          insights: result.items.map(summary),
          meta: {
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            totalPages: Math.max(1, Math.ceil(result.total / result.pageSize))
          }
        });
        return;
      }

      const db = getDatabase();
      let items = [...(db.cmsInsights || [])];
      items = items.filter(item => item.language === lang);
      if (currentStatus) items = items.filter(item => item.status === currentStatus);
      if (req.query.categoryId) items = items.filter(item => item.categoryId === String(req.query.categoryId));
      if (req.query.authorId) items = items.filter(item => item.authorId === String(req.query.authorId));
      if (req.query.featured != null) items = items.filter(item => Boolean(item.isFeatured) === (String(req.query.featured) === 'true'));
      if (search) {
        const needle = search.toLowerCase();
        items = items.filter(item =>
          String(item.title || '').toLowerCase().includes(needle) ||
          String(item.excerpt || '').toLowerCase().includes(needle) ||
          String(item.slug || '').toLowerCase().includes(needle) ||
          (Array.isArray(item.tags) && item.tags.some((tag: any) => String(tag.name || '').toLowerCase().includes(needle)))
        );
      }
      items.sort((a, b) =>
        Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) ||
        String(b.publishedAt || b.updatedAt || '').localeCompare(String(a.publishedAt || a.updatedAt || ''))
      );
      const total = items.length;
      const start = (page - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize).map(item => summary(withJsonRelations(item, db)));
      res.json({
        success: true,
        insights: pageItems,
        meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
      });
    } catch (error) {
      console.error('[CMS Insights] list failed:', error);
      res.status(503).json({ success: false, error: 'Insight content is temporarily unavailable.' });
    }
  });

  apiRouter.get('/cms/insights/sitemap.xml', rateLimitPublic(), async (_req: Request, res: Response): Promise<void> => {
    try {
      const all: any[] = [];
      const languages: InsightLanguage[] = ['id', 'en'];

      for (const lang of languages) {
        let page = 1;
        while (true) {
          const result = getDataSourceMode() === 'postgres'
            ? await postgresInsightRepository.list({ language: lang, status: 'published', page, pageSize: 100 })
            : (() => {
                const db = getDatabase();
                const items = (db.cmsInsights || []).filter((item: any) => item.language === lang && item.status === 'published');
                const start = (page - 1) * 100;
                return { items: items.slice(start, start + 100), total: items.length, page, pageSize: 100 };
              })();

          all.push(...result.items);
          if (!result.items.length || all.filter(item => item.language === lang).length >= result.total) break;
          page += 1;
        }
      }

      const escapeXml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const urls = all.map(item => {
        const stamp = item.updatedAt || item.publishedAt || item.createdAt || new Date().toISOString();
        return '<url><loc>' + escapeXml('https://kapitech.id/insights/' + item.slug) + '</loc><lastmod>' + escapeXml(new Date(stamp).toISOString()) + '</lastmod></url>';
      }).join('');

      res.type('application/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        urls +
        '</urlset>'
      );
    } catch (error) {
      console.error('[CMS Insights] sitemap failed:', error);
      res.status(503).type('application/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
      );
    }
  });

  apiRouter.get('/cms/insights/:slug', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const canManage = Boolean(user && (isMasterAdministrator(user) || user.permissions?.canManageCmsContent));
      const slug = clean(req.params.slug, 120);
      const requestedLanguage = LANGUAGES.has(String(req.query.language) as InsightLanguage)
        ? String(req.query.language) as InsightLanguage
        : undefined;

      let item = getDataSourceMode() === 'postgres'
        ? await postgresInsightRepository.findBySlug(slug, requestedLanguage)
        : getDatabase().cmsInsights.find((entry: any) => entry.slug === slug);

      if (!item || (!canManage && item.status !== 'published')) {
        res.status(404).json({ success: false, error: 'Insight not found.' });
        return;
      }

      const db = getDataSourceMode() === 'json' ? getDatabase() : undefined;
      item = db ? withJsonRelations(item, db) : item;

      const alternates: Array<{ language: InsightLanguage; slug: string }> = [
        { language: item.language, slug: item.slug }
      ];

      const otherLanguage = item.language === 'id' ? 'en' : 'id';
      const variant = getDataSourceMode() === 'postgres'
        ? await postgresInsightRepository.findVariant(item.contentGroupId, otherLanguage)
        : db?.cmsInsights.find((entry: any) =>
            entry.contentGroupId === item.contentGroupId &&
            entry.language === otherLanguage &&
            (canManage || entry.status === 'published')
          );

      if (variant) alternates.push({ language: otherLanguage, slug: variant.slug });

      let related: any[] = [];
      const relationIds = stringArray(item.relatedInsightIds, 12, 100);

      if (getDataSourceMode() === 'postgres') {
        related = (await Promise.all(relationIds.map(id => postgresInsightRepository.findById(id))))
          .filter(Boolean)
          .filter(entry => canManage || entry.status === 'published')
          .map(summary);
      } else if (db) {
        related = relationIds
          .map(id => db.cmsInsights.find((entry: any) => entry.id === id))
          .filter((entry: any) => entry && (canManage || entry.status === 'published'))
          .map((entry: any) => summary(withJsonRelations(entry, db)));
      }

      res.json({
        success: true,
        insight: detail(item, alternates, related)
      });
    } catch (error) {
      console.error('[CMS Insights] detail failed:', error);
      res.status(503).json({ success: false, error: 'Insight content is temporarily unavailable.' });
    }
  });

  apiRouter.get('/cms/insight-categories', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
    try {
      const lang = language(req.query.language);
      const categories = getDataSourceMode() === 'postgres'
        ? await postgresInsightRepository.listCategories(lang)
        : getDatabase().cmsInsightCategories
            .map((item: any) => ({ ...item, displayName: item.name?.[lang] || item.name?.en || item.name?.id || item.slug }))
            .sort((a: any, b: any) => String(a.displayName).localeCompare(String(b.displayName)));
      res.json({ success: true, categories });
    } catch {
      res.status(503).json({ success: false, error: 'Insight categories are temporarily unavailable.' });
    }
  });

  apiRouter.get('/cms/insight-authors', rateLimitPublic(), async (_req: Request, res: Response): Promise<void> => {
    try {
      const authors = getDataSourceMode() === 'postgres'
        ? await postgresInsightRepository.listAuthors()
        : getDatabase().cmsInsightAuthors;
      res.json({ success: true, authors });
    } catch {
      res.status(503).json({ success: false, error: 'Insight authors are temporarily unavailable.' });
    }
  });

  apiRouter.get('/cms/insight-tags', rateLimitPublic(), async (req: Request, res: Response): Promise<void> => {
    try {
      const lang = language(req.query.language);
      const tags = getDataSourceMode() === 'postgres'
        ? await postgresInsightRepository.listTags(lang)
        : getDatabase().cmsInsightTags
            .map((item: any) => ({ ...item, displayName: item.name?.[lang] || item.name?.en || item.name?.id || item.slug }))
            .sort((a: any, b: any) => String(a.displayName).localeCompare(String(b.displayName)));
      res.json({ success: true, tags });
    } catch {
      res.status(503).json({ success: false, error: 'Insight tags are temporarily unavailable.' });
    }
  });

  apiRouter.post('/cms/insights', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const lang = language(req.body?.language);
      const prepared = payload(req.body || {}, lang);
      prepared.id = 'ins_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
      prepared.slug = await uniqueSlug(prepared.slug);
      prepared.tags = await resolveTags(req.body?.tags, lang);

      if (getDataSourceMode() === 'postgres') {
        if (prepared.categoryId) {
          const categories = await postgresInsightRepository.listCategories(lang);
          if (!categories.some(item => item.id === prepared.categoryId)) {
            res.status(400).json({ success: false, error: 'Selected Insight category does not exist.' });
            return;
          }
        }
        if (prepared.authorId) {
          const authors = await postgresInsightRepository.listAuthors();
          if (!authors.some(item => item.id === prepared.authorId)) {
            res.status(400).json({ success: false, error: 'Selected Insight author does not exist.' });
            return;
          }
        }
        if (await postgresInsightRepository.findVariant(prepared.contentGroupId, lang)) {
          res.status(409).json({ success: false, error: 'An Insight already exists for this language variant.' });
          return;
        }

        const created = await postgresInsightRepository.create(prepared, audit(req, 'CMS_INSIGHT_CREATED', 'Created Insight "' + prepared.title + '" [' + lang + '].'));
        res.status(201).json({ success: true, insight: summary(created) });
        return;
      }

      const db = getDatabase();
      if (prepared.categoryId && !db.cmsInsightCategories.some((item: any) => item.id === prepared.categoryId)) {
        res.status(400).json({ success: false, error: 'Selected Insight category does not exist.' });
        return;
      }
      if (prepared.authorId && !db.cmsInsightAuthors.some((item: any) => item.id === prepared.authorId)) {
        res.status(400).json({ success: false, error: 'Selected Insight author does not exist.' });
        return;
      }
      if (db.cmsInsights.some((item: any) => item.contentGroupId === prepared.contentGroupId && item.language === lang)) {
        res.status(409).json({ success: false, error: 'An Insight already exists for this language variant.' });
        return;
      }

      const now = new Date().toISOString();
      db.cmsInsights.unshift({ ...prepared, createdAt: now, updatedAt: now });
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_CREATED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Created Insight "' + prepared.title + '" [' + lang + '].',
        severity: 'info'
      });
      res.status(201).json({ success: true, insight: summary(withJsonRelations(prepared, db)) });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight could not be created.' });
    }
  });

  apiRouter.put('/cms/insights/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = clean(req.params.id, 120);
      const existing = getDataSourceMode() === 'postgres'
        ? await postgresInsightRepository.findById(id)
        : getDatabase().cmsInsights.find((entry: any) => entry.id === id);

      if (!existing) {
        res.status(404).json({ success: false, error: 'Insight not found.' });
        return;
      }

      const lang = language(req.body?.language ?? existing.language);
      const prepared = payload(req.body || {}, lang, existing);
      prepared.id = id;
      prepared.slug = await uniqueSlug(prepared.slug, id);
      prepared.tags = await resolveTags(req.body?.tags ?? existing.tags, lang);

      if (getDataSourceMode() === 'postgres') {
        const duplicate = await postgresInsightRepository.findVariant(prepared.contentGroupId, lang);
        if (duplicate && duplicate.id !== id) {
          res.status(409).json({ success: false, error: 'An Insight already exists for this language variant.' });
          return;
        }
        if (prepared.categoryId) {
          const categories = await postgresInsightRepository.listCategories(lang);
          if (!categories.some(item => item.id === prepared.categoryId)) {
            res.status(400).json({ success: false, error: 'Selected Insight category does not exist.' });
            return;
          }
        }
        if (prepared.authorId) {
          const authors = await postgresInsightRepository.listAuthors();
          if (!authors.some(item => item.id === prepared.authorId)) {
            res.status(400).json({ success: false, error: 'Selected Insight author does not exist.' });
            return;
          }
        }
        const updated = await postgresInsightRepository.update(id, prepared, audit(req, 'CMS_INSIGHT_UPDATED', 'Updated Insight "' + prepared.title + '".'));
        res.json({ success: true, insight: summary(updated) });
        return;
      }

      const db = getDatabase();
      const duplicate = db.cmsInsights.find((item: any) => item.id !== id && item.contentGroupId === prepared.contentGroupId && item.language === lang);
      if (duplicate) {
        res.status(409).json({ success: false, error: 'An Insight already exists for this language variant.' });
        return;
      }
      if (prepared.categoryId && !db.cmsInsightCategories.some((item: any) => item.id === prepared.categoryId)) {
        res.status(400).json({ success: false, error: 'Selected Insight category does not exist.' });
        return;
      }
      if (prepared.authorId && !db.cmsInsightAuthors.some((item: any) => item.id === prepared.authorId)) {
        res.status(400).json({ success: false, error: 'Selected Insight author does not exist.' });
        return;
      }
      const index = db.cmsInsights.findIndex((item: any) => item.id === id);
      db.cmsInsights[index] = { ...db.cmsInsights[index], ...prepared, updatedAt: new Date().toISOString() };
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_UPDATED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Updated Insight "' + prepared.title + '".',
        severity: 'info'
      });
      res.json({ success: true, insight: summary(withJsonRelations(db.cmsInsights[index], db)) });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight could not be updated.' });
    }
  });

  apiRouter.delete('/cms/insights/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = clean(req.params.id, 120);
      if (getDataSourceMode() === 'postgres') {
        const existing = await postgresInsightRepository.findById(id);
        if (!existing) {
          res.status(404).json({ success: false, error: 'Insight not found.' });
          return;
        }
        await postgresInsightRepository.delete(id, audit(req, 'CMS_INSIGHT_DELETED', 'Deleted Insight "' + (existing.title || id) + '".', 'warning'));
        res.json({ success: true });
        return;
      }

      const db = getDatabase();
      const index = db.cmsInsights.findIndex((item: any) => item.id === id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Insight not found.' });
        return;
      }
      const deleted = db.cmsInsights[index];
      db.cmsInsights.splice(index, 1);
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_DELETED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Deleted Insight "' + (deleted.title || id) + '".',
        severity: 'warning'
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight could not be deleted.' });
    }
  });

  apiRouter.post('/cms/insight-categories', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const name = localizedMap(req.body?.name, 160);
      const slug = slugify(req.body?.slug || name.en || name.id);
      if (!slug || !Object.keys(name).length) {
        res.status(400).json({ success: false, error: 'Category name and slug are required.' });
        return;
      }

      if (getDataSourceMode() === 'postgres') {
        const existing = (await postgresInsightRepository.listCategories('en')).find(item => item.slug === slug);
        if (existing) {
          res.status(409).json({ success: false, error: 'Insight category slug already exists.' });
          return;
        }
        const category = await postgresInsightRepository.createCategory({
          id: 'icat_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
          slug,
          name,
          description: localizedMap(req.body?.description, 1200),
          seoTitle: localizedMap(req.body?.seoTitle, 180),
          seoDescription: localizedMap(req.body?.seoDescription, 320)
        }, audit(req, 'CMS_INSIGHT_CATEGORY_CREATED', 'Created Insight category "' + slug + '".'));
        res.status(201).json({ success: true, category });
        return;
      }

      const db = getDatabase();
      if (db.cmsInsightCategories.some((item: any) => item.slug === slug)) {
        res.status(409).json({ success: false, error: 'Insight category slug already exists.' });
        return;
      }
      const now = new Date().toISOString();
      const category = {
        id: 'icat_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
        slug,
        name,
        description: localizedMap(req.body?.description, 1200),
        seoTitle: localizedMap(req.body?.seoTitle, 180),
        seoDescription: localizedMap(req.body?.seoDescription, 320),
        createdAt: now,
        updatedAt: now
      };
      db.cmsInsightCategories.push(category);
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_CATEGORY_CREATED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Created Insight category "' + slug + '".',
        severity: 'info'
      });
      res.status(201).json({ success: true, category });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight category could not be created.' });
    }
  });

  apiRouter.delete('/cms/insight-categories/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = clean(req.params.id, 120);
      if (getDataSourceMode() === 'postgres') {
        const existing = (await postgresInsightRepository.listCategories('en')).find(item => item.id === id);
        if (!existing) {
          res.status(404).json({ success: false, error: 'Insight category not found.' });
          return;
        }
        await postgresInsightRepository.deleteCategory(id, audit(req, 'CMS_INSIGHT_CATEGORY_DELETED', 'Deleted Insight category "' + existing.slug + '".', 'warning'));
        res.json({ success: true });
        return;
      }

      const db = getDatabase();
      const index = db.cmsInsightCategories.findIndex((item: any) => item.id === id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Insight category not found.' });
        return;
      }
      const deleted = db.cmsInsightCategories[index];
      db.cmsInsightCategories.splice(index, 1);
      for (const item of db.cmsInsights) {
        if (item.categoryId === id) item.categoryId = null;
      }
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_CATEGORY_DELETED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Deleted Insight category "' + deleted.slug + '".',
        severity: 'warning'
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight category could not be deleted.' });
    }
  });

  apiRouter.post('/cms/insight-authors', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const name = clean(req.body?.name, 160);
      const slug = slugify(req.body?.slug || name);
      if (!name || !slug) {
        res.status(400).json({ success: false, error: 'Author name and slug are required.' });
        return;
      }

      if (getDataSourceMode() === 'postgres') {
        const existing = (await postgresInsightRepository.listAuthors()).find(item => item.slug === slug);
        if (existing) {
          res.status(409).json({ success: false, error: 'Insight author slug already exists.' });
          return;
        }
        const author = await postgresInsightRepository.createAuthor({
          id: 'iauth_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
          slug,
          name,
          role: clean(req.body?.role, 160),
          bio: clean(req.body?.bio, 1200),
          avatar: optionalUrl(req.body?.avatar)
        }, audit(req, 'CMS_INSIGHT_AUTHOR_CREATED', 'Created Insight author "' + name + '".'));
        res.status(201).json({ success: true, author });
        return;
      }

      const db = getDatabase();
      if (db.cmsInsightAuthors.some((item: any) => item.slug === slug)) {
        res.status(409).json({ success: false, error: 'Insight author slug already exists.' });
        return;
      }
      const now = new Date().toISOString();
      const author = {
        id: 'iauth_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
        slug,
        name,
        role: clean(req.body?.role, 160),
        bio: clean(req.body?.bio, 1200),
        avatar: optionalUrl(req.body?.avatar),
        createdAt: now,
        updatedAt: now
      };
      db.cmsInsightAuthors.push(author);
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_AUTHOR_CREATED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Created Insight author "' + name + '".',
        severity: 'info'
      });
      res.status(201).json({ success: true, author });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight author could not be created.' });
    }
  });

  apiRouter.delete('/cms/insight-authors/:id', requireAuth, requirePermission('canManageCmsContent'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = clean(req.params.id, 120);
      if (getDataSourceMode() === 'postgres') {
        const existing = (await postgresInsightRepository.listAuthors()).find(item => item.id === id);
        if (!existing) {
          res.status(404).json({ success: false, error: 'Insight author not found.' });
          return;
        }
        await postgresInsightRepository.deleteAuthor(id, audit(req, 'CMS_INSIGHT_AUTHOR_DELETED', 'Deleted Insight author "' + existing.name + '".', 'warning'));
        res.json({ success: true });
        return;
      }

      const db = getDatabase();
      const index = db.cmsInsightAuthors.findIndex((item: any) => item.id === id);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Insight author not found.' });
        return;
      }
      const deleted = db.cmsInsightAuthors[index];
      db.cmsInsightAuthors.splice(index, 1);
      for (const item of db.cmsInsights) {
        if (item.authorId === id) item.authorId = null;
      }
      await saveDatabase(db);
      recordAuditLog({
        action: 'CMS_INSIGHT_AUTHOR_DELETED',
        actor: req.user!.username,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
        details: 'Deleted Insight author "' + deleted.name + '".',
        severity: 'warning'
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Insight author could not be deleted.' });
    }
  });
}
