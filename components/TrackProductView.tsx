"use client";

import { useEffect } from "react";

// 상품 조회수 기록. 동일 상품은 쿠키/sessionStorage로 24시간 중복 방지.
export default function TrackProductView({ productId, locale }: { productId: string; locale: string }) {
  useEffect(() => {
    try {
      const key = `ml_pv_${productId}_${new Date().toISOString().slice(0, 10)}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      fetch("/api/track/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locale }),
        keepalive: true,
      }).catch(() => { /* silent */ });
    } catch {
      /* SSR guard */
    }
  }, [productId, locale]);

  return null;
}
