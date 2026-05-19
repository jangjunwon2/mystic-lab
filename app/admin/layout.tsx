import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin — Mystic Lab" };

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🪄" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: "✉️" },
  { href: "/admin/videos", label: "Videos", icon: "🎬" },
  { href: "/admin/unlock-codes", label: "Unlock Codes", icon: "🔑" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/en/sign-in?redirect=/admin");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "admin") redirect("/en");

  return (
    <div className="flex min-h-screen" style={{ background: "#0D0D1A" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r"
        style={{ background: "#13131F", borderColor: "#2D2D4E" }}
      >
        <div className="p-6 border-b" style={{ borderColor: "#2D2D4E" }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>
            Admin Panel
          </p>
          <p className="font-semibold" style={{ color: "#A855F7" }}>
            Mystic Lab
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: "#9CA3AF" }}>
            {(profile as { display_name?: string | null } | null)?.display_name ?? user.email}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
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
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
