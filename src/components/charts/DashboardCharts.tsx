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

const smoothLinePath = (points: ChartCoordinate[], tension = 0.82) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} C ${points[0].x} ${points[0].y}, ${points[1].x} ${points[1].y}, ${points[1].x} ${points[1].y}`;
  }

  const get = (index: number) => points[Math.max(0, Math.min(points.length - 1, index))];
  const clampY = (value: number, a: number, b: number) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return Math.max(min, Math.min(max, value));
  };

  return points.slice(0, -1).reduce((path, point, index) => {
    const previous = get(index - 1);
    const next = points[index + 1];
    const afterNext = get(index + 2);
    const dx = next.x - point.x;

    const control1 = {
      x: point.x + dx * 0.34,
      y: clampY(
        point.y + (next.y - previous.y) * (tension / 6),
        point.y,
        next.y
      ),
    };
    const control2 = {
      x: next.x - dx * 0.34,
      y: clampY(
        next.y - (afterNext.y - point.y) * (tension / 6),
        point.y,
        next.y
      ),
    };

    return `${path} C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)}, ${control2.x.toFixed(2)} ${control2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

export const TrendChart: React.FC<{
  data: TrendPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  primaryFormat?: (value: number) => string;
  axisFormat?: (value: number) => string;
  presentation?: 'default' | 'maven';
  ariaLabel: string;
}> = ({ data, primaryLabel, secondaryLabel, tertiaryLabel = 'Net', primaryFormat = formatCompact, axisFormat, presentation = 'default', ariaLabel }) => {
  const [hover, setHover] = useState<{ index: number; x: number; percent: number; yPercent: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const gradientId = `dashboard-trend-${useId().replace(/:/g, '')}`;
  const isMavenPresentation = presentation === 'maven';
  const primaryLineColor = isMavenPresentation ? 'var(--series-3)' : 'var(--series-1)';
  const secondaryLineColor = isMavenPresentation ? 'var(--series-2)' : 'var(--series-3)';
  const tertiaryLineColor = isMavenPresentation ? 'var(--series-4)' : 'var(--success)';
  const formatAxisValue = axisFormat || primaryFormat;
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

  const updateHover = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const localX = Math.max(0, Math.min(rect.width, clientX - rect.left));
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

    const selectedPoint = points[nearestIndex];
    setHover({
      index: nearestIndex,
      x: selectedPoint.x,
      percent: (selectedPoint.x / width) * 100,
      yPercent: ((selectedPoint.y - top) / innerHeight) * 100,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!points.length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateHover(event.clientX, event.currentTarget);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging || event.pointerType === 'mouse') {
      updateHover(event.clientX, event.currentTarget);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    updateHover(event.clientX, event.currentTarget);
  };

  const active = hover ? points[hover.index] : null;
  const selectPoint = (index: number) => {
    const safeIndex = Math.max(0, Math.min(points.length - 1, index));
    const selectedPoint = points[safeIndex];
    if (!selectedPoint) return;
    setHover({
      index: safeIndex,
      x: selectedPoint.x,
      percent: (selectedPoint.x / width) * 100,
      yPercent: ((selectedPoint.y - top) / innerHeight) * 100,
    });
  };
  const handleChartKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setHover(null);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectPoint(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectPoint(points.length - 1);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = hover?.index ?? (event.key === 'ArrowLeft' ? points.length : -1);
      selectPoint(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  };

  return (
    <div className={['relative min-w-0 ams-trend-chart', isMavenPresentation ? 'ams-trend-chart--maven' : ''].join(' ')} role={isMavenPresentation ? 'group' : 'img'} aria-label={ariaLabel}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted ams-trend-chart__legend">
        <span className="inline-flex items-center gap-2"><i className={isMavenPresentation ? 'h-[2px] w-4 rounded-full' : 'h-2 w-2 rounded-full bg-accent'} style={{ backgroundColor: primaryLineColor }} aria-hidden="true" />{primaryLabel}</span>
        {secondaryLabel && <span className="inline-flex items-center gap-2"><i className={isMavenPresentation ? 'h-[2px] w-4 rounded-full' : 'h-2 w-2 rounded-full bg-series-3'} style={{ backgroundColor: secondaryLineColor }} aria-hidden="true" />{secondaryLabel}</span>}
        {data.some((point) => point.tertiary !== undefined) && <span className="inline-flex items-center gap-2"><i className={isMavenPresentation ? 'h-[2px] w-4 rounded-full' : 'h-2 w-2 rounded-full bg-success'} style={{ backgroundColor: tertiaryLineColor }} aria-hidden="true" />{tertiaryLabel}</span>}
      </div>

      <div
        className={[
          'relative h-[250px] w-full overflow-hidden rounded-card border border-line/80 bg-bg/30 sm:h-[280px] lg:h-[320px] ams-trend-chart__plot',
          isMavenPresentation ? 'ams-trend-chart__plot--maven' : '',
          dragging ? 'cursor-grabbing select-none' : isMavenPresentation ? 'cursor-crosshair' : 'cursor-grab',
        ].join(' ')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (!dragging) setHover(null);
        }}
        onKeyDown={isMavenPresentation ? handleChartKeyDown : undefined}
        tabIndex={isMavenPresentation ? 0 : undefined}
        aria-label={isMavenPresentation ? ariaLabel + ' Use left and right arrow keys to inspect points, Home or End to jump to the first or last point, and Escape to clear the selection.' : undefined}
        role={isMavenPresentation ? 'group' : undefined}
        style={{ touchAction: isMavenPresentation ? 'pan-y' : 'none' }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryLineColor} stopOpacity={isMavenPresentation ? "0.10" : "0.24"} />
              <stop offset="68%" stopColor={primaryLineColor} stopOpacity={isMavenPresentation ? "0.025" : "0.075"} />
              <stop offset="100%" stopColor={primaryLineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = maxValue - ratio * range;
            const yy = top + ratio * innerHeight;
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="var(--line)" strokeWidth="1" strokeDasharray={isMavenPresentation ? "1 0" : "2 5"} opacity={isMavenPresentation ? 0.34 : 0.55} vectorEffect="non-scaling-stroke" />
                <text x={left - 9} y={yy + 4} textAnchor="end" fontSize={isMavenPresentation ? "14" : "10"} fill="var(--muted)">{formatAxisValue(value)}</text>
              </g>
            );
          })}

          <path d={primaryAreaPath} fill={`url(#${gradientId})`} />
          <path className="ams-trend-chart__primary-line" d={primaryPath} fill="none" stroke={primaryLineColor} strokeWidth={isMavenPresentation ? "2.5" : "3"} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {secondaryLabel && secondaryPath && (
            <path className="ams-trend-chart__secondary-line" d={secondaryPath} fill="none" stroke={secondaryLineColor} strokeWidth={isMavenPresentation ? "2.3" : "2.2"} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.94" />
          )}
          {tertiaryPath && (
            <path className="ams-trend-chart__tertiary-line" d={tertiaryPath} fill="none" stroke={tertiaryLineColor} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.78" />
          )}

          {hover && (
            <line
              x1={hover.x}
              x2={hover.x}
              y1={top}
              y2={top + innerHeight}
              stroke="var(--series-4)"
              strokeWidth="1"
              strokeDasharray="3 4"
              opacity="0.7"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {points.map((point, index) => {
            const activePoint = hover?.index === index;
            return (
              <g key={point.label}>
                <text x={point.x} y={height - 15} textAnchor="middle" fontSize={isMavenPresentation ? "14" : "10"} fill="var(--muted)">{point.label}</text>
                {activePoint && (
                  <>
                    <circle cx={point.x} cy={point.y} r="5.5" fill="var(--panel)" stroke={primaryLineColor} strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                    <circle cx={point.x} cy={point.y} r="2.4" fill={primaryLineColor} />
                    {point.secondaryY !== undefined && <circle cx={point.x} cy={point.secondaryY} r="4.2" fill="var(--panel)" stroke={secondaryLineColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                    {point.tertiaryY !== undefined && <circle cx={point.x} cy={point.tertiaryY} r="4.2" fill="var(--panel)" stroke={tertiaryLineColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                  </>
                )}
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-x-3 top-3 bottom-3">
          {active && (
            <div
              className={["absolute top-0 z-10 w-[190px] -translate-x-1/2 rounded-card border border-line bg-panel px-3 py-2 text-xs ams-trend-tooltip", isMavenPresentation ? "ams-trend-tooltip--maven" : ""].join(" ")}
              style={{
                left: isMavenPresentation ? `clamp(108px, ${hover?.percent ?? 50}%, calc(100% - 108px))` : `${Math.max(8, Math.min(92, hover?.percent ?? 50))}%`,
                top: isMavenPresentation ? `clamp(8px, calc(${hover?.yPercent ?? 35}% - 44px), calc(100% - 124px))` : '0',
              }}
            >
              <p className="font-semibold text-fg">{active.label}</p>
              {!isMavenPresentation && <div className="mt-1 text-[10px] text-muted">{dragging ? 'Drag to inspect another period' : 'Hover or drag across the chart'}</div>}
              <div className="mt-2 space-y-1 text-muted">
                <div className="flex justify-between gap-3"><span>{primaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.primary)}</span></div>
                {secondaryLabel && active.secondary !== undefined && <div className="flex justify-between gap-3"><span>{secondaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.secondary)}</span></div>}
                {active.tertiary !== undefined && <div className="flex justify-between gap-3"><span>{tertiaryLabel}</span><span className="tabular-nums text-fg">{primaryFormat(active.tertiary)}</span></div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <details className="mt-2">
        <summary className="ams-trend-chart__data-toggle cursor-pointer text-[11px] text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">View data table</summary>
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
  centerLabel?: string;
  presentation?: 'default' | 'maven';
}> = ({ data, ariaLabel, showLegend = true, centerLabel = 'Projects', presentation = 'default' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isMavenPresentation = presentation === 'maven';
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

  const active = activeIndex === null ? null : segments[activeIndex];

  return (
    <div className={['ams-donut-chart', showLegend ? 'flex flex-col gap-4 sm:flex-row sm:items-center' : 'flex items-center justify-center', isMavenPresentation ? 'ams-donut-chart--maven' : ''].join(' ')} role={isMavenPresentation ? 'group' : 'img'} aria-label={ariaLabel}>
      <div className="relative mx-auto h-40 w-40 shrink-0 ams-donut-chart__ring">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" preserveAspectRatio="xMidYMid meet">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth={isMavenPresentation ? "10" : "12"} opacity="0.7" />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={toneVar[segment.tone]}
              strokeWidth={activeIndex === index ? (isMavenPresentation ? 13 : 15) : (isMavenPresentation ? 10 : 12)}
              strokeDasharray={`${segment.visibleLength} ${circumference - segment.visibleLength}`}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={isMavenPresentation ? () => setActiveIndex(null) : undefined}
              onFocus={() => setActiveIndex(index)}
              onBlur={isMavenPresentation ? () => setActiveIndex(null) : undefined}
              tabIndex={0}
              aria-label={`${segment.label}: ${segment.value}`}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center ams-donut-chart__center">
          {isMavenPresentation && active ? (
            <>
              <span className="text-xl font-semibold tabular-nums text-fg">{active.value}</span>
              <span className="mt-0.5 max-w-full truncate text-[10px] text-muted">{active.label}</span>
              <span className="mt-0.5 text-[10px] tabular-nums text-muted">{Math.round(active.value / total * 100)}% of active</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-medium tabular-nums text-fg">{total}</span>
              <span className="text-xs text-muted">{centerLabel}</span>
            </>
          )}
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

