"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CAFE_COPY } from "@/data/cafe-copy";
import { Toast } from "@/components/ui/Toast";
import type { BagSlip } from "@/lib/cafe";
import { TOAST_MS } from "@/lib/config";
import { getJson } from "@/lib/http";
import { useDesk } from "./DeskProvider";
import { KitchenSlip } from "./KitchenSlip";

/**
 * Prints one kitchen slip (a ticket's printer button, or Print in Show slip). The slip is put straight into <body> in
 * a container that is hidden on screen; the print rules in globals.css print only that container, 72 mm wide on
 * 80 mm paper. The browser's print dialog opens once the slip is in place.
 */
export function PrintSlipRoot() {
  const { printing, donePrinting } = useDesk();
  const orderId = printing?.orderId ?? null;
  const request = printing?.n ?? 0;
  /** The slip, with the request it was loaded for. */
  const [loaded, setLoaded] = useState<{ slip: BagSlip; request: number } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Load the slip for the order being printed.
  useEffect(() => {
    if (!orderId) return;
    let live = true;
    getJson<BagSlip>(`/api/cafe/orders/${orderId}`)
      .then((slip) => {
        if (live) setLoaded({ slip, request });
      })
      .catch(() => {
        if (!live) return;
        setProblem(CAFE_COPY.slip.printFailed);
        donePrinting();
      });
    return () => {
      live = false;
    };
  }, [orderId, request, donePrinting]);

  const ready = loaded !== null && orderId !== null && loaded.request === request ? loaded.slip : null;

  // Once it is on the page, open the print dialog; clear it when the dialog closes.
  useEffect(() => {
    if (!ready) return;
    const after = () => {
      setLoaded(null);
      donePrinting();
    };
    window.addEventListener("afterprint", after, { once: true });
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", after);
    };
  }, [ready, donePrinting]);

  useEffect(() => {
    if (!problem) return;
    const id = window.setTimeout(() => setProblem(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [problem]);

  return (
    <>
      {ready ? createPortal(<div data-print-root="">{<KitchenSlip slip={ready} />}</div>, document.body) : null}
      <Toast message={problem} />
    </>
  );
}
