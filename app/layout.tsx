import type { Metadata } from "next";
import { Figtree, Grandstander } from "next/font/google";
import "./globals.css";

// UI_UX_BIBLE.md section 2: Grandstander for display, Figtree for text. No other fonts.
const grandstander = Grandstander({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-grandstander",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuickX",
  description: "Food from UC, in your break.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${grandstander.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
