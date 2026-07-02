"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface BizDetails {
  biz_name: string;
  biz_reg: string;
  biz_representative: string;
  biz_address: string;
  biz_phone: string;
  biz_email: string;
  biz_communication_reg: string;
  biz_privacy_officer: string;
}

export default function SettingsAdminClient() {
  const [biz, setBiz] = useState<BizDetails>({
    biz_name: "",
    biz_reg: "",
    biz_representative: "",
    biz_address: "",
    biz_phone: "",
    biz_email: "",
    biz_communication_reg: "",
    biz_privacy_officer: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("설정을 불러오지 못했습니다.");
        const data = await res.json();
        if (data.bizDetails) {
          setBiz(data.bizDetails);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "설정을 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (key: keyof BizDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setBiz((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bizDetails: biz }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "설정 저장에 실패했습니다.");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  const inputCls =
    "w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-2.5 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors";
  const labelCls = "block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase tracking-wide";

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          설정이 성공적으로 저장되었습니다!
        </div>
      )}

      <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-[#F0E6FF] border-b border-[#2D2D4E] pb-3">
          사업자 및 상거래 고지 정보 설정
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>상호 / 회사명</label>
            <input
              type="text"
              value={biz.biz_name}
              onChange={handleChange("biz_name")}
              required
              placeholder="예: 비에이블 (Beable)"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>사업자등록번호</label>
            <input
              type="text"
              value={biz.biz_reg}
              onChange={handleChange("biz_reg")}
              required
              placeholder="예: 123-45-67890"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>대표자명</label>
            <input
              type="text"
              value={biz.biz_representative}
              onChange={handleChange("biz_representative")}
              required
              placeholder="예: 홍길동"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>통신판매업 신고번호</label>
            <input
              type="text"
              value={biz.biz_communication_reg}
              onChange={handleChange("biz_communication_reg")}
              placeholder="예: 제 2026-서울강남-0000호"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>사업장 주소</label>
          <input
            type="text"
            value={biz.biz_address}
            onChange={handleChange("biz_address")}
            placeholder="예: 서울특별시 강남구 테헤란로 123"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>대표 전화번호</label>
            <input
              type="text"
              value={biz.biz_phone}
              onChange={handleChange("biz_phone")}
              placeholder="예: 02-1234-5678"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>대표 이메일</label>
            <input
              type="email"
              value={biz.biz_email}
              onChange={handleChange("biz_email")}
              required
              placeholder="예: contact@domain.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>개인정보보호책임자</label>
          <input
            type="text"
            value={biz.biz_privacy_officer}
            onChange={handleChange("biz_privacy_officer")}
            placeholder="예: 홍길동 (privacy@domain.com)"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-90 active:scale-95 text-white font-medium px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          설정 저장하기
        </button>
      </div>
    </form>
  );
}
