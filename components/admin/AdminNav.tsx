"use client";

import { COPY } from "@/data/copy";
import { PortalNav } from "@/components/ui/PortalNav";

const LINKS = [
  { href: "/admin", label: COPY.admin.nav.codes },
  { href: "/admin/staff", label: COPY.admin.nav.staff },
  { href: "/admin/users", label: COPY.admin.nav.users },
  { href: "/admin/orders", label: COPY.admin.nav.orders },
];

/** Admin header links. */
export function AdminNav() {
  return <PortalNav label="Admin" links={LINKS} />;
}
