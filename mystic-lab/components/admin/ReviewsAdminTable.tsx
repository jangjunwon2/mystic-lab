"use client";

import { useState } from "react";
import { Star, CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface Product {
  slug: string;
  product_translations: { name: string; language: string }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_reported: boolean;
  created_at: string;
  user_id: string;
  products: Product | null;
  profiles: { display_name: string | null } | null;
}

interface Props {
  reviews: Review[];
}

export default function ReviewsAdminTable({ reviews: initial }: Props) {
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "reported">("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    if (filter === "reported") return r.is_reported;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const reportedCount = reviews.filter((r) => r.is_reported).length;

  async function dismissReport(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_reported: false }),
    });
    if (res.ok) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_reported: false } : r)));
    }
    setLoadingId(null);
  }

  async function toggleApprove(review: Review) {
    setLoadingId(review.id);
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: !review.is_approved }),
    });
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, is_approved: !r.is_approved } : r))
      );
    }
    setLoadingId(null);
  }

  async function deleteReview(id: string) {
    if (!window.confirm("Delete this review permanently?")) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
    setLoadingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["pending", "approved", "reported", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: filter === f ? "#7C3AED" : "#1A1A2E",
              color: filter === f ? "#fff" : "#9CA3AF",
              border: "1px solid",
              borderColor: filter === f ? "#7C3AED" : "#2D2D4E",
            }}
          >
            {f === "pending"
              ? `Pending (${pendingCount})`
              : f === "reported"
              ? `Reported (${reportedCount})`
              : f === "approved"
              ? "Approved"
              : `All (${reviews.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
            <p style={{ color: "#9CA3AF" }}>No reviews found.</p>
          </div>
        ) : (
          filtered.map((r) => {
            const productName =
              r.products?.product_translations.find((t) => t.language === "en")?.name ??
              r.products?.slug ??
              "Unknown product";
            const isLoading = loadingId === r.id;
            return (
              <div
                key={r.id}
                className="rounded-xl border p-5 transition-opacity"
                style={{
                  background: "#1A1A2E",
                  borderColor: r.is_approved ? "#2D2D4E" : "rgba(245,158,11,0.3)",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "#F0E6FF" }}>
                        {r.profiles?.display_name ?? "Anonymous"}
                      </span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>on</span>
                      <span className="text-sm font-medium" style={{ color: "#A855F7" }}>
                        {productName}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          r.is_approved
                            ? { background: "rgba(16,185,129,0.12)", color: "#10B981" }
                            : { background: "rgba(245,158,11,0.12)", color: "#F59E0B" }
                        }
                      >
                        {r.is_approved ? "Approved" : "Pending"}
                      </span>
                      {r.is_reported && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                        >
                          🚩 Reported
                        </span>
                      )}
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5"
                          style={{ color: i < r.rating ? "#F59E0B" : "#2D2D4E" }}
                          fill={i < r.rating ? "#F59E0B" : "none"}
                        />
                      ))}
                    </div>
                    {/* Comment */}
                    {r.comment && (
                      <p className="text-sm" style={{ color: "#9CA3AF" }}>{r.comment}</p>
                    )}
                    <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {r.is_reported && (
                      <button
                        onClick={() => dismissReport(r.id)}
                        disabled={isLoading}
                        title="Dismiss Report"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Dismiss Report
                      </button>
                    )}
                    <button
                      onClick={() => toggleApprove(r)}
                      disabled={isLoading}
                      title={r.is_approved ? "Unapprove" : "Approve"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={
                        r.is_approved
                          ? { background: "rgba(245,158,11,0.12)", color: "#F59E0B" }
                          : { background: "rgba(16,185,129,0.12)", color: "#10B981" }
                      }
                    >
                      {r.is_approved ? (
                        <><XCircle className="w-3.5 h-3.5" /> Unapprove</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Approve</>
                      )}
                    </button>
                    <button
                      onClick={() => deleteReview(r.id)}
                      disabled={isLoading}
                      title="Delete"
                      className="p-1.5 rounded transition-colors hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
