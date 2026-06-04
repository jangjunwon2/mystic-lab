// 가짜 인스타그램 앱(독립 PWA) 설정 모델 — 기기 내 비밀 설정(localStorage)에 저장.
// 마술사가 프로필·게시물을 직접 커스텀(사진 업로드·캡션·좋아요·날짜·댓글)한다.

export interface InstaComment {
  user: string;
  text: string;
}

export interface InstaPost {
  id: string;
  image: string; // dataURL 또는 외부 URL
  caption: string;
  likes: number;
  date: string; // 표시용 텍스트 (예: "3주 전", "2026-05-14")
  comments: InstaComment[];
}

export interface InstaConfig {
  username: string;
  displayName: string;
  avatar: string; // dataURL 또는 외부 URL (빈 값이면 기본 아바타)
  bio: string;
  verified: boolean;
  postsCount: number; // 표시용 게시물 수 (실제 posts 수와 달라도 됨)
  followers: number;
  following: number;
  appLocale: "ko" | "en" | "ja" | "zh-CN" | "es" | "fr" | "de";
  posts: InstaPost[];
}

export const INSTA_STORAGE_KEY = "ml_insta_config";

export function defaultInstaConfig(locale: string): InstaConfig {
  const loc = (["ko", "en", "ja", "zh-CN", "es", "fr", "de"].includes(locale) ? locale : "en") as InstaConfig["appLocale"];
  return {
    username: "mystic_lab_magic",
    displayName: "Mystic Lab",
    avatar: "",
    bio: "✨ Mentalist & Magician\n🔮 Predictions that come true\n📍 Astral Plane",
    verified: true,
    postsCount: 128,
    followers: 84200,
    following: 312,
    appLocale: loc,
    posts: [
      {
        id: "p1",
        image: "/images/magic/instagram-post.png",
        caption: "Three weeks ago I saw three numbers in a dream… destiny is already written. 🔮✨",
        likes: 1248,
        date: "3 weeks ago",
        comments: [
          { user: "alex_mental", text: "No way... how is this possible? 🤯" },
          { user: "sarah_mystique", text: "Absolutely jaw-dropping. 😱" },
        ],
      },
    ],
  };
}

export function loadInstaConfig(locale: string): InstaConfig {
  const base = defaultInstaConfig(locale);
  try {
    const raw = localStorage.getItem(INSTA_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<InstaConfig>;
    return {
      ...base,
      ...parsed,
      posts: Array.isArray(parsed.posts) ? parsed.posts : base.posts,
    };
  } catch {
    return base;
  }
}

export function saveInstaConfig(config: InstaConfig): void {
  try {
    localStorage.setItem(INSTA_STORAGE_KEY, JSON.stringify(config));
  } catch { /* 용량 초과 등 — 무시 */ }
}

// 이미지 파일 → 다운스케일된 dataURL (localStorage 용량 절약). 최대 변 1080px, JPEG 0.82.
export function fileToScaledDataUrl(file: File, maxSide = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 좋아요/팔로워 등 큰 수 표기 (1.2k, 84.2k, 1.1m)
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  return String(n);
}
