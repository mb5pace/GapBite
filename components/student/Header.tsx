"use client";

import { ArrowLeft, MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY } from "@/data/copy";
import { getSource, isSourceId } from "@/data/menu";
import { ScanButton } from "@/components/runner/ScanButton";
import { SessionChip } from "./SessionChip";
import { WalletChip } from "./WalletChip";

type Titles = Record<string, string>;

/** What the header shows for a path: the title (null on Home, which shows the greeting) and where Back goes, if anywhere. */
export function routeFor(pathname: string): { title: string | null; back?: string } {
  const [first, second] = pathname.split("/").filter(Boolean);
  const titles = COPY.student.titles as Titles;
  if (!first || first === "home") return { title: null };
  if (first === "s") return { title: second && isSourceId(second) ? getSource(second).name : "QuickX", back: "/home" };
  if (first === "cart") return { title: titles.cart, back: "/home" };
  if (first === "checkout") return { title: titles.checkout, back: "/cart" };
  if (first === "o") return { title: titles.order, back: "/orders" };
  if (first === "discover" && second) {
    return { title: (COPY.student.discoverTopics as Titles)[second] ?? titles.discover, back: "/discover" };
  }
  if (first === "account" && second) {
    return { title: (COPY.student.accountSections as Titles)[second] ?? titles.account, back: "/account" };
  }
  return { title: titles[first] ?? "QuickX" };
}

/**
 * Persistent student header (docs/SCREENS.md): on Home the campus and the place (Ahmedabad University, University
 * Centre), on other pages the title or a Back arrow, on the left; Scan and the wallet chip on the right. A temp-session countdown shows on
 * its own row only in the last 3 minutes. `pathname` is only for the /kit gallery.
 */
export function Header({
  balance,
  tempMsLeft,
  pathname,
}: {
  balance: number;
  tempMsLeft: number | null;
  pathname?: string;
}) {
  const livePath = usePathname();
  const { title, back } = routeFor(pathname ?? livePath);

  return (
    <header data-app-header="" className="sticky top-0 z-30 bg-cream px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="min-w-0">
          {title === null ? (
            <div className="flex items-start gap-2">
              <MapPin weight="regular" size={20} className="shrink-0 text-maroon" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-secondary font-semibold leading-tight text-espresso">{COPY.student.home.locationName}</p>
                <p className="text-secondary leading-tight text-mocha">{COPY.student.home.locationPlace}</p>
              </div>
            </div>
          ) : back ? (
            <Link
              href={back}
              aria-label="Back"
              className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-sand text-espresso transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
            >
              <ArrowLeft weight="regular" size={24} aria-hidden="true" />
            </Link>
          ) : (
            <h1 className="line-clamp-2 break-words font-display text-title font-extrabold leading-tight text-maroon">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ScanButton />
          <WalletChip balance={balance} />
        </div>
      </div>
      {/* With a Back button the title gets its own full-width line below it, so a long title ("Terms and Conditions",
          "Notifications") never has to break inside a word next to the Scan button and the wallet chip. */}
      {title !== null && back ? (
        <h1 className="mt-1 line-clamp-2 break-words font-display text-title font-extrabold leading-tight text-maroon">{title}</h1>
      ) : null}
      {tempMsLeft !== null ? <SessionChip msLeft={tempMsLeft} /> : null}
    </header>
  );
}
