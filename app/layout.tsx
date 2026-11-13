import type { Metadata, Viewport } from "next";
import { figtree, grandstander } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickX",
  description: "Food from UC, in your break.",
};

/**
 * Light only, the same on every phone (UI_UX_BIBLE.md "Colour consistency"). "only light" stops
 * browsers that force dark mode on websites from recolouring the app, and theme-color paints the
 * browser's address bar cream. A <meta> tag cannot read a CSS token, so the cream value is written
 * here as hex: it is the one place a colour is written outside globals.css.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "only light",
  themeColor: "#FFFCDF",
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
