"use client";
// v2
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Zap, Copy, Check } from "lucide-react";

interface Props {
  productId: string;
  locale: string;
}

// 회원 구매자에게 해법 영상 하단에서 자동 발급 코드 + 웹앱 실행을 제공
export default function MagicMemberAccess({ productId, locale }: Props) {
  const router = useRouter();
  const t = useTranslations("calc");

  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("ml_calc_device_token")) setActivated(true);
    } catch { /* ignore */ }

    fetch("/api/magic/my-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.code) setCode(d.code);
      })
      .catch(() => { /* 구매 안 했거나 오류 → 표시 안 함 */ })
      .finally(() => setLoading(false));
  }, [productId]);

  const openApp = () => router.push(`/${locale}/calc`);

  const activateAndOpen = async () => {
    if (!code) return;
    setActivating(true);
    setError("");
    try {
      const res = await fetch("/api/magic/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productId }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        try { localStorage.setItem("ml_calc_device_token", d.deviceToken); } catch { /* ignore */ }
        router.push(`/${locale}/calc`);
      } else {
        setError(d.error ?? t("maErrActivation"));
      }
    } catch {
      setError(t("maErrServer"));
    } finally {
      setActivating(false);
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 로딩 중이거나 코드 없음(미구매)이면 노출하지 않음
  if (loading || !code) return null;

  return (
    <div className="mt-6 rounded-xl border border-[#2D2D4E] bg-[#13131F] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#A855F7]" />
        <h3 className="text-sm font-semibold text-[#F0E6FF]">
          {t("maTitle")}
        </h3>
      </div>
      <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
        {t("maDesc")}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <code className="flex-1 px-3 py-2 rounded-lg bg-[#0D0D1A] border border-[#2D2D4E] font-mono text-sm text-[#A855F7] tracking-wider select-all">
          {code}
        </code>
        <button
          onClick={copyCode}
          type="button"
          aria-label="copy code"
          className="p-2 rounded-lg border border-[#2D2D4E] text-[#9CA3AF] hover:text-[#F0E6FF] transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {error && <p className="text-xs text-[#EF4444] mb-3">{error}</p>}

      {activated ? (
        <button
          onClick={openApp}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
        >
          <Zap className="w-4 h-4" />
          {t("maOpen")}
        </button>
      ) : (
        <button
          onClick={activateAndOpen}
          disabled={activating}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {activating ? t("maRegistering") : t("maRegister")}
        </button>
      )}
    </div>
  );
}
