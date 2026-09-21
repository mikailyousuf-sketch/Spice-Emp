import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,order_number,email,phone,status,payment_status,fulfilment_status,
      subtotal_cents,shipping_cents,discount_cents,tax_cents,total_cents,
      shipping_address,billing_address,notes,created_at,
      order_items(id,product_name_snapshot,variant_name_snapshot,sku_snapshot,quantity,unit_price_cents,total_price_cents)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const address = order.shipping_address as Record<string, string | null>;

  return (
    <section>
      <span className="eyebrow">Commerce</span>
      <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">{order.order_number}</h1>
      <p className="mt-4 text-stone-500">
        {order.email} · {order.phone} · {new Date(order.created_at).toLocaleString("en-ZA")}
      </p>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
          Order updated.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="glass-soft rounded-[2rem] p-6">
            <p className="display-font text-2xl font-semibold">Items</p>
            <div className="mt-5 grid gap-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                  <div>
                    <p className="font-semibold">{item.product_name_snapshot}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {item.variant_name_snapshot} · {item.sku_snapshot} · qty {Number(item.quantity)}
                    </p>
                  </div>
                  <p>R{(item.total_price_cents / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-soft rounded-[2rem] p-6">
            <p className="display-font text-2xl font-semibold">Delivery</p>
            <div className="mt-4 text-sm leading-7 text-stone-400">
              <p>{address.first_name} {address.last_name}</p>
              {address.company ? <p>{address.company}</p> : null}
              <p>{address.line1}</p>
              {address.line2 ? <p>{address.line2}</p> : null}
              {address.suburb ? <p>{address.suburb}</p> : null}
              <p>{address.city}, {address.province} {address.postal_code}</p>
            </div>
            {order.notes ? (
              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-[.12em] text-stone-600">Order notes</p>
                <p className="mt-2 text-sm leading-6 text-stone-400">{order.notes}</p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="grid h-fit gap-5">
          <form action={updateOrderStatus} className="glass rounded-[2rem] p-6">
            <input type="hidden" name="id" value={order.id} />
            <p className="display-font text-2xl font-semibold">Status</p>

            <label className="mt-5 grid gap-2 text-sm">
              <span className="text-stone-400">Order status</span>
              <select name="status" defaultValue={order.status} className="field">
                {["pending","confirmed","processing","shipped","completed","cancelled","refunded"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="text-stone-400">Payment</span>
              <select name="paymentStatus" defaultValue={order.payment_status} className="field">
                {["unpaid","pending","paid","failed","refunded"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="text-stone-400">Fulfilment</span>
              <select name="fulfilmentStatus" defaultValue={order.fulfilment_status} className="field">
                {["unfulfilled","processing","fulfilled","cancelled"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <button className="btn-primary mt-6 w-full" type="submit">Save status</button>
          </form>

          <section className="glass-soft rounded-[2rem] p-6">
            <p className="display-font text-xl font-semibold">Totals</p>
            <MoneyRow label="Subtotal" cents={order.subtotal_cents} />
            <MoneyRow label="Shipping" cents={order.shipping_cents} />
            <MoneyRow label="Discount" cents={-order.discount_cents} />
            <MoneyRow label="Tax" cents={order.tax_cents} />
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-semibold">
              <span>Total</span>
              <span>R{(order.total_cents / 100).toFixed(2)}</span>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function MoneyRow({ label, cents }: { label: string; cents: number }) {
  const prefix = cents < 0 ? "-" : "";
  return (
    <div className="mt-3 flex justify-between text-sm text-stone-400">
      <span>{label}</span>
      <span>{prefix}R{(Math.abs(cents) / 100).toFixed(2)}</span>
    </div>
  );
}
