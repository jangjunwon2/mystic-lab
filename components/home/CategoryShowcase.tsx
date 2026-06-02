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
                  className="group flex flex-col items-center gap-3 p-6 rounded-xl border text-center transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "#1A1A2E",
                    borderColor: "#2D2D4E",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(124,58,237,0.6)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(124,58,237,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2D2D4E";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                  }}
                >
                  <span className="text-4xl">{icon}</span>
                  <p className="font-semibold text-sm transition-colors group-hover:text-purple-400" style={{ color: "#F0E6FF" }}>
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
