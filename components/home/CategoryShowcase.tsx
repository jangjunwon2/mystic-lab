"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const CATEGORY_ICONS: Record<string, string> = {
  card_magic: "🃏",
  stage_magic: "🎩",
  coin_magic: "🪙",
  mentalism: "🔮",
  electronic: "⚡",
  accessories: "✨",
};

interface Props {
  categories: string[];
  locale: string;
}

export default function CategoryShowcase({ categories, locale }: Props) {
  const t = useTranslations("home.categories");
  const tProducts = useTranslations("products");

  if (categories.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ fontFamily: "var(--font-cinzel), serif", color: "#F0E6FF" }}
          >
            {t("title")}
          </h2>
          <div className="w-20 h-px mx-auto" style={{ background: "linear-gradient(90deg, transparent, #7C3AED, transparent)" }} />
        </motion.div>

        <div className={`grid gap-4 ${categories.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
          {categories.map((cat, i) => {
            const icon = CATEGORY_ICONS[cat] ?? "✨";
            const categoryLabels: Record<string, string> = {
              card_magic: tProducts("filter.cardMagic"),
              stage_magic: tProducts("filter.stageMagic"),
              coin_magic: tProducts("filter.coinMagic"),
              mentalism: tProducts("filter.mentalism"),
              electronic: tProducts("filter.electronic"),
              accessories: tProducts("filter.accessories"),
            };
            const label = categoryLabels[cat] ?? cat;
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  href={`/${locale}/products?category=${cat}`}
                  className="group relative flex flex-col items-center gap-4 p-7 rounded-2xl border border-[#2D2D4E] text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-[#7C3AED]/60 hover:shadow-[0_0_28px_rgba(124,58,237,0.22)] overflow-hidden"
                  style={{ background: "linear-gradient(145deg, #1A1A2E 0%, #13131F 100%)" }}
                >
                  {/* inner glow on hover */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.10)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  {/* accent top line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300">{icon}</span>
                  <p className="font-semibold text-sm tracking-wide relative z-10 transition-colors group-hover:text-[#A855F7]" style={{ color: "#F0E6FF" }}>
                    {label}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
