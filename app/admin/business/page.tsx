import { createClient } from "@/lib/supabase/server";
import { approveBusinessEnquiry, updateBusinessEnquiry } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Business enquiries" };

type RequestedItem = {
  product_id: string;
  product_name: string;
  quantity_kg: number;
};

export default async function AdminBusinessPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const { data: enquiries } = await supabase
    .from("business_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <section>
      <span className="eyebrow">Wholesale</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Business enquiries</h1>
      <p className="mt-4 max-w-2xl text-stone-400">
        Review wholesale quote baskets, repeat-order requirements and business account applications.
      </p>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Business enquiry updated.</p> : null}

      <div className="mt-8 grid gap-5">
        {enquiries?.length ? enquiries.map((enquiry) => {
          const items = Array.isArray(enquiry.requested_items)
            ? enquiry.requested_items as RequestedItem[]
            : [];

          return (
            <article className="glass-soft rounded-[2rem] p-6 sm:p-7" key={enquiry.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="display-font text-2xl font-semibold">{enquiry.company_name}</h2>
                    <span className="admin-featured-badge">{enquiry.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-400">
                    {enquiry.business_type} · {enquiry.city}, {enquiry.province}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {enquiry.contact_name} · {enquiry.email} · {enquiry.phone}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-500">
                  <p>{new Date(enquiry.created_at).toLocaleDateString("en-ZA")}</p>
                  <p className="mt-1">{enquiry.user_id ? "Linked account" : "Guest enquiry"}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="text-xs uppercase tracking-[.14em] text-stone-500">Monthly volume</span>
                  <strong className="mt-2 block text-lg">{enquiry.monthly_volume_kg ? enquiry.monthly_volume_kg + " kg" : "Not specified"}</strong>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="text-xs uppercase tracking-[.14em] text-stone-500">Frequency</span>
                  <strong className="mt-2 block text-lg">{enquiry.ordering_frequency || "Not specified"}</strong>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="text-xs uppercase tracking-[.14em] text-stone-500">VAT / registration</span>
                  <strong className="mt-2 block text-sm">{enquiry.vat_number || enquiry.registration_number || "Not supplied"}</strong>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-xs uppercase tracking-[.14em] text-stone-500">Requested quote</span>
                <div className="mt-2 grid gap-2">
                  {items.map((item, index) => (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3" key={item.product_id + index}>
                      <span>{item.product_name}</span>
                      <strong>{item.quantity_kg} kg</strong>
                    </div>
                  ))}
                </div>
              </div>

              {enquiry.notes ? (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
                  {enquiry.notes}
                </div>
              ) : null}

              <form action={updateBusinessEnquiry} className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <input type="hidden" name="id" value={enquiry.id} />
                <select name="status" defaultValue={enquiry.status} className="field">
                  <option value="new">New</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="closed">Closed</option>
                </select>
                <input
                  name="adminNotes"
                  defaultValue={enquiry.admin_notes ?? ""}
                  placeholder="Internal note"
                  className="field"
                />
                <button type="submit" className="btn-secondary">Save</button>
              </form>

              {enquiry.status !== "approved" ? (
                <form action={approveBusinessEnquiry} className="mt-3">
                  <input type="hidden" name="id" value={enquiry.id} />
                  <button type="submit" className="btn-primary">
                    Approve business account
                  </button>
                </form>
              ) : null}
            </article>
          );
        }) : (
          <div className="glass-soft rounded-[2rem] p-8 text-stone-400">No wholesale enquiries yet.</div>
        )}
      </div>
    </section>
  );
}
