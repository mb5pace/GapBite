"use client";

import { BottomBar } from "./BottomBar";
import { Header } from "./Header";
import { useMe } from "./useMe";

/** The header, fed by the live /api/me. (The /kit gallery uses the plain Header with fixed props.) */
export function LiveHeader({ greeting, tempMsLeft }: { greeting: string; tempMsLeft: number | null }) {
  const me = useMe();
  return (
    <Header
      greeting={greeting}
      name={me.user.name}
      isStaff={me.user.role === "staff"}
      balance={me.balance}
      tempMsLeft={tempMsLeft}
    />
  );
}

/** The bottom bar, with its two dots fed by the live /api/me. */
export function LiveBottomBar() {
  const me = useMe();
  return <BottomBar unread={me.unread > 0} activeOrder={me.activeOrder} />;
}
