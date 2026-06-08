"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface RestockAlertProps {
  productId: string;
  userEmail: string | null;
}

export default function RestockAlert({ productId, userEmail }: RestockAlertProps) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/restock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubscribed(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      await fetch("/api/restock-alert", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }

  if (subscribed) {
    return (
      <div className="mt-4 flex items-center gap-3 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3">
        <Bell className="w-4 h-4 text-[#A855F7] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[#F0E6FF] text-sm font-medium">You&apos;ll be notified when this item is back.</p>
          <p className="text-[#6B7280] text-xs truncate">{email}</p>
        </div>
        <button
          onClick={unsubscribe}
          disabled={loading}
          className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors flex-shrink-0"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellOff className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-[#13131F] border border-[#2D2D4E] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-[#9CA3AF]" />
        <p className="text-[#9CA3AF] text-sm">Notify me when back in stock</p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-[#0D0D1A] border border-[#2D2D4E] rounded-lg px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
        />
        <button
          onClick={subscribe}
          disabled={loading}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Notify Me
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
