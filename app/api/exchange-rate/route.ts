import { NextResponse } from "next/server";

const FALLBACK_RATE = 1380;
const CACHE_TTL_MS = 60 * 60 * 1000;

let cachedRate = FALLBACK_RATE;
let cacheExpiry = 0;

export async function GET() {
  if (Date.now() < cacheExpiry) {
    return NextResponse.json({ usd_to_krw: cachedRate });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json() as { result: string; rates: Record<string, number> };
      if (json.result === "success" && typeof json.rates.KRW === "number") {
        cachedRate = Math.round(json.rates.KRW);
        cacheExpiry = Date.now() + CACHE_TTL_MS;
      }
    }
  } catch {
    // fallback 유지
  }

  return NextResponse.json({ usd_to_krw: cachedRate });
}
