/**
 * Saved preferences, one JSON value per user. Server-side only. The rules live in prefs-rules.ts.
 * Checkout, the Next break strip and the update chime read them from /api/me.
 */
import { getRedis, key } from "./redis";
import { applyPatch, mergePrefs, type Prefs, type PrefsPatch } from "./prefs-rules";

const prefsKey = (userId: string) => key("prefs", userId);

/** A user who never saved anything gets the defaults. A damaged value is read as far as it goes. */
export async function getPrefs(userId: string): Promise<Prefs> {
  return mergePrefs(await getRedis().get<unknown>(prefsKey(userId)));
}

export async function savePrefs(userId: string, patch: PrefsPatch): Promise<Prefs> {
  const next = applyPatch(await getPrefs(userId), patch);
  await getRedis().set(prefsKey(userId), next);
  return next;
}
