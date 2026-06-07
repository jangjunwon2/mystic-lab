"use client";

import TriggerCouponCard, { TriggerCouponConfig } from "./TriggerCouponCard";

export type { TriggerCouponConfig as WishlistCoupon };

export default function WishlistCouponCard({ initial }: { initial: TriggerCouponConfig }) {
  return (
    <TriggerCouponCard
      initial={initial}
      title="위시리스트 정기 쿠폰"
      description="위시리스트에 일정 기간 담아둔 상품에 대해, 해당 회원에게 그 상품 한정 쿠폰을 자동 발급(일 1회). 재구매 유도용."
      settingKey="wishlistCoupon"
      dayLabel="일 잔존"
      namePlaceholder="위시리스트 특별 할인"
    />
  );
}
