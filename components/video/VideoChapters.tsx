"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

export interface VideoChapter {
  id: string;
  timestampSeconds: number;
  description: string;
}

interface Props {
  chapters: VideoChapter[];
  activeId: string | null;
  onSeek: (chapter: VideoChapter) => void;
}

export function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function VideoChapters({ chapters, activeId, onSeek }: Props) {
  const t = useTranslations("tutorial");

  if (chapters.length === 0) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: "#2D2D4E" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>
          {t("chaptersTitle")}
        </h3>
      </div>
      <ul>
        {chapters.map((chapter) => {
          const isActive = chapter.id === activeId;
          return (
            <li key={chapter.id}>
              <button
                type="button"
                onClick={() => onSeek(chapter)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
                style={{
                  background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                  borderLeft: isActive ? "2px solid #A855F7" : "2px solid transparent",
                }}
              >
                <span
                  className="flex items-center gap-1 shrink-0 font-mono text-xs px-2 py-1 rounded-md mt-0.5"
                  style={{ background: "#0D0D1A", color: isActive ? "#A855F7" : "#9CA3AF" }}
                >
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(chapter.timestampSeconds)}
                </span>
                <span className="text-sm" style={{ color: isActive ? "#F0E6FF" : "#9CA3AF" }}>
                  {chapter.description}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
