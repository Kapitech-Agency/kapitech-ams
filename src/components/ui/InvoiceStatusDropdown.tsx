import React, { useState, useRef } from 'react';
import { ChevronDown, Check, CircleCheck, Clock3, Send, CircleAlert, FileText } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal';
import { InvoiceStatus } from '../../lib/financeStore';

interface InvoiceStatusDropdownProps {
  status: InvoiceStatus;
  onChange: (status: InvoiceStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const statusConfigs: Record<InvoiceStatus, StatusConfig> = {
  paid: {
    label: 'Paid',
    badgeClass: 'bg-success/10 text-success border-success/20',
    icon: CircleCheck
  },
  partially_paid: {
    label: 'Partially paid',
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock3
  },
  sent: {
    label: 'Sent',
    badgeClass: 'bg-info/10 text-info border-info/20',
    icon: Send
  },
  overdue: {
    label: 'Overdue',
    badgeClass: 'bg-danger/10 text-danger border-danger/20',
    icon: CircleAlert
  },
  draft: {
    label: 'Draft',
    badgeClass: 'bg-panel text-muted border-line',
    icon: FileText
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-danger/10 text-danger border-danger/20',
    icon: CircleAlert
  }
};

const statuses: InvoiceStatus[] = ['paid', 'partially_paid', 'sent', 'overdue', 'draft'];

export const InvoiceStatusDropdown: React.FC<InvoiceStatusDropdownProps> = ({
  status,
  onChange,
  disabled = false,
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = statusConfigs[status] || statusConfigs.draft;
  const CurrentIcon = current.icon;

  const close = () => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setActiveIndex(Math.max(0, statuses.indexOf(status)));
          setIsOpen((open) => !open);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Tab') setIsOpen(false);
        }}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between gap-2 rounded-badge font-sans text-xs font-semibold border transition-colors duration-150 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
          size === 'sm' ? 'min-h-10 sm:min-h-7 px-2.5 py-1 text-[11px]' : 'min-h-10 sm:min-h-8 px-3 py-1.5 text-xs'
        } ${current.badgeClass} ${
          isOpen ? 'outline outline-2 outline-accent outline-offset-2' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <CurrentIcon size={12} className="shrink-0" />
          <span className="truncate">{current.label}</span>
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-150 opacity-70 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <DropdownPortal
        open={isOpen}
        anchorRef={triggerRef}
        onClose={() => setIsOpen(false)}
        align="left"
        className="ams-popover-surface min-w-[150px] max-w-[calc(100vw-16px)] max-h-[min(320px,calc(100dvh-16px))] overflow-y-auto overscroll-contain p-1 font-sans text-xs"
      >
        <div role="listbox" className="space-y-0.5">
          {statuses.map((item) => {
            const isSelected = item === status;
            const config = statusConfigs[item];
            const Icon = config.icon;

            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                data-selected={isSelected}
                data-active={statuses.indexOf(item) === activeIndex}
                className={`ams-dropdown-item w-full flex items-center justify-between min-h-10 sm:min-h-9 px-2.5 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] ${
                  isSelected
                    ? 'bg-accent/10 text-fg font-semibold'
                    : 'text-muted hover:text-fg hover:bg-panel'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon size={13} className="shrink-0" />
                  <span className="truncate">{config.label}</span>
                </span>
                {isSelected && (
                  <Check size={13} className="text-accent-text ml-2 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default InvoiceStatusDropdown;
