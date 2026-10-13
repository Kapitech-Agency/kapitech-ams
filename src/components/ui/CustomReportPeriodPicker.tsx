import React from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from './CustomSelect';
import {
  convertReportingPeriodValue,
  formatReportingPeriodLabel,
  getCurrentReportingPeriodValue,
  getPreviousReportingPeriodValue,
  getReportingPeriodRange,
  setReportingPeriodYear,
  type ReportingPeriodMode
} from '../../lib/reportingPeriods';

interface CustomReportPeriodPickerProps {
  mode: ReportingPeriodMode;
  value: string;
  onModeChange: (mode: ReportingPeriodMode) => void;
  onChange: (value: string) => void;
  availableYears?: number[];
  locale?: string;
  slug?: string;
  compact?: boolean;
}

const MODE_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' }
];

export const CustomReportPeriodPicker: React.FC<CustomReportPeriodPickerProps> = ({
  mode,
  value,
  onModeChange,
  onChange,
  availableYears = [],
  locale = 'en-US',
  slug = 'report-period-picker',
  compact = false
}) => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const currentYear = new Date().getFullYear();
  const parsedYear = Number(/^(\d{4})/.exec(value)?.[1]) || currentYear;
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  const quarterMatch = /^(\d{4})-Q([1-4])$/.exec(value);
  const selectedMonth = monthMatch?.[2] || '01';
  const selectedQuarter = quarterMatch?.[2] || '1';
  const years = Array.from(new Set([
    ...Array.from({ length: 53 }, (_, index) => currentYear + 2 - index),
    ...availableYears,
    parsedYear
  ])).filter((year) => Number.isInteger(year) && year >= 1000 && year <= 9999).sort((a, b) => b - a);
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(parsedYear, index, 1);
    return { value: String(index + 1).padStart(2, '0'), label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(date) };
  });
  const quarterOptions = [1, 2, 3, 4].map((quarter) => {
    const start = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(parsedYear, (quarter - 1) * 3, 1));
    const end = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(parsedYear, quarter * 3 - 1, 1));
    return { value: String(quarter), label: 'Q' + quarter + ' · ' + start + '–' + end };
  });
  const currentValue = getCurrentReportingPeriodValue(mode);
  const previousValue = getPreviousReportingPeriodValue(currentValue, mode);
  const currentLabel = mode === 'month' ? 'This month' : mode === 'quarter' ? 'This quarter' : 'This year';
  const previousLabel = mode === 'month' ? 'Last month' : mode === 'quarter' ? 'Last quarter' : 'Last year';
  const range = getReportingPeriodRange(value, mode, locale);
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date + 'T00:00:00'));

  const changeMode = (nextValue: string) => {
    const nextMode = nextValue as ReportingPeriodMode;
    if (nextMode === mode) return;
    const nextPeriod = convertReportingPeriodValue(value, mode, nextMode);
    onModeChange(nextMode);
    onChange(nextPeriod);
  };

  return (
    <div className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"} data-ams-slug={slug}>
      <div className={compact ? "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2" : "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        <label className="block min-w-0 text-xs font-medium text-muted">
          {isId ? 'Jenis periode' : 'Period type'}
          <CustomSelect
            value={mode}
            onChange={changeMode}
            options={MODE_OPTIONS.map((option) => ({ ...option, label: isId ? (option.value === 'month' ? 'Bulan' : option.value === 'quarter' ? 'Kuartal' : 'Tahun') : option.label }))}
            className="mt-1.5 w-full"
            triggerClassName={compact ? "h-9 min-h-9 w-full" : "h-10 min-h-10 w-full"}
            aria-label={isId ? 'Jenis periode laporan' : 'Reporting period type'}
          />
        </label>
        <label className="block min-w-0 text-xs font-medium text-muted">
          {isId ? 'Tahun laporan' : 'Reporting year'}
          <CustomSelect
            value={String(parsedYear)}
            onChange={(year) => onChange(setReportingPeriodYear(value, mode, Number(year)))}
            options={years.map((year) => ({ value: String(year), label: String(year) }))}
            className="mt-1.5 w-full"
            triggerClassName={compact ? "h-9 min-h-9 w-full" : "h-10 min-h-10 w-full"}
            aria-label={isId ? 'Tahun laporan' : 'Reporting year'}
          />
        </label>
        {mode !== 'year' && (
          <label className="block min-w-0 text-xs font-medium text-muted">
            {mode === 'month' ? (isId ? 'Bulan laporan' : 'Reporting month') : (isId ? 'Kuartal laporan' : 'Reporting quarter')}
            <CustomSelect
              value={mode === 'month' ? selectedMonth : selectedQuarter}
              onChange={(period) => onChange(mode === 'month' ? String(parsedYear) + '-' + period : String(parsedYear) + '-Q' + period)}
              options={mode === 'month' ? monthOptions : quarterOptions}
              className="mt-1.5 w-full"
              triggerClassName="h-10 min-h-10 w-full"
              aria-label={mode === 'month' ? (isId ? 'Bulan laporan' : 'Reporting month') : (isId ? 'Kuartal laporan' : 'Reporting quarter')}
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onChange(currentValue)} className="inline-flex h-8 items-center rounded-control border border-line px-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {isId ? (mode === 'month' ? 'Bulan ini' : mode === 'quarter' ? 'Kuartal ini' : 'Tahun ini') : currentLabel}
        </button>
        <button type="button" onClick={() => onChange(previousValue)} className="inline-flex h-8 items-center rounded-control border border-line px-2.5 text-[11px] font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {isId ? (mode === 'month' ? 'Bulan lalu' : mode === 'quarter' ? 'Kuartal lalu' : 'Tahun lalu') : previousLabel}
        </button>
      </div>
      {range && (
        <p aria-live="polite" className="text-[11px] leading-5 text-muted">
          {formatReportingPeriodLabel(value, mode, locale)} <span aria-hidden="true">·</span> {formatDate(range.startDate)} – {formatDate(range.endDate)}
        </p>
      )}
    </div>
  );
};

export default CustomReportPeriodPicker;
