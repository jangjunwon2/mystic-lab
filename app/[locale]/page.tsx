import { useTranslations } from "next-intl";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CustomOrderBanner from "@/components/home/CustomOrderBanner";
import UnlockBanner from "@/components/home/UnlockBanner";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedProducts />
      <CustomOrderBanner />
      <UnlockBanner />
    </div>
  );
}
