"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

const content: Record<string, { title: string; body: string; retry: string; home: string }> = {
  en: { title: "Failed to load product", body: "An error occurred while loading this page.", retry: "Try again", home: "Go home" },
  ko: { title: "상품을 불러오지 못했습니다", body: "페이지를 로드하는 중 오류가 발생했습니다.", retry: "다시 시도", home: "홈으로" },
  ja: { title: "商品を読み込めませんでした", body: "このページの読み込み中にエラーが発生しました。", retry: "再試行", home: "ホームへ" },
  "zh-CN": { title: "商品加载失败", body: "加载此页面时发生了错误。", retry: "重试", home: "返回首页" },
  es: { title: "Error al cargar el producto", body: "Se produjo un error al cargar esta página.", retry: "Reintentar", home: "Ir a inicio" },
  fr: { title: "Impossible de charger le produit", body: "Une erreur s'est produite lors du chargement de cette page.", retry: "Réessayer", home: "Accueil" },
  de: { title: "Produkt konnte nicht geladen werden", body: "Beim Laden dieser Seite ist ein Fehler aufgetreten.", retry: "Erneut versuchen", home: "Zur Startseite" },
};

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = content[locale] ?? content.en;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-[#F0E6FF]">{t.title}</h2>
        <p className="text-sm text-[#6B7280]">{t.body}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors bg-[#7C3AED] text-[#F0E6FF] hover:bg-[#6D28D9]"
        >
          <RefreshCw className="w-4 h-4" />
          {t.retry}
        </button>
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-[#2D2D4E] text-[#9CA3AF] hover:text-[#F0E6FF]"
        >
          <Home className="w-4 h-4" />
          {t.home}
        </Link>
      </div>
    </div>
  );
}
