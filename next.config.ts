import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "videodelivery.net",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

export default withNextIntl(nextConfig);
