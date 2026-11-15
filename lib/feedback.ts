/**
 * Feedback from Account and Discover: a 1 to 5 face rating and an optional comment. Server-side only. They are
 * kept in the Redis list `feedback` (newest first, FEEDBACK_KEEP entries) for the team to read. One person
 * can send one every FEEDBACK_MIN_INTERVAL_SEC seconds, so a stuck button cannot fill the list.
 */
import { AppError } from "./api";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { FEEDBACK_KEEP, FEEDBACK_MIN_INTERVAL_SEC } from "./config";
import { getRedis, key } from "./redis";

export interface FeedbackEntry {
  /** Server time, epoch ms. */
  at: number;
  userId: string;
  role: "student" | "staff";
  /** 1 (worst) to 5 (best). */
  rating: number;
  /** Empty when the person only chose a face. */
  text: string;
}

export async function submitFeedback(entry: Omit<FeedbackEntry, "at">, now: number): Promise<void> {
  const redis = getRedis();
  const first = await redis.set(key("feedback", "last", entry.userId), "1", { nx: true, ex: FEEDBACK_MIN_INTERVAL_SEC });
  if (!first) throw new AppError(429, ACCOUNT_COPY.feedback.tooSoon);
  const full: FeedbackEntry = { at: now, ...entry };
  await redis.lpush(key("feedback"), JSON.stringify(full));
  await redis.ltrim(key("feedback"), 0, FEEDBACK_KEEP - 1);
}
