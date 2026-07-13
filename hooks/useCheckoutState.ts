"use client";

import { useState, useEffect, useRef } from "react";
import { usdToKrw, USD_TO_KRW } from "@/lib/payments/toss";
import { MIN_REDEEM_POINTS } from "@/lib/points";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/payments/types";
import { readCheckoutItems, removePaidItemsFromCart } from "@/lib/cart-storage";

export type Track = "international" | "korea";

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
  name?: string | null;
  kind?: "discount" | "referral" | "coupon";
  type: "percent" | "fixed";
  value: number;
  discountAmount: number;
}

interface MyCoupon {
  id: string;
  code: string;
  name: string | null;
  type: "percent" | "fixed";
  value: number;
  min_order_usd: number;
  expires_at: string | null;
  product_ids: string[] | null; // 상품 한정 시 적용 가능 product_id 목록 (null = 전체)
}

export interface CheckoutStateReturn {
  locale: string;
  items: CartItem[];
  mounted: boolean;
  track: Track;
  setTrack: (track: Track) => void;
  email: string;
  setEmail: (email: string) => void;
  lsLoading: boolean;
  lsError: string;
  setLsError: (error: string) => void;
  lsSuccess: boolean;
  lsScriptReadyRef: React.MutableRefObject<boolean>;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponLoading: boolean;
  couponError: string;
  setCouponError: (error: string) => void;
  appliedDiscount: AppliedDiscount | null;
  myCoupons: MyCoupon[];
  krwRate: number;
  shippingMethod: "standard" | "express";
  setShippingMethod: (method: "standard" | "express") => void;
  shippingName: string;
  setShippingName: (v: string) => void;
  shippingPhone: string;
  setShippingPhone: (v: string) => void;
  shippingAddress: string;
  setShippingAddress: (v: string) => void;
  shippingDetail: string;
  setShippingDetail: (v: string) => void;
  shippingPostal: string;
  intlName: string;
  setIntlName: (v: string) => void;
  intlPhone: string;
  setIntlPhone: (v: string) => void;
  intlLine1: string;
  setIntlLine1: (v: string) => void;
  intlLine2: string;
  setIntlLine2: (v: string) => void;
  intlCity: string;
  setIntlCity: (v: string) => void;
  intlPostal: string;
  setIntlPostal: (v: string) => void;
  intlCountry: string;
  setIntlCountry: (v: string) => void;
  savedAddresses: SavedAddress[];
  saveIntlAddress: boolean;
  setSaveIntlAddress: (v: boolean) => void;
  saveKrAddress: boolean;
  setSaveKrAddress: (v: boolean) => void;
  isLoggedIn: boolean;
  pointsBalance: number;
  pointsInput: string;
  setPointsInput: (v: string) => void;
  subtotalUsd: number;
  couponDiscountUsd: number;
  canRedeemPoints: boolean;
  maxUsablePoints: number;
  pointsUsed: number;
  pointsDiscountUsd: number;
  shippingCostUsd: number;
  totalUsd: number;
  totalKrw: number;
  fillIntlFromSaved: (addr: SavedAddress) => void;
  fillKrFromSaved: (addr: SavedAddress) => void;
  openDaumPostcode: () => void;
  applyCoupon: (codeArg?: string) => Promise<void>;
  removeCoupon: () => void;
  handleLemonPay: () => Promise<void>;
}

export function useCheckoutState(
  params: Promise<{ locale: string }>,
  t: (key: string, values?: Record<string, string | number>) => string,
): CheckoutStateReturn {
  const [locale, setLocale] = useState("en");
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [track, setTrack] = useState<Track>("international");
  const [email, setEmail] = useState("");
  const [lsLoading, setLsLoading] = useState(false);
  const [lsError, setLsError] = useState("");
  const [lsSuccess, setLsSuccess] = useState(false);
  const lsScriptReadyRef = useRef(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [myCoupons, setMyCoupons] = useState<MyCoupon[]>([]);
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
    // 결제 대상: 부분 선택(ml_checkout) 우선, 없으면 전체 장바구니
    setItems(readCheckoutItems() as CartItem[]);
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
      // 보유 쿠폰 로드(가입 환영쿠폰 자동발급 포함) — 적용 가능한 쿠폰 드롭다운용
      fetch("/api/account/coupons")
        .then((r) => r.json())
        .then((d) => setMyCoupons(Array.isArray(d.coupons) ? d.coupons : []))
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
        removePaidItemsFromCart(items);
        // 할인·레퍼럴 코드 사용횟수는 save-order(서버측)에서 멱등 처리한다.
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [items]);

  const SHIPPING_COSTS = { standard: 0, express: 15 } as const;
  const subtotalUsd = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
  const couponDiscountUsd = appliedDiscount?.discountAmount ?? 0;
  // 마일리지: 100P = $1. 쿠폰 차감 후 잔여 금액까지만, 보유 잔액까지만 사용 가능.
  // 단, 총 보유가 최소 사용 한도(MIN_REDEEM_POINTS=$5) 미만이면 사용 불가.
  const afterCouponUsd = Math.max(0, subtotalUsd - couponDiscountUsd);
  const canRedeemPoints = pointsBalance >= MIN_REDEEM_POINTS;
  const maxUsablePoints = canRedeemPoints ? Math.min(pointsBalance, Math.floor(afterCouponUsd * 100)) : 0;
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

  async function applyCoupon(codeArg?: string) {
    const code = (codeArg ?? couponCode).trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          totalUsd: subtotalUsd,
          items: items.map((i) => ({ id: i.id, price_usd: i.price_usd, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid code");
      } else {
        setAppliedDiscount(data);
        setCouponCode("");
      }
    } catch {
      setCouponError(t("errNetwork"));
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedDiscount(null);
    setCouponCode("");
    setCouponError("");
  }

  const validateEmail = () => {
    if (!email.trim()) { setLsError(t("errEmailRequired")); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLsError(t("errEmailInvalid")); return false; }
    return true;
  };

  const handleLemonPay = async () => {
    if (!validateEmail()) return;
    if (!intlName.trim() || !intlLine1.trim() || !intlCity.trim() || !intlCountry.trim()) {
      setLsError(t("errShipping"));
      return;
    }
    setLsError("");
    setLsLoading(true);

    // 적용된 코드 종류별로 결제에 전달할 필드 결정(할인/레퍼럴/개인쿠폰)
    const appliedKind = appliedDiscount?.kind;
    const appliedCode = appliedDiscount?.code ?? null;
    const fDiscountCode = appliedKind === "discount" ? appliedCode : null;
    const fDiscountCodeId = appliedKind === "discount" ? (appliedDiscount?.id ?? null) : null;
    const fReferralCode = appliedKind === "referral" ? appliedCode : null;
    const fCouponCode = appliedKind === "coupon" ? appliedCode : null;

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
          discountCodeId: fDiscountCodeId,
          discountCode: fDiscountCode,
          referralCode: fReferralCode,
          couponCode: fCouponCode,
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
        setLsError(data.error ?? t("errSession"));
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
          discountCode: fDiscountCode,
          discountCodeId: fDiscountCodeId,
          referralCode: fReferralCode,
          couponCode: fCouponCode,
          pointsSpent: data.pointsSpent ?? 0,
          pointsHoldRef: data.pointsHoldRef ?? null,
        }));
      } catch { /* ignore */ }

      // Open Lemon Squeezy overlay
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(data.url);
      } else {
        window.location.href = data.url;
      }
    } catch {
      setLsError(t("errNetwork"));
    } finally {
      setLsLoading(false);
    }
  };

  return {
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
    lsScriptReadyRef,
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
  };
}
