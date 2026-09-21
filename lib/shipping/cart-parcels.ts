import "server-only";
import type { ShippingParcel } from "./types";

type CartItemLike = {
  quantity: number | string;
  product_variants:
    | {
        sku: string;
        shipping_weight_kg: number | string | null;
        length_cm: number | string | null;
        width_cm: number | string | null;
        height_cm: number | string | null;
        products: { name: string } | Array<{ name: string }> | null;
      }
    | Array<{
        sku: string;
        shipping_weight_kg: number | string | null;
        length_cm: number | string | null;
        width_cm: number | string | null;
        height_cm: number | string | null;
        products: { name: string } | Array<{ name: string }> | null;
      }>
    | null;
};

export function buildCartParcels(items: CartItemLike[]): ShippingParcel[] {
  return items.flatMap((item) => {
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants;

    if (!variant) return [];

    const product = Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products;

    const weight = Number(variant.shipping_weight_kg);
    const length = Number(variant.length_cm);
    const width = Number(variant.width_cm);
    const height = Number(variant.height_cm);
    const quantity = Math.max(1, Math.ceil(Number(item.quantity)));

    if (
      !Number.isFinite(weight) || weight <= 0 ||
      !Number.isFinite(length) || length <= 0 ||
      !Number.isFinite(width) || width <= 0 ||
      !Number.isFinite(height) || height <= 0
    ) {
      throw new Error(
        `Shipping dimensions are missing for ${product?.name || variant.sku}.`,
      );
    }

    return Array.from({ length: quantity }, () => ({
      description: product?.name || variant.sku,
      lengthCm: length,
      widthCm: width,
      heightCm: height,
      weightKg: weight,
      quantity: 1,
    }));
  });
}
