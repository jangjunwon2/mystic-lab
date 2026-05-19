"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, ArrowRight } from "lucide-react";

export default function CustomOrderBanner() {
  const t = useTranslations("home.customSection");
  const locale = useLocale();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#13131F]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-[#7C3AED]/30 p-8 sm:p-12"
          style={{
            background: "linear-gradient(135deg, #1A1A2E 0%, #0D0D1A 50%, #1A1A2E 100%)",
          }}
        >
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-700/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            {/* Icon */}
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
              <Cpu className="w-10 h-10 text-[#F59E0B]" />
            </div>

            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <h2
                className="text-2xl sm:text-3xl font-bold text-[#F0E6FF] mb-3"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                {t("title")}
              </h2>
              <p className="text-[#9CA3AF] leading-relaxed max-w-2xl">
                {t("description")}
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Link
                href={`/${locale}/custom-order`}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm tracking-wide uppercase transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#0D0D1A",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 25px rgba(245,158,11,0.5)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t("cta")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
