import "server-only";
import type {
  CreateShipmentInput,
  CreatedShipment,
  QuoteInput,
  ShippingLocker,
  ShippingProvider,
  ShippingQuote,
} from "./types";

export class PudoProvider implements ShippingProvider {
  readonly name = "pudo" as const;

  private getToken() {
    const token = process.env.PUDO_API_KEY;
    if (!token) throw new Error("PUDO_API_KEY is not configured.");
    return token;
  }

  private getBaseUrl() {
    return (process.env.PUDO_API_BASE_URL || "https://api-sandbox.pudo.co.za").replace(/\/$/, "");
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.getToken()}`,
      "Content-Type": "application/json",
    };
  }

  async getLockers(): Promise<ShippingLocker[]> {
    const response = await fetch(`${this.getBaseUrl()}/lockers-data`, {
      headers: this.headers(),
      cache: "no-store",
    });

    const raw = await response.json();

    if (!response.ok || !Array.isArray(raw)) {
      throw new Error(
        typeof raw?.message === "string" ? raw.message : "Could not load PUDO lockers.",
      );
    }

    return raw.flatMap((locker) => {
      if (!locker?.code || !locker?.name) return [];

      return [{
        code: String(locker.code),
        name: String(locker.name),
        latitude: locker.latitude == null ? null : Number(locker.latitude),
        longitude: locker.longitude == null ? null : Number(locker.longitude),
        openingHours: locker.openinghours ?? null,
      }];
    });
  }


  async createShipment(input: CreateShipmentInput): Promise<CreatedShipment> {
    if (!input.deliveryLockerCode) {
      throw new Error("A PUDO delivery locker is required.");
    }

    const body = {
      collection_address: {
        type: "business",
        company: input.collectionAddress.company ?? "",
        street_address: input.collectionAddress.streetAddress,
        local_area: input.collectionAddress.localArea ?? input.collectionAddress.suburb ?? "",
        suburb: input.collectionAddress.suburb ?? "",
        city: input.collectionAddress.city,
        code: input.collectionAddress.postalCode,
        zone: input.collectionAddress.province,
        country: input.collectionAddress.country ?? "South Africa",
        lat: input.collectionAddress.latitude ?? undefined,
        lng: input.collectionAddress.longitude ?? undefined,
        entered_address: [
          input.collectionAddress.streetAddress,
          input.collectionAddress.suburb,
          input.collectionAddress.city,
          input.collectionAddress.postalCode,
        ].filter(Boolean).join(", "),
      },
      collection_contact: {
        name: input.collectionContact.name,
        email: input.collectionContact.email,
        mobile_number: input.collectionContact.phone,
      },
      delivery_address: {
        terminal_id: input.deliveryLockerCode,
      },
      delivery_contact: {
        name: input.deliveryContact.name,
        email: input.deliveryContact.email,
        mobile_number: input.deliveryContact.phone,
      },
      parcels: input.parcels.map((parcel) => ({
        parcel_description: parcel.description,
        submitted_length_cm: parcel.lengthCm,
        submitted_width_cm: parcel.widthCm,
        submitted_height_cm: parcel.heightCm,
        submitted_weight_kg: parcel.weightKg,
      })),
      service_level_code: input.serviceLevelCode,
      customer_reference: input.customerReference,
    };

    const response = await fetch(this.getBaseUrl() + "/shipments", {
      method: "POST",
      headers: this.headers(),
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
            : "PUDO shipment creation failed.",
      );
    }

    const id = raw?.id ?? raw?.shipment_id;
    if (id == null) {
      throw new Error("PUDO did not return a shipment ID.");
    }

    return {
      providerShipmentId: String(id),
      trackingReference:
        raw?.custom_tracking_reference != null
          ? String(raw.custom_tracking_reference)
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
    if (!input.deliveryLockerCode) {
      throw new Error("A PUDO delivery locker is required.");
    }

    const body = {
      collection_address: {
        type: "business",
        company: input.collectionAddress.company ?? "",
        street_address: input.collectionAddress.streetAddress,
        local_area: input.collectionAddress.localArea ?? input.collectionAddress.suburb ?? "",
        suburb: input.collectionAddress.suburb ?? "",
        city: input.collectionAddress.city,
        code: input.collectionAddress.postalCode,
        zone: input.collectionAddress.province,
        country: input.collectionAddress.country ?? "South Africa",
        lat: input.collectionAddress.latitude ?? undefined,
        lng: input.collectionAddress.longitude ?? undefined,
        entered_address: [
          input.collectionAddress.streetAddress,
          input.collectionAddress.suburb,
          input.collectionAddress.city,
          input.collectionAddress.postalCode,
        ].filter(Boolean).join(", "),
      },
      delivery_address: {
        terminal_id: input.deliveryLockerCode,
      },
      parcels: input.parcels.map((parcel) => ({
        parcel_description: parcel.description,
        submitted_length_cm: parcel.lengthCm,
        submitted_width_cm: parcel.widthCm,
        submitted_height_cm: parcel.heightCm,
        submitted_weight_kg: parcel.weightKg,
      })),
      opt_in_rates: [],
      opt_in_time_based_rates: [],
    };

    const response = await fetch(`${this.getBaseUrl()}/rates`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof raw?.message === "string" ? raw.message : "PUDO rate request failed.",
      );
    }

    const rates = Array.isArray(raw?.rates) ? raw.rates : [];

    return rates.flatMap((rate: Record<string, unknown>) => {
      const code = String(rate.service_level_code ?? rate.code ?? "");
      const name = String(rate.service_level_name ?? rate.name ?? code);
      const amount = Number(rate.rate);

      if (!code || !Number.isFinite(amount)) return [];

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
