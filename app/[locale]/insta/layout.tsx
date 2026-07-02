import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function InstaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
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
                if (dtCookieMissing) {
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
