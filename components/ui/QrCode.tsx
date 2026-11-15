import { QR_QUIET_MODULES } from "@/lib/config";
import type { QrPath } from "@/lib/qr";

/**
 * A QR code made on the server (lib/qr.ts), drawn as one SVG path in `espresso` on `cream`, with the 4-module quiet
 * zone kept so phones and scanners read it. 220 px by default.
 */
export function QrCode({ qr, label, className = "size-[220px]" }: { qr: QrPath; label: string; className?: string }) {
  const box = qr.size + QR_QUIET_MODULES * 2;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-QR_QUIET_MODULES} ${-QR_QUIET_MODULES} ${box} ${box}`}
      shapeRendering="crispEdges"
      className={`shrink-0 bg-cream text-espresso ${className}`}
      data-qr=""
    >
      <path d={qr.path} fill="currentColor" />
    </svg>
  );
}
