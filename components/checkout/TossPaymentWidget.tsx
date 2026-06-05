"use client";

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, ANONYMOUS } from "@tosspayments/payment-widget-sdk";
import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { Loader2, AlertCircle } from "lucide-react";

type PaymentMethodsWidget = Awaited<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]>>;

interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  postal_code: string;
  country: string;
}

interface Props {
  amountKrw: number;
  locale: string;
  email: string;
  items: { id: string; slug: string; name: string; price_usd: number; quantity: number }[];
  totalUsd: number;
  shippingAddress?: ShippingAddress;
  pointsUsed?: number;
  couponDiscount?: number;
  shippingUsd?: number;
  referralCode?: string | null;
  discountCode?: string | null;
  couponCode?: string | null;
  onBeforePay?: () => Promise<void>;
}

export default function TossPaymentWidget({ amountKrw, locale, email, items, totalUsd, shippingAddress, pointsUsed = 0, couponDiscount = 0, shippingUsd = 0, referralCode = null, discountCode = null, couponCode = null, onBeforePay }: Props) {
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const methodsRef = useRef<PaymentMethodsWidget | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

  // 위젯은 1회만 초기화한다. 금액 변경 시 재렌더하면 렌더 도중 결제 클릭이
  // "결제 UI가 아직 렌더링되지 않았습니다" 에러를 내므로, 금액은 아래 updateAmount로만 갱신한다.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const widget = await loadPaymentWidget(clientKey, ANONYMOUS);
        if (cancelled) return;

        widgetRef.current = widget;

        methodsRef.current = await widget.renderPaymentMethods(
          "#toss-payment-method",
          { value: amountKrw },
          { variantKey: "DEFAULT" }
        );
        await widget.renderAgreement("#toss-agreement", { variantKey: "AGREEMENT" });

        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Toss widget init error:", e);
        if (!cancelled) setError("결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    }

    init();
    return () => { cancelled = true; };
    // amountKrw는 의도적으로 의존성에서 제외(재렌더 방지) — 금액은 updateAmount로 갱신
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientKey]);

  // 금액(환율·쿠폰·포인트)이 바뀌면 위젯을 재생성하지 않고 금액만 갱신한다.
  useEffect(() => {
    methodsRef.current?.updateAmount(amountKrw);
  }, [amountKrw]);

  const handlePay = async () => {
    if (!widgetRef.current) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("이메일 주소를 올바르게 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    if (onBeforePay) await onBeforePay().catch(() => {});

    try {
      const orderId = `ML-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      // Store cart data in sessionStorage so success page can confirm
      sessionStorage.setItem(
        "toss_pending",
        JSON.stringify({ items, customerEmail: email, totalUsd, orderId, shippingAddress, pointsUsed, couponDiscount, shippingUsd, referralCode, discountCode, couponCode })
      );

      await widgetRef.current.requestPayment({
        orderId,
        orderName: `Mystic Lab Order (${items.length} item${items.length > 1 ? "s" : ""})`,
        successUrl: `${window.location.origin}/${locale}/checkout/success?gateway=toss`,
        failUrl: `${window.location.origin}/${locale}/checkout/fail`,
        customerEmail: email,
        customerName: "Mystic Lab Customer",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "결제 중 오류가 발생했습니다.";
      // Toss throws when user cancels — don't show error for user abort
      if (!msg.includes("PAY_PROCESS_CANCELED")) {
        setError(msg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toss renders payment methods here */}
      <div id="toss-payment-method" className="min-h-[200px]" />

      {/* Toss renders agreement checkbox here */}
      <div id="toss-agreement" />

      {error && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!ready || loading}
        className="w-full flex items-center justify-center gap-2 bg-[#3182F6] hover:bg-[#1B64DA] text-white text-sm font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading || !ready ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        {!ready ? "위젯 로딩 중..." : loading ? "결제 처리 중..." : `${amountKrw.toLocaleString()}원 결제하기`}
      </button>

      <p className="text-center text-[11px] text-[#4B5563]">
        토스페이먼츠 보안 결제 · SSL 암호화
      </p>
    </div>
  );
}
