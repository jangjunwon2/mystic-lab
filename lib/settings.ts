// 사이트 전역 설정(site_settings 키-값) 헬퍼. service-role(admin client)로 접근.
// 테이블 미배포(마이그레이션 034 미실행) 시에도 기본값으로 안전 동작.

import { POINT_EARN_RATE } from "@/lib/points";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSetting(admin: any, key: string, fallback: string): Promise<string> {
  try {
    const { data } = await admin.from("site_settings").select("value").eq("key", key).maybeSingle();
    return (data?.value ?? fallback) as string;
  } catch {
    return fallback;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setSetting(admin: any, key: string, value: string): Promise<boolean> {
  const { error } = await admin
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  return !error;
}

// 포인트 적립률(0~1). 설정값이 유효하지 않으면 기본 5%.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPointEarnRate(admin: any): Promise<number> {
  const raw = await getSetting(admin, "point_earn_rate", String(POINT_EARN_RATE));
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : POINT_EARN_RATE;
}
