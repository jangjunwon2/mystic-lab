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

  // 하이드레이션 초기 단계(pathname이 null)이거나 마술 앱 경로인 경우 헤더/푸터를 그리지 않아 깜빡임 방지
  if (!pathname || isAppRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0D0D1A] overflow-x-hidden">
      {/* 프리미엄 뒷배경 그라데이션 글로우 효과 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-[#7C3AED]/7 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] sm:w-[45vw] sm:h-[45vw] rounded-full bg-[#A855F7]/7 blur-[130px]" />
        <div className="absolute top-[35%] left-[55%] w-[45vw] h-[45vw] sm:w-[35vw] sm:h-[35vw] rounded-full bg-[#5B21B6]/4 blur-[110px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {banner}
        {header}
        {/* 배너가 보이면(--ml-banner-h>0) 본문을 그만큼 아래로 — 고정 배너에 가리지 않도록 */}
        <main className="flex-1 flex flex-col" style={{ paddingTop: "var(--ml-banner-h, 0px)" }}>{children}</main>
        {footer}
      </div>
    </div>
  );
}
