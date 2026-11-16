import type { Metadata, Viewport } from "next";
import { grandstander, plusJakartaSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Makes the link-preview image URL absolute (app/opengraph-image.tsx), as WhatsApp and others need.
  metadataBase: new URL("https://quickx-gapbite.vercel.app"),
  title: "QuickX",
  description: "Food from UC, in your break.",
  openGraph: {
    type: "website",
    siteName: "QuickX",
    title: "QuickX",
    description: "Food from UC, in your break.",
    url: "/",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: "QuickX", description: "Food from UC, in your break." },
  // Added to an iPhone's home screen it opens full screen, with the status bar over the cream page and the short name.
  appleWebApp: { capable: true, title: "QuickX", statusBarStyle: "default" },
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
      className={`${plusJakartaSans.variable} ${grandstander.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
