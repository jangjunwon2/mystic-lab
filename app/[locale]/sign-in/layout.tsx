import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Sign In",
    ko: "로그인",
    ja: "ログイン",
    "zh-CN": "登录",
    es: "Iniciar sesión",
    fr: "Se connecter",
    de: "Anmelden",
  };
  return { title: titles[locale] ?? titles.en };
}

export default function SignInLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
