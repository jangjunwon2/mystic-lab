"use client";

import { usePathname } from "next/navigation";

interface Props {
  banner: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

// 마술 앱(/[locale]/calc, /[locale]/insta ...)은 네이티브 앱처럼 보여야 하므로
// 사이트 배너·헤더·푸터를 숨기고 콘텐츠만 전체 화면으로 렌더링한다.
function isAppRoute(pathname: string): boolean {
  return /^\/[^/]+\/(calc|insta)(\/|$)/.test(pathname);
}

export default function SiteChrome({ banner, header, footer, children }: Props) {
  const pathname = usePathname();

  if (isAppRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      {banner}
      {header}
      {/* 배너가 보이면(--ml-banner-h>0) 본문을 그만큼 아래로 — 고정 배너에 가리지 않도록 */}
      <main className="flex-1" style={{ paddingTop: "var(--ml-banner-h, 0px)" }}>{children}</main>
      {footer}
    </>
  );
}
