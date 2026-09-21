export type PaymentProviderName = "yoco" | "paystack";

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: "ZAR";
  email: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
};

export type CreatePaymentResult = {
  provider: PaymentProviderName;
  providerReference: string;
  providerCheckoutId?: string | null;
  checkoutUrl: string;
  raw: unknown;
};

export type VerifyPaymentResult = {
  provider: PaymentProviderName;
  reference: string;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  amountCents: number;
  currency: string;
  raw: unknown;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
}
