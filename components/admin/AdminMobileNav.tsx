"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/analytics", label: "매출 분석", icon: "📈" },
  { href: "/admin/users", label: "회원 관리", icon: "👥" },
  { href: "/admin/products", label: "상품 관리", icon: "🪄" },
  { href: "/admin/orders", label: "주문 관리", icon: "📦" },
  { href: "/admin/shipping", label: "배송 관리", icon: "🚚" },
  { href: "/admin/reviews", label: "리뷰 관리", icon: "⭐" },
  { href: "/admin/custom-orders", label: "커스텀 주문", icon: "✉️" },
  { href: "/admin/discounts", label: "할인 코드", icon: "🏷️" },
  { href: "/admin/videos", label: "영상 관리", icon: "🎬" },
  { href: "/admin/unlock-codes", label: "잠금 해제 코드", icon: "🔑" },
  { href: "/admin/announcements", label: "공지 관리", icon: "📢" },
  { href: "/admin/newsletter", label: "뉴스레터", icon: "📧" },
  { href: "/admin/referrals", label: "레퍼럴", icon: "🔗" },
];

export default function AdminMobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40"
        style={{ background: "#13131F", borderColor: "#2D2D4E" }}
      >
        <div>
          <p className="font-semibold text-sm" style={{ color: "#A855F7" }}>Mystic Lab 어드민</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: "#9CA3AF" }}
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setOpen(false)}
          style={{ background: "rgba(0,0,0,0.6)" }}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col lg:hidden transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#13131F", borderRight: "1px solid #2D2D4E" }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#2D2D4E" }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>어드민 패널</p>
            <p className="font-semibold" style={{ color: "#A855F7" }}>Mystic Lab</p>
            <p className="text-xs mt-1 truncate max-w-[180px]" style={{ color: "#9CA3AF" }}>{email}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg"
            style={{ color: "#9CA3AF" }}
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:text-white hover:bg-white/5"
              style={{ color: "#9CA3AF" }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "#2D2D4E" }}>
          <Link
            href="/en"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "#9CA3AF" }}
          >
            ← 스토어로 돌아가기
          </Link>
        </div>
      </div>
    </>
  );
}
