"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { Banner } from "@/components/ui/Banner";
import { Toggle } from "@/components/ui/Toggle";
import { useMe } from "@/components/student/useMe";
import { playChime, unlockAudio } from "@/lib/chime";
import { postJson } from "@/lib/http";
import type { NotificationPrefs, Prefs } from "@/lib/prefs-rules";

type Switch = keyof NotificationPrefs;

/**
 * Account › Notifications: three switches, saved the moment you flip them. Only Sounds does anything (a soft
 * chime when a new Update arrives); the other two say they are not connected yet.
 */
export function NotificationsView() {
  const me = useMe();
  const { mutate } = useSWRConfig();
  const copy = ACCOUNT_COPY.notifications;
  const [current, setCurrent] = useState<NotificationPrefs>(me.prefs.notifications);
  const [error, setError] = useState("");

  async function flip(name: Switch, next: boolean) {
    const before = current;
    const after = { ...current, [name]: next };
    setCurrent(after); // shows at once; goes back if the server says no
    setError("");
    if (name === "sounds" && next) void unlockAudio().then((ready) => (ready ? playChime() : undefined)); // a tap, so the browser allows it
    const res = await postJson<{ prefs: Prefs }>("/api/prefs", { notifications: after }, { method: "PUT" });
    if (!res.ok) {
      setCurrent(before);
      setError(res.error ?? copy.saveFailed);
      return;
    }
    await mutate("/api/me");
  }

  const rows: { name: Switch; label: string; hint: string; cosmetic: boolean }[] = [
    { name: "orderUpdates", label: copy.orderUpdates.label, hint: copy.orderUpdates.hint, cosmetic: true },
    { name: "walletUpdates", label: copy.walletUpdates.label, hint: copy.walletUpdates.hint, cosmetic: true },
    { name: "sounds", label: copy.sounds.label, hint: copy.sounds.hint, cosmetic: false },
  ];

  return (
    <div className="flex flex-col gap-5 pt-2">
      <p className="text-body text-espresso">{copy.intro}</p>
      {error ? <Banner tone="error">{error}</Banner> : null}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-3 rounded-card bg-parchment p-4">
            <div className="min-w-0">
              <p className="font-display text-section font-bold text-maroon">{row.label}</p>
              <p className="text-secondary text-mocha">{row.hint}</p>
            </div>
            <Toggle checked={current[row.name]} onChange={(next) => void flip(row.name, next)} label={row.label} />
          </li>
        ))}
      </ul>
      <p className="text-secondary text-mocha">{copy.soundsNote}</p>
    </div>
  );
}
