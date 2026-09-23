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
  const trackingReference = z.string().trim().max(180).parse(formData.get("trackingReference") || "");
  const adminNotes = z.string().trim().max(3000).parse(formData.get("adminNotes") || "");

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("orders")
    .select("dispatched_at")
    .eq("id", id)
    .maybeSingle();

  const dispatchedAt =
    status === "shipped"
      ? current?.dispatched_at || new Date().toISOString()
      : current?.dispatched_at ?? null;

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      payment_status: payment,
      fulfilment_status: fulfilment,
      tracking_reference: trackingReference || null,
      admin_notes: adminNotes || null,
      dispatched_at: dispatchedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(\`/admin/orders/\${id}?error=\${encodeURIComponent(error.message)}\`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(\`/admin/orders/\${id}\`);
  revalidatePath("/account/orders");
  revalidatePath(\`/account/orders/\${id}\`);
  redirect(\`/admin/orders/\${id}?saved=1\`);
}
