"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False while the page is being rendered on the server and while the browser is hydrating it, true afterwards. Use it
 * for anything that only exists in the browser (a portal, a stored preference) so the first browser render matches the
 * HTML the server sent.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
