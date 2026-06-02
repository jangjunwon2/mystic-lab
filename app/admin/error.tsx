"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#F0E6FF" }}>
          데이터를 불러오는 중 오류가 발생했습니다
        </h2>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          DB 연결 또는 서버 문제일 수 있습니다.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ background: "#7C3AED", color: "#F0E6FF" }}
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
}
