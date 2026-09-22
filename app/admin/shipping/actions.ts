"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PudoProvider } from "@/lib/shipping/pudo";
import { createShipmentForPaidOrder } from "@/lib/shipping/fulfilment";

const shippingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(300).optional(),
  feeRand: z.coerce.number().nonnegative(),
  freeAboveRand: z.union([z.literal(""), z.coerce.number().nonnegative()]).optional(),
  isCollection: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

function url(message?: string) {
  return message
    ? `/admin/shipping?error=${encodeURIComponent(message)}`
    : "/admin/shipping?saved=1";
}

export async function createShippingMethod(formData: FormData) {
  await requireAdmin();

  const parsed = shippingSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    feeRand: formData.get("feeRand"),
    freeAboveRand: formData.get("freeAboveRand") || "",
    isCollection: formData.get("isCollection") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) redirect(url("Please check the shipping method details."));

  const supabase = await createClient();
  const { error } = await supabase.from("shipping_methods").insert({
    name: parsed.data.name,
    code: parsed.data.code,
    description: parsed.data.description ?? null,
    fee_cents: Math.round(parsed.data.feeRand * 100),
    free_above_cents:
      parsed.data.freeAboveRand === "" || parsed.data.freeAboveRand === undefined
        ? null
        : Math.round(Number(parsed.data.freeAboveRand) * 100),
    is_collection: parsed.data.isCollection,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
  });

  if (error) redirect(url(error.message));
  revalidatePath("/checkout");
  redirect(url());
}

export async function updateShippingMethod(formData: FormData) {
  await requireAdmin();

  const id = z.string().uuid().parse(formData.get("id"));
  const parsed = shippingSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    feeRand: formData.get("feeRand"),
    freeAboveRand: formData.get("freeAboveRand") || "",
    isCollection: formData.get("isCollection") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) redirect(url("Please check the shipping method details."));

  const supabase = await createClient();
  const { error } = await supabase
    .from("shipping_methods")
    .update({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      fee_cents: Math.round(parsed.data.feeRand * 100),
      free_above_cents:
        parsed.data.freeAboveRand === "" || parsed.data.freeAboveRand === undefined
          ? null
          : Math.round(Number(parsed.data.freeAboveRand) * 100),
      is_collection: parsed.data.isCollection,
      is_active: parsed.data.isActive,
      sort_order: parsed.data.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) redirect(url(error.message));
  revalidatePath("/checkout");
  redirect(url());
}

export async function deleteShippingMethod(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_methods").delete().eq("id", id);
  if (error) redirect(url(error.message));
  revalidatePath("/checkout");
  redirect(url());
}


export async function testCourierGuyConnection() {
  await requireAdmin();

  const token = process.env.COURIER_GUY_API_KEY?.trim();
  if (!token) redirect("/admin/shipping?test=" + encodeURIComponent("Courier Guy API key is not configured."));

  const base = (process.env.COURIER_GUY_API_BASE_URL || "https://api.shiplogic.com").replace(/\/$/, "");
  let message = "";

  try {
    const response = await fetch(base + "/pickup-points?type=locker", {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      message =
        typeof raw?.message === "string"
          ? raw.message
          : typeof raw?.error === "string"
            ? raw.error
            : "Courier Guy authentication failed.";
    } else {
      message = "Courier Guy connection successful. API credentials were accepted.";
    }
  } catch (error) {
    message = error instanceof Error ? error.message : "Courier Guy connection test failed.";
  }

  redirect("/admin/shipping?test=" + encodeURIComponent(message));
}

export async function testPudoConnection() {
  await requireAdmin();

  let message = "";
  try {
    const lockers = await new PudoProvider().getLockers();
    message = "PUDO connection successful. " + lockers.length + " lockers returned.";
  } catch (error) {
    message = error instanceof Error ? error.message : "PUDO connection test failed.";
  }

  redirect("/admin/shipping?test=" + encodeURIComponent(message));
}


export async function retryPaidOrderShipment(formData: FormData) {
  await requireAdmin();
  const orderId = z.string().uuid().parse(formData.get("orderId"));

  let message = "";
  try {
    const result = await createShipmentForPaidOrder(orderId);
    message = result
      ? "Shipment submitted successfully."
      : "This order does not require a courier shipment.";
  } catch (error) {
    message = error instanceof Error ? error.message : "Shipment retry failed.";
  }

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping?test=" + encodeURIComponent(message));
}
