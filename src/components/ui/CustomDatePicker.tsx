import React, { useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal';

type PickerType = 'date' | 'month';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  type?: PickerType;
  id?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  locale?: string;
  slug?: string;
  'aria-label'?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

const toLocalIsoDate = (date: Date) =>
  date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());

const toLocalIsoMonth = (date: Date) =>
  date.getFullYear() + '-' + pad(date.getMonth() + 1);

const parsePickerValue = (value: string, type: PickerType): Date | null => {
  const match = type === 'month'
    ? value.match(/^(\d{4})-(\d{2})$/)
    : value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = type === 'month' ? 1 : Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const normaliseBound = (value: string | undefined, type: PickerType) =>
  value ? value.slice(0, type === 'month' ? 7 : 10) : '';

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  type = 'date',
  id,
  min,
  max,
  disabled = false,
  required = false,
  placeholder,
  className = '',
  triggerClassName = '',
  locale = 'en-US',
  slug,
  'aria-label': ariaLabel
}) => {
  const selectedDate = parsePickerValue(value, type);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const [activeDate, setActiveDate] = useState(() => selectedDate ? toLocalIsoDate(selectedDate) : toLocalIsoDate(new Date()));

  const minBound = normaliseBound(min, type);
  const maxBound = normaliseBound(max, type);
  const today = new Date();
  const todayDate = toLocalIsoDate(today);
  const todayMonth = toLocalIsoMonth(today);
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }), [locale]);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }), [locale]);
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2026, 0, 5 + index)));
  }, [locale]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const count = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
    return Array.from({ length: count }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index - mondayOffset + 1));
  }, [viewDate]);

  const label = selectedDate
    ? type === 'month'
      ? monthFormatter.format(selectedDate)
      : dateFormatter.format(selectedDate)
    : '';

  const isBounded = (candidate: Date) => {
    const comparable = type === 'month' ? toLocalIsoMonth(candidate) : toLocalIsoDate(candidate);
    return Boolean((minBound && comparable < minBound) || (maxBound && comparable > maxBound));
  };

  const chooseDate = (date: Date) => {
    const nextValue = type === 'month' ? toLocalIsoMonth(date) : toLocalIsoDate(date);
    if (isBounded(date)) return;
    onChange(nextValue);
    setActiveDate(toLocalIsoDate(date));
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const openPicker = () => {
    if (disabled) return;
    setViewDate(selectedDate || new Date());
    setActiveDate(selectedDate ? toLocalIsoDate(selectedDate) : todayDate);
    setIsOpen((current) => !current);
  };

  const moveActiveDay = (date: Date, delta: number) => {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
    setActiveDate(toLocalIsoDate(next));
    setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
    requestAnimationFrame(() => dayRefs.current.get(toLocalIsoDate(next))?.focus());
  };

  const moveCalendar = (delta: number) => {
    setViewDate((current) => new Date(
      type === 'month' ? current.getFullYear() + delta : current.getFullYear(),
      type === 'month' ? current.getMonth() : current.getMonth() + delta,
      1
    ));
  };

  const isMonthDisabled = (year: number, monthIndex: number) => {
    const candidate = year + '-' + pad(monthIndex + 1);
    return Boolean((minBound && candidate < minBound) || (maxBound && candidate > maxBound));
  };

  return (
    <div data-ams-slug={slug} className={'relative min-w-0 ' + className}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            openPicker();
          }
        }}
        aria-label={ariaLabel || (type === 'month' ? 'Choose reporting month' : 'Choose date')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-required={required || undefined}
        className={'flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-control border border-line bg-panel px-3 text-left text-xs text-fg transition-colors hover:border-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ' + triggerClassName}
      >
        <span className={label ? 'truncate tabular-nums' : 'truncate text-muted'}>
          {label || placeholder || (type === 'month' ? 'Choose month' : 'Choose date')}
        </span>
        <CalendarDays size={15} className="shrink-0 text-muted" aria-hidden="true" />
      </button>

      <DropdownPortal
        open={isOpen}
        anchorRef={triggerRef}
        onClose={() => setIsOpen(false)}
        className="ams-popover-surface w-[292px] max-w-[calc(100vw-16px)] overflow-hidden p-3 font-sans text-xs text-fg"
      >
        <div role="dialog" aria-label={type === 'month' ? 'Choose month' : 'Choose date'} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={type === 'month' ? 'Previous year' : 'Previous month'}
              onClick={() => moveCalendar(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="min-w-0 text-center text-[13px] font-semibold text-fg">
              {type === 'month' ? viewDate.getFullYear() : monthFormatter.format(viewDate)}
            </div>
            <button
              type="button"
              aria-label={type === 'month' ? 'Next year' : 'Next month'}
              onClick={() => moveCalendar(1)}
              className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {type === 'month' ? (
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Months">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const date = new Date(viewDate.getFullYear(), monthIndex, 1);
                const monthValue = toLocalIsoMonth(date);
                const isSelected = value === monthValue;
                const isCurrent = todayMonth === monthValue;
                const isDisabled = isMonthDisabled(viewDate.getFullYear(), monthIndex);
                const monthLabel = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
                return (
                  <button
                    key={monthValue}
                    type="button"
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    onClick={() => chooseDate(date)}
                    className={'flex h-10 items-center justify-center rounded-control border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35 ' + (
                      isSelected
                        ? 'border-accent/50 bg-accent/14 text-fg'
                        : isCurrent
                          ? 'border-line text-accent-text hover:bg-panel-hover'
                          : 'border-transparent text-muted hover:border-line hover:bg-panel-hover hover:text-fg'
                    )}
                  >
                    {monthLabel}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted" aria-hidden="true">
                {weekdayLabels.map((weekday, index) => <span key={weekday + index} className="py-1">{weekday}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1" role="group" aria-label="Days">
                {calendarCells.map((date) => {
                  const dateValue = toLocalIsoDate(date);
                  const inViewMonth = date.getMonth() === viewDate.getMonth();
                  const isSelected = value === dateValue;
                  const isToday = todayDate === dateValue;
                  const isDisabled = isBounded(date);
                  return (
                    <button
                      key={dateValue}
                      ref={(element) => {
                        if (element) dayRefs.current.set(dateValue, element);
                        else dayRefs.current.delete(dateValue);
                      }}
                      type="button"
                      disabled={isDisabled}
                      aria-label={dateFormatter.format(date)}
                      aria-pressed={isSelected}
                      onClick={() => chooseDate(date)}
                      onKeyDown={(event) => {
                        const delta = event.key === 'ArrowLeft' ? -1
                          : event.key === 'ArrowRight' ? 1
                          : event.key === 'ArrowUp' ? -7
                          : event.key === 'ArrowDown' ? 7 : 0;
                        if (delta) {
                          event.preventDefault();
                          moveActiveDay(date, delta);
                        } else if (event.key === 'Home' || event.key === 'End') {
                          event.preventDefault();
                          const weekdayFromMonday = (date.getDay() + 6) % 7;
                          moveActiveDay(date, event.key === 'Home' ? -weekdayFromMonday : 6 - weekdayFromMonday);
                        } else if (event.key === 'PageUp' || event.key === 'PageDown') {
                          event.preventDefault();
                          const next = new Date(date.getFullYear(), date.getMonth() + (event.key === 'PageUp' ? -1 : 1), date.getDate());
                          setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
                          setActiveDate(toLocalIsoDate(next));
                          requestAnimationFrame(() => dayRefs.current.get(toLocalIsoDate(next))?.focus());
                        }
                      }}
                      tabIndex={dateValue === activeDate ? 0 : -1}
                      className={'flex h-8 items-center justify-center rounded-control border text-xs tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-30 ' + (
                        isSelected
                          ? 'border-accent/50 bg-accent/14 font-semibold text-fg'
                          : isToday
                            ? 'border-line font-semibold text-accent-text hover:bg-panel-hover'
                            : inViewMonth
                              ? 'border-transparent text-muted hover:border-line hover:bg-panel-hover hover:text-fg'
                              : 'border-transparent text-muted/50 hover:bg-panel-hover'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t border-line pt-2">
            {!required ? (
              <button type="button" onClick={() => { onChange(''); setIsOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); }} className="flex h-8 items-center gap-1.5 rounded-control px-2 text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
                <X size={13} /> Clear
              </button>
            ) : <span className="text-[10px] text-muted">{type === 'month' ? 'Select a month' : 'Select a date'}</span>}
            <button type="button" onClick={() => chooseDate(today)} disabled={type === 'month' ? isMonthDisabled(today.getFullYear(), today.getMonth()) : isBounded(today)} className="h-8 rounded-control px-2.5 text-xs font-medium text-accent-text transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40">
              {type === 'month' ? 'This month' : 'Today'}
            </button>
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
};

export default CustomDatePicker;
