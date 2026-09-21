export type ShippingProviderName = "courier_guy" | "pudo";

export type ShippingAddress = {
  company?: string | null;
  streetAddress: string;
  localArea?: string | null;
  suburb?: string | null;
  city: string;
  postalCode: string;
  province: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type ShippingParcel = {
  description: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  quantity?: number;
};

export type ShippingLocker = {
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  openingHours?: unknown;
};

export type ShippingQuote = {
  provider: ShippingProviderName;
  serviceLevelCode: string;
  serviceName: string;
  rateCents: number;
  raw: unknown;
};

export type QuoteInput = {
  collectionAddress: ShippingAddress;
  deliveryAddress?: ShippingAddress;
  deliveryLockerCode?: string;
  parcels: ShippingParcel[];
};

export interface ShippingProvider {
  readonly name: ShippingProviderName;
  getRates(input: QuoteInput): Promise<ShippingQuote[]>;
  getLockers?(): Promise<ShippingLocker[]>;
}
