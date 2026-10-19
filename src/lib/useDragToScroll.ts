import React, { useEffect, useRef, useState, useMemo, RefObject } from 'react';

/**
 * Setup smooth horizontal drag-to-scroll on any scrollable container element.
 * Safe to call multiple times; ignores duplicate attachments.
 */
export function setupDragToScroll(slider: HTMLElement): () => void {
  if (!slider) return () => {};
  if ((slider as any).__dragToScrollActive) {
    return () => {};
  }
  (slider as any).__dragToScrollActive = true;

  let isDown = false;
  let startX = 0;
  let scrollStartLeft = 0;
  let hasMoved = false;

  const onMouseDown = (e: MouseEvent) => {
    // Only drag on primary left-click
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (!target) return;

    // Do NOT drag-scroll if clicking interactive form controls, links, or draggable cards/handles
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[draggable="true"]') ||
      target.closest('[data-drag-handle]') ||
      target.closest('.draggable-card') ||
      target.closest('.kanban-card') ||
      target.closest('.task-card') ||
      target.closest('.no-drag-scroll')
    ) {
      return;
    }

    isDown = true;
    hasMoved = false;
    startX = e.clientX;
    scrollStartLeft = slider.scrollLeft;

    slider.classList.add('cursor-grabbing');
    slider.classList.remove('cursor-grab');
    document.body.classList.add('select-none');

    // Attach listeners on window to guarantee smooth tracking even outside container
    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDown) return;

    const deltaX = e.clientX - startX;
    if (Math.abs(deltaX) > 3) {
      hasMoved = true;
    }

    e.preventDefault();
    slider.scrollLeft = scrollStartLeft - deltaX;
  };

  const onMouseUp = () => {
    if (!isDown) return;
    isDown = false;

    slider.classList.remove('cursor-grabbing');
    slider.classList.add('cursor-grab');
    document.body.classList.remove('select-none');

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    // If user dragged, swallow accidental click event on release
    if (hasMoved) {
      const suppressClick = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        window.removeEventListener('click', suppressClick, true);
      };
      window.addEventListener('click', suppressClick, true);
      setTimeout(() => {
        window.removeEventListener('click', suppressClick, true);
      }, 50);
    }
  };

  slider.addEventListener('mousedown', onMouseDown);
  slider.classList.add('cursor-grab');

  return () => {
    (slider as any).__dragToScrollActive = false;
    slider.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    document.body.classList.remove('select-none');
  };
}

/**
 * Hook to enable smooth drag-to-scroll (mouse click-and-drag scrolling)
 * on horizontal scroll containers like Kanban boards, portfolio rails, and tables.
 */
export function useDragToScroll<T extends HTMLElement = HTMLDivElement>(): RefObject<T> {
  const [node, setNode] = useState<T | null>(null);
  const internalRef = useRef<T | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Return a stable ref object with getter/setter to react when React attaches .current
  const ref = useMemo(() => {
    return {
      get current() {
        return internalRef.current;
      },
      set current(element: T | null) {
        if (internalRef.current !== element) {
          internalRef.current = element;
          setNode(element);
        }
      }
    };
  }, []);

  // Periodic fallback check in case of direct ref mutations without setter invocation
  useEffect(() => {
    if (!node && internalRef.current) {
      setNode(internalRef.current);
    }

    const interval = setInterval(() => {
      if (internalRef.current !== node) {
        setNode(internalRef.current);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [node]);

  // Setup drag-to-scroll whenever node changes
  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (node) {
      cleanupRef.current = setupDragToScroll(node);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [node]);

  return ref as unknown as RefObject<T>;
}

