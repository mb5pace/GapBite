import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CartBar, CartBarSpacer } from "@/components/student/CartBar";
import { StudentProviders } from "@/components/student/CartProvider";
import { RunnerProvider } from "@/components/runner/RunnerProvider";
import { LiveBottomBar, LiveHeader } from "@/components/student/Live";
import { UpdateSound } from "@/components/student/UpdateSound";
import { requirePageSession } from "@/lib/auth";
import { getMeNow } from "@/lib/me";
import { getMenuStateNow } from "@/lib/menu";
import { greetingNow } from "@/lib/time";

/**
 * The student shell: a persistent header and the floating bottom bar around
 * every student page, in a 430 px column on cream (UI_UX_BIBLE.md section 7).
 * The wallet balance and the two tab-bar dots (unread Updates, an order in
 * progress) are live from /api/me.
 */
export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requirePageSession("student", { user: true });
  const [me, menu] = await Promise.all([getMeNow(session), getMenuStateNow()]);
  if (!me) redirect("/identify");

  return (
    <StudentProviders userId={me.user.id} initialMenu={menu} initialMe={me}>
      <RunnerProvider>
        <UpdateSound />
        <div className="mx-auto min-h-dvh w-full max-w-[430px]">
          <LiveHeader greeting={greetingNow()} tempMsLeft={me.sessionMsLeft} />
          <main className="px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-2">
            {children}
            <CartBarSpacer />
          </main>
          <CartBar />
          <LiveBottomBar />
        </div>
      </RunnerProvider>
    </StudentProviders>
  );
}
