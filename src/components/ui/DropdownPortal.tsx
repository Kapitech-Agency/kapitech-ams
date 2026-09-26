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
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!open) return;

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
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const availableBelow = Math.max(0, viewportHeight - rect.bottom - viewportPadding - offset);
        const availableAbove = Math.max(0, rect.top - viewportPadding - offset);
        const canOpenUp = availableBelow < menuRect.height && availableAbove > availableBelow;
        const maxHeight = Math.max(
          120,
          canOpenUp ? availableAbove : availableBelow
        );
        const top = canOpenUp
          ? Math.max(viewportPadding, rect.top - Math.min(menuRect.height, maxHeight) - offset)
          : Math.min(
              viewportHeight - Math.min(menuRect.height, maxHeight) - viewportPadding,
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
          maxWidth: viewportWidth - viewportPadding * 2,
          maxHeight,
          zIndex: 1000,
          visibility: 'visible'
        });
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, anchorRef, onClose, align, offset]);

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
