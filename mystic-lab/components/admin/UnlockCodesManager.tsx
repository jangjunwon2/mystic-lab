"use client";

import { useState } from "react";

interface Product {
  id: string;
  slug: string;
  name: string;
}

interface CodeRow {
  id: string;
  product_id: string;
  created_at: string;
  first_used_at: string | null;
  product_name: string;
}

interface Props {
  products: Product[];
  codes: CodeRow[];
}

export default function UnlockCodesManager({ products, codes: initialCodes }: Props) {
  const [codes, setCodes] = useState(initialCodes);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<{ plain: string; productName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateCode() {
    if (!selectedProductId) return;
    setGenerating(true);
    setError(null);
    setNewCode(null);

    const res = await fetch("/api/admin/unlock-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: selectedProductId }),
    });

    if (res.ok) {
      const data = await res.json();
      const productName = products.find((p) => p.id === selectedProductId)?.name ?? "Unknown";
      setNewCode({ plain: data.code, productName });
      setCodes((prev) => [
        {
          id: data.id,
          product_id: selectedProductId,
          created_at: new Date().toISOString(),
          first_used_at: null,
          product_name: productName,
        },
        ...prev,
      ]);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to generate code.");
    }
    setGenerating(false);
  }

  function copyCode() {
    if (!newCode) return;
    navigator.clipboard.writeText(newCode.plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "8px 12px",
    fontSize: "14px",
  };

  return (
    <div className="space-y-6">
      {/* Generate Form */}
      <div className="rounded-xl p-6 border space-y-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>
          Generate New Code
        </h2>

        {error && (
          <p className="text-sm" style={{ color: "#EF4444" }}>
            {error}
          </p>
        )}

        {newCode && (
          <div className="p-4 rounded-lg border" style={{ background: "#0D0D1A", borderColor: "#F59E0B" }}>
            <p className="text-xs mb-1" style={{ color: "#F59E0B" }}>
              ⚠ Copy this code now — it will not be shown again!
            </p>
            <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>
              Product: {newCode.productName}
            </p>
            <div className="flex items-center gap-3">
              <code
                className="flex-1 font-mono text-lg tracking-wider"
                style={{ color: "#F0E6FF" }}
              >
                {newCode.plain}
              </code>
              <button
                onClick={copyCode}
                className="px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: "#9CA3AF" }}>
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ ...inputStyle, minWidth: "240px" }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generateCode}
            disabled={generating || !selectedProductId}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "#7C3AED", color: "#fff" }}
          >
            {generating ? "Generating…" : "Generate Code"}
          </button>
        </div>
      </div>

      {/* Code List */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#2D2D4E" }}>
          <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>
            Generated Codes ({codes.length})
          </h2>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            Plain text codes are not stored — only SHA-256 hashes. Codes shown here cannot be recovered.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #2D2D4E" }}>
                {["Product", "Code ID", "Generated", "First Used"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 font-medium" style={{ color: "#9CA3AF" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center" style={{ color: "#9CA3AF" }}>
                    No codes generated yet.
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr
                    key={code.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "#2D2D4E" }}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: "#F0E6FF" }}>
                      {code.product_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs" style={{ color: "#9CA3AF" }}>
                      {code.id.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                      {new Date(code.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {code.first_used_at ? (
                        <span style={{ color: "#10B981" }}>
                          {new Date(code.first_used_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>Not used</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
