"use client";

import { useState } from "react";
import { Send, Users, ShoppingBag, Package, Heart, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Segment = "all" | "buyers" | "product_buyers" | "wishlist_product";

const TEMPLATES = [
  {
    label: "신상품 출시",
    subject: "✨ New arrival at Mystic Lab",
    html: `<h2 style="color:#7C3AED">New Arrival</h2><p>We just added an exciting new product to our collection. Check it out now!</p><a href="https://mystic-lab.vercel.app/en/products" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Shop Now</a>`,
  },
  {
    label: "할인 이벤트",
    subject: "🎩 Exclusive discount for you",
    html: `<h2 style="color:#F59E0B">Special Offer</h2><p>Use code <strong>MAGIC10</strong> for 10% off your next order. Limited time only!</p><a href="https://mystic-lab.vercel.app/en/products" style="display:inline-block;background:#F59E0B;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Claim Offer</a>`,
  },
  {
    label: "튜토리얼 안내",
    subject: "📹 Don't forget your tutorials",
    html: `<h2 style="color:#10B981">Your Tutorials Await</h2><p>You have unlocked tutorial videos — head to your account to watch them anytime.</p><a href="https://mystic-lab.vercel.app/en/account" style="display:inline-block;background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Tutorials</a>`,
  },
];

interface Product {
  id: string;
  name: string;
}

export default function NewsletterClient({ products = [] }: { products?: Product[] }) {
  const [segment, setSegment] = useState<Segment>("all");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; message?: string } | null>(null);
  const [error, setError] = useState("");

  function applyTemplate(t: (typeof TEMPLATES)[0]) {
    setSubject(t.subject);
    setHtml(t.html);
    setResult(null);
    setError("");
  }

  async function handleSend() {
    if (!subject.trim() || !html.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          segment,
          ...((segment === "product_buyers" || segment === "wishlist_product") ? { product_id: selectedProductId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "발송에 실패했습니다.");
      } else {
        setResult(data);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Segment */}
      <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">수신 대상</p>
        <div className="flex flex-wrap gap-3">
          {([
            { value: "all", label: "전체 회원", icon: Users },
            { value: "buyers", label: "구매자 전체", icon: ShoppingBag },
            { value: "product_buyers", label: "특정 상품 구매자", icon: Package },
            { value: "wishlist_product", label: "상품 위시리스트", icon: Heart },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSegment(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                segment === value
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                  : "border-[#2D2D4E] text-[#9CA3AF] hover:border-[#7C3AED]/50 hover:text-[#F0E6FF]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {(segment === "product_buyers" || segment === "wishlist_product") && (
          <div className="mt-3">
            <label className="text-xs text-[#6B7280] mb-1 block">
              {segment === "wishlist_product" ? "위시리스트 대상 상품" : "상품 선택"}
            </label>
            {products.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">등록된 상품이 없습니다.</p>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] focus:outline-none focus:border-[#7C3AED]/60 min-w-[280px]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">빠른 템플릿</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(t)}
              className="px-3 py-1.5 rounded-lg border border-[#2D2D4E] text-xs text-[#9CA3AF] hover:border-[#7C3AED]/50 hover:text-[#A855F7] transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5 space-y-4">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">메일 작성</p>
        <div>
          <label className="text-xs text-[#6B7280] mb-1 block">제목</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="이메일 제목..."
            className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-lg px-4 py-2.5 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60"
          />
        </div>
        <div>
          <label className="text-xs text-[#6B7280] mb-1 block">HTML 본문</label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<h2>Hello!</h2><p>Your message here...</p>"
            rows={10}
            className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-lg px-4 py-3 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60 font-mono resize-y"
          />
        </div>
        {html && (
          <div>
            <p className="text-xs text-[#6B7280] mb-2">미리보기</p>
            {/* sandbox="" — 스크립트 실행·동일출처 차단(미리보기 XSS 방지) */}
            <iframe
              title="newsletter-preview"
              sandbox=""
              srcDoc={html}
              className="w-full h-64 bg-white rounded-lg border border-[#2D2D4E]"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          발송 완료 — 성공 {result.sent}건 / 실패 {result.failed}건
          {result.message && <span className="text-[#9CA3AF] ml-1">({result.message})</span>}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        className="flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? "발송 중..." : "발송하기"}
      </button>
    </div>
  );
}
