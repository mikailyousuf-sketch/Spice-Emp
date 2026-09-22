import "server-only";
import type {
  CreateShipmentInput,
  CreatedShipment,
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

  private addressPayload(address: QuoteInput["collectionAddress"], type: "business" | "residential") {
    return {
      company: address.company ?? undefined,
      street_address: address.streetAddress,
      local_area: address.localArea ?? address.suburb ?? "",
      suburb: address.suburb ?? "",
      code: address.postalCode,
      city: address.city,
      zone: zone(address.province),
      country: address.country ?? "ZA",
      lat: address.latitude ?? undefined,
      lng: address.longitude ?? undefined,
      type,
    };
  }

  private parcelPayload(input: QuoteInput) {
    return input.parcels.map((parcel) => ({
      parcel_description: parcel.description,
      submitted_length_cm: parcel.lengthCm,
      submitted_width_cm: parcel.widthCm,
      submitted_height_cm: parcel.heightCm,
      submitted_weight_kg: parcel.weightKg,
    }));
  }

  async createShipment(input: CreateShipmentInput): Promise<CreatedShipment> {
    if (!input.deliveryAddress) {
      throw new Error("A Courier Guy delivery address is required.");
    }

    const providerId = process.env.COURIER_GUY_PROVIDER_ID?.trim();
    const body = {
      ...(providerId ? { provider_id: providerId } : {}),
      collection_address: this.addressPayload(input.collectionAddress, "business"),
      collection_contact: {
        name: input.collectionContact.name,
        email: input.collectionContact.email,
        mobile_number: input.collectionContact.phone,
      },
      delivery_address: this.addressPayload(input.deliveryAddress, "residential"),
      delivery_contact: {
        name: input.deliveryContact.name,
        email: input.deliveryContact.email,
        mobile_number: input.deliveryContact.phone,
      },
      parcels: this.parcelPayload(input),
      service_level_code: input.serviceLevelCode,
      customer_reference: input.customerReference,
    };

    const response = await fetch(this.getBaseUrl() + "/v2/shipments", {
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
            : "Courier Guy shipment creation failed.",
      );
    }

    const id = raw?.id ?? raw?.shipment_id;
    if (id == null) {
      throw new Error("Courier Guy did not return a shipment ID.");
    }

    return {
      providerShipmentId: String(id),
      trackingReference:
        raw?.custom_tracking_reference != null
          ? String(raw.custom_tracking_reference)
          : raw?.short_tracking_reference != null
            ? String(raw.short_tracking_reference)
            : null,
      labelUrl:
        typeof raw?.label_url === "string"
          ? raw.label_url
          : typeof raw?.label?.url === "string"
            ? raw.label.url
            : null,
      raw,
    };
  }

  async getRates(input: QuoteInput): Promise<ShippingQuote[]> {
    if (!input.deliveryAddress) {
      throw new Error("A Courier Guy delivery address is required.");
    }

    const providerId = process.env.COURIER_GUY_PROVIDER_ID?.trim();

    const body = {
      ...(providerId ? { provider_id: providerId } : {}),
      collection_address: this.addressPayload(input.collectionAddress, "business"),
      delivery_address: this.addressPayload(input.deliveryAddress, "residential"),
      parcels: this.parcelPayload(input),
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
