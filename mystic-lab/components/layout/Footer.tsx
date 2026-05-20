"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles, Mail, ArrowRight, Check } from "lucide-react";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const links = [
    { href: `/${locale}/products`, key: "products" },
    { href: `/${locale}/custom-order`, key: "customOrder" },
    { href: `/${locale}/about`, key: "about" },
    { href: `/${locale}/contact`, key: "contact" },
    { href: `/${locale}/privacy`, key: "privacy" },
    { href: `/${locale}/terms`, key: "terms" },
  ] as const;

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, source: "footer" }),
      });
      setSubStatus(res.ok ? "done" : "error");
    } catch {
      setSubStatus("error");
    }
  }

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
            <p className="text-sm text-[#9CA3AF] leading-relaxed mb-5">{t("tagline")}</p>

            {/* Newsletter */}
            {subStatus === "done" ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <Check className="w-4 h-4" />
                Subscribed — thank you!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="flex-1 flex items-center bg-[#1A1A2E] border border-[#2D2D4E] rounded-lg px-3 gap-2 focus-within:border-[#7C3AED]/60 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-xs text-[#F0E6FF] placeholder:text-[#4B5563] py-2 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subStatus === "loading"}
                  className="px-3 py-2 bg-[#7C3AED] rounded-lg text-white hover:bg-[#6D28D9] transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            {subStatus === "error" && (
              <p className="text-xs text-red-400 mt-1">Something went wrong. Try again.</p>
            )}
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
