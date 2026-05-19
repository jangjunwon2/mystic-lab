"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ChevronDown } from "lucide-react";

const SAMPLE_PRODUCTS = [
  { id: "1", slug: "phantom-deck", category: "card_magic", price_usd: 120, is_featured: true, thumbnail_url: null, name: "Phantom Deck", short_description: "Completely ungimmicked yet impossible card effects" },
  { id: "2", slug: "neural-link", category: "electronic", price_usd: 340, is_featured: true, thumbnail_url: null, name: "Neural Link", short_description: "Electronic mentalism device with zero tells" },
  { id: "3", slug: "shadow-coin", category: "coin_magic", price_usd: 95, is_featured: true, thumbnail_url: null, name: "Shadow Coin", short_description: "Award-winning coin gimmick for visual vanishes" },
  { id: "4", slug: "mind-vault", category: "mentalism", price_usd: 185, is_featured: false, thumbnail_url: null, name: "Mind Vault", short_description: "Professional book test with AI-assisted reveals" },
  { id: "5", slug: "prism-silk", category: "stage_magic", price_usd: 220, is_featured: false, thumbnail_url: null, name: "Prism Silk", short_description: "Color-changing silk with built-in LED system" },
];

interface ProductsClientProps {
  locale: string;
  filters: { category?: string; sort?: string; page?: string };
}

export default function ProductsClient({ locale, filters }: ProductsClientProps) {
  const t = useTranslations("products");
  const [sort, setSort] = useState(filters.sort || "featured");

  const sorted = [...SAMPLE_PRODUCTS].sort((a, b) => {
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
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] mb-2"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {t("title")}
          </h1>
          <div className="w-16 h-px bg-[#7C3AED]" />
        </div>

        {/* Controls — sort only */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs text-[#9CA3AF]">{sorted.length} products</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sorted.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard product={product} locale={locale} t={t} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  locale,
  t,
}: {
  product: (typeof SAMPLE_PRODUCTS)[0];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const categoryLabel: Record<string, string> = {
    card_magic: "Card Magic",
    coin_magic: "Coin Magic",
    stage_magic: "Stage Magic",
    mentalism: "Mentalism",
    electronic: "Electronic",
    accessories: "Accessories",
  };

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="block group">
      <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] overflow-hidden transition-all duration-300 hover:border-[#7C3AED]/60 hover:shadow-[0_0_24px_rgba(124,58,237,0.2)] hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[#13131F]">
          {product.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              {categoryLabel[product.category]}
            </span>
          </div>
          {product.is_featured && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-medium bg-[#F59E0B]/80 text-[#0D0D1A] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-sm text-[#F0E6FF] mb-1 group-hover:text-[#A855F7] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] text-[#9CA3AF] mb-3 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[#F59E0B] font-bold">${product.price_usd}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                // TODO: cart action
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
