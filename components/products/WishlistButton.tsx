"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface Props {
  productId: string;
  isLoggedIn: boolean;
  locale: string;
  initialWishlisted?: boolean;
  className?: string;
}

export default function WishlistButton({ productId, isLoggedIn, locale, initialWishlisted = false, className = "" }: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.wishlist)) {
          setWishlisted(d.wishlist.includes(productId));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isLoggedIn]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      window.location.href = `/${locale}/sign-in`;
      return;
    }
    if (loading) return;
    setLoading(true);
    const next = !wishlisted;
    setWishlisted(next);

    try {
      await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
    } catch {
      setWishlisted(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`transition-all duration-200 disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          wishlisted
            ? "fill-[#EF4444] stroke-[#EF4444]"
            : "stroke-[#9CA3AF] hover:stroke-[#EF4444]"
        }`}
      />
    </button>
  );
}
