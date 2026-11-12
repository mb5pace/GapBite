"use client";

import { Scan } from "@phosphor-icons/react";
import { useState } from "react";
import { COPY } from "@/data/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { PillButton } from "@/components/ui/PillButton";
import { Sheet } from "@/components/ui/Sheet";

/**
 * The Scan button that sits in every student header. For now it opens a
 * placeholder sheet. The real runner sheet (camera, preview, accept, handover)
 * is Phase 7.
 */
export function ScanButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton label={COPY.student.scan.label} onClick={() => setOpen(true)}>
        <Scan weight="regular" size={22} aria-hidden="true" />
      </IconButton>
      <Sheet open={open} onClose={() => setOpen(false)} title={COPY.student.scan.title}>
        <EmptyState
          icon={<Scan weight="regular" size={40} />}
          action={
            <PillButton variant="secondary" onClick={() => setOpen(false)}>
              {COPY.student.scan.close}
            </PillButton>
          }
        >
          {COPY.student.scan.body}
        </EmptyState>
      </Sheet>
    </>
  );
}
