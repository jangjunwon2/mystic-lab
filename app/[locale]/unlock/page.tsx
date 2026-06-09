"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Unlock, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import CloudflarePlayer from "@/components/video/CloudflarePlayer";

interface Props {
  params: Promise<{ locale: string }>;
}

interface UnlockResult {
  signedUrl: string | null;
  videoTitle: string | null;
  productId: string;
}

export default function UnlockPage({ params }: Props) {
  const t = useTranslations("unlock");
  const tTutorial = useTranslations("tutorial");
  const [locale, setLocale] = useState("en");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnlockResult | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  // Format input: auto-insert dashes for XXXX-XXXX-XXXX pattern
  function handleCodeChange(raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts = [cleaned.slice(0, 4), cleaned.slice(4, 8), cleaned.slice(8, 12)].filter(Boolean);
    setCode(parts.join("-"));
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("error"));
      } else {
        setResult(data as UnlockResult);
      }
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: "#0D0D1A" }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6" style={{ color: "#7C3AED" }} />
            <span
              className="text-xl font-bold tracking-wider"
              style={{ fontFamily: "var(--font-cinzel), serif", color: "#F0E6FF" }}
            >
              MYSTIC LAB
            </span>
          </Link>

          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}
          >
            <KeyRound className="w-7 h-7" style={{ color: "#A855F7" }} />
          </div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-cinzel), serif", color: "#F0E6FF" }}
          >
            {t("title")}
          </h1>
          <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: "#9CA3AF" }}>
            {t("description")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            /* ── Code entry form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border p-8"
              style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
            >
              {error && (
                <div
                  className="mb-5 flex items-start gap-2 px-4 py-3 rounded-lg text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wide"
                    style={{ color: "#9CA3AF" }}
                  >
                    {t("deviceCodeLabel")}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    required
                    placeholder={t("codePlaceholder")}
                    maxLength={14}
                    className="w-full rounded-xl px-4 py-3 text-center tracking-widest font-mono text-base focus:outline-none transition-colors"
                    style={{
                      background: "#13131F",
                      border: "1px solid #2D2D4E",
                      color: "#F0E6FF",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#2D2D4E")}
                  />
                  <p className="text-center mt-2 text-xs" style={{ color: "#6B7280" }}>
                    {t("deviceCodeHint")}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.replace(/-/g, "").length < 4}
                  className="w-full flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  {loading ? t("checking") : t("submit")}
                </button>
              </form>

              <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid #2D2D4E" }}>
                <p className="text-xs mb-2" style={{ color: "#6B7280" }}>
                  {t("haveAccount")}
                </p>
                <Link
                  href={`/${locale}/sign-in`}
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: "#A855F7" }}
                >
                  {t("signInLink")}
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ── Success: show video ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border p-6 space-y-5"
              style={{
                background: "#1A1A2E",
                borderColor: "rgba(124,58,237,0.4)",
                boxShadow: "0 0 30px rgba(124,58,237,0.15)",
              }}
            >
              {/* Success badge */}
              <div className="text-center">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-3"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {t("unlockedBadge")}
                </div>
                {result.videoTitle && (
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>{result.videoTitle}</p>
                )}
              </div>

              {/* Video or no-video state */}
              {result.signedUrl ? (
                <CloudflarePlayer
                  src={result.signedUrl}
                  title={result.videoTitle ?? tTutorial("solutionTutorial")}
                />
              ) : (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ background: "#13131F", border: "1px solid #2D2D4E" }}
                >
                  <p className="font-medium mb-2" style={{ color: "#F0E6FF" }}>
                    {tTutorial("comingSoonTitle")}
                  </p>
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>
                    {t("codeValidBody")}
                  </p>
                </div>
              )}

              {/* Navigation links */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => { setResult(null); setCode(""); setError(null); }}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
                  style={{ background: "#2D2D4E", color: "#9CA3AF" }}
                >
                  {t("enterAnotherCode")}
                </button>
                <Link
                  href={`/${locale}/products`}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid rgba(124,58,237,0.3)" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("browseProducts")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
