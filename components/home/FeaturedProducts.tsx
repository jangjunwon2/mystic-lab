"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Play, Package } from "lucide-react";

interface FeaturedProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  category: string;
  thumbnail: string | null;
}

interface Props {
  products: FeaturedProduct[];
  locale: string;
}

const CATEGORY_KEY_MAP: Record<string, string> = {
  card_magic: "cardMagic",
  stage_magic: "stageMagic",
  coin_magic: "coinMagic",
  mentalism: "mentalism",
  electronic: "electronic",
  accessories: "accessories",
};

export default function FeaturedProducts({ products, locale }: Props) {
  const t = useTranslations("home.featured");
  const tProducts = useTranslations("products");

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      card_magic: tProducts("filter.cardMagic"),
      stage_magic: tProducts("filter.stageMagic"),
      coin_magic: tProducts("filter.coinMagic"),
      mentalism: tProducts("filter.mentalism"),
      electronic: tProducts("filter.electronic"),
      accessories: tProducts("filter.accessories"),
    };
    return labels[category] ?? category;
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0D0D1A]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] mb-3"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {t("title")}
          </h2>
          <p className="text-[#9CA3AF]">{t("subtitle")}</p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent mx-auto mt-6" />
        </motion.div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10 text-[#2D2D4E]" />
            <p className="text-[#9CA3AF] text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard product={product} locale={locale} t={tProducts} getCategoryLabel={getCategoryLabel} />
              </motion.div>
            ))}
          </div>
        )}

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#7C3AED] text-[#A855F7] rounded-lg hover:bg-[#7C3AED]/10 transition-all duration-300 text-sm font-medium tracking-wide uppercase"
          >
            {t("viewAll")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  locale,
  t,
  getCategoryLabel,
}: {
  product: FeaturedProduct;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  getCategoryLabel: (cat: string) => string;
}) {
  return (
    <Link href={`/${locale}/products/${product.slug}`}>
      <div className="group relative bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] overflow-hidden transition-all duration-300 hover:border-[#7C3AED]/70 hover:shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:-translate-y-1 cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] bg-[#13131F] overflow-hidden">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
                <div className="w-8 h-8 rounded-full bg-[#7C3AED]/40 animate-pulse" />
              </div>
            </div>
          )}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              <Play className="w-3 h-3 fill-current" />
              {t("demo")}
            </button>
          </div>
          <div className="absolute top-3 left-3">
            <span className="text-xs bg-[#7C3AED]/80 text-white px-2 py-0.5 rounded-full">
              {getCategoryLabel(product.category)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-[#F0E6FF] mb-1 group-hover:text-[#A855F7] transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed line-clamp-2 h-[2.5rem]">
            {product.shortDescription ?? ""}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[#F59E0B] font-bold text-lg">
              ${product.price}
            </span>
            <button
              className="flex items-center gap-1.5 bg-[#7C3AED]/20 hover:bg-[#7C3AED] text-[#A855F7] hover:text-white text-xs px-3 py-1.5 rounded-lg border border-[#7C3AED]/40 hover:border-[#7C3AED] transition-all duration-200"
              onClick={(e) => e.preventDefault()}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
