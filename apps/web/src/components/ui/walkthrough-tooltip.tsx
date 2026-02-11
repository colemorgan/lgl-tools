'use client';

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface WalkthroughTooltipProps {
  targetRef: RefObject<HTMLElement | null>;
  message: string;
  onDismiss: () => void;
  show: boolean;
}

export function WalkthroughTooltip({
  targetRef,
  message,
  onDismiss,
  show,
}: WalkthroughTooltipProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  useEffect(() => {
    if (!show || !targetRef.current) return;

    function updatePosition() {
      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 12,
        left: rect.left + window.scrollX + rect.width / 2,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [show, targetRef]);

  if (!show || !position) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onDismiss}
        aria-hidden="true"
      />
      {/* Tooltip */}
      <div
        className="absolute z-[70] -translate-x-1/2"
        style={{ top: position.top, left: position.left }}
      >
        {/* Arrow */}
        <div className="w-3 h-3 bg-primary rotate-45 absolute -top-1.5 left-1/2 -translate-x-1/2" />
        {/* Content */}
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 shadow-lg max-w-xs text-sm relative">
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-4">{message}</p>
        </div>
      </div>
    </>,
    document.body
  );
}
