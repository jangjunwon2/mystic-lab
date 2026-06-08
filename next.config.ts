import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// 결제·외부 위젯에 필요한 출처. CSP는 우선 Report-Only로 적용(차단하지 않고 위반만 콘솔 보고)한다.
// 라이브에서 위반 로그가 없는 것을 확인한 뒤 Content-Security-Policy(강제)로 승격할 것.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // Next.js 인라인 스크립트 + 결제/분석 위젯 (nonce 미사용이라 unsafe-inline 허용)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://assets.lemonsqueezy.com https://app.lemonsqueezy.com https://js.tosspayments.com https://*.tosspayments.com https://t1.daumcdn.net https://*.daumcdn.net https://www.googletagmanager.com https://connect.facebook.net https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  "frame-src 'self' https://*.lemonsqueezy.com https://*.tosspayments.com https://player.vimeo.com https://*.cloudflarestream.com https://iframe.videodelivery.net https://accounts.google.com https://postcode.map.daum.net https://*.daumcdn.net",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lemonsqueezy.com https://*.tosspayments.com https://www.google-analytics.com https://region1.google-analytics.com https://*.daumcdn.net",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

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
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default withNextIntl(nextConfig);
