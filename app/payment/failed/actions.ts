"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getPaymentProvider } from "@/lib/payments";
import { cancelOrderAndRestoreStock } from "@/lib/payments/order-state";
import { createAdminClient } from "@/lib/supabase/admin";

const tokenSchema = z.string().uuid();

export async function retryPayment(formData: FormData) {
  const token = tokenSchema.parse(formData.get("order"));
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(`
      id,order_number,order_access_token,email,total_cents,status,payment_status,
      order_items(variant_id,quantity)
    `)
    .eq("order_access_token", token)
    .maybeSingle();

  if (!order) {
    redirect("/payment/failed?error=Order%20not%20found.");
  }

  if (order.payment_status === "paid") {
    redirect(`/order-confirmation/${token}`);
  }

  const { data: previousAttempt } = await admin
    .from("payment_attempts")
    .select("provider")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const providerName = previousAttempt?.provider === "paystack" ? "paystack" : "yoco";
  const reserved: Array<{ variantId: string; quantity: number }> = [];

  for (const item of order.order_items ?? []) {
    if (!item.variant_id) continue;

    const quantity = Number(item.quantity);
    const { data: ok, error } = await admin.rpc("decrement_variant_stock", {
      target_variant_id: item.variant_id,
      requested_quantity: quantity,
    });

    if (error || !ok) {
      for (const row of reserved) {
        await admin.rpc("increment_variant_stock", {
          target_variant_id: row.variantId,
          restore_quantity: row.quantity,
        });
      }

      redirect(
        `/payment/failed?order=${token}&error=Some%20items%20are%20no%20longer%20available%20in%20the%20required%20quantity.`,
      );
    }

    reserved.push({ variantId: item.variant_id, quantity });
  }

  await admin
    .from("orders")
    .update({
      status: "pending",
      payment_status: "pending",
      fulfilment_status: "unfulfilled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const { data: attempt, error: attemptError } = await admin
    .from("payment_attempts")
    .insert({
      order_id: order.id,
      provider: providerName,
      amount_cents: order.total_cents,
      currency: "ZAR",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    await cancelOrderAndRestoreStock(order.id, null, "failed");
    redirect(
      `/payment/failed?order=${token}&error=We%20could%20not%20restart%20the%20payment.%20Please%20try%20again.`,
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) {
    await cancelOrderAndRestoreStock(order.id, attempt.id, "failed");
    redirect(
      `/payment/failed?order=${token}&error=Payment%20configuration%20is%20temporarily%20unavailable.`,
    );
  }

  let checkoutUrl: string;

  try {
    const provider = getPaymentProvider(providerName);
    const successUrl =
      providerName === "paystack"
        ? `${siteUrl}/api/payments/paystack/callback?order=${token}`
        : `${siteUrl}/api/payments/yoco/return?order=${token}`;

    const payment = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amountCents: order.total_cents,
      currency: "ZAR",
      email: order.email,
      successUrl,
      cancelUrl: `${siteUrl}/api/payments/yoco/cancel?order=${token}`,
      failureUrl: `${siteUrl}/api/payments/yoco/failure?order=${token}`,
    });

    await admin
      .from("payment_attempts")
      .update({
        status: "pending",
        provider_reference: payment.providerReference,
        provider_checkout_id: payment.providerCheckoutId ?? null,
        checkout_url: payment.checkoutUrl,
        raw_response: payment.raw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    checkoutUrl = payment.checkoutUrl;
  } catch (error) {
    await cancelOrderAndRestoreStock(
      order.id,
      attempt.id,
      "failed",
      error instanceof Error ? { message: error.message } : null,
    );

    redirect(
      `/payment/failed?order=${token}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "Payment could not be restarted.",
      )}`,
    );
  }

  redirect(checkoutUrl);
}
