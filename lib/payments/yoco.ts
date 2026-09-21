import "server-only";
import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

type YocoCheckoutResponse = {
  id: string;
  redirectUrl: string;
  status?: string;
};

export class YocoProvider implements PaymentProvider {
  readonly name = "yoco" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const secretKey = process.env.YOCO_SECRET_KEY;

    if (!secretKey) {
      throw new Error("YOCO_SECRET_KEY is not configured.");
    }

    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.orderId,
      },
      body: JSON.stringify({
        amount: input.amountCents,
        currency: input.currency,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        failureUrl: input.failureUrl,
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        },
      }),
      cache: "no-store",
    });

    const body = (await response.json()) as YocoCheckoutResponse & { message?: string };

    if (!response.ok || !body.id || !body.redirectUrl) {
      throw new Error(body.message || "Yoco payment initialization failed.");
    }

    return {
      provider: this.name,
      providerReference: body.id,
      providerCheckoutId: body.id,
      checkoutUrl: body.redirectUrl,
      raw: body,
    };
  }
}
