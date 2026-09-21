import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = { title: "Order details" };

export default async function AccountOrderPage({ params }: Props) {
  const { id } = await params;
  const userId = await requireUser();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,order_number,status,payment_status,fulfilment_status,total_cents,subtotal_cents,
      shipping_cents,discount_cents,tax_cents,shipping_method_snapshot,shipping_address,created_at,
      order_items(id,product_name_snapshot,variant_name_snapshot,sku_snapshot,quantity,unit_price_cents,total_price_cents)
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!order) notFound();

  return (
    <main className="pt-32">
      <section className="section-wrap py-20">
        <span className="eyebrow">Order</span>
        <h1 className="display-font mt-5 text-5xl font-semibold tracking-[-.05em]">{order.order_number}</h1>
        <p className="mt-4 text-stone-500">
          {order.status} · {order.payment_status} · {order.fulfilment_status}
          {order.shipping_method_snapshot ? ` · ${order.shipping_method_snapshot}` : ""}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3">
            {order.order_items?.map((item) => (
              <div key={item.id} className="glass-soft flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
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

          <aside className="glass h-fit rounded-[2rem] p-6">
            <p className="display-font text-xl font-semibold">Totals</p>
            <MoneyRow label="Subtotal" cents={order.subtotal_cents} />
            <MoneyRow label="Shipping" cents={order.shipping_cents} />
            <MoneyRow label="Discount" cents={-order.discount_cents} />
            <MoneyRow label="Tax" cents={order.tax_cents} />
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-semibold">
              <span>Total</span>
              <span>R{(order.total_cents / 100).toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </section>
    </main>
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
