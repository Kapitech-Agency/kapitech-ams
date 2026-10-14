import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, RotateCcw, X } from 'lucide-react';
import Button from '../ui/Button';
import { CustomReportPeriodPicker } from '../ui/CustomReportPeriodPicker';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { useLanguage } from '../../lib/LanguageContext';
import { formatReportingPeriodLabel } from '../../lib/reportingPeriods';

export const AdminReportingPeriodBar: React.FC = () => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const locale = isId ? 'id-ID' : 'en-US';
  const { mode, value, enabled, setMode, setValue, clearFilter } = useReportingPeriod();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = formatReportingPeriodLabel(value, mode, locale);
  const selectedLabel = mode === 'month'
    ? new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(value + '-01T00:00:00'))
    : mode === 'quarter'
      ? (() => {
          const match = /^(\d{4})-Q([1-4])$/.exec(value);
          return match ? 'Q' + match[2] + ' ' + match[1] : value;
        })()
      : value;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (rootRef.current?.contains(target as Node)) return;
      // CustomSelect menus render in a portal outside this popover's DOM subtree.
      // Treat those menu surfaces as part of the filter so selecting an option does not close it first.
      if (target instanceof Element && target.closest('.ams-popover-surface')) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0" data-ams-slug="global-reporting-period-filter">
      <Button
        type="button"
        variant="secondary"
        icon={<CalendarDays size={14} aria-hidden="true" />}
        onClick={() => setOpen((current) => !current)}
        aria-label={isId ? 'Pilih periode laporan' : 'Choose reporting period'}
        aria-expanded={open}
        aria-controls="global-reporting-period-popover"
        title={enabled ? label : (isId ? 'Periode terpilih, belum diterapkan' : 'Selected period, not applied')}
        className={[
          'h-8 min-h-8 gap-1.5 px-2.5 text-[11px]',
          enabled ? 'border-accent/35 bg-accent/10 text-fg' : ''
        ].join(' ')}
        slug="global-reporting-period-trigger"
      >
        <span>{selectedLabel}</span>
        {enabled && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
      </Button>

      {open && (
        <section
          id="global-reporting-period-popover"
          role="dialog"
          aria-label={isId ? 'Periode laporan' : 'Reporting period'}
          className="fixed right-3 top-[60px] z-50 w-[min(360px,calc(100vw-24px))] rounded-card border border-line bg-panel p-3 min-[900px]:absolute min-[900px]:right-0 min-[900px]:top-[calc(100%+8px)]"
          data-ams-slug="global-reporting-period-popover"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-fg">{isId ? 'Periode laporan' : 'Reporting period'}</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                {enabled ? label : (isId ? 'Semua tanggal' : 'All dates')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isId ? 'Tutup periode laporan' : 'Close reporting period'}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3">
            <CustomReportPeriodPicker
              mode={mode}
              value={value}
              onModeChange={setMode}
              onChange={setValue}
              locale={locale}
              compact
              slug="global-reporting-period-picker"
            />
          </div>

          <p className="mt-2 text-[10px] leading-4 text-muted">
            {isId
              ? 'Periode yang diterapkan membatasi daftar bertanggal. Laporan berbasis periode seperti Finance tetap memakai periode yang dipilih. KPI kondisi saat ini dan data master tanpa tanggal tidak berubah.'
              : 'The applied period scopes dated lists. Period-based reports such as Finance continue to use the selected period. Current-state KPIs and undated master data stay unchanged.'}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2">
            <Button
              type="button"
              variant="ghost"
              icon={<RotateCcw size={12} aria-hidden="true" />}
              className="h-8 min-h-8 px-2 text-[11px]"
              disabled={!enabled}
              onClick={() => {
                clearFilter();
                setOpen(false);
              }}
              slug="global-reporting-period-clear"
            >
              {isId ? 'Semua tanggal' : 'All dates'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className="h-8 min-h-8 px-3 text-[11px]"
            >
              {isId ? 'Selesai' : 'Done'}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminReportingPeriodBar;
