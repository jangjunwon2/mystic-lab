"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Zap, ArrowLeft, Package } from "lucide-react";
import { setCheckoutItems } from "@/lib/cart-storage";
import { createClient } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
  option_id?: string;
  option_name?: string;
  thumbnail_url?: string;
}

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CartPage({ params }: Props) {
  const ct = useTranslations("checkout");
  const ca = useTranslations("cart");
  const router = useRouter();
  const [locale, setLocale] = useState("en");
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const syncedRef = useRef(false);

  const keyOf = (i: CartItem) => `${i.id}::${i.option_id ?? ""}`;

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
    let stored: CartItem[] = [];
    try {
      stored = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
      setItems(stored);
      setSelected(new Set(stored.map((i) => `${i.id}::${i.option_id ?? ""}`))); // 기본 전체 선택
    } catch {
      setItems([]);
    }
    setMounted(true);

    // 로그인 회원이면 서버에 장바구니 동기화 (background, fire-and-forget)
    if (!syncedRef.current && stored.length > 0) {
      syncedRef.current = true;
      const sb = createClient();
      sb.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stored),
          }).catch(() => {});
        }
      });
    }
  }, [params]);

  const saveCart = (updated: CartItem[]) => {
    setItems(updated);
    localStorage.setItem("ml_cart", JSON.stringify(updated));
    setSelected((prev) => {
      const validKeys = new Set(updated.map((i) => `${i.id}::${i.option_id ?? ""}`));
      return new Set([...prev].filter((k) => validKeys.has(k)));
    });
    window.dispatchEvent(new Event("storage"));
  };

  const toggleSelect = (item: CartItem) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(item);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(items.map(keyOf)));

  const selectedItems = items.filter((i) => selected.has(keyOf(i)));

  const checkoutSelected = () => {
    if (selectedItems.length === 0) return;
    setCheckoutItems(selectedItems);
    router.push(`/${locale}/checkout`);
  };

  // 같은 상품이라도 옵션이 다르면 별도 라인 → id + option_id 로 식별
  const matches = (item: CartItem, id: string, optionId: string) =>
    item.id === id && (item.option_id ?? "") === optionId;

  const updateQty = (id: string, optionId: string, delta: number) => {
    saveCart(
      items
        .map((item) =>
          matches(item, id, optionId) ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const remove = (id: string, optionId: string) => {
    saveCart(items.filter((item) => !matches(item, id, optionId)));
  };

  const subtotal = selectedItems.reduce((s, i) => s + i.price_usd * i.quantity, 0);
  const selectAllLabel = locale === "ko" ? "전체 선택" : "Select all";

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-6 h-6 text-[#7C3AED]" />
          <h1
            className="text-2xl font-bold text-[#F0E6FF]"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {ct("orderSummary")}
          </h1>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Package className="w-14 h-14 mx-auto mb-4 text-[#4B5563]" />
            <p className="text-[#9CA3AF] mb-6">{ca("empty")}</p>
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center gap-2 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {ca("browseProducts")}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {/* 전체 선택 */}
              <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#7C3AED]"
                />
                <span className="text-sm text-[#9CA3AF]">{selectAllLabel} ({selected.size}/{items.length})</span>
              </label>

              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.option_id ?? ""}`}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0 }}
                    className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-4 flex items-center gap-4"
                  >
                    {/* 선택 체크박스 */}
                    <input
                      type="checkbox"
                      checked={selected.has(keyOf(item))}
                      onChange={() => toggleSelect(item)}
                      className="w-4 h-4 accent-[#7C3AED] shrink-0"
                      aria-label={item.name}
                    />

                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-[#13131F] border border-[#2D2D4E] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#7C3AED]/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${locale}/products/${item.slug}`}
                        className="text-sm font-medium text-[#F0E6FF] hover:text-[#A855F7] transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      {/* 애드온 라인은 상품명과 옵션명이 동일 → 중복 표시 생략. 레거시 옵션만 표시. */}
                      {item.option_name && !item.option_id && (
                        <p className="text-xs text-[#A855F7] line-clamp-1">{item.option_name}</p>
                      )}
                      <p className="text-sm text-[#F59E0B] font-semibold mt-0.5">
                        ${item.price_usd.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, item.option_id ?? "", -1)}
                        className="w-7 h-7 rounded-lg bg-[#2D2D4E] text-[#9CA3AF] hover:bg-[#7C3AED]/30 hover:text-[#A855F7] text-sm font-bold transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium text-[#F0E6FF] w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.option_id ?? "", +1)}
                        className="w-7 h-7 rounded-lg bg-[#2D2D4E] text-[#9CA3AF] hover:bg-[#7C3AED]/30 hover:text-[#A855F7] text-sm font-bold transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-semibold text-[#F0E6FF] w-16 text-right shrink-0">
                      ${(item.price_usd * item.quantity).toLocaleString()}
                    </span>

                    <button
                      onClick={() => remove(item.id, item.option_id ?? "")}
                      className="ml-1 text-[#4B5563] hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {ca("continueShopping")}
              </Link>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-6 sticky top-24">
                <h2 className="text-base font-semibold text-[#F0E6FF] mb-5">
                  {ct("orderSummary")}
                </h2>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">{ct("subtotal")}</span>
                    <span className="text-[#F0E6FF]">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">{ct("shipping")}</span>
                    <span className="text-[#9CA3AF]">{ca("calculatedAtCheckout")}</span>
                  </div>
                </div>

                <div className="border-t border-[#2D2D4E] pt-4 mb-5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#F0E6FF]">{ct("total")}</span>
                    <span className="text-[#F59E0B] text-lg">${subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={checkoutSelected}
                  disabled={selectedItems.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  {ca("proceedToCheckout")}{selectedItems.length > 0 ? ` (${selectedItems.length})` : ""}
                </button>

                <p className="text-center text-[11px] text-[#4B5563] mt-3">
                  {ca("secureCheckout")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
