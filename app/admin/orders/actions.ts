"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const orderStatus = z.enum(["pending","confirmed","processing","shipped","completed","cancelled","refunded"]);
const paymentStatus = z.enum(["unpaid","pending","paid","failed","refunded"]);
const fulfilmentStatus = z.enum(["unfulfilled","processing","fulfilled","cancelled"]);

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const id = z.string().uuid().parse(formData.get("id"));
  const status = orderStatus.parse(formData.get("status"));
  const payment = paymentStatus.parse(formData.get("paymentStatus"));
  const fulfilment = fulfilmentStatus.parse(formData.get("fulfilmentStatus"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      payment_status: payment,
      fulfilment_status: fulfilment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/orders/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${id}?saved=1`);
}
