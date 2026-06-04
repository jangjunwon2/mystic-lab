export { default } from "@/magic/pages/InstaPage";

// 인스타 앱 전용 PWA 매니페스트 (계산기와 별도 설치)
// iOS는 매니페스트 아이콘을 홈 화면에 쓰지 않으므로 apple-touch-icon을 별도 지정(불투명 풀블리드).
// appleWebApp.capable=true 라야 iOS '홈 화면에 추가' 시 주소창 없이 풀스크린(네이티브 위장)으로 실행됨.
export const metadata = {
  manifest: "/manifest-insta.json",
  icons: { apple: [{ url: "/images/magic/insta-apple-180.png" }] },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" as const, title: "Instagram" },
};

// 네이티브 앱 위장 — 상태바/세이프에어리어를 검정으로(사이트 보라 배경 비침 방지) + 노치 영역까지 채움
export const viewport = {
  themeColor: "#000000",
  viewportFit: "cover" as const,
};
