"use client";

import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, CheckCircle, Loader2 } from "lucide-react";

interface VideoRow {
  id: string;
  cloudflare_stream_id: string;
  title: string | null;
  created_at: string;
  product_id: string | null;
  product_name: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
}

interface Props {
  videos: VideoRow[];
  products: Product[];
}

type AddMode = "id" | "upload";

export default function VideosAdminManager({ videos: initialVideos, products }: Props) {
  const [videos, setVideos] = useState(initialVideos);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>("id");

  // Paste Stream ID form
  const [addProductId, setAddProductId] = useState(products[0]?.id ?? "");
  const [addStreamId, setAddStreamId] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Direct upload form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProductId, setUploadProductId] = useState(products[0]?.id ?? "");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "requesting" | "uploading" | "saving" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedStreamId, setUploadedStreamId] = useState<string | null>(null);

  // ── Paste Stream ID ──────────────────────────────────────────────────────────

  async function addByStreamId() {
    if (!addProductId || !addStreamId.trim()) {
      setAddError("상품과 Stream ID는 필수입니다.");
      return;
    }
    setAdding(true);
    setAddError(null);

    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: addProductId,
        cloudflare_stream_id: addStreamId.trim(),
        title: addTitle.trim() || null,
      }),
    });

    if (res.ok) {
      const { video } = await res.json();
      const productName = products.find((p) => p.id === addProductId)?.name ?? "Unknown";
      setVideos((prev) => [{ ...video, product_name: productName }, ...prev]);
      setAddStreamId("");
      setAddTitle("");
    } else {
      const data = await res.json().catch(() => ({}));
      setAddError(data.error ?? "영상 추가에 실패했습니다.");
    }
    setAdding(false);
  }

  // ── Direct Upload ────────────────────────────────────────────────────────────

  async function handleDirectUpload() {
    if (!uploadFile || !uploadProductId) {
      setUploadError("Select a product and video file.");
      return;
    }

    setUploadStatus("requesting");
    setUploadError(null);
    setUploadProgress(0);

    // 1. Request a direct upload URL from Cloudflare via our API
    const urlRes = await fetch("/api/admin/upload-url", { method: "POST" });
    const urlData = await urlRes.json();

    if (urlData.mock) {
      // Mock mode — simulate upload
      setUploadStatus("uploading");
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 120));
        setUploadProgress(i);
      }
      const mockStreamId = `mock-${Date.now()}`;
      setUploadedStreamId(mockStreamId);
      await saveVideoRecord(mockStreamId);
      return;
    }

    if (!urlRes.ok || !urlData.uploadUrl) {
      setUploadError(urlData.error ?? "Failed to get upload URL.");
      setUploadStatus("error");
      return;
    }

    // 2. Upload directly to Cloudflare Stream via XMLHttpRequest (for progress tracking)
    setUploadStatus("uploading");
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.open("POST", urlData.uploadUrl);
      const formData = new FormData();
      formData.append("file", uploadFile);
      xhr.send(formData);
    }).catch((err) => {
      setUploadError(err.message);
      setUploadStatus("error");
    });

    if (uploadStatus === "error") return;

    setUploadedStreamId(urlData.streamId);
    await saveVideoRecord(urlData.streamId);
  }

  async function saveVideoRecord(streamId: string) {
    setUploadStatus("saving");
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: uploadProductId,
        cloudflare_stream_id: streamId,
        title: uploadTitle.trim() || null,
      }),
    });

    if (res.ok) {
      const { video } = await res.json();
      const productName = products.find((p) => p.id === uploadProductId)?.name ?? "Unknown";
      setVideos((prev) => [{ ...video, product_name: productName }, ...prev]);
      setUploadStatus("done");
      setUploadFile(null);
      setUploadTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error ?? "Failed to save video record.");
      setUploadStatus("error");
    }
  }

  async function deleteVideo(id: string) {
    if (!confirm("이 영상 링크를 삭제하시겠습니까?")) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id));
    setLoadingId(null);
  }

  // ── Shared styles ────────────────────────────────────────────────────────────

  const inputStyle = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Add Video Panel */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#2D2D4E" }}>
          {(["id", "upload"] as AddMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAddMode(mode)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: addMode === mode ? "#A855F7" : "#9CA3AF",
                borderBottom: addMode === mode ? "2px solid #A855F7" : "2px solid transparent",
              }}
            >
              {mode === "id" ? <LinkIcon className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {mode === "id" ? "Stream ID 붙여넣기" : "영상 파일 업로드"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {addMode === "id" ? (
            /* ── Paste Stream ID ── */
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                이미 Cloudflare Stream에 업로드하셨나요? 영상 ID를 붙여넣어 상품에 연결하세요.
              </p>
              {addError && <p className="text-sm" style={{ color: "#EF4444" }}>{addError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>상품</label>
                  <select value={addProductId} onChange={(e) => setAddProductId(e.target.value)} style={inputStyle}>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>Cloudflare Stream ID</label>{/* 고유명사 유지 */}
                  <input
                    value={addStreamId}
                    onChange={(e) => setAddStreamId(e.target.value)}
                    placeholder="e.g. 5d5bc37ffcf54c9b82e99682…"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>제목 (선택)</label>
                  <input
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="예: 완전 해법 영상"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                onClick={addByStreamId}
                disabled={adding}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "#7C3AED", color: "#fff" }}
              >
                {adding ? "추가 중…" : "+ 영상 연결"}
              </button>
            </div>
          ) : (
            /* ── Direct Upload ── */
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
영상 파일을 Cloudflare Stream에 직접 업로드합니다. 다음 환경변수가 필요합니다:{" "}
                <code className="px-1 py-0.5 rounded" style={{ background: "#2D2D4E" }}>CLOUDFLARE_ACCOUNT_ID</code>{" "}
                and{" "}
                <code className="px-1 py-0.5 rounded" style={{ background: "#2D2D4E" }}>CLOUDFLARE_STREAM_TOKEN</code>.
Mock 모드에서는 임시 Stream ID가 생성됩니다.
              </p>

              {uploadError && (
                <p className="text-sm" style={{ color: "#EF4444" }}>{uploadError}</p>
              )}

              {uploadStatus === "done" && uploadedStreamId && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
영상이 업로드되어 연결되었습니다. Stream ID:{" "}
                  <code className="font-mono text-xs">{uploadedStreamId}</code>
                </div>
              )}

              {uploadStatus === "idle" || uploadStatus === "done" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>상품</label>
                    <select value={uploadProductId} onChange={(e) => setUploadProductId(e.target.value)} style={inputStyle}>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>제목 (선택)</label>
                    <input
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="예: 전체 시연 가이드"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>영상 파일</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      style={{ ...inputStyle, padding: "6px 12px", cursor: "pointer" }}
                    />
                  </div>
                </div>
              ) : (
                /* Progress view */
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#A855F7" }} />
                    <span className="text-sm" style={{ color: "#F0E6FF" }}>
                      {uploadStatus === "requesting" && "업로드 URL 요청 중…"}
                      {uploadStatus === "uploading" && `업로드 중… ${uploadProgress}%`}
                      {uploadStatus === "saving" && "영상 정보 저장 중…"}
                    </span>
                  </div>
                  {uploadStatus === "uploading" && (
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2D2D4E" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #7C3AED, #A855F7)" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {(uploadStatus === "idle" || uploadStatus === "done") && (
                <div className="flex gap-3">
                  <button
                    onClick={handleDirectUpload}
                    disabled={!uploadFile || !uploadProductId}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "#7C3AED", color: "#fff" }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload & Link
                  </button>
                  {uploadFile && (
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setUploadStatus("idle");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
                      style={{ background: "#2D2D4E", color: "#9CA3AF" }}
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video List */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#2D2D4E" }}>
          <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>
            Linked Solution Videos ({videos.length})
          </h2>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            These are private — only accessible to verified purchasers
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
              {["Product", "Stream ID", "Title", "Added", "Action"].map((h) => (
                <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                  No solution videos linked yet.
                </td>
              </tr>
            ) : (
              videos.map((v) => (
                <tr
                  key={v.id}
                  className="border-b last:border-0"
                  style={{ borderColor: "#2D2D4E", opacity: loadingId === v.id ? 0.5 : 1 }}
                >
                  <td className="px-6 py-4 font-medium" style={{ color: "#F0E6FF" }}>
                    {v.product_name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs" style={{ color: "#9CA3AF" }}>
                    {v.cloudflare_stream_id.length > 20
                      ? `${v.cloudflare_stream_id.slice(0, 20)}…`
                      : v.cloudflare_stream_id}
                  </td>
                  <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                    {v.title ?? "—"}
                  </td>
                  <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteVideo(v.id)}
                      disabled={loadingId === v.id}
                      className="text-xs hover:opacity-80 transition-opacity"
                      style={{ color: "#EF4444" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
