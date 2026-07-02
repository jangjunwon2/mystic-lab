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
            (function() {
              try {
                var calcToken = localStorage.getItem("ml_calc_device_token");
                var calcCookieMissing = calcToken && !document.cookie.includes("ml_calc_device_token=");
                var dtCookieMissing = false;
                
                for (var i = 0; i < localStorage.length; i++) {
                  var key = localStorage.key(i);
                  if (key && key.indexOf("ml_dt_") === 0) {
                    var val = localStorage.getItem(key);
                    if (val && !document.cookie.includes(key + "=")) {
                      document.cookie = key + "=" + val + "; path=/; max-age=2592000; SameSite=Lax";
                      dtCookieMissing = true;
                    }
                  }
                }
                
                if (calcCookieMissing) {
                  document.cookie = "ml_calc_device_token=" + calcToken + "; path=/; max-age=2592000; SameSite=Lax";
                }
                
                if (calcCookieMissing || dtCookieMissing) {
                  window.location.reload();
                }
              } catch (e) {}
            })();
          `,
        }}
      />
      {children}
    </>
  );
}
