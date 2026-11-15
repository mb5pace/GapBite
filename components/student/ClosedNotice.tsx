"use client";

import { X } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import { Banner } from "@/components/ui/Banner";
import { IconButton } from "@/components/ui/IconButton";
import { closedNoticeLines } from "@/lib/hours-rules";
import { useCart } from "./CartProvider";
import { useSessionFlag } from "./useSessionFlag";

const DISMISSED_KEY = "qx-closed-notice-dismissed";

/**
 * A small notice at the top of Home when a place is closed or paused ("Global Bistro opens at 12:00."), one line each,
 * at most three. Dismiss it and it stays away for the rest of this browser session. It follows the live hours, so a
 * line goes away when that place opens. While the whole service is off it stays quiet: the service banner says so.
 */
export function ClosedNotice() {
  const { menu } = useCart();
  const [dismissed, dismiss] = useSessionFlag(DISMISSED_KEY);
  const lines = closedNoticeLines(menu.hours, menu.service, menu.now);
  if (dismissed || lines.length === 0) return null;

  return (
    <div data-closed-notice="" aria-label={COPY.student.closed.noticeLabel}>
      <Banner
        action={
          <IconButton label={COPY.student.closed.dismiss} variant="secondary" onClick={dismiss}>
            <X weight="bold" size={20} aria-hidden="true" />
          </IconButton>
        }
      >
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </Banner>
    </div>
  );
}
