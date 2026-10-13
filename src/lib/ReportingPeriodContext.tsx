import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  convertReportingPeriodValue,
  getCurrentReportingPeriodValue,
  getReportingPeriodRange,
  type ReportingPeriodMode
} from './reportingPeriods';

const STORAGE_KEY = 'kapitech_ams_reporting_period_v1';

interface StoredReportingPeriod {
  mode: ReportingPeriodMode;
  value: string;
  enabled: boolean;
}

interface ReportingPeriodContextValue extends StoredReportingPeriod {
  setMode: (mode: ReportingPeriodMode) => void;
  setValue: (value: string) => void;
  clearFilter: () => void;
  matchesDate: (value: unknown) => boolean;
  matchesInterval: (startValue: unknown, endValue?: unknown, fallbackValue?: unknown) => boolean;
}

const ReportingPeriodContext = createContext<ReportingPeriodContextValue | null>(null);

const isMode = (value: unknown): value is ReportingPeriodMode =>
  value === 'month' || value === 'quarter' || value === 'year';

const dateOnly = (value: unknown): string => {
  if (typeof value !== 'string' && !(value instanceof Date)) return '';
  const raw = value instanceof Date ? value.toISOString() : value;
  const date = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
};

const readInitialState = (): StoredReportingPeriod => {
  const defaultMode: ReportingPeriodMode = 'month';
  const defaultValue = getCurrentReportingPeriodValue(defaultMode);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { mode: defaultMode, value: defaultValue, enabled: false };
    const parsed = JSON.parse(stored) as Partial<StoredReportingPeriod>;
    if (!isMode(parsed.mode) || typeof parsed.value !== 'string' || !getReportingPeriodRange(parsed.value, parsed.mode)) {
      return { mode: defaultMode, value: defaultValue, enabled: false };
    }
    return { mode: parsed.mode, value: parsed.value, enabled: parsed.enabled === true };
  } catch {
    return { mode: defaultMode, value: defaultValue, enabled: false };
  }
};

export const ReportingPeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StoredReportingPeriod>(readInitialState);

  const setMode = useCallback((mode: ReportingPeriodMode) => {
    setState((current) => {
      const next = {
        ...current,
        mode,
        value: convertReportingPeriodValue(current.value, current.mode, mode),
        enabled: true
      };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const setValue = useCallback((value: string) => {
    setState((current) => {
      if (!getReportingPeriodRange(value, current.mode)) return current;
      const next = { ...current, value, enabled: true };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearFilter = useCallback(() => {
    setState((current) => {
      const next = { ...current, enabled: false };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const matchesDate = useCallback((value: unknown) => {
    if (!state.enabled) return true;
    const range = getReportingPeriodRange(state.value, state.mode);
    if (!range) return true;
    const date = dateOnly(value);
    // Preserve legacy/master records with no usable timestamp instead of silently hiding them.
    if (!date) return true;
    return date >= range.startDate && date <= range.endDate;
  }, [state.enabled, state.mode, state.value]);

  const matchesInterval = useCallback((startValue: unknown, endValue?: unknown, fallbackValue?: unknown) => {
    if (!state.enabled) return true;
    const range = getReportingPeriodRange(state.value, state.mode);
    if (!range) return true;
    const start = dateOnly(startValue);
    const end = dateOnly(endValue);
    if (!start && !end) return matchesDate(fallbackValue);
    const intervalStart = start || '0001-01-01';
    const intervalEnd = end || '9999-12-31';
    return intervalStart <= range.endDate && intervalEnd >= range.startDate;
  }, [matchesDate, state.enabled, state.mode, state.value]);

  const contextValue = useMemo(() => ({
    ...state,
    setMode,
    setValue,
    clearFilter,
    matchesDate,
    matchesInterval
  }), [state, setMode, setValue, clearFilter, matchesDate, matchesInterval]);

  return <ReportingPeriodContext.Provider value={contextValue}>{children}</ReportingPeriodContext.Provider>;
};

export const useReportingPeriod = (): ReportingPeriodContextValue => {
  const value = useContext(ReportingPeriodContext);
  if (!value) throw new Error('useReportingPeriod must be used inside ReportingPeriodProvider.');
  return value;
};
