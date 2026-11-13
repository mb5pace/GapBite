/**
 * QR codes for bag slips (docs/FLOWS.md section 2). Made on the server with the
 * `qrcode` package's module matrix, then drawn by the browser as one SVG path
 * filled with the current text colour. That keeps every colour in the palette
 * tokens: no hex value is written here.
 */
import QRCode from "qrcode";

export interface QrPath {
  /** Modules on one side, not counting the quiet zone. */
  size: number;
  /** SVG path data. One rectangle per horizontal run of dark modules. */
  path: string;
}

export function qrPath(text: string): QrPath {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const { size, data } = qr.modules;
  let path = "";
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x++;
        continue;
      }
      let run = 0;
      while (x + run < size && data[y * size + x + run]) run++;
      path += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return { size, path };
}
