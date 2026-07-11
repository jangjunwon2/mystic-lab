export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "refunded";
export type CustomOrderStatus = "received" | "reviewing" | "quoted" | "in_progress" | "completed" | "rejected";
export type ProductCategory =
  | "card_magic"
  | "coin_magic"
  | "stage_magic"
  | "mentalism"
  | "electronic"
  | "accessories";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          role?: UserRole;
          display_name?: string | null;
          avatar_url?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          category: ProductCategory;
          price_usd: number;
          stock: number;
          demo_video_cloudflare_id: string | null;
          thumbnail_url: string | null;
          image_urls: string[];
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          category: ProductCategory;
          price_usd: number;
          stock?: number;
          demo_video_cloudflare_id?: string | null;
          thumbnail_url?: string | null;
          image_urls?: string[];
          is_active?: boolean;
          is_featured?: boolean;
        };
        Update: {
          slug?: string;
          category?: ProductCategory;
          price_usd?: number;
          stock?: number;
          demo_video_cloudflare_id?: string | null;
          thumbnail_url?: string | null;
          image_urls?: string[];
          is_active?: boolean;
          is_featured?: boolean;
        };
      };
      product_translations: {
        Row: {
          id: string;
          product_id: string;
          language: string;
          name: string;
          description: string;
          short_description: string | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          language: string;
          name: string;
          description: string;
          short_description?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          short_description?: string | null;
        };
      };
      solution_videos: {
        Row: {
          id: string;
          product_id: string;
          cloudflare_stream_id: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          cloudflare_stream_id: string;
          title?: string | null;
        };
        Update: {
          cloudflare_stream_id?: string;
          title?: string | null;
        };
      };
      video_chapters: {
        Row: {
          id: string;
          video_id: string;
          timestamp_seconds: number;
          created_at: string;
        };
        Insert: {
          video_id: string;
          timestamp_seconds: number;
        };
        Update: {
          timestamp_seconds?: number;
        };
      };
      video_chapter_translations: {
        Row: {
          id: string;
          chapter_id: string;
          language: string;
          description: string;
        };
        Insert: {
          chapter_id: string;
          language: string;
          description: string;
        };
        Update: {
          description?: string;
        };
      };
      product_unlock_codes: {
        Row: {
          id: string;
          product_id: string;
          code_hash: string;
          created_at: string;
          first_used_at: string | null;
        };
        Insert: {
          product_id: string;
          code_hash: string;
        };
        Update: {
          first_used_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: OrderStatus;
          total_usd: number;
          stripe_payment_intent_id: string | null;
          paypal_order_id: string | null;
          shipping_address: Json | null;
          customer_email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string | null;
          status?: OrderStatus;
          total_usd: number;
          stripe_payment_intent_id?: string | null;
          paypal_order_id?: string | null;
          shipping_address?: Json | null;
          customer_email: string;
        };
        Update: {
          status?: OrderStatus;
          stripe_payment_intent_id?: string | null;
          paypal_order_id?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price_usd: number;
          created_at: string;
        };
        Insert: {
          order_id: string;
          product_id: string;
          quantity: number;
          price_usd: number;
        };
        Update: never;
      };
      custom_order_requests: {
        Row: {
          id: string;
          name: string;
          email: string;
          description: string;
          budget_range: string;
          desired_deadline: string | null;
          image_urls: string[];
          status: CustomOrderStatus;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          email: string;
          description: string;
          budget_range: string;
          desired_deadline?: string | null;
          image_urls?: string[];
          status?: CustomOrderStatus;
        };
        Update: {
          status?: CustomOrderStatus;
          admin_notes?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          product_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          is_approved?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
