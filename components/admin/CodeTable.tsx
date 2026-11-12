"use client";

import { ArrowsOut, Prohibit, StopCircle } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Countdown } from "@/components/ui/Countdown";
import { PillButton } from "@/components/ui/PillButton";
import type { TempCodeRow } from "@/lib/codes";
import { formatClock } from "@/lib/time";
import { CopyButton } from "./CopyButton";

function StatusBadge({ row }: { row: TempCodeRow }) {
  if (row.status === "unused") return <Badge tone="olive">Unused</Badge>;
  if (row.status === "active") {
    return (
      <Badge tone="amber">
        Active, <Countdown msLeft={row.msLeft ?? 0} /> left
      </Badge>
    );
  }
  if (row.status === "revoked") return <Badge tone="brick">Revoked</Badge>;
  return <Badge tone="taupe">Burned</Badge>;
}

/** The temporary pool: one row per code, with the actions that fit its status. */
export function CodeTable({
  rows,
  busyCode,
  onShow,
  onRevoke,
  onEnd,
}: {
  rows: TempCodeRow[];
  busyCode: string | null;
  onShow: (code: string) => void;
  onRevoke: (code: string) => void;
  onEnd: (code: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="mt-4 text-body text-espresso">No temporary codes yet. Tap Generate now to fill the pool.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="text-secondary text-mocha">
            <th scope="col" className="py-2 pr-4 font-medium">Code</th>
            <th scope="col" className="py-2 pr-4 font-medium">Status</th>
            <th scope="col" className="py-2 pr-4 font-medium">Used by</th>
            <th scope="col" className="py-2 pr-4 font-medium">Used at</th>
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const busy = busyCode === row.code;
            return (
              <tr key={row.code} className="border-t border-sand">
                <td className="py-3 pr-4 font-display text-section font-bold tracking-code text-espresso">
                  {row.display}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge row={row} />
                </td>
                <td className="py-3 pr-4 text-body text-espresso">
                  {row.usedBy ?? (row.status === "active" || (row.status === "burned" && row.usedAt) ? (
                    <span className="text-mocha">Not identified yet</span>
                  ) : null)}
                </td>
                <td className="py-3 pr-4 text-body tabular-nums text-espresso">
                  {row.usedAt ? formatClock(row.usedAt) : null}
                </td>
                <td className="py-3">
                  <span className="flex items-center justify-end gap-2">
                    {row.status === "unused" ? (
                      <>
                        <CopyButton getText={async () => row.display} />
                        <PillButton variant="secondary" size="md" onClick={() => onShow(row.code)} disabled={busy}>
                          <ArrowsOut weight="regular" size={18} aria-hidden="true" />
                          Show big
                        </PillButton>
                        <PillButton variant="outline" size="md" onClick={() => onRevoke(row.code)} disabled={busy}>
                          <Prohibit weight="regular" size={18} aria-hidden="true" />
                          Revoke
                        </PillButton>
                      </>
                    ) : null}
                    {row.status === "active" ? (
                      <PillButton variant="outline" size="md" onClick={() => onEnd(row.code)} disabled={busy}>
                        <StopCircle weight="regular" size={18} aria-hidden="true" />
                        End session
                      </PillButton>
                    ) : null}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
