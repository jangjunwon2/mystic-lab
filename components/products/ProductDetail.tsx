"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ShoppingCart, Zap, Play, ArrowLeft,
  CheckCircle2, AlertCircle, Star, Share2, Copy, Check, X,
} from "lucide-react";
import SolutionVideoSection from "@/components/video/SolutionVideoSection";
import CloudflarePlayer from "@/components/video/CloudflarePlayer";
import ReviewForm from "@/components/products/ReviewForm";
import WishlistButton from "@/components/products/WishlistButton";
import MagicMemberAccess from "@/components/products/MagicMemberAccess";
import ProductCommunity from "@/components/products/ProductCommunity";
import type {
  ProductWithTranslations,
  ProductTranslation,
  ProductOption,
  ReviewWithProfile,
  SolutionVideo,
} from "@/app/[locale]/products/[slug]/page";

const SHARE_LABELS: Record<string, { share: string; shareBtn: string; copyAria: string; shareAria: string; copied: string; hint: string; more: string; igHint: string; shareTextPrefix: string }> = {
  en: { share: “Share”, shareBtn: “Share”, copyAria: “Copy link”, shareAria: “Share”, copied: “Copied!”, hint: “Instagram, KakaoTalk, WeChat, Messenger and more are available via the Share button (mobile).”, more: “More”, igHint: “Link copied — paste it into Instagram.”, shareTextPrefix: “Check out” },
  ko: { share: “공유”, shareBtn: “공유하기”, copyAria: “링크 복사”, shareAria: “공유”, copied: “복사됨!”, hint: “인스타그램·카카오톡·위챗·메신저 등은 공유하기 버튼(모바일)에서 선택할 수 있어요.”, more: “더보기”, igHint: “링크를 복사했어요 — 인스타그램에 붙여넣어 공유하세요.”, shareTextPrefix: “Mystic Lab에서” },
  ja: { share: “シェア”, shareBtn: “共有”, copyAria: “リンクをコピー”, shareAria: “で共有”, copied: “コピーしました!”, hint: “Instagram・カカオトーク・WeChat・メッセンジャーなどは「共有」ボタン（モバイル）から選べます。”, more: “その他”, igHint: “リンクをコピーしました — Instagramに貼り付けて共有してください。”, shareTextPrefix: “Mystic Lab の” },
  “zh-CN”: { share: “分享”, shareBtn: “分享”, copyAria: “复制链接”, shareAria: “分享”, copied: “已复制!”, hint: “Instagram、KakaoTalk、微信、Messenger 等可通过”分享”按钮（移动端）选择。”, more: “更多”, igHint: “已复制链接 — 粘贴到 Instagram 分享。”, shareTextPrefix: “Mystic Lab 上的” },
  es: { share: “Compartir”, shareBtn: “Compartir”, copyAria: “Copiar enlace”, shareAria: “Compartir en”, copied: “¡Copiado!”, hint: “Instagram, KakaoTalk, WeChat, Messenger y más están disponibles con el botón Compartir (móvil).”, more: “Más”, igHint: “Enlace copiado: pégalo en Instagram.”, shareTextPrefix: “Mira” },
  fr: { share: “Partager”, shareBtn: “Partager”, copyAria: “Copier le lien”, shareAria: “Partager sur”, copied: “Copié !”, hint: “Instagram, KakaoTalk, WeChat, Messenger, etc. sont disponibles via le bouton Partager (mobile).”, more: “Plus”, igHint: “Lien copié — collez-le dans Instagram.”, shareTextPrefix: “Découvrez” },
  de: { share: “Teilen”, shareBtn: “Teilen”, copyAria: “Link kopieren”, shareAria: “Teilen auf”, copied: “Kopiert!”, hint: “Instagram, KakaoTalk, WeChat, Messenger usw. sind über die Schaltfläche „Teilen” (mobil) verfügbar.”, more: “Mehr”, igHint: “Link kopiert – füge ihn in Instagram ein.”, shareTextPrefix: “Schau dir an:” },
};

const OPTION_LABELS: Record<string, { together: string; totalLabel: string }> = {
  en: { together: "Buy together & save", totalLabel: "Total" },
  ko: { together: "함께 구매하고 할인받기", totalLabel: "합계" },
  ja: { together: "まとめ買いで割引", totalLabel: "合計" },
  "zh-CN": { together: "一起购买更优惠", totalLabel: "合计" },
  es: { together: "Compra junto y ahorra", totalLabel: "Total" },
  fr: { together: "Achetez ensemble et économisez", totalLabel: "Total" },
  de: { together: "Zusammen kaufen & sparen", totalLabel: "Gesamt" },
};


interface Props {
  product: ProductWithTranslations;
  translation: ProductTranslation;
  options?: ProductOption[];
  locale: string;
  reviews: ReviewWithProfile[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasPurchased: boolean;
  hasDelivered?: boolean;
  solutionVideo: SolutionVideo | null;
  signedVideoUrl: string | null;
}

export default function ProductDetail({
  product,
  translation,
  options = [],
  locale,
  reviews,
  isLoggedIn,
  isAdmin,
  hasPurchased,
  hasDelivered = false,
  solutionVideo,
  signedVideoUrl,
}: Props) {
  const t = useTranslations("products");
  const router = useRouter();
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());

  const ol = OPTION_LABELS[locale] ?? OPTION_LABELS.en;

  const toggleOption = (id: string) =>
    setSelectedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedOptions = options.filter((o) => selectedOptionIds.has(o.id));
  const addonsTotal = selectedOptions.reduce((s, o) => s + o.price, 0);
  const combinedTotal = Math.round((product.price_usd + addonsTotal) * 100) / 100;

  // 호스트 상품 + 선택한 애드온들을 각각 개별 장바구니 라인으로 구성
  interface CartLine { id: string; slug: string; name: string; price_usd: number; quantity: number; option_id?: string; option_name?: string }
  const buildCartLines = (): CartLine[] => [
    { id: product.id, slug: product.slug, name: translation.name, price_usd: product.price_usd, quantity: 1 },
    ...selectedOptions.map((o) => ({
      id: o.linked_product_id, slug: o.slug, name: o.name, price_usd: o.price, quantity: 1, option_id: o.id, option_name: o.name,
    })),
  ];

  const handleBuyNow = () => {
    // 장바구니를 건드리지 않고 결제 대상만 지정 (바로구매)
    try {
      sessionStorage.setItem("ml_checkout", JSON.stringify(buildCartLines()));
    } catch { /* storage may be unavailable */ }
    router.push(`/${locale}/checkout`);
  };

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
      for (const line of buildCartLines()) {
        const existing = cart.find(
          (item: { id: string; option_id?: string }) =>
            item.id === line.id && (item.option_id ?? "") === (line.option_id ?? "")
        );
        if (existing) existing.quantity += 1;
        else cart.push(line);
      }
      localStorage.setItem("ml_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
    } catch { /* storage may be unavailable */ }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] py-6">
          <Link
            href={`/${locale}/products`}
            className="flex items-center gap-1.5 hover:text-[#A855F7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("title")}
          </Link>
          <span>/</span>
          <span className="text-[#9CA3AF]">{translation.name}</span>
        </nav>

        {/* ── Hero ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-square bg-[#13131F] rounded-2xl border border-[#2D2D4E] overflow-hidden relative flex items-center justify-center">
              {product.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumbnail_url}
                  alt={translation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-28 h-28 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#7C3AED]/50 animate-pulse" />
                  </div>
                  <p className="text-[#4B5563] text-xs">{t("imageComing")}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D1A]/40 to-transparent pointer-events-none" />
            </div>

            {/* Additional images strip */}
            {product.image_urls.length > 0 && (
              <div className="flex gap-2 mt-3">
                {product.image_urls.slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    className="relative w-16 h-16 rounded-lg border border-[#2D2D4E] overflow-hidden bg-[#13131F]"
                  >
                    <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-medium bg-[#7C3AED]/80 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                {t(`cat.${product.category}` as never)}
              </span>
              {product.is_featured && (
                <span className="text-[10px] font-medium bg-[#F59E0B]/80 text-[#0D0D1A] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {t("sort.featured")}
                </span>
              )}
            </div>

            {/* Name */}
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] mb-3 leading-tight"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {translation.name}
            </h1>

            {/* Short description */}
            {translation.short_description && (
              <p className="text-[#9CA3AF] text-base leading-relaxed mb-4" style={{ whiteSpace: "pre-wrap" }}>
                {translation.short_description}
              </p>
            )}

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={avgRating} />
                <span className="text-sm text-[#9CA3AF]">
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-4xl font-bold text-[#F59E0B]">
                ${product.price_usd.toLocaleString()}
              </span>
              <span className="text-sm text-[#6B7280]">USD</span>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-8">
              {product.stock > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-emerald-400">
                    {t("inStock", { n: product.stock })}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-sm text-red-400">{t("outOfStock")}</span>
                </>
              )}
            </div>

            {/* 함께 구매 (애드온 다중 선택) */}
            {options.length > 0 && product.stock > 0 && (
              <div className="mb-6 rounded-xl border border-[#2D2D4E] bg-[#13131F] p-4">
                <p className="text-sm font-semibold text-[#A855F7] mb-3">{ol.together}</p>
                <div className="space-y-2">
                  {options.map((o) => {
                    const checked = selectedOptionIds.has(o.id);
                    const off = o.original > 0 ? Math.round((1 - o.price / o.original) * 100) : 0;
                    return (
                      <label
                        key={o.id}
                        className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                          checked ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-[#2D2D4E] hover:border-[#7C3AED]/50"
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleOption(o.id)} className="w-4 h-4 accent-[#7C3AED] shrink-0" />
                        <span className="flex-1 text-sm text-[#F0E6FF] line-clamp-1">{o.name}</span>
                        {off > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#10B98122", color: "#10B981" }}>-{off}%</span>
                        )}
                        <span className="text-right shrink-0">
                          {o.price < o.original && (
                            <span className="text-xs text-[#6B7280] line-through mr-1.5">${o.original.toLocaleString()}</span>
                          )}
                          <span className="text-sm font-semibold text-[#F59E0B]">${o.price.toLocaleString()}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedOptions.length > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2D2D4E]">
                    <span className="text-sm text-[#9CA3AF]">{ol.totalLabel}</span>
                    <span className="text-lg font-bold text-[#F59E0B]">${combinedTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  addedToCart
                    ? "bg-emerald-500 text-white border border-emerald-500"
                    : product.stock === 0
                    ? "bg-[#1E1E30] text-[#6B7280] border border-[#2D2D4E] cursor-not-allowed"
                    : "bg-[#7C3AED]/15 hover:bg-[#7C3AED] text-[#A855F7] hover:text-white border border-[#7C3AED]/50 hover:border-[#7C3AED]"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {addedToCart ? t("addedToCart") : t("addToCart")}
              </button>

              {product.stock > 0 && (
                <button
                  onClick={handleBuyNow}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
                >
                  <Zap className="w-4 h-4" />
                  {t("buyNow")}
                </button>
              )}

              {/* Wishlist — right of Buy Now */}
              <WishlistButton
                productId={product.id}
                isLoggedIn={isLoggedIn}
                locale={locale}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] hover:border-[#EF4444]/50 transition-colors"
              />
            </div>

            {/* Share */}
            <div className="mt-6">
              <ShareButtons name={translation?.name ?? product.slug} productId={product.id} locale={locale} />
            </div>
          </motion.div>
        </div>

        {/* ── Description ── */}
        <Section title={t("description")}>
          <p className="text-[#9CA3AF] leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
            {translation.description}
          </p>
        </Section>

        {/* ── Demo Video ── */}
        {product.demo_video_cloudflare_id && (
          <Section
            title={t("demo")}
            icon={<Play className="w-4 h-4 text-[#A855F7]" />}
          >
            <CloudflarePlayer
              src={`https://iframe.cloudflarestream.com/${product.demo_video_cloudflare_id}`}
              title={`${translation.name} — Demo`}
            />
          </Section>
        )}

        {/* ── Solution Tutorial ── */}
        <Section title={t("solutionTutorial")}>
          <SolutionVideoSection
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            hasPurchased={hasPurchased}
            signedUrl={signedVideoUrl}
            videoTitle={solutionVideo?.title ?? null}
            locale={locale}
            productSlug={product.slug}
          />
          {(product.slug === "magic-calculator" || product.slug === "fake-instagram") && isLoggedIn && hasPurchased && (
            <MagicMemberAccess productId={product.id} locale={locale} slug={product.slug} />
          )}
        </Section>

        {/* ── Reviews ── */}
        <Section title={`${t("reviews.title")} (${reviews.length})`}>
          <ReviewForm productId={product.id} hasPurchased={hasDelivered} />
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-[#9CA3AF] text-sm">
              {t("reviews.noReviews")}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} locale={locale} />
              ))}
            </div>
          )}
        </Section>

        {/* ── 구매자 커뮤니티 (개선 제안 / 연출 공유 / 업데이트 공지) ── */}
        <ProductCommunity productId={product.id} locale={locale} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="mb-14"
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2
          className="text-xl font-semibold text-[#F0E6FF]"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="w-12 h-px bg-[#7C3AED] mb-6" />
      {children}
    </motion.div>
  );
}

function StarRating({ rating, interactive = false }: { rating: number; interactive?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#374151]"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, locale }: { review: ReviewWithProfile; locale: string }) {
  const t = useTranslations("products");
  const date = new Date(review.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const initial = (review.profiles?.display_name?.[0] ?? "?").toUpperCase();

  return (
    <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED]/25 border border-[#7C3AED]/30 flex items-center justify-center text-xs text-[#A855F7] font-semibold shrink-0">
            {initial}
          </div>
          <div>
            <p className="text-sm font-medium text-[#F0E6FF]">
              {review.profiles?.display_name ?? t("reviewAnonymous")}
            </p>
            <p className="text-[11px] text-[#6B7280]">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      {review.comment && (
        <p className="text-sm text-[#9CA3AF] leading-relaxed pl-12">
          {review.comment}
        </p>
      )}
    </div>
  );
}

function ShareButtons({ name, productId, locale }: { name: string; productId: string; locale: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [igCopied, setIgCopied] = useState(false);
  const sl = SHARE_LABELS[locale] ?? SHARE_LABELS.en;
  const shareText = locale === "ko"
    ? `${sl.shareTextPrefix} "${name}"을(를) 확인해보세요 ✨`
    : locale === "ja"
    ? `${sl.shareTextPrefix} "${name}" をチェック ✨`
    : locale === "zh-CN"
    ? `${sl.shareTextPrefix} "${name}" ✨`
    : `${sl.shareTextPrefix} "${name}" on Mystic Lab ✨`;
  const getUrl = () => (typeof window !== "undefined" ? window.location.href : "");
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  // 공유 트래킹 (통계용) — 실패해도 조용히 무시
  function track(channel: string) {
    fetch("/api/share/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, channel }),
      keepalive: true,
    }).catch(() => { /* ignore */ });
  }

  async function nativeShare() {
    if (hasNativeShare) {
      try {
        await navigator.share({ title: name, text: shareText, url: getUrl() });
        track("native");
        setOpen(false);
      } catch { /* 사용자가 취소 */ }
    } else {
      copyLink();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      track("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  function openShare(channel: string, make: (u: string, t: string) => string) {
    const u = encodeURIComponent(getUrl());
    const t = encodeURIComponent(shareText);
    track(channel);
    window.open(make(u, t), "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  // 인스타그램은 웹 공유 URL이 없음 → 모바일은 네이티브 시트, 아니면 링크 복사 후 인스타 열기
  async function shareInstagram() {
    track("instagram");
    if (hasNativeShare) {
      try { await navigator.share({ title: name, text: shareText, url: getUrl() }); setOpen(false); return; } catch { /* 취소 시 폴백 */ }
    }
    try { await navigator.clipboard.writeText(getUrl()); } catch { /* ignore */ }
    setIgCopied(true);
    setTimeout(() => setIgCopied(false), 3000);
    window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
  }

  const targets: { key: string; label: string; bg: string; make: (u: string, t: string) => string }[] = [
    { key: "facebook", label: "Facebook", bg: "#1877F2", make: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "x", label: "X", bg: "#000000", make: (u, t) => `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: "whatsapp", label: "WhatsApp", bg: "#25D366", make: (u, t) => `https://api.whatsapp.com/send?text=${t}%20${u}` },
    { key: "telegram", label: "Telegram", bg: "#229ED9", make: (u, t) => `https://t.me/share/url?url=${u}&text=${t}` },
    { key: "line", label: "LINE", bg: "#06C755", make: (u) => `https://social-plugins.line.me/lineit/share?url=${u}` },
  ];
  const INSTAGRAM_BG = "linear-gradient(135deg,#F9CE34,#EE2A7B,#6228D7)";

  return (
    <div className="pt-5 border-t border-[#2D2D4E]">
      {/* 단일 공유 버튼 → 팝업 */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 transition-opacity"
      >
        <Share2 className="w-4 h-4" />
        {sl.shareBtn}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border p-5"
            style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#F0E6FF] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#A855F7]" /> {sl.share}
              </h3>
              <button onClick={() => setOpen(false)} aria-label="close" className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F0E6FF]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Instagram */}
              <button
                onClick={shareInstagram}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: INSTAGRAM_BG }}
              >
                <Share2 className="w-4 h-4" /> Instagram
              </button>
              {targets.map((s) => (
                <button
                  key={s.key}
                  onClick={() => openShare(s.key, s.make)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ background: s.bg }}
                >
                  <Share2 className="w-4 h-4" /> {s.label}
                </button>
              ))}
              {/* 링크 복사 */}
              <button
                onClick={copyLink}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  background: copied ? "rgba(16,185,129,0.15)" : "#13131F",
                  borderColor: copied ? "rgba(16,185,129,0.4)" : "#2D2D4E",
                  color: copied ? "#34D399" : "#9CA3AF",
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? sl.copied : sl.copyAria}
              </button>
              {/* 기기 공유 시트 (모바일) */}
              {hasNativeShare && (
                <button
                  onClick={nativeShare}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold border transition-colors text-[#9CA3AF] hover:text-[#F0E6FF]"
                  style={{ background: "#13131F", borderColor: "#2D2D4E" }}
                >
                  <Share2 className="w-4 h-4" /> {sl.more}
                </button>
              )}
            </div>

            {igCopied && <p className="text-[11px] text-emerald-400 mt-3">{sl.igHint}</p>}
            <p className="text-[11px] text-[#6B7280] mt-3">{sl.hint}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
