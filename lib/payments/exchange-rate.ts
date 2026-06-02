const FALLBACK_RATE = 1380;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedRate: number = FALLBACK_RATE;
let cacheExpiry: number = 0;

export async function getUsdToKrw(): Promise<number> {
  if (Date.now() < cacheExpiry) return cachedRate;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = await res.json() as { result: string; rates: Record<string, number> };
    if (json.result === "success" && typeof json.rates.KRW === "number") {
      cachedRate = Math.round(json.rates.KRW);
      cacheExpiry = Date.now() + CACHE_TTL_MS;
    }
  } catch (err) {
    console.warn("[exchange-rate] fetch failed, using fallback:", err);
  }

  return cachedRate;
}
