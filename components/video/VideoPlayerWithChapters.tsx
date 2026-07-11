"use client";

import { useState } from "react";
import CloudflarePlayer from "@/components/video/CloudflarePlayer";
import VideoChapters, { type VideoChapter } from "@/components/video/VideoChapters";

interface Props {
  src: string;
  title?: string;
  autoplay?: boolean;
  chapters: VideoChapter[];
}

export default function VideoPlayerWithChapters({ src, title, autoplay = false, chapters }: Props) {
  const [seek, setSeek] = useState<{ seconds: number; nonce: number } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleSeek(chapter: VideoChapter) {
    setSeek((prev) => ({ seconds: chapter.timestampSeconds, nonce: (prev?.nonce ?? 0) + 1 }));
    setActiveId(chapter.id);
  }

  return (
    <div className="space-y-4">
      <CloudflarePlayer src={src} title={title} autoplay={autoplay} seek={seek} />
      <VideoChapters chapters={chapters} activeId={activeId} onSeek={handleSeek} />
    </div>
  );
}
