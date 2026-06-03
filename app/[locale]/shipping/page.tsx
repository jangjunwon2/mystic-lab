import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Shipping Policy",
    ko: "배송 안내",
    ja: "配送ポリシー",
    "zh-CN": "配送政策",
    es: "Política de envío",
    fr: "Politique d'expédition",
    de: "Versandrichtlinie",
  };
  return { title: titles[locale] ?? titles.en };
}

const CONTENT: Record<string, {
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}> = {
  en: {
    title: "Shipping Policy",
    subtitle: "Every Mystic Lab package is prepared with care and shipped worldwide.",
    sections: [
      {
        heading: "Processing Time",
        body: "All orders are processed within 1–3 business days after payment confirmation. Orders placed on weekends or public holidays will begin processing the next business day.",
      },
      {
        heading: "International Shipping (Outside Korea)",
        body: "We ship worldwide via DHL, FedEx, or EMS. Estimated delivery times:\n• USA / Canada: 5–10 business days\n• Europe: 5–12 business days\n• Southeast Asia / Japan: 3–7 business days\n• Other regions: 7–20 business days\n\nShipping costs are calculated at checkout based on destination and package weight.",
      },
      {
        heading: "Domestic Shipping (Korea)",
        body: "Korean orders are shipped via CJ대한통운, 한진택배, or 우체국 EMS.\n• Standard delivery: 1–3 business days\n• Island / remote areas: 2–5 business days\n\nFree shipping on Korean orders over ₩100,000.",
      },
      {
        heading: "Tracking Your Order",
        body: "A tracking number will be emailed to you as soon as your order ships. You can also view your tracking information in My Account → Orders.\n\nIf you haven't received a tracking email within 5 business days of placing your order, please contact us.",
      },
      {
        heading: "Customs & Import Duties",
        body: "International orders may be subject to customs duties, taxes, or import fees charged by your country. These charges are the buyer's responsibility and are not included in the product price or shipping cost. We are unable to predict or cover customs fees.",
      },
      {
        heading: "Lost or Damaged Packages",
        body: "If your package is lost in transit or arrives damaged, please contact us within 14 days of the estimated delivery date with your order number and photos of any damage. We will work with the carrier to resolve the issue.",
      },
      {
        heading: "Contact",
        body: "Questions about your shipment? Reach us at support@mysticlab.com and we'll respond within 1 business day.",
      },
    ],
  },
  ko: {
    title: "배송 안내",
    subtitle: "미스틱랩의 모든 패키지는 정성껏 포장되어 전 세계로 발송됩니다.",
    sections: [
      {
        heading: "처리 기간",
        body: "모든 주문은 결제 확인 후 영업일 기준 1–3일 이내에 처리됩니다. 주말 또는 공휴일에 접수된 주문은 다음 영업일부터 처리가 시작됩니다.",
      },
      {
        heading: "국제 배송 (한국 외 지역)",
        body: "DHL, FedEx, EMS를 통해 전 세계로 발송합니다. 예상 배송 기간:\n• 미국 / 캐나다: 영업일 기준 5–10일\n• 유럽: 영업일 기준 5–12일\n• 동남아시아 / 일본: 영업일 기준 3–7일\n• 기타 지역: 영업일 기준 7–20일\n\n배송비는 목적지와 패키지 무게에 따라 결제 시 자동 계산됩니다.",
      },
      {
        heading: "국내 배송 (한국)",
        body: "국내 주문은 CJ대한통운, 한진택배, 우체국 EMS를 통해 발송됩니다.\n• 일반 배송: 영업일 기준 1–3일\n• 도서 / 산간 지역: 영업일 기준 2–5일\n\n10만 원 이상 주문 시 무료 배송이 적용됩니다.",
      },
      {
        heading: "배송 추적",
        body: "발송 즉시 운송장 번호가 이메일로 발송됩니다. 마이페이지 → 주문 내역에서도 추적 정보를 확인하실 수 있습니다.\n\n주문일로부터 영업일 기준 5일 이내에 발송 이메일을 받지 못하셨다면 고객센터로 문의해 주세요.",
      },
      {
        heading: "관세 및 수입세",
        body: "해외 배송 주문은 수령 국가의 관세, 부가세, 수입세가 부과될 수 있습니다. 이 비용은 구매자 부담이며 상품가격 및 배송비에 포함되지 않습니다. 관세 금액은 예측이 불가하오니 양해 부탁드립니다.",
      },
      {
        heading: "분실 또는 파손",
        body: "배송 중 분실 또는 파손이 발생한 경우, 예상 배송일로부터 14일 이내에 주문번호와 파손 사진을 첨부하여 고객센터로 문의해 주세요. 운송사와 함께 신속히 해결해 드리겠습니다.",
      },
      {
        heading: "문의",
        body: "배송 관련 문의는 support@mysticlab.com으로 연락주세요. 영업일 기준 1일 이내에 답변드립니다.",
      },
    ],
  },
  ja: {
    title: "配送ポリシー",
    subtitle: "Mystic Labのすべての商品は丁寧に梱包し、世界中にお届けします。",
    sections: [
      { heading: "処理期間", body: "すべての注文は、お支払い確認後、営業日1〜3日以内に処理されます。週末・祝日のご注文は翌営業日より処理を開始します。" },
      { heading: "国際配送（韓国以外）", body: "DHL・FedEx・EMSにて全世界へ発送いたします。\n配達目安：\n• 日本：3〜7営業日\n• 北米：5〜10営業日\n• ヨーロッパ：5〜12営業日\n• その他：7〜20営業日\n\n送料は配送先と重量により、チェックアウト時に自動計算されます。" },
      { heading: "国内配送（韓国）", body: "韓国内の注文はCJ대한통운・한진택배・우체국EMSにて発送します。\n• 通常配送：1〜3営業日\n• 離島・山間部：2〜5営業日" },
      { heading: "荷物の追跡", body: "発送後、追跡番号をメールでお知らせします。マイページ→注文履歴からもご確認いただけます。" },
      { heading: "関税・輸入税", body: "国際発送の場合、お届け先国の関税・輸入税が発生する場合があります。これらの費用はお客様負担となります。" },
      { heading: "紛失・破損", body: "配送中の紛失・破損が発生した場合は、お届け予定日から14日以内にご連絡ください。" },
      { heading: "お問い合わせ", body: "配送に関するご質問は support@mysticlab.com までご連絡ください。営業日1日以内に返信いたします。" },
    ],
  },
  "zh-CN": {
    title: "配送政策",
    subtitle: "Mystic Lab 的每一个包裹都经过精心打包，发往全球各地。",
    sections: [
      { heading: "处理时间", body: "所有订单在付款确认后1-3个工作日内处理。周末或假期下单将从下一个工作日开始处理。" },
      { heading: "国际配送（韩国以外）", body: "通过DHL、FedEx或EMS发往全球。预计送达时间：\n• 中国大陆：5-10个工作日\n• 欧美地区：5-12个工作日\n• 东南亚：3-7个工作日\n• 其他地区：7-20个工作日\n\n运费根据目的地和包裹重量在结账时自动计算。" },
      { heading: "韩国国内配送", body: "韩国订单通过CJ대한통운、한진택배或우체국EMS发送，标准配送1-3个工作日。" },
      { heading: "追踪包裹", body: "发货后，追踪号将发送至您的邮箱。您也可以在我的账户→订单中查看物流信息。" },
      { heading: "关税与进口税", body: "国际订单可能需要缴纳目的国的关税和进口税，此费用由买家承担。" },
      { heading: "丢失或损坏", body: "如包裹在运输中丢失或损坏，请在预计送达日期14天内联系我们并提供订单号和损坏照片。" },
      { heading: "联系我们", body: "有关配送的问题，请发送邮件至 support@mysticlab.com，我们将在1个工作日内回复。" },
    ],
  },
  es: {
    title: "Política de Envío",
    subtitle: "Cada paquete de Mystic Lab se prepara con cuidado y se envía a todo el mundo.",
    sections: [
      { heading: "Tiempo de procesamiento", body: "Todos los pedidos se procesan en 1-3 días hábiles tras la confirmación del pago." },
      { heading: "Envío internacional", body: "Enviamos a todo el mundo por DHL, FedEx o EMS.\n• EE.UU. / Canadá: 5-10 días hábiles\n• Europa: 5-12 días hábiles\n• Otras regiones: 7-20 días hábiles" },
      { heading: "Seguimiento", body: "Recibirás un número de seguimiento por correo electrónico en cuanto se envíe tu pedido." },
      { heading: "Aduanas e impuestos", body: "Los pedidos internacionales pueden estar sujetos a aranceles e impuestos locales, que son responsabilidad del comprador." },
      { heading: "Pérdidas o daños", body: "Si tu paquete se pierde o llega dañado, contáctanos en un plazo de 14 días desde la fecha estimada de entrega." },
      { heading: "Contacto", body: "¿Preguntas sobre tu envío? Escríbenos a support@mysticlab.com." },
    ],
  },
  fr: {
    title: "Politique d'expédition",
    subtitle: "Chaque colis Mystic Lab est préparé avec soin et expédié dans le monde entier.",
    sections: [
      { heading: "Délai de traitement", body: "Toutes les commandes sont traitées dans un délai de 1 à 3 jours ouvrables après confirmation du paiement." },
      { heading: "Livraison internationale", body: "Nous expédions dans le monde entier via DHL, FedEx ou EMS.\n• Europe : 5-12 jours ouvrables\n• Amérique du Nord : 5-10 jours ouvrables\n• Autres régions : 7-20 jours ouvrables" },
      { heading: "Suivi de commande", body: "Un numéro de suivi vous sera envoyé par e-mail dès l'expédition de votre commande." },
      { heading: "Droits de douane", body: "Les commandes internationales peuvent être soumises à des droits de douane et taxes locales, à la charge de l'acheteur." },
      { heading: "Perte ou dommages", body: "Si votre colis est perdu ou endommagé, contactez-nous dans les 14 jours suivant la date de livraison estimée." },
      { heading: "Contact", body: "Des questions sur votre expédition ? Écrivez-nous à support@mysticlab.com." },
    ],
  },
  de: {
    title: "Versandrichtlinie",
    subtitle: "Jedes Mystic Lab-Paket wird sorgfältig vorbereitet und weltweit versendet.",
    sections: [
      { heading: "Bearbeitungszeit", body: "Alle Bestellungen werden innerhalb von 1-3 Werktagen nach Zahlungseingang bearbeitet." },
      { heading: "Internationaler Versand", body: "Wir versenden weltweit per DHL, FedEx oder EMS.\n• Europa: 5-12 Werktage\n• Nordamerika: 5-10 Werktage\n• Sonstige Regionen: 7-20 Werktage" },
      { heading: "Sendungsverfolgung", body: "Nach dem Versand erhalten Sie eine Tracking-Nummer per E-Mail." },
      { heading: "Zoll und Einfuhrsteuern", body: "Internationale Bestellungen können Zollgebühren und Einfuhrsteuern unterliegen, die vom Käufer zu tragen sind." },
      { heading: "Verlust oder Beschädigung", body: "Bei Verlust oder Beschädigung kontaktieren Sie uns bitte innerhalb von 14 Tagen nach dem voraussichtlichen Lieferdatum." },
      { heading: "Kontakt", body: "Fragen zu Ihrer Sendung? Schreiben Sie uns an support@mysticlab.com." },
    ],
  },
};

export default async function ShippingPage({ params }: Props) {
  const { locale } = await params;
  const c = CONTENT[locale] ?? CONTENT.en;

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: "var(--font-cinzel)", color: "#F0E6FF" }}
          >
            {c.title}
          </h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>{c.subtitle}</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {c.sections.map((s) => (
            <div
              key={s.heading}
              className="rounded-xl border p-6"
              style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
            >
              <h2 className="text-base font-semibold mb-3" style={{ color: "#A855F7" }}>
                {s.heading}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#9CA3AF", whiteSpace: "pre-wrap" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Carrier logos note */}
        <div
          className="mt-8 rounded-xl border p-5 text-sm"
          style={{ background: "#13131F", borderColor: "#2D2D4E", color: "#6B7280" }}
        >
          <p className="font-medium mb-1" style={{ color: "#F0E6FF" }}>
            {locale === "ko" ? "주요 배송사" : "Shipping Carriers"}
          </p>
          <p>DHL · FedEx · EMS · CJ대한통운 · 한진택배 · 롯데택배 · 우체국</p>
        </div>
      </div>
    </div>
  );
}
