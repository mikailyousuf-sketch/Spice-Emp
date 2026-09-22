import { NextResponse } from "next/server";
import { z } from "zod";
import { getCartSnapshot } from "@/lib/cart";
import { buildCartParcels } from "@/lib/shipping/cart-parcels";
import { CourierGuyProvider } from "@/lib/shipping/courier-guy";
import { getShippingOrigin } from "@/lib/shipping/origin";

const schema = z.object({
  deliveryMode: z.enum(["door", "locker"]),
  deliveryLockerCode: z.string().trim().min(2).optional(),
  deliveryAddress: z.object({
    streetAddress: z.string().trim().min(3),
    localArea: z.string().trim().optional(),
    suburb: z.string().trim().optional(),
    city: z.string().trim().min(2),
    postalCode: z.string().trim().min(3),
    province: z.string().trim().min(2),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid shipping quote request." }, { status: 400 });
    }

    if (parsed.data.deliveryMode === "door" && !parsed.data.deliveryAddress) {
      return NextResponse.json({ error: "A delivery address is required." }, { status: 400 });
    }

    if (parsed.data.deliveryMode === "locker" && !parsed.data.deliveryLockerCode) {
      return NextResponse.json({ error: "Choose a Courier Guy locker first." }, { status: 400 });
    }

    const cart = await getCartSnapshot();

    if (!cart?.items?.length) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const parcels = buildCartParcels(cart.items as never[]);
    const provider = new CourierGuyProvider();

    const quotes = await provider.getRates({
      collectionAddress: getShippingOrigin(),
      deliveryAddress: parsed.data.deliveryMode === "door" && parsed.data.deliveryAddress
        ? {
            streetAddress: parsed.data.deliveryAddress.streetAddress,
            localArea: parsed.data.deliveryAddress.localArea ?? null,
            suburb: parsed.data.deliveryAddress.suburb ?? null,
            city: parsed.data.deliveryAddress.city,
            postalCode: parsed.data.deliveryAddress.postalCode,
            province: parsed.data.deliveryAddress.province,
            country: "ZA",
            latitude: parsed.data.deliveryAddress.latitude ?? null,
            longitude: parsed.data.deliveryAddress.longitude ?? null,
          }
        : undefined,
      deliveryLockerCode:
        parsed.data.deliveryMode === "locker"
          ? parsed.data.deliveryLockerCode
          : undefined,
      parcels,
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load shipping quotes." },
      { status: 502 },
    );
  }
}
