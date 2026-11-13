"use client";

import { COPY } from "@/data/copy";
import { figtree, grandstander } from "./fonts";
import "./globals.css";

/**
 * Used only when the root layout itself breaks. It must bring its own <html> and <body>, so it sets
 * the cream background and the fonts itself: without this Next shows a white page that turns black
 * on phones in dark mode.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={`${grandstander.variable} ${figtree.variable} h-full antialiased`}>
      <body className="flex min-h-full items-center justify-center bg-cream px-5 text-espresso">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-body text-espresso">{COPY.errorPages.broke}</p>
          <button
            type="button"
            onClick={reset}
            className="h-11 rounded-pill bg-sand px-4 font-display text-secondary font-bold text-espresso"
          >
            {COPY.errorPages.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
