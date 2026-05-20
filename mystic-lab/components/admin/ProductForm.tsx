"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = [
  { value: "card_magic", label: "Card Magic" },
  { value: "coin_magic", label: "Coin Magic" },
  { value: "stage_magic", label: "Stage Magic" },
  { value: "mentalism", label: "Mentalism" },
  { value: "electronic", label: "Electronic" },
  { value: "accessories", label: "Accessories" },
];

interface Translation {
  language: string;
  name: string;
  description: string;
  short_description: string;
}

interface ProductFormProps {
  productId?: string;
  initial?: {
    slug: string;
    category: string;
    price_usd: number;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    thumbnail_url: string;
    demo_video_cloudflare_id: string;
    image_urls: string[];
    translations: Translation[];
  };
}

const DEFAULT_TRANSLATIONS: Translation[] = [
  { language: "en", name: "", description: "", short_description: "" },
  { language: "ko", name: "", description: "", short_description: "" },
];

export default function ProductForm({ productId, initial }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState(initial?.category ?? "card_magic");
  const [priceUsd, setPriceUsd] = useState(initial?.price_usd?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "");
  const [demoVideoId, setDemoVideoId] = useState(initial?.demo_video_cloudflare_id ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [translations, setTranslations] = useState<Translation[]>(
    initial?.translations ?? DEFAULT_TRANSLATIONS
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTranslation(index: number, field: keyof Translation, value: string) {
    setTranslations((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      category,
      price_usd: parseFloat(priceUsd),
      stock: parseInt(stock, 10),
      is_active: isActive,
      is_featured: isFeatured,
      thumbnail_url: thumbnailUrl.trim() || null,
      demo_video_cloudflare_id: demoVideoId.trim() || null,
      image_urls: imageUrls.filter((u) => u.trim()),
      translations: translations.filter((t) => t.name.trim()),
    };

    const url = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save product.");
    }

    setSaving(false);
  }

  const inputStyle = {
    background: "#0D0D1A",
    border: "1px solid #2D2D4E",
    borderRadius: "8px",
    color: "#F0E6FF",
    padding: "8px 12px",
    width: "100%",
    fontSize: "14px",
  };

  const labelStyle = { color: "#9CA3AF", fontSize: "13px", marginBottom: "6px", display: "block" };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ background: "#EF444422", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-xl p-6 border space-y-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>Basic Info</h2>

        <div>
          <label style={labelStyle}>Slug (URL identifier)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. phantom-deck"
            required
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Price (USD)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Stock</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div className="flex items-end gap-4 pb-2">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#F0E6FF" }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              Active
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#F0E6FF" }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4"
              />
              Featured
            </label>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Thumbnail URL</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Demo Video (Cloudflare Stream ID)</label>
          <input
            value={demoVideoId}
            onChange={(e) => setDemoVideoId(e.target.value)}
            placeholder="Cloudflare Stream video ID"
            style={inputStyle}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Gallery Images (additional URLs)</label>
            <button
              type="button"
              onClick={() => setImageUrls((prev) => [...prev, ""])}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}
            >
              <Plus className="w-3 h-3" /> Add Image
            </button>
          </div>
          {imageUrls.length === 0 && (
            <p className="text-xs" style={{ color: "#6B7280" }}>No gallery images added.</p>
          )}
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setImageUrls((prev) => prev.map((u, j) => j === i ? e.target.value : u))}
                  placeholder="https://..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="w-10 h-10 object-cover rounded" style={{ border: "1px solid #2D2D4E", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                  className="p-1.5 rounded transition-opacity hover:opacity-80"
                  style={{ color: "#EF4444", flexShrink: 0 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Translations */}
      <section className="rounded-xl p-6 border space-y-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>Product Translations</h2>

        {translations.map((t, i) => (
          <div key={t.language} className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-mono uppercase"
                style={{ background: "#2D2D4E", color: "#A855F7" }}
              >
                {t.language}
              </span>
              {i === 0 && (
                <span className="text-xs" style={{ color: "#9CA3AF" }}>
                  (required)
                </span>
              )}
            </div>

            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={t.name}
                onChange={(e) => updateTranslation(i, "name", e.target.value)}
                required={i === 0}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Short Description</label>
              <input
                value={t.short_description}
                onChange={(e) => updateTranslation(i, "short_description", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Full Description</label>
              <textarea
                value={t.description}
                onChange={(e) => updateTranslation(i, "description", e.target.value)}
                rows={4}
                required={i === 0}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {i < translations.length - 1 && (
              <hr style={{ borderColor: "#2D2D4E" }} />
            )}
          </div>
        ))}
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #2D2D4E" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
