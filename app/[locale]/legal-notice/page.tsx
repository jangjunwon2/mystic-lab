import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Legal Notice",
    ko: "법적 고지",
    ja: "法的通知",
    "zh-CN": "法律声明",
    es: "Aviso legal",
    fr: "Mentions légales",
    de: "Impressum",
  };
  return { title: titles[locale] ?? titles.en };
}

type Section = { heading: string; content: string };
type LegalContent = { title: string; lastUpdated: string; intro: string; sections: Section[] };

// 실제 제공된 사업자 정보. 나머지([ ])는 운영자가 채워야 함(법적 의무 항목).
const BIZ_NAME = "비에이블";
const BIZ_REG = "742-10-02095";

// ⚠️ 본 페이지는 각국 표준 형식 템플릿이며, 실제 적용 전 변호사/법률 서비스 검토가 필요합니다.
// 대표자명·주소·연락처·통신판매업 신고번호·VAT 등 [ ] 항목은 실제 값으로 교체하세요.
const content: Record<string, LegalContent> = {
  ko: {
    title: "사업자 정보",
    lastUpdated: "2026-06",
    intro: "전자상거래 등에서의 소비자보호에 관한 법률에 따라 다음과 같이 사업자 정보를 표시합니다.",
    sections: [
      { heading: "상호 / 사업자등록번호", content: `상호: ${BIZ_NAME} · 사업자등록번호: ${BIZ_REG}` },
      { heading: "대표자", content: "대표자: [대표자명 기입]" },
      { heading: "통신판매업 신고번호", content: "[통신판매업 신고번호 기입] (관할 시·군·구청 신고)" },
      { heading: "사업장 주소", content: "[사업장 주소 기입]" },
      { heading: "연락처", content: "전화: [전화번호 기입] · 이메일: [이메일 기입]" },
      { heading: "개인정보보호책임자", content: "[성명/직위/이메일 기입] (개인정보처리방침 참조)" },
      { heading: "호스팅 제공자", content: "Vercel Inc. (웹 호스팅)" },
      { heading: "결제·배송·환불", content: "결제: LemonSqueezy(해외)/Toss Payments(국내) · 배송 및 환불 조건은 배송 안내·환불정책 페이지를 따릅니다." },
    ],
  },
  ja: {
    title: "特定商取引法に基づく表記",
    lastUpdated: "2026-06",
    intro: "特定商取引法に基づき、以下のとおり表示します。",
    sections: [
      { heading: "販売業者", content: `${BIZ_NAME} (Beable) · 韓国事業者登録番号: ${BIZ_REG}` },
      { heading: "運営統括責任者", content: "[代表者名 記入]" },
      { heading: "所在地", content: "[所在地 記入]" },
      { heading: "連絡先", content: "電話: [電話番号 記入] · メール: [メール 記入]" },
      { heading: "販売価格", content: "各商品ページに表示する価格(税込)。" },
      { heading: "商品代金以外の必要料金", content: "送料(配送方法により異なる)、関税・輸入消費税(該当する場合は購入者負担)。" },
      { heading: "支払方法・支払時期", content: "クレジットカード等(LemonSqueezy / Toss Payments)。注文時にお支払いいただきます。" },
      { heading: "引渡時期", content: "決済確認後に発送します(詳細は配送案内ページ参照)。" },
      { heading: "返品・交換", content: "返品ポリシーに従います。デジタル商品の特性上、提供後の返金は制限される場合があります。" },
    ],
  },
  de: {
    title: "Impressum",
    lastUpdated: "2026-06",
    intro: "Angaben gemäß § 5 TMG / Informationen zum Anbieter.",
    sections: [
      { heading: "Anbieter", content: `${BIZ_NAME} (Beable) · Geschäftsregisternummer (Korea): ${BIZ_REG}` },
      { heading: "Vertreten durch", content: "[Name des Vertretungsberechtigten eintragen]" },
      { heading: "Anschrift", content: "[Geschäftsadresse eintragen]" },
      { heading: "Kontakt", content: "Telefon: [eintragen] · E-Mail: [eintragen]" },
      { heading: "Umsatzsteuer-ID", content: "[USt-IdNr. eintragen, falls vorhanden]" },
      { heading: "EU-Streitschlichtung", content: "Plattform der EU-Kommission zur Online-Streitbeilegung (OS): https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen." },
      { heading: "Widerrufsrecht (EU, 14 Tage)", content: "Verbraucher in der EU haben das Recht, binnen 14 Tagen ohne Angabe von Gründen den Vertrag zu widerrufen. Bei digitalen Inhalten kann das Widerrufsrecht erlöschen, sobald die Ausführung mit Ihrer Zustimmung begonnen hat. Einzelheiten siehe Rückerstattungsrichtlinie." },
    ],
  },
  en: {
    title: "Legal Notice",
    lastUpdated: "2026-06",
    intro: "Business and seller information.",
    sections: [
      { heading: "Seller", content: `${BIZ_NAME} (Beable) · Business registration no. (Korea): ${BIZ_REG}` },
      { heading: "Representative", content: "[Representative name]" },
      { heading: "Registered address", content: "[Business address]" },
      { heading: "Contact", content: "Phone: [phone] · Email: [email]" },
      { heading: "Hosting provider", content: "Vercel Inc." },
      { heading: "EU right of withdrawal (14 days)", content: "Consumers in the EU may withdraw from a purchase within 14 days without giving a reason. For digital content, the right may lapse once delivery has begun with your consent. See the Refund Policy for details." },
      { heading: "Payments / Delivery / Refunds", content: "Payments via LemonSqueezy (international) / Toss Payments (Korea). Delivery and refunds are governed by our Shipping and Refund Policy pages." },
    ],
  },
  es: {
    title: "Aviso legal",
    lastUpdated: "2026-06",
    intro: "Información del titular y del vendedor.",
    sections: [
      { heading: "Vendedor", content: `${BIZ_NAME} (Beable) · N.º de registro mercantil (Corea): ${BIZ_REG}` },
      { heading: "Representante", content: "[Nombre del representante]" },
      { heading: "Domicilio", content: "[Dirección comercial]" },
      { heading: "Contacto", content: "Teléfono: [teléfono] · Correo: [correo]" },
      { heading: "Alojamiento", content: "Vercel Inc." },
      { heading: "Derecho de desistimiento (UE, 14 días)", content: "Los consumidores de la UE pueden desistir de la compra en un plazo de 14 días sin indicar motivo. En contenidos digitales, el derecho puede extinguirse una vez iniciada la entrega con su consentimiento. Véase la Política de reembolsos." },
    ],
  },
  fr: {
    title: "Mentions légales",
    lastUpdated: "2026-06",
    intro: "Informations sur l'éditeur et le vendeur.",
    sections: [
      { heading: "Vendeur", content: `${BIZ_NAME} (Beable) · N° d'enregistrement (Corée) : ${BIZ_REG}` },
      { heading: "Représentant", content: "[Nom du représentant]" },
      { heading: "Adresse", content: "[Adresse de l'entreprise]" },
      { heading: "Contact", content: "Téléphone : [téléphone] · E-mail : [e-mail]" },
      { heading: "Hébergeur", content: "Vercel Inc." },
      { heading: "Droit de rétractation (UE, 14 jours)", content: "Les consommateurs de l'UE disposent d'un délai de 14 jours pour se rétracter sans motif. Pour les contenus numériques, ce droit peut s'éteindre dès que l'exécution a commencé avec votre accord. Voir la Politique de remboursement." },
      { heading: "Médiation de la consommation", content: "Plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr" },
    ],
  },
  "zh-CN": {
    title: "商家信息",
    lastUpdated: "2026-06",
    intro: "卖家及经营者信息。",
    sections: [
      { heading: "销售商", content: `${BIZ_NAME} (Beable) · 韩国营业执照号: ${BIZ_REG}` },
      { heading: "负责人", content: "[负责人姓名]" },
      { heading: "营业地址", content: "[营业地址]" },
      { heading: "联系方式", content: "电话: [电话] · 邮箱: [邮箱]" },
      { heading: "托管服务", content: "Vercel Inc." },
      { heading: "付款 / 配送 / 退款", content: "付款通过 LemonSqueezy(海外)/ Toss Payments(韩国)。配送与退款适用配送说明与退款政策页面。" },
    ],
  },
};

const BACK: Record<string, string> = { ko: "홈으로", ja: "ホームへ", "zh-CN": "返回首页", de: "Zurück", fr: "Retour", es: "Volver", en: "Back" };
const UPDATED: Record<string, string> = { ko: "최종 수정일", ja: "最終更新日", "zh-CN": "最后更新", de: "Zuletzt aktualisiert", fr: "Dernière mise à jour", es: "Última actualización", en: "Last updated" };

export default async function LegalNoticePage({ params }: Props) {
  const { locale } = await params;
  const page = content[locale] ?? content.en;

  return (
    <div className="min-h-screen bg-[#0D0D1A] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors mb-8">
          ← {BACK[locale] ?? BACK.en}
        </Link>

        <h1 className="text-3xl font-bold text-[#F0E6FF] mb-2" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          {page.title}
        </h1>
        <p className="text-sm text-[#6B7280] mb-10">{UPDATED[locale] ?? UPDATED.en}: {page.lastUpdated}</p>

        <p className="text-[#9CA3AF] leading-relaxed mb-10">{page.intro}</p>

        <div className="space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading} className="border-t border-[#2D2D4E] pt-6">
              <h2 className="text-lg font-semibold text-[#C084FC] mb-3">{section.heading}</h2>
              <p className="text-[#9CA3AF] leading-relaxed whitespace-pre-line">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
