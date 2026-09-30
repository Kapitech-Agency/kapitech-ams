import React, { useId, useMemo, useState } from 'react';

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

type ChartCoordinate = { x: number; y: number };

const smoothLinePath = (points: ChartCoordinate[]) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const slopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return (next.y - point.y) / Math.max(1, next.x - point.x);
  });

  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];

    const previousSlope = slopes[index - 1];
    const nextSlope = slopes[index];

    if (previousSlope === 0 || nextSlope === 0 || Math.sign(previousSlope) !== Math.sign(nextSlope)) {
      return 0;
    }

    return (previousSlope + nextSlope) / 2;
  });

  return points.slice(0, -1).reduce((path, point, index) => {
    const next = points[index + 1];
    const dx = (next.x - point.x) / 3;
    const cp1 = {
      x: point.x + dx,
      y: point.y + tangents[index] * dx,
    };
    const cp2 = {
      x: next.x - dx,
      y: next.y - tangents[index + 1] * dx,
    };

    return `${path} C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

export const TrendChart: React.FC<{
  data: TrendPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  primaryFormat?: (value: number) => string;
  ariaLabel: string;
}> = ({ data, primaryLabel, secondaryLabel, tertiaryLabel = 'Net', primaryFormat = formatCompact, ariaLabel }) => {
  const [hover, setHover] = useState<{ index: number; x: number; percent: number } | null>(null);
  const gradientId = `dashboard-trend-${useId().replace(/:/g, '')}`;
  const width = 720;
  const height = 320;
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

  if (!data.length) return null;

  const primaryPath = smoothLinePath(points.map((point) => ({ x: point.x, y: point.y })));
  const primaryBaseline = y(0);
  const primaryAreaPath = primaryPath + ` L ${points[points.length - 1].x} ${primaryBaseline} L ${points[0].x} ${primaryBaseline} Z`;
  const secondaryPath = smoothLinePath(
    points.filter((point) => point.secondaryY !== undefined).map((point) => ({ x: point.x, y: point.secondaryY as number }))
  );
  const tertiaryPath = smoothLinePath(
    points.filter((point) => point.tertiaryY !== undefined).map((point) => ({ x: point.x, y: point.tertiaryY as number }))
  );
  const active = hover ? points[hover.index] : null;
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const percent = rect.width > 0 ? (localX / rect.width) * 100 : 50;
    const viewBoxX = (localX / Math.max(1, rect.width)) * width;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - viewBoxX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setHover({ index: nearestIndex, x: viewBoxX, percent });
  };

  return (
    <div className="relative min-w-0" role="img" aria-label={ariaLabel}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-accent" />{primaryLabel}</span>
        {secondaryLabel && <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-series-3" />{secondaryLabel}</span>}
        {data.some((point) => point.tertiary !== undefined) && <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-success" />{tertiaryLabel}</span>}
      </div>

      <div className="relative h-[250px] w-full overflow-hidden rounded-card border border-line/80 bg-bg/30 sm:h-[280px] lg:h-[320px]" onPointerMove={handlePointerMove} onPointerLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-full w-full touch-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = maxValue - ratio * range;
            const yy = top + ratio * innerHeight;
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" opacity="0.75" />
                <text x={left - 9} y={yy + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{primaryFormat(value)}</text>
              </g>
            );
          })}

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.24" />
              <stop offset="72%" stopColor="var(--series-1)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={primaryAreaPath} fill={`url(#${gradientId})`} />
          <path d={primaryPath} fill="none" stroke="var(--series-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {secondaryLabel && secondaryPath && (
            <path d={secondaryPath} fill="none" stroke="var(--series-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.95" />
          )}
          {tertiaryPath && (
            <path d={tertiaryPath} fill="none" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.9" />
          )}

          {points.map((point, index) => (
            <g key={point.label}>
              <rect
                x={Math.max(left, point.x - 30)}
                y={top}
                width={Math.min(60, innerWidth)}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHover((current) => current && current.index === index ? current : { index, x: point.x, percent: (point.x / width) * 100 })}
                onFocus={() => setActiveIndex(index)}
                onPointerDown={() => setActiveIndex(index)}
                tabIndex={0}
                aria-label={`${point.label}: ${primaryLabel} ${primaryFormat(point.primary)}${point.secondary !== undefined ? `, ${secondaryLabel} ${primaryFormat(point.secondary)}` : ''}`}
              />
              {hover?.index === index && (
                <>
                  <circle cx={point.x} cy={point.y} r="5" fill="var(--panel)" stroke="var(--series-1)" strokeWidth="2" />
                  <circle cx={point.x} cy={point.y} r="2.4" fill="var(--series-1)" />
                  {point.secondaryY !== undefined && <circle cx={point.x} cy={point.secondaryY} r="4" fill="var(--panel)" stroke="var(--series-3)" strokeWidth="2" />}
                  {point.tertiaryY !== undefined && <circle cx={point.x} cy={point.tertiaryY} r="4" fill="var(--panel)" stroke="var(--success)" strokeWidth="2" />}
                </>
              )}
              <text x={point.x} y={height - 15} textAnchor="middle" fontSize="10" fill="var(--muted)">{point.label}</text>
            </g>
          ))}

          {hover && <line x1={hover.x} x2={hover.x} y1={top} y2={top + innerHeight} stroke="var(--series-4)" strokeWidth="1" strokeDasharray="3 4" opacity="0.65" vectorEffect="non-scaling-stroke" />}
        </svg>

        {active && (
          <div className="pointer-events-none absolute top-3 z-10 w-[190px] -translate-x-1/2 rounded-card border border-line bg-panel px-3 py-2 text-xs" style={{ left: `${Math.max(12, Math.min(88, hover?.percent ?? 50))}%` }}>
            <p className="font-semibold text-fg">{active.label}</p>
            <div className="mt-1 text-[10px] text-muted">Plotted period</div>
            <div className="mt-2 space-y-1 text-muted">
              <div className="flex justify-between gap-3"><span>{primaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.primary)}</span></div>
              {secondaryLabel && active.secondary !== undefined && <div className="flex justify-between gap-3"><span>{secondaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.secondary)}</span></div>}
              {active.tertiary !== undefined && <div className="flex justify-between gap-3"><span>{tertiaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.tertiary)}</span></div>}
            </div>
          </div>
        )}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">View data table</summary>
        <div className="mt-2 overflow-x-auto rounded-control border border-line">
          <table className="w-full min-w-[480px] text-xs">
            <thead className="border-b border-line text-left text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">{primaryLabel}</th>
                {secondaryLabel && <th className="px-3 py-2 text-right font-medium">{secondaryLabel}</th>}
                {tertiaryLabel && <th className="px-3 py-2 text-right font-medium">{tertiaryLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.label} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-fg">{point.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-fg">{primaryFormat(point.primary)}</td>
                  {secondaryLabel && <td className="px-3 py-2 text-right tabular-nums text-fg">{primaryFormat(point.secondary ?? 0)}</td>}
                  {tertiaryLabel && <td className="px-3 py-2 text-right tabular-nums text-fg">{primaryFormat(point.tertiary ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
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
  const [hover, setHover] = useState<{ index: number; percent: number } | null>(null);
  const max = Math.max(1, ...data.map((point) => point.value));
  const width = 720;
  const height = 250;
  const left = 28;
  const right = 16;
  const bottom = 48;
  const top = 18;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const slot = innerWidth / Math.max(data.length, 1);
  const active = hover === null ? null : data[hover.index];
  const tooltipLeft = hover === null ? 50 : hover.percent;
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const ratio = localX / Math.max(1, rect.width);
    const index = Math.max(0, Math.min(data.length - 1, Math.floor(ratio * data.length)));
    setHover({ index, percent: ratio * 100 });
  };

  return (
    <div className="min-w-0" role="img" aria-label={ariaLabel}>
      <div className="relative h-[220px] w-full overflow-hidden rounded-card border border-line/80 bg-bg/30 sm:h-[240px] lg:h-[250px]" onPointerMove={handlePointerMove} onPointerLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-full w-full"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((ratio) => {
            const yy = top + (1 - ratio) * innerHeight;
            return <line key={ratio} x1={left} x2={width - right} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" opacity="0.75" />;
          })}

          {data.map((point, index) => {
            const barWidth = Math.max(16, Math.min(42, slot * 0.52));
            const x = left + slot * index + (slot - barWidth) / 2;
            const barHeight = (point.value / max) * innerHeight;
            const y = top + innerHeight - barHeight;
            return (
              <g key={point.label}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(1, barHeight)}
                  rx="6"
                  fill="var(--series-1)"
                  opacity={hover === null || hover.index === index ? 0.9 : 0.35}
                  onMouseEnter={() => setHover({ index, percent: ((index + 0.5) / Math.max(data.length, 1)) * 100 })}
                  onFocus={() => setHover({ index, percent: ((index + 0.5) / Math.max(data.length, 1)) * 100 })}
                  tabIndex={0}
                  aria-label={`${point.label}: ${valueFormat(point.value)}`}
                />
                <text x={x + barWidth / 2} y={height - 17} textAnchor="middle" fontSize="10" fill="var(--muted)">{point.label}</text>
              </g>
            );
          })}
        </svg>

        {active && (
          <div className="pointer-events-none absolute top-3 z-10 w-[190px] -translate-x-1/2 rounded-card border border-line bg-panel px-3 py-2 text-xs" style={{ left: `${Math.max(12, Math.min(88, tooltipLeft))}%` }}>
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
  showLegend?: boolean;
}> = ({ data, ariaLabel, showLegend = true }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, point) => sum + Math.max(0, point.value), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;
  let offset = 0;

  const segments = useMemo(() => data.map((point) => {
    const value = Math.max(0, point.value);
    const length = total > 0 ? (value / total) * circumference : 0;
    const visibleLength = Math.max(0, length - gap);
    const segment = { ...point, length, visibleLength, offset };
    offset += length;
    return segment;
  }), [data, total, circumference]);

  if (!data.length || total === 0) return null;

  return (
    <div className={showLegend ? 'flex flex-col gap-4 sm:flex-row sm:items-center' : 'flex items-center justify-center'} role="img" aria-label={ariaLabel}>
      <div className="relative mx-auto h-40 w-40 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" preserveAspectRatio="xMidYMid meet">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth="12" opacity="0.7" />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={toneVar[segment.tone]}
              strokeWidth={activeIndex === index ? 15 : 12}
              strokeDasharray={`${segment.visibleLength} ${circumference - segment.visibleLength}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              tabIndex={0}
              aria-label={`${segment.label}: ${segment.value}`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-medium tabular-nums text-fg">{total}</span>
          <span className="text-xs text-muted">Projects</span>
        </div>
      </div>

      {showLegend && (
        <div className="min-w-0 flex-1 space-y-2">
          {segments.map((segment, index) => (
            <div key={segment.label} className="flex items-center justify-between gap-3 rounded-control px-2 py-1.5 transition-colors hover:bg-bg" onMouseEnter={() => setActiveIndex(index)}>
              <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
                <i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: toneVar[segment.tone] }} />
                {segment.label}
              </span>
              <span className="shrink-0 text-xs font-medium tabular-nums text-fg">{segment.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

