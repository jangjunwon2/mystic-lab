"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price_usd: number;
}

interface BundleItem {
  product_id: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  discount_percent: number;
  is_active: boolean;
  items: BundleItem[];
}

interface Props {
  products: Product[];
  bundles: Bundle[];
}

const inputStyle = {
  background: "#0D0D1A",
  border: "1px solid #2D2D4E",
  borderRadius: "8px",
  color: "#F0E6FF",
  padding: "8px 12px",
  fontSize: "14px",
};

export default function BundlesManager({ products, bundles: initialBundles }: Props) {
  const [bundles, setBundles] = useState(initialBundles);
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("10");
  const [rows, setRows] = useState<BundleItem[]>([{ product_id: products[0]?.id ?? "", quantity: 1 }]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const priceOf = (id: string) => products.find((p) => p.id === id)?.price_usd ?? 0;
  const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? "알 수 없음";

  function bundleTotals(b: Bundle) {
    const original = b.items.reduce((s, it) => s + priceOf(it.product_id) * it.quantity, 0);
    const discounted = original * (1 - b.discount_percent / 100);
    return { original, discounted, save: original - discounted };
  }

  const draftOriginal = rows.reduce((s, r) => s + priceOf(r.product_id) * r.quantity, 0);
  const draftDiscounted = draftOriginal * (1 - (parseInt(discount, 10) || 0) / 100);

  async function createBundle() {
    if (!name.trim()) { setError("세트 이름을 입력하세요."); return; }
    const validRows = rows.filter((r) => r.product_id && r.quantity >= 1);
    if (validRows.length < 2) { setError("상품을 2개 이상 추가하세요."); return; }
    setCreating(true);
    setError(null);
    const res = await fetch("/api/admin/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), discount_percent: parseInt(discount, 10) || 0, items: validRows }),
    });
    if (res.ok) {
      const { id } = await res.json();
      setBundles((prev) => [
        { id, name: name.trim(), discount_percent: parseInt(discount, 10) || 0, is_active: true, items: validRows },
        ...prev,
      ]);
      setName("");
      setDiscount("10");
      setRows([{ product_id: products[0]?.id ?? "", quantity: 1 }]);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "세트 생성 실패.");
    }
    setCreating(false);
  }

  async function toggleActive(b: Bundle) {
    setBusyId(b.id);
    const res = await fetch(`/api/admin/bundles/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !b.is_active }),
    });
    if (res.ok) setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
    setBusyId(null);
  }

  async function deleteBundle(id: string) {
    if (!confirm("이 세트를 삭제할까요?")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
    if (res.ok) setBundles((prev) => prev.filter((x) => x.id !== id));
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      {/* 생성 폼 */}
      <div className="rounded-xl p-6 border space-y-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>새 세트 만들기</h2>
        {error && <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>세트 이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 입문자 카드마술 패키지" style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>할인율 (%)</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min={0} max={90} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        {/* 구성 상품 */}
        <div className="space-y-2">
          <label className="text-xs block" style={{ color: "#9CA3AF" }}>구성 상품 (2개 이상)</label>
          {rows.map((r, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                value={r.product_id}
                onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, product_id: e.target.value } : x)))}
                style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
              >
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price_usd})</option>)}
              </select>
              <input
                type="number" min={1}
                value={r.quantity}
                onChange={(e) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: parseInt(e.target.value, 10) || 1 } : x)))}
                style={{ ...inputStyle, width: "80px" }}
              />
              <button
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                disabled={rows.length <= 1}
                className="px-2 rounded-lg disabled:opacity-30"
                style={{ background: "#2D2D4E", color: "#9CA3AF" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setRows((prev) => [...prev, { product_id: products[0]?.id ?? "", quantity: 1 }])}
            className="flex items-center gap-1 text-sm" style={{ color: "#A855F7" }}
          >
            <Plus className="w-4 h-4" /> 상품 추가
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#2D2D4E" }}>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            개별가 합계 <span style={{ color: "#9CA3AF" }}>${draftOriginal.toFixed(2)}</span>
            {" → "}
            <span style={{ color: "#A855F7", fontWeight: 600 }}>${draftDiscounted.toFixed(2)}</span>
            <span className="ml-2 text-xs" style={{ color: "#10B981" }}>(${(draftOriginal - draftDiscounted).toFixed(2)} 절약)</span>
          </p>
          <button onClick={createBundle} disabled={creating} className="px-5 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50" style={{ background: "#7C3AED", color: "#fff" }}>
            {creating ? "생성 중…" : "세트 생성"}
          </button>
        </div>
      </div>

      {/* 세트 목록 */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>세트 목록 ({bundles.length})</h2>
        {bundles.length === 0 ? (
          <div className="rounded-xl border p-10 text-center" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>등록된 세트가 없습니다.</p>
          </div>
        ) : (
          bundles.map((b) => {
            const t = bundleTotals(b);
            return (
              <div key={b.id} className="rounded-xl border p-5" style={{ background: "#1A1A2E", borderColor: "#2D2D4E", opacity: busyId === b.id ? 0.5 : 1 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold" style={{ color: "#F0E6FF" }}>{b.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#7C3AED22", color: "#A855F7" }}>{b.discount_percent}% 할인</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={b.is_active ? { background: "#10B98122", color: "#10B981" } : { background: "#2D2D4E", color: "#9CA3AF" }}>
                        {b.is_active ? "활성" : "비활성"}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                      {b.items.map((it) => `${nameOf(it.product_id)}${it.quantity > 1 ? `×${it.quantity}` : ""}`).join(" + ")}
                    </p>
                    <p className="text-sm">
                      <span style={{ color: "#6B7280", textDecoration: "line-through" }}>${t.original.toFixed(2)}</span>
                      {" → "}
                      <span style={{ color: "#A855F7", fontWeight: 600 }}>${t.discounted.toFixed(2)}</span>
                      <span className="ml-2 text-xs" style={{ color: "#10B981" }}>(${t.save.toFixed(2)} 절약)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(b)} disabled={busyId === b.id} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#2D2D4E", color: "#9CA3AF" }}>
                      {b.is_active ? "비활성화" : "활성화"}
                    </button>
                    <button onClick={() => deleteBundle(b.id)} disabled={busyId === b.id} className="p-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
