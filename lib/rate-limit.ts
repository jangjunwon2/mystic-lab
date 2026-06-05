import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory 폴백 — Upstash 미설정 또는 장애 시 사용.
// 주의: 서버리스에서는 인스턴스별로 분리되므로 전역 제한은 보장되지 않는다(Upstash 설정 시 해소).
const memStore = new Map<string, { count: number; resetAt: number }>();

function memCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Upstash Redis — 환경변수(UPSTASH_REDIS_REST_URL·_TOKEN) 설정 시에만 활성.
// undefined = 미초기화, null = 미설정(폴백 사용).
let redis: Redis | null | undefined;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

/**
 * IP·동작별 요청 제한. Upstash 설정 시 글로벌(슬라이딩 윈도우), 미설정 시 in-memory 폴백.
 * @returns true = 허용, false = 한도 초과
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return memCheck(key, limit, windowMs);

  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  const lkey = `${limit}:${seconds}`;
  let limiter = limiters.get(lkey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
      prefix: "ml_rl",
      analytics: false,
    });
    limiters.set(lkey, limiter);
  }

  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    // Redis 장애 — 폴백(요청을 막지 않도록 in-memory로 처리)
    return memCheck(key, limit, windowMs);
  }
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
