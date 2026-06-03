// 필수 환경변수 검증 — 누락 시 모호한 런타임 크래시 대신 명확한 진단 제공

export const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAIL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

// 누락된 필수 환경변수 목록
export function getMissingEnv(): string[] {
  return REQUIRED_ENV.filter((k) => !process.env[k] || process.env[k]?.trim() === "");
}

// 값이 반드시 있어야 하는 곳에서 사용 — 없으면 명확한 에러
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[env] 필수 환경변수 누락: ${name}`);
  return v;
}
