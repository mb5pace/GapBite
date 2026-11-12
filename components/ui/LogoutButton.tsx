"use client";

import { SignOut } from "@phosphor-icons/react";
import { useState } from "react";
import { COPY } from "@/data/copy";
import { postJson } from "@/lib/http";
import { PillButton } from "./PillButton";

/** Clears the session and goes back to the gate. Used in all three portals. */
export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await postJson("/api/auth/logout", {}, { redirectOn401: false });
    // A full page load, so no protected page stays cached in the browser.
    window.location.replace("/");
  }

  return (
    <PillButton variant="outline" size="md" onClick={logout} disabled={busy}>
      <SignOut weight="regular" size={18} aria-hidden="true" />
      {COPY.student.logout}
    </PillButton>
  );
}
