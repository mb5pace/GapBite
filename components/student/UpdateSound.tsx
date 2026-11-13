"use client";

import { useEffect, useRef } from "react";
import { playChime, unlockAudio } from "@/lib/chime";
import { useMe } from "./useMe";

/**
 * Account › Notifications › Sounds: a soft chime when a new Update arrives, while QuickX is open. It listens to
 * the unread count that the student shell already polls: a rise means something new. Reading Updates lowers the
 * count, which is silent. Browsers only allow sound after one tap on the page, so the first tap unlocks it.
 * Renders nothing.
 */
export function UpdateSound() {
  const { unread, prefs } = useMe();
  const sounds = prefs.notifications.sounds;
  const last = useRef<number | null>(null);

  useEffect(() => {
    const unlock = () => void unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (last.current !== null && unread > last.current && sounds) playChime();
    last.current = unread;
  }, [unread, sounds]);

  return null;
}
