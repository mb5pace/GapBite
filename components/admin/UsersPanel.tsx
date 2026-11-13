"use client";

import { Users } from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { COPY, WALLET_COPY } from "@/data/copy";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Money } from "@/components/ui/Money";
import { PillButton } from "@/components/ui/PillButton";
import { ADMIN_ADJUST_MAX, ADMIN_ADJUST_PRESETS, ADMIN_NOTE_MAX, ADMIN_NOTE_MIN, POLL_MS, SEARCH_DELAY_MS } from "@/lib/config";
import { formatRupees } from "@/lib/format";
import { getJson, postJson } from "@/lib/http";
import { formatDayTime } from "@/lib/time";
import type { LedgerEntry } from "@/lib/wallet";

interface PersonRow {
  id: string;
  name: string;
  role: "student" | "staff";
  balance: number;
}
interface ListReply {
  users: PersonRow[];
  now: number;
}
interface DetailReply {
  user: { id: string; name: string; role: "student" | "staff" };
  balance: number;
  ledger: LedgerEntry[];
  now: number;
}

/** "-50", "−50", "+300" and "300" all become a number; anything else is NaN. */
function parseAmount(text: string): number {
  const cleaned = text.trim().replace(/−/g, "-").replace(/^\+/, "");
  return /^-?\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

function Adjust({ person, onDone }: { person: DetailReply["user"]; onDone: () => void }) {
  const { mutate } = useSWRConfig();
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = parseAmount(amountText);
  const amountOk = Number.isInteger(amount) && amount !== 0 && Math.abs(amount) <= ADMIN_ADJUST_MAX;
  const noteOk = note.trim().length >= ADMIN_NOTE_MIN && note.trim().length <= ADMIN_NOTE_MAX;

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !amountOk || !noteOk) return;
    setBusy(true);
    setError("");
    setResult("");
    const res = await postJson<{ balance: number }>("/api/admin/wallet", { userId: person.id, amount, note });
    if (res.ok && res.data) {
      setResult(
        `${amount > 0 ? "Added" : "Took"} ${formatRupees(Math.abs(amount))} ${amount > 0 ? "to" : "from"} ${person.name}'s wallet. New balance ${formatRupees(res.data.balance)}.`,
      );
      setAmountText("");
      setNote("");
      await mutate((key) => typeof key === "string" && key.startsWith("/api/admin/users"));
      onDone();
    } else {
      setError(res.error ?? COPY.common.network);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Input
            label={WALLET_COPY.admin.amountLabel}
            hint={WALLET_COPY.admin.amountHint}
            value={amountText}
            onChange={(e) => {
              setAmountText(e.target.value);
              setError("");
              setResult("");
            }}
            error={amountText !== "" && !amountOk ? WALLET_COPY.admin.badAmount : undefined}
            inputMode="text"
            autoComplete="off"
            name="adjust-amount"
          />
          <div className="flex flex-wrap gap-2 px-2">
            {ADMIN_ADJUST_PRESETS.map((value) => (
              <Chip key={value} selected={amount === value} onClick={() => setAmountText(String(value))}>
                +{formatRupees(value)}
              </Chip>
            ))}
          </div>
        </div>
        <Input
          label={WALLET_COPY.admin.noteLabel}
          hint={WALLET_COPY.admin.noteHint}
          value={note}
          maxLength={ADMIN_NOTE_MAX + 20}
          onChange={(e) => {
            setNote(e.target.value);
            setError("");
            setResult("");
          }}
          error={note !== "" && !noteOk ? WALLET_COPY.admin.badNote : undefined}
          autoComplete="off"
          name="adjust-note"
        />
      </div>
      {error ? (
        <p role="alert" className="text-secondary font-medium text-brick">
          {error}
        </p>
      ) : null}
      {result ? (
        <p role="status" className="text-secondary font-medium text-olive">
          {result}
        </p>
      ) : null}
      <div>
        <PillButton type="submit" disabled={busy || !amountOk || !noteOk} aria-busy={busy}>
          {WALLET_COPY.admin.apply}
        </PillButton>
      </div>
    </form>
  );
}

/** Admin › Users and wallets: find someone, see their balance and ledger, adjust it with a note. Refreshes every few seconds. */
export function UsersPanel() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(query), SEARCH_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  const list = useSWR<ListReply>(`/api/admin/users?q=${encodeURIComponent(search)}`, getJson, {
    refreshInterval: POLL_MS.admin,
    keepPreviousData: true,
  });
  const detail = useSWR<DetailReply>(
    selected ? `/api/admin/users?id=${encodeURIComponent(selected)}` : null,
    getJson,
    { refreshInterval: POLL_MS.admin, keepPreviousData: true },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-title font-extrabold text-maroon">{WALLET_COPY.admin.title}</h1>
        <p className="mt-1 max-w-3xl text-body text-mocha">{WALLET_COPY.admin.intro}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <section className="rounded-card bg-parchment p-5" aria-label="People">
          <Input
            label={WALLET_COPY.admin.searchLabel}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            name="user-search"
          />
          {list.isLoading ? (
            <div className="mt-4 h-40 rounded-card bg-sand" aria-busy="true" aria-label="Loading people" />
          ) : list.error ? (
            <p className="mt-4 text-body text-espresso">{list.error.message}</p>
          ) : list.data && list.data.users.length === 0 ? (
            <EmptyState icon={<Users weight="regular" size={40} />}>
              {search === "" ? WALLET_COPY.admin.noneYet : WALLET_COPY.admin.none}
            </EmptyState>
          ) : (
            <ul className="mt-4 flex flex-col gap-1">
              {list.data?.users.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(person.id)}
                    aria-pressed={selected === person.id}
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-field px-3 py-2.5 text-left",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon",
                      selected === person.id ? "bg-blush" : "bg-cream",
                    ].join(" ")}
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-secondary font-bold text-espresso">{person.id}</span>
                      <span className="block truncate text-secondary text-mocha">
                        {person.name}
                        {person.role === "staff" ? " · Staff" : ""}
                      </span>
                    </span>
                    <Money
                      amount={person.balance}
                      className={`font-display text-section font-bold ${person.balance < 0 ? "text-brick" : "text-maroon"}`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card bg-parchment p-6" aria-label="Wallet">
          {!selected ? (
            <EmptyState icon={<Users weight="regular" size={40} />}>
              Pick someone from the list to see their wallet.
            </EmptyState>
          ) : !detail.data ? (
            detail.error ? (
              <p className="text-body text-espresso">{detail.error.message}</p>
            ) : (
              <div className="h-64 rounded-card bg-sand" aria-busy="true" aria-label="Loading wallet" />
            )
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-3 font-display text-title font-extrabold text-maroon">
                    {detail.data.user.name}
                    {detail.data.user.role === "staff" ? <Badge tone="olive">Staff</Badge> : null}
                  </h2>
                  <p className="text-secondary text-mocha">{detail.data.user.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-secondary font-medium text-mocha">{WALLET_COPY.balanceLabel}</p>
                  <Money
                    amount={detail.data.balance}
                    className={`font-display text-greeting font-extrabold ${detail.data.balance < 0 ? "text-brick" : "text-maroon"}`}
                  />
                </div>
              </div>

              <Adjust person={detail.data.user} onDone={() => void detail.mutate()} />

              <div>
                <h3 className="font-display text-section font-bold text-maroon">{WALLET_COPY.activity}</h3>
                {detail.data.ledger.length === 0 ? (
                  <p className="mt-2 text-body text-espresso">No wallet activity yet.</p>
                ) : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left">
                      <thead>
                        <tr className="text-secondary text-mocha">
                          <th scope="col" className="py-2 pr-4 font-medium">When</th>
                          <th scope="col" className="py-2 pr-4 font-medium">What</th>
                          <th scope="col" className="py-2 pr-4 font-medium">Note</th>
                          <th scope="col" className="py-2 pr-4 text-right font-medium">Amount</th>
                          <th scope="col" className="py-2 text-right font-medium">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.data.ledger.map((entry, i) => (
                          <tr key={`${entry.at}-${i}`} className="border-t border-sand">
                            <td className="py-2.5 pr-4 text-secondary tabular-nums text-mocha">{formatDayTime(entry.at, detail.data!.now)}</td>
                            <td className="py-2.5 pr-4 text-body text-espresso">{WALLET_COPY.types[entry.type]}</td>
                            <td className="py-2.5 pr-4 text-secondary text-mocha">
                              {[entry.orderId, entry.note].filter(Boolean).join(" · ")}
                            </td>
                            <td className="py-2.5 pr-4 text-right">
                              <Money amount={entry.amount} tone="signed" className="font-display text-section font-bold" />
                            </td>
                            <td className="py-2.5 text-right">
                              <Money amount={entry.balance} className="text-body text-espresso" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
