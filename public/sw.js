// 마술 계산기 PWA용 서비스 워커.
// 캐싱은 하지 않고(콘텐츠 stale 방지) 단지 fetch 핸들러를 등록해
// Android Chrome의 "앱 설치" 설치 가능 조건(installability)을 충족시킨다.
// 탐색 요청이 오프라인 상태에서 실패하면 브랜드 오프라인 페이지를 반환한다.

const CACHE_NAME = "mystic-lab-offline-v1";
const OFFLINE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Mystic Lab</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0D0D1A;color:#F0E6FF;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:1rem}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#9CA3AF;font-size:.875rem;margin-bottom:1.5rem}a{display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:.625rem 1.5rem;border-radius:.75rem;font-size:.875rem;font-weight:600}</style></head><body><div><div class="icon">✦</div><h1>You're Offline</h1><p>Please check your connection and try again.</p><a onclick="location.reload()">Try Again</a></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.put("/offline", new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html" } }))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/offline").then((r) => r ?? new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html" } }))
      )
    );
  }
  // 비탐색 요청은 브라우저 기본 네트워크 동작 사용 (no-op)
});
