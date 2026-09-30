import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { cn } from '../../lib/cn';

export interface AdminModuleHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const AdminModuleHeader: React.FC<AdminModuleHeaderProps> = ({
  title,
  description,
  eyebrow,
  icon,
  actions,
  className
}) => (
  <header className={cn(
    'ams-dashboard-header mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between',
    className
  )}>
    <div className="min-w-0">
      {eyebrow && <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted">{eyebrow}</div>}
      <h1 className="flex min-w-0 items-center gap-2.5 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">
        {icon && <span className="shrink-0 text-accent-text">{icon}</span>}
        <span className="min-w-0 truncate">{title}</span>
      </h1>
      {description && (
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
        {actions}
      </div>
    )}
  </header>
);

export interface AdminMetric {
  id?: string;
  slug?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  context?: React.ReactNode;
  change?: React.ReactNode;
  changeToneClassName?: string;
  sparkline?: number[];
  sparklineLabel?: string;
  icon?: React.ReactNode;
  toneClassName?: string;
}

export interface AdminMetricStripProps {
  metrics: AdminMetric[];
  className?: string;
  itemClassName?: string;
}

const normalizeMetricSeries = (values: number[]) => {
  const safe = values.filter((value) => Number.isFinite(value));
  if (!safe.length) return [0, 0];
  return safe;
};

const MetricSparkline: React.FC<{ values?: number[]; label: React.ReactNode; toneClassName?: string }> = ({ values = [], label, toneClassName = 'text-accent-text' }) => {
  const series = normalizeMetricSeries(values);
  const width = 112;
  const height = 44;
  const pad = 4;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = Math.max(1, max - min);
  const pointX = (index: number) => pad + (series.length <= 1 ? (width - pad * 2) / 2 : (index / (series.length - 1)) * (width - pad * 2));
  const pointY = (value: number) => height - pad - ((value - min) / range) * (height - pad * 2);
  const points = series.map((value, index) => ({ x: pointX(index), y: pointY(value), value }));
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`;
  const color = toneClassName.includes('text-success') ? 'var(--success)' : toneClassName.includes('text-warning') ? 'var(--warning)' : toneClassName.includes('text-danger') ? 'var(--danger)' : toneClassName.includes('text-info') ? 'var(--info)' : 'var(--series-1)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-11 w-[112px] shrink-0 overflow-visible" role="img" aria-label={`${String(label)} metric trend`}>
      <defs>
        <linearGradient id={`metric-fill-${String(label).replace(/[^a-z0-9]/gi, '-').toLowerCase()}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="var(--line)" strokeWidth="1" />
      <path d={areaPath} fill={`url(#metric-fill-${String(label).replace(/[^a-z0-9]/gi, '-').toLowerCase()})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.8" fill={color} />
    </svg>
  );
};

export const AdminMetricCard: React.FC<AdminMetric & { className?: string }> = ({
  label, value, context, change, changeToneClassName = 'text-muted', sparkline, icon, toneClassName = 'text-fg', slug, id, className
}) => (
  <article data-ams-slug={slug || (id ? 'metric-' + String(id).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() : undefined)} className={cn('ams-dashboard-card rounded-card border border-line bg-panel p-4 transition-colors hover:bg-panel-hover', className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="block truncate text-xs font-medium leading-4 text-muted">{label}</span>
        {(slug || id) && (
          <span className="mt-1 block font-mono text-[9px] leading-3 text-muted/60">
            slug: {slug || 'metric-' + String(id).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()}
          </span>
        )}
      </div>
      {icon && <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg', toneClassName)}>{icon}</span>}
    </div>
    <div className="mt-3 flex min-w-0 items-end justify-between gap-4">
      <div className={cn('min-w-0 truncate text-2xl font-semibold leading-8 tracking-[-0.02em] tabular-nums', toneClassName)}>{value}</div>
      <MetricSparkline values={sparkline} label={label} toneClassName={toneClassName} />
    </div>
    {(change !== undefined || context !== undefined) && (
      <div className="mt-2 flex min-h-5 min-w-0 items-center gap-2">
        {change !== undefined && <span className={cn('shrink-0 text-[11px] font-medium tabular-nums', changeToneClassName)}>{change}</span>}
        {context !== undefined && <span className="min-w-0 truncate text-[11px] leading-4 text-muted">{context}</span>}
      </div>
    )}
  </article>
);

export const AdminMetricStrip: React.FC<AdminMetricStripProps> = ({ metrics, className, itemClassName }) => (
  <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
    {metrics.map((metric) => <AdminMetricCard key={metric.id || String(metric.label)} {...metric} className={itemClassName} />)}
  </div>
);

export interface AdminFilterBarProps {
  slug?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel = 'Search',
  children,
  actions,
  className,
  slug
}) => (
  <section data-ams-slug={slug} className={cn(
    'ams-filter-bar rounded-card border border-line bg-panel p-4',
    className
  )}>
    {slug && <div className="mb-3 font-mono text-[9px] leading-3 text-muted/60">slug: {slug}</div>}
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {onSearchChange && (
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{searchLabel}</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted"
            />
            <input
              value={searchValue || ''}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
              className="h-9 min-h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent"
            />
          </label>
        )}
        {children}
      </div>
      {actions && (
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {actions}
        </div>
      )}
    </div>
  </section>
);

export interface AdminPanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  slug?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  slug
}) => (
  <section data-ams-slug={slug} className={cn('rounded-card border border-line bg-panel', className)}>
    {(title || description || actions) && (
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
          {slug && <p className="mt-1 font-mono text-[9px] leading-3 text-muted/60">slug: {slug}</p>}
        </div>
        {actions && <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap sm:items-center">{actions}</div>}
      </div>
    )}
    <div className={cn('min-w-0', bodyClassName)}>{children}</div>
  </section>
);


export interface AdminTablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
  slug?: string;
  secondaryLabel?: React.ReactNode;
}

export const AdminTablePagination: React.FC<AdminTablePaginationProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  pageSizeOptions = [6, 10, 20, 50],
  slug,
  secondaryLabel
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const first = total > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const last = Math.min(safePage * pageSize, total);
  const pageStart = Math.max(1, Math.min(safePage - 2, totalPages - 4));
  const pageEnd = Math.min(totalPages, pageStart + 4);

  return (
    <div
      className="flex flex-col gap-3 border-t border-line bg-panel px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
      data-ams-slug={slug}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-muted">
          Showing <span className="font-semibold tabular-nums text-fg">{first}</span>
          {' '}to{' '}
          <span className="font-semibold tabular-nums text-fg">{last}</span>
          {' '}of{' '}
          <span className="font-semibold tabular-nums text-fg">{total}</span>
          {' '}{itemLabel}
        </span>
        {secondaryLabel && <span className="hidden text-muted sm:inline">{secondaryLabel}</span>}
      </div>

      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
        <span className="shrink-0 text-[10px] text-muted">Rows per page</span>
        <CustomSelect
          value={String(pageSize)}
          onChange={(value) => {
            const nextSize = Number(value);
            onPageSizeChange(nextSize);
            onPageChange(1);
          }}
          options={pageSizeOptions.map((value) => ({ value: String(value), label: String(value) }))}
          triggerClassName="h-8 min-h-8 w-[72px] shrink-0"
          aria-label="Rows per page"
        />

        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          aria-label="Previous page"
          data-ams-slug={slug ? slug + '-prev' : undefined}
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {Array.from({ length: Math.max(0, pageEnd - pageStart + 1) }, (_, index) => {
          const pageNumber = pageStart + index;
          return (
            <button
              key={pageNumber}
              type="button"
              aria-current={safePage === pageNumber ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
              className={'h-8 w-8 shrink-0 rounded-control border px-0 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (
                safePage === pageNumber
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-bg text-muted hover:bg-panel hover:text-fg'
              )}
              data-ams-slug={slug ? slug + '-page-' + pageNumber : undefined}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          aria-label="Next page"
          data-ams-slug={slug ? slug + '-next' : undefined}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AdminModuleHeader;
