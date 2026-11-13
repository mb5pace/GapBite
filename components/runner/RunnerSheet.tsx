"use client";

import { Check, Scan, WarningCircle } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { getBuilding } from "@/data/locations";
import { dropLine, RUN_COPY, RUN_ERRORS } from "@/data/order-copy";
import { CodeBoxes } from "@/components/ui/CodeBoxes";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { CODE_DIGITS } from "@/lib/config";
import { postJson } from "@/lib/http";
import { parseOrderRef } from "@/lib/order-ref";
import type { RunCard, RunPreview } from "@/lib/order-types";
import { formatClock } from "@/lib/time";
import { QrScanner } from "./QrScanner";
import { useMe } from "@/components/student/useMe";

export type RunnerMode = { kind: "closed" } | { kind: "scan" } | { kind: "handover"; run: RunCard };

type ScanPhase =
  | { kind: "scanning" }
  | { kind: "manual"; note?: string }
  | { kind: "loading" }
  | { kind: "preview"; preview: RunPreview }
  | { kind: "accepting"; preview: RunPreview }
  | { kind: "accepted"; line: string; earn: number; staff: boolean }
  | { kind: "error"; message: string };

/** Refresh everything a run can change: my orders and runs, the header dots, the wallet. */
function useRefreshRuns() {
  const { mutate } = useSWRConfig();
  return () => Promise.all([mutate("/api/orders"), mutate("/api/runs"), mutate("/api/me"), mutate("/api/wallet")]);
}

/**
 * Scan a bag (docs/SCREENS.md "Runner popup"): the camera or a typed order ID, then a preview with the
 * earning line, then Accept. Each scan is its own accept, so a runner can scan several bags in a row.
 */
function ScanFlow({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const refresh = useRefreshRuns();
  const [phase, setPhase] = useState<ScanPhase>({ kind: "scanning" });
  const [typed, setTyped] = useState("");
  const handled = useRef(false);
  const staff = me.user.role === "staff";

  async function lookUp(text: string) {
    if (handled.current) return;
    handled.current = true;
    const id = parseOrderRef(text);
    if (!id) {
      setPhase({ kind: "error", message: RUN_ERRORS.notSlip });
      return;
    }
    setPhase({ kind: "loading" });
    const res = await postJson<{ preview: RunPreview }>("/api/runs/preview", { orderId: id });
    if (res.ok && res.data) setPhase({ kind: "preview", preview: res.data.preview });
    else setPhase({ kind: "error", message: res.error ?? RUN_ERRORS.notFound });
  }

  async function accept(preview: RunPreview) {
    setPhase({ kind: "accepting", preview });
    const res = await postJson<{ run: RunCard; earn: number; staff: boolean }>("/api/runs/accept", { orderId: preview.id });
    if (res.ok && res.data) {
      const when = res.data.run.promisedAt !== undefined ? formatClock(res.data.run.promisedAt) : "";
      setPhase({ kind: "accepted", line: RUN_COPY.acceptedLine(dropLine(res.data.run.buildingId), when), earn: res.data.earn, staff: res.data.staff });
      void refresh();
    } else {
      setPhase({ kind: "error", message: res.error ?? RUN_ERRORS.taken });
    }
  }

  function again() {
    handled.current = false;
    setTyped("");
    setPhase({ kind: "scanning" });
  }

  function typeInstead(note?: string) {
    handled.current = false;
    setPhase({ kind: "manual", note });
  }

  if (phase.kind === "scanning") {
    return (
      <div className="flex flex-col gap-4">
        <QrScanner onText={(text) => void lookUp(text)} onUnavailable={() => typeInstead(RUN_COPY.cameraOff)} />
        <PillButton variant="secondary" size="md" full onClick={() => typeInstead()}>
          {RUN_COPY.typeInstead}
        </PillButton>
      </div>
    );
  }

  if (phase.kind === "manual") {
    return (
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (typed.trim()) void lookUp(typed);
        }}
      >
        {phase.note ? <p className="text-body text-espresso">{phase.note}</p> : null}
        <Input
          label={RUN_COPY.orderIdLabel}
          hint={RUN_COPY.orderIdHint}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="QX-4821"
          name="order-id"
          // The sheet opens with the field ready to type in.
          autoFocus
        />
        <PillButton type="submit" full arrow disabled={typed.trim() === ""}>
          {RUN_COPY.lookUp}
        </PillButton>
        <PillButton type="button" variant="secondary" size="md" full onClick={again}>
          {RUN_COPY.useCamera}
        </PillButton>
      </form>
    );
  }

  if (phase.kind === "loading") {
    return (
      <div role="status" aria-busy="true" className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
          <Scan weight="regular" size={44} />
        </span>
        <p className="font-display text-section font-bold text-maroon">{RUN_COPY.looking}</p>
      </div>
    );
  }

  if (phase.kind === "preview" || phase.kind === "accepting") {
    const p = phase.preview;
    const building = getBuilding(p.buildingId);
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-card bg-cream p-4">
          <p className="font-display text-greeting font-extrabold tabular-nums text-maroon">{p.id}</p>
          <p className="text-body text-espresso">
            <span className="font-bold">{p.sourceName}</span> · {RUN_COPY.items(p.units)}
          </p>
          <dl className="flex flex-col gap-1 text-body text-espresso">
            <div className="flex gap-2">
              <dt className="text-mocha">{RUN_COPY.deliverTo}</dt>
              <dd className="font-medium">
                {building.short}, {building.dropPoint.toLowerCase()}
              </dd>
            </div>
            {p.promisedAt !== undefined ? (
              <div className="flex gap-2">
                <dt className="text-mocha">{RUN_COPY.promised}</dt>
                <dd className="font-medium tabular-nums">{formatClock(p.promisedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <p className="font-display text-section font-bold text-maroon">{p.staff ? RUN_COPY.noEarn : RUN_COPY.youEarn(p.earn)}</p>
        <div className="flex flex-col gap-3">
          <PillButton full arrow disabled={phase.kind === "accepting"} aria-busy={phase.kind === "accepting"} onClick={() => void accept(p)}>
            {phase.kind === "accepting" ? RUN_COPY.accepting : staff ? RUN_COPY.acceptStaff : RUN_COPY.accept}
          </PillButton>
          <PillButton variant="secondary" size="md" full disabled={phase.kind === "accepting"} onClick={again}>
            {RUN_COPY.back}
          </PillButton>
        </div>
      </div>
    );
  }

  if (phase.kind === "accepted") {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center" role="status">
        <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-olive" aria-hidden="true">
          <Check weight="bold" size={44} />
        </span>
        <p className="font-display text-title font-extrabold text-maroon">{RUN_COPY.acceptedTitle}</p>
        <p className="text-body text-espresso">{phase.line}</p>
        <div className="mt-2 flex w-full flex-col gap-3">
          <PillButton full arrow onClick={again}>
            {RUN_COPY.scanAnother}
          </PillButton>
          <PillButton full variant="secondary" size="md" onClick={onClose}>
            {RUN_COPY.close}
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-brick" aria-hidden="true">
        <WarningCircle weight="regular" size={44} />
      </span>
      <p role="alert" className="text-body font-medium text-espresso">
        {phase.message}
      </p>
      <div className="flex w-full flex-col gap-3">
        <PillButton full onClick={again}>
          {RUN_COPY.scanAnother}
        </PillButton>
        <PillButton full variant="secondary" size="md" onClick={() => typeInstead()}>
          {RUN_COPY.typeInstead}
        </PillButton>
      </div>
    </div>
  );
}

type HandoverPhase = { kind: "entering" } | { kind: "checking" } | { kind: "wrong"; message: string } | { kind: "delivered"; earned: number };

/** Handover: four code boxes, "Confirm delivery", retry on a wrong code, then the Delivered state. */
function HandoverFlow({ run, onClose }: { run: RunCard; onClose: () => void }) {
  const refresh = useRefreshRuns();
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<HandoverPhase>({ kind: "entering" });
  const building = getBuilding(run.buildingId);

  async function confirm(event?: FormEvent) {
    event?.preventDefault();
    if (code.length !== CODE_DIGITS || phase.kind === "checking") return;
    setPhase({ kind: "checking" });
    const res = await postJson<{ earned: number; balance: number }>("/api/runs/handover", { orderId: run.id, code });
    if (res.ok && res.data) {
      setPhase({ kind: "delivered", earned: res.data.earned });
      void refresh();
    } else {
      setCode("");
      setPhase({ kind: "wrong", message: res.error ?? RUN_ERRORS.badCode });
    }
  }

  if (phase.kind === "delivered") {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center" role="status">
        <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-olive" aria-hidden="true">
          <Check weight="bold" size={44} />
        </span>
        <p className="font-display text-title font-extrabold text-maroon">{RUN_COPY.deliveredTitle}</p>
        <p className="text-body text-espresso">{phase.earned > 0 ? RUN_COPY.deliveredEarned(phase.earned) : RUN_COPY.deliveredStaff}</p>
        <div className="mt-2 w-full">
          <PillButton full onClick={onClose}>
            {RUN_COPY.close}
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col items-center gap-5" onSubmit={confirm} noValidate>
      <p className="text-center text-body text-espresso">
        <span className="font-bold tabular-nums">{run.id}</span> · {RUN_COPY.forBuyer(run.buyerName)} · {building.short}, {building.dropPoint.toLowerCase()}
      </p>
      <p className="text-center text-secondary text-mocha">{RUN_COPY.handoverHint}</p>
      <CodeBoxes
        value={code}
        onChange={(value) => {
          setCode(value);
          if (phase.kind === "wrong") setPhase({ kind: "entering" });
        }}
        label="Handover code"
        invalid={phase.kind === "wrong"}
      />
      <p role="alert" className={`min-h-6 text-body font-medium text-brick ${phase.kind === "wrong" ? "" : "invisible"}`}>
        {phase.kind === "wrong" ? phase.message : " "}
      </p>
      <PillButton type="submit" full arrow disabled={code.length !== CODE_DIGITS || phase.kind === "checking"} aria-busy={phase.kind === "checking"}>
        {phase.kind === "checking" ? RUN_COPY.confirming : RUN_COPY.confirm}
      </PillButton>
    </form>
  );
}

/** The one runner sheet, for the whole student app. Its content restarts every time it opens. */
export function RunnerSheet({ mode, onClose }: { mode: RunnerMode; onClose: () => void }) {
  const title = mode.kind === "handover" ? RUN_COPY.handoverTitle : RUN_COPY.scanTitle;
  return (
    <Sheet open={mode.kind !== "closed"} onClose={onClose} title={title}>
      {mode.kind === "scan" ? <ScanFlow onClose={onClose} /> : null}
      {mode.kind === "handover" ? <HandoverFlow run={mode.run} onClose={onClose} /> : null}
    </Sheet>
  );
}
