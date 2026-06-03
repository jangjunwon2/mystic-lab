// Next.js 서버 시작 시 1회 실행 — 필수 환경변수 누락을 명확히 경고
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getMissingEnv } = await import("./lib/env");
    const missing = getMissingEnv();
    if (missing.length > 0) {
      console.warn(
        `[env] ⚠️ 필수 환경변수 누락: ${missing.join(", ")} — 관련 기능(인증·결제·어드민 등)이 정상 동작하지 않을 수 있습니다.`
      );
    }
  }
}
