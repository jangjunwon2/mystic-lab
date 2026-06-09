import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Contact Us",
    ko: "문의하기",
    ja: "お問い合わせ",
    "zh-CN": "联系我们",
    es: "Contáctanos",
    fr: "Nous contacter",
    de: "Kontakt",
  };
  const descriptions: Record<string, string> = {
    en: "Get in touch with Mystic Lab for inquiries, custom orders, and support.",
    ko: "Mystic Lab에 문의, 커스텀 주문, 지원 요청을 보내세요.",
    ja: "お問い合わせ、カスタム注文、サポートはMystic Labまで。",
    "zh-CN": "联系 Mystic Lab 进行咨询、定制订单和支持。",
    es: "Contacta con Mystic Lab para consultas, pedidos personalizados y soporte.",
    fr: "Contactez Mystic Lab pour des demandes, commandes personnalisées et support.",
    de: "Kontaktieren Sie Mystic Lab für Anfragen, individuelle Bestellungen und Support.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
  };
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
