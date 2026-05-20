"use client";

import { useState } from "react";

const TEMPLATES = [
  {
    label: "New Product Launch",
    subject: "✦ New Magic at Mystic Lab — Don't Miss It",
    html: `<div style="font-family:Inter,Arial,sans-serif;background:#0D0D1A;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:32px;text-align:center;">
      <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;">✦ MYSTIC LAB ✦</div>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#F0E6FF;margin:0 0 16px;">Something New Has Arrived</h2>
      <p style="color:#9CA3AF;line-height:1.7;">We have a stunning new addition to our collection that we think you'll love. Crafted for professionals who demand the very best.</p>
      <div style="text-align:center;margin-top:28px;">
        <a href="https://mysticlab.com/products" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;">
          Explore Now →
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
      <p style="color:#6B7280;font-size:12px;margin:0;">You're receiving this because you're a Mystic Lab member.</p>
    </div>
  </div>
</div>`,
  },
  {
    label: "Exclusive Discount",
    subject: "✦ A Special Offer Just for You",
    html: `<div style="font-family:Inter,Arial,sans-serif;background:#0D0D1A;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:32px;text-align:center;">
      <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;">✦ MYSTIC LAB ✦</div>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="color:#9CA3AF;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Exclusive Member Offer</p>
      <div style="font-size:48px;font-weight:800;color:#F59E0B;letter-spacing:-1px;">10% OFF</div>
      <p style="color:#F0E6FF;margin:16px 0 8px;">Use code: <strong style="color:#A855F7;font-size:18px;">MAGIC10</strong></p>
      <p style="color:#9CA3AF;font-size:13px;">Valid for the next 48 hours only.</p>
      <div style="margin-top:28px;">
        <a href="https://mysticlab.com/products" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;">
          Shop Now →
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
      <p style="color:#6B7280;font-size:12px;margin:0;">You're receiving this because you're a Mystic Lab member.</p>
    </div>
  </div>
</div>`,
  },
];

export default function NewsletterClient() {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [segment, setSegment] = useState<"all" | "buyers">("all");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; message?: string } | null>(null);
  const [error, setError] = useState("");

  function loadTemplate(idx: number) {
    setSubject(TEMPLATES[idx].subject);
    setHtml(TEMPLATES[idx].html);
    setError("");
    setResult(null);
  }

  async function send() {
    if (!subject.trim() || !html.trim()) {
      setError("Subject and HTML body are required.");
      return;
    }
    if (!confirm(`Send newsletter to "${segment === "all" ? "ALL members" : "buyers only"}"? This cannot be undone.`)) return;

    setSending(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html, segment }),
    });

    const json = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to send newsletter.");
    } else {
      setResult(json);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Template selector */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-3" style={{ color: "#9CA3AF" }}>
          Quick Templates
        </p>
        <div className="flex gap-3">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => loadTemplate(i)}
              className="px-4 py-2 rounded-lg text-sm border transition-colors hover:border-purple-500"
              style={{ background: "#1A1A2E", borderColor: "#2D2D4E", color: "#F0E6FF" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Segment */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: "#9CA3AF" }}>
          Recipients
        </label>
        <div className="flex gap-4">
          {(["all", "buyers"] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={s}
                checked={segment === s}
                onChange={() => setSegment(s)}
                style={{ accentColor: "#7C3AED" }}
              />
              <span className="text-sm" style={{ color: "#F0E6FF" }}>
                {s === "all" ? "All Members" : "Buyers Only"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: "#9CA3AF" }}>
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line..."
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border focus:border-purple-500 transition-colors"
          style={{ background: "#1A1A2E", borderColor: "#2D2D4E", color: "#F0E6FF" }}
        />
      </div>

      {/* HTML Body */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
            HTML Body
          </label>
          <button
            onClick={() => setPreview(!preview)}
            className="text-xs px-3 py-1 rounded border transition-colors hover:border-purple-500"
            style={{ borderColor: "#2D2D4E", color: "#A855F7" }}
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview ? (
          <div
            className="w-full rounded-lg border overflow-auto"
            style={{ background: "#fff", borderColor: "#2D2D4E", minHeight: 300 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<div>Your email HTML here...</div>"
            rows={14}
            className="w-full px-4 py-3 rounded-lg text-sm font-mono outline-none border focus:border-purple-500 transition-colors resize-y"
            style={{ background: "#1A1A2E", borderColor: "#2D2D4E", color: "#F0E6FF" }}
          />
        )}
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}

      {result && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm"
          style={{ background: "#10B98122", borderColor: "#10B981", border: "1px solid" }}
        >
          <span style={{ color: "#10B981" }}>
            {result.message ?? `Sent to ${result.sent} recipient${result.sent !== 1 ? "s" : ""}.`}
            {result.failed > 0 && (
              <span style={{ color: "#F59E0B" }}> ({result.failed} failed)</span>
            )}
          </span>
        </div>
      )}

      <button
        onClick={send}
        disabled={sending}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" }}
      >
        {sending ? "Sending…" : "Send Newsletter"}
      </button>
    </div>
  );
}
