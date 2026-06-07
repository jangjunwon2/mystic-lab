"use client";

import { useState } from "react";
import { Star, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";

interface Product {
  slug: string;
  product_translations: { name: string; language: string }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
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
  // 게시-후-관리: 작성 즉시 게시되며 어드민은 미노출/게시/삭제로 사후 관리
  const [filter, setFilter] = useState<"all" | "hidden" | "visible">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { confirmState, showConfirm, handleConfirmYes, handleConfirmNo } = useAdminDialogs();

  const filtered = reviews.filter((r) => {
    if (filter === "hidden") return !r.is_approved;
    if (filter === "visible") return r.is_approved;
    return true;
  });

  const hiddenCount = reviews.filter((r) => !r.is_approved).length;

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
    const ok = await showConfirm({
      title: "리뷰 삭제",
      message: "이 리뷰를 영구 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
    setLoadingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "visible", "hidden"] as const).map((f) => (
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
            {f === "hidden"
              ? `미노출 (${hiddenCount})`
              : f === "visible"
              ? "게시 중"
              : `전체 (${reviews.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
            <p style={{ color: "#9CA3AF" }}>리뷰가 없습니다.</p>
          </div>
        ) : (
          filtered.map((r) => {
            const productName =
              r.products?.product_translations.find((t) => t.language === "en")?.name ??
              r.products?.slug ??
              "알 수 없는 상품";
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
                        {r.profiles?.display_name ?? "익명"}
                      </span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>·</span>
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
                        {r.is_approved ? "게시 중" : "미노출"}
                      </span>
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
                    <button
                      onClick={() => toggleApprove(r)}
                      disabled={isLoading}
                      title={r.is_approved ? "미노출 처리" : "게시"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={
                        r.is_approved
                          ? { background: "rgba(245,158,11,0.12)", color: "#F59E0B" }
                          : { background: "rgba(16,185,129,0.12)", color: "#10B981" }
                      }
                    >
                      {r.is_approved ? (
                        <><XCircle className="w-3.5 h-3.5" /> 미노출</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> 게시</>
                      )}
                    </button>
                    <button
                      onClick={() => deleteReview(r.id)}
                      disabled={isLoading}
                      title="삭제"
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
      {confirmState && (
        <ConfirmDialog
          open
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          destructive={confirmState.destructive}
          onConfirm={handleConfirmYes}
          onCancel={handleConfirmNo}
        />
      )}
    </div>
  );
}
