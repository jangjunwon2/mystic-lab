import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Custom Order",
    ko: "커스텀 의뢰",
    ja: "カスタムオーダー",
    "zh-CN": "定制订单",
    es: "Pedido personalizado",
    fr: "Commande personnalisée",
    de: "Sonderbestellung",
  };
  const descriptions: Record<string, string> = {
    en: "Commission a bespoke magic prop or gimmick from Mystic Lab.",
    ko: "Mystic Lab에 맞춤형 마술 소품이나 기믹을 의뢰하세요.",
    ja: "Mystic Labにオーダーメイドのマジック小道具やギミックを依頼する。",
    "zh-CN": "向 Mystic Lab 定制专属魔术道具或机关。",
    es: "Encarga un accesorio o truco de magia a medida en Mystic Lab.",
    fr: "Commandez un accessoire ou un gimmick de magie sur mesure chez Mystic Lab.",
    de: "Beauftragen Sie ein maßgefertigtes Magie-Requisit bei Mystic Lab.",
  };
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
  };
}

export default function CustomOrderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
