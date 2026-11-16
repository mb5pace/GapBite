"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { COPY } from "@/data/copy";

/** If the browser never sends scrollend, a tapped scroll counts as finished after this long. */
const TAP_SCROLL_FALLBACK_MS = 1200;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface TabSection {
  id: string;
  label: string;
}

/**
 * Sticky horizontal tabs under the header, one for each section of a menu (a section is an element with
 * id="section-<id>"). One 3 px maroon underline slides from tab to tab. Tapping a tab smooth-scrolls to its section; scrolling
 * the page moves the underline (at the very bottom, the last one). It measures the sticky header once and keeps `--sticky-offset` (header + tabs) on the page, so
 * sections stop just below them.
 */
export function CategoryTabs({ sections }: { sections: TabSection[] }) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  /** The section a tap is scrolling to; manual-scroll tracking waits until it lands. */
  const tapLock = useRef<string | null>(null);
  const lockTimer = useRef<number | undefined>(undefined);
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

  // Following manual scrolling: the last section whose top has reached the tabs (at the very bottom, the last one).
  // An IntersectionObserver tells us when a section crosses the line under the tabs. While a tapped scroll is running
  // the result is ignored, so the underline does not run back through the middle tabs.
  useEffect(() => {
    const ids = idsKey.split("|");
    const update = () => {
      if (tapLock.current !== null) return;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`);
        if (el && el.getBoundingClientRect().top <= offset.current + 1) current = id;
      }
      const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setPicked(atBottom ? ids[ids.length - 1] : current);
    };
    let observer: IntersectionObserver | null = null;
    const watch = () => {
      observer?.disconnect();
      const line = offset.current + 1;
      observer = new IntersectionObserver(update, {
        rootMargin: `-${line}px 0px -${Math.max(0, window.innerHeight - line - 1)}px 0px`,
        threshold: [0, 1],
      });
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`);
        if (el) observer.observe(el);
      }
    };
    watch();
    // The bottom of the page is not a crossing, so it is checked when a scroll ends.
    const onEnd = () => update();
    window.addEventListener("scrollend", onEnd);
    window.addEventListener("resize", watch);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scrollend", onEnd);
      window.removeEventListener("resize", watch);
    };
  }, [idsKey]);

  // The one underline: slides (transform and width, 350 ms) to the open tab. Measured again on resize and after fonts load.
  useLayoutEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!tab) return;
      bar.style.transform = `translateX(${tab.offsetLeft}px)`;
      bar.style.width = `${tab.offsetWidth}px`;
      bar.style.opacity = "1";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    let alive = true;
    void document.fonts?.ready.then(() => alive && place());
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [active, idsKey]);

  // Keep the open tab in view, centred in the strip when the row of tabs is wider than the screen.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!list || !tab) return;
    // Scrolling the strip itself (not tab.scrollIntoView) so the page's own smooth scroll is never interrupted.
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [active]);

  useEffect(() => () => window.clearTimeout(lockTimer.current), []);

  function go(id: string) {
    const section = document.getElementById(`section-${id}`);
    setPicked(id);
    if (!section) return;
    // A new tap takes over: the old lock and its timer are replaced.
    tapLock.current = id;
    window.clearTimeout(lockTimer.current);
    const release = () => {
      window.removeEventListener("scrollend", release);
      window.clearTimeout(lockTimer.current);
      if (tapLock.current === id) tapLock.current = null;
    };
    window.addEventListener("scrollend", release);
    lockTimer.current = window.setTimeout(release, TAP_SCROLL_FALLBACK_MS);
    const top = section.getBoundingClientRect().top + window.scrollY - offset.current;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? "auto" : "smooth" });
  }

  if (sections.length === 0) return null;
  return (
    <nav ref={navRef} aria-label={COPY.student.menu.categories} className="sticky z-20 -mx-5 bg-cream px-5">
      <div ref={listRef} className="relative flex gap-6 overflow-x-auto [scrollbar-width:none]">
        <span
          ref={barRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-0 rounded-pill bg-maroon opacity-0 transition-[transform,width] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        />
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
                on ? "font-bold text-maroon" : "font-medium text-mocha"
              } border-transparent`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
