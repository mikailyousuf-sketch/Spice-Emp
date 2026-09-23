import { NextResponse } from "next/server";
import { getCartSnapshot } from "@/lib/cart";

export async function GET() {
  try {
    const cart = await getCartSnapshot();
    const count = (cart?.items ?? []).reduce(
      (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
      0,
    );

    return NextResponse.json(
      { count: Math.round(count) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { count: 0 },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
