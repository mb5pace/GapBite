"use client";

import { Scan } from "@phosphor-icons/react";
import { RUN_COPY } from "@/data/order-copy";
import { IconButton } from "@/components/ui/IconButton";
import { useRunner } from "./RunnerProvider";

/** The Scan button that sits in every student header. It opens the runner sheet. */
export function ScanButton() {
  const { openScan } = useRunner();
  return (
    <IconButton label={RUN_COPY.scanLabel} onClick={openScan}>
      <Scan weight="regular" size={22} aria-hidden="true" />
    </IconButton>
  );
}
