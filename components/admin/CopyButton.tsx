"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { PillButton } from "@/components/ui/PillButton";
import { COPIED_MS } from "@/lib/config";

/**
 * Copies text to the clipboard. `getText` runs on click, so a code that is
 * still masked can be fetched at that moment instead of being held in the page.
 */
export function CopyButton({ getText }: { getText: () => Promise<string | null> }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let next: "copied" | "failed" = "failed";
    try {
      const text = await getText();
      if (text) {
        await navigator.clipboard.writeText(text);
        next = "copied";
      }
    } catch {
      next = "failed";
    }
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), COPIED_MS);
  }

  return (
    <PillButton variant="secondary" size="md" onClick={copy} aria-live="polite">
      {state === "copied" ? (
        <Check weight="bold" size={18} aria-hidden="true" />
      ) : (
        <Copy weight="regular" size={18} aria-hidden="true" />
      )}
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
    </PillButton>
  );
}
