import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Product and render uploads are posted through Server Actions.
      // Keep this above our application-level 8 MB file limit so validation
      // can return a useful message instead of Next.js rejecting the request.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
