"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, User, Menu, X, Sparkles, Search } from "lucide-react";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "中文" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
];

export default function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // 페이지 이동 시 모바일 메뉴·검색창을 자동으로 닫아 새 페이지가 온전히 보이게 한다
  useEffect(() => {
    setIsMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch() {
    const q = searchQuery.trim();
    if (!q) { setSearchOpen(false); return; }
    router.push(`/${locale}/products?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
    setIsMobileOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const readCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
        const total = cart.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
        setCartCount(total);
      } catch { /* ignore */ }
    };
    readCart();
    window.addEventListener("storage", readCart);
    return () => window.removeEventListener("storage", readCart);
  }, []);

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/products`, label: t("products") },
    { href: `/${locale}/custom-order`, label: t("customOrder") },
  ];

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    window.location.href = segments.join("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0D0D1A]/95 backdrop-blur-md border-b border-[#2D2D4E] shadow-lg shadow-purple-900/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <Sparkles className="w-6 h-6 text-purple-400 group-hover:text-gold transition-colors" style={{ color: "inherit" }} />
            <span
              className="font-display text-xl font-bold tracking-widest text-[#F0E6FF] group-hover:text-[#A855F7] transition-colors"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              MYSTIC LAB
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide text-[#9CA3AF] hover:text-[#A855F7] transition-colors uppercase"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <div className="flex items-center gap-2 bg-[#1A1A2E] border border-[#7C3AED]/60 rounded-lg px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); if (e.key === "Escape") setSearchOpen(false); }}
                    onBlur={() => { if (!searchQuery.trim()) setSearchOpen(false); }}
                    placeholder="Search..."
                    className="w-40 bg-transparent text-xs text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-[#9CA3AF] hover:text-[#A855F7] transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Language Selector */}
            <select
              value={locale}
              onChange={(e) => switchLocale(e.target.value)}
              className="bg-transparent border border-[#2D2D4E] text-[#9CA3AF] text-xs px-2 py-1 rounded cursor-pointer hover:border-[#7C3AED] focus:outline-none focus:border-[#7C3AED] transition-colors"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#1A1A2E]">
                  {l.label}
                </option>
              ))}
            </select>

            {/* Cart */}
            <Link
              href={`/${locale}/cart`}
              className="relative p-2 text-[#9CA3AF] hover:text-[#A855F7] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7C3AED] text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href={`/${locale}/account`}
              className="p-2 text-[#9CA3AF] hover:text-[#A855F7] transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Admin Button */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
              >
                <span>⚙</span> Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 text-[#9CA3AF] hover:text-[#A855F7] transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="lg:hidden bg-[#0D0D1A]/98 backdrop-blur-md border-b border-[#2D2D4E]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="block text-sm font-medium text-[#9CA3AF] hover:text-[#A855F7] transition-colors py-2 uppercase tracking-wide"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-[#2D2D4E]">
              <Link href={`/${locale}/cart`} className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#A855F7]">
                <ShoppingCart className="w-4 h-4" />
                {t("cart")}
              </Link>
              <Link href={`/${locale}/account`} className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#A855F7]">
                <User className="w-4 h-4" />
                {t("account")}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
                >
                  ⚙ Admin
                </Link>
              )}
            </div>
            <select
              value={locale}
              onChange={(e) => switchLocale(e.target.value)}
              className="w-full bg-[#1A1A2E] border border-[#2D2D4E] text-[#9CA3AF] text-xs px-3 py-2 rounded mt-2 focus:outline-none"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            {/* Mobile Search */}
            <div className="flex items-center gap-2 bg-[#1A1A2E] border border-[#2D2D4E] rounded-lg px-3 py-2 mt-2 focus-within:border-[#7C3AED] transition-colors">
              <Search className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-xs text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
