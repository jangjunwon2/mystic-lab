import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Coupons",
    ko: "쿠폰 발급",
    ja: "クーポン",
    "zh-CN": "优惠券",
    es: "Cupones",
    fr: "Coupons",
    de: "Gutscheine",
  };
  return { title: titles[locale] ?? titles.en };
}

export default function CouponsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
