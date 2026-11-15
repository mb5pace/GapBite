"use client";

import {
  Bell,
  ChatCircleText,
  ClockCounterClockwise,
  FileText,
  Lifebuoy,
  SignOut,
  Sliders,
  User,
  Wallet,
  ArrowUUpLeft,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { COPY } from "@/data/copy";
import { LogoutRow } from "./LogoutRow";
import { Money } from "@/components/ui/Money";
import { NavRow } from "@/components/ui/NavRow";
import { useMe } from "@/components/student/useMe";

const ICON = { weight: "regular" as const, size: 22 };

/**
 * Account (docs/SCREENS.md): the profile card, then the rows. Wallet, My Profile, Preferences, Notifications,
 * Order History, Refund Status, Terms and Conditions, Feedback, Support and Log out. The name and the balance
 * are live from /api/me, so a rename or a top-up shows here without reloading.
 */
export function AccountView() {
  const me = useMe();
  const isStaff = me.user.role === "staff";
  const titles = COPY.student.accountSections;
  const hints = ACCOUNT_COPY.rowHints;
  const rows: { href: string; key: keyof typeof titles; icon: ReactNode }[] = [
    { href: "/account/wallet", key: "wallet", icon: <Wallet {...ICON} /> },
    { href: "/account/profile", key: "profile", icon: <User {...ICON} /> },
    { href: "/account/preferences", key: "preferences", icon: <Sliders {...ICON} /> },
    { href: "/account/notifications", key: "notifications", icon: <Bell {...ICON} /> },
    { href: "/account/history", key: "history", icon: <ClockCounterClockwise {...ICON} /> },
    { href: "/account/refunds", key: "refunds", icon: <ArrowUUpLeft {...ICON} /> },
    { href: "/account/terms", key: "terms", icon: <FileText {...ICON} /> },
    { href: "/account/feedback", key: "feedback", icon: <ChatCircleText {...ICON} /> },
    { href: "/account/support", key: "support", icon: <Lifebuoy {...ICON} /> },
  ];

  return (
    <div className="flex flex-col gap-4 pt-2">
      <section aria-label="Your profile" className="flex items-start justify-between gap-3 rounded-card bg-parchment p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-title font-extrabold leading-tight text-maroon">
            <span className="line-clamp-2 break-words" data-profile-name="">
              {me.user.name}
            </span>
            {isStaff ? (
              <span className="shrink-0 rounded-pill bg-blush px-2 py-0.5 font-sans text-caption font-bold text-maroon">{COPY.student.staffBadge}</span>
            ) : null}
          </p>
          <p className="mt-1 text-secondary text-mocha">
            {isStaff ? ACCOUNT_COPY.profileCard.idStaff : ACCOUNT_COPY.profileCard.idStudent}{" "}
            <span className="font-medium tabular-nums text-espresso">{me.user.id}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-caption text-mocha">{ACCOUNT_COPY.profileCard.walletLabel}</p>
          <Money amount={me.balance} className="font-display text-title font-extrabold text-maroon" />
        </div>
      </section>

      <nav aria-label="Account" className="flex flex-col gap-3">
        {rows.map((row) => (
          <NavRow key={row.key} href={row.href} icon={row.icon} title={titles[row.key]} hint={hints[row.key]} />
        ))}
        <LogoutRow icon={<SignOut {...ICON} />} />
      </nav>
    </div>
  );
}
