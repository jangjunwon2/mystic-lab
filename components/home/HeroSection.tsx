"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const t = useTranslations("home.hero");
  const locale = useLocale();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0D0D1A]">
        {/* Radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.15)_0%,_transparent_70%)]" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Top gradient blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-700/20 rounded-full blur-[120px]" />
        {/* Bottom gradient */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Floating particles */}
      <Particles />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs sm:text-sm tracking-[0.3em] text-[#A855F7] uppercase font-medium mb-6"
        >
          {t("tagline")}
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#F0E6FF] leading-tight mb-6"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {(() => {
            const headline = t("headline");
            const lastSpace = headline.lastIndexOf(" ");
            if (lastSpace < 0) return (
              <span style={{ background: "linear-gradient(135deg, #A855F7, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {headline}
              </span>
            );
            return (
              <>
                {headline.slice(0, lastSpace)}{" "}
                <span style={{ background: "linear-gradient(135deg, #A855F7, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {headline.slice(lastSpace + 1)}
                </span>
              </>
            );
          })()}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-base sm:text-lg text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed mb-10"
        >
          {t("subheadline")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={`/${locale}/products`}
            className="group flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-sm tracking-wide uppercase transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #A855F7)",
              color: "white",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 30px rgba(124,58,237,0.7)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.4)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {t("cta")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href={`/${locale}/custom-order`}
            className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-sm tracking-wide uppercase border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-all duration-300"
          >
            <Wand2 className="w-4 h-4" />
            {t("ctaSecondary")}
          </Link>
        </motion.div>

        {/* Decorative divider below CTAs */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 1.0, ease: "easeOut" }}
          className="flex items-center justify-center gap-4 mt-14"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#7C3AED]/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#7C3AED]/60" />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-14 bg-gradient-to-b from-[#7C3AED] to-transparent mx-auto" />
        </motion.div>
      </div>
    </section>
  );
}

function Particles() {
  const [particles, setParticles] = useState<
    { id: number; left: string; top: string; delay: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 4,
        size: Math.random() > 0.5 ? 2 : 3,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-purple-400/30"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
