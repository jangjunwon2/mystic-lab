"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";

interface Props {
  productId: string;
  locale: string;
  slug: string;
  productUrl: string;
  translations: {
    placeholder: string;
    submit: string;
    checking: string;
    goToProduct: string;
  };
}

export default function AppUnlockForm({
  productId,
  slug,
  productUrl,
  translations,
}: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-format input to XXXX-XXXX-XXXX or MC-XXXX-XXXX
  function handleCodeChange(raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleaned.startsWith("MC")) {
      // MC-XXXX-XXXX format
      const rest = cleaned.slice(2);
      const parts = ["MC", rest.slice(0, 4), rest.slice(4, 8)].filter(Boolean);
      setCode(parts.join("-"));
    } else {
      // XXXX-XXXX-XXXX format
      const parts = [cleaned.slice(0, 4), cleaned.slice(4, 8), cleaned.slice(8, 12)].filter(Boolean);
      setCode(parts.join("-"));
    }
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/magic/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, productId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "인증에 실패했습니다.");
      } else if (data.success) {
        // Save to localStorage to optimize client routing
        try {
          const activatedKey = `ml_app_activated_${slug}`;
          localStorage.setItem(activatedKey, "1");
          if (slug === "magic-calculator") {
            localStorage.setItem("ml_calc_device_token", data.deviceToken);
          }
        } catch { /* ignore */ }

        // Reload the page to execute server-side check with new cookies
        window.location.reload();
      }
    } catch {
      setError("서버와의 통신이 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {error && (
        <div
          className="flex items-start gap-2 px-4 py-3 rounded-lg text-sm text-left"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}
        >
          <span className="shrink-0 mt-0.5">⚠</span>
          {error}
        </div>
      )}

      <form onSubmit={handleActivate} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            required
            placeholder={translations.placeholder}
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
        </div>

        <button
          type="submit"
          disabled={loading || code.replace(/-/g, "").length < 4}
          className="w-full flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          {loading ? translations.checking : translations.submit}
        </button>
      </form>

      <div className="pt-4" style={{ borderTop: "1px solid #2D2D4E" }}>
        <Link
          href={productUrl}
          className="inline-flex w-full items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#A855F7",
          }}
        >
          {translations.goToProduct}
        </Link>
      </div>
    </div>
  );
}
