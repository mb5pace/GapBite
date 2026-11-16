"use client";

import { useState } from "react";
import useSWR from "swr";
import { CAFE_COPY } from "@/data/cafe-copy";
import { SOURCES } from "@/data/menu";
import { Banner } from "@/components/ui/Banner";
import { POLL_MS } from "@/lib/config";
import { sourceLabel, type HoursConfig, type ServiceState } from "@/lib/hours-rules";
import { getJson, postJson } from "@/lib/http";
import { HolidaysSection } from "./HolidaysSection";
import { ItemsSection } from "./ItemsSection";
import { PlaceHoursCard } from "./PlaceHoursCard";

interface HoursReply {
  hours: HoursConfig;
  service: ServiceState;
  now: number;
}

/**
 * Hours and items. Each change is one small request that changes one setting, so a student's next poll (a few
 * seconds) sees it and two screens editing different things never overwrite each other. Orders already placed are
 * never touched.
 */
export function HoursView() {
  const copy = CAFE_COPY.hours;
  const { data, error, mutate } = useSWR<HoursReply>("/api/cafe/hours", getJson, { refreshInterval: POLL_MS.cafe });
  const [notice, setNotice] = useState<string | null>(null);

  /** PUTs one change. Returns an error sentence, or null once it is saved (and shows the confirmation at the top). */
  async function change(body: Record<string, unknown>, done: string): Promise<string | null> {
    setNotice(null);
    const res = await postJson<{ hours: HoursConfig }>("/api/cafe/hours", body, { method: "PUT" });
    if (!res.ok || !res.data) return res.error ?? copy.failed;
    await mutate((current) => (current ? { ...current, hours: res.data!.hours } : current), { revalidate: false });
    setNotice(done);
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-body text-mocha">{copy.intro}</p>

      {data && !data.service.available ? <Banner tone="warning">{copy.serviceOff}</Banner> : null}
      {notice ? <Banner>{notice}</Banner> : null}
      {error && !data ? <Banner tone="error">{copy.loadFailed}</Banner> : null}

      {data ? (
        <>
          <section className="flex flex-col gap-4" aria-labelledby="places-title">
            <h2 id="places-title" className="font-display text-section font-bold text-maroon">
              {copy.placesTitle}
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {SOURCES.map((source) => (
                <PlaceHoursCard
                  key={source.id}
                  source={source}
                  config={data.hours.sources[source.id]}
                  statusNow={sourceLabel(data.hours, data.service, source.id, data.now).text}
                  change={change}
                />
              ))}
            </div>
          </section>
          <HolidaysSection holidays={data.hours.holidays} change={change} />
          <ItemsSection hours={data.hours} change={change} />
        </>
      ) : null}
    </div>
  );
}
