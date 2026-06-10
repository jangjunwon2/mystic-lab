import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Privacy Policy | Mystic Lab",
    ko: "개인정보 처리방침 | 미스틱 랩",
    ja: "プライバシーポリシー | ミスティック・ラボ",
    "zh-CN": "隐私政策 | 神秘实验室",
    es: "Política de privacidad | Mystic Lab",
    fr: "Politique de confidentialité | Mystic Lab",
    de: "Datenschutzrichtlinie | Mystic Lab",
  };
  return {
    title: titles[locale] ?? titles.en,
    alternates: {
      canonical: `${SITE_URL}/${locale}/privacy`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/privacy`])),
        "x-default": `${SITE_URL}/en/privacy`,
      },
    },
  };
}

type Section = { heading: string; content: string };

type LegalContent = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
};

const content: Record<string, LegalContent> = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "June 2026",
    intro:
      "Mystic Lab ('we', 'us', 'our') respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our website and services.",
    sections: [
      {
        heading: "1. Data We Collect",
        content:
          "We collect information you provide directly: name, email address, shipping address, and payment details during checkout. We also collect order history, product preferences, and any messages you send us. Technical data such as IP address, browser type, and cookies are collected automatically.",
      },
      {
        heading: "2. How We Use Your Data",
        content:
          "We use your data to: process and fulfil orders; provide access to purchased solution videos; send transactional emails (order confirmations, shipping updates); respond to customer inquiries; improve our products and services; and send marketing communications (only with your explicit consent).",
      },
      {
        heading: "3. Data Sharing",
        content:
          "We share data only with trusted service providers necessary to operate our service: Supabase (database and authentication), LemonSqueezy and Toss Payments (payment processing), Cloudflare (media delivery), and Resend (transactional email). These providers are contractually bound to protect your data. We do not sell your personal data.",
      },
      {
        heading: "4. Data Retention",
        content:
          "We retain your account data for as long as your account is active. Order and payment records are kept for 5 years to comply with accounting regulations. You may request deletion of your account at any time by contacting us.",
      },
      {
        heading: "5. Your Rights",
        content:
          "You have the right to access, correct, and delete your personal data. You may withdraw consent for marketing emails at any time using the unsubscribe link in any marketing email. To exercise these rights, contact us at privacy@mystic-lab.com.",
      },
      {
        heading: "6. Korean Residents (개인정보보호법)",
        content:
          "In accordance with Korea's Personal Information Protection Act (PIPA), we collect: name and email (account management), address and phone (order delivery), and payment information (payment processing). Retention periods: account data until account deletion; order data for 5 years. Third-party processors: Supabase Inc. (infrastructure), LemonSqueezy Inc. (payment), Toss Payments (payment). You have the right to access, correct, delete, and suspend processing of your data. Contact our privacy officer at privacy@mystic-lab.com.",
      },
      {
        heading: "7. EU & EEA Residents (GDPR)",
        content:
          "For residents of the European Union and European Economic Area, we process personal data under the following legal bases: contract performance (order fulfilment), legitimate interests (fraud prevention, service improvement), and consent (marketing communications). You have rights under Articles 15–22 of the GDPR: access, rectification, erasure, restriction, portability, and objection. To exercise these rights or to lodge a complaint with your local data protection authority, contact privacy@mystic-lab.com.",
      },
      {
        heading: "8. California Residents (CCPA)",
        content:
          "California residents have the right to know what personal information we collect, to request deletion, and to opt out of the sale of personal information. We do not sell personal information. To submit a request, contact privacy@mystic-lab.com.",
      },
      {
        heading: "9. Cookies",
        content:
          "We use essential cookies for authentication and session management, and analytics cookies (Google Analytics) to understand how our site is used. You can disable non-essential cookies in your browser settings.",
      },
      {
        heading: "10. Contact",
        content:
          "For privacy-related questions, contact us at privacy@mystic-lab.com. We aim to respond within 30 days.",
      },
    ],
  },
  ko: {
    title: "개인정보처리방침",
    lastUpdated: "2026년 6월",
    intro:
      "Mystic Lab('당사')은 귀하의 개인정보를 소중히 여기며, 개인정보보호법 및 관련 법령을 준수하여 귀하의 개인정보를 안전하게 처리합니다.",
    sections: [
      {
        heading: "1. 수집하는 개인정보 항목",
        content:
          "당사는 다음과 같은 개인정보를 수집합니다. 필수 항목: 이름, 이메일 주소, 비밀번호(암호화). 서비스 이용 시 추가 수집: 배송지 주소, 전화번호, 결제 정보(카드번호는 결제 대행사에서 처리). 서비스 이용 과정에서 자동 수집: IP 주소, 쿠키, 방문 기록, 기기 정보.",
      },
      {
        heading: "2. 개인정보 수집 및 이용 목적",
        content:
          "당사는 수집한 개인정보를 다음 목적으로 이용합니다: 회원 가입 및 관리, 상품 주문 및 배송, 구매한 해법 영상 접근 권한 제공, 고객 문의 응대, 서비스 개선. 마케팅 목적의 이메일 발송은 별도 동의를 받은 경우에만 수행합니다.",
      },
      {
        heading: "3. 개인정보 보유 및 이용 기간",
        content:
          "회원 탈퇴 시까지 보유합니다. 단, 관련 법령에 따라 일정 기간 보존해야 하는 정보는 해당 기간 동안 보유합니다: 계약 또는 청약철회 기록 5년(전자상거래법), 대금결제 및 재화 공급 기록 5년, 소비자 불만 및 분쟁 처리 기록 3년.",
      },
      {
        heading: "4. 개인정보의 제3자 제공",
        content:
          "당사는 귀하의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 서비스 운영을 위해 다음 수탁사에 처리를 위탁합니다: Supabase Inc.(데이터베이스/인증), LemonSqueezy Inc.(해외 결제), 토스페이먼츠(국내 결제), Cloudflare Inc.(미디어 제공), Resend Inc.(이메일 발송). 각 수탁사는 위탁 목적 범위 내에서만 개인정보를 처리합니다.",
      },
      {
        heading: "5. 정보주체의 권리",
        content:
          "귀하는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리 정지를 요구할 수 있습니다. 개인정보 관련 문의는 privacy@mystic-lab.com으로 연락해주세요. 당사는 10일 이내에 처리 결과를 알려드립니다.",
      },
      {
        heading: "6. 개인정보 보호책임자",
        content:
          "개인정보 처리에 관한 업무를 총괄하고 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제를 위해 아래와 같이 개인정보 보호책임자를 지정합니다. 이메일: privacy@mystic-lab.com. 귀하는 개인정보보호법 제62조에 따른 개인정보 침해 신고센터(privacy.kisa.or.kr)에 신고할 수 있습니다.",
      },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    lastUpdated: "2026年6月",
    intro:
      "Mystic Lab（以下「当社」）は、お客様の個人情報の保護を重要視し、適切な取り扱いに努めます。本ポリシーは、当社がどのようにお客様の情報を収集・使用・保護するかを説明します。",
    sections: [
      {
        heading: "1. 収集する情報",
        content:
          "当社は以下の情報を収集します：氏名、メールアドレス、配送先住所、支払い情報（注文時）、注文履歴、お問い合わせ内容。また、IPアドレス、ブラウザの種類、Cookieなどの技術的情報も自動的に収集されます。",
      },
      {
        heading: "2. 情報の利用目的",
        content:
          "収集した情報は以下の目的で使用します：注文の処理と発送、購入した解説動画へのアクセス提供、取引に関するメール送信（注文確認・発送通知）、お客様サポート、サービスの改善。マーケティングメールの送信は明示的な同意がある場合のみ行います。",
      },
      {
        heading: "3. 情報の第三者提供",
        content:
          "当社はサービス運営のため、以下の信頼できる事業者に情報を提供します：Supabase Inc.（データベース・認証）、LemonSqueezy Inc.（決済処理）、Cloudflare Inc.（メディア配信）、Resend Inc.（メール送信）。これらの事業者は契約上、情報を保護する義務を負っています。個人情報を販売することはありません。",
      },
      {
        heading: "4. データの保存期間",
        content:
          "アカウントが有効な期間中、お客様のデータを保持します。注文・支払い記録は会計規制に準拠して5年間保存されます。アカウントの削除はお問い合わせください。",
      },
      {
        heading: "5. お客様の権利",
        content:
          "お客様は個人情報へのアクセス、訂正、削除を要求する権利があります。マーケティングメールへの同意はいつでも撤回できます。権利の行使はprivacy@mystic-lab.comまでご連絡ください。",
      },
    ],
  },
  "zh-CN": {
    title: "隐私政策",
    lastUpdated: "2026年6月",
    intro:
      "Mystic Lab（以下简称“我们”）重视您的隐私保护，致力于安全处理您的个人信息。本政策说明我们如何收集、使用和保护您的信息。",
    sections: [
      {
        heading: "1. 我们收集的信息",
        content:
          "我们收集您直接提供的信息：姓名、电子邮件地址、收货地址及结账时的支付信息。还包括订单历史、产品偏好及您发送的消息。IP地址、浏览器类型和Cookie等技术数据会被自动收集。",
      },
      {
        heading: "2. 信息使用目的",
        content:
          "我们使用您的数据：处理和履行订单、提供已购解说视频访问权限、发送交易邮件（订单确认、物流更新）、回复客户咨询、改进产品和服务。营销邮件仅在您明确同意的情况下发送。",
      },
      {
        heading: "3. 信息共享",
        content:
          "我们仅与运营服务所必需的受信任服务商共享数据：Supabase Inc.（数据库和认证）、LemonSqueezy Inc. 和 Toss Payments（支付处理）、Cloudflare Inc.（媒体分发）、Resend Inc.（邮件服务）。我们不出售您的个人数据。",
      },
      {
        heading: "4. 数据保留",
        content:
          "我们在账户有效期间保留您的数据。订单和支付记录依照财务法规保存5年。您可随时联系我们申请删除账户。",
      },
      {
        heading: "5. 您的权利",
        content:
          "您有权访问、更正和删除您的个人数据。可随时通过营销邮件中的退订链接撤回营销同意。如需行使相关权利，请联系 privacy@mystic-lab.com。",
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Junio 2026",
    intro:
      "Mystic Lab ('nosotros') respeta tu privacidad y se compromete a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información.",
    sections: [
      {
        heading: "1. Datos que Recopilamos",
        content:
          "Recopilamos información que proporcionas directamente: nombre, correo electrónico, dirección de envío e información de pago durante el proceso de compra. También se recopilan automáticamente datos técnicos como dirección IP, tipo de navegador y cookies.",
      },
      {
        heading: "2. Uso de tus Datos",
        content:
          "Usamos tus datos para: procesar y entregar pedidos, proporcionar acceso a videos de soluciones comprados, enviar correos transaccionales, responder consultas, y mejorar nuestros servicios. Los correos de marketing solo se envían con tu consentimiento explícito.",
      },
      {
        heading: "3. Compartir Datos",
        content:
          "Compartimos datos solo con proveedores de servicios necesarios para operar: Supabase (base de datos), LemonSqueezy y Toss Payments (pagos), Cloudflare (medios), Resend (correo). No vendemos tus datos personales.",
      },
      {
        heading: "4. Residentes de la UE (RGPD)",
        content:
          "Los residentes de la Unión Europea tienen derechos bajo los Artículos 15–22 del RGPD: acceso, rectificación, supresión, restricción, portabilidad y oposición. Para ejercer estos derechos, contáctanos en privacy@mystic-lab.com.",
      },
      {
        heading: "5. Tus Derechos",
        content:
          "Tienes derecho a acceder, corregir y eliminar tus datos personales. Puedes retirar el consentimiento para correos de marketing en cualquier momento. Contáctanos en privacy@mystic-lab.com.",
      },
    ],
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Juin 2026",
    intro:
      "Mystic Lab ('nous') respecte votre vie privée et s'engage à protéger vos données personnelles. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.",
    sections: [
      {
        heading: "1. Données Collectées",
        content:
          "Nous collectons les informations que vous fournissez directement : nom, adresse e-mail, adresse de livraison et informations de paiement lors du passage en caisse. Des données techniques (adresse IP, type de navigateur, cookies) sont également collectées automatiquement.",
      },
      {
        heading: "2. Utilisation de vos Données",
        content:
          "Vos données sont utilisées pour : traiter et exécuter les commandes, fournir l'accès aux vidéos de solutions achetées, envoyer des e-mails transactionnels, répondre aux demandes, et améliorer nos services. Les e-mails marketing ne sont envoyés qu'avec votre consentement explicite.",
      },
      {
        heading: "3. Partage des Données",
        content:
          "Nous partageons des données uniquement avec des prestataires nécessaires : Supabase (base de données), LemonSqueezy et Toss Payments (paiements), Cloudflare (médias), Resend (e-mail). Nous ne vendons pas vos données personnelles.",
      },
      {
        heading: "4. Résidents de l'UE (RGPD)",
        content:
          "Conformément au RGPD, vous disposez des droits suivants (Articles 15–22) : accès, rectification, effacement, limitation, portabilité et opposition. Pour exercer ces droits ou déposer une réclamation auprès d'une autorité de contrôle (CNIL en France), contactez privacy@mystic-lab.com.",
      },
      {
        heading: "5. Vos Droits",
        content:
          "Vous pouvez accéder à vos données, les corriger ou les supprimer à tout moment. Vous pouvez retirer votre consentement aux e-mails marketing via le lien de désinscription. Contactez-nous à privacy@mystic-lab.com.",
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    lastUpdated: "Juni 2026",
    intro:
      "Mystic Lab ('wir') nimmt den Schutz deiner persönlichen Daten ernst und verarbeitet sie gemäß der DSGVO und anderen anwendbaren Datenschutzgesetzen.",
    sections: [
      {
        heading: "1. Erhobene Daten",
        content:
          "Wir erheben Daten, die du uns direkt mitteilst: Name, E-Mail-Adresse, Lieferadresse und Zahlungsinformationen beim Checkout. Technische Daten wie IP-Adresse, Browsertyp und Cookies werden automatisch erfasst.",
      },
      {
        heading: "2. Verwendung deiner Daten",
        content:
          "Wir verwenden deine Daten für: Bestellabwicklung und Versand, Bereitstellung von gekauften Lösungsvideos, transaktionale E-Mails, Kundenanfragen und Serviceverbesserungen. Marketing-E-Mails werden nur mit deiner ausdrücklichen Einwilligung versandt.",
      },
      {
        heading: "3. Weitergabe von Daten",
        content:
          "Wir teilen Daten nur mit notwendigen Dienstleistern: Supabase (Datenbank), LemonSqueezy und Toss Payments (Zahlungen), Cloudflare (Medien), Resend (E-Mail). Wir verkaufen keine persönlichen Daten.",
      },
      {
        heading: "4. EU-Bewohner (DSGVO)",
        content:
          "Gemäß DSGVO (Art. 15–22) hast du das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Du kannst dich an deinen lokalen Datenschutzbeauftragten wenden. Kontakt: privacy@mystic-lab.com.",
      },
      {
        heading: "5. Deine Rechte",
        content:
          "Du kannst deine Einwilligung zur Verarbeitung jederzeit widerrufen. Für Anfragen zur Datenlöschung oder zu deinen Rechten wende dich an privacy@mystic-lab.com.",
      },
    ],
  },
};

export default async function PrivacyPage({ params }: Props) {
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
