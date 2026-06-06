"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Play, Heart, LogOut, ChevronRight, Pencil, Check, X, Star, MessageSquare, ExternalLink, MapPin, Trash2, BookmarkCheck, Plus, ChevronDown, Coins, Ticket } from "lucide-react";
import { COUNTRIES } from "@/lib/constants/countries";
import { createClient } from "@/lib/supabase/client";
import MagicMemberAccess from "@/components/products/MagicMemberAccess";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  shipped: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  refunded: "bg-red-500/15 text-red-400 border-red-500/30",
};

// 주문 상태 다국어 라벨 (7개 언어)
const STATUS_LABELS: Record<string, Record<string, string>> = {
  pending: { ko: "결제 대기", en: "Pending Payment", ja: "支払い待ち", "zh-CN": "待付款", es: "Pago pendiente", fr: "Paiement en attente", de: "Zahlung ausstehend" },
  paid: { ko: "결제 완료", en: "Paid", ja: "支払い完了", "zh-CN": "已付款", es: "Pagado", fr: "Payé", de: "Bezahlt" },
  shipped: { ko: "배송 중", en: "Shipping", ja: "配送中", "zh-CN": "配送中", es: "En envío", fr: "En cours de livraison", de: "Versand" },
  completed: { ko: "배송 완료", en: "Delivered", ja: "配達完了", "zh-CN": "已送达", es: "Entregado", fr: "Livré", de: "Geliefert" },
  refunded: { ko: "환불", en: "Refunded", ja: "返金済み", "zh-CN": "已退款", es: "Reembolsado", fr: "Remboursé", de: "Erstattet" },
};

function statusLabel(status: string, locale: string): string {
  return STATUS_LABELS[status]?.[locale] ?? STATUS_LABELS[status]?.en ?? status;
}

interface Order {
  id: string;
  status: string;
  total_usd: number;
  created_at: string;
  customer_email: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipping_address: Record<string, string> | null;
  shipping_method: string | null;
  stripe_payment_intent_id: string | null;
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

interface WishlistItem {
  id: string;
  product_id: string;
  products: {
    id: string;
    slug: string;
    thumbnail_url: string | null;
    price_usd: number;
    product_translations: { name: string; language: string }[];
  } | null;
}

interface SavedAddress {
  id: string;
  name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string | null;
  postal: string | null;
  country: string;
  is_default: boolean;
}

interface PointTx {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  name: string | null;
  type: "percent" | "fixed";
  value: number;
  source: string | null;
  min_order_usd: number;
  expires_at: string | null;
  created_at: string;
}

interface CustomOrderRow {
  id: string;
  description: string;
  budget_range: string;
  desired_deadline: string | null;
  quoted_price_usd: number | null;
  quoted_price_krw: number | null;
  payment_status: string;
  status: string;
  created_at: string;
  admin_message: string | null;
}

interface Props {
  locale: string;
  profile: { display_name: string | null; avatar_url: string | null; role: string } | null;
  orders: unknown[];
  customOrders?: unknown[];
  wishlist: WishlistItem[];
}

export default function AccountClient({ locale, profile, orders, customOrders = [], wishlist }: Props) {
  const t = useTranslations("account");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "tutorials" | "wishlist" | "addresses" | "points" | "coupons">("orders");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(wishlist);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const [points, setPoints] = useState<{ balance: number; history: PointTx[] } | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [claimable, setClaimable] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ name: "", phone: "", line1: "", line2: "", city: "", postal: "", country: "" });
  const [signingOut, setSigningOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.display_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [currentName, setCurrentName] = useState(profile?.display_name ?? "");

  const typedOrders = orders as Order[];
  const typedCustomOrders = customOrders as CustomOrderRow[];
  const purchasedOrders = typedOrders.filter((o) =>
    ["paid", "shipped", "completed"].includes(o.status)
  );

  // 해법 영상 — 동일 상품은 중복 구매여도 1개만 노출
  type TutorialProduct = NonNullable<Order["order_items"][number]["products"]>;
  const dedupedTutorials: TutorialProduct[] = (() => {
    const map = new Map<string, TutorialProduct>();
    for (const order of purchasedOrders) {
      for (const item of order.order_items) {
        if (item.products && !map.has(item.products.id)) {
          map.set(item.products.id, item.products);
        }
      }
    }
    return [...map.values()];
  })();

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("ml_cart");
    window.dispatchEvent(new Event("storage"));
    router.push(`/${locale}`);
    router.refresh();
  };


  async function saveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: nameInput.trim() }),
    });
    if (res.ok) {
      setCurrentName(nameInput.trim());
      setEditingName(false);
    }
    setSavingName(false);
  }

  const displayName = currentName || t("member");
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
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-[#1A1A2E] border border-[#7C3AED]/50 rounded-lg px-3 py-1 text-[#F0E6FF] text-base font-bold focus:outline-none focus:border-[#7C3AED]"
                    style={{ fontFamily: "var(--font-cinzel), serif" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    autoFocus
                    maxLength={50}
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="p-1 text-[#10B981] hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-1 text-[#6B7280] hover:opacity-80 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1
                    className="text-xl font-bold text-[#F0E6FF]"
                    style={{ fontFamily: "var(--font-cinzel), serif" }}
                  >
                    {displayName}
                  </h1>
                  <button
                    onClick={() => { setNameInput(currentName); setEditingName(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#6B7280] hover:text-[#A855F7]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
            {t("signOut")}
          </button>
        </motion.div>

        {/* Admin link */}
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl px-4 py-3 mb-6 hover:bg-[#F59E0B]/15 transition-colors"
          >
            <span className="text-sm font-medium text-[#F59E0B]">{t("adminDashboard")}</span>
            <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
          </Link>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1A2E] rounded-xl p-1 border border-[#2D2D4E] mb-6 w-fit flex-wrap">
          {(["orders", "tutorials", "wishlist", "addresses", "points", "coupons"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "addresses" && addresses === null) {
                  setAddrLoading(true);
                  fetch("/api/shipping-addresses")
                    .then((r) => r.json())
                    .then((data: SavedAddress[]) => setAddresses(Array.isArray(data) ? data : []))
                    .catch(() => setAddresses([]))
                    .finally(() => setAddrLoading(false));
                }
                if (tab === "points" && points === null) {
                  setPointsLoading(true);
                  fetch("/api/account/points")
                    .then((r) => r.json())
                    .then((d) => setPoints({ balance: d.balance ?? 0, history: d.history ?? [] }))
                    .catch(() => setPoints({ balance: 0, history: [] }))
                    .finally(() => setPointsLoading(false));
                }
                if (tab === "coupons" && coupons === null) {
                  setCouponsLoading(true);
                  fetch("/api/account/coupons")
                    .then((r) => r.json())
                    .then((d) => { setCoupons(Array.isArray(d.coupons) ? d.coupons : []); setClaimable(Array.isArray(d.claimable) ? d.claimable : []); })
                    .catch(() => setCoupons([]))
                    .finally(() => setCouponsLoading(false));
                }
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#7C3AED] text-white"
                  : "text-[#9CA3AF] hover:text-[#F0E6FF]"
              }`}
            >
              {tab === "orders" ? <Package className="w-3.5 h-3.5" />
                : tab === "tutorials" ? <Play className="w-3.5 h-3.5" />
                : tab === "wishlist" ? <Heart className="w-3.5 h-3.5" />
                : tab === "addresses" ? <MapPin className="w-3.5 h-3.5" />
                : tab === "points" ? <Coins className="w-3.5 h-3.5" />
                : <Ticket className="w-3.5 h-3.5" />}
              {tab === "points"
                ? t("pointsTab")
                : tab === "coupons"
                ? t("couponsTab")
                : t(tab)}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {typedOrders.length === 0 && typedCustomOrders.length === 0 ? (
              <div className="text-center py-16 text-[#9CA3AF]">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t("noOrders")}</p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-block mt-4 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  {t("browseProducts")}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {typedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} locale={locale} />
                ))}
                {typedCustomOrders.length > 0 && (
                  <>
                    {typedOrders.length > 0 && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 h-px" style={{ background: "#2D2D4E" }} />
                        <span className="text-xs font-medium px-2" style={{ color: "#6B7280" }}>커스텀 주문</span>
                        <div className="flex-1 h-px" style={{ background: "#2D2D4E" }} />
                      </div>
                    )}
                    {typedCustomOrders.map((co) => (
                      <CustomOrderCard key={co.id} co={co} />
                    ))}
                  </>
                )}
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
                <p className="text-sm">{t("noTutorials")}</p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-block mt-4 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  {t("browseProducts")}
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-[#2D2D4E] overflow-hidden divide-y divide-[#2D2D4E]">
                {dedupedTutorials.map((prod) => (
                  <TutorialRow key={prod.id} product={prod} locale={locale} t={t} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {wishlistItems.length === 0 ? (
              <div className="text-center py-16 text-[#9CA3AF]">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t("noWishlist")}</p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-block mt-4 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  {t("browseProducts")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.map((item) => {
                  if (!item.products) return null;
                  const prod = item.products;
                  const name =
                    prod.product_translations.find((tr) => tr.language === locale)?.name ??
                    prod.product_translations.find((tr) => tr.language === "en")?.name ??
                    prod.product_translations[0]?.name ??
                    prod.slug;
                  return (
                    <div key={item.id} className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] overflow-hidden hover:border-[#7C3AED]/60 transition-colors">
                      <Link href={`/${locale}/products/${prod.slug}`}>
                        <div className="aspect-[4/3] bg-[#13131F]">
                          {prod.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={prod.thumbnail_url} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-semibold text-[#F0E6FF] mb-1 line-clamp-1">{name}</p>
                          <p className="text-[#F59E0B] font-bold text-sm">${prod.price_usd}</p>
                        </div>
                      </Link>
                      <div className="px-4 pb-4">
                        <button
                          onClick={async () => {
                            await fetch("/api/wishlist", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ product_id: prod.id }),
                            });
                            setWishlistItems((prev) => prev.filter((w) => w.id !== item.id));
                          }}
                          className="w-full flex items-center justify-center gap-1.5 text-xs text-[#EF4444] hover:text-red-300 border border-[#EF4444]/30 hover:border-[#EF4444]/60 rounded-lg py-1.5 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 fill-[#EF4444]" />
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {addrLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {(addresses ?? []).length === 0 && !showNewAddrForm && (
                  <div className="text-center py-16 text-[#9CA3AF]">
                    <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{t("noSavedAddresses")}</p>
                  </div>
                )}

                {(addresses ?? []).map((addr) => (
                  <div key={addr.id} className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#F0E6FF]">{addr.name}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-[#7C3AED]/20 text-[#A855F7] px-1.5 py-0.5 rounded-full border border-[#7C3AED]/30">{t("defaultBadge")}</span>
                        )}
                      </div>
                      {addr.phone && <p className="text-xs text-[#9CA3AF]">{addr.phone}</p>}
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{addr.line1}{addr.line2 ? ` ${addr.line2}` : ""}</p>
                      <p className="text-xs text-[#9CA3AF]">{addr.city ? `${addr.city} ` : ""}{addr.postal ?? ""} · {COUNTRIES.find((c) => c.code === addr.country)?.name ?? addr.country}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!addr.is_default && (
                        <button
                          title={t("setDefault")}
                          onClick={async () => {
                            await fetch(`/api/shipping-addresses/${addr.id}`, { method: "PATCH" });
                            setAddresses((prev) => prev?.map((a) => ({ ...a, is_default: a.id === addr.id })) ?? null);
                          }}
                          className="p-1.5 text-[#6B7280] hover:text-[#A855F7] transition-colors"
                        >
                          <BookmarkCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        title={t("deleteLabel")}
                        onClick={async () => {
                          await fetch(`/api/shipping-addresses/${addr.id}`, { method: "DELETE" });
                          setAddresses((prev) => prev?.filter((a) => a.id !== addr.id) ?? null);
                        }}
                        className="p-1.5 text-[#6B7280] hover:text-[#EF4444] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new address */}
                <button
                  onClick={() => setShowNewAddrForm(!showNewAddrForm)}
                  className="flex items-center gap-2 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  {showNewAddrForm ? <ChevronDown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showNewAddrForm ? t("close") : t("addNewAddress")}
                </button>

                {showNewAddrForm && (
                  <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "name", placeholder: t("afName"), span: 2 },
                        { key: "phone", placeholder: t("afPhone"), span: 2 },
                        { key: "line1", placeholder: t("afLine1"), span: 2 },
                        { key: "line2", placeholder: t("afLine2"), span: 2 },
                        { key: "city", placeholder: t("afCity"), span: 1 },
                        { key: "postal", placeholder: t("afPostal"), span: 1 },
                      ].map(({ key, placeholder, span }) => (
                        <input
                          key={key}
                          placeholder={placeholder}
                          value={newAddr[key as keyof typeof newAddr]}
                          onChange={(e) => setNewAddr((p) => ({ ...p, [key]: e.target.value }))}
                          className={`${span === 2 ? "col-span-2" : ""} bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#7C3AED]/60`}
                        />
                      ))}
                      <select
                        value={newAddr.country}
                        onChange={(e) => setNewAddr((p) => ({ ...p, country: e.target.value }))}
                        className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] focus:outline-none focus:border-[#7C3AED]/60"
                      >
                        <option value="">{t("afCountry")}</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        if (!newAddr.name.trim() || !newAddr.line1.trim() || !newAddr.country) return;
                        const res = await fetch("/api/shipping-addresses", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...newAddr, set_default: (addresses ?? []).length === 0 }),
                        });
                        if (res.ok) {
                          const created: SavedAddress = await res.json();
                          setAddresses((prev) => {
                            const base = prev ?? [];
                            if (created.is_default) return [created, ...base.map((a) => ({ ...a, is_default: false }))];
                            return [...base, created];
                          });
                          setNewAddr({ name: "", phone: "", line1: "", line2: "", city: "", postal: "", country: "" });
                          setShowNewAddrForm(false);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {t("save")}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Points Tab */}
        {activeTab === "points" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {pointsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* 잔액 카드 */}
                <div className="bg-gradient-to-br from-[#7C3AED]/20 to-[#1A1A2E] rounded-xl border border-[#7C3AED]/40 p-6">
                  <p className="text-xs text-[#9CA3AF] mb-1">{t("pointsBalanceLabel")}</p>
                  <p className="text-3xl font-bold text-[#F0E6FF]">
                    {(points?.balance ?? 0).toLocaleString()} <span className="text-lg text-[#A855F7]">P</span>
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">≈ ${((points?.balance ?? 0) / 100).toFixed(2)} · 100P = $1</p>
                </div>

                {/* 내역 */}
                {(points?.history.length ?? 0) === 0 ? (
                  <div className="text-center py-12 text-[#9CA3AF]">
                    <Coins className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{t("noPointHistory")}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#2D2D4E] overflow-hidden divide-y divide-[#2D2D4E]">
                    {points!.history.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between bg-[#1A1A2E] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm text-[#F0E6FF] truncate">{tx.note ?? tx.type}</p>
                          <p className="text-[11px] text-[#6B7280]">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-semibold shrink-0" style={{ color: tx.amount >= 0 ? "#10B981" : "#EF4444" }}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()} P
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {couponsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            ) : (coupons ?? []).length === 0 && claimable.length === 0 ? (
              <div className="text-center py-16 text-[#9CA3AF]">
                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t("noCoupons")}</p>
              </div>
            ) : (
              <>
                {/* 발급 가능한 공개 쿠폰 → 전용 발급 페이지로 이동 */}
                {claimable.length > 0 && (
                  <Link href={`/${locale}/coupons`}
                    className="flex items-center justify-between bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl px-4 py-3 hover:bg-[#7C3AED]/15 transition-colors">
                    <span className="text-sm font-medium text-[#A855F7]">{t("claimableCoupons")} · {claimable.length}</span>
                    <span className="text-sm text-[#A855F7]">{t("viewClaimPage")} →</span>
                  </Link>
                )}

                {/* 내 쿠폰 */}
                {(coupons ?? []).length > 0 && (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(coupons ?? []).map((c) => (
                        <div key={c.id} className="bg-gradient-to-br from-[#7C3AED]/15 to-[#1A1A2E] rounded-xl border border-[#7C3AED]/40 p-5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            {c.name && <p className="text-sm font-semibold text-[#F0E6FF] mb-1 line-clamp-1">{c.name}</p>}
                            <p className="text-2xl font-bold text-[#F0E6FF] leading-none mb-2">
                              {c.type === "fixed" ? `$${c.value}` : `${c.value}%`}
                              <span className="text-sm font-medium text-[#A855F7] ml-1.5">OFF</span>
                            </p>
                            <p className="font-mono text-sm font-semibold text-[#F59E0B] tracking-wider">{c.code}</p>
                            <p className="text-[11px] text-[#6B7280] mt-1.5">
                              {c.min_order_usd > 0 ? `${t("couponMinOrder")} $${c.min_order_usd} · ` : ""}
                              {c.expires_at
                                ? `${t("couponExpires")} ${new Date(c.expires_at).toLocaleDateString(locale)}`
                                : t("couponNoExpiry")}
                            </p>
                          </div>
                          <Ticket className="w-8 h-8 text-[#7C3AED]/50 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* 계정 탈퇴 */}
      <WithdrawSection locale={locale} />
    </div>
  );
}

function WithdrawSection({ locale }: { locale: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  // 현재 로그인 이메일 조회
  const [myEmail, setMyEmail] = useState<string | null>(null);
  useState(() => { supabase.auth.getUser().then(({ data }) => setMyEmail(data.user?.email ?? null)); });

  const LABELS: Record<string, { title: string; warn: string; confirm: string; placeholder: string; btn: string; cancel: string }> = {
    ko: { title: "계정 탈퇴", warn: "탈퇴 시 주문 내역, 포인트, 쿠폰 등 모든 데이터가 삭제되며 복구할 수 없습니다. 이메일 주소를 입력해 확인하세요.", confirm: "탈퇴하기", placeholder: "이메일 주소 입력", btn: "계정 탈퇴", cancel: "취소" },
    en: { title: "Delete Account", warn: "All your data (orders, points, coupons) will be permanently deleted. Enter your email address to confirm.", confirm: "Delete my account", placeholder: "Enter email address", btn: "Delete Account", cancel: "Cancel" },
    ja: { title: "アカウント削除", warn: "全データ（注文・ポイント・クーポン）が完全に削除されます。メールアドレスを入力して確認してください。", confirm: "削除する", placeholder: "メールアドレス", btn: "アカウント削除", cancel: "キャンセル" },
    "zh-CN": { title: "注销账户", warn: "所有数据（订单、积分、优惠券）将被永久删除且无法恢复。请输入您的邮箱地址进行确认。", confirm: "确认注销", placeholder: "输入邮箱地址", btn: "注销账户", cancel: "取消" },
    es: { title: "Eliminar cuenta", warn: "Todos tus datos (pedidos, puntos, cupones) se eliminarán permanentemente. Introduce tu correo electrónico para confirmar.", confirm: "Eliminar mi cuenta", placeholder: "Introduce tu email", btn: "Eliminar cuenta", cancel: "Cancelar" },
    fr: { title: "Supprimer le compte", warn: "Toutes vos données (commandes, points, coupons) seront définitivement supprimées. Entrez votre adresse e-mail pour confirmer.", confirm: "Supprimer mon compte", placeholder: "Entrez votre email", btn: "Supprimer le compte", cancel: "Annuler" },
    de: { title: "Konto löschen", warn: "Alle Daten (Bestellungen, Punkte, Coupons) werden dauerhaft gelöscht. Geben Sie Ihre E-Mail-Adresse zur Bestätigung ein.", confirm: "Konto löschen", placeholder: "E-Mail-Adresse eingeben", btn: "Konto löschen", cancel: "Abbrechen" },
  };
  const l = LABELS[locale] ?? LABELS.en;

  async function withdraw() {
    if (emailInput.trim() !== myEmail) return;
    setBusy(true);
    const res = await fetch("/api/account/me", { method: "DELETE" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push(`/${locale}`);
    } else {
      const d = await res.json();
      alert(d.error ?? "탈퇴에 실패했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 pt-8" style={{ borderTop: "1px solid #2D2D4E" }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs transition-colors hover:opacity-80"
          style={{ color: "#4B5563" }}
        >
          {l.btn}
        </button>
      ) : (
        <div className="rounded-xl border p-5 max-w-md" style={{ background: "#1A1A2E", borderColor: "rgba(239,68,68,0.4)" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#EF4444" }}>{l.title}</h3>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>{l.warn}</p>
          <input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={l.placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 mb-3"
            style={{ background: "#13131F", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
          />
          <div className="flex gap-2">
            <button
              onClick={withdraw}
              disabled={busy || emailInput.trim() !== myEmail}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {busy ? "…" : l.confirm}
            </button>
            <button
              onClick={() => { setOpen(false); setEmailInput(""); }}
              className="px-4 py-2 rounded-lg text-sm hover:opacity-80"
              style={{ background: "#2D2D4E", color: "#9CA3AF" }}
            >
              {l.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const CARRIER_URLS: Record<string, string> = {
  "CJ대한통운": "https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=",
  "한진택배":   "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KOR&wblnumList=",
  "롯데택배":   "https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=",
  "우체국":     "https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=",
  "로젠":       "https://www.ilogen.com/iLogen/general/tTrace.jsp?slipno=",
  DHL:          "https://www.dhl.com/global-en/home/tracking.html?tracking-id=",
  FedEx:        "https://www.fedex.com/fedextrack/?trknbr=",
  UPS:          "https://www.ups.com/track?tracknum=",
  EMS:          "https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=",
};

function OrderCard({ order, locale }: { order: Order; locale: string }) {
  const t = useTranslations("account");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [showAddress, setShowAddress] = useState(false);

  const date = new Date(order.created_at).toLocaleDateString(locale, {
    year: "numeric", month: "short", day: "numeric",
  });
  // 리뷰는 배송완료(completed) 주문만 작성 가능
  const eligible = order.status === "completed";
  const trackingUrl = order.tracking_carrier && order.tracking_number
    ? (CARRIER_URLS[order.tracking_carrier] ?? null)
    : null;
  // 웹앱 상품(계산기·인스타) 구매 항목 — 인증 코드/웹앱 열기 표시용. 중복 상품은 1개만.
  const APP_SLUGS = ["magic-calculator", "fake-instagram"];
  const appItems = order.order_items
    .filter((i) => i.products && APP_SLUGS.includes(i.products.slug))
    .filter((i, idx, arr) => arr.findIndex((x) => x.products?.id === i.products?.id) === idx);

  return (
    <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[#6B7280] mb-0.5">{t("orderLabel")} #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-[#6B7280]">{date}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border tracking-wide ${STATUS_COLORS[order.status] ?? ""}`}>
            {statusLabel(order.status, locale)}
          </span>
          <span className="text-sm font-semibold text-[#F59E0B]">
            ${order.total_usd.toFixed(2)}
          </span>
          <Link
            href={`/${locale}/orders/${order.id}`}
            className="flex items-center gap-1 text-[11px] font-medium text-[#A855F7] hover:text-[#C084FC] border border-[#7C3AED]/40 hover:border-[#A855F7]/60 rounded-full px-2.5 py-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {t("orderDetails")}
          </Link>
        </div>
      </div>

      {/* Tracking info */}
      {order.tracking_number && (
        <div className="mb-3 bg-[#13131F] rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-[#6B7280] mb-0.5 uppercase tracking-wide">{t("trackingLabel")}</p>
            <p className="text-xs font-mono text-[#F59E0B]">{order.tracking_number}
              {order.tracking_carrier && <span className="text-[#9CA3AF] ml-1">· {order.tracking_carrier}</span>}
            </p>
          </div>
          {trackingUrl && (
            <a href={`${trackingUrl}${order.tracking_number}`} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-[#7C3AED] hover:text-[#A855F7] border border-[#7C3AED]/40 rounded-full px-2 py-0.5 shrink-0 transition-colors">
              {t("trackBtn")}
            </a>
          )}
        </div>
      )}

      {/* Shipping address toggle */}
      {order.shipping_address && (
        <button onClick={() => setShowAddress(!showAddress)}
          className="text-[10px] text-[#6B7280] hover:text-[#9CA3AF] transition-colors mb-2 flex items-center gap-1">
          {t("addressToggle")} {showAddress ? "▲" : "▼"}
        </button>
      )}
      {showAddress && order.shipping_address && (
        <div className="mb-3 bg-[#13131F] rounded-lg px-3 py-2 text-xs text-[#9CA3AF] space-y-0.5">
          {order.shipping_address.name && <p>{order.shipping_address.name}</p>}
          {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
          {order.shipping_address.line1 && <p>{order.shipping_address.line1} {order.shipping_address.line2}</p>}
          {order.shipping_address.city && <p>{order.shipping_address.city} {order.shipping_address.postal} {order.shipping_address.country}</p>}
          {order.shipping_address.address && <p>{order.shipping_address.address}</p>}
        </div>
      )}

      <div className="space-y-3">
        {order.order_items.map((item) => {
          const name = item.products?.product_translations.find(
            (t) => t.language === locale
          )?.name ?? item.products?.product_translations[0]?.name ?? "Product";
          const productId = item.products?.id;
          const alreadyReviewed = productId ? reviewedIds.has(productId) : false;

          return (
            <div key={item.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9CA3AF]">{name} × {item.quantity}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#6B7280]">${(item.price_usd * item.quantity).toFixed(2)}</span>
                  {eligible && productId && !alreadyReviewed && reviewingId !== productId && (
                    <button
                      onClick={() => setReviewingId(productId)}
                      className="flex items-center gap-1 text-[10px] text-[#7C3AED] hover:text-[#A855F7] transition-colors border border-[#7C3AED]/40 hover:border-[#A855F7]/60 rounded-full px-2 py-0.5"
                    >
                      <MessageSquare className="w-2.5 h-2.5" />
                      {t("reviewWrite")}
                    </button>
                  )}
                  {alreadyReviewed && (
                    <span className="text-[10px] text-emerald-400">
                      {t("reviewed")}
                    </span>
                  )}
                </div>
              </div>
              {reviewingId === productId && productId && (
                <ReviewInlineForm
                  productId={productId}
                  locale={locale}
                  onDone={() => {
                    setReviewedIds((prev) => new Set([...prev, productId]));
                    setReviewingId(null);
                  }}
                  onCancel={() => setReviewingId(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 웹앱(계산기·인스타) 인증 코드 + 웹앱 열기 — 구매한 앱마다 표시 */}
      {appItems.map((i) => i.products && (
        <MagicMemberAccess key={i.products.id} productId={i.products.id} slug={i.products.slug} locale={locale} />
      ))}
    </div>
  );
}

function ReviewInlineForm({
  productId,
  locale,
  onDone,
  onCancel,
}: {
  productId: string;
  locale: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("account");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error" | "duplicate">("idle");

  const label = {
    placeholder: t("rfPlaceholder"),
    submit: t("rfSubmit"),
    cancel: t("rfCancel"),
    duplicate: t("rfDuplicate"),
    error: t("rfError"),
    success: t("rfSuccess"),
  };

  async function handleSubmit() {
    if (rating === 0) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, comment: comment.trim() || undefined }),
      });
      if (res.status === 409) { setStatus("duplicate"); return; }
      if (!res.ok) { setStatus("error"); return; }
      setStatus("done");
      setTimeout(onDone, 1500);
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
        {label.success}
      </div>
    );
  }

  return (
    <div className="mt-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl p-4 space-y-3">
      {/* Stars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                n <= (hovered || rating) ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#4B5563]"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder={label.placeholder}
        className="w-full bg-[#1A1A2E] border border-[#2D2D4E] rounded-lg px-3 py-2 text-xs text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] resize-none transition-colors"
        maxLength={500}
      />

      {/* Error messages */}
      {status === "duplicate" && (
        <p className="text-[10px] text-yellow-400">{label.duplicate}</p>
      )}
      {status === "error" && (
        <p className="text-[10px] text-red-400">{label.error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors px-3 py-1.5"
        >
          {label.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || status === "submitting"}
          className="text-xs bg-[#7C3AED] text-white px-4 py-1.5 rounded-lg hover:bg-[#6D28D9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "..." : label.submit}
        </button>
      </div>
    </div>
  );
}

function TutorialRow({
  product,
  locale,
  t,
}: {
  product: NonNullable<Order["order_items"][number]["products"]>;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const name = product.product_translations.find(
    (tr) => tr.language === locale
  )?.name ?? product.product_translations[0]?.name ?? "Product";

  return (
    <Link
      href={`/${locale}/tutorials/${product.slug}`}
      className="flex items-center gap-4 bg-[#1A1A2E] px-4 py-3 hover:bg-[#21213a] transition-colors group"
    >
      {/* 썸네일 */}
      <div className="w-20 h-12 shrink-0 bg-[#13131F] rounded-md overflow-hidden flex items-center justify-center relative">
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Play className="w-4 h-4 text-[#A855F7]" />
        )}
      </div>
      {/* 제목 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#F0E6FF] group-hover:text-[#A855F7] transition-colors truncate">
          {name}
        </p>
        <p className="text-xs text-[#7C3AED] mt-0.5">{t("watchTutorial")}</p>
      </div>
      {/* 재생 아이콘 */}
      <div className="w-8 h-8 shrink-0 rounded-full bg-[#7C3AED]/15 group-hover:bg-[#7C3AED] flex items-center justify-center transition-colors">
        <Play className="w-4 h-4 text-[#A855F7] group-hover:text-white ml-0.5 transition-colors" />
      </div>
    </Link>
  );
}

const CUSTOM_STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  in_progress: { label: "진행 중", color: "#60A5FA", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
  completed:   { label: "완료",    color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
  quoted:      { label: "견적 발송", color: "#A855F7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.3)" },
};

function CustomOrderCard({ co }: { co: CustomOrderRow }) {
  const [open, setOpen] = useState(false);
  const badge = CUSTOM_STATUS_MAP[co.status] ?? { label: co.status, color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)" };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7" }}>
              커스텀 주문
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs border" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm line-clamp-1" style={{ color: "#D1D5DB" }}>{co.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            {co.quoted_price_usd && (
              <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>${co.quoted_price_usd.toFixed(2)}</p>
            )}
            <p className="text-xs" style={{ color: "#6B7280" }}>{new Date(co.created_at).toLocaleDateString()}</p>
          </div>
          <ChevronDown
            className="w-4 h-4 transition-transform shrink-0"
            style={{ color: "#6B7280", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid #2D2D4E" }}>
          {/* 의뢰 내용 */}
          <div className="pt-4">
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>의뢰 내용</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#D1D5DB" }}>{co.description}</p>
          </div>

          {/* 예산 / 기한 */}
          <div className="flex gap-6">
            {co.budget_range && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>예산</p>
                <p className="text-sm" style={{ color: "#F0E6FF" }}>{co.budget_range}</p>
              </div>
            )}
            {co.desired_deadline && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>희망 기한</p>
                <p className="text-sm" style={{ color: "#F0E6FF" }}>{co.desired_deadline}</p>
              </div>
            )}
            {co.quoted_price_usd && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: "#6B7280" }}>결제 금액</p>
                <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>
                  ${co.quoted_price_usd.toFixed(2)}
                  {co.quoted_price_krw && ` / ₩${co.quoted_price_krw.toLocaleString()}`}
                </p>
              </div>
            )}
          </div>

          {/* 관리자 답변 */}
          {co.admin_message ? (
            <div className="rounded-xl p-4" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5" style={{ color: "#A855F7" }} />
                <p className="text-xs font-medium" style={{ color: "#A855F7" }}>관리자 답변</p>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#D1D5DB" }}>{co.admin_message}</p>
            </div>
          ) : (
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(156,163,175,0.05)", border: "1px solid rgba(156,163,175,0.1)" }}>
              <p className="text-xs" style={{ color: "#6B7280" }}>아직 답변이 없습니다. 이메일로 연락드릴 예정입니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
