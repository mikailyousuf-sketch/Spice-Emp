"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/notifications/email";

const responseSchema = z.enum(["accepted", "rejected"]);

export async function respondToWholesaleQuote(formData: FormData) {
  const token = z.string().uuid().parse(formData.get("token"));
  const response = responseSchema.parse(formData.get("response"));
  const admin = createAdminClient();

  const { data: quote, error } = await admin
    .from("wholesale_quotes")
    .select("id,quote_number,status,valid_until,business_enquiries(id,company_name,contact_name,email)")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !quote) redirect("/business?error=Quote%20not%20found.");

  if (!["sent", "accepted", "rejected"].includes(quote.status)) {
    redirect("/wholesale/quote/" + token + "?error=This%20quote%20cannot%20be%20changed.");
  }

  if (quote.valid_until && new Date(quote.valid_until + "T23:59:59") < new Date()) {
    await admin.from("wholesale_quotes").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", quote.id);
    redirect("/wholesale/quote/" + token + "?error=This%20quote%20has%20expired.");
  }

  await admin
    .from("wholesale_quotes")
    .update({
      status: response,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

  const enquiry = Array.isArray(quote.business_enquiries)
    ? quote.business_enquiries[0]
    : quote.business_enquiries;

  if (enquiry) {
    await admin
      .from("business_enquiries")
      .update({
        status: response === "accepted" ? "approved" : "declined",
        updated_at: new Date().toISOString(),
      })
      .eq("id", enquiry.id);

    try {
      await sendTransactionalEmail({
        to: "theglidedpantry.co.za@gmail.com",
        subject: "Wholesale quote " + response + " · " + quote.quote_number,
        html:
          "<div style=\"font-family:Arial,sans-serif;line-height:1.6\">" +
          "<h2>Wholesale quote " + response + "</h2>" +
          "<p><strong>" + enquiry.company_name + "</strong> has " + response + " quote <strong>" + quote.quote_number + "</strong>.</p>" +
          "<p>Customer: " + enquiry.contact_name + " · " + enquiry.email + "</p>" +
          "</div>",
      });
    } catch (emailError) {
      console.error("[email] wholesale response notification failed", emailError);
    }
  }

  redirect("/wholesale/quote/" + token + "?responded=" + response);
}
