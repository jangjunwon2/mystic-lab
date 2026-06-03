"use client";

import { useState } from "react";
import { Search, Gift, KeyRound, Loader2, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface FoundUser {
  id: string;
  email: string;
  display_name: string;
}

interface Props {
  products: Product[];
}

const inputStyle = {
  background: "#0D0D1A",
  border: "1px solid #2D2D4E",
  borderRadius: "8px",
  color: "#F0E6FF",
  padding: "10px 12px",
  fontSize: "14px",
};

export default function GiftManager({ products }: Props) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<FoundUser | null>(null);

  // 권한 부여 / 무료 발송 공통
  const [grantProductId, setGrantProductId] = useState(products[0]?.id ?? "");
  const [shipProductId, setShipProductId] = useState(products[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"grant" | "ship" | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function search() {
    if (query.trim().length < 2) {
      setMsg({ type: "err", text: "2글자 이상 입력해주세요." });
      return;
    }
    setSearching(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(Array.isArray(data.users) ? data.users : []);
      setSearched(true);
    } catch {
      setMsg({ type: "err", text: "검색에 실패했습니다." });
    }
    setSearching(false);
  }

  async function grantAccess() {
    if (!selected || !grantProductId) return;
    setBusy("grant");
    setMsg(null);
    const res = await fetch(`/api/admin/users/${selected.id}/grants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: grantProductId, note: note.trim() || "증정/권한부여" }),
    });
    if (res.ok) {
      const name = products.find((p) => p.id === grantProductId)?.name ?? "";
      setMsg({ type: "ok", text: `✅ ${selected.email} 에게 "${name}" 접근 권한을 부여했습니다.` });
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: `❌ ${d.error ?? "권한 부여 실패."}` });
    }
    setBusy(null);
  }

  async function sendGift() {
    if (!selected || !shipProductId) return;
    setBusy("ship");
    setMsg(null);
    const res = await fetch("/api/admin/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: selected.id,
        customer_email: selected.email,
        items: [{ product_id: shipProductId, quantity: 1, price_usd: 0 }],
        note: `[증정] ${note.trim()}`.trim(),
      }),
    });
    if (res.ok) {
      const name = products.find((p) => p.id === shipProductId)?.name ?? "";
      setMsg({ type: "ok", text: `✅ ${selected.email} 에게 "${name}" 무료 증정 주문을 생성했습니다. (주문 관리에서 배송 처리)` });
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ type: "err", text: `❌ ${d.error ?? "증정 주문 생성 실패."}` });
    }
    setBusy(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 검색 */}
      <div className="rounded-xl p-5 border" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <label className="text-xs block mb-2" style={{ color: "#9CA3AF" }}>회원 검색 (이메일 또는 이름)</label>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="예: jun923008@gmail.com 또는 홍길동"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={search}
            disabled={searching}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            검색
          </button>
        </div>

        {searched && results.length === 0 && (
          <p className="text-sm mt-3" style={{ color: "#9CA3AF" }}>검색 결과가 없습니다.</p>
        )}

        {results.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelected(u); setMsg(null); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors"
                style={{
                  background: selected?.id === u.id ? "#7C3AED22" : "#0D0D1A",
                  border: `1px solid ${selected?.id === u.id ? "#7C3AED" : "#2D2D4E"}`,
                }}
              >
                <span className="text-sm" style={{ color: "#F0E6FF" }}>
                  {u.display_name || "(이름 없음)"} <span style={{ color: "#9CA3AF" }}>· {u.email}</span>
                </span>
                {selected?.id === u.id && <Check className="w-4 h-4" style={{ color: "#A855F7" }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 선택된 회원 + 액션 */}
      {selected && (
        <div className="rounded-xl p-5 border space-y-5" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <p className="text-sm" style={{ color: "#F0E6FF" }}>
            대상: <b style={{ color: "#A855F7" }}>{selected.display_name || selected.email}</b>
            <span style={{ color: "#9CA3AF" }}> ({selected.email})</span>
          </p>

          <div>
            <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>메모 (선택, 증정 사유 등)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 신규가입 사은품 이벤트" style={{ ...inputStyle, width: "100%" }} />
          </div>

          {/* 권한 부여 */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" style={{ color: "#A855F7" }} />
              <h3 className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>상품 접근 권한 부여</h3>
            </div>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>해법 영상·마술 앱 등 해당 상품의 접근 권한을 즉시 부여합니다 (배송 없음).</p>
            <div className="flex gap-2">
              <select value={grantProductId} onChange={(e) => setGrantProductId(e.target.value)} style={{ ...inputStyle, flex: 1, cursor: "pointer" }}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={grantAccess} disabled={busy === "grant"} className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50" style={{ background: "#7C3AED", color: "#fff" }}>
                {busy === "grant" ? "처리 중…" : "권한 부여"}
              </button>
            </div>
          </div>

          {/* 무료 발송 */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: "#13131F", border: "1px solid #2D2D4E" }}>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4" style={{ color: "#F59E0B" }} />
              <h3 className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>상품 무료 증정 (발송)</h3>
            </div>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>금액 0원 증정 주문을 생성합니다. 실물은 주문 관리/배송 관리에서 운송장을 입력해 발송하세요.</p>
            <div className="flex gap-2">
              <select value={shipProductId} onChange={(e) => setShipProductId(e.target.value)} style={{ ...inputStyle, flex: 1, cursor: "pointer" }}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={sendGift} disabled={busy === "ship"} className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50" style={{ background: "#F59E0B", color: "#13131F" }}>
                {busy === "ship" ? "처리 중…" : "증정 주문 생성"}
              </button>
            </div>
          </div>

          {msg && (
            <p className="text-sm" style={{ color: msg.type === "ok" ? "#10B981" : "#EF4444" }}>{msg.text}</p>
          )}
        </div>
      )}
    </div>
  );
}
