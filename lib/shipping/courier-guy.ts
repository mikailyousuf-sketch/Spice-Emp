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

const provinceCodes: Record<string, string> = {
  "Eastern Cape": "EC",
  "Free State": "FS",
  "Gauteng": "GP",
  "KwaZulu-Natal": "KZN",
  "Limpopo": "LP",
  "Mpumalanga": "MP",
  "North West": "NW",
  "Northern Cape": "NC",
  "Western Cape": "WC",
};

function zone(value: string) {
  return provinceCodes[value] ?? value;
}

export class CourierGuyProvider implements ShippingProvider {
  readonly name = "courier_guy" as const;

  private getToken() {
    const token = process.env.COURIER_GUY_API_KEY?.trim();
    if (!token) throw new Error("COURIER_GUY_API_KEY is not configured.");
    return token;
  }

  private getBaseUrl() {
    return (process.env.COURIER_GUY_API_BASE_URL || "https://api.shiplogic.com").replace(/\/$/, "");
  }

  private getRatesPath() {
    const configured = process.env.COURIER_GUY_RATES_PATH?.trim();
    return configured || "/v2/rates";
  }

  async getRates(input: QuoteInput): Promise<ShippingQuote[]> {
    if (!input.deliveryAddress) {
      throw new Error("A Courier Guy delivery address is required.");
    }

    const providerId = process.env.COURIER_GUY_PROVIDER_ID?.trim();

    const body = {
      ...(providerId ? { provider_id: providerId } : {}),
      collection_address: {
        company: input.collectionAddress.company ?? undefined,
        street_address: input.collectionAddress.streetAddress,
        local_area: input.collectionAddress.localArea ?? input.collectionAddress.suburb ?? "",
        suburb: input.collectionAddress.suburb ?? "",
        code: input.collectionAddress.postalCode,
        city: input.collectionAddress.city,
        zone: zone(input.collectionAddress.province),
        country: input.collectionAddress.country ?? "ZA",
        lat: input.collectionAddress.latitude ?? undefined,
        lng: input.collectionAddress.longitude ?? undefined,
        type: "business",
      },
      delivery_address: {
        street_address: input.deliveryAddress.streetAddress,
        local_area: input.deliveryAddress.localArea ?? input.deliveryAddress.suburb ?? "",
        suburb: input.deliveryAddress.suburb ?? "",
        code: input.deliveryAddress.postalCode,
        city: input.deliveryAddress.city,
        zone: zone(input.deliveryAddress.province),
        country: input.deliveryAddress.country ?? "ZA",
        lat: input.deliveryAddress.latitude ?? undefined,
        lng: input.deliveryAddress.longitude ?? undefined,
        type: "residential",
      },
      parcels: input.parcels.map((parcel) => ({
        parcel_description: parcel.description,
        submitted_length_cm: parcel.lengthCm,
        submitted_width_cm: parcel.widthCm,
        submitted_height_cm: parcel.heightCm,
        submitted_weight_kg: parcel.weightKg,
      })),
    };

    const response = await fetch(this.getBaseUrl() + this.getRatesPath(), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.getToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        typeof raw?.message === "string"
          ? raw.message
          : typeof raw?.error === "string"
            ? raw.error
            : "Courier Guy rate request failed.",
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
