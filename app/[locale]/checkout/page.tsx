"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
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
import { useCheckoutState } from "@/hooks/useCheckoutState";

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

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CheckoutPage({ params }: Props) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const {
    locale,
    items,
    mounted,
    track,
    setTrack,
    email,
    setEmail,
    lsLoading,
    lsError,
    setLsError,
    lsSuccess,
    lsScriptReady,
    couponCode,
    setCouponCode,
    couponLoading,
    couponError,
    setCouponError,
    appliedDiscount,
    myCoupons,
    krwRate,
    shippingMethod,
    setShippingMethod,
    shippingName,
    setShippingName,
    shippingPhone,
    setShippingPhone,
    shippingAddress,
    setShippingAddress,
    shippingDetail,
    setShippingDetail,
    shippingPostal,
    intlName,
    setIntlName,
    intlPhone,
    setIntlPhone,
    intlLine1,
    setIntlLine1,
    intlLine2,
    setIntlLine2,
    intlCity,
    setIntlCity,
    intlPostal,
    setIntlPostal,
    intlCountry,
    setIntlCountry,
    savedAddresses,
    saveIntlAddress,
    setSaveIntlAddress,
    saveKrAddress,
    setSaveKrAddress,
    isLoggedIn,
    pointsBalance,
    pointsInput,
    setPointsInput,
    subtotalUsd,
    couponDiscountUsd,
    canRedeemPoints,
    maxUsablePoints,
    pointsUsed,
    pointsDiscountUsd,
    shippingCostUsd,
    totalUsd,
    totalKrw,
    fillIntlFromSaved,
    fillKrFromSaved,
    openDaumPostcode,
    applyCoupon,
    removeCoupon,
    handleLemonPay,
  } = useCheckoutState(params, t);

  if (!mounted) return null;

  if (items.length === 0 && !lsSuccess) {
    return (
      <div className="min-h-screen bg-[#0D0D1A] pt-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-14 h-14 mx-auto mb-4 text-[#4B5563]" />
          <p className="text-[#9CA3AF] mb-6">{tc("empty")}</p>
          <Link href={`/${locale}/products`} className="text-sm text-[#A855F7] hover:text-[#C084FC]">
            ← {tc("browseProducts")}
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
            {t("successTitle")}
          </h1>
          <p className="text-[#9CA3AF] mb-6">{t("successBody")}</p>
          <Link href={`/${locale}/account`} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold px-6 py-3 rounded-xl">
            {t("viewMyOrders")}
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
              {t("title")}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Payment */}
            <div className="lg:col-span-3 space-y-5">

              {/* Track Selector */}
              <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-1.5 flex gap-1.5">
                {(["international", "korea"] as Track[]).map((tk) => (
                  <button
                    key={tk}
                    onClick={() => setTrack(tk)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      track === tk
                        ? "bg-[#7C3AED] text-white shadow-lg"
                        : "text-[#9CA3AF] hover:text-[#F0E6FF]"
                    }`}
                  >
                    {tk === "international" ? (
                      <><Globe className="w-4 h-4" /> {t("tabInternational")}</>
                    ) : (
                      <><MapPin className="w-4 h-4" /> {t("tabKorea")}</>
                    )}
                  </button>
                ))}
              </div>

              {/* Email (shared) */}
              <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
                <label className="block">
                  <span className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1.5 block">
                    {t("emailLabel")}
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
                  {t("couponLabel")}
                </span>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-[#10B98122] border border-[#10B98144] rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981]" />
                      <span className="text-sm font-bold text-[#10B981]">
                        {appliedDiscount.name ?? appliedDiscount.code}
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
                  <div className="space-y-2">
                    {myCoupons.length > 0 && (
                      <select
                        value=""
                        disabled={couponLoading}
                        onChange={(e) => { if (e.target.value) applyCoupon(e.target.value); }}
                        className="w-full bg-[#13131F] border border-[#7C3AED]/40 text-[#F0E6FF] text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors disabled:opacity-50"
                      >
                        <option value="">{t("selectCoupon")}</option>
                        {myCoupons.map((c) => {
                          // 사용 불가 쿠폰도 보이되 비활성화(사유 표시): 최소주문 미달 / 대상 상품 없음.
                          const minOk = subtotalUsd >= (c.min_order_usd ?? 0);
                          const targetOk = c.product_ids == null || c.product_ids.some((id) => items.some((i) => i.id === id));
                          const usable = minOk && targetOk;
                          const reason = !minOk ? ` · ${t("couponMinOrderShort")} $${c.min_order_usd}` : !targetOk ? ` · ${t("couponNotApplicable")}` : "";
                          const discountStr = c.type === "fixed" ? `$${c.value} OFF` : `${c.value}% OFF`;
                          const label = c.name ? `${c.name} · ${discountStr}` : `${discountStr} · ${c.code}`;
                          return (
                            <option key={c.id} value={c.code} disabled={!usable}>
                              {label}{reason}
                            </option>
                          );
                        })}
                      </select>
                    )}
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
                        onClick={() => applyCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ background: "#1A1A2E", color: "#A855F7", border: "1px solid #2D2D4E" }}
                      >
                        {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                        Apply
                      </button>
                    </div>
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
                    <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">{t("mileageLabel")}</span>
                    <span className="text-xs text-[#9CA3AF]">{t("balanceLabel")} <b className="text-[#A855F7]">{pointsBalance.toLocaleString()}P</b> (100P = $1)</span>
                  </div>
                  {!canRedeemPoints ? (
                    <p className="text-xs text-[#6B7280]">{t("pointsMinNotice")}</p>
                  ) : (
                  <>
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
                      {t("useAll")}
                    </button>
                  </div>
                  {pointsUsed > 0 && (
                    <p className="text-xs text-[#10B981] mt-1.5">{t("pointsDiscount", { usd: pointsDiscountUsd.toFixed(2), points: pointsUsed.toLocaleString() })}</p>
                  )}
                  {maxUsablePoints < pointsBalance && (
                    <p className="text-xs text-[#6B7280] mt-1">{t("pointsLimit", { points: maxUsablePoints.toLocaleString() })}</p>
                  )}
                  </>
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
                      <h2 className="text-sm font-semibold text-[#F0E6FF] mb-1">{t("intlTitle")}</h2>
                      <p className="text-xs text-[#9CA3AF]">
                        {t("intlDesc")}
                      </p>
                    </div>

                    {/* Shipping method selection */}
                    <div>
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                        {t("shippingMethod")}
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
                                {method === "standard" ? t("standard") : t("express")}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
                                {method === "standard" ? t("standardDesc") : t("expressDesc")}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* International Shipping Address */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                        {t("shippingAddressLabel")}
                      </p>

                      {/* Saved address selector */}
                      {savedAddresses.filter((a) => a.country !== "KR").length > 0 && (
                        <div className="space-y-1.5 mb-1">
                          <p className="text-[11px] text-[#6B7280]">{t("savedSelect")}</p>
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
                                <span className="ml-2 text-[10px] text-[#A855F7]">{t("defaultBadge")}</span>
                              )}
                              <p className="text-[#9CA3AF] mt-0.5 truncate">
                                {addr.line1}{addr.city ? `, ${addr.city}` : ""} · {COUNTRIES.find((c) => c.code === addr.country)?.name ?? addr.country}
                              </p>
                            </button>
                          ))}
                          <p className="text-[11px] text-[#4B5563] pt-1">{t("orNewAddress")}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder={t("phName")}
                          value={intlName}
                          onChange={(e) => setIntlName(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder={t("phPhone")}
                          value={intlPhone}
                          onChange={(e) => setIntlPhone(e.target.value)}
                          className="bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <CountrySelect
                          value={intlCountry}
                          onChange={(c) => setIntlCountry(c.code)}
                          placeholder={t("phCountry")}
                          required
                        />
                        <input
                          placeholder={t("phLine1")}
                          value={intlLine1}
                          onChange={(e) => setIntlLine1(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder={t("phLine2")}
                          value={intlLine2}
                          onChange={(e) => setIntlLine2(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder={t("phCity")}
                          value={intlCity}
                          onChange={(e) => setIntlCity(e.target.value)}
                          className="bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder={t("phPostal")}
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
                          <span className="text-xs text-[#9CA3AF]">{t("saveThisAddress")}</span>
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
                      {lsLoading ? t("processing") : t("payNow", { amount: `$${totalUsd.toLocaleString()} USD` })}
                    </button>

                    <p className="text-center text-[11px] text-[#4B5563]">
                      {t("poweredBy")}
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
                      <h2 className="text-sm font-semibold text-[#F0E6FF] mb-1">{t("krTitle")}</h2>
                      <p className="text-xs text-[#9CA3AF]">
                        {t("krDesc")}
                      </p>
                    </div>

                    <div className="text-xs text-[#6B7280] bg-[#13131F] rounded-lg px-3 py-2">
                      {t("krAmountLabel")} <span className="text-[#F59E0B] font-semibold">{totalKrw.toLocaleString()}원</span>
                      <span className="ml-2 text-[#4B5563]">{t("exchangeNote", { usd: totalUsd.toLocaleString(), rate: krwRate.toLocaleString() })}</span>
                    </div>

                    {/* 배송지 입력 */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">{t("krShippingLabel")}</p>

                      {/* Saved KR address selector */}
                      {savedAddresses.filter((a) => a.country === "KR").length > 0 && (
                        <div className="space-y-1.5 mb-1">
                          <p className="text-[11px] text-[#6B7280]">{t("savedSelect")}</p>
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
                              {addr.is_default && <span className="ml-2 text-[10px] text-[#A855F7]">{t("defaultBadge")}</span>}
                              <p className="text-[#9CA3AF] mt-0.5 truncate">{addr.line1} {addr.line2 ?? ""}</p>
                            </button>
                          ))}
                          <p className="text-[11px] text-[#4B5563] pt-1">{t("orNewAddress")}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder={t("phRecipient")}
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder={t("phPhoneKr")}
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <div className="col-span-2 flex gap-2">
                          <input
                            placeholder={t("phPostalKr")}
                            value={shippingPostal}
                            readOnly
                            className="flex-1 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                          />
                          <button
                            type="button"
                            onClick={openDaumPostcode}
                            className="px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
                          >
                            {t("findAddress")}
                          </button>
                        </div>
                        <input
                          placeholder={t("phAddress")}
                          value={shippingAddress}
                          readOnly
                          className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
                        />
                        <input
                          placeholder={t("phAddressDetail")}
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
                          <span className="text-xs text-[#9CA3AF]">{t("saveThisAddress")}</span>
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
                      couponDiscount={couponDiscountUsd}
                      shippingUsd={shippingCostUsd}
                      referralCode={appliedDiscount?.kind === "referral" ? appliedDiscount.code : null}
                      discountCode={appliedDiscount?.kind === "discount" ? appliedDiscount.code : null}
                      couponCode={appliedDiscount?.kind === "coupon" ? appliedDiscount.code : null}
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
                <h2 className="text-sm font-semibold text-[#F0E6FF] mb-4">{t("orderSummary")}</h2>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.option_id ?? ""}`} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#13131F] border border-[#2D2D4E] flex items-center justify-center shrink-0">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#7C3AED]/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F0E6FF] line-clamp-1">{item.name}</p>
                        {item.option_name && !item.option_id && <p className="text-[11px] text-[#A855F7] line-clamp-1">{item.option_name}</p>}
                        <p className="text-[11px] text-[#9CA3AF]">{t("qty", { n: item.quantity })}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#F0E6FF] shrink-0">
                        ${(item.price_usd * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2D2D4E] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">{t("subtotalUsdLabel")}</span>
                    <span className="text-[#F0E6FF]">${subtotalUsd.toLocaleString()}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#10B981]">{t("discountLabel")} ({appliedDiscount.name ?? appliedDiscount.code})</span>
                      <span className="text-[#10B981]">−${appliedDiscount.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {track === "korea" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9CA3AF]">{t("subtotalKrwLabel")}</span>
                      <span className="text-[#F0E6FF]">{totalKrw.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9CA3AF]">{t("shippingFeeLabel")}</span>
                    <span className="text-[#9CA3AF]">
                      {track === "international"
                        ? shippingCostUsd === 0
                          ? t("freeEms")
                          : `$${shippingCostUsd} (DHL/FedEx)`
                        : t("freeDomestic")}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#2D2D4E] pt-4 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#F0E6FF]">{t("totalLabel")}</span>
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
