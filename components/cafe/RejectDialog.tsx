"use client";

import { useState } from "react";
import { CAFE_COPY, REJECT_REASONS, type RejectReasonId } from "@/data/cafe-copy";
import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";

/** Pick a reason, then confirm. The buyer gets the reason and their money back. */
export function RejectDialog({
  orderId,
  busy,
  onConfirm,
  onClose,
}: {
  orderId: string | null;
  busy: boolean;
  onConfirm: (reason: RejectReasonId) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<RejectReasonId | null>(null);

  function close() {
    setReason(null);
    onClose();
  }

  return (
    <Sheet open={orderId !== null} onClose={close} title={CAFE_COPY.rejectTitle} placement="center">
      <p className="text-body text-mocha">
        {orderId} · {CAFE_COPY.rejectIntro}
      </p>
      <div role="radiogroup" aria-label={CAFE_COPY.rejectTitle} className="mt-4 flex flex-wrap gap-2">
        {REJECT_REASONS.map((item) => (
          <Chip
            key={item.id}
            role="radio"
            aria-checked={reason === item.id}
            aria-pressed={undefined}
            selected={reason === item.id}
            onClick={() => setReason(item.id)}
          >
            {item.label}
          </Chip>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <PillButton size="md" disabled={reason === null || busy} onClick={() => reason && onConfirm(reason)}>
          {CAFE_COPY.rejectConfirm}
        </PillButton>
        <PillButton size="md" variant="secondary" onClick={close}>
          {CAFE_COPY.cancel}
        </PillButton>
      </div>
    </Sheet>
  );
}
