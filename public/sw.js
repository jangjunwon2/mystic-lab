// 마술 계산기 PWA용 서비스 워커 (오프라인 Fail-Safe 엔진 탑재)
const CACHE_NAME = "mystic-lab-fail-safe-v3";

const OFFLINE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Mystic Lab</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0D0D1A;color:#F0E6FF;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:1rem}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#9CA3AF;font-size:.875rem;margin-bottom:1.5rem}a{display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:.625rem 1.5rem;border-radius:.75rem;font-size:.875rem;font-weight:600}</style></head><body><div><div class="icon">✦</div><h1>You're Offline</h1><p>Please check your connection and try again.</p><a onclick="location.reload()">Try Again</a></div></body></html>`;

// 마술 연출에 핵심적인 정적 애셋 목록 선제적 캐싱 (Flat/Flat-ish URLs)
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/favicon.ico",
  "/manifest.json",
  "/manifest-insta.json",
  "/globe.svg",
  "/file.svg",
  "/window.svg"
];

// 서비스 워커 설치 시 애셋 캐싱
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 오프라인 HTML 추가
      cache.put("/offline", new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html" } }));
      // 정적 자산 벌크 추가 (실패 시에도 설치 중단되지 않도록 map 처리)
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {/* ignore prefetch fail */})
        )
      );
    })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 청소
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback 전략 구사
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. API 요청 및 결제 등 백엔드 통신은 캐시하지 않고 네트워크 전송 우선
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. GET 요청에 대해서만 캐싱 전략 제공 (POST/PATCH 등은 브라우저 기본 전송)
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공적인 응답을 런타임 캐시에 저장 (확장자 혹은 페이지 캐싱)
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 단절 시 캐시에서 자산 반환
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // 페이지 이동 요청인데 캐시도 없으면 오프라인 기본 화면 반환
          if (event.request.mode === "navigate") {
            return caches.match("/offline");
          }
          // 이미지나 기타 자산은 빈 응답 또는 null 반환
          return new Response("", { status: 404, statusText: "Offline Resource Not Found" });
        });
      })
  );
});
