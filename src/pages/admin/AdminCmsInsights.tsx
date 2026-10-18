
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ArrowDown,
  ArrowUp,
  HelpCircle,
  FileText,
  Globe,
  UploadCloud,
  Link,
  Pencil,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import {
  AdminDataTableShell, AdminFilterBar, AdminModuleNotice,
  AdminModuleHeader,
  AdminPageShell,
  AdminStatusBadge,
  AdminTablePagination
} from '../../components/admin/AdminModulePrimitives';
import { Drawer } from '../../components/ui/Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import type {
  InsightBlock,
  InsightBlockType,
  InsightCategory,
  InsightFaqItem,
  InsightItem,
  InsightStatus,
  InsightLanguage,
  InsightAuthor
} from '../../data/insightTypes';

const BLOCK_TYPES: Array<{ value: InsightBlockType; label: string }> = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'list', label: 'List' },
  { value: 'quote', label: 'Quote' },
  { value: 'image', label: 'Image' },
  { value: 'table', label: 'Table' },
  { value: 'callout', label: 'Callout' },
  { value: 'code', label: 'Code' },
  { value: 'link', label: 'Link' },
  { value: 'divider', label: 'Divider' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'promo', label: 'Contextual Promo' }
];

const makeEmptyBlock = (type: InsightBlockType): InsightBlock => {
  switch (type) {
    case 'heading':
      return { type, level: 2, text: '' };
    case 'list':
      return { type, ordered: false, items: [''] };
    case 'quote':
      return { type, text: '', attribution: '' };
    case 'image':
      return { type, url: '', alt: '', caption: '', width: undefined, height: undefined };
    case 'table':
      return { type, headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'callout':
      return { type, tone: 'neutral', title: '', text: '' };
    case 'code':
      return { type, language: '', code: '' };
    case 'link':
      return { type, label: '', url: '' };
    case 'checklist':
      return { type, title: '', items: [''] };
    case 'promo':
      return { type, eyebrow: '', title: '', description: '', ctaLabel: '', ctaUrl: '', serviceReference: '' };
    case 'divider':
      return { type };
    default:
      return { type: 'paragraph', text: '' };
  }
};

const emptyInsight = (language: InsightLanguage, contentGroupId?: string): InsightItem => ({
  id: '',
  contentGroupId: contentGroupId || '',
  language,
  title: '',
  slug: '',
  excerpt: '',
  content: [makeEmptyBlock('paragraph')],
  coverImage: '',
  categoryId: null,
  authorId: null,
  tags: [],
  status: 'draft',
  isFeatured: false,
  readingTime: 5,
  publishedAt: null,
  keyTakeaways: [],
  faq: [],
  relatedInsightIds: [],
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  canonicalUrl: ''
});

function slugify(value: string): string {
  return value.trim().toLowerCase().normalize('NFKD').replace(/[^\x00-\x7F]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function statusTone(status: InsightStatus): 'success' | 'warning' | 'danger' {
  if (status === 'published') return 'success';
  if (status === 'archived') return 'danger';
  return 'warning';
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold text-muted">{label}</label>
    {children}
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-xs font-semibold text-fg">
    <span className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted">{icon}</span>
    <span>{title}</span>
  </div>
);

const BlockEditor: React.FC<{
  blocks: InsightBlock[];
  onChange: (blocks: InsightBlock[]) => void;
}> = ({ blocks, onChange }) => {
  const update = (index: number, patch: Partial<InsightBlock>) => {
    onChange(blocks.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.map((item, index) => (
        <section key={index} className="rounded-card border border-line bg-bg p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <CustomSelect
              size="xs"
              value={item.type}
              onChange={(value) => onChange(blocks.map((block, blockIndex) => blockIndex === index ? makeEmptyBlock(value as InsightBlockType) : block))}
              options={BLOCK_TYPES}
              aria-label={'Block type ' + (index + 1)}
            />
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" className="h-9 w-9 px-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move block up"><ArrowUp size={15} aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" className="h-9 w-9 px-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" disabled={index === blocks.length - 1} onClick={() => move(index, 1)} aria-label="Move block down"><ArrowDown size={15} aria-hidden="true" /></Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-9 px-0 text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => onChange(blocks.filter((_, itemIndex) => itemIndex !== index))}
                aria-label="Remove block"
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>

          {item.type === 'paragraph' && (
            <textarea value={item.text || ''} onChange={(e) => update(index, { text: e.target.value })} rows={5} className="ams-control w-full text-xs leading-5" placeholder="Write the paragraph. Basic markdown such as **bold**, *italic*, and [links](https://example.com) is supported." />
          )}

          {item.type === 'heading' && (
            <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
              <CustomSelect size="xs" value={String(item.level || 2)} onChange={(value) => update(index, { level: Number(value) as 2 | 3 })} options={[{ value: '2', label: 'H2' }, { value: '3', label: 'H3' }]} />
              <input value={item.text || ''} onChange={(e) => update(index, { text: e.target.value })} className="ams-control w-full text-xs" placeholder="Heading text" />
            </div>
          )}

          {item.type === 'list' && (
            <div className="space-y-2">
              <CustomSelect size="xs" value={item.ordered ? 'ordered' : 'unordered'} onChange={(value) => update(index, { ordered: value === 'ordered' })} options={[{ value: 'unordered', label: 'Bulleted list' }, { value: 'ordered', label: 'Numbered list' }]} />
              <textarea value={(item.items || []).join('\n')} onChange={(e) => update(index, { items: e.target.value.split('\n').filter(Boolean) })} rows={5} className="ams-control w-full text-xs" placeholder="One list item per line" />
            </div>
          )}

          {item.type === 'quote' && (
            <div className="space-y-2">
              <textarea value={item.text || ''} onChange={(e) => update(index, { text: e.target.value })} rows={4} className="ams-control w-full text-xs" placeholder="Quote or commentary" />
              <input value={item.attribution || ''} onChange={(e) => update(index, { attribution: e.target.value })} className="ams-control w-full text-xs" placeholder="Attribution (optional)" />
            </div>
          )}

          {item.type === 'image' && (
            <div className="space-y-2">
              <input type="url" value={item.url || ''} onChange={(e) => update(index, { url: e.target.value })} className="ams-control w-full text-xs" placeholder="https://..." />
              <input value={item.alt || ''} onChange={(e) => update(index, { alt: e.target.value })} className="ams-control w-full text-xs" placeholder="Descriptive alt text" />
              <input value={item.caption || ''} onChange={(e) => update(index, { caption: e.target.value })} className="ams-control w-full text-xs" placeholder="Caption (optional)" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input type="number" min="1" max="6000" value={item.width || ''} onChange={(e) => update(index, { width: e.target.value ? Number(e.target.value) : undefined })} className="ams-control w-full text-xs" placeholder="Width (optional)" />
                <input type="number" min="1" max="6000" value={item.height || ''} onChange={(e) => update(index, { height: e.target.value ? Number(e.target.value) : undefined })} className="ams-control w-full text-xs" placeholder="Height (optional)" />
              </div>
            </div>
          )}

          {item.type === 'table' && (
            <div className="space-y-2">
              <input value={(item.headers || []).join(' | ')} onChange={(e) => update(index, { headers: e.target.value.split('|').map(value => value.trim()).filter(Boolean) })} className="ams-control w-full text-xs" placeholder="Header 1 | Header 2 | Header 3" />
              <textarea
                value={JSON.stringify(item.rows || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) update(index, { rows: parsed });
                  } catch {}
                }}
                rows={7}
                className="ams-control w-full font-mono text-[11px]"
                placeholder='[["Row 1 value","Row 1 value"],["Row 2 value","Row 2 value"]]'
              />
            </div>
          )}

          {item.type === 'callout' && (
            <div className="space-y-2">
              <CustomSelect
                size="xs"
                value={item.tone || 'neutral'}
                onChange={(value) => update(index, { tone: value as InsightBlock['tone'] })}
                options={[
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'info', label: 'Info' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' }
                ]}
              />
              <input value={item.title || ''} onChange={(e) => update(index, { title: e.target.value })} className="ams-control w-full text-xs" placeholder="Callout title (optional)" />
              <textarea value={item.text || ''} onChange={(e) => update(index, { text: e.target.value })} rows={4} className="ams-control w-full text-xs" placeholder="Callout text" />
            </div>
          )}

          {item.type === 'code' && (
            <div className="space-y-2">
              <input value={item.language || ''} onChange={(e) => update(index, { language: e.target.value })} className="ams-control w-full text-xs" placeholder="Language, e.g. typescript" />
              <textarea value={item.code || ''} onChange={(e) => update(index, { code: e.target.value })} rows={8} className="ams-control w-full font-mono text-[11px]" placeholder="Code snippet" />
            </div>
          )}

          {item.type === 'link' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={item.label || ''} onChange={(e) => update(index, { label: e.target.value })} className="ams-control w-full text-xs" placeholder="Link label" />
              <input type="url" value={item.url || ''} onChange={(e) => update(index, { url: e.target.value })} className="ams-control w-full text-xs" placeholder="https://..." />
            </div>
          )}

          {item.type === 'checklist' && (
            <div className="space-y-2">
              <input value={item.title || ''} onChange={(e) => update(index, { title: e.target.value })} className="ams-control w-full text-xs" placeholder="Checklist title (optional)" />
              <textarea value={(item.items || []).join('\n')} onChange={(e) => update(index, { items: e.target.value.split('\n').filter(Boolean) })} rows={6} className="ams-control w-full text-xs leading-5" placeholder="One checklist item per line" />
            </div>
          )}

          {item.type === 'promo' && (
            <div className="space-y-2">
              <input value={item.eyebrow || ''} onChange={(e) => update(index, { eyebrow: e.target.value })} className="ams-control w-full text-xs" placeholder="Eyebrow, e.g. MVP & Product Design" />
              <input value={item.title || ''} onChange={(e) => update(index, { title: e.target.value })} className="ams-control w-full text-xs" placeholder="Promotion title" />
              <textarea value={item.description || ''} onChange={(e) => update(index, { description: e.target.value })} rows={4} className="ams-control w-full text-xs leading-5" placeholder="Short contextual description" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={item.ctaLabel || ''} onChange={(e) => update(index, { ctaLabel: e.target.value })} className="ams-control w-full text-xs" placeholder="CTA label" />
                <input type="url" value={item.ctaUrl || ''} onChange={(e) => update(index, { ctaUrl: e.target.value })} className="ams-control w-full text-xs" placeholder="https://..." />
              </div>
              <input value={item.serviceReference || ''} onChange={(e) => update(index, { serviceReference: e.target.value })} className="ams-control w-full text-xs" placeholder="Service reference (optional)" />
            </div>
          )}

          {item.type === 'divider' && <p className="text-[11px] text-muted">A semantic divider will separate the surrounding content.</p>}
        </section>
      ))}

      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.slice(0, 6).map((item) => (
          <Button key={item.value} type="button" variant="secondary" icon={<Plus size={12} />} onClick={() => onChange([...blocks, makeEmptyBlock(item.value)])}>
            {item.label}
          </Button>
        ))}
        <CustomSelect
          size="xs"
          value=""
          onChange={(value) => value && onChange([...blocks, makeEmptyBlock(value as InsightBlockType)])}
          options={BLOCK_TYPES}
          placeholder="More block types"
        />
      </div>
    </div>
  );
};

const InsightEditor: React.FC<{
  value: InsightItem;
  categories: InsightCategory[];
  authors: InsightAuthor[];
  onChange: (value: InsightItem) => void;
  language: InsightLanguage;
  variantMode: boolean;
}> = ({ value, categories, authors, onChange, language, variantMode }) => {
  const update = (patch: Partial<InsightItem>) => onChange({ ...value, ...patch });
  const tagsInput = (value.tags || []).map(tag => tag.name).join(', ');
  const faqs: InsightFaqItem[] = value.faq || [];
  const [mediaError, setMediaError] = useState('');

  const handleImageUpload = (file: File, field: 'coverImage' | 'ogImage') => {
    const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowed.has(file.type)) {
      setMediaError('Only PNG, JPG, and WebP images are supported.');
      return;
    }
    if (file.size > 350 * 1024) {
      setMediaError('Local image uploads are limited to 350KB. Use a hosted image URL for larger assets.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setMediaError('The image could not be processed.');
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setMediaError('');
        update({ [field]: result } as Partial<InsightItem>);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 pb-4">
      <section className="rounded-card border border-line bg-bg p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Language">
            <CustomSelect size="sm" value={value.language} onChange={(next) => update({ language: next as InsightLanguage })} options={[
              { value: 'id', label: 'Bahasa Indonesia' },
              { value: 'en', label: 'English' }
            ]} />
          </Field>
          <Field label="Status">
            <CustomSelect size="sm" value={value.status} onChange={(next) => update({ status: next as InsightStatus })} options={[
              { value: 'draft', label: 'Draft', badge: 'DRAFT', badgeColor: 'border border-warning/20 bg-warning/10 text-warning' },
              { value: 'published', label: 'Published', badge: 'LIVE', badgeColor: 'border border-success/20 bg-success/10 text-success' },
              { value: 'archived', label: 'Archived', badge: 'ARCHIVED', badgeColor: 'border border-danger/20 bg-danger/10 text-danger' }
            ]} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Title *">
            <input required value={value.title} onChange={(e) => update({ title: e.target.value, slug: value.slug || slugify(e.target.value) })} className="ams-control w-full text-sm" placeholder={language === 'id' ? 'Judul Insight' : 'Insight title'} />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Slug *">
            <input required value={value.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} className="ams-control w-full text-xs" placeholder="article-slug" />
          </Field>
          <Field label="Content group ID">
            <input value={value.contentGroupId} onChange={(e) => update({ contentGroupId: e.target.value })} className="ams-control w-full font-mono text-[11px]" placeholder="Generated automatically when blank" />
          </Field>
        </div>

        {variantMode && (
          <div className="mt-3 rounded-control border border-info/20 bg-info/10 p-3 text-xs leading-5 text-info">
            This creates a new language variant inside the same logical article group. Write the localized title and content independently.
          </div>
        )}

        <div className="mt-4">
          <Field label="Excerpt">
            <textarea rows={3} value={value.excerpt || ''} onChange={(e) => update({ excerpt: e.target.value })} className="ams-control w-full text-xs leading-5" placeholder="Search-friendly editorial summary" />
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-line bg-bg p-4">
        <SectionTitle icon={<FileText size={14} />} title="Editorial" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <CustomSelect
              size="sm"
              value={value.categoryId || ''}
              onChange={(next) => update({ categoryId: next || null })}
              placeholder="No category"
              options={[
                { value: '', label: 'No category' },
                ...categories.map(category => ({ value: category.id, label: category.displayName || category.name.en || category.name.id || category.slug }))
              ]}
            />
          </Field>
          <Field label="Author">
            <CustomSelect
              size="sm"
              value={value.authorId || ''}
              onChange={(next) => update({ authorId: next || null })}
              placeholder="No author"
              options={[
                { value: '', label: 'No author' },
                ...authors.map(author => ({ value: author.id, label: author.name }))
              ]}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Reviewed by">
            <input value={value.editorialMeta?.reviewedBy || ''} onChange={(e) => update({ editorialMeta: { ...(value.editorialMeta || {}), reviewedBy: e.target.value } })} className="ams-control w-full text-xs" placeholder="Only use a real reviewer" />
          </Field>
          <Field label="Fact checked by">
            <input value={value.editorialMeta?.factCheckedBy || ''} onChange={(e) => update({ editorialMeta: { ...(value.editorialMeta || {}), factCheckedBy: e.target.value } })} className="ams-control w-full text-xs" placeholder="Only use a real fact checker" />
          </Field>
          <Field label="Editorial type">
            <input value={value.editorialMeta?.editorialType || ''} onChange={(e) => update({ editorialMeta: { ...(value.editorialMeta || {}), editorialType: e.target.value } })} className="ams-control w-full text-xs" placeholder="Guide, analysis, perspective..." />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Tags">
            <input
              value={tagsInput}
              onChange={(e) => update({ tags: e.target.value.split(',').map(name => name.trim()).filter(Boolean).map(name => ({ slug: slugify(name), name })) })}
              className="ams-control w-full text-xs"
              placeholder="ui/ux, design system, product design"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Reading time (minutes)">
            <input type="number" min={1} max={180} value={value.readingTime || 5} onChange={(e) => update({ readingTime: Number(e.target.value) || 1 })} className="ams-control w-full text-xs" />
          </Field>
          <Field label="Publish date">
            <input
              type="datetime-local"
              value={value.publishedAt ? new Date(value.publishedAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => update({ publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="ams-control w-full text-xs"
            />
          </Field>
          <label className="flex min-h-10 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-muted">
            <input type="checkbox" checked={Boolean(value.isFeatured)} onChange={(e) => update({ isFeatured: e.target.checked })} className="accent-accent" />
            Featured Insight
          </label>
        </div>
      </section>

      <section className="rounded-card border border-line bg-bg p-4">
        <SectionTitle icon={<Pencil size={14} />} title="Key Takeaways" />
        <textarea
          value={(value.keyTakeaways || []).join('\n')}
          onChange={(e) => update({ keyTakeaways: e.target.value.split('\n').map(item => item.trim()).filter(Boolean) })}
          rows={5}
          className="ams-control mt-3 w-full text-xs leading-5"
          placeholder="One takeaway per line"
        />
      </section>

      <section className="rounded-card border border-line bg-bg p-4">
        <SectionTitle icon={<FileText size={14} />} title="Article Body" />
        <div className="mt-3">
          <BlockEditor blocks={value.content || []} onChange={(content) => update({ content })} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-bg p-4">
        <SectionTitle icon={<HelpCircle size={14} />} title="FAQ" />
        <div className="mt-3 space-y-3">
          {faqs.map((item, index) => (
            <div key={index} className="rounded-control border border-line bg-panel p-3">
              <input value={item.question} onChange={(e) => update({ faq: faqs.map((entry, itemIndex) => itemIndex === index ? { ...entry, question: e.target.value } : entry) })} className="ams-control w-full text-xs" placeholder="Question" />
              <textarea value={item.answer} onChange={(e) => update({ faq: faqs.map((entry, itemIndex) => itemIndex === index ? { ...entry, answer: e.target.value } : entry) })} rows={3} className="ams-control mt-2 w-full text-xs" placeholder="Answer" />
              <Button type="button" variant="ghost" className="mt-2 h-8 px-2 text-danger" onClick={() => update({ faq: faqs.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>
            </div>
          ))}
          <Button type="button" variant="secondary" icon={<Plus size={12} />} onClick={() => update({ faq: [...faqs, { question: '', answer: '' }] })}>Add FAQ</Button>
        </div>
      </section>

      <section className="rounded-card border border-line bg-bg p-4">
        <SectionTitle icon={<Search size={14} />} title="SEO & Media" />
        {mediaError && <p className="mt-3 rounded-control border border-danger/20 bg-danger/10 p-3 text-xs leading-5 text-danger">{mediaError}</p>}

        <div className="mt-3 space-y-4">
          {(['coverImage', 'ogImage'] as const).map((field) => {
            const isCover = field === 'coverImage';
            const label = isCover ? 'Cover image' : 'Open Graph image';
            const currentValue = value[field] || '';
            return (
              <div key={field} className="rounded-control border border-line bg-panel p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-fg">{label}</p>
                    <p className="mt-1 text-[10px] leading-5 text-muted">Local PNG/JPG/WebP up to 350KB or use a hosted URL.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border border-line bg-bg px-3 py-2 text-[11px] font-semibold text-fg transition-colors hover:border-accent/30 hover:text-accent-text">
                    <UploadCloud size={13} />
                    Upload image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleImageUpload(file, field);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                {currentValue && (
                  <div className="mt-3 overflow-hidden rounded-control border border-line bg-bg">
                    <img src={currentValue} alt="" className="max-h-56 w-full object-cover" />
                  </div>
                )}
                <input
                  type="url"
                  value={currentValue.startsWith('data:image/') ? '' : currentValue}
                  onChange={(e) => update({ [field]: e.target.value })}
                  className="ams-control mt-3 w-full text-xs"
                  placeholder="https://..."
                />
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <Field label="SEO title">
            <input value={value.seoTitle || ''} onChange={(e) => update({ seoTitle: e.target.value })} className="ams-control w-full text-xs" placeholder="Localized search result title" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="SEO description">
            <textarea rows={3} value={value.seoDescription || ''} onChange={(e) => update({ seoDescription: e.target.value })} className="ams-control w-full text-xs leading-5" placeholder="Localized meta description" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Canonical URL">
            <input type="url" value={value.canonicalUrl || ''} onChange={(e) => update({ canonicalUrl: e.target.value })} className="ams-control w-full text-xs" placeholder="Leave blank to use the localized public URL" />
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-line bg-bg p-4">
        <SectionTitle icon={<Link size={14} />} title="Related Insights" />
        <textarea
          value={(value.relatedInsightIds || []).join(', ')}
          onChange={(e) => update({ relatedInsightIds: e.target.value.split(',').map(item => item.trim()).filter(Boolean) })}
          rows={3}
          className="ams-control mt-3 w-full font-mono text-[11px]"
          placeholder="ins_123, ins_456"
        />
      </section>

      {value.status === 'published' && value.slug && (
        <a href={'https://kapitech.id/insights/' + value.slug} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-info hover:text-fg">
          Open public article <ArrowUpRight size={13} />
        </a>
      )}
    </div>
  );
};

export const AdminCmsInsights: React.FC = () => {
  const { language } = useLanguage();
  const [items, setItems] = useState<InsightItem[]>([]);
  const [categories, setCategories] = useState<InsightCategory[]>([]);
  const [authors, setAuthors] = useState<InsightAuthor[]>([]);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [variantMode, setVariantMode] = useState(false);
  const [editing, setEditing] = useState<InsightItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InsightItem | null>(null);
  const [total, setTotal] = useState(0);
  const loadRequestId = useRef(0);

  const load = async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.cms.getInsights({
        page,
        pageSize,
        language: languageFilter || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        authorId: authorFilter || undefined,
        featured: featuredFilter === '' ? undefined : featuredFilter === 'true',
        search: search || undefined
      });
      if (requestId !== loadRequestId.current) return;
      if (!res.success) throw new Error(res.error || 'Unable to load Insights.');

      const nextTotal = Math.max(0, Number(res.data?.meta?.total) || 0);
      const lastPage = Math.max(1, Math.ceil(nextTotal / pageSize));
      setTotal(nextTotal);
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }

      setItems((res.data?.insights || []) as InsightItem[]);
    } catch (error) {
      if (requestId === loadRequestId.current) {
        setLoadError(error instanceof Error ? error.message : 'Unable to load Insights.');
      }
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  };

  const loadTaxonomy = async () => {
    const [categoryRes, authorRes] = await Promise.all([
      api.cms.getInsightCategories('en'),
      api.cms.getInsightAuthors()
    ]);
    if (categoryRes.success) setCategories((categoryRes.data?.categories || []) as InsightCategory[]);
    if (authorRes.success) setAuthors((authorRes.data?.authors || []) as InsightAuthor[]);
  };

  useEffect(() => { void loadTaxonomy(); }, []);
  useEffect(() => {
    void load();
    return () => {
      // A response from an obsolete page/filter request must never replace newer results.
      loadRequestId.current += 1;
    };
  }, [page, pageSize, languageFilter, statusFilter, categoryFilter, authorFilter, featuredFilter, search]);


  const statusOptions = useMemo(() => [
    { value: '', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ], []);

  const languageOptions = useMemo(() => [
    { value: '', label: 'All languages' },
    { value: 'id', label: 'ID' },
    { value: 'en', label: 'EN' }
  ], []);

  const handleOpenAdd = () => {
    setVariantMode(false);
    setEditing(emptyInsight(language === 'id' ? 'id' : 'en'));
    setEditorOpen(true);
  };

  const handleOpenEdit = async (item: InsightItem) => {
    setVariantMode(false);
    const res = await api.cms.getInsightBySlug(item.slug);
    setEditing(res.success && res.data?.insight ? res.data.insight as InsightItem : item);
    setEditorOpen(true);
  };

  const handleOpenVariant = (item: InsightItem) => {
    setVariantMode(true);
    setEditing({
      ...emptyInsight(item.language === 'id' ? 'en' : 'id', item.contentGroupId),
      categoryId: item.categoryId || null,
      authorId: item.authorId || null,
      relatedInsightIds: item.relatedInsightIds || [],
      status: 'draft'
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!editing?.title.trim() || !editing.slug.trim()) {
      setStatusMessage('Title and slug are required.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...editing,
        content: editing.content || [],
        keyTakeaways: editing.keyTakeaways || [],
        faq: editing.faq || [],
        tags: (editing.tags || []).filter(tag => tag.name.trim()),
        relatedInsightIds: editing.relatedInsightIds || []
      };
      const res = editing.id
        ? await api.cms.updateInsight(editing.id, body)
        : await api.cms.createInsight(body);

      if (!res.success) {
        setStatusMessage(res.error || 'Insight could not be saved.');
        return;
      }

      setEditorOpen(false);
      setEditing(null);
      setStatusMessage(editing.id ? 'Insight updated successfully.' : 'Insight created as a draft.');
      await load();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Insight could not be saved.');
    } finally {
      setSaving(false);
      window.setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await api.cms.deleteInsight(deleteTarget.id);
      if (!res.success) {
        setStatusMessage(res.error || 'Insight could not be deleted.');
        return;
      }
      setDeleteTarget(null);
      setStatusMessage('Insight deleted.');
      await load();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Insight could not be deleted.');
    } finally {
      setSaving(false);
      window.setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  return (
    <AdminPageShell featureSlug="cms-insights-module" className="ams-cms-module">
      <AdminModuleHeader
        slug="cms-insights-header"
        title="Insights"
        description={language === 'id'
          ? 'Kelola artikel editorial, SEO, bahasa, taxonomy, dan publishing workflow Kapitech Insight.'
          : 'Manage editorial articles, SEO, language variants, taxonomy, and the Kapitech Insight publishing workflow.'}
        actions={<Button type="button" variant="primary" icon={<Plus size={14} />} onClick={handleOpenAdd}>Create Insight</Button>}
      />
      <AdminFilterBar
        slug="cms-insights-filters"
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search title, excerpt, slug, or tags..."
        searchLabel="Search Insights"
        actions={(
          <div className="flex flex-wrap gap-2">
            <CustomSelect size="xs" value={languageFilter} onChange={(value) => { setLanguageFilter(value); setPage(1); }} options={languageOptions} />
            <CustomSelect size="xs" value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1); }} options={statusOptions} />
            <CustomSelect
              size="xs"
              value={categoryFilter}
              onChange={(value) => { setCategoryFilter(value); setPage(1); }}
              options={[{ value: '', label: 'All categories' }, ...categories.map(category => ({
                value: category.id,
                label: category.displayName || category.name.en || category.name.id || category.slug
              }))]}
            />
            <CustomSelect
              size="xs"
              value={authorFilter}
              onChange={(value) => { setAuthorFilter(value); setPage(1); }}
              options={[{ value: '', label: 'All authors' }, ...authors.map(author => ({ value: author.id, label: author.name }))]}
            />
            <CustomSelect
              size="xs"
              value={featuredFilter}
              onChange={(value) => { setFeaturedFilter(value); setPage(1); }}
              options={[
                { value: '', label: 'All content' },
                { value: 'true', label: 'Featured' },
                { value: 'false', label: 'Not featured' }
              ]}
            />
          </div>
        )}
      />

{statusMessage && (
        <AdminModuleNotice
          tone={/failed|could not|unable|error|gagal|wajib|required/i.test(statusMessage) ? 'danger' : 'success'}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage}
        </AdminModuleNotice>
      )}



      <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
        <span>{total} {total === 1 ? 'Insight' : 'Insights'}</span>
        <span>CMS editorial directory</span>
      </div>

      {loading ? (
        <div className="rounded-card border border-line bg-panel p-6 text-xs text-muted">Loading Insights…</div>
      ) : loadError ? (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-5">
          <p className="text-sm font-semibold text-fg">Unable to load Insights</p>
          <p className="mt-1 text-xs leading-5 text-muted">{loadError}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void load()}>Retry</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-card border border-line bg-panel px-6 py-12 text-center">
          <FileText size={24} className="text-muted" />
          <p className="mt-3 text-sm font-semibold text-fg">No Insights yet</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted">Create the first draft from AMS. Nothing is published until an editor explicitly sets the status to Published.</p>
          <Button className="mt-4" variant="secondary" icon={<Plus size={13} />} onClick={handleOpenAdd}>Create Insight</Button>
        </div>
      ) : (
        <AdminDataTableShell slug="cms-insights-directory">
          <div className="overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable insights register">
            <table className="ams-data-table w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-3 py-3">Language</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Author</th>
                  <th className="px-3 py-3">Published</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map(item => (
                  <tr key={item.id} className="h-12 transition-colors hover:bg-bg/60">
                    <td className="max-w-[360px] px-4 py-2.5">
                      <button type="button" className="block max-w-full text-left" onClick={() => void handleOpenEdit(item)}>
                        <span className="block truncate text-[12px] font-semibold text-fg hover:text-accent-text">{item.title || 'Untitled'}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted">{item.slug}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center gap-1.5">
                        <AdminStatusBadge tone="info">{item.language.toUpperCase()}</AdminStatusBadge>
                        {item.alternateLanguages && item.alternateLanguages.length > 1 && <Globe size={12} className="text-muted" aria-label="Language variant linked" />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{item.category?.displayName || item.category?.slug || '—'}</td>
                    <td className="px-3 py-2.5"><AdminStatusBadge tone={statusTone(item.status)}>{item.status}</AdminStatusBadge></td>
                    <td className="px-3 py-2.5 text-muted">{item.author?.name || '—'}</td>
                    <td className="px-3 py-2.5 text-muted">{formatDate(item.publishedAt)}</td>
                    <td className="px-3 py-2.5 text-muted">{formatDate(item.updatedAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:text-fg" onClick={() => void handleOpenEdit(item)} aria-label="Edit Insight"><Pencil size={13} /></button>
                        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:text-fg" onClick={() => handleOpenVariant(item)} aria-label="Create language variant"><Globe size={13} /></button>
                        {item.status === 'published' && <a href={'https://kapitech.id/insights/' + item.slug} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:text-fg" aria-label="Open public Insight"><ArrowUpRight size={13} /></a>}
                        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:border-danger/30 hover:text-danger" onClick={() => setDeleteTarget(item)} aria-label="Delete Insight"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminTablePagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="insights" slug="cms-insights-pagination" />
        </AdminDataTableShell>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Insight?"
        description={deleteTarget ? 'This will permanently remove "' + deleteTarget.title + '" from the CMS.' : ''}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onClose={() => !saving && setDeleteTarget(null)}
        loading={saving}
      />

      <Drawer
        slug="cms-insight-editor-drawer"
        open={editorOpen && Boolean(editing)}
        onClose={() => !saving && setEditorOpen(false)}
        size="2xl"
        title={editing?.id ? 'Edit Insight' : variantMode ? 'Create Language Variant' : 'Create Insight'}
        description="Editorial content is stored as structured blocks and delivered through the public API."
        footer={editing ? (
          <>
            <Button type="button" variant="secondary" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="button" variant="primary" onClick={() => void handleSave()} loading={saving}>{editing.status === 'published' ? 'Save & Publish' : 'Save Draft'}</Button>
          </>
        ) : null}
      >
        {editing && <InsightEditor value={editing} categories={categories} authors={authors} onChange={setEditing} language={editing.language} variantMode={variantMode} />}
      </Drawer>
    </AdminPageShell>
  );
};

export default AdminCmsInsights;
