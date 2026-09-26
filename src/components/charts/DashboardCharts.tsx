import React, { useMemo, useState } from 'react';

export interface TrendPoint {
  label: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
}

export interface BarPoint {
  label: string;
  value: number;
  detail?: string;
}

export interface DonutPoint {
  label: string;
  value: number;
  tone: 'accent' | 'success' | 'info' | 'warning' | 'danger' | 'muted';
}

const toneVar: Record<DonutPoint['tone'], string> = {
  accent: 'var(--series-1)',
  success: 'var(--series-2)',
  info: 'var(--series-3)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  muted: 'var(--series-4)',
};

const formatCompact = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (Math.abs(value) >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  if (Math.abs(value) >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
};

const chartPoint = (index: number, count: number, width: number, left: number, right: number) =>
  left + (count <= 1 ? (width - left - right) / 2 : (index / (count - 1)) * (width - left - right));

export const TrendChart: React.FC<{
  data: TrendPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  primaryFormat?: (value: number) => string;
  ariaLabel: string;
}> = ({ data, primaryLabel, secondaryLabel, primaryFormat = formatCompact, ariaLabel }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 720;
  const height = 260;
  const left = 52;
  const right = 18;
  const top = 20;
  const bottom = 42;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const maxValue = Math.max(1, ...data.flatMap((point) => [point.primary, point.secondary ?? 0, point.tertiary ?? 0]));
  const minValue = Math.min(0, ...data.flatMap((point) => [point.primary, point.secondary ?? 0, point.tertiary ?? 0]));
  const range = Math.max(1, maxValue - minValue);
  const y = (value: number) => top + ((maxValue - value) / range) * innerHeight;
  const points = data.map((point, index) => ({
    ...point,
    x: chartPoint(index, data.length, width, left, right),
    y: y(point.primary),
    secondaryY: point.secondary === undefined ? undefined : y(point.secondary),
    tertiaryY: point.tertiary === undefined ? undefined : y(point.tertiary),
  }));
  const primaryPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const secondaryPath = points.filter((point) => point.secondaryY !== undefined)
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.secondaryY}`).join(' ');

  if (!data.length) return null;

  const active = activeIndex === null ? null : points[activeIndex];
  const tooltipLeft = active ? (active.x < width / 2 ? 64 : 36) : 50;

  return (
    <div className="relative min-w-0" role="img" aria-label={ariaLabel}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-accent" />{primaryLabel}</span>
        {secondaryLabel && <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-series-3" />{secondaryLabel}</span>}
      </div>
      <div className="relative overflow-hidden rounded-control border border-line bg-bg/40">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full touch-none" preserveAspectRatio="none"
          onMouseLeave={() => setActiveIndex(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = maxValue - ratio * range;
            const yy = top + ratio * innerHeight;
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" />
                <text x={left - 8} y={yy + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{primaryFormat(value)}</text>
              </g>
            );
          })}
          <path d={primaryPath} fill="none" stroke="var(--series-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {secondaryLabel && secondaryPath && (
            <path d={secondaryPath} fill="none" stroke="var(--series-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {points.map((point, index) => (
            <g key={point.label}>
              <rect
                x={Math.max(left, point.x - 30)}
                y={top}
                width={Math.min(60, innerWidth)}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                tabIndex={0}
                aria-label={`${point.label}: ${primaryLabel} ${primaryFormat(point.primary)}${point.secondary !== undefined ? `, ${secondaryLabel} ${primaryFormat(point.secondary)}` : ''}`}
              />
              <circle cx={point.x} cy={point.y} r={activeIndex === index ? 4.5 : 2.5} fill="var(--series-1)" />
              {point.secondaryY !== undefined && <circle cx={point.x} cy={point.secondaryY} r={activeIndex === index ? 4 : 2} fill="var(--series-3)" />}
              <text x={point.x} y={height - 15} textAnchor="middle" fontSize="10" fill="var(--muted)">{point.label}</text>
            </g>
          ))}
          {active && <line x1={active.x} x2={active.x} y1={top} y2={top + innerHeight} stroke="var(--series-4)" strokeDasharray="4 4" />}
        </svg>
        {active && (
          <div className="pointer-events-none absolute top-3 z-10 w-[190px] -translate-x-1/2 rounded-control border border-line bg-bg px-3 py-2 text-xs" style={{ left: `${tooltipLeft}%` }}>
            <p className="font-semibold text-fg">{active.label}</p>
            <div className="mt-2 space-y-1 text-muted">
              <div className="flex justify-between gap-3"><span>{primaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.primary)}</span></div>
              {secondaryLabel && active.secondary !== undefined && <div className="flex justify-between gap-3"><span>{secondaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.secondary)}</span></div>}
              {active.tertiary !== undefined && <div className="flex justify-between gap-3"><span>Net</span><span className="tabular-nums text-fg">{primaryFormat(active.tertiary)}</span></div>}
            </div>
          </div>
        )}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">View data table</summary>
        <div className="mt-2 overflow-x-auto rounded-control border border-line">
          <table className="w-full min-w-[480px] text-xs">
            <thead className="border-b border-line text-left text-muted"><tr><th className="px-3 py-2 font-medium">Period</th><th className="px-3 py-2 text-right font-medium">{primaryLabel}</th>{secondaryLabel && <th className="px-3 py-2 text-right font-medium">{secondaryLabel}</th>}</tr></thead>
            <tbody>{data.map((point) => <tr key={point.label} className="border-b border-line last:border-0"><td className="px-3 py-2 text-fg">{point.label}</td><td className="px-3 py-2 text-right tabular-nums text-fg">{primaryFormat(point.primary)}</td>{secondaryLabel && <td className="px-3 py-2 text-right tabular-nums text-fg">{primaryFormat(point.secondary ?? 0)}</td>}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

export const BarChart: React.FC<{
  data: BarPoint[];
  valueLabel: string;
  valueFormat?: (value: number) => string;
  ariaLabel: string;
}> = ({ data, valueLabel, valueFormat = (value) => String(value), ariaLabel }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((point) => point.value));
  const width = 720;
  const height = 250;
  const left = 28;
  const bottom = 48;
  const top = 18;
  const innerWidth = width - left - 16;
  const innerHeight = height - top - bottom;
  const slot = innerWidth / Math.max(data.length, 1);
  const active = activeIndex === null ? null : data[activeIndex];
  const tooltipLeft = activeIndex === null ? 50 : activeIndex === 0 ? 28 : activeIndex === data.length - 1 ? 72 : 50;

  return (
    <div className="min-w-0" role="img" aria-label={ariaLabel}>
      <div className="relative overflow-hidden rounded-control border border-line bg-bg/40">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full" preserveAspectRatio="none" onMouseLeave={() => setActiveIndex(null)}>
          {[0, 0.5, 1].map((ratio) => {
            const yy = top + (1 - ratio) * innerHeight;
            return <line key={ratio} x1={left} x2={width - 16} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" />;
          })}
          {data.map((point, index) => {
            const barWidth = Math.max(18, slot * 0.52);
            const x = left + slot * index + (slot - barWidth) / 2;
            const barHeight = (point.value / max) * innerHeight;
            const y = top + innerHeight - barHeight;
            return (
              <g key={point.label}>
                <rect x={x} y={y} width={barWidth} height={Math.max(1, barHeight)} rx="4" fill="var(--series-1)" opacity={activeIndex === null || activeIndex === index ? 0.9 : 0.45}
                  onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0}
                  aria-label={`${point.label}: ${valueFormat(point.value)}`} />
                <text x={x + barWidth / 2} y={height - 17} textAnchor="middle" fontSize="10" fill="var(--muted)">{point.label}</text>
              </g>
            );
          })}
        </svg>
        {active && (
          <div className="pointer-events-none absolute top-3 z-10 w-[190px] -translate-x-1/2 rounded-control border border-line bg-bg px-3 py-2 text-xs" style={{ left: `${tooltipLeft}%` }}>
            <p className="font-semibold text-fg">{active.label}</p>
            <div className="mt-1 flex justify-between gap-3 text-muted"><span>{valueLabel}</span><span className="tabular-nums text-fg">{valueFormat(active.value)}</span></div>
            {active.detail && <p className="mt-1 text-muted">{active.detail}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export const DonutChart: React.FC<{
  data: DonutPoint[];
  ariaLabel: string;
}> = ({ data, ariaLabel }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, point) => sum + Math.max(0, point.value), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = useMemo(() => data.map((point) => {
    const value = Math.max(0, point.value);
    const length = total > 0 ? (value / total) * circumference : 0;
    const segment = { ...point, length, offset };
    offset += length;
    return segment;
  }), [data, total, circumference]);

  if (!data.length || total === 0) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center" role="img" aria-label={ariaLabel}>
      <div className="relative mx-auto h-44 w-44 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth="12" />
          {segments.map((segment, index) => (
            <circle key={segment.label} cx="60" cy="60" r={radius} fill="none" stroke={toneVar[segment.tone]} strokeWidth={activeIndex === index ? 15 : 12}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`} strokeDashoffset={-segment.offset} strokeLinecap="butt"
              onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0}
              aria-label={`${segment.label}: ${segment.value}`} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-medium tabular-nums text-fg">{total}</span>
          <span className="text-xs text-muted">Projects</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((segment, index) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-control px-2 py-1.5 hover:bg-bg" onMouseEnter={() => setActiveIndex(index)}>
            <span className="flex min-w-0 items-center gap-2 text-xs text-muted"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: toneVar[segment.tone] }} />{segment.label}</span>
            <span className="shrink-0 text-xs font-medium tabular-nums text-fg">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
