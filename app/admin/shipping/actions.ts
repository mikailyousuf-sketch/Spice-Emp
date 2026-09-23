"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uberSettingsSchema = z.object({
  uberOnline: z.boolean(),
  originLabel: z.string().trim().max(160).optional(),
  originLat: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]),
  originLng: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]),
  radiusKm: z.coerce.number().positive().max(100),
  feeRand: z.coerce.number().min(0).max(100),
});

export async function updateUberSettings(formData: FormData) {
  await requireAdmin();

  const parsed = uberSettingsSchema.safeParse({
    uberOnline: formData.get("uberOnline") === "on",
    originLabel: formData.get("originLabel") || undefined,
    originLat: formData.get("originLat") || "",
    originLng: formData.get("originLng") || "",
    radiusKm: formData.get("radiusKm"),
    feeRand: formData.get("feeRand"),
  });

  if (!parsed.success) {
    redirect("/admin/shipping?error=" + encodeURIComponent("Please check the Uber delivery settings."));
  }

  if (
    parsed.data.uberOnline
    && (parsed.data.originLat === "" || parsed.data.originLng === "")
  ) {
    redirect("/admin/shipping?error=" + encodeURIComponent(
      "Set the dispatch latitude and longitude before switching Uber delivery online.",
    ));
  }

  const supabase = await createClient();
  const feeCents = Math.min(10000, Math.round(parsed.data.feeRand * 100));

  const { error } = await supabase
    .from("shipping_settings")
    .upsert({
      id: true,
      uber_online: parsed.data.uberOnline,
      uber_origin_label: parsed.data.originLabel ?? null,
      uber_origin_lat: parsed.data.originLat === "" ? null : parsed.data.originLat,
      uber_origin_lng: parsed.data.originLng === "" ? null : parsed.data.originLng,
      uber_radius_km: parsed.data.radiusKm,
      uber_fee_cents: feeCents,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) {
    redirect("/admin/shipping?error=" + encodeURIComponent(error.message));
  }

  await supabase
    .from("shipping_methods")
    .update({
      fee_cents: feeCents,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("code", "uber-delivery");

  revalidatePath("/checkout");
  revalidatePath("/admin/shipping");
  redirect("/admin/shipping?saved=1");
}
