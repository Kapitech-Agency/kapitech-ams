export type ReportingPeriodMode = 'month' | 'quarter' | 'year';
export type ReportingPeriodComparison = 'previous-period' | 'previous-year';

export interface ReportingPeriodRange {
  value: string;
  mode: ReportingPeriodMode;
  year: number;
  startMonth: string;
  endMonth: string;
  startDate: string;
  endDate: string;
  label: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

const parseValue = (value: string, mode: ReportingPeriodMode) => {
  if (mode === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year < 1000 || month < 1 || month > 12) return null;
    return { year, month, quarter: Math.floor((month - 1) / 3) + 1 };
  }
  if (mode === 'quarter') {
    const match = /^(\d{4})-Q([1-4])$/.exec(value);
    if (!match) return null;
    return { year: Number(match[1]), month: (Number(match[2]) - 1) * 3 + 1, quarter: Number(match[2]) };
  }
  if (mode === 'year') {
    const match = /^(\d{4})$/.exec(value);
    if (!match) return null;
    return { year: Number(match[1]), month: 1, quarter: 1 };
  }
  return null;
};

export const getCurrentReportingPeriodValue = (
  mode: ReportingPeriodMode,
  now: Date = new Date()
): string => {
  const year = String(now.getFullYear());
  const month = pad(now.getMonth() + 1);
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  if (mode === 'month') return year + '-' + month;
  if (mode === 'quarter') return year + '-Q' + quarter;
  return year;
};

export const getPreviousReportingPeriodValue = (
  value: string,
  mode: ReportingPeriodMode,
  comparison: ReportingPeriodComparison = 'previous-period'
): string => {
  const parsed = parseValue(value, mode);
  if (!parsed) return getPreviousReportingPeriodValue(getCurrentReportingPeriodValue(mode), mode, comparison);
  if (mode === 'year') return String(parsed.year - 1);
  if (comparison === 'previous-year') {
    return mode === 'month'
      ? String(parsed.year - 1) + '-' + pad(parsed.month)
      : String(parsed.year - 1) + '-Q' + parsed.quarter;
  }
  if (mode === 'quarter') {
    const previousIndex = parsed.year * 4 + parsed.quarter - 2;
    const year = Math.floor(previousIndex / 4);
    const quarter = (previousIndex % 4) + 1;
    return String(year) + '-Q' + quarter;
  }
  const previous = new Date(parsed.year, parsed.month - 2, 1);
  return String(previous.getFullYear()) + '-' + pad(previous.getMonth() + 1);
};

export const convertReportingPeriodValue = (
  value: string,
  fromMode: ReportingPeriodMode,
  toMode: ReportingPeriodMode
): string => {
  const parsed = parseValue(value, fromMode) || parseValue(getCurrentReportingPeriodValue(fromMode), fromMode)!;
  if (toMode === 'year') return String(parsed.year);
  if (toMode === 'quarter') return String(parsed.year) + '-Q' + (fromMode === 'year' ? 1 : parsed.quarter);
  const month = fromMode === 'year' ? 1 : fromMode === 'quarter' ? parsed.month : parsed.month;
  return String(parsed.year) + '-' + pad(month);
};

export const setReportingPeriodYear = (
  value: string,
  mode: ReportingPeriodMode,
  year: number
): string => {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) return value;
  const parsed = parseValue(value, mode);
  if (mode === 'year') return String(year);
  if (mode === 'quarter') return String(year) + '-Q' + (parsed?.quarter || 1);
  return String(year) + '-' + pad(parsed?.month || 1);
};

export const getReportingPeriodRange = (
  value: string,
  mode: ReportingPeriodMode,
  locale = 'en-US'
): ReportingPeriodRange | null => {
  const parsed = parseValue(value, mode);
  if (!parsed) return null;
  const startMonthIndex = mode === 'quarter' ? (parsed.quarter - 1) * 3 + 1 : mode === 'year' ? 1 : parsed.month;
  const endMonthIndex = mode === 'quarter' ? startMonthIndex + 2 : mode === 'year' ? 12 : parsed.month;
  const startMonth = String(parsed.year) + '-' + pad(startMonthIndex);
  const endMonth = String(parsed.year) + '-' + pad(endMonthIndex);
  const endDay = new Date(parsed.year, endMonthIndex, 0).getDate();
  let label = String(parsed.year);
  if (mode === 'month') {
    label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(parsed.year, parsed.month - 1, 1));
  } else if (mode === 'quarter') {
    const startName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(parsed.year, startMonthIndex - 1, 1));
    const endName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(parsed.year, endMonthIndex - 1, 1));
    label = 'Q' + parsed.quarter + ' · ' + startName + '–' + endName + ' ' + parsed.year;
  }
  return {
    value,
    mode,
    year: parsed.year,
    startMonth,
    endMonth,
    startDate: startMonth + '-01',
    endDate: endMonth + '-' + pad(endDay),
    label
  };
};

export const formatReportingPeriodLabel = (
  value: string,
  mode: ReportingPeriodMode,
  locale = 'en-US'
): string => getReportingPeriodRange(value, mode, locale)?.label || value;
