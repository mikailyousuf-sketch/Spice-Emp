import { NextResponse } from "next/server";
import { PaystackProvider } from "@/lib/payments/paystack";
import { cancelOrderAndRestoreStock, markOrderPaid } from "@/lib/payments/order-state";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderToken = url.searchParams.get("order");
  const reference = url.searchParams.get("reference");

  if (!orderToken || !reference) {
    return NextResponse.redirect(new URL("/payment/failed", request.url));
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id,order_access_token,total_cents")
    .eq("order_access_token", orderToken)
    .maybeSingle();

  if (!order) {
    return NextResponse.redirect(new URL("/payment/failed", request.url));
  }

  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("id,provider_reference")
    .eq("order_id", order.id)
    .eq("provider", "paystack")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.redirect(new URL("/payment/failed", request.url));
  }

  try {
    const verification = await new PaystackProvider().verifyPayment(reference);

    if (
      verification.status === "succeeded" &&
      verification.amountCents === order.total_cents &&
      verification.currency === "ZAR"
    ) {
      await markOrderPaid(order.id, attempt.id, verification.raw);
      return NextResponse.redirect(
        new URL(`/order-confirmation/${orderToken}`, request.url),
      );
    }

    if (verification.status === "failed" || verification.status === "cancelled") {
      await cancelOrderAndRestoreStock(order.id, attempt.id, "failed", verification.raw);
      return NextResponse.redirect(
        new URL(`/payment/failed?order=${orderToken}`, request.url),
      );
    }

    return NextResponse.redirect(
      new URL(`/payment/pending?order=${orderToken}`, request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/payment/pending?order=${orderToken}`, request.url),
    );
  }
}
