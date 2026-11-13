import { Figtree, Grandstander } from "next/font/google";

// UI_UX_BIBLE.md section 2: Grandstander for display, Figtree for text. No other fonts.
export const grandstander = Grandstander({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-grandstander",
  display: "swap",
});

export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-figtree",
  display: "swap",
});
