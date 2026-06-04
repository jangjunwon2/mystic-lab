import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle, Circle, Clock, Package, Truck, MapPin, ExternalLink } from "lucide-react";

const CARRIER_TRACKING_URLS: Record<string, string> = {
  DHL:       "https://www.dhl.com/global-en/home/tracking.html?tracking-id=",
  FedEx:     "https://www.fedex.com/apps/fedextrack/?tracknumbers=",
  UPS:       "https://www.ups.com/track?tracknum=",
  USPS:      "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  EMS:       "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=",
  "우체국":  "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=",
  "CJ대한통운": "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=",
  "한진":    "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnumText2=",
  "롯데택배": "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=",
  "로젠":    "https://www.ilogen.com/web/personal/trace/",
};

function trackingUrl(carrier: string | null, trackingNumber: string): string | null {
  if (!carrier) return null;
  const base = CARRIER_TRACKING_URLS[carrier];
  return base ? `${base}${encodeURIComponent(trackingNumber)}` : null;
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const STATUS_STEPS = ["pending", "paid", "shipped", "completed"] as const;

const STEP_LABELS: Record<string, Record<string, string>> = {
  pending: { en: "Order Placed", ko: "주문 확인", ja: "注文確認", "zh-CN": "订单确认", es: "Pedido realizado", fr: "Commande passée", de: "Bestellung aufgegeben" },
  paid: { en: "Preparing", ko: "준비중", ja: "準備中", "zh-CN": "准备中", es: "Preparando", fr: "En préparation", de: "Wird vorbereitet" },
  shipped: { en: "Shipped", ko: "발송 완료", ja: "発送済み", "zh-CN": "已发货", es: "Enviado", fr: "Expédié", de: "Versendet" },
  completed: { en: "Delivered", ko: "배송 완료", ja: "配達完了", "zh-CN": "已送达", es: "Entregado", fr: "Livré", de: "Geliefert" },
};

const STEP_ICONS = {
  pending: Clock,
  paid: Package,
  shipped: Truck,
  completed: CheckCircle,
};

const UI: Record<string, Record<string, string>> = {
  title: { en: "Order Details", ko: "주문 상세", ja: "注文詳細", "zh-CN": "订单详情", es: "Detalles del pedido", fr: "Détails de la commande", de: "Bestelldetails" },
  orderNumber: { en: "Order", ko: "주문번호", ja: "注文番号", "zh-CN": "订单号", es: "Pedido", fr: "Commande", de: "Bestellung" },
  items: { en: "Items", ko: "상품", ja: "商品", "zh-CN": "商品", es: "Artículos", fr: "Articles", de: "Artikel" },
  total: { en: "Total", ko: "합계", ja: "合計", "zh-CN": "合计", es: "Total", fr: "Total", de: "Gesamt" },
  shipping: { en: "Shipping Address", ko: "배송지", ja: "配送先", "zh-CN": "收货地址", es: "Dirección de envío", fr: "Adresse de livraison", de: "Lieferadresse" },
  tracking: { en: "Tracking", ko: "운송장", ja: "追跡番号", "zh-CN": "快递单号", es: "Seguimiento", fr: "Suivi", de: "Sendungsverfolgung" },
  backToAccount: { en: "← My Account", ko: "← 마이페이지", ja: "← マイページ", "zh-CN": "← 我的账户", es: "← Mi cuenta", fr: "← Mon compte", de: "← Mein Konto" },
  refunded: { en: "Refunded", ko: "환불 완료", ja: "返金済み", "zh-CN": "已退款", es: "Reembolsado", fr: "Remboursé", de: "Erstattet" },
};

function t(key: string, locale: string): string {
  return UI[key]?.[locale] ?? UI[key]?.["en"] ?? key;
}

function stepLabel(step: string, locale: string): string {
  return STEP_LABELS[step]?.[locale] ?? STEP_LABELS[step]?.["en"] ?? step;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/account`);

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, status, total_usd, created_at, customer_email, shipping_address,
      tracking_number, tracking_carrier,
      order_items(
        id, quantity, price_usd, option_name, option_id,
        products(id, slug, thumbnail_url, product_translations(name, language))
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const isRefunded = order.status === "refunded";
  const currentStepIndex = isRefunded ? -1 : STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const date = new Date(order.created_at).toLocaleDateString(locale, {
    year: "numeric", month: "long", day: "numeric",
  });

  const shippingAddr = order.shipping_address as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href={`/${locale}/account`}
          className="inline-block text-sm text-[#6B7280] hover:text-[#A855F7] transition-colors mb-6"
        >
          {t("backToAccount", locale)}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold text-[#F0E6FF] mb-1"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {t("title", locale)}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {t("orderNumber", locale)} #{order.id.slice(0, 8).toUpperCase()} · {date}
          </p>
        </div>

        {/* Status Timeline */}
        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-6 mb-5">
          {isRefunded ? (
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <Circle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("refunded", locale)}</p>
                <p className="text-xs text-[#6B7280]">${order.total_usd.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const current = i === currentStepIndex;
                const Icon = STEP_ICONS[step];
                const isLast = i === STATUS_STEPS.length - 1;

                return (
                  <div key={step} className="flex gap-4">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                          done
                            ? current
                              ? "bg-[#7C3AED] border-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.5)]"
                              : "bg-[#7C3AED]/20 border-[#7C3AED]/50"
                            : "bg-[#13131F] border-[#2D2D4E]"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            done ? (current ? "text-white" : "text-[#A855F7]") : "text-[#4B5563]"
                          }`}
                        />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-px flex-1 my-1 min-h-[24px] ${
                            i < currentStepIndex ? "bg-[#7C3AED]/40" : "bg-[#2D2D4E]"
                          }`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pb-${isLast ? "0" : "5"} pt-1.5`}>
                      <p
                        className={`text-sm font-medium ${
                          done ? (current ? "text-[#F0E6FF]" : "text-[#9CA3AF]") : "text-[#4B5563]"
                        }`}
                      >
                        {stepLabel(step, locale)}
                      </p>
                      {current && (
                        <span className="inline-block mt-0.5 text-[10px] text-[#7C3AED] bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-full px-2 py-0.5 uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tracking number */}
          {order.tracking_number && (
            <div className="mt-5 pt-5 border-t border-[#2D2D4E]">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-[#6B7280]" />
                <span className="text-xs text-[#6B7280] uppercase tracking-wider">{t("tracking", locale)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {order.tracking_carrier && (
                  <span className="text-xs font-medium text-[#A855F7] bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded px-2 py-0.5">
                    {order.tracking_carrier}
                  </span>
                )}
                <span className="text-sm font-mono text-[#F0E6FF]">{order.tracking_number}</span>
                {trackingUrl(order.tracking_carrier, order.tracking_number) ? (
                  <a
                    href={trackingUrl(order.tracking_carrier, order.tracking_number)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#A855F7] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {locale === "ko" ? "추적하기" : locale === "ja" ? "追跡する" : "Track"}
                  </a>
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-6 mb-5">
          <h2 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-4">
            {t("items", locale)}
          </h2>
          <div className="space-y-4">
            {order.order_items.map((item: {
              id: string; quantity: number; price_usd: number; option_name: string | null; option_id: string | null;
              products: { id: string; slug: string; thumbnail_url: string | null; product_translations: { name: string; language: string }[] } | null;
            }) => {
              const name =
                item.products?.product_translations.find((tr) => tr.language === locale)?.name ??
                item.products?.product_translations[0]?.name ??
                "Product";
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#13131F] border border-[#2D2D4E] overflow-hidden flex-shrink-0">
                    {item.products?.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.products.thumbnail_url}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#4B5563]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/products/${item.products?.slug ?? ""}`}
                      className="text-sm text-[#F0E6FF] hover:text-[#A855F7] transition-colors line-clamp-1"
                    >
                      {name}
                    </Link>
                    {/* 애드온 라인(option_id 존재)은 상품명이 이미 현재 언어로 표시되므로 단일언어 스냅샷 생략. 레거시 옵션만 폴백 표시. */}
                    {item.option_name && !item.option_id && <p className="text-xs text-[#A855F7] line-clamp-1">{item.option_name}</p>}
                    <p className="text-xs text-[#6B7280]">× {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#F59E0B] flex-shrink-0">
                    ${(item.price_usd * item.quantity).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[#2D2D4E] flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">{t("total", locale)}</span>
            <span className="text-base font-bold text-[#F59E0B]">${order.total_usd.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddr && Object.keys(shippingAddr).length > 0 && (
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#6B7280]" />
              <h2 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                {t("shipping", locale)}
              </h2>
            </div>
            <div className="text-sm text-[#9CA3AF] space-y-0.5">
              {shippingAddr.name && <p className="text-[#F0E6FF] font-medium">{shippingAddr.name}</p>}
              {shippingAddr.line1 && <p>{shippingAddr.line1}</p>}
              {shippingAddr.line2 && <p>{shippingAddr.line2}</p>}
              {(shippingAddr.city || shippingAddr.postal_code) && (
                <p>{[shippingAddr.city, shippingAddr.postal_code].filter(Boolean).join(", ")}</p>
              )}
              {shippingAddr.country && <p>{shippingAddr.country}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
