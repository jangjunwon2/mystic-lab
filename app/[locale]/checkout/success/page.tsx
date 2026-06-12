"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, BookOpen, ShoppingBag } from "lucide-react";
import type { CartItem } from "@/lib/payments/types";
import { removePaidItemsFromCart } from "@/lib/cart-storage";

function fireAnalyticsPurchase({ value, currency }: { value: number; currency: string }) {
  try {
    // GA4
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "purchase", {
        value,
        currency,
      });
    }
    // Meta Pixel
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).fbq) {
      (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Purchase", {
        value,
        currency,
      });
    }
  } catch { /* analytics errors should never break the UX */ }
}

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ gateway?: string; paymentKey?: string; orderId?: string; amount?: string }>;
}

export default function CheckoutSuccessPage({ params, searchParams }: Props) {
  const t = useTranslations("success");
  const [locale, setLocale] = useState("en");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const confirmedRef = useRef(false);

  useEffect(() => {
    async function handleSuccess() {
      // 중복 확정 방지 (StrictMode·재렌더·새로고침 직후 이중 호출 차단)
      if (confirmedRef.current) return;
      confirmedRef.current = true;
      const { locale: l } = await params;
      const sp = await searchParams;
      setLocale(l);

      const gateway = sp.gateway;

      let analyticsValue = 0;
      let paidItems: { id: string; option_id?: string }[] = [];

      if (gateway === "lemon") {
        // Read pending data saved before overlay opened
        let pending: {
          items: CartItem[];
          customerEmail: string;
          totalUsd: number;
          shippingMethod?: string;
          shippingAddress?: Record<string, string>;
          discountCode?: string | null;
          referralCode?: string | null;
          couponCode?: string | null;
          pointsSpent?: number;
          pointsHoldRef?: string | null;
        } | null = null;
        try {
          const raw = sessionStorage.getItem("lemon_pending");
          if (raw) pending = JSON.parse(raw);
        } catch { /* ignore */ }

        if (pending?.customerEmail && pending?.items?.length) {
          analyticsValue = pending.totalUsd ?? 0;
          paidItems = pending.items;
          const lemonRes = await fetch("/api/payment/lemon-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: pending.items,
              customerEmail: pending.customerEmail,
              totalUsd: pending.totalUsd,
              shippingMethod: pending.shippingMethod,
              shippingAddress: pending.shippingAddress,
              discountCode: pending.discountCode,
              referralCode: pending.referralCode,
              couponCode: pending.couponCode,
              pointsSpent: pending.pointsSpent,
              pointsHoldRef: pending.pointsHoldRef,
            }),
          }).catch(() => null);

          if (!lemonRes || !lemonRes.ok) {
            const errData = lemonRes ? await lemonRes.json().catch(() => ({})) : {};
            setStatus("error");
            setErrorMsg((errData as Record<string, string>).error ?? t("errConfirmFailed"));
            return;
          }

          sessionStorage.removeItem("lemon_pending");
        }
      }

      if (gateway === "toss") {
        // Confirm Toss payment server-side
        const { paymentKey, orderId, amount } = sp;
        if (!paymentKey || !orderId || !amount) {
          setStatus("error");
          setErrorMsg(t("errInvalidPayment"));
          return;
        }

        // Read cart data stored before redirect
        let pending: {
          items: unknown[];
          customerEmail: string;
          totalUsd: number;
          orderId: string;
          shippingAddress?: unknown;
          pointsUsed?: number;
          couponDiscount?: number;
          shippingUsd?: number;
          referralCode?: string | null;
          discountCode?: string | null;
          couponCode?: string | null;
        } | null = null;
        try {
          const raw = sessionStorage.getItem("toss_pending");
          if (raw) pending = JSON.parse(raw);
        } catch { /* ignore */ }

        analyticsValue = pending?.totalUsd ?? Number(amount) / 100;
        paidItems = (pending?.items ?? []) as { id: string; option_id?: string }[];

        const res = await fetch("/api/payment/toss-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            items: pending?.items ?? [],
            customerEmail: pending?.customerEmail ?? "",
            totalUsd: pending?.totalUsd ?? 0,
            shippingAddress: pending?.shippingAddress,
            pointsUsed: pending?.pointsUsed ?? 0,
            couponDiscount: pending?.couponDiscount ?? 0,
            shippingUsd: pending?.shippingUsd ?? 0,
            referralCode: pending?.referralCode ?? null,
            discountCode: pending?.discountCode ?? null,
            couponCode: pending?.couponCode ?? null,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setStatus("error");
          setErrorMsg((data as Record<string, string>).error ?? t("errConfirmFailed"));
          return;
        }

        sessionStorage.removeItem("toss_pending");
      }

      // 결제한 항목만 장바구니에서 제거 (부분 결제 지원) + ml_checkout 정리
      removePaidItemsFromCart(paidItems);

      // Fire purchase analytics events
      fireAnalyticsPurchase({ value: analyticsValue, currency: "USD" });

      setStatus("success");
    }

    handleSuccess();
  }, [params, searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mx-auto mb-4" />
          <p className="text-[#9CA3AF] text-sm">{t("confirming")}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-[#F0E6FF] mb-2">{t("errorTitle")}</h1>
          <p className="text-[#9CA3AF] text-sm mb-6">{errorMsg}</p>
          <Link
            href={`/${locale}/checkout`}
            className="inline-flex items-center gap-2 border border-[#2D2D4E] text-[#9CA3AF] hover:text-[#A855F7] text-sm px-6 py-3 rounded-xl transition-colors"
          >
            {t("retry")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-[#F0E6FF] mb-3"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {t("title")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-[#9CA3AF] text-sm leading-relaxed mb-8"
        >
          {t("body")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5 mb-8 text-left"
        >
          <p className="text-xs text-[#7C3AED] font-semibold uppercase tracking-wider mb-3">
            {t("nextSteps")}
          </p>
          <ul className="space-y-2">
            {[t("step1"), t("step2"), t("step3")].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[#9CA3AF]">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED]/20 text-[#A855F7] text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href={`/${locale}/account`}
            className="flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            {t("viewOrders")}
          </Link>
          <Link
            href={`/${locale}/products`}
            className="flex items-center gap-2 border border-[#2D2D4E] text-[#9CA3AF] hover:text-[#A855F7] hover:border-[#7C3AED] text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {t("continueShopping")}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
