// 마일리지(포인트) 유틸 — 1 point = $0.01 (100 point = $1)
// 적립분은 12개월 후 만료(FIFO 소진). 잔액·차감·만료는 DB RPC(031)가 로트 기반으로 처리하고,
// RPC 미배포 시에도 동작하도록 평면 원장 폴백을 둔다.

export const POINT_EARN_RATE = 0.05; // 구매 금액의 5% 적립 (기본값 — 어드민 설정으로 가변)
export const POINT_PER_USD = 100; // $1 = 100 point
export const POINT_EXPIRES_MONTHS = 12; // 적립 포인트 만료 기간(개월)
export const SIGNUP_BONUS_POINTS = 200; // 가입 환영 적립 (~$2)
export const MIN_REDEEM_POINTS = 500; // 적립 사용 최소 보유 (~$5) — 미만이면 결제 사용 불가
const SIGNUP_BONUS_NOTE = "signup_bonus"; // 멱등 식별 노트(중복 지급 방지)

// 구매 금액(USD)에 대한 적립 포인트 (적립률 가변 — 미지정 시 기본값)
export function earnPointsForUsd(totalUsd: number, rate: number = POINT_EARN_RATE): number {
  if (!totalUsd || totalUsd <= 0) return 0;
  const r = typeof rate === "number" && rate > 0 ? rate : POINT_EARN_RATE;
  return Math.round(totalUsd * POINT_PER_USD * r);
}

// 가입 환영 적립 — 회원당 1회. note 기반 멱등(중복 지급 방지). 신규 시에만 지급.
export async function grantSignupBonus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
): Promise<void> {
  if (!userId) return;
  try {
    const { data: existing } = await admin
      .from("point_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("note", SIGNUP_BONUS_NOTE)
      .limit(1)
      .maybeSingle();
    if (existing) return;
    await addPoints(admin, { userId, amount: SIGNUP_BONUS_POINTS, type: "adjust", note: SIGNUP_BONUS_NOTE });
  } catch {
    /* 지급 실패는 무시(다음 호출 때 재시도) */
  }
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

interface HoldPointsParams {
  userId: string;
  amount: number; // 양수(예약 요청액)
  ref: string; // 게이트웨이 식별자(holdRef / paymentKey) — 정산 매칭·재시도 멱등
  minutes?: number; // 예약 만료(기본 30분)
}

// 포인트 예약(hold) — 가용 잔액(잔액 − 활성 hold) 한도 내에서 원자적으로 예약. 실제 예약량 반환.
// RPC(033) 우선, 미배포 시 평면 잔액까지로 폴백(예약 미기록 → 동시 race는 033 배포 후 차단).
export async function holdPoints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: HoldPointsParams
): Promise<number> {
  const req = Math.trunc(params.amount);
  if (!req || req <= 0) return 0;

  try {
    const { data, error } = await admin.rpc("hold_points", {
      p_user: params.userId,
      p_amount: req,
      p_ref: params.ref,
      p_minutes: params.minutes ?? 30,
    });
    if (!error && typeof data === "number") return data;
  } catch {
    // RPC 미배포 — 폴백
  }
  // 폴백: hold 테이블 없이 현재 잔액까지만 허용(기존 동작과 동일).
  const balance = await getPointsBalance(admin, params.userId);
  return Math.min(req, Math.max(0, balance));
}

// 예약 해제 — 결제 거부·취소 시 가용 복원. RPC(033) 우선, 미배포 시 no-op.
export async function releaseHold(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  ref: string
): Promise<void> {
  if (!ref) return;
  try {
    await admin.rpc("release_hold", { p_ref: ref });
  } catch {
    // RPC 미배포 — 폴백 없음(hold 미기록이므로 해제 불필요)
  }
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

interface ConsumeHoldParams {
  userId: string;
  ref: string; // 예약 시 사용한 ref — 해당 hold를 consumed 처리
  amount: number; // 실제 차감할 포인트(예약량 = 청구에 반영된 사용액)
  orderId?: string | null;
  note?: string;
}

// 예약 정산 — ref의 hold를 consumed 처리하고 실제 포인트를 FIFO로 차감. 실제 차감액 반환.
// RPC(033) 우선, 미배포 시 spendPoints로 폴백(기존 동작과 동일).
export async function consumeHold(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  params: ConsumeHoldParams
): Promise<number> {
  const req = Math.trunc(params.amount);
  if (!req || req <= 0) return 0;

  try {
    const { data, error } = await admin.rpc("consume_hold", {
      p_user: params.userId,
      p_ref: params.ref,
      p_amount: req,
      p_order: params.orderId ?? null,
      p_type: "spend",
      p_note: params.note ?? null,
    });
    if (!error && typeof data === "number") return data;
  } catch {
    // RPC 미배포 — 폴백
  }
  return spendPoints(admin, {
    userId: params.userId,
    amount: req,
    type: "spend",
    orderId: params.orderId ?? null,
    note: params.note,
  });
}

export async function getAccountPointsData(admin: any, userId: string) {
  await grantSignupBonus(admin, userId);
  const balance = await getPointsBalance(admin, userId);

  const { data: history } = await admin
    .from("point_transactions")
    .select("id, amount, type, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return { balance, history: history ?? [] };
}
