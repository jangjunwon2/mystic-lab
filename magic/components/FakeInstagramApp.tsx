"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Home, Search, Film, Settings, X, Plus, Trash2, Upload, ChevronLeft, BadgeCheck, Grid3x3 } from "lucide-react";
import {
  type InstaConfig, type InstaPost, loadInstaConfig, saveInstaConfig, fileToScaledDataUrl, formatCount, defaultInstaConfig,
} from "./instagram-config";

interface Props {
  locale: string;
}

const UI: Record<string, {
  posts: string; followers: string; following: string; viewAll: (n: number) => string; edit: string; follow: string; message: string;
}> = {
  ko: { posts: "게시물", followers: "팔로워", following: "팔로잉", viewAll: (n) => `댓글 ${n}개 모두 보기`, edit: "프로필 편집", follow: "팔로우", message: "메시지" },
  en: { posts: "posts", followers: "followers", following: "following", viewAll: (n) => `View all ${n} comments`, edit: "Edit profile", follow: "Follow", message: "Message" },
  ja: { posts: "投稿", followers: "フォロワー", following: "フォロー中", viewAll: (n) => `コメント${n}件をすべて見る`, edit: "プロフィールを編集", follow: "フォロー", message: "メッセージ" },
  "zh-CN": { posts: "帖子", followers: "粉丝", following: "关注", viewAll: (n) => `查看全部 ${n} 条评论`, edit: "编辑主页", follow: "关注", message: "私信" },
  es: { posts: "publicaciones", followers: "seguidores", following: "seguidos", viewAll: (n) => `Ver los ${n} comentarios`, edit: "Editar perfil", follow: "Seguir", message: "Mensaje" },
  fr: { posts: "publications", followers: "abonnés", following: "abonnements", viewAll: (n) => `Voir les ${n} commentaires`, edit: "Modifier le profil", follow: "Suivre", message: "Message" },
  de: { posts: "Beiträge", followers: "Follower", following: "Gefolgt", viewAll: (n) => `Alle ${n} Kommentare ansehen`, edit: "Profil bearbeiten", follow: "Folgen", message: "Nachricht" },
};

const AVATAR_FALLBACK = "/images/magic/instagram-post.png";

export default function FakeInstagramApp({ locale }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<InstaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"feed" | "profile">("feed");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setConfig(loadInstaConfig(locale));
    const timer = setTimeout(() => setLoading(false), 1300);
    return () => clearTimeout(timer);
  }, [locale]);

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
    <div className="relative w-full h-screen bg-black text-white select-none overflow-hidden flex flex-col font-sans">
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
      ) : view === "feed" ? (
        <FeedView config={config} ui={ui} likes={likes} likeCount={likeCount} onLike={toggleLike} />
      ) : (
        <ProfileView config={config} ui={ui} onOpenPost={(id) => setOpenPostId(id)} />
      )}

      {/* 하단 탭 바 */}
      {!openPostId && (
        <div className="h-[49px] border-t border-[#262626] bg-black flex items-center justify-around px-2 shrink-0">
          <button onClick={() => setView("feed")} className={view === "feed" ? "text-white" : "text-gray-500"}>
            <Home className="w-6 h-6" fill={view === "feed" ? "currentColor" : "none"} strokeWidth={view === "feed" ? 0 : 2} />
          </button>
          <button className="text-gray-500"><Search className="w-6 h-6" strokeWidth={2} /></button>
          <button className="text-gray-500"><Film className="w-6 h-6" strokeWidth={2} /></button>
          <button onClick={() => setView("profile")} className="w-7 h-7 rounded-full overflow-hidden" style={{ border: view === "profile" ? "1.5px solid #fff" : "1px solid #555" }}>
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
          </button>
        </div>
      )}

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
function FeedView({ config, ui, likes, likeCount, onLike }: {
  config: InstaConfig; ui: typeof UI["en"]; likes: Record<string, boolean>; likeCount: (p: InstaPost) => number; onLike: (p: InstaPost) => void;
}) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center justify-between px-4 shrink-0">
        <span className="text-2xl text-white" style={{ fontFamily: "'Brush Script MT', cursive" }}>Instagram</span>
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 text-white" strokeWidth={2} />
          <Send className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
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
        <span className="whitespace-pre-line select-text">{post.caption}</span>
      </div>
      {post.comments.length > 0 && (
        <div className="px-3 pb-1 text-xs text-gray-400">{ui.viewAll(post.comments.length + 40)}</div>
      )}
      <div className="px-3 space-y-0.5 text-[13px] text-gray-100">
        {post.comments.slice(0, 2).map((c, i) => (
          <div key={i}><strong className="text-white mr-1.5">{c.user}</strong><span className="select-text">{c.text}</span></div>
        ))}
      </div>
      <div className="px-3 pt-1 text-[10px] text-gray-500 uppercase tracking-wide">{post.date}</div>
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
function ProfileView({ config, ui, onOpenPost }: { config: InstaConfig; ui: typeof UI["en"]; onOpenPost: (id: string) => void }) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base">{config.username}</span>
          {config.verified && <BadgeCheck className="w-4 h-4 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
        </div>
        <Plus className="w-6 h-6 text-white" />
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
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] text-white">{ui.edit}</button>
            <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] text-white">{ui.message}</button>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-[#262626] mt-4">
          <div className="py-2.5 text-white border-t border-white -mt-px"><Grid3x3 className="w-6 h-6" /></div>
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

// ─── 비밀 설정 패널 ───
function SettingsPanel({ config, locale, onUpdate, onClose, onExit }: {
  config: InstaConfig; locale: string; onUpdate: (patch: Partial<InstaConfig>) => void; onClose: () => void; onExit: () => void;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const postFileRef = useRef<HTMLInputElement>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const inputCls = "w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]";
  const labelCls = "text-xs text-[#9CA3AF] block mb-1";

  const setPosts = (posts: InstaPost[]) => onUpdate({ posts });
  const updatePost = (id: string, patch: Partial<InstaPost>) =>
    setPosts(config.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));

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
  const addPost = () => {
    const id = `p${Date.now()}`;
    setPosts([{ id, image: "", caption: "", likes: 100, date: "1d", comments: [] }, ...config.posts]);
    setEditingPostId(id);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0D0D1A]/97 z-[100] overflow-y-auto p-5 select-text">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
      <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={onPostImage} />

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
          {config.posts.map((p) => (
            <div key={p.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${p.image || AVATAR_FALLBACK}')` }} />
                <button onClick={() => { setEditingPostId(p.id); postFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> 사진</button>
                <button onClick={() => setPosts(config.posts.filter((x) => x.id !== p.id))} className="ml-auto p-1.5 rounded" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={p.caption} onChange={(e) => updatePost(p.id, { caption: e.target.value })} placeholder="캡션" rows={2} className={`${inputCls} resize-none`} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>좋아요</label><input type="number" value={p.likes} onChange={(e) => updatePost(p.id, { likes: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
                <div><label className={labelCls}>날짜 표시</label><input value={p.date} onChange={(e) => updatePost(p.id, { date: e.target.value })} placeholder="3주 전" className={inputCls} /></div>
              </div>
              {/* 댓글 */}
              <div className="space-y-1.5">
                <label className={labelCls}>댓글</label>
                {p.comments.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-1.5">
                    <input value={c.user} onChange={(e) => updatePost(p.id, { comments: p.comments.map((x, j) => j === ci ? { ...x, user: e.target.value } : x) })} placeholder="아이디" className={inputCls} style={{ width: "35%" }} />
                    <input value={c.text} onChange={(e) => updatePost(p.id, { comments: p.comments.map((x, j) => j === ci ? { ...x, text: e.target.value } : x) })} placeholder="내용" className={inputCls} style={{ flex: 1 }} />
                    <button onClick={() => updatePost(p.id, { comments: p.comments.filter((_, j) => j !== ci) })} className="p-1 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => updatePost(p.id, { comments: [...p.comments, { user: "", text: "" }] })} className="text-xs" style={{ color: "#A855F7" }}>+ 댓글 추가</button>
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
