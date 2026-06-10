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
    en: "Terms of Service | Mystic Lab",
    ko: "이용약관 | 미스틱 랩",
    ja: "利用規約 | ミスティック・ラボ",
    "zh-CN": "服务条款 | 神秘实验室",
    es: "Términos de servicio | Mystic Lab",
    fr: "Conditions d'utilisation | Mystic Lab",
    de: "Nutzungsbedingungen | Mystic Lab",
  };
  return {
    title: titles[locale] ?? titles.en,
    alternates: {
      canonical: `${SITE_URL}/${locale}/terms`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/terms`])),
        "x-default": `${SITE_URL}/en/terms`,
      },
    },
  };
}

type Section = { heading: string; content: string };
type LegalContent = { title: string; lastUpdated: string; intro: string; sections: Section[] };

const content: Record<string, LegalContent> = {
  en: {
    title: "Terms of Service",
    lastUpdated: "June 2026",
    intro:
      "These Terms of Service govern your use of the Mystic Lab website and services. By creating an account or placing an order, you agree to these terms.",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        content:
          "By accessing or using Mystic Lab, you confirm that you are at least 14 years of age (or 16 for EU residents), have read and understood these terms, and agree to be bound by them. If you do not agree, please do not use our services.",
      },
      {
        heading: "2. Products and Pricing",
        content:
          "All prices are displayed in USD unless otherwise indicated. Prices are subject to change without notice. We reserve the right to limit quantities or refuse orders at our discretion. Product descriptions are provided for informational purposes; actual products may vary slightly.",
      },
      {
        heading: "3. Digital Content",
        content:
          "Upon purchasing a product that includes solution videos, you receive a non-transferable, non-exclusive licence to access that content for personal use. You may not share, reproduce, or distribute the content. Access is tied to your account and cannot be transferred to another person.",
      },
      {
        heading: "4. Prohibited Activities",
        content:
          "You agree not to: (a) use our service for any unlawful purpose; (b) reverse-engineer or copy our products; (c) share your account credentials with others; (d) attempt to gain unauthorised access to our systems; (e) use automated tools to scrape or access our website.",
      },
      {
        heading: "5. Intellectual Property",
        content:
          "All content on this website — including product designs, solution videos, text, and images — is the exclusive property of Mystic Lab and is protected by copyright and applicable intellectual property laws. Unauthorised reproduction or distribution is strictly prohibited.",
      },
      {
        heading: "6. Limitation of Liability",
        content:
          "To the maximum extent permitted by law, Mystic Lab shall not be liable for any indirect, incidental, special, or consequential damages arising from use of our products or services. Our total liability to you shall not exceed the amount you paid for the relevant product.",
      },
      {
        heading: "7. Governing Law",
        content:
          "These terms are governed by the laws of the Republic of Korea. For EU consumers, mandatory consumer protection provisions of your country of residence also apply. Any disputes shall first be sought to be resolved through good-faith negotiation.",
      },
      {
        heading: "8. Changes to Terms",
        content:
          "We may update these terms from time to time. We will notify registered users of material changes by email. Continued use of our services after notification constitutes acceptance of the updated terms.",
      },
      {
        heading: "9. Contact",
        content: "For questions about these terms, contact us at support@mystic-lab.com.",
      },
    ],
  },
  ko: {
    title: "이용약관",
    lastUpdated: "2026년 6월",
    intro:
      "본 이용약관은 Mystic Lab 웹사이트 및 서비스 이용에 관한 조건을 규정합니다. 회원 가입 또는 주문 시 본 약관에 동의한 것으로 간주됩니다.",
    sections: [
      {
        heading: "제1조 (목적)",
        content:
          "본 약관은 Mystic Lab이 제공하는 전자상거래 서비스를 이용함에 있어 Mystic Lab과 이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.",
      },
      {
        heading: "제2조 (이용자 자격)",
        content:
          "서비스 이용자는 만 14세 이상이어야 합니다. 미성년자(만 14세 이상 19세 미만)는 법정대리인의 동의를 받아 서비스를 이용할 수 있습니다.",
      },
      {
        heading: "제3조 (상품 및 가격)",
        content:
          "모든 가격은 달러(USD) 또는 원화(KRW)로 표시됩니다. 가격은 사전 공지 없이 변경될 수 있습니다. 당사는 재량에 따라 수량을 제한하거나 주문을 거부할 수 있습니다.",
      },
      {
        heading: "제4조 (디지털 콘텐츠)",
        content:
          "해법 영상을 포함한 상품 구매 시, 귀하는 개인적 사용을 위한 비독점적·양도 불가능한 이용 권한을 부여받습니다. 콘텐츠를 제3자와 공유하거나 재배포하는 행위는 금지됩니다.",
      },
      {
        heading: "제5조 (금지 행위)",
        content:
          "이용자는 다음 행위를 하여서는 안 됩니다: (가) 서비스의 불법적 이용, (나) 상품 복제 및 역설계, (다) 계정 정보 타인 공유, (라) 시스템 무단 접근 시도, (마) 자동화 도구를 이용한 크롤링.",
      },
      {
        heading: "제6조 (책임 제한)",
        content:
          "당사는 서비스 이용 과정에서 발생하는 간접적 손해에 대해 책임을 지지 않습니다. 당사의 최대 책임은 해당 상품에 대해 귀하가 지불한 금액을 초과하지 않습니다.",
      },
      {
        heading: "제7조 (준거법 및 분쟁 해결)",
        content:
          "본 약관은 대한민국 법률에 따라 해석됩니다. 분쟁 발생 시 당사자 간 협의를 통해 해결을 도모하며, 합의가 이루어지지 않는 경우 수원지방법원을 관할 법원으로 합니다.",
      },
      {
        heading: "제8조 (약관 변경)",
        content:
          "당사는 필요에 따라 약관을 변경할 수 있습니다. 중요한 변경 사항은 가입된 이메일로 사전 통보합니다.",
      },
    ],
  },
  ja: {
    title: "利用規約",
    lastUpdated: "2026年6月",
    intro:
      "本利用規約は、Mystic Labのウェブサイトおよびサービスの利用に関する条件を規定します。アカウント作成または注文を行うことで、本規約に同意したものとみなされます。",
    sections: [
      {
        heading: "1. 利用条件",
        content:
          "Mystic Labをご利用いただくには、14歳以上（EUにお住まいの方は16歳以上）である必要があります。本規約をお読みいただき、同意の上でご利用ください。",
      },
      {
        heading: "2. 商品および価格",
        content:
          "すべての価格は特に指定がない限りUSDで表示されます。価格は予告なく変更される場合があります。当社は独自の判断で数量制限や注文拒否をする権利を有します。",
      },
      {
        heading: "3. デジタルコンテンツ",
        content:
          "解説動画を含む商品をご購入いただくと、個人利用目的の非独占的・譲渡不可能なライセンスが付与されます。コンテンツを第三者と共有または配布することは禁止されています。",
      },
      {
        heading: "4. 禁止事項",
        content:
          "以下の行為を禁止します：(a) 違法目的での利用、(b) 商品の複製・リバースエンジニアリング、(c) アカウント情報の他者との共有、(d) システムへの不正アクセス試行、(e) 自動化ツールによるスクレイピング。",
      },
      {
        heading: "5. 知的財産権",
        content:
          "本サイト上のすべてのコンテンツ（商品デザイン、解説動画、テキスト、画像）はMystic Labの独占的財産であり、著作権その他の知的財産権によって保護されています。",
      },
      {
        heading: "6. 責任の制限",
        content:
          "Mystic Labは、サービスの利用から生じる間接的損害について責任を負いません。当社の最大責任は、お客様が当該商品に支払った金額を超えないものとします。",
      },
      {
        heading: "7. 準拠法",
        content:
          "本規約は大韓民国の法律に準拠します。お問い合わせはsupport@mystic-lab.comまでご連絡ください。",
      },
    ],
  },
  "zh-CN": {
    title: "服务条款",
    lastUpdated: "2026年6月",
    intro:
      "本服务条款规定了您使用Mystic Lab网站和服务的条件。注册账户或下订单即表示您同意本条款。",
    sections: [
      {
        heading: "1. 接受条款",
        content:
          "使用Mystic Lab即表示您已年满14周岁（欧盟居民需16周岁），已阅读并理解本条款，并同意受其约束。",
      },
      {
        heading: "2. 商品与定价",
        content:
          "所有价格以美元（USD）显示，除非另有说明。价格可能随时变更，恕不另行通知。我们保留限制数量或拒绝订单的权利。",
      },
      {
        heading: "3. 数字内容",
        content:
          "购买包含解说视频的产品后，您将获得仅供个人使用的非独占、不可转让许可证。禁止共享、复制或分发内容。",
      },
      {
        heading: "4. 禁止行为",
        content:
          "您同意不得：(a) 将服务用于任何非法目的；(b) 反向工程或复制我们的产品；(c) 与他人共享账户凭据；(d) 尝试未经授权访问我们的系统；(e) 使用自动化工具爬取我们的网站。",
      },
      {
        heading: "5. 知识产权",
        content:
          "本网站上的所有内容（包括产品设计、解说视频、文字和图像）均为Mystic Lab的专有财产，受版权和相关知识产权法保护。",
      },
      {
        heading: "6. 责任限制",
        content:
          "在法律允许的最大范围内，Mystic Lab不对任何间接、附带或后果性损害承担责任。我们对您的总责任不超过您为相关产品支付的金额。",
      },
      {
        heading: "7. 适用法律",
        content:
          "本条款受韩国法律管辖。如有疑问，请联系support@mystic-lab.com。",
      },
    ],
  },
  es: {
    title: "Términos de Servicio",
    lastUpdated: "Junio 2026",
    intro:
      "Estos Términos de Servicio rigen tu uso del sitio web y los servicios de Mystic Lab. Al crear una cuenta o realizar un pedido, aceptas estos términos.",
    sections: [
      {
        heading: "1. Aceptación de Términos",
        content:
          "Al usar Mystic Lab, confirmas que tienes al menos 16 años (para residentes de la UE), has leído y comprendido estos términos, y aceptas estar sujeto a ellos.",
      },
      {
        heading: "2. Productos y Precios",
        content:
          "Todos los precios se muestran en USD. Los precios pueden cambiar sin previo aviso. Nos reservamos el derecho de limitar cantidades o rechazar pedidos a nuestra discreción.",
      },
      {
        heading: "3. Contenido Digital",
        content:
          "Al comprar un producto que incluye videos de soluciones, recibes una licencia no exclusiva e intransferible para acceder a ese contenido para uso personal. Está prohibido compartir o distribuir el contenido.",
      },
      {
        heading: "4. Ley Aplicable",
        content:
          "Estos términos se rigen por las leyes de la República de Corea. Para los consumidores de la UE, también se aplican las disposiciones obligatorias de protección al consumidor de tu país de residencia.",
      },
      {
        heading: "5. Contacto",
        content: "Para consultas sobre estos términos, contáctanos en support@mystic-lab.com.",
      },
    ],
  },
  fr: {
    title: "Conditions d'Utilisation",
    lastUpdated: "Juin 2026",
    intro:
      "Les présentes Conditions d'Utilisation régissent votre utilisation du site web et des services de Mystic Lab. En créant un compte ou en passant une commande, vous acceptez ces conditions.",
    sections: [
      {
        heading: "1. Acceptation des Conditions",
        content:
          "En utilisant Mystic Lab, vous confirmez avoir au moins 16 ans (pour les résidents de l'UE), avoir lu et compris ces conditions, et accepter d'être lié par elles.",
      },
      {
        heading: "2. Produits et Prix",
        content:
          "Tous les prix sont affichés en USD sauf indication contraire. Les prix peuvent être modifiés sans préavis. Nous nous réservons le droit de limiter les quantités ou de refuser des commandes.",
      },
      {
        heading: "3. Contenu Numérique",
        content:
          "Lors de l'achat d'un produit incluant des vidéos de solutions, vous recevez une licence non exclusive et non transférable pour accéder à ce contenu à des fins personnelles. Le partage ou la distribution du contenu est interdit.",
      },
      {
        heading: "4. Loi Applicable",
        content:
          "Ces conditions sont régies par le droit de la République de Corée. Pour les consommateurs de l'UE, les dispositions obligatoires de protection des consommateurs de votre pays de résidence s'appliquent également.",
      },
      {
        heading: "5. Contact",
        content: "Pour toute question concernant ces conditions, contactez-nous à support@mystic-lab.com.",
      },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    lastUpdated: "Juni 2026",
    intro:
      "Diese Nutzungsbedingungen regeln die Nutzung der Mystic Lab-Website und -Dienste. Durch Erstellung eines Kontos oder Aufgabe einer Bestellung stimmst du diesen Bedingungen zu.",
    sections: [
      {
        heading: "1. Akzeptanz der Bedingungen",
        content:
          "Durch die Nutzung von Mystic Lab bestätigst du, mindestens 16 Jahre alt zu sein (für EU-Bewohner), diese Bedingungen gelesen und verstanden zu haben und ihnen zuzustimmen.",
      },
      {
        heading: "2. Produkte und Preise",
        content:
          "Alle Preise werden in USD angezeigt, sofern nicht anders angegeben. Preise können ohne Vorankündigung geändert werden. Wir behalten uns das Recht vor, Mengen zu begrenzen oder Bestellungen abzulehnen.",
      },
      {
        heading: "3. Digitale Inhalte",
        content:
          "Beim Kauf eines Produkts mit Lösungsvideos erhältst du eine nicht-exklusive, nicht-übertragbare Lizenz für den persönlichen Zugang zu diesen Inhalten. Die Weitergabe oder Verteilung der Inhalte ist verboten.",
      },
      {
        heading: "4. Anwendbares Recht",
        content:
          "Diese Bedingungen unterliegen dem Recht der Republik Korea. Für EU-Verbraucher gelten zusätzlich die zwingenden Verbraucherschutzvorschriften deines Wohnsitzlandes.",
      },
      {
        heading: "5. Kontakt",
        content: "Bei Fragen zu diesen Bedingungen kontaktiere uns unter support@mystic-lab.com.",
      },
    ],
  },
};

export default async function TermsPage({ params }: Props) {
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
