"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Home, Search, Film, Settings, X, Plus, Trash2, Upload, ChevronLeft, BadgeCheck, Grid3x3, Music, MoreHorizontal, Phone, Video, Camera, Menu, ChevronDown, AtSign, UserPlus, Repeat, User } from "lucide-react";
import {
  type InstaConfig, type InstaPost, type InstaStory, type InstaReel, type InstaThread, type InstaDMMessage, type LocalizedText,
  loadInstaConfig, saveInstaConfig, fileToScaledDataUrl, formatCount, defaultInstaConfig, pickText, formatPostDate,
} from "./instagram-config";

interface Props {
  locale: string;
}

interface UiStrings {
  posts: string; followers: string; following: string; viewAll: (n: number) => string; edit: string; follow: string; message: string;
  yourStory: string; reels: string; messages: string; active: string; messagePlaceholder: string; share: string; addBanner: string;
}

const UI: Record<string, UiStrings> = {
  ko: { posts: "게시물", followers: "팔로워", following: "팔로잉", viewAll: (n) => `댓글 ${n}개 모두 보기`, edit: "프로필 편집", follow: "팔로우", message: "메시지", yourStory: "내 스토리", reels: "릴스", messages: "메시지", active: "활동 중", messagePlaceholder: "메시지 보내기...", share: "프로필 공유", addBanner: "배너 추가" },
  en: { posts: "posts", followers: "followers", following: "following", viewAll: (n) => `View all ${n} comments`, edit: "Edit profile", follow: "Follow", message: "Message", yourStory: "Your story", reels: "Reels", messages: "Messages", active: "Active now", messagePlaceholder: "Message...", share: "Share profile", addBanner: "Add banner" },
  ja: { posts: "投稿", followers: "フォロワー", following: "フォロー中", viewAll: (n) => `コメント${n}件をすべて見る`, edit: "プロフィールを編集", follow: "フォロー", message: "メッセージ", yourStory: "あなたのストーリー", reels: "リール", messages: "メッセージ", active: "アクティブ", messagePlaceholder: "メッセージ...", share: "プロフィールをシェア", addBanner: "バナーを追加" },
  "zh-CN": { posts: "帖子", followers: "粉丝", following: "关注", viewAll: (n) => `查看全部 ${n} 条评论`, edit: "编辑主页", follow: "关注", message: "私信", yourStory: "你的快拍", reels: "Reels", messages: "私信", active: "在线", messagePlaceholder: "发消息...", share: "分享主页", addBanner: "添加横幅" },
  es: { posts: "publicaciones", followers: "seguidores", following: "seguidos", viewAll: (n) => `Ver los ${n} comentarios`, edit: "Editar perfil", follow: "Seguir", message: "Mensaje", yourStory: "Tu historia", reels: "Reels", messages: "Mensajes", active: "Activo(a) ahora", messagePlaceholder: "Mensaje...", share: "Compartir perfil", addBanner: "Añadir banner" },
  fr: { posts: "publications", followers: "abonnés", following: "abonnements", viewAll: (n) => `Voir les ${n} commentaires`, edit: "Modifier le profil", follow: "Suivre", message: "Message", yourStory: "Votre story", reels: "Reels", messages: "Messages", active: "Actif", messagePlaceholder: "Message...", share: "Partager le profil", addBanner: "Ajouter une bannière" },
  de: { posts: "Beiträge", followers: "Follower", following: "Gefolgt", viewAll: (n) => `Alle ${n} Kommentare ansehen`, edit: "Profil bearbeiten", follow: "Folgen", message: "Nachricht", yourStory: "Deine Story", reels: "Reels", messages: "Nachrichten", active: "Aktiv", messagePlaceholder: "Nachricht...", share: "Profil teilen", addBanner: "Banner hinzufügen" },
};

const AVATAR_FALLBACK = "/images/magic/instagram-post.png";

export default function FakeInstagramApp({ locale }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<InstaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"feed" | "profile" | "reels" | "dm">("feed");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [storyStart, setStoryStart] = useState<number | null>(null);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setConfig(loadInstaConfig(locale));
    const timer = setTimeout(() => setLoading(false), 1300);
    return () => clearTimeout(timer);
  }, [locale]);

  // 기기/브라우저 뒤로가기 → 앱 내부 화면을 한 단계씩 복귀(설치형 PWA에서 뒤로가기가 앱을 나가버리던 문제 해결).
  const navRef = useRef({ settingsOpen, storyStart, openPostId, openThreadId, view });
  useEffect(() => {
    navRef.current = { settingsOpen, storyStart, openPostId, openThreadId, view };
  }, [settingsOpen, storyStart, openPostId, openThreadId, view]);
  const goBack = useCallback(() => {
    const s = navRef.current;
    if (s.settingsOpen) { setSettingsOpen(false); return; }
    if (s.storyStart !== null) { setStoryStart(null); return; }
    if (s.openPostId) { setOpenPostId(null); return; }
    if (s.view === "dm") {
      if (s.openThreadId) { setOpenThreadId(null); return; }
      setView("feed"); return;
    }
    if (s.view === "reels" || s.view === "profile") { setView("feed"); return; }
    // 피드 루트 — 더 돌아갈 곳 없음(네이티브 앱처럼 뒤로가기로 앱이 닫히지 않게 유지)
  }, []);
  useEffect(() => {
    window.history.pushState({ insta: true }, "");
    const onPop = () => {
      goBack();
      window.history.pushState({ insta: true }, ""); // 다음 뒤로가기도 가로채도록 재무장
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goBack]);

  if (!config) return <div className="w-full h-screen bg-black" />;

  const ui = UI[config.appLocale] ?? UI.en;
  const update = (patch: Partial<InstaConfig>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveInstaConfig(next);
      return next;
    });
  };

  const toggleLike = (post: InstaPost) => {
    setLikes((p) => ({ ...p, [post.id]: !p[post.id] }));
    if (navigator.vibrate) navigator.vibrate(35);
  };
  const likeCount = (post: InstaPost) => post.likes + (likes[post.id] ? 1 : 0);

  return (
    <div
      className="fixed inset-0 w-full bg-black text-white select-none overflow-hidden flex flex-col font-sans"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 좌상단 비밀 설정 진입 (3초 홀드) */}
      <div
        className="absolute top-0 left-0 w-[22vw] h-[10vh] z-[60]"
        onTouchStart={() => { holdRef.current = setTimeout(() => setSettingsOpen(true), 3000); }}
        onTouchEnd={() => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } }}
        onMouseDown={() => { holdRef.current = setTimeout(() => setSettingsOpen(true), 3000); }}
        onMouseUp={() => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } }}
      />

      {/* 로딩 스플래시 */}
      <AnimatePresence>
        {loading && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black z-[9999] flex flex-col justify-between items-center py-16">
            <div />
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[22px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]" style={{ transform: "scale(1.05)" }} />
              <div className="absolute inset-[4px] rounded-[18px] bg-black" />
              <div className="absolute w-10 h-10 rounded-full border-[5px] border-white" />
              <div className="absolute top-[22px] right-[22px] w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 tracking-wider">from</span>
              <span className="text-sm font-bold text-white tracking-widest">Meta</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 본문 */}
      {openPostId ? (
        <PostDetail
          post={config.posts.find((p) => p.id === openPostId)!}
          config={config} ui={ui} liked={!!likes[openPostId]} likeCount={likeCount}
          onBack={() => setOpenPostId(null)} onLike={toggleLike}
        />
      ) : view === "reels" ? (
        <ReelsView config={config} ui={ui} />
      ) : view === "dm" ? (
        openThreadId ? (
          <DMThreadView
            thread={config.dms.find((d) => d.id === openThreadId)!}
            config={config} ui={ui} onBack={() => setOpenThreadId(null)}
          />
        ) : (
          <DMListView config={config} ui={ui} onBack={() => setView("feed")} onOpenThread={(id) => setOpenThreadId(id)} />
        )
      ) : view === "feed" ? (
        <FeedView
          config={config} ui={ui} likes={likes} likeCount={likeCount} onLike={toggleLike}
          onOpenStory={(i) => setStoryStart(i)} onOpenDM={() => setView("dm")}
        />
      ) : (
        <ProfileView config={config} ui={ui} onOpenSettings={() => setSettingsOpen(true)} onOpenPost={(id) => setOpenPostId(id)} />
      )}

      {/* 하단 탭 바 — 게시물 상세·DM·스토리 뷰어에서는 숨김 */}
      {!openPostId && view !== "dm" && storyStart === null && (
        <div className="h-[49px] border-t border-[#262626] bg-black flex items-center justify-around px-2 shrink-0">
          <button onClick={() => setView("feed")} className="text-white">
            <Home className="w-6 h-6" fill={view === "feed" ? "currentColor" : "none"} strokeWidth={view === "feed" ? 0 : 2} />
          </button>
          <button onClick={() => setView("reels")} className="text-white">
            <Film className="w-6 h-6" fill={view === "reels" ? "currentColor" : "none"} strokeWidth={view === "reels" ? 0 : 2} />
          </button>
          <button onClick={() => setView("dm")} className="relative text-white active:opacity-60">
            <Send className="w-6 h-6" strokeWidth={2} />
            {config.dms.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF3040] text-[9px] font-bold flex items-center justify-center">{config.dms.length}</span>
            )}
          </button>
          <button className="text-white"><Search className="w-6 h-6" strokeWidth={2} /></button>
          <button onClick={() => setView("profile")} className="w-7 h-7 rounded-full overflow-hidden" style={{ border: view === "profile" ? "1.5px solid #fff" : "1px solid #555" }}>
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
          </button>
        </div>
      )}

      {/* 스토리 뷰어 (풀스크린 오버레이) */}
      <AnimatePresence>
        {storyStart !== null && (
          <StoryViewer config={config} ui={ui} startIndex={storyStart} onClose={() => setStoryStart(null)} />
        )}
      </AnimatePresence>

      {/* 비밀 설정 패널 */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel config={config} locale={locale} onUpdate={update} onClose={() => setSettingsOpen(false)} onExit={() => router.push(`/${locale}/calc`)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 피드 ───
function FeedView({ config, ui, likes, likeCount, onLike, onOpenStory, onOpenDM }: {
  config: InstaConfig; ui: UiStrings; likes: Record<string, boolean>; likeCount: (p: InstaPost) => number; onLike: (p: InstaPost) => void;
  onOpenStory: (i: number) => void; onOpenDM: () => void;
}) {
  return (
    <>
      <div className="relative h-12 border-b border-[#262626] bg-black flex items-center justify-between px-4 shrink-0">
        <Plus className="w-7 h-7 text-white" strokeWidth={2.2} />
        <span className="absolute left-1/2 -translate-x-1/2 text-[26px] leading-none text-white" style={{ fontFamily: "'Brush Script MT', 'Snell Roundhand', cursive" }}>Instagram</span>
        <div className="flex items-center gap-5">
          <Heart className="w-6 h-6 text-white" strokeWidth={2} />
          <button onClick={onOpenDM} className="relative active:opacity-60">
            <Send className="w-6 h-6 text-white" strokeWidth={2} />
            {config.dms.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3040] text-[9px] font-bold flex items-center justify-center">{config.dms.length}</span>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
        <StoriesRing config={config} ui={ui} onOpenStory={onOpenStory} />
        {config.posts.map((post) => (
          <PostCard key={post.id} post={post} config={config} ui={ui} liked={!!likes[post.id]} likeCount={likeCount} onLike={onLike} />
        ))}
        {config.posts.length === 0 && (
          <div className="py-24 text-center text-gray-500 text-sm">게시물이 없습니다 (좌상단 3초 홀드 → 설정)</div>
        )}
      </div>
    </>
  );
}

// ─── 스토리 링 (피드 상단) ───
function StoriesRing({ config, ui, onOpenStory }: { config: InstaConfig; ui: UiStrings; onOpenStory: (i: number) => void }) {
  // index 0 = 내 스토리(본인), 1.. = config.stories
  return (
    <div className="flex gap-3.5 px-3.5 py-3 overflow-x-auto border-b border-[#262626] no-scrollbar">
      <button onClick={() => onOpenStory(0)} className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
        <div className="relative w-16 h-16 rounded-full bg-cover bg-center border border-[#333]" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }}>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095F6] border-2 border-black flex items-center justify-center"><Plus className="w-3 h-3 text-white" strokeWidth={3} /></span>
        </div>
        <span className="text-[11px] text-gray-200 truncate w-full text-center">{ui.yourStory}</span>
      </button>
      {config.stories.map((s, i) => (
        <button key={s.id} onClick={() => onOpenStory(i + 1)} className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]">
            <div className="w-full h-full rounded-full bg-black p-[2px]">
              <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${s.avatar || s.image || AVATAR_FALLBACK}')` }} />
            </div>
          </div>
          <span className="text-[11px] text-gray-200 truncate w-full text-center">{s.username}</span>
        </button>
      ))}
    </div>
  );
}

// ─── 게시물 카드 ───
function PostCard({ post, config, ui, liked, likeCount, onLike }: {
  post: InstaPost; config: InstaConfig; ui: typeof UI["en"]; liked: boolean; likeCount: (p: InstaPost) => number; onLike: (p: InstaPost) => void;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]">
            <div className="w-full h-full rounded-full bg-black p-[1px]">
              <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-semibold text-white">{config.username}</span>
            {config.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
          </div>
        </div>
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 9.75A1.25 1.25 0 1012 12a1.25 1.25 0 000-2.25zm-5.5 0a1.25 1.25 0 100 2.25 1.25 1.25 0 000-2.25zm11 0a1.25 1.25 0 100 2.25 1.25 1.25 0 000-2.25z" /></svg>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image || AVATAR_FALLBACK} alt="" className="w-full aspect-square object-cover bg-[#121212]" />
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post)} className="active:scale-125 transition-transform">
            <Heart className="w-6.5 h-6.5" style={{ width: 26, height: 26 }} fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "#fff"} strokeWidth={2} />
          </button>
          <MessageCircle style={{ width: 26, height: 26 }} className="text-white" strokeWidth={2} />
          <Send style={{ width: 26, height: 26 }} className="text-white" strokeWidth={2} />
        </div>
        <Bookmark style={{ width: 26, height: 26 }} className="text-white" strokeWidth={2} />
      </div>
      <div className="px-3 pb-1 text-sm text-white"><strong>{config.username}</strong> 외 <strong>{formatCount(likeCount(post))}</strong>명이 좋아합니다</div>
      <div className="px-3 pb-1 text-[13.5px] leading-relaxed text-gray-100">
        <strong className="text-white mr-1.5">{config.username}</strong>
        <span className="whitespace-pre-line select-text">{pickText(post.caption, config.appLocale)}</span>
      </div>
      {post.comments.length > 0 && (
        <div className="px-3 pb-1 text-xs text-gray-400">{ui.viewAll(post.comments.length + 40)}</div>
      )}
      <div className="px-3 space-y-0.5 text-[13px] text-gray-100">
        {post.comments.slice(0, 2).map((c, i) => (
          <div key={i}><strong className="text-white mr-1.5">{c.user}</strong><span className="select-text">{pickText(c.text, config.appLocale)}</span></div>
        ))}
      </div>
      <div className="px-3 pt-1 text-[10px] text-gray-500 uppercase tracking-wide">{formatPostDate(post, config.appLocale)}</div>
    </div>
  );
}

// ─── 게시물 상세 (단일) ───
function PostDetail({ post, config, ui, liked, likeCount, onBack, onLike }: {
  post: InstaPost; config: InstaConfig; ui: typeof UI["en"]; liked: boolean; likeCount: (p: InstaPost) => number; onBack: () => void; onLike: (p: InstaPost) => void;
}) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center px-2 shrink-0">
        <button onClick={onBack} className="text-white active:opacity-60 p-1"><ChevronLeft className="w-6 h-6" /></button>
        <span className="font-semibold text-base ml-1">{ui.posts}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <PostCard post={post} config={config} ui={ui} liked={liked} likeCount={likeCount} onLike={onLike} />
      </div>
    </>
  );
}

// ─── 프로필 ───
function ProfileView({ config, ui, onOpenSettings, onOpenPost }: { config: InstaConfig; ui: typeof UI["en"]; onOpenSettings: () => void; onOpenPost: (id: string) => void }) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base">{config.username}</span>
          {config.verified && <BadgeCheck className="w-4 h-4 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
          <ChevronDown className="w-4 h-4 text-white ml-0.5" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <AtSign className="w-6 h-6 text-white" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF3040]" />
          </div>
          {/* 햄버거(≡) → 비밀 설정 */}
          <button onClick={onOpenSettings} className="active:opacity-60"><Menu className="w-6 h-6 text-white" strokeWidth={2} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-6">
            <div className="w-[88px] h-[88px] rounded-full p-[2px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584] shrink-0">
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
              </div>
            </div>
            <div className="flex-1 flex justify-around text-center">
              {[[config.postsCount, ui.posts], [config.followers, ui.followers], [config.following, ui.following]].map(([n, label], i) => (
                <div key={i}>
                  <div className="text-base font-semibold text-white">{formatCount(n as number)}</div>
                  <div className="text-xs text-gray-300">{label as string}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white">{config.displayName}</span>
              {config.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
            </div>
            <p className="text-[13px] text-gray-100 whitespace-pre-line leading-snug mt-0.5">{config.bio}</p>
          </div>
          <div className="flex gap-1.5 mt-3">
            <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] text-white">{ui.edit}</button>
            <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] text-white">{ui.share}</button>
            <button className="px-2.5 py-1.5 rounded-lg bg-[#262626] text-white flex items-center justify-center"><UserPlus className="w-4 h-4" /></button>
          </div>
          {/* 배너 추가 */}
          <button className="flex items-center gap-1.5 mt-3 text-[13px] text-[#8E8E8E]"><Plus className="w-4 h-4" /> {ui.addBanner}</button>
        </div>

        {/* 탭 바: 그리드(활성) · 릴스 · 리믹스 · 태그됨 */}
        <div className="flex items-center border-t border-[#262626] mt-4">
          <div className="flex-1 py-2.5 flex justify-center text-white border-t border-white -mt-px"><Grid3x3 className="w-6 h-6" /></div>
          <div className="flex-1 py-2.5 flex justify-center text-[#8E8E8E]"><Film className="w-6 h-6" /></div>
          <div className="flex-1 py-2.5 flex justify-center text-[#8E8E8E]"><Repeat className="w-6 h-6" /></div>
          <div className="flex-1 py-2.5 flex justify-center text-[#8E8E8E]"><User className="w-6 h-6" /></div>
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {config.posts.map((p) => (
            <button key={p.id} onClick={() => onOpenPost(p.id)} className="aspect-square bg-[#121212] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image || AVATAR_FALLBACK} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── 스토리 뷰어 (풀스크린) ───
function StoryViewer({ config, ui, startIndex, onClose }: {
  config: InstaConfig; ui: UiStrings; startIndex: number; onClose: () => void;
}) {
  const stories = useMemo<InstaStory[]>(() => [
    { id: "me", username: config.username, avatar: config.avatar, image: config.posts[0]?.image || config.avatar || AVATAR_FALLBACK },
    ...config.stories,
  ], [config]);
  const [idx, setIdx] = useState(Math.min(Math.max(0, startIndex), stories.length - 1));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const DURATION = 5000;
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / DURATION);
      setProgress(p);
      if (p >= 1) {
        clearInterval(timer);
        if (idx < stories.length - 1) setIdx(idx + 1);
        else onClose();
      }
    }, 50);
    return () => clearInterval(timer);
  }, [idx, stories.length, onClose]);

  const cur = stories[idx];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] bg-black flex flex-col">
      {/* 진행 바 */}
      <div className="flex gap-1 px-2 pt-2">
        {stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full bg-white" style={{ width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }} />
          </div>
        ))}
      </div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${cur.avatar || cur.image || AVATAR_FALLBACK}')` }} />
        <span className="text-sm font-semibold text-white">{idx === 0 ? ui.yourStory : cur.username}</span>
        <button onClick={onClose} className="ml-auto p-1 active:opacity-60"><X className="w-6 h-6 text-white" /></button>
      </div>
      {/* 이미지 + 탭 영역 */}
      <div className="flex-1 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.image || AVATAR_FALLBACK} alt="" className="absolute inset-0 w-full h-full object-contain" />
        <button aria-label="prev" className="absolute left-0 top-0 w-1/3 h-full" onClick={() => (idx > 0 ? setIdx(idx - 1) : onClose())} />
        <button aria-label="next" className="absolute right-0 top-0 w-2/3 h-full" onClick={() => (idx < stories.length - 1 ? setIdx(idx + 1) : onClose())} />
      </div>
      {/* 답장 바 */}
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="flex-1 rounded-full border border-white/40 px-4 py-2.5 text-sm text-white/60">{ui.messagePlaceholder}</div>
        <Heart className="w-6 h-6 text-white" />
        <Send className="w-6 h-6 text-white" />
      </div>
    </motion.div>
  );
}

// ─── 릴스 ───
function ReelsView({ config, ui }: { config: InstaConfig; ui: UiStrings }) {
  return (
    <div className="flex-1 relative bg-black overflow-y-auto snap-y snap-mandatory no-scrollbar">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
        <span className="text-lg font-semibold text-white drop-shadow">{ui.reels}</span>
        <Camera className="w-6 h-6 text-white drop-shadow" />
      </div>
      {config.reels.map((r) => <ReelItem key={r.id} reel={r} config={config} ui={ui} />)}
      {config.reels.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">릴스가 없습니다 (좌상단 3초 홀드 → 설정)</div>
      )}
    </div>
  );
}

function ReelItem({ reel, config, ui }: { reel: InstaReel; config: InstaConfig; ui: UiStrings }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="relative h-full w-full snap-start shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reel.image || AVATAR_FALLBACK} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
      {/* 우측 액션 레일 */}
      <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-5 z-10">
        <button onClick={() => setLiked((v) => !v)} className="flex flex-col items-center gap-1 active:scale-110 transition-transform">
          <Heart className="w-7 h-7" fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "#fff"} strokeWidth={2} />
          <span className="text-[11px] text-white">{formatCount(reel.likes + (liked ? 1 : 0))}</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" strokeWidth={2} />
          <span className="text-[11px] text-white">{formatCount(reel.comments)}</span>
        </div>
        <Send className="w-7 h-7 text-white" strokeWidth={2} />
        <MoreHorizontal className="w-6 h-6 text-white" />
        <div className="w-7 h-7 rounded-md bg-cover bg-center border-2 border-white animate-spin [animation-duration:3s]" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
      </div>
      {/* 하단 정보 */}
      <div className="absolute left-3 right-16 bottom-20 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-cover bg-center border border-white" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
          <span className="text-sm font-semibold text-white">{reel.username}</span>
          {config.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
          <span className="ml-1 text-xs border border-white/60 rounded px-2 py-0.5 text-white">{ui.follow}</span>
        </div>
        <p className="text-[13px] text-white whitespace-pre-line line-clamp-2 mb-1.5">{reel.caption}</p>
        <div className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-white shrink-0" /><span className="text-xs text-white truncate">{reel.music}</span></div>
      </div>
    </div>
  );
}

// ─── DM 목록 ───
function DMListView({ config, ui, onBack, onOpenThread }: {
  config: InstaConfig; ui: UiStrings; onBack: () => void; onOpenThread: (id: string) => void;
}) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center gap-3 px-3 shrink-0">
        <button onClick={onBack} className="active:opacity-60"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <span className="font-semibold text-base text-white flex items-center gap-1">
          {config.username}
          {config.verified && <BadgeCheck className="w-4 h-4 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
        </span>
        <Plus className="w-6 h-6 text-white ml-auto" />
      </div>
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">{ui.messages}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {config.dms.map((d) => {
          const last = d.messages[d.messages.length - 1];
          return (
            <button key={d.id} onClick={() => onOpenThread(d.id)} className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-[#1A1A1A]">
              <div className="relative w-14 h-14 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${d.avatar || AVATAR_FALLBACK}')` }}>
                {d.online && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#2ECC71] border-2 border-black" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-white truncate">{d.username}</p>
                <p className="text-xs text-gray-400 truncate">{last ? `${last.fromMe ? "You: " : ""}${last.text}` : ""}</p>
              </div>
              <Camera className="w-6 h-6 text-gray-400 shrink-0" />
            </button>
          );
        })}
        {config.dms.length === 0 && (
          <div className="py-24 text-center text-gray-500 text-sm">메시지가 없습니다 (좌상단 3초 홀드 → 설정)</div>
        )}
      </div>
    </>
  );
}

// ─── DM 대화 ───
function DMThreadView({ thread, ui, onBack }: {
  thread: InstaThread; config: InstaConfig; ui: UiStrings; onBack: () => void;
}) {
  const [messages, setMessages] = useState<InstaDMMessage[]>(thread.messages);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { fromMe: true, text }]);
    setDraft("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <>
      <div className="h-14 border-b border-[#262626] bg-black flex items-center gap-3 px-3 shrink-0">
        <button onClick={onBack} className="active:opacity-60"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <div className="w-8 h-8 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${thread.avatar || AVATAR_FALLBACK}')` }} />
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-white truncate">{thread.username}</p>
          {thread.online && <p className="text-[11px] text-gray-400">{ui.active}</p>}
        </div>
        <div className="ml-auto flex items-center gap-4"><Phone className="w-6 h-6 text-white" /><Video className="w-6 h-6 text-white" /></div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[72%] px-3.5 py-2 rounded-3xl text-sm leading-snug ${m.fromMe ? "self-end bg-[#3797F0] text-white" : "self-start bg-[#262626] text-white"}`}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="px-3 py-2.5 border-t border-[#262626] bg-black flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center rounded-full border border-[#333] px-4 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={ui.messagePlaceholder}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>
        {draft.trim() ? (
          <button onClick={send} className="text-[#3797F0] text-sm font-semibold px-1 shrink-0">{ui.message}</button>
        ) : (
          <Heart className="w-6 h-6 text-white shrink-0" />
        )}
      </div>
    </>
  );
}

// ─── 비밀 설정 패널 ───
function SettingsPanel({ config, locale, onUpdate, onClose, onExit }: {
  config: InstaConfig; locale: string; onUpdate: (patch: Partial<InstaConfig>) => void; onClose: () => void; onExit: () => void;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const postFileRef = useRef<HTMLInputElement>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const reelFileRef = useRef<HTMLInputElement>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);

  const inputCls = "w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]";
  const labelCls = "text-xs text-[#9CA3AF] block mb-1";

  const setPosts = (posts: InstaPost[]) => onUpdate({ posts });
  const updatePost = (id: string, patch: Partial<InstaPost>) =>
    setPosts(config.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  // 게시물 텍스트는 현재 설정 언어(appLocale) 슬롯에 입력/표시한다.
  const loc = config.appLocale;
  const setLoc = (m: LocalizedText | undefined, val: string): LocalizedText => ({ ...(m ?? {}), [loc]: val });

  const setStories = (stories: InstaStory[]) => onUpdate({ stories });
  const updateStory = (id: string, patch: Partial<InstaStory>) =>
    setStories(config.stories.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const setReels = (reels: InstaReel[]) => onUpdate({ reels });
  const updateReel = (id: string, patch: Partial<InstaReel>) =>
    setReels(config.reels.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setDms = (dms: InstaThread[]) => onUpdate({ dms });
  const updateThread = (id: string, patch: Partial<InstaThread>) =>
    setDms(config.dms.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    onUpdate({ avatar: await fileToScaledDataUrl(f, 320) });
    e.target.value = "";
  };
  const onPostImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingPostId) return;
    updatePost(editingPostId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const onStoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingStoryId) return;
    updateStory(editingStoryId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const onReelImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingReelId) return;
    updateReel(editingReelId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const addPost = () => {
    const id = `p${Date.now()}`;
    setPosts([{ id, image: "", caption: {}, likes: 100, date: {}, comments: [] }, ...config.posts]);
    setEditingPostId(id);
  };
  const addStory = () => {
    const id = `s${Date.now()}`;
    setStories([...config.stories, { id, username: "", avatar: "", image: "" }]);
    setEditingStoryId(id);
    storyFileRef.current?.click();
  };
  const addReel = () => {
    const id = `r${Date.now()}`;
    setReels([{ id, image: "", caption: "", likes: 1000, comments: 50, username: config.username, music: "Original audio" }, ...config.reels]);
    setEditingReelId(id);
  };
  const addThread = () => {
    const id = `d${Date.now()}`;
    setDms([...config.dms, { id, username: "", avatar: "", online: false, messages: [] }]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0D0D1A]/97 z-[100] overflow-y-auto p-5 select-text">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
      <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={onPostImage} />
      <input ref={storyFileRef} type="file" accept="image/*" className="hidden" onChange={onStoryImage} />
      <input ref={reelFileRef} type="file" accept="image/*" className="hidden" onChange={onReelImage} />

      <div className="max-w-md mx-auto space-y-5 pb-20 pt-6">
        <div className="flex items-center justify-between border-b border-[#2D2D4E] pb-4">
          <div className="flex items-center gap-2"><Settings className="w-5 h-5 text-[#A855F7]" /><h2 className="text-lg font-bold text-[#F0E6FF]">Instagram 설정</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg bg-[#1A1A2E] text-[#9CA3AF] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* 언어 */}
        <div>
          <label className={labelCls}>언어 (Language)</label>
          <select value={config.appLocale} onChange={(e) => onUpdate({ appLocale: e.target.value as InstaConfig["appLocale"] })} className={inputCls}>
            <option value="ko">한국어</option><option value="en">English</option><option value="ja">日本語</option>
            <option value="zh-CN">简体中文</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option>
          </select>
        </div>

        {/* 프로필 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#A855F7]">프로필</h3>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-cover bg-center border border-[#2D2D4E]" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
            <button onClick={() => avatarRef.current?.click()} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> 프로필 사진</button>
          </div>
          <div><label className={labelCls}>사용자명 (@)</label><input value={config.username} onChange={(e) => onUpdate({ username: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>이름</label><input value={config.displayName} onChange={(e) => onUpdate({ displayName: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>소개 (bio)</label><textarea value={config.bio} onChange={(e) => onUpdate({ bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelCls}>게시물</label><input type="number" value={config.postsCount} onChange={(e) => onUpdate({ postsCount: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
            <div><label className={labelCls}>팔로워</label><input type="number" value={config.followers} onChange={(e) => onUpdate({ followers: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
            <div><label className={labelCls}>팔로잉</label><input type="number" value={config.following} onChange={(e) => onUpdate({ following: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input type="checkbox" checked={config.verified} onChange={(e) => onUpdate({ verified: e.target.checked })} className="accent-[#7C3AED]" /> 인증 배지(파란 체크) 표시
          </label>
        </div>

        {/* 게시물 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">게시물 ({config.posts.length})</h3>
            <button onClick={addPost} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> 게시물 추가</button>
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">캡션·날짜·댓글은 현재 언어 <span className="text-[#A855F7] font-semibold">{loc.toUpperCase()}</span> 로 저장됩니다. 상단 “언어”를 바꿔 다른 언어 내용을 따로 입력하세요(설정 언어에 맞춰 게시물이 표시).</p>
          {config.posts.map((p) => (
            <div key={p.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${p.image || AVATAR_FALLBACK}')` }} />
                <button onClick={() => { setEditingPostId(p.id); postFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> 사진</button>
                <button onClick={() => setPosts(config.posts.filter((x) => x.id !== p.id))} className="ml-auto p-1.5 rounded" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={p.caption[loc] ?? ""} onChange={(e) => updatePost(p.id, { caption: setLoc(p.caption, e.target.value) })} placeholder={`캡션 (${loc.toUpperCase()})`} rows={2} className={`${inputCls} resize-none`} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>좋아요</label><input type="number" value={p.likes} onChange={(e) => updatePost(p.id, { likes: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
                <div><label className={labelCls}>상대 날짜 ({loc.toUpperCase()})</label><input value={p.date[loc] ?? ""} onChange={(e) => updatePost(p.id, { date: setLoc(p.date, e.target.value) })} placeholder="3주 전" className={inputCls} disabled={!!p.exactDate} style={p.exactDate ? { opacity: 0.5 } : undefined} /></div>
              </div>
              <div>
                <label className={labelCls}>정확한 게시일 (설정 시 상대 날짜 대신 이 날짜로 표시)</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={p.exactDate ?? ""} onChange={(e) => updatePost(p.id, { exactDate: e.target.value || undefined })} className={inputCls} style={{ flex: 1 }} />
                  {p.exactDate && <button onClick={() => updatePost(p.id, { exactDate: undefined })} className="text-xs px-2 py-2 rounded shrink-0" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>지우기</button>}
                </div>
              </div>
              {/* 댓글 */}
              <div className="space-y-1.5">
                <label className={labelCls}>댓글 (내용은 {loc.toUpperCase()} 기준)</label>
                {p.comments.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-1.5">
                    <input value={c.user} onChange={(e) => updatePost(p.id, { comments: p.comments.map((x, j) => j === ci ? { ...x, user: e.target.value } : x) })} placeholder="아이디" className={inputCls} style={{ width: "35%" }} />
                    <input value={c.text[loc] ?? ""} onChange={(e) => updatePost(p.id, { comments: p.comments.map((x, j) => j === ci ? { ...x, text: setLoc(x.text, e.target.value) } : x) })} placeholder="내용" className={inputCls} style={{ flex: 1 }} />
                    <button onClick={() => updatePost(p.id, { comments: p.comments.filter((_, j) => j !== ci) })} className="p-1 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => updatePost(p.id, { comments: [...p.comments, { user: "", text: {} }] })} className="text-xs" style={{ color: "#A855F7" }}>+ 댓글 추가</button>
              </div>
            </div>
          ))}
        </div>

        {/* 스토리 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">스토리 ({config.stories.length})</h3>
            <button onClick={addStory} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> 스토리 추가</button>
          </div>
          {config.stories.map((s) => (
            <div key={s.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${s.image || AVATAR_FALLBACK}')` }} />
              <button onClick={() => { setEditingStoryId(s.id); storyFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg shrink-0" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> 사진</button>
              <input value={s.username} onChange={(e) => updateStory(s.id, { username: e.target.value })} placeholder="아이디" className={inputCls} style={{ flex: 1 }} />
              <button onClick={() => setStories(config.stories.filter((x) => x.id !== s.id))} className="p-1.5 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* 릴스 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">릴스 ({config.reels.length})</h3>
            <button onClick={addReel} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> 릴스 추가</button>
          </div>
          {config.reels.map((r) => (
            <div key={r.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${r.image || AVATAR_FALLBACK}')` }} />
                <button onClick={() => { setEditingReelId(r.id); reelFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> 사진</button>
                <button onClick={() => setReels(config.reels.filter((x) => x.id !== r.id))} className="ml-auto p-1.5 rounded" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={r.caption} onChange={(e) => updateReel(r.id, { caption: e.target.value })} placeholder="캡션" rows={2} className={`${inputCls} resize-none`} />
              <input value={r.music} onChange={(e) => updateReel(r.id, { music: e.target.value })} placeholder="오디오/음악" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>좋아요</label><input type="number" value={r.likes} onChange={(e) => updateReel(r.id, { likes: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
                <div><label className={labelCls}>댓글 수</label><input type="number" value={r.comments} onChange={(e) => updateReel(r.id, { comments: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* DM */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">DM ({config.dms.length})</h3>
            <button onClick={addThread} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> 대화 추가</button>
          </div>
          {config.dms.map((d) => (
            <div key={d.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={d.username} onChange={(e) => updateThread(d.id, { username: e.target.value })} placeholder="상대 아이디" className={inputCls} style={{ flex: 1 }} />
                <label className="flex items-center gap-1 text-xs text-white shrink-0 cursor-pointer">
                  <input type="checkbox" checked={d.online} onChange={(e) => updateThread(d.id, { online: e.target.checked })} className="accent-[#7C3AED]" /> 접속중
                </label>
                <button onClick={() => setDms(config.dms.filter((x) => x.id !== d.id))} className="p-1.5 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>메시지 (보낸이 ↔ 받은이 토글)</label>
                {d.messages.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateThread(d.id, { messages: d.messages.map((x, j) => j === mi ? { ...x, fromMe: !x.fromMe } : x) })}
                      className="text-xs px-2 py-1.5 rounded shrink-0 w-14"
                      style={{ background: m.fromMe ? "rgba(55,151,240,0.2)" : "rgba(120,120,120,0.2)", color: m.fromMe ? "#3797F0" : "#9CA3AF" }}
                    >{m.fromMe ? "나" : "상대"}</button>
                    <input value={m.text} onChange={(e) => updateThread(d.id, { messages: d.messages.map((x, j) => j === mi ? { ...x, text: e.target.value } : x) })} placeholder="내용" className={inputCls} style={{ flex: 1 }} />
                    <button onClick={() => updateThread(d.id, { messages: d.messages.filter((_, j) => j !== mi) })} className="p-1 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => updateThread(d.id, { messages: [...d.messages, { fromMe: false, text: "" }] })} className="text-xs" style={{ color: "#A855F7" }}>+ 메시지 추가</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#2D2D4E]">
          <button onClick={() => { if (confirm("기본 설정으로 초기화할까요?")) onUpdate(defaultInstaConfig(locale)); }} className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-red-950/20 border border-red-500/30 text-red-400">초기화</button>
          <button onClick={onExit} className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-[#1A1A2E] border border-[#2D2D4E] text-[#9CA3AF]">계산기로 이동</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white">완료</button>
        </div>
      </div>
    </motion.div>
  );
}
