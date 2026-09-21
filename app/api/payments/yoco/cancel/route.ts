import { NextResponse } from "next/server";
import { cancelOrderAndRestoreStock } from "@/lib/payments/order-state";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("order");

  if (!token) {
    return NextResponse.redirect(new URL("/payment/failed", request.url));
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("order_access_token", token)
    .maybeSingle();

  if (order) {
    const { data: attempt } = await admin
      .from("payment_attempts")
      .select("id")
      .eq("order_id", order.id)
      .eq("provider", "yoco")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await cancelOrderAndRestoreStock(order.id, attempt?.id ?? null, "cancelled");
  }

  return NextResponse.redirect(new URL(`/payment/failed?order=${token}`, request.url));
}
