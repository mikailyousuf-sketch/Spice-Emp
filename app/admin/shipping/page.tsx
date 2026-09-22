import { createClient } from "@/lib/supabase/server";
import {
  createShippingMethod,
  deleteShippingMethod,
  testCourierGuyConnection,
  testPudoConnection,
  updateShippingMethod,
} from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string; test?: string }>;
};

export const metadata = { title: "Shipping" };

export default async function ShippingAdminPage({ searchParams }: Props) {
  const { error, saved, test } = await searchParams;
  const supabase = await createClient();
  const { data: methods } = await supabase
    .from("shipping_methods")
    .select("*")
    .order("sort_order")
    .order("name");

  return (
    <section>
      <span className="eyebrow">Commerce configuration</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">Shipping</h1>
      <p className="mt-4 max-w-2xl text-stone-400">
        Configure the real delivery and collection options customers can choose at checkout.
      </p>

      {error ? <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">{error}</p> : null}
      {saved ? <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">Shipping updated.</p> : null}
      {test ? <p className="mt-6 rounded-2xl border border-orange-300/20 bg-orange-300/10 p-4 text-orange-100">{test}</p> : null}

      <section className="glass-soft mt-8 rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="display-font text-2xl font-semibold">Live courier connections</p>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              These tests verify that the configured credentials can reach each courier API. No shipment is created.
            </p>
          </div>
          <span className="admin-featured-badge">Diagnostics</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="display-font text-xl font-semibold">The Courier Guy</p>
                <p className="mt-1 text-xs text-stone-500">
                  {process.env.COURIER_GUY_API_KEY ? "API key configured" : "API key missing"}
                  {" · "}
                  {process.env.COURIER_GUY_PROVIDER_ID ? "provider/account ID configured" : "provider/account ID not set"}
                </p>
              </div>
              <span className={process.env.COURIER_GUY_API_KEY ? "text-emerald-300" : "text-amber-300"}>
                {process.env.COURIER_GUY_API_KEY ? "●" : "○"}
              </span>
            </div>
            <form action={testCourierGuyConnection} className="mt-4">
              <button type="submit" className="btn-secondary">Test connection</button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="display-font text-xl font-semibold">PUDO</p>
                <p className="mt-1 text-xs text-stone-500">
                  {process.env.PUDO_API_KEY ? "API key configured" : "API key missing"}
                  {" · "}
                  {process.env.PUDO_API_BASE_URL?.includes("sandbox") ? "sandbox" : "configured endpoint"}
                </p>
              </div>
              <span className={process.env.PUDO_API_KEY ? "text-emerald-300" : "text-amber-300"}>
                {process.env.PUDO_API_KEY ? "●" : "○"}
              </span>
            </div>
            <form action={testPudoConnection} className="mt-4">
              <button type="submit" className="btn-secondary">Test connection</button>
            </form>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-stone-400">
          Checkout now requests live Courier Guy/PUDO rates from the active cart and verifies the selected rate again server-side before payment.
          Product variants must have shipping weight and dimensions for live quotes to work.
        </div>
      </section>

      <div className="mt-8 grid gap-5">
        {methods?.map((method) => (
          <form key={method.id} action={updateShippingMethod} className="glass-soft grid gap-4 rounded-[2rem] p-6 lg:grid-cols-2">
            <input type="hidden" name="id" value={method.id} />
            <Field label="Name"><input name="name" defaultValue={method.name} required className="field" /></Field>
            <Field label="Code"><input name="code" defaultValue={method.code} required className="field" /></Field>
            <Field label="Description"><input name="description" defaultValue={method.description ?? ""} className="field" /></Field>
            <Field label="Sort order"><input name="sortOrder" type="number" min="0" defaultValue={method.sort_order} className="field" /></Field>
            <Field label="Fee (R)"><input name="feeRand" type="number" min="0" step="0.01" defaultValue={(method.fee_cents / 100).toFixed(2)} className="field" /></Field>
            <Field label="Free above (R, optional)"><input name="freeAboveRand" type="number" min="0" step="0.01" defaultValue={method.free_above_cents == null ? "" : (method.free_above_cents / 100).toFixed(2)} className="field" /></Field>
            <label className="flex items-center gap-3 text-sm text-stone-300"><input name="isCollection" type="checkbox" defaultChecked={method.is_collection} />Collection option</label>
            <label className="flex items-center gap-3 text-sm text-stone-300"><input name="isActive" type="checkbox" defaultChecked={method.is_active} />Active at checkout</label>
            <div className="flex gap-3 lg:col-span-2">
              <button className="btn-primary" type="submit">Save</button>
              <button formAction={deleteShippingMethod} className="rounded-full border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10" type="submit">Delete</button>
            </div>
          </form>
        ))}

        {!methods?.length ? <div className="glass-soft rounded-[2rem] p-8 text-stone-500">No shipping methods configured yet.</div> : null}
      </div>

      <form action={createShippingMethod} className="glass mt-8 grid gap-4 rounded-[2rem] p-6 lg:grid-cols-2">
        <p className="display-font text-2xl font-semibold lg:col-span-2">Add shipping method</p>
        <Field label="Name"><input name="name" required className="field" /></Field>
        <Field label="Code"><input name="code" required placeholder="standard-courier" className="field" /></Field>
        <Field label="Description"><input name="description" className="field" /></Field>
        <Field label="Sort order"><input name="sortOrder" type="number" min="0" defaultValue="0" className="field" /></Field>
        <Field label="Fee (R)"><input name="feeRand" type="number" min="0" step="0.01" required className="field" /></Field>
        <Field label="Free above (R, optional)"><input name="freeAboveRand" type="number" min="0" step="0.01" className="field" /></Field>
        <label className="flex items-center gap-3 text-sm text-stone-300"><input name="isCollection" type="checkbox" />Collection option</label>
        <label className="flex items-center gap-3 text-sm text-stone-300"><input name="isActive" type="checkbox" defaultChecked />Active at checkout</label>
        <button className="btn-primary w-fit lg:col-span-2" type="submit">Add shipping method</button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm"><span className="text-stone-300">{label}</span>{children}</label>;
}
