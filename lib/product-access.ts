// 회원이 특정 상품(장치)을 보유(구매)했는지 검증 — 커뮤니티·해법영상 등 구매자 게이트 공용.
// 보유 조건: 결제완료+ 주문에 해당 상품 포함 OR 해당 상품의 인증코드(product_unlock_codes) 보유.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function userOwnsProduct(admin: any, userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false;

  const { data: orderItem } = await admin
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .in("orders.status", ["paid", "shipped", "completed"])
    .limit(1)
    .maybeSingle();
  if (orderItem) return true;

  // 디지털 앱(계산기·인스타 등): 인증코드 회원 귀속(019)으로 보유 인정. 컬럼 미배포 시 무시.
  try {
    const { data: code } = await admin
      .from("product_unlock_codes")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (code) return true;
  } catch {
    // user_id 컬럼(019) 미배포 — 주문 기준만 사용
  }

  // 수동 권한 부여(manual_video_grants) 보유 인정
  try {
    const { data: grant } = await admin
      .from("manual_video_grants")
      .select("id, expires_at")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (grant) {
      if (!grant.expires_at || new Date(grant.expires_at) > new Date()) {
        return true;
      }
    }
  } catch {
    // 테이블 또는 컬럼 오류 무시
  }

  return false;
}
