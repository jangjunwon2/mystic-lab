"use client";

import { Fragment, useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, CheckCircle, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { formatTimestamp } from "@/components/video/VideoChapters";

interface VideoChapterRow {
  id: string;
  timestamp_seconds: number;
  description_ko: string;
}

interface VideoRow {
  id: string;
  cloudflare_stream_id: string;
  title: string | null;
  created_at: string;
  product_id: string | null;
  product_name: string;
  chapters: VideoChapterRow[];
}

// "mm:ss" 또는 "h:mm:ss" → 총 초. 형식이 잘못되면 null.
function parseTimeInput(value: string): number | null {
  const parts = value.trim().split(":").map((p) => Number(p));
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isFinite(p) || p < 0)) return null;
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
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
  const [addSource, setAddSource] = useState<"cloudflare" | "vimeo">("cloudflare");
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

  // Chapters
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chapterTime, setChapterTime] = useState("");
  const [chapterDesc, setChapterDesc] = useState("");
  const [chapterSaving, setChapterSaving] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [chapterDeletingId, setChapterDeletingId] = useState<string | null>(null);

  function toggleExpanded(videoId: string) {
    setExpandedId((prev) => (prev === videoId ? null : videoId));
    setChapterTime("");
    setChapterDesc("");
    setChapterError(null);
  }

  async function addChapter(videoId: string) {
    const seconds = parseTimeInput(chapterTime);
    if (seconds === null || !chapterDesc.trim()) {
      setChapterError("시간(mm:ss)과 설명을 입력해주세요.");
      return;
    }
    setChapterSaving(true);
    setChapterError(null);

    const res = await fetch(`/api/admin/videos/${videoId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp_seconds: seconds, description: chapterDesc.trim() }),
    });

    if (res.ok) {
      const { chapter } = await res.json();
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                chapters: [
                  ...v.chapters,
                  { id: chapter.id, timestamp_seconds: chapter.timestamp_seconds, description_ko: chapter.description },
                ].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds),
              }
            : v
        )
      );
      setChapterTime("");
      setChapterDesc("");
    } else {
      const data = await res.json().catch(() => ({}));
      setChapterError(data.error ?? "챕터 추가에 실패했습니다.");
    }
    setChapterSaving(false);
  }

  async function deleteChapter(videoId: string, chapterId: string) {
    if (!confirm("이 챕터를 삭제할까요?")) return;
    setChapterDeletingId(chapterId);
    const res = await fetch(`/api/admin/videos/${videoId}/chapters/${chapterId}`, { method: "DELETE" });
    if (res.ok) {
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, chapters: v.chapters.filter((c) => c.id !== chapterId) } : v))
      );
    }
    setChapterDeletingId(null);
  }

  // ── Paste Stream ID ──────────────────────────────────────────────────────────

  async function addByStreamId() {
    if (!addProductId || !addStreamId.trim()) {
      setAddError("상품과 영상 ID를 입력해주세요.");
      return;
    }
    setAdding(true);
    setAddError(null);

    // Vimeo: 임베드 코드(iframe)·플레이어 URL·일반 URL·숫자 ID 모두 지원
    let storedId = addStreamId.trim();
    if (addSource === "vimeo") {
      const raw = storedId;
      // 1) iframe 임베드 코드면 src 추출 / 2) player.vimeo.com URL이면 그대로 → 파라미터(h 등) 전부 보존해 직접 임베드
      const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
      const playerUrl = iframeSrc ?? (/player\.vimeo\.com\/video\//.test(raw) ? raw : null);
      if (playerUrl) {
        // HTML 엔티티(&amp;) 디코딩 후 전체 URL 보존
        storedId = `vimeoembed:${playerUrl.replace(/&amp;/g, "&")}`;
      } else {
        // 3) vimeo.com/ID/HASH 또는 숫자 ID
        const id = raw.match(/(\d{6,})/)?.[1] ?? raw;
        const hash =
          (raw.match(/[?&]h=([0-9a-zA-Z]+)/) || raw.match(/vimeo\.com\/\d+\/([0-9a-zA-Z]+)/))?.[1] ?? "";
        storedId = hash ? `vimeo:${id}:${hash}` : `vimeo:${id}`;
      }
    }

    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: addProductId,
        cloudflare_stream_id: storedId,
        title: addTitle.trim() || null,
      }),
    });

    if (res.ok) {
      const { video } = await res.json();
      const productName = products.find((p) => p.id === addProductId)?.name ?? "Unknown";
      setVideos((prev) => [{ ...video, product_name: productName, chapters: [] }, ...prev]);
      setAddStreamId("");
      setAddTitle("");
    } else {
      const data = await res.json().catch(() => ({}));
      setAddError(data.error ?? "Failed to add video.");
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
      // eslint-disable-next-line react-hooks/purity
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
      setVideos((prev) => [{ ...video, product_name: productName, chapters: [] }, ...prev]);
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
    if (!confirm("이 영상 연결을 삭제할까요?")) return;
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
              {mode === "id" ? "Stream ID 입력" : "영상 파일 업로드"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {addMode === "id" ? (
            /* ── Paste Stream ID ── */
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Cloudflare Stream 또는 Vimeo에 업로드된 해법 영상을 상품과 연결합니다. 소스를 선택하고 ID(또는 Vimeo URL)를 입력하세요.
              </p>
              {addError && <p className="text-sm" style={{ color: "#EF4444" }}>{addError}</p>}
              {/* 영상 소스 선택 */}
              <div className="flex gap-2">
                {([["cloudflare", "Cloudflare Stream"], ["vimeo", "Vimeo"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAddSource(val)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={addSource === val
                      ? { background: "#7C3AED", color: "#fff" }
                      : { background: "#0D0D1A", color: "#9CA3AF", border: "1px solid #2D2D4E" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
                  <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>
                    {addSource === "vimeo" ? "Vimeo 임베드 코드 / URL / ID" : "Cloudflare Stream ID"}
                  </label>
                  <input
                    value={addStreamId}
                    onChange={(e) => setAddStreamId(e.target.value)}
                    placeholder={addSource === "vimeo" ? "Vimeo 임베드 코드(<iframe …>) 또는 영상 URL 붙여넣기" : "예: 5d5bc37ffcf54c9b82e99682…"}
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
                영상 파일을 직접 Cloudflare Stream에 업로드합니다. 필요 환경변수:{" "}
                <code className="px-1 py-0.5 rounded" style={{ background: "#2D2D4E" }}>CLOUDFLARE_ACCOUNT_ID</code>{" "}
                및{" "}
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
                  영상 업로드 및 연결 완료. Stream ID:{" "}
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
                      placeholder="예: 완전 해법 가이드"
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
                    업로드 & 연결
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
                      초기화
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
            연결된 해법 영상 ({videos.length}개)
          </h2>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            비공개 영상 — 구매 확인된 회원만 접근 가능
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
              {["상품", "Stream ID", "제목", "챕터", "추가일", "관리"].map((h) => (
                <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                  연결된 해법 영상이 없습니다.
                </td>
              </tr>
            ) : (
              videos.map((v) => (
                <Fragment key={v.id}>
                  <tr
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
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleExpanded(v.id)}
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#A855F7" }}
                      >
                        {expandedId === v.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {v.chapters.length}개
                      </button>
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
                        삭제
                      </button>
                    </td>
                  </tr>
                  {expandedId === v.id && (
                    <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                      <td colSpan={6} className="px-6 py-4" style={{ background: "#13131F" }}>
                        <div className="space-y-3">
                          {v.chapters.length > 0 && (
                            <ul className="space-y-1.5">
                              {v.chapters.map((c) => (
                                <li key={c.id} className="flex items-center gap-3 text-sm">
                                  <span
                                    className="font-mono text-xs px-2 py-1 rounded-md shrink-0"
                                    style={{ background: "#0D0D1A", color: "#A855F7" }}
                                  >
                                    {formatTimestamp(c.timestamp_seconds)}
                                  </span>
                                  <span className="flex-1" style={{ color: "#F0E6FF" }}>{c.description_ko}</span>
                                  <button
                                    onClick={() => deleteChapter(v.id, c.id)}
                                    disabled={chapterDeletingId === c.id}
                                    className="shrink-0 hover:opacity-80 transition-opacity disabled:opacity-40"
                                    style={{ color: "#EF4444" }}
                                    aria-label="챕터 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {chapterError && <p className="text-xs" style={{ color: "#EF4444" }}>{chapterError}</p>}
                          <div className="flex flex-wrap gap-2 items-center">
                            <input
                              value={chapterTime}
                              onChange={(e) => setChapterTime(e.target.value)}
                              placeholder="mm:ss (예: 1:23)"
                              style={{ ...inputStyle, width: "112px" }}
                            />
                            <input
                              value={chapterDesc}
                              onChange={(e) => setChapterDesc(e.target.value)}
                              placeholder="설명 (한국어 입력 — 7개 언어 자동번역)"
                              className="flex-1"
                              style={{ ...inputStyle, width: "auto", minWidth: "200px" }}
                            />
                            <button
                              onClick={() => addChapter(v.id)}
                              disabled={chapterSaving}
                              className="px-4 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 shrink-0"
                              style={{ background: "#7C3AED", color: "#fff" }}
                            >
                              {chapterSaving ? "추가 중…" : "+ 챕터 추가"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
