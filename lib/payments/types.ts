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

export interface SaveOrderInput {
  gateway: "lemon" | "toss" | "portone";
  gatewayRef: string; // payment intent or order ID from gateway
  items: CartItem[];
  customerEmail: string;
  totalUsd: number;
  totalKrw?: number;
}

// Extend here when PortOne is integrated
export type PaymentGateway = "lemon" | "toss" | "portone";
