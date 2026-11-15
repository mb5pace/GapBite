"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
/** Used when the browser will not let a page use sessionStorage (private modes), so a dismissal still lasts while the page is open. */
const inMemory = new Set<string>();

function read(key: string): boolean {
  if (inMemory.has(key)) return true;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * A yes/no that lasts for this browser session (until the tab is closed), for things like "I have dismissed this
 * notice". Returns `[done, setDone]`. Before the page has loaded in the browser it says `true`, so nothing flashes on
 * and off while the page loads.
 */
export function useSessionFlag(key: string): [boolean, () => void] {
  const done = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => true,
  );
  const setDone = useCallback(() => {
    inMemory.add(key);
    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      // the in-memory copy above is enough
    }
    listeners.forEach((listener) => listener());
  }, [key]);
  return [done, setDone];
}
