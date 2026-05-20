import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductsAdminTable from "@/components/admin/ProductsAdminTable";

export const metadata = { title: "Products — Admin" };

interface RawProduct {
  id: string;
  slug: string;
  category: string;
  price_usd: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  thumbnail_url: string | null;
  created_at: string;
  product_translations: { name: string; language: string }[];
}

export default async function AdminProductsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createAdminClient() as any;

  const { data: products } = await supabase
    .from("products")
    .select(`
      id, slug, category, price_usd, stock, is_active, is_featured, thumbnail_url, created_at,
      product_translations(name, language)
    `)
    .order("created_at", { ascending: false });

  const rows = ((products ?? []) as RawProduct[]).map((p) => {
    const enName = p.product_translations?.find((t) => t.language === "en")?.name ?? p.slug;
    return { ...p, displayName: enName };
  });

  const lowStockCount = rows.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = rows.filter((p) => p.stock <= 0).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          + New Product
        </Link>
      </div>

      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div
          className="rounded-lg px-4 py-3 mb-6 flex items-center gap-4 text-sm"
          style={{ background: "#F59E0B11", border: "1px solid #F59E0B44" }}
        >
          <span style={{ color: "#F59E0B" }}>⚠ Stock Alert</span>
          {outOfStockCount > 0 && (
            <span style={{ color: "#EF4444" }}>
              {outOfStockCount} out of stock
            </span>
          )}
          {lowStockCount > 0 && (
            <span style={{ color: "#F59E0B" }}>
              {lowStockCount} low stock (≤5)
            </span>
          )}
        </div>
      )}

      <ProductsAdminTable products={rows} />
    </div>
  );
}
