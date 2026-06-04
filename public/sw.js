// 마술 계산기 PWA용 최소 서비스 워커.
// 캐싱은 하지 않고(콘텐츠 stale 방지) 단지 fetch 핸들러를 등록해
// Android Chrome 의 "앱 설치" 설치 가능 조건(installability)을 충족시킨다.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch 핸들러 존재 자체가 설치 가능 요건. respondWith를 호출하지 않으면
// 브라우저 기본 네트워크 동작을 그대로 사용한다(패스스루).
self.addEventListener("fetch", () => {
  // no-op: 네트워크 기본 동작 사용
});
