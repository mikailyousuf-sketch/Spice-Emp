"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearCartCookie, getCartSnapshot } from "@/lib/cart";
import { getCurrentUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const checkoutSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().max(120).optional(),
  line1: z.string().trim().min(3).max(180),
  line2: z.string().trim().max(180).optional(),
  suburb: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(12),
  notes: z.string().trim().max(1000).optional(),
});

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `SE-${date}-${suffix}`;
}

export async function createOrder(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    company: formData.get("company") || undefined,
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    suburb: formData.get("suburb") || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect("/checkout?error=Please%20check%20your%20delivery%20details.");
  }

  const cart = await getCartSnapshot();

  if (!cart?.items?.length) {
    redirect("/cart?error=Your%20cart%20is%20empty.");
  }

  const admin = createAdminClient();
  const userId = await getCurrentUserId();

  const normalized = cart.items.flatMap((item) => {
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants;
    const product = Array.isArray(variant?.products)
      ? variant?.products[0]
      : variant?.products;

    if (!variant || !product || !variant.is_active || !product.is_active) return [];

    return [{
      item,
      variant,
      product,
      quantity: Number(item.quantity),
      stock: Number(variant.stock_quantity),
    }];
  });

  if (!normalized.length || normalized.length !== cart.items.length) {
    redirect("/cart?error=One%20or%20more%20cart%20items%20are%20no%20longer%20available.");
  }

  const unavailable = normalized.find(({ quantity, stock }) => quantity > stock);

  if (unavailable) {
    redirect("/cart?error=One%20or%20more%20quantities%20exceed%20available%20stock.");
  }

  const subtotalCents = normalized.reduce(
    (sum, row) => sum + Math.round(row.quantity * row.variant.retail_price_cents),
    0,
  );

  const shippingCents = 0;
  const discountCents = 0;
  const taxCents = 0;
  const totalCents = subtotalCents + shippingCents - discountCents + taxCents;

  const address = {
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    company: parsed.data.company ?? null,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? null,
    suburb: parsed.data.suburb ?? null,
    city: parsed.data.city,
    province: parsed.data.province,
    postal_code: parsed.data.postalCode,
    country_code: "ZA",
  };

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: makeOrderNumber(),
      user_id: userId,
      source_cart_id: cart.id,
      email: parsed.data.email,
      phone: parsed.data.phone,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      discount_cents: discountCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      shipping_address: address,
      billing_address: address,
      notes: parsed.data.notes ?? null,
    })
    .select("id,order_number,order_access_token")
    .single();

  if (orderError || !order) {
    redirect(`/checkout?error=${encodeURIComponent(orderError?.message ?? "Could not create order.")}`);
  }

  const orderItems = normalized.map(({ item, variant, product, quantity }) => ({
    order_id: order.id,
    product_id: product.id,
    variant_id: variant.id,
    product_name_snapshot: product.name,
    variant_name_snapshot: `${variant.weight_value}${variant.weight_unit}`,
    sku_snapshot: variant.sku,
    quantity,
    unit_price_cents: variant.retail_price_cents,
    total_price_cents: Math.round(quantity * variant.retail_price_cents),
  }));

  const { error: itemsError } = await admin.from("order_items").insert(orderItems);

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    redirect(`/checkout?error=${encodeURIComponent(itemsError.message)}`);
  }

  const reserved: Array<{ variantId: string; quantity: number }> = [];

  for (const row of normalized) {
    const { data: decremented, error: stockError } = await admin.rpc(
      "decrement_variant_stock",
      {
        target_variant_id: row.variant.id,
        requested_quantity: row.quantity,
      },
    );

    if (stockError || !decremented) {
      for (const restore of reserved) {
        await admin.rpc("increment_variant_stock", {
          target_variant_id: restore.variantId,
          restore_quantity: restore.quantity,
        });
      }

      await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      redirect("/cart?error=Stock%20changed%20during%20checkout.%20Please%20review%20your%20cart.");
    }

    reserved.push({ variantId: row.variant.id, quantity: row.quantity });
  }

  await admin
    .from("carts")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("id", cart.id);

  await clearCartCookie();

  redirect(`/order-confirmation/${order.order_access_token}`);
}
