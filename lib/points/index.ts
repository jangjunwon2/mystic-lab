// 마일리지(포인트) 유틸 — 1 point = $0.01 (100 point = $1)

export const POINT_EARN_RATE = 0.05; // 구매 금액의 5% 적립
export const POINT_PER_USD = 100; // $1 = 100 point

// 구매 금액(USD)에 대한 적립 포인트
export function earnPointsForUsd(totalUsd: number): number {
  if (!totalUsd || totalUsd <= 0) return 0;
  return Math.round(totalUsd * POINT_PER_USD * POINT_EARN_RATE);
}

// 포인트 → USD 환산 (사용 시 할인액)
export function pointsToUsd(points: number): number {
  return Math.max(0, points) / POINT_PER_USD;
}

interface PointAdminClient {
  from: (table: string) => {
    select: (cols: string) => { eq: (c: string, v: string) => Promise<{ data: { amount: number }[] | null }> };
    insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
}

// 잔액 조회 (service-role 클라이언트)
export async function getPointsBalance(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
): Promise<number> {
  const { data } = await admin.from("point_transactions").select("amount").eq("user_id", userId);
  return ((data ?? []) as { amount: number }[]).reduce((s, r) => s + r.amount, 0);
}

// 포인트 트랜잭션 추가 (service-role 클라이언트)
export async function addPointTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: { userId: string; amount: number; type: "earn" | "spend" | "adjust" | "refund"; orderId?: string | null; note?: string }
): Promise<boolean> {
  if (!params.amount) return false;
  const { error } = await admin.from("point_transactions").insert({
    user_id: params.userId,
    amount: params.amount,
    type: params.type,
    order_id: params.orderId ?? null,
    note: params.note ?? null,
  });
  return !error;
}

export type { PointAdminClient };
