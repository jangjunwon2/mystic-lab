"use client";

import { usePathname } from "next/navigation";

interface Props {
  banner: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

// 마술 계산기 앱(/[locale]/calc ...)은 네이티브 앱처럼 보여야 하므로
// 사이트 배너·헤더·푸터를 숨기고 콘텐츠만 전체 화면으로 렌더링한다.
function isAppRoute(pathname: string): boolean {
  return /^\/[^/]+\/calc(\/|$)/.test(pathname);
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
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
