"use client";

import { useEffect } from "react";

// 하루 한 번만 방문 기록. sessionId = ml_sid_YYYY-MM-DD (localStorage)
export default function TrackVisit() {
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const key = `ml_sid_${today}`;
      let sid = localStorage.getItem(key);
      if (!sid) {
        // 기존 어제 키 정리 (불필요한 localStorage 축적 방지)
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("ml_sid_") && k !== key) localStorage.removeItem(k);
        }
        sid = `${today}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(key, sid);
        fetch("/api/track/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
          keepalive: true,
        }).catch(() => { /* silent */ });
      }
    } catch {
      /* localStorage 없는 환경(SSR guard) */
    }
  }, []);

  return null;
}
