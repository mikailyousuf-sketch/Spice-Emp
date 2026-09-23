import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Wholesale pipeline" };

export default async function AdminBusinessPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const [{ data: enquiries }, { data: quotes }] = await Promise.all([
    supabase
      .from("business_enquiries")
      .select("id,company_name,business_type,contact_name,email,phone,city,province,status,monthly_volume_kg,ordering_frequency,user_id,created_at,updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("wholesale_quotes")
      .select("id,enquiry_id,quote_number,status,total_cents,created_at")
      .order("created_at", { ascending: false }),
  ]);

  const latestQuoteByEnquiry = new Map<string, any>();
  for (const quote of quotes ?? []) {
    if (!latestQuoteByEnquiry.has(quote.enquiry_id)) {
      latestQuoteByEnquiry.set(quote.enquiry_id, quote);
    }
  }

  const counts = new Map<string, number>();
  for (const enquiry of enquiries ?? []) {
    counts.set(enquiry.status, (counts.get(enquiry.status) ?? 0) + 1);
  }

  return (
    <section>
      <span className="eyebrow">Wholesale</span>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-font text-5xl font-semibold tracking-[-.05em]">B2B pipeline</h1>
          <p className="mt-4 max-w-2xl text-stone-400">
            Review enquiries, build quotes, track customer decisions and convert accepted deals into orders.
          </p>
        </div>
      </div>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Wholesale pipeline updated.</p> : null}

      <div className="admin-metric-grid mt-8">
        <Metric label="New" value={String(counts.get("new") ?? 0)} detail="Awaiting first review" />
        <Metric label="Reviewing" value={String(counts.get("reviewing") ?? 0)} detail="Pricing / quote stage" />
        <Metric label="Approved" value={String(counts.get("approved") ?? 0)} detail="Accepted / approved business" />
        <Metric label="Declined" value={String(counts.get("declined") ?? 0)} detail="Not proceeding" />
      </div>

      <div className="mt-8 grid gap-4">
        {enquiries?.length ? enquiries.map((enquiry) => {
          const quote = latestQuoteByEnquiry.get(enquiry.id);

          return (
            <Link href={"/admin/business/" + enquiry.id} className="wholesale-pipeline-card" key={enquiry.id}>
              <div className="wholesale-pipeline-main">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2>{enquiry.company_name}</h2>
                    <span className="admin-featured-badge">{enquiry.status}</span>
                    {quote ? <span className="admin-featured-badge">{quote.status}</span> : null}
                  </div>
                  <p>{enquiry.business_type} · {enquiry.city}, {enquiry.province}</p>
                  <span>{enquiry.contact_name} · {enquiry.email}</span>
                </div>

                <div className="wholesale-pipeline-meta">
                  <strong>{quote ? "R" + (quote.total_cents / 100).toFixed(2) : "No quote yet"}</strong>
                  <span>{quote ? quote.quote_number : "Open enquiry"}</span>
                </div>
              </div>

              <div className="wholesale-pipeline-footer">
                <span>{enquiry.monthly_volume_kg ? enquiry.monthly_volume_kg + " kg/month" : "Volume not set"}</span>
                <span>{enquiry.ordering_frequency || "Frequency not set"}</span>
                <span>{enquiry.user_id ? "Linked account" : "Guest enquiry"}</span>
                <strong>Open workspace →</strong>
              </div>
            </Link>
          );
        }) : (
          <div className="glass-soft rounded-[2rem] p-8 text-stone-400">No wholesale enquiries yet.</div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
