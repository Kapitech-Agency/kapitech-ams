import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOutsideClick?: boolean;
  labelledBy?: string;
  /** Keep the dialog body fully visible without an internal scroll region. */
  fitContent?: boolean;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-3xl' };

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, description, children, footer, size = 'md',
  closeOnOutsideClick = true, labelledBy, fitContent = false
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const instanceId = useId();
  const titleId = labelledBy ?? `ams-modal-title-${instanceId}`;
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = (): HTMLElement[] => dialogRef.current
      ? (Array.from(dialogRef.current.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[href],[tabindex="0"]')) as HTMLElement[]).filter(el => el.getClientRects().length > 0)
      : [];
    requestAnimationFrame(() => (focusables()[0] ?? dialogRef.current)?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] sm:p-4" role="presentation">
      <button aria-label="Close dialog overlay" type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 bg-bg/80" onClick={() => closeOnOutsideClick && onClose()} />
      <div ref={dialogRef} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
        className={`relative w-full ${sizes[size]} max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] flex flex-col overflow-hidden rounded-card border border-line bg-panel`}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold leading-5 text-fg">{title}</h2>
            {description && <p id={descriptionId} className="mt-1.5 max-w-2xl text-xs leading-5 text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-panel p-0 text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <X size={16} />
          </button>
        </header>
        <div className={`min-h-0 flex-1 px-5 py-4 ${fitContent ? 'overflow-hidden' : 'overflow-y-auto'}`}>{children}</div>
        {footer && <footer className="flex flex-col-reverse sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-end gap-2 border-t border-line bg-panel px-5 py-3.5">{footer}</footer>}
      </div>
    </div>
  );
};
export default Modal;
