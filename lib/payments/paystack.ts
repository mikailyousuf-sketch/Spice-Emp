import "server-only";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
} from "./types";

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
  };
};

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack" as const;

  private getSecretKey() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    return secretKey;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountCents),
        currency: input.currency,
        reference: `${input.orderNumber}-${input.attemptId.slice(0, 8)}`,
        callback_url: input.successUrl,
        metadata: JSON.stringify({
          order_id: input.orderId,
          order_number: input.orderNumber,
        }),
      }),
      cache: "no-store",
    });

    const body = (await response.json()) as PaystackInitializeResponse;

    if (!response.ok || !body.status || !body.data) {
      throw new Error(body.message || "Paystack payment initialization failed.");
    }

    return {
      provider: this.name,
      providerReference: body.data.reference,
      providerCheckoutId: body.data.access_code,
      checkoutUrl: body.data.authorization_url,
      raw: body,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${this.getSecretKey()}`,
        },
        cache: "no-store",
      },
    );

    const body = (await response.json()) as PaystackVerifyResponse;

    if (!response.ok || !body.status || !body.data) {
      throw new Error(body.message || "Paystack payment verification failed.");
    }

    const status =
      body.data.status === "success"
        ? "succeeded"
        : ["failed", "abandoned", "reversed"].includes(body.data.status)
          ? "failed"
          : "pending";

    return {
      provider: this.name,
      reference: body.data.reference,
      status,
      amountCents: body.data.amount,
      currency: body.data.currency,
      raw: body,
    };
  }
}
