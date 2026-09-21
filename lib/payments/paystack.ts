import "server-only";
import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: String(input.amountCents),
        currency: input.currency,
        reference: input.orderNumber,
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
}
