import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/notifications/email";

export async function markOrderPaid(orderId: string, attemptId: string, raw: unknown) {
  const admin = createAdminClient();

  const { data: transition, error: transitionError } = await admin.rpc(
    "confirm_paid_order",
    { target_order_id: orderId },
  );

  if (transitionError) {
    throw new Error(transitionError.message);
  }

  if (transition === "stock_unavailable") {
    await admin
      .from("payment_attempts")
      .update({
        status: "succeeded",
        raw_response: raw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    throw new Error(
      "Payment succeeded after stock was released, but the order could not be re-reserved. Manual intervention is required.",
    );
  }

  await admin
    .from("payment_attempts")
    .update({
      status: "succeeded",
      raw_response: raw,
      updated_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (transition !== "paid") {
    return;
  }

  const { data: updatedOrder } = await admin
    .from("orders")
    .select("email,order_number,total_cents,shipping_method_snapshot,order_access_token")
    .eq("id", orderId)
    .maybeSingle();

  if (updatedOrder) {
    try {
      await sendOrderConfirmationEmail(updatedOrder);
    } catch (error) {
      console.error("[email] order confirmation failed", error);
    }
  }
}

export async function cancelOrderAndRestoreStock(
  orderId: string,
  attemptId: string | null,
  attemptStatus: "failed" | "cancelled",
  raw?: unknown,
) {
  const admin = createAdminClient();

  const { error: releaseError } = await admin.rpc("release_order_stock", {
    target_order_id: orderId,
  });

  if (releaseError) {
    throw new Error(releaseError.message);
  }

  if (attemptId) {
    await admin
      .from("payment_attempts")
      .update({
        status: attemptStatus,
        raw_response: raw ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .neq("status", "succeeded");
  }
}
