"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserSearch } from "lucide-react";

interface UserOption { id: string; email: string | null; display_name: string | null }
interface ProductOption { id: string; slug: string; name: string; price_usd: number }

interface Props {
  users: UserOption[];
  products: ProductOption[];
}

interface LineItem {
  product_id: string;
  quantity: number;
  price_usd: number;
}

export default function ManualOrderForm({ users, products }: Props) {
  const router = useRouter();
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ product_id: "", quantity: 1, price_usd: 0 }]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.display_name?.toLowerCase().includes(q);
  });

  function selectUser(u: UserOption) {
    setSelectedUserId(u.id);
    setSelectedEmail(u.email ?? "");
    setUserSearch(u.email ?? u.display_name ?? "");
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      if (field === "product_id") {
        const prod = products.find((p) => p.id === value);
        return { ...item, product_id: value as string, price_usd: prod?.price_usd ?? item.price_usd };
      }
      return { ...item, [field]: value };
    }));
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: "", quantity: 1, price_usd: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedUserId) { setError("회원을 선택하세요."); return; }
    if (items.some((i) => !i.product_id)) { setError("모든 항목에 상품을 선택해주세요."); return; }

    setSaving(true);
    const res = await fetch("/api/admin/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: selectedUserId,
        customer_email: selectedEmail,
        items,
        note: note || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "주문 생성 실패.");
    } else {
      setSuccess(`주문 생성 완료: #${(json.order_id as string).slice(0, 8).toUpperCase()}`);
      setTimeout(() => router.push("/admin/orders"), 1500);
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    background: "#0D0D1A", border: "1px solid #2D2D4E",
    borderRadius: "8px", color: "#F0E6FF", padding: "7px 10px", fontSize: "13px",
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
          {success}
        </div>
      )}

      {/* User selection */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h3 className="font-medium flex items-center gap-2" style={{ color: "#F0E6FF" }}>
          <UserSearch className="w-4 h-4 text-[#A855F7]" /> 고객
        </h3>
        <div className="relative">
          <input
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setSelectedUserId(""); }}
            placeholder="이메일 또는 이름으로 검색…"
            style={{ ...inputStyle, width: "100%" }}
          />
          {userSearch && !selectedUserId && filteredUsers.length > 0 && (
            <div
              className="absolute z-10 left-0 right-0 mt-1 rounded-lg border overflow-hidden"
              style={{ background: "#13131F", borderColor: "#2D2D4E" }}
            >
              {filteredUsers.slice(0, 8).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectUser(u)}
                  className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:opacity-80"
                  style={{ color: "#F0E6FF", borderBottom: "1px solid #2D2D4E" }}
                >
                  {u.display_name && <span className="font-medium">{u.display_name}</span>}
                  {u.email && <span className="text-[#9CA3AF] ml-2 text-xs">{u.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedUserId && (
          <p className="text-xs" style={{ color: "#10B981" }}>
            ✓ 선택됨: {selectedEmail}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl border p-5 space-y-3" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h3 className="font-medium" style={{ color: "#F0E6FF" }}>상품 목록</h3>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={item.product_id}
              onChange={(e) => updateItem(i, "product_id", e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">— 상품 선택 —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (${p.price_usd})</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
              style={{ ...inputStyle, width: "64px", textAlign: "center" }}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.price_usd}
              onChange={(e) => updateItem(i, "price_usd", parseFloat(e.target.value) || 0)}
              style={{ ...inputStyle, width: "90px" }}
              placeholder="$"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-1.5 rounded transition-colors"
                style={{ color: "#EF4444" }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
          style={{ color: "#A855F7" }}
        >
          <Plus className="w-3.5 h-3.5" /> 항목 추가
        </button>
        <div className="text-right pt-2 border-t" style={{ borderColor: "#2D2D4E" }}>
          <span className="text-sm font-semibold" style={{ color: "#F59E0B" }}>
            합계: ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: "#9CA3AF" }}>어드민 메모 (선택)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="예: CS 보상, 오프라인 판매"
          style={{ ...inputStyle, width: "100%" }}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
      >
        {saving ? "주문 생성 중…" : "주문 생성 (상태: 결제완료)"}
      </button>
    </form>
  );
}
