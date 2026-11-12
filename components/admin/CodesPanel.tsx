"use client";

import { ArrowsClockwise, ArrowsOut } from "@phosphor-icons/react";
import { useState } from "react";
import useSWR from "swr";
import { PillButton } from "@/components/ui/PillButton";
import { POLL_MS } from "@/lib/config";
import { getJson, postJson } from "@/lib/http";
import type { AdminCodesSnapshot } from "@/lib/codes";
import { CodeTable } from "./CodeTable";
import { PermanentCodes } from "./PermanentCodes";
import { ShowCode } from "./ShowCode";

const CODES_URL = "/api/admin/codes";

function Skeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading access codes">
      <div className="h-56 rounded-card bg-sand" />
      <div className="h-96 rounded-card bg-sand" />
    </div>
  );
}

/** Admin › Codes: permanent codes (masked) and the temporary pool. Refreshes every few seconds. */
export function CodesPanel() {
  const { data, error, mutate, isLoading } = useSWR<AdminCodesSnapshot>(CODES_URL, getJson, {
    refreshInterval: POLL_MS.admin, // SWR pauses this while the tab is hidden
  });
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [shown, setShown] = useState<string | null>(null);

  async function run(body: Record<string, unknown>, code?: string) {
    setActionError("");
    if (code) setBusyCode(code);
    const res = await postJson<AdminCodesSnapshot>(CODES_URL, body);
    if (res.ok && res.data) {
      await mutate(res.data, { revalidate: false });
    } else {
      setActionError(res.error ?? "That did not work. Try again.");
      await mutate(); // the list may have changed under us
    }
    setBusyCode(null);
  }

  async function generate() {
    setGenerating(true);
    await run({ action: "generate" });
    setGenerating(false);
  }

  if (isLoading) return <Skeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-card bg-parchment p-6">
        <p className="text-body text-espresso">{error?.message ?? "Could not load the codes."}</p>
        <PillButton variant="secondary" size="md" onClick={() => mutate()}>
          Try again
        </PillButton>
      </div>
    );
  }

  const shownRow = shown ? data.temp.rows.find((r) => r.code === shown) : undefined;
  const firstUnused = data.temp.rows.find((r) => r.status === "unused");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title font-extrabold text-maroon">Access codes</h1>
        <p className="mt-1 text-body text-mocha">
          Give someone a temporary code to test with. Each one works once, then a new one appears.
        </p>
      </div>

      <PermanentCodes masked={data.permanent.masked} expected={data.permanent.expected} />

      <section className="rounded-card bg-parchment p-6" aria-labelledby="temp-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="temp-heading" className="font-display text-section font-bold text-maroon">
              Temporary codes
            </h2>
            <p className="mt-1 text-secondary text-mocha">
              {data.temp.unused} unused of {data.temp.poolSize} in the pool
            </p>
          </div>
          <span className="flex items-center gap-2">
            <PillButton
              variant="secondary"
              size="md"
              onClick={() => firstUnused && setShown(firstUnused.code)}
              disabled={!firstUnused}
            >
              <ArrowsOut weight="regular" size={18} aria-hidden="true" />
              Show a code
            </PillButton>
            <PillButton variant="primary" size="md" onClick={generate} disabled={generating}>
              <ArrowsClockwise weight="bold" size={18} aria-hidden="true" />
              Generate now
            </PillButton>
          </span>
        </div>

        {actionError ? (
          <p role="alert" className="mt-4 text-secondary font-medium text-brick">
            {actionError}
          </p>
        ) : null}

        <CodeTable
          rows={data.temp.rows}
          busyCode={busyCode}
          onShow={setShown}
          onRevoke={(code) => run({ action: "revoke", code }, code)}
          onEnd={(code) => run({ action: "end", code }, code)}
        />
      </section>

      {shown && shownRow ? (
        <ShowCode
          display={shownRow.display}
          stillUnused={shownRow.status === "unused"}
          onClose={() => setShown(null)}
        />
      ) : null}
    </div>
  );
}
