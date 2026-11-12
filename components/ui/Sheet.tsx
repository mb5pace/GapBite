"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SHEET_DISMISS_DRAG_PX } from "@/lib/config";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on `parchment` (UI_UX_BIBLE.md section 4): drag handle, 28 px top
 * corners, slides up in 200 ms. It closes on Esc, on a tap on the dim area, or by
 * dragging the handle down. Focus moves into the sheet, stays there, and returns
 * to the button that opened it. No centred modals on mobile.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  // The distance lives in a ref as well as in state: a quick flick can end before React
  // has re-rendered, and the release must still see how far the finger travelled.
  const dragDistance = useRef(0);
  const [dragY, setDragY] = useState(0);

  // Lock page scroll, move focus in, and give it back on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onHandleDown(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientY;
    dragDistance.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onHandleMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    dragDistance.current = Math.max(0, event.clientY - dragStart.current);
    setDragY(dragDistance.current);
  }
  function onHandleUp() {
    if (dragStart.current === null) return;
    const dragged = dragDistance.current;
    dragStart.current = null;
    dragDistance.current = 0;
    setDragY(0);
    if (dragged >= SHEET_DISMISS_DRAG_PX) onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-scrim-in bg-espresso/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
        className="relative max-h-[90dvh] w-full max-w-[430px] animate-sheet-in overflow-y-auto rounded-t-sheet bg-parchment px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-float outline-none"
      >
        <div
          className="mx-auto flex h-8 w-full cursor-grab touch-none items-center justify-center"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          data-sheet-handle
        >
          <span className="h-1.5 w-12 rounded-pill bg-taupe" aria-hidden="true" />
        </div>
        <h2 id={titleId} className="font-display text-title font-bold text-maroon">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
