"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  locale: string;
}

// 7개 언어 대응 인스타그램 텍스트 리소스
const INSTA_TEXTS: Record<string, {
  postHeader: string;
  location: string;
  weeksAgo: string;
  viewComments: string;
  comment1: string;
  comment2: string;
  captionTemplate: string;
}> = {
  ko: {
    postHeader: "게시물",
    location: "미스틱 연구소 (Astral Plane)",
    weeksAgo: "3주 전",
    viewComments: "댓글 42개 모두 보기",
    comment1: "말도 안 돼... 이게 어떻게 가능하죠? 🤯",
    comment2: "진짜 소름 돋았어요! 소장할 가치가 있네요. 😱",
    captionTemplate: "3주 전 꿈속에서 이상한 세 숫자를 보았다: {num1}, {num2}, 그리고 마지막 번호인 {result}. 운명은 이미 결정되어 있다. 🔮✨",
  },
  en: {
    postHeader: "Posts",
    location: "Mystic Lab (Astral Plane)",
    weeksAgo: "3 weeks ago",
    viewComments: "View all 42 comments",
    comment1: "No way... how is this possible? 🤯",
    comment2: "This is a pure miracle! Absolutely jaw-dropping. 😱",
    captionTemplate: "Three weeks ago, I saw three numbers in my dream: {num1}, {num2}, and the final code {result}. Destiny is already written. 🔮✨",
  },
  ja: {
    postHeader: "投稿",
    location: "ミスティック・ラボ (Astral Plane)",
    weeksAgo: "3週間前",
    viewComments: "コメント42件をすべて見る",
    comment1: "ありえない…どうやってるの？ 🤯",
    comment2: "本物の奇跡！鳥肌が立ちました。 😱",
    captionTemplate: "3週間前、夢の中で3つの数字を見ました：{num1}、{num2}、そして最後のコードは {result}。運命はすでに決まっています。🔮✨",
  },
  "zh-CN": {
    postHeader: "帖子",
    location: "神秘实验室 (Astral Plane)",
    weeksAgo: "3周前",
    viewComments: "查看全部 42 条评论",
    comment1: "这不可能……这是怎么做到的？ 🤯",
    comment2: "真正的奇迹！太令人震撼了。 😱",
    captionTemplate: "3周前，我在梦里看到了三个数字：{num1}，{num2}，以及最终的代码 {result}。命运早已注定。🔮✨",
  },
  es: {
    postHeader: "Publicaciones",
    location: "Laboratorio Místico (Astral Plane)",
    weeksAgo: "Hace 3 semanas",
    viewComments: "Ver los 42 comentarios",
    comment1: "No puede ser... ¿cómo es esto posible? 🤯",
    comment2: "¡Puro milagro! Absolutamente increíble. 😱",
    captionTemplate: "Hace 3 semanas, vi tres números en mi sueño: {num1}, {num2}, y el código final {result}. El destino ya está escrito. 🔮✨",
  },
  fr: {
    postHeader: "Publications",
    location: "Laboratoire Mystique (Astral Plane)",
    weeksAgo: "Il y a 3 semaines",
    viewComments: "Voir les 42 commentaires",
    comment1: "Pas possible... comment est-ce possible ? 🤯",
    comment2: "Un pur miracle ! Complètement bluffant. 😱",
    captionTemplate: "Il y a 3 semaines, j'ai vu trois nombres dans mon rêve : {num1}, {num2}, et le code final {result}. Le destin est déjà écrit. 🔮✨",
  },
  de: {
    postHeader: "Beiträge",
    location: "Mystisches Labor (Astral Plane)",
    weeksAgo: "Vor 3 Wochen",
    viewComments: "Alle 42 Kommentare anzeigen",
    comment1: "Auf keinen Fall ... wie ist das möglich? 🤯",
    comment2: "Ein echtes Wunder! Absolut sprachlos. 😱",
    captionTemplate: "Vor 3 Wochen sah ich drei Zahlen in meinem Traum: {num1}, {num2} und den finalen Code {result}. Das Schicksal ist bereits geschrieben. 🔮✨",
  }
};

export default function FakeInstagram({ locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1248);
  const [prediction, setPrediction] = useState({ num1: "12", num2: "34", result: "46" });

  useEffect(() => {
    // 1.5초 로딩 스플래시 화면 노출
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // 로컬 스토리지에서 계산값 로드
    try {
      const saved = localStorage.getItem("ml_calc_instagram_prediction");
      if (saved) {
        setPrediction(JSON.parse(saved));
      }
    } catch { /* ignore */ }

    return () => clearTimeout(timer);
  }, []);

  const t = INSTA_TEXTS[locale] ?? INSTA_TEXTS.en;

  // 캡션에 변수 치환
  const formattedCaption = t.captionTemplate
    .replace(/{num1}/g, prediction.num1)
    .replace(/{num2}/g, prediction.num2)
    .replace(/{result}/g, prediction.result);

  // 좋아요 클릭 핸들러
  const handleLikeToggle = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      // 미세 진동
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }
  };

  // 좋아요 렌더러
  const renderLikesText = () => {
    const boldUser = "jack_magic";
    const countStr = likeCount.toLocaleString();

    switch (locale) {
      case "ko":
        return (
          <span className="text-sm text-white">
            <strong>{boldUser}</strong>님 외 <strong>{countStr}명</strong>이 좋아합니다
          </span>
        );
      case "ja":
        return (
          <span className="text-sm text-white">
            <strong>{boldUser}</strong>さん、他<strong>{countStr}人</strong>が「いいね！」しました
          </span>
        );
      case "zh-CN":
        return (
          <span className="text-sm text-white">
            <strong>{boldUser}</strong> 和其他 <strong>{countStr} 人</strong>都觉得很赞
          </span>
        );
      case "es":
        return (
          <span className="text-sm text-white">
            Les gusta a <strong>{boldUser}</strong> y <strong>{countStr} personas más</strong>
          </span>
        );
      case "fr":
        return (
          <span className="text-sm text-white">
            Aimé par <strong>{boldUser}</strong> et <strong>{countStr} autres personnes</strong>
          </span>
        );
      case "de":
        return (
          <span className="text-sm text-white">
            Gefällt <strong>{boldUser}</strong> und <strong>{countStr} weiteren Personen</strong>
          </span>
        );
      default:
        return (
          <span className="text-sm text-white">
            Liked by <strong>{boldUser}</strong> and <strong>{countStr} others</strong>
          </span>
        );
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white select-none overflow-hidden flex flex-col font-sans">
      <AnimatePresence>
        {/* ── 인스타그램 로딩 스플래시 화면 ── */}
        {loading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[#000000] z-[9999] flex flex-col justify-between items-center py-16"
          >
            <div />
            {/* 인스타그램 그라디언트 아이콘 */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-[22px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]"
                style={{ transform: "scale(1.05)" }}
              />
              <div className="absolute inset-[4px] rounded-[18px] bg-black" />
              {/* 내측 디테일 */}
              <div className="absolute w-10 h-10 rounded-full border-[5px] border-white" />
              <div className="absolute top-[22px] right-[22px] w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            
            {/* Meta 로고 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 tracking-wider">from</span>
              <div className="flex items-center gap-1.5">
                {/* Meta Infinity Icon */}
                <svg className="w-6 h-6 fill-gradient" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="meta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0064E0" />
                      <stop offset="100%" stopColor="#00F2FE" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#meta-grad)"
                    d="M16.657 5c-1.464 0-2.822.684-3.791 1.834L12 7.842l-.866-1.008C10.165 5.684 8.807 5 7.343 5 4.397 5 2 7.397 2 10.343c0 3.268 2.664 5.922 5.938 5.922 1.464 0 2.822-.684 3.791-1.834L12 14.158l.866 1.008c.969 1.15 2.327 1.834 3.791 1.834C19.603 17 22 14.603 22 11.657 22 8.389 19.336 5.735 16.657 5.735zm-9.314 9.265c-1.93 0-3.5-1.57-3.5-3.5 0-1.93 1.57-3.5 3.5-3.5 1.082 0 2.052.549 2.656 1.408L8.2 10.875l1.801 2.1c-.604.859-1.574 1.408-2.656 1.408zm9.314 0c-1.082 0-2.052-.549-2.656-1.408l1.801-2.1 1.801 2.1c.604-.859 1.574-1.408 2.656-1.408 1.93 0 3.5 1.57 3.5 3.5 0 1.93-1.57 3.5-3.5 3.5z"
                  />
                </svg>
                <span className="text-sm font-bold text-white tracking-widest">Meta</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 인스타그램 본문 상단 헤더 ── */}
      <div className="h-11 border-b border-[#262626] bg-black flex items-center justify-between px-3 shrink-0">
        <button
          onClick={() => router.push(`/${locale}/calc`)}
          className="w-10 flex items-center justify-start text-white active:opacity-60 transition-opacity"
        >
          {/* Back Icon */}
          <svg className="w-6 h-6 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-bold text-base tracking-tight">{t.postHeader}</span>
        <div className="w-10" /> {/* 우측 밸런서 */}
      </div>

      {/* ── 메인 피드 스크롤 영역 ── */}
      <div className="flex-1 overflow-y-auto pb-12">
        {/* 프로필 정보 영역 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]">
              <div className="w-full h-full rounded-full bg-black p-[1px]">
                {/* 프로필 이미지로 이미지 재활용 */}
                <div
                  className="w-full h-full rounded-full bg-cover bg-center"
                  style={{ backgroundImage: "url('/images/magic/instagram-post.png')" }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight">mystic_lab_magic</span>
              <span className="text-[10px] text-gray-400 leading-tight">{t.location}</span>
            </div>
          </div>
          <button className="text-white active:opacity-50 transition-opacity">
            {/* More Options Icon */}
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
              <path d="M12 9.75A1.25 1.25 0 1012 12a1.25 1.25 0 000-2.25zm-5.5 0a1.25 1.25 0 100 2.25 1.25 1.25 0 000-2.25zm11 0a1.25 1.25 0 100 2.25 1.25 1.25 0 000-2.25z" />
            </svg>
          </button>
        </div>

        {/* 게시물 이미지 */}
        <div className="relative w-full aspect-square bg-[#121212] overflow-hidden select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/magic/instagram-post.png"
            alt="Mystic Destiny"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 인터랙션 버튼 아이콘 바 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-4">
            {/* Heart Button */}
            <button onClick={handleLikeToggle} className="active:scale-125 transition-transform duration-100">
              {isLiked ? (
                <svg className="w-6.5 h-6.5 fill-[#FF3040]" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              ) : (
                <svg className="w-6.5 h-6.5 stroke-white fill-none" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              )}
            </button>
            
            {/* Comment Button */}
            <button className="active:opacity-50 transition-opacity">
              <svg className="w-6.5 h-6.5 stroke-white fill-none" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
            </button>

            {/* Share Button */}
            <button className="active:opacity-50 transition-opacity">
              <svg className="w-6.5 h-6.5 stroke-white fill-none" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          {/* Bookmark Button */}
          <button className="active:opacity-50 transition-opacity">
            <svg className="w-6.5 h-6.5 stroke-white fill-none" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* 좋아요 수 */}
        <div className="px-3 pb-1">
          {renderLikesText()}
        </div>

        {/* 작성 캡션 (마술 예언 텍스트) */}
        <div className="px-3 pb-2 text-sm leading-relaxed text-gray-200">
          <strong className="text-white mr-1.5">mystic_lab_magic</strong>
          <span className="whitespace-pre-line text-[13.5px] select-text">{formattedCaption}</span>
        </div>

        {/* 댓글 보기 버튼 */}
        <div className="px-3 pb-1 text-xs text-gray-400">
          {t.viewComments}
        </div>

        {/* 리얼한 고정 댓글 2개 */}
        <div className="px-3 pb-1.5 text-[13px] leading-tight text-gray-200 space-y-1">
          <div>
            <strong className="text-white mr-1.5">alex_mental</strong>
            <span className="select-text">{t.comment1}</span>
          </div>
          <div>
            <strong className="text-white mr-1.5">sarah_mystique</strong>
            <span className="select-text">{t.comment2}</span>
          </div>
        </div>

        {/* 작성 시각 */}
        <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wide">
          {t.weeksAgo}
        </div>
      </div>

      {/* ── 인스타그램 하단 탭 바 ── */}
      <div className="h-[49px] border-t border-[#262626] bg-black flex items-center justify-around px-2 shrink-0 pb-safe">
        {/* Home */}
        <button className="text-white">
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M22 23h-6.007c-.55 0-1-.45-1-1v-5.687c0-.55-.45-1-1-1h-3.985c-.55 0-1 .45-1 1V22c0 .55-.45 1-1 1H2.007c-.55 0-1-.45-1-1V10.74c0-.28.113-.538.307-.732L11.312 1.25a1 1 0 011.378 0l10.007 8.76c.193.19.3.45.3.73V22c0 .55-.45 1-1 1z" />
          </svg>
        </button>

        {/* Search */}
        <button className="text-gray-400">
          <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Create */}
        <button className="text-gray-400">
          <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </button>

        {/* Reels */}
        <button className="text-gray-400">
          <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="4" />
            <path d="M2 12h20M12 2v20M7 2L2 7M17 2l5 5M2 17l5 5M17 22l5-5" />
          </svg>
        </button>

        {/* Profile */}
        <button className="w-6 h-6 rounded-full overflow-hidden border border-gray-500">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/images/magic/instagram-post.png')" }}
          />
        </button>
      </div>
    </div>
  );
}
