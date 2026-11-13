import type { ReactNode } from "react";
import { requirePageSession } from "@/lib/auth";

/** Everything under /cafe needs the cafe session, including the full-screen kiosk. The desk header is in (desk)/layout.tsx. */
export default async function CafeLayout({ children }: { children: ReactNode }) {
  await requirePageSession("cafe");
  return children;
}
