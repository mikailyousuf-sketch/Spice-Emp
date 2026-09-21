import "server-only";
import { CourierGuyProvider } from "./courier-guy";
import { PudoProvider } from "./pudo";
import type { ShippingProvider, ShippingProviderName } from "./types";

export function getShippingProvider(name: ShippingProviderName): ShippingProvider {
  if (name === "courier_guy") return new CourierGuyProvider();
  if (name === "pudo") return new PudoProvider();
  throw new Error(`Unsupported shipping provider: ${name}`);
}
