import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WholesaleQuoteBuilder } from "@/components/admin/wholesale-quote-builder";
import { approveBusinessEnquiry, cloneWholesaleQuote, convertAcceptedQuoteToOrder, saveWholesaleQuote, sendWholesaleQuote, updateBusinessEnquiry } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };
type RequestedItem = { product_id: string; product_name: string; quantity_kg: number };

export const metadata = { title: "Wholesale enquiry" };

export default async function AdminBusinessDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const [{ data: enquiry }, { data: quotes }] = await Promise.all([
    supabase.from("business_enquiries").select("*").eq("id", id).maybeSingle(),
    supabase.from("wholesale_quotes")
      .select("id,quote_number,status,subtotal_cents,discount_cents,shipping_cents,tax_cents,total_cents,valid_until,customer_notes,admin_notes,sent_at,converted_order_id,created_at,wholesale_quote_items(id,product_id,product_name_snapshot,quantity_kg,unit_price_cents_per_kg,total_price_cents,sort_order)")
      .eq("enquiry_id", id).order("created_at", { ascending: false }),
  ]);

  if (!enquiry) notFound();

  const latestQuote = quotes?.[0] ?? null;
  const requested = Array.isArray(enquiry.requested_items) ? enquiry.requested_items as RequestedItem[] : [];
  const initialLines = latestQuote?.wholesale_quote_items?.length
    ? [...latestQuote.wholesale_quote_items].sort((a, b) => a.sort_order - b.sort_order).map((item) => ({
        productId: item.product_id,
        productName: item.product_name_snapshot,
        quantityKg: Number(item.quantity_kg),
        unitPriceCentsPerKg: Number(item.unit_price_cents_per_kg),
      }))
    : requested.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantityKg: Number(item.quantity_kg),
        unitPriceCentsPerKg: 0,
      }));

  return (
    <section>
      <Link href="/admin/business" className="text-xs font-bold uppercase tracking-[.12em] text-stone-500">← Wholesale pipeline</Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Wholesale enquiry</span>
          <h1 className="display-font mt-4 text-5xl font-semibold tracking-[-.05em]">{enquiry.company_name}</h1>
          <p className="mt-3 text-stone-500">{enquiry.contact_name} · {enquiry.email} · {enquiry.phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="admin-featured-badge">{enquiry.status}</span>
          {latestQuote ? <span className="admin-featured-badge">{latestQuote.quote_number} · {latestQuote.status}</span> : null}
        </div>
      </div>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Wholesale record updated.</p> : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="glass-soft rounded-[2rem] p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Quote builder</span>
                <h2 className="display-font mt-2 text-2xl font-semibold">{latestQuote ? latestQuote.quote_number : "Create first quote"}</h2>
              </div>
              {latestQuote ? <span className="text-xs capitalize text-stone-500">{latestQuote.status}</span> : null}
            </div>

            {!latestQuote || ["draft", "sent"].includes(latestQuote.status) ? (
              <form action={saveWholesaleQuote} className="mt-5">
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <WholesaleQuoteBuilder
                  initialLines={initialLines}
                  existingQuote={latestQuote ? {
                    id: latestQuote.id,
                    validUntil: latestQuote.valid_until,
                    customerNotes: latestQuote.customer_notes,
                    adminNotes: latestQuote.admin_notes,
                    shippingCents: latestQuote.shipping_cents,
                    discountCents: latestQuote.discount_cents,
                    taxCents: latestQuote.tax_cents,
                  } : null}
                />
                <button type="submit" className="btn-primary mt-6 w-full">{latestQuote ? "Save quote changes" : "Create draft quote"}</button>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-400">
                This quote is locked because it has been {latestQuote.status}. Create a repeat quote to make new pricing.
              </div>
            )}

            {latestQuote ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {["draft", "sent"].includes(latestQuote.status) ? (
                  <form action={sendWholesaleQuote}>
                    <input type="hidden" name="quoteId" value={latestQuote.id} />
                    <input type="hidden" name="enquiryId" value={enquiry.id} />
                    <button type="submit" className="btn-secondary w-full">{latestQuote.status === "sent" ? "Resend quote" : "Send quote to customer"}</button>
                  </form>
                ) : (
                  <form action={cloneWholesaleQuote}>
                    <input type="hidden" name="quoteId" value={latestQuote.id} />
                    <input type="hidden" name="enquiryId" value={enquiry.id} />
                    <button type="submit" className="btn-secondary w-full">Create repeat quote</button>
                  </form>
                )}

                {latestQuote.status === "accepted" ? (
                  <form action={convertAcceptedQuoteToOrder}>
                    <input type="hidden" name="quoteId" value={latestQuote.id} />
                    <input type="hidden" name="enquiryId" value={enquiry.id} />
                    <button type="submit" className="btn-primary w-full">Convert accepted quote to order</button>
                  </form>
                ) : latestQuote.converted_order_id ? (
                  <div className="grid gap-2">
                    <Link href={"/admin/orders/" + latestQuote.converted_order_id} className="btn-primary w-full">Open wholesale order</Link>
                    <span className="text-xs text-stone-500">Repeat orders can be started from the button beside this status.</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {quotes?.length ? (
            <section className="glass-soft rounded-[2rem] p-6">
              <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Quote history</span>
              <div className="mt-4 grid gap-3">
                {quotes.map((quote) => (
                  <div className="admin-recent-order" key={quote.id}>
                    <div><strong>{quote.quote_number}</strong><span>{new Date(quote.created_at).toLocaleDateString("en-ZA")}</span></div>
                    <div className="text-right"><strong className="capitalize">{quote.status}</strong><span>R{(quote.total_cents / 100).toFixed(2)}</span></div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="grid h-fit gap-5">
          <section className="glass rounded-[2rem] p-6">
            <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Business</span>
            <h2 className="display-font mt-2 text-xl font-semibold">{enquiry.company_name}</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <Info label="Type" value={enquiry.business_type} />
              <Info label="Location" value={enquiry.city + ", " + enquiry.province} />
              <Info label="Monthly volume" value={enquiry.monthly_volume_kg ? enquiry.monthly_volume_kg + " kg" : "Not specified"} />
              <Info label="Frequency" value={enquiry.ordering_frequency || "Not specified"} />
              <Info label="VAT" value={enquiry.vat_number || "Not supplied"} />
            </div>
            {enquiry.notes ? <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">{enquiry.notes}</p> : null}
          </section>

          <form action={updateBusinessEnquiry} className="glass-soft rounded-[2rem] p-6">
            <input type="hidden" name="id" value={enquiry.id} />
            <p className="display-font text-xl font-semibold">Pipeline</p>
            <label className="mt-4 grid gap-2 text-sm"><span className="text-stone-400">Enquiry status</span>
              <select name="status" defaultValue={enquiry.status} className="field">
                <option value="new">New</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="declined">Declined</option><option value="closed">Closed</option>
              </select>
            </label>
            <label className="mt-4 grid gap-2 text-sm"><span className="text-stone-400">Internal notes</span>
              <textarea name="adminNotes" rows={5} defaultValue={enquiry.admin_notes ?? ""} className="field resize-y" />
            </label>
            <button type="submit" className="btn-secondary mt-5 w-full">Save pipeline status</button>
          </form>

          {enquiry.status !== "approved" ? (
            <form action={approveBusinessEnquiry} className="glass-soft rounded-[2rem] p-6">
              <input type="hidden" name="id" value={enquiry.id} />
              <p className="display-font text-xl font-semibold">Business account</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Approve the linked user as a business customer. Quote acceptance stays separate.</p>
              <button type="submit" className="btn-primary mt-5 w-full">Approve business account</button>
            </form>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="text-stone-500">{label}</span><strong className="text-right">{value}</strong></div>;
}
