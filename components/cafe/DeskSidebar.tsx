"use client";

import { CalendarCheck, Clock, DotsNine, Receipt, SpeakerHigh, SpeakerSlash, Storefront, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CAFE_COPY } from "@/data/cafe-copy";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { QuickXMark } from "@/components/ui/QuickXMark";
import { VersionLine } from "@/components/ui/VersionLine";
import { useQueue } from "./QueueProvider";

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** The queue's front page only counts as open on exactly /cafe. */
  exact?: boolean;
  badge?: number;
}

const ROW =
  "relative flex h-12 w-full items-center justify-center gap-3 whitespace-nowrap rounded-pill px-3 text-body font-semibold xl:justify-start " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";

/**
 * The POS sidebar (v1.0.0 Phase C1): the QuickX mark and "UC Cafe Desk", the pages as 48 px rows (the open one filled
 * maroon), and at the bottom the sound switch, Log out and the version line. 220 px wide from 1280 px; below that it
 * is a 72 px rail of icons, the labels still read out by screen readers.
 */
export function DeskSidebar() {
  const pathname = usePathname();
  const { orders, soundOn, setSoundOn, audioReady } = useQueue();
  const waiting = orders.filter((o) => o.status === "PLACED").length;
  const nav = CAFE_COPY.nav;
  const items: NavItem[] = [
    { href: "/cafe", label: nav.queue, icon: Receipt, exact: true, badge: waiting },
    { href: "/cafe/vending", label: nav.vending, icon: Storefront },
    { href: "/cafe/hours", label: nav.hours, icon: Clock },
    { href: "/cafe/today", label: nav.today, icon: CalendarCheck },
    { href: "/cafe/kiosk", label: nav.kiosk, icon: DotsNine },
  ];
  const SoundIcon = soundOn ? SpeakerHigh : SpeakerSlash;

  return (
    <aside className="flex h-dvh w-[72px] shrink-0 flex-col gap-6 bg-parchment px-3 py-4 xl:w-[220px]" data-desk-sidebar="">
      <div className="flex items-center justify-center gap-3 xl:justify-start">
        <QuickXMark className="size-10 shrink-0" />
        <span className="sr-only font-display text-section font-extrabold leading-tight text-maroon xl:not-sr-only">{CAFE_COPY.shell.deskName}</span>
      </div>

      <nav aria-label={CAFE_COPY.shell.navLabel} className="flex flex-col gap-2">
        {items.map((item) => {
          const current = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`${ROW} ${current ? "bg-maroon text-cream" : "text-espresso"}`}
            >
              <ItemIcon weight={current ? "bold" : "regular"} size={24} aria-hidden="true" className="shrink-0" />
              <span className="sr-only xl:not-sr-only">{item.label}</span>
              {item.badge ? (
                <span className="absolute right-1 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-sun px-1 text-caption font-bold tabular-nums text-espresso xl:static xl:ml-auto">
                  {item.badge}
                  <span className="sr-only"> new</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          aria-pressed={soundOn}
          onClick={() => setSoundOn(!soundOn)}
          className={`${ROW} text-espresso`}
          aria-describedby={soundOn && !audioReady ? "sound-hint" : undefined}
        >
          <SoundIcon weight="regular" size={24} aria-hidden="true" className="shrink-0" />
          <span className="sr-only xl:not-sr-only">{soundOn ? CAFE_COPY.soundOn : CAFE_COPY.soundOff}</span>
          {/* On the narrow rail the hint has no room: a small sun dot says sound is still waiting for that first click. */}
          {soundOn && !audioReady ? <span className="absolute right-2 top-2 size-2 rounded-pill bg-sun xl:hidden" aria-hidden="true" /> : null}
        </button>
        {soundOn && !audioReady ? (
          <p id="sound-hint" className="sr-only text-caption leading-tight text-mocha xl:not-sr-only xl:px-3">
            {CAFE_COPY.soundHint}
          </p>
        ) : null}
        <LogoutButton rail />
        <VersionLine className="hidden xl:block xl:px-3" />
      </div>
    </aside>
  );
}
