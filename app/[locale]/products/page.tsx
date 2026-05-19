import { getTranslations } from "next-intl/server";
import ProductsClient from "@/components/products/ProductsClient";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: ProductsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return { title: t("title") };
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale } = await params;
  const filters = await searchParams;

  return <ProductsClient locale={locale} filters={filters} />;
}
