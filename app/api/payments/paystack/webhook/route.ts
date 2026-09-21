import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { PaystackProvider } from "@/lib/payments/paystack";
import { markOrderPaid } from "@/lib/payments/order-state";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaystackEvent = {
  event?: string;
  data?: {
    reference?: string;
  };
};

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get("x-paystack-signature");

  if (!secret || !signature) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rawBody = await request.text();
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaystackEvent;

  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("payment_attempts")
    .select("id,order_id,orders(total_cents,payment_status)")
    .eq("provider", "paystack")
    .eq("provider_reference", event.data.reference)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.json({ received: true });
  }

  const order = Array.isArray(attempt.orders) ? attempt.orders[0] : attempt.orders;

  if (order?.payment_status === "paid") {
    return NextResponse.json({ received: true });
  }

  const verification = await new PaystackProvider().verifyPayment(event.data.reference);

  if (
    verification.status === "succeeded" &&
    verification.amountCents === order?.total_cents &&
    verification.currency === "ZAR"
  ) {
    await markOrderPaid(attempt.order_id, attempt.id, verification.raw);
  }

  return NextResponse.json({ received: true });
}
