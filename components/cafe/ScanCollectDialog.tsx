"use client";

import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { QrScanner } from "@/components/runner/QrScanner";
import { CODE_DIGITS } from "@/lib/config";
import { postJson } from "@/lib/http";
import type { CafeCard } from "@/lib/order-types";
import { useDesk } from "./DeskProvider";
import { useQueue } from "./QueueProvider";

type Phase = { kind: "scan" } | { kind: "checking" } | { kind: "done"; order: CafeCard } | { kind: "refused"; message: string };

/**
 * Scan buyer QR (v1.0.0 Phase C1): the camera reads the buyer's QX:COLLECT QR, or the desk types the 4 digits. The
 * server decides (POST /api/cafe/collect); the answer is shown big: a green tick with the order and its items, or one
 * plain refusal ("Wrong code", "Not ready yet", "Already collected", "Collect this at the vending kiosk", "Order not
 * found"). Opened from the top bar (any pickup) or from a pickup ticket's Collect (that order).
 */
export function ScanCollectDialog() {
  const { scan, closeScan } = useDesk();
  // A fresh dialog each time it opens: the camera starts again and nothing from the last buyer is left on screen.
  return scan ? <ScanCollectPanel key={scan.orderId ?? "any"} orderId={scan.orderId} onClose={closeScan} /> : null;
}

function ScanCollectPanel({ orderId, onClose }: { orderId?: string; onClose: () => void }) {
  const copy = CAFE_COPY.scan;
  const queue = useQueue();
  const [phase, setPhase] = useState<Phase>({ kind: "scan" });
  const [code, setCode] = useState("");
  const [cameraOff, setCameraOff] = useState(false);
  // The camera keeps reporting the same QR many times a second: only the first one in each round counts.
  const busy = useRef(false);

  async function send(body: Record<string, string>) {
    if (busy.current) return;
    busy.current = true;
    setPhase({ kind: "checking" });
    const res = await postJson<{ order: CafeCard }>("/api/cafe/collect", body);
    if (res.ok && res.data) {
      queue.apply(res.data.order);
      setPhase({ kind: "done", order: res.data.order });
    } else {
      setPhase({ kind: "refused", message: res.error ?? CAFE_COPY.errors.network });
    }
    setCode("");
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    if (code.length !== CODE_DIGITS) return;
    void send(orderId ? { orderId, code } : { code });
  }

  function again() {
    busy.current = false;
    setPhase({ kind: "scan" });
  }

  const scanning = phase.kind === "scan" || phase.kind === "checking";

  return (
    <Sheet open onClose={onClose} title={orderId ? copy.forOrder(orderId) : copy.title} placement="center" wide>
      {scanning ? (
        <div className="grid gap-6 md:grid-cols-2" data-scan-collect="">
          <div className="flex flex-col gap-3">
            {cameraOff ? (
              <p className="rounded-card bg-sand p-4 text-body text-espresso">{copy.cameraOff}</p>
            ) : (
              <QrScanner hint={copy.hint} onText={(text) => void send({ qr: text })} onUnavailable={() => setCameraOff(true)} />
            )}
          </div>
          <form onSubmit={submitCode} className="flex flex-col gap-3">
            <h3 className="font-display text-section font-bold text-maroon">{copy.typeInstead}</h3>
            <p className="text-secondary text-mocha">{copy.typeHint}</p>
            <CodeBoxes value={code} onChange={setCode} label={copy.codeLabel} />
            <PillButton type="submit" full disabled={phase.kind === "checking" || code.length !== CODE_DIGITS}>
              {phase.kind === "checking" ? copy.checking : copy.collect}
            </PillButton>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 text-center" role="status" data-scan-result={phase.kind === "done" ? "collected" : "refused"}>
          {phase.kind === "done" ? (
            <>
              <CheckCircle weight="fill" size={96} className="text-olive" aria-hidden="true" />
              <p className="font-display text-greeting font-extrabold text-olive">{copy.collected}</p>
              <p className="font-display text-greeting font-extrabold tabular-nums text-maroon">{phase.order.id}</p>
              <ul className="flex flex-col gap-1 text-section font-semibold text-espresso">
                {phase.order.items.map((line) => (
                  <li key={line.name}>
                    {line.qty} × {line.name}
                  </li>
                ))}
              </ul>
            </>
          ) : phase.kind === "refused" ? (
            <>
              <WarningCircle weight="fill" size={96} className="text-brick" aria-hidden="true" />
              <p className="font-display text-greeting font-extrabold text-brick">{phase.message}</p>
            </>
          ) : null}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <PillButton onClick={again}>{copy.next}</PillButton>
            <PillButton variant="secondary" onClick={onClose}>
              {copy.close}
            </PillButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}
