import React from 'react';
import { CalendarDays, RotateCcw } from 'lucide-react';
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
  const label = formatReportingPeriodLabel(value, mode, locale);

  return (
    <section
      aria-label={isId ? 'Periode laporan global' : 'Global reporting period'}
      data-ams-slug="global-reporting-period"
      className="mb-3 min-w-0 rounded-card border border-line bg-panel px-3 py-3 sm:px-4"
    >
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">
            <CalendarDays size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-fg">{isId ? 'Periode laporan' : 'Reporting period'}</h2>
            <p className="mt-0.5 text-[11px] leading-4 text-muted">
              {isId
                ? 'Satu pilihan periode digunakan di seluruh modul dan tab AMS.'
                : 'One period selection is shared across AMS modules and tabs.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            role="status"
            aria-live="polite"
            data-ams-slug="global-reporting-period-status"
            className={enabled
              ? 'inline-flex min-h-7 items-center rounded-badge border border-accent/25 bg-accent/10 px-2.5 text-[10px] font-medium text-fg'
              : 'inline-flex min-h-7 items-center rounded-badge border border-line bg-bg px-2.5 text-[10px] font-medium text-muted'}
          >
            {enabled
              ? (isId ? 'Filter aktif · ' : 'Filter active · ') + label
              : (isId ? 'Semua tanggal' : 'All dates')}
          </span>
          {enabled && (
            <Button
              type="button"
              variant="secondary"
              icon={<RotateCcw size={13} />}
              className="min-h-8 h-8 px-2.5 text-[11px]"
              onClick={clearFilter}
              slug="global-reporting-period-clear"
            >
              {isId ? 'Tampilkan semua' : 'Show all dates'}
            </Button>
          )}
        </div>
      </div>
      <CustomReportPeriodPicker
        mode={mode}
        value={value}
        onModeChange={setMode}
        onChange={setValue}
        locale={locale}
        compact
        slug="global-reporting-period-picker"
      />
      <p className="mt-2 text-[10px] leading-4 text-muted">
        {enabled
          ? (isId
            ? 'Filter berlaku pada daftar dan laporan yang memiliki tanggal. KPI kondisi saat ini dan data master tanpa tanggal tetap ditampilkan apa adanya. Form input dan perubahan data tidak terpengaruh.'
            : 'The filter scopes date-aware lists and reports. Current-state KPIs and undated master data remain unchanged; entry forms and data mutations are unaffected.')
          : (isId
            ? 'Pilih periode untuk memfilter data bertanggal di seluruh modul dan tab yang mendukungnya. KPI kondisi saat ini dan data master tanpa tanggal tidak berubah.'
            : 'Choose a period to filter date-aware lists and reports across modules and tabs. Current-state KPIs and undated master data remain unchanged.')}
      </p>
    </section>
  );
};

export default AdminReportingPeriodBar;
