"use client";

import { useEffect, useRef, useState } from "react";
import { COPY } from "@/data/copy";

export interface TabSection {
  id: string;
  label: string;
}

/**
 * Sticky horizontal tabs under the header, one for each section of a menu (a section is an element with
 * id="section-<id>"). The open one has a 3 px maroon underline. Tapping a tab scrolls to its section; scrolling the page
 * moves the underline (at the very bottom, the last one). It measures the sticky header once and keeps `--sticky-offset` (header + tabs) on the page, so
 * sections stop just below them.
 */
export function CategoryTabs({ sections }: { sections: TabSection[] }) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const [picked, setPicked] = useState<string | null>(null);

  const idsKey = sections.map((s) => s.id).join("|");
  // Whatever the last scroll or tap chose, as long as that section is still on the page.
  const active = picked !== null && sections.some((s) => s.id === picked) ? picked : (sections[0]?.id ?? "");

  // Stay just under the sticky header, and tell the sections how far down to stop.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const header = document.querySelector<HTMLElement>("[data-app-header]");
    const apply = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      nav.style.top = `${headerHeight}px`;
      offset.current = headerHeight + nav.getBoundingClientRect().height + 8;
      document.documentElement.style.setProperty("--sticky-offset", `${offset.current}px`);
    };
    const observer = new ResizeObserver(apply);
    if (header) observer.observe(header);
    observer.observe(nav);
    apply();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--sticky-offset");
    };
  }, []);

  // Scrolling the page moves the underline: the last section whose top has reached the tabs.
  useEffect(() => {
    const ids = idsKey.split("|");
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`);
        if (el && el.getBoundingClientRect().top <= offset.current + 1) current = id;
      }
      // At the very bottom the last section may be too short to ever reach the tabs: it is still the one being read.
      const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setPicked(atBottom ? ids[ids.length - 1] : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [idsKey]);

  // Keep the open tab in view when the row of tabs is wider than the screen.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (list && tab) list.scrollTo({ left: tab.offsetLeft - 20, behavior: "smooth" });
  }, [active]);

  function go(id: string) {
    setPicked(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  if (sections.length === 0) return null;
  return (
    <nav ref={navRef} aria-label={COPY.student.menu.categories} className="sticky z-20 -mx-5 bg-cream px-5">
      <div ref={listRef} className="flex gap-6 overflow-x-auto [scrollbar-width:none]">
        {sections.map((section) => {
          const on = section.id === active;
          return (
            <button
              key={section.id}
              type="button"
              data-tab={section.id}
              aria-current={on ? "true" : undefined}
              onClick={() => go(section.id)}
              className={`shrink-0 whitespace-nowrap border-b-[3px] py-3 text-body focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-maroon ${
                on ? "border-maroon font-bold text-maroon" : "border-transparent font-medium text-mocha"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
