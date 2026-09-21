import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markOrderPaid(orderId: string, attemptId: string, raw: unknown) {
  const admin = createAdminClient();

  await admin
    .from("payment_attempts")
    .update({
      status: "succeeded",
      raw_response: raw,
      updated_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  await admin
    .from("orders")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");
}

export async function cancelOrderAndRestoreStock(
  orderId: string,
  attemptId: string | null,
  attemptStatus: "failed" | "cancelled",
  raw?: unknown,
) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id,status,payment_status,order_items(variant_id,quantity)")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.payment_status === "paid" || order.status === "cancelled") {
    return;
  }

  for (const item of order.order_items ?? []) {
    if (!item.variant_id) continue;

    await admin.rpc("increment_variant_stock", {
      target_variant_id: item.variant_id,
      restore_quantity: Number(item.quantity),
    });
  }

  await admin
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      fulfilment_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (attemptId) {
    await admin
      .from("payment_attempts")
      .update({
        status: attemptStatus,
        raw_response: raw ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId);
  }
}
