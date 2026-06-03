"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Check } from "lucide-react";
import type { BundleView } from "@/app/[locale]/products/page";

interface Props {
  bundles: BundleView[];
  locale: string;
}

interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
  bundle_id?: string;
}

export default function BundlesSection({ bundles, locale }: Props) {
  const router = useRouter();
  const [addedId, setAddedId] = useState<string | null>(null);

  // 세트 구성 상품을 '할인 단가'로 장바구니에 담는다 (개별가 × (1-할인율))
  function addBundle(bundle: BundleView, goCheckout: boolean) {
    const factor = 1 - bundle.discount_percent / 100;
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
      for (const it of bundle.items) {
        const unit = Math.round(it.price_usd * factor * 100) / 100;
        const existing = cart.find((c) => c.id === it.id && c.bundle_id === bundle.id);
        if (existing) {
          existing.quantity += it.quantity;
          existing.price_usd = unit; // 세트 할인가 적용
        } else {
          cart.push({ id: it.id, slug: it.slug, name: it.name, price_usd: unit, quantity: it.quantity, bundle_id: bundle.id });
        }
      }
      localStorage.setItem("ml_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
    } catch { /* storage unavailable */ }

    if (goCheckout) {
      router.push(`/${locale}/checkout`);
    } else {
      setAddedId(bundle.id);
      setTimeout(() => setAddedId(null), 2000);
    }
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-1">
        <Package className="w-4 h-4 text-[#A855F7]" />
        <h2 className="text-xl font-semibold text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          {locale === "ko" ? "세트 상품" : "Bundles"}
        </h2>
      </div>
      <div className="w-12 h-px bg-[#7C3AED] mb-5" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {bundles.map((b) => (
          <div key={b.id} className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#F0E6FF]">{b.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#7C3AED22", color: "#A855F7" }}>
                {b.discount_percent}% OFF
              </span>
            </div>

            {/* 구성 상품 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {b.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 bg-[#13131F] rounded-lg px-2 py-1.5 border border-[#2D2D4E]">
                  <div className="w-7 h-7 rounded bg-[#0D0D1A] overflow-hidden flex items-center justify-center shrink-0">
                    {it.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.thumbnail_url} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-3.5 h-3.5 text-[#7C3AED]" />
                    )}
                  </div>
                  <span className="text-xs text-[#9CA3AF] max-w-[120px] truncate">
                    {it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}
                  </span>
                </div>
              ))}
            </div>

            {/* 가격 */}
            <div className="mt-auto flex items-end justify-between gap-3">
              <div>
                <span className="text-sm text-[#6B7280] line-through mr-2">${b.original.toFixed(2)}</span>
                <span className="text-xl font-bold text-[#A855F7]">${b.discounted.toFixed(2)}</span>
                <p className="text-xs text-[#10B981] mt-0.5">${(b.original - b.discounted).toFixed(2)} {locale === "ko" ? "절약" : "saved"}</p>
              </div>
              {b.soldOut ? (
                <span className="px-3 py-2 rounded-lg text-xs font-semibold shrink-0" style={{ background: "#2D2D4E", color: "#9CA3AF" }}>
                  {locale === "ko" ? "품절" : "Sold out"}
                </span>
              ) : (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => addBundle(b, false)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
                    style={{ background: "#1A1A2E", color: "#A855F7", borderColor: "#7C3AED66" }}
                  >
                    {addedId === b.id ? <Check className="w-4 h-4" /> : (locale === "ko" ? "담기" : "Add")}
                  </button>
                  <button
                    onClick={() => addBundle(b, true)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}
                  >
                    {locale === "ko" ? "바로 구매" : "Buy"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
