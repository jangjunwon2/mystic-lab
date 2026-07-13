"use client";

import { useState } from "react";
import VideoPlayerWithChapters from "./VideoPlayerWithChapters";
import InteractiveTutorialFeed from "../tutorial/InteractiveTutorialFeed";
import type { VideoChapter } from "./VideoChapters";
import { PlayCircle } from "lucide-react";

interface PlaylistItem {
  id: string;
  title: string | null;
  part_order: number;
  signedUrl: string | null;
  chapters: VideoChapter[];
}

interface TutorialPlaylistPlayerProps {
  productId: string;
  locale: string;
  currentUserId: string;
  hasPurchased: boolean;
  playlist: PlaylistItem[];
  name: string;
}

export default function TutorialPlaylistPlayer({
  productId,
  locale,
  currentUserId,
  hasPurchased,
  playlist,
  name,
}: TutorialPlaylistPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeVideo = playlist[activeIndex];

  // 팁/메모 피드에서 특정 파트의 타임스탬프를 클릭할 때의 강제 파트 이동 + 시간대 점프 핸들러
  const handleSeekToVideo = (videoId: string, seconds: number) => {
    const targetIdx = playlist.findIndex((v) => v.id === videoId);
    if (targetIdx !== -1) {
      setActiveIndex(targetIdx);
      // 스왑 마운트 딜레이를 감안하여 150ms 후 iframe에 postMessage 전달
      setTimeout(() => {
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
      }, 150);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!activeVideo) {
    return (
      <div className="text-center py-12 text-sm text-[#6B7280]">
        재생 가능한 해법 영상 정보가 존재하지 않습니다.
      </div>
    );
  }

  // 피드 라벨링용 파트 목록 매핑 정보 생성
  const videosListInfo = playlist.map((p) => ({
    id: p.id,
    title: p.title,
    part_order: p.part_order,
  }));

  return (
    <div className="space-y-6">
      {/* 1. 다중 비디오 재생목록 탭바 (2개 이상일 때만 노출) */}
      {playlist.length > 1 && (
        <div className="rounded-2xl p-4 bg-[#16162D] border border-[#2D2D4E] space-y-3">
          <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider px-1">
            재생목록 (총 {playlist.length}개 파트)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {playlist.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#7C3AED]/20 to-[#A855F7]/20 border-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                      : "bg-[#0D0D1A] border-[#2D2D4E] text-[#9CA3AF] hover:text-[#F0E6FF] hover:border-[#3D3D6C]"
                  }`}
                >
                  <PlayCircle className={`w-4 h-4 shrink-0 ${isActive ? "text-[#A855F7]" : "text-[#4B5563]"}`} />
                  <div className="truncate">
                    <span className="text-[10px] font-bold block opacity-70 mb-0.5">PART {item.part_order}</span>
                    <span className="truncate block font-semibold">{item.title || `파트 ${item.part_order} 해법 가이드`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 현재 선택된 활성 비디오 플레이어 */}
      <div className="relative">
        {activeVideo.signedUrl ? (
          <VideoPlayerWithChapters
            src={activeVideo.signedUrl}
            title={activeVideo.title ?? name}
            chapters={activeVideo.chapters}
            autoplay
          />
        ) : (
          <div className="rounded-2xl aspect-video bg-[#111124] border border-[#2D2D4E] flex items-center justify-center">
            <span className="text-sm text-[#6B7280]">비디오 소스 파일 준비 중…</span>
          </div>
        )}
      </div>

      {/* 3. 재생 연동 피드 컴포넌트 */}
      {hasPurchased && (
        <InteractiveTutorialFeed
          productId={productId}
          locale={locale}
          currentUserId={currentUserId}
          currentVideoId={activeVideo.id}
          onSeekToVideo={handleSeekToVideo}
          videos={videosListInfo}
        />
      )}
    </div>
  );
}
