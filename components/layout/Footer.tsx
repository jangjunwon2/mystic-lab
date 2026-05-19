"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const year = new Date().getFullYear();

  const links = [
    { href: `/${locale}/products`, key: "products" },
    { href: `/${locale}/custom-order`, key: "customOrder" },
    { href: `/${locale}/about`, key: "about" },
    { href: `/${locale}/contact`, key: "contact" },
    { href: `/${locale}/privacy`, key: "privacy" },
    { href: `/${locale}/terms`, key: "terms" },
  ] as const;

  return (
    <footer className="bg-[#0A0A16] border-t border-[#2D2D4E] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#A855F7]" />
              <span
                className="font-bold text-lg tracking-widest text-[#F0E6FF]"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                MYSTIC LAB
              </span>
            </div>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{t("tagline")}</p>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {links.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors"
                >
                  {t(`links.${link.key}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#2D2D4E]">
          <p className="text-xs text-[#9CA3AF] text-center">
            {t("copyright", { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
