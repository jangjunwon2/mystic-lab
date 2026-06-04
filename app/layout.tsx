import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mystic Lab — Professional Magic Shop",
    template: "%s | Mystic Lab",
  },
  description:
    "Premium magic props and custom electronic devices for professional magicians worldwide. Discover the art of impossible.",
  keywords: ["magic", "magic shop", "magic props", "professional magician", "electronic magic"],
  authors: [{ name: "Mystic Lab" }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Mystic Lab",
    title: "Mystic Lab — Professional Magic Shop",
    description: "Premium magic props and custom electronic devices for professional magicians worldwide.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app"}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Mystic Lab — Professional Magic Shop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mystic Lab — Professional Magic Shop",
    description: "Premium magic props and custom electronic devices for professional magicians worldwide.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app"}/og-image.png`],
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${inter.variable} h-full`}
    >
      <head>
        {/* iOS Safari 성능 복구 — iOS는 PWA 설치에 SW가 불필요한데 scope "/" SW가
            전체 사이트 요청을 가로채 느려지므로, iOS에서는 등록된 SW를 해제한다. */}
        <Script id="ios-sw-cleanup" strategy="afterInteractive">
          {`try{var u=navigator.userAgent.toLowerCase();if((u.indexOf('iphone')>-1||u.indexOf('ipad')>-1||u.indexOf('ipod')>-1)&&'serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});}}catch(e){}`}
        </Script>

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        {/* Meta Pixel */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-[#0D0D1A] text-[#F0E6FF] antialiased">
        {children}
      </body>
    </html>
  );
}
