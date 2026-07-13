"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Users, MessageSquare, Plus, Trash2, Heart, Play } from "lucide-react";

interface Note {
  id: string;
  timestamp_seconds: number;
  content: string;
  created_at: string;
  video_id: string | null;
}

interface Tip {
  id: string;
  timestamp_seconds: number;
  content: string;
  created_at: string;
  likes_count: number;
  user_id: string;
  video_id: string | null;
  profiles: {
    display_name: string | null;
  } | null;
}

interface VideoInfo {
  id: string;
  title: string | null;
  part_order: number;
}

interface Props {
  productId: string;
  locale: string;
  currentUserId: string;
  currentVideoId?: string | null;
  onSeekToVideo?: (videoId: string, seconds: number) => void;
  videos?: VideoInfo[];
}

const TRANSLATIONS: Record<string, any> = {
  ko: {
    notesTab: "나의 연출 메모",
    tipsTab: "마술사 연출 팁 (피드)",
    addNotePlaceholder: "이 시점(타임코드)에 나만의 연출 메모를 적어보세요...",
    addTipPlaceholder: "이 시점의 연출 팁을 다른 마술사들과 공유해보세요...",
    addBtn: "등록",
    captureTime: "현재 시각 캡처",
    noNotes: "등록된 연출 메모가 없습니다. 나만의 비법 노트를 완성해 보세요!",
    noTips: "아직 등록된 공유 연출 팁이 없습니다. 첫 팁의 주인공이 되어 보세요!",
    anonymous: "익명 마술사",
    deleteAlert: "정말 메모를 삭제하시겠습니까?",
    timeLabel: "시간",
  },
  en: {
    notesTab: "My Notes",
    tipsTab: "Magicians' Tips",
    addNotePlaceholder: "Write your own magic notes at this timecode...",
    addTipPlaceholder: "Share a presentation tip with other magicians...",
    addBtn: "Add",
    captureTime: "Capture Current Time",
    noNotes: "No notes added yet. Build your own secret handbook!",
    noTips: "No tips shared yet. Be the first to share your secret hint!",
    anonymous: "Anonymous Magician",
    deleteAlert: "Are you sure you want to delete this note?",
    timeLabel: "Time",
  },
  ja: {
    notesTab: "マイメモ",
    tipsTab: "マジシャンのコツ",
    addNotePlaceholder: "このタイムコードに自分だけの演出メモを記録...",
    addTipPlaceholder: "他のマジシャンと演出のコツを共有しましょう...",
    addBtn: "追加",
    captureTime: "現在の再生時間を取得",
    noNotes: "登録されたメモはありません。秘密の手帳を完成させましょう！",
    noTips: "共有されたコツはまだありません。最初の共有者になりましょう！",
    anonymous: "匿名マジシャン",
    deleteAlert: "本当にメモを削除しますか？",
    timeLabel: "時間",
  }
};

export default function InteractiveTutorialFeed({ productId, locale, currentUserId, currentVideoId, onSeekToVideo, videos }: Props) {
  const t = TRANSLATIONS[locale] ?? TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState<"notes" | "tips">("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const [noteInput, setNoteInput] = useState("");
  const [tipInput, setTipInput] = useState("");
  const [inputTime, setInputTime] = useState("00:00");
  const [loading, setLoading] = useState(false);

  // Cloudflare Stream Player postMessage를 통한 재생 시간 실시간 동기화 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Cloudflare Stream SDK에서 보내는 메시지 감지
      if (typeof event.data === "string") {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "timeupdate" && typeof data.value === "number") {
            setCurrentTime(Math.floor(data.value));
          }
        } catch {
          // ignore
        }
      } else if (event.data && event.data.event === "timeupdate") {
        setCurrentTime(Math.floor(event.data.value));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 데이터 로드
  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/tutorial/notes?product_id=${productId}`);
      if (res.ok) setNotes(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTips = async () => {
    try {
      const res = await fetch(`/api/tutorial/tips?product_id=${productId}`);
      if (res.ok) setTips(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchTips();
  }, [productId]);

  // 시간을 MM:SS 형식으로 변환
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // MM:SS를 초(seconds)로 변환
  const parseTimeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      return m * 60 + s;
    }
    return 0;
  };

  // 현재 재생 시각 캡처 버튼
  const handleCaptureTime = () => {
    setInputTime(formatSeconds(currentTime));
  };

  // 시간초 변경 핸들러 (스텝퍼)
  const handleAdjustTime = (amount: number) => {
    const secs = parseTimeToSeconds(inputTime);
    const next = Math.max(0, secs + amount);
    setInputTime(formatSeconds(next));
  };

  // 비디오 플레이어 특정 시각으로 Seek(이동) 요청
  const handleSeekTo = (seconds: number, videoId?: string | null) => {
    if (onSeekToVideo && videoId) {
      onSeekToVideo(videoId, seconds);
      return;
    }

    // Cloudflare Stream Player iframe을 찾아 postMessage 전송
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: "setCurrentTime", value: seconds }),
          "*"
        );
      } catch (e) {
        console.error("Iframe postMessage failed:", e);
      }
    });

    // 만약 MockPlayer 연출 중일 때를 고려해 전역 윈도우 스크롤 스무스
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 메모 등록
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tutorial/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          timestamp_seconds: parseTimeToSeconds(inputTime),
          content: noteInput,
          video_id: currentVideoId ?? null,
        }),
      });

      if (res.ok) {
        setNoteInput("");
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 메모 삭제
  const handleDeleteNote = async (id: string) => {
    if (!confirm(t.deleteAlert)) return;
    try {
      const res = await fetch(`/api/tutorial/notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchNotes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 팁 등록
  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tutorial/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          timestamp_seconds: parseTimeToSeconds(inputTime),
          content: tipInput,
          video_id: currentVideoId ?? null,
        }),
      });

      if (res.ok) {
        setTipInput("");
        fetchTips();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 팁 좋아요 증가
  const handleLikeTip = async (id: string) => {
    try {
      const res = await fetch("/api/tutorial/tips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchTips();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-12 rounded-2xl p-6" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
      {/* 탭 헤더 */}
      <div className="flex gap-4 border-b border-[#2D2D4E] pb-4 mb-6">
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 text-sm font-semibold transition-all px-3 py-1.5 rounded-lg ${
            activeTab === "notes"
              ? "bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              : "text-[#9CA3AF] hover:text-[#F0E6FF]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t.notesTab}
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={`flex items-center gap-2 text-sm font-semibold transition-all px-3 py-1.5 rounded-lg ${
            activeTab === "tips"
              ? "bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              : "text-[#9CA3AF] hover:text-[#F0E6FF]"
          }`}
        >
          <Users className="w-4 h-4" />
          {t.tipsTab}
        </button>
      </div>

      {/* 작성 영역 (시간 연동 폼) */}
      <form onSubmit={activeTab === "notes" ? handleAddNote : handleAddTip} className="space-y-4 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 타임 코드 스텝퍼 조절 */}
          <div className="flex items-center gap-1.5 bg-[#0D0D1A] rounded-xl px-2 py-1.5 border border-[#2D2D4E]">
            <span className="text-xs text-[#6B7280] px-1">{t.timeLabel}</span>
            <button
              type="button"
              onClick={() => handleAdjustTime(-10)}
              className="text-xs text-[#9CA3AF] hover:text-white px-1.5"
            >
              -10s
            </button>
            <input
              type="text"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="w-16 text-center bg-transparent text-sm font-semibold text-[#A855F7] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleAdjustTime(10)}
              className="text-xs text-[#9CA3AF] hover:text-white px-1.5"
            >
              +10s
            </button>
          </div>

          <button
            type="button"
            onClick={handleCaptureTime}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#2D2D4E] text-[#F0E6FF] hover:bg-[#3d3d63] transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {t.captureTime} ({formatSeconds(currentTime)})
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={activeTab === "notes" ? noteInput : tipInput}
            onChange={(e) => (activeTab === "notes" ? setNoteInput(e.target.value) : setTipInput(e.target.value))}
            placeholder={activeTab === "notes" ? t.addNotePlaceholder : t.addTipPlaceholder}
            className="flex-1 rounded-xl bg-[#0D0D1A] border border-[#2D2D4E] text-white text-xs px-4 py-3 focus:outline-none focus:border-[#7C3AED]"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1 px-5 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t.addBtn}
          </button>
        </div>
      </form>

      {/* 리스트 영역 */}
      <div className="space-y-3">
        {activeTab === "notes" ? (
          notes.length === 0 ? (
            <p className="text-xs text-[#6B7280] text-center py-6">{t.noNotes}</p>
          ) : (
            notes.map((note) => {
              const videoPart = videos && note.video_id ? videos.find((v) => v.id === note.video_id) : null;
              const partLabel = videoPart && videos && videos.length > 1 ? `Part ${videoPart.part_order}` : "";
              return (
                <div
                  key={note.id}
                  className="flex items-center gap-4 rounded-xl px-4 py-3 bg-[#0D0D1A] border border-[#2D2D4E]"
                >
                  <button
                    onClick={() => handleSeekTo(note.timestamp_seconds, note.video_id)}
                    className="px-2.5 py-1 rounded bg-[#2D2D4E] text-xs font-mono text-[#A855F7] font-bold hover:bg-[#3d3d63] transition-colors shrink-0"
                  >
                    {formatSeconds(note.timestamp_seconds)}
                  </button>
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {partLabel && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#A855F7]/10 text-[#A855F7]">
                        {partLabel}
                      </span>
                    )}
                    <p className="text-xs text-[#F0E6FF] leading-relaxed">{note.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#EF4444] transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )
        ) : (
          tips.length === 0 ? (
            <p className="text-xs text-[#6B7280] text-center py-6">{t.noTips}</p>
          ) : (
            tips.map((tip) => {
              const videoPart = videos && tip.video_id ? videos.find((v) => v.id === tip.video_id) : null;
              const partLabel = videoPart && videos && videos.length > 1 ? `Part ${videoPart.part_order}` : "";
              return (
                <div
                  key={tip.id}
                  className="flex items-start gap-4 rounded-xl px-4 py-3.5 bg-[#0D0D1A] border border-[#2D2D4E]"
                >
                  <button
                    onClick={() => handleSeekTo(tip.timestamp_seconds, tip.video_id)}
                    className="px-2.5 py-1 rounded bg-[#2D2D4E] text-xs font-mono text-[#A855F7] font-bold hover:bg-[#3d3d63] transition-colors shrink-0 mt-0.5"
                  >
                    {formatSeconds(tip.timestamp_seconds)}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {partLabel && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#A855F7]/10 text-[#A855F7]">
                          {partLabel}
                        </span>
                      )}
                      <p className="text-xs text-[#F0E6FF] leading-relaxed">{tip.content}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                      <span>@{tip.profiles?.display_name ?? t.anonymous}</span>
                      <span>•</span>
                      <span>{new Date(tip.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                <button
                  onClick={() => handleLikeTip(tip.id)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#2D2D4E] text-[10px] text-[#9CA3AF] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-all shrink-0 self-center"
                >
                  <Heart className={`w-3 h-3 ${tip.likes_count > 0 ? "fill-current text-[#EF4444]" : ""}`} />
                  <span>{tip.likes_count}</span>
                </button>
              </div>
            );
          })
          )
        )}
      </div>
    </div>
  );
}
