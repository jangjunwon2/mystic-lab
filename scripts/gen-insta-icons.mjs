// 인스타그램 PWA 아이콘 생성 — 흰 배경 문제 수정용.
// 실제 인스타 글리프(2-그라디언트 + 카메라)를 full-bleed로 그려 maskable에서 흰 박스가 안 보이게 한다.
// 실행: node scripts/gen-insta-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "magic");

// 카메라 글리프 + 인스타 그라디언트 (좌하단→우상단). size 기준 좌표 자동 스케일.
function glyph(size, inset) {
  const s = size;
  const r = inset; // 사각형 시작(여백). maskable=0(풀블리드), any=라운드 여백
  const w = s - r * 2;
  // maskable(여백 0)은 런처가 자체 마스킹하므로 모서리 라운드 없이 꽉 채운 정사각형(투명 모서리 금지).
  const radius = r === 0 ? 0 : w * 0.255; // 스퀴클 모서리(any 전용)
  // 카메라: 캔버스 중앙 안전영역에 배치
  const camW = s * 0.46;
  const camX = (s - camW) / 2;
  const camR = camW * 0.29;
  const stroke = s * 0.052;
  const lens = camW * 0.26;
  const dotR = s * 0.032;
  const dotX = s / 2 + camW * 0.34;
  const dotY = s / 2 - camW * 0.34;
  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="30%" cy="107%" r="150%">
      <stop offset="0%" stop-color="#FFDD55"/>
      <stop offset="10%" stop-color="#FFDD55"/>
      <stop offset="50%" stop-color="#FF543E"/>
      <stop offset="100%" stop-color="#C837AB"/>
    </radialGradient>
    <linearGradient id="g2" x1="0%" y1="100%" x2="35%" y2="65%">
      <stop offset="0%" stop-color="#3771C8"/>
      <stop offset="100%" stop-color="#3771C8" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${r}" y="${r}" width="${w}" height="${w}" rx="${radius}" fill="url(#g1)"/>
  <rect x="${r}" y="${r}" width="${w}" height="${w}" rx="${radius}" fill="url(#g2)"/>
  <g fill="none" stroke="#fff" stroke-width="${stroke}">
    <rect x="${camX}" y="${camX}" width="${camW}" height="${camW}" rx="${camR}"/>
    <circle cx="${s / 2}" cy="${s / 2}" r="${lens}"/>
  </g>
  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="#fff"/>
</svg>`;
}

async function render(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(OUT, file));
  console.log("wrote", file);
}

// maskable: full-bleed(여백 0). 런처가 원/스퀴클로 마스킹해도 그라디언트로 꽉 참 → 흰 박스 없음
await render(glyph(512, 0), 512, "insta-maskable-512.png");
// any: 라운드 스퀴클(투명 여백). 홈 아이콘이 인스타 squircle 그대로 보임
await render(glyph(512, 26), 512, "insta-512.png");
await render(glyph(512, 26), 192, "insta-192.png");
// 일부 매니페스트가 참조하는 단일 instagram-icon.png 도 갱신
await render(glyph(512, 26), 512, "instagram-icon.png");
// iOS apple-touch-icon — iOS 홈 화면은 매니페스트 아이콘이 아닌 이 아이콘을 사용한다.
// 반드시 투명 없는 불투명 정사각형(iOS가 모서리를 자동 라운딩) → 흰 박스/스크린샷 폴백 방지.
await render(glyph(512, 0), 180, "insta-apple-180.png");
