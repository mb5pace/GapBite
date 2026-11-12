"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useState } from "react";
import { PillButton } from "@/components/ui/PillButton";
import { postJson } from "@/lib/http";
import { CopyButton } from "./CopyButton";

/**
 * The permanent codes arrive masked (K7••••). The full code is fetched only
 * when an admin taps Reveal or Copy, and Reveal can be hidden again.
 */
export function PermanentCodes({ masked, expected }: { masked: string[]; expected: number }) {
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  async function fetchCode(index: number): Promise<string | null> {
    const res = await postJson<{ code: string }>("/api/admin/codes", { action: "reveal", index });
    if (!res.ok || !res.data) {
      setError(res.error ?? "Could not get that code. Try again.");
      return null;
    }
    setError("");
    return res.data.code;
  }

  async function toggle(index: number) {
    if (revealed[index]) {
      setRevealed(({ [index]: _hidden, ...rest }) => {
        void _hidden;
        return rest;
      });
      return;
    }
    const code = await fetchCode(index);
    if (code) setRevealed((prev) => ({ ...prev, [index]: code }));
  }

  return (
    <section className="rounded-card bg-parchment p-6" aria-labelledby="permanent-heading">
      <h2 id="permanent-heading" className="font-display text-section font-bold text-maroon">
        Permanent codes
      </h2>
      <p className="mt-1 text-secondary text-mocha">
        For the team&apos;s own devices. They never expire and work on any number of devices at once.
      </p>

      {masked.length !== expected ? (
        <p className="mt-4 flex items-center gap-2 text-secondary font-medium text-espresso" role="status">
          <span className="size-2 rounded-pill bg-amber" aria-hidden="true" />
          Expected {expected} permanent codes, found {masked.length}. Check QX_PERMANENT_CODES in Vercel.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col">
        {masked.map((mask, index) => (
          <li
            key={index}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-sand py-3 first:border-t-0"
          >
            <span className="font-display text-section font-bold tracking-code text-espresso">
              {revealed[index] ?? mask}
            </span>
            <span className="flex items-center gap-2">
              <PillButton variant="secondary" size="md" onClick={() => toggle(index)}>
                {revealed[index] ? (
                  <EyeSlash weight="regular" size={18} aria-hidden="true" />
                ) : (
                  <Eye weight="regular" size={18} aria-hidden="true" />
                )}
                {revealed[index] ? "Hide" : "Reveal"}
              </PillButton>
              <CopyButton getText={async () => revealed[index] ?? fetchCode(index)} />
            </span>
          </li>
        ))}
      </ul>

      {masked.length === 0 ? (
        <p className="mt-4 text-body text-espresso">
          No permanent codes found. Add QX_PERMANENT_CODES in Vercel, then redeploy.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
    </section>
  );
}
