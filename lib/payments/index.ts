import "server-only";
import { PaystackProvider } from "./paystack";
import type { PaymentProvider, PaymentProviderName } from "./types";
import { YocoProvider } from "./yoco";

export function getPaymentProvider(name?: string): PaymentProvider {
  const selected = (name || process.env.PAYMENT_PROVIDER || "yoco") as PaymentProviderName;

  if (selected === "paystack") return new PaystackProvider();
  if (selected === "yoco") return new YocoProvider();

  throw new Error(`Unsupported payment provider: ${selected}`);
}
