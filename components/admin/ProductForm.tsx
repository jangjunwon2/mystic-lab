"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2, Wand2, GripVertical } from "lucide-react";

const CATEGORIES = [
  { value: "card_magic", label: "Card Magic" },
  { value: "stage_magic", label: "Stage Magic" },
  { value: "coin_magic", label: "Coin Magic" },
  { value: "mentalism", label: "Mentalism" },
  { value: "electronic", label: "Electronic" },
  { value: "accessories", label: "Accessories" },
];

const ALL_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

interface Translation {
  language: string;
  name: string;
  description: string;
  short_description: string;
}

interface OptionItemRow {
  product_id: string;
  quantity: string;
}

interface ProductOptionRow {
  name: string;
  price_delta_usd: string;
  items: OptionItemRow[];
  pricing_mode: "discount" | "fixed";
  discount_percent: string;
  set_price_usd: string;
}

export interface AdminProductLite {
  id: string;
  name: string;
  price_usd: number;
}

interface InitialOption {
  name: string;
  price_delta_usd: number;
  set_price_usd: number | null;
  discount_percent: number | null;
  items: { product_id: string; quantity: number }[];
}

interface ProductFormProps {
  productId?: string;
  allProducts?: AdminProductLite[];
  initial?: {
    slug: string;
    category: string;
    price_usd: number;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    is_digital?: boolean;
    thumbnail_url: string;
    demo_video_cloudflare_id: string;
    image_urls: string[];
    translations: Translation[];
    options?: InitialOption[];
  };
}

const DEFAULT_TRANSLATIONS: Translation[] = ALL_LANGUAGES.map((l) => ({
  language: l.code,
  name: "",
  description: "",
  short_description: "",
}));

function extractGoogleDriveId(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];
  return null;
}

function convertGoogleDriveLink(url: string): string {
  const id = extractGoogleDriveId(url);
  if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
  return url;
}

function extractYoutubeId(input: string): string | null {
  // Already stored as yt:ID
  if (input.startsWith("yt:")) return input.slice(3);
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = input.match(pat);
    if (m) return m[1];
  }
  // Raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return null;
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/products/upload", { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? "Upload failed");
  }
  const data = await res.json() as { url: string };
  return data.url;
}

export default function ProductForm({ productId, initial, allProducts = [] }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState(initial?.category ?? "card_magic");
  const [priceUsd, setPriceUsd] = useState(initial?.price_usd?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [isDigital, setIsDigital] = useState(initial?.is_digital ?? false);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [options, setOptions] = useState<ProductOptionRow[]>(
    initial?.options?.map((o) => ({
      name: o.name,
      price_delta_usd: o.price_delta_usd.toString(),
      items: (o.items ?? []).map((it) => ({ product_id: it.product_id, quantity: it.quantity.toString() })),
      pricing_mode: o.set_price_usd != null ? "fixed" : "discount",
      discount_percent: o.discount_percent != null ? o.discount_percent.toString() : "",
      set_price_usd: o.set_price_usd != null ? o.set_price_usd.toString() : "",
    })) ?? []
  );
  const [translations, setTranslations] = useState<Translation[]>(
    initial?.translations?.length
      ? ALL_LANGUAGES.map((l) => {
          const existing = initial.translations.find((t) => t.language === l.code);
          return existing ?? { language: l.code, name: "", description: "", short_description: "" };
        })
      : DEFAULT_TRANSLATIONS
  );
  const initialDemoType = initial?.demo_video_cloudflare_id?.startsWith("yt:") ? "youtube" : "cloudflare";
  const initialDemoValue = initial?.demo_video_cloudflare_id?.startsWith("yt:")
    ? initial.demo_video_cloudflare_id.slice(3)
    : (initial?.demo_video_cloudflare_id ?? "");

  const [demoVideoType, setDemoVideoType] = useState<"cloudflare" | "youtube">(initialDemoType);
  const [demoVideoInput, setDemoVideoInput] = useState(initialDemoValue);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  function updateTranslation(index: number, field: keyof Translation, value: string) {
    setTranslations((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setThumbnailUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "썸네일 업로드 실패");
    }
    setUploadingThumb(false);
    e.target.value = "";
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    setError(null);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setImageUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "갤러리 업로드 실패");
    }
    setUploadingGallery(false);
    e.target.value = "";
  }

  async function handleAutoTranslate() {
    const koIdx = translations.findIndex((t) => t.language === "ko");
    const koTrans = translations[koIdx];
    if (!koTrans?.name?.trim()) {
      setTranslateError("한국어 이름을 먼저 입력하세요 (ko Name 필드)");
      return;
    }
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: koTrans.name,
          short_description: koTrans.short_description,
          description: koTrans.description,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Translation failed");
      }
      const data = await res.json() as { translations: Record<string, { name: string; short_description: string; description: string }> };
      setTranslations((prev) =>
        prev.map((t) => {
          if (t.language === "ko") return t;
          const translated = data.translations[t.language];
          if (!translated) return t;
          return {
            ...t,
            name: translated.name || t.name,
            short_description: translated.short_description || t.short_description,
            description: translated.description || t.description,
          };
        })
      );
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Translation failed");
    }
    setTranslating(false);
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
      is_digital: isDigital,
      thumbnail_url: thumbnailUrl.trim() || null,
      demo_video_cloudflare_id: (() => {
        const v = demoVideoInput.trim();
        if (!v) return null;
        if (demoVideoType === "youtube") {
          const ytId = extractYoutubeId(v);
          return ytId ? `yt:${ytId}` : null;
        }
        return v;
      })(),
      image_urls: imageUrls.filter((u) => u.trim()),
      translations: translations.filter((t) => t.name.trim()),
      options: options
        .filter((o) => o.name.trim())
        .map((o) => {
          const items = o.items
            .filter((it) => it.product_id)
            .map((it) => ({ product_id: it.product_id, quantity: Math.max(1, parseInt(it.quantity, 10) || 1) }));
          if (items.length > 0) {
            // 세트: 고정가 또는 할인율
            return {
              name: o.name.trim(),
              price_delta_usd: 0,
              items,
              set_price_usd: o.pricing_mode === "fixed" ? (parseFloat(o.set_price_usd) || 0) : null,
              discount_percent: o.pricing_mode === "discount" ? (parseInt(o.discount_percent, 10) || 0) : null,
            };
          }
          // 단순 추가옵션
          return {
            name: o.name.trim(),
            price_delta_usd: parseFloat(o.price_delta_usd) || 0,
            items: [],
            set_price_usd: null,
            discount_percent: null,
          };
        }),
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
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "상품 저장 실패.");
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

  const labelStyle: React.CSSProperties = {
    color: "#9CA3AF",
    fontSize: "13px",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ background: "#EF444422", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-xl p-6 border space-y-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>기본 정보</h2>

        <div>
          <label style={labelStyle}>Slug (URL 식별자)</label>
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
            <label style={labelStyle}>카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>가격 (USD)</label>
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
            <label style={labelStyle}>재고</label>
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
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
              활성
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#F0E6FF" }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4" />
              추천
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: "#F0E6FF" }} title="체크 시 배송 없이 결제 즉시 배송완료 처리 → 구매 직후 리뷰 작성 가능 (앱·다운로드 등)">
              <input type="checkbox" checked={isDigital} onChange={(e) => setIsDigital(e.target.checked)} className="w-4 h-4" />
              디지털 상품
            </label>
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label style={labelStyle}>썸네일 이미지</label>
          <div className="flex items-start gap-3">
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="thumbnail"
                className="w-16 h-16 object-cover rounded"
                style={{ border: "1px solid #2D2D4E", flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="flex-1 space-y-2">
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.includes("drive.google.com")) {
                    setThumbnailUrl(convertGoogleDriveLink(v));
                  } else {
                    setThumbnailUrl(v);
                  }
                }}
                placeholder="https://... · 구글 드라이브 링크 자동 변환 · 또는 아래에서 업로드"
                style={inputStyle}
              />
              <div className="flex items-center gap-2">
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploadingThumb}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid #4C1D95" }}
                >
                  {uploadingThumb ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploadingThumb ? "업로드 중…" : "파일 업로드"}
                </button>
                <span className="text-xs" style={{ color: "#6B7280" }}>JPEG, PNG, WebP, GIF · 최대 10MB</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>데모 영상</label>
          <div className="flex gap-2 mb-2">
            {(["cloudflare", "youtube"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setDemoVideoType(type); setDemoVideoInput(""); }}
                className="px-3 py-1 rounded text-xs font-medium transition-all"
                style={{
                  background: demoVideoType === type ? "#7C3AED" : "rgba(124,58,237,0.1)",
                  color: demoVideoType === type ? "#fff" : "#A855F7",
                  border: `1px solid ${demoVideoType === type ? "#7C3AED" : "#4C1D95"}`,
                }}
              >
                {type === "cloudflare" ? "☁ Cloudflare Stream" : "▶ YouTube"}
              </button>
            ))}
          </div>
          <input
            value={demoVideoInput}
            onChange={(e) => setDemoVideoInput(e.target.value)}
            placeholder={
              demoVideoType === "cloudflare"
                ? "Cloudflare Stream 영상 ID"
                : "YouTube URL 또는 영상 ID (예: dQw4w9WgXcQ)"
            }
            style={inputStyle}
          />
          {demoVideoType === "youtube" && demoVideoInput && (() => {
            const id = extractYoutubeId(demoVideoInput);
            return id ? (
              <p className="text-xs mt-1" style={{ color: "#34D399" }}>✓ YouTube ID: {id}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "#F59E0B" }}>YouTube URL 또는 11자리 영상 ID를 입력하세요</p>
            );
          })()}
        </div>

        {/* Gallery Images */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label style={{ ...labelStyle, marginBottom: 0 }}>갤러리 이미지</label>
            <div className="flex items-center gap-2">
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}
              >
                {uploadingGallery ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploadingGallery ? "업로드 중…" : "업로드"}
              </button>
              <button
                type="button"
                onClick={() => setImageUrls((prev) => [...prev, ""])}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.1)", color: "#A855F7" }}
              >
                <Plus className="w-3 h-3" /> URL 추가
              </button>
            </div>
          </div>
          {imageUrls.length === 0 && (
            <p className="text-xs" style={{ color: "#6B7280" }}>갤러리 이미지가 없습니다.</p>
          )}
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => { dragIndexRef.current = i; }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => {
                  const from = dragIndexRef.current;
                  if (from === null || from === i) return;
                  setImageUrls((prev) => {
                    const next = [...prev];
                    const [moved] = next.splice(from, 1);
                    next.splice(i, 0, moved);
                    return next;
                  });
                  dragIndexRef.current = null;
                }}
                onDragEnd={() => { dragIndexRef.current = null; }}
                className="flex items-center gap-2"
                style={{ cursor: "grab" }}
              >
                <GripVertical className="w-4 h-4 shrink-0" style={{ color: "#4B5563" }} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setImageUrls((prev) => prev.map((u, j) => j === i ? e.target.value : u))}
                  placeholder="https://..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="w-10 h-10 object-cover rounded"
                    style={{ border: "1px solid #2D2D4E", flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
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

      {/* Purchase Options */}
      <section className="rounded-xl p-6 border space-y-4" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>구매 옵션 (추가 구성·세트)</h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
              상품 상세에 드롭다운으로 노출됩니다. <b className="text-[#9CA3AF]">기존 상품을 결합</b>해 세트로 팔 수 있고(가격 자동 연동), 구성 상품을 비워두면 단순 추가옵션(가격차)으로 동작합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, { name: "", price_delta_usd: "0", items: [], pricing_mode: "discount", discount_percent: "10", set_price_usd: "" }])}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 shrink-0"
            style={{ background: "rgba(124,58,237,0.1)", color: "#A855F7" }}
          >
            <Plus className="w-3 h-3" /> 옵션 추가
          </button>
        </div>

        {options.length === 0 ? (
          <p className="text-xs" style={{ color: "#6B7280" }}>등록된 옵션이 없습니다. (구매 시 &lsquo;기본 구성&rsquo;만 표시)</p>
        ) : (
          <div className="space-y-4">
            {options.map((o, i) => {
              const hostPrice = parseFloat(priceUsd) || 0;
              const compTotal = o.items.reduce((s, it) => {
                const p = allProducts.find((ap) => ap.id === it.product_id);
                return s + (p ? p.price_usd * (parseInt(it.quantity, 10) || 1) : 0);
              }, 0);
              const base = hostPrice + compTotal;
              const isSet = o.items.length > 0;
              const preview = !isSet
                ? Math.max(0, hostPrice + (parseFloat(o.price_delta_usd) || 0))
                : o.pricing_mode === "fixed"
                  ? Math.max(0, parseFloat(o.set_price_usd) || 0)
                  : Math.max(0, Math.round(base * (1 - (parseInt(o.discount_percent, 10) || 0) / 100) * 100) / 100);
              const update = (patch: Partial<ProductOptionRow>) =>
                setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <div key={i} className="rounded-lg border p-3 space-y-3" style={{ borderColor: "#2D2D4E", background: "#13131F" }}>
                  <div className="flex items-center gap-2">
                    <input
                      value={o.name}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder="옵션명 (예: 프로 세트, 전용 케이스 추가)"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                      className="p-1.5 rounded transition-opacity hover:opacity-80 shrink-0"
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 구성 상품 (기존 상품 결합) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>결합할 구성 상품 (이 상품 + 선택 상품 = 세트)</span>
                      <button
                        type="button"
                        onClick={() => update({ items: [...o.items, { product_id: "", quantity: "1" }] })}
                        className="text-xs px-2 py-0.5 rounded transition-opacity hover:opacity-80"
                        style={{ background: "rgba(124,58,237,0.1)", color: "#A855F7" }}
                      >
                        + 상품 추가
                      </button>
                    </div>
                    {o.items.map((it, k) => (
                      <div key={k} className="flex items-center gap-2">
                        <select
                          value={it.product_id}
                          onChange={(e) => update({ items: o.items.map((x, m) => (m === k ? { ...x, product_id: e.target.value } : x)) })}
                          style={{ ...inputStyle, flex: 1 }}
                        >
                          <option value="">상품 선택…</option>
                          {allProducts.filter((ap) => ap.id !== productId).map((ap) => (
                            <option key={ap.id} value={ap.id}>{ap.name} (${ap.price_usd})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => update({ items: o.items.map((x, m) => (m === k ? { ...x, quantity: e.target.value } : x)) })}
                          style={{ ...inputStyle, width: "64px" }}
                        />
                        <button
                          type="button"
                          onClick={() => update({ items: o.items.filter((_, m) => m !== k) })}
                          className="p-1.5 rounded transition-opacity hover:opacity-80 shrink-0"
                          style={{ color: "#EF4444" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 가격 */}
                  {isSet ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3">
                        {(["discount", "fixed"] as const).map((m) => (
                          <label key={m} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "#F0E6FF" }}>
                            <input type="radio" checked={o.pricing_mode === m} onChange={() => update({ pricing_mode: m })} className="accent-[#7C3AED]" />
                            {m === "discount" ? "할인율(%)" : "고정 세트가($)"}
                          </label>
                        ))}
                      </div>
                      {o.pricing_mode === "discount" ? (
                        <input type="number" min="0" max="90" value={o.discount_percent} onChange={(e) => update({ discount_percent: e.target.value })} placeholder="할인 %" style={{ ...inputStyle, width: "90px" }} />
                      ) : (
                        <input type="number" min="0" step="0.01" value={o.set_price_usd} onChange={(e) => update({ set_price_usd: e.target.value })} placeholder="세트가 $" style={{ ...inputStyle, width: "110px" }} />
                      )}
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        개별 합계 ${base.toFixed(2)} → <b className="text-[#A855F7]">판매가 ${preview.toFixed(2)}</b>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>추가 요금 +$</span>
                      <input type="number" step="0.01" value={o.price_delta_usd} onChange={(e) => update({ price_delta_usd: e.target.value })} placeholder="0" style={{ ...inputStyle, width: "110px" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>판매가 <b className="text-[#A855F7]">${preview.toFixed(2)}</b></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Translations */}
      <section className="rounded-xl p-6 border space-y-6" style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: "#F0E6FF" }}>상품 번역</h2>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={translating}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B44" }}
            >
              {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              {translating ? "번역 중…" : "한국어(ko)에서 자동 번역"}
            </button>
            {translateError && (
              <p className="text-xs" style={{ color: "#EF4444" }}>{translateError}</p>
            )}
            <p className="text-xs" style={{ color: "#6B7280" }}>
              ANTHROPIC_API_KEY 환경변수 필요
            </p>
          </div>
        </div>

        {translations.map((t, i) => (
          <div key={t.language} className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-mono uppercase"
                style={{ background: "#2D2D4E", color: "#A855F7" }}
              >
                {t.language}
              </span>
              <span className="text-xs" style={{ color: "#9CA3AF" }}>
                {ALL_LANGUAGES.find((l) => l.code === t.language)?.label}
                {t.language === "ko" && <span style={{ color: "#F59E0B" }}> ← 자동 번역 소스</span>}
              </span>
            </div>

            <div>
              <label style={labelStyle}>이름</label>
              <input
                value={t.name}
                onChange={(e) => updateTranslation(i, "name", e.target.value)}
                required={t.language === "en"}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>짧은 설명</label>
              <input
                value={t.short_description}
                onChange={(e) => updateTranslation(i, "short_description", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>전체 설명</label>
              <textarea
                value={t.description}
                onChange={(e) => updateTranslation(i, "description", e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {i < translations.length - 1 && <hr style={{ borderColor: "#2D2D4E" }} />}
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
          {saving ? "저장 중…" : isEdit ? "변경 저장" : "상품 생성"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ background: "transparent", color: "#9CA3AF", border: "1px solid #2D2D4E" }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
