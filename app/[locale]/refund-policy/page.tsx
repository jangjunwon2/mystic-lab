import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

type Section = { heading: string; content: string };
type LegalContent = { title: string; lastUpdated: string; intro: string; sections: Section[] };

const content: Record<string, LegalContent> = {
  en: {
    title: "Refund Policy",
    lastUpdated: "June 2026",
    intro:
      "We want you to be satisfied with your purchase. Please read this policy carefully before ordering.",
    sections: [
      {
        heading: "Physical Products",
        content:
          "Physical magic props may be returned within 14 days of delivery, provided they are unused and in original packaging. To initiate a return, contact support@mystic-lab.com with your order number and reason for return. You are responsible for return shipping costs unless the item is defective or incorrectly sent.",
      },
      {
        heading: "Digital Products (Solution Videos)",
        content:
          "Solution videos are non-refundable once the access link has been delivered or the video has been streamed. This is because the intellectual content is revealed upon access. If you have not yet accessed your video and wish to request a refund, please contact us within 24 hours of purchase.",
      },
      {
        heading: "Defective or Incorrect Items",
        content:
          "If you receive a defective item or an item that differs from what you ordered, contact us within 7 days of delivery. We will arrange a free replacement or full refund at our expense.",
      },
      {
        heading: "How to Request a Refund",
        content:
          "Email support@mystic-lab.com with: your order number, reason for return/refund, and photos if the item is defective. We aim to process all refund requests within 5 business days. Approved refunds are returned to your original payment method within 5–10 business days.",
      },
    ],
  },
  ko: {
    title: "환불정책",
    lastUpdated: "2026년 6월",
    intro:
      "당사는 고객 만족을 최우선으로 합니다. 주문 전에 본 환불 정책을 주의 깊게 읽어주세요.",
    sections: [
      {
        heading: "실물 상품",
        content:
          "전자상거래 등에서의 소비자보호에 관한 법률에 따라, 수령일로부터 7일 이내에 청약철회를 할 수 있습니다. 단, 상품을 사용하였거나 포장을 훼손한 경우, 또는 복제 가능한 디지털 콘텐츠를 포함한 상품의 포장을 개봉한 경우에는 청약철회가 제한될 수 있습니다. 반품을 원하시면 support@mystic-lab.com으로 주문번호와 반품 사유를 보내주세요.",
      },
      {
        heading: "디지털 상품 (해법 영상)",
        content:
          "해법 영상은 접근 링크 발송 또는 영상 재생 이후에는 환불이 불가합니다. 영상에 담긴 마술 해법(지적 콘텐츠)이 접근 즉시 공개되기 때문입니다. 아직 영상에 접근하지 않았고 환불을 원하신다면, 구매 후 24시간 이내에 연락해주세요.",
      },
      {
        heading: "불량품 또는 오배송",
        content:
          "불량품을 수령하셨거나 주문과 다른 상품을 받으신 경우, 수령일로부터 7일 이내에 연락해주세요. 무상 교환 또는 전액 환불을 해드립니다.",
      },
      {
        heading: "환불 신청 방법",
        content:
          "support@mystic-lab.com으로 주문번호, 환불 사유, 불량품의 경우 사진을 함께 보내주세요. 환불 요청은 영업일 기준 5일 이내에 처리되며, 승인된 환불금은 원래 결제 수단으로 5~10 영업일 이내에 반환됩니다.",
      },
    ],
  },
  ja: {
    title: "返金ポリシー",
    lastUpdated: "2026年6月",
    intro: "お客様のご満足を最優先に考えています。ご注文前に本ポリシーをよくお読みください。",
    sections: [
      {
        heading: "実物商品",
        content:
          "未使用かつ元の梱包状態であれば、お届けから14日以内に返品できます。返品をご希望の場合は、注文番号と返品理由をsupport@mystic-lab.comまでご連絡ください。商品に欠陥がある場合または誤配送の場合を除き、返送料はお客様負担となります。",
      },
      {
        heading: "デジタル商品（解説動画）",
        content:
          "解説動画はアクセスリンクの送付後または視聴後は返金不可となります。これは、アクセスした時点でマジックの解説（知的コンテンツ）が開示されるためです。まだ動画にアクセスしていない場合は、購入後24時間以内にご連絡ください。",
      },
      {
        heading: "不良品または誤配送",
        content:
          "不良品を受け取られた場合、またはご注文と異なる商品が届いた場合は、お届けから7日以内にご連絡ください。無償交換または全額返金いたします。",
      },
      {
        heading: "返金申請方法",
        content:
          "support@mystic-lab.comへ注文番号、理由、不良品の場合は写真をお送りください。返金リクエストは営業日5日以内に処理されます。",
      },
    ],
  },
  "zh-CN": {
    title: "退款政策",
    lastUpdated: "2026年6月",
    intro: "我们希望您对购买感到满意。请在下单前仔细阅读本政策。",
    sections: [
      {
        heading: "实物商品",
        content:
          "实物魔术道具可在收货后14天内退货，前提是未使用且保持原始包装。如需发起退货，请将订单号和退货原因发送至support@mystic-lab.com。除商品有缺陷或发错货外，退货运费由买家承担。",
      },
      {
        heading: "数字商品（解说视频）",
        content:
          "解说视频一经交付访问链接或开始播放，即不可退款。这是因为视频内容（魔术解法）在访问时即已披露。如您尚未访问视频且希望申请退款，请在购买后24小时内联系我们。",
      },
      {
        heading: "缺陷或错误商品",
        content:
          "如果您收到有缺陷的商品或与订单不符的商品，请在收货后7天内联系我们。我们将安排免费换货或全额退款。",
      },
      {
        heading: "如何申请退款",
        content:
          "请发送邮件至support@mystic-lab.com，附上：订单号、退款原因、如有缺陷请附照片。我们将在5个工作日内处理所有退款请求。",
      },
    ],
  },
  es: {
    title: "Política de Reembolso",
    lastUpdated: "Junio 2026",
    intro:
      "Queremos que estés satisfecho con tu compra. Lee esta política cuidadosamente antes de hacer un pedido.",
    sections: [
      {
        heading: "Productos Físicos",
        content:
          "Los artículos físicos pueden devolverse en un plazo de 14 días desde la entrega, siempre que no se hayan usado y estén en su embalaje original. Para iniciar una devolución, contacta support@mystic-lab.com con tu número de pedido.",
      },
      {
        heading: "Productos Digitales (Videos de Soluciones)",
        content:
          "Los videos de soluciones no son reembolsables una vez que se ha entregado el enlace de acceso o se ha reproducido el video. Si aún no has accedido a tu video y deseas un reembolso, contáctanos dentro de las 24 horas posteriores a la compra.",
      },
      {
        heading: "Artículos Defectuosos o Incorrectos",
        content:
          "Si recibes un artículo defectuoso o diferente al pedido, contáctanos en un plazo de 7 días desde la entrega. Organizaremos un reemplazo gratuito o un reembolso completo.",
      },
      {
        heading: "Derecho de Desistimiento (UE)",
        content:
          "Los consumidores de la UE tienen derecho a desistir del contrato dentro de los 14 días posteriores a la recepción de los bienes físicos, sin necesidad de justificación.",
      },
    ],
  },
  fr: {
    title: "Politique de Remboursement",
    lastUpdated: "Juin 2026",
    intro:
      "Nous souhaitons que vous soyez satisfait de votre achat. Veuillez lire attentivement cette politique avant de commander.",
    sections: [
      {
        heading: "Produits Physiques",
        content:
          "Les articles physiques peuvent être retournés dans les 14 jours suivant la livraison, à condition qu'ils n'aient pas été utilisés et soient dans leur emballage d'origine. Pour initier un retour, contactez support@mystic-lab.com avec votre numéro de commande.",
      },
      {
        heading: "Produits Numériques (Vidéos de Solutions)",
        content:
          "Les vidéos de solutions ne sont pas remboursables une fois le lien d'accès livré ou la vidéo visionnée. Si vous n'avez pas encore accédé à votre vidéo et souhaitez un remboursement, contactez-nous dans les 24 heures suivant l'achat.",
      },
      {
        heading: "Droit de Rétractation (UE)",
        content:
          "Conformément à la directive européenne sur les droits des consommateurs, les consommateurs de l'UE ont le droit de se rétracter dans les 14 jours suivant la réception des biens physiques sans justification.",
      },
      {
        heading: "Articles Défectueux ou Incorrects",
        content:
          "Si vous recevez un article défectueux ou différent de votre commande, contactez-nous dans les 7 jours suivant la livraison. Nous organiserons un remplacement gratuit ou un remboursement complet.",
      },
    ],
  },
  de: {
    title: "Rückgaberichtlinie",
    lastUpdated: "Juni 2026",
    intro:
      "Wir möchten, dass du mit deinem Kauf zufrieden bist. Bitte lies diese Richtlinie sorgfältig durch, bevor du bestellst.",
    sections: [
      {
        heading: "Physische Produkte",
        content:
          "Physische Produkte können innerhalb von 14 Tagen nach Lieferung zurückgegeben werden, sofern sie unbenutzt und in Originalverpackung sind. Für eine Rücksendung kontaktiere support@mystic-lab.com mit deiner Bestellnummer.",
      },
      {
        heading: "Digitale Produkte (Lösungsvideos)",
        content:
          "Lösungsvideos sind nach Zustellung des Zugriffslinks oder nach dem Abspielen nicht erstattungsfähig. Falls du noch nicht auf dein Video zugegriffen hast und eine Erstattung wünschst, kontaktiere uns innerhalb von 24 Stunden nach dem Kauf.",
      },
      {
        heading: "Widerrufsrecht (EU)",
        content:
          "Verbraucher in der EU haben das Recht, innerhalb von 14 Tagen nach Erhalt der physischen Ware ohne Angabe von Gründen vom Vertrag zurückzutreten (§ 312g BGB / EU-Verbraucherrechterichtlinie).",
      },
      {
        heading: "Fehlerhafte oder falsche Artikel",
        content:
          "Wenn du einen fehlerhaften oder falschen Artikel erhältst, kontaktiere uns innerhalb von 7 Tagen nach der Lieferung. Wir arrangieren kostenlosen Ersatz oder vollständige Erstattung.",
      },
    ],
  },
};

export default async function RefundPolicyPage({ params }: Props) {
  const { locale } = await params;
  const page = content[locale] ?? content.en;

  return (
    <div className="min-h-screen bg-[#0D0D1A] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors mb-8"
        >
          ← {locale === "ko" ? "홈으로" : locale === "ja" ? "ホームへ" : locale === "zh-CN" ? "返回首页" : locale === "de" ? "Zurück" : locale === "fr" ? "Retour" : locale === "es" ? "Volver" : "Back"}
        </Link>

        <h1
          className="text-3xl font-bold text-[#F0E6FF] mb-2"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {page.title}
        </h1>
        <p className="text-sm text-[#6B7280] mb-10">
          {locale === "ko" ? "최종 수정일" : locale === "ja" ? "最終更新日" : locale === "zh-CN" ? "最后更新" : "Last updated"}: {page.lastUpdated}
        </p>

        <p className="text-[#9CA3AF] leading-relaxed mb-10">{page.intro}</p>

        <div className="space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading} className="border-t border-[#2D2D4E] pt-6">
              <h2 className="text-lg font-semibold text-[#C084FC] mb-3">{section.heading}</h2>
              <p className="text-[#9CA3AF] leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
