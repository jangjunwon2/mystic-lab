"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { RECENTLY_VIEWED_KEY } from "@/lib/constants/storage-keys";

interface RecentItem {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  price: number;
}

export default function RecentlyViewed({ locale, currentProductId }: { locale: string; currentProductId: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  const t = useTranslations("products");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const valid = parsed.filter(
        (p): p is RecentItem =>
          typeof p === "object" && p !== null &&
          typeof (p as RecentItem).id === "string" &&
          typeof (p as RecentItem).slug === "string" &&
          typeof (p as RecentItem).name === "string" &&
          typeof (p as RecentItem).price === "number"
      );
      setItems(valid.filter((p) => p.id !== currentProductId).slice(0, 6));
    } catch {
      /* ignore */
    }
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2
        className="text-xl font-bold text-[#F0E6FF] mb-6"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {t("recentlyViewed")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${locale}/products/${item.slug}`}
            className="group block bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl overflow-hidden hover:border-[#7C3AED] transition-colors"
          >
            <div className="aspect-square bg-[#13131F] relative">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#2D2D4E] text-3xl">✦</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[#F0E6FF] text-xs font-medium truncate group-hover:text-[#A855F7] transition-colors">
                {item.name}
              </p>
              <p className="text-[#9CA3AF] text-xs mt-0.5">${item.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
