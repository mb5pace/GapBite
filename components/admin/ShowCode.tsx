"use client";

import { useEffect } from "react";
import { PillButton } from "@/components/ui/PillButton";
import { SESSION_MIN } from "@/lib/config";

/**
 * Full-screen "show code" mode: one unused code in big type, for someone to
 * type in on their own phone. If the code gets used while it is on screen, the
 * screen says so instead of showing a dead code.
 */
export function ShowCode({
  display,
  stillUnused,
  onClose,
}: {
  display: string;
  stillUnused: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Temporary access code"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-cream px-6 text-center"
    >
      {stillUnused ? (
        <>
          <p className="text-section text-mocha">Type this code on the QuickX gate screen</p>
          <p className="font-display text-greeting font-extrabold tracking-code text-maroon sm:text-display">
            {display}
          </p>
          <p className="text-secondary text-mocha">It works once and lasts {SESSION_MIN.temp} minutes after it is used.</p>
        </>
      ) : (
        <>
          <p className="font-display text-title font-extrabold text-maroon">That code has been used</p>
          <p className="text-body text-mocha">Close this and pick another unused code.</p>
        </>
      )}
      <PillButton variant="outline" onClick={onClose} autoFocus>
        Close
      </PillButton>
    </div>
  );
}
