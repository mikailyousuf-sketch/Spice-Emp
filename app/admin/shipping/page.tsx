import { createClient } from "@/lib/supabase/server";
import {
  createShippingMethod,
  deleteShippingMethod,
  updateShippingMethod,
} from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Shipping" };

export default async function ShippingAdminPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
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
