import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  offset?: number;
}

const AMS_PORTAL_TOKENS = [
  '--bg',
  '--panel',
  '--panel-hover',
  '--line',
  '--text',
  '--muted',
  '--accent',
  '--accent-text',
  '--success',
  '--warning',
  '--danger',
  '--info',
  '--radius-card',
  '--radius-control',
  '--radius-badge'
] as const;

const getPortalRoot = () => {
  const shell = document.querySelector<HTMLElement>('.ams-shell');
  if (!shell) return document.body;

  let root = document.getElementById('ams-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ams-portal-root';
    root.className = 'ams-portal-root';
    document.body.appendChild(root);
  }

  const shellStyles = window.getComputedStyle(shell);
  AMS_PORTAL_TOKENS.forEach((token) => {
    const value = shellStyles.getPropertyValue(token).trim();
    if (value) root!.style.setProperty(token, value);
  });

  return root;
};

export const DropdownPortal: React.FC<DropdownPortalProps> = ({
  open, anchorRef, onClose, children, className = '', align = 'left', offset = 6
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;

    setStyle({ visibility: 'hidden' });

    let frame = 0;
    const updatePosition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const anchor = anchorRef.current;
        const menu = menuRef.current;
        if (!anchor || !menu) return;

        const rect = anchor.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const viewportPadding = 8;
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const availableBelow = Math.max(0, viewportHeight - rect.bottom - viewportPadding - offset);
        const availableAbove = Math.max(0, rect.top - viewportPadding - offset);
        const canOpenUp = availableBelow < menuRect.height && availableAbove > availableBelow;
        const maxHeight = Math.max(120, canOpenUp ? availableAbove : availableBelow);
        const constrainedHeight = Math.min(menuRect.height, maxHeight);
        const top = canOpenUp
          ? Math.max(viewportPadding, rect.top - constrainedHeight - offset)
          : Math.min(
              Math.max(viewportPadding, viewportHeight - constrainedHeight - viewportPadding),
              rect.bottom + offset
            );
        const rawLeft = align === 'right' ? rect.right - menuRect.width : rect.left;
        const left = Math.max(
          viewportPadding,
          Math.min(rawLeft, viewportWidth - menuRect.width - viewportPadding)
        );

        setStyle({
          position: 'fixed',
          top,
          left,
          maxWidth: Math.max(0, viewportWidth - viewportPadding * 2),
          maxHeight,
          zIndex: 1000,
          visibility: 'visible'
        });
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
      }
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updatePosition)
      : null;

    const observeLayout = () => {
      updatePosition();
      if (resizeObserver) {
        if (anchorRef.current) resizeObserver.observe(anchorRef.current);
        if (menuRef.current) resizeObserver.observe(menuRef.current);
      }
    };

    const viewport = window.visualViewport;
    observeLayout();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    viewport?.addEventListener('resize', updatePosition);
    viewport?.addEventListener('scroll', updatePosition);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      viewport?.removeEventListener('resize', updatePosition);
      viewport?.removeEventListener('scroll', updatePosition);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, anchorRef, align, offset]);

  if (!open) return null;

  const portalRoot = getPortalRoot();
  return createPortal(
    <div ref={menuRef} style={style} className={className}>
      {children}
    </div>,
    portalRoot
  );
};

export default DropdownPortal;
