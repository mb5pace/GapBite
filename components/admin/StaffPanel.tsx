"use client";

import { Users } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { FIRST_NAME_MAX, POLL_MS } from "@/lib/config";
import { getJson, postJson } from "@/lib/http";
import type { UserRecord } from "@/lib/users";
import { CopyButton } from "./CopyButton";

const STAFF_URL = "/api/admin/staff";

interface StaffList {
  staff: UserRecord[];
}
interface Created extends StaffList {
  created: UserRecord;
}

/** Admin › Staff: add a staff member, get their ID, see everyone. */
export function StaffPanel() {
  const { data, error, mutate, isLoading } = useSWR<StaffList>(STAFF_URL, getJson, {
    refreshInterval: POLL_MS.admin,
  });
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState<UserRecord | null>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    const res = await postJson<Created>(STAFF_URL, { name });
    if (res.ok && res.data) {
      setJustAdded(res.data.created);
      setName("");
      await mutate({ staff: res.data.staff }, { revalidate: false });
    } else {
      setFormError(res.error ?? COPY.common.network);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title font-extrabold text-maroon">{COPY.admin.staff.title}</h1>
        <p className="mt-1 text-body text-mocha">{COPY.admin.staff.intro}</p>
      </div>

      <section className="rounded-card bg-parchment p-6" aria-labelledby="add-staff-heading">
        <h2 id="add-staff-heading" className="font-display text-section font-bold text-maroon">
          {COPY.admin.staff.addButton}
        </h2>
        <form onSubmit={add} className="mt-4 flex flex-wrap items-start gap-4" noValidate>
          <div className="w-full max-w-sm">
            <Input
              label={COPY.admin.staff.nameLabel}
              hint={COPY.admin.staff.nameHint}
              value={name}
              maxLength={FIRST_NAME_MAX}
              onChange={(e) => {
                setName(e.target.value);
                if (formError) setFormError("");
              }}
              error={formError}
              autoComplete="off"
              name="staff-name"
            />
          </div>
          <div className="pt-8">
            <PillButton type="submit" disabled={busy || name.trim() === ""} aria-busy={busy}>
              {COPY.admin.staff.addButton}
            </PillButton>
          </div>
        </form>

        {justAdded ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card bg-cream p-5" role="status">
            <div>
              <p className="text-secondary font-medium text-mocha">
                {COPY.admin.staff.addedHeading} for {justAdded.name}
              </p>
              <p className="mt-1 font-display text-greeting font-extrabold text-maroon">{justAdded.id}</p>
              <p className="mt-1 text-secondary text-mocha">{COPY.admin.staff.addedHelp}</p>
            </div>
            <CopyButton getText={async () => justAdded.id} />
          </div>
        ) : null}
      </section>

      <section className="rounded-card bg-parchment p-6" aria-labelledby="staff-list-heading">
        <h2 id="staff-list-heading" className="font-display text-section font-bold text-maroon">
          {COPY.admin.staff.listHeading}
        </h2>

        {isLoading ? (
          <div className="mt-4 h-24 rounded-card bg-sand" aria-busy="true" aria-label="Loading staff" />
        ) : error || !data ? (
          <div className="mt-4 flex flex-col items-start gap-3">
            <p className="text-body text-espresso">{error?.message ?? COPY.common.network}</p>
            <PillButton variant="secondary" size="md" onClick={() => mutate()}>
              Try again
            </PillButton>
          </div>
        ) : data.staff.length === 0 ? (
          <EmptyState icon={<Users weight="regular" size={40} />}>{COPY.admin.staff.empty}</EmptyState>
        ) : (
          <table className="mt-4 w-full text-left">
            <thead>
              <tr className="text-secondary text-mocha">
                <th scope="col" className="py-2 pr-4 font-medium">Staff ID</th>
                <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                <th scope="col" className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.staff.map((member) => (
                <tr key={member.id} className="border-t border-sand">
                  <td className="py-3 pr-4 font-display text-section font-bold text-espresso">{member.id}</td>
                  <td className="py-3 pr-4 text-body text-espresso">{member.name}</td>
                  <td className="py-3 text-right">
                    <CopyButton getText={async () => member.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
