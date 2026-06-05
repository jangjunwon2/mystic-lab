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

// 피드 전용 게시물 — '다른 계정'이 올린 것처럼 보이게 작성자(username/avatar)를 가진다.
// 본인 게시물(InstaPost)은 프로필 그리드+피드에, feedPosts는 피드에만 섞여 노출된다.
export interface InstaFeedPost {
  id: string;
  username: string;
  avatar: string; // 빈 값이면 이니셜 그라데이션 아바타
  verified: boolean;
  image: string;
  caption: LocalizedText;
  likes: number;
  date: LocalizedText;
  audio?: string;
  comments: InstaComment[];
}

// 사용자명 기반 결정적 그라데이션 — 빈 아바타를 계정별로 다른 색 원으로 표시(자산 없이 자연스럽게).
export function avatarGradient(seed: string): string {
  let h = 0;
  for (const ch of seed || "?") h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 62% 52%), hsl(${(h + 40) % 360} 62% 42%))`;
}

// 계산기 연동 예언값 — 계산기가 저장한 관객 피킹/포스값.
export interface CalcPrediction { num1: string; num2: string; result: string }
const CALC_PREDICTION_KEY = "ml_calc_instagram_prediction";

export function loadCalcPrediction(): CalcPrediction | null {
  try {
    const raw = localStorage.getItem(CALC_PREDICTION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return { num1: String(p?.num1 ?? ""), num2: String(p?.num2 ?? ""), result: String(p?.result ?? "") };
  } catch {
    return null;
  }
}

// 캡션의 토큰 치환 — {force}=관객 입력 숫자(num1, 없으면 result), {num1}/{num2}/{result} 개별.
// 예언 미설정 시 토큰을 제거한다.
export function applyPrediction(text: string, pred: CalcPrediction | null): string {
  if (!text.includes("{")) return text;
  const force = pred ? (pred.num1 || pred.result || "") : "";
  return text
    .replace(/\{force\}/g, force)
    .replace(/\{num1\}/g, pred?.num1 ?? "")
    .replace(/\{num2\}/g, pred?.num2 ?? "")
    .replace(/\{result\}/g, pred?.result ?? "");
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
  feedPosts: InstaFeedPost[];
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
        caption: {
          en: "I wrote a number in my dream journal weeks ago… {force} 🔮 destiny was already sealed.",
          ko: "몇 주 전 꿈 일기에 숫자 하나를 적어뒀어요… {force} 🔮 운명은 이미 정해져 있었죠.",
          ja: "数週間前、夢日記にある数字を書いた… {force} 🔮 運命はすでに決まっていた。",
          "zh-CN": "几周前我在梦境日记里写下一个数字… {force} 🔮 命运早已注定。",
          es: "Hace semanas escribí un número en mi diario de sueños… {force} 🔮 el destino ya estaba sellado.",
          fr: "J'ai noté un nombre dans mon journal de rêves il y a des semaines… {force} 🔮 le destin était déjà scellé.",
          de: "Vor Wochen schrieb ich eine Zahl in mein Traumtagebuch… {force} 🔮 das Schicksal war besiegelt.",
        },
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
    feedPosts: [
      {
        id: "f1", username: "cardistry.daily", avatar: "", verified: true, image: "/images/magic/instagram-post.png",
        caption: { en: "New flourish drop today 🃏 which deck should I cut next?", ko: "오늘 새 플러리시 공개 🃏 다음엔 어떤 덱으로 할까요?", ja: "新しいフラリッシュ公開 🃏 次はどのデック？" },
        likes: 8421, date: { en: "2 hours ago", ko: "2시간 전", ja: "2時間前", "zh-CN": "2小时前", es: "hace 2 horas", fr: "il y a 2 heures", de: "vor 2 Stunden" },
        audio: "Original audio",
        comments: [{ user: "deckcollector", text: { en: "The bicycle one!! 🔥", ko: "바이시클로!! 🔥" } }],
      },
      {
        id: "f2", username: "mentalism.lab", avatar: "", verified: false, image: "/images/magic/instagram-post.png",
        caption: { en: "Reading a room is 90% listening. 🧠", ko: "독심은 90%가 경청이에요. 🧠", ja: "読心の9割は傾聴。🧠" },
        likes: 3127, date: { en: "5 hours ago", ko: "5시간 전", ja: "5時間前", "zh-CN": "5小时前", es: "hace 5 horas", fr: "il y a 5 heures", de: "vor 5 Stunden" },
        comments: [],
      },
      {
        id: "f3", username: "the_prop_shop", avatar: "", verified: true, image: "/images/magic/instagram-post.png",
        caption: { en: "Restock alert — the gimmick coins are back in stock. Link in bio.", ko: "재입고 — 기믹 코인 다시 입고됐어요. 링크는 바이오에.", ja: "再入荷 — ギミックコイン入荷しました。リンクはプロフへ。" },
        likes: 1894, date: { en: "8 hours ago", ko: "8시간 전", ja: "8時間前", "zh-CN": "8小时前", es: "hace 8 horas", fr: "il y a 8 heures", de: "vor 8 Stunden" },
        comments: [{ user: "coinmagic_kr", text: { en: "Finally 🙌", ko: "드디어 🙌" } }],
      },
      {
        id: "f4", username: "sara.sleights", avatar: "", verified: false, image: "/images/magic/instagram-post.png",
        caption: { en: "Practicing this pass for 6 months straight. Worth it. ✨", ko: "이 패스 6개월째 연습 중. 할 만해요. ✨", ja: "このパスを半年練習中。やる価値あり。✨" },
        likes: 5230, date: { en: "1 day ago", ko: "1일 전", ja: "1日前", "zh-CN": "1天前", es: "hace 1 día", fr: "il y a 1 jour", de: "vor 1 Tag" },
        audio: "Original audio",
        comments: [],
      },
      {
        id: "f5", username: "close.up.collective", avatar: "", verified: false, image: "/images/magic/instagram-post.png",
        caption: { en: "Table-hopping tonight downtown. Come say hi 👋", ko: "오늘 밤 시내에서 테이블 마술해요. 들러서 인사해요 👋", ja: "今夜ダウンタウンでテーブルマジック。声かけてね 👋" },
        likes: 942, date: { en: "1 day ago", ko: "1일 전", ja: "1日前", "zh-CN": "1天前", es: "hace 1 día", fr: "il y a 1 jour", de: "vor 1 Tag" },
        comments: [],
      },
    ],
    stories: [
      { id: "s1", username: "alex_mental", avatar: "", image: "/images/magic/instagram-post.png" },
      { id: "s2", username: "sarah_mystique", avatar: "", image: "/images/magic/instagram-post.png" },
      { id: "s3", username: "cardistry.daily", avatar: "", image: "/images/magic/instagram-post.png" },
      { id: "s4", username: "the_prop_shop", avatar: "", image: "/images/magic/instagram-post.png" },
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
          { fromMe: false, text: "You have to teach me that one day 🙏" },
        ],
      },
      {
        id: "d2", username: "sarah_mystique", avatar: "", online: false,
        messages: [{ fromMe: false, text: "How did you know my number??" }],
      },
      {
        id: "d3", username: "cardistry.daily", avatar: "", online: true,
        messages: [
          { fromMe: false, text: "Loved your latest reel 🔥" },
          { fromMe: false, text: "Collab sometime?" },
        ],
      },
      {
        id: "d4", username: "the_prop_shop", avatar: "", online: false,
        messages: [{ fromMe: false, text: "Your order has shipped 📦 tracking inside" }],
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFeedPost(f: any): InstaFeedPost {
  return {
    id: String(f?.id ?? `f${Date.now()}`),
    username: String(f?.username ?? ""),
    avatar: typeof f?.avatar === "string" ? f.avatar : "",
    verified: !!f?.verified,
    image: typeof f?.image === "string" ? f.image : "",
    caption: toLocalized(f?.caption),
    likes: Number(f?.likes) || 0,
    date: toLocalized(f?.date),
    audio: typeof f?.audio === "string" && f.audio ? f.audio : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: Array.isArray(f?.comments) ? f.comments.map((c: any) => ({ user: String(c?.user ?? ""), text: toLocalized(c?.text) })) : [],
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
      feedPosts: Array.isArray(parsed.feedPosts) ? parsed.feedPosts.map(normalizeFeedPost) : base.feedPosts,
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
