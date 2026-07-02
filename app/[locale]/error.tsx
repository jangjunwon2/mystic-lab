"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

const content: Record<string, { title: string; body: string; retry: string; home: string }> = {
  en: { title: "Something went wrong", body: "An unexpected error occurred. Please try again.", retry: "Try again", home: "Go home" },
  ko: { title: "오류가 발생했습니다", body: "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.", retry: "다시 시도", home: "홈으로" },
  ja: { title: "エラーが発生しました", body: "予期しないエラーが発生しました。もう一度お試しください。", retry: "再試行", home: "ホームへ" },
  "zh-CN": { title: "出现错误", body: "发生了意外错误，请重试。", retry: "重试", home: "返回首页" },
  es: { title: "Algo salió mal", body: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.", retry: "Reintentar", home: "Ir a inicio" },
  fr: { title: "Une erreur s'est produite", body: "Une erreur inattendue s'est produite. Veuillez réessayer.", retry: "Réessayer", home: "Accueil" },
  de: { title: "Ein Fehler ist aufgetreten", body: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.", retry: "Erneut versuchen", home: "Zur Startseite" },
};

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error.digest) console.error("[error]", error.digest);
  }, [error]);

  const pathname = usePathname() || "";
  const pathLocale = pathname.split("/")[1];
  const locales = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"];
  const isLocale = locales.includes(pathLocale);
  const locale = isLocale ? pathLocale : "en";
  const t = content[locale] ?? content.en;
  const homePath = isLocale ? `/${locale}` : "/en";

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
          href={homePath}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-[#2D2D4E] text-[#9CA3AF] hover:text-[#F0E6FF]"
        >
          <Home className="w-4 h-4" />
          {t.home}
        </Link>
      </div>
    </div>
  );
}
