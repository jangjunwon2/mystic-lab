"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Ticket } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  name: string | null;
  type: "percent" | "fixed";
  value: number;
  min_order_usd: number;
  expires_at: string | null;
}

interface Props {
  params: Promise<{ locale: string }>;
}

export default function CouponsClaimPage({ params }: Props) {
  const t = useTranslations("account");
  const [locale, setLocale] = useState("en");
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [claimable, setClaimable] = useState<Coupon[]>([]);
  const [owned, setOwned] = useState<Coupon[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/coupons");
      if (res.status === 401) { setAuthed(false); return; }
      const d = await res.json();
      setOwned(Array.isArray(d.coupons) ? d.coupons : []);
      setClaimable(Array.isArray(d.claimable) ? d.claimable : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
    load();
  }, [params, load]);

  async function claim(code: string) {
    setClaiming(code);
    try {
      const res = await fetch("/api/account/coupons/claim", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
      });
      if (res.ok) await load();
    } finally {
      setClaiming(null);
    }
  }

  const fmtDiscount = (c: Coupon) => (c.type === "fixed" ? `$${c.value}` : `${c.value}%`);

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>{t("couponsPageTitle")}</h1>
          <Link href={`/${locale}/account`} className="text-sm text-[#6B7280] hover:text-[#A855F7] transition-colors">← {t("backToMyAccount")}</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
          </div>
        ) : !authed ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-4">{t("couponsLoginRequired")}</p>
            <Link href={`/${locale}/sign-in`} className="inline-block text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors">{t("signIn")}</Link>
          </div>
        ) : claimable.length === 0 && owned.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t("noCoupons")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 발급 가능한 쿠폰 */}
            {claimable.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">{t("claimableCoupons")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {claimable.map((c) => (
                    <div key={c.id} className="bg-[#1A1A2E] rounded-xl border border-dashed border-[#7C3AED]/50 p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#F0E6FF] mb-1 line-clamp-1">{c.name ?? `${fmtDiscount(c)} OFF`}</p>
                        <p className="text-lg font-bold text-[#A855F7] leading-none">{fmtDiscount(c)}<span className="text-xs ml-1">OFF</span></p>
                        <p className="text-[11px] text-[#6B7280] mt-1.5">
                          {c.min_order_usd > 0 ? `${t("couponMinOrder")} $${c.min_order_usd} · ` : ""}
                          {c.expires_at ? `${t("couponExpires")} ${new Date(c.expires_at).toLocaleDateString(locale)}` : t("couponNoExpiry")}
                        </p>
                      </div>
                      <button onClick={() => claim(c.code)} disabled={claiming === c.code}
                        className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
                        {claiming === c.code ? "…" : t("claimBtn")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보유 쿠폰 */}
            {owned.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">{t("myCouponsLabel")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {owned.map((c) => (
                    <div key={c.id} className="bg-gradient-to-br from-[#7C3AED]/15 to-[#1A1A2E] rounded-xl border border-[#7C3AED]/40 p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        {c.name && <p className="text-sm font-semibold text-[#F0E6FF] mb-1 line-clamp-1">{c.name}</p>}
                        <p className="text-2xl font-bold text-[#F0E6FF] leading-none mb-2">{fmtDiscount(c)}<span className="text-sm font-medium text-[#A855F7] ml-1.5">OFF</span></p>
                        <p className="font-mono text-sm font-semibold text-[#F59E0B] tracking-wider">{c.code}</p>
                        <p className="text-[11px] text-[#6B7280] mt-1.5">
                          {c.min_order_usd > 0 ? `${t("couponMinOrder")} $${c.min_order_usd} · ` : ""}
                          {c.expires_at ? `${t("couponExpires")} ${new Date(c.expires_at).toLocaleDateString(locale)}` : t("couponNoExpiry")}
                        </p>
                      </div>
                      <Ticket className="w-8 h-8 text-[#7C3AED]/50 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
