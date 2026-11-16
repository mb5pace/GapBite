"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SourceId } from "@/data/menu";

export type SourceFilter = "all" | SourceId;

/** What the Scan buyer QR dialog is open for: any pickup (from the top bar) or one ticket's order. */
export interface ScanTarget {
  orderId?: string;
}

interface DeskState {
  /** The source filter under the top bar. It also narrows the top bar's counts. */
  filter: SourceFilter;
  setFilter: (filter: SourceFilter) => void;
  /** The Scan buyer QR dialog: null when closed. */
  scan: ScanTarget | null;
  openScan: (target?: ScanTarget) => void;
  closeScan: () => void;
  /** The order whose kitchen slip is being printed, or null. */
  printing: string | null;
  printSlip: (orderId: string) => void;
  donePrinting: () => void;
}

const DeskContext = createContext<DeskState | null>(null);

/**
 * Desk-wide state for the POS shell (v1.0.0 Phase C1) that is not the queue itself: the source filter, the Scan
 * buyer QR dialog and the slip being printed. The queue poll stays in QueueProvider.
 */
export function DeskProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [scan, setScan] = useState<ScanTarget | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);

  const openScan = useCallback((target: ScanTarget = {}) => setScan(target), []);
  const closeScan = useCallback(() => setScan(null), []);
  const printSlip = useCallback((orderId: string) => setPrinting(orderId), []);
  const donePrinting = useCallback(() => setPrinting(null), []);

  const value = useMemo(
    () => ({ filter, setFilter, scan, openScan, closeScan, printing, printSlip, donePrinting }),
    [filter, scan, openScan, closeScan, printing, printSlip, donePrinting],
  );
  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk(): DeskState {
  const value = useContext(DeskContext);
  if (!value) throw new Error("useDesk must be used inside the Cafe desk layout.");
  return value;
}
