"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const statusSchema = z.enum(["new","reviewing","approved","declined","closed"]);

function adminUrl(message?: string) {
  return message
    ? "/admin/business?error=" + encodeURIComponent(message)
    : "/admin/business?saved=1";
}

export async function updateBusinessEnquiry(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));
  const adminNotes = z.string().trim().max(3000).parse(formData.get("adminNotes") || "");

  const admin = createAdminClient();
  const { error } = await admin
    .from("business_enquiries")
    .update({
      status,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) redirect(adminUrl(error.message));
  revalidatePath("/admin/business");
  redirect(adminUrl());
}

export async function approveBusinessEnquiry(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const admin = createAdminClient();

  const { data: enquiry, error: enquiryError } = await admin
    .from("business_enquiries")
    .select("id,user_id")
    .eq("id", id)
    .maybeSingle();

  if (enquiryError || !enquiry) {
    redirect(adminUrl(enquiryError?.message || "Business enquiry not found."));
  }

  const { error } = await admin
    .from("business_enquiries")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirect(adminUrl(error.message));

  if (enquiry.user_id) {
    await admin
      .from("profiles")
      .update({ account_type: "business", updated_at: new Date().toISOString() })
      .eq("id", enquiry.user_id);

    await admin
      .from("user_roles")
      .upsert({ user_id: enquiry.user_id, role: "business_customer" }, { onConflict: "user_id,role" });
  }

  revalidatePath("/admin/business");
  revalidatePath("/account");
  redirect(adminUrl());
}
