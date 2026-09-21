import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";

const CART_COOKIE = "spice_emp_cart";

export async function getCartToken() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value ?? null;
}

export async function getOrCreateCart() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CART_COOKIE)?.value;
  const admin = createAdminClient();
  const userId = await getCurrentUserId();

  if (existingToken) {
    const { data: existing } = await admin
      .from("carts")
      .select("id,cart_token,user_id,status")
      .eq("cart_token", existingToken)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      if (userId && existing.user_id !== userId) {
        await admin.from("carts").update({ user_id: userId }).eq("id", existing.id);
      }
      return existing;
    }
  }

  const { data: cart, error } = await admin
    .from("carts")
    .insert({ user_id: userId })
    .select("id,cart_token,user_id,status")
    .single();

  if (error || !cart) {
    throw new Error(error?.message ?? "Could not create cart.");
  }

  cookieStore.set(CART_COOKIE, cart.cart_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return cart;
}

export async function getCartSnapshot() {
  const token = await getCartToken();
  if (!token) return null;

  const admin = createAdminClient();
  const { data: cart } = await admin
    .from("carts")
    .select("id,cart_token,status")
    .eq("cart_token", token)
    .eq("status", "active")
    .maybeSingle();

  if (!cart) return null;

  const { data: items, error } = await admin
    .from("cart_items")
    .select(`
      id,quantity,variant_id,
      product_variants(
        id,sku,weight_value,weight_unit,retail_price_cents,stock_quantity,is_active,
        shipping_weight_kg,length_cm,width_cm,height_cm,
        products(id,name,slug,is_active,product_images(id,storage_path,alt_text,is_primary,sort_order))
      )
    `)
    .eq("cart_id", cart.id)
    .order("created_at");

  if (error) throw new Error(error.message);

  return { ...cart, items: items ?? [] };
}

export async function clearCartCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}
