import type { ReactNode } from "react";
import { CafeHeader } from "@/components/cafe/CafeHeader";
import { QueueProvider } from "@/components/cafe/QueueProvider";
import { serverNow } from "@/lib/time";

/** The Cafe desk frame (laptop-first): header, then the page. One queue poll feeds every page. */
export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <QueueProvider initialNow={serverNow()}>
      <div className="min-h-dvh">
        <CafeHeader />
        <main className="mx-auto max-w-[1440px] px-6 py-6">{children}</main>
      </div>
    </QueueProvider>
  );
}
