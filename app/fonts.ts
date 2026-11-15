import { Grandstander, Plus_Jakarta_Sans } from "next/font/google";

// UI_UX_BIBLE.md section 2: Plus Jakarta Sans for all text, headings and numbers. Professional, not playful.
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// The one exception: the QuickX wordmark on the gate keeps its chunky look as the logo. Nothing else uses it.
export const grandstander = Grandstander({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-grandstander",
  display: "swap",
});
