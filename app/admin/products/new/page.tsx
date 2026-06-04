import ProductForm from "@/components/admin/ProductForm";
import { loadAllProductsLite } from "@/lib/admin/load-products-lite";

export const metadata = { title: "New Product — Admin" };

export default async function NewProductPage() {
  const allProducts = await loadAllProductsLite();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        새 상품
      </h1>
      <ProductForm allProducts={allProducts} />
    </div>
  );
}
