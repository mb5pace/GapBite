"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { RunCard } from "@/lib/order-types";
import { RunnerSheet, type RunnerMode } from "./RunnerSheet";

interface RunnerApi {
  openScan: () => void;
  openHandover: (run: RunCard) => void;
}

const RunnerContext = createContext<RunnerApi | null>(null);

/** The runner sheet's controls. Outside the student app (the /kit gallery) they do nothing. */
export function useRunner(): RunnerApi {
  return useContext(RunnerContext) ?? { openScan: () => undefined, openHandover: () => undefined };
}

/** Mounts the one runner sheet for the student app: Scan in the header, Enter code on a run. */
export function RunnerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<RunnerMode>({ kind: "closed" });
  const openScan = useCallback(() => setMode({ kind: "scan" }), []);
  const openHandover = useCallback((run: RunCard) => setMode({ kind: "handover", run }), []);
  const api = useMemo(() => ({ openScan, openHandover }), [openScan, openHandover]);
  return (
    <RunnerContext.Provider value={api}>
      {children}
      <RunnerSheet mode={mode} onClose={() => setMode({ kind: "closed" })} />
    </RunnerContext.Provider>
  );
}
