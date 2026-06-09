import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Order Complete",
    ko: "주문 완료",
    ja: "注文完了",
    "zh-CN": "订单完成",
    es: "Pedido completado",
    fr: "Commande confirmée",
    de: "Bestellung abgeschlossen",
  };
  return { title: titles[locale] ?? titles.en, robots: "noindex" };
}

export default function CheckoutSuccessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
