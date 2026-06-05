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
  date: LocalizedText; // 상대 표기 (예: "3주 전" / "3 weeks ago")
  exactDate?: string; // ISO yyyy-mm-dd. 설정 시 상대 표기 대신 로케일 형식 실제 날짜로 표시
  audio?: string; // 게시물 음원 라인 (예: "Original audio") — 설정 시 사용자명 아래 ♪ 표시
  comments: InstaComment[];
}

// 게시물 날짜 표시: 정확한 게시일(exactDate)이 있으면 로케일 형식으로, 없으면 상대 텍스트(date).
export function formatPostDate(post: InstaPost, locale: string): string {
  if (post.exactDate) {
    const d = new Date(post.exactDate);
    if (!isNaN(d.getTime())) {
      const sameYear = d.getFullYear() === new Date().getFullYear();
      const opts: Intl.DateTimeFormatOptions = sameYear
        ? { month: "long", day: "numeric" }
        : { year: "numeric", month: "long", day: "numeric" };
      try {
        return d.toLocaleDateString(locale, opts);
      } catch {
        return d.toLocaleDateString("en", opts);
      }
    }
  }
  return pickText(post.date, locale);
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
  caption: LocalizedText; // 앱 설정 언어에 맞춰 표시 (게시물 캡션과 동일)
  likes: number;
  comments: number;
  username: string;
  music: string;
}

// 프로필 하이라이트 스토리 (프로필 상단 원형 커버 행)
export interface InstaHighlight {
  id: string;
  title: LocalizedText; // 짧은 라벨 (예: "Shows" / "공연")
  cover: string; // dataURL/URL (빈 값이면 기본)
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
  highlights: InstaHighlight[];
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
        audio: "Original audio",
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
    highlights: [
      { id: "h1", title: { en: "Shows", ko: "공연", ja: "ショー", "zh-CN": "演出", es: "Shows", fr: "Spectacles", de: "Shows" }, cover: "/images/magic/instagram-post.png" },
      { id: "h2", title: { en: "Magic", ko: "매직", ja: "マジック", "zh-CN": "魔术", es: "Magia", fr: "Magie", de: "Magie" }, cover: "/images/magic/instagram-post.png" },
      { id: "h3", title: { en: "BTS", ko: "비하인드", ja: "舞台裏", "zh-CN": "幕后", es: "Tras cámaras", fr: "Coulisses", de: "Backstage" }, cover: "/images/magic/instagram-post.png" },
    ],
    reels: [
      {
        id: "r1", image: "/images/magic/instagram-post.png", username: "mystic_lab_magic",
        caption: { en: "The prediction always comes true. 🔮", ko: "예언은 언제나 이루어집니다. 🔮", ja: "予言は必ず的中する。🔮", "zh-CN": "预言总会成真。🔮", es: "La predicción siempre se cumple. 🔮", fr: "La prédiction se réalise toujours. 🔮", de: "Die Vorhersage trifft immer ein. 🔮" },
        likes: 24800, comments: 312, music: "Original audio · Mystic Lab",
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
    exactDate: typeof p?.exactDate === "string" ? p.exactDate : undefined,
    audio: typeof p?.audio === "string" && p.audio ? p.audio : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: Array.isArray(p?.comments) ? p.comments.map((c: any) => ({ user: String(c?.user ?? ""), text: toLocalized(c?.text) })) : [],
  };
}

// 레거시(단일 문자열 caption) 릴스도 언어 맵으로 정규화.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeReel(r: any): InstaReel {
  return {
    id: String(r?.id ?? `r${Date.now()}`),
    image: typeof r?.image === "string" ? r.image : "",
    caption: toLocalized(r?.caption),
    likes: Number(r?.likes) || 0,
    comments: Number(r?.comments) || 0,
    username: String(r?.username ?? ""),
    music: String(r?.music ?? ""),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeHighlight(h: any): InstaHighlight {
  return {
    id: String(h?.id ?? `h${Date.now()}`),
    title: toLocalized(h?.title),
    cover: typeof h?.cover === "string" ? h.cover : "",
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
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(normalizeHighlight) : base.highlights,
      reels: Array.isArray(parsed.reels) ? parsed.reels.map(normalizeReel) : base.reels,
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
