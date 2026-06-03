export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  quantity: number;
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
  appliedDiscountCode?: string;
  appliedReferralCode?: string;
  customerNote?: string;
  shippingAddress?: ShippingAddress;
  shippingMethod?: string;
}

export type PaymentGateway = "lemon" | "toss";
