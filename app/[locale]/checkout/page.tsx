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
  Tag,
  Check,
  X,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { COUNTRIES } from "@/lib/constants/countries";
import CountrySelect from "@/components/ui/CountrySelect";
import { usdToKrw, USD_TO_KRW } from "@/lib/payments/toss";
import { createClient } from "@/lib/supabase/client";
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
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
      }) => { open: () => void };
    };
  }
}

type Track = "international" | "korea";

type SavedAddress = {
  id: string;
  name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string | null;
  postal: string | null;
  country: string;
  is_default: boolean;
};

interface AppliedDiscount {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  discountAmount: number;
}

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
  const appliedDiscountRef = useRef<AppliedDiscount | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [krwRate, setKrwRate] = useState(USD_TO_KRW);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingDetail, setShippingDetail] = useState("");
  const [shippingPostal, setShippingPostal] = useState("");
  // International shipping address
  const [intlName, setIntlName] = useState("");
  const [intlPhone, setIntlPhone] = useState("");
  const [intlLine1, setIntlLine1] = useState("");
  const [intlLine2, setIntlLine2] = useState("");
  const [intlCity, setIntlCity] = useState("");
  const [intlPostal, setIntlPostal] = useState("");
  const [intlCountry, setIntlCountry] = useState("");
  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveIntlAddress, setSaveIntlAddress] = useState(false);
  const [saveKrAddress, setSaveKrAddress] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsInput, setPointsInput] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
    try {
      const stored = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
      setItems(stored);
    } catch {
      setItems([]);
    }
    setMounted(true);
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d: { usd_to_krw: number }) => { if (d.usd_to_krw) setKrwRate(d.usd_to_krw); })
      .catch(() => {});

    // Auto-fill from user data and load saved addresses
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      if (user.email) setEmail(user.email);
      // 마일리지 잔액 로드
      fetch("/api/account/points")
        .then((r) => r.json())
        .then((d) => setPointsBalance(typeof d.balance === "number" ? d.balance : 0))
        .catch(() => { /* ignore */ });
      const meta = user.user_metadata?.default_address as Record<string, string> | undefined;

      // Load saved addresses; if found, use default; else fall back to metadata
      fetch("/api/shipping-addresses")
        .then((r) => r.json())
        .then((addresses: SavedAddress[]) => {
          if (!Array.isArray(addresses) || addresses.length === 0) {
            // Fall back to metadata address
            if (!meta?.line1) return;
            if (meta.country === "KR") {
              setTrack("korea");
              if (meta.name) setShippingName(meta.name);
              if (meta.phone) setShippingPhone(meta.phone);
              if (meta.postal) setShippingPostal(meta.postal);
              if (meta.line1) setShippingAddress(meta.line1);
              if (meta.line2) setShippingDetail(meta.line2);
            } else {
              setTrack("international");
              if (meta.name) setIntlName(meta.name);
              if (meta.phone) setIntlPhone(meta.phone);
              if (meta.line1) setIntlLine1(meta.line1);
              if (meta.line2) setIntlLine2(meta.line2);
              if (meta.city) setIntlCity(meta.city);
              if (meta.postal) setIntlPostal(meta.postal);
              if (meta.country) setIntlCountry(meta.country);
            }
            return;
          }
          setSavedAddresses(addresses);
          const def = addresses.find((a) => a.is_default) ?? addresses[0];
          if (def.country === "KR") {
            setTrack("korea");
            setShippingName(def.name);
            setShippingPhone(def.phone ?? "");
            setShippingPostal(def.postal ?? "");
            setShippingAddress(def.line1);
            setShippingDetail(def.line2 ?? "");
          } else {
            setTrack("international");
            setIntlName(def.name);
            setIntlPhone(def.phone ?? "");
            setIntlLine1(def.line1);
            setIntlLine2(def.line2 ?? "");
            setIntlCity(def.city ?? "");
            setIntlPostal(def.postal ?? "");
            setIntlCountry(def.country);
          }
        })
        .catch(() => {});
    }).catch(() => {});
  }, [params]);

  // Listen for Lemon Squeezy overlay success message
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.event === "Checkout.Success") {
        setLsSuccess(true);
        localStorage.removeItem("ml_cart");
        window.dispatchEvent(new Event("storage"));
        if (appliedDiscountRef.current?.id) {
          fetch("/api/discounts/use", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codeId: appliedDiscountRef.current.id }),
          }).catch(() => {});
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const SHIPPING_COSTS = { standard: 0, express: 15 } as const;
  const subtotalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
  const couponDiscountUsd = appliedDiscount?.discountAmount ?? 0;
  // 마일리지: 100P = $1. 쿠폰 차감 후 잔여 금액까지만, 보유 잔액까지만 사용 가능
  const afterCouponUsd = Math.max(0, subtotalUsd - couponDiscountUsd);
  const maxUsablePoints = Math.min(pointsBalance, Math.floor(afterCouponUsd * 100));
  const pointsUsed = Math.max(0, Math.min(parseInt(pointsInput, 10) || 0, maxUsablePoints));
  const pointsDiscountUsd = pointsUsed / 100;
  const discountedUsd = Math.max(0, subtotalUsd - couponDiscountUsd - pointsDiscountUsd);
  const shippingCostUsd = track === "international" ? SHIPPING_COSTS[shippingMethod] : 0;
  const totalUsd = discountedUsd + shippingCostUsd;
  const totalKrw = usdToKrw(discountedUsd, krwRate);

  function fillIntlFromSaved(addr: SavedAddress) {
    setIntlName(addr.name);
    setIntlPhone(addr.phone ?? "");
    setIntlLine1(addr.line1);
    setIntlLine2(addr.line2 ?? "");
    setIntlCity(addr.city ?? "");
    setIntlPostal(addr.postal ?? "");
    setIntlCountry(addr.country);
  }

  function fillKrFromSaved(addr: SavedAddress) {
    setShippingName(addr.name);
    setShippingPhone(addr.phone ?? "");
    setShippingPostal(addr.postal ?? "");
    setShippingAddress(addr.line1);
    setShippingDetail(addr.line2 ?? "");
  }

  function openDaumPostcode() {
    const open = () => {
      new window.daum!.Postcode({
        oncomplete(data) {
          setShippingPostal(data.zonecode);
          setShippingAddress(data.roadAddress || data.jibunAddress);
        },
      }).open();
    };
    if (window.daum?.Postcode) {
      open();
    } else {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = open;
      document.head.appendChild(script);
    }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, totalUsd: subtotalUsd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid code");
      } else {
        setAppliedDiscount(data);
        appliedDiscountRef.current = data;
        setCouponCode("");
      }
    } catch {
      setCouponError("네트워크 오류가 발생했습니다.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedDiscount(null);
    appliedDiscountRef.current = null;
    setCouponCode("");
    setCouponError("");
  }

  const validateEmail = () => {
    if (!email.trim()) { setLsError("이메일을 입력해주세요."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLsError("올바른 이메일 형식이 아닙니다."); return false; }
    return true;
  };

  const handleLemonPay = async () => {
    if (!validateEmail()) return;
    if (!intlName.trim() || !intlLine1.trim() || !intlCity.trim() || !intlCountry.trim()) {
      setLsError("배송지 정보를 입력해주세요. (성함, 주소, 도시, 국가 필수)");
      return;
    }
    setLsError("");
    setLsLoading(true);

    // Save address if requested
    if (saveIntlAddress && isLoggedIn) {
      await fetch("/api/shipping-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: intlName.trim(),
          phone: intlPhone.trim() || null,
          line1: intlLine1.trim(),
          line2: intlLine2.trim() || null,
          city: intlCity.trim(),
          postal: intlPostal.trim() || null,
          country: intlCountry.trim().toUpperCase(),
          set_default: savedAddresses.length === 0,
        }),
      }).catch(() => {});
    }

    try {
      const res = await fetch("/api/payment/lemon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerEmail: email,
          locale,
          discountAmount: appliedDiscount?.discountAmount ?? 0,
          discountCodeId: appliedDiscount?.id ?? null,
          discountCode: appliedDiscount?.code ?? null,
          pointsUsed,
          shippingMethod,
          shippingAddress: {
            name: intlName.trim(),
            phone: intlPhone.trim(),
            line1: intlLine1.trim(),
            line2: intlLine2.trim(),
            city: intlCity.trim(),
            postal: intlPostal.trim(),
            country: intlCountry.trim().toUpperCase(),
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLsError(data.error ?? "결제 세션 생성에 실패했습니다.");
        setLsLoading(false);
        return;
      }

      // Save pending order data for success page fallback
      try {
        sessionStorage.setItem("lemon_pending", JSON.stringify({
          items,
          customerEmail: email,
          totalUsd,
          shippingMethod,
          shippingAddress: {
            name: intlName.trim(), phone: intlPhone.trim(),
            line1: intlLine1.trim(), line2: intlLine2.trim(),
            city: intlCity.trim(), postal: intlPostal.trim(),
            country: intlCountry.trim().toUpperCase(),
          },
          discountCode: appliedDiscount?.code ?? null,
          discountCodeId: appliedDiscount?.id ?? null,
        }));
      } catch { /* ignore */ }

      // Open Lemon Squeezy overlay
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(data.url);
      } else {
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

              {/* Coupon Code */}
              <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
                <span className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-2 block">
                  할인 코드 (선택)
                </span>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-[#10B98122] border border-[#10B98144] rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981]" />
                      <span className="text-sm font-mono font-bold text-[#10B981]">
                        {appliedDiscount.code}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">
                        (−${appliedDiscount.discountAmount.toFixed(2)})
                      </span>
                    </div>
                    <button onClick={removeCoupon}>
                      <X className="w-4 h-4 text-[#9CA3AF] hover:text-[#EF4444] transition-colors" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      placeholder="MAGIC20"
                      className="flex-1 bg-[#13131F] border border-[#2D2D4E] text-[#F0E6FF] text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-[#4B5563] font-mono"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: "#1A1A2E", color: "#A855F7", border: "1px solid #2D2D4E" }}
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                      Apply
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-[#EF4444] mt-1.5">{couponError}</p>
                )}
              </div>

              {/* Mileage (points) */}
              {isLoggedIn && pointsBalance > 0 && (
                <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">마일리지 사용 (선택)</span>
                    <span className="text-xs text-[#9CA3AF]">보유 <b className="text-[#A855F7]">{pointsBalance.toLocaleString()}P</b> (100P = $1)</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxUsablePoints}
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-[#13131F] border border-[#2D2D4E] text-[#F0E6FF] text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-[#4B5563]"
                    />
                    <button
                      onClick={() => setPointsInput(String(maxUsablePoints))}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                      style={{ background: "#1A1A2E", color: "#A855F7", border: "1px solid #2D2D4E" }}
                    >
                      전액
                    </button>
                  </div>
                  {pointsUsed > 0 && (
                    <p className="text-xs text-[#10B981] mt-1.5">−${pointsDiscountUsd.toFixed(2)} 할인 ({pointsUsed.toLocaleString()}P 사용)</p>
                  )}
                  {pointsBalance > 0 && maxUsablePoints < pointsBalance && (
                    <p className="text-xs text-[#6B7280] mt-1">결제 금액 한도까지 최대 {maxUsablePoints.toLocaleString()}P 사용 가능</p>
                  )}
                </div>
              )}

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

                    {/* Shipping method selection */}
                    <div>
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                        Shipping Method
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["standard", "express"] as const).map((method) => {
                          const isSelected = shippingMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setShippingMethod(method)}
                              className="text-left rounded-lg border px-3 py-2.5 transition-all"
                              style={{
                                background: isSelected ? "#7C3AED15" : "#13131F",
                                borderColor: isSelected ? "#7C3AED" : "#2D2D4E",
                              }}
                            >
                              <p className="text-xs font-semibold" style={{ color: isSelected ? "#A855F7" : "#F0E6FF" }}>
                                {method === "standard" ? "Standard" : "Express"}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                                {method === "standard"
                                  ? "EMS · 7–20 business days"
                                  : "DHL / FedEx · 3–7 business days"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* International Shipping Address */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        Shipping Address
                      </p>

                      {/* Saved address selector */}
                      {savedAddresses.filter((a) => a.country !== "KR").length > 0 && (
                        <div className="space-y-1.5 mb-1">
                          <p className="text-[11px] text-[#6B7280]">저장된 배송지에서 선택:</p>
                          {savedAddresses.filter((a) => a.country !== "KR").map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => fillIntlFromSaved(addr)}
                              className="w-full text-left rounded-lg border px-3 py-2 text-xs transition-all hover:border-[#7C3AED]/60"
                              style={{
                                background: intlLine1 === addr.line1 && intlCountry === addr.country ? "#7C3AED15" : "#13131F",
                                borderColor: intlLine1 === addr.line1 && intlCountry === addr.country ? "#7C3AED" : "#2D2D4E",
                              }}
                            >
                              <span className="font-medium text-[#F0E6FF]">{addr.name}</span>
                              {addr.is_default && (
                                <span className="ml-2 text-[10px] text-[#A855F7]">기본</span>
                              )}
                              <p className="text-[#9CA3AF] mt-0.5 truncate">
                                {addr.line1}{addr.city ? `, ${addr.city}` : ""} · {COUNTRIES.find((c) => c.code === addr.country)?.name ?? addr.country}
                              </p>
                            </button>
                          ))}
                          <p className="text-[11px] text-[#4B5563] pt-1">또는 새 주소 입력:</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Full name *"
                          value={intlName}
                          onChange={(e) => setIntlName(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder="Phone (optional)"
                          value={intlPhone}
                          onChange={(e) => setIntlPhone(e.target.value)}
                          className="bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <CountrySelect
                          value={intlCountry}
                          onChange={(c) => setIntlCountry(c.code)}
                          placeholder="국가 선택 *"
                          required
                        />
                        <input
                          placeholder="Address line 1 *"
                          value={intlLine1}
                          onChange={(e) => setIntlLine1(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder="Address line 2 (optional)"
                          value={intlLine2}
                          onChange={(e) => setIntlLine2(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder="City *"
                          value={intlCity}
                          onChange={(e) => setIntlCity(e.target.value)}
                          className="bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder="Postal code"
                          value={intlPostal}
                          onChange={(e) => setIntlPostal(e.target.value)}
                          className="bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                      </div>

                      {/* Save address checkbox */}
                      {isLoggedIn && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={saveIntlAddress}
                            onChange={(e) => setSaveIntlAddress(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-[#2D2D4E] bg-[#13131F] accent-[#7C3AED]"
                          />
                          {saveIntlAddress
                            ? <BookmarkCheck className="w-3.5 h-3.5 text-[#A855F7]" />
                            : <Bookmark className="w-3.5 h-3.5 text-[#6B7280]" />}
                          <span className="text-xs text-[#9CA3AF]">이 주소 저장하기</span>
                        </label>
                      )}
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
                      <span className="ml-2 text-[#4B5563]">(≈ ${totalUsd.toLocaleString()} USD · 환율 {krwRate.toLocaleString()}원 기준)</span>
                    </div>

                    {/* 배송지 입력 */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">배송지 정보</p>

                      {/* Saved KR address selector */}
                      {savedAddresses.filter((a) => a.country === "KR").length > 0 && (
                        <div className="space-y-1.5 mb-1">
                          <p className="text-[11px] text-[#6B7280]">저장된 배송지에서 선택:</p>
                          {savedAddresses.filter((a) => a.country === "KR").map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => fillKrFromSaved(addr)}
                              className="w-full text-left rounded-lg border px-3 py-2 text-xs transition-all hover:border-[#7C3AED]/60"
                              style={{
                                background: shippingAddress === addr.line1 ? "#7C3AED15" : "#13131F",
                                borderColor: shippingAddress === addr.line1 ? "#7C3AED" : "#2D2D4E",
                              }}
                            >
                              <span className="font-medium text-[#F0E6FF]">{addr.name}</span>
                              {addr.is_default && <span className="ml-2 text-[10px] text-[#A855F7]">기본</span>}
                              <p className="text-[#9CA3AF] mt-0.5 truncate">{addr.line1} {addr.line2 ?? ""}</p>
                            </button>
                          ))}
                          <p className="text-[11px] text-[#4B5563] pt-1">또는 새 주소 입력:</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="받는 분 성함"
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder="연락처"
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <div className="col-span-2 flex gap-2">
                          <input
                            placeholder="우편번호"
                            value={shippingPostal}
                            readOnly
                            className="flex-1 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                          />
                          <button
                            type="button"
                            onClick={openDaumPostcode}
                            className="px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
                          >
                            주소 찾기
                          </button>
                        </div>
                        <input
                          placeholder="주소"
                          value={shippingAddress}
                          readOnly
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder="상세 주소 (동/호수 등)"
                          value={shippingDetail}
                          onChange={(e) => setShippingDetail(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                      </div>

                      {/* Save KR address checkbox */}
                      {isLoggedIn && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={saveKrAddress}
                            onChange={(e) => setSaveKrAddress(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-[#2D2D4E] bg-[#13131F] accent-[#7C3AED]"
                          />
                          {saveKrAddress
                            ? <BookmarkCheck className="w-3.5 h-3.5 text-[#A855F7]" />
                            : <Bookmark className="w-3.5 h-3.5 text-[#6B7280]" />}
                          <span className="text-xs text-[#9CA3AF]">이 주소 저장하기</span>
                        </label>
                      )}
                    </div>

                    <TossPaymentWidget
                      amountKrw={totalKrw}
                      locale={locale}
                      email={email}
                      items={items}
                      totalUsd={totalUsd}
                      pointsUsed={pointsUsed}
                      shippingAddress={shippingName ? {
                        name: shippingName,
                        phone: shippingPhone,
                        line1: shippingAddress,
                        line2: shippingDetail,
                        postal_code: shippingPostal,
                        country: "KR",
                      } : undefined}
                      onBeforePay={saveKrAddress && isLoggedIn && shippingAddress ? async () => {
                        await fetch("/api/shipping-addresses", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: shippingName,
                            phone: shippingPhone || null,
                            line1: shippingAddress,
                            line2: shippingDetail || null,
                            postal: shippingPostal || null,
                            country: "KR",
                            set_default: savedAddresses.filter((a) => a.country === "KR").length === 0,
                          }),
                        });
                      } : undefined}
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
                    <span className="text-[#F0E6FF]">${subtotalUsd.toLocaleString()}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#10B981]">할인 ({appliedDiscount.code})</span>
                      <span className="text-[#10B981]">−${appliedDiscount.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {track === "korea" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9CA3AF]">소계 (KRW)</span>
                      <span className="text-[#F0E6FF]">{totalKrw.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">배송비</span>
                    <span className="text-[#9CA3AF]">
                      {track === "international"
                        ? shippingCostUsd === 0
                          ? "무료 (EMS)"
                          : `$${shippingCostUsd} (DHL/FedEx)`
                        : "무료 (국내)"}
                    </span>
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
