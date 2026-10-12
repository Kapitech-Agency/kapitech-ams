import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  closeLabel?: string;
  labelledBy?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Keep the dialog body fully visible without an internal scroll region. */
  fitContent?: boolean;
  dialogClassName?: string;
  slug?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl'
};

const modalStack: string[] = [];
let previousBodyOverflow = '';

const removeFromModalStack = (instanceId: string) => {
  const index = modalStack.lastIndexOf(instanceId);
  if (index >= 0) modalStack.splice(index, 1);
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOutsideClick = false,
  closeOnEscape = true,
  closeLabel = 'Close dialog',
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

  const titleId = labelledBy ?? `ams-modal-title-${instanceId}`;
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    if (modalStack.length === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    modalStack.push(instanceId);

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

    const focusInitial = () => {
      requestAnimationFrame(() => getInitialFocus()?.focus());
    };

    focusInitial();

    const handleFocusIn = (event: FocusEvent) => {
      if (modalStack[modalStack.length - 1] !== instanceId) return;
      const target = event.target as Node | null;
      if (target && dialogRef.current?.contains(target)) return;
      getInitialFocus()?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== instanceId) return;

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
      removeFromModalStack(instanceId);

      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);

      if (modalStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
        previousBodyOverflow = '';
      }

      triggerRef.current?.focus?.();
    };
  }, [closeOnEscape, instanceId, open]);

  if (!open) return null;

  return (
    <div data-ams-feature-slug={slug} data-ams-slug={slug} data-ams-modal-root="true" className="fixed inset-0 z-[80] flex items-center justify-center p-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] sm:p-4" role="presentation">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-bg/80"
        onMouseDown={(event) => {
          if (closeOnOutsideClick && event.target === event.currentTarget) {
            onClose();
          }
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative w-full ${sizes[size]} max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden rounded-card border border-line bg-panel ${dialogClassName || ''}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold leading-5 text-fg">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1.5 max-w-2xl text-xs leading-5 text-muted">
                {description}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            icon={<X size={16} />}
            className="h-10 w-10 shrink-0 p-0 sm:h-9 sm:w-9"
          />
        </header>

        <div className={`min-h-0 flex-1 px-4 py-4 ${fitContent ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 flex-col items-stretch justify-end gap-2 border-t border-line bg-panel px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;
