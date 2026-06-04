"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Trash2, Pin, Send } from "lucide-react";

type PostType = "suggestion" | "staging" | "update";

interface CommunityComment {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  mine: boolean;
}
interface CommunityPost {
  id: string;
  type: PostType;
  title: string | null;
  body: string;
  isPinned: boolean;
  authorName: string;
  createdAt: string;
  mine: boolean;
  comments: CommunityComment[];
}

interface Props {
  productId: string;
  locale: string;
  isLoggedIn: boolean;
}

// 7개 언어 라벨 (인라인 — ShareButtons SHARE_LABELS 패턴)
const T: Record<string, Record<string, string>> = {
  en: { heading: "Owners' Community", suggestion: "Improvement Ideas", staging: "Performance Tips", update: "Update Log",
    empty: "No posts yet.", writePlaceholder: "Share with fellow owners…", titlePlaceholder: "Title (optional)",
    post: "Post", comment: "Comment", commentPlaceholder: "Add a comment…", del: "Delete",
    loginRequired: "Sign in to view the owners' community.", buyerOnly: "Only buyers of this device can view and post here.",
    pinned: "Notice", by: "by" },
  ko: { heading: "구매자 커뮤니티", suggestion: "개선 제안", staging: "연출 공유", update: "업데이트 공지",
    empty: "아직 글이 없습니다.", writePlaceholder: "구매자끼리 의견을 나눠보세요…", titlePlaceholder: "제목 (선택)",
    post: "등록", comment: "댓글", commentPlaceholder: "댓글 달기…", del: "삭제",
    loginRequired: "구매자 커뮤니티는 로그인 후 이용할 수 있습니다.", buyerOnly: "이 장치 구매자만 열람·작성할 수 있습니다.",
    pinned: "공지", by: "·" },
  ja: { heading: "購入者コミュニティ", suggestion: "改善提案", staging: "演出の共有", update: "アップデート告知",
    empty: "まだ投稿がありません。", writePlaceholder: "購入者同士で意見を共有…", titlePlaceholder: "タイトル（任意）",
    post: "投稿", comment: "コメント", commentPlaceholder: "コメントを追加…", del: "削除",
    loginRequired: "購入者コミュニティはログイン後にご利用いただけます。", buyerOnly: "このデバイスの購入者のみ閲覧・投稿できます。",
    pinned: "お知らせ", by: "·" },
  "zh-CN": { heading: "买家社区", suggestion: "改进建议", staging: "演出分享", update: "更新公告",
    empty: "暂无帖子。", writePlaceholder: "与其他买家交流…", titlePlaceholder: "标题（可选）",
    post: "发布", comment: "评论", commentPlaceholder: "添加评论…", del: "删除",
    loginRequired: "登录后即可查看买家社区。", buyerOnly: "仅该设备的买家可查看和发布。",
    pinned: "公告", by: "·" },
  es: { heading: "Comunidad de compradores", suggestion: "Ideas de mejora", staging: "Consejos de actuación", update: "Registro de actualizaciones",
    empty: "Aún no hay publicaciones.", writePlaceholder: "Comparte con otros compradores…", titlePlaceholder: "Título (opcional)",
    post: "Publicar", comment: "Comentar", commentPlaceholder: "Añadir un comentario…", del: "Eliminar",
    loginRequired: "Inicia sesión para ver la comunidad.", buyerOnly: "Solo los compradores de este dispositivo pueden ver y publicar.",
    pinned: "Aviso", by: "·" },
  fr: { heading: "Communauté des acheteurs", suggestion: "Idées d'amélioration", staging: "Conseils de présentation", update: "Journal des mises à jour",
    empty: "Aucune publication pour l'instant.", writePlaceholder: "Partagez avec les autres acheteurs…", titlePlaceholder: "Titre (facultatif)",
    post: "Publier", comment: "Commenter", commentPlaceholder: "Ajouter un commentaire…", del: "Supprimer",
    loginRequired: "Connectez-vous pour voir la communauté.", buyerOnly: "Seuls les acheteurs de cet appareil peuvent consulter et publier.",
    pinned: "Annonce", by: "·" },
  de: { heading: "Käufer-Community", suggestion: "Verbesserungsideen", staging: "Vorführ-Tipps", update: "Update-Verlauf",
    empty: "Noch keine Beiträge.", writePlaceholder: "Tausche dich mit anderen Käufern aus…", titlePlaceholder: "Titel (optional)",
    post: "Posten", comment: "Kommentieren", commentPlaceholder: "Kommentar hinzufügen…", del: "Löschen",
    loginRequired: "Melde dich an, um die Community zu sehen.", buyerOnly: "Nur Käufer dieses Geräts können hier lesen und posten.",
    pinned: "Hinweis", by: "·" },
};

const TABS: PostType[] = ["suggestion", "staging", "update"];

export default function ProductCommunity({ productId, locale, isLoggedIn }: Props) {
  const t = T[locale] ?? T.en;
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Record<PostType, CommunityPost[]>>({ suggestion: [], staging: [], update: [] });
  const [tab, setTab] = useState<PostType>("suggestion");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/${productId}`);
      const data = await res.json();
      setCanAccess(!!data.canAccess);
      setIsAdmin(!!data.isAdmin);
      if (data.posts) setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isLoggedIn) load();
    else setLoading(false);
  }, [isLoggedIn, load]);

  // 공지(update) 탭 작성은 어드민만
  const canWriteTab = tab !== "update" || isAdmin;

  async function submitPost() {
    const text = bodyText.trim();
    if (!text || busy) return;
    setBusy(true);
    const res = await fetch(`/api/community/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "post", type: tab, title: title.trim() || undefined, body: text }),
    });
    setBusy(false);
    if (res.ok) {
      setTitle("");
      setBodyText("");
      load();
    }
  }

  async function submitComment(postId: string) {
    const text = (commentInputs[postId] ?? "").trim();
    if (!text) return;
    const res = await fetch(`/api/community/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "comment", postId, body: text }),
    });
    if (res.ok) {
      setCommentInputs((p) => ({ ...p, [postId]: "" }));
      load();
    }
  }

  async function remove(kind: "post" | "comment", id: string) {
    const res = await fetch(`/api/community/${productId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    if (res.ok) load();
  }

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso.slice(0, 10);
    }
  }

  if (loading) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-4" style={{ color: "#F0E6FF", fontFamily: "var(--font-cinzel), serif" }}>
        {t.heading}
      </h2>

      {!isLoggedIn ? (
        <p className="text-sm rounded-xl px-4 py-6 text-center" style={{ color: "#9CA3AF", background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          {t.loginRequired}
        </p>
      ) : !canAccess ? (
        <p className="text-sm rounded-xl px-4 py-6 text-center" style={{ color: "#9CA3AF", background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          {t.buyerOnly}
        </p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "#2D2D4E" }}>
            {TABS.map((tp) => (
              <button
                key={tp}
                onClick={() => setTab(tp)}
                className="flex-1 px-3 py-3 text-sm font-medium transition-colors"
                style={{
                  color: tab === tp ? "#A855F7" : "#9CA3AF",
                  borderBottom: tab === tp ? "2px solid #7C3AED" : "2px solid transparent",
                  background: tab === tp ? "#13131F" : "transparent",
                }}
              >
                {t[tp]}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Write form */}
            {canWriteTab && (
              <div className="space-y-2 rounded-lg p-3" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
                {tab === "update" && (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.titlePlaceholder}
                    maxLength={200}
                    className="w-full text-sm rounded-md px-3 py-2 outline-none"
                    style={{ background: "#0D0D1A", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
                  />
                )}
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder={t.writePlaceholder}
                  rows={3}
                  maxLength={5000}
                  className="w-full text-sm rounded-md px-3 py-2 outline-none resize-y"
                  style={{ background: "#0D0D1A", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitPost}
                    disabled={busy || !bodyText.trim()}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
                  >
                    {t.post}
                  </button>
                </div>
              </div>
            )}

            {/* Posts */}
            {posts[tab].length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "#6B7280" }}>{t.empty}</p>
            ) : (
              posts[tab].map((p) => (
                <div key={p.id} className="rounded-lg p-3" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {p.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] mb-1 px-1.5 py-0.5 rounded" style={{ background: "#7C3AED22", color: "#A855F7" }}>
                          <Pin className="w-3 h-3" /> {t.pinned}
                        </span>
                      )}
                      {p.title && <p className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>{p.title}</p>}
                      <p className="text-sm whitespace-pre-wrap break-words" style={{ color: "#F0E6FF" }}>{p.body}</p>
                      <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                        {p.authorName} {t.by} {fmtDate(p.createdAt)}
                      </p>
                    </div>
                    {(p.mine || isAdmin) && (
                      <button onClick={() => remove("post", p.id)} title={t.del} className="shrink-0 p-1 rounded hover:opacity-80" style={{ color: "#EF4444" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="mt-3 pl-3 space-y-2" style={{ borderLeft: "1px solid #2D2D4E" }}>
                    {p.comments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2">
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          <span style={{ color: "#A855F7" }}>{c.authorName}</span> {c.body}
                        </p>
                        {(c.mine || isAdmin) && (
                          <button onClick={() => remove("comment", c.id)} title={t.del} className="shrink-0 p-0.5 rounded hover:opacity-80" style={{ color: "#EF4444" }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "#6B7280" }} />
                      <input
                        value={commentInputs[p.id] ?? ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") submitComment(p.id); }}
                        placeholder={t.commentPlaceholder}
                        maxLength={5000}
                        className="flex-1 text-xs rounded-md px-2 py-1.5 outline-none"
                        style={{ background: "#0D0D1A", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
                      />
                      <button onClick={() => submitComment(p.id)} disabled={!(commentInputs[p.id] ?? "").trim()} className="p-1.5 rounded-md disabled:opacity-40 hover:opacity-80" style={{ background: "#7C3AED22", color: "#A855F7" }}>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
