import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  price: number;
}

export default async function RelatedProducts({
  products,
  locale,
}: {
  products: RelatedProduct[];
  locale: string;
}) {
  if (products.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "products" });

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#2D2D4E]">
      <h2
        className="text-xl font-bold text-[#F0E6FF] mb-6"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {t("youMayAlsoLike")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/${locale}/products/${p.slug}`}
            className="group block bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl overflow-hidden hover:border-[#7C3AED] transition-colors"
          >
            <div className="aspect-square bg-[#13131F] relative">
              {p.thumbnail ? (
                <Image
                  src={p.thumbnail}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#2D2D4E] text-3xl">✦</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-[#F0E6FF] text-sm font-medium truncate group-hover:text-[#A855F7] transition-colors">
                {p.name}
              </p>
              <p className="text-[#9CA3AF] text-sm mt-1">${p.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
