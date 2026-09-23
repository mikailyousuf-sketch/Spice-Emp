"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWholesaleAcknowledgementEmail } from "@/lib/notifications/email";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantityKg: z.coerce.number().positive().max(10000),
});

const schema = z.object({
  companyName: z.string().trim().min(2).max(160),
  registrationNumber: z.string().trim().max(80).optional(),
  vatNumber: z.string().trim().max(80).optional(),
  businessType: z.string().trim().min(2).max(100),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(120),
  province: z.string().trim().min(2).max(120),
  monthlyVolumeKg: z.union([z.literal(""), z.coerce.number().nonnegative().max(100000)]).optional(),
  orderingFrequency: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(3000).optional(),
  items: z.array(itemSchema).min(1).max(12),
});

export async function submitBusinessEnquiry(formData: FormData) {
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("itemsJson") || "[]"));
  } catch {
    redirect("/business?error=Please%20check%20the%20products%20in%20your%20quote.");
  }

  const parsed = schema.safeParse({
    companyName: formData.get("companyName"),
    registrationNumber: formData.get("registrationNumber") || undefined,
    vatNumber: formData.get("vatNumber") || undefined,
    businessType: formData.get("businessType"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    province: formData.get("province"),
    monthlyVolumeKg: formData.get("monthlyVolumeKg") || "",
    orderingFrequency: formData.get("orderingFrequency") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    redirect("/business?error=Please%20check%20your%20business%20details%20and%20quote%20items.");
  }

  const admin = createAdminClient();
  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id,name")
    .eq("is_active", true)
    .in("id", productIds);

  if (productsError) {
    redirect("/business?error=" + encodeURIComponent(productsError.message));
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product.name]));
  const requestedItems = parsed.data.items.flatMap((item) => {
    const name = productMap.get(item.productId);
    return name
      ? [{
          product_id: item.productId,
          product_name: name,
          quantity_kg: item.quantityKg,
        }]
      : [];
  });

  if (!requestedItems.length || requestedItems.length !== parsed.data.items.length) {
    redirect("/business?error=One%20or%20more%20selected%20products%20are%20not%20available.");
  }

  const userId = await getCurrentUserId();

  const { error } = await admin.from("business_enquiries").insert({
    user_id: userId,
    company_name: parsed.data.companyName,
    registration_number: parsed.data.registrationNumber ?? null,
    vat_number: parsed.data.vatNumber ?? null,
    business_type: parsed.data.businessType,
    contact_name: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    city: parsed.data.city,
    province: parsed.data.province,
    monthly_volume_kg:
      parsed.data.monthlyVolumeKg === "" || parsed.data.monthlyVolumeKg === undefined
        ? null
        : Number(parsed.data.monthlyVolumeKg),
    ordering_frequency: parsed.data.orderingFrequency ?? null,
    requested_items: requestedItems,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect("/business?error=" + encodeURIComponent(error.message));
  }

  try {
    await sendWholesaleAcknowledgementEmail({
      email: parsed.data.email,
      contact_name: parsed.data.contactName,
      company_name: parsed.data.companyName,
    });
  } catch (emailError) {
    console.error("[email] wholesale acknowledgement failed", emailError);
  }

  redirect("/business?sent=1");
}
