import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  closeLabel?: string;
  labelledBy?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  fitContent?: boolean;
  dialogClassName?: string;
  slug?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-4xl',
  '4xl': 'max-w-5xl'
};

const drawerStack: string[] = [];
let previousBodyOverflow = '';

const removeFromDrawerStack = (instanceId: string) => {
  const index = drawerStack.lastIndexOf(instanceId);
  if (index >= 0) drawerStack.splice(index, 1);
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOutsideClick = false,
  closeOnEscape = true,
  closeLabel = 'Close drawer',
  labelledBy,
  initialFocusRef,
  fitContent = false,
  dialogClassName,
  slug
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initialFocusRefRef = useRef(initialFocusRef);
  const instanceId = useId();

  onCloseRef.current = onClose;
  initialFocusRefRef.current = initialFocusRef;

  const titleId = labelledBy ?? `ams-drawer-title-${instanceId}`;
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    if (drawerStack.length === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    drawerStack.push(instanceId);

    const focusables = (): HTMLElement[] => {
      const dialog = dialogRef.current;
      if (!dialog) return [];

      const elements = Array.from(
        dialog.querySelectorAll(
          'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]'
        )
      ) as HTMLElement[];
      return elements.filter((element) => element.getClientRects().length > 0);
    };

    const getInitialFocus = () => {
      const dialog = dialogRef.current;
      if (!dialog) return null;

      return (
        initialFocusRefRef.current?.current ??
        dialog.querySelector<HTMLElement>('input:not([disabled]),textarea:not([disabled]),select:not([disabled])') ??
        focusables()[0] ??
        dialog
      );
    };

    requestAnimationFrame(() => getInitialFocus()?.focus());

    const handleFocusIn = (event: FocusEvent) => {
      if (drawerStack[drawerStack.length - 1] !== instanceId) return;
      if (document.querySelector('[data-ams-modal-root="true"]')) return;
      const target = event.target as Node | null;
      if (target && dialogRef.current?.contains(target)) return;
      getInitialFocus()?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (drawerStack[drawerStack.length - 1] !== instanceId) return;
      if (document.querySelector('[data-ams-modal-root="true"]')) return;

      if (event.key === 'Escape') {
        if (!closeOnEscape) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      removeFromDrawerStack(instanceId);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);

      if (drawerStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = '';
      }

      triggerRef.current?.focus?.();
    };
  }, [closeOnEscape, instanceId, open]);

  if (!open) return null;

  return (
    <div data-ams-feature-slug={slug} data-ams-slug={slug} className="fixed inset-0 z-[70] flex justify-end" role="presentation">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-bg/80 backdrop-blur-[1px]"
        onMouseDown={(event) => {
          if (closeOnOutsideClick && event.target === event.currentTarget) onClose();
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative z-10 flex h-full w-full ${sizes[size]} flex-col overflow-hidden border-l border-line bg-panel ${dialogClassName || ''}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line bg-panel px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold leading-5 text-fg">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 max-w-2xl text-[11px] leading-4 text-muted">{description}</p>}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            icon={<X size={16} />}
            className="h-8 w-8 shrink-0 p-0"
          />
        </header>

        <div className={`min-h-0 flex-1 custom-scrollbar px-4 py-4 ${fitContent ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 flex-col items-stretch justify-end gap-2 border-t border-line bg-panel px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Drawer;
