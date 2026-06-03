"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Zap, ArrowLeft, Package } from "lucide-react";

interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
}

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CartPage({ params }: Props) {
  const ct = useTranslations("checkout");
  const ca = useTranslations("cart");
  const [locale, setLocale] = useState("en");
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
    try {
      const stored = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
      setItems(stored);
    } catch {
      setItems([]);
    }
    setMounted(true);
  }, [params]);

  const saveCart = (updated: CartItem[]) => {
    setItems(updated);
    localStorage.setItem("ml_cart", JSON.stringify(updated));
  };

  const updateQty = (id: string, delta: number) => {
    saveCart(
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const remove = (id: string) => {
    saveCart(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);

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
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0 }}
                    className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-4 flex items-center gap-4"
                  >
                    {/* Thumbnail placeholder */}
                    <div className="w-16 h-16 rounded-lg bg-[#13131F] border border-[#2D2D4E] flex items-center justify-center shrink-0">
                      <div className="w-6 h-6 rounded-full bg-[#7C3AED]/40 animate-pulse" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${locale}/products/${item.slug}`}
                        className="text-sm font-medium text-[#F0E6FF] hover:text-[#A855F7] transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-[#F59E0B] font-semibold mt-0.5">
                        ${item.price_usd.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-[#2D2D4E] text-[#9CA3AF] hover:bg-[#7C3AED]/30 hover:text-[#A855F7] text-sm font-bold transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium text-[#F0E6FF] w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, +1)}
                        className="w-7 h-7 rounded-lg bg-[#2D2D4E] text-[#9CA3AF] hover:bg-[#7C3AED]/30 hover:text-[#A855F7] text-sm font-bold transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-semibold text-[#F0E6FF] w-16 text-right shrink-0">
                      ${(item.price_usd * item.quantity).toLocaleString()}
                    </span>

                    <button
                      onClick={() => remove(item.id)}
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

                <Link
                  href={`/${locale}/checkout`}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                >
                  <Zap className="w-4 h-4" />
                  {ca("proceedToCheckout")}
                </Link>

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
