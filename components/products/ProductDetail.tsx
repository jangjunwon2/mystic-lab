"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ShoppingCart, Zap, Play, ArrowLeft,
  CheckCircle2, AlertCircle, Star,
} from "lucide-react";
import SolutionVideoSection from "@/components/video/SolutionVideoSection";
import CloudflarePlayer from "@/components/video/CloudflarePlayer";
import MagicActivation from "@/components/products/MagicActivation";
import ReviewForm from "@/components/products/ReviewForm";
import MagicMemberAccess from "@/components/products/MagicMemberAccess";
import type {
  ProductWithTranslations,
  ProductTranslation,
  ReviewWithProfile,
  SolutionVideo,
} from "@/app/[locale]/products/[slug]/page";

const CATEGORY_LABELS: Record<string, string> = {
  card_magic: "Card Magic",
  coin_magic: "Coin Magic",
  stage_magic: "Stage Magic",
  mentalism: "Mentalism",
  electronic: "Electronic",
  accessories: "Accessories",
};

interface Props {
  product: ProductWithTranslations;
  translation: ProductTranslation;
  locale: string;
  reviews: ReviewWithProfile[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasPurchased: boolean;
  solutionVideo: SolutionVideo | null;
  signedVideoUrl: string | null;
}

export default function ProductDetail({
  product,
  translation,
  locale,
  reviews,
  isLoggedIn,
  isAdmin,
  hasPurchased,
  solutionVideo,
  signedVideoUrl,
}: Props) {
  const t = useTranslations("products");
  const [addedToCart, setAddedToCart] = useState(false);

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleAddToCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
      const existing = cart.find((item: { id: string }) => item.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          slug: product.slug,
          name: translation.name,
          price_usd: product.price_usd,
          quantity: 1,
        });
      }
      localStorage.setItem("ml_cart", JSON.stringify(cart));
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
            All Products
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
                  <p className="text-[#4B5563] text-xs">Product Image Coming Soon</p>
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
                    className="w-16 h-16 rounded-lg border border-[#2D2D4E] overflow-hidden bg-[#13131F]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
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
                {CATEGORY_LABELS[product.category]}
              </span>
              {product.is_featured && (
                <span className="text-[10px] font-medium bg-[#F59E0B]/80 text-[#0D0D1A] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Featured
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
              <p className="text-[#9CA3AF] text-base leading-relaxed mb-4">
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
                    In Stock — {product.stock} available
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-sm text-red-400">{t("outOfStock")}</span>
                </>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
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
                {addedToCart ? "Added to Cart!" : t("addToCart")}
              </button>

              {product.stock > 0 && (
                <Link
                  href={`/${locale}/checkout?product=${product.slug}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
                >
                  <Zap className="w-4 h-4" />
                  {t("buyNow")}
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Description ── */}
        <Section title="Description">
          <div
            className="text-[#9CA3AF] leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-[#9CA3AF]"
            dangerouslySetInnerHTML={{ __html: translation.description }}
          />
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
        <Section title="Solution Tutorial">
          <SolutionVideoSection
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            hasPurchased={hasPurchased}
            signedUrl={signedVideoUrl}
            videoTitle={solutionVideo?.title ?? null}
            locale={locale}
            productSlug={product.slug}
          />
          {product.slug === "magic-calculator" && isLoggedIn && hasPurchased && (
            <MagicMemberAccess productId={product.id} locale={locale} />
          )}
        </Section>

        {/* ── Device Activation (Magic Calculator only) ── */}
        {product.slug === "magic-calculator" && (
          <MagicActivation productId={product.id} locale={locale} />
        )}

        {/* ── Reviews ── */}
        <Section title={`${t("reviews.title")} (${reviews.length})`}>
          <ReviewForm productId={product.id} hasPurchased={hasPurchased} />
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-[#9CA3AF] text-sm">
              {t("reviews.noReviews")}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </Section>
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

function ReviewCard({ review }: { review: ReviewWithProfile }) {
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
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
              {review.profiles?.display_name ?? "Anonymous"}
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
