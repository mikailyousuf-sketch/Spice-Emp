"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional(),
});

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(80).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  company: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(7).max(30),
  line1: z.string().trim().min(3).max(180),
  line2: z.string().trim().max(180).optional(),
  suburb: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(12),
  isDefaultShipping: z.boolean(),
});

function accountUrl(message?: string, kind: "error" | "saved" = "saved") {
  if (!message) return "/account?saved=1";
  return "/account?" + kind + "=" + encodeURIComponent(message);
}

export async function updateProfile(formData: FormData) {
  const userId = await requireUser();
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    redirect(accountUrl("Please check your profile details.", "error"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) redirect(accountUrl(error.message, "error"));

  revalidatePath("/account");
  redirect(accountUrl());
}

export async function saveAddress(formData: FormData) {
  const userId = await requireUser();
  const parsed = addressSchema.safeParse({
    id: formData.get("id") || undefined,
    label: formData.get("label") || undefined,
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    company: formData.get("company") || undefined,
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    suburb: formData.get("suburb") || undefined,
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    isDefaultShipping: formData.get("isDefaultShipping") === "on",
  });

  if (!parsed.success) {
    redirect(accountUrl("Please check the saved address details.", "error"));
  }

  const supabase = await createClient();

  if (parsed.data.isDefaultShipping) {
    await supabase
      .from("addresses")
      .update({ is_default_shipping: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  const payload = {
    user_id: userId,
    label: parsed.data.label ?? null,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    company: parsed.data.company ?? null,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? null,
    suburb: parsed.data.suburb ?? null,
    city: parsed.data.city,
    province: parsed.data.province,
    postal_code: parsed.data.postalCode,
    country_code: "ZA",
    is_default_shipping: parsed.data.isDefaultShipping,
    updated_at: new Date().toISOString(),
  };

  const result = parsed.data.id
    ? await supabase
        .from("addresses")
        .update(payload)
        .eq("id", parsed.data.id)
        .eq("user_id", userId)
    : await supabase
        .from("addresses")
        .insert(payload);

  if (result.error) redirect(accountUrl(result.error.message, "error"));

  revalidatePath("/account");
  redirect(accountUrl());
}

export async function deleteAddress(formData: FormData) {
  const userId = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) redirect(accountUrl(error.message, "error"));

  revalidatePath("/account");
  redirect(accountUrl());
}
