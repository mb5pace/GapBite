/**
 * The link preview card (WhatsApp, X, Slack, ...): 1200 x 630, drawn with next/og. Left: QuickX, the tagline and one
 * small line (the built-in font has one weight, so a text stroke makes the big lines bold). Right: the tracker student mid-run beside a mini vending machine and the four cafe colours. A picture
 * cannot read CSS tokens, so palette colours are written here as hex; they match app/globals.css.
 */
import { ImageResponse } from "next/og";

export const alt = "QuickX: food from UC, in your break.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  cream: "#FFFCDF",
  parchment: "#F4EFCF",
  sand: "#EEE8C6",
  blush: "#DCBFB7",
  maroon: "#4B2220",
  espresso: "#371110",
  mocha: "#6D4142",
  taupe: "#8F706B",
  sun: "#FFCC01",
  olive: "#5C6B2E",
  amber: "#B7791F",
  brick: "#A3261C",
  truly: "#625955",
  bistro: "#6D4142",
  delice: "#94692A",
  greens: "#4F5E2A",
};

function Scene() {
  const snacks = [C.brick, C.olive, C.blush, C.sun, C.sand, C.brick, C.olive, C.blush, C.sun];
  return (
    <svg width="430" height="378" viewBox="0 0 250 220">
      <path d="M20 170 C0 110 40 40 120 36 C200 32 248 80 246 140 C244 200 180 214 120 212 C60 210 34 200 20 170 Z" fill={C.parchment} />
      {/* vending machine */}
      <rect x="24" y="52" width="92" height="140" rx="10" fill={C.amber} />
      <rect x="24" y="52" width="92" height="14" rx="7" fill={C.sun} />
      <rect x="33" y="74" width="54" height="92" rx="5" fill={C.cream} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect key={`${row}${col}`} x={37 + col * 16} y={80 + row * 28} width="12" height="18" rx="2" fill={snacks[row * 3 + col]} />
        )),
      )}
      <rect x="92" y="74" width="18" height="42" rx="3" fill={C.espresso} />
      {[0, 1, 2, 3].map((r) => [0, 1].map((k) => <rect key={`k${r}${k}`} x={95 + k * 7} y={79 + r * 9} width="5" height="5" rx="1" fill={C.sand} />))}
      <rect x="33" y="172" width="77" height="12" rx="3" fill={C.mocha} />
      {/* running student */}
      <g transform="translate(150 70) scale(3.4)">
        <rect x="6" y="11" width="4" height="7" rx="1.5" fill={C.mocha} stroke={C.espresso} strokeWidth="0.8" />
        <path d="M11 12 L7.5 15.5" stroke={C.espresso} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 19 L8.5 24" stroke={C.espresso} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13 19 L17 23.5" stroke={C.espresso} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9.5 11.5 C9.5 10 15.5 10 15.5 11.5 L15.5 19.5 L9.5 19.5 Z" fill={C.cream} stroke={C.espresso} strokeWidth="0.9" />
        <circle cx="12.5" cy="6.5" r="3.4" fill={C.blush} stroke={C.espresso} strokeWidth="0.9" />
        <path d="M9.1 6.2 C9 2.6 15.6 2.2 16 5.8 C14.4 4.8 11.6 4.6 9.1 6.2 Z" fill={C.espresso} />
        <path d="M12 7.9 Q13.2 9 14.3 7.9" fill="none" stroke={C.espresso} strokeWidth="0.7" strokeLinecap="round" />
        <path d="M14.5 12 L18 14.5" stroke={C.espresso} strokeWidth="1.6" strokeLinecap="round" />
        <rect x="17.2" y="13.6" width="4.2" height="4.4" rx="0.8" fill={C.sand} stroke={C.espresso} strokeWidth="0.8" />
        <path d="M3 13 L6 13 M2 16 L5.5 16 M3 19 L6.5 19" stroke={C.taupe} strokeWidth="0.7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function OpengraphImage() {
  const cafes = [C.truly, C.bistro, C.delice, C.greens];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: C.cream, padding: "0 56px" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 150, color: C.maroon, letterSpacing: -2, lineHeight: 1, WebkitTextStroke: `6px ${C.maroon}` }}>QuickX</div>
          <div style={{ fontSize: 54, color: C.espresso, marginTop: 28, lineHeight: 1.15, WebkitTextStroke: `1.5px ${C.espresso}` }}>Food from UC, in your break.</div>
          <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
            {cafes.map((c) => (
              <div key={c} style={{ width: 64, height: 48, borderRadius: 12, background: c, display: "flex" }} />
            ))}
          </div>
          <div style={{ fontSize: 24, color: C.mocha, marginTop: 28 }}>Pre-order · Collect code · Peer delivery · Team Gapbite</div>
        </div>
        <div style={{ display: "flex" }}>
          <Scene />
        </div>
      </div>
    ),
    size,
  );
}
