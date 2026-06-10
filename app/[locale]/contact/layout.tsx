import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

const CONTACT_META: Record<string, { title: string; description: string }> = {
  en: { title: "Contact Us | Mystic Lab", description: "Get in touch with Mystic Lab — questions, partnerships, press inquiries, and custom order consultations." },
  ko: { title: "문의하기 | 미스틱 랩", description: "미스틱 랩에 문의하세요 — 제품 질문, 파트너십, 보도 문의, 커스텀 주문 상담." },
  ja: { title: "お問い合わせ | ミスティック・ラボ", description: "ミスティック・ラボへのご連絡 — 商品の質問、パートナーシップ、報道問い合わせ、カスタム注文相談。" },
  "zh-CN": { title: "联系我们 | 神秘实验室", description: "联系神秘实验室 — 产品咨询、合作伙伴关系、媒体查询和定制订单咨询。" },
  es: { title: "Contáctanos | Mystic Lab", description: "Contáctate con Mystic Lab — preguntas, asociaciones, consultas de prensa y pedidos personalizados." },
  fr: { title: "Nous contacter | Mystic Lab", description: "Contactez Mystic Lab — questions, partenariats, demandes presse et commandes personnalisées." },
  de: { title: "Kontakt | Mystic Lab", description: "Kontaktieren Sie Mystic Lab — Fragen, Partnerschaften, Presseanfragen und individuelle Bestellungen." },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = CONTACT_META[locale] ?? CONTACT_META.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/contact`])),
        "x-default": `${SITE_URL}/en/contact`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}/contact`,
    },
  };
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
