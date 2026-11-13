"use client";

import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { getJson } from "@/lib/http";

interface StaffReply {
  staff: { id: string; name: string }[];
}

/** Send with staff: the existing staff IDs. Choosing one sends the bag out with them. */
export function StaffDialog({
  orderId,
  busy,
  onPick,
  onClose,
}: {
  orderId: string | null;
  busy: boolean;
  onPick: (staffId: string) => void;
  onClose: () => void;
}) {
  const open = orderId !== null;
  const { data, error, isLoading } = useSWR<StaffReply>(open ? "/api/cafe/staff" : null, getJson);

  return (
    <Sheet open={open} onClose={onClose} title={CAFE_COPY.staffTitle} placement="center">
      <p className="text-body text-mocha">
        {orderId} · {CAFE_COPY.staffIntro}
      </p>
      <div className="mt-4 flex flex-col gap-2" aria-busy={isLoading}>
        {isLoading ? <div className="h-14 rounded-pill bg-sand" aria-label={CAFE_COPY.staffLoading} /> : null}
        {error ? <p role="alert" className="text-body text-brick">{error.message}</p> : null}
        {data && data.staff.length === 0 ? <p className="text-body text-espresso">{CAFE_COPY.staffNone}</p> : null}
        {data?.staff.map((person) => (
          <PillButton key={person.id} variant="secondary" size="lg" full disabled={busy} onClick={() => onPick(person.id)}>
            <span className="tabular-nums">{person.id}</span>
            <span aria-hidden="true">·</span>
            <span>{person.name}</span>
          </PillButton>
        ))}
      </div>
      <div className="mt-6">
        <PillButton size="md" variant="outline" onClick={onClose}>
          {CAFE_COPY.cancel}
        </PillButton>
      </div>
    </Sheet>
  );
}
