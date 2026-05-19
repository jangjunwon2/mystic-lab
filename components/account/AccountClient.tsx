"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Play, LogOut, User, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  shipped: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  refunded: "bg-red-500/15 text-red-400 border-red-500/30",
};

interface Order {
  id: string;
  status: string;
  total_usd: number;
  created_at: string;
  customer_email: string;
  order_items: {
    id: string;
    quantity: number;
    price_usd: number;
    products: {
      id: string;
      slug: string;
      thumbnail_url: string | null;
      product_translations: { name: string; language: string }[];
    } | null;
  }[];
}

interface Props {
  locale: string;
  profile: { display_name: string | null; avatar_url: string | null; role: string } | null;
  orders: unknown[];
}

export default function AccountClient({ locale, profile, orders }: Props) {
  const t = useTranslations("account");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "tutorials">("orders");
  const [signingOut, setSigningOut] = useState(false);

  const typedOrders = orders as Order[];
  const purchasedOrders = typedOrders.filter((o) =>
    ["paid", "shipped", "completed"].includes(o.status)
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  const displayName = profile?.display_name ?? "Member";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#7C3AED]/25 border border-[#7C3AED]/40 flex items-center justify-center text-[#A855F7] font-bold text-lg">
              {initials}
            </div>
            <div>
              <h1
                className="text-xl font-bold text-[#F0E6FF]"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                {displayName}
              </h1>
              {profile?.role === "admin" && (
                <span className="text-[10px] text-[#F59E0B] uppercase tracking-wider font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        {/* Admin link */}
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl px-4 py-3 mb-6 hover:bg-[#F59E0B]/15 transition-colors"
          >
            <span className="text-sm font-medium text-[#F59E0B]">Admin Dashboard</span>
            <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
          </Link>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1A2E] rounded-xl p-1 border border-[#2D2D4E] mb-6 w-fit">
          {(["orders", "tutorials"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#7C3AED] text-white"
                  : "text-[#9CA3AF] hover:text-[#F0E6FF]"
              }`}
            >
              {tab === "orders" ? <Package className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {t(tab)}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {typedOrders.length === 0 ? (
              <div className="text-center py-16 text-[#9CA3AF]">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t("noOrders")}</p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-block mt-4 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {typedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} locale={locale} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tutorials Tab */}
        {activeTab === "tutorials" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {purchasedOrders.length === 0 ? (
              <div className="text-center py-16 text-[#9CA3AF]">
                <Play className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tutorials yet. Purchase a product to unlock tutorials.</p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-block mt-4 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {purchasedOrders.flatMap((order) =>
                  order.order_items
                    .filter((item) => item.products)
                    .map((item) => (
                      <TutorialCard key={item.id} item={item} locale={locale} t={t} />
                    ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, locale }: { order: Order; locale: string }) {
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[#6B7280] mb-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-[#6B7280]">{date}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide ${STATUS_COLORS[order.status] ?? ""}`}>
            {order.status}
          </span>
          <span className="text-sm font-semibold text-[#F59E0B]">
            ${order.total_usd.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {order.order_items.map((item) => {
          const name = item.products?.product_translations.find(
            (t) => t.language === locale
          )?.name ?? item.products?.product_translations[0]?.name ?? "Product";
          return (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-[#9CA3AF]">
                {name} × {item.quantity}
              </span>
              <span className="text-[#6B7280]">${(item.price_usd * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TutorialCard({
  item,
  locale,
  t,
}: {
  item: Order["order_items"][0];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const name = item.products?.product_translations.find(
    (tr) => tr.language === locale
  )?.name ?? item.products?.product_translations[0]?.name ?? "Product";
  const slug = item.products?.slug;

  return (
    <Link
      href={slug ? `/${locale}/products/${slug}` : "#"}
      className="block bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-4 hover:border-[#7C3AED]/60 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all duration-300 group"
    >
      <div className="aspect-video bg-[#13131F] rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
        {item.products?.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.products.thumbnail_url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#7C3AED]/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-[#A855F7]" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-[#F0E6FF] group-hover:text-[#A855F7] transition-colors line-clamp-1">
        {name}
      </p>
      <p className="text-xs text-[#7C3AED] mt-1">{t("watchTutorial")}</p>
    </Link>
  );
}
