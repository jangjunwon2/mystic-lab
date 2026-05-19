"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  MapPin,
  ShoppingBag,
  Loader2,
  AlertCircle,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { usdToKrw } from "@/lib/payments/toss";
import type { CartItem } from "@/lib/payments/types";

// Lazy load Toss widget to avoid SSR issues
const TossPaymentWidget = dynamic(
  () => import("@/components/checkout/TossPaymentWidget"),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-[#1A1A2E] rounded-xl" /> }
);

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: { Open: (url: string) => void; Close: () => void };
      Setup: (cfg: { eventHandler: (e: { event: string }) => void }) => void;
    };
  }
}

type Track = "international" | "korea";

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CheckoutPage({ params }: Props) {
  const [locale, setLocale] = useState("en");
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [track, setTrack] = useState<Track>("international");
  const [email, setEmail] = useState("");
  const [lsLoading, setLsLoading] = useState(false);
  const [lsError, setLsError] = useState("");
  const [lsSuccess, setLsSuccess] = useState(false);
  const lsScriptReady = useRef(false);

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

  // Listen for Lemon Squeezy overlay success message
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.event === "Checkout.Success") {
        setLsSuccess(true);
        // Clear cart
        localStorage.removeItem("ml_cart");
        window.dispatchEvent(new Event("storage"));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const totalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
  const totalKrw = usdToKrw(totalUsd);

  const validateEmail = () => {
    if (!email.trim()) { setLsError("이메일을 입력해주세요."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLsError("올바른 이메일 형식이 아닙니다."); return false; }
    return true;
  };

  const handleLemonPay = async () => {
    if (!validateEmail()) return;
    setLsError("");
    setLsLoading(true);

    try {
      const res = await fetch("/api/payment/lemon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customerEmail: email, locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLsError(data.error ?? "결제 세션 생성에 실패했습니다.");
        setLsLoading(false);
        return;
      }

      // Open Lemon Squeezy overlay
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(data.url);
      } else {
        // Fallback: redirect
        window.location.href = data.url;
      }
    } catch {
      setLsError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLsLoading(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0 && !lsSuccess) {
    return (
      <div className="min-h-screen bg-[#0D0D1A] pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-14 h-14 mx-auto mb-4 text-[#4B5563]" />
          <p className="text-[#9CA3AF] mb-6">장바구니가 비어있습니다.</p>
          <Link href={`/${locale}/products`} className="text-sm text-[#A855F7] hover:text-[#C084FC]">
            ← 상품 보러가기
          </Link>
        </div>
      </div>
    );
  }

  if (lsSuccess) {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-[#F0E6FF] mb-3" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            결제 완료!
          </h1>
          <p className="text-[#9CA3AF] mb-6">주문이 확인됐습니다. 이메일로 영수증이 발송됩니다.</p>
          <Link href={`/${locale}/account`} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold px-6 py-3 rounded-xl">
            내 주문 확인
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Lemon Squeezy overlay script */}
      <Script
        src="https://assets.lemonsqueezy.com/lemon.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.createLemonSqueezy?.();
          lsScriptReady.current = true;
        }}
      />

      <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link href={`/${locale}/cart`} className="p-2 text-[#9CA3AF] hover:text-[#A855F7] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>
              결제
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Payment */}
            <div className="lg:col-span-3 space-y-5">

              {/* Track Selector */}
              <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-1.5 flex gap-1.5">
                {(["international", "korea"] as Track[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrack(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      track === t
                        ? "bg-[#7C3AED] text-white shadow-lg"
                        : "text-[#9CA3AF] hover:text-[#F0E6FF]"
                    }`}
                  >
                    {t === "international" ? (
                      <><Globe className="w-4 h-4" /> International</>
                    ) : (
                      <><MapPin className="w-4 h-4" /> 국내 결제</>
                    )}
                  </button>
                ))}
              </div>

              {/* Email (shared) */}
              <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
                <label className="block">
                  <span className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1.5 block">
                    이메일 주소
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLsError(""); }}
                    placeholder="you@example.com"
                    className="w-full bg-[#13131F] border border-[#2D2D4E] text-[#F0E6FF] text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-[#4B5563]"
                  />
                </label>
              </div>

              {/* Payment Section */}
              <AnimatePresence mode="wait">
                {track === "international" ? (
                  <motion.div
                    key="international"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5 space-y-4"
                  >
                    <div>
                      <h2 className="text-sm font-semibold text-[#F0E6FF] mb-1">International Payment</h2>
                      <p className="text-xs text-[#9CA3AF]">
                        Visa, Mastercard, PayPal, Apple Pay 등 — Lemon Squeezy 보안 결제
                      </p>
                    </div>

                    {lsError && (
                      <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-sm text-red-300">{lsError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleLemonPay}
                      disabled={lsLoading}
                      className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {lsLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CreditCard className="w-4 h-4" />}
                      {lsLoading ? "처리 중..." : `$${totalUsd.toLocaleString()} USD 결제하기`}
                    </button>

                    <p className="text-center text-[11px] text-[#4B5563]">
                      Powered by Lemon Squeezy · 135개국 결제 지원
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="korea"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5 space-y-4"
                  >
                    <div>
                      <h2 className="text-sm font-semibold text-[#F0E6FF] mb-1">국내 결제</h2>
                      <p className="text-xs text-[#9CA3AF]">
                        카드, 계좌이체, 간편결제 — 토스페이먼츠
                      </p>
                    </div>

                    <div className="text-xs text-[#6B7280] bg-[#13131F] rounded-lg px-3 py-2">
                      결제 금액: <span className="text-[#F59E0B] font-semibold">{totalKrw.toLocaleString()}원</span>
                      <span className="ml-2 text-[#4B5563]">(≈ ${totalUsd.toLocaleString()} USD · 환율 1,380원 기준)</span>
                    </div>

                    <TossPaymentWidget
                      amountKrw={totalKrw}
                      locale={locale}
                      email={email}
                      items={items}
                      totalUsd={totalUsd}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5 sticky top-24"
              >
                <h2 className="text-sm font-semibold text-[#F0E6FF] mb-4">주문 요약</h2>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#13131F] border border-[#2D2D4E] flex items-center justify-center shrink-0">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#7C3AED]/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F0E6FF] line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">수량 {item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#F0E6FF] shrink-0">
                        ${(item.price_usd * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2D2D4E] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">소계 (USD)</span>
                    <span className="text-[#F0E6FF]">${totalUsd.toLocaleString()}</span>
                  </div>
                  {track === "korea" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9CA3AF]">소계 (KRW)</span>
                      <span className="text-[#F0E6FF]">{totalKrw.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">배송비</span>
                    <span className="text-[#9CA3AF]">결제 시 확정</span>
                  </div>
                </div>

                <div className="border-t border-[#2D2D4E] pt-4 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#F0E6FF]">합계</span>
                    <span className="text-[#F59E0B] text-lg">
                      {track === "korea"
                        ? `${totalKrw.toLocaleString()}원`
                        : `$${totalUsd.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
