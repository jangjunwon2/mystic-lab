// 인스타그램 PWA 아이콘 생성 — 실제 아이콘 디자인(어두운 차콜 배경 + 그라디언트 카메라 글리프).
// 참고 디자인: 다크 스퀴클 위에 보라→핑크→주황→노랑 그라디언트로 그려진 카메라(외곽 사각·렌즈·점).
// 실행: node scripts/gen-insta-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "magic");

function glyph(size, inset) {
  const s = size;
  const r = inset; // 0 = full-bleed(maskable/apple), >0 = 라운드 스퀴클 여백(any)
  const w = s - r * 2;
  // maskable/apple(여백 0)은 모서리 없는 꽉 찬 정사각형(런처/iOS가 자체 라운딩) → 투명·흰 박스 방지
  const radius = r === 0 ? 0 : w * 0.235;

  // 카메라 글리프 — 캔버스 중앙
  const camW = s * 0.48;
  const camX = (s - camW) / 2;
  const camTop = camX;
  const camBottom = camX + camW;
  const cx = s / 2;
  const camR = camW * 0.30;     // 외곽 사각 모서리
  const stroke = s * 0.072;     // 카메라 선 두께(실제 아이콘처럼 도톰하게)
  const lens = camW * 0.255;    // 렌즈 반지름
  const dotR = s * 0.036;       // 우상단 점
  const dotX = cx + camW * 0.335;
  const dotY = cy0() - camW * 0.335;
  function cy0() { return s / 2; }

  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3C3C3E"/>
      <stop offset="100%" stop-color="#2A2A2C"/>
    </linearGradient>
    <!-- 카메라 글리프 그라디언트: 위(보라)→아래(쨍한 노랑), 거의 수직 + 약간 대각 -->
    <linearGradient id="cam" gradientUnits="userSpaceOnUse" x1="${cx - camW * 0.15}" y1="${camTop}" x2="${cx + camW * 0.15}" y2="${camBottom}">
      <stop offset="0%" stop-color="#9B30C9"/>
      <stop offset="22%" stop-color="#C32E91"/>
      <stop offset="46%" stop-color="#E5365A"/>
      <stop offset="70%" stop-color="#F77035"/>
      <stop offset="100%" stop-color="#FFC83C"/>
    </linearGradient>
  </defs>
  <rect x="${r}" y="${r}" width="${w}" height="${w}" rx="${radius}" fill="url(#bg)"/>
  <g fill="none" stroke="url(#cam)" stroke-width="${stroke}">
    <rect x="${camX}" y="${camX}" width="${camW}" height="${camW}" rx="${camR}"/>
    <circle cx="${cx}" cy="${s / 2}" r="${lens}"/>
  </g>
  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="url(#cam)"/>
</svg>`;
}

async function render(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT, file));
  console.log("wrote", file);
}

// maskable: full-bleed 다크 정사각형(런처가 마스킹) → 흰 박스 없음
await render(glyph(512, 0), 512, "insta-maskable-512.png");
// any: 다크 라운드 스퀴클(투명 모서리)
await render(glyph(512, 26), 512, "insta-512.png");
await render(glyph(512, 26), 192, "insta-192.png");
await render(glyph(512, 26), 512, "instagram-icon.png");
// iOS apple-touch-icon — 불투명 정사각형(iOS가 모서리 자동 라운딩)
await render(glyph(512, 0), 180, "insta-apple-180.png");
