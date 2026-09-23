"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearCartCookie, getCartSnapshot } from "@/lib/cart";
import { getCurrentUserId } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";
import { cancelOrderAndRestoreStock } from "@/lib/payments/order-state";
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
  paymentProvider: z.enum(["yoco", "paystack"]),
  shippingMethodId: z.string().uuid(),
  deliveryLatitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]).optional(),
  deliveryLongitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]).optional(),
});

function toRad(value: number) {
  return value * Math.PI / 180;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function makeOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SE-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
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
    paymentProvider: formData.get("paymentProvider"),
    shippingMethodId: formData.get("shippingMethodId"),
    deliveryLatitude: formData.get("deliveryLatitude") || "",
    deliveryLongitude: formData.get("deliveryLongitude") || "",
  });

  if (!parsed.success) redirect("/checkout?error=Please%20check%20your%20checkout%20details.");

  const cart = await getCartSnapshot();
  if (!cart?.items?.length) redirect("/cart?error=Your%20cart%20is%20empty.");

  const admin = createAdminClient();
  const userId = await getCurrentUserId();

  const normalized = cart.items.flatMap((item) => {
    const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;
    const product = Array.isArray(variant?.products) ? variant?.products[0] : variant?.products;
    if (!variant || !product || !variant.is_active || !product.is_active) return [];
    return [{ variant, product, quantity: Number(item.quantity), stock: Number(variant.stock_quantity) }];
  });

  if (!normalized.length || normalized.length !== cart.items.length) {
    redirect("/cart?error=One%20or%20more%20cart%20items%20are%20no%20longer%20available.");
  }
  if (normalized.some(({ quantity, stock }) => quantity > stock)) {
    redirect("/cart?error=One%20or%20more%20quantities%20exceed%20available%20stock.");
  }

  const subtotalCents = normalized.reduce(
    (sum, row) => sum + Math.round(row.quantity * row.variant.retail_price_cents),
    0,
  );

  const { data: shippingMethod, error: shippingError } = await admin
    .from("shipping_methods")
    .select("id,code,name,is_active")
    .eq("id", parsed.data.shippingMethodId)
    .eq("is_active", true)
    .in("code", ["door-to-door", "pudo-locker", "uber-delivery"])
    .maybeSingle();

  if (shippingError || !shippingMethod) {
    redirect("/checkout?error=Please%20choose%20a%20valid%20delivery%20method.");
  }

  let shippingCents = 0;

  if (shippingMethod.code === "door-to-door") {
    shippingCents = 12000;
  } else if (shippingMethod.code === "pudo-locker") {
    shippingCents = 7500;
  } else {
    const { data: settings, error: settingsError } = await admin
      .from("shipping_settings")
      .select("uber_online,uber_origin_lat,uber_origin_lng,uber_radius_km,uber_fee_cents")
      .eq("id", true)
      .maybeSingle();

    if (settingsError || !settings || !settings.uber_online) {
      redirect("/checkout?error=Uber%20delivery%20is%20not%20available%20right%20now.");
    }

    const originLat = Number(settings.uber_origin_lat);
    const originLng = Number(settings.uber_origin_lng);
    const radiusKm = Number(settings.uber_radius_km);
    const deliveryLat = Number(parsed.data.deliveryLatitude);
    const deliveryLng = Number(parsed.data.deliveryLongitude);

    if (
      !Number.isFinite(originLat)
      || !Number.isFinite(originLng)
      || !Number.isFinite(radiusKm)
      || !Number.isFinite(deliveryLat)
      || !Number.isFinite(deliveryLng)
    ) {
      redirect("/checkout?error=Please%20check%20Uber%20availability%20using%20your%20delivery%20location.");
    }

    const km = distanceKm(originLat, originLng, deliveryLat, deliveryLng);
    if (km > radiusKm) {
      redirect("/checkout?error=Your%20location%20is%20outside%20the%20current%20Uber%20delivery%20radius.");
    }

    shippingCents = Math.min(10000, Math.max(0, Number(settings.uber_fee_cents) || 10000));
  }

  const shippingMethodId = shippingMethod.id;
  const shippingMethodSnapshot =
    shippingMethod.code === "door-to-door"
      ? "Door to door · The Courier Guy · 3–5 working days"
      : shippingMethod.code === "pudo-locker"
        ? "PUDO locker pickup"
        : "Uber delivery";
  const totalCents = subtotalCents + shippingCents;

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
      shipping_method_id: shippingMethodId,
      shipping_method_snapshot: shippingMethodSnapshot,
      discount_cents: 0,
      tax_cents: 0,
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

  const { error: itemsError } = await admin.from("order_items").insert(
    normalized.map(({ variant, product, quantity }) => ({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant.id,
      product_name_snapshot: product.name,
      variant_name_snapshot: `${variant.weight_value}${variant.weight_unit}`,
      sku_snapshot: variant.sku,
      quantity,
      unit_price_cents: variant.retail_price_cents,
      total_price_cents: Math.round(quantity * variant.retail_price_cents),
    })),
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    redirect(`/checkout?error=${encodeURIComponent(itemsError.message)}`);
  }

  const reserved: Array<{ variantId: string; quantity: number }> = [];
  for (const row of normalized) {
    const { data: ok, error } = await admin.rpc("decrement_variant_stock", {
      target_variant_id: row.variant.id,
      requested_quantity: row.quantity,
    });

    if (error || !ok) {
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

  const { data: attempt, error: attemptError } = await admin
    .from("payment_attempts")
    .insert({
      order_id: order.id,
      provider: parsed.data.paymentProvider,
      amount_cents: totalCents,
      currency: "ZAR",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    await cancelOrderAndRestoreStock(order.id, null, "failed");
    redirect("/checkout?error=Could%20not%20start%20the%20payment.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) {
    await cancelOrderAndRestoreStock(order.id, attempt.id, "failed");
    redirect("/checkout?error=Site%20URL%20is%20not%20configured.");
  }

  let checkoutUrl: string;

  try {
    const provider = getPaymentProvider(parsed.data.paymentProvider);
    const successUrl =
      parsed.data.paymentProvider === "paystack"
        ? `${siteUrl}/api/payments/paystack/callback?order=${order.order_access_token}`
        : `${siteUrl}/api/payments/yoco/return?order=${order.order_access_token}`;

    const payment = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amountCents: totalCents,
      currency: "ZAR",
      email: parsed.data.email,
      successUrl,
      cancelUrl: `${siteUrl}/api/payments/yoco/cancel?order=${order.order_access_token}`,
      failureUrl: `${siteUrl}/api/payments/yoco/failure?order=${order.order_access_token}`,
    });

    await admin.from("payment_attempts").update({
      status: "pending",
      provider_reference: payment.providerReference,
      provider_checkout_id: payment.providerCheckoutId ?? null,
      checkout_url: payment.checkoutUrl,
      raw_response: payment.raw,
      updated_at: new Date().toISOString(),
    }).eq("id", attempt.id);

    await admin.from("orders").update({
      payment_status: "pending",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);

    await admin.from("carts").update({
      status: "converted",
      updated_at: new Date().toISOString(),
    }).eq("id", cart.id);

    await clearCartCookie();
    checkoutUrl = payment.checkoutUrl;
  } catch (error) {
    await cancelOrderAndRestoreStock(
      order.id,
      attempt.id,
      "failed",
      error instanceof Error ? { message: error.message } : null,
    );
    redirect(`/checkout?error=${encodeURIComponent(
      error instanceof Error ? error.message : "Payment initialization failed.",
    )}`);
  }

  redirect(checkoutUrl);
}
