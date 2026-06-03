import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminMobileNav from "@/components/admin/AdminMobileNav";

export const metadata = { title: "Admin — Mystic Lab" };

export const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/analytics", label: "매출 분석", icon: "📈" },
  { href: "/admin/users", label: "회원 관리", icon: "👥" },
  { href: "/admin/products", label: "상품 관리", icon: "🪄" },
  { href: "/admin/orders", label: "주문 관리", icon: "📦" },
  { href: "/admin/shipping", label: "배송 관리", icon: "🚚" },
  { href: "/admin/gifts", label: "증정", icon: "🎁" },
  { href: "/admin/reviews", label: "리뷰 관리", icon: "⭐" },
  { href: "/admin/custom-orders", label: "커스텀 주문", icon: "✉️" },
  { href: "/admin/discounts", label: "할인 코드", icon: "🏷️" },
  { href: "/admin/videos", label: "영상 관리", icon: "🎬" },
  { href: "/admin/unlock-codes", label: "잠금 해제 코드", icon: "🔑" },
  { href: "/admin/announcements", label: "공지 관리", icon: "📢" },
  { href: "/admin/newsletter", label: "뉴스레터", icon: "📧" },
  { href: "/admin/referrals", label: "레퍼럴", icon: "🔗" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/en/sign-in?redirect=/admin");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) redirect("/en");

  return (
    <div className="flex min-h-screen" style={{ background: "#0D0D1A" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r"
        style={{ background: "#13131F", borderColor: "#2D2D4E" }}
      >
        <div className="p-6 border-b" style={{ borderColor: "#2D2D4E" }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>
            어드민 패널
          </p>
          <p className="font-semibold" style={{ color: "#A855F7" }}>
            Mystic Lab
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: "#9CA3AF" }}>
            {user.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:text-white"
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
            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "#9CA3AF" }}
          >
            ← 스토어로 돌아가기
          </Link>
        </div>
      </aside>

      {/* Mobile layout */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top nav */}
        <AdminMobileNav email={user.email ?? ""} />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
