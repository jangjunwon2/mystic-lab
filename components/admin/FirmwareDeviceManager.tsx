"use client";

import { useState } from "react";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import type { FirmwareDevice } from "@/app/api/admin/firmware/devices/route";

interface FirmwareDeviceManagerProps {
  devices: FirmwareDevice[];
  setDevices: React.Dispatch<React.SetStateAction<FirmwareDevice[]>>;
}

export default function FirmwareDeviceManager({ devices, setDevices }: FirmwareDeviceManagerProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [addingDevice, setAddingDevice] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [deviceSaving, setDeviceSaving] = useState(false);
  const [deviceError, setDeviceError] = useState("");

  async function saveDevices(next: FirmwareDevice[]) {
    setDeviceSaving(true);
    setDeviceError("");
    const res = await fetch("/api/admin/firmware/devices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (res.ok) {
      setDevices(next);
    } else {
      const d = await res.json();
      setDeviceError(d.error ?? "저장 실패");
    }
    setDeviceSaving(false);
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditName(devices[idx].name);
    setEditLabel(devices[idx].label);
    setAddingDevice(false);
  }

  async function commitEdit(idx: number) {
    if (!editName.trim() || !editLabel.trim()) return;
    const next = devices.map((d, i) => i === idx ? { name: editName.trim(), label: editLabel.trim() } : d);
    await saveDevices(next);
    setEditingIdx(null);
  }

  async function deleteDevice(idx: number) {
    if (!confirm(`"${devices[idx].label}" 장치를 삭제할까요?`)) return;
    await saveDevices(devices.filter((_, i) => i !== idx));
  }

  async function addDevice() {
    if (!newName.trim() || !newLabel.trim()) { setDeviceError("이름과 표시명 모두 입력하세요."); return; }
    if (devices.some(d => d.name === newName.trim())) { setDeviceError("이미 존재하는 장치 이름입니다."); return; }
    const next = [...devices, { name: newName.trim(), label: newLabel.trim() }];
    await saveDevices(next);
    setNewName(""); setNewLabel(""); setAddingDevice(false);
  }

  return (
    <div className="rounded-xl p-6 space-y-3" style={{ background: "#1A1A2E", border: "1px solid #2D2D4E" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#A855F7" }}>장치 관리</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
            등록된 장치 목록. 소스 업로드 시 .ino 파일명으로 자동 감지되며, 신규 장치는 자동 추가됩니다.
          </p>
        </div>
        <button
          onClick={() => { setAddingDevice(true); setEditingIdx(null); setDeviceError(""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "rgba(124,58,237,0.2)", color: "#A855F7" }}
        >
          <Plus className="w-3.5 h-3.5" /> 장치 추가
        </button>
      </div>

      <div className="space-y-1.5">
        {devices.map((device, idx) => (
          <div
            key={device.name}
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "#0D0D1A", border: "1px solid #2D2D4E" }}
          >
            {editingIdx === idx ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="폴더명"
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: "#F0E6FF", borderBottom: "1px solid #7C3AED" }}
                />
                <input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  placeholder="표시 이름"
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: "#F0E6FF", borderBottom: "1px solid #7C3AED" }}
                />
                <button onClick={() => commitEdit(idx)} disabled={deviceSaving} className="text-xs px-2 py-0.5 rounded" style={{ background: "#7C3AED", color: "#fff" }}>저장</button>
                <button onClick={() => setEditingIdx(null)} className="p-0.5" style={{ color: "#6B7280" }}><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <span className="text-xs font-mono flex-1" style={{ color: "#A855F7" }}>{device.name}</span>
                <span className="text-xs flex-1" style={{ color: "#9CA3AF" }}>{device.label}</span>
                <button onClick={() => startEdit(idx)} className="p-1" style={{ color: "#6B7280" }} onMouseEnter={e => (e.currentTarget.style.color = "#A855F7")} onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteDevice(idx)} className="p-1" style={{ color: "#6B7280" }} onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")} onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {addingDevice && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="폴더명 (예: nexus_new)"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "#F0E6FF", borderBottom: "1px solid #7C3AED" }}
          />
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="표시 이름 (예: Nexus New)"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: "#F0E6FF", borderBottom: "1px solid #7C3AED" }}
          />
          <button onClick={addDevice} disabled={deviceSaving} className="text-xs px-2 py-0.5 rounded" style={{ background: "#7C3AED", color: "#fff" }}>추가</button>
          <button onClick={() => { setAddingDevice(false); setDeviceError(""); }} className="p-0.5" style={{ color: "#6B7280" }}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {deviceError && <p className="text-xs" style={{ color: "#EF4444" }}>{deviceError}</p>}
    </div>
  );
}
