"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES, TOP_COUNTRY_CODES, type Country } from "@/lib/constants/countries";

interface Props {
  value: string;              // ISO code (예: "KR")
  onChange: (country: Country) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function CountrySelect({
  value,
  onChange,
  placeholder = "국가 선택",
  className = "",
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.code === value) ?? null;

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 열릴 때 검색창 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useCallback(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [query])();

  const topFiltered = filtered.filter((c) => TOP_COUNTRY_CODES.has(c.code));
  const otherFiltered = filtered.filter((c) => !TOP_COUNTRY_CODES.has(c.code));
  const showSeparator = !query.trim() && topFiltered.length > 0 && otherFiltered.length > 0;

  function select(country: Country) {
    onChange(country);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-required={required}
        className="w-full flex items-center justify-between bg-[#13131F] border border-[#2D2D4E] text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#7C3AED] transition-colors text-left"
        style={{ color: selected ? "#F0E6FF" : "#4B5563" }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span className="shrink-0 text-[#9CA3AF] font-mono text-xs">{selected.phone}</span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl shadow-2xl overflow-hidden">
          {/* 검색창 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2D2D4E]">
            <Search className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="국가명, 코드, 전화번호로 검색..."
              className="flex-1 bg-transparent text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#9CA3AF]" />
              </button>
            )}
          </div>

          {/* 목록 */}
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#6B7280] text-center">검색 결과 없음</li>
            ) : (
              <>
                {topFiltered.map((c) => (
                  <CountryOption key={c.code} country={c} selected={c.code === value} onSelect={select} />
                ))}

                {showSeparator && (
                  <li className="px-3 py-1.5">
                    <span className="text-[10px] text-[#4B5563] uppercase tracking-wider">모든 국가</span>
                  </li>
                )}

                {otherFiltered.map((c) => (
                  <CountryOption key={c.code} country={c} selected={c.code === value} onSelect={select} />
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function CountryOption({
  country,
  selected,
  onSelect,
}: {
  country: Country;
  selected: boolean;
  onSelect: (c: Country) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(country)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-[#2D2D4E] ${
          selected ? "bg-[#7C3AED]/20 text-[#F0E6FF]" : "text-[#D1D5DB]"
        }`}
      >
        <span className="w-10 shrink-0 text-xs font-mono text-[#9CA3AF]">{country.phone}</span>
        <span className="flex-1 truncate">{country.name}</span>
        <span className="text-[11px] text-[#6B7280] shrink-0">{country.code}</span>
      </button>
    </li>
  );
}
