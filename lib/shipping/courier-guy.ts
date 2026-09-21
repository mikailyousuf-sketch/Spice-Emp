import "server-only";
import type {
  QuoteInput,
  ShippingProvider,
  ShippingQuote,
} from "./types";

type ShiplogicRate = {
  service_level?: {
    code?: string;
    name?: string;
  };
  service_level_code?: string;
  service_level_name?: string;
  rate?: number | string;
  total?: number | string;
};

export class CourierGuyProvider implements ShippingProvider {
  readonly name = "courier_guy" as const;

  private getToken() {
    const token = process.env.COURIER_GUY_API_KEY;
    if (!token) throw new Error("COURIER_GUY_API_KEY is not configured.");
    return token;
  }

  private getBaseUrl() {
    return (process.env.COURIER_GUY_API_BASE_URL || "https://api.shiplogic.com").replace(/\/$/, "");
  }

  async getRates(input: QuoteInput): Promise<ShippingQuote[]> {
    const body = {
      collection_address: {
        company: input.collectionAddress.company ?? undefined,
        street_address: input.collectionAddress.streetAddress,
        local_area: input.collectionAddress.localArea ?? input.collectionAddress.suburb ?? "",
        code: input.collectionAddress.postalCode,
        city: input.collectionAddress.city,
        zone: input.collectionAddress.province,
        country: input.collectionAddress.country ?? "ZA",
        lat: input.collectionAddress.latitude ?? undefined,
        lng: input.collectionAddress.longitude ?? undefined,
        type: "business",
      },
      ...(input.deliveryLockerCode
        ? {
            delivery_pickup_point_id: input.deliveryLockerCode,
            delivery_pickup_point_provider: "tcg-locker",
          }
        : {
            delivery_address: {
              street_address: input.deliveryAddress?.streetAddress,
              local_area: input.deliveryAddress?.localArea ?? input.deliveryAddress?.suburb ?? "",
              code: input.deliveryAddress?.postalCode,
              city: input.deliveryAddress?.city,
              zone: input.deliveryAddress?.province,
              country: input.deliveryAddress?.country ?? "ZA",
              lat: input.deliveryAddress?.latitude ?? undefined,
              lng: input.deliveryAddress?.longitude ?? undefined,
              type: "residential",
            },
          }),
      parcels: input.parcels.map((parcel) => ({
        parcel_description: parcel.description,
        submitted_length_cm: parcel.lengthCm,
        submitted_width_cm: parcel.widthCm,
        submitted_height_cm: parcel.heightCm,
        submitted_weight_kg: parcel.weightKg,
      })),
    };

    const response = await fetch(`${this.getBaseUrl()}/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof raw?.message === "string" ? raw.message : "Courier Guy rate request failed.",
      );
    }

    const rates: ShiplogicRate[] = Array.isArray(raw) ? raw : raw?.rates ?? [];

    return rates.flatMap((rate) => {
      const code = rate.service_level?.code ?? rate.service_level_code;
      const name = rate.service_level?.name ?? rate.service_level_name ?? code;
      const amount = Number(rate.rate ?? rate.total);

      if (!code || !name || !Number.isFinite(amount)) return [];

      return [{
        provider: this.name,
        serviceLevelCode: code,
        serviceName: name,
        rateCents: Math.round(amount * 100),
        raw: rate,
      }];
    });
  }
}
