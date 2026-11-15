"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useId, useState } from "react";

export interface AccordionItem {
  id: string;
  title: string;
  /** One paragraph per entry. */
  paragraphs: readonly string[];
}

/**
 * Question rows that open to an answer. `parchment` cards, the whole title row is the 44 px+ button, and any
 * number can be open at once. The state is shown by the caret turning and by aria-expanded, not by colour alone.
 */
export function Accordion({ items }: { items: readonly AccordionItem[] }) {
  const base = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const buttonId = `${base}-${item.id}-button`;
        const panelId = `${base}-${item.id}-panel`;
        return (
          <section key={item.id} className="rounded-card bg-parchment">
            <h2>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-card px-4 py-3 text-left font-display text-section font-bold leading-tight text-maroon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
              >
                <span>{item.title}</span>
                <CaretDown
                  weight="regular"
                  size={20}
                  className={`shrink-0 transition-transform duration-150 ease-out ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </h2>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="flex flex-col gap-3 px-4 pb-4 text-body text-espresso">
              {item.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
