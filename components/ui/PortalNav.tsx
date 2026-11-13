"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface PortalLink {
  href: string;
  label: string;
  /** Small count shown after the label, for example new orders. */
  badge?: number;
}

/**
 * Header links for the laptop portals. The open page uses the selected chip colours
 * (UI_UX_BIBLE.md section 4). A page counts as open when the path starts with its link,
 * except `exact` links such as the portal's front page.
 */
export function PortalNav({ label, links, extra }: { label: string; links: PortalLink[]; extra?: ReactNode }) {
  const pathname = usePathname();
  const first = links[0]?.href;
  return (
    <nav aria-label={label} className="flex items-center gap-2">
      {links.map((link) => {
        const current = link.href === first ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={[
              "inline-flex h-11 items-center gap-2 rounded-pill px-4 text-secondary font-medium",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
              current ? "bg-blush text-maroon" : "bg-sand text-espresso",
            ].join(" ")}
          >
            {link.label}
            {link.badge ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-pill bg-maroon px-2 text-caption font-bold tabular-nums text-cream">
                {link.badge}
                <span className="sr-only"> new</span>
              </span>
            ) : null}
          </Link>
        );
      })}
      {extra}
    </nav>
  );
}
