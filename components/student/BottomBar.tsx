"use client";

import { Bell, Compass, House, Receipt, User } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { COPY } from "@/data/copy";

type Tab = {
  key: keyof typeof COPY.student.tabs;
  href: string;
  /** Path prefixes that keep this tab lit, for example the cart belongs to Home. */
  match: string[];
  Icon: ComponentType<{ weight?: "regular" | "bold"; size?: number; "aria-hidden"?: boolean }>;
};

const TABS: Tab[] = [
  { key: "home", href: "/home", match: ["/home", "/s", "/cart", "/checkout"], Icon: House },
  { key: "discover", href: "/discover", match: ["/discover"], Icon: Compass },
  { key: "orders", href: "/orders", match: ["/orders", "/o"], Icon: Receipt },
  { key: "updates", href: "/updates", match: ["/updates"], Icon: Bell },
  { key: "account", href: "/account", match: ["/account"], Icon: User },
];

function isActive(tab: Tab, pathname: string): boolean {
  return tab.match.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

/**
 * Floating bottom bar (UI_UX_BIBLE.md section 4): five 48 px circles on a
 * `parchment` pill, 12 px above the safe area. Active = filled maroon with a
 * bold cream icon; inactive = sand with a regular espresso icon. Labels are
 * hidden and read out through aria-label. The two dots are real states:
 * unread Updates, and an order in progress.
 * `floating={false}` and `pathname` are only for the /kit gallery.
 */
export function BottomBar({
  unread,
  activeOrder,
  floating = true,
  pathname,
}: {
  unread: boolean;
  activeOrder: boolean;
  floating?: boolean;
  pathname?: string;
}) {
  const livePath = usePathname();
  const path = pathname ?? livePath;

  return (
    <nav
      aria-label="Main"
      className={
        floating
          ? "pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40"
          : ""
      }
    >
      <div className={floating ? "mx-auto w-full max-w-[430px] px-5" : ""}>
        <ul className="pointer-events-auto flex items-center justify-between rounded-pill bg-parchment p-2 shadow-float">
          {TABS.map((tab) => {
            const active = isActive(tab, path);
            const dot = (tab.key === "updates" && unread) || (tab.key === "orders" && activeOrder);
            const label = COPY.student.tabs[tab.key];
            return (
              <li key={tab.key} className="relative">
                <Link
                  href={tab.href}
                  aria-label={
                    tab.key === "updates" && unread
                      ? `${label}, unread`
                      : tab.key === "orders" && activeOrder
                        ? `${label}, order in progress`
                        : label
                  }
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex size-12 items-center justify-center rounded-pill transition-transform duration-150 ease-out active:scale-[0.97]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
                    active ? "bg-maroon text-cream" : "bg-sand text-espresso",
                  ].join(" ")}
                >
                  <tab.Icon weight={active ? "bold" : "regular"} size={24} aria-hidden={true} />
                </Link>
                {dot ? (
                  <span
                    className="absolute right-0 top-0 size-3 rounded-pill bg-maroon ring-2 ring-parchment"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
