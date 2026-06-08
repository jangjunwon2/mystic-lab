"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, FolderArchive, X, RefreshCw } from "lucide-react";
import type { FirmwareDevice } from "@/app/api/admin/firmware/devices/route";
import FirmwareDeviceList from "./FirmwareDeviceList";
import FirmwareDeviceManager from "./FirmwareDeviceManager";

interface FirmwareRelease {
  id: string;
  device_type: string;
  version: string;
  download_url: string;
  storage_path: string;
  file_size: number | null;
  notes: string | null;

  created_at: string;
}

interface StagedDevice {
  id: string;
  deviceType: string;
  deviceLabel: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
}

interface Props {
  initialReleases: FirmwareRelease[];
  initialDevices: FirmwareDevice[];
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

export default function FirmwareClient({ initialReleases, initialDevices }: Props) {
  const [releases, setReleases] = useState(initialReleases);
  const [devices, setDevices] = useState<FirmwareDevice[]>(initialDevices);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ msg: string; type: "idle" | "ok" | "err" | "info" }>({ msg: "", type: "idle" });
  const [rebuilding, setRebuilding] = useState(false);
  const [stagedDevices, setStagedDevices] = useState<StagedDevice[]>([]);
  const [polling, setPolling] = useState(false);
  const [newReleaseAlert, setNewReleaseAlert] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef<number>(0);
  const knownIdsRef = useRef<Set<string>>(new Set(initialReleases.map((r) => r.id)));
  const expectedCountRef = useRef<number>(0);
  const foundNewIdsRef = useRef<Set<string>>(new Set());

  // releases 변경 시 knownIds 동기화
  useEffect(() => {
    knownIdsRef.current = new Set(releases.map((r) => r.id));
  }, [releases]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setPolling(false);
  }, []);

  const startPolling = useCallback((expectedCount = 0) => {
    if (pollRef.current) return;
    setPolling(true);
    expectedCountRef.current = expectedCount;
    foundNewIdsRef.current = new Set();
    pollDeadlineRef.current = Date.now() + 20 * 60 * 1000;

    pollRef.current = setInterval(async () => {
      if (Date.now() > pollDeadlineRef.current) { stopPolling(); return; }

      const res = await fetch(`/api/admin/firmware?t=${Date.now()}`);
      if (!res.ok) return;
      const fresh: FirmwareRelease[] = await res.json();

      const added = fresh.filter((r) => !knownIdsRef.current.has(r.id));
      setReleases(fresh);

      if (added.length > 0) {
        for (const r of added) foundNewIdsRef.current.add(r.id);
        const names = added.map((r) => `${r.device_type} v${r.version}`).join(", ");
        setNewReleaseAlert(`새 릴리스 감지: ${names}`);
        setTimeout(() => setNewReleaseAlert(null), 8000);

        // 예상 장치 수를 모두 감지했거나 기대값 없으면 폴링 종료
        if (expectedCountRef.current <= 0 || foundNewIdsRef.current.size >= expectedCountRef.current) {
          stopPolling();
        }
      }
    }, 10_000);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  function handleUpload() {
    if (!zipFile) {
      setUploadStatus({ msg: "zip 파일을 선택해주세요.", type: "err" });
      return;
    }
    const id = `staged-${Date.now()}`;
    setStagedDevices((prev) => [
      ...prev,
      { id, deviceType: "auto", deviceLabel: "감지 중…", file: zipFile, status: "pending" },
    ]);
    setZipFile(null);
    setUploadStatus({ msg: "", type: "idle" });
    const fi = document.getElementById("fw-zip") as HTMLInputElement;
    if (fi) fi.value = "";
  }

  async function buildStagedDevice(id: string) {
    const staged = stagedDevices.find((s) => s.id === id);
    if (!staged) return;

    setStagedDevices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "uploading" } : s))
    );

    try {
      const fd = new FormData();
      fd.append("zip", staged.file);
      // device_type 불필요 — 백엔드가 .ino 파일명/폴더명으로 자동 감지

      const res = await fetch("/api/admin/firmware/upload-source", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setStagedDevices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "error", message: data.error ?? "업로드 실패" } : s))
        );
        return;
      }

      const deviceList: string[] = data.devices ?? [];
      const versions: Record<string, string | null> = data.versions ?? {};
      const detectedLabel = deviceList.length > 0
        ? deviceList.map((d) => versions[d] ? `${d} v${versions[d]}` : d).join(", ")
        : "알 수 없음";
      setStagedDevices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "done", deviceLabel: detectedLabel, message: `커밋 ${data.commit}` } : s))
      );
      startPolling(deviceList.length);

      // 신규 장치가 자동 등록됐을 수 있으므로 장치 목록 갱신
      const devRes = await fetch("/api/admin/firmware/devices");
      if (devRes.ok) setDevices(await devRes.json());
    } catch {
      setStagedDevices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "error", message: "네트워크 오류" } : s))
      );
    }
  }

  function removeStagedDevice(id: string) {
    setStagedDevices((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRebuildAll() {
    if (!confirm("모든 장치를 강제 재빌드합니다. GitHub Actions가 실행되며 5~10분 소요됩니다.")) return;
    setRebuilding(true);
    try {
      const res = await fetch("/api/admin/firmware/rebuild", { method: "POST" });
      if (res.ok) {
        setUploadStatus({ msg: "✅ 전체 재빌드 요청 완료 — GitHub Actions에서 빌드 중입니다. 완료되면 자동으로 업데이트됩니다.", type: "ok" });
        startPolling(devices.length);
      } else {
        const d = await res.json();
        setUploadStatus({ msg: `재빌드 요청 실패: ${d.error}`, type: "err" });
      }
    } catch {
      setUploadStatus({ msg: "네트워크 오류가 발생했습니다.", type: "err" });
    }
    setRebuilding(false);
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

      {/* 소스코드 업로드 */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#A855F7" }}>
            소스코드 업로드
          </h2>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Arduino 스케치 폴더를 .zip으로 압축해서 올리면 자동으로 빌드 후 기기에 배포됩니다.
          </p>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: "#9CA3AF" }}>
            소스코드 (.zip)
            <span className="ml-2 text-[10px]" style={{ color: "#A855F7" }}>
              .ino 파일명으로 장치 자동 감지
            </span>
          </label>
          <div
              className="rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors"
              style={{ borderColor: zipFile ? "#7C3AED" : "#2D2D4E", background: zipFile ? "rgba(124,58,237,0.05)" : "transparent" }}
              onClick={() => document.getElementById("fw-zip")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith(".zip")) setZipFile(f);
              }}
            >
              <FolderArchive className="w-5 h-5 mx-auto mb-1" style={{ color: zipFile ? "#A855F7" : "#4B5563" }} />
              {zipFile ? (
                <div>
                  <p className="text-xs font-medium" style={{ color: "#F0E6FF" }}>{zipFile.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{formatBytes(zipFile.size)}</p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "#6B7280" }}>클릭하거나 .zip 드래그</p>
              )}
              <input
                id="fw-zip"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              />
            </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleUpload}
            disabled={!zipFile}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
          >
            <Upload className="w-4 h-4" />
            목록에 추가
          </button>
          <button
            onClick={handleRebuildAll}
            disabled={rebuilding || uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid rgba(124,58,237,0.3)" }}
            title="파일 변경 없이 모든 장치를 강제 재빌드합니다"
          >
            <RefreshCw className={`w-4 h-4 ${rebuilding ? "animate-spin" : ""}`} />
            {rebuilding ? "요청 중…" : "전체 재빌드"}
          </button>
          {uploadStatus.msg && (
            <span
              className="text-xs leading-relaxed"
              style={{
                color: uploadStatus.type === "ok" ? "#10B981" : uploadStatus.type === "err" ? "#EF4444" : "#9CA3AF",
                maxWidth: "480px",
              }}
            >
              {uploadStatus.msg}
            </span>
          )}
        </div>

        <p className="text-[10px]" style={{ color: "#4B5563" }}>
          압축 방법: 스케치 폴더 선택 → 우클릭 → 압축(zip)으로 보내기 · 빌드는 GitHub Actions에서 약 5~10분 소요
        </p>

        {/* 배포 대기 중인 장치 목록 */}
        <div style={{ borderTop: "1px solid #2D2D4E", paddingTop: "16px" }}>
          <div className="flex items-center mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
              배포 대기
            </span>
            {stagedDevices.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono" style={{ background: "rgba(124,58,237,0.2)", color: "#A855F7" }}>
                {stagedDevices.length}
              </span>
            )}
          </div>

          {stagedDevices.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: "#4B5563" }}>
              zip 선택 후 "목록에 추가" → 각 장치의 빌드 버튼으로 GitHub에 배포
            </p>
          )}

          {stagedDevices.length > 0 && (
            <div className="space-y-1.5">
              {stagedDevices.map((staged) => (
                <div
                  key={staged.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: "#0D0D1A", border: "1px solid #2D2D4E" }}
                >
                  <span className="text-xs font-mono flex-1" style={{ color: "#A855F7" }}>{staged.deviceLabel}</span>
                  <span className="text-[10px] truncate max-w-[140px]" style={{ color: "#4B5563" }}>
                    {staged.file.name} · {formatBytes(staged.file.size)}
                  </span>
                  {staged.message && (
                    <span className="text-[10px] shrink-0" style={{ color: staged.status === "error" ? "#EF4444" : "#10B981" }}>
                      {staged.message}
                    </span>
                  )}
                  {staged.status === "pending" && (
                    <button
                      onClick={() => buildStagedDevice(staged.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 shrink-0"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
                    >
                      빌드
                    </button>
                  )}
                  {staged.status === "uploading" && (
                    <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: "#9CA3AF" }}>
                      <RefreshCw className="w-3 h-3 animate-spin" />빌드 중…
                    </span>
                  )}
                  {(staged.status === "done" || staged.status === "error") && (
                    <button
                      onClick={() => removeStagedDevice(staged.id)}
                      className="p-0.5 shrink-0"
                      style={{ color: "#4B5563" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 장치 관리 */}
      <FirmwareDeviceManager devices={devices} setDevices={setDevices} />

      {/* 릴리스 목록 */}
      <FirmwareDeviceList
        releases={releases}
        setReleases={setReleases}
        polling={polling}
        newReleaseAlert={newReleaseAlert}
      />

      {/* 가이드 */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>사용 가이드</h2>

        <div className="rounded-xl overflow-hidden" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: "rgba(124,58,237,0.12)", borderBottom: "1px solid #2D2D4E" }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#7C3AED", color: "#fff" }}>1</span>
            <span className="text-sm font-medium" style={{ color: "#F0E6FF" }}>소스코드 업로드 방법</span>
          </div>
          <div className="px-5 py-4 space-y-3 text-xs" style={{ color: "#9CA3AF" }}>
            <div className="flex gap-3"><span className="shrink-0 font-bold" style={{ color: "#A855F7" }}>①</span><span>장치 폴더 안 <strong style={{ color: "#F0E6FF" }}>config.h</strong>의 <code style={{ color: "#A855F7" }}>FIRMWARE_VERSION</code>을 새 버전으로 수정합니다. (예: <code style={{ color: "#A855F7" }}>"1.0"</code> → <code style={{ color: "#A855F7" }}>"1.1"</code>)</span></div>
            <div className="flex gap-3"><span className="shrink-0 font-bold" style={{ color: "#A855F7" }}>②</span><span>해당 <strong style={{ color: "#F0E6FF" }}>장치 폴더 전체</strong>를 zip으로 압축합니다.<br /><span style={{ color: "#6B7280" }}>예) nexus_flux_case 폴더 우클릭 → 압축(ZIP)으로 보내기</span></span></div>
            <div className="flex gap-3"><span className="shrink-0 font-bold" style={{ color: "#A855F7" }}>③</span><span>위 소스코드 업로드 섹션에서 장치를 선택하고 zip을 업로드합니다.</span></div>
            <div className="flex gap-3"><span className="shrink-0 font-bold" style={{ color: "#A855F7" }}>④</span><span>빌드 완료까지 <strong style={{ color: "#F0E6FF" }}>약 5~10분</strong> 소요. 완료 후 이전 버전은 자동 삭제됩니다.<br /><span style={{ color: "#6B7280" }}>진행 상황: github.com/jangjunwon2/nexus-firmware → Actions 탭</span></span></div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: "rgba(124,58,237,0.12)", borderBottom: "1px solid #2D2D4E" }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#7C3AED", color: "#fff" }}>2</span>
            <span className="text-sm font-medium" style={{ color: "#F0E6FF" }}>장치 코드에 추가할 내용</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              아직 OTA 코드가 없는 장치라면 아래 코드를 추가하세요.
            </p>
            <div className="rounded-lg px-4 py-3 text-xs space-y-1" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p className="font-semibold" style={{ color: "#FCA5A5" }}>반드시 확인할 사항</p>
              <p style={{ color: "#9CA3AF" }}>• <code style={{ color: "#F0E6FF" }}>OTA_DEVICE_TYPE</code>은 장치 관리의 폴더명과 정확히 일치해야 합니다.</p>
              <p style={{ color: "#9CA3AF" }}>• <code style={{ color: "#F0E6FF" }}>FIRMWARE_VERSION</code>보다 서버 버전이 높을 때만 업데이트가 실행됩니다. (동일·낮은 버전은 무시)</p>
            </div>
            <pre className="rounded-lg p-4 text-xs leading-relaxed overflow-x-auto" style={{ background: "#0D0D1A", color: "#A855F7", fontFamily: "monospace" }}>{`#pragma once
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Update.h>

// config.h의 FIRMWARE_VERSION과 동일하게 유지
#define OTA_DEVICE_TYPE  "nexus_flux_case"
#define OTA_CHECK_URL \\
  "https://mystic-lab.vercel.app/api/firmware/latest?device=" OTA_DEVICE_TYPE

// "1.0" 형식 비교 — 서버 버전이 현재보다 높을 때만 true
static bool isNewerVersion(const String& newVer, const String& curVer) {
  int nMaj = 0, nMin = 0, cMaj = 0, cMin = 0;
  sscanf(newVer.c_str(), "%d.%d", &nMaj, &nMin);
  sscanf(curVer.c_str(), "%d.%d", &cMaj, &cMin);
  if (nMaj != cMaj) return nMaj > cMaj;
  return nMin > cMin;
}

void otaCheckAndUpdate() {
  HTTPClient http;
  http.begin(OTA_CHECK_URL);
  int code = http.GET();
  if (code != 200) { http.end(); return; }
  String body = http.getString();
  http.end();
  DynamicJsonDocument doc(512);
  if (deserializeJson(doc, body)) return;
  String latest = doc["version"].as<String>();
  if (!isNewerVersion(latest, FIRMWARE_VERSION)) return;
  String url = doc["url"].as<String>();
  if (url.isEmpty()) return;
  http.begin(url);
  int binCode = http.GET();
  if (binCode == 200) {
    int size = http.getSize();
    if (size > 0 && Update.begin(size)) {
      WiFiClient* stream = http.getStreamPtr();
      size_t written = Update.writeStream(*stream);
      if (Update.end(true) && written == (size_t)size) {
        http.end();
        ESP.restart();
      }
    }
  }
  http.end();
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
