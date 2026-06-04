// 인스타그램 PWA 아이콘 생성 — 사용자가 제공한 그라디언트 카메라 글리프(insta-source.png, 투명 배경)를
// 어두운 차콜 스퀴클 배경 위에 올려 실제 인스타 아이콘(다크 배경 + 그라디언트 카메라)으로 합성.
// 실행: node scripts/gen-insta-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "magic");
const SRC = join(DIR, "insta-source.png");

const GLYPH_SCALE = 0.64; // 아이콘 폭 대비 카메라 글리프 크기(주변 여백 확보, 레퍼런스 톤)

// 어두운 배경 SVG. inset 0 = full-bleed 정사각형(maskable/apple), >0 = 라운드 스퀴클(any, 투명 모서리)
function darkBg(size, inset) {
  const r = inset;
  const w = size - r * 2;
  const radius = r === 0 ? 0 : w * 0.235;
  return Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#3C3C3E"/><stop offset="100%" stop-color="#2A2A2C"/>
  </linearGradient></defs>
  <rect x="${r}" y="${r}" width="${w}" height="${w}" rx="${radius}" fill="url(#bg)"/>
</svg>`);
}

async function make(size, file, inset, flattenDark = false) {
  const bg = await sharp(darkBg(size, inset)).png().toBuffer();
  const g = Math.round(size * GLYPH_SCALE);
  const glyph = await sharp(SRC).resize(g, g).png().toBuffer();
  const off = Math.round((size - g) / 2);
  let img = sharp(bg).composite([{ input: glyph, left: off, top: off }]);
  if (flattenDark) img = img.flatten({ background: "#000000" });
  await img.png().toFile(join(DIR, file));
  console.log("wrote", file);
}

// any (라운드 스퀴클, 투명 모서리)
await make(512, "insta-512.png", 26);
await make(192, "insta-192.png", 26);
await make(512, "instagram-icon.png", 26);
// maskable (full-bleed 정사각형 — 런처가 마스킹)
await make(512, "insta-maskable-512.png", 0);
// iOS apple-touch-icon (불투명 정사각형 — iOS가 모서리 자동 라운딩)
await make(180, "insta-apple-180.png", 0, true);
