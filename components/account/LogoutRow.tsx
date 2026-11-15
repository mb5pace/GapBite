"use client";

import { useState, type ReactNode } from "react";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { NavRowButton } from "@/components/ui/NavRow";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";
import { postJson } from "@/lib/http";

/** Account › Log out: a row that opens a confirm sheet. Orders already placed carry on. */
export function LogoutRow({ icon }: { icon: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await postJson("/api/auth/logout", {}, { redirectOn401: false });
    // A full page load, so no protected page stays cached in the browser.
    window.location.replace("/");
  }

  return (
    <>
      <NavRowButton icon={icon} title={ACCOUNT_COPY.logout.row} hint={ACCOUNT_COPY.logout.hint} onClick={() => setOpen(true)} />
      <Sheet open={open} onClose={() => (busy ? undefined : setOpen(false))} title={ACCOUNT_COPY.logout.title}>
        <p className="text-body text-espresso">{ACCOUNT_COPY.logout.body}</p>
        <div className="mt-6 flex flex-col gap-3">
          <PillButton full onClick={logout} disabled={busy} aria-busy={busy}>
            {ACCOUNT_COPY.logout.confirm}
          </PillButton>
          <PillButton full variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            {ACCOUNT_COPY.logout.stay}
          </PillButton>
        </div>
      </Sheet>
    </>
  );
}
