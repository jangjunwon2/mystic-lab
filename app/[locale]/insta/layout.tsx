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
