import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Create Account",
    ko: "회원가입",
    ja: "アカウント作成",
    "zh-CN": "创建账户",
    es: "Crear cuenta",
    fr: "Créer un compte",
    de: "Konto erstellen",
  };
  return { title: titles[locale] ?? titles.en };
}

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
