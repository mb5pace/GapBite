"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useId } from "react";
import { COPY } from "@/data/copy";

/** The Home search box: a pill on sand with a magnifier, and a clear button once something is typed. */
export function SearchField({
  value,
  onChange,
  label = COPY.student.home.searchLabel,
  placeholder = COPY.student.home.searchPlaceholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-mocha" aria-hidden="true">
        <MagnifyingGlass weight="regular" size={24} />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        className={`h-14 w-full rounded-pill bg-sand pl-12 ${value ? "pr-14" : "pr-5"} text-body text-ellipsis text-espresso placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon [&::-webkit-search-cancel-button]:hidden`}
      />
      {value ? (
        <button
          type="button"
          aria-label={COPY.student.home.searchClear}
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-1.5 my-auto flex size-11 items-center justify-center rounded-pill text-mocha focus-visible:outline-2 focus-visible:outline-maroon"
        >
          <X weight="regular" size={20} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
