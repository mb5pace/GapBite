"use client";

import { useState, type FormEvent } from "react";
import { useSWRConfig } from "swr";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { Banner } from "@/components/ui/Banner";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { useMe } from "@/components/student/useMe";
import { FIRST_NAME_MAX } from "@/lib/config";
import { postJson } from "@/lib/http";

/** Account › My Profile: the first name can be changed; the ID and the role are shown and cannot. */
export function ProfileView() {
  const me = useMe();
  const { mutate } = useSWRConfig();
  const copy = ACCOUNT_COPY.profile;
  const isStaff = me.user.role === "staff";
  const [name, setName] = useState(me.user.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setSaved("");
    if (name.trim() === me.user.name) {
      setError(copy.unchanged);
      return;
    }
    setBusy(true);
    const res = await postJson<{ user: { name: string } }>("/api/profile", { name }, { method: "PUT" });
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? copy.failed);
      return;
    }
    setName(res.data.user.name);
    setSaved(copy.saved(res.data.user.name));
    await mutate("/api/me");
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5 pt-2" noValidate>
      <Input
        label={copy.nameLabel}
        hint={copy.nameHint}
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={FIRST_NAME_MAX + 10}
        autoComplete="given-name"
        enterKeyHint="done"
        error={error || undefined}
      />
      <dl className="flex flex-col gap-3 rounded-card bg-parchment p-4 text-body text-espresso">
        <div>
          <dt className="text-secondary text-mocha">{isStaff ? copy.idLabelStaff : copy.idLabelStudent}</dt>
          <dd className="font-bold tabular-nums">{me.user.id}</dd>
        </div>
        <div>
          <dt className="text-secondary text-mocha">{copy.roleLabel}</dt>
          <dd className="font-bold">{isStaff ? copy.roleStaff : copy.roleStudent}</dd>
        </div>
        <p className="text-secondary text-mocha">{copy.idHint}</p>
      </dl>
      {saved ? <Banner>{saved}</Banner> : null}
      <PillButton type="submit" full arrow disabled={busy} aria-busy={busy}>
        {busy ? copy.saving : copy.save}
      </PillButton>
    </form>
  );
}
