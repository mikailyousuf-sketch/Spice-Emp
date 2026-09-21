"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateCart, getCartToken } from "@/lib/cart";

const variantIdSchema = z.string().uuid();

export async function addToCart(formData: FormData) {
  const variantId = variantIdSchema.parse(formData.get("variantId"));
  const quantity = z.coerce.number().positive().max(999).parse(formData.get("quantity") ?? 1);

  const admin = createAdminClient();
  const { data: variant, error: variantError } = await admin
    .from("product_variants")
    .select("id,is_active,stock_quantity,products(id,slug,is_active)")
    .eq("id", variantId)
    .maybeSingle();

  const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;

  if (variantError || !variant || !variant.is_active || !product?.is_active) {
    redirect("/shop?error=This%20product%20is%20not%20available.");
  }

  if (Number(variant.stock_quantity) < quantity) {
    redirect(`/spices/${product.slug}?error=Not%20enough%20stock%20is%20available.`);
  }

  const cart = await getOrCreateCart();

  const { data: existing } = await admin
    .from("cart_items")
    .select("id,quantity")
    .eq("cart_id", cart.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  const nextQuantity = Number(existing?.quantity ?? 0) + quantity;

  if (nextQuantity > Number(variant.stock_quantity)) {
    redirect(`/spices/${product.slug}?error=That%20quantity%20exceeds%20available%20stock.`);
  }

  const { error } = existing
    ? await admin
        .from("cart_items")
        .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await admin
        .from("cart_items")
        .insert({ cart_id: cart.id, variant_id: variantId, quantity });

  if (error) {
    redirect(`/spices/${product.slug}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cart");
  redirect("/cart?added=1");
}

export async function updateCartItem(formData: FormData) {
  const itemId = z.string().uuid().parse(formData.get("itemId"));
  const quantity = z.coerce.number().positive().max(999).parse(formData.get("quantity"));
  const token = await getCartToken();

  if (!token) redirect("/cart");

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("cart_items")
    .select("id,cart_id,variant_id,product_variants(stock_quantity),carts!inner(cart_token,status)")
    .eq("id", itemId)
    .eq("carts.cart_token", token)
    .eq("carts.status", "active")
    .maybeSingle();

  if (!item) redirect("/cart");

  const variant = Array.isArray(item.product_variants)
    ? item.product_variants[0]
    : item.product_variants;

  if (quantity > Number(variant?.stock_quantity ?? 0)) {
    redirect("/cart?error=Quantity%20exceeds%20available%20stock.");
  }

  const { error } = await admin
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", item.id);

  if (error) redirect(`/cart?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/cart");
  redirect("/cart?updated=1");
}

export async function removeCartItem(formData: FormData) {
  const itemId = z.string().uuid().parse(formData.get("itemId"));
  const token = await getCartToken();

  if (!token) redirect("/cart");

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("cart_items")
    .select("id,carts!inner(cart_token,status)")
    .eq("id", itemId)
    .eq("carts.cart_token", token)
    .eq("carts.status", "active")
    .maybeSingle();

  if (!item) redirect("/cart");

  await admin.from("cart_items").delete().eq("id", item.id);
  revalidatePath("/cart");
  redirect("/cart?removed=1");
}
