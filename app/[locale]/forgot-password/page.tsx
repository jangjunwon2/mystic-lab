"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default function ForgotPasswordPage({ params }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [locale, setLocale] = useState("en");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/reset-password`,
      }
    );

    setLoading(false);

    if (authError) {
      setError(t("errGeneric"));
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-[#7C3AED]" />
            <span
              className="text-xl font-bold tracking-wider text-[#F0E6FF]"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              MYSTIC LAB
            </span>
          </Link>
          <h1
            className="text-2xl font-bold text-[#F0E6FF] mb-1"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {t("fpTitle")}
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            {t("fpSubtitle")}
          </p>
        </div>

        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[#F0E6FF] mb-2">{t("fpCheckTitle")}</h2>
              <p className="text-sm text-[#9CA3AF] mb-6">
                {t("fpCheckBody", { email })}
              </p>
              <button
                onClick={() => router.push(`/${locale}/sign-in`)}
                className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
              >
                {t("backToSignIn")}
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                    {t("emailLabel")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-medium py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {loading ? t("fpSending") : t("fpSend")}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex items-center gap-1 text-[#A855F7] hover:text-[#C084FC] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {t("backToSignIn")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
