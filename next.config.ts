import { readdirSync } from "node:fs";
import type { NextConfig } from "next";

/**
 * Which item photos exist, decided once at build time. public/food/<item-id>.jpg
 * on disk becomes an entry here; lib/photos.ts reads it. Photos are served from
 * the CDN on Vercel and are not on the function's disk, so the list has to be
 * made now, not when a request comes in. Add photos, push, and the build picks
 * them up.
 */
function foodPhotoIds(): string {
  try {
    return readdirSync("public/food")
      .filter((file) => file.endsWith(".jpg"))
      .map((file) => file.slice(0, -".jpg".length))
      .join(",");
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_FOOD_PHOTOS: foodPhotoIds() },
  // Tailwind v4 is compiled by the Turbopack loader that create-next-app wires up.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
