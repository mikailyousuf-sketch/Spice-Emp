import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShippingProvider } from "@/lib/shipping";
import { getShippingOrigin } from "@/lib/shipping/origin";
import type { ShippingAddress, ShippingParcel, ShippingProviderName } from "@/lib/shipping/types";

type AddressJson = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
};

function getOriginContact() {
  const name = process.env.SHIPPING_ORIGIN_CONTACT_NAME?.trim();
  const email = process.env.SHIPPING_ORIGIN_CONTACT_EMAIL?.trim();
  const phone = process.env.SHIPPING_ORIGIN_CONTACT_PHONE?.trim();

  if (!name || !email || !phone) {
    throw new Error("Shipping origin contact details are not fully configured.");
  }

  return { name, email, phone };
}

function orderAddress(value: unknown): ShippingAddress {
  const address = (value ?? {}) as AddressJson;
  if (!address.line1 || !address.city || !address.province || !address.postal_code) {
    throw new Error("The order delivery address is incomplete.");
  }

  return {
    company: address.company ?? null,
    streetAddress: address.line1,
    localArea: address.suburb ?? null,
    suburb: address.suburb ?? null,
    city: address.city,
    postalCode: address.postal_code,
    province: address.province,
    country: address.country_code ?? "ZA",
  };
}

function orderParcels(items: Array<{
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number | string;
  product_variants:
    | {
        shipping_weight_kg: number | string | null;
        length_cm: number | string | null;
        width_cm: number | string | null;
        height_cm: number | string | null;
      }
    | Array<{
        shipping_weight_kg: number | string | null;
        length_cm: number | string | null;
        width_cm: number | string | null;
        height_cm: number | string | null;
      }>
    | null;
}>): ShippingParcel[] {
  return items.flatMap((item) => {
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants;

    if (!variant) {
      throw new Error("A shipment item no longer has a product variant.");
    }

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
      throw new Error("Shipping dimensions are missing for " + item.product_name_snapshot + ".");
    }

    return Array.from({ length: quantity }, () => ({
      description: item.product_name_snapshot || item.sku_snapshot,
      lengthCm: length,
      widthCm: width,
      heightCm: height,
      weightKg: weight,
      quantity: 1,
    }));
  });
}

export async function createShipmentForPaidOrder(orderId: string) {
  const admin = createAdminClient();

  const { data: shipment } = await admin
    .from("shipments")
    .select("id,provider,status,service_level_code,delivery_locker_code")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!shipment) return null;

  if (!["draft", "failed"].includes(shipment.status)) {
    return shipment;
  }

  if (!shipment.service_level_code) {
    throw new Error("Shipment service level is missing.");
  }

  const { data: claimed } = await admin
    .from("shipments")
    .update({
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipment.id)
    .in("status", ["draft", "failed"])
    .select("id")
    .maybeSingle();

  if (!claimed) {
    return shipment;
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(`
      id,order_number,email,phone,shipping_address,payment_status,
      order_items(
        product_name_snapshot,sku_snapshot,quantity,
        product_variants(shipping_weight_kg,length_cm,width_cm,height_cm)
      )
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Order not found.");
  }

  if (order.payment_status !== "paid") {
    throw new Error("Shipment can only be created for a paid order.");
  }

  const delivery = orderAddress(order.shipping_address);
  const address = order.shipping_address as AddressJson;
  const deliveryName = [address.first_name, address.last_name].filter(Boolean).join(" ").trim();

  if (!deliveryName || !order.email || !order.phone) {
    throw new Error("Delivery contact details are incomplete.");
  }

  const provider = getShippingProvider(shipment.provider as ShippingProviderName);
  if (!provider.createShipment) {
    throw new Error("This shipping provider cannot create shipments.");
  }

  const input = {
    collectionAddress: getShippingOrigin(),
    collectionContact: getOriginContact(),
    deliveryAddress: shipment.provider === "courier_guy" ? delivery : undefined,
    deliveryLockerCode: shipment.provider === "pudo" ? shipment.delivery_locker_code ?? undefined : undefined,
    deliveryContact: {
      name: deliveryName,
      email: order.email,
      phone: order.phone,
    },
    parcels: orderParcels(order.order_items ?? []),
    serviceLevelCode: shipment.service_level_code,
    customerReference: order.order_number,
  };

  try {
    const created = await provider.createShipment(input);

    const { error: updateError } = await admin
      .from("shipments")
      .update({
        status: "submitted",
        provider_shipment_id: created.providerShipmentId,
        tracking_reference: created.trackingReference,
        label_url: created.labelUrl,
        provider_payload: input,
        provider_response: created.raw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipment.id);

    if (updateError) throw new Error(updateError.message);

    await admin
      .from("orders")
      .update({
        fulfilment_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return created;
  } catch (error) {
    await admin
      .from("shipments")
      .update({
        status: "failed",
        provider_payload: input,
        provider_response: {
          error: error instanceof Error ? error.message : "Shipment creation failed.",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipment.id);

    throw error;
  }
}
