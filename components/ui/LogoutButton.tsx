"use client";

import { SignOut } from "@phosphor-icons/react";
import { useState } from "react";
import { COPY } from "@/data/copy";
import { postJson } from "@/lib/http";
import { PillButton } from "./PillButton";

/**
 * Clears the session and goes back to the gate. Used in all three portals. `rail` is the Cafe sidebar's 48 px row:
 * icon and label, the label hidden (but still read out) when the sidebar is the narrow icon rail.
 */
export function LogoutButton({ rail = false }: { rail?: boolean } = {}) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await postJson("/api/auth/logout", {}, { redirectOn401: false });
    // A full page load, so no protected page stays cached in the browser.
    window.location.replace("/");
  }

  if (rail) {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-pill px-3 text-body font-semibold text-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:text-taupe xl:justify-start"
      >
        <SignOut weight="regular" size={24} aria-hidden="true" className="shrink-0" />
        <span className="sr-only xl:not-sr-only">{COPY.student.logout}</span>
      </button>
    );
  }

  return (
    <PillButton variant="outline" size="md" className="whitespace-nowrap" onClick={logout} disabled={busy}>
      <SignOut weight="regular" size={20} aria-hidden="true" />
      {COPY.student.logout}
    </PillButton>
  );
}
