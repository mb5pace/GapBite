import type { ReactNode } from "react";
import { COPY } from "@/data/copy";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { requirePageSession } from "@/lib/auth";

/** Admin portal frame. Laptop-first. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePageSession("admin");

  return (
    <div className="min-h-dvh">
      <header className="bg-parchment">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          <span className="flex items-center gap-6">
            <span className="font-display text-section font-extrabold text-maroon">{COPY.admin.title}</span>
            <AdminNav />
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-6 py-6">{children}</main>
    </div>
  );
}
