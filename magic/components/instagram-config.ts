// 가짜 인스타그램 앱(독립 PWA) 설정 모델 — 기기 내 비밀 설정(localStorage)에 저장.
// 마술사가 프로필·게시물을 직접 커스텀(사진 업로드·캡션·좋아요·날짜·댓글)한다.

export type InstaLocale = "ko" | "en" | "ja" | "zh-CN" | "es" | "fr" | "de";

// 언어별 텍스트 맵 — 게시물 내용을 앱 설정 언어에 맞춰 표시한다.
export type LocalizedText = Partial<Record<InstaLocale, string>>;

// 설정 언어에 해당하는 텍스트를 고른다. 없으면 en → 첫 사용가능 값 순으로 폴백.
// 레거시(단일 문자열)도 그대로 허용한다.
export function pickText(v: LocalizedText | string | undefined, locale: string): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v[locale as InstaLocale] ?? v.en ?? Object.values(v).find((x) => !!x) ?? "";
}

export interface InstaComment {
  user: string;
  text: LocalizedText;
}

export interface InstaPost {
  id: string;
  image: string; // dataURL 또는 외부 URL
  caption: LocalizedText;
  likes: number;
  date: LocalizedText; // 표시용 (예: "3주 전" / "3 weeks ago")
  comments: InstaComment[];
}

// 스토리 (피드 상단 링 → 풀스크린 뷰어)
export interface InstaStory {
  id: string;
  username: string;
  avatar: string; // dataURL/URL (빈 값이면 기본)
  image: string;
}

// 릴스 (세로 풀스크린)
export interface InstaReel {
  id: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  username: string;
  music: string;
}

// DM 메시지/스레드
export interface InstaDMMessage {
  fromMe: boolean;
  text: string;
}
export interface InstaThread {
  id: string;
  username: string;
  avatar: string;
  online: boolean;
  messages: InstaDMMessage[];
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
  appLocale: InstaLocale;
  posts: InstaPost[];
  stories: InstaStory[];
  reels: InstaReel[];
  dms: InstaThread[];
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
        caption: {
          en: "Three weeks ago I saw three numbers in a dream… destiny is already written. 🔮✨",
          ko: "3주 전 꿈에서 세 개의 숫자를 봤어요… 운명은 이미 적혀 있죠. 🔮✨",
          ja: "3週間前、夢で3つの数字を見た…運命はすでに記されている。🔮✨",
        },
        likes: 1248,
        date: { en: "3 weeks ago", ko: "3주 전", ja: "3週間前", "zh-CN": "3周前", es: "hace 3 semanas", fr: "il y a 3 semaines", de: "vor 3 Wochen" },
        comments: [
          { user: "alex_mental", text: { en: "No way... how is this possible? 🤯", ko: "말도 안 돼... 이게 어떻게 가능하죠? 🤯" } },
          { user: "sarah_mystique", text: { en: "Absolutely jaw-dropping. 😱", ko: "진짜 입이 떡 벌어지네요. 😱" } },
        ],
      },
      {
        id: "p2",
        image: "/images/magic/instagram-post.png",
        caption: { en: "Backstage before tonight's show. The cards never lie. 🃏", ko: "오늘 공연 전 백스테이지. 카드는 거짓말하지 않죠. 🃏" },
        likes: 982,
        date: { en: "1 week ago", ko: "1주 전", ja: "1週間前" },
        comments: [{ user: "the_magic_daniel", text: { en: "Pure art. 👏", ko: "예술이네요. 👏" } }],
      },
      {
        id: "p3",
        image: "/images/magic/instagram-post.png",
        caption: { en: "A close-up session that left everyone speechless.", ko: "모두를 말문 막히게 한 클로즈업 세션." },
        likes: 1567,
        date: { en: "2 weeks ago", ko: "2주 전", ja: "2週間前" },
        comments: [],
      },
      {
        id: "p4",
        image: "/images/magic/instagram-post.png",
        caption: { en: "Mind reading is just paying attention. 🧠", ko: "독심술은 그저 집중일 뿐이에요. 🧠" },
        likes: 743,
        date: { en: "3 weeks ago", ko: "3주 전", ja: "3週間前" },
        comments: [{ user: "emma_cards", text: { en: "How?! 😮", ko: "어떻게요?! 😮" } }],
      },
      {
        id: "p5",
        image: "/images/magic/instagram-post.png",
        caption: { en: "New routine in the works. Stay tuned. ✨", ko: "새 루틴 준비 중. 기대해 주세요. ✨" },
        likes: 2104,
        date: { en: "1 month ago", ko: "1개월 전", ja: "1か月前" },
        comments: [],
      },
      {
        id: "p6",
        image: "/images/magic/instagram-post.png",
        caption: { en: "The prediction was sealed before you arrived.", ko: "예언은 당신이 도착하기 전에 봉인되어 있었죠." },
        likes: 1320,
        date: { en: "1 month ago", ko: "1개월 전", ja: "1か月前" },
        comments: [{ user: "leo_mentalism", text: { en: "Unreal. 🔥", ko: "비현실적이에요. 🔥" } }],
      },
      {
        id: "p7",
        image: "/images/magic/instagram-post.png",
        caption: { en: "Practice. Practice. Practice. 🎩", ko: "연습. 또 연습. 🎩" },
        likes: 658,
        date: { en: "2 months ago", ko: "2개월 전", ja: "2か月前" },
        comments: [],
      },
      {
        id: "p8",
        image: "/images/magic/instagram-post.png",
        caption: { en: "Some secrets are meant to be felt, not explained.", ko: "어떤 비밀은 설명이 아니라 느끼는 거예요." },
        likes: 1789,
        date: { en: "2 months ago", ko: "2개월 전", ja: "2か月前" },
        comments: [{ user: "sarah_mystique", text: { en: "Goosebumps. 😱", ko: "소름이에요. 😱" } }],
      },
      {
        id: "p9",
        image: "/images/magic/instagram-post.png",
        caption: { en: "Thank you for an unforgettable night. 🌙", ko: "잊지 못할 밤이었어요. 감사합니다. 🌙" },
        likes: 2456,
        date: { en: "3 months ago", ko: "3개월 전", ja: "3か月前" },
        comments: [],
      },
    ],
    stories: [
      { id: "s1", username: "alex_mental", avatar: "", image: "/images/magic/instagram-post.png" },
      { id: "s2", username: "sarah_mystique", avatar: "", image: "/images/magic/instagram-post.png" },
    ],
    reels: [
      {
        id: "r1", image: "/images/magic/instagram-post.png", username: "mystic_lab_magic",
        caption: "The prediction always comes true. 🔮", likes: 24800, comments: 312, music: "Original audio · Mystic Lab",
      },
    ],
    dms: [
      {
        id: "d1", username: "alex_mental", avatar: "", online: true,
        messages: [
          { fromMe: false, text: "That last trick was unreal 🤯" },
          { fromMe: true, text: "Magic never lies 😉" },
        ],
      },
      {
        id: "d2", username: "sarah_mystique", avatar: "", online: false,
        messages: [{ fromMe: false, text: "How did you know my number??" }],
      },
    ],
  };
}

// 레거시(단일 문자열) caption/date/comment.text → 언어 맵으로 정규화. 이미 맵이면 그대로.
function toLocalized(v: unknown): LocalizedText {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as LocalizedText;
  if (typeof v === "string") return { en: v };
  return {};
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePost(p: any): InstaPost {
  return {
    id: String(p?.id ?? `p${Date.now()}`),
    image: typeof p?.image === "string" ? p.image : "",
    likes: Number(p?.likes) || 0,
    caption: toLocalized(p?.caption),
    date: toLocalized(p?.date),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: Array.isArray(p?.comments) ? p.comments.map((c: any) => ({ user: String(c?.user ?? ""), text: toLocalized(c?.text) })) : [],
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
      posts: Array.isArray(parsed.posts) ? parsed.posts.map(normalizePost) : base.posts,
      stories: Array.isArray(parsed.stories) ? parsed.stories : base.stories,
      reels: Array.isArray(parsed.reels) ? parsed.reels : base.reels,
      dms: Array.isArray(parsed.dms) ? parsed.dms : base.dms,
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
