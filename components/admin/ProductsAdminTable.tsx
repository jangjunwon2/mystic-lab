"use client";

import { useState } from "react";
import Link from "next/link";

interface ProductRow {
  id: string;
  slug: string;
  category: string;
  price_usd: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  thumbnail_url: string | null;
  displayName: string;
}

interface Props {
  products: ProductRow[];
}

const CATEGORY_LABELS: Record<string, string> = {
  card_magic: "Card Magic",
  coin_magic: "Coin Magic",
  stage_magic: "Stage Magic",
  mentalism: "Mentalism",
  electronic: "Electronic",
  accessories: "Accessories",
};

export default function ProductsAdminTable({ products }: Props) {
  const [rows, setRows] = useState(products);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleActive(id: string, current: boolean) {
    setLoadingId(id);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r))
      );
    }
    setLoadingId(null);
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setLoadingId(null);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
              {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                  No products yet.{" "}
                  <Link href="/admin/products/new" style={{ color: "#A855F7" }}>
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((product) => (
                <tr
                  key={product.id}
                  className="border-b last:border-0"
                  style={{ borderColor: "#2D2D4E", opacity: loadingId === product.id ? 0.5 : 1 }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.thumbnail_url ? (
                        <img
                          src={product.thumbnail_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center text-xl"
                          style={{ background: "#2D2D4E" }}
                        >
                          🪄
                        </div>
                      )}
                      <div>
                        <p style={{ color: "#F0E6FF" }}>{product.displayName}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </td>
                  <td className="px-6 py-4 font-medium" style={{ color: "#A855F7" }}>
                    ${product.price_usd.toFixed(2)}
                  </td>
                  <td className="px-6 py-4" style={{ color: product.stock <= 0 ? "#EF4444" : "#F0E6FF" }}>
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      disabled={loadingId === product.id}
                      className="px-2 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                      style={{
                        background: product.is_active ? "#10B98122" : "#EF444422",
                        color: product.is_active ? "#10B981" : "#EF4444",
                      }}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#A855F7" }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id, product.displayName)}
                        disabled={loadingId === product.id}
                        className="text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#EF4444" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
