import "server-only";
import { CourierGuyProvider } from "./courier-guy";
import type { ShippingProvider, ShippingProviderName } from "./types";

export function getShippingProvider(name: ShippingProviderName): ShippingProvider {
  if (name === "courier_guy") return new CourierGuyProvider();
  throw new Error(`Unsupported shipping provider: ${name}`);
}
