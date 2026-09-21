import "server-only";
import type { ShippingAddress } from "./types";

export function getShippingOrigin(): ShippingAddress {
  const streetAddress = process.env.SHIPPING_ORIGIN_STREET;
  const city = process.env.SHIPPING_ORIGIN_CITY;
  const postalCode = process.env.SHIPPING_ORIGIN_POSTAL_CODE;
  const province = process.env.SHIPPING_ORIGIN_PROVINCE;

  if (!streetAddress || !city || !postalCode || !province) {
    throw new Error("Shipping origin is not fully configured.");
  }

  return {
    company: process.env.SHIPPING_ORIGIN_COMPANY || "Spice Emp",
    streetAddress,
    localArea: process.env.SHIPPING_ORIGIN_LOCAL_AREA || null,
    suburb: process.env.SHIPPING_ORIGIN_SUBURB || null,
    city,
    postalCode,
    province,
    country: process.env.SHIPPING_ORIGIN_COUNTRY || "ZA",
    latitude: process.env.SHIPPING_ORIGIN_LAT ? Number(process.env.SHIPPING_ORIGIN_LAT) : null,
    longitude: process.env.SHIPPING_ORIGIN_LNG ? Number(process.env.SHIPPING_ORIGIN_LNG) : null,
  };
}
