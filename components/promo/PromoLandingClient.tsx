"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Ticket, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PromoPage {
  id: string; slug: string; title: string; subtitle: string | null;
  description: string | null; image_url: string | null; badge_text: string | null;
  coupon_id: string | null; ends_at: string | null;
}
interface Coupon {
  id: string; code: string; name: string | null; type: "percent" | "fixed"; value: number;
  min_order_usd: number; expires_at: string | null; max_uses: number | null;
  used_count: number; is_active: boolean; scope: string;
}

const UI: Record<string, Record<string, string>> = {
  en: { claim: "Claim Coupon", claimed: "Already Claimed", loginRequired: "Sign in to claim", login: "Sign in", shopNow: "Shop Now", expired: "Expired", soldOut: "All claimed", inactive: "Not available", endsIn: "Ends in", days: "d", hrs: "h", min: "m", sec: "s", minOrder: "Min. order", noExpiry: "No expiry", discount: "OFF", claimedSuccess: "Coupon claimed!", yourCode: "Your code" },
  ko: { claim: "쿠폰 발급받기", claimed: "이미 발급됨", loginRequired: "로그인 후 발급 가능", login: "로그인", shopNow: "쇼핑하기", expired: "만료됨", soldOut: "마감됨", inactive: "발급 불가", endsIn: "이벤트 종료까지", days: "일", hrs: "시간", min: "분", sec: "초", minOrder: "최소주문", noExpiry: "유효기간 없음", discount: "할인", claimedSuccess: "쿠폰 발급 완료!", yourCode: "쿠폰 코드" },
  ja: { claim: "クーポンを受け取る", claimed: "発行済み", loginRequired: "ログインが必要です", login: "ログイン", shopNow: "ショッピング", expired: "期限切れ", soldOut: "配布終了", inactive: "取得不可", endsIn: "終了まで", days: "日", hrs: "時間", min: "分", sec: "秒", minOrder: "最低注文", noExpiry: "有効期限なし", discount: "OFF", claimedSuccess: "クーポン取得完了！", yourCode: "クーポンコード" },
  "zh-CN": { claim: "领取优惠券", claimed: "已领取", loginRequired: "请先登录", login: "登录", shopNow: "去购物", expired: "已过期", soldOut: "已抢完", inactive: "暂不可用", endsIn: "距结束", days: "天", hrs: "时", min: "分", sec: "秒", minOrder: "最低订单", noExpiry: "永久有效", discount: "折扣", claimedSuccess: "领取成功！", yourCode: "优惠码" },
  es: { claim: "Obtener cupón", claimed: "Ya obtenido", loginRequired: "Inicia sesión primero", login: "Iniciar sesión", shopNow: "Ir a la tienda", expired: "Expirado", soldOut: "Agotado", inactive: "No disponible", endsIn: "Termina en", days: "d", hrs: "h", min: "m", sec: "s", minOrder: "Pedido mínimo", noExpiry: "Sin vencimiento", discount: "OFF", claimedSuccess: "¡Cupón obtenido!", yourCode: "Tu código" },
  fr: { claim: "Obtenir le coupon", claimed: "Déjà obtenu", loginRequired: "Connectez-vous d'abord", login: "Se connecter", shopNow: "Faire du shopping", expired: "Expiré", soldOut: "Épuisé", inactive: "Indisponible", endsIn: "Se termine dans", days: "j", hrs: "h", min: "m", sec: "s", minOrder: "Commande min.", noExpiry: "Sans expiration", discount: "OFF", claimedSuccess: "Coupon obtenu !", yourCode: "Votre code" },
  de: { claim: "Gutschein erhalten", claimed: "Bereits erhalten", loginRequired: "Bitte zuerst anmelden", login: "Anmelden", shopNow: "Zum Shop", expired: "Abgelaufen", soldOut: "Vergriffen", inactive: "Nicht verfügbar", endsIn: "Endet in", days: "T", hrs: "Std", min: "Min", sec: "Sek", minOrder: "Mindestbestellung", noExpiry: "Kein Ablaufdatum", discount: "RABATT", claimedSuccess: "Gutschein erhalten!", yourCode: "Ihr Code" },
};

function useCountdown(endsAt: string | null) {
  const calc = useCallback(() => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, over: false };
  }, [endsAt]);

  const [cd, setCd] = useState(calc);
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setCd(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt, calc]);
  return cd;
}

export default function PromoLandingClient({ page, coupon, locale }: { page: PromoPage; coupon: Coupon | null; locale: string }) {
  const t = UI[locale] ?? UI.en;
  const cd = useCountdown(page.ends_at);

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/promo/${page.slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setLoggedIn(d.loggedIn);
          setAlreadyClaimed(d.alreadyClaimed);
          if (d.alreadyClaimed && d.coupon) setClaimedCode(d.coupon.code);
        }
      })
      .catch(() => setLoggedIn(false));
  }, [page.slug]);

  async function handleClaim() {
    if (!coupon) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/account/coupons/claim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.code }),
      });
      const d = await res.json();
      if (res.ok) {
        setClaimed(true);
        setClaimedCode(coupon.code);
      } else {
        setClaimError(d.error ?? "오류가 발생했습니다.");
      }
    } catch {
      setClaimError("네트워크 오류");
    } finally {
      setClaiming(false);
    }
  }

  const fmtDiscount = (c: Coupon) => c.type === "fixed" ? `$${c.value}` : `${c.value}%`;
  const isExpired = cd?.over || (coupon?.expires_at && new Date(coupon.expires_at) < new Date());
  const isSoldOut = coupon && coupon.max_uses != null && coupon.used_count >= coupon.max_uses;
  const isInactive = coupon && !coupon.is_active;
  const canClaim = coupon && !isExpired && !isSoldOut && !isInactive && loggedIn && !alreadyClaimed && !claimed;

  return (
    <div className="min-h-screen" style={{ background: "#0D0D1A" }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        {page.image_url ? (
          <>
            <div className="absolute inset-0">
              <img src={page.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,13,26,0.55) 0%, rgba(13,13,26,0.85) 60%, #0D0D1A 100%)" }} />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-32 pb-20 text-center">
              <HeroContent page={page} t={t} />
            </div>
          </>
        ) : (
          <div className="relative">
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 70%)" }} />
            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-32 pb-20 text-center">
              <HeroContent page={page} t={t} />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-6 pb-24 -mt-4">
        {/* 카운트다운 */}
        {page.ends_at && cd && !cd.over && (
          <div className="mb-8 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "#F59E0B" }} />
            <span className="text-sm font-medium" style={{ color: "#F59E0B" }}>{t.endsIn}</span>
            <div className="flex gap-2">
              {[{ v: cd.d, l: t.days }, { v: cd.h, l: t.hrs }, { v: cd.m, l: t.min }, { v: cd.s, l: t.sec }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center">
                  <span className="text-xl font-bold tabular-nums leading-none" style={{ color: "#F0E6FF" }}>{String(v).padStart(2, "0")}</span>
                  <span className="text-[10px]" style={{ color: "#6B7280" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {cd?.over && (
          <div className="mb-8 text-center text-sm" style={{ color: "#6B7280" }}>{t.expired}</div>
        )}

        {/* 쿠폰 카드 */}
        {coupon && (
          <div className="relative mb-6 rounded-2xl overflow-hidden" style={{ border: "1px dashed rgba(124,58,237,0.5)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(26,26,46,0.95) 100%)" }} />
            {/* 컷아웃 */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full" style={{ background: "#0D0D1A" }} />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full" style={{ background: "#0D0D1A" }} />
            <div className="relative z-10 p-6 flex items-center justify-between gap-4">
              <div>
                {coupon.name && <p className="text-sm font-medium mb-1" style={{ color: "#9CA3AF" }}>{coupon.name}</p>}
                <p className="text-4xl font-bold leading-none" style={{ color: "#F0E6FF", fontFamily: "var(--font-cinzel), serif" }}>
                  {fmtDiscount(coupon)} <span className="text-lg font-normal" style={{ color: "#A855F7" }}>{t.discount}</span>
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                  {coupon.min_order_usd > 0 && (
                    <span className="text-xs" style={{ color: "#6B7280" }}>{t.minOrder} ${coupon.min_order_usd}</span>
                  )}
                  <span className="text-xs" style={{ color: "#6B7280" }}>
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString(locale) : t.noExpiry}
                  </span>
                  {coupon.max_uses != null && (
                    <span className="text-xs" style={{ color: "#6B7280" }}>{coupon.used_count}/{coupon.max_uses}</span>
                  )}
                </div>
              </div>
              <Ticket className="w-10 h-10 shrink-0 opacity-30" style={{ color: "#7C3AED" }} />
            </div>
          </div>
        )}

        {/* 발급받은 코드 표시 */}
        {(claimed || alreadyClaimed) && claimedCode && (
          <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "#10B981" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#10B981" }}>{t.claimedSuccess}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{t.yourCode}: <span className="font-mono font-bold text-[#F59E0B]">{claimedCode}</span></p>
            </div>
          </div>
        )}

        {/* 에러 */}
        {claimError && (
          <div className="mb-4 rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
            <p className="text-sm" style={{ color: "#EF4444" }}>{claimError}</p>
          </div>
        )}

        {/* CTA 버튼 */}
        {coupon && (
          <div className="flex flex-col items-center gap-3">
            {loggedIn === null ? (
              <div className="h-12 rounded-xl w-full max-w-xs animate-pulse" style={{ background: "#1A1A2E" }} />
            ) : !loggedIn ? (
              <Link href={`/${locale}/sign-in?redirect=/${locale}/promo/${page.slug}`}
                className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold text-center text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
                {t.loginRequired}
              </Link>
            ) : isInactive ? (
              <div className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold text-center" style={{ background: "#1A1A2E", color: "#6B7280" }}>{t.inactive}</div>
            ) : isExpired || cd?.over ? (
              <div className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold text-center" style={{ background: "#1A1A2E", color: "#6B7280" }}>{t.expired}</div>
            ) : isSoldOut ? (
              <div className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold text-center" style={{ background: "#1A1A2E", color: "#6B7280" }}>{t.soldOut}</div>
            ) : alreadyClaimed || claimed ? (
              <div className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold text-center" style={{ background: "#1A1A2E", color: "#10B981" }}>
                <CheckCircle className="inline w-4 h-4 mr-1.5 -mt-0.5" />{t.claimed}
              </div>
            ) : (
              <button onClick={handleClaim} disabled={!canClaim || claiming}
                className="w-full max-w-xs py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
                {claiming ? "…" : t.claim}
              </button>
            )}

            {(claimed || alreadyClaimed) && (
              <Link href={`/${locale}`}
                className="text-sm font-medium transition-colors hover:text-[#A855F7]"
                style={{ color: "#9CA3AF" }}>
                {t.shopNow} →
              </Link>
            )}
          </div>
        )}

        {/* 설명 본문 */}
        {page.description && (
          <div className="mt-12 pt-8" style={{ borderTop: "1px solid #2D2D4E" }}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#9CA3AF" }}>{page.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroContent({ page, t }: { page: PromoPage; t: Record<string, string> }) {
  return (
    <>
      {page.badge_text && (
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5" style={{ background: "rgba(124,58,237,0.25)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.4)" }}>
          {page.badge_text}
        </span>
      )}
      <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4" style={{ color: "#F0E6FF", fontFamily: "var(--font-cinzel), serif", textWrap: "balance" }}>
        {page.title}
      </h1>
      {page.subtitle && (
        <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: "#9CA3AF" }}>{page.subtitle}</p>
      )}
    </>
  );
}
