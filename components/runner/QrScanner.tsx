"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { RUN_COPY } from "@/data/order-copy";
import { SCAN_HEIGHT_IDEAL, SCAN_WIDTH_IDEAL } from "@/lib/config";

/**
 * The camera view. The library is loaded only when the sheet opens (it needs the browser), and its
 * decoder file is served from our own site (/scanner/zxing_reader.wasm) instead of a CDN, so scanning
 * works without reaching a third party. Its built-in overlay buttons are off: the frame below is ours,
 * in palette colours only.
 */
const Scanner = dynamic(
  async () => {
    const lib = await import("@yudiel/react-qr-scanner");
    lib.setZXingModuleOverrides({
      locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? "/scanner/zxing_reader.wasm" : prefix + path),
    });
    return lib.Scanner;
  },
  { ssr: false, loading: () => <div className="aspect-square w-full rounded-card bg-sand" aria-busy="true" /> },
);

/**
 * What the camera found, or why it cannot start. `onText` gets the raw text of the first QR code.
 * Phones are asked for the rear camera. A laptop has none, and the browser then says "overconstrained":
 * that is not a failure, so it asks again for whichever camera there is.
 */
export function QrScanner({ onText, onUnavailable }: { onText: (text: string) => void; onUnavailable: () => void }) {
  const [facing, setFacing] = useState<"rear" | "any">("rear");
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-espresso" data-testid="camera">
        <Scanner
          key={facing}
          onScan={(codes) => {
            const text = codes[0]?.rawValue;
            if (text) onText(text);
          }}
          onError={(error) => {
            if (error.kind === "overconstrained" && facing === "rear") setFacing("any");
            else onUnavailable();
          }}
          constraints={{
            // Only "ideal" sizes: the library's own defaults demand at least 640 px of height, which a
            // plain 640 x 480 webcam cannot give.
            facingMode: facing === "rear" ? "environment" : undefined,
            width: { ideal: SCAN_WIDTH_IDEAL },
            height: { ideal: SCAN_HEIGHT_IDEAL },
          }}
          formats={["qr_code"]}
          components={{ finder: false, torch: false, onOff: false, zoom: false }}
          sound={false}
          styles={{ container: { width: "100%", height: "100%" }, video: { objectFit: "cover" } }}
        />
        <span className="pointer-events-none absolute inset-8 rounded-card ring-2 ring-cream" aria-hidden="true" />
      </div>
      <p className="text-center text-secondary text-mocha">{RUN_COPY.scanHint}</p>
    </div>
  );
}
