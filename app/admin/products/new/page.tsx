import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New Product — Admin" };

export default function NewProductPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "#F0E6FF" }}>
        새 상품
      </h1>
      <ProductForm />
    </div>
  );
}
