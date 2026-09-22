import { NextResponse } from "next/server";
import { CourierGuyProvider } from "@/lib/shipping/courier-guy";

export async function GET() {
  try {
    const lockers = await new CourierGuyProvider().getLockers();
    return NextResponse.json({ lockers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load Courier Guy lockers." },
      { status: 502 },
    );
  }
}
