"use client";

import { useState } from "react";
import useSWR from "swr";
import { DEMO_RESET_WORD } from "@/data/demo";
import { DEMO_COPY as copy } from "@/data/demo-copy";
import { Banner } from "@/components/ui/Banner";
import { Input } from "@/components/ui/Input";
import { PillButton, PillLink } from "@/components/ui/PillButton";
import { getJson, postJson } from "@/lib/http";

interface Person {
  id: string;
  name: string;
  role: "student" | "staff";
}

interface DemoInfo {
  env: "production" | "preview" | "local";
  prefix: string;
  people: Person[];
}

const selectClass = "h-12 w-full rounded-pill bg-cream px-4 text-body text-espresso";

/** Admin › Demo. Seed, a late-test order and reset, all inside this environment's key prefix. */
export function DemoPanel() {
  const { data, mutate } = useSWR<DemoInfo>("/api/admin/demo", getJson);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [buyer, setBuyer] = useState("");
  const [runner, setRunner] = useState("");
  const [typed, setTyped] = useState("");
  const [alsoStaff, setAlsoStaff] = useState(false);
  const [alsoHours, setAlsoHours] = useState(false);

  async function run<T>(body: object, done: (data: T) => string) {
    setBusy(true);
    setError("");
    setNotice("");
    const res = await postJson<T>("/api/admin/demo", body);
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? copy.failed);
      return;
    }
    setNotice(done(res.data));
    await mutate();
  }

  const people = data?.people ?? [];
  const students = people.filter((p) => p.role === "student");
  const live = data?.env === "production";

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="font-display text-title font-extrabold text-maroon">{copy.title}</h1>
        <p className="mt-1 text-body text-mocha">{copy.intro}</p>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-parchment p-5">
        <dl className="flex gap-8 text-body">
          <div>
            <dt className="text-secondary text-mocha">{copy.envLabel}</dt>
            <dd className="font-bold text-espresso" data-demo-env={data?.env ?? ""}>{data ? copy.env[data.env] : "…"}</dd>
          </div>
          <div>
            <dt className="text-secondary text-mocha">{copy.prefixLabel}</dt>
            <dd className="font-bold text-espresso tabular-nums">{data?.prefix ?? "…"}</dd>
          </div>
        </dl>
        <PillLink href="/admin/service" size="md" variant="secondary">{copy.serviceLink}</PillLink>
      </section>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {notice ? <Banner>{notice}</Banner> : null}

      <section className="flex flex-col gap-3 rounded-card bg-parchment p-5">
        <h2 className="font-display text-section font-bold text-maroon">{copy.seedTitle}</h2>
        <p className="text-body text-espresso">{copy.seedBody}</p>
        <div>
          <PillButton size="md" disabled={busy} onClick={() => void run({ action: "seed" }, () => copy.seeded)}>
            {busy ? copy.working : copy.seed}
          </PillButton>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-card bg-parchment p-5">
        <h2 className="font-display text-section font-bold text-maroon">{copy.lateTitle}</h2>
        <p className="text-body text-espresso">{copy.lateBody}</p>
        {people.length === 0 ? <p className="text-body text-mocha">{copy.noPeople}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-secondary font-medium text-mocha">
            {copy.buyerLabel}
            <select className={selectClass} value={buyer} onChange={(e) => setBuyer(e.target.value)}>
              <option value="">{copy.choose}</option>
              {students.map((p) => (
                <option key={p.id} value={p.id}>{`${p.name} · ${p.id}`}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-secondary font-medium text-mocha">
            {copy.runnerLabel}
            <select className={selectClass} value={runner} onChange={(e) => setRunner(e.target.value)}>
              <option value="">{copy.choose}</option>
              {people.filter((p) => p.id !== buyer).map((p) => (
                <option key={p.id} value={p.id}>{`${p.name} · ${p.id}`}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <PillButton
            size="md"
            variant="secondary"
            disabled={busy || !buyer || !runner || buyer === runner}
            onClick={() => void run<{ id: string }>({ action: "late", buyerId: buyer, runnerId: runner }, (d) => copy.lateMade(d.id))}
          >
            {copy.late}
          </PillButton>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-card bg-parchment p-5">
        <h2 className="font-display text-section font-bold text-maroon">{copy.resetTitle}</h2>
        {live ? <Banner tone="warning">{copy.liveWarning}</Banner> : null}
        <p className="text-body text-espresso">{copy.resetBody}</p>
        <label className="flex min-h-11 items-center gap-3 text-body text-espresso">
          <input type="checkbox" className="size-5 accent-maroon" checked={alsoStaff} onChange={(e) => setAlsoStaff(e.target.checked)} />
          {copy.alsoStaff}
        </label>
        <label className="flex min-h-11 items-center gap-3 text-body text-espresso">
          <input type="checkbox" className="size-5 accent-maroon" checked={alsoHours} onChange={(e) => setAlsoHours(e.target.checked)} />
          {copy.alsoHours}
        </label>
        <Input label={copy.typeLabel(DEMO_RESET_WORD)} value={typed} autoComplete="off" onChange={(e) => setTyped(e.target.value)} />
        <div>
          <PillButton
            size="md"
            variant="secondary"
            disabled={busy || typed !== DEMO_RESET_WORD}
            onClick={() =>
              void run<{ deleted: number }>({ action: "reset", confirm: typed, staff: alsoStaff, hours: alsoHours }, (d) => {
                setTyped("");
                return copy.resetDone(d.deleted);
              })
            }
          >
            {copy.reset}
          </PillButton>
        </div>
      </section>
    </div>
  );
}
