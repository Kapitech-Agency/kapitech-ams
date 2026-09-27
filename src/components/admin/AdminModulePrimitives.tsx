import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface AdminModuleHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const AdminModuleHeader: React.FC<AdminModuleHeaderProps> = ({
  title,
  description,
  actions,
  className
}) => (
  <header className={cn(
    'ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between',
    className
  )}>
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold leading-8 tracking-[-0.02em] text-fg">
        {title}
      </h1>
      {description && (
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {actions}
      </div>
    )}
  </header>
);

export interface AdminMetric {
  id?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  context?: React.ReactNode;
  icon?: React.ReactNode;
  toneClassName?: string;
}

export interface AdminMetricStripProps {
  metrics: AdminMetric[];
  className?: string;
  itemClassName?: string;
}

export const AdminMetricStrip: React.FC<AdminMetricStripProps> = ({
  metrics,
  className,
  itemClassName
}) => (
  <div className={cn('grid grid-cols-2 sm:grid-cols-4', className)}>
    {metrics.map((metric, index) => (
      <div
        key={metric.id || String(metric.label)}
        className={cn(
          'min-w-0 border-l border-line px-4 py-4 first:border-l-0',
          index === 0 && 'first:border-l-0',
          itemClassName
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs leading-4 text-muted">{metric.label}</span>
          {metric.icon && (
            <span className={cn('shrink-0', metric.toneClassName || 'text-muted')}>
              {metric.icon}
            </span>
          )}
        </div>
        <div className="mt-2 truncate text-xl font-medium leading-7 tracking-[-0.01em] tabular-nums text-fg">
          {metric.value}
        </div>
        {metric.context !== undefined && (
          <div className="mt-1 min-h-4 text-[11px] leading-4 text-muted">
            {metric.context}
          </div>
        )}
      </div>
    ))}
  </div>
);

export interface AdminFilterBarProps {
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
  className
}) => (
  <section className={cn(
    'rounded-card border border-line bg-panel p-4 sm:p-5',
    className
  )}>
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
        <div className="flex flex-wrap items-center gap-2">
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
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName
}) => (
  <section className={cn('rounded-card border border-line bg-panel', className)}>
    {(title || description || actions) && (
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={cn('min-w-0', bodyClassName)}>{children}</div>
  </section>
);

export default AdminModuleHeader;
