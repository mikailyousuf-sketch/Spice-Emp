import "server-only";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from "./types";

type YocoCheckoutResponse = {
  id: string;
  redirectUrl?: string;
  status?: string;
  amount?: number;
  currency?: string;
  message?: string;
};

export class YocoProvider implements PaymentProvider {
  readonly name = "yoco" as const;

  private getSecretKey() {
    const secretKey = process.env.YOCO_SECRET_KEY;

    if (!secretKey) {
      throw new Error("YOCO_SECRET_KEY is not configured.");
    }

    return secretKey;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.attemptId,
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

    const body = (await response.json()) as YocoCheckoutResponse;

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

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const response = await fetch(
      `https://payments.yoco.com/api/checkouts/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${this.getSecretKey()}`,
        },
        cache: "no-store",
      },
    );

    const body = (await response.json()) as YocoCheckoutResponse;

    if (!response.ok || !body.id) {
      throw new Error(body.message || "Yoco payment verification failed.");
    }

    const status =
      body.status === "completed" || body.status === "succeeded"
        ? "succeeded"
        : body.status === "cancelled"
          ? "cancelled"
          : body.status === "failed"
            ? "failed"
            : "pending";

    return {
      provider: this.name,
      reference: body.id,
      status,
      amountCents: Number(body.amount ?? 0),
      currency: body.currency ?? "ZAR",
      raw: body,
    };
  }
}
