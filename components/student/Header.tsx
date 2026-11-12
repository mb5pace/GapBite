"use client";

import { usePathname } from "next/navigation";
import { COPY } from "@/data/copy";
import { ScanButton } from "@/components/runner/ScanButton";
import { SessionChip } from "./SessionChip";
import { WalletChip } from "./WalletChip";

type Titles = Record<string, string>;

/** The header title for a path, or null on Home (which shows the greeting). */
export function titleFor(pathname: string): string | null {
  const [first, second] = pathname.split("/").filter(Boolean);
  if (!first || first === "home") return null;
  if (first === "account" && second) {
    return (COPY.student.accountSections as Titles)[second] ?? COPY.student.titles.account;
  }
  return (COPY.student.titles as Titles)[first] ?? "QuickX";
}

/**
 * Persistent student header (docs/SCREENS.md): greeting or page title on the
 * left, Scan and the wallet chip on the right. A temp-session countdown shows on
 * its own row only in the last 3 minutes. `pathname` is only for the /kit gallery.
 */
export function Header({
  greeting,
  name,
  isStaff,
  balance,
  tempMsLeft,
  pathname,
}: {
  greeting: string;
  name: string;
  isStaff: boolean;
  balance: number;
  tempMsLeft: number | null;
  pathname?: string;
}) {
  const livePath = usePathname();
  const title = titleFor(pathname ?? livePath);

  return (
    <header className="sticky top-0 z-30 bg-cream px-5 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="min-w-0">
          {title === null ? (
            <>
              <p className="text-secondary text-mocha">{greeting}</p>
              <h1 className="flex items-center gap-2 font-display text-greeting font-extrabold text-maroon">
                <span className="line-clamp-2 break-words">{name}</span>
                {isStaff ? (
                  <span className="shrink-0 rounded-pill bg-blush px-2 py-0.5 font-sans text-caption font-bold text-maroon">
                    {COPY.student.staffBadge}
                  </span>
                ) : null}
              </h1>
            </>
          ) : (
            <h1 className="truncate font-display text-title font-extrabold text-maroon">{title}</h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ScanButton />
          <WalletChip balance={balance} />
        </div>
      </div>
      {tempMsLeft !== null ? <SessionChip msLeft={tempMsLeft} /> : null}
    </header>
  );
}
