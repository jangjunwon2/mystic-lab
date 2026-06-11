"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { XCircle } from "lucide-react";

const COPY: Record<string, { title: string; body: string; back: string }> = {
  en: { title: "Payment Cancelled", body: "Your payment was not completed. No charges have been made.", back: "Return to Checkout" },
  ko: { title: "결제가 취소되었습니다", body: "결제가 완료되지 않았습니다. 청구된 금액이 없습니다.", back: "결제 페이지로 돌아가기" },
  ja: { title: "決済がキャンセルされました", body: "決済は完了していません。請求は発生していません。", back: "チェックアウトに戻る" },
  "zh-CN": { title: "支付已取消", body: "您的付款未完成。没有任何费用被收取。", back: "返回结账" },
  es: { title: "Pago cancelado", body: "Tu pago no se completó. No se ha realizado ningún cargo.", back: "Volver al pago" },
  fr: { title: "Paiement annulé", body: "Votre paiement n'a pas été finalisé. Aucun montant n'a été débité.", back: "Retour au paiement" },
  de: { title: "Zahlung abgebrochen", body: "Ihre Zahlung wurde nicht abgeschlossen. Es wurden keine Kosten berechnet.", back: "Zurück zur Kasse" },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CheckoutFailPage({ params }: Props) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-[#F0E6FF] mb-2">{c.title}</h1>
        <p className="text-[#9CA3AF] text-sm mb-8">{c.body}</p>
        <Link
          href={`/${locale}/checkout`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          {c.back}
        </Link>
      </div>
    </div>
  );
}
