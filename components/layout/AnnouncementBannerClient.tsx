"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
}

interface Props {
  announcement: Announcement | null;
}

export default function AnnouncementBannerClient({ announcement }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    const key = `ml_announcement_dismissed_${announcement.id}`;
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [announcement]);

  if (!announcement || !visible) return null;

  function dismiss() {
    const key = `ml_announcement_dismissed_${announcement!.id}`;
    localStorage.setItem(key, "1");
    setVisible(false);
  }

  return (
    <div
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm text-center relative"
      style={{
        background: "linear-gradient(90deg, #7C3AED, #A855F7, #7C3AED)",
        color: "#fff",
      }}
    >
      <span>{announcement.message}</span>
      {announcement.link_url && (
        <a
          href={announcement.link_url}
          className="font-semibold underline decoration-dotted hover:no-underline transition-all"
          style={{ color: "#F59E0B" }}
        >
          {announcement.link_label ?? "Learn more"}
        </a>
      )}
      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
