"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Send, Zap, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CustomOrderPage({ params }: Props) {
  const t = useTranslations("customOrder");
  const [locale, setLocale] = useState("en");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    description: "",
    budget_range: "",
    desired_deadline: "",
  });

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  // 로그인 회원이면 이름·이메일 자동 입력 (수정 가능). 빈 칸만 채워 사용자 입력은 보존
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const name = (user.user_metadata?.full_name as string | undefined)?.trim() ?? "";
      const email = user.email ?? "";
      setForm((prev) => ({
        ...prev,
        name: prev.name || name,
        email: prev.email || email,
      }));
    });
  }, []);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("form.error"));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.error"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2
              className="text-xl font-bold text-[#F0E6FF] mb-3"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {t("sentTitle")}
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6">{t("form.success")}</p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              {t("backHome")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h1
              className="text-3xl font-bold text-[#F0E6FF]"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {t("title")}
            </h1>
          </div>
          <div className="w-16 h-px bg-[#F59E0B] mb-3" />
          <p className="text-[#9CA3AF]">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-8"
        >
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                  {t("form.name")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update("name")}
                  required
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                  placeholder={t("form.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                  {t("form.email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  required
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                {t("form.description")}
              </label>
              <textarea
                value={form.description}
                onChange={update("description")}
                required
                rows={6}
                placeholder={t("form.descriptionPlaceholder")}
                className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                  {t("form.budget")}
                </label>
                <select
                  value={form.budget_range}
                  onChange={update("budget_range")}
                  required
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] focus:outline-none focus:border-[#7C3AED] transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>{t("form.selectRange")}</option>
                  <option value="under_500">{t("form.budgetOptions.under500")}</option>
                  <option value="500_1000">{t("form.budgetOptions.500to1000")}</option>
                  <option value="1000_3000">{t("form.budgetOptions.1000to3000")}</option>
                  <option value="over_3000">{t("form.budgetOptions.over3000")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                  {t("form.deadline")} <span className="text-[#6B7280] normal-case">({t("form.optional")})</span>
                </label>
                <input
                  type="date"
                  value={form.desired_deadline}
                  onChange={update("desired_deadline")}
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0D0D1A] font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0D0D1A]/30 border-t-[#0D0D1A] rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Sending..." : t("form.submit")}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-[#4B5563] mt-6">
          We typically respond within 24–48 hours via email.
        </p>
      </div>
    </div>
  );
}
