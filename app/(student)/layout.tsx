import type { ReactNode } from "react";
import { SessionChip } from "@/components/student/SessionChip";
import { requirePageSession } from "@/lib/auth";
import { msUntilExpiry } from "@/lib/session";

/**
 * Placeholder student shell. Phase 2 replaces the top bar with the real header
 * (greeting, Scan, wallet chip) and adds the floating bottom bar. The session
 * check and the temp-session chip stay.
 */
export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requirePageSession("student", { user: true });
  const tempMsLeft = session.codeType === "temp" ? msUntilExpiry(session) : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5">
      <header className="flex h-16 items-center justify-between">
        <span className="font-display text-section font-extrabold text-maroon">QuickX</span>
        {tempMsLeft !== null ? <SessionChip msLeft={tempMsLeft} /> : null}
      </header>
      <main className="flex-1 pb-8">{children}</main>
    </div>
  );
}
