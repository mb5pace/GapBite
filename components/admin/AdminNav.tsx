"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY } from "@/data/copy";

const LINKS = [
  { href: "/admin", label: COPY.admin.nav.codes },
  { href: "/admin/staff", label: COPY.admin.nav.staff },
  { href: "/admin/users", label: COPY.admin.nav.users },
] as const;

/** Admin header links. The open page uses the selected chip colours (UI_UX_BIBLE.md section 4). */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex items-center gap-2">
      {LINKS.map((link) => {
        const current = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={[
              "inline-flex h-11 items-center rounded-pill px-4 text-secondary font-medium",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
              current ? "bg-blush text-maroon" : "bg-sand text-espresso",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
