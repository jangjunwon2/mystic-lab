// 마일리지(포인트) 유틸 — 1 point = $0.01 (100 point = $1)
// 적립분은 12개월 후 만료(FIFO 소진). 잔액·차감·만료는 DB RPC(031)가 로트 기반으로 처리하고,
// RPC 미배포 시에도 동작하도록 평면 원장 폴백을 둔다.

export const POINT_EARN_RATE = 0.05; // 구매 금액의 5% 적립
export const POINT_PER_USD = 100; // $1 = 100 point
export const POINT_EXPIRES_MONTHS = 12; // 적립 포인트 만료 기간(개월)

// 구매 금액(USD)에 대한 적립 포인트
export function earnPointsForUsd(totalUsd: number): number {
  if (!totalUsd || totalUsd <= 0) return 0;
  return Math.round(totalUsd * POINT_PER_USD * POINT_EARN_RATE);
}

// 포인트 → USD 환산 (사용 시 할인액)
export function pointsToUsd(points: number): number {
  return Math.max(0, points) / POINT_PER_USD;
}

// 잔액 조회 — RPC(로트·만료 반영) 우선, 미배포 시 평면 합계 폴백.
export async function getPointsBalance(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await admin.rpc("get_points_balance", { p_user: userId });
    if (!error && typeof data === "number") return data;
  } catch {
    // RPC 미배포 — 폴백
  }
  const { data } = await admin.from("point_transactions").select("amount").eq("user_id", userId);
  return ((data ?? []) as { amount: number }[]).reduce((s, r) => s + r.amount, 0);
}

interface AddPointsParams {
  userId: string;
  amount: number; // 양수
  type: "earn" | "adjust" | "refund";
  orderId?: string | null;
  note?: string;
  expiresMonths?: number | null; // null = 무기한
}

// 포인트 적립(양수 로트 생성) — RPC add_points(remaining·expires_at 설정) 우선, 폴백 직접 insert.
export async function addPoints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: AddPointsParams
): Promise<boolean> {
  const amount = Math.trunc(params.amount);
  if (!amount || amount <= 0) return false;
  const expiresMonths = params.expiresMonths === undefined ? POINT_EXPIRES_MONTHS : params.expiresMonths;

  try {
    const { error } = await admin.rpc("add_points", {
      p_user: params.userId,
      p_amount: amount,
      p_type: params.type,
      p_order: params.orderId ?? null,
      p_note: params.note ?? null,
      p_expires_months: expiresMonths,
    });
    if (!error) return true;
  } catch {
    // RPC 미배포 — 폴백
  }

  // 폴백: 로트 컬럼이 있으면 함께, 없으면(구 스키마) 평면 insert.
  const expiresIso =
    expiresMonths == null ? null : new Date(Date.now() + expiresMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
  const richInsert = await admin.from("point_transactions").insert({
    user_id: params.userId,
    amount,
    type: params.type,
    order_id: params.orderId ?? null,
    note: params.note ?? null,
    remaining: amount,
    expires_at: expiresIso,
  });
  if (!richInsert.error) return true;

  const { error } = await admin.from("point_transactions").insert({
    user_id: params.userId,
    amount,
    type: params.type,
    order_id: params.orderId ?? null,
    note: params.note ?? null,
  });
  return !error;
}

interface SpendPointsParams {
  userId: string;
  amount: number; // 양수(요청 차감액)
  type?: "spend" | "adjust" | "refund";
  orderId?: string | null;
  note?: string;
}

// 포인트 차감(FIFO 소진) — RPC spend_points(원자적·만료 제외) 우선, 폴백 잔액까지 차감.
// 실제 차감된 포인트(양수)를 반환한다.
export async function spendPoints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: SpendPointsParams
): Promise<number> {
  const req = Math.trunc(params.amount);
  if (!req || req <= 0) return 0;
  const type = params.type ?? "spend";

  try {
    const { data, error } = await admin.rpc("spend_points", {
      p_user: params.userId,
      p_amount: req,
      p_type: type,
      p_order: params.orderId ?? null,
      p_note: params.note ?? null,
    });
    if (!error && typeof data === "number") return data;
  } catch {
    // RPC 미배포 — 폴백
  }

  // 폴백: 평면 — 현재 잔액까지만 차감(음수 방지).
  const balance = await getPointsBalance(admin, params.userId);
  const spend = Math.min(req, balance);
  if (spend <= 0) return 0;
  const { error } = await admin.from("point_transactions").insert({
    user_id: params.userId,
    amount: -spend,
    type,
    order_id: params.orderId ?? null,
    note: params.note ?? null,
  });
  return error ? 0 : spend;
}
