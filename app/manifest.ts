import type { MetadataRoute } from "next";
import { ICON_CREAM } from "@/lib/app-icon";

/**
 * "Add to Home Screen": QuickX opens full screen from its own icon, starting at the gate. No service worker and no
 * offline cache: it always loads fresh from the network.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuickX",
    short_name: "QuickX",
    description: "Food from UC, in your break.",
    start_url: "/",
    display: "standalone",
    background_color: ICON_CREAM,
    theme_color: ICON_CREAM,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
