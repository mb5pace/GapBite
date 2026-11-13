"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { CAFE_COPY } from "@/data/cafe-copy";
import { COPY } from "@/data/copy";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { PillButton } from "@/components/ui/PillButton";
import { PortalNav } from "@/components/ui/PortalNav";
import { formatClock } from "@/lib/time";
import { useQueue } from "./QueueProvider";

/** "QuickX · UC Cafe Desk", the pages, the server clock, the sound switch and Logout. */
export function CafeHeader() {
  const { orders, now, soundOn, setSoundOn, announcement, stale, audioReady } = useQueue();
  const waiting = orders.filter((o) => o.status === "PLACED").length;
  const links = [
    { href: "/cafe", label: CAFE_COPY.nav.queue, badge: waiting },
    { href: "/cafe/vending", label: CAFE_COPY.nav.vending },
    { href: "/cafe/menu", label: CAFE_COPY.nav.menu },
    { href: "/cafe/today", label: CAFE_COPY.nav.today },
  ];

  return (
    <header className="bg-parchment">
      <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2">
        <span className="font-display text-section font-extrabold whitespace-nowrap text-maroon">{COPY.cafe.title}</span>
        <PortalNav label="Cafe desk" links={links} />
        <span className="ml-auto flex items-center gap-3">
          <span
            className="text-body font-medium tabular-nums text-espresso"
            role="timer"
            aria-label={`${CAFE_COPY.clockLabel}, IST`}
          >
            {formatClock(now)}
          </span>
          {soundOn && !audioReady ? <span className="max-w-44 text-caption leading-tight text-mocha">{CAFE_COPY.soundHint}</span> : null}
          <PillButton variant="secondary" size="md" className="whitespace-nowrap" aria-pressed={soundOn} onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <SpeakerHigh weight="regular" size={18} aria-hidden="true" /> : <SpeakerSlash weight="regular" size={18} aria-hidden="true" />}
            {soundOn ? CAFE_COPY.soundOn : CAFE_COPY.soundOff}
          </PillButton>
          <LogoutButton />
        </span>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {stale ? <p className="sr-only" role="alert">{CAFE_COPY.queueError}</p> : null}
    </header>
  );
}
