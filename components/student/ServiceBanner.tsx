"use client";

import { usePathname } from "next/navigation";
import { Banner } from "@/components/ui/Banner";
import { useMe } from "./useMe";

/**
 * Shown on every student screen while Admin has switched the whole service off (Admin > Service): the message Admin
 * wrote, nothing else. It comes with the numbers the shell already polls every few seconds, so it appears and goes
 * without a reload. Renders nothing while the service is on. On Home it sits directly under the search field
 * (`placement="home"`), so the shell's copy under the header stays out of the way there.
 */
export function ServiceBanner({ placement = "shell" }: { placement?: "shell" | "home" }) {
  const { service } = useMe();
  const pathname = usePathname();
  if (service.available) return null;
  if (placement === "shell" && pathname === "/home") return null;
  return (
    <div className={placement === "shell" ? "px-5 pb-2" : undefined} data-service-banner="">
      <Banner tone="warning">{service.message}</Banner>
    </div>
  );
}
