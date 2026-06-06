"use client";

import { formatDateKo } from "@/lib/utils/format";

import { useState } from "react";

export interface IssuedCoupon {
  id: string;
  code: string;
  name: string | null;
  email: string | null;
  user_id: string | null;
  type: "percent" | "fixed";
  value: number;
  source: string | null;
  scope: "personal" | "public" | null;
  max_uses: number | null;
  per_user_limit: number | null;
  used_count: number;
  is_active: boolean;
  min_order_usd: number;
  is_used: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// 분류: 신입(signup) / 정기(trigger) / 프로모션(공개+기간) / 전체(공개) / 개별(personal)
type CouponCategory = "all" | "personal" | "public" | "signup" | "promo" | "trigger";
function categoryOf(c: IssuedCoupon): Exclude<CouponCategory, "all"> {
  if (c.source === "signup") return "signup";
  if (c.source === "trigger") return "trigger";
  if ((c.scope ?? "personal") === "public") return (c.starts_at || c.expires_at) ? "promo" : "public";
  return "personal";
}
const CATEGORY_TABS: { key: CouponCategory; label: string }[] = [
  { key: "all", label: "전체보기" },
  { key: "personal", label: "개별" },
  { key: "public", label: "전체 쿠폰" },
  { key: "signup", label: "신입 환영" },
  { key: "promo", label: "프로모션" },
  { key: "trigger", label: "정기" },
];

export interface ProductOption {
  id: string;
  name: string;
  category: string | null;
}

interface Props {
  initialCoupons: IssuedCoupon[];
  products: ProductOption[];
  categories: string[];
}

// 상품/카테고리 한정 선택기 — 미선택 시 전체 적용.
function TargetPicker({ products, categories, productIds, categoriesSel, onToggleProduct, onToggleCategory }: {
  products: ProductOption[]; categories: string[];
  productIds: string[]; categoriesSel: string[];
  onToggleProduct: (id: string) => void; onToggleCategory: (c: string) => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#9CA3AF" }}>적용 한정 (선택 — 미선택 시 전체 상품)</label>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {categories.map((cat) => {
            const on = categoriesSel.includes(cat);
            return (
              <button key={cat} type="button" onClick={() => onToggleCategory(cat)}
                className="px-2.5 py-1 rounded-lg text-xs transition-colors"
                style={{ background: on ? "#7C3AED" : "#13131F", color: on ? "#fff" : "#9CA3AF", border: `1px solid ${on ? "#7C3AED" : "#2D2D4E"}` }}>
                카테고리: {cat}
              </button>
            );
          })}
        </div>
      )}
      <div className="max-h-32 overflow-y-auto rounded-lg border p-2 space-y-1" style={{ background: "#13131F", borderColor: "#2D2D4E" }}>
        {products.length === 0 ? (
          <p className="text-xs px-1" style={{ color: "#6B7280" }}>상품이 없습니다.</p>
        ) : products.map((p) => {
          const on = productIds.includes(p.id);
          return (
            <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer px-1 py-0.5" style={{ color: on ? "#F0E6FF" : "#9CA3AF" }}>
              <input type="checkbox" checked={on} onChange={() => onToggleProduct(p.id)} />
              <span className="truncate">{p.name}</span>
              {p.category && <span style={{ color: "#6B7280" }}>· {p.category}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-purple-500";
const inputStyle = { background: "#13131F", borderColor: "#2D2D4E", color: "#F0E6FF" } as const;
const labelCls = "block text-xs font-medium mb-1.5 uppercase tracking-wider";

export default function CouponsAdminClient({ initialCoupons, products, categories }: Props) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [tab, setTab] = useState<CouponCategory>("all");
  // 상품/카테고리 한정 선택 — 공개(b)·개인(p) 폼 각각
  const [targetProductIds, setTargetProductIds] = useState<string[]>([]);
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [pTargetProductIds, setPTargetProductIds] = useState<string[]>([]);
  const [pTargetCategories, setPTargetCategories] = useState<string[]>([]);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // 개인 쿠폰 폼
  const [pCreating, setPCreating] = useState(false);
  const [pError, setPError] = useState("");
  const [pIssued, setPIssued] = useState("");
  const [pForm, setPForm] = useState({ name: "", email: "", type: "percent", value: "10", minOrderUsd: "0" });

  // 공개 쿠폰 폼
  const [bCreating, setBCreating] = useState(false);
  const [bError, setBError] = useState("");
  const [bIssued, setBIssued] = useState("");
  const [bForm, setBForm] = useState({ name: "", code: "", type: "percent", value: "10", maxUses: "", perUserLimit: "", minOrderUsd: "", startsAt: "", expiresAt: "" });

  // 이벤트 일괄 발급 폼 (개인 쿠폰을 대상 전체에게 발급)
  const [blkCreating, setBlkCreating] = useState(false);
  const [blkError, setBlkError] = useState("");
  const [blkResult, setBlkResult] = useState("");
  const [blkForm, setBlkForm] = useState({ target: "all", productId: "", emails: "", name: "", type: "percent", value: "10", minOrderUsd: "0", expiresMonths: "6", sendEmail: true });
  const [blkTargetProductIds, setBlkTargetProductIds] = useState<string[]>([]);
  const [blkTargetCategories, setBlkTargetCategories] = useState<string[]>([]);

  async function refresh() {
    fetch("/api/admin/coupons").then((r) => r.json()).then((d) => Array.isArray(d) && setCoupons(d)).catch(() => {});
  }

  // 정지/재개(is_active 토글). 낙관적 갱신 후 실패 시 새로고침.
  async function setActive(id: string, isActive: boolean) {
    setCoupons((cs) => cs.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)));
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) refresh();
  }

  async function remove(id: string) {
    if (!confirm("이 쿠폰을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setCoupons((cs) => cs.filter((c) => c.id !== id));
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) refresh();
  }

  async function createPersonal() {
    const value = parseFloat(pForm.value);
    if (!pForm.email.trim()) { setPError("이메일을 입력해주세요."); return; }
    if (isNaN(value) || value <= 0) { setPError("할인 값을 입력해주세요."); return; }
    setPCreating(true); setPError(""); setPIssued("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "personal",
        name: pForm.name.trim() || null,
        email: pForm.email.trim(),
        type: pForm.type,
        value,
        minOrderUsd: parseFloat(pForm.minOrderUsd) || 0,
        productIds: pTargetProductIds,
        categories: pTargetCategories,
      }),
    });
    const json = await res.json();
    setPCreating(false);
    if (!res.ok) { setPError(json.error ?? "발급에 실패했습니다."); return; }
    setPIssued(json.code);
    refresh();
    setPForm({ ...pForm, email: "", name: "" });
    setPTargetProductIds([]); setPTargetCategories([]);
  }

  async function createPublic() {
    const value = parseFloat(bForm.value);
    if (isNaN(value) || value <= 0) { setBError("할인 값을 입력해주세요."); return; }
    setBCreating(true); setBError(""); setBIssued("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: "public",
        name: bForm.name.trim() || null,
        code: bForm.code.trim() || undefined,
        type: bForm.type,
        value,
        maxUses: bForm.maxUses.trim() === "" ? null : parseInt(bForm.maxUses, 10),
        perUserLimit: bForm.perUserLimit.trim() === "" ? null : parseInt(bForm.perUserLimit, 10),
        minOrderUsd: parseFloat(bForm.minOrderUsd) || 0,
        startsAt: bForm.startsAt ? new Date(bForm.startsAt).toISOString() : null,
        expiresAt: bForm.expiresAt ? new Date(bForm.expiresAt).toISOString() : null,
        productIds: targetProductIds,
        categories: targetCategories,
      }),
    });
    const json = await res.json();
    setBCreating(false);
    if (!res.ok) { setBError(json.error ?? "발급에 실패했습니다."); return; }
    setBIssued(json.code);
    refresh();
    setBForm({ ...bForm, code: "", name: "" });
    setTargetProductIds([]); setTargetCategories([]);
  }

  async function createBulk() {
    const value = parseFloat(blkForm.value);
    if (isNaN(value) || value <= 0) { setBlkError("할인 값을 입력해주세요."); return; }
    if (blkForm.target === "wishlist_product" && !blkForm.productId) { setBlkError("위시리스트 대상 상품을 선택해주세요."); return; }
    if (blkForm.target === "manual" && !blkForm.emails.trim()) { setBlkError("이메일을 입력해주세요."); return; }
    if (!confirm("선택한 대상 전체에게 개인 쿠폰을 발급합니다. 계속할까요?")) return;
    setBlkCreating(true); setBlkError(""); setBlkResult("");
    const res = await fetch("/api/admin/coupons/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: blkForm.target,
        productId: blkForm.productId || undefined,
        emails: blkForm.emails || undefined,
        name: blkForm.name.trim() || null,
        type: blkForm.type,
        value,
        minOrderUsd: parseFloat(blkForm.minOrderUsd) || 0,
        expiresMonths: blkForm.expiresMonths.trim() === "" ? null : parseInt(blkForm.expiresMonths, 10),
        productIds: blkTargetProductIds,
        categories: blkTargetCategories,
        sendEmail: blkForm.sendEmail,
      }),
    });
    const json = await res.json();
    setBlkCreating(false);
    if (!res.ok) { setBlkError(json.error ?? "발급에 실패했습니다."); return; }
    setBlkResult(
      `발급 ${json.issued}건` +
      (json.emailed ? ` · 이메일 ${json.emailed}통` : "") +
      (json.capped ? ` (대상 ${json.total}명 중 상한까지만 발급)` : "")
    );
    refresh();
  }

  const fmt = (iso: string) => { try { return new Date(iso).toLocaleDateString("ko"); } catch { return iso.slice(0, 10); } };

  const usageLabel = (c: IssuedCoupon) => {
    if ((c.scope ?? "personal") === "public") {
      const total = c.max_uses == null ? "∞" : c.max_uses;
      const perUser = c.per_user_limit != null ? ` · 1인 ${c.per_user_limit}회` : "";
      return `${c.used_count ?? 0} / ${total}${perUser}`;
    }
    return c.is_used ? "사용됨" : "미사용";
  };
  const usageActive = (c: IssuedCoupon) => {
    if ((c.scope ?? "personal") === "public") {
      return c.is_active && (c.max_uses == null || (c.used_count ?? 0) < c.max_uses);
    }
    return !c.is_used;
  };

  return (
    <div>
      {/* 이벤트 일괄 발급 — 대상 전체에게 개인 쿠폰(1인 1코드·1회용)을 한 번에 발급 */}
      <div className="rounded-xl border p-6 mb-8" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>이벤트 일괄 발급</h2>
        <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>대상 전체에게 개인 쿠폰(1인 1코드·1회용)을 한 번에 발급합니다. 1회 최대 2,000명.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls} style={{ color: "#9CA3AF" }}>발급 대상 *</label>
            <select value={blkForm.target} onChange={(e) => setBlkForm({ ...blkForm, target: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="all">전체 회원</option>
              <option value="newsletter">뉴스레터 구독자</option>
              <option value="buyers">과거 구매자</option>
              <option value="wishlist_product">위시리스트 (상품 지정)</option>
              <option value="manual">직접 입력</option>
            </select>
          </div>
          {blkForm.target === "wishlist_product" && (
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>위시리스트 대상 상품 *</label>
              <select value={blkForm.productId} onChange={(e) => setBlkForm({ ...blkForm, productId: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">선택하세요</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          {blkForm.target === "manual" && (
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>이메일 목록 * (줄바꿈/콤마 구분)</label>
              <textarea value={blkForm.emails} onChange={(e) => setBlkForm({ ...blkForm, emails: e.target.value })} rows={3} placeholder={"user1@example.com\nuser2@example.com"}
                className={inputCls} style={inputStyle} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className={labelCls} style={{ color: "#9CA3AF" }}>쿠폰 이름 (선택 — 고객에게 표시)</label>
            <input type="text" value={blkForm.name} onChange={(e) => setBlkForm({ ...blkForm, name: e.target.value })} placeholder="예: 가을맞이 감사 쿠폰" maxLength={60}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#9CA3AF" }}>유형</label>
            <select value={blkForm.type} onChange={(e) => setBlkForm({ ...blkForm, type: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="percent">정률 (%)</option>
              <option value="fixed">정액 ($)</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: "#9CA3AF" }}>{blkForm.type === "fixed" ? "할인액 ($)" : "할인율 (%)"}</label>
            <input type="number" min={0} step={0.01} value={blkForm.value} onChange={(e) => setBlkForm({ ...blkForm, value: e.target.value })}
              className={inputCls} style={{ ...inputStyle, color: "#F59E0B" }} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#9CA3AF" }}>최소 주문액 ($)</label>
            <input type="number" min={0} step={0.01} value={blkForm.minOrderUsd} onChange={(e) => setBlkForm({ ...blkForm, minOrderUsd: e.target.value })}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "#9CA3AF" }}>유효기간 (개월, 비우면 무기한)</label>
            <input type="number" min={0} step={1} value={blkForm.expiresMonths} onChange={(e) => setBlkForm({ ...blkForm, expiresMonths: e.target.value })}
              className={inputCls} style={inputStyle} />
          </div>
        </div>
        {/* 상품/카테고리 한정 — 선택 시 해당 상품에서만 사용·할인 */}
        <TargetPicker products={products} categories={categories}
          productIds={blkTargetProductIds} categoriesSel={blkTargetCategories}
          onToggleProduct={(id) => setBlkTargetProductIds((a) => toggle(a, id))}
          onToggleCategory={(c) => setBlkTargetCategories((a) => toggle(a, c))} />
        <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer" style={{ color: "#9CA3AF" }}>
          <input type="checkbox" checked={blkForm.sendEmail} onChange={(e) => setBlkForm({ ...blkForm, sendEmail: e.target.checked })} />
          발급과 함께 안내 이메일 발송
        </label>
        {blkError && <p className="text-sm mb-3" style={{ color: "#EF4444" }}>{blkError}</p>}
        {blkResult && <p className="text-sm mb-3" style={{ color: "#10B981" }}>{blkResult}</p>}
        <button onClick={createBulk} disabled={blkCreating} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}>
          {blkCreating ? "발급 중…" : "일괄 발급"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 개인 쿠폰 */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>개인 쿠폰</h2>
          <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>특정 이메일 1회용. 로그인 사용자만 사용 가능.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>쿠폰 이름 (선택 — 고객에게 표시)</label>
              <input type="text" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="예: 고객 감사 쿠폰" maxLength={60}
                className={inputCls} style={inputStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>대상 이메일 *</label>
              <input type="email" value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} placeholder="user@example.com"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>유형</label>
              <select value={pForm.type} onChange={(e) => setPForm({ ...pForm, type: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="percent">정률 (%)</option>
                <option value="fixed">정액 ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>{pForm.type === "fixed" ? "할인액 ($)" : "할인율 (%)"}</label>
              <input type="number" min={0} step={0.01} value={pForm.value} onChange={(e) => setPForm({ ...pForm, value: e.target.value })}
                className={inputCls} style={{ ...inputStyle, color: "#F59E0B" }} />
            </div>
          </div>
          {/* 상품/카테고리 한정 — 선택 시 해당 상품에서만 사용·할인. 회원 드롭다운에 대상 상품 있을 때만 활성. */}
          <TargetPicker products={products} categories={categories}
            productIds={pTargetProductIds} categoriesSel={pTargetCategories}
            onToggleProduct={(id) => setPTargetProductIds((a) => toggle(a, id))}
            onToggleCategory={(c) => setPTargetCategories((a) => toggle(a, c))} />
          {pError && <p className="text-sm mb-3" style={{ color: "#EF4444" }}>{pError}</p>}
          {pIssued && <p className="text-sm mb-3" style={{ color: "#10B981" }}>발급 완료: <span className="font-mono font-bold">{pIssued}</span></p>}
          <button onClick={createPersonal} disabled={pCreating} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}>
            {pCreating ? "발급 중…" : "개인 쿠폰 발급"}
          </button>
        </div>

        {/* 공개 쿠폰 */}
        <div className="rounded-xl border p-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#F0E6FF" }}>공개 쿠폰</h2>
          <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>누구나 쓰는 다회용 할인코드. 비워두면 코드 자동 생성. (구 할인코드 대체)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>쿠폰 이름 (선택 — 고객에게 표시)</label>
              <input type="text" value={bForm.name} onChange={(e) => setBForm({ ...bForm, name: e.target.value })} placeholder="예: 특정 제품 할인" maxLength={60}
                className={inputCls} style={inputStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} style={{ color: "#9CA3AF" }}>코드 (선택)</label>
              <input type="text" value={bForm.code} onChange={(e) => setBForm({ ...bForm, code: e.target.value })} placeholder="자동 생성하려면 비워두세요"
                className={inputCls} style={{ ...inputStyle, fontFamily: "monospace" }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>유형</label>
              <select value={bForm.type} onChange={(e) => setBForm({ ...bForm, type: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="percent">정률 (%)</option>
                <option value="fixed">정액 ($)</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>{bForm.type === "fixed" ? "할인액 ($)" : "할인율 (%)"}</label>
              <input type="number" min={0} step={0.01} value={bForm.value} onChange={(e) => setBForm({ ...bForm, value: e.target.value })}
                className={inputCls} style={{ ...inputStyle, color: "#F59E0B" }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>최대 사용 횟수 (선택)</label>
              <input type="number" min={1} step={1} value={bForm.maxUses} onChange={(e) => setBForm({ ...bForm, maxUses: e.target.value })} placeholder="무제한"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>1인당 사용 한도 (선택)</label>
              <input type="number" min={1} step={1} value={bForm.perUserLimit} onChange={(e) => setBForm({ ...bForm, perUserLimit: e.target.value })} placeholder="무제한"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>최소 주문액 ($, 선택)</label>
              <input type="number" min={0} step={0.01} value={bForm.minOrderUsd} onChange={(e) => setBForm({ ...bForm, minOrderUsd: e.target.value })} placeholder="0"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>사용 시작일 (선택·프로모션)</label>
              <input type="date" value={bForm.startsAt} onChange={(e) => setBForm({ ...bForm, startsAt: e.target.value })}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#9CA3AF" }}>사용 종료일 (선택·프로모션)</label>
              <input type="date" value={bForm.expiresAt} onChange={(e) => setBForm({ ...bForm, expiresAt: e.target.value })}
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* 상품/카테고리 한정 — 선택 시 해당 상품 소계에만 할인. 미선택=전체 적용 */}
          <TargetPicker products={products} categories={categories}
            productIds={targetProductIds} categoriesSel={targetCategories}
            onToggleProduct={(id) => setTargetProductIds((a) => toggle(a, id))}
            onToggleCategory={(c) => setTargetCategories((a) => toggle(a, c))} />

          {bError && <p className="text-sm mb-3" style={{ color: "#EF4444" }}>{bError}</p>}
          {bIssued && <p className="text-sm mb-3" style={{ color: "#10B981" }}>발급 완료: <span className="font-mono font-bold">{bIssued}</span></p>}
          <button onClick={createPublic} disabled={bCreating} className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}>
            {bCreating ? "발급 중…" : "공개 쿠폰 발급"}
          </button>
        </div>
      </div>

      {/* 분류 탭 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORY_TABS.map((ct) => {
          const count = ct.key === "all" ? coupons.length : coupons.filter((c) => categoryOf(c) === ct.key).length;
          const on = tab === ct.key;
          return (
            <button key={ct.key} onClick={() => setTab(ct.key)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: on ? "#7C3AED" : "#1A1A2E", color: on ? "#fff" : "#9CA3AF", border: `1px solid ${on ? "#7C3AED" : "#2D2D4E"}` }}>
              {ct.label} <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["이름", "코드", "분류", "대상", "할인", "사용", "기간", "관리"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = tab === "all" ? coupons : coupons.filter((c) => categoryOf(c) === tab);
                if (filtered.length === 0) {
                  return <tr><td colSpan={8} className="px-4 py-12 text-center" style={{ color: "#9CA3AF" }}>해당 분류의 쿠폰이 없습니다.</td></tr>;
                }
                return filtered.map((c) => {
                  const isPublic = (c.scope ?? "personal") === "public";
                  const active = usageActive(c);
                  const suspended = c.is_active === false;
                  const cat = categoryOf(c);
                  const catLabel = CATEGORY_TABS.find((t) => t.key === cat)?.label ?? cat;
                  const period = c.starts_at || c.expires_at
                    ? `${c.starts_at ? formatDateKo(c.starts_at) : "즉시"} ~ ${c.expires_at ? formatDateKo(c.expires_at) : "무기한"}`
                    : "무기한";
                  return (
                    <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "#2D2D4E", opacity: suspended ? 0.55 : 1 }}>
                      <td className="px-4 py-3" style={{ color: "#F0E6FF" }}>{c.name ?? <span style={{ color: "#6B7280" }}>—</span>}</td>
                      <td className="px-4 py-3"><span className="font-mono font-semibold" style={{ color: "#A855F7" }}>{c.code}</span></td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap" style={{ background: isPublic ? "#7C3AED22" : "#6B728022", color: isPublic ? "#A855F7" : "#9CA3AF" }}>
                          {catLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{c.email ?? "—"}</td>
                      <td className="px-4 py-3" style={{ color: "#F59E0B" }}>{c.type === "fixed" ? `$${c.value}` : `${c.value}%`}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap" style={{ background: active ? "#10B98122" : "#6B728022", color: active ? "#10B981" : "#9CA3AF" }}>
                          {suspended ? "정지됨" : usageLabel(c)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#6B7280" }}>{period}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setActive(c.id, suspended)} className="px-2 py-1 rounded text-xs transition-colors"
                            style={{ background: "#13131F", border: "1px solid #2D2D4E", color: suspended ? "#10B981" : "#F59E0B" }}>
                            {suspended ? "재개" : "정지"}
                          </button>
                          <button onClick={() => remove(c.id)} className="px-2 py-1 rounded text-xs transition-colors"
                            style={{ background: "#13131F", border: "1px solid #2D2D4E", color: "#EF4444" }}>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
