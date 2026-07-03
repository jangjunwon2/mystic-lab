import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/account", "/checkout", "/forgot-password", "/reset-password", "/orders/", "/calc", "/insta"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
