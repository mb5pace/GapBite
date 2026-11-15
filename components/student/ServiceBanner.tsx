"use client";

import { Banner } from "@/components/ui/Banner";
import { useMe } from "./useMe";

/**
 * Shown on every student screen while Admin has switched the whole service off (Admin › Service): the message Admin
 * wrote, nothing else. It comes with the numbers the shell already polls every few seconds, so it appears and goes
 * without a reload. Renders nothing while the service is on.
 */
export function ServiceBanner() {
  const { service } = useMe();
  if (service.available) return null;
  return (
    <div className="px-5 pb-2" data-service-banner="">
      <Banner tone="warning">{service.message}</Banner>
    </div>
  );
}
