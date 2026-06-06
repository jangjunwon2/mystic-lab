"use client";

import TriggerCouponCard, { TriggerCouponConfig } from "./TriggerCouponCard";

export type { TriggerCouponConfig as CartCoupon };

export default function CartCouponCard({ initial }: { initial: TriggerCouponConfig }) {
  return (
    <TriggerCouponCard
      initial={initial}
      title="장바구니 잔존 쿠폰"
      description="장바구니에 담아두고 일정 기간 방문하지 않은 회원에게 <b>그 상품 한정 쿠폰</b>을 자동 발급(일 1회 cron). 장바구니 방문 시 자동 동기화 선행 필요."
      settingKey="cartCoupon"
      dayLabel="일 미방문"
      namePlaceholder="장바구니 특별 할인"
    />
  );
}
