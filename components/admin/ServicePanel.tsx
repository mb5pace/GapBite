"use client";

import { useState } from "react";
import useSWR from "swr";
import { COPY } from "@/data/copy";
import { Banner } from "@/components/ui/Banner";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { Toggle } from "@/components/ui/Toggle";
import { SERVICE_MESSAGE_MAX } from "@/lib/config";
import type { ServiceState } from "@/lib/hours-rules";
import { getJson, postJson } from "@/lib/http";

/**
 * Admin › Service. One switch for the whole service and the message students read while it is off. Turning it off asks
 * first, because it stops every new order everywhere. Turning it on, or changing the message, does not.
 */
export function ServicePanel() {
  const copy = COPY.admin.service;
  const { data, mutate } = useSWR<{ service: ServiceState }>("/api/admin/service", getJson, { revalidateOnFocus: true });
  const saved = data?.service;
  // null = the admin has not typed yet, so the box shows what is saved. Once they type it is theirs.
  const [draft, setDraft] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const message = draft ?? saved?.message ?? "";

  async function save(available: boolean, text: string, done: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const res = await postJson<{ service: ServiceState }>("/api/admin/service", { available, message: text }, { method: "PUT" });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? copy.failed);
      return false;
    }
    await mutate({ service: res.data.service }, { revalidate: false });
    setDraft(null);
    setNotice(done);
    return true;
  }

  const available = saved?.available ?? true;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="font-display text-title font-extrabold text-maroon">{copy.title}</h1>
        <p className="mt-1 text-body text-mocha">{copy.intro}</p>
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {notice ? <Banner>{notice}</Banner> : null}

      <section className="flex items-center justify-between gap-4 rounded-card bg-parchment p-5" aria-label={copy.stateLabel}>
        <div>
          <p className="font-display text-section font-bold text-maroon">{copy.stateLabel}</p>
          <p className="text-body text-espresso" data-service-state={available ? "on" : "off"}>
            {available ? copy.on : copy.off}
          </p>
        </div>
        <Toggle
          checked={available}
          disabled={!saved || busy}
          label={copy.stateLabel}
          onChange={(next) => (next ? void save(true, message, copy.savedOn) : setConfirming(true))}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-card bg-parchment p-5">
        <Input
          label={copy.messageLabel}
          hint={copy.messageHint}
          value={message}
          maxLength={SERVICE_MESSAGE_MAX}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div>
          <PillButton size="md" disabled={busy || !saved || message.trim() === ""} onClick={() => void save(available, message, copy.saved)}>
            {busy ? copy.saving : copy.save}
          </PillButton>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-secondary font-medium text-mocha">{copy.previewLabel}</p>
          <Banner tone="warning">{message.trim()}</Banner>
        </div>
      </section>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title={copy.switchOff} placement="center">
        <p className="text-body text-espresso">{copy.switchOffBody}</p>
        <div className="mt-6 flex gap-3">
          <PillButton
            size="md"
            disabled={busy}
            onClick={async () => {
              const done = await save(false, message, copy.saved);
              if (done) setConfirming(false);
            }}
          >
            {copy.confirmOff}
          </PillButton>
          <PillButton size="md" variant="secondary" onClick={() => setConfirming(false)}>
            {copy.keepOn}
          </PillButton>
        </div>
      </Sheet>
    </div>
  );
}
