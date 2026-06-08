"use client";

import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  productId: string;
  hasPurchased: boolean;
}

export default function ReviewForm({ productId, hasPurchased }: Props) {
  const t = useTranslations("products.reviewForm");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!hasPurchased) return null;

  if (submitted) {
    return (
      <div
        className="rounded-xl border p-4 mb-6 flex items-center gap-2 text-sm"
        style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", color: "#10B981" }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        {t("success")}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!rating) {
      setError(t("ratingRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, rating, comment }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("failed"));
    }
  };

  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{ background: "#13131F", borderColor: "rgba(124,58,237,0.3)" }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: "#F0E6FF" }}>
        {t("title")}
      </p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="w-6 h-6"
              style={{
                color: i <= (hover || rating) ? "#F59E0B" : "#374151",
                fill: i <= (hover || rating) ? "#F59E0B" : "none",
              }}
            />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        placeholder={t("placeholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
        style={{ background: "#1A1A2E", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
      />
      {error && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting || !rating}
        className="mt-3 px-5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </div>
  );
}
