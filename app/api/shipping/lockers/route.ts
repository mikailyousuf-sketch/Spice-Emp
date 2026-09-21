import { NextResponse } from "next/server";
import { PudoProvider } from "@/lib/shipping/pudo";

export async function GET() {
  try {
    const lockers = await new PudoProvider().getLockers();
    return NextResponse.json({ lockers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load lockers." },
      { status: 502 },
    );
  }
}
