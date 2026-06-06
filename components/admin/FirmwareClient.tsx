"use client";

import { useState } from "react";
import { Upload, Trash2, ToggleLeft, ToggleRight, Download, Copy, Check } from "lucide-react";

interface FirmwareRelease {
  id: string;
  device_type: string;
  version: string;
  download_url: string;
  storage_path: string;
  file_size: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  initialReleases: FirmwareRelease[];
}

const inputStyle = {
  background: "#0D0D1A",
  border: "1px solid #2D2D4E",
  borderRadius: "8px",
  color: "#F0E6FF",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export default function FirmwareClient({ initialReleases }: Props) {
  const [releases, setReleases] = useState(initialReleases);
  const [deviceType, setDeviceType] = useState("");
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const DEVICE_SUGGESTIONS = ["esp32-s3", "esp32", "esp32-c3"];

  async function handleUpload() {
    if (!file || !deviceType.trim() || !version.trim()) {
      setUploadStatus("❌ 장치 타입, 버전, 파일을 모두 입력해주세요.");
      return;
    }

    setUploading(true);
    setUploadStatus("서명된 업로드 URL 요청 중…");

    try {
      // Step 1: 서명된 업로드 URL 발급
      const urlRes = await fetch("/api/admin/firmware/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_type: deviceType.trim(),
          version: version.trim(),
          filename: file.name,
        }),
      });

      if (!urlRes.ok) {
        const d = await urlRes.json();
        setUploadStatus(`❌ ${d.error ?? "URL 발급 실패"}`);
        setUploading(false);
        return;
      }

      const { signedUrl, storagePath, publicUrl } = await urlRes.json();

      // Step 2: Supabase Storage에 직접 업로드
      setUploadStatus("파일 업로드 중…");
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });

      if (!uploadRes.ok) {
        setUploadStatus("❌ 파일 업로드 실패. 스토리지 설정을 확인해주세요.");
        setUploading(false);
        return;
      }

      // Step 3: 메타데이터 저장
      setUploadStatus("메타데이터 저장 중…");
      const metaRes = await fetch("/api/admin/firmware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_type: deviceType.trim(),
          version: version.trim(),
          notes: notes.trim() || null,
          storage_path: storagePath,
          download_url: publicUrl,
          file_size: file.size,
        }),
      });

      if (!metaRes.ok) {
        const d = await metaRes.json();
        setUploadStatus(`❌ ${d.error ?? "저장 실패"}`);
        setUploading(false);
        return;
      }

      const newRelease: FirmwareRelease = await metaRes.json();
      setReleases((prev) => [newRelease, ...prev]);
      setUploadStatus("✅ 업로드 완료!");
      setDeviceType("");
      setVersion("");
      setNotes("");
      setFile(null);
      // file input 초기화
      const fileInput = document.getElementById("fw-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch {
      setUploadStatus("❌ 네트워크 오류가 발생했습니다.");
    }
    setUploading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/firmware/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) {
      setReleases((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r))
      );
    }
  }

  async function deleteRelease(id: string, version: string) {
    if (!confirm(`버전 ${version}을 삭제할까요? 파일도 함께 삭제됩니다.`)) return;
    const res = await fetch(`/api/admin/firmware/${id}`, { method: "DELETE" });
    if (res.ok) setReleases((prev) => prev.filter((r) => r.id !== id));
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#F0E6FF", fontFamily: "var(--font-cinzel), serif" }}>
          펌웨어 관리
        </h1>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          ESP32-S3 OTA 업데이트 · 기기 엔드포인트:{" "}
          <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#1A1A2E", color: "#A855F7" }}>
            GET /api/firmware/latest?device=장치타입
          </code>
        </p>
      </div>

      {/* 업로드 폼 */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#A855F7" }}>
          새 펌웨어 업로드
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 장치 타입 */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9CA3AF" }}>장치 타입</label>
            <input
              list="device-suggestions"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              placeholder="예: esp32-s3"
              style={inputStyle}
            />
            <datalist id="device-suggestions">
              {DEVICE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
            <p className="text-[10px] mt-1" style={{ color: "#6B7280" }}>
              기기 코드의 <code>device=</code> 값과 동일하게
            </p>
          </div>

          {/* 버전 */}
          <div>
            <label className="block text-xs mb-1" style={{ color: "#9CA3AF" }}>버전</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="예: 1.2.0"
              style={inputStyle}
            />
          </div>

          {/* 릴리스 노트 */}
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1" style={{ color: "#9CA3AF" }}>릴리스 노트 (선택)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="변경 사항을 간단히 입력하세요…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* 파일 선택 */}
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1" style={{ color: "#9CA3AF" }}>펌웨어 파일 (.bin)</label>
            <div
              className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
              style={{ borderColor: file ? "#7C3AED" : "#2D2D4E", background: file ? "rgba(124,58,237,0.05)" : "transparent" }}
              onClick={() => document.getElementById("fw-file")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) setFile(f);
              }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: file ? "#A855F7" : "#4B5563" }} />
              {file ? (
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F0E6FF" }}>{file.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{formatBytes(file.size)}</p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  클릭하거나 .bin 파일을 드래그하세요
                </p>
              )}
              <input
                id="fw-file"
                type="file"
                accept=".bin"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "업로드 중…" : "업로드"}
          </button>
          {uploadStatus && (
            <span
              className="text-sm"
              style={{ color: uploadStatus.startsWith("✅") ? "#10B981" : uploadStatus.startsWith("❌") ? "#EF4444" : "#9CA3AF" }}
            >
              {uploadStatus}
            </span>
          )}
        </div>
      </div>

      {/* 릴리스 목록 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #2D2D4E" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#F0E6FF" }}>릴리스 이력 ({releases.length})</h2>
        </div>

        {releases.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm" style={{ color: "#6B7280" }}>
            업로드된 펌웨어가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                  {["장치 타입", "버전", "파일 크기", "날짜", "상태", "다운로드 URL", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#9CA3AF" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {releases.map((rel) => (
                  <tr
                    key={rel.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #2D2D4E", opacity: rel.is_active ? 1 : 0.5 }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7" }}
                      >
                        {rel.device_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#F0E6FF" }}>
                      {rel.version}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                      {rel.file_size ? formatBytes(rel.file_size) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                      {new Date(rel.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(rel.id, rel.is_active)}
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: rel.is_active ? "#10B981" : "#6B7280" }}
                      >
                        {rel.is_active
                          ? <ToggleRight className="w-4 h-4" />
                          : <ToggleLeft className="w-4 h-4" />}
                        {rel.is_active ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={rel.download_url}
                          download
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: "#7C3AED" }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => copyUrl(rel.download_url, rel.id)}
                          className="text-xs transition-colors"
                          style={{ color: copiedId === rel.id ? "#10B981" : "#6B7280" }}
                          title="URL 복사"
                        >
                          {copiedId === rel.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <span className="max-w-[180px] truncate text-xs" style={{ color: "#4B5563" }}>
                          {rel.download_url}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteRelease(rel.id, rel.version)}
                        className="p-1 transition-colors"
                        style={{ color: "#6B7280" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ESP32 코드 스니펫 */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#0D0D1A", border: "1px solid #2D2D4E" }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
          ESP32 펌웨어 코드 예시
        </h2>
        <pre
          className="text-xs leading-relaxed overflow-x-auto"
          style={{ color: "#A855F7", fontFamily: "monospace" }}
        >{`// esp32 OTA 업데이트 예시 (Arduino / ESP-IDF)
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Update.h>

#define DEVICE_TYPE  "esp32-s3"          // 장치 타입 (어드민과 동일하게)
#define CURRENT_VER  "1.0.0"             // 현재 기기 버전
#define CHECK_URL    "https://mystic-lab.vercel.app/api/firmware/latest?device=" DEVICE_TYPE

void checkAndUpdate() {
  HTTPClient http;
  http.begin(CHECK_URL);
  int code = http.GET();
  if (code != 200) { http.end(); return; }

  DynamicJsonDocument doc(512);
  deserializeJson(doc, http.getString());
  http.end();

  String latest = doc["version"].as<String>();
  if (latest == CURRENT_VER) return;  // 이미 최신

  // 업데이트 다운로드 및 플래시
  String url = doc["url"].as<String>();
  http.begin(url);
  int binCode = http.GET();
  if (binCode == 200) {
    int size = http.getSize();
    WiFiClient* stream = http.getStreamPtr();
    if (Update.begin(size)) {
      Update.writeStream(*stream);
      if (Update.end(true)) ESP.restart();  // 재시작으로 적용
    }
  }
  http.end();
}`}</pre>
      </div>
    </div>
  );
}
