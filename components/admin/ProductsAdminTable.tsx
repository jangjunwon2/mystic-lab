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
  display_order: number;
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
  const [rows, setRows] = useState(
    [...products].sort((a, b) => a.display_order - b.display_order)
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);

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
    if (!confirm(`"${name}" 상품을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setLoadingId(null);
  }

  async function moveRow(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rows.length) return;

    const next = [...rows];
    const [a, b] = [next[index], next[swapIndex]];
    next[index] = { ...b, display_order: a.display_order };
    next[swapIndex] = { ...a, display_order: b.display_order };
    setRows(next);

    setOrderSaving(true);
    await Promise.all([
      fetch(`/api/admin/products/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: b.display_order }),
      }),
      fetch(`/api/admin/products/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: a.display_order }),
      }),
    ]);
    setOrderSaving(false);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
      {orderSaving && (
        <div className="px-4 py-2 text-xs" style={{ background: "#7C3AED22", color: "#A855F7" }}>
          순서 저장 중…
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
              {["순서", "상품", "카테고리", "가격", "재고", "활성", "관리"].map((h) => (
                <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                  아직 상품이 없습니다.{" "}
                  <Link href="/admin/products/new" style={{ color: "#A855F7" }}>
                    첫 상품 등록
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((product, idx) => (
                <tr
                  key={product.id}
                  className="border-b last:border-0"
                  style={{ borderColor: "#2D2D4E", opacity: loadingId === product.id ? 0.5 : 1 }}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveRow(idx, "up")}
                        disabled={idx === 0 || orderSaving}
                        className="p-0.5 rounded text-xs disabled:opacity-20 hover:opacity-60 transition-opacity"
                        style={{ color: "#9CA3AF" }}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveRow(idx, "down")}
                        disabled={idx === rows.length - 1 || orderSaving}
                        className="p-0.5 rounded text-xs disabled:opacity-20 hover:opacity-60 transition-opacity"
                        style={{ color: "#9CA3AF" }}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span style={{ color: product.stock <= 0 ? "#EF4444" : product.stock <= 5 ? "#F59E0B" : "#F0E6FF" }}>
                        {product.stock}
                      </span>
                      {product.stock > 0 && product.stock <= 5 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium"
                          style={{ background: "#F59E0B22", color: "#F59E0B" }}
                        >
                          부족
                        </span>
                      )}
                      {product.stock <= 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium"
                          style={{ background: "#EF444422", color: "#EF4444" }}
                        >
                          품절
                        </span>
                      )}
                    </div>
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
                      {product.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#A855F7" }}
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id, product.displayName)}
                        disabled={loadingId === product.id}
                        className="text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#EF4444" }}
                      >
                        삭제
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
