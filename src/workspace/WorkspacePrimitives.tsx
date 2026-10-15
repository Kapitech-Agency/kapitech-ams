import React from 'react';
import { AdminPageShell } from '../components/admin/AdminModulePrimitives';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/20 bg-danger/10 text-danger',
  info: 'border-info/20 bg-info/10 text-info',
  neutral: 'border-line bg-bg text-muted',
};

export const idr = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export const idrCompact = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }).format(value);

export const dateLabel = (value: string): string =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

export const dateTimeLabel = (value: string): string =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export interface WorkspacePageProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  slug: string;
  preview?: boolean;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  title, description, children, actions, slug, preview = true,
}) => (
  <AdminPageShell featureSlug={slug} className="workspace-page grid min-w-0 gap-6">
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[20px] font-semibold leading-7 tracking-[-0.02em] text-fg">{title}</h1>
          {preview && <span className="rounded-badge border border-line bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">UI preview</span>}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-5 text-muted">{description}</p>
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
    <div className="grid min-w-0 gap-6">{children}</div>
  </AdminPageShell>
);

export interface SectionPanelProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  slug?: string;
}

export const SectionPanel: React.FC<SectionPanelProps> = ({
  title, description, actions, children, className = '', slug,
}) => (
  <section data-ams-slug={slug} className={'min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5 ' + className}>
    <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold leading-5 text-fg">{title}</h2>
        {description && <p className="mt-1 text-[11px] leading-4 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

export interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
  title?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ children, tone = 'neutral', className = '', title }) => (
  <span title={title} className={'inline-flex min-h-6 items-center gap-1 rounded-badge border px-2 py-1 text-[10px] font-semibold leading-3 ' + TONE_CLASSES[tone] + ' ' + className}>
    {children}
  </span>
);

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  compact?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'secondary', compact = false, className = '', type = 'button', children, ...props,
}) => {
  const variants = {
    primary: 'border border-accent bg-accent text-white hover:bg-accent-hover',
    secondary: 'border border-line bg-panel text-fg hover:bg-bg',
    ghost: 'border border-transparent bg-transparent text-muted hover:bg-bg hover:text-fg',
    danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
  };
  return (
    <button
      type={type}
      className={'inline-flex min-h-9 items-center justify-center gap-2 rounded-control px-3 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ' + (compact ? 'min-h-7 px-2 text-[10px] ' : '') + variants[variant] + ' ' + className}
      {...props}
    >
      {children}
    </button>
  );
};

export interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: StatusTone;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, detail, tone = 'neutral', icon }) => (
  <div className="min-w-0 rounded-card border border-line bg-panel p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-[11px] leading-4 text-muted">{label}</p>
      {icon && <span className={TONE_CLASSES[tone] + ' flex h-7 w-7 shrink-0 items-center justify-center rounded-control border'}>{icon}</span>}
    </div>
    <p className="mt-2 break-words text-[21px] font-semibold leading-7 tracking-[-0.02em] tabular-nums text-fg">{value}</p>
    {detail && <p className="mt-1 text-[10px] leading-4 text-muted">{detail}</p>}
  </div>
);

export const TableScroller: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <div className="overflow-x-auto rounded-control border border-line" role="region" aria-label={label} tabIndex={0}>
    {children}
  </div>
);

export const tableClassName = 'w-full border-collapse text-left text-[12px] leading-4';
export const tableHeadClassName = 'bg-bg text-[10px] font-semibold uppercase tracking-[0.045em] text-muted';
export const tableCellClassName = 'border-b border-line px-3 py-3 align-middle last:border-b-0';

export const TextField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }> = ({
  label, hint, id, className = '', ...props,
}) => {
  const inputId = id || 'workspace-input-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <label htmlFor={inputId} className="grid min-w-0 gap-1.5 text-[11px] font-medium text-fg">
      <span>{label}</span>
      <input
        id={inputId}
        className={'h-9 min-w-0 rounded-control border border-line bg-panel px-3 text-[12px] font-normal text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ' + className}
        {...props}
      />
      {hint && <span className="text-[10px] font-normal leading-4 text-muted">{hint}</span>}
    </label>
  );
};

export const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({
  label, id, className = '', children, ...props,
}) => {
  const inputId = id || 'workspace-select-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <label htmlFor={inputId} className="grid min-w-0 gap-1.5 text-[11px] font-medium text-fg">
      <span>{label}</span>
      <select
        id={inputId}
        className={'h-9 min-w-0 rounded-control border border-line bg-panel px-3 text-[12px] font-normal text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ' + className}
        {...props}
      >
        {children}
      </select>
    </label>
  );
};

export interface ProgressRingProps {
  value: number;
  max?: number;
  label: string;
  size?: number;
  warningAt?: number;
  sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value, max = 100, label, size = 112, warningAt = 80, sublabel,
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? value / max * 100 : 0));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * percentage / 100;
  const tone = percentage >= warningAt ? 'var(--warning)' : 'var(--accent)';
  return (
    <div className="flex min-w-0 items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label + ': ' + Math.round(percentage) + '%'}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={tone} strokeWidth="7" strokeLinecap="round" strokeDasharray={dash + ' ' + circumference} transform="rotate(-90 50 50)" />
        <text x="50" y="48" textAnchor="middle" fill="var(--text)" fontSize="17" fontWeight="650">{Math.round(percentage)}%</text>
        <text x="50" y="62" textAnchor="middle" fill="var(--muted)" fontSize="7">USED</text>
      </svg>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-fg">{label}</p>
        {sublabel && <p className="mt-1 text-[11px] leading-4 text-muted">{sublabel}</p>}
      </div>
    </div>
  );
};

export interface ChartPoint {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export const RevenueLineChart: React.FC<{ data: ChartPoint[] }> = ({ data }) => {
  const width = 720;
  const height = 250;
  const left = 50;
  const right = 18;
  const top = 16;
  const bottom = 34;
  const values = data.flatMap((point) => [point.revenue, point.expenses, point.profit]);
  const ceiling = Math.max(1, Math.ceil(Math.max(...values) / 20) * 20);
  const plotHeight = height - top - bottom;
  const plotWidth = width - left - right;
  const x = (index: number) => left + (data.length > 1 ? index * plotWidth / (data.length - 1) : 0);
  const y = (value: number) => top + plotHeight - value / ceiling * plotHeight;
  const series = [
    { key: 'revenue' as const, label: 'Revenue', color: 'var(--series-1)' },
    { key: 'expenses' as const, label: 'Expenses', color: 'var(--series-3)' },
    { key: 'profit' as const, label: 'Net profit', color: 'var(--series-2)' },
  ];
  return (
    <div className="min-w-0">
      <svg viewBox={'0 0 ' + width + ' ' + height} className="h-auto w-full overflow-visible" role="img" aria-label="Line chart showing revenue, expenses and net profit over the last eight periods">
        {[0, 1, 2, 3, 4].map((step) => {
          const value = ceiling * step / 4;
          const lineY = y(value);
          return (
            <g key={step}>
              <line x1={left} y1={lineY} x2={width - right} y2={lineY} stroke="var(--line)" strokeDasharray="3 4" />
              <text x={left - 9} y={lineY + 3} textAnchor="end" fill="var(--muted)" fontSize="9">{value}</text>
            </g>
          );
        })}
        {data.map((point, index) => (
          <text key={point.label} x={x(index)} y={height - 10} textAnchor="middle" fill="var(--muted)" fontSize="9">{point.label}</text>
        ))}
        {series.map((item) => (
          <g key={item.key}>
            <polyline
              points={data.map((point, index) => x(index) + ',' + y(point[item.key])).join(' ')}
              stroke={item.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            {data.map((point, index) => (
              <circle key={point.label} cx={x(index)} cy={y(point[item.key])} r="3" fill={item.color} stroke="var(--panel)" strokeWidth="1.5">
                <title>{point.label + ' ' + item.label + ': ' + idr(point[item.key] * 1000000)}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
      <details className="mt-3 border-t border-line pt-3">
        <summary className="cursor-pointer text-[11px] font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">View chart data table</summary>
        <div className="mt-3 overflow-x-auto">
          <table className={tableClassName}>
            <thead className={tableHeadClassName}><tr><th className="px-2 py-2">Period</th><th className="px-2 py-2 text-right">Revenue</th><th className="px-2 py-2 text-right">Expenses</th><th className="px-2 py-2 text-right">Net profit</th></tr></thead>
            <tbody>{data.map((point) => <tr key={point.label}><td className="border-b border-line px-2 py-2 text-fg">{point.label}</td><td className="border-b border-line px-2 py-2 text-right tabular-nums text-fg">{idr(point.revenue * 1000000)}</td><td className="border-b border-line px-2 py-2 text-right tabular-nums text-fg">{idr(point.expenses * 1000000)}</td><td className="border-b border-line px-2 py-2 text-right tabular-nums text-fg">{idr(point.profit * 1000000)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function openPrintableDocument(title: string, rows: Array<[string, string]>): boolean {
  if (typeof window === 'undefined') return false;
  const target = window.open('', '_blank');
  if (!target) return false;
  target.opener = null;
  const rowMarkup = rows.map((row) => '<tr><th>' + escapeHtml(row[0]) + '</th><td>' + escapeHtml(row[1]) + '</td></tr>').join('');
  target.document.open();
  target.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title><style>body{font:13px Inter,Arial,sans-serif;color:#16161c;padding:36px}h1{font-size:22px;margin:0 0 8px}p{color:#6c6c7a;font-size:12px;margin-bottom:24px}table{width:100%;border-collapse:collapse}th,td{padding:12px;border:1px solid #e3e3ea;text-align:left}th{width:28%;background:#f4f4f7;font-weight:600}@media print{body{padding:0}}</style></head><body><h1>' + escapeHtml(title) + '</h1><p>Kapitech Agency Management System · locally prepared document preview</p><table>' + rowMarkup + '</table><script>window.onload=function(){window.print()}</script></body></html>');
  target.document.close();
  return true;
}
