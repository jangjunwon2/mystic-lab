"use client";

import { useState, useEffect, useRef } from "react";
import { loadPaymentWidget, ANONYMOUS } from "@tosspayments/payment-widget-sdk";
import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { Loader2, AlertCircle, CreditCard, Globe } from "lucide-react";

type PaymentMethodsWidget = Awaited<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]>>;

interface Props {
  token: string;
  locale: string;
  customerEmail: string;
  customerName: string;
  quotedPriceUsd: number;
  quotedPriceKrw: number | null;
  description: string;
}

export default function CustomOrderPayClient({
  token,
  locale,
  customerEmail,
  customerName,
  quotedPriceUsd,
  quotedPriceKrw,
  description,
}: Props) {
  const [tab, setTab] = useState<"toss" | "ls">(quotedPriceKrw ? "toss" : "ls");

  // ── Toss widget ──────────────────────────────────────────────────
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const methodsRef = useRef<PaymentMethodsWidget | null>(null);
  const [tossReady, setTossReady] = useState(false);
  const [tossLoading, setTossLoading] = useState(false);
  const [tossError, setTossError] = useState("");

  const clientKey =
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

  useEffect(() => {
    if (!quotedPriceKrw) return;
    let cancelled = false;
    async function init() {
      try {
        const widget = await loadPaymentWidget(clientKey, ANONYMOUS);
        if (cancelled) return;
        widgetRef.current = widget;
        methodsRef.current = await widget.renderPaymentMethods(
          "#co-toss-payment-method",
          { value: quotedPriceKrw! },
          { variantKey: "DEFAULT" }
        );
        await widget.renderAgreement("#co-toss-agreement", { variantKey: "AGREEMENT" });
        if (!cancelled) setTossReady(true);
      } catch (e) {
        console.error("Toss widget init error:", e);
        if (!cancelled) setTossError("결제 위젯을 불러오지 못했습니다.");
      }
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientKey, quotedPriceKrw]);

  async function handleTossPay() {
    if (!widgetRef.current || !quotedPriceKrw) return;
    setTossError("");
    setTossLoading(true);
    try {
      const orderId = `ML-CO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      await widgetRef.current.requestPayment({
        orderId,
        orderName: "Mystic Lab Custom Order",
        successUrl: `${window.location.origin}/${locale}/custom-order/pay/${token}`,
        failUrl: `${window.location.origin}/${locale}/custom-order/pay/${token}?toss_fail=1`,
        customerEmail,
        customerName: customerName || customerEmail,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "결제 중 오류가 발생했습니다.";
      if (!msg.includes("PAY_PROCESS_CANCELED")) setTossError(msg);
      setTossLoading(false);
    }
  }

  // ── LemonSqueezy ─────────────────────────────────────────────────
  const [lsLoading, setLsLoading] = useState(false);
  const [lsError, setLsError] = useState("");

  async function handleLsPay() {
    setLsLoading(true);
    setLsError("");
    try {
      const res = await fetch(`/api/payment/custom-order-checkout?token=${token}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setLsError(d.error ?? "결제 링크 생성 실패.");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLsError("결제 링크 생성 실패.");
    } finally {
      setLsLoading(false);
    }
  }

  const inputBase =
    "rounded-xl border px-4 py-2 text-sm outline-none focus:border-purple-500 transition-colors";
  const inputStyle = { background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" };

  return (
    <div className="space-y-6">
      {/* Order summary */}
      <div className="rounded-xl border p-5" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
          주문 내용
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#D1D5DB" }}>
          {description}
        </p>
      </div>

      {/* Amount */}
      <div
        className="rounded-xl border p-5 text-center"
        style={{ background: "#0D0D1A", borderColor: "#2D2D4E" }}
      >
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
          결제 금액
        </p>
        <p className="text-3xl font-bold" style={{ color: "#A855F7" }}>
          ${quotedPriceUsd.toFixed(2)} USD
        </p>
        {quotedPriceKrw && (
          <p className="text-base mt-1" style={{ color: "#F59E0B" }}>
            ₩{quotedPriceKrw.toLocaleString()} KRW
          </p>
        )}
      </div>

      {/* Tab selector */}
      {quotedPriceKrw && (
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "#13131F", border: "1px solid #2D2D4E" }}
        >
          <button
            onClick={() => setTab("toss")}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
            style={
              tab === "toss"
                ? { background: "#3182F6", color: "#fff" }
                : { color: "#9CA3AF" }
            }
          >
            <CreditCard className="w-4 h-4" />
            토스 (KRW)
          </button>
          <button
            onClick={() => setTab("ls")}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
            style={
              tab === "ls"
                ? { background: "#A855F7", color: "#fff" }
                : { color: "#9CA3AF" }
            }
          >
            <Globe className="w-4 h-4" />
            해외 결제 (USD)
          </button>
        </div>
      )}

      {/* Toss widget */}
      {tab === "toss" && quotedPriceKrw && (
        <div className="space-y-4">
          <div id="co-toss-payment-method" className="min-h-[200px]" />
          <div id="co-toss-agreement" />
          {tossError && (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-3 border"
              style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-sm" style={{ color: "#FCA5A5" }}>
                {tossError}
              </p>
            </div>
          )}
          <button
            onClick={handleTossPay}
            disabled={!tossReady || tossLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#3182F6", color: "#fff" }}
          >
            {(tossLoading || !tossReady) && <Loader2 className="w-4 h-4 animate-spin" />}
            {!tossReady ? "위젯 로딩 중…" : tossLoading ? "결제 처리 중…" : `₩${quotedPriceKrw.toLocaleString()} 결제하기`}
          </button>
        </div>
      )}

      {/* LemonSqueezy */}
      {tab === "ls" && (
        <div className="space-y-4">
          <div
            className="rounded-xl border p-4 text-sm"
            style={{ background: "#0D0D1A", borderColor: "#2D2D4E", color: "#9CA3AF" }}
          >
            해외 결제 (USD) — Visa, Mastercard, PayPal 등 지원.
            LemonSqueezy 보안 결제 페이지로 이동합니다.
          </div>
          {lsError && (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-3 border"
              style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-sm" style={{ color: "#FCA5A5" }}>
                {lsError}
              </p>
            </div>
          )}
          <button
            onClick={handleLsPay}
            disabled={lsLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#7C3AED,#A855F7)",
              color: "#fff",
            }}
          >
            {lsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {lsLoading ? "링크 생성 중…" : `$${quotedPriceUsd.toFixed(2)} 결제하기`}
          </button>
        </div>
      )}

      <p className="text-center text-xs" style={{ color: "#4B5563" }}>
        이 결제 링크는 회원님 전용입니다. 타인과 공유하지 마세요.
      </p>
    </div>
  );
}
