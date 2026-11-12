import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BottomBar } from "@/components/student/BottomBar";
import { Header } from "@/components/student/Header";
import { requirePageSession } from "@/lib/auth";
import { msUntilExpiry } from "@/lib/session";
import { greetingNow } from "@/lib/time";
import { getUser } from "@/lib/users";
import { getBalance } from "@/lib/wallet";

/**
 * The student shell: a persistent header and the floating bottom bar around
 * every student page, in a 430 px column on cream (UI_UX_BIBLE.md section 7).
 * The unread and active-order dots stay off until Updates and orders exist
 * (Phase 5).
 */
export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requirePageSession("student", { user: true });
  const userId = session.userId as string;
  const [user, balance] = await Promise.all([getUser(userId), getBalance(userId)]);
  if (!user) redirect("/identify");

  const tempMsLeft = session.codeType === "temp" ? msUntilExpiry(session) : null;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px]">
      <Header
        greeting={greetingNow()}
        name={user.name}
        isStaff={user.role === "staff"}
        balance={balance}
        tempMsLeft={tempMsLeft}
      />
      <main className="px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-2">{children}</main>
      <BottomBar unread={false} activeOrder={false} />
    </div>
  );
}
