import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  icons: { apple: [{ url: "/images/magic/calc-192.png" }] },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Calculator",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function CalcLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              document.body.style.backgroundColor = "#000000";
              document.documentElement.style.backgroundColor = "#000000";
            } catch (e) {}
          `,
        }}
      />
      {children}
    </>
  );
}
