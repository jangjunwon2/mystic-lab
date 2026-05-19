"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";

export default function UnlockBanner() {
  const t = useTranslations("home.unlock");
  const locale = useLocale();

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0D0D1A]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl p-6 sm:p-8"
        >
          <Lock className="w-8 h-8 text-[#7C3AED] flex-shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-[#F0E6FF] mb-1">{t("title")}</h3>
            <p className="text-sm text-[#9CA3AF]">{t("description")}</p>
          </div>
          <Link
            href={`/${locale}/unlock`}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-[#7C3AED]/50 text-[#A855F7] rounded-lg hover:bg-[#7C3AED]/10 transition-all whitespace-nowrap"
          >
            {t("cta")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
