export type InsightLanguage = 'id' | 'en';
export type InsightStatus = 'draft' | 'published' | 'archived';

export type InsightBlockType =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'quote'
  | 'image'
  | 'table'
  | 'callout'
  | 'code'
  | 'link'
  | 'divider'
  | 'checklist'
  | 'promo';

export interface InsightBlock {
  type: InsightBlockType;
  level?: 2 | 3;
  text?: string;
  ordered?: boolean;
  items?: string[];
  attribution?: string;
  url?: string;
  eyebrow?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  serviceReference?: string;
  alt?: string;
  caption?: string;
  headers?: string[];
  rows?: string[][];
  width?: number;
  height?: number;
  title?: string;
  tone?: 'info' | 'warning' | 'success' | 'neutral';
  code?: string;
  language?: string;
  label?: string;
}


export interface InsightFaqItem {
  question: string;
  answer: string;
}

export interface InsightAuthor {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
}

export interface InsightCategory {
  id: string;
  slug: string;
  name: Record<string, string>;
  displayName?: string;
  description?: Record<string, string>;
  seoTitle?: Record<string, string>;
  seoDescription?: Record<string, string>;
}

export interface InsightItem {
  id: string;
  contentGroupId: string;
  language: InsightLanguage;
  title: string;
  slug: string;
  excerpt?: string;
  content?: InsightBlock[];
  coverImage?: string;
  categoryId?: string | null;
  category?: InsightCategory | null;
  authorId?: string | null;
  author?: InsightAuthor | null;
  tags?: Array<{ id?: string; slug: string; name: string }>;
  status: InsightStatus;
  isFeatured?: boolean;
  readingTime?: number;
  publishedAt?: string | null;
  updatedAt?: string;
  keyTakeaways?: string[];
  faq?: InsightFaqItem[];
  relatedInsightIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  alternateLanguages?: Array<{ language: InsightLanguage; slug: string }>;
  relatedInsights?: InsightItem[];
  editorialMeta?: {
    reviewedBy?: string;
    factCheckedBy?: string;
    editorialType?: string;
  };
}
