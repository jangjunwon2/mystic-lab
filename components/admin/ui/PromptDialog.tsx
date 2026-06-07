"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptDialog({
  open,
  title = "입력",
  message,
  placeholder = "",
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState("");

  if (!open) return null;

  function handleConfirm() {
    onConfirm(value);
    setValue("");
  }

  function handleCancel() {
    setValue("");
    onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={handleCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
        className="w-full max-w-sm rounded-xl border p-6 shadow-2xl"
        style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="prompt-dialog-title" className="text-base font-semibold mb-2" style={{ color: "#F0E6FF" }}>
          {title}
        </h2>
        <p className="text-sm mb-3 whitespace-pre-line" style={{ color: "#9CA3AF" }}>
          {message}
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none"
          style={{
            background: "#13131F",
            border: "1px solid #2D2D4E",
            color: "#F0E6FF",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
            style={{ background: "#2D2D4E", color: "#9CA3AF" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: destructive ? "#EF4444" : "#7C3AED", color: "#fff" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
