"use client";

import { BottomBar } from "./BottomBar";
import { Header } from "./Header";
import { useMe } from "./useMe";

/** The header, fed by the live /api/me. (The /kit gallery uses the plain Header with fixed props.) */
export function LiveHeader({ tempMsLeft }: { tempMsLeft: number | null }) {
  const me = useMe();
  return (
    <Header balance={me.balance} tempMsLeft={tempMsLeft} />
  );
}

/** The bottom bar, with its two dots fed by the live /api/me. */
export function LiveBottomBar() {
  const me = useMe();
  return <BottomBar unread={me.unread > 0} activeOrder={me.activeOrder} />;
}
