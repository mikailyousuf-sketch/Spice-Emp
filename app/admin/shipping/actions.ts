"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
