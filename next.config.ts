import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
