"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Lock, Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default function ResetPasswordPage({ params }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [locale, setLocale] = useState("en");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("errPasswordShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("errPasswordMismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(t("errUpdateFailed"));
      return;
    }

    setDone(true);
    setTimeout(() => router.push(`/${locale}/account`), 2500);
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
            {t("rpTitle")}
          </h1>
          <p className="text-sm text-[#9CA3AF]">{t("rpSubtitle")}</p>
        </div>

        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[#F0E6FF] mb-2">{t("rpDoneTitle")}</h2>
              <p className="text-sm text-[#9CA3AF]">{t("rpDoneBody")}</p>
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
                    {t("newPasswordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder={t("phMin8")}
                      className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-10 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                    {t("confirmPasswordLabel")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder={t("phRepeat")}
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
                    <Lock className="w-4 h-4" />
                  )}
                  {loading ? t("rpUpdating") : t("rpUpdate")}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
