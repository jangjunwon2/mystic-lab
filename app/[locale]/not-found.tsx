import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { getLocale } from "next-intl/server";

const content: Record<string, { subtitle: string; body: string; home: string }> = {
  en: { subtitle: "Page Not Found", body: "The page you are looking for does not exist or has been moved.", home: "Go home" },
  ko: { subtitle: "페이지를 찾을 수 없습니다", body: "찾으시는 페이지가 없거나 이동되었습니다.", home: "홈으로" },
  ja: { subtitle: "ページが見つかりません", body: "お探しのページは存在しないか、移動されました。", home: "ホームへ" },
  "zh-CN": { subtitle: "页面未找到", body: "您查找的页面不存在或已被移动。", home: "返回首页" },
  es: { subtitle: "Página no encontrada", body: "La página que buscas no existe o ha sido movida.", home: "Ir a inicio" },
  fr: { subtitle: "Page introuvable", body: "La page que vous recherchez n'existe pas ou a été déplacée.", home: "Accueil" },
  de: { subtitle: "Seite nicht gefunden", body: "Die gesuchte Seite existiert nicht oder wurde verschoben.", home: "Zur Startseite" },
};

export default async function NotFound() {
  const locale = await getLocale();
  const t = content[locale] ?? content.en;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20">
        <SearchX className="w-8 h-8 text-purple-400" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>
          404
        </h1>
        <h2 className="text-xl font-semibold mb-2 text-[#F0E6FF]">{t.subtitle}</h2>
        <p className="text-sm text-[#6B7280]">{t.body}</p>
      </div>
      <Link
        href={`/${locale}`}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors bg-[#7C3AED] text-[#F0E6FF] hover:bg-[#6D28D9]"
      >
        <Home className="w-4 h-4" />
        {t.home}
      </Link>
    </div>
  );
}
