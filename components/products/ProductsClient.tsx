"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingCart, ChevronDown, Package } from "lucide-react";
import type { ProductItem } from "@/app/[locale]/products/page";
import WishlistButton from "@/components/products/WishlistButton";

interface ProductsClientProps {
  locale: string;
  filters: { category?: string; sort?: string; page?: string; search?: string };
  products: ProductItem[];
  allCategories: string[];
  isLoggedIn: boolean;
}

export default function ProductsClient({ locale, filters, products, allCategories, isLoggedIn }: ProductsClientProps) {
  const t = useTranslations("products");
  const catLabel = (c: string) => (t.has(`cat.${c}`) ? t(`cat.${c}`) : c);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(filters.sort || "featured");
  const searchQuery = filters.search ?? "";

  const sorted = [...products].sort((a, b) => {
    if (sort === "priceAsc") return a.price_usd - b.price_usd;
    if (sort === "priceDesc") return b.price_usd - a.price_usd;
    if (sort === "featured") return Number(b.is_featured) - Number(a.is_featured);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          {searchQuery ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h1
                  className="text-2xl sm:text-3xl font-bold text-[#F0E6FF]"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  &ldquo;{searchQuery}&rdquo;
                </h1>
                <button
                  onClick={() => router.push(`/${locale}/products`)}
                  className="text-xs text-[#6B7280] hover:text-[#9CA3AF] border border-[#2D2D4E] rounded-full px-2.5 py-0.5 transition-colors"
                >
                  × {t("clear")}
                </button>
              </div>
              <p className="text-sm text-[#6B7280]">{t("productsCount", { n: products.length })}</p>
            </>
          ) : (
            <>
              <h1
                className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] mb-2"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                {t("title")}
              </h1>
              <div className="w-16 h-px bg-[#7C3AED]" />
            </>
          )}
        </div>

        {/* Category Filter */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                p.delete("category");
                router.push(`?${p.toString()}`);
              }}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: !filters.category ? "#7C3AED" : "rgba(124,58,237,0.1)",
                color: !filters.category ? "#fff" : "#A855F7",
                border: `1px solid ${!filters.category ? "#7C3AED" : "#4C1D95"}`,
              }}
            >
              {t("all")}
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const p = new URLSearchParams(searchParams.toString());
                  p.set("category", cat);
                  router.push(`?${p.toString()}`);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: filters.category === cat ? "#7C3AED" : "rgba(124,58,237,0.1)",
                  color: filters.category === cat ? "#fff" : "#A855F7",
                  border: `1px solid ${filters.category === cat ? "#7C3AED" : "#4C1D95"}`,
                }}
              >
                {catLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs text-[#9CA3AF]">{t("productsCount", { n: sorted.length })}</p>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-[#1A1A2E] border border-[#2D2D4E] text-[#9CA3AF] text-xs px-4 py-2 pr-8 rounded-lg cursor-pointer hover:border-[#7C3AED] focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="featured">{t("sort.featured")}</option>
              <option value="priceAsc">{t("sort.priceAsc")}</option>
              <option value="priceDesc">{t("sort.priceDesc")}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none" />
          </div>
        </div>

        {/* Products Grid */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Package className="w-12 h-12 text-[#2D2D4E]" />
            <p className="text-[#9CA3AF] text-sm">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sorted.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <ProductCard product={product} locale={locale} t={t} isLoggedIn={isLoggedIn} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  locale,
  t,
  isLoggedIn,
}: {
  product: ProductItem;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  isLoggedIn: boolean;
}) {
  return (
    <Link href={`/${locale}/products/${product.slug}`} className="block group">
      <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] overflow-hidden transition-all duration-300 hover:border-[#7C3AED]/60 hover:shadow-[0_0_24px_rgba(124,58,237,0.2)] hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#13131F]">
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#7C3AED]/50 animate-pulse" />
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-medium bg-[#7C3AED]/80 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t.has(`cat.${product.category}`) ? t(`cat.${product.category}`) : product.category}
            </span>
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {product.is_featured && (
              <span className="text-[10px] font-medium bg-[#F59E0B]/80 text-[#0D0D1A] px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t("sort.featured")}
              </span>
            )}
            <WishlistButton
              productId={product.id}
              isLoggedIn={isLoggedIn}
              locale={locale}
              className="p-1.5 rounded-full bg-[#0D0D1A]/70 backdrop-blur-sm border border-[#2D2D4E] hover:border-[#EF4444]/50"
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-[#F0E6FF] mb-1 group-hover:text-[#A855F7] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] text-[#9CA3AF] mb-3 line-clamp-2 leading-relaxed h-[2.25rem]">
            {product.short_description ?? ""}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[#F59E0B] font-bold">${product.price_usd}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
              }}
              className="flex items-center gap-1 bg-[#7C3AED]/15 hover:bg-[#7C3AED] text-[#A855F7] hover:text-white text-[11px] px-3 py-1.5 rounded-lg border border-[#7C3AED]/30 hover:border-[#7C3AED] transition-all duration-200"
            >
              <ShoppingCart className="w-3 h-3" />
              {t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
