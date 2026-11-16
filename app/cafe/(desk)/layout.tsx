import type { ReactNode } from "react";
import { CafeShell } from "@/components/cafe/CafeShell";
import { DeskProvider } from "@/components/cafe/DeskProvider";
import { QueueProvider } from "@/components/cafe/QueueProvider";
import { serverNow } from "@/lib/time";

/** The Cafe desk frame (laptop-first): the POS shell around the page. One queue poll feeds every page. */
export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <QueueProvider initialNow={serverNow()}>
      <DeskProvider>
        <CafeShell>{children}</CafeShell>
      </DeskProvider>
    </QueueProvider>
  );
}
