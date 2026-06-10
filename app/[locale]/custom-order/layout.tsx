import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Custom Order | Mystic Lab",
    ko: "커스텀 의뢰 | 미스틱 랩",
    ja: "カスタムオーダー | ミスティック・ラボ",
    "zh-CN": "定制订单 | 神秘实验室",
    es: "Pedido personalizado | Mystic Lab",
    fr: "Commande personnalisée | Mystic Lab",
    de: "Sonderbestellung | Mystic Lab",
  };
  const descriptions: Record<string, string> = {
    en: "Commission a bespoke magic prop or electronic gimmick from Mystic Lab — tailored to your performance needs.",
    ko: "미스틱 랩에 맞춤형 마술 소품이나 전자 기믹을 의뢰하세요 — 당신의 퍼포먼스에 맞게 제작합니다.",
    ja: "Mystic Labにオーダーメイドのマジック小道具や電子ギミックを依頼する — あなたのパフォーマンスに合わせて製作。",
    "zh-CN": "向 Mystic Lab 定制专属魔术道具或电子机关 — 根据您的演出需求量身打造。",
    es: "Encarga un accesorio o gimmick electrónico a medida en Mystic Lab — adaptado a tus necesidades de actuación.",
    fr: "Commandez un accessoire ou un gimmick électronique sur mesure chez Mystic Lab — adapté à vos besoins de performance.",
    de: "Beauftragen Sie ein maßgefertigtes Magie-Requisit oder elektronisches Gimmick bei Mystic Lab — auf Ihre Auftrittsbedürfnisse zugeschnitten.",
  };
  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/custom-order`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/custom-order`])),
        "x-default": `${SITE_URL}/en/custom-order`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/custom-order`,
    },
  };
}

export default function CustomOrderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
