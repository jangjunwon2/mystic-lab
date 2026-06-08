"use client";

import { useEffect } from "react";

interface TrackProductViewProps {
  productId: string;
  locale: string;
  productSlug: string;
  productName: string;
  thumbnailUrl: string | null;
  priceUsd: number;
}

const RECENTLY_VIEWED_KEY = "ml_recently_viewed";
const MAX_ITEMS = 8;

export default function TrackProductView({
  productId,
  locale,
  productSlug,
  productName,
  thumbnailUrl,
  priceUsd,
}: TrackProductViewProps) {
  useEffect(() => {
    try {
      // 조회수 추적 (기존)
      const key = `ml_pv_${productId}_${new Date().toISOString().slice(0, 10)}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        fetch("/api/track/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, locale }),
          keepalive: true,
        }).catch(() => {});
      }

      // 최근 본 상품 localStorage 저장
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const existing: { id: string; slug: string; name: string; thumbnail: string | null; price: number }[] =
        raw ? JSON.parse(raw) : [];
      const filtered = existing.filter((p) => p.id !== productId);
      const updated = [
        { id: productId, slug: productSlug, name: productName, thumbnail: thumbnailUrl, price: priceUsd },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch {
      /* SSR / private browsing guard */
    }
  }, [productId, locale, productSlug, productName, thumbnailUrl, priceUsd]);

  return null;
}
