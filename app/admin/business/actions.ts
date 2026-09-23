"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/notifications/email";

const enquiryStatus = z.enum(["new","reviewing","approved","declined","closed"]);

function adminListUrl(message?: string) {
  return message
    ? "/admin/business?error=" + encodeURIComponent(message)
    : "/admin/business?saved=1";
}

function detailUrl(id: string, message?: string) {
  return message
    ? `/admin/business/${id}?error=${encodeURIComponent(message)}`
    : `/admin/business/${id}?saved=1`;
}

function quoteNumber() {
  const now = new Date();
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `TGPQ-${date}-${suffix}`;
}

export async function updateBusinessEnquiry(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = enquiryStatus.parse(formData.get("status"));
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

  if (error) redirect(detailUrl(id, error.message));

  revalidatePath("/admin/business");
  revalidatePath(`/admin/business/${id}`);
  redirect(detailUrl(id));
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
    redirect(detailUrl(id, enquiryError?.message || "Business enquiry not found."));
  }

  const { error } = await admin
    .from("business_enquiries")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirect(detailUrl(id, error.message));

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
  revalidatePath(`/admin/business/${id}`);
  revalidatePath("/account");
  redirect(detailUrl(id));
}

export async function saveWholesaleQuote(formData: FormData) {
  await requireAdmin();

  const enquiryId = z.string().uuid().parse(formData.get("enquiryId"));
  const quoteIdRaw = String(formData.get("quoteId") || "").trim();
  const quoteId = quoteIdRaw ? z.string().uuid().parse(quoteIdRaw) : null;
  const customerNotes = z.string().trim().max(3000).parse(formData.get("customerNotes") || "");
  const adminNotes = z.string().trim().max(3000).parse(formData.get("quoteAdminNotes") || "");
  const shippingCents = Math.max(0, Math.round(Number(formData.get("shippingCents") || 0)));
  const discountCents = Math.max(0, Math.round(Number(formData.get("discountCents") || 0)));
  const taxCents = Math.max(0, Math.round(Number(formData.get("taxCents") || 0)));
  const validUntil = String(formData.get("validUntil") || "").trim() || null;
  const linesJson = String(formData.get("linesJson") || "[]");

  let rawLines: unknown;
  try {
    rawLines = JSON.parse(linesJson);
  } catch {
    redirect(detailUrl(enquiryId, "Quote items are invalid."));
  }

  const lineSchema = z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string().trim().min(1).max(180),
    quantityKg: z.coerce.number().positive().max(100000),
    unitPriceCentsPerKg: z.coerce.number().int().nonnegative().max(100000000),
  })).min(1).max(50);

  const parsedLines = lineSchema.safeParse(rawLines);
  if (!parsedLines.success) {
    redirect(detailUrl(enquiryId, "Check the quote quantities and pricing."));
  }

  const subtotal = parsedLines.data.reduce(
    (sum, line) => sum + Math.round(line.quantityKg * line.unitPriceCentsPerKg),
    0,
  );
  const total = Math.max(0, subtotal - discountCents + shippingCents + taxCents);

  const admin = createAdminClient();
  let finalQuoteId = quoteId;

  if (quoteId) {
    const { data: currentQuote } = await admin
      .from("wholesale_quotes")
      .select("status")
      .eq("id", quoteId)
      .eq("enquiry_id", enquiryId)
      .maybeSingle();

    if (!currentQuote || !["draft", "sent"].includes(currentQuote.status)) {
      redirect(detailUrl(enquiryId, "Accepted, rejected or converted quotes are locked. Create a repeat quote instead."));
    }

    const { error } = await admin
      .from("wholesale_quotes")
      .update({
        subtotal_cents: subtotal,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        tax_cents: taxCents,
        total_cents: total,
        valid_until: validUntil,
        customer_notes: customerNotes || null,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId)
      .eq("enquiry_id", enquiryId);

    if (error) redirect(detailUrl(enquiryId, error.message));

    await admin.from("wholesale_quote_items").delete().eq("quote_id", quoteId);
  } else {
    const { data: created, error } = await admin
      .from("wholesale_quotes")
      .insert({
        enquiry_id: enquiryId,
        quote_number: quoteNumber(),
        subtotal_cents: subtotal,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        tax_cents: taxCents,
        total_cents: total,
        valid_until: validUntil,
        customer_notes: customerNotes || null,
        admin_notes: adminNotes || null,
      })
      .select("id")
      .single();

    if (error || !created) {
      redirect(detailUrl(enquiryId, error?.message || "Could not create quote."));
    }

    finalQuoteId = created.id;
  }

  const rows = parsedLines.data.map((line, index) => ({
    quote_id: finalQuoteId!,
    product_id: line.productId,
    product_name_snapshot: line.productName,
    quantity_kg: line.quantityKg,
    unit_price_cents_per_kg: line.unitPriceCentsPerKg,
    total_price_cents: Math.round(line.quantityKg * line.unitPriceCentsPerKg),
    sort_order: index,
  }));

  const { error: itemError } = await admin.from("wholesale_quote_items").insert(rows);
  if (itemError) redirect(detailUrl(enquiryId, itemError.message));

  await admin
    .from("business_enquiries")
    .update({ status: "reviewing", updated_at: new Date().toISOString() })
    .eq("id", enquiryId);

  revalidatePath("/admin/business");
  revalidatePath(`/admin/business/${enquiryId}`);
  redirect(detailUrl(enquiryId));
}

export async function sendWholesaleQuote(formData: FormData) {
  await requireAdmin();

  const quoteId = z.string().uuid().parse(formData.get("quoteId"));
  const enquiryId = z.string().uuid().parse(formData.get("enquiryId"));
  const admin = createAdminClient();

  const { data: quote, error } = await admin
    .from("wholesale_quotes")
    .select(`
      id,quote_number,access_token,total_cents,valid_until,status,
      business_enquiries(email,contact_name,company_name)
    `)
    .eq("id", quoteId)
    .eq("enquiry_id", enquiryId)
    .maybeSingle();

  if (error || !quote) redirect(detailUrl(enquiryId, error?.message || "Quote not found."));

  const enquiry = Array.isArray(quote.business_enquiries)
    ? quote.business_enquiries[0]
    : quote.business_enquiries;

  if (!enquiry) redirect(detailUrl(enquiryId, "Enquiry details are missing."));
  if (!["draft", "sent"].includes(quote.status)) {
    redirect(detailUrl(enquiryId, "Only draft or already-sent quotes can be sent."));
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const quoteUrl = siteUrl ? `${siteUrl}/wholesale/quote/${quote.access_token}` : "";

  await admin
    .from("wholesale_quotes")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);

  try {
    await sendTransactionalEmail({
      to: enquiry.email,
      subject: `Wholesale quote ${quote.quote_number} · The Glided Pantry`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171513">
          <h2>Your wholesale quote is ready</h2>
          <p>Hi ${enquiry.contact_name},</p>
          <p>We’ve prepared quote <strong>${quote.quote_number}</strong> for <strong>${enquiry.company_name}</strong>.</p>
          <p><strong>Total:</strong> R${(quote.total_cents / 100).toFixed(2)}</p>
          ${quote.valid_until ? `<p><strong>Valid until:</strong> ${quote.valid_until}</p>` : ""}
          ${quoteUrl ? `<p><a href="${quoteUrl}">View and respond to your quote</a></p>` : ""}
        </div>
      `,
    });
  } catch (emailError) {
    console.error("[email] wholesale quote send failed", emailError);
  }

  revalidatePath("/admin/business");
  revalidatePath(`/admin/business/${enquiryId}`);
  redirect(detailUrl(enquiryId));
}

export async function convertAcceptedQuoteToOrder(formData: FormData) {
  await requireAdmin();

  const quoteId = z.string().uuid().parse(formData.get("quoteId"));
  const enquiryId = z.string().uuid().parse(formData.get("enquiryId"));
  const admin = createAdminClient();

  const { data: quote, error } = await admin
    .from("wholesale_quotes")
    .select(`
      id,quote_number,status,total_cents,subtotal_cents,discount_cents,shipping_cents,tax_cents,converted_order_id,
      business_enquiries(user_id,email,phone,contact_name,company_name,city,province),
      wholesale_quote_items(id,product_id,product_name_snapshot,quantity_kg,unit_price_cents_per_kg,total_price_cents)
    `)
    .eq("id", quoteId)
    .eq("enquiry_id", enquiryId)
    .maybeSingle();

  if (error || !quote) redirect(detailUrl(enquiryId, error?.message || "Quote not found."));
  if (quote.status !== "accepted") redirect(detailUrl(enquiryId, "Only accepted quotes can be converted."));
  if (quote.converted_order_id) redirect(`/admin/orders/${quote.converted_order_id}`);

  const enquiry = Array.isArray(quote.business_enquiries)
    ? quote.business_enquiries[0]
    : quote.business_enquiries;

  if (!enquiry) redirect(detailUrl(enquiryId, "Business details are missing."));

  const orderNumber = `TGP-W-${Date.now().toString().slice(-8)}`;
  const address = {
    first_name: enquiry.contact_name,
    last_name: "",
    company: enquiry.company_name,
    phone: enquiry.phone,
    line1: "Wholesale delivery address to confirm",
    line2: null,
    suburb: null,
    city: enquiry.city,
    province: enquiry.province,
    postal_code: "0000",
    country_code: "ZA",
  };

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: enquiry.user_id,
      email: enquiry.email,
      phone: enquiry.phone,
      status: "confirmed",
      payment_status: "unpaid",
      fulfilment_status: "unfulfilled",
      subtotal_cents: quote.subtotal_cents,
      discount_cents: quote.discount_cents,
      shipping_cents: quote.shipping_cents,
      tax_cents: quote.tax_cents,
      total_cents: quote.total_cents,
      shipping_address: address,
      billing_address: address,
      notes: `Wholesale quote ${quote.quote_number}. Confirm final delivery address before dispatch.`,
      wholesale_quote_id: quote.id,
    })
    .select("id")
    .single();

  if (orderError || !order) redirect(detailUrl(enquiryId, orderError?.message || "Could not create order."));

  const items = (quote.wholesale_quote_items ?? []).map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: null,
    product_name_snapshot: item.product_name_snapshot,
    variant_name_snapshot: "Wholesale bulk",
    sku_snapshot: "WHOLESALE",
    quantity: item.quantity_kg,
    unit_price_cents: item.unit_price_cents_per_kg,
    total_price_cents: item.total_price_cents,
  }));

  const { error: itemError } = await admin.from("order_items").insert(items);
  if (itemError) {
    await admin.from("orders").delete().eq("id", order.id);
    redirect(detailUrl(enquiryId, itemError.message));
  }

  await admin
    .from("wholesale_quotes")
    .update({
      status: "converted",
      converted_order_id: order.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

  await admin
    .from("business_enquiries")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", enquiryId);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/business");
  redirect(`/admin/orders/${order.id}`);
}


export async function cloneWholesaleQuote(formData: FormData) {
  await requireAdmin();

  const quoteId = z.string().uuid().parse(formData.get("quoteId"));
  const enquiryId = z.string().uuid().parse(formData.get("enquiryId"));
  const admin = createAdminClient();

  const { data: source, error } = await admin
    .from("wholesale_quotes")
    .select("id,subtotal_cents,discount_cents,shipping_cents,tax_cents,total_cents,customer_notes,admin_notes,wholesale_quote_items(product_id,product_name_snapshot,quantity_kg,unit_price_cents_per_kg,total_price_cents,sort_order)")
    .eq("id", quoteId)
    .eq("enquiry_id", enquiryId)
    .maybeSingle();

  if (error || !source) redirect(detailUrl(enquiryId, error?.message || "Quote not found."));

  const { data: quote, error: createError } = await admin
    .from("wholesale_quotes")
    .insert({
      enquiry_id: enquiryId,
      quote_number: quoteNumber(),
      status: "draft",
      subtotal_cents: source.subtotal_cents,
      discount_cents: source.discount_cents,
      shipping_cents: source.shipping_cents,
      tax_cents: source.tax_cents,
      total_cents: source.total_cents,
      customer_notes: source.customer_notes,
      admin_notes: source.admin_notes,
    })
    .select("id")
    .single();

  if (createError || !quote) redirect(detailUrl(enquiryId, createError?.message || "Could not create repeat quote."));

  const items = (source.wholesale_quote_items ?? []).map((item) => ({
    quote_id: quote.id,
    product_id: item.product_id,
    product_name_snapshot: item.product_name_snapshot,
    quantity_kg: item.quantity_kg,
    unit_price_cents_per_kg: item.unit_price_cents_per_kg,
    total_price_cents: item.total_price_cents,
    sort_order: item.sort_order,
  }));

  if (items.length) {
    const { error: itemError } = await admin.from("wholesale_quote_items").insert(items);
    if (itemError) redirect(detailUrl(enquiryId, itemError.message));
  }

  await admin
    .from("business_enquiries")
    .update({ status: "reviewing", updated_at: new Date().toISOString() })
    .eq("id", enquiryId);

  revalidatePath("/admin/business");
  revalidatePath("/admin/business/" + enquiryId);
  redirect(detailUrl(enquiryId));
}
