export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
  bundle_id?: string; // 세트 구성품일 경우 해당 세트 ID (서버 가격 재계산용)
  option_id?: string; // 선택한 구매 옵션 ID (서버 가격 재계산용)
  option_name?: string; // 선택한 옵션명 (주문 기록·배송용)
}

export interface OrderPayload {
  items: CartItem[];
  customerEmail: string;
  locale: string;
}

export interface ShippingAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  postal_code?: string;
  country?: string;
}

export interface SaveOrderInput {
  gateway: "lemon" | "toss";
  gatewayRef: string;
  items: CartItem[];
  customerEmail: string;
  totalUsd: number;
  totalKrw?: number;
  userId?: string | null; // 체크아웃에서 캡처한 로그인 회원 ID — 게이트웨이 이메일과 무관하게 주문 연결(우선 사용, 없으면 이메일 역추적)
  appliedDiscountCode?: string;
  appliedReferralCode?: string;
  appliedCouponCode?: string; // 개인 발급 쿠폰(issued_coupons) 코드 — 결제 성공 시 사용 처리
  customerNote?: string;
  shippingAddress?: ShippingAddress;
  shippingMethod?: string;
  pointsSpent?: number; // 결제 시 사용한 마일리지(포인트) — 결제 성공 후 차감 기록
  pointsHoldRef?: string; // 포인트 예약(hold) 식별자 — 정산 시 해당 hold consume (미지정 시 gatewayKey)
}

export type PaymentGateway = "lemon" | "toss";
