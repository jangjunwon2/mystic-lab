export { default } from "@/magic/pages/InstaPage";

// 인스타 앱 전용 PWA 매니페스트 (계산기와 별도 설치)
export const metadata = { manifest: "/manifest-insta.json" };

// 네이티브 앱 위장 — 상태바/세이프에어리어를 검정으로(사이트 보라 배경 비침 방지) + 노치 영역까지 채움
export const viewport = {
  themeColor: "#000000",
  viewportFit: "cover" as const,
};
