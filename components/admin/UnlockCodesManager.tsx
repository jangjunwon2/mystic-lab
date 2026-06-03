"use client";

import { useState } from "react";
import { Copy, Check, Trash2, Unlink, Smartphone } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
}

interface CodeRow {
  id: string;
  product_id: string;
  product_slug: string;
  created_at: string;
  first_used_at: string | null;
  code_plain: string | null;
  is_activated: boolean;
  last_activated_at: string | null;
  is_member: boolean;
  member_name: string | null;
  product_name: string;
}

interface Props {
  products: Product[];
  codes: CodeRow[];
}

const MAGIC_SLUG = "magic-calculator";

export default function UnlockCodesManager({ products, codes: initialCodes }: Props) {
  const [codes, setCodes] = useState(initialCodes);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // 코드가 존재하는 상품만 탭으로 노출 (마술 계산기 앱처럼 회원 코드가 많은 상품을 분리 관리)
  const tabProducts = products.filter((p) => codes.some((c) => c.product_id === p.id));
  const [activeTab, setActiveTab] = useState<string>(() => {
    const magic = tabProducts.find((p) => p.slug === MAGIC_SLUG);
    return magic?.id ?? "all";
  });

  const visibleCodes = activeTab === "all" ? codes : codes.filter((c) => c.product_id === activeTab);

  async function generateCode() {
    if (!selectedProductId) return;
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/admin/unlock-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: selectedProductId }),
    });

    if (res.ok) {
      const data = await res.json();
      const productName = products.find((p) => p.id === selectedProductId)?.name ?? "알 수 없음";
      setCodes((prev) => [
        {
          id: data.id,
          product_id: selectedProductId,
          product_slug: products.find((p) => p.id === selectedProductId)?.slug ?? "",
          created_at: new Date().toISOString(),
          first_used_at: null,
          code_plain: data.code,
          is_activated: false,
          last_activated_at: null,
          is_member: false,
          member_name: null,
          product_name: productName,
        },
        ...prev,
      ]);
      setActiveTab(selectedProductId); // 방금 발급한 코드가 보이도록 해당 상품 탭으로 전환
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "코드 생성에 실패했습니다.");
    }
    setGenerating(false);
  }

  function copyCode(id: string, code: string | null) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function releaseDevice(id: string) {
    if (!confirm("이 코드의 등록된 단말기 권한을 취소할까요? 사용자는 다시 기기 등록을 해야 합니다.")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/unlock-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "release" }),
    });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_activated: false, last_activated_at: null } : c)));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "기기 해제에 실패했습니다.");
    }
    setBusyId(null);
  }

  async function deleteCode(id: string) {
    if (!confirm("이 코드를 영구 삭제할까요? 되돌릴 수 없습니다.")) return;
    setBusyId(id);
    const res = await fetch("/api/admin/unlock-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "삭제에 실패했습니다.");
    }
    setBusyId(null);
  }

  const inputStyle = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "8px 12px",
    fontSize: "14px",
  };

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) : null);

  return (
    <div className="space-y-6">
      {/* 생성 폼 */}
      <div className="rounded-xl p-6 border space-y-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>
          새 코드 수동 발급
        </h2>

        {error && (
          <p className="text-sm" style={{ color: "#EF4444" }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>
              상품 선택
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ ...inputStyle, minWidth: "240px" }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generateCode}
            disabled={generating || !selectedProductId}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            {generating ? "발급 중…" : "코드 발급"}
          </button>
        </div>
        <p className="text-xs" style={{ color: "#6B7280" }}>
          발급된 코드는 평문으로 보관되어 아래 목록에서 언제든 다시 확인·복사할 수 있습니다.
        </p>
      </div>

      {/* 상품별 탭 */}
      {tabProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", slug: "", name: `전체 (${codes.length})` }, ...tabProducts.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: `${p.name} (${codes.filter((c) => c.product_id === p.id).length})`,
          }))].map((tab) => {
            const isActive = activeTab === tab.id;
            const isMagic = tab.slug === MAGIC_SLUG;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={
                  isActive
                    ? { background: "#7C3AED", color: "#fff" }
                    : { background: "#1A1A2E", color: "#9CA3AF", border: "1px solid #2D2D4E" }
                }
              >
                {isMagic && "📱 "}
                {tab.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 코드 목록 */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#2D2D4E" }}>
          <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>
            발급된 코드 ({visibleCodes.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["상품", "코드", "발급 경로", "회원", "기기 등록", "마지막 활성화", "관리"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    발급된 코드가 없습니다.
                  </td>
                </tr>
              ) : (
                visibleCodes.map((code) => (
                  <tr key={code.id} className="border-b last:border-0" style={{ borderColor: "#2D2D4E", opacity: busyId === code.id ? 0.5 : 1 }}>
                    <td className="px-4 py-4 font-medium whitespace-nowrap" style={{ color: "#F0E6FF" }}>
                      {code.product_name}
                    </td>
                    <td className="px-4 py-4">
                      {code.code_plain ? (
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs tracking-wider px-2 py-1 rounded" style={{ background: "#0D0D1A", color: "#A855F7" }}>
                            {code.code_plain}
                          </code>
                          <button
                            onClick={() => copyCode(code.id, code.code_plain)}
                            aria-label="코드 복사"
                            className="p-1 rounded transition-opacity hover:opacity-70"
                            style={{ color: "#9CA3AF" }}
                          >
                            {copiedId === code.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs" style={{ color: "#6B7280" }}>{code.id.slice(0, 8)}… (평문 없음)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={code.is_member
                        ? { background: "#7C3AED22", color: "#A855F7", border: "1px solid #7C3AED44" }
                        : { background: "#2D2D4E", color: "#9CA3AF" }}>
                        {code.is_member ? "회원 자동발급" : "수동 발급"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs" style={{ color: code.member_name ? "#F0E6FF" : "#6B7280" }}>
                      {code.member_name ?? "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {code.is_activated ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#10B981" }}>
                          <Smartphone className="w-3.5 h-3.5" /> 등록됨
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "#6B7280" }}>미등록</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs" style={{ color: "#9CA3AF" }}>
                      {fmt(code.last_activated_at) ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => releaseDevice(code.id)}
                          disabled={!code.is_activated || busyId === code.id}
                          title="기기 강제 해제"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-30"
                          style={{ background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B44" }}
                        >
                          <Unlink className="w-3.5 h-3.5" /> 기기 해제
                        </button>
                        <button
                          onClick={() => deleteCode(code.id)}
                          disabled={busyId === code.id}
                          title="코드 삭제"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                          style={{ background: "#EF444422", color: "#EF4444", border: "1px solid #EF444444" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 삭제
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
    </div>
  );
}
