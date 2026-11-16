"use client";

import { useState } from "react";
import { CAFE_COPY } from "@/data/cafe-copy";
import type { Holiday } from "@/data/hours";
import { Banner } from "@/components/ui/Banner";
import { PillButton } from "@/components/ui/PillButton";
import { HOLIDAY_NOTE_MAX } from "@/lib/config";
import { validateHoliday } from "@/lib/hours-rules";
import { PillField } from "./PillField";

/** "Thu 12 Nov 2026" from "2026-11-12". The date is a calendar day in IST, so it is read as UTC with no shift. */
function dateWords(date: string): string {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).formatToParts(
    new Date(`${date}T00:00:00Z`),
  );
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")} ${pick("year")}`;
}

/** Holidays: every place is closed on these days. Add a date and a note, remove one, and the list stays earliest first. */
export function HolidaysSection({
  holidays,
  change,
}: {
  holidays: Holiday[];
  change: (body: Record<string, unknown>, done: string) => Promise<string | null>;
}) {
  const copy = CAFE_COPY.hours;
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function add() {
    const message = validateHoliday(date, note, holidays.filter((h) => h.date !== date).length);
    if (message) {
      setProblem(message);
      return;
    }
    setBusy(true);
    setProblem(null);
    const error = await change({ action: "holiday-add", date, note: note.trim() }, copy.holidayAdded(dateWords(date)));
    setBusy(false);
    if (error) {
      setProblem(error);
    } else {
      setDate("");
      setNote("");
    }
  }

  async function remove(holiday: Holiday) {
    setBusy(true);
    setProblem(null);
    const error = await change({ action: "holiday-remove", date: holiday.date }, copy.holidayRemoved(dateWords(holiday.date)));
    setBusy(false);
    if (error) setProblem(error);
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="holidays-title">
      <div>
        <h2 id="holidays-title" className="font-display text-section font-bold text-maroon">
          {copy.holidaysTitle}
        </h2>
        <p className="mt-1 text-body text-mocha">{copy.holidaysIntro}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-parchment p-5">
        <div className="flex flex-wrap items-end gap-4">
          <PillField label={copy.holidayDate} type="date" value={date} onChange={setDate} widthClass="w-44" />
          <PillField
            label={copy.holidayNote}
            type="text"
            value={note}
            maxLength={HOLIDAY_NOTE_MAX}
            placeholder="Diwali"
            onChange={setNote}
            widthClass="w-64"
            aria-describedby="holiday-note-hint"
          />
          <PillButton size="desk" disabled={busy || !date || note.trim() === ""} onClick={() => void add()}>
            {copy.holidayAdd}
          </PillButton>
        </div>
        <p id="holiday-note-hint" className="text-secondary text-mocha">
          {copy.holidayNoteHint}
        </p>
        {problem ? <Banner tone="error">{problem}</Banner> : null}

        {holidays.length === 0 ? (
          <p className="text-body text-mocha">{copy.noHolidays}</p>
        ) : (
          <ul aria-label={copy.holidayListLabel} className="divide-y divide-sand">
            {holidays.map((holiday) => (
              <li key={holiday.date} className="flex flex-wrap items-center justify-between gap-3 py-2" data-holiday={holiday.date}>
                <span>
                  <span className="text-body font-medium text-espresso">{dateWords(holiday.date)}</span>
                  <span className="text-body text-mocha"> · {holiday.note}</span>
                </span>
                <PillButton variant="secondary" size="desk" disabled={busy} aria-label={copy.holidayRemove(dateWords(holiday.date), holiday.note)} onClick={() => void remove(holiday)}>
                  Remove
                </PillButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
