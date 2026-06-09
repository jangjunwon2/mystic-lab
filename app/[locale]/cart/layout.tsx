import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Shopping Cart",
    ko: "장바구니",
    ja: "ショッピングカート",
    "zh-CN": "购物车",
    es: "Carrito",
    fr: "Panier",
    de: "Warenkorb",
  };
  return { title: titles[locale] ?? titles.en, robots: "noindex" };
}

export default function CartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
