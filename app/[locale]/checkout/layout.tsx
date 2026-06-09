import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Checkout",
    ko: "결제",
    ja: "チェックアウト",
    "zh-CN": "结账",
    es: "Pago",
    fr: "Paiement",
    de: "Kasse",
  };
  return { title: titles[locale] ?? titles.en, robots: "noindex" };
}

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
