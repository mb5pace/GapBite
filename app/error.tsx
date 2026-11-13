"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { PillButton } from "@/components/ui/PillButton";

/** A page that threw. The message is never shown: it can hold things the person should not see. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-5">
      <EmptyState
        icon={<WarningCircle weight="regular" size={40} />}
        action={
          <PillButton variant="secondary" onClick={reset}>
            {COPY.errorPages.tryAgain}
          </PillButton>
        }
      >
        {COPY.errorPages.broke}
      </EmptyState>
    </main>
  );
}
