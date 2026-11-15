/**
 * The QuickX home-screen icon, drawn for next/og's ImageResponse: a cream "Q" mark (a ring with a short tail) on a
 * maroon square. Our own geometric mark, not a font glyph, so it looks the same at every size. A picture cannot read
 * CSS tokens, so the two colours are written here as hex: they are `cream` and `maroon` from app/globals.css.
 */
import { ImageResponse } from "next/og";

export const ICON_CREAM = "#FFFCDF";
export const ICON_MAROON = "#4B2220";

/**
 * `size` is the square's side in pixels. `markShare` is how much of it the mark spans: smaller for a maskable icon,
 * whose outer edge a phone may cut off (it keeps the mark inside the central safe zone).
 */
export function appIcon(size: number, markShare = 0.62): ImageResponse {
  const mark = Math.round(size * markShare);
  const ring = Math.round(mark * 0.16);
  const tailW = Math.round(mark * 0.44);
  // The tail crosses the ring at its lower-right point (45 degrees), half inside and half outside, so it reads as a Q.
  const onRing = mark / 2 + ((mark - ring) / 2) * Math.SQRT1_2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: ICON_MAROON }}>
        <div style={{ position: "relative", width: mark, height: mark, display: "flex" }}>
          <div style={{ width: mark, height: mark, borderRadius: mark, border: `${ring}px solid ${ICON_CREAM}`, display: "flex" }} />
          <div
            style={{
              position: "absolute",
              left: Math.round(onRing - tailW / 2),
              top: Math.round(onRing - ring / 2),
              width: tailW,
              height: ring,
              borderRadius: ring,
              background: ICON_CREAM,
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
