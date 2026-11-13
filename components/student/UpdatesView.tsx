"use client";

import { Bell, Receipt, Wallet, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, type ComponentType, type ReactNode } from "react";
import useSWR, { useSWRConfig } from "swr";
import { UPDATES_COPY } from "@/data/order-copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { MARK_READ_DELAY_MS, POLL_MS } from "@/lib/config";
import { getJson, postJson } from "@/lib/http";
import { formatClock, formatDayTime, istMidnight } from "@/lib/time";
import type { UpdateKind, UpdateView } from "@/lib/updates";

export interface UpdatesReply {
  updates: UpdateView[];
  unread: number;
  now: number;
}

const ICON: Record<UpdateKind, ComponentType<{ weight?: "regular"; size?: number }>> = {
  order: Receipt,
  wallet: Wallet,
  alert: WarningCircle,
};

function Row({ update, now, today }: { update: UpdateView; now: number; today: boolean }) {
  const Icon = ICON[update.kind];
  const time = today ? formatClock(update.at) : formatDayTime(update.at, now);
  const inner = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
        <Icon weight="regular" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-bold text-espresso">{update.title}</span>
        <span className="block text-secondary text-mocha">{update.body}</span>
        <span className="block text-caption tabular-nums text-mocha">{time}</span>
      </span>
      {!update.read ? (
        <span className="mt-1 size-2.5 shrink-0 self-start rounded-pill bg-maroon">
          <span className="sr-only">{UPDATES_COPY.unread}</span>
        </span>
      ) : null}
    </>
  );
  const className =
    "flex items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";
  return (
    <li>
      {update.orderId ? (
        <Link href={`/o/${update.orderId}`} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-1 font-display text-section font-bold text-maroon">{title}</h2>
      <ul className="divide-y divide-sand">{children}</ul>
    </section>
  );
}

/**
 * The Updates feed, grouped Today and Earlier. Unread rows have a maroon dot. A
 * couple of seconds after you open the tab everything counts as read, and the dot
 * on the tab goes out. Tapping an Update about an order opens that order.
 */
export function UpdatesView({ initial }: { initial: UpdatesReply }) {
  const { mutate } = useSWRConfig();
  const { data, mutate: refresh } = useSWR<UpdatesReply>("/api/updates", getJson, {
    fallbackData: initial,
    refreshInterval: POLL_MS.student,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const feed = data ?? initial;

  useEffect(() => {
    if (feed.unread === 0) return;
    const id = window.setTimeout(async () => {
      await postJson("/api/updates", { action: "markRead" });
      void refresh();
      void mutate("/api/me");
    }, MARK_READ_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [feed.unread, refresh, mutate]);

  if (feed.updates.length === 0) {
    return <EmptyState icon={<Bell weight="regular" size={40} />}>{UPDATES_COPY.empty}</EmptyState>;
  }

  const midnight = istMidnight(feed.now);
  const today = feed.updates.filter((u) => u.at >= midnight);
  const earlier = feed.updates.filter((u) => u.at < midnight);

  return (
    <div className="flex flex-col gap-6 pt-2">
      {today.length > 0 ? (
        <Group title={UPDATES_COPY.today}>
          {today.map((u) => (
            <Row key={u.id} update={u} now={feed.now} today />
          ))}
        </Group>
      ) : null}
      {earlier.length > 0 ? (
        <Group title={UPDATES_COPY.earlier}>
          {earlier.map((u) => (
            <Row key={u.id} update={u} now={feed.now} today={false} />
          ))}
        </Group>
      ) : null}
    </div>
  );
}
