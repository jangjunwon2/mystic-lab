import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { confirmTossPayment } from "@/lib/payments/toss";
import CustomOrderPayClient from "@/components/custom-order/CustomOrderPayClient";
import { CheckCircle, XCircle, Lock } from "lucide-react";

interface Props {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
    ls_success?: string;
    toss_fail?: string;
  }>;
}

export default async function CustomOrderPayPage({ params, searchParams }: Props) {
  const { locale, token } = await params;
  const sp = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = (await createAdminClient()) as any;

  const { data: order } = await admin
    .from("custom_order_requests")
    .select(
      "id, name, email, description, quoted_price_usd, quoted_price_krw, payment_status"
    )
    .eq("payment_token", token)
    .maybeSingle();

  // ── Invalid token ─────────────────────────────────────────────────
  if (!order || !order.quoted_price_usd) {
    return (
      <PageShell>
        <StatusCard
          icon={<XCircle className="w-12 h-12" style={{ color: "#EF4444" }} />}
          title="잘못된 결제 링크"
          message="유효하지 않은 결제 링크입니다. 관리자에게 문의해주세요."
        />
      </PageShell>
    );
  }

  // ── LemonSqueezy success (redirect from LS) ───────────────────────
  if (sp.ls_success === "1") {
    return (
      <PageShell>
        <StatusCard
          icon={<CheckCircle className="w-12 h-12" style={{ color: "#10B981" }} />}
          title="결제가 완료되었습니다"
          message="결제가 성공적으로 처리되었습니다. 확인 이메일을 보내드렸습니다. 주문 진행 상황은 이메일로 안내드리겠습니다."
        />
      </PageShell>
    );
  }

  // ── Already paid ─────────────────────────────────────────────────
  if (order.payment_status === "paid") {
    return (
      <PageShell>
        <StatusCard
          icon={<CheckCircle className="w-12 h-12" style={{ color: "#10B981" }} />}
          title="이미 결제된 주문"
          message="이 주문은 이미 결제가 완료되었습니다. 주문 진행 상황은 이메일로 안내드리겠습니다."
        />
      </PageShell>
    );
  }

  // ── Toss success — confirm server-side ───────────────────────────
  if (sp.paymentKey && sp.orderId && sp.amount) {
    const result = await confirmTossPayment(
      sp.paymentKey,
      sp.orderId,
      Number(sp.amount)
    );

    if (result.success) {
      await admin
        .from("custom_order_requests")
        .update({ payment_status: "paid", status: "in_progress" })
        .eq("payment_token", token)
        .eq("payment_status", "unpaid");

      return (
        <PageShell>
          <StatusCard
            icon={<CheckCircle className="w-12 h-12" style={{ color: "#10B981" }} />}
            title="결제가 완료되었습니다"
            message="결제가 성공적으로 처리되었습니다. 주문 진행 상황은 이메일로 안내드리겠습니다."
          />
        </PageShell>
      );
    }

    return (
      <PageShell>
        <StatusCard
          icon={<XCircle className="w-12 h-12" style={{ color: "#EF4444" }} />}
          title="결제 실패"
          message={result.error ?? "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요."}
        />
      </PageShell>
    );
  }

  // ── Toss fail redirect ────────────────────────────────────────────
  if (sp.toss_fail === "1") {
    return (
      <PageShell>
        <StatusCard
          icon={<XCircle className="w-12 h-12" style={{ color: "#EF4444" }} />}
          title="결제가 취소되었습니다"
          message="결제가 취소되었습니다. 다시 시도하시려면 뒤로 가세요."
          backToken={token}
          locale={locale}
        />
      </PageShell>
    );
  }

  // ── Payment page ─────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}
          >
            <Lock className="w-3 h-3" />
            보안 결제
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#F0E6FF", fontFamily: "var(--font-cinzel), serif" }}>
            Custom Order Payment
          </h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            안녕하세요, {order.name}님
          </p>
        </div>

        <CustomOrderPayClient
          token={token}
          locale={locale}
          customerEmail={order.email}
          customerName={order.name}
          quotedPriceUsd={order.quoted_price_usd}
          quotedPriceKrw={order.quoted_price_krw ?? null}
          description={order.description}
        />
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "#0D0D1A" }}
    >
      {children}
    </main>
  );
}

function StatusCard({
  icon,
  title,
  message,
  backToken,
  locale,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  backToken?: string;
  locale?: string;
}) {
  return (
    <div
      className="max-w-md mx-auto w-full rounded-2xl border p-8 text-center"
      style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
    >
      <div className="flex justify-center mb-4">{icon}</div>
      <h2 className="text-xl font-bold mb-3" style={{ color: "#F0E6FF" }}>
        {title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
        {message}
      </p>
      {backToken && locale && (
        <a
          href={`/${locale}/custom-order/pay/${backToken}`}
          className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
        >
          다시 시도
        </a>
      )}
    </div>
  );
}
