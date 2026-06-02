import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  locale: string;
}

const copy: Record<string, { heading: string; sub: string; body: string; cta: string }> = {
  en: {
    heading: "Built by Magicians, for Magicians",
    sub: "The story behind Mystic Lab",
    body: "We got tired of props that looked great on paper but failed on stage. So we built our own — precision-engineered, performance-tested, trusted by professionals on six continents.",
    cta: "Our Story",
  },
  ko: {
    heading: "마술사가 만든, 마술사를 위한",
    sub: "Mystic Lab 이야기",
    body: "지면상으로는 훌륭하지만 무대에서 실패하는 소품에 지쳤습니다. 그래서 직접 만들었습니다. 정밀하게 설계되고, 실제 공연에서 검증되며, 6개 대륙 프로 마술사들이 신뢰하는 도구를.",
    cta: "스토리 보기",
  },
  ja: {
    heading: "マジシャンが作った、マジシャンのために",
    sub: "Mystic Labのストーリー",
    body: "紙の上では素晴らしく見えるが、ステージでは失敗する道具に嫌気がさしました。だから自分たちで作りました。精密に設計され、実際のパフォーマンスでテストされ、6大陸のプロが信頼する道具を。",
    cta: "ストーリーを見る",
  },
  "zh-CN": {
    heading: "魔术师打造，为魔术师而生",
    sub: "Mystic Lab 的故事",
    body: "我们厌倦了那些纸面好看、舞台失败的道具。于是我们自己动手——精密设计，实战验证，受到六大洲专业魔术师的信赖。",
    cta: "了解我们",
  },
  es: {
    heading: "Creado por Magos, para Magos",
    sub: "La historia de Mystic Lab",
    body: "Nos cansamos de accesorios que lucían bien en papel pero fallaban en el escenario. Así que construimos los nuestros — diseñados con precisión, probados en actuaciones reales, de confianza para profesionales en seis continentes.",
    cta: "Nuestra Historia",
  },
  fr: {
    heading: "Créé par des Magiciens, pour les Magiciens",
    sub: "L'histoire de Mystic Lab",
    body: "Nous en avions assez des accessoires séduisants sur le papier mais défaillants sur scène. Alors nous avons créé les nôtres — conçus avec précision, testés en conditions réelles, et approuvés par des professionnels sur six continents.",
    cta: "Notre Histoire",
  },
  de: {
    heading: "Von Zauberern, für Zauberer",
    sub: "Die Geschichte von Mystic Lab",
    body: "Wir hatten genug von Requisiten, die auf dem Papier gut aussahen, aber auf der Bühne versagten. Also haben wir unsere eigenen gebaut — präzise konstruiert, unter realen Bedingungen getestet, vertraut von Profis auf sechs Kontinenten.",
    cta: "Unsere Geschichte",
  },
};

export default function AboutBanner({ locale }: Props) {
  const t = copy[locale] ?? copy.en;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-2xl border border-[#2D2D4E] bg-[#1A1A2E]">
        {/* Subtle purple glow top-left */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#7C3AED]/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-center gap-8 px-8 py-10 md:px-12">
          {/* Icon */}
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#A855F7]" />
          </div>

          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-medium text-[#7C3AED] uppercase tracking-widest mb-1">
              {t.sub}
            </p>
            <h2
              className="text-xl sm:text-2xl font-bold text-[#F0E6FF] mb-2"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {t.heading}
            </h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed max-w-xl">{t.body}</p>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#7C3AED]/50 text-sm font-medium text-[#C084FC] hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] transition-colors whitespace-nowrap"
            >
              {t.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
