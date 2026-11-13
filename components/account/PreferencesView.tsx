"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { BUILDINGS, getBuilding, type BuildingId } from "@/data/locations";
import { Banner } from "@/components/ui/Banner";
import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/PillButton";
import { useMe } from "@/components/student/useMe";
import { formatRupees } from "@/lib/format";
import { postJson } from "@/lib/http";
import { feeFor } from "@/lib/order-rules";
import type { OrderMode } from "@/lib/order-types";
import type { DefaultWhen, Prefs } from "@/lib/prefs-rules";

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-section font-bold text-maroon">{title}</h2>
      {children}
      {hint ? <p className="text-secondary text-mocha">{hint}</p> : null}
    </section>
  );
}

/**
 * Account › Preferences: the default building, the default way to get it, and the default time. Checkout and
 * the Next break strip on Home start from these. Saved on the server, so they follow you to any phone.
 */
export function PreferencesView() {
  const me = useMe();
  const { mutate } = useSWRConfig();
  const copy = ACCOUNT_COPY.preferences;
  const [building, setBuilding] = useState<BuildingId>(me.prefs.defaultBuilding);
  const [mode, setMode] = useState<OrderMode>(me.prefs.defaultMode);
  const [when, setWhen] = useState<DefaultWhen>(me.prefs.defaultWhen);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const unchanged = building === me.prefs.defaultBuilding && mode === me.prefs.defaultMode && when === me.prefs.defaultWhen;
  const picked = getBuilding(building);

  async function save() {
    if (busy || unchanged) return;
    setBusy(true);
    setError("");
    setSaved(false);
    const res = await postJson<{ prefs: Prefs }>("/api/prefs", { defaultBuilding: building, defaultMode: mode, defaultWhen: when }, { method: "PUT" });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? copy.failed);
      return;
    }
    setSaved(true);
    await mutate("/api/me");
  }

  function change<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setSaved(false);
    setError("");
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <p className="text-body text-espresso">{copy.intro}</p>

      <Group title={copy.modeLabel} hint={copy.modeHint}>
        <div role="radiogroup" aria-label={copy.modeLabel} className="flex flex-wrap gap-2">
          <Chip role="radio" aria-checked={mode === "pickup"} selected={mode === "pickup"} onClick={() => change(setMode, "pickup")}>
            {copy.modePickup}
          </Chip>
          <Chip role="radio" aria-checked={mode === "delivery"} selected={mode === "delivery"} onClick={() => change(setMode, "delivery")}>
            {copy.modeDelivery}
          </Chip>
        </div>
      </Group>

      <Group title={copy.buildingLabel} hint={`${picked.short} · ${picked.dropPoint} · ${picked.walkMin} min walk · ${formatRupees(feeFor("delivery", picked.id))} delivery`}>
        <div role="radiogroup" aria-label={copy.buildingLabel} className="flex flex-wrap gap-2">
          {BUILDINGS.map((b) => (
            <Chip key={b.id} role="radio" aria-checked={building === b.id} selected={building === b.id} onClick={() => change(setBuilding, b.id)}>
              {b.short}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title={copy.whenLabel} hint={copy.whenHint}>
        <div role="radiogroup" aria-label={copy.whenLabel} className="flex flex-wrap gap-2">
          <Chip role="radio" aria-checked={when === "asap"} selected={when === "asap"} onClick={() => change(setWhen, "asap")}>
            {copy.whenAsap}
          </Chip>
          <Chip role="radio" aria-checked={when === "next-break"} selected={when === "next-break"} onClick={() => change(setWhen, "next-break")}>
            {copy.whenNextBreak}
          </Chip>
        </div>
      </Group>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {saved ? <Banner>{copy.saved}</Banner> : null}
      <PillButton full arrow onClick={save} disabled={busy || unchanged} aria-busy={busy}>
        {busy ? copy.saving : copy.save}
      </PillButton>
    </div>
  );
}
