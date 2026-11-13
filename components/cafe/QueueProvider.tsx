"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import useSWR from "swr";
import { getJson } from "@/lib/http";
import { NEW_ORDER_HIGHLIGHT_MS, POLL_MS, UI_TICK_MS } from "@/lib/config";
import { playChime, unlockAudio } from "@/lib/chime";
import type { CafeCard } from "@/lib/order-types";

export interface QueueReply {
  orders: CafeCard[];
  now: number;
}

interface QueueState {
  orders: CafeCard[];
  loading: boolean;
  /** True when the last poll failed. Old data stays on screen. */
  stale: boolean;
  /** The server's time, ticking once a second between polls. */
  now: number;
  /** Order IDs that just arrived and are highlighted for a few seconds. */
  fresh: ReadonlySet<string>;
  /** Plain-text note for screen readers: "New order QX-4821 from Cafe Delice". */
  announcement: string;
  refresh: () => Promise<void>;
  /** Puts one changed order straight into the list, before the next poll. */
  apply: (card: CafeCard) => void;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  /** False until the browser has allowed sound, which takes one tap on the page. */
  audioReady: boolean;
}

const QueueContext = createContext<QueueState | null>(null);

const SOUND_KEY = "qx-cafe-sound";

// The mute choice is kept in this browser (localStorage, wrapped in try/catch) and read through
// useSyncExternalStore, so the server render and the first browser render agree.
const soundListeners = new Set<() => void>();
let soundValue: boolean | null = null;

function readSound(): boolean {
  if (soundValue === null) {
    try {
      soundValue = window.localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      soundValue = true;
    }
  }
  return soundValue;
}

function writeSound(on: boolean): void {
  soundValue = on;
  try {
    window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // Private window: the choice lasts until the page is closed.
  }
  soundListeners.forEach((listener) => listener());
}

function subscribeSound(listener: () => void): () => void {
  soundListeners.add(listener);
  return () => {
    soundListeners.delete(listener);
  };
}

/**
 * One poll of the queue for the whole Cafe desk, every 3 seconds. SWR pauses it while
 * the tab is hidden and fetches again the moment the tab is back. It also finds new
 * orders (highlight for 5 seconds and a soft chime unless muted), keeps the clock, and
 * feeds the count on the Queue link, so the desk hears a new order on any page.
 */
export function QueueProvider({ children, initialNow }: { children: ReactNode; initialNow: number }) {
  const { data, error, mutate, isLoading } = useSWR<QueueReply>("/api/cafe/queue", getJson, {
    refreshInterval: POLL_MS.cafe,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  // --- The server's clock: the last server time we heard, plus the time that has passed on this device.
  const sync = useRef({ serverAt: initialNow, deviceAt: 0 });
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    if (sync.current.deviceAt === 0) sync.current.deviceAt = performance.now();
    if (data) sync.current = { serverAt: data.now, deviceAt: performance.now() };
  }, [data]);
  useEffect(() => {
    const id = window.setInterval(() => {
      const { serverAt, deviceAt } = sync.current;
      setNow(serverAt + (performance.now() - deviceAt));
    }, UI_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // --- Sound
  const soundOn = useSyncExternalStore(subscribeSound, readSound, () => true);
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);
  const [audioReady, setAudioReady] = useState(false);
  useEffect(() => {
    // Browsers only allow sound after the person has touched the page once.
    const unlock = () => void unlockAudio().then(setAudioReady);
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  const setSoundOn = useCallback((on: boolean) => {
    writeSound(on);
    if (on) void unlockAudio().then((ready) => (ready ? playChime() : undefined));
  }, []);

  // --- New orders: everything in New that we have not seen yet. The first load only sets the baseline.
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (!data) return;
    const waiting = data.orders.filter((o) => o.status === "PLACED");
    if (seen.current === null) {
      seen.current = new Set(waiting.map((o) => o.id));
      return;
    }
    const baseline = seen.current;
    const arrived = waiting.filter((o) => !baseline.has(o.id));
    for (const o of waiting) baseline.add(o.id);
    if (arrived.length === 0) return;
    setFresh((current) => new Set([...current, ...arrived.map((o) => o.id)]));
    setAnnouncement(arrived.length === 1 ? `New order ${arrived[0].id}` : `${arrived.length} new orders`);
    if (soundRef.current) playChime();
    const ids = arrived.map((o) => o.id);
    timers.current.push(
      window.setTimeout(() => {
        setFresh((current) => {
          const next = new Set(current);
          for (const id of ids) next.delete(id);
          return next;
        });
      }, NEW_ORDER_HIGHLIGHT_MS),
    );
  }, [data]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const apply = useCallback(
    (card: CafeCard) => {
      void mutate(
        (current) => {
          if (!current) return current;
          const orders = current.orders.filter((o) => o.id !== card.id);
          // Finished orders leave the queue. The others stay, with their new status.
          if (card.status !== "COLLECTED" && card.status !== "DELIVERED" && card.status !== "REJECTED" && card.status !== "CANCELLED" && card.status !== "FAILED_LATE") {
            orders.push(card);
          }
          orders.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
          return { ...current, orders };
        },
        { revalidate: true },
      );
    },
    [mutate],
  );

  const value: QueueState = {
    orders: data?.orders ?? [],
    loading: isLoading && !data,
    stale: !!error,
    now,
    fresh,
    announcement,
    refresh,
    apply,
    soundOn,
    setSoundOn,
    audioReady,
  };
  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue(): QueueState {
  const value = useContext(QueueContext);
  if (!value) throw new Error("useQueue must be used inside the Cafe desk layout.");
  return value;
}
