import React, { useId } from 'react';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { CustomSelect } from '../ui/CustomSelect';
import { cn } from '../../lib/cn';

export { Skeleton } from '../ui/Skeleton';


export interface AdminPageShellProps {
  children: React.ReactNode;
  className?: string;
  featureSlug?: string;
}

export const AdminPageShell: React.FC<AdminPageShellProps> = ({
  children,
  className,
  featureSlug
}) => (
  <div
    data-ams-feature-slug={featureSlug}
    data-ams-slug={featureSlug}
    className={cn('ams-page-shell min-h-full min-w-0 pb-10', className)}
  >
    {children}
  </div>
);

export interface AdminSectionTabItem {
  key: string;
  label: string;
  to: string;
}

export interface AdminSectionTabsProps {
  items: AdminSectionTabItem[];
  activeKey: string;
  ariaLabel: string;
  className?: string;
}

export const AdminSectionTabs: React.FC<AdminSectionTabsProps> = ({
  items,
  activeKey,
  ariaLabel,
  className
}) => (
  <nav
    aria-label={ariaLabel}
    className={cn(
      'flex max-w-full min-w-0 items-center gap-1 overflow-x-auto rounded-control border border-line bg-panel p-1 ams-topnav-scroll',
      className
    )}
  >
    {items.map((item) => {
      const active = activeKey === item.key;
      return (
        <NavLink
          key={item.key}
          to={item.to}
          end
          aria-current={active ? 'page' : undefined}
          data-ams-slug={item.key}
          className={cn(
            'inline-flex min-h-8 shrink-0 items-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            active
              ? 'border-accent/25 bg-accent/10 font-semibold text-fg'
              : 'border-transparent text-muted hover:bg-bg hover:text-fg'
          )}
        >
          {item.label}
        </NavLink>
      );
    })}
  </nav>
);

export type AdminCmsSectionKey = 'projects' | 'services' | 'testimonials' | 'insights' | 'careers';

const CMS_SECTION_ITEMS: AdminSectionTabItem[] = [
  { key: 'projects', label: 'Projects', to: '/admin/cms/projects' },
  { key: 'services', label: 'Services', to: '/admin/cms/services' },
  { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials' },
  { key: 'insights', label: 'Insights', to: '/admin/cms/insights' },
  { key: 'careers', label: 'Careers', to: '/admin/cms/careers' },
];

export const AdminCmsSectionTabs: React.FC<{ activeKey: AdminCmsSectionKey }> = ({ activeKey }) => (
  <div className="min-[900px]:hidden min-w-0 ams-cms-section-tabs" data-ams-slug="cms-mobile-tabs" data-ams-feature-slug="cms-sections">
    <AdminSectionTabs
      ariaLabel="CMS sections"
      activeKey={activeKey}
      items={CMS_SECTION_ITEMS}
    />
  </div>
);

export type AdminModuleNoticeTone = 'success' | 'danger' | 'warning' | 'info';

export interface AdminModuleNoticeProps {
  tone: AdminModuleNoticeTone;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  slug?: string;
}

export const AdminModuleNotice: React.FC<AdminModuleNoticeProps> = ({
  tone,
  children,
  onDismiss,
  className,
  slug
}) => {
  const toneStyles = {
    success: { Icon: CheckCircle2, classes: 'border-success/25 bg-success/10 text-success' },
    danger: { Icon: AlertCircle, classes: 'border-danger/25 bg-danger/10 text-danger' },
    warning: { Icon: AlertTriangle, classes: 'border-warning/25 bg-warning/10 text-warning' },
    info: { Icon: HelpCircle, classes: 'border-info/25 bg-info/10 text-info' },
  } as const;
  const { Icon, classes } = toneStyles[tone];

  return (
    <div
      data-ams-slug={slug}
      className={cn('ams-module-notice flex min-w-0 items-start gap-2.5 rounded-control border px-3 py-2.5 text-xs leading-5', classes, className)}
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
    >
      <Icon size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-fg">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Dismiss notification"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

export interface AdminStatusBadgeProps {
  slug?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  tone = 'neutral',
  icon,
  children,
  className,
  slug
}) => {
  const toneClasses = {
    success: 'border-success/20 bg-success/10 text-success',
    warning: 'border-warning/20 bg-warning/10 text-warning',
    danger: 'border-danger/20 bg-danger/10 text-danger',
    info: 'border-info/20 bg-info/10 text-info',
    neutral: 'border-line bg-bg text-muted'
  } as const;

  return (
    <span
      data-ams-slug={slug}
      className={cn(
        'inline-flex min-h-6 items-center gap-1.5 rounded-badge border px-2 py-1 text-[11px] font-semibold',
        toneClasses[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};

export interface AdminModuleHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  slug?: string;
}

export const AdminModuleHeader: React.FC<AdminModuleHeaderProps> = ({
  title,
  description,
  eyebrow,
  icon,
  actions,
  className,
  slug
}) => (
  <header data-ams-feature-slug={slug} data-ams-slug={slug || (typeof title === 'string' ? 'header-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : undefined)} className={cn(
    'ams-page-header mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between',
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
  slug?: string;
  className?: string;
  itemClassName?: string;
}

const normalizeMetricSeries = (values: number[]) => {
  const safe = values.filter((value) => Number.isFinite(value));
  if (!safe.length) return [0, 0];
  return safe;
};

const buildSparklinePath = (values: number[], width: number, height: number, pad: number) => {
  const series = normalizeMetricSeries(values);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(1, max - min);
  const points = series.map((value, index) => ({
    x: pad + (series.length <= 1 ? (width - pad * 2) / 2 : (index / (series.length - 1)) * (width - pad * 2)),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
  }));

  if (points.length === 1) return { path: `M ${points[0].x} ${points[0].y}`, points };

  const slopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return (next.y - point.y) / Math.max(1, next.x - point.x);
  });

  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];

    const previousSlope = slopes[index - 1];
    const nextSlope = slopes[index];

    if (previousSlope === 0 || nextSlope === 0 || Math.sign(previousSlope) !== Math.sign(nextSlope)) return 0;
    return (previousSlope + nextSlope) / 2;
  });

  const path = points.slice(0, -1).reduce((result, point, index) => {
    const next = points[index + 1];
    const dx = (next.x - point.x) / 3;
    const cp1 = { x: point.x + dx, y: point.y + tangents[index] * dx };
    const cp2 = { x: next.x - dx, y: next.y - tangents[index + 1] * dx };
    return `${result} C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }, `M ${points[0].x} ${points[0].y}`);

  return { path, points };
};

const MetricSparkline: React.FC<{ values?: number[]; label: React.ReactNode; toneClassName?: string }> = ({ values = [], label, toneClassName = 'text-accent-text' }) => {
  const series = normalizeMetricSeries(values);
  const gradientId = `metric-fill-${useId().replace(/:/g, '')}`;
  const width = 132;
  const height = 44;
  const pad = 4;
  const { path, points } = buildSparklinePath(series, width, height, pad);
  const baseline = height - pad;
  const areaPath = `${path} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  const color = toneClassName.includes('text-success') ? 'var(--success)' : toneClassName.includes('text-warning') ? 'var(--warning)' : toneClassName.includes('text-danger') ? 'var(--danger)' : toneClassName.includes('text-info') ? 'var(--info)' : 'var(--series-1)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-[132px] shrink-0 overflow-visible" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${String(label)} metric trend`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pad} x2={width - pad} y1={baseline} y2={baseline} stroke="var(--line)" strokeWidth="1" opacity="0.8" vectorEffect="non-scaling-stroke" />
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.75" fill="var(--panel)" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const AdminMetricCard: React.FC<AdminMetric & { className?: string }> = ({
  label, value, context, change, changeToneClassName = 'text-muted', sparkline, icon, toneClassName = 'text-fg', slug, id, className
}) => (
  <article data-ams-slug={slug || (id ? 'metric-' + String(id).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() : undefined)} className={cn('ams-dashboard-card rounded-card border border-line bg-panel p-4 transition-colors hover:bg-panel-hover', className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="block whitespace-normal text-xs font-medium leading-4 text-muted">{label}</span>
          </div>
      {icon && <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg', toneClassName)}>{icon}</span>}
    </div>
    <div className="mt-3 flex min-w-0 items-end justify-between gap-4">
      <div className={cn('min-w-0 truncate text-2xl font-semibold leading-8 tracking-[-0.02em] tabular-nums', toneClassName)}>{value}</div>
      {Array.isArray(sparkline) && sparkline.length >= 2 && <MetricSparkline values={sparkline} label={label} toneClassName={toneClassName} />}
    </div>
    {(change !== undefined || context !== undefined) && (
      <div className="mt-2 flex min-h-5 min-w-0 items-center gap-2">
        {change !== undefined && <span className={cn('shrink-0 text-[11px] font-medium tabular-nums', changeToneClassName)}>{change}</span>}
        {context !== undefined && <span className="min-w-0 truncate text-[11px] leading-4 text-muted">{context}</span>}
      </div>
    )}
  </article>
);

export const AdminMetricStrip: React.FC<AdminMetricStripProps> = ({ metrics, className, itemClassName, slug }) => (
  <div data-ams-feature-slug={slug} data-ams-slug={slug} className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
    {metrics.map((metric) => <AdminMetricCard key={metric.id || String(metric.label)} {...metric} className={itemClassName} />)}
  </div>
);

export interface AdminFilterBarProps {
  slug?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  searchClassName?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel = 'Search',
  searchClassName,
  children,
  actions,
  footer,
  className,
  slug
}) => (
  <section data-ams-slug={slug} className={cn(
    'ams-filter-bar rounded-card border border-line bg-panel p-4',
    className
  )}>
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {onSearchChange && (
          <label className={cn('relative min-w-0 flex-1', searchClassName)}>
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
    {footer && (
      <div className="mt-3 border-t border-line pt-3">
        {footer}
      </div>
    )}
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
  pageSizeOptions = [10, 25, 50],
  slug,
  secondaryLabel
}) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const first = total > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const last = Math.min(safePage * pageSize, total);

  const pageItems: Array<number | 'ellipsis'> = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (safePage <= 3) return [1, 2, 3, 4, 'ellipsis', totalPages];
    if (safePage >= totalPages - 2) return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, 'ellipsis', safePage - 1, safePage, safePage + 1, 'ellipsis', totalPages];
  })();

  const handlePageSizeChange = (value: string) => {
    const nextSize = Number(value);
    if (!Number.isFinite(nextSize) || nextSize <= 0) return;
    onPageSizeChange(nextSize);
    onPageChange(1);
  };

  return (
    <nav
      aria-label="Table pagination"
      data-ams-slug={slug}
      className="border-t border-line bg-panel px-4 py-3 sm:px-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[11px] leading-4 text-muted">
            {total > 0 ? (
              <>
                Showing <span className="font-semibold tabular-nums text-fg">{first}</span>
                {' '}to{' '}
                <span className="font-semibold tabular-nums text-fg">{last}</span>
                {' '}of{' '}
                <span className="font-semibold tabular-nums text-fg">{total}</span>
                {' '}{itemLabel}
              </>
            ) : (
              <>No {itemLabel}</>
            )}
          </p>
          {secondaryLabel && <p className="mt-0.5 truncate text-[10px] leading-4 text-muted">{secondaryLabel}</p>}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 lg:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted">Rows</span>
            <CustomSelect
              value={String(pageSize)}
              onChange={handlePageSizeChange}
              options={pageSizeOptions.map((value) => ({ value: String(value), label: String(value) }))}
              triggerClassName="h-8 min-h-8 w-[68px] shrink-0"
              aria-label="Rows per page"
            />
          </div>

          <div className="flex items-center gap-1" aria-label="Page navigation">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-control border border-line bg-bg px-2 text-[11px] font-medium text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
              data-ams-slug={slug ? slug + '-prev' : undefined}
            >
              <ChevronLeft size={14} />
              <span className="hidden md:inline">Previous</span>
            </button>

            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={'ellipsis-' + index}
                  className="inline-flex h-8 w-6 items-center justify-center text-[11px] text-muted"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-current={safePage === item ? 'page' : undefined}
                  onClick={() => onPageChange(item)}
                  className={'inline-flex h-8 w-8 items-center justify-center rounded-control border text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (
                    safePage === item
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-bg text-muted hover:bg-panel hover:text-fg'
                  )}
                  data-ams-slug={slug ? slug + '-page-' + item : undefined}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-control border border-line bg-bg px-2 text-[11px] font-medium text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
              data-ams-slug={slug ? slug + '-next' : undefined}
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminModuleHeader;
