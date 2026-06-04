// 장바구니(localStorage ml_cart) + 결제 대상(sessionStorage ml_checkout) 보조 유틸 (클라이언트 전용).
// 부분 결제: 장바구니에서 일부만 선택해 결제할 때 선택분을 ml_checkout 에 담아 결제 페이지로 넘긴다.

export interface StoredCartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
  option_id?: string;
  option_name?: string;
}

const keyOf = (i: { id: string; option_id?: string }) => `${i.id}::${i.option_id ?? ""}`;

// 결제 페이지로 넘길 항목 지정 (부분/바로구매 공용)
export function setCheckoutItems(items: StoredCartItem[]): void {
  try {
    sessionStorage.setItem("ml_checkout", JSON.stringify(items));
  } catch { /* ignore */ }
}

// 결제 페이지에서 결제 대상 읽기 — ml_checkout 우선, 없으면 전체 장바구니
export function readCheckoutItems(): StoredCartItem[] {
  try {
    const sel = sessionStorage.getItem("ml_checkout");
    if (sel) {
      const parsed = JSON.parse(sel);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  try {
    return JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
  } catch {
    return [];
  }
}

// 결제 완료 후 — 결제한 항목만 장바구니에서 제거 + ml_checkout 정리
export function removePaidItemsFromCart(paid: { id: string; option_id?: string }[]): void {
  try {
    const cart: StoredCartItem[] = JSON.parse(localStorage.getItem("ml_cart") ?? "[]");
    const paidKeys = new Set(paid.map(keyOf));
    const next = cart.filter((i) => !paidKeys.has(keyOf(i)));
    localStorage.setItem("ml_cart", JSON.stringify(next));
  } catch { /* ignore */ }
  try {
    sessionStorage.removeItem("ml_checkout");
  } catch { /* ignore */ }
  try {
    window.dispatchEvent(new Event("storage"));
  } catch { /* ignore */ }
}
