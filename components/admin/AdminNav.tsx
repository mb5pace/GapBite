"use client";

import { COPY } from "@/data/copy";
import { PortalNav } from "@/components/ui/PortalNav";

const LINKS = [
  { href: "/admin", label: COPY.admin.nav.codes },
  { href: "/admin/staff", label: COPY.admin.nav.staff },
  { href: "/admin/users", label: COPY.admin.nav.users },
  { href: "/admin/orders", label: COPY.admin.nav.orders },
  { href: "/admin/service", label: COPY.admin.nav.service },
  { href: "/admin/demo", label: COPY.admin.nav.demo },
];

/** Admin header links. */
export function AdminNav() {
  return <PortalNav label="Admin" links={LINKS} />;
}
