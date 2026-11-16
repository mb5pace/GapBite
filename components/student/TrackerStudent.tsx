"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The little student above the order progress line. Flat inline SVG in palette colours, animated with CSS keyframes
 * only (transform and opacity). `stage` is the current step, 0 to 3; the parent positions this component.
 *
 * Idle per stage: 0 taps a foot, 1 waits while steam rises from the food bag, 2 runs, 3 hops once with confetti and
 * smiles. For 600 ms after the stage changes it walks (the parent slides it over the same 600 ms). Reduced motion: a
 * still figure.
 */
export const TRACKER_SLIDE_MS = 600;

const CONFETTI = ["sun", "olive", "brick", "amber", "blush", "maroon"] as const;

export function TrackerStudent({ stage }: { stage: number }) {
  const [walking, setWalking] = useState(false);
  const previous = useRef(stage);

  useEffect(() => {
    if (previous.current === stage) return;
    previous.current = stage;
    setWalking(true);
    const timer = window.setTimeout(() => setWalking(false), TRACKER_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const mode = walking ? "walk" : (["tap", "wait", "run", "done"] as const)[Math.min(3, Math.max(0, stage))];
  const ink = "var(--color-espresso)";

  return (
    <span className="ts-root relative block" data-mode={mode} aria-hidden="true">
      <style>{STYLES}</style>
      <svg viewBox="0 0 24 28" width="22" height="26" overflow="visible" className="ts-figure block">
        <g className="ts-body">
          {/* backpack */}
          <rect x="6" y="11" width="4" height="7" rx="1.5" fill="var(--color-mocha)" stroke={ink} strokeWidth="0.8" />
          {/* back arm */}
          <g className="ts-arm-b">
            <path d="M11 12 L9.5 17" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
          </g>
          {/* legs */}
          <g className="ts-leg-b">
            <path d="M12 19 L11 25" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <g className="ts-leg-f">
            <path d="M13 19 L14 25" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          </g>
          {/* shirt */}
          <path d="M9.5 11.5 C9.5 10 15.5 10 15.5 11.5 L15.5 19.5 L9.5 19.5 Z" fill="var(--color-cream)" stroke={ink} strokeWidth="0.9" strokeLinejoin="round" />
          {/* head and hair */}
          <circle cx="12.5" cy="6.5" r="3.4" fill="var(--color-blush)" stroke={ink} strokeWidth="0.9" />
          <path d="M9.1 6.2 C9 2.6 15.6 2.2 16 5.8 C14.4 4.8 11.6 4.6 9.1 6.2 Z" fill={ink} />
          <path className="ts-smile" d="M12 7.9 Q13.2 9 14.3 7.9" fill="none" stroke={ink} strokeWidth="0.7" strokeLinecap="round" />
          {/* front arm with the food bag */}
          <g className="ts-arm-f">
            <path d="M14.5 12 L16.5 16.5" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
            <rect x="15.2" y="16.2" width="4.2" height="4.4" rx="0.8" fill="var(--color-sand)" stroke={ink} strokeWidth="0.8" />
            <path className="ts-steam ts-steam-1" d="M16.4 15 q-0.6 -1 0 -2" fill="none" stroke="var(--color-taupe)" strokeWidth="0.6" strokeLinecap="round" />
            <path className="ts-steam ts-steam-2" d="M18.2 15 q0.6 -1 0 -2" fill="none" stroke="var(--color-taupe)" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        </g>
      </svg>
      <span className="ts-confetti" aria-hidden="true">
        {CONFETTI.map((color, i) => (
          <span key={color} className={`ts-bit ts-bit-${i}`} style={{ backgroundColor: `var(--color-${color})` }} />
        ))}
      </span>
    </span>
  );
}

const STYLES = `
.ts-figure g { transform-box: fill-box; }
.ts-leg-b, .ts-leg-f, .ts-arm-b, .ts-arm-f { transform-origin: 50% 0%; }
.ts-steam, .ts-smile, .ts-confetti { opacity: 0; }
.ts-root[data-mode="wait"] .ts-steam { animation: ts-steam 1.4s ease-out infinite; }
.ts-root[data-mode="wait"] .ts-steam-2 { animation-delay: 0.7s; }
.ts-root[data-mode="tap"] .ts-leg-f { animation: ts-tap 0.8s ease-in-out infinite; }
.ts-root[data-mode="walk"] .ts-leg-f, .ts-root[data-mode="walk"] .ts-arm-b { animation: ts-swing 0.3s ease-in-out infinite alternate; }
.ts-root[data-mode="walk"] .ts-leg-b, .ts-root[data-mode="walk"] .ts-arm-f { animation: ts-swing 0.3s ease-in-out infinite alternate-reverse; }
.ts-root[data-mode="walk"] .ts-body { animation: ts-bob 0.3s ease-in-out infinite alternate; }
.ts-root[data-mode="run"] .ts-leg-f, .ts-root[data-mode="run"] .ts-arm-b { animation: ts-run 0.18s linear infinite alternate; }
.ts-root[data-mode="run"] .ts-leg-b, .ts-root[data-mode="run"] .ts-arm-f { animation: ts-run 0.18s linear infinite alternate-reverse; }
.ts-root[data-mode="run"] .ts-body { animation: ts-bounce 0.36s ease-in-out infinite; }
.ts-root[data-mode="done"] .ts-figure { animation: ts-hop 0.5s ease-out 1; }
.ts-root[data-mode="done"] .ts-smile { opacity: 1; }
.ts-confetti { position: absolute; left: 50%; top: 4px; }
.ts-bit { position: absolute; width: 3px; height: 3px; border-radius: 1px; }
.ts-root[data-mode="done"] .ts-confetti { opacity: 1; }
.ts-root[data-mode="done"] .ts-bit { animation: ts-burst 0.9s ease-out 1 forwards; opacity: 0; }
.ts-bit-0 { --dx: -12px; --dy: -10px; } .ts-bit-1 { --dx: 12px; --dy: -11px; } .ts-bit-2 { --dx: -8px; --dy: -15px; }
.ts-bit-3 { --dx: 8px; --dy: -16px; } .ts-bit-4 { --dx: -15px; --dy: -3px; } .ts-bit-5 { --dx: 15px; --dy: -4px; }
@keyframes ts-swing { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
@keyframes ts-run { from { transform: rotate(-38deg); } to { transform: rotate(38deg); } }
@keyframes ts-bob { from { transform: translateY(0); } to { transform: translateY(-1px); } }
@keyframes ts-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
@keyframes ts-tap { 0%, 60%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-18deg); } }
@keyframes ts-steam { 0% { opacity: 0; transform: translateY(1px); } 40% { opacity: 1; } 100% { opacity: 0; transform: translateY(-3px); } }
@keyframes ts-hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
@keyframes ts-burst { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(180deg); } }
@media (prefers-reduced-motion: reduce) {
  .ts-root *, .ts-root { animation: none !important; transition: none !important; }
  .ts-root .ts-steam, .ts-root .ts-confetti { opacity: 0 !important; }
}
`;
