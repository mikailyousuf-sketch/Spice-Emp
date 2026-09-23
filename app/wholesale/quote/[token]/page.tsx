import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { respondToWholesaleQuote } from "../actions";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; responded?: string }>;
};

export const metadata = { title: "Wholesale quote" };

export default async function WholesaleQuotePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { error, responded } = await searchParams;
  const admin = createAdminClient();

  const { data: quote } = await admin
    .from("wholesale_quotes")
    .select("id,quote_number,status,subtotal_cents,discount_cents,shipping_cents,tax_cents,total_cents,valid_until,customer_notes,sent_at,responded_at,converted_order_id,business_enquiries(company_name,contact_name,email,phone,city,province),wholesale_quote_items(id,product_name_snapshot,quantity_kg,unit_price_cents_per_kg,total_price_cents,sort_order)")
    .eq("access_token", token)
    .maybeSingle();

  if (!quote) notFound();

  const enquiry = Array.isArray(quote.business_enquiries)
    ? quote.business_enquiries[0]
    : quote.business_enquiries;

  const expired = quote.valid_until
    ? new Date(quote.valid_until + "T23:59:59") < new Date()
    : false;

  const canRespond = quote.status === "sent" && !expired;

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <div className="mx-auto max-w-4xl">
          <span className="eyebrow">Wholesale quote</span>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="display-font text-5xl font-semibold tracking-[-.05em]">{quote.quote_number}</h1>
              <p className="mt-3 text-stone-500">{enquiry?.company_name} · {enquiry?.contact_name}</p>
            </div>
            <span className="admin-featured-badge">{expired ? "expired" : quote.status}</span>
          </div>

          {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}
          {responded ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Your response has been recorded.</p> : null}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <section className="glass-soft rounded-[2rem] p-6">
              <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Quoted items</span>
              <div className="mt-4 grid gap-3">
                {[...(quote.wholesale_quote_items ?? [])].sort((a,b) => a.sort_order - b.sort_order).map((item) => (
                  <div className="wholesale-public-line" key={item.id}>
                    <div>
                      <strong>{item.product_name_snapshot}</strong>
                      <span>{Number(item.quantity_kg)} kg × R{(item.unit_price_cents_per_kg / 100).toFixed(2)} / kg</span>
                    </div>
                    <strong>R{(item.total_price_cents / 100).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              {quote.customer_notes ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
                  {quote.customer_notes}
                </div>
              ) : null}
            </section>

            <aside className="glass rounded-[2rem] p-6 h-fit">
              <span className="text-xs font-bold uppercase tracking-[.14em] text-stone-500">Quote summary</span>
              <div className="mt-4 grid gap-3 text-sm">
                <Row label="Subtotal" value={"R" + (quote.subtotal_cents / 100).toFixed(2)} />
                {quote.discount_cents ? <Row label="Discount" value={"-R" + (quote.discount_cents / 100).toFixed(2)} /> : null}
                {quote.shipping_cents ? <Row label="Shipping" value={"R" + (quote.shipping_cents / 100).toFixed(2)} /> : null}
                {quote.tax_cents ? <Row label="Tax" value={"R" + (quote.tax_cents / 100).toFixed(2)} /> : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span>Total</span>
                <strong className="text-xl">R{(quote.total_cents / 100).toFixed(2)}</strong>
              </div>

              {quote.valid_until ? <p className="mt-4 text-xs text-stone-500">Valid until {quote.valid_until}</p> : null}

              {canRespond ? (
                <div className="mt-6 grid gap-3">
                  <form action={respondToWholesaleQuote}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="response" value="accepted" />
                    <button type="submit" className="btn-primary w-full">Accept quote</button>
                  </form>
                  <form action={respondToWholesaleQuote}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="response" value="rejected" />
                    <button type="submit" className="btn-secondary w-full">Reject quote</button>
                  </form>
                </div>
              ) : null}

              {quote.status === "accepted" ? (
                <p className="mt-5 text-sm leading-6 text-stone-400">Accepted. The Glided Pantry can now convert this quote into a wholesale order.</p>
              ) : null}

              {quote.status === "converted" && quote.converted_order_id ? (
                <Link href="/account/orders" className="btn-primary mt-5 w-full">View orders</Link>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 text-stone-400"><span>{label}</span><strong className="text-stone-100">{value}</strong></div>;
}
