import { createClient } from "./server";
import type { ProductCategory } from "./types";

export async function getProducts({
  category,
  featured,
  limit = 20,
  offset = 0,
}: {
  category?: ProductCategory;
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, product_translations!inner(*)")
    .eq("is_active", true)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (featured !== undefined) query = query.eq("is_featured", featured);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string, language = "en") {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_translations (*)
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return product;
}

export async function getFeaturedProducts(language = "en") {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_translations(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return data ?? [];
}

export async function getReviewsByProduct(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(display_name, avatar_url)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUserOrders(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (*, product_translations (*))
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function hasUserPurchasedProduct(userId: string, productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .in("orders.status", ["paid", "shipped", "completed"])
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function getSolutionVideoForProduct(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("solution_videos")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) return null;
  return data;
}
